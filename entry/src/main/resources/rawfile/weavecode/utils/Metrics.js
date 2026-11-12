define(function (require, exports) {
    "use strict";

    const EVENT_TYPE = {
        PLATFORM: "platform",
        PROJECT: "project",
        THEMES: "themes",
        EXTENSIONS: "extensions",
        NOTIFICATIONS: "notify",
        UI: "UI",
        APP_MENU: "appMenu",
        UI_MENU: "UIMenu",
        UI_DIALOG: "ui-dialog",
        UI_BOTTOM_PANEL: "ui-bottomPanel",
        UI_SIDE_PANEL: "ui-sidePanel",
        UPDATES: "update",
        LIVE_PREVIEW: "live-preview",
        LP_EDIT: "lp-edit",
        KEYBOARD: "keyboard",
        CODE_HINTS: "hints",
        EDITOR: "editor",
        QUICK_VIEW: "quickView",
        SEARCH: "search",
        SHARING: "sharing",
        PERFORMANCE: "performance",
        STORAGE: "storage",
        NEW_PROJECT: "new-project",
        ERROR: "error",
        USER: "user",
        NODEJS: "node",
        LINT: "lint",
        GIT: "git",
        AUTH: "auth",
        PRO: "pro",
        AI: "ai",
        TERMINAL: "term",
        MD: "md",
        GUIDE: "guide",
        LSP: "lsp"
    };

    const auditData = new Map();
    const noop = () => {};

    exports.init = noop;
    exports.setDisabled = noop;
    exports.isDisabled = () => true;
    exports.getLoggedDataForAudit = () => auditData;
    exports.clearAuditData = () => auditData.clear();
    exports.countEvent = noop;
    exports.valueEvent = noop;
    exports.countEventBatched = noop;
    exports.valueEventBatched = noop;
    exports.logPerformanceTime = noop;
    exports.flushMetrics = async () => {};
    exports.getRangeName = (value) => String(value);
    exports.isPowerUser = () => false;
    exports.EVENT_TYPE = EVENT_TYPE;
    exports.AUDIT_TYPE_COUNT = "count";
    exports.AUDIT_TYPE_VALUE = "value";
});
