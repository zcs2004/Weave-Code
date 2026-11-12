(function () {
    "use strict";

    const english = {
        WEAVE_ACCOUNT_BUTTON: "Account",
        WEAVE_ACCOUNT_CENTER_TITLE: "Account center",
        WEAVE_ACCOUNT_INFO_TITLE: "Account information",
        WEAVE_ACCOUNT_USER_FALLBACK: "Weave Code user",
        WEAVE_ACCOUNT_PHONE_LABEL: "Mobile number",
        WEAVE_ACCOUNT_EMAIL_LABEL: "Email",
        WEAVE_ACCOUNT_EMAIL_NOT_SET: "Not set",
        WEAVE_MEMBERSHIP_TITLE: "Membership benefits",
        WEAVE_MEMBERSHIP_FREE: "Standard account",
        WEAVE_MEMBERSHIP_TRIAL: "Trial VIP",
        WEAVE_MEMBERSHIP_MONTHLY: "Monthly VIP",
        WEAVE_MEMBERSHIP_LIFETIME: "Lifetime VIP",
        WEAVE_MEMBERSHIP_PLAN_FREE: "Standard user",
        WEAVE_MEMBERSHIP_PLAN_TRIAL: "7-day trial VIP",
        WEAVE_MEMBERSHIP_PLAN_MONTHLY: "Monthly VIP",
        WEAVE_MEMBERSHIP_PLAN_LIFETIME: "Lifetime VIP",
        WEAVE_MEMBERSHIP_PLAN_LABEL: "Current plan",
        WEAVE_MEMBERSHIP_EXPIRY_LABEL: "Valid until",
        WEAVE_MEMBERSHIP_LIFETIME_VALID: "Lifetime",
        WEAVE_MEMBERSHIP_DAYS_REMAINING: "{0} days remaining",
        WEAVE_MEMBERSHIP_BENEFITS_TITLE: "VIP-only features",
        WEAVE_MEMBERSHIP_BENEFIT_VISUAL_EDIT: "Live visual web editing",
        WEAVE_MEMBERSHIP_BENEFIT_LAYOUT: "Element layout and measurement inspection",
        WEAVE_MEMBERSHIP_BENEFIT_MARKDOWN: "Rich Markdown editing and export",
        WEAVE_MEMBERSHIP_BENEFIT_CODE_INTELLIGENCE: "Enhanced code intelligence and diagnostics",
        WEAVE_MEMBERSHIP_HINT_LIFETIME: "Lifetime VIP is active. No further VIP purchase is needed.",
        WEAVE_MEMBERSHIP_HINT_MONTHLY: "Manage or cancel this subscription in Huawei payment's subscription management. Cancelling only stops the next renewal; current benefits remain available until expiry.",
        WEAVE_MEMBERSHIP_HINT_TRIAL: "Unused trial time is carried over when you start a monthly VIP subscription.",
        WEAVE_MEMBERSHIP_HINT_FREE: "Subscribe to VIP to unlock all VIP-only features.",
        WEAVE_MEMBERSHIP_MANAGE_TITLE: "Manage subscription with Huawei",
        WEAVE_MEMBERSHIP_MANAGE_DESC: "Open Huawei subscription management to change or cancel auto-renewal",
        WEAVE_MEMBERSHIP_VIEW_PLANS: "View VIP plans",
        WEAVE_MEMBERSHIP_VIEW_PLANS_DESC: "Choose monthly VIP or a one-time lifetime purchase",
        WEAVE_MEMBERSHIP_UPGRADE_LIFETIME: "Upgrade to lifetime VIP",
        WEAVE_MEMBERSHIP_MONTHLY_ACTIVE_DESC: "Monthly VIP cannot be purchased again while active",
        WEAVE_MEMBERSHIP_TRIAL_CARRYOVER_DESC: "Your unused trial time will not be lost",
        WEAVE_MEMBERSHIP_ALREADY_LIFETIME: "You are a lifetime VIP",
        WEAVE_ACCOUNT_MANAGEMENT_TITLE: "Account management",
        WEAVE_ACCOUNT_CHANGE_PASSWORD: "Change password",
        WEAVE_ACCOUNT_LOGOUT_ACCOUNT: "Sign out account",
        WEAVE_ACCOUNT_PASSWORD_MINIMUM: "The new password must be at least 8 characters",
        WEAVE_ACCOUNT_CURRENT_PASSWORD: "Current password",
        WEAVE_ACCOUNT_NEW_PASSWORD: "New password",
        WEAVE_ACCOUNT_CONFIRM_NEW_PASSWORD: "Confirm new password",
        WEAVE_ACCOUNT_CONFIRM_CHANGE_PASSWORD: "Change password",
        WEAVE_ACCOUNT_BACK_TO_SUMMARY: "Back to account center",
        WEAVE_ACCOUNT_PASSWORD_MISMATCH_CENTER: "The two new passwords do not match",
        WEAVE_ACCOUNT_PASSWORD_CHANGING: "Changing password…",
        WEAVE_ACCOUNT_PASSWORD_CHANGED: "Password changed",
        WEAVE_ACCOUNT_PASSWORD_CHANGE_FAILED: "Unable to change password",
        WEAVE_ACCOUNT_CURRENT_PASSWORD_INVALID: "The current password is incorrect",
        WEAVE_ACCOUNT_PASSWORD_UNCHANGED: "The new password must be different from the current password",
        WEAVE_ACCOUNT_SHOW_PASSWORD_CENTER: "Show password",
        WEAVE_ACCOUNT_HIDE_PASSWORD_CENTER: "Hide password",
        WEAVE_SUBSCRIPTION_OPENING: "Opening Huawei subscription management…",
        WEAVE_SUBSCRIPTION_OPENED: "Huawei subscription management opened",
        WEAVE_SUBSCRIPTION_OPEN_FAILED: "Unable to open subscription management",
        WEAVE_IAP_TITLE: "Weave Code VIP",
        WEAVE_IAP_LOADING: "Loading products…",
        WEAVE_IAP_BUY: "Buy now",
        WEAVE_IAP_CLOSE: "Close",
        WEAVE_IAP_AGREEMENT_PREFIX: "Check to agree to the",
        WEAVE_IAP_AGREEMENT_LINK: "Personal Subscription Service Agreement",
        WEAVE_IAP_AGREEMENT_REQUIRED: "Please agree to the Personal Subscription Service Agreement before purchasing.",
        WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Unable to open the Personal Subscription Service Agreement.",
        WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Purchase completed",
        WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "You have purchased Lifetime VIP. If you previously subscribed to Monthly VIP, please manage that subscription through Huawei Payments to avoid unnecessary charges.",
        WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Got it",
        WEAVE_IAP_SIGN_IN: "Sign in to your Weave Code account before purchasing VIP.",
        WEAVE_IAP_NO_PRODUCTS: "No VIP products are available right now. Please try again later.",
        WEAVE_IAP_PURCHASING: "Opening Huawei checkout…",
        WEAVE_IAP_SUCCESS: "VIP has been synchronized to this Weave Code account.",
        WEAVE_IAP_MONTHLY: "Renews monthly. Manage or cancel it in Huawei subscription management; access remains available until the current period ends.",
        WEAVE_IAP_LIFETIME: "One-time purchase with permanent access for this Weave Code account.",
        WEAVE_IAP_NOTE: "Unused trial time carries over after the first monthly period.",
        WEAVE_IAP_NATIVE_ONLY: "In-app purchases are only available in the HarmonyOS app",
        WEAVE_IAP_MONTHLY_FALLBACK: "Monthly VIP",
        WEAVE_IAP_LIFETIME_FALLBACK: "Lifetime VIP",
        WEAVE_IAP_CANCELLED: "Purchase cancelled",
        WEAVE_IAP_ALREADY_OWNED: "You already own this product",
        WEAVE_IAP_LIFETIME_ACTIVE: "You are already a lifetime VIP",
        WEAVE_IAP_MONTHLY_ACTIVE: "Monthly VIP is already active and cannot be purchased again",
        WEAVE_IAP_NETWORK_ERROR: "Unable to connect to Huawei In-App Purchases",
        WEAVE_IAP_HUAWEI_SIGN_IN: "Sign in to your Huawei account first",
        WEAVE_IAP_AUTHORIZATION_ERROR: "The app is not authorized for Huawei In-App Purchases",
        WEAVE_IAP_REGION_ERROR: "Huawei In-App Purchases is not available in the current account region",
        WEAVE_IAP_INVALID_PRODUCT: "This VIP product is unavailable",
        WEAVE_IAP_INVALID_ACTION: "This purchase action is not supported",
        WEAVE_IAP_NO_ACTIVE_SUBSCRIPTION: "No active monthly VIP subscription was found",
        WEAVE_IAP_SANDBOX_NOT_ACTIVATED: "Huawei IAP sandbox testing is not enabled for this app",
        WEAVE_IAP_INVALID_BUILD_ENVIRONMENT: "The IAP build environment is invalid",
        WEAVE_IAP_RELEASE_USES_SANDBOX: "A release build cannot use the Huawei IAP sandbox",
        WEAVE_IAP_RELEASE_SIGNING_REQUIRED: "Configure release signing before using production purchases",
        WEAVE_IAP_DEBUG_SIGNING_REQUIRED: "The debug signing certificate does not match the Huawei IAP sandbox configuration",
        WEAVE_IAP_SANDBOX_ACCOUNT_REQUIRED: "Sign in with a Huawei sandbox test account"
    };

    const simplifiedChinese = {
        WEAVE_ACCOUNT_BUTTON: "账号",
        WEAVE_ACCOUNT_CENTER_TITLE: "账号中心",
        WEAVE_ACCOUNT_INFO_TITLE: "账号信息",
        WEAVE_ACCOUNT_USER_FALLBACK: "织码用户",
        WEAVE_ACCOUNT_PHONE_LABEL: "手机号",
        WEAVE_ACCOUNT_EMAIL_LABEL: "邮箱",
        WEAVE_ACCOUNT_EMAIL_NOT_SET: "未设置",
        WEAVE_MEMBERSHIP_TITLE: "会员权益",
        WEAVE_MEMBERSHIP_FREE: "普通账号",
        WEAVE_MEMBERSHIP_TRIAL: "试用 VIP",
        WEAVE_MEMBERSHIP_MONTHLY: "连续包月 VIP",
        WEAVE_MEMBERSHIP_LIFETIME: "终身 VIP",
        WEAVE_MEMBERSHIP_PLAN_FREE: "普通用户",
        WEAVE_MEMBERSHIP_PLAN_TRIAL: "7 天试用 VIP",
        WEAVE_MEMBERSHIP_PLAN_MONTHLY: "连续包月 VIP",
        WEAVE_MEMBERSHIP_PLAN_LIFETIME: "终身 VIP",
        WEAVE_MEMBERSHIP_PLAN_LABEL: "当前方案",
        WEAVE_MEMBERSHIP_EXPIRY_LABEL: "权益有效期",
        WEAVE_MEMBERSHIP_LIFETIME_VALID: "永久有效",
        WEAVE_MEMBERSHIP_DAYS_REMAINING: "剩余 {0} 天",
        WEAVE_MEMBERSHIP_BENEFITS_TITLE: "VIP 独享功能",
        WEAVE_MEMBERSHIP_BENEFIT_VISUAL_EDIT: "实时可视化网页编辑",
        WEAVE_MEMBERSHIP_BENEFIT_LAYOUT: "元素布局与尺寸检查",
        WEAVE_MEMBERSHIP_BENEFIT_MARKDOWN: "富文本 Markdown 编辑与导出",
        WEAVE_MEMBERSHIP_BENEFIT_CODE_INTELLIGENCE: "增强代码智能与便携诊断",
        WEAVE_MEMBERSHIP_HINT_LIFETIME: "终身 VIP 已生效，无需再次购买任何 VIP 商品。",
        WEAVE_MEMBERSHIP_HINT_MONTHLY: "如需管理或退订，请前往华为支付系统的订阅管理。退订只会关闭下一周期续费，当前权益仍可使用到有效期结束。",
        WEAVE_MEMBERSHIP_HINT_TRIAL: "试用期内开通连续包月 VIP，未使用的试用时间会自动接续。",
        WEAVE_MEMBERSHIP_HINT_FREE: "开通 VIP 后即可使用全部 VIP 独享功能。",
        WEAVE_MEMBERSHIP_MANAGE_TITLE: "前往华为管理订阅",
        WEAVE_MEMBERSHIP_MANAGE_DESC: "在华为订阅管理中变更或关闭自动续费",
        WEAVE_MEMBERSHIP_VIEW_PLANS: "查看 VIP 方案",
        WEAVE_MEMBERSHIP_VIEW_PLANS_DESC: "选择连续包月或一次购买终身 VIP",
        WEAVE_MEMBERSHIP_UPGRADE_LIFETIME: "升级终身 VIP",
        WEAVE_MEMBERSHIP_MONTHLY_ACTIVE_DESC: "月订阅有效期间不能再次购买月 VIP",
        WEAVE_MEMBERSHIP_TRIAL_CARRYOVER_DESC: "未使用的试用时间不会丢失",
        WEAVE_MEMBERSHIP_ALREADY_LIFETIME: "您已是终身VIP",
        WEAVE_ACCOUNT_MANAGEMENT_TITLE: "账号管理",
        WEAVE_ACCOUNT_CHANGE_PASSWORD: "修改密码",
        WEAVE_ACCOUNT_LOGOUT_ACCOUNT: "退出账号",
        WEAVE_ACCOUNT_PASSWORD_MINIMUM: "新密码至少 8 个字符",
        WEAVE_ACCOUNT_CURRENT_PASSWORD: "当前密码",
        WEAVE_ACCOUNT_NEW_PASSWORD: "新密码",
        WEAVE_ACCOUNT_CONFIRM_NEW_PASSWORD: "确认新密码",
        WEAVE_ACCOUNT_CONFIRM_CHANGE_PASSWORD: "确认修改密码",
        WEAVE_ACCOUNT_BACK_TO_SUMMARY: "返回账号中心",
        WEAVE_ACCOUNT_PASSWORD_MISMATCH_CENTER: "两次输入的新密码不一致",
        WEAVE_ACCOUNT_PASSWORD_CHANGING: "正在修改密码…",
        WEAVE_ACCOUNT_PASSWORD_CHANGED: "密码已修改",
        WEAVE_ACCOUNT_PASSWORD_CHANGE_FAILED: "密码修改失败",
        WEAVE_ACCOUNT_CURRENT_PASSWORD_INVALID: "当前密码不正确",
        WEAVE_ACCOUNT_PASSWORD_UNCHANGED: "新密码不能与当前密码相同",
        WEAVE_ACCOUNT_SHOW_PASSWORD_CENTER: "显示密码",
        WEAVE_ACCOUNT_HIDE_PASSWORD_CENTER: "隐藏密码",
        WEAVE_SUBSCRIPTION_OPENING: "正在打开华为订阅管理…",
        WEAVE_SUBSCRIPTION_OPENED: "已打开华为订阅管理",
        WEAVE_SUBSCRIPTION_OPEN_FAILED: "无法打开订阅管理",
        WEAVE_IAP_TITLE: "Weave Code VIP",
        WEAVE_IAP_LOADING: "正在读取商品信息…",
        WEAVE_IAP_BUY: "立即购买",
        WEAVE_IAP_CLOSE: "关闭",
        WEAVE_IAP_AGREEMENT_PREFIX: "勾选即同意",
        WEAVE_IAP_AGREEMENT_LINK: "个人订阅服务协议",
        WEAVE_IAP_AGREEMENT_REQUIRED: "请先勾选并同意个人订阅服务协议",
        WEAVE_IAP_AGREEMENT_OPEN_FAILED: "无法打开个人订阅服务协议",
        WEAVE_IAP_LIFETIME_NOTICE_TITLE: "购买成功",
        WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "您已购买终身VIP，如果您之前订阅了每月的VIP服务，请您前往华为支付订阅服务，以避免不必要的损失",
        WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "我知道了",
        WEAVE_IAP_SIGN_IN: "购买 VIP 前，请先登录织码账号。",
        WEAVE_IAP_NO_PRODUCTS: "暂未查询到可购买的 VIP 商品，请稍后重试。",
        WEAVE_IAP_PURCHASING: "正在打开华为收银台…",
        WEAVE_IAP_SUCCESS: "VIP 权益已同步到当前织码账号。",
        WEAVE_IAP_MONTHLY: "每月自动续费，可前往华为订阅管理进行管理或退订；退订后仍可使用到当前周期结束。",
        WEAVE_IAP_LIFETIME: "一次购买，当前织码账号永久有效。",
        WEAVE_IAP_NOTE: "试用期内开通连续包月，未使用的试用时长会接续到订阅之后。",
        WEAVE_IAP_NATIVE_ONLY: "应用内支付仅在 HarmonyOS 应用中可用",
        WEAVE_IAP_MONTHLY_FALLBACK: "连续包月 VIP",
        WEAVE_IAP_LIFETIME_FALLBACK: "终身 VIP",
        WEAVE_IAP_CANCELLED: "已取消购买",
        WEAVE_IAP_ALREADY_OWNED: "您已拥有该商品",
        WEAVE_IAP_LIFETIME_ACTIVE: "您已是终身 VIP，无需再次购买",
        WEAVE_IAP_MONTHLY_ACTIVE: "您已开通连续包月 VIP，当前不可重复订阅",
        WEAVE_IAP_NETWORK_ERROR: "无法连接华为应用内支付服务",
        WEAVE_IAP_HUAWEI_SIGN_IN: "请先登录华为账号",
        WEAVE_IAP_AUTHORIZATION_ERROR: "应用尚未获得华为支付授权",
        WEAVE_IAP_REGION_ERROR: "当前华为账号所在地区暂不支持应用内支付",
        WEAVE_IAP_INVALID_PRODUCT: "该 VIP 商品不可用",
        WEAVE_IAP_INVALID_ACTION: "不支持此购买操作",
        WEAVE_IAP_NO_ACTIVE_SUBSCRIPTION: "当前账号没有生效中的连续包月 VIP",
        WEAVE_IAP_SANDBOX_NOT_ACTIVATED: "当前应用尚未开通华为支付沙盒测试",
        WEAVE_IAP_INVALID_BUILD_ENVIRONMENT: "应用内支付构建环境配置无效",
        WEAVE_IAP_RELEASE_USES_SANDBOX: "release 构建不能使用华为支付沙盒环境",
        WEAVE_IAP_RELEASE_SIGNING_REQUIRED: "使用生产支付前请先配置 release 签名",
        WEAVE_IAP_DEBUG_SIGNING_REQUIRED: "debug 签名证书与华为支付沙盒配置不匹配",
        WEAVE_IAP_SANDBOX_ACCOUNT_REQUIRED: "请登录华为沙盒测试账号"
    };

    const traditionalChinese = Object.assign({}, simplifiedChinese, {
        WEAVE_ACCOUNT_BUTTON: "帳號",
        WEAVE_ACCOUNT_CENTER_TITLE: "帳號中心",
        WEAVE_ACCOUNT_INFO_TITLE: "帳號資訊",
        WEAVE_ACCOUNT_USER_FALLBACK: "織碼使用者",
        WEAVE_ACCOUNT_PHONE_LABEL: "手機號碼",
        WEAVE_ACCOUNT_EMAIL_LABEL: "電子郵件",
        WEAVE_ACCOUNT_EMAIL_NOT_SET: "未設定",
        WEAVE_MEMBERSHIP_TITLE: "會員權益",
        WEAVE_MEMBERSHIP_FREE: "一般帳號",
        WEAVE_MEMBERSHIP_TRIAL: "試用 VIP",
        WEAVE_MEMBERSHIP_MONTHLY: "連續包月 VIP",
        WEAVE_MEMBERSHIP_LIFETIME: "終身 VIP",
        WEAVE_MEMBERSHIP_PLAN_FREE: "一般使用者",
        WEAVE_MEMBERSHIP_PLAN_TRIAL: "7 天試用 VIP",
        WEAVE_MEMBERSHIP_PLAN_MONTHLY: "連續包月 VIP",
        WEAVE_MEMBERSHIP_PLAN_LIFETIME: "終身 VIP",
        WEAVE_MEMBERSHIP_PLAN_LABEL: "目前方案",
        WEAVE_MEMBERSHIP_EXPIRY_LABEL: "權益有效期",
        WEAVE_MEMBERSHIP_LIFETIME_VALID: "永久有效",
        WEAVE_MEMBERSHIP_DAYS_REMAINING: "剩餘 {0} 天",
        WEAVE_MEMBERSHIP_BENEFITS_TITLE: "VIP 專屬功能",
        WEAVE_MEMBERSHIP_BENEFIT_VISUAL_EDIT: "即時視覺化網頁編輯",
        WEAVE_MEMBERSHIP_BENEFIT_LAYOUT: "元素版面與尺寸檢查",
        WEAVE_MEMBERSHIP_BENEFIT_MARKDOWN: "富文字 Markdown 編輯與匯出",
        WEAVE_MEMBERSHIP_BENEFIT_CODE_INTELLIGENCE: "增強程式碼智慧與可攜式診斷",
        WEAVE_MEMBERSHIP_HINT_LIFETIME: "終身 VIP 已生效，無需再次購買任何 VIP 商品。",
        WEAVE_MEMBERSHIP_HINT_MONTHLY: "如需管理或退訂，請前往華為支付系統的訂閱管理。退訂只會關閉下一週期續費，目前權益仍可使用到有效期結束。",
        WEAVE_MEMBERSHIP_HINT_TRIAL: "試用期內開通連續包月 VIP，未使用的試用時間會自動接續。",
        WEAVE_MEMBERSHIP_HINT_FREE: "開通 VIP 後即可使用全部 VIP 專屬功能。",
        WEAVE_MEMBERSHIP_MANAGE_TITLE: "前往華為管理訂閱",
        WEAVE_MEMBERSHIP_MANAGE_DESC: "在華為訂閱管理中變更或關閉自動續費",
        WEAVE_MEMBERSHIP_VIEW_PLANS: "查看 VIP 方案",
        WEAVE_MEMBERSHIP_VIEW_PLANS_DESC: "選擇連續包月或一次購買終身 VIP",
        WEAVE_MEMBERSHIP_UPGRADE_LIFETIME: "升級終身 VIP",
        WEAVE_MEMBERSHIP_MONTHLY_ACTIVE_DESC: "月訂閱有效期間不能再次購買月 VIP",
        WEAVE_MEMBERSHIP_TRIAL_CARRYOVER_DESC: "未使用的試用時間不會遺失",
        WEAVE_MEMBERSHIP_ALREADY_LIFETIME: "您已是終身VIP",
        WEAVE_ACCOUNT_MANAGEMENT_TITLE: "帳號管理",
        WEAVE_ACCOUNT_CHANGE_PASSWORD: "修改密碼",
        WEAVE_ACCOUNT_LOGOUT_ACCOUNT: "登出帳號",
        WEAVE_ACCOUNT_CURRENT_PASSWORD: "目前密碼",
        WEAVE_ACCOUNT_NEW_PASSWORD: "新密碼",
        WEAVE_ACCOUNT_CONFIRM_NEW_PASSWORD: "確認新密碼",
        WEAVE_ACCOUNT_CONFIRM_CHANGE_PASSWORD: "確認修改密碼",
        WEAVE_ACCOUNT_BACK_TO_SUMMARY: "返回帳號中心",
        WEAVE_ACCOUNT_PASSWORD_MISMATCH_CENTER: "兩次輸入的新密碼不一致",
        WEAVE_ACCOUNT_PASSWORD_CHANGING: "正在修改密碼…",
        WEAVE_ACCOUNT_PASSWORD_CHANGED: "密碼已修改",
        WEAVE_ACCOUNT_PASSWORD_CHANGE_FAILED: "密碼修改失敗",
        WEAVE_ACCOUNT_CURRENT_PASSWORD_INVALID: "目前密碼不正確",
        WEAVE_ACCOUNT_PASSWORD_UNCHANGED: "新密碼不能與目前密碼相同",
        WEAVE_ACCOUNT_SHOW_PASSWORD_CENTER: "顯示密碼",
        WEAVE_ACCOUNT_HIDE_PASSWORD_CENTER: "隱藏密碼",
        WEAVE_SUBSCRIPTION_OPENING: "正在開啟華為訂閱管理…",
        WEAVE_SUBSCRIPTION_OPENED: "已開啟華為訂閱管理",
        WEAVE_SUBSCRIPTION_OPEN_FAILED: "無法開啟訂閱管理",
        WEAVE_IAP_LOADING: "正在讀取商品資訊…",
        WEAVE_IAP_BUY: "立即購買",
        WEAVE_IAP_CLOSE: "關閉",
        WEAVE_IAP_AGREEMENT_PREFIX: "勾選即同意",
        WEAVE_IAP_AGREEMENT_LINK: "個人訂閱服務協議",
        WEAVE_IAP_AGREEMENT_REQUIRED: "請先勾選並同意個人訂閱服務協議",
        WEAVE_IAP_AGREEMENT_OPEN_FAILED: "無法開啟個人訂閱服務協議",
        WEAVE_IAP_LIFETIME_NOTICE_TITLE: "購買成功",
        WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "您已購買終身VIP，如果您之前訂閱了每月的VIP服務，請您前往華為支付訂閱服務，以避免不必要的損失",
        WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "我知道了",
        WEAVE_IAP_SIGN_IN: "購買 VIP 前，請先登入織碼帳號。",
        WEAVE_IAP_NO_PRODUCTS: "暫未查詢到可購買的 VIP 商品，請稍後重試。",
        WEAVE_IAP_PURCHASING: "正在開啟華為收銀台…",
        WEAVE_IAP_SUCCESS: "VIP 權益已同步到目前織碼帳號。",
        WEAVE_IAP_MONTHLY: "每月自動續費，可前往華為訂閱管理進行管理或退訂；退訂後仍可使用到目前週期結束。",
        WEAVE_IAP_LIFETIME: "一次購買，目前織碼帳號永久有效。",
        WEAVE_IAP_NOTE: "試用期內開通連續包月，未使用的試用時長會接續到訂閱之後。",
        WEAVE_IAP_NATIVE_ONLY: "應用程式內購買僅在 HarmonyOS 應用程式中可用",
        WEAVE_IAP_MONTHLY_FALLBACK: "連續包月 VIP",
        WEAVE_IAP_LIFETIME_FALLBACK: "終身 VIP",
        WEAVE_IAP_CANCELLED: "已取消購買",
        WEAVE_IAP_ALREADY_OWNED: "您已擁有該商品",
        WEAVE_IAP_LIFETIME_ACTIVE: "您已是終身 VIP，無需再次購買",
        WEAVE_IAP_MONTHLY_ACTIVE: "您已開通連續包月 VIP，目前不可重複訂閱",
        WEAVE_IAP_NETWORK_ERROR: "無法連線華為應用程式內購買服務",
        WEAVE_IAP_HUAWEI_SIGN_IN: "請先登入華為帳號",
        WEAVE_IAP_AUTHORIZATION_ERROR: "應用程式尚未獲得華為支付授權",
        WEAVE_IAP_REGION_ERROR: "目前華為帳號所在地區暫不支援應用程式內購買",
        WEAVE_IAP_INVALID_PRODUCT: "該 VIP 商品不可用",
        WEAVE_IAP_INVALID_ACTION: "不支援此購買操作",
        WEAVE_IAP_NO_ACTIVE_SUBSCRIPTION: "目前帳號沒有生效中的連續包月 VIP",
        WEAVE_IAP_SANDBOX_NOT_ACTIVATED: "目前應用程式尚未開通華為支付沙盒測試",
        WEAVE_IAP_INVALID_BUILD_ENVIRONMENT: "應用程式內購買建置環境設定無效",
        WEAVE_IAP_RELEASE_USES_SANDBOX: "release 建置不能使用華為支付沙盒環境",
        WEAVE_IAP_RELEASE_SIGNING_REQUIRED: "使用正式支付前請先設定 release 簽章",
        WEAVE_IAP_DEBUG_SIGNING_REQUIRED: "debug 簽章憑證與華為支付沙盒設定不符",
        WEAVE_IAP_SANDBOX_ACCOUNT_REQUIRED: "請登入華為沙盒測試帳號"
    });

    // Payment/legal copy that is not part of the upstream editor language packs.
    // Keep these locale codes aligned with the folders under /nls so this copy
    // follows the same language selected by Weave Code.
    const localizedIapLegal = {
        ar: {
            WEAVE_IAP_AGREEMENT_PREFIX: "بتحديد هذا الخيار، أوافق على",
            WEAVE_IAP_AGREEMENT_LINK: "اتفاقية خدمة الاشتراك الشخصي",
            WEAVE_IAP_AGREEMENT_REQUIRED: "يرجى الموافقة على اتفاقية خدمة الاشتراك الشخصي قبل الشراء.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "تعذر فتح اتفاقية خدمة الاشتراك الشخصي.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "اكتملت عملية الشراء",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "لقد اشتريت VIP مدى الحياة. إذا كنت قد اشتركت سابقًا في VIP الشهري، فيرجى إدارة ذلك الاشتراك عبر مدفوعات هواوي لتجنب رسوم غير ضرورية.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "فهمت"
        },
        bg: {
            WEAVE_IAP_AGREEMENT_PREFIX: "С отметката приемам",
            WEAVE_IAP_AGREEMENT_LINK: "Споразумението за лична абонаментна услуга",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Моля, приемете Споразумението за лична абонаментна услуга преди покупката.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Споразумението за лична абонаментна услуга не може да бъде отворено.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Покупката е завършена",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Закупихте доживотен VIP. Ако преди това сте се абонирали за месечен VIP, управлявайте абонамента чрез Huawei Payments, за да избегнете ненужни такси.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Разбрах"
        },
        cs: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Zaškrtnutím souhlasím s",
            WEAVE_IAP_AGREEMENT_LINK: "Podmínkami osobní předplatitelské služby",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Před nákupem odsouhlaste Podmínky osobní předplatitelské služby.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Podmínky osobní předplatitelské služby nelze otevřít.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Nákup byl dokončen",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Zakoupili jste doživotní VIP. Pokud jste dříve měli měsíční VIP, spravujte toto předplatné prostřednictvím Huawei Payments, abyste předešli zbytečným poplatkům.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Rozumím"
        },
        da: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Ved at markere accepterer jeg",
            WEAVE_IAP_AGREEMENT_LINK: "Aftalen om personlig abonnementstjeneste",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Acceptér Aftalen om personlig abonnementstjeneste før købet.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Aftalen om personlig abonnementstjeneste kunne ikke åbnes.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Købet er gennemført",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Du har købt Livstids-VIP. Hvis du tidligere har abonneret på Månedlig VIP, skal du administrere abonnementet via Huawei Payments for at undgå unødvendige opkrævninger.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Forstået"
        },
        de: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Mit der Auswahl akzeptiere ich die",
            WEAVE_IAP_AGREEMENT_LINK: "Vereinbarung für persönliche Abonnementdienste",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Bitte akzeptieren Sie vor dem Kauf die Vereinbarung für persönliche Abonnementdienste.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Die Vereinbarung für persönliche Abonnementdienste konnte nicht geöffnet werden.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Kauf abgeschlossen",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Sie haben Lifetime-VIP gekauft. Falls Sie zuvor Monats-VIP abonniert haben, verwalten Sie dieses Abonnement bitte über Huawei Payments, um unnötige Kosten zu vermeiden.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Verstanden"
        },
        el: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Με την επιλογή αποδέχομαι τη",
            WEAVE_IAP_AGREEMENT_LINK: "Συμφωνία προσωπικής συνδρομητικής υπηρεσίας",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Αποδεχτείτε τη Συμφωνία προσωπικής συνδρομητικής υπηρεσίας πριν από την αγορά.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Δεν ήταν δυνατό το άνοιγμα της Συμφωνίας προσωπικής συνδρομητικής υπηρεσίας.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Η αγορά ολοκληρώθηκε",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Αγοράσατε το VIP εφ’ όρου ζωής. Αν είχατε εγγραφεί στο Μηνιαίο VIP, διαχειριστείτε τη συνδρομή μέσω του Huawei Payments για να αποφύγετε περιττές χρεώσεις.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Κατάλαβα"
        },
        es: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Al marcar, acepto el",
            WEAVE_IAP_AGREEMENT_LINK: "Acuerdo de servicio de suscripción personal",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Acepta el Acuerdo de servicio de suscripción personal antes de comprar.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "No se pudo abrir el Acuerdo de servicio de suscripción personal.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Compra completada",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Has comprado VIP de por vida. Si antes te suscribiste a VIP mensual, gestiona esa suscripción mediante Huawei Payments para evitar cargos innecesarios.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Entendido"
        },
        "fa-ir": {
            WEAVE_IAP_AGREEMENT_PREFIX: "با علامت زدن، موافقت می‌کنم با",
            WEAVE_IAP_AGREEMENT_LINK: "توافق‌نامه خدمات اشتراک شخصی",
            WEAVE_IAP_AGREEMENT_REQUIRED: "لطفاً پیش از خرید با توافق‌نامه خدمات اشتراک شخصی موافقت کنید.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "باز کردن توافق‌نامه خدمات اشتراک شخصی ممکن نیست.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "خرید تکمیل شد",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "شما VIP مادام‌العمر را خریده‌اید. اگر قبلاً مشترک VIP ماهانه بوده‌اید، برای جلوگیری از هزینه‌های ناخواسته آن اشتراک را از طریق Huawei Payments مدیریت کنید.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "متوجه شدم"
        },
        fi: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Valitsemalla hyväksyn",
            WEAVE_IAP_AGREEMENT_LINK: "Henkilökohtaisen tilauspalvelun sopimuksen",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Hyväksy Henkilökohtaisen tilauspalvelun sopimus ennen ostamista.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Henkilökohtaisen tilauspalvelun sopimusta ei voitu avata.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Osto on valmis",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Olet ostanut elinikäisen VIP-jäsenyyden. Jos olet aiemmin tilannut kuukausittaisen VIP-jäsenyyden, hallinnoi tilausta Huawei Paymentsissa välttääksesi tarpeettomat veloitukset.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Selvä"
        },
        fr: {
            WEAVE_IAP_AGREEMENT_PREFIX: "En cochant, j’accepte l’",
            WEAVE_IAP_AGREEMENT_LINK: "Accord de service d’abonnement personnel",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Veuillez accepter l’Accord de service d’abonnement personnel avant l’achat.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Impossible d’ouvrir l’Accord de service d’abonnement personnel.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Achat terminé",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Vous avez acheté le VIP à vie. Si vous aviez souscrit au VIP mensuel, veuillez gérer cet abonnement via Huawei Payments afin d’éviter des frais inutiles.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Compris"
        },
        gl: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Ao marcar, acepto o",
            WEAVE_IAP_AGREEMENT_LINK: "Acordo do servizo de subscrición persoal",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Acepta o Acordo do servizo de subscrición persoal antes de mercar.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Non se puido abrir o Acordo do servizo de subscrición persoal.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Compra completada",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Mercaches o VIP de por vida. Se antes estabas subscrito ao VIP mensual, xestiona esa subscrición mediante Huawei Payments para evitar cargos innecesarios.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Entendido"
        },
        hi: {
            WEAVE_IAP_AGREEMENT_PREFIX: "चयन करके मैं सहमत हूँ",
            WEAVE_IAP_AGREEMENT_LINK: "व्यक्तिगत सदस्यता सेवा अनुबंध",
            WEAVE_IAP_AGREEMENT_REQUIRED: "खरीदने से पहले व्यक्तिगत सदस्यता सेवा अनुबंध से सहमत हों।",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "व्यक्तिगत सदस्यता सेवा अनुबंध खोला नहीं जा सका।",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "खरीद पूरी हुई",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "आपने आजीवन VIP खरीद लिया है। यदि आपने पहले मासिक VIP की सदस्यता ली थी, तो अनावश्यक शुल्क से बचने के लिए Huawei Payments में उस सदस्यता को प्रबंधित करें।",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "समझ गया"
        },
        hr: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Označavanjem prihvaćam",
            WEAVE_IAP_AGREEMENT_LINK: "Ugovor o osobnoj pretplatničkoj usluzi",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Prije kupnje prihvatite Ugovor o osobnoj pretplatničkoj usluzi.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Ugovor o osobnoj pretplatničkoj usluzi nije moguće otvoriti.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Kupnja je dovršena",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Kupili ste doživotni VIP. Ako ste se ranije pretplatili na mjesečni VIP, upravljajte tom pretplatom putem Huawei Payments kako biste izbjegli nepotrebne naplate.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Razumijem"
        },
        hu: {
            WEAVE_IAP_AGREEMENT_PREFIX: "A bejelöléssel elfogadom a",
            WEAVE_IAP_AGREEMENT_LINK: "Személyes előfizetési szolgáltatási megállapodást",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Vásárlás előtt fogadja el a Személyes előfizetési szolgáltatási megállapodást.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "A Személyes előfizetési szolgáltatási megállapodás nem nyitható meg.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "A vásárlás befejeződött",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Megvásárolta az élethosszig tartó VIP-tagságot. Ha korábban havi VIP-előfizetése volt, a felesleges terhelések elkerüléséhez kezelje azt a Huawei Payments felületén.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Értem"
        },
        id: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Dengan mencentang, saya menyetujui",
            WEAVE_IAP_AGREEMENT_LINK: "Perjanjian Layanan Langganan Pribadi",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Setujui Perjanjian Layanan Langganan Pribadi sebelum membeli.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Perjanjian Layanan Langganan Pribadi tidak dapat dibuka.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Pembelian selesai",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Anda telah membeli VIP Seumur Hidup. Jika sebelumnya Anda berlangganan VIP Bulanan, kelola langganan tersebut melalui Huawei Payments untuk menghindari biaya yang tidak perlu.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Mengerti"
        },
        it: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Selezionando, accetto l’",
            WEAVE_IAP_AGREEMENT_LINK: "Accordo del servizio di abbonamento personale",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Accetta l’Accordo del servizio di abbonamento personale prima dell’acquisto.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Impossibile aprire l’Accordo del servizio di abbonamento personale.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Acquisto completato",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Hai acquistato VIP a vita. Se in precedenza avevi sottoscritto VIP mensile, gestisci l’abbonamento tramite Huawei Payments per evitare addebiti non necessari.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Ho capito"
        },
        ja: {
            WEAVE_IAP_AGREEMENT_PREFIX: "チェックすると、次の内容に同意したものとみなされます：",
            WEAVE_IAP_AGREEMENT_LINK: "個人向けサブスクリプションサービス契約",
            WEAVE_IAP_AGREEMENT_REQUIRED: "購入前に個人向けサブスクリプションサービス契約に同意してください。",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "個人向けサブスクリプションサービス契約を開けませんでした。",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "購入が完了しました",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "永久VIPを購入しました。以前に月額VIPを購読していた場合は、不要な請求を避けるため、Huawei Paymentsでその購読を管理してください。",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "確認"
        },
        ko: {
            WEAVE_IAP_AGREEMENT_PREFIX: "선택하면 다음에 동의합니다:",
            WEAVE_IAP_AGREEMENT_LINK: "개인 구독 서비스 계약",
            WEAVE_IAP_AGREEMENT_REQUIRED: "구매하기 전에 개인 구독 서비스 계약에 동의해 주세요.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "개인 구독 서비스 계약을 열 수 없습니다.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "구매 완료",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "평생 VIP를 구매했습니다. 이전에 월간 VIP를 구독한 경우 불필요한 요금을 방지하려면 Huawei Payments에서 해당 구독을 관리해 주세요.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "확인"
        },
        lv: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Atzīmējot es piekrītu",
            WEAVE_IAP_AGREEMENT_LINK: "Personīgā abonēšanas pakalpojuma līgumam",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Pirms pirkuma piekrītiet Personīgā abonēšanas pakalpojuma līgumam.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Personīgā abonēšanas pakalpojuma līgumu neizdevās atvērt.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Pirkums pabeigts",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Jūs iegādājāties mūža VIP. Ja iepriekš abonējāt mēneša VIP, pārvaldiet šo abonementu pakalpojumā Huawei Payments, lai izvairītos no nevajadzīgām maksām.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Sapratu"
        },
        ml: {
            WEAVE_IAP_AGREEMENT_PREFIX: "തിരഞ്ഞെടുക്കുന്നതിലൂടെ ഞാൻ അംഗീകരിക്കുന്നു",
            WEAVE_IAP_AGREEMENT_LINK: "വ്യക്തിഗത സബ്‌സ്‌ക്രിപ്ഷൻ സേവന കരാർ",
            WEAVE_IAP_AGREEMENT_REQUIRED: "വാങ്ങുന്നതിന് മുമ്പ് വ്യക്തിഗത സബ്‌സ്‌ക്രിപ്ഷൻ സേവന കരാർ അംഗീകരിക്കുക.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "വ്യക്തിഗത സബ്‌സ്‌ക്രിപ്ഷൻ സേവന കരാർ തുറക്കാനായില്ല.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "വാങ്ങൽ പൂർത്തിയായി",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "നിങ്ങൾ ആജീവനാന്ത VIP വാങ്ങിയിരിക്കുന്നു. മുമ്പ് പ്രതിമാസ VIP സബ്‌സ്‌ക്രൈബ് ചെയ്തിട്ടുണ്ടെങ്കിൽ അനാവശ്യ നിരക്കുകൾ ഒഴിവാക്കാൻ Huawei Payments വഴി ആ സബ്‌സ്‌ക്രിപ്ഷൻ നിയന്ത്രിക്കുക.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "മനസ്സിലായി"
        },
        nb: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Ved å merke av godtar jeg",
            WEAVE_IAP_AGREEMENT_LINK: "Avtalen for personlig abonnementstjeneste",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Godta Avtalen for personlig abonnementstjeneste før kjøpet.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Avtalen for personlig abonnementstjeneste kunne ikke åpnes.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Kjøpet er fullført",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Du har kjøpt Livstids-VIP. Hvis du tidligere abonnerte på Månedlig VIP, må du administrere abonnementet via Huawei Payments for å unngå unødvendige belastninger.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Forstått"
        },
        nl: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Door dit aan te vinken ga ik akkoord met de",
            WEAVE_IAP_AGREEMENT_LINK: "Overeenkomst voor persoonlijke abonnementsdiensten",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Ga vóór de aankoop akkoord met de Overeenkomst voor persoonlijke abonnementsdiensten.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "De Overeenkomst voor persoonlijke abonnementsdiensten kon niet worden geopend.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Aankoop voltooid",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Je hebt Levenslange VIP gekocht. Als je eerder Maandelijkse VIP hebt genomen, beheer dat abonnement dan via Huawei Payments om onnodige kosten te voorkomen.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Begrepen"
        },
        pl: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Zaznaczając, akceptuję",
            WEAVE_IAP_AGREEMENT_LINK: "Umowę o indywidualną usługę subskrypcji",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Przed zakupem zaakceptuj Umowę o indywidualną usługę subskrypcji.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Nie można otworzyć Umowy o indywidualną usługę subskrypcji.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Zakup zakończony",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Kupiono dożywotni VIP. Jeśli wcześniej korzystano z miesięcznego VIP, zarządzaj tą subskrypcją przez Huawei Payments, aby uniknąć niepotrzebnych opłat.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Rozumiem"
        },
        "pt-br": {
            WEAVE_IAP_AGREEMENT_PREFIX: "Ao marcar, concordo com o",
            WEAVE_IAP_AGREEMENT_LINK: "Contrato de Serviço de Assinatura Pessoal",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Concorde com o Contrato de Serviço de Assinatura Pessoal antes de comprar.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Não foi possível abrir o Contrato de Serviço de Assinatura Pessoal.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Compra concluída",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Você comprou o VIP Vitalício. Se já assinava o VIP Mensal, gerencie essa assinatura pelo Huawei Payments para evitar cobranças desnecessárias.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Entendi"
        },
        "pt-pt": {
            WEAVE_IAP_AGREEMENT_PREFIX: "Ao selecionar, aceito o",
            WEAVE_IAP_AGREEMENT_LINK: "Acordo de Serviço de Subscrição Pessoal",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Aceite o Acordo de Serviço de Subscrição Pessoal antes da compra.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Não foi possível abrir o Acordo de Serviço de Subscrição Pessoal.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Compra concluída",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Comprou o VIP Vitalício. Se já tinha subscrito o VIP Mensal, faça a gestão dessa subscrição através do Huawei Payments para evitar cobranças desnecessárias.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Compreendi"
        },
        ro: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Prin bifare, accept",
            WEAVE_IAP_AGREEMENT_LINK: "Acordul privind serviciul de abonament personal",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Acceptă Acordul privind serviciul de abonament personal înainte de cumpărare.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Acordul privind serviciul de abonament personal nu a putut fi deschis.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Achiziție finalizată",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Ai cumpărat VIP pe viață. Dacă ai avut anterior VIP lunar, gestionează acel abonament prin Huawei Payments pentru a evita costurile inutile.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Am înțeles"
        },
        ru: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Отмечая этот пункт, я принимаю",
            WEAVE_IAP_AGREEMENT_LINK: "Соглашение о персональной подписке",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Перед покупкой примите Соглашение о персональной подписке.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Не удалось открыть Соглашение о персональной подписке.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Покупка завершена",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Вы приобрели пожизненный VIP. Если ранее у вас была подписка на ежемесячный VIP, управляйте ею через Huawei Payments, чтобы избежать ненужных списаний.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Понятно"
        },
        sk: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Zaškrtnutím súhlasím s",
            WEAVE_IAP_AGREEMENT_LINK: "Dohodou o osobnej predplatiteľskej službe",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Pred nákupom prijmite Dohodu o osobnej predplatiteľskej službe.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Dohodu o osobnej predplatiteľskej službe sa nepodarilo otvoriť.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Nákup bol dokončený",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Zakúpili ste si doživotné VIP. Ak ste predtým mali mesačné VIP, spravujte toto predplatné cez Huawei Payments, aby ste predišli zbytočným poplatkom.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Rozumiem"
        },
        sr: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Означавањем прихватам",
            WEAVE_IAP_AGREEMENT_LINK: "Уговор о личној претплатничкој услузи",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Пре куповине прихватите Уговор о личној претплатничкој услузи.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Уговор о личној претплатничкој услузи није могуће отворити.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Куповина је завршена",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Купили сте доживотни VIP. Ако сте раније били претплаћени на месечни VIP, управљајте том претплатом путем Huawei Payments да бисте избегли непотребне наплате.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Разумем"
        },
        sv: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Genom att markera godkänner jag",
            WEAVE_IAP_AGREEMENT_LINK: "Avtalet för personlig prenumerationstjänst",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Godkänn Avtalet för personlig prenumerationstjänst före köpet.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Avtalet för personlig prenumerationstjänst kunde inte öppnas.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Köpet är slutfört",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Du har köpt Livstids-VIP. Om du tidigare prenumererade på Månads-VIP ska du hantera prenumerationen via Huawei Payments för att undvika onödiga avgifter.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Jag förstår"
        },
        tr: {
            WEAVE_IAP_AGREEMENT_PREFIX: "İşaretleyerek şunu kabul ediyorum:",
            WEAVE_IAP_AGREEMENT_LINK: "Kişisel Abonelik Hizmeti Sözleşmesi",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Satın almadan önce Kişisel Abonelik Hizmeti Sözleşmesi’ni kabul edin.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Kişisel Abonelik Hizmeti Sözleşmesi açılamadı.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Satın alma tamamlandı",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Ömür Boyu VIP satın aldınız. Daha önce Aylık VIP aboneliğiniz varsa gereksiz ücretlerden kaçınmak için bu aboneliği Huawei Payments üzerinden yönetin.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Anladım"
        },
        uk: {
            WEAVE_IAP_AGREEMENT_PREFIX: "Позначаючи цей пункт, я приймаю",
            WEAVE_IAP_AGREEMENT_LINK: "Угоду про персональну послугу підписки",
            WEAVE_IAP_AGREEMENT_REQUIRED: "Перед покупкою прийміть Угоду про персональну послугу підписки.",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "Не вдалося відкрити Угоду про персональну послугу підписки.",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "Покупку завершено",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "Ви придбали довічний VIP. Якщо раніше у вас була підписка на щомісячний VIP, керуйте нею через Huawei Payments, щоб уникнути зайвих списань.",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "Зрозуміло"
        },
        ur: {
            WEAVE_IAP_AGREEMENT_PREFIX: "منتخب کرکے میں اتفاق کرتا/کرتی ہوں",
            WEAVE_IAP_AGREEMENT_LINK: "ذاتی سبسکرپشن سروس معاہدہ",
            WEAVE_IAP_AGREEMENT_REQUIRED: "خریدنے سے پہلے ذاتی سبسکرپشن سروس معاہدے سے اتفاق کریں۔",
            WEAVE_IAP_AGREEMENT_OPEN_FAILED: "ذاتی سبسکرپشن سروس معاہدہ نہیں کھولا جا سکا۔",
            WEAVE_IAP_LIFETIME_NOTICE_TITLE: "خریداری مکمل ہو گئی",
            WEAVE_IAP_LIFETIME_NOTICE_MESSAGE: "آپ نے تاحیات VIP خرید لیا ہے۔ اگر آپ پہلے ماہانہ VIP کے رکن تھے تو غیر ضروری چارجز سے بچنے کے لیے Huawei Payments میں اس سبسکرپشن کا نظم کریں۔",
            WEAVE_IAP_LIFETIME_NOTICE_CONFIRM: "سمجھ گیا/گئی"
        }
    };

    function locale() {
        try {
            const appLocale = window.brackets && typeof window.brackets.getLocale === "function" ?
                window.brackets.getLocale() : "";
            if (appLocale) {
                return String(appLocale).replace(/_/g, "-").toLowerCase();
            }
        } catch (error) {
            console.debug("Unable to read the Weave Code locale", error);
        }
        return String(navigator.language || "en").replace(/_/g, "-").toLowerCase();
    }

    function dictionary() {
        const activeLocale = locale();
        let baseDictionary = english;
        if (activeLocale === "zh-tw" || activeLocale === "zh-hk" || activeLocale === "zh-mo") {
            baseDictionary = traditionalChinese;
        } else if (activeLocale.startsWith("zh")) {
            baseDictionary = simplifiedChinese;
        }
        const language = activeLocale.split("-")[0];
        const legalDictionary = localizedIapLegal[activeLocale] || localizedIapLegal[language];
        return legalDictionary ? Object.assign({}, baseDictionary, legalDictionary) : baseDictionary;
    }

    function text(key, fallback) {
        const appStrings = window.Strings || {};
        return appStrings[key] || dictionary()[key] || english[key] || fallback || key;
    }

    function format(key, fallback) {
        const values = Array.prototype.slice.call(arguments, 2);
        return values.reduce(function (result, value, index) {
            return result.replace(new RegExp("\\{" + index + "\\}", "g"), String(value));
        }, text(key, fallback));
    }

    window.WeaveAccountVipI18n = {locale: locale, text: text, format: format};
}());
