import { common } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { http } from '@kit.NetworkKit';

const ACCOUNT_API_BASE_URL: string = 'https://adminweavecode.dhuzcs.com/api/';
const ACCOUNT_PREFERENCES: string = 'weave_code_account';
const ACCOUNT_TOKEN_KEY: string = 'account_token';

interface AccountApiUser {
  userId?: string;
  phone?: string;
  email?: string;
  displayName?: string;
  isVip?: boolean;
  plan?: string;
  vipType?: string;
  vipStartedAt?: number;
  vipExpiresAt?: number;
  vipRemainingDays?: number;
  status?: string;
}

interface AccountApiResponse {
  success?: boolean | string | number;
  code?: string;
  message?: string;
  token?: string;
  challengeId?: string;
  challenge_id?: string;
  expiresIn?: number;
  expires_in?: number;
  retryAfter?: number;
  retry_after?: number;
  user?: AccountApiUser;
  developerPayload?: string;
  applicationUserName?: string;
  processedCount?: number;
}

interface AccountRequestPayload {
  phone?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  purpose?: string;
  challengeId?: string;
  verificationCode?: string;
}

interface AccountHeaders {
  'Content-Type': string;
  Authorization?: string;
}

interface AccountActionResult {
  success: boolean;
  code: string;
  message?: string;
  challengeId?: string;
  expiresIn?: number;
  retryAfter?: number;
  snapshot?: WeaveAccountSnapshot;
}

export interface WeaveAccountSnapshot {
  signedIn: boolean;
  anonymous: boolean;
  userId: string;
  phone: string;
  email: string;
  displayName: string;
  photoUrl: string;
  providerId: string;
  isVip: boolean;
  plan: string;
  vipType: string;
  vipStartedAt: number;
  vipExpiresAt: number;
  vipRemainingDays: number;
  databaseReady: boolean;
  error: string;
}

export interface WeaveIapServerResponse {
  success: boolean;
  code: string;
  message: string;
  developerPayload: string;
  applicationUserName: string;
  processedCount: number;
}

export class WeaveAccountService {
  static async getSnapshot(context: common.UIAbilityContext): Promise<WeaveAccountSnapshot> {
    const token: string = WeaveAccountService.readToken(context);
    if (token.length === 0) {
      return WeaveAccountService.guestSnapshot('');
    }
    try {
      const response: AccountApiResponse = await WeaveAccountService.request('me.php', http.RequestMethod.GET, '', token);
      if (!WeaveAccountService.apiSucceeded(response.success) || response.user === undefined) {
        await WeaveAccountService.clearToken(context);
        return WeaveAccountService.guestSnapshot(WeaveAccountService.messageForCode(response.code ?? 'invalid_token'));
      }
      return WeaveAccountService.snapshotForUser(response.user);
    } catch (error) {
      // Network failures do not grant stale VIP rights. Keep the session token so
      // the next foreground refresh can validate it again.
      return WeaveAccountService.guestSnapshot(`账号服务连接失败：${String(error)}`);
    }
  }

  static async perform(context: common.UIAbilityContext, action: string, payloadJson: string): Promise<string> {
    try {
      const payload: AccountRequestPayload = payloadJson.length > 0
        ? JSON.parse(payloadJson) as AccountRequestPayload : {};
      if (action === 'login') {
        return JSON.stringify(await WeaveAccountService.login(context, payload));
      }
      if (action === 'register') {
        return JSON.stringify(await WeaveAccountService.register(payload));
      }
      if (action === 'sendCode') {
        return JSON.stringify(await WeaveAccountService.sendCode(payload));
      }
      if (action === 'resetPassword') {
        return JSON.stringify(await WeaveAccountService.resetPassword(payload));
      }
      if (action === 'changePassword') {
        return JSON.stringify(await WeaveAccountService.changePassword(context, payload));
      }
      if (action === 'logout') {
        return JSON.stringify(await WeaveAccountService.logout(context));
      }
      return JSON.stringify({ success: false, code: 'invalid_action', message: '不支持的账号操作' });
    } catch (error) {
      return JSON.stringify({ success: false, code: 'network_error', message: `账号服务请求失败：${String(error)}` });
    }
  }

  static async requestIap(context: common.UIAbilityContext, path: string,
    payloadJson: string): Promise<WeaveIapServerResponse> {
    const token: string = WeaveAccountService.readToken(context);
    if (token.length === 0) {
      return {
        success: false, code: 'sign_in_required', message: '购买或恢复 VIP 前请先登录织码账号',
        developerPayload: '', applicationUserName: '', processedCount: 0
      };
    }
    const allowedPaths: Array<string> = ['iap_prepare.php', 'iap_complete.php', 'iap_reconcile.php'];
    if (!allowedPaths.includes(path)) {
      return {
        success: false, code: 'invalid_action', message: '不支持的购买请求',
        developerPayload: '', applicationUserName: '', processedCount: 0
      };
    }
    const response: AccountApiResponse = await WeaveAccountService.request(
      path, http.RequestMethod.POST, payloadJson, token
    );
    const success: boolean = WeaveAccountService.apiSucceeded(response.success);
    return {
      success: success,
      code: response.code ?? (success ? 'ok' : 'server_error'),
      message: response.message ?? (success ? '购买信息已核验' :
        WeaveAccountService.messageForCode(response.code ?? 'server_error')),
      developerPayload: response.developerPayload ?? '',
      applicationUserName: response.applicationUserName ?? '',
      processedCount: response.processedCount ?? 0
    };
  }

