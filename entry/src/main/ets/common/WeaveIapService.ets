import { common } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { iap } from '@kit.IAPKit';
import BuildProfile from 'entry/BuildProfile';
import { WeaveAccountService, WeaveAccountSnapshot, WeaveIapServerResponse } from './WeaveAccountService';

const LIFETIME_PRODUCT_ID: string = 'yjvip';
const MONTHLY_PRODUCT_ID: string = 'lxbyvip';
const IAP_SANDBOX_ENVIRONMENT: string = 'SANDBOX';
const IAP_NORMAL_ENVIRONMENT: string = 'NORMAL';
const IAP_BUILD_ENVIRONMENT: string = BuildProfile.IAP_ENVIRONMENT;

interface IapActionPayload {
  productId?: string;
}

interface WebProduct {
  id: string;
  type: string;
  name: string;
  description: string;
  localPrice: string;
  currency: string;
  period: string;
  available: boolean;
  buttonLabel: string;
  unavailableReason: string;
  unavailableCode: string;
}

interface IapActionResult {
  success: boolean;
  code: string;
  message: string;
  products?: Array<WebProduct>;
  snapshot?: WeaveAccountSnapshot;
  processedCount?: number;
}

export class WeaveIapService {
  static async perform(context: common.UIAbilityContext, action: string, payloadJson: string): Promise<string> {
    try {
      const payload: IapActionPayload = payloadJson.length > 0
        ? JSON.parse(payloadJson) as IapActionPayload : {};
      if (action === 'products') {
        return JSON.stringify(await WeaveIapService.queryProducts(context));
      }
      if (action === 'purchase') {
        return JSON.stringify(await WeaveIapService.purchase(context, payload.productId ?? ''));
      }
      if (action === 'manageSubscriptions') {
        return JSON.stringify(await WeaveIapService.manageSubscriptions(context));
      }
      return JSON.stringify({ success: false, code: 'invalid_action', message: '不支持的购买操作' });
    } catch (error) {
      return JSON.stringify(WeaveIapService.errorResult(error));
    }
  }

  private static async queryProducts(context: common.UIAbilityContext): Promise<IapActionResult> {
    const snapshot: WeaveAccountSnapshot = await WeaveAccountService.getSnapshot(context);
    if (!snapshot.signedIn) {
      return { success: false, code: 'sign_in_required', message: '查看 VIP 商品前请先登录织码账号' };
    }
    const environmentError: IapActionResult | undefined = await WeaveIapService.ensureBuildEnvironment(context);
    if (environmentError !== undefined) {
      return environmentError;
    }
    const lifetime: Array<iap.Product> = await iap.queryProducts(context, {
      productType: iap.ProductType.NONCONSUMABLE,
      productIds: [LIFETIME_PRODUCT_ID]
    });
    const monthly: Array<iap.Product> = await iap.queryProducts(context, {
      productType: iap.ProductType.AUTORENEWABLE,
      productIds: [MONTHLY_PRODUCT_ID]
    });
    const products: Array<WebProduct> = [];
    lifetime.forEach((product: iap.Product): void => {
      products.push(WeaveIapService.webProduct(product, 'lifetime', snapshot));
    });
    monthly.forEach((product: iap.Product): void => {
      products.push(WeaveIapService.webProduct(product, 'monthly', snapshot));
    });
    return {
      success: true,
      code: 'ok',
      message: products.length > 0 ? '' : '暂未查询到可购买的 VIP 商品',
      products: products
    };
  }

