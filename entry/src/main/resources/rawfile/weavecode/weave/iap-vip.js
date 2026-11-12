(function () {
    "use strict";

    const SUBSCRIPTION_AGREEMENT_URL = "https://subscriptionservice.dhuzcs.com";

    if (!window.Weave) {
        return;
    }

    const textKeys = {
        title: ["WEAVE_IAP_TITLE", "Weave Code VIP"],
        loading: ["WEAVE_IAP_LOADING", "Loading products…"],
        buy: ["WEAVE_IAP_BUY", "Buy now"],
        close: ["WEAVE_IAP_CLOSE", "Close"],
        agreementPrefix: ["WEAVE_IAP_AGREEMENT_PREFIX", "Check to agree to the"],
        agreementLink: ["WEAVE_IAP_AGREEMENT_LINK", "Personal Subscription Service Agreement"],
        agreementRequired: ["WEAVE_IAP_AGREEMENT_REQUIRED", "Please agree to the Personal Subscription Service Agreement before purchasing."],
        agreementOpenFailed: ["WEAVE_IAP_AGREEMENT_OPEN_FAILED", "Unable to open the Personal Subscription Service Agreement."],
        lifetimeNoticeTitle: ["WEAVE_IAP_LIFETIME_NOTICE_TITLE", "Purchase completed"],
        lifetimeNoticeMessage: ["WEAVE_IAP_LIFETIME_NOTICE_MESSAGE", "You have purchased Lifetime VIP. If you previously subscribed to Monthly VIP, please manage that subscription through Huawei Payments to avoid unnecessary charges."],
        lifetimeNoticeConfirm: ["WEAVE_IAP_LIFETIME_NOTICE_CONFIRM", "Got it"],
        signIn: ["WEAVE_IAP_SIGN_IN", "Sign in before purchasing VIP."],
        noProducts: ["WEAVE_IAP_NO_PRODUCTS", "No VIP products are available right now."],
        purchasing: ["WEAVE_IAP_PURCHASING", "Opening Huawei checkout…"],
        success: ["WEAVE_IAP_SUCCESS", "VIP has been synchronized to this Weave Code account."],
        monthly: ["WEAVE_IAP_MONTHLY", "Renews monthly and is managed through Huawei."],
        lifetime: ["WEAVE_IAP_LIFETIME", "One-time purchase with permanent access."],
        note: ["WEAVE_IAP_NOTE", "Unused trial time carries over after the first monthly period."],
        nativeOnly: ["WEAVE_IAP_NATIVE_ONLY", "In-app purchases are only available in the HarmonyOS app"],
        monthlyFallback: ["WEAVE_IAP_MONTHLY_FALLBACK", "Monthly VIP"],
        lifetimeFallback: ["WEAVE_IAP_LIFETIME_FALLBACK", "Lifetime VIP"],
        benefitsTitle: ["WEAVE_MEMBERSHIP_BENEFITS_TITLE", "VIP-only features"],
        benefitVisualEdit: ["WEAVE_MEMBERSHIP_BENEFIT_VISUAL_EDIT", "Live visual web editing"],
        benefitLayout: ["WEAVE_MEMBERSHIP_BENEFIT_LAYOUT", "Element layout and measurement inspection"],
        benefitMarkdown: ["WEAVE_MEMBERSHIP_BENEFIT_MARKDOWN", "Rich Markdown editing and export"],
        benefitCodeIntelligence: ["WEAVE_MEMBERSHIP_BENEFIT_CODE_INTELLIGENCE", "Enhanced code intelligence and diagnostics"]
    };
    const text = new Proxy({}, {
        get: function (_target, property) {
            const entry = textKeys[property];
            return entry ? window.WeaveAccountVipI18n.text(entry[0], entry[1]) : String(property);
        }
    });

    let dialog = null;
    let lifetimeNoticeDialog = null;
    let busy = false;

    function subscriptionAgreementUrl() {
        let activeLocale = "en";
        try {
            if (window.WeaveAccountVipI18n && typeof window.WeaveAccountVipI18n.locale === "function") {
                activeLocale = window.WeaveAccountVipI18n.locale();
            }
        } catch (error) {
            console.debug("Unable to read agreement locale", error);
        }
        const language = String(activeLocale || "en")
            .replace(/_/g, "-")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "") || "en";
        return SUBSCRIPTION_AGREEMENT_URL + "/?lang=" + encodeURIComponent(language);
    }

    function localizedResultMessage(result, fallback) {
        const mapping = {
            cancelled: ["WEAVE_IAP_CANCELLED", "Purchase cancelled"],
            sign_in_required: ["WEAVE_IAP_SIGN_IN", "Sign in before purchasing VIP."],
            already_owned: ["WEAVE_IAP_ALREADY_OWNED", "You already own this product."],
            lifetime_vip_active: ["WEAVE_IAP_LIFETIME_ACTIVE", "You are already a lifetime VIP."],
            monthly_subscription_active: ["WEAVE_IAP_MONTHLY_ACTIVE", "Monthly VIP is already active."],
            network_error: ["WEAVE_IAP_NETWORK_ERROR", "Unable to connect to Huawei In-App Purchases."],
            huawei_sign_in_required: ["WEAVE_IAP_HUAWEI_SIGN_IN", "Sign in to your Huawei account first."],
            app_not_authorized: ["WEAVE_IAP_AUTHORIZATION_ERROR", "The app is not authorized for Huawei In-App Purchases."],
            region_not_supported: ["WEAVE_IAP_REGION_ERROR", "Huawei In-App Purchases is unavailable in this region."],
            invalid_product: ["WEAVE_IAP_INVALID_PRODUCT", "This VIP product is unavailable."],
            invalid_action: ["WEAVE_IAP_INVALID_ACTION", "This purchase action is not supported."],
            no_active_subscription: ["WEAVE_IAP_NO_ACTIVE_SUBSCRIPTION", "No active monthly VIP subscription was found."],
            sandbox_not_activated: ["WEAVE_IAP_SANDBOX_NOT_ACTIVATED", "Huawei IAP sandbox testing is not enabled for this app."],
            invalid_build_environment: ["WEAVE_IAP_INVALID_BUILD_ENVIRONMENT", "The IAP build environment is invalid."],
            release_uses_sandbox: ["WEAVE_IAP_RELEASE_USES_SANDBOX", "A release build cannot use the Huawei IAP sandbox."],
            release_signing_required: ["WEAVE_IAP_RELEASE_SIGNING_REQUIRED", "Configure release signing before using production purchases."],
            debug_signing_required: ["WEAVE_IAP_DEBUG_SIGNING_REQUIRED", "The debug signing certificate does not match the Huawei IAP sandbox configuration."],
            sandbox_account_required: ["WEAVE_IAP_SANDBOX_ACCOUNT_REQUIRED", "Sign in with a Huawei sandbox test account."]
        };
        const entry = result && mapping[result.code];
        return entry ? window.WeaveAccountVipI18n.text(entry[0], entry[1]) :
            ((result && result.message) || fallback || text.noProducts);
    }

    window.Weave.weaveIapRequest = async function (action, payload) {
        if (!window.xingzhiNative || typeof window.xingzhiNative.weaveIapRequest !== "function") {
            throw new Error(text.nativeOnly);
        }
        const result = await window.Weave._callWeaveNative(
            "weaveIapRequest", [action, JSON.stringify(payload || {})], "VIP"
        );
        if (result && result.snapshot) {
            result.snapshot.loadedAt = Date.now();
            window.Weave.applyWeaveAccountState(result.snapshot);
        }
        return result;
    };

    function setFeedback(message, isError) {
        if (!dialog) {
            return;
        }
        const feedback = dialog.querySelector(".weave-iap-feedback");
        feedback.textContent = message || "";
        feedback.dataset.error = isError ? "true" : "false";
    }

    function setBusy(value) {
        busy = value;
        if (!dialog) {
            return;
        }
        const agreementCheckbox = dialog.querySelector(".weave-iap-agreement input");
        if (agreementCheckbox) {
            agreementCheckbox.disabled = value;
        }
        dialog.querySelectorAll("button").forEach(function (button) {
            if (!button.classList.contains("weave-iap-close")) {
                button.disabled = value || button.dataset.unavailable === "true";
            }
        });
    }

    function closeDialog() {
        if (dialog && !busy) {
            dialog.hidden = true;
        }
    }

    function agreementAccepted() {
        const checkbox = dialog && dialog.querySelector(".weave-iap-agreement input");
        return Boolean(checkbox && checkbox.checked);
    }

    function openSubscriptionAgreement(event) {
        event.preventDefault();
        const agreementUrl = subscriptionAgreementUrl();
        try {
            if (window.Weave.app && typeof window.Weave.app.openURLInDefaultBrowser === "function") {
                Promise.resolve(window.Weave.app.openURLInDefaultBrowser(agreementUrl))
                    .catch(function (error) {
                        console.error("Unable to open subscription agreement", error);
                        setFeedback(text.agreementOpenFailed, true);
                    });
                return;
            }
            const opened = window.open(agreementUrl, "_blank", "noopener,noreferrer");
            if (!opened) {
                setFeedback(text.agreementOpenFailed, true);
            }
        } catch (error) {
            console.error("Unable to open subscription agreement", error);
            setFeedback(text.agreementOpenFailed, true);
        }
    }

    function closeLifetimePurchaseNotice() {
        if (lifetimeNoticeDialog) {
            lifetimeNoticeDialog.hidden = true;
        }
    }

    function localizeLifetimePurchaseNotice() {
        if (!lifetimeNoticeDialog) return;
        lifetimeNoticeDialog.querySelector("h3").textContent = text.lifetimeNoticeTitle;
        lifetimeNoticeDialog.querySelector("p").textContent = text.lifetimeNoticeMessage;
        lifetimeNoticeDialog.querySelector("button").textContent = text.lifetimeNoticeConfirm;
    }

    function showLifetimePurchaseNotice() {
        if (!lifetimeNoticeDialog) {
            const backdrop = document.createElement("div");
            backdrop.className = "weave-iap-lifetime-notice-backdrop";
            backdrop.hidden = true;
            backdrop.innerHTML =
                '<section class="weave-iap-lifetime-notice" role="alertdialog" aria-modal="true" ' +
                    'aria-labelledby="weaveIapLifetimeNoticeTitle" aria-describedby="weaveIapLifetimeNoticeMessage">' +
                    '<h3 id="weaveIapLifetimeNoticeTitle"></h3>' +
                    '<p id="weaveIapLifetimeNoticeMessage"></p>' +
                    '<div class="weave-iap-lifetime-notice-actions">' +
                        '<button type="button"></button>' +
                    '</div>' +
                '</section>';
            backdrop.querySelector("button").addEventListener("click", closeLifetimePurchaseNotice);
            backdrop.addEventListener("click", function (event) {
                if (event.target === backdrop) closeLifetimePurchaseNotice();
            });
            document.body.appendChild(backdrop);
            lifetimeNoticeDialog = backdrop;
        }
        localizeLifetimePurchaseNotice();
        lifetimeNoticeDialog.hidden = false;
        lifetimeNoticeDialog.querySelector("button").focus();
    }

    function localizeDialog(backdrop) {
        backdrop.querySelector("h2").textContent = text.title;
        const closeButton = backdrop.querySelector(".weave-iap-close");
        closeButton.setAttribute("aria-label", text.close);
        backdrop.querySelector(".weave-iap-benefits h3").textContent = text.benefitsTitle;
        const benefitLabels = [text.benefitVisualEdit, text.benefitLayout,
            text.benefitMarkdown, text.benefitCodeIntelligence];
        backdrop.querySelectorAll(".weave-iap-benefits li").forEach(function (item, index) {
            item.textContent = benefitLabels[index];
        });
        backdrop.querySelector(".weave-iap-note").textContent = text.note;
        const agreementCheckbox = backdrop.querySelector(".weave-iap-agreement input");
        agreementCheckbox.setAttribute("aria-label", text.agreementPrefix + " " + text.agreementLink);
        backdrop.querySelector(".weave-iap-agreement label").textContent = text.agreementPrefix;
        const agreementLink = backdrop.querySelector(".weave-iap-agreement a");
        agreementLink.textContent = text.agreementLink;
        agreementLink.href = subscriptionAgreementUrl();
    }

    function createDialog() {
        const backdrop = document.createElement("div");
        backdrop.className = "weave-iap-backdrop";
        backdrop.hidden = true;
        backdrop.innerHTML =
            '<section class="weave-iap-dialog" role="dialog" aria-modal="true" aria-labelledby="weaveIapTitle">' +
                '<header class="weave-iap-header"><h2 id="weaveIapTitle"></h2>' +
                '<button class="weave-iap-close" type="button">×</button></header>' +
                '<div class="weave-iap-content"><div class="weave-iap-products"></div>' +
                 '<section class="weave-iap-benefits" aria-labelledby="weaveIapBenefitsTitle">' +
                     '<h3 id="weaveIapBenefitsTitle"></h3><ul><li></li><li></li><li></li><li></li></ul></section>' +
                 '<p class="weave-iap-feedback" aria-live="polite"></p><p class="weave-iap-note"></p>' +
                 '<div class="weave-iap-agreement">' +
                     '<input id="weaveIapAgreement" type="checkbox">' +
                     '<label for="weaveIapAgreement"></label>' +
                     '<a href="' + SUBSCRIPTION_AGREEMENT_URL + '" target="_blank" rel="noopener noreferrer"></a>' +
                 '</div></div>' +
             '</section>';
        const agreementLink = backdrop.querySelector(".weave-iap-agreement a");
        agreementLink.addEventListener("click", openSubscriptionAgreement);
        backdrop.querySelector(".weave-iap-close").addEventListener("click", closeDialog);
        backdrop.addEventListener("click", function (event) {
            if (event.target === backdrop) closeDialog();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") return;
            if (lifetimeNoticeDialog && !lifetimeNoticeDialog.hidden) {
                closeLifetimePurchaseNotice();
                return;
            }
            if (dialog && !dialog.hidden) closeDialog();
        });
        document.body.appendChild(backdrop);
        localizeDialog(backdrop);
        return backdrop;
    }

    function renderProducts(products) {
        const container = dialog.querySelector(".weave-iap-products");
        container.textContent = "";
        products.forEach(function (product) {
            const card = document.createElement("article");
            card.className = "weave-iap-product";
            const title = document.createElement("h3");
            title.textContent = product.name ||
                (product.period === "monthly" ? text.monthlyFallback : text.lifetimeFallback);
            const description = document.createElement("p");
            description.textContent = product.description ||
                (product.period === "monthly" ? text.monthly : text.lifetime);
            const price = document.createElement("div");
            price.className = "weave-iap-price";
            price.textContent = product.localPrice || "—";
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = product.available === false ?
                localizedResultMessage({code: product.unavailableCode, message: product.buttonLabel}, text.buy) :
                text.buy;
            button.dataset.unavailable = product.available === false ? "true" : "false";
            button.disabled = product.available === false;
            if (product.available === false) {
                card.classList.add("weave-iap-product-owned");
                const owned = document.createElement("p");
                owned.className = "weave-iap-owned-reason";
                owned.textContent = localizedResultMessage({
                    code: product.unavailableCode,
                    message: product.unavailableReason
                }, button.textContent);
                card.append(title, description, price, owned, button);
                container.appendChild(card);
                return;
            }
            button.addEventListener("click", async function () {
                if (busy) return;
                if (!agreementAccepted()) {
                    setFeedback(text.agreementRequired, true);
                    const agreementCheckbox = dialog.querySelector(".weave-iap-agreement input");
                    if (agreementCheckbox) agreementCheckbox.focus();
                    return;
                }
                setBusy(true);
                setFeedback(text.purchasing, false);
                try {
                    const result = await window.Weave.weaveIapRequest("purchase", { productId: product.id });
                    setFeedback(result.success === true ? text.success : localizedResultMessage(result, text.noProducts),
                        result.success !== true && result.code !== "cancelled");
                    if (result.success === true) {
                        if (product.period === "lifetime") {
                            showLifetimePurchaseNotice();
                        }
                        const refreshed = await window.Weave.weaveIapRequest("products", {});
                        if (refreshed.success === true && Array.isArray(refreshed.products)) {
                            renderProducts(refreshed.products);
                        }
                    }
                } catch (error) {
                    setFeedback(error && error.message ? error.message : String(error), true);
                } finally {
                    setBusy(false);
                }
            });
            card.append(title, description, price, button);
            container.appendChild(card);
        });
    }

    window.Weave.openVipPurchaseDialog = async function () {
        dialog = dialog || createDialog();
        localizeDialog(dialog);
        dialog.hidden = false;
        const agreementCheckbox = dialog.querySelector(".weave-iap-agreement input");
        if (agreementCheckbox) agreementCheckbox.checked = true;
        setFeedback(text.loading, false);
        dialog.querySelector(".weave-iap-products").textContent = "";
        try {
            const account = await window.Weave.getWeaveAccountState(true);
            if (!account || account.signedIn !== true) {
                setFeedback(text.signIn, true);
                return;
            }
            setBusy(true);
            const result = await window.Weave.weaveIapRequest("products", {});
            if (result.success !== true || !Array.isArray(result.products) || result.products.length === 0) {
                setFeedback(localizedResultMessage(result, text.noProducts), true);
                return;
            }
            renderProducts(result.products);
            setFeedback("", false);
        } catch (error) {
            setFeedback(error && error.message ? error.message : String(error), true);
        } finally {
            setBusy(false);
            const firstButton = dialog.querySelector(".weave-iap-product button");
            if (firstButton) firstButton.focus();
        }
    };
}());