  private static async login(context: common.UIAbilityContext,
    payload: AccountRequestPayload): Promise<AccountActionResult> {
    const response: AccountApiResponse = await WeaveAccountService.request(
      'login.php', http.RequestMethod.POST,
      JSON.stringify({ phone: payload.phone ?? '', password: payload.password ?? '' }), ''
    );
    return await WeaveAccountService.persistAuthenticatedResponse(context, response);
  }

  private static async register(payload: AccountRequestPayload): Promise<AccountActionResult> {
    const response: AccountApiResponse = await WeaveAccountService.request(
      'register.php', http.RequestMethod.POST,
      JSON.stringify({
        phone: payload.phone ?? '', email: payload.email ?? '', password: payload.password ?? '',
        challengeId: payload.challengeId ?? '', verificationCode: payload.verificationCode ?? ''
      }), ''
    );
    const success: boolean = WeaveAccountService.apiSucceeded(response.success);
    return {
      success: success,
      code: response.code ?? 'server_error',
      message: success ? '注册成功，请登录' : WeaveAccountService.messageForCode(response.code ?? 'server_error')
    };
  }

  private static async sendCode(payload: AccountRequestPayload): Promise<AccountActionResult> {
    const response: AccountApiResponse = await WeaveAccountService.request(
      'send_verification_code.php', http.RequestMethod.POST,
      JSON.stringify({ phone: payload.phone ?? '', purpose: payload.purpose ?? '' }), ''
    );
    const challengeId: string = response.challengeId ?? response.challenge_id ?? '';
    const success: boolean = WeaveAccountService.apiSucceeded(response.success) && challengeId.length > 0;
    return {
      success: success,
      code: success ? 'ok' : (response.code ?? 'server_error'),
      message: success ? '验证码已发送' : WeaveAccountService.messageForCode(response.code ?? 'server_error'),
      challengeId: challengeId,
      expiresIn: response.expiresIn ?? response.expires_in ?? 0,
      retryAfter: response.retryAfter ?? response.retry_after ?? 60
    };
  }

  private static async resetPassword(payload: AccountRequestPayload): Promise<AccountActionResult> {
    const response: AccountApiResponse = await WeaveAccountService.request(
      'reset_password.php', http.RequestMethod.POST,
      JSON.stringify({
        phone: payload.phone ?? '', newPassword: payload.newPassword ?? '',
        challengeId: payload.challengeId ?? '', verificationCode: payload.verificationCode ?? ''
      }), ''
    );
    return {
      success: WeaveAccountService.apiSucceeded(response.success),
      code: response.code ?? 'server_error',
      message: WeaveAccountService.apiSucceeded(response.success) ? '密码已重置，请重新登录' :
        WeaveAccountService.messageForCode(response.code ?? 'server_error')
    };
  }

  private static async changePassword(context: common.UIAbilityContext,
    payload: AccountRequestPayload): Promise<AccountActionResult> {
    const token: string = WeaveAccountService.readToken(context);
    if (token.length === 0) {
      return { success: false, code: 'sign_in_required', message: '请先登录织码账号' };
    }
    const response: AccountApiResponse = await WeaveAccountService.request(
      'change_password.php', http.RequestMethod.POST,
      JSON.stringify({
        currentPassword: payload.currentPassword ?? '',
        newPassword: payload.newPassword ?? ''
      }), token
    );
    const success: boolean = WeaveAccountService.apiSucceeded(response.success);
    return {
      success: success,
      code: response.code ?? 'server_error',
      message: success ? '密码已修改' : WeaveAccountService.messageForCode(response.code ?? 'server_error'),
      snapshot: success && response.user !== undefined
        ? WeaveAccountService.snapshotForUser(response.user) : undefined
    };
  }

  private static async logout(context: common.UIAbilityContext): Promise<AccountActionResult> {
    const token: string = WeaveAccountService.readToken(context);
    try {
      if (token.length > 0) {
        await WeaveAccountService.request('logout.php', http.RequestMethod.POST, '{}', token);
      }
    } finally {
      await WeaveAccountService.clearToken(context);
    }
    return { success: true, code: 'ok', snapshot: WeaveAccountService.guestSnapshot('') };
  }

  private static async persistAuthenticatedResponse(context: common.UIAbilityContext,
    response: AccountApiResponse): Promise<AccountActionResult> {
    if (!WeaveAccountService.apiSucceeded(response.success) || response.token === undefined ||
      response.user === undefined) {
      return {
        success: false,
        code: response.code ?? 'server_error',
        message: WeaveAccountService.messageForCode(response.code ?? 'server_error')
      };
    }
    const store = preferences.getPreferencesSync(context, { name: ACCOUNT_PREFERENCES });
    store.putSync(ACCOUNT_TOKEN_KEY, response.token);
    await store.flush();
    return {
      success: true,
      code: 'ok',
      message: '登录成功',
      snapshot: WeaveAccountService.snapshotForUser(response.user)
    };
  }