  private static async purchase(context: common.UIAbilityContext, productId: string): Promise<IapActionResult> {
    const productType: iap.ProductType | undefined = WeaveIapService.productType(productId);
    if (productType === undefined) {
      return { success: false, code: 'invalid_product', message: '该 VIP 商品不可用' };
    }
    const snapshot: WeaveAccountSnapshot = await WeaveAccountService.getSnapshot(context);
    if (!snapshot.signedIn) {
      return { success: false, code: 'sign_in_required', message: '购买 VIP 前请先登录织码账号' };
    }
    const eligibilityError: IapActionResult | undefined = WeaveIapService.purchaseEligibility(snapshot, productId);
    if (eligibilityError !== undefined) {
      return eligibilityError;
    }
    const environmentError: IapActionResult | undefined = await WeaveIapService.ensureBuildEnvironment(context);
    if (environmentError !== undefined) {
      return environmentError;
    }
    const prepared: WeaveIapServerResponse = await WeaveAccountService.requestIap(
      context, 'iap_prepare.php', JSON.stringify({
        productId: productId,
        expectedEnvironment: IAP_BUILD_ENVIRONMENT
      })
    );
    if (!prepared.success || prepared.developerPayload.length === 0) {
      return { success: false, code: prepared.code, message: prepared.message };
    }
    const purchaseParameter: iap.PurchaseParameter = {
      productId: productId,
      productType: productType,
      developerPayload: prepared.developerPayload
    };
    if (prepared.applicationUserName.length > 0) {
      purchaseParameter.applicationUserName = prepared.applicationUserName;
    }
    const purchaseResult: iap.CreatePurchaseResult = await iap.createPurchase(context, purchaseParameter);
    const verified: WeaveIapServerResponse = await WeaveAccountService.requestIap(
      context, 'iap_complete.php', JSON.stringify({
        productId: productId,
        purchaseData: purchaseResult.purchaseData,
        expectedEnvironment: IAP_BUILD_ENVIRONMENT
      })
    );
    if (!verified.success) {
      return {
        success: false,
        code: verified.code,
        message: WeaveIapService.serverErrorMessage(verified)
      };
    }
    return {
      success: true,
      code: 'ok',
      message: 'VIP 已开通',
      snapshot: await WeaveAccountService.getSnapshot(context)
    };
  }

  private static async manageSubscriptions(context: common.UIAbilityContext): Promise<IapActionResult> {
    const snapshot: WeaveAccountSnapshot = await WeaveAccountService.getSnapshot(context);
    if (!snapshot.signedIn) {
      return { success: false, code: 'sign_in_required', message: '请先登录织码账号' };
    }
    if (!snapshot.isVip || snapshot.vipType !== 'subscription') {
      return { success: false, code: 'no_active_subscription', message: '当前账号没有生效中的连续包月 VIP' };
    }
    const uiWindowParameter: iap.UIWindowParameter = {
      windowScreenMode: iap.WindowScreenMode.DIALOG_BOX
    };
    await iap.showManagedSubscriptions(context, uiWindowParameter);
    return {
      success: true,
      code: 'ok',
      message: '已打开华为订阅管理，可在其中关闭自动续费；当前周期权益不会立即失效'
    };
  }

  private static productType(productId: string): iap.ProductType | undefined {
    if (productId === LIFETIME_PRODUCT_ID) return iap.ProductType.NONCONSUMABLE;
    if (productId === MONTHLY_PRODUCT_ID) return iap.ProductType.AUTORENEWABLE;
    return undefined;
  }

  private static async ensureBuildEnvironment(context: common.UIAbilityContext): Promise<IapActionResult | undefined> {
    await iap.queryEnvironmentStatus(context);
    if (IAP_BUILD_ENVIRONMENT === IAP_SANDBOX_ENVIRONMENT) {
      const sandboxActivated: boolean = await iap.isSandboxActivated(context);
      if (!sandboxActivated) {
        return {
          success: false,
          code: 'sandbox_not_activated',
          message: 'Debug 构建只允许沙盒支付，请使用调试签名并登录 AGC 沙盒测试账号'
        };
      }
      return undefined;
    }
    if (IAP_BUILD_ENVIRONMENT !== IAP_NORMAL_ENVIRONMENT) {
      return { success: false, code: 'invalid_build_environment', message: 'IAP 构建环境配置无效' };
    }
    try {
      const sandboxActivated: boolean = await iap.isSandboxActivated(context);
      if (sandboxActivated) {
        return {
          success: false,
          code: 'release_uses_sandbox',
          message: 'Release 构建检测到沙盒签名或沙盒账号，已阻止支付；生产测试必须使用发布证书和发布 Profile'
        };
      }
    } catch (error) {
      const businessError: BusinessError = error as BusinessError;
      const code: number = Number(businessError.code ?? 0);
      // Huawei documents 1001860057 as "app provision type is not debug".
      // That is the expected result for a correctly release-signed production build.
      if (code === 1001860057) {
        return undefined;
      }
      if (code === 1001860058) {
        return {
          success: false,
          code: 'release_signing_required',
          message: 'Release 构建仍在使用调试 Profile，生产测试前请配置发布证书和发布 Profile'
        };
      }
      return WeaveIapService.errorResult(error as Object);
    }
    return undefined;
  }

