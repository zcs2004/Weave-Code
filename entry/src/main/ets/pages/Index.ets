import { common } from '@kit.AbilityKit';
import { fileIo, fileShare, picker } from '@kit.CoreFileKit';
import { preferences } from '@kit.ArkData';
import { webview } from '@kit.ArkWeb';
import { http, socket } from '@kit.NetworkKit';
import { util } from '@kit.ArkTS';
import { cloudStorage } from '@kit.CloudFoundationKit';
import { BusinessError, print, request } from '@kit.BasicServicesKit';
import { privacyManager } from '@kit.AppGalleryKit';
import { CloudAuthService } from '../common/CloudAuthService';
import { WeaveAccountService } from '../common/WeaveAccountService';
import { WeaveIapService } from '../common/WeaveIapService';
import { UnsavedStateStore } from '../common/UnsavedStateStore';

// ArkWeb needs a secure, non-opaque origin for workers, same-origin preview frames,
// IndexedDB and ES modules. Every request on this private host is intercepted below
// and resolved from the packaged Weave distribution; no DNS request is made.
const WEAVE_ORIGIN: string = 'https://dhuzcs.local/';
const WEAVE_ENTRY: string = `${WEAVE_ORIGIN}index.html`;
const EXTERNAL_URL_SCHEME: string = 'xingzhi-external://open?url=';
const EXTENSION_PROXY_PATH: string = '__xingzhi_extension_proxy/';
const EXTENSION_STORAGE_BUCKET: string = 'weavecodedownload-mlz4v';
const BLOCKED_UPSTREAM_HOSTS: Array<string> = [
  'wecode.dev',
  'wecode.io',
  'wecode.site',
  'wecode.live'
];
const FILE_ACCESS_PREFERENCES: string = 'xingzhi_file_access';
const PERSISTED_FOLDER_URIS: string = 'persisted_folder_uris';
const OPEN_FOLDER_URIS: string = 'open_folder_uris';
const CURRENT_PROJECT_URI: string = 'current_project_uri';
const PROJECT_SNAPSHOT: string = 'project_snapshot';
const DEFAULT_CLOUD_CODE_API_URL: string = 'https://api.deepseek.com';
const ALLOWED_CLOUD_CODE_API_URLS: Array<string> = [
  'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'https://api.deepseek.com',
  'https://api.moonshot.cn/v1',
  'https://api.minimax.cn/v1',
  'https://open.bigmodel.cn/api/paas/v4'
];
const DEEPSEEK_API_KEY: string = '';
const CLOUD_CODE_PREFERENCES: string = 'xingzhi_cloud_code';
const CLOUD_CODE_API_KEY_PREF: string = 'deepseek_api_key';
const CLOUD_CODE_MODELS_PREF: string = 'model_configs';
const FALLBACK_PRIVACY_POLICY_URL: string = 'https://privacypolicyweavecode.dhuzcs.com/';
const NATIVE_DOCUMENT_START_SCRIPT: string =
  '(function(){' +
  'window.__IS_NATIVE_SHELL__=true;' +
  'window.__XINGZHI_NATIVE_SHELL__=true;' +
  'window.addEventListener("wheel",function(event){' +
  'if(event.ctrlKey||event.metaKey){event.preventDefault();event.stopImmediatePropagation();}' +
  '},{capture:true,passive:false});' +
  '})();';

interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekChatRequest {
  model?: string;
  modelName?: string;
  provider?: string;
  apiUrl?: string;
  apiFormat?: string;
  thinking?: boolean;
  messages: Array<DeepSeekMessage>;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
  apiKey?: string;
}

interface CloudCodeMarkdownContext {
  name: string;
  uri: string;
  content: string;
}

interface DeepSeekAssistantMessage {
  role?: string;
  content?: string;
}

interface DeepSeekChatChoice {
  message?: DeepSeekAssistantMessage;
}

interface DeepSeekChatResponse {
  choices?: Array<DeepSeekChatChoice>;
}

interface DeepSeekStreamDelta {
  content?: string;
  reasoning_content?: string;
}

interface DeepSeekStreamChoice {
  delta?: DeepSeekStreamDelta;
}

interface DeepSeekStreamChunk {
  choices?: Array<DeepSeekStreamChoice>;
}

interface AnthropicContentBlock {
  type?: string;
  text?: string;
  thinking?: string;
}

interface AnthropicChatResponse {
  content?: Array<AnthropicContentBlock>;
}

interface AnthropicStreamError {
  message?: string;
}

interface AnthropicStreamChunk {
  type?: string;
  delta?: AnthropicContentBlock;
  error?: AnthropicStreamError;
}

interface CloudCodeStreamEvent {
  sessionId: string;
  type: string;
  content?: string;
  error?: string;
}

interface CloudCodeHeaders {
  'Content-Type': string;
  Authorization?: string;
  'x-api-key'?: string;
  'anthropic-version'?: string;
}

interface CloudCodeThinkingConfig {
  type: string;
  budget_tokens?: number;
}

interface PersistedFolderProject {
  name: string;
  fullPath: string;
}

interface CloudCodeModelProfile {
  key?: string;
  id?: string;
  name?: string;
  provider?: string;
  apiUrl?: string;
  apiFormat?: string;
  apiKey?: string;
}

class XingzhiNativeBridge {
  private readonly openPreviewHandler: (html: string) => void;
  private readonly saveProjectStateHandler: (stateJson: string) => void;
  private readonly projectStateHandler: () => string;
  private readonly persistedProjectsHandler: () => string;
  private readonly dirtyStateHandler: (dirty: boolean) => void;
  private readonly cloudCodeChatHandler: (payloadJson: string) => Promise<string>;
  private readonly cloudCodeChatStreamHandler: (payloadJson: string) => Promise<string>;
  private readonly getCloudCodeApiKeyHandler: () => string;
  private readonly setCloudCodeApiKeyHandler: (apiKey: string) => void;
  private readonly getCloudCodeModelsHandler: () => string;
  private readonly setCloudCodeModelsHandler: (modelsJson: string) => boolean;
  private readonly pickCloudCodeMarkdownHandler: () => Promise<string>;
  private readonly saveCloudCodeMarkdownHandler: (fileName: string, content: string) => Promise<string>;
  private readonly prepareFolderReopenHandler: (projectPath: string) => void;
  private readonly removePersistedProjectHandler: (projectPath: string) => Promise<string>;
  private readonly completeProjectCloseHandler: (stateJson: string, shouldExit: boolean) => Promise<string>;
  private readonly printWebDocumentHandler: (jobName: string) => Promise<string>;
  private readonly getWeaveAccountStateHandler: (requestId: string) => Promise<void>;
  private readonly weaveAccountRequestHandler: (action: string, payloadJson: string,
    requestId: string) => Promise<void>;
  private readonly weaveIapRequestHandler: (action: string, payloadJson: string,
    requestId: string) => Promise<void>;

  constructor(openPreviewHandler: (html: string) => void,
    saveProjectStateHandler: (stateJson: string) => void,
    projectStateHandler: () => string,
    persistedProjectsHandler: () => string,
    dirtyStateHandler: (dirty: boolean) => void,
    cloudCodeChatHandler: (payloadJson: string) => Promise<string>,
    cloudCodeChatStreamHandler: (payloadJson: string) => Promise<string>,
    getCloudCodeApiKeyHandler: () => string,
    setCloudCodeApiKeyHandler: (apiKey: string) => void,
    getCloudCodeModelsHandler: () => string,
    setCloudCodeModelsHandler: (modelsJson: string) => boolean,
    pickCloudCodeMarkdownHandler: () => Promise<string>,
    saveCloudCodeMarkdownHandler: (fileName: string, content: string) => Promise<string>,
    prepareFolderReopenHandler: (projectPath: string) => void,
    removePersistedProjectHandler: (projectPath: string) => Promise<string>,
    completeProjectCloseHandler: (stateJson: string, shouldExit: boolean) => Promise<string>,
    printWebDocumentHandler: (jobName: string) => Promise<string>,
    getWeaveAccountStateHandler: (requestId: string) => Promise<void>,
    weaveAccountRequestHandler: (action: string, payloadJson: string, requestId: string) => Promise<void>,
    weaveIapRequestHandler: (action: string, payloadJson: string, requestId: string) => Promise<void>) {
    this.openPreviewHandler = openPreviewHandler;
    this.saveProjectStateHandler = saveProjectStateHandler;
    this.projectStateHandler = projectStateHandler;
    this.persistedProjectsHandler = persistedProjectsHandler;
    this.dirtyStateHandler = dirtyStateHandler;
    this.cloudCodeChatHandler = cloudCodeChatHandler;
    this.cloudCodeChatStreamHandler = cloudCodeChatStreamHandler;
    this.getCloudCodeApiKeyHandler = getCloudCodeApiKeyHandler;
    this.setCloudCodeApiKeyHandler = setCloudCodeApiKeyHandler;
    this.getCloudCodeModelsHandler = getCloudCodeModelsHandler;
    this.setCloudCodeModelsHandler = setCloudCodeModelsHandler;
    this.pickCloudCodeMarkdownHandler = pickCloudCodeMarkdownHandler;
    this.saveCloudCodeMarkdownHandler = saveCloudCodeMarkdownHandler;
    this.prepareFolderReopenHandler = prepareFolderReopenHandler;
    this.removePersistedProjectHandler = removePersistedProjectHandler;
    this.completeProjectCloseHandler = completeProjectCloseHandler;
    this.printWebDocumentHandler = printWebDocumentHandler;
    this.getWeaveAccountStateHandler = getWeaveAccountStateHandler;
    this.weaveAccountRequestHandler = weaveAccountRequestHandler;
    this.weaveIapRequestHandler = weaveIapRequestHandler;
  }

  openPreview(html: string): void {
    this.openPreviewHandler(html);
  }

  saveProjectState(stateJson: string): void {
    this.saveProjectStateHandler(stateJson);
  }

  getProjectState(): string {
    return this.projectStateHandler();
  }

  getPersistedProjects(): string {
    return this.persistedProjectsHandler();
  }

