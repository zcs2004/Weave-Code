(function () {
    "use strict";

    let latestSnapshot = null;

    function element(id) {
        return document.getElementById(id);
    }

    function i18n() {
        return window.top.WeaveAccountVipI18n || {
            text: function (key, fallback) { return fallback || key; },
            format: function (key, fallback, value) {
                return String(fallback || key).replace("{0}", String(value));
            },
            locale: function () { return "en"; }
        };
    }

    function text(key, fallback) {
        return i18n().text(key, fallback);
    }

    function format(key, fallback, value) {
        return i18n().format(key, fallback, value);
    }

    function localizeAccountCenter() {
        document.querySelectorAll("[data-account-i18n]").forEach(function (node) {
            node.textContent = text(node.dataset.accountI18n, node.textContent);
        });
        document.querySelectorAll("[data-account-i18n-aria]").forEach(function (node) {
            node.setAttribute("aria-label", text(node.dataset.accountI18nAria,
                node.getAttribute("aria-label") || ""));
        });
        document.querySelectorAll("[data-account-i18n-title]").forEach(function (node) {
            node.title = text(node.dataset.accountI18nTitle, node.title || "");
        });
        element("weaveAccountCenter").setAttribute("aria-label",
            text("WEAVE_ACCOUNT_INFO_TITLE", "Account information"));
    }

    function enforceAccountButtonLabel() {
        const button = element("weaveAccountStatus");
        if (!button) {
            return;
        }
        const label = text("WEAVE_ACCOUNT_BUTTON", "Account");
        if (button.textContent !== label) {
            button.textContent = label;
        }
        button.setAttribute("aria-label", text("WEAVE_ACCOUNT_CENTER_TITLE", "Account center"));
    }

    function formatDate(timestamp) {
        const value = Number(timestamp) || 0;
        if (value <= 0) {
            return text("WEAVE_MEMBERSHIP_LIFETIME_VALID", "Lifetime");
        }
        const activeLocale = i18n().locale();
        return new Intl.DateTimeFormat(activeLocale || undefined, {
            year: "numeric", month: "2-digit", day: "2-digit"
        }).format(new Date(value));
    }

    function membership(snapshot) {
        if (!snapshot || snapshot.isVip !== true) {
            return {
                label: text("WEAVE_MEMBERSHIP_FREE", "Standard account"),
                plan: text("WEAVE_MEMBERSHIP_PLAN_FREE", "Standard user"), tone: "free"
            };
        }
        const vipType = String(snapshot.vipType || "").toLowerCase();
        const vipPlan = String(snapshot.plan || "").toLowerCase();
        if (vipType === "lifetime" || (!vipType && (vipPlan === "lifetime" || vipPlan === "vip"))) {
            return {
                label: text("WEAVE_MEMBERSHIP_LIFETIME", "Lifetime VIP"),
                plan: text("WEAVE_MEMBERSHIP_PLAN_LIFETIME", "Lifetime VIP"), tone: "lifetime"
            };
        }
        if (vipType === "trial" || (!vipType && vipPlan === "trial")) {
            return {
                label: text("WEAVE_MEMBERSHIP_TRIAL", "Trial VIP"),
                plan: text("WEAVE_MEMBERSHIP_PLAN_TRIAL", "7-day trial VIP"), tone: "trial"
            };
        }
        return {
            label: text("WEAVE_MEMBERSHIP_MONTHLY", "Monthly VIP"),
            plan: text("WEAVE_MEMBERSHIP_PLAN_MONTHLY", "Monthly VIP"), tone: "monthly"
        };
    }

    function hideAccountCenter() {
        const center = element("weaveAccountCenter");
        if (center) {
            center.classList.add("forced-hidden");
        }
    }

    function showSummary() {
        element("weaveChangePasswordForm").classList.add("forced-hidden");
        document.querySelectorAll(".weave-account-section").forEach(function (section) {
            section.classList.remove("forced-hidden");
        });
    }

    function showPasswordForm() {
        document.querySelectorAll(".weave-account-section").forEach(function (section) {
            section.classList.add("forced-hidden");
        });
        element("weaveChangePasswordForm").classList.remove("forced-hidden");
        element("weaveCurrentPassword").focus();
    }

    function expiryWithDays(snapshot) {
        const days = Number(snapshot.vipRemainingDays) || 1;
        return formatDate(snapshot.vipExpiresAt) + " (" +
            format("WEAVE_MEMBERSHIP_DAYS_REMAINING", "{0} days remaining", days) + ")";
    }

    function render(snapshot) {
        if (!snapshot || snapshot.signedIn !== true) {
            return;
        }
        latestSnapshot = snapshot;
        const vip = membership(snapshot);
        element("weaveAccountCenterName").textContent = snapshot.displayName || snapshot.phone ||
            text("WEAVE_ACCOUNT_USER_FALLBACK", "Weave Code user");
        element("weaveAccountCenterPhone").textContent = snapshot.phone || "—";
        element("weaveAccountCenterEmail").textContent = snapshot.email ||
            text("WEAVE_ACCOUNT_EMAIL_NOT_SET", "Not set");
        element("weaveAccountCenterPlan").textContent = vip.plan;
        element("weaveAccountCenterMembership").textContent = vip.label;
        element("weaveAccountCenterMembership").dataset.tone = vip.tone;

        const expiry = element("weaveAccountCenterExpiry");
        const hint = element("weaveAccountCenterHint");
        const manage = element("weaveAccountManageSubscription");
        const vipAction = element("weaveAccountVipAction");
        const vipActionTitle = vipAction.querySelector("strong");
        const vipActionHint = vipAction.querySelector("small");
        if (vip.tone === "lifetime") {
            expiry.textContent = text("WEAVE_MEMBERSHIP_LIFETIME_VALID", "Lifetime");
            hint.textContent = text("WEAVE_MEMBERSHIP_HINT_LIFETIME",
                "Lifetime VIP is active. No further VIP purchase is needed.");
            manage.classList.add("forced-hidden");
            vipAction.disabled = true;
            vipActionTitle.textContent = text("WEAVE_MEMBERSHIP_ALREADY_LIFETIME",
                "You are a lifetime VIP");
            vipActionHint.textContent = "";
            vipActionHint.hidden = true;
        } else if (vip.tone === "monthly") {
            expiry.textContent = expiryWithDays(snapshot);
            hint.textContent = text("WEAVE_MEMBERSHIP_HINT_MONTHLY",
                "Manage or cancel this subscription in Huawei payment's subscription management.");
            manage.classList.remove("forced-hidden");
            vipAction.disabled = false;
            vipActionTitle.textContent = text("WEAVE_MEMBERSHIP_UPGRADE_LIFETIME",
                "Upgrade to lifetime VIP");
            vipActionHint.hidden = false;
            vipActionHint.textContent = text("WEAVE_MEMBERSHIP_MONTHLY_ACTIVE_DESC",
                "Monthly VIP cannot be purchased again while active");
        } else if (vip.tone === "trial") {
            expiry.textContent = expiryWithDays(snapshot);
            hint.textContent = text("WEAVE_MEMBERSHIP_HINT_TRIAL",
                "Unused trial time is carried over when you start a monthly VIP subscription.");
            manage.classList.add("forced-hidden");
            vipAction.disabled = false;
            vipActionTitle.textContent = text("WEAVE_MEMBERSHIP_VIEW_PLANS", "View VIP plans");
            vipActionHint.hidden = false;
            vipActionHint.textContent = text("WEAVE_MEMBERSHIP_TRIAL_CARRYOVER_DESC",
                "Your unused trial time will not be lost");
        } else {
            expiry.textContent = "—";
            hint.textContent = text("WEAVE_MEMBERSHIP_HINT_FREE",
                "Subscribe to VIP to unlock all VIP-only features.");
            manage.classList.add("forced-hidden");
            vipAction.disabled = false;
            vipActionTitle.textContent = text("WEAVE_MEMBERSHIP_VIEW_PLANS", "View VIP plans");
            vipActionHint.hidden = false;
            vipActionHint.textContent = text("WEAVE_MEMBERSHIP_VIEW_PLANS_DESC",
                "Choose monthly VIP or a one-time lifetime purchase");
        }
    }

    async function openAccountCenter() {
        const dialog = element("weaveAccountDialog");
        dialog.classList.remove("forced-hidden");
        ["weaveLoginForm", "weaveRegisterForm", "weaveResetForm"].forEach(function (id) {
            element(id).classList.add("forced-hidden");
        });
        element("weaveAccountCenter").classList.remove("forced-hidden");
        element("weaveAccountDialogTitle").textContent = text("WEAVE_ACCOUNT_CENTER_TITLE", "Account center");
        element("weaveAccountFeedback").textContent = "";
        showSummary();
        try {
            const snapshot = await window.top.Weave.getWeaveAccountState(true);
            render(snapshot);
        } catch (error) {
            element("weaveAccountFeedback").textContent = error && error.message ? error.message : String(error);
        }
    }

    async function manageSubscription() {
        const feedback = element("weaveAccountFeedback");
        feedback.textContent = text("WEAVE_SUBSCRIPTION_OPENING",
            "Opening Huawei subscription management…");
        try {
            const result = await window.top.Weave.weaveIapRequest("manageSubscriptions", {});
            feedback.textContent = result.success ?
                text("WEAVE_SUBSCRIPTION_OPENED", "Huawei subscription management opened") :
                text("WEAVE_SUBSCRIPTION_OPEN_FAILED", "Unable to open subscription management");
        } catch (error) {
            feedback.textContent = error && error.message ? error.message : String(error);
        }
    }

    function openVip() {
        if (latestSnapshot && latestSnapshot.vipType === "lifetime") {
            return;
        }
        if (window.top.Weave && typeof window.top.Weave.openVipPurchaseDialog === "function") {
            window.top.Weave.openVipPurchaseDialog();
        }
    }

    async function changePassword(event) {
        event.preventDefault();
        const feedback = element("weaveAccountFeedback");
        const currentPassword = element("weaveCurrentPassword").value;
        const newPassword = element("weaveNewPassword").value;
        const confirmation = element("weaveNewPasswordConfirm").value;
        if (newPassword !== confirmation) {
            feedback.textContent = text("WEAVE_ACCOUNT_PASSWORD_MISMATCH_CENTER",
                "The two new passwords do not match");
            element("weaveNewPasswordConfirm").focus();
            return;
        }
        feedback.textContent = text("WEAVE_ACCOUNT_PASSWORD_CHANGING", "Changing password…");
        try {
            const result = await window.top.Weave.weaveAccountRequest("changePassword", {
                currentPassword: currentPassword, newPassword: newPassword
            });
            const passwordErrors = {
                invalid_current_password: ["WEAVE_ACCOUNT_CURRENT_PASSWORD_INVALID",
                    "The current password is incorrect"],
                password_unchanged: ["WEAVE_ACCOUNT_PASSWORD_UNCHANGED",
                    "The new password must be different from the current password"]
            };
            const passwordError = passwordErrors[result.code];
            feedback.textContent = result.success ?
                text("WEAVE_ACCOUNT_PASSWORD_CHANGED", "Password changed") :
                (passwordError ? text(passwordError[0], passwordError[1]) :
                    text("WEAVE_ACCOUNT_PASSWORD_CHANGE_FAILED", "Unable to change password"));
            if (result.success === true) {
                event.currentTarget.reset();
                if (result.snapshot) {
                    render(result.snapshot);
                }
                showSummary();
            }
        } catch (error) {
            feedback.textContent = error && error.message ? error.message : String(error);
        }
    }

    function attachPasswordVisibility() {
        document.querySelectorAll("#weaveChangePasswordForm .weave-password-toggle").forEach(function (button) {
            button.addEventListener("click", function () {
                window.setTimeout(function () {
                    const visible = button.getAttribute("aria-pressed") === "true";
                    const key = visible ? "WEAVE_ACCOUNT_HIDE_PASSWORD_CENTER" :
                        "WEAVE_ACCOUNT_SHOW_PASSWORD_CENTER";
                    const fallback = visible ? "Hide password" : "Show password";
                    button.setAttribute("aria-label", text(key, fallback));
                    button.title = text(key, fallback);
                }, 0);
            });
        });
    }

    function attach() {
        localizeAccountCenter();
        enforceAccountButtonLabel();
        const observer = new MutationObserver(enforceAccountButtonLabel);
        observer.observe(element("weaveAccountStatus"), {childList: true, characterData: true, subtree: true});
        element("weaveAccountStatus").addEventListener("click", openAccountCenter);
        element("weaveAccountLogin").addEventListener("click", hideAccountCenter);
        document.querySelectorAll("[data-account-panel]").forEach(function (button) {
            button.addEventListener("click", hideAccountCenter);
        });
        element("weaveAccountManageSubscription").addEventListener("click", manageSubscription);
        element("weaveAccountVipAction").addEventListener("click", openVip);
        element("weaveAccountChangePassword").addEventListener("click", showPasswordForm);
        element("weaveChangePasswordBack").addEventListener("click", showSummary);
        element("weaveChangePasswordForm").addEventListener("submit", changePassword);
        attachPasswordVisibility();
        window.top.addEventListener("weavecode-entitlement-changed", function (event) {
            enforceAccountButtonLabel();
            const snapshot = event.detail || {};
            if (snapshot.signedIn !== true) {
                hideAccountCenter();
                element("weaveAccountDialog").classList.add("forced-hidden");
                return;
            }
            render(snapshot);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attach, {once: true});
    } else {
        attach();
    }
}());
