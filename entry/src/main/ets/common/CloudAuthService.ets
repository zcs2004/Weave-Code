import { common } from '@kit.AbilityKit';
import { buffer } from '@kit.ArkTS';
import { cloudCommon } from '@kit.CloudFoundationKit';
import auth from '@hw-agconnect/auth';

const AGCONNECT_CONFIG_FILE: string = 'agconnect-services.json';

/**
 * Initializes AGConnect authentication exactly once and exposes one readiness
 * promise to every Cloud Foundation consumer. Cloud Storage requires an
 * AuthProvider even when its object read rule is public.
 */
export class CloudAuthService {
  private static initialized: boolean = false;
  private static readiness?: Promise<void>;

  /** Initializes the AG Connect SDK used only by public Cloud Storage files. */
  private static initializeSdk(context: common.UIAbilityContext): void {
    if (CloudAuthService.initialized) {
      return;
    }
    let configBytes: Uint8Array;
    try {
      configBytes = context.resourceManager.getRawFileContentSync(AGCONNECT_CONFIG_FILE);
    } catch (error) {
      throw new Error(
        '缺少华为认证配置 entry/src/main/resources/rawfile/agconnect-services.json。' +
        '请从 AppGallery Connect 的项目设置下载该文件，并确认它属于 com.dhuzcs.weavecode。'
      );
    }

    const configJson: string = buffer.from(configBytes.buffer).toString();
    auth.init(context, configJson);
    CloudAuthService.initialized = true;
    console.info('[WeaveCodeCloudAuth] AGConnect SDK initialized');
  }

  static ensureReady(context: common.UIAbilityContext): Promise<void> {
    if (CloudAuthService.readiness === undefined) {
      CloudAuthService.readiness = CloudAuthService.initialize(context).catch((error: Object): Promise<void> => {
        // A transient network or credential error must not poison every later
        // login/download attempt for the rest of this application process.
        CloudAuthService.readiness = undefined;
        return Promise.reject(error);
      });
    }
    return CloudAuthService.readiness;
  }

  private static async initialize(context: common.UIAbilityContext): Promise<void> {
    CloudAuthService.initializeSdk(context);

    const currentUser = await auth.getCurrentUser();
    if (currentUser === null) {
      await auth.signInAnonymously();
    }

    let authProvider: cloudCommon.AuthProvider = auth.getAuthProvider();
    try {
      await CloudAuthService.verifyAccessToken(authProvider);
    } catch (staleSessionError) {
      // Package upgrades keep the authentication cache. A token issued before
      // the package/project migration can leave getCurrentUser() non-null while
      // Cloud Storage rejects every request with 403. Recreate that anonymous
      // session once and validate the replacement token before continuing.
      console.warn(`[WeaveCodeCloudAuth] Cached credential is unusable; recreating the anonymous session: ` +
        `${CloudAuthService.describeError(staleSessionError)}`);
      await auth.signOut();
      await auth.signInAnonymously();
      authProvider = auth.getAuthProvider();
      await CloudAuthService.verifyAccessToken(authProvider);
    }

    CloudAuthService.bindCloudFoundation(authProvider);
    console.info('[WeaveCodeCloudAuth] AGConnect anonymous authentication is ready');
  }

  private static bindCloudFoundation(authProvider: cloudCommon.AuthProvider): void {
    cloudCommon.init({
      region: cloudCommon.CloudRegion.CHINA,
      authProvider: authProvider
    });
  }

  private static async verifyAccessToken(authProvider: cloudCommon.AuthProvider): Promise<void> {
    const accessToken: string = await authProvider.getAccessToken(true);
    if (accessToken.trim().length === 0) {
      throw new Error('华为认证服务返回了空访问令牌');
    }
    console.info(`[WeaveCodeCloudAuth] A fresh access token is ready (${accessToken.length} characters)`);
  }

  private static describeError(error: Object): string {
    try {
      const serialized: string = JSON.stringify(error);
      if (serialized.length > 2) {
        return serialized;
      }
    } catch (serializationError) {
      console.warn(`[WeaveCodeCloudAuth] Unable to serialize authentication error: ${String(serializationError)}`);
    }
    return String(error);
  }
}