  setDirtyState(dirty: boolean): void {
    this.dirtyStateHandler(dirty);
  }

  async cloudCodeChat(payloadJson: string): Promise<string> {
    return this.cloudCodeChatHandler(payloadJson);
  }

  async cloudCodeChatStream(payloadJson: string): Promise<string> {
    return this.cloudCodeChatStreamHandler(payloadJson);
  }

  getCloudCodeApiKey(): string {
    return this.getCloudCodeApiKeyHandler();
  }

  setCloudCodeApiKey(apiKey: string): void {
    this.setCloudCodeApiKeyHandler(apiKey);
  }

  getCloudCodeModels(): string {
    return this.getCloudCodeModelsHandler();
  }

  setCloudCodeModels(modelsJson: string): boolean {
    return this.setCloudCodeModelsHandler(modelsJson);
  }

  async pickCloudCodeMarkdownFiles(): Promise<string> {
    return this.pickCloudCodeMarkdownHandler();
  }

  async saveCloudCodeMarkdown(fileName: string, content: string): Promise<string> {
    return this.saveCloudCodeMarkdownHandler(fileName, content);
  }

  prepareFolderReopen(projectPath: string): boolean {
    this.prepareFolderReopenHandler(projectPath);
    return true;
  }

  async removePersistedProject(projectPath: string): Promise<string> {
    return this.removePersistedProjectHandler(projectPath);
  }

  reportFolderOpenStage(stage: string): void {
    console.info(`[XingzhiFolderOpen] ${stage}`);
  }

  async completeProjectClose(stateJson: string, shouldExit: boolean): Promise<string> {
    return this.completeProjectCloseHandler(stateJson, shouldExit);
  }

  async printWebDocument(jobName: string): Promise<string> {
    return this.printWebDocumentHandler(jobName);
  }

  async getWeaveAccountState(requestId: string): Promise<void> {
    await this.getWeaveAccountStateHandler(requestId);
  }

  async weaveAccountRequest(action: string, payloadJson: string, requestId: string): Promise<void> {
    await this.weaveAccountRequestHandler(action, payloadJson, requestId);
  }

  async weaveIapRequest(action: string, payloadJson: string, requestId: string): Promise<void> {
    await this.weaveIapRequestHandler(action, payloadJson, requestId);
  }