  private static purchaseEligibility(snapshot: WeaveAccountSnapshot,
    productId: string): IapActionResult | undefined {
    if (!snapshot.isVip) {
      return undefined;
    }
    const hasLifetime: boolean = snapshot.vipType === 'lifetime' || snapshot.plan.toLowerCase() === 'lifetime' ||
      snapshot.plan.toLowerCase() === 'vip';
    if (hasLifetime) {
      return {
        success: false,
        code: 'lifetime_vip_active',
        message: '您已是终身VIP，无需再次购买'
      };
    }
    if (productId === MONTHLY_PRODUCT_ID &&
      (snapshot.vipType === 'subscription' || snapshot.plan.toLowerCase() === 'subscription' ||
        snapshot.plan.toLowerCase() === 'monthly')) {
      return {
        success: false,
        code: 'monthly_subscription_active',
        message: '您已开通连续包月VIP，请勿重复订阅'
      };
    }
    return undefined;
  }

  private static webProduct(product: iap.Product, period: string,
    snapshot: WeaveAccountSnapshot): WebProduct {
    const eligibility: IapActionResult | undefined = WeaveIapService.purchaseEligibility(snapshot, product.id);
    return {
      id: product.id,
      type: product.type === iap.ProductType.AUTORENEWABLE ? 'subscription' : 'nonconsumable',
      name: product.name,
      description: product.description,
      localPrice: product.localPrice ?? product.originalLocalPrice,
      currency: product.currency,
      period: period,
      available: eligibility === undefined,
      buttonLabel: eligibility === undefined ? '立即购买' :
        (eligibility.code === 'lifetime_vip_active' ? '您已是终身VIP' : '您已开通连续包月VIP'),
      unavailableReason: eligibility === undefined ? '' : eligibility.message,
      unavailableCode: eligibility === undefined ? '' : eligibility.code
    };
  }

  private static serverErrorMessage(response: WeaveIapServerResponse): string {
    if (response.code === 'iap_environment_mismatch' ||
      response.code === 'iap_developer_payload_environment_mismatch') {
      return IAP_BUILD_ENVIRONMENT === IAP_SANDBOX_ENVIRONMENT
        ? '订单不是沙盒订单，Debug 构建已拒绝开通 VIP'
        : '订单不是生产订单，Release 构建已拒绝开通 VIP';
    }
    if (response.code.length === 0 || response.message.includes(response.code)) {
      return response.message;
    }
    return `${response.message}（${response.code}）`;
  }

  private static errorResult(error: Object): IapActionResult {
    const businessError: BusinessError = error as BusinessError;
    const code: number = Number(businessError.code ?? 0);
    if (code === 1001860000) return { success: false, code: 'cancelled', message: '已取消购买' };
    if (code === 1001860002) return {
      success: false,
      code: 'app_not_authorized',
      message: '应用尚未获得华为支付授权，请检查 IAP 服务、Client ID、公钥指纹和手动签名 Profile'
    };
    if (code === 1001860050) return { success: false, code: 'huawei_sign_in_required', message: '请先登录华为账号' };
    if (code === 1001860051) return { success: false, code: 'already_owned', message: '您已拥有该商品，无需重复购买' };
    if (code === 1001860054) return { success: false, code: 'region_not_supported', message: '当前华为账号所在地区暂不支持应用内支付' };
    if (code === 1001860057) return {
      success: false,
      code: 'debug_signing_required',
      message: 'Debug 构建未使用调试证书或调试 Profile，无法进入华为沙盒'
    };
    if (code === 1001860058) return {
      success: false,
      code: 'sandbox_account_required',
      message: '当前华为账号未加入 AppGallery Connect 沙盒测试账号'
    };
    if (code === 1001860005) return { success: false, code: 'network_error', message: '无法连接华为应用内支付服务' };
    return { success: false, code: `iap_${code}`, message: `应用内支付失败：${String(businessError.message ?? error)}` };
  }
}
