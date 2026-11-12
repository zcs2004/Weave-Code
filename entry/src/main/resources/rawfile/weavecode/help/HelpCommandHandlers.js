define(function (require, exports, module) {
    var AppInit = require("utils/AppInit"),
        CommandManager = require("command/CommandManager"),
        Commands = require("command/Commands"),
        Menus = require("command/Menus"),
        Dialogs = require("widgets/Dialogs"),
        DefaultDialogs = require("widgets/DefaultDialogs"),
        NativeApp = require("utils/NativeApp"),
        Strings = require("strings"),
        AboutDialogTemplate = require("text!htmlContent/about-dialog.html"),
        LicenseDialogTemplate = require("text!htmlContent/license-dialog.html"),
        LicenseText = require("text!legal/LICENSE"),
        VersionPreviewDialogTemplate = require("text!htmlContent/version-preview-dialog.html"),
        Mustache = require("thirdparty/mustache/mustache");

    function _handleLinkMenuItem(url) {
        return function () {
            if (url) {
                NativeApp.openURLInDefaultBrowser(url);
            }
        };
    }

    function _handleAboutDialog() {
        var templateVars = {
                ABOUT_ICON: brackets.config.about_icon,
                APP_NAME_ABOUT_BOX: brackets.config.app_name_about,
                APP_VERSION: brackets.metadata.version,
                Strings: Strings
            },
            dialog = Dialogs.showModalDialogUsingTemplate(
                Mustache.render(AboutDialogTemplate, templateVars)
            );

        dialog.getElement().on("click", ".about-external-link", function (event) {
            event.preventDefault();
            NativeApp.openURLInDefaultBrowser($(this).attr("href"));
        });
    }

    function _handleVersionPreviewDialog() {
        Dialogs.showModalDialogUsingTemplate(Mustache.render(VersionPreviewDialogTemplate, {
            ABOUT_ICON: brackets.config.about_icon,
            APP_NAME_ABOUT_BOX: brackets.config.app_name_about,
            Strings: Strings
        }));
    }

    function _handleLicenseDialog() {
        Dialogs.showModalDialogUsingTemplate(Mustache.render(LicenseDialogTemplate, {
            TITLE: Strings.ABOUT_LICENSE || "License",
            CLOSE: Strings.CLOSE || "Close",
            LICENSE_TEXT: LicenseText
        }));
    }

    function _showVIPStatus() {
        if (window.Weave && typeof window.Weave.openVipPurchaseDialog === "function") {
            window.Weave.openVipPurchaseDialog();
            return;
        }
        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR,
            Strings.VIP_PURCHASE_PENDING_TITLE, "VIP purchase service is unavailable.");
    }

    function _vipMenuLabel(snapshot) {
        if (!snapshot || snapshot.signedIn !== true || snapshot.isVip !== true) {
            return Strings.CMD_GET_PRO;
        }
        var expiresAt = Number(snapshot.vipExpiresAt) || 0;
        if (expiresAt > 0) {
            var remainingDays = Math.max(1, Math.ceil((expiresAt - Date.now()) / 86400000));
            return String(Strings.VIP_DAYS_REMAINING || "VIP · {0} days")
                .replace("{0}", String(remainingDays));
        }
        return "VIP";
    }

    function _updateVIPMenu(snapshot) {
        var command = CommandManager.get(Commands.HELP_GET_PRO);
        if (command) {
            var label = _vipMenuLabel(snapshot || (window.Weave && window.Weave.weaveAccount));
            command.setName(label, label);
        }
    }

    require("utils/Global");
    CommandManager.register(Strings.CMD_DOCS, Commands.HELP_DOCS, _handleLinkMenuItem(brackets.config.docs_url), {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_VERSION_PREVIEW, Commands.HELP_VERSION_PREVIEW, _handleVersionPreviewDialog, {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_GET_PRO, Commands.HELP_GET_PRO, _showVIPStatus, {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_REPORT_ISSUE, Commands.HELP_REPORT_ISSUE, _handleLinkMenuItem(brackets.config.feedback_url), {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_GET_INVOLVED, Commands.HELP_GET_INVOLVED, _handleLinkMenuItem(brackets.config.activity_url), {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_HOMEPAGE, Commands.HELP_HOMEPAGE, _handleLinkMenuItem(brackets.config.homepage_url), {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.ABOUT_LICENSE || "License", Commands.HELP_VIEW_LICENSE, _handleLicenseDialog, {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_PRIVACY_POLICY, Commands.HELP_PRIVACY_POLICY, _handleLinkMenuItem(brackets.config.privacy_policy_url), {
        supportsDesignMode: true
    });
    CommandManager.register(Strings.CMD_ABOUT, Commands.HELP_ABOUT, _handleAboutDialog, {
        supportsDesignMode: true
    });

    window.addEventListener("weavecode-entitlement-changed", function (event) {
        _updateVIPMenu(event && event.detail);
    });
    AppInit.appReady(function () {
        var helpMenu = Menus.getMenu(Menus.AppMenuBar.HELP_MENU);
        if (helpMenu) {
            helpMenu.addMenuItem(Commands.HELP_VIEW_LICENSE, undefined,
                Menus.AFTER, Commands.HELP_HOMEPAGE);
        }
        _updateVIPMenu();
    });
});