  getPrivacyPolicyUrl(): string {
    try {
      const privacyInfo: privacyManager.AppPrivacyMgmtInfo = privacyManager.getAppPrivacyMgmtInfo();
      const privacyLink: privacyManager.AppPrivacyLink | undefined = privacyInfo.privacyInfo.find(
        (link: privacyManager.AppPrivacyLink): boolean =>
          link.type === privacyManager.AppPrivacyLinkType.PRIVACY_STATEMENT_LINK &&
          link.url.startsWith('https://')
      );
      return privacyLink?.url ?? FALLBACK_PRIVACY_POLICY_URL;
    } catch (error) {
      // Before the app is published, AppGallery cannot return the hosted URL unless
      // the debug metadata is present. Keep the existing HTTPS policy reachable.
      console.warn(`[PrivacyManager] Unable to query the hosted privacy URL: ${String(error)}`);
      return FALLBACK_PRIVACY_POLICY_URL;
    }
  }

}

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController();
  private appContext?: common.UIAbilityContext;
  private previewServer?: socket.TCPSocketServer;
  private previewPort: number = 0;
  private previewHTML: string = '<!DOCTYPE html><title>织码预览</title>';
  private currentProjectUri: string = '';
  private projectSnapshot: string = '';
  private persistedFolderUris: Array<string> = [];
  private openFolderUris: Array<string> = [];
  private pendingFolderReopenPath: string = '';
  private weaveAccountStateRequest?: Promise<string>;
  private previewBridge: XingzhiNativeBridge = new XingzhiNativeBridge(
    (html: string): void => {
      this.openPreviewInSystemBrowser(html);
    },
    (stateJson: string): void => {
      this.saveProjectStateFromWeb(stateJson);
    },
    (): string => this.getProjectStateForWeb(),
    (): string => this.getPersistedProjectsForWeb(),
    (dirty: boolean): void => {
      UnsavedStateStore.setDirty(dirty);
    },
    (payloadJson: string): Promise<string> => this.callDeepSeek(payloadJson),
    (payloadJson: string): Promise<string> => this.cloudCodeChatStream(payloadJson),
    (): string => this.getCloudCodeApiKey(),
    (apiKey: string): void => {
      this.setCloudCodeApiKey(apiKey);
    },
    (): string => this.getCloudCodeModels(),
    (modelsJson: string): boolean => this.setCloudCodeModels(modelsJson),
    (): Promise<string> => this.pickCloudCodeMarkdownFiles(),
    (fileName: string, content: string): Promise<string> => this.saveCloudCodeMarkdown(fileName, content),
    (projectPath: string): void => {
      this.pendingFolderReopenPath = projectPath;
    },
    (projectPath: string): Promise<string> => this.removePersistedProject(projectPath),
    (stateJson: string, shouldExit: boolean): Promise<string> =>
      this.completeProjectCloseFromWeb(stateJson, shouldExit),
    (jobName: string): Promise<string> => this.printCurrentWebDocument(jobName),
    (requestId: string): Promise<void> => this.dispatchWeaveAccountState(requestId),
    (action: string, payloadJson: string, requestId: string): Promise<void> =>
      this.dispatchWeaveAccountRequest(action, payloadJson, requestId),
    (action: string, payloadJson: string, requestId: string): Promise<void> =>
      this.dispatchWeaveIapRequest(action, payloadJson, requestId)
  );
  @State private nativeFilePermissionsReady: boolean = false;
  @State private loaded: boolean = false;

  aboutToAppear(): void {
    this.appContext = this.getUIContext().getHostContext() as common.UIAbilityContext;
    UnsavedStateStore.setSaveHandler((): Promise<void> => this.flushFrontend());
    UnsavedStateStore.setCloseHandler((): Promise<void> => this.requestFrontendClose());
    this.activatePersistedFolderPermissions()
      .then((): Promise<void> => this.readProjectState())
      .catch((error: Error) => {
        console.error(`[XingzhiFilePicker] Unable to activate persisted folders: ${String(error)}`);
      })
      .finally(() => {
        // Weave restores its IndexedDB directory handles while the page loads.
        // Do not create the Web component until their native URI permissions are active.
        this.nativeFilePermissionsReady = true;
      });
  }

  onPageHide(): void {
    this.writeProjectState().catch((error: Error) => {
      console.error(`[XingzhiProjectState] Unable to persist project state: ${String(error)}`);
    });
  }

  aboutToDisappear(): void {
    this.writeProjectState().catch((error: Error) => {
      console.error(`[XingzhiProjectState] Unable to persist project state: ${String(error)}`);
    });
  }

  private async flushFrontend(): Promise<void> {
    try {
      await this.controller.runJavaScript('try { window.__xingzhiFlushAll && window.__xingzhiFlushAll(); } catch (e) {} true;');
    } catch (error) {
      console.error(`[XingzhiProjectState] Unable to flush frontend: ${String(error)}`);
    }
    await this.writeProjectState();
  }

  private async requestFrontendClose(): Promise<void> {
    if (!this.loaded) {
      throw new Error('Weave has not finished loading');
    }
    try {
      await this.controller.runJavaScript(
        'if (typeof window.__xingzhiRequestClose !== "function") {' +
        ' throw new Error("Xingzhi close handler is unavailable");' +
        '} window.__xingzhiRequestClose(); true;'
      );
    } catch (error) {
      console.error(`[XingzhiLifecycle] Unable to start Weave close flow: ${String(error)}`);
      throw new Error(String(error));
    }
  }

  private async printCurrentWebDocument(jobName: string): Promise<string> {
    if (!this.appContext) {
      return JSON.stringify({ success: false, message: 'Application context is unavailable' });
    }
    try {
      const safeJobName: string = jobName.trim() || 'Weave Code Markdown';
      const adapter: print.PrintDocumentAdapter = this.controller.createWebPrintDocumentAdapter(safeJobName);
      await print.print(safeJobName, adapter, {}, this.appContext);
      return JSON.stringify({ success: true });
    } catch (error) {
      const businessError = error as BusinessError;
      const message: string = businessError.message || String(error);
      console.error(`[XingzhiPrint] Unable to start system print service: ${message}`);
      return JSON.stringify({ success: false, message: message });
    }
  }

  private async completeProjectCloseFromWeb(stateJson: string, shouldExit: boolean): Promise<string> {
    try {
      if (shouldExit && stateJson.length > 0) {
        this.projectSnapshot = stateJson;
        await this.writeProjectState();
      }
      UnsavedStateStore.completeClose(shouldExit);
      return JSON.stringify({ ok: true });
    } catch (error) {
      console.error(`[XingzhiProjectState] Unable to finalize project close: ${String(error)}`);
      UnsavedStateStore.completeClose(false);
      return JSON.stringify({ ok: false, error: String(error) });
    }
  }

  private async getWeaveAccountState(): Promise<string> {
    if (this.weaveAccountStateRequest !== undefined) {
      return this.weaveAccountStateRequest;
    }
    const request: Promise<string> = this.loadWeaveAccountState();
    this.weaveAccountStateRequest = request;
    try {
      return await request;
    } finally {
      if (this.weaveAccountStateRequest === request) {
        this.weaveAccountStateRequest = undefined;
      }
    }
  }

  private async loadWeaveAccountState(): Promise<string> {
    if (this.appContext === undefined) {
      return JSON.stringify({ signedIn: false, anonymous: true, isVip: false, plan: 'free',
        databaseReady: false, error: '应用上下文尚未就绪' });
    }
    return JSON.stringify(await WeaveAccountService.getSnapshot(this.appContext));
  }

  private async weaveAccountRequest(action: string, payloadJson: string): Promise<string> {
    if (this.appContext === undefined) {
      return JSON.stringify({ success: false, code: 'context_unavailable', message: '应用上下文尚未就绪' });
    }
    const result: string = await WeaveAccountService.perform(this.appContext, action, payloadJson);
    this.weaveAccountStateRequest = undefined;
    return result;
  }

  private async dispatchWeaveAccountState(requestId: string): Promise<void> {
    let resultJson: string;
    try {
      resultJson = await this.getWeaveAccountState();
    } catch (error) {
      resultJson = JSON.stringify({
        signedIn: false,
        anonymous: true,
        isVip: false,
        plan: 'free',
        databaseReady: false,
        error: String(error)
      });
    }
    await this.resolveWeaveAccountWebRequest(requestId, resultJson);
  }

  private async dispatchWeaveAccountRequest(action: string, payloadJson: string,
    requestId: string): Promise<void> {
    let resultJson: string;
    try {
      resultJson = await this.weaveAccountRequest(action, payloadJson);
    } catch (error) {
      resultJson = JSON.stringify({
        success: false,
        code: 'native_request_failed',
        message: String(error)
      });
    }
    await this.resolveWeaveAccountWebRequest(requestId, resultJson);
  }

  private async dispatchWeaveIapRequest(action: string, payloadJson: string,
    requestId: string): Promise<void> {
    let resultJson: string;
    try {
      if (this.appContext === undefined) {
        resultJson = JSON.stringify({
          success: false, code: 'context_unavailable', message: '应用上下文尚未就绪'
        });
      } else {
        resultJson = await WeaveIapService.perform(this.appContext, action, payloadJson);
        this.weaveAccountStateRequest = undefined;
      }
    } catch (error) {
      resultJson = JSON.stringify({
        success: false, code: 'native_request_failed', message: String(error)
      });
    }
    await this.resolveWeaveAccountWebRequest(requestId, resultJson);
  }

  private async resolveWeaveAccountWebRequest(requestId: string, resultJson: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(requestId)) {
      console.error(`[WeaveAccount] Refused invalid web request id: ${requestId}`);
      return;
    }
    const requestLiteral: string = JSON.stringify(requestId);
    const resultLiteral: string = JSON.stringify(resultJson);
    try {
      await this.controller.runJavaScript(
        'if (typeof window.__xingzhiResolveWeaveNative === "function") {' +
        ` window.__xingzhiResolveWeaveNative(${requestLiteral}, ${resultLiteral});` +
        '} true;'
      );
    } catch (error) {
      console.error(`[WeaveAccount] Unable to deliver native response ${requestId}: ${String(error)}`);
    }
  }

  build() {
    Stack({ alignContent: Alignment.Center }) {
      if (this.nativeFilePermissionsReady) {
        Web({
          src: WEAVE_ENTRY,
          controller: this.controller
        })
          .width('100%')
          .height('100%')
          .backgroundColor('#111318')
          .javaScriptAccess(true)
          .domStorageAccess(true)
          .databaseAccess(true)
          .fileAccess(true)
          .javaScriptOnDocumentStart([{
            script: NATIVE_DOCUMENT_START_SCRIPT,
            scriptRules: [WEAVE_ENTRY]
          }])
          .javaScriptProxy({
            object: this.previewBridge,
            name: 'xingzhiNative',
            methodList: ['openPreview', 'saveProjectState', 'getProjectState', 'setDirtyState',
               'getPersistedProjects', 'getCloudCodeApiKey', 'setCloudCodeApiKey',
               'getCloudCodeModels', 'setCloudCodeModels',
               'prepareFolderReopen', 'reportFolderOpenStage', 'getPrivacyPolicyUrl'],
            asyncMethodList: [
              'cloudCodeChat',
              'cloudCodeChatStream',
              'pickCloudCodeMarkdownFiles',
              'saveCloudCodeMarkdown',
              'removePersistedProject',
              'completeProjectClose',
              'printWebDocument',
              'getWeaveAccountState',
              'weaveAccountRequest',
              'weaveIapRequest'
            ],
            controller: this.controller
          })
          .onlineImageAccess(true)
          .imageAccess(true)
          // Weave Code is a desktop-class workspace. Browser page zoom breaks the
          // three-column layout and is not the same thing as editor font sizing.
          .zoomAccess(false)
          .zoomControlAccess(false)
          .onShowFileSelector((event) => {
            // Keep ArkWeb's File System Access API in charge of directory
            // handles. This callback only replaces the system chooser UI so
            // project folders and imported files both open directly in Files.
            this.openSystemDocumentPicker(event.result, event.fileSelector);
            return true;
          })
          .onLoadIntercept((event) => {
            const url: string = event.data.getRequestUrl();
            if (!url.startsWith(EXTERNAL_URL_SCHEME)) {
              return false;
            }
            this.openInSystemBrowser(url.substring(EXTERNAL_URL_SCHEME.length));
            return true;
          })
          .onInterceptRequest((event) => {
            const url: string = event.request.getRequestUrl();
            if (this.isBlockedUpstreamUrl(url)) {
              console.warn(`[WeaveCodeNetwork] Blocked an upstream project request: ${url}`);
              return this.buildBlockedUpstreamResponse();
            }
            if (!url.startsWith(WEAVE_ORIGIN)) {
              return null;
            }
            const relativeUrl: string = url.substring(WEAVE_ORIGIN.length);
            if (relativeUrl.startsWith(EXTENSION_PROXY_PATH)) {
              return this.buildExtensionProxyResponse(relativeUrl.substring(EXTENSION_PROXY_PATH.length));
            }
            return this.buildWeaveResponse(url);
          })
          .onConsole((event) => {
            const message: ConsoleMessage = event.message;
            console.info(`[WeaveConsole][${message.getMessageLevel()}] ${message.getMessage()} ` +
              `@ ${message.getSourceId()}:${message.getLineNumber()}`);
            return true;
          })
          .onErrorReceive((event) => {
            console.error(`[WeaveWebError] ${event.error.getErrorCode()} ${event.error.getErrorInfo()} ` +
              `@ ${event.request.getRequestUrl()}`);
          })
          .onPageEnd(() => {
            // The start screen is created just after the document load event. Keep the
            // native cover visible until that dialog is actually in the DOM so users do
            // not see the placeholder editor flash for a fraction of a second.
            this.revealWeaveWhenReady(0);
          })
      }

      if (!this.loaded) {
        // Keep the real web workspace covered until its start page is ready.
        // The dedicated artwork avoids briefly presenting a non-interactive
        // imitation of the project home page during ArkWeb initialization.
        Image($r('app.media.weave_code_start'))
        .width('100%')
        .height('100%')
        .objectFit(ImageFit.Contain)
        .backgroundColor('#FFFFFF')
        .hitTestBehavior(HitTestMode.None)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#111318')
  }

  private async openSystemDocumentPicker(result: FileSelectorResult,
    fileSelector: FileSelectorParam): Promise<void> {
    if (this.appContext === undefined) {
      result.handleFileList([]);
      return;
    }

    try {
      const selectorMode: number = fileSelector.getMode();
      console.info(`[XingzhiFilePicker] Opening selector in mode ${selectorMode}`);
      let requestedPath: string = this.pendingFolderReopenPath;
      if (selectorMode === 2 && requestedPath.length === 0) {
        try {
          const webPath: string = await this.controller.runJavaScript(
            '(function(){' +
            'const path=window.__xingzhiPendingFolderReopenPath||"";' +
            'window.__xingzhiPendingFolderReopenPath="";' +
            'return path;' +
            '})();'
          );
          requestedPath = typeof webPath === 'string' ? webPath : '';
        } catch (error) {
          console.info(`[XingzhiFilePicker] Unable to read browser remount target: ${String(error)}`);
        }
      }
      if (selectorMode === 2 && requestedPath.length > 0) {
        this.pendingFolderReopenPath = '';
        const persistedUri: string = await this.findPersistedFolderUri(requestedPath);
        if (persistedUri.length > 0) {
          const policies: Array<fileShare.PolicyInfo> = this.getFolderPolicies([persistedUri]);
          // The URI grant is persistent, while ArkWeb directory handles are
          // process-local. Activate the URI if necessary and return it through
          // this new selector request; ArkWeb will construct a fresh handle.
          // Do not deactivate first: toggling the OS grant is unrelated to the
          // stale browser proxy and can invalidate other open project I/O.
          try {
            await fileShare.activatePermission(policies);
          } catch (error) {
            console.info(`[XingzhiFilePicker] Folder grant was already active: ${String(error)}`);
          }
          // A successful background reactivation makes this folder an open
          // project again. Keep its remembered URI and restore only its entry
          // in the separately maintained open-project list.
          await this.persistFolderPermissions([persistedUri]);
          console.info(`[XingzhiFilePicker] Rehydrating persisted folder for ${requestedPath}`);
          result.handleFileList([persistedUri]);
          return;
        }
        console.info(`[XingzhiFilePicker] No persisted URI matched ${requestedPath}; opening Files`);
      }

      const documentPicker = new picker.DocumentViewPicker(this.appContext);
      const options = new picker.DocumentSelectOptions();
      // ArkWeb reports showDirectoryPicker() as FileOpenFolderMode (2). It must
      // receive a directory-only result so ArkWeb can create and resolve a
      // FileSystemDirectoryHandle. MIXED returns a URI but leaves the browser's
      // directory-picker promise pending on HarmonyOS. Ordinary HTML file inputs
      // continue to use FILE mode below, so file uploads remain available.
      if (selectorMode === 2) {
        const supportsFolderSelection: boolean =
          canIUse('SystemCapability.FileManagement.UserFileService.FolderSelection');
        options.selectMode = supportsFolderSelection ? picker.DocumentSelectMode.FOLDER : picker.DocumentSelectMode.MIXED;
        options.maxSelectNumber = 1;
      } else {
        options.selectMode = picker.DocumentSelectMode.FILE;
        // FileOpenMultipleMode is 1.
        options.maxSelectNumber = selectorMode === 1 ? 100 : 1;
      }
      const files: Array<string> = await documentPicker.select(options);
      if (selectorMode === 2 && files.length > 0) {
        try {
          await this.persistFolderPermissions(files);
        } catch (error) {
          // The current picker grant is still usable even when a device does not
          // support persistent authorization. Do not turn a valid selection into
          // a cancelled one; only automatic reopening will be unavailable.
          console.error(`[XingzhiFilePicker] Unable to persist folder permission: ${String(error)}`);
        }
      }
      console.info(`[XingzhiFilePicker] Selection succeeded with ${files.length} item(s)`);
      result.handleFileList(files);
    } catch (error) {
      // Cancellation is expected and must be reported back to ArkWeb, otherwise
      // the HTML file input remains pending and later selections stop working.
      console.info(`[XingzhiFilePicker] Selection ended: ${String(error)}`);
      result.handleFileList([]);
    }
  }

  private getFolderPolicies(uris: Array<string>): Array<fileShare.PolicyInfo> {
    const operationMode: number = fileShare.OperationMode.READ_MODE | fileShare.OperationMode.WRITE_MODE;
    return uris.map((uri: string): fileShare.PolicyInfo => ({ uri, operationMode }));
  }

  private getFolderNameFromProjectPath(projectPath: string): string {
    const normalized: string = projectPath.replace(/\\/g, '/').replace(/\/+$/, '');
    const parts: Array<string> = normalized.split('/').filter((part: string): boolean => part.length > 0);
    if (parts.length === 0) {
      return '';
    }
    const mountIndex: number = parts.indexOf('mnt');
    const name: string = mountIndex >= 0 && mountIndex + 1 < parts.length ?
      parts[mountIndex + 1] : parts[parts.length - 1];
    return name.replace(/_\d+$/, '');
  }

  private getFolderNameFromUri(uri: string): string {
    try {
      const decoded: string = decodeURIComponent(uri).replace(/[?#].*$/, '').replace(/\/+$/, '');
      const separator: number = decoded.lastIndexOf('/');
      return separator >= 0 ? decoded.substring(separator + 1) : decoded;
    } catch (_error) {
      return '';
    }
  }

  private async findPersistedFolderUri(projectPath: string): Promise<string> {
    const requestedName: string = this.getFolderNameFromProjectPath(projectPath).toLocaleLowerCase();
    if (requestedName.length === 0) {
      return '';
    }
    const uris: Array<string> = await this.readPersistedFolderUris();
    const matched: string | undefined = uris.find((uri: string): boolean =>
      this.getFolderNameFromUri(uri).toLocaleLowerCase() === requestedName
    );
    return matched || '';
  }

  private async removePersistedProject(projectPath: string): Promise<string> {
    const requestedName: string = this.getFolderNameFromProjectPath(projectPath).toLocaleLowerCase();
    if (requestedName.length === 0) {
      return JSON.stringify({ ok: false, error: 'Invalid project path' });
    }

    const savedUris: Array<string> = await this.readPersistedFolderUris();
    const openUris: Array<string> = await this.readOpenFolderUris(savedUris);
    const matchingSavedUris: Array<string> = savedUris.filter((uri: string): boolean =>
      this.getFolderNameFromUri(uri).toLocaleLowerCase() === requestedName
    );
    const removedUris: Array<string> = openUris.filter((uri: string): boolean =>
      this.getFolderNameFromUri(uri).toLocaleLowerCase() === requestedName
    );
    const remainingOpenUris: Array<string> = openUris.filter((uri: string): boolean =>
      this.getFolderNameFromUri(uri).toLocaleLowerCase() !== requestedName
    );

    // JavaScript proxies do not reliably await an ArkTS Promise return value on
    // every ArkWeb version. Publish the new in-memory snapshot before the first
    // asynchronous permission operation so the web side can confirm closure by
    // polling getPersistedProjects(). The preference write still completes below.
    this.openFolderUris = remainingOpenUris;

    // Closing a mounted project must not forget its URI. The remembered URI and
    // persistent grant are retained so a recent-project click can remount it in
    // the background without asking the user to select the folder again.
    if (matchingSavedUris.length > 0) {
      try {
        await fileShare.deactivatePermission(this.getFolderPolicies(matchingSavedUris));
      } catch (error) {
        console.info(`[XingzhiFilePicker] Project permission was already inactive: ${String(error)}`);
      }
    }
    await this.writeOpenFolderUris(remainingOpenUris);
    if (this.getFolderNameFromUri(this.currentProjectUri).toLocaleLowerCase() === requestedName) {
      this.currentProjectUri = '';
      await this.writeProjectState();
    }
    if (this.getFolderNameFromProjectPath(this.pendingFolderReopenPath).toLocaleLowerCase() === requestedName) {
      this.pendingFolderReopenPath = '';
    }
    console.info(`[XingzhiFilePicker] Closed mounted project ${projectPath}`);
    return JSON.stringify({ ok: true, removed: removedUris.length > 0 });
  }

  private async readPersistedFolderUris(): Promise<Array<string>> {
    if (this.appContext === undefined) {
      return [];
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    const value: preferences.ValueType = store.getSync(PERSISTED_FOLDER_URIS, '');
    const serialized: string = typeof value === 'string' ? value : '';
    return serialized.split('\n').filter((uri: string): boolean => uri.length > 0);
  }

  private async writePersistedFolderUris(uris: Array<string>): Promise<void> {
    if (this.appContext === undefined) {
      return;
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    store.putSync(PERSISTED_FOLDER_URIS, uris.join('\n'));
    await store.flush();
  }

  private async readOpenFolderUris(fallbackUris: Array<string>): Promise<Array<string>> {
    if (this.appContext === undefined) {
      return [];
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    if (!store.hasSync(OPEN_FOLDER_URIS)) {
      return fallbackUris.slice();
    }
    const value: preferences.ValueType = store.getSync(OPEN_FOLDER_URIS, '');
    const serialized: string = typeof value === 'string' ? value : '';
    return serialized.split('\n').filter((uri: string): boolean => uri.length > 0);
  }

  private async writeOpenFolderUris(uris: Array<string>): Promise<void> {
    if (this.appContext === undefined) {
      return;
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    store.putSync(OPEN_FOLDER_URIS, uris.join('\n'));
    await store.flush();
  }

  private async readProjectState(): Promise<void> {
    if (this.appContext === undefined) {
      return;
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    const uriValue: preferences.ValueType = store.getSync(CURRENT_PROJECT_URI, '');
    const snapshotValue: preferences.ValueType = store.getSync(PROJECT_SNAPSHOT, '');
    this.currentProjectUri = typeof uriValue === 'string' ? uriValue : '';
    this.projectSnapshot = typeof snapshotValue === 'string' ? snapshotValue : '';
  }

  private async writeProjectState(): Promise<void> {
    if (this.appContext === undefined) {
      return;
    }
    const store = await preferences.getPreferences(this.appContext, { name: FILE_ACCESS_PREFERENCES });
    store.putSync(CURRENT_PROJECT_URI, this.currentProjectUri);
    store.putSync(PROJECT_SNAPSHOT, this.projectSnapshot);
    await store.flush();
  }

  private saveProjectStateFromWeb(stateJson: string): void {
    this.projectSnapshot = stateJson;
    this.writeProjectState().catch((error: Error) => {
      console.error(`[XingzhiProjectState] Unable to save project snapshot: ${String(error)}`);
    });
  }

  private getProjectStateForWeb(): string {
    return this.projectSnapshot;
  }

  private getPersistedProjectsForWeb(): string {
    const projects: Array<PersistedFolderProject> = [];
    const names: Set<string> = new Set<string>();
    this.openFolderUris.forEach((uri: string): void => {
      const name: string = this.getFolderNameFromUri(uri).replace(/[\\/]/g, '').trim();
      if (name.length === 0 || names.has(name.toLocaleLowerCase())) {
        return;
      }
      names.add(name.toLocaleLowerCase());
      projects.push({
        name,
        fullPath: `/mnt/${name}/`
      });
    });
    return JSON.stringify(projects);
  }

  private async persistFolderPermissions(selectedUris: Array<string>): Promise<void> {
    const savedUris: Array<string> = await this.readPersistedFolderUris();
    const uniqueUris: Array<string> = Array.from(new Set<string>(savedUris.concat(selectedUris)));
    this.persistedFolderUris = uniqueUris;
    const openUris: Array<string> = await this.readOpenFolderUris(savedUris);
    const uniqueOpenUris: Array<string> = Array.from(new Set<string>(openUris.concat(selectedUris)));
    this.openFolderUris = uniqueOpenUris;
    const policies: Array<fileShare.PolicyInfo> = this.getFolderPolicies(selectedUris);
    const persisted: Array<boolean> = await fileShare.checkPersistentPermission(policies);
    const pending: Array<fileShare.PolicyInfo> = policies.filter(
      (_policy: fileShare.PolicyInfo, index: number): boolean => !persisted[index]
    );
    if (pending.length > 0) {
      await fileShare.persistPermission(pending);
    }
    await this.writePersistedFolderUris(uniqueUris);
    await this.writeOpenFolderUris(uniqueOpenUris);
    if (selectedUris.length > 0) {
      this.currentProjectUri = selectedUris[selectedUris.length - 1];
      await this.writeProjectState();
    }
    console.info(`[XingzhiFilePicker] Persisted ${selectedUris.length} folder permission(s)`);
  }

  private async activatePersistedFolderPermissions(): Promise<void> {
    const uris: Array<string> = await this.readPersistedFolderUris();
    if (uris.length === 0) {
      this.persistedFolderUris = [];
      this.openFolderUris = [];
      return;
    }
    const policies: Array<fileShare.PolicyInfo> = this.getFolderPolicies(uris);
    const persisted: Array<boolean> = await fileShare.checkPersistentPermission(policies);
    const available: Array<fileShare.PolicyInfo> = policies.filter(
      (_policy: fileShare.PolicyInfo, index: number): boolean => persisted[index]
    );
    this.persistedFolderUris = uris.filter(
      (_uri: string, index: number): boolean => persisted[index]
    );
    const openUris: Array<string> = await this.readOpenFolderUris(uris);
    const availableUris: Set<string> = new Set<string>(this.persistedFolderUris);
    this.openFolderUris = openUris.filter((uri: string): boolean => availableUris.has(uri));
    if (available.length > 0) {
      try {
        // Keep the existing system mount session intact. Releasing it before
        // ArkWeb restores its persisted directory handle is what makes the
        // last project become the permanently pending handle.
        await fileShare.activatePermission(available);
      } catch (error) {
        // Activation is idempotent from the application's point of view. The
        // permission may already be active because the project deliberately
        // remains mounted between desktop-style application sessions.
        console.info(`[XingzhiFilePicker] Folder permissions already active: ${String(error)}`);
      }
    }
    console.info(`[XingzhiFilePicker] Activated ${available.length} persisted folder permission(s)`);
  }

  private openInSystemBrowser(encodedUrl: string): void {
    if (this.appContext === undefined) {
      return;
    }
    try {
      const url: string = decodeURIComponent(encodedUrl);
      if (!url.startsWith('https://') && !url.startsWith('http://')) {
        console.error(`[XingzhiExternalURL] Rejected non-web URL: ${url}`);
        return;
      }
      this.appContext.startAbility({
        action: 'ohos.want.action.viewData',
        uri: url
      }).catch((error: Error) => {
        console.error(`[XingzhiExternalURL] Unable to open ${url}: ${String(error)}`);
      });
    } catch (error) {
      console.error(`[XingzhiExternalURL] Invalid URL: ${String(error)}`);
    }
  }

  private async openPreviewInSystemBrowser(html: string): Promise<void> {
    if (this.appContext === undefined || html.length === 0) {
      return;
    }
    this.previewHTML = html;
    try {
      if (this.previewServer === undefined || this.previewPort === 0) {
        await this.startPreviewServer();
      }
      const previewUrl: string = `http://127.0.0.1:${this.previewPort}/?v=${Date.now()}`;
      this.openInSystemBrowser(encodeURIComponent(previewUrl));
    } catch (error) {
      console.error(`[XingzhiPreviewServer] Unable to open preview: ${String(error)}`);
    }
  }

  private async startPreviewServer(): Promise<void> {
    const server: socket.TCPSocketServer = socket.constructTCPSocketServerInstance();
    server.on('connect', (connection: socket.TCPSocketConnection): void => {
      let responded: boolean = false;
      connection.on('message', (_message: socket.SocketMessageInfo): void => {
        if (responded) {
          return;
        }
        responded = true;
        const body: string = this.previewHTML;
        const contentLength: number = new util.TextEncoder().encodeInto(body).byteLength;
        const response: string = 'HTTP/1.1 200 OK\r\n' +
          'Content-Type: text/html; charset=utf-8\r\n' +
          `Content-Length: ${contentLength}\r\n` +
          'Cache-Control: no-store\r\n' +
          'X-Content-Type-Options: nosniff\r\n' +
          'Connection: close\r\n\r\n' + body;
        connection.send({ data: response, encoding: 'utf-8' })
          .catch((error: Error) => {
            console.error(`[XingzhiPreviewServer] Send failed: ${String(error)}`);
          })
          .finally(() => {
            connection.close().catch(() => {});
          });
      });
    });
    server.on('error', (error: Error): void => {
      console.error(`[XingzhiPreviewServer] ${String(error)}`);
    });
    try {
      await server.listen({ address: '127.0.0.1', family: 1, port: 0 });
      const localAddress = await server.getLocalAddress();
      if (localAddress.port === undefined || localAddress.port === 0) {
        throw new Error('Preview server did not receive a local port');
      }
      this.previewServer = server;
      this.previewPort = localAddress.port;
      console.info(`[XingzhiPreviewServer] Listening on 127.0.0.1:${this.previewPort}`);
    } catch (error) {
      try {
        await server.close();
      } catch (closeError) {
        console.error(`[XingzhiPreviewServer] Close failed: ${String(closeError)}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private buildExtensionProxyResponse(relativeUrl: string): WebResourceResponse {
    const response: WebResourceResponse = new WebResourceResponse();
    if (!relativeUrl.toLowerCase().endsWith('.zip')) {
      response.setResponseEncoding('utf-8');
    }
    response.setResponseMimeType(this.mimeType(relativeUrl));
    response.setResponseCode(200);
    response.setReasonMessage('OK');
    response.setResponseHeader([
      { headerKey: 'Access-Control-Allow-Origin', headerValue: '*' },
      { headerKey: 'Cache-Control', headerValue: 'no-cache' }
    ]);
    response.setResponseIsReady(false);
    this.fetchExtensionResource(relativeUrl, response);
    return response;
  }

  private async fetchExtensionResource(relativeUrl: string, response: WebResourceResponse): Promise<void> {
    const request = http.createHttp();
    try {
      if (!this.isSafeExtensionResource(relativeUrl)) {
        throw new Error('Unsafe extension service path');
      }
      if (this.appContext === undefined) {
        throw new Error('Application context is unavailable');
      }
      // All extensions in the shipped catalog are bundled with the app. Serve
      // them immediately so installation is independent of cloud credentials,
      // network availability and the remote storage service.
      const packagedResource: ArrayBuffer | undefined = this.readPackagedExtensionResource(relativeUrl);
      if (packagedResource !== undefined) {
        response.setResponseData(packagedResource);
        response.setResponseMimeType(this.mimeType(relativeUrl));
        response.setResponseCode(200);
        response.setReasonMessage('OK');
        console.info(
          `[XingzhiExtensionProxy] Served packaged ${relativeUrl} (${packagedResource.byteLength} bytes)`
        );
        return;
      }
      // Extension requests can arrive while Ability.onCreate is still signing
      // in. Await the shared authentication gate before touching Cloud Storage.
      await CloudAuthService.ensureReady(this.appContext);
      const cloudPath: string = this.extensionCloudPath(relativeUrl);
      const remoteUrl: string = await this.getExtensionDownloadUrl(cloudPath);
      console.info(`[XingzhiExtensionProxy] Downloading ${cloudPath} from Huawei Cloud Storage`);
      const remoteResponse: http.HttpResponse = await request.request(remoteUrl, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.ARRAY_BUFFER,
        connectTimeout: 30000,
        readTimeout: 120000,
        maxLimit: 100 * 1024 * 1024
      });
      const statusCode: number = Number(remoteResponse.responseCode);
      if (statusCode < 200 || statusCode >= 300 || !(remoteResponse.result instanceof ArrayBuffer)) {
        throw new Error(`Extension service returned HTTP ${statusCode}`);
      }
      response.setResponseData(remoteResponse.result as ArrayBuffer);
      response.setResponseMimeType(this.mimeType(relativeUrl));
      response.setResponseCode(statusCode);
      response.setReasonMessage('OK');
      console.info(`[XingzhiExtensionProxy] Received ${cloudPath} (${remoteResponse.result.byteLength} bytes)`);
    } catch (error) {
      let errorText: string = this.describeNativeError(error);
      console.error(`[XingzhiExtensionProxy] URL download failed for ${relativeUrl}: ${errorText}`);
      if (relativeUrl.toLowerCase().endsWith('.zip')) {
        try {
          const cloudPath: string = this.extensionCloudPath(relativeUrl);
          const cloudData: ArrayBuffer = await this.downloadExtensionWithCloudTask(cloudPath);
          response.setResponseData(cloudData);
          response.setResponseMimeType(this.mimeType(relativeUrl));
          response.setResponseCode(200);
          response.setReasonMessage('OK');
          console.info(`[XingzhiExtensionProxy] Native task received ${cloudPath} (${cloudData.byteLength} bytes)`);
          return;
        } catch (taskError) {
          const taskErrorText: string = this.describeNativeError(taskError);
          console.error(`[XingzhiExtensionProxy] Native task failed for ${relativeUrl}: ${taskErrorText}`);
          errorText = `download URL path: ${errorText}; native download task: ${taskErrorText}`;
        }
      }
      const packagedResource: ArrayBuffer | undefined = this.readPackagedExtensionResource(relativeUrl);
      if (packagedResource !== undefined) {
        response.setResponseData(packagedResource);
        response.setResponseMimeType(this.mimeType(relativeUrl));
        response.setResponseCode(200);
        response.setReasonMessage('OK');
      } else {
        response.setResponseData(
          `Huawei Cloud Storage failed for ${relativeUrl}: ${errorText}`
        );
        response.setResponseMimeType('text/plain');
        response.setResponseCode(502);
        response.setReasonMessage('Bad Gateway');
      }
    } finally {
      response.setResponseIsReady(true);
      request.destroy();
    }
  }

  private async downloadExtensionWithCloudTask(cloudPath: string): Promise<ArrayBuffer> {
    try {
      return await this.downloadExtensionFromBucket(cloudStorage.bucket(), cloudPath);
    } catch (defaultBucketError) {
      const defaultBucketMessage: string = this.describeNativeError(defaultBucketError);
      try {
        return await this.downloadExtensionFromBucket(
          cloudStorage.bucket(EXTENSION_STORAGE_BUCKET), cloudPath
        );
      } catch (namedBucketError) {
        throw new Error(
          `default bucket: ${defaultBucketMessage}; ` +
          `bucket ${EXTENSION_STORAGE_BUCKET}: ${this.describeNativeError(namedBucketError)}`
        );
      }
    }
  }

  private async downloadExtensionFromBucket(bucket: cloudStorage.StorageBucket,
    cloudPath: string): Promise<ArrayBuffer> {
    if (this.appContext === undefined) {
      throw new Error('Application context is unavailable');
    }
    const localName: string = `weave-extension-${Date.now()}-${Math.floor(Math.random() * 100000)}.zip`;
    const localPath: string = `./${localName}`;
    const absolutePath: string = `${this.appContext.cacheDir}/${localName}`;
    try {
      const task: request.agent.Task = await bucket.downloadFile(this.appContext, {
        localPath: localPath,
        cloudPath: cloudPath,
        mode: request.agent.Mode.FOREGROUND,
        overwrite: true
      });
      await new Promise<void>((resolve: () => void, reject: (reason: Error) => void): void => {
        let settled: boolean = false;
        task.on('completed', (): void => {
          if (!settled) {
            settled = true;
            resolve();
          }
        });
        task.on('failed', (progress: request.agent.Progress): void => {
          if (!settled) {
            settled = true;
            reject(new Error(`Cloud download task failed with state ${String(progress.state)}`));
          }
        });
        task.start((startError: BusinessError): void => {
          if (startError && !settled) {
            settled = true;
            reject(new Error(
              `Cloud download task could not start: ${this.describeNativeError(startError)}`
            ));
          }
        });
      });
      const fileStat: fileIo.Stat = fileIo.statSync(absolutePath);
      const fileBuffer: ArrayBuffer = new ArrayBuffer(fileStat.size);
      const file: fileIo.File = fileIo.openSync(absolutePath, fileIo.OpenMode.READ_ONLY);
      try {
        const bytesRead: number = fileIo.readSync(file.fd, fileBuffer);
        if (bytesRead !== fileStat.size) {
          throw new Error(`Cloud download was incomplete: ${bytesRead}/${fileStat.size} bytes`);
        }
      } finally {
        fileIo.closeSync(file);
      }
      return fileBuffer;
    } finally {
      try {
        fileIo.unlinkSync(absolutePath);
      } catch (cleanupError) {
        console.info(`[XingzhiExtensionProxy] No temporary download to remove: ${String(cleanupError)}`);
      }
    }
  }

  private async getExtensionDownloadUrl(cloudPath: string): Promise<string> {
    try {
      // The uploaded storage instance is marked as the AGC default instance.
      // Prefer that binding because the console display name is not
      // necessarily the bucket identifier expected by the native SDK.
      return await cloudStorage.bucket().getDownloadURL(cloudPath);
    } catch (defaultBucketError) {
      const defaultBucketMessage: string = this.describeNativeError(defaultBucketError);
      console.warn(`[XingzhiExtensionProxy] Default bucket lookup failed for ${cloudPath}: ` +
        `${defaultBucketMessage}`);
      try {
        return await cloudStorage.bucket(EXTENSION_STORAGE_BUCKET).getDownloadURL(cloudPath);
      } catch (namedBucketError) {
        throw new Error(
          `default bucket: ${defaultBucketMessage}; ` +
          `bucket ${EXTENSION_STORAGE_BUCKET}: ${this.describeNativeError(namedBucketError)}`
        );
      }
    }
  }

  private describeNativeError(error: Object): string {
    const businessError: BusinessError = error as BusinessError;
    const errorCode: number = businessError.code;
    const errorMessage: string = businessError.message;
    if (errorCode !== undefined) {
      return `code=${String(errorCode)}, message=${errorMessage}`;
    }
    if (errorMessage !== undefined && errorMessage.length > 0) {
      return errorMessage;
    }
    try {
      const serialized: string = JSON.stringify(error);
      if (serialized.length > 2) {
        return serialized;
      }
    } catch (serializationError) {
      console.warn(`[XingzhiExtensionProxy] Unable to serialize error: ${String(serializationError)}`);
    }
    return String(error);
  }

  private revealWeaveWhenReady(attempt: number): void {
    const readinessScript: string =
      'document.querySelector(".xingzhi-start-screen-wrapper") ? "start-screen" : ' +
      '(document.querySelector("#main-toolbar") ? "workspace" : "loading");';
    this.controller.runJavaScript(readinessScript)
      .then((state: string): void => {
        // ArkWeb can return a JSON-encoded string (for example
        // \"start-screen\") instead of the raw JavaScript value.
        const normalizedState: string = String(state).replace(/^\"|\"$/g, '');
        if (normalizedState === 'start-screen' ||
          (normalizedState === 'workspace' && attempt >= 20) || attempt >= 60) {
          this.loaded = true;
          return;
        }
        setTimeout((): void => this.revealWeaveWhenReady(attempt + 1), 50);
      })
      .catch((error: Error): void => {
        if (attempt >= 60) {
          console.error(`[XingzhiStartup] Unable to observe start screen: ${String(error)}`);
          this.loaded = true;
          return;
        }
        setTimeout((): void => this.revealWeaveWhenReady(attempt + 1), 50);
      });
  }

  /** Opens Files in multi-select mode and returns the selected Markdown documents. */
  private async pickCloudCodeMarkdownFiles(): Promise<string> {
    if (this.appContext === undefined) {
      return JSON.stringify({ ok: false, error: 'Application context is unavailable' });
    }
    try {
      const documentPicker = new picker.DocumentViewPicker(this.appContext);
      const options = new picker.DocumentSelectOptions();
      options.selectMode = picker.DocumentSelectMode.FILE;
      options.maxSelectNumber = 100;
      options.fileSuffixFilters = ['Markdown|md'];
      const uris: Array<string> = await documentPicker.select(options);
      const files: Array<CloudCodeMarkdownContext> = [];
      for (const uri of uris) {
        const content: string = await fileIo.readText(uri);
        const decodedUri: string = decodeURIComponent(uri);
        const slashIndex: number = Math.max(decodedUri.lastIndexOf('/'), decodedUri.lastIndexOf('\\'));
        files.push({
          name: slashIndex >= 0 ? decodedUri.substring(slashIndex + 1) : decodedUri,
          uri: uri,
          content: content
        });
      }
      return JSON.stringify({ ok: true, files: files });
    } catch (error) {
      const errorText: string = String(error);
      if (errorText.includes('13900012') || errorText.toLocaleLowerCase().includes('cancel')) {
        return JSON.stringify({ ok: true, cancelled: true, files: [] });
      }
      console.error(`[CloudCode] Unable to select Markdown context: ${errorText}`);
      return JSON.stringify({ ok: false, error: errorText });
    }
  }

  /** Saves an exported Cloud Code conversation through the system document picker. */
  private async saveCloudCodeMarkdown(fileName: string, content: string): Promise<string> {
    if (this.appContext === undefined) {
      return JSON.stringify({ ok: false, error: 'Application context is unavailable' });
    }
    try {
      const safeName: string = fileName.toLocaleLowerCase().endsWith('.md') ? fileName : `${fileName}.md`;
      const documentPicker = new picker.DocumentViewPicker(this.appContext);
      const options = new picker.DocumentSaveOptions();
      options.newFileNames = [safeName];
      options.fileSuffixChoices = ['Markdown|md'];
      const uris: Array<string> = await documentPicker.save(options);
      if (uris.length === 0) {
        return JSON.stringify({ ok: true, cancelled: true });
      }
      const target = fileIo.openSync(uris[0], fileIo.OpenMode.WRITE_ONLY | fileIo.OpenMode.TRUNC);
      try {
        fileIo.writeSync(target.fd, content);
      } finally {
        fileIo.closeSync(target);
      }
      return JSON.stringify({ ok: true, uri: uris[0] });
    } catch (error) {
      const errorText: string = String(error);
      if (errorText.includes('13900012') || errorText.toLocaleLowerCase().includes('cancel')) {
        return JSON.stringify({ ok: true, cancelled: true });
      }
      console.error(`[CloudCode] Unable to save Markdown history: ${errorText}`);
      return JSON.stringify({ ok: false, error: errorText });
    }
  }

  /** Resolves an explicit API protocol or infers it from the configured address. */
  private resolveCloudCodeFormat(payload: DeepSeekChatRequest): string {
    const configured: string = (payload.apiFormat ?? 'auto').toLocaleLowerCase();
    if (configured === 'openai' || configured === 'anthropic') {
      return configured;
    }
    const address: string = (payload.apiUrl ?? DEFAULT_CLOUD_CODE_API_URL).toLocaleLowerCase();
    if (address.includes('anthropic') || address.endsWith('/messages')) {
      return 'anthropic';
    }
    return 'openai';
  }

  /** Converts either a provider base URL or a complete endpoint into a request URL. */
  private cloudCodeProviderApiUrl(provider: string): string {
    switch (provider.trim()) {
      case 'alibaba':
        return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      case 'deepseek':
        return 'https://api.deepseek.com';
      case 'moonshot':
        return 'https://api.moonshot.cn/v1';
      case 'minimax':
        return 'https://api.minimax.cn/v1';
      case 'zhipu':
        return 'https://open.bigmodel.cn/api/paas/v4';
      default:
        return '';
    }
  }

  /** Converts the selected approved provider base URL into its chat endpoint. */
  private resolveCloudCodeEndpoint(payload: DeepSeekChatRequest, apiFormat: string): string {
    let endpoint: string = (payload.apiUrl ?? DEFAULT_CLOUD_CODE_API_URL).trim();
    while (endpoint.endsWith('/')) {
      endpoint = endpoint.substring(0, endpoint.length - 1);
    }
    const providerEndpoint: string = this.cloudCodeProviderApiUrl(payload.provider ?? '');
    if (providerEndpoint.length === 0 || endpoint !== providerEndpoint || !ALLOWED_CLOUD_CODE_API_URLS.includes(endpoint)) {
      throw new Error('Cloud Code only supports approved AI service providers');
    }
    if (apiFormat !== 'openai') {
      throw new Error('The selected Cloud Code provider must use the OpenAI-compatible API format');
    }
    if (endpoint.endsWith('/chat/completions')) {
      return endpoint;
    }
    return `${endpoint}/chat/completions`;
  }

  /** Enforces the account policy in native code before any model request leaves the device. */
  private async ensureCloudCodeSignedIn(): Promise<void> {
    if (this.appContext === undefined) {
      throw new Error('应用上下文尚未就绪');
    }
    const snapshot = await WeaveAccountService.getSnapshot(this.appContext);
    if (!snapshot.signedIn) {
      throw new Error('使用 Cloud Code 前请先登录织码账号');
    }
  }

  /** Creates authentication headers for OpenAI- or Anthropic-compatible servers. */
  private getCloudCodeHeaders(apiFormat: string, payload: DeepSeekChatRequest): CloudCodeHeaders {
    const apiKey: string = (payload.apiKey ?? '').trim() || this.getCloudCodeApiKeySync();
    if (apiFormat === 'anthropic') {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }

  /** Serializes a Cloud Code request using the selected provider protocol. */
  private buildCloudCodeBody(payload: DeepSeekChatRequest, apiFormat: string, stream: boolean): string {
    const messages: Array<DeepSeekMessage> = payload.messages ?? [];
    const model: string = payload.model ?? 'deepseek-flash';
    const temperature: number = payload.temperature ?? 0.3;
    const maxTokens: number = payload.maxTokens ?? 4096;
    const thinking: boolean = payload.thinking === true;
    if (apiFormat === 'anthropic') {
      const anthropicMessages: Array<DeepSeekMessage> = [];
      const systemParts: Array<string> = [];
      messages.forEach((message: DeepSeekMessage): void => {
        if (message.role === 'system') {
          systemParts.push(message.content);
        } else if (message.role === 'user' || message.role === 'assistant') {
          anthropicMessages.push(message);
        }
      });
      const system: string = systemParts.join('\n\n');
      if (thinking) {
        const budgetTokens: number = Math.min(4096, Math.max(1024, maxTokens - 1024));
        const thinkingConfig: CloudCodeThinkingConfig = { type: 'enabled', budget_tokens: budgetTokens };
        return JSON.stringify({
          model: model,
          system: system,
          messages: anthropicMessages,
          stream: stream,
          max_tokens: maxTokens,
          thinking: thinkingConfig
        });
      }
      return JSON.stringify({
        model: model,
        system: system,
        messages: anthropicMessages,
        stream: stream,
        max_tokens: maxTokens,
        temperature: temperature
      });
    }
    if (thinking) {
      const thinkingConfig: CloudCodeThinkingConfig = { type: 'enabled' };
      return JSON.stringify({
        model: model,
        messages: messages,
        stream: stream,
        max_tokens: maxTokens,
        thinking: thinkingConfig,
        reasoning_effort: 'high'
      });
    }
    return JSON.stringify({
      model: model,
      messages: messages,
      stream: stream,
      temperature: temperature,
      max_tokens: maxTokens
    });
  }

  private async callDeepSeek(payloadJson: string): Promise<string> {
    const request = http.createHttp();
    try {
      await this.ensureCloudCodeSignedIn();
      const payload = JSON.parse(payloadJson) as DeepSeekChatRequest;
      const apiFormat: string = this.resolveCloudCodeFormat(payload);
      const endpoint: string = this.resolveCloudCodeEndpoint(payload, apiFormat);
      const body: string = this.buildCloudCodeBody(payload, apiFormat, false);
      const remoteResponse: http.HttpResponse = await request.request(endpoint, {
        method: http.RequestMethod.POST,
        header: this.getCloudCodeHeaders(apiFormat, payload),
        extraData: body,
        expectDataType: http.HttpDataType.STRING,
        connectTimeout: 30000,
        readTimeout: 120000
      });
      const statusCode: number = Number(remoteResponse.responseCode);
      const resultText: string = remoteResponse.result as string;
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`API returned HTTP ${statusCode}: ${resultText}`);
      }
      let content: string = '';
      if (apiFormat === 'anthropic') {
        const anthropicData = JSON.parse(resultText) as AnthropicChatResponse;
        content = (anthropicData.content ?? []).filter((block: AnthropicContentBlock): boolean =>
          block.type === 'text' && block.text !== undefined
        ).map((block: AnthropicContentBlock): string => block.text ?? '').join('');
      } else {
        const data = JSON.parse(resultText) as DeepSeekChatResponse;
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content ?? '';
        }
      }
      if (content.length === 0) {
        throw new Error('API returned an empty response');
      }
      return JSON.stringify({ ok: true, content: content });
    } catch (error) {
      return JSON.stringify({ ok: false, error: String(error) });
    } finally {
      request.destroy();
    }
  }

  private cloudCodeSSEBuffer: Map<string, string> = new Map<string, string>();
  private cloudCodeResponseText: Map<string, string> = new Map<string, string>();
  private cloudCodeFailedSessions: Set<string> = new Set<string>();

  private getCloudCodeApiKeySync(): string {
    try {
      if (this.appContext === undefined) {
        return DEEPSEEK_API_KEY;
      }
      const store = preferences.getPreferencesSync(this.appContext, { name: CLOUD_CODE_PREFERENCES });
      const stored: string = store.getSync(CLOUD_CODE_API_KEY_PREF, '') as string;
      return stored.length > 0 ? stored : DEEPSEEK_API_KEY;
    } catch (error) {
      console.error(`[CloudCode] Unable to read API key, using default: ${String(error)}`);
      return DEEPSEEK_API_KEY;
    }
  }

  private getCloudCodeApiKey(): string {
    return this.getCloudCodeApiKeySync();
  }

  private setCloudCodeApiKey(apiKey: string): void {
    try {
      if (this.appContext === undefined) {
        return;
      }
      const store = preferences.getPreferencesSync(this.appContext, { name: CLOUD_CODE_PREFERENCES });
      store.putSync(CLOUD_CODE_API_KEY_PREF, apiKey);
      store.flushSync();
    } catch (error) {
      console.error(`[CloudCode] Unable to persist API key: ${String(error)}`);
    }
  }

  private getCloudCodeModels(): string {
    try {
      if (this.appContext === undefined) {
        return '[]';
      }
      const store = preferences.getPreferencesSync(this.appContext, { name: CLOUD_CODE_PREFERENCES });
      return store.getSync(CLOUD_CODE_MODELS_PREF, '[]') as string;
    } catch (error) {
      console.error(`[CloudCode] Unable to read model configurations: ${String(error)}`);
      return '[]';
    }
  }

  private setCloudCodeModels(modelsJson: string): boolean {
    try {
      const models = JSON.parse(modelsJson) as Array<CloudCodeModelProfile>;
      if (!Array.isArray(models) || !models.every((model: CloudCodeModelProfile): boolean => {
        const endpoint: string = (model.apiUrl ?? '').trim().replace(/\/+$/, '');
        const providerEndpoint: string = this.cloudCodeProviderApiUrl(model.provider ?? '');
        return typeof model.id === 'string' && model.id.trim().length > 0 &&
          typeof model.name === 'string' && model.name.trim().length > 0 &&
          providerEndpoint.length > 0 && endpoint === providerEndpoint &&
          model.apiFormat === 'openai' && ALLOWED_CLOUD_CODE_API_URLS.includes(endpoint);
      })) {
        throw new Error('Unsupported Cloud Code model configuration');
      }
      if (this.appContext === undefined) {
        return false;
      }
      const store = preferences.getPreferencesSync(this.appContext, { name: CLOUD_CODE_PREFERENCES });
      store.putSync(CLOUD_CODE_MODELS_PREF, modelsJson);
      store.flushSync();
      return true;
    } catch (error) {
      console.error(`[CloudCode] Unable to persist model configurations: ${String(error)}`);
      return false;
    }
  }

  private pushCloudCodeStreamEvent(event: CloudCodeStreamEvent): void {
    try {
      const json: string = JSON.stringify(event);
      const script: string = `try { window.__xingzhiCloudCodeEvent && window.__xingzhiCloudCodeEvent(${json}); } catch (e) {} true;`;
      this.controller.runJavaScript(script).catch((error: Error) => {
        console.error(`[CloudCode] runJavaScript failed: ${String(error)}`);
      });
    } catch (error) {
      console.error(`[CloudCode] push event failed: ${String(error)}`);
    }
  }

  private processCloudCodeSSE(sessionId: string, chunk: string): void {
    const normalizedChunk: string = chunk.replace(/\r\n/g, '\n');
    const buffered: string = (this.cloudCodeSSEBuffer.get(sessionId) ?? '') + normalizedChunk;
    let remaining: string = buffered;
    while (true) {
      const boundary: number = remaining.indexOf('\n\n');
      if (boundary < 0) {
        break;
      }
      const eventText: string = remaining.substring(0, boundary);
      remaining = remaining.substring(boundary + 2);
      const dataLines: Array<string> = [];
      const lines: Array<string> = eventText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line: string = lines[i];
        if (line.startsWith('data:')) {
          dataLines.push(line.substring(5).trim());
        }
      }
      if (dataLines.length === 0) {
        continue;
      }
      const dataStr: string = dataLines.join('\n');
      if (dataStr === '[DONE]') {
        continue;
      }
      try {
        const parsed = JSON.parse(dataStr) as DeepSeekStreamChunk;
        if (parsed.choices !== undefined && parsed.choices.length > 0 &&
            parsed.choices[0].delta !== undefined) {
          const delta: string = parsed.choices[0].delta.content ?? '';
          const reasoning: string = parsed.choices[0].delta.reasoning_content ?? '';
          if (reasoning.length > 0) {
            this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'reasoning', content: reasoning });
          }
          if (delta.length > 0) {
            this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'chunk', content: delta });
          }
        }
      } catch (error) {
        // OpenAI-compatible parsing did not match; try Anthropic Messages SSE.
      }
      try {
        const anthropic = JSON.parse(dataStr) as AnthropicStreamChunk;
        if (anthropic.type === 'error') {
          const message: string = anthropic.error?.message ?? 'Anthropic-compatible API returned an error';
          this.cloudCodeFailedSessions.add(sessionId);
          this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'error', error: message });
        } else if (anthropic.type === 'content_block_delta' && anthropic.delta !== undefined) {
          const deltaType: string = anthropic.delta.type ?? '';
          if (deltaType === 'thinking_delta' && anthropic.delta.thinking !== undefined) {
            this.pushCloudCodeStreamEvent({
              sessionId: sessionId,
              type: 'reasoning',
              content: anthropic.delta.thinking
            });
          } else if (deltaType === 'text_delta' && anthropic.delta.text !== undefined) {
            this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'chunk', content: anthropic.delta.text });
          }
        }
      } catch (error) {
        // Ignore SSE frames that do not contain JSON data.
      }
    }
    this.cloudCodeSSEBuffer.set(sessionId, remaining);
  }

  private async cloudCodeChatStream(payloadJson: string): Promise<string> {
    const request = http.createHttp();
    try {
      await this.ensureCloudCodeSignedIn();
      const payload = JSON.parse(payloadJson) as DeepSeekChatRequest;
      const sessionId: string = payload.sessionId !== undefined && payload.sessionId.length > 0
        ? payload.sessionId
        : `cc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const messages: Array<DeepSeekMessage> = payload.messages ?? [];
      if (messages.length === 0) {
        return JSON.stringify({ ok: false, error: 'No messages were provided to Cloud Code' });
      }
      const apiFormat: string = this.resolveCloudCodeFormat(payload);
      const endpoint: string = this.resolveCloudCodeEndpoint(payload, apiFormat);
      const body: string = this.buildCloudCodeBody(payload, apiFormat, true);
      this.cloudCodeSSEBuffer.set(sessionId, '');
      this.cloudCodeResponseText.set(sessionId, '');
      this.cloudCodeFailedSessions.delete(sessionId);

      request.on('dataReceive', (data: ArrayBuffer) => {
        try {
          const text: string = util.TextDecoder.create('utf-8').decodeToString(new Uint8Array(data));
          const responseText: string = (this.cloudCodeResponseText.get(sessionId) ?? '') + text;
          this.cloudCodeResponseText.set(sessionId, responseText.substring(0, 4096));
          this.processCloudCodeSSE(sessionId, text);
        } catch (error) {
          console.error(`[CloudCode] stream decode failed: ${String(error)}`);
        }
      });
      request.on('dataEnd', () => {
        // Flush a final SSE frame even when the server closes the stream
        // without an extra blank line after the last data event.
        this.processCloudCodeSSE(sessionId, '\n\n');
        if (!this.cloudCodeFailedSessions.has(sessionId)) {
          this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'done' });
        }
        this.cloudCodeSSEBuffer.delete(sessionId);
        this.cloudCodeResponseText.delete(sessionId);
        this.cloudCodeFailedSessions.delete(sessionId);
        request.destroy();
      });

      request.requestInStream(endpoint, {
        method: http.RequestMethod.POST,
        header: this.getCloudCodeHeaders(apiFormat, payload),
        extraData: body,
        expectDataType: http.HttpDataType.STRING,
        connectTimeout: 60000,
        readTimeout: 180000
      }).then((statusCode: number) => {
        if (statusCode < 200 || statusCode >= 300) {
          const responseText: string = (this.cloudCodeResponseText.get(sessionId) ?? '').trim();
          const details: string = responseText.length > 0 ? `: ${responseText}` : '';
          this.cloudCodeFailedSessions.add(sessionId);
          this.pushCloudCodeStreamEvent({
            sessionId: sessionId,
            type: 'error',
            error: `API returned HTTP ${statusCode}${details}`
          });
          request.destroy();
        }
      }).catch((error: Error) => {
        this.cloudCodeFailedSessions.add(sessionId);
        this.pushCloudCodeStreamEvent({ sessionId: sessionId, type: 'error', error: String(error) });
        request.destroy();
      });

      return JSON.stringify({ ok: true, sessionId: sessionId });
    } catch (error) {
      return JSON.stringify({ ok: false, error: String(error) });
    }
  }

  private isSafeExtensionResource(relativeUrl: string): boolean {
    if (relativeUrl.length === 0 || relativeUrl.indexOf('\\') >= 0 || relativeUrl.indexOf('\0') >= 0) {
      return false;
    }
    const pathOnly: string = relativeUrl.split(/[?#]/)[0];
    const allowedRootFile: boolean = pathOnly === 'registry.json' ||
      pathOnly === 'registry_version.json' || pathOnly === 'popularity.json';
    const allowedZip: boolean = pathOnly.startsWith('extensions/') && pathOnly.toLowerCase().endsWith('.zip');
    return (allowedRootFile || allowedZip) && !pathOnly.split('/').includes('..');
  }

  private extensionCloudPath(relativeUrl: string): string {
    const pathOnly: string = relativeUrl.split(/[?#]/)[0];
    if (pathOnly === 'registry.json' || pathOnly === 'registry_version.json' || pathOnly === 'popularity.json') {
      return `registry/${pathOnly}`;
    }
    return pathOnly;
  }

  /**
   * Keep the curated catalog and every matching ZIP package inside the HAP. Cloud Storage remains
   * a fallback only for a future package version that is not part of the installed application.
   */
  private readPackagedExtensionResource(relativeUrl: string): ArrayBuffer | undefined {
    const pathOnly: string = relativeUrl.split(/[?#]/)[0];
    let rawPath: string;
    if (pathOnly === 'registry.json' || pathOnly === 'registry_version.json' || pathOnly === 'popularity.json') {
      rawPath = `weavecode/extensions/registry/${pathOnly}`;
    } else if (pathOnly.startsWith('extensions/') && pathOnly.toLowerCase().endsWith('.zip') &&
      pathOnly.indexOf('/', 'extensions/'.length) < 0) {
      rawPath = `weavecode/extensions/packages/${pathOnly.substring('extensions/'.length)}`;
    } else {
      return undefined;
    }
    if (this.appContext === undefined) {
      return undefined;
    }
    try {
      const rawData: Uint8Array = this.appContext.resourceManager
        .getRawFileContentSync(rawPath);
      return rawData.buffer as ArrayBuffer;
    } catch (error) {
      console.info(`[XingzhiExtensionProxy] Packaged resource unavailable: ${pathOnly}: ${String(error)}`);
      return undefined;
    }
  }

  private buildWeaveResponse(url: string): WebResourceResponse {
    const response: WebResourceResponse = new WebResourceResponse();
    let responseData: string | ArrayBuffer = 'Weave resource was not found.';
    let responseMime: string = 'text/plain';
    let responseCode: number = 404;
    let relativePath: string = 'index.html';

    try {
      const urlPath: string = url.substring(WEAVE_ORIGIN.length).split(/[?#]/)[0];
      relativePath = decodeURIComponent(urlPath.length > 0 ? urlPath : 'index.html');
      if (!this.isSafeWeavePath(relativePath)) {
        throw new Error('Unsafe Weave resource path');
      }
      if (this.appContext === undefined) {
        throw new Error('Application context is unavailable');
      }

      const rawData: Uint8Array = this.appContext.resourceManager
        .getRawFileContentSync(`weavecode/${relativePath}`);
      responseData = rawData.buffer as ArrayBuffer;
      responseMime = this.mimeType(relativePath);
      responseCode = 200;
    } catch (error) {
      responseData = `Weave resource not found: ${relativePath}`;
      responseMime = 'text/plain';
      responseCode = 404;
      console.error(`Unable to load Weave resource ${relativePath}: ${String(error)}`);
    }

    response.setResponseData(responseData);
    response.setResponseEncoding('utf-8');
    response.setResponseMimeType(responseMime);
    response.setResponseCode(responseCode);
    response.setReasonMessage(responseCode === 200 ? 'OK' : 'Not Found');
    response.setResponseHeader([
      { headerKey: 'Access-Control-Allow-Origin', headerValue: '*' },
      { headerKey: 'Cache-Control', headerValue: this.cacheControl(relativePath) }
    ]);
    response.setResponseIsReady(true);
    return response;
  }

  private isBlockedUpstreamUrl(url: string): boolean {
    const lowerUrl: string = url.toLowerCase();
    if (!lowerUrl.startsWith('https://') && !lowerUrl.startsWith('http://')) {
      return false;
    }
    const schemeEnd: number = lowerUrl.indexOf('://') + 3;
    let authorityEnd: number = lowerUrl.length;
    for (const separator of ['/', '?', '#']) {
      const index: number = lowerUrl.indexOf(separator, schemeEnd);
      if (index >= 0 && index < authorityEnd) {
        authorityEnd = index;
      }
    }
    let authority: string = lowerUrl.substring(schemeEnd, authorityEnd);
    const credentialsEnd: number = authority.lastIndexOf('@');
    if (credentialsEnd >= 0) {
      authority = authority.substring(credentialsEnd + 1);
    }
    const host: string = authority.split(':')[0];
    for (const blockedHost of BLOCKED_UPSTREAM_HOSTS) {
      if (host === blockedHost || host.endsWith(`.${blockedHost}`)) {
        return true;
      }
    }
    return false;
  }

  private buildBlockedUpstreamResponse(): WebResourceResponse {
    const response: WebResourceResponse = new WebResourceResponse();
    response.setResponseData('');
    response.setResponseEncoding('utf-8');
    response.setResponseMimeType('text/plain');
    response.setResponseCode(204);
    response.setReasonMessage('No Content');
    response.setResponseHeader([
      { headerKey: 'Cache-Control', headerValue: 'no-store' }
    ]);
    response.setResponseIsReady(true);
    return response;
  }

  private isSafeWeavePath(path: string): boolean {
    if (path.length === 0 || path.startsWith('/') || path.indexOf('\\') >= 0 || path.indexOf('\0') >= 0) {
      return false;
    }
    const segments: string[] = path.split('/');
    for (const segment of segments) {
      if (segment.length === 0 || segment === '.' || segment === '..') {
        return false;
      }
    }
    return true;
  }

  private cacheControl(path: string): string {
    // JS/CSS are rebuilt in-place during development; force revalidation so the
    // WebView and its service worker never serve stale extension code.
    if (path === 'index.html' || path.endsWith('.json') ||
        path.endsWith('.js') || path.endsWith('.css')) {
      return 'no-cache';
    }
    return 'public, max-age=31536000, immutable';
  }

  private mimeType(path: string): string {
    const lower: string = path.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
    if (lower.endsWith('.css')) return 'text/css';
    if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript';
    if (lower.endsWith('.json') || lower.endsWith('.map')) return 'application/json';
    if (lower.endsWith('.wasm')) return 'application/wasm';
    if (lower.endsWith('.xml')) return 'application/xml';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.ico')) return 'image/x-icon';
    if (lower.endsWith('.woff2')) return 'font/woff2';
    if (lower.endsWith('.woff')) return 'font/woff';
    if (lower.endsWith('.ttf')) return 'font/ttf';
    if (lower.endsWith('.otf')) return 'font/otf';
    if (lower.endsWith('.eot')) return 'application/vnd.ms-fontobject';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.md') || lower.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
  }
}