  private static readToken(context: common.UIAbilityContext): string {
    const store = preferences.getPreferencesSync(context, { name: ACCOUNT_PREFERENCES });
    const value: preferences.ValueType = store.getSync(ACCOUNT_TOKEN_KEY, '');
    return typeof value === 'string' ? value : '';
  }

  private static async clearToken(context: common.UIAbilityContext): Promise<void> {
    const store = preferences.getPreferencesSync(context, { name: ACCOUNT_PREFERENCES });
    store.deleteSync(ACCOUNT_TOKEN_KEY);
    await store.flush();
  }

  private static async request(path: string, method: http.RequestMethod, body: string,
    token: string): Promise<AccountApiResponse> {
    const client = http.createHttp();
    const headers: AccountHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
    if (token.length > 0) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response: http.HttpResponse = await client.request(`${ACCOUNT_API_BASE_URL}${path}`, {
        method: method,
        header: headers,
        extraData: body,
        expectDataType: http.HttpDataType.STRING,
        connectTimeout: 15000,
        readTimeout: 20000
      });
      const text: string = response.result as string;
      let parsedValue: AccountApiResponse | string = JSON.parse(text) as AccountApiResponse | string;
      if (typeof parsedValue === 'string') {
        parsedValue = JSON.parse(parsedValue) as AccountApiResponse;
      }
      const parsed: AccountApiResponse = parsedValue as AccountApiResponse;
      if (Number(response.responseCode) < 200 || Number(response.responseCode) >= 300) {
        return parsed;
      }
      return parsed;
    } finally {
      client.destroy();
    }
  }

  private static apiSucceeded(value: boolean | string | number | undefined): boolean {
    return value === true || value === 'true' || value === 1;
  }

  private static snapshotForUser(user: AccountApiUser): WeaveAccountSnapshot {
    const isVip: boolean = user.isVip === true;
    let plan: string = isVip ? (user.plan ?? 'lifetime').toLowerCase() : 'free';
    if (plan === 'subscription') {
      plan = 'monthly';
    }
    let vipType: string = isVip ? (user.vipType ?? '').toLowerCase() : 'free';
    if (isVip && vipType !== 'trial' && vipType !== 'subscription' && vipType !== 'lifetime') {
      if (plan === 'trial') {
        vipType = 'trial';
      } else if (plan === 'monthly') {
        vipType = 'subscription';
      } else if (plan === 'lifetime' || plan === 'vip') {
        vipType = 'lifetime';
      } else {
        vipType = (user.vipExpiresAt ?? 0) > 0 ? 'subscription' : 'lifetime';
      }
    }
    return {
      signedIn: true,
      anonymous: false,
      userId: user.userId ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      displayName: user.displayName ?? user.phone ?? '',
      photoUrl: '',
      providerId: 'weave-code',
      isVip: isVip,
      plan: plan,
      vipType: vipType,
      vipStartedAt: user.vipStartedAt ?? 0,
      vipExpiresAt: user.vipExpiresAt ?? 0,
      vipRemainingDays: user.vipRemainingDays ?? 0,
      databaseReady: true,
      error: ''
    };
  }

  private static guestSnapshot(error: string): WeaveAccountSnapshot {
    return {
      signedIn: false, anonymous: true, userId: '', phone: '', email: '', displayName: '',
      photoUrl: '', providerId: 'weave-code', isVip: false, plan: 'free', vipType: 'free',
      vipStartedAt: 0, vipExpiresAt: 0, vipRemainingDays: 0,
      databaseReady: error.length === 0, error: error
    };
  }

  private static messageForCode(code: string): string {
    if (code === 'invalid_credentials') return '手机号或密码错误';
    if (code === 'invalid_current_password') return '当前密码不正确';
    if (code === 'password_unchanged') return '新密码不能与当前密码相同';
    if (code === 'invalid_input') return '请检查手机号、密码或验证码格式';
    if (code === 'account_exists') return '该手机号已经注册';
    if (code === 'account_not_found') return '该手机号尚未注册';
    if (code === 'invalid_verification_code') return '验证码错误';
    if (code === 'verification_expired') return '验证码已过期，请重新获取';
    if (code === 'rate_limited') return '操作过于频繁，请稍后重试';
    if (code === 'account_closed') return '该账号已被停用';
    if (code === 'sms_unavailable') return '短信服务暂时不可用';
    if (code === 'invalid_token' || code === 'unauthorized') return '登录状态已失效，请重新登录';
    if (code === 'sign_in_required') return '购买或恢复 VIP 前请先登录织码账号';
    if (code === 'iap_not_configured') return 'VIP 服务尚未完成服务器配置';
    if (code === 'invalid_product') return '该 VIP 商品不可用';
    if (code === 'purchase_not_verified') return '华为订单尚未通过核验，请稍后重试';
    return '服务器暂时无法完成请求';
  }
}
