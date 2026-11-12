// this is a single file sent to browser preview. keep this light. add features as extensions
// Please do not add any license header in this file as it will end up in distribution bin as is.
/**
 * RemoteFunctions define the functions to be executed in the browser. This
 * modules should define a single function that returns an object of all
 * exported functions.
 */
// eslint-disable-next-line no-unused-vars
function RemoteFunctions(config = {}) {
    const GLOBALS = {
        // given to internal elements like info box, tool box, image gallery and all other wecode internal elements
        // to distinguish between weave internal vs user created elements
        WECODE_INTERNAL_ATTR: "data-wecode-internal-c15r5a9",
        DATA_BRACKETS_ID_ATTR: "data-brackets-id", // data attribute used to track elements for live preview operations
        LP_REF_ATTR: "data-wecode-lp-ref", // identity of a script-added element, stamped only when it is selected
        HIGHLIGHT_CLASSNAME: "__brackets-ld-highlight" // CSS class name used for highlighting elements in live preview
    };

    // this is for bidirectional communication between weave and live preview
    const WeaveComm = window._Brackets_LiveDev_WeaveComm;
    WeaveComm && WeaveComm.registerLpFn("PH_Hello", function(param) {
        // this is just a test function here to check if live preview. fn call is working correctly.
        console.log("Hello World", param);
    });
    // Injected plugins share this closure; the window property is removed after injection.
    const MessageBroker = window._Brackets_MessageBroker;

    const SHARED_STATE = {
        __description: "Use this to keep shared state for Live Preview Edit instead of window.*",
        _suppressDOMEditDismissal: false,
        _suppressDOMEditDismissalTimeout: null,
        _boxModelHighlightHidden: false
    };

    let _hoverHighlight;
    let _clickHighlight;
    let _cssSelectorHighlight; // temporary highlight for CSS selector matches in edit mode
    let _hoverLockTimer = null;
    let _cssSelectorHighlightTimer = null;
    let _lastHoverTarget = null; // tracks the element currently under the mouse (for same-element skip)
    let _pendingHoverRAF = null; // pending requestAnimationFrame ID for hover updates
    // a hover shows once the pointer has stayed on an element this long, so the elements
    // passing under it during a sweep or a scroll don't flash
    const HOVER_SETTLE_MS = 60;
    let _hoverSettleTimer = null;
    let _hoverSettled = false;

    // this will store the element that was clicked previously (before the new click)
    // we need this so that we can remove click styling from the previous element when a new element is clicked
    let previouslySelectedElement = null;
    let _sourcelessObserver = null;
    let _sourcelessCheckTimer = null;
    let _sourcelessPath = null;
    let _sourcelessTag = null;
    let _sourcelessClass = null;
    const SOURCELESS_RECOVER_DELAY_MS = 60;
    let _selectedFromEditor = false;
    // the element selected by name (layers panel row), not by pointer
    let _namedSelection = null;
    // the element the caret points at while the selection is held elsewhere
    let _caretTarget = null;
    // Expose the currently selected element globally for external access
    window.__current_ph_lp_selected = null;

    const COLORS = {
        highlightPadding: "rgba(147, 196, 125, 0.55)",
        highlightMargin: "rgba(246, 178, 107, 0.66)",
        outlineEditable: "#4285F4",
        outlineNonEditable: "#6F6F78"
    };

    // the following fucntions can be in the handler and live preview will call those functions when the below
    // events happen
    const allowedHandlerFns = [
        "dismiss", // when handler gets this event, it should dismiss all ui it renders in the live preview
        "createToolBox",
        "createInfoBox",
        "showHoverBox",
        "createMoreOptionsDropdown",
        // render an icon or html when the selected element toolbox appears in edit mode.
        "renderToolBoxItem",
        "redraw",
        "onElementSelected", // an item is selected in live preview
        "onElementCleanup",
        "onNonEditableElementClick", // called when user clicks on a non-editable element
        "getHiddenCause", // asked of the "ElementVisibility" handler, see getHiddenCause()
        "onHiddenElementPicked", // the user picked an element they cannot see, called with its hidden cause
        "handleConfigChange",
        // below  function gets called to render the dropdown when user clicks on the ... menu in the tool box,
        // the handler should retrun html tor ender the dropdown item.
        "renderDropdownItems",
        // called when an item is selected from the more options dropdown
        "handleDropdownClick",
        "updateContent", // in-place content refresh for control box etc. after drag
        // a DOM edit changed the selected element's attributes or rebuilt its node —
        // refresh shown UI in place; must never resurrect dismissed UI
        "onSelectedElementMutated",
        "reRegisterEventHandlers",
        "handleClick", // handle click on an icon in the tool box.
        // when escape key is presses in the editor, we may need to dismiss the live edit boxes.
        "handleEscapePress",
        // interaction blocks acts as 'kill switch' to block all kinds of click handlers
        // this is done so that links or buttons doesn't perform their natural operation in edit mode
        "registerInteractionBlocker", // to block
        "unregisterInteractionBlocker", // to unblock
        "udpateHotCornerState" // to update the hot corner button when state changes
    ];

    const _toolHandlers = new Map();
    function registerToolHandler(handlerName, handler) {
        if(_toolHandlers.get(handlerName)) {
            console.error(`lp: Tool handler '${handlerName}' already registered. Ignoring new registration`);
            return;
        }
        if (!handler || typeof handler !== "object") {
            console.error(`lp: Tool handler '${handlerName}' value is invalid ${JSON.stringify(handler)}.`);
            return;
        }
        handler.handlerName = handlerName;
        for (const key of Object.keys(handler)) {
            if (key !== "handlerName" && !allowedHandlerFns.includes(key)) {
                console.warn(`lp: Tool handler '${handlerName}' has unknown property '${key}'`,
                    `should be one of ${allowedHandlerFns.join(",")}`);
            }
        }
        _toolHandlers.set(handlerName, handler);
    }
    function getToolHandler(handlerName) {
        return _toolHandlers.get(handlerName);
    }
    function getAllToolHandlers() {
        return Array.from(_toolHandlers.values());
    }

    /**
     * check if an element is inspectable.
     * inspectable elements are those which doesn't have GLOBALS.DATA_BRACKETS_ID_ATTR ('data-brackets-id'),
     * this normally happens when content is DOM content is inserted by some scripting language
     *
     * The `wecode-no-lp-edit` opt-out is not part of this check: it only keeps the
     * pointer off an element, see isPointerEditOptedOut.
     *
     * @param {DOMElement} element
     * @param {boolean} [onlyHighlight=false] - If true, bypasses the mode check
     */
    function isElementInspectable(element, onlyHighlight = false) {
        if(config.mode !== 'edit' && !onlyHighlight) {
            return false;
        }

        if(element && // element should exist
            (!isBodyElement(element) || _isNamedSelection(element)) && // body only when selected by name
            element.tagName.toLowerCase() !== "html" && // shouldn't be the HTML tag
            // this attribute is used by weave internal elements
            !element.closest(`[${GLOBALS.WECODE_INTERNAL_ATTR}]`) &&
            !_isInsideHeadTag(element)) { // shouldn't be inside the head tag like meta tags and all
            return true;
        }
        return false;
    }

    // The body is never selected by pointer (blank clicks deselect, hover stays quiet),
    // only by name from the layers panel or the caret, and then without the structural tools.
    function isBodyElement(element) {
        return !!(element && element.tagName && element.tagName.toLowerCase() === "body");
    }

    // a named selection lifts the body block, a pointer-only guard
    function _isNamedSelection(element) {
        return !!element && element === _namedSelection;
    }

    /**
     * Whether the page keeps pointer actions on this element to itself: hover,
     * click, double click and drops in the live preview leave it alone, so its
     * own widgets keep working. It is still an element like any other to every
     * path that is not the pointer - the layers panel, the caret, the tools.
     * `wecode-no-lp-edit` cascades to descendants, `wecode-no-lp-edit-this` covers
     * the one element.
     * @param {DOMElement} element
     * @returns {boolean}
     */
    function isPointerEditOptedOut(element) {
        return !!(element && element.closest && (element.closest('.wecode-no-lp-edit') ||
            (element.classList && element.classList.contains('wecode-no-lp-edit-this'))));
    }

    /**
     * This is a checker function for editable elements, it makes sure that the element satisfies all the required check
     * - When onlyHighlight is false → config.mode must be 'edit'
     * - When onlyHighlight is true → config.mode can be any mode (doesn't matter)
     * @param {DOMElement} element
     * @param {boolean} [onlyHighlight=false] - If true, bypasses the mode check
     * @returns {boolean} - True if the element is editable else false
     */
    function isElementEditable(element, onlyHighlight = false) {
        // for an element to be editable it should satisfy all inspectable checks and should also have data-brackets-id
        return isElementInspectable(element, onlyHighlight) && element.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
    }

    // no data-brackets-id means a script added the element, so there is no HTML source for it
    function isSourceless(element) {
        return !!element && !element.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
    }

    let _lpRefCounter = 0;
    const LP_REF_PREFIX = "j";
    const RE_NUMERIC_ID = /^\d+$/;

    function getElementRef(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }
        const tagId = element.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
        if (tagId) {
            return tagId;
        }
        let ref = element.getAttribute(GLOBALS.LP_REF_ATTR);
        if (!ref) {
            ref = LP_REF_PREFIX + (++_lpRefCounter);
            element.setAttribute(GLOBALS.LP_REF_ATTR, ref);
        }
        return ref;
    }

    function getElementByRef(ref) {
        if (ref === null || ref === undefined || ref === "") {
            return null;
        }
        const text = String(ref);
        const attr = RE_NUMERIC_ID.test(text) ? GLOBALS.DATA_BRACKETS_ID_ATTR : GLOBALS.LP_REF_ATTR;
        return window.document.querySelector("[" + attr + '="' + text + '"]');
    }

    /**
     * this function calc the screen offset of an element
     *
     * @param {DOMElement} element
     * @returns {{left: number, top: number}}
     */
    function screenOffset(element) {
        const elemBounds = element.getBoundingClientRect();
        const body = window.document.body;
        let offsetTop;
        let offsetLeft;

        if (window.getComputedStyle(body).position === "static") {
            offsetLeft = elemBounds.left + window.pageXOffset;
            offsetTop = elemBounds.top + window.pageYOffset;
        } else {
            const bodyBounds = body.getBoundingClientRect();
            offsetLeft = elemBounds.left - bodyBounds.left;
            offsetTop = elemBounds.top - bodyBounds.top;
        }
        return { left: offsetLeft, top: offsetTop };
    }

    const LivePreviewView = {
        registerToolHandler: registerToolHandler,
        getToolHandler: getToolHandler,
        getAllToolHandlers: getAllToolHandlers,
        isElementEditable: isElementEditable,
        isElementInspectable: isElementInspectable,
        isPointerEditOptedOut: isPointerEditOptedOut,
        isBodyElement: isBodyElement,
        isSourceless: isSourceless,
        getElementRef: getElementRef,
        getElementByRef: getElementByRef,
        isElementVisible: isElementVisible,
        getHiddenCause: getHiddenCause,
        announceIfHidden: announceIfHidden,
        screenOffset: screenOffset,
        selectElement: selectElement,
        isSelectedFromEditor: function () { return _selectedFromEditor; },
        highlightRuleAroundSelection: highlightRuleAroundSelection,
        getCaretTarget: function () { return _caretTarget; },
        isNamedSelection: _isNamedSelection,
        toMatchableSelector: toMatchableSelector,
        sendSelectionToEditor: sendSelectionToEditor,
        brieflyDisableHoverListeners: brieflyDisableHoverListeners,
        handleElementClick: handleElementClick,
        cleanupPreviousElementState: cleanupPreviousElementState,
        disableHoverListeners: disableHoverListeners,
        enableHoverListeners: enableHoverListeners,
        redrawHighlights: redrawHighlights,
        redrawEverything: redrawEverything,
        getTreePath: _getTreePath,
        getElementByTreePath: _getElementByTreePath,
        getSourceChildren: _instrumentedChildren
    };

    /**
     * @type {DOMEditHandler}
     */
    var _editHandler;

    // the below code comment is replaced by added scripts for extensibility
    // DONT_STRIP_MINIFY:REPLACE_WITH_ADDED_REMOTE_CONSTANT_SCRIPTS

    // helper function to check if an element is inside the HEAD tag
    // we need this because we don't wanna trigger the element highlights on head tag and its children,
    // except for <style> tags which should be allowed
    function _isInsideHeadTag(element) {
        let parent = element;
        while (parent && parent !== window.document) {
            if (parent.tagName.toLowerCase() === "head") {
                // allow <style> tags inside <head>
                return element.tagName.toLowerCase() !== "style";
            }
            parent = parent.parentElement;
        }
        return false;
    }

    // set an event on a element
    function _trigger(element, name, value, autoRemove) {
        var key = "data-ld-" + name;
        if (value !== undefined && value !== null) {
            element.setAttribute(key, value);
            if (autoRemove) {
                window.setTimeout(element.removeAttribute.bind(element, key));
            }
        } else {
            element.removeAttribute(key);
        }
    }

    // Checks if the element is in Viewport in the client browser
    function isInViewport(element) {
        var rect = element.getBoundingClientRect();
        var html = window.document.documentElement;
        return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight || html.clientHeight)
        );
    }

    // Why the user cannot see the element as {reason, by, declaration, inPlace}, null when they can.
    // The "ElementVisibility" tool handler knows more ways of hiding than the basic checks here.
    function getHiddenCause(element) {
        if (!element) {
            return null;
        }
        const checker = getToolHandler("ElementVisibility");
        if (checker && checker.getHiddenCause) {
            return checker.getHiddenCause(element);
        }
        return _isBasicallyVisible(element) ? null : { reason: "hidden", by: element, inPlace: true };
    }

    function isElementVisible(element) {
        return !getHiddenCause(element);
    }

    // a pick of an element the user cannot see is answered with why, by a handler that can say it
    function announceIfHidden(element) {
        const cause = getHiddenCause(element);
        if (!cause) {
            return;
        }
        getAllToolHandlers().forEach(handler => {
            if (handler.onHiddenElementPicked) {
                handler.onHiddenElementPicked(element, cause);
            }
        });
    }

    // Checks if an element is actually visible to the user (not hidden, collapsed, or off-screen)
    function _isBasicallyVisible(element) {
        // Check if element has zero dimensions (indicates it's hidden or collapsed)
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            return false;
        }

        // Check computed styles for visibility
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.display === 'none' ||
            computedStyle.visibility === 'hidden' ||
            computedStyle.opacity === '0') {
            return false;
        }

        // Check if any parent element is hidden
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' ||
                parentStyle.visibility === 'hidden') {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    // returns the distance from the top of the closest relatively positioned parent element
    function getDocumentOffsetTop(element) {
        return element.offsetTop + (element.offsetParent ? getDocumentOffsetTop(element.offsetParent) : 0);
    }

    // Shadow DOM host for highlight overlays — isolates our UI from user page CSS.
    let _highlightShadowHost = null;
    let _highlightShadowRoot = null;

    const HIGHLIGHT_CSS = `:host {
        all: initial !important;
    }

    .overlay-container {
        position: absolute !important;
        z-index: 2147483645 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        pointer-events: none !important;
        box-sizing: border-box !important;
    }

    .rect {
        position: absolute !important;
    }

    .overlay-container.hidden {
        display: none !important;
    }

    .outline {
        position: absolute !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
    }

    .measurement-line {
        position: absolute !important;
        display: none;
        pointer-events: none !important;
        background: rgba(91, 143, 249, .72) !important;
    }

    .measurement-line.horizontal {
        height: 1px !important;
    }

    .measurement-line.vertical {
        width: 1px !important;
    }

    .measurement-label {
        position: absolute !important;
        display: none;
        min-width: max-content !important;
        padding: 3px 7px !important;
        border: 1px solid rgba(113, 160, 255, .9) !important;
        border-radius: 4px !important;
        color: #fff !important;
        background: rgba(31, 79, 173, .96) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .28) !important;
        font: 600 11px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        white-space: nowrap !important;
        pointer-events: none !important;
    }`;

    function _ensureHighlightShadowRoot() {
        if (_highlightShadowRoot) {
            return _highlightShadowRoot;
        }
        _highlightShadowHost = window.document.createElement("div");
        _highlightShadowHost.className = GLOBALS.HIGHLIGHT_CLASSNAME;
        _highlightShadowHost.setAttribute(GLOBALS.WECODE_INTERNAL_ATTR, "true");
        _highlightShadowRoot = _highlightShadowHost.attachShadow({ mode: "open" });
        _highlightShadowRoot.innerHTML = `<style>${HIGHLIGHT_CSS}</style>`;
        window.document.body.appendChild(_highlightShadowHost);
        return _highlightShadowRoot;
    }

    // Overlay pool — overlays are created once and reused across highlights.
    // When released, they stay in the shadow DOM (hidden) ready for instant reuse.
    // This eliminates all DOM creation/destruction from the highlight hot paths.
    const _overlayPool = [];

    function _createOverlayStructure() {
        const div = window.document.createElement("div");
        div.className = "overlay-container hidden";

        function createRect() {
            const r = window.document.createElement("div");
            r.className = "rect";
            return r;
        }

        const padTop = createRect(), padBottom = createRect(),
            padLeft = createRect(), padRight = createRect();
        const marTop = createRect(), marBottom = createRect(),
            marLeft = createRect(), marRight = createRect();
        const outline = window.document.createElement("div");
        outline.className = "outline";
        const measurementHorizontal = window.document.createElement("div");
        measurementHorizontal.className = "measurement-line horizontal";
        const measurementVertical = window.document.createElement("div");
        measurementVertical.className = "measurement-line vertical";
        const measurementLabel = window.document.createElement("div");
        measurementLabel.className = "measurement-label";

        div.appendChild(padTop);
        div.appendChild(padBottom);
        div.appendChild(padLeft);
        div.appendChild(padRight);
        div.appendChild(marTop);
        div.appendChild(marBottom);
        div.appendChild(marLeft);
        div.appendChild(marRight);
        div.appendChild(outline);
        div.appendChild(measurementHorizontal);
        div.appendChild(measurementVertical);
        div.appendChild(measurementLabel);

        // Cache child references for O(1) access during updates
        div._refs = {
            padTop, padBottom, padLeft, padRight,
            marTop, marBottom, marLeft, marRight,
            outline,
            measurementHorizontal,
            measurementVertical,
            measurementLabel
        };

        _ensureHighlightShadowRoot().appendChild(div);
        return div;
    }

    function _getOverlay() {
        return _overlayPool.length > 0 ? _overlayPool.pop() : _createOverlayStructure();
    }

    function _releaseOverlay(overlay) {
        overlay.classList.add('hidden');
        overlay.trackingElement = null;
        _overlayPool.push(overlay);
    }

    // Everything an overlay needs read off the page. Split from the painting
    // below so a batch of overlays can read first and write after: interleaving
    // the two forces a layout per element.
    // What screenOffset() needs off the body, read once for a whole batch
    // instead of once per element.
    function _bodyOffsetContext() {
        const body = window.document.body;
        if (window.getComputedStyle(body).position === "static") {
            return { isStatic: true, x: window.pageXOffset, y: window.pageYOffset };
        }
        const bodyBounds = body.getBoundingClientRect();
        return { isStatic: false, x: bodyBounds.left, y: bodyBounds.top };
    }

    function _offsetFromBounds(bounds, bodyOffset) {
        if (bodyOffset.isStatic) {
            return { left: bounds.left + bodyOffset.x, top: bounds.top + bodyOffset.y };
        }
        return { left: bounds.left - bodyOffset.x, top: bounds.top - bodyOffset.y };
    }

    // cut off or skipped by the page, its box is somewhere the page paints other things
    function _isDisplaced(element) {
        const cause = getHiddenCause(element);
        return !!cause && !cause.inPlace;
    }

    function _measureOverlay(element, bodyOffset) {
        const bounds = element.getBoundingClientRect();
        if (bounds.width === 0 && bounds.height === 0) {
            return null;
        }
        if ((element === previouslySelectedElement || element === _caretTarget) && _isDisplaced(element)) {
            return null;
        }
        const cs = window.getComputedStyle(element);
        return {
            bounds: bounds,
            scroll: _offsetFromBounds(bounds, bodyOffset || _bodyOffsetContext()),
            bt: parseFloat(cs.borderTopWidth) || 0,
            br: parseFloat(cs.borderRightWidth) || 0,
            bb: parseFloat(cs.borderBottomWidth) || 0,
            bl: parseFloat(cs.borderLeftWidth) || 0,
            pt: parseFloat(cs.paddingTop) || 0,
            pr: parseFloat(cs.paddingRight) || 0,
            pb: parseFloat(cs.paddingBottom) || 0,
            pl: parseFloat(cs.paddingLeft) || 0,
            mt: parseFloat(cs.marginTop) || 0,
            mr: parseFloat(cs.marginRight) || 0,
            mb: parseFloat(cs.marginBottom) || 0,
            ml: parseFloat(cs.marginLeft) || 0
        };
    }

    function _measureAll(elements) {
        const bodyOffset = _bodyOffsetContext();
        const measured = [];
        for (let i = 0; i < elements.length; i++) {
            measured.push(_measureOverlay(elements[i], bodyOffset));
        }
        return measured;
    }

    // Margin and padding fills belong to the selected element and to the one the caret
    // points at. A hover and the other matches of a css rule only get the outline.
    function _showsBoxModel(element, outlineOnly) {
        return !outlineOnly && (element === previouslySelectedElement || element === _caretTarget) &&
            !SHARED_STATE._boxModelHighlightHidden;
    }

    // Update an existing overlay's position, dimensions, and colors to match the target element.
    // No DOM elements are created or destroyed — only style properties are updated.
    function _paintOverlay(overlay, element, measured, outlineOnly) {
        if (!measured) {
            overlay.classList.add('hidden');
            return;
        }

        const bounds = measured.bounds;

        // Parse box model values (getComputedStyle always resolves to px)
        const bt = measured.bt, br = measured.br, bb = measured.bb, bl = measured.bl;
        const pt = measured.pt, pr = measured.pr, pb = measured.pb, pl = measured.pl;
        const mt = measured.mt, mr = measured.mr, mb = measured.mb, ml = measured.ml;

        // Compute the 4 absolute boxes exactly like dev tools:
        // getBoundingClientRect() always returns the border box regardless of box-sizing.
        const scroll = measured.scroll;
        const borderBox = {
            left: scroll.left,
            top: scroll.top,
            width: bounds.width,
            height: bounds.height
        };
        const paddingBox = {
            left: borderBox.left + bl,
            top: borderBox.top + bt,
            width: borderBox.width - bl - br,
            height: borderBox.height - bt - bb
        };
        const contentBox = {
            left: paddingBox.left + pl,
            top: paddingBox.top + pt,
            width: paddingBox.width - pl - pr,
            height: paddingBox.height - pt - pb
        };
        const marginBox = {
            left: borderBox.left - ml,
            top: borderBox.top - mt,
            width: borderBox.width + ml + mr,
            height: borderBox.height + mt + mb
        };

        // Update container position
        overlay.trackingElement = element;
        overlay.style.left = marginBox.left + "px";
        overlay.style.top = marginBox.top + "px";
        overlay.style.width = marginBox.width + "px";
        overlay.style.height = marginBox.height + "px";
        overlay.classList.remove('hidden');

        const refs = overlay._refs;
        const mLeft = marginBox.left;

        // Update a rect's position, size, and color in place
        function setRect(rect, left, top, width, height, color) {
            const s = rect.style;
            s.left = (left - mLeft) + "px";
            s.top = (top - marginBox.top) + "px";
            s.width = Math.max(0, width) + "px";
            s.height = Math.max(0, height) + "px";
            s.backgroundColor = color;
        }

        // Padding region. Rects stay in place when hidden, only their fill goes away,
        // so nothing has to be rebuilt when they come back.
        const boxModelHidden = !_showsBoxModel(element, outlineOnly);
        const padColor = boxModelHidden ? "transparent" : COLORS.highlightPadding;
        setRect(refs.padTop, paddingBox.left, paddingBox.top, paddingBox.width, pt, padColor);
        setRect(refs.padBottom, paddingBox.left, contentBox.top + contentBox.height, paddingBox.width, pb, padColor);
        setRect(refs.padLeft, paddingBox.left, contentBox.top, pl, contentBox.height, padColor);
        setRect(refs.padRight, contentBox.left + contentBox.width, contentBox.top, pr, contentBox.height, padColor);

        // Margin region
        const margColor = boxModelHidden ? "transparent" : COLORS.highlightMargin;
        setRect(refs.marTop, marginBox.left, marginBox.top, marginBox.width, mt, margColor);
        setRect(refs.marBottom, marginBox.left, borderBox.top + borderBox.height, marginBox.width, mb, margColor);
        setRect(refs.marLeft, marginBox.left, borderBox.top, ml, borderBox.height, margColor);
        setRect(refs.marRight, borderBox.left + borderBox.width, borderBox.top, mr, borderBox.height, margColor);

        // Outline
        const isEditable = element.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
        const outlineColor = isEditable ? COLORS.outlineEditable : COLORS.outlineNonEditable;
        const outlineStyle = refs.outline.style;
        outlineStyle.left = (borderBox.left - mLeft) + "px";
        outlineStyle.top = (borderBox.top - marginBox.top) + "px";
        outlineStyle.width = borderBox.width + "px";
        outlineStyle.height = borderBox.height + "px";
        outlineStyle.border = `1px solid ${outlineColor}`;

        // The upstream configuration already exposed a "show measurements"
        // switch, but the community browser scripts did not paint anything for
        // it. Draw viewport-spanning guides and a live width × height badge for
        // the selected component, isolated inside the highlight shadow root.
        const showMeasurements = !!config.showRulerLines &&
            element === previouslySelectedElement && !outlineOnly;
        const horizontalStyle = refs.measurementHorizontal.style;
        const verticalStyle = refs.measurementVertical.style;
        const labelStyle = refs.measurementLabel.style;
        if (showMeasurements) {
            const documentWidth = Math.max(window.document.documentElement.scrollWidth, window.innerWidth);
            const documentHeight = Math.max(window.document.documentElement.scrollHeight, window.innerHeight);
            horizontalStyle.display = "block";
            horizontalStyle.left = -marginBox.left + "px";
            horizontalStyle.top = borderBox.top - marginBox.top + "px";
            horizontalStyle.width = documentWidth + "px";
            verticalStyle.display = "block";
            verticalStyle.left = borderBox.left - marginBox.left + "px";
            verticalStyle.top = -marginBox.top + "px";
            verticalStyle.height = documentHeight + "px";
            refs.measurementLabel.textContent =
                `${Math.round(borderBox.width)} × ${Math.round(borderBox.height)} px`;
            labelStyle.display = "block";
            labelStyle.left = borderBox.left - marginBox.left + 4 + "px";
            labelStyle.top = borderBox.top - marginBox.top + (bounds.top < 30 ? 4 : -24) + "px";
        } else {
            horizontalStyle.display = "none";
            verticalStyle.display = "none";
            labelStyle.display = "none";
        }
    }

    function _updateOverlay(overlay, element, outlineOnly) {
        _paintOverlay(overlay, element, _measureOverlay(element), outlineOnly);
    }

    // outlineOnly: a hover can sit on the selected element too, and must not fill it twice
    function Highlight(trigger, outlineOnly) {
        this.trigger = !!trigger;
        this.outlineOnly = !!outlineOnly;
        this.elements = [];
        this.selector = "";
        this._overlays = [];
    }

    Highlight.prototype = {
        add: function (element) {
            if (this.elements.includes(element) || element === window.document) {
                return;
            }
            if (this.trigger) {
                _trigger(element, "highlight", 1);
            }

            this.elements.push(element);
            const overlay = _getOverlay();
            this._overlays.push(overlay);
            _updateOverlay(overlay, element, this.outlineOnly);
        },

        addAll: function (elements) {
            const seen = new Set(this.elements);
            const fresh = [];
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element !== window.document && !seen.has(element)) {
                    seen.add(element);
                    fresh.push(element);
                }
            }
            const measured = _measureAll(fresh);
            for (let i = 0; i < fresh.length; i++) {
                if (this.trigger) {
                    _trigger(fresh[i], "highlight", 1);
                }
                this.elements.push(fresh[i]);
                const overlay = _getOverlay();
                this._overlays.push(overlay);
                _paintOverlay(overlay, fresh[i], measured[i], this.outlineOnly);
            }
        },

        clear: function () {
            this._overlays.forEach(function (overlay) {
                _releaseOverlay(overlay);
            });
            this._overlays = [];

            if (this.trigger) {
                this.elements.forEach(function (el) {
                    _trigger(el, "highlight", 0);
                });
            }

            this.elements = [];
            // Reset the cached selector so that redraw() uses the elements
            // array instead of re-querying the DOM with a stale selector.
            // Without this, a selector like [data-brackets-id='3'] persists
            // after the element is replaced (e.g. tag name change assigns a
            // new ID), causing redraw() to find zero matches and release
            // all overlays — making the highlight vanish.
            this.selector = "";
        },

        redraw: function () {
            const elements = this.selector
                ? Array.from(window.document.querySelectorAll(this.selector))
                : this.elements.slice();

            // Adjust overlay count to match element count
            while (this._overlays.length > elements.length) {
                _releaseOverlay(this._overlays.pop());
            }
            while (this._overlays.length < elements.length) {
                this._overlays.push(_getOverlay());
            }

            this.elements = elements;

            // Update all overlays in place — no DOM creation or destruction
            const measured = _measureAll(elements);
            for (let i = 0; i < elements.length; i++) {
                _paintOverlay(this._overlays[i], elements[i], measured[i], this.outlineOnly);
            }
        }
    };

    // helper function to get the current elements highlight mode
    // this is as per user settings (either click or hover)
    function getHighlightMode() {
        return config.elemHighlights ? config.elemHighlights.toLowerCase() : "hover";
    }

    // helper function to check if highlights should show on hover
    function shouldShowHighlightOnHover() {
        return getHighlightMode() !== "click";
    }

    /**
     * Applies the current hover state in a single batched DOM update.
     * Called once per animation frame via requestAnimationFrame.
     * _lastHoverTarget holds the element to highlight (or null to clear), and is only
     * shown once the pointer has settled on it.
     */
    function _applyHoverState() {
        _pendingHoverRAF = null;

        if (!_hoverHighlight || !shouldShowHighlightOnHover()) {
            return;
        }

        _hoverHighlight.clear();
        const hoverBoxHandler = LivePreviewView.getToolHandler("HoverBox");
        if (hoverBoxHandler) {
            hoverBoxHandler.dismiss();
        }

        const element = _hoverSettled ? _lastHoverTarget : null;

        if (element && (element !== previouslySelectedElement || _selectedFromEditor)) {
            _hoverHighlight.add(element);
            if (hoverBoxHandler) {
                hoverBoxHandler.showHoverBox(element);
            }
        }
    }

    /**
     * Schedules a hover state update for the next animation frame.
     * Multiple calls within one frame collapse into a single DOM update.
     */
    function _scheduleHoverUpdate() {
        if (!_pendingHoverRAF) {
            _pendingHoverRAF = requestAnimationFrame(_applyHoverState);
        }
    }

    function _cancelHoverSettle() {
        if (_hoverSettleTimer) {
            clearTimeout(_hoverSettleTimer);
            _hoverSettleTimer = null;
        }
        _hoverSettled = false;
    }

    function _restartHoverSettle() {
        _cancelHoverSettle();
        _hoverSettleTimer = setTimeout(function () {
            _hoverSettleTimer = null;
            _hoverSettled = true;
            _scheduleHoverUpdate();
        }, HOVER_SETTLE_MS);
    }

    // a tall element stays under the pointer long enough to settle while the page is still moving
    function _onScrollWhileHoverSettles() {
        if (_hoverSettleTimer) {
            _restartHoverSettle();
        }
    }

    function onElementHover(event) {
        // don't want highlighting and stuff when auto scrolling or when dragging (svgs)
        // for dragging normal html elements its already taken care of...so we just add svg drag checking
        if (SHARED_STATE.isAutoScrolling || SHARED_STATE._isDraggingSVG) {
            return;
        }
        const element = event.target;

        if (element === _lastHoverTarget) {
            return;
        }
        if(isBodyElement(element) || !LivePreviewView.isElementInspectable(element) ||
                isPointerEditOptedOut(element) || element.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        _lastHoverTarget = element;

        // if _hoverHighlight is uninitialized, initialize it
        if (!_hoverHighlight && shouldShowHighlightOnHover()) {
            _hoverHighlight = new Highlight(true, true);
        }

        if (_hoverHighlight && shouldShowHighlightOnHover()) {
            // the previous hover goes now, this one comes once the pointer settles
            _restartHoverSettle();
            _scheduleHoverUpdate();
        }
    }

    function _clearHoverState() {
        if (SHARED_STATE.isAutoScrolling) {
            return;
        }
        if (_hoverHighlight && shouldShowHighlightOnHover()) {
            _lastHoverTarget = null;
            _cancelHoverSettle();
            _scheduleHoverUpdate();
        }
    }

    function onElementHoverOut(event) {
        const element = event.target;
        // Use isElementInspectable (not isElementEditable) so that JS-rendered
        // elements also get their hover highlight and hover box properly dismissed.
        if(LivePreviewView.isElementInspectable(element) && element.nodeType === Node.ELEMENT_NODE) {
            _clearHoverState();
        }
    }

    // for popped out window: the in-panel iframe case is forwarded parent-side via _LD.clearHoverState().
    function onDocumentMouseLeave() {
        _clearHoverState();
    }

    function scrollElementToViewPort(element) {
        if (!element) {
            return;
        }

        // Check if element is in viewport, if not scroll to it
        if (!isInViewport(element)) {
            let top = getDocumentOffsetTop(element);
            if (top) {
                top -= (window.innerHeight / 2);
                window.scrollTo(0, top);
            }
        }
    }

    /**
     * this function is responsible to select an element in the live preview
     * @param {Element} element - The DOM element to select
     * @param {boolean} [fromEditor] - If true, this is an editor-cursor-driven selection;
     *   only lightweight highlights (outline, margin/padding overlay) are shown, not interactive
     *   UI like the control box or the styles bar.
     * @param {boolean} [byName] - Selected by name (a layers panel row), so the edit
     *   opt-out and the body block don't apply while it stays selected.
     */
    function selectElement(element, fromEditor, byName) {
        // When a cursor-based highlight re-selects the already-selected element,
        // just refresh the highlight overlay without dismissing existing UI panels
        // (control box, editor box, element-info). This prevents cursor activity
        // after a source edit (e.g., tag name change) from tearing down the
        // element properties panel and losing its state.
        if (fromEditor && element === previouslySelectedElement) {
            if (!_clickHighlight) {
                _clickHighlight = new Highlight();
            }
            _clickHighlight.clear();
            _clickHighlight.add(element);
            return;
        }

        dismissUIAndCleanupState();
        // set after the dismissal, which clears the previous selection's body exemption
        _namedSelection = byName ? element : null;
        const hiddenCause = getHiddenCause(element);
        // this should also be there when users are in highlight mode
        // a hidden element is scrolled to only while it still holds its box in the page
        if (!hiddenCause || hiddenCause.inPlace) {
            scrollElementToViewPort(element);
        }

        if(!LivePreviewView.isElementInspectable(element, true)) {
            return false;
        }

        // Only invoke tool handlers for user-initiated clicks in the live preview,
        // not for editor cursor movements which should only show lightweight highlights
        if (!fromEditor) {
            // when user clicks on a non-editable element
            if (!element.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR)) {
                getAllToolHandlers().forEach(handler => {
                    if (handler.onNonEditableElementClick) {
                        handler.onNonEditableElementClick(element);
                    }
                });
            }

            // make sure that the element is actually visible to the user
            if (!hiddenCause) {
                // Notify handlers about element selection
                getAllToolHandlers().forEach(handler => {
                    if (handler.onElementSelected) {
                        handler.onElementSelected(element);
                    }
                });
            }
        }

        // the overlay paints by who is selected, so that is settled first
        previouslySelectedElement = element;
        _selectedFromEditor = fromEditor || false;
        window.__current_ph_lp_selected = element;

        if (!_clickHighlight) {
            _clickHighlight = new Highlight();
        }
        _clickHighlight.clear();
        _clickHighlight.add(element);

        if (isSourceless(element)) {
            _watchSourcelessSelection(element);
        }
    }

    function _elementIndexPath(element) {
        const path = [];
        let el = element;
        while (el && el !== window.document.body) {
            const parent = el.parentElement;
            if (!parent) {
                return null;
            }
            path.unshift(Array.prototype.indexOf.call(parent.children, el));
            el = parent;
        }
        return el === window.document.body ? path : null;
    }

    function _elementAtIndexPath(path) {
        let el = window.document.body;
        for (let i = 0; i < path.length && el; i++) {
            el = el.children[path[i]];
        }
        return el || null;
    }

    // a re-render replaces a script-added node, so re-select the same tag in the same place or dismiss
    function _watchSourcelessSelection(element) {
        _unwatchSourcelessSelection();
        _sourcelessPath = _elementIndexPath(element);
        if (!_sourcelessPath) {
            return;
        }
        _sourcelessTag = element.tagName;
        _sourcelessClass = typeof element.className === "string" ? element.className : "";
        _sourcelessObserver = new MutationObserver(function () {
            if (_sourcelessCheckTimer || !previouslySelectedElement || previouslySelectedElement.isConnected) {
                return;
            }
            _sourcelessCheckTimer = setTimeout(_recoverSourcelessSelection, SOURCELESS_RECOVER_DELAY_MS);
        });
        _sourcelessObserver.observe(window.document.body, { childList: true, subtree: true });
    }

    function _unwatchSourcelessSelection() {
        if (_sourcelessObserver) {
            _sourcelessObserver.disconnect();
            _sourcelessObserver = null;
        }
        if (_sourcelessCheckTimer) {
            clearTimeout(_sourcelessCheckTimer);
            _sourcelessCheckTimer = null;
        }
        _sourcelessPath = null;
    }

    function _recoverSourcelessSelection() {
        _sourcelessCheckTimer = null;
        const old = previouslySelectedElement;
        if (!old || old.isConnected || !_sourcelessPath) {
            return;
        }
        const fresh = _elementAtIndexPath(_sourcelessPath);
        const className = fresh && typeof fresh.className === "string" ? fresh.className : "";
        if (fresh && fresh.tagName === _sourcelessTag && className === _sourcelessClass &&
                isSourceless(fresh) && isElementInspectable(fresh, true) && isElementVisible(fresh)) {
            const fromEditor = _selectedFromEditor;
            selectElement(fresh, fromEditor);
        } else {
            dismissUIAndCleanupState();
        }
    }

    function disableHoverListeners() {
        window.document.removeEventListener("mouseover", onElementHover);
        window.document.removeEventListener("mousemove", onElementHover);
        window.document.removeEventListener("mouseout", onElementHoverOut);
        window.document.documentElement.removeEventListener("mouseleave", onDocumentMouseLeave);
        window.document.removeEventListener("scroll", _onScrollWhileHoverSettles, true);
        // Cancel any pending rAF hover update so stale callbacks don't fire
        if (_pendingHoverRAF) {
            cancelAnimationFrame(_pendingHoverRAF);
            _pendingHoverRAF = null;
        }
        _cancelHoverSettle();
        _lastHoverTarget = null;
    }

    function enableHoverListeners() {
        // don't enable hover listeners if user is currently editing an element
        // this was added to fix a specific bug:
        // lets say user double clicked an element: so as soon as the first click is made,
        // 'breiflyDisableHoverListeners' is called which has a timer to re-enable hover listeners,
        // because of which even during editing the hover listeners were working
        if (SHARED_STATE._currentlyEditingElement) {
            return;
        }
        if (config.mode === 'edit' && shouldShowHighlightOnHover()) {
            disableHoverListeners();
            window.document.addEventListener("mouseover", onElementHover);
            window.document.addEventListener("mousemove", onElementHover);
            window.document.addEventListener("mouseout", onElementHoverOut);
            window.document.documentElement.addEventListener("mouseleave", onDocumentMouseLeave);
            // scroll does not bubble, capture also sees the page's own scroll containers
            window.document.addEventListener("scroll", _onScrollWhileHoverSettles, { capture: true, passive: true });
        }
    }

    /**
     * this function disables hover listeners for 800ms to prevent ui conclicts
     * Used when user performs click actions to avoid UI box conflicts
     */
    function brieflyDisableHoverListeners() {
        if (_hoverLockTimer) {
            clearTimeout(_hoverLockTimer);
        }

        disableHoverListeners();
        _hoverLockTimer = setTimeout(() => {
            enableHoverListeners();
            _hoverLockTimer = null;
        }, 800);
    }

    /**
     * this function is called when user clicks on an element in the LP when in edit mode
     *
     * @param {HTMLElement} element - The clicked element
     * @param {Event} event - The click event
     */
    function handleElementClick(element, event) {
        // Check for dismiss action first - dismiss LP editing when clicked (takes precedence over no-edit)
        if(element && (
            element.closest('.wecode-dismiss-lp-edit') || element.classList.contains('wecode-dismiss-lp-edit-this'))) {
            dismissUIAndCleanupState();
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // Opted-out elements: silent no-op so the user's existing selection isn't dismissed.
        if(isPointerEditOptedOut(element)) {
            return;
        }
        // a blank-space click lands on the body and deselects, even a body selected by name
        if (isBodyElement(element) || !LivePreviewView.isElementInspectable(element)) {
            dismissUIAndCleanupState();
            return;
        }

        // if anything is currently selected, we need to clear that
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            selection.removeAllRanges();
        }

        sendSelectionToEditor(element);

        brieflyDisableHoverListeners();
        selectElement(element);
        // an invisible element can still take the click, like an opacity 0 input over a styled label
        announceIfHidden(element);
    }

    /**
     * Tells the editor which element is now selected, so the cursor jumps to it and
     * the css reverse highlight follows. Split out of the click handler because a
     * selection can also be asked for from the editor side, which must report itself
     * the same way without a pointer gesture ever touching the page.
     *
     * @param {HTMLElement} element
     * @param {boolean=} requested - the editor side asked for this selection, so it keeps its
     *     focus and reads the report as the echo of its own pick
     */
    function sendSelectionToEditor(element, requested) {
        if (config.syncSourceAndPreview === false) {
            return;
        }
        // sent without a tagId too, so a css file in the editor can still jump to the rule
        const tagId = element.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
        MessageBroker.send({
            "tagId": tagId || null,
            "sourceless": !tagId,
            "nodeID": element.id,
            "nodeClassList": element.classList,
            "nodeName": element.nodeName,
            "allSelectors": window.getAllInheritedSelectorsInOrder(element),
            "contentEditable": element.contentEditable === "true",
            "clicked": true,
            "requested": !!requested
        });
    }

    // clear CSS selector highlights
    function clearCssSelectorHighlight() {
        if (_cssSelectorHighlightTimer) {
            clearTimeout(_cssSelectorHighlightTimer);
            _cssSelectorHighlightTimer = null;
        }
        if (_cssSelectorHighlight) {
            _cssSelectorHighlight.clear();
            _cssSelectorHighlight = null;
        }
    }

    // create CSS selector highlights for edit mode
    function createCssSelectorHighlight(nodes, rule) {
        // Clear any existing highlights
        clearCssSelectorHighlight();

        // Highlight all matching elements except the selected one
        // (it already has a click highlight)
        _cssSelectorHighlight = new Highlight();
        const wanted = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] !== previouslySelectedElement &&
                LivePreviewView.isElementInspectable(nodes[i], true) &&
                nodes[i].nodeType === Node.ELEMENT_NODE) {
                wanted.push(nodes[i]);
            }
        }
        _cssSelectorHighlight.addAll(wanted);
        _cssSelectorHighlight.selector = rule;
    }

    // remove active highlights
    function hideHighlight() {
        if (_clickHighlight) {
            _clickHighlight.clear();
            _clickHighlight = null;
        }
        if (_hoverHighlight) {
            _hoverHighlight.clear();
            _hoverHighlight = null;
        }
        _caretTarget = null;
        clearCssSelectorHighlight();
    }

    // highlight an element
    function highlight(element, clear) {
        if (!_clickHighlight) {
            _clickHighlight = new Highlight();
        }
        if (clear) {
            _clickHighlight.clear();
        }
        if (LivePreviewView.isElementInspectable(element, true) && element.nodeType === Node.ELEMENT_NODE) {
            _clickHighlight.add(element);
        }
    }

    function highlightAll(elements) {
        if (!_clickHighlight) {
            _clickHighlight = new Highlight();
        }
        const wanted = [];
        for (let i = 0; i < elements.length; i++) {
            if (LivePreviewView.isElementInspectable(elements[i], true) &&
                    elements[i].nodeType === Node.ELEMENT_NODE) {
                wanted.push(elements[i]);
            }
        }
        _clickHighlight.addAll(wanted);
    }

    const RE_STATE_PSEUDO = /::?(?:hover|active|focus-within|focus-visible|focus|visited|target|checked|disabled|enabled|placeholder-shown|before|after|first-line|first-letter|marker|placeholder|selection)\b/gi;

    // A :hover or ::before rule styles the element in a state it is not in right
    // now, so it is matched as the plain selector to reach the elements it styles.
    function toMatchableSelector(rule) {
        const stripped = rule.replace(RE_STATE_PSEUDO, "");
        if (stripped === rule) {
            return rule;
        }
        try {
            window.document.querySelector(stripped);
            return stripped;
        } catch (e) {
            return rule;
        }
    }

    /**
     * Find the best element to select from a list of matched nodes
     * Prefers: previously selected element > parent of selected > first valid element
     * @param {NodeList} nodes - The nodes matching the CSS rule
     * @param {string} rule - The CSS rule used to match nodes
     * @returns {{element: Element|null, skipSelection: boolean}} - The element to select and whether to skip selection
     */
    function findBestElementToSelect(nodes, rule) {
        let firstValidElement = null;
        let elementToSelect = null;

        for (let i = 0; i < nodes.length; i++) {
            if(!LivePreviewView.isElementInspectable(nodes[i], true) || nodes[i].tagName === "BR") {
                continue;
            }

            // Store the first valid element as a fallback
            if (!firstValidElement) {
                firstValidElement = nodes[i];
            }

            // if hover lock timer is active, skip selection as it's already handled by handleElementClick
            if (_hoverLockTimer && nodes[i] === previouslySelectedElement) {
                return { element: null, skipSelection: true };
            }

            // Check if the currently selected element or any of its parents have a highlight
            if (previouslySelectedElement) {
                if (nodes[i] === previouslySelectedElement) {
                    // Exact match - prefer this
                    elementToSelect = previouslySelectedElement;
                    break;
                } else if (!elementToSelect &&
                    previouslySelectedElement.closest && nodes[i] === previouslySelectedElement.closest(rule)) {
                    // The node is a parent of the currently selected element. we stop at the first parent, after that
                    // we only scan for exact match
                    elementToSelect = nodes[i];
                }
            }
        }

        return {
            element: elementToSelect || firstValidElement,
            skipSelection: false
        };
    }

    // Filter out the universal selector (*) from the rule - highlighting everything
    // is not useful, similar to how we skip the html tag in isElementInspectable.
    // The rule can be a comma-separated list of selectors (from multi-cursor),
    // so we filter out any standalone * segments and keep valid ones.
    function _withoutUniversalSelector(rule) {
        return toMatchableSelector(rule).split(",").map(s => s.trim()).filter(s => s !== "*").join(",");
    }

    // only a pick is held, not a selection the caret made before anything held it
    function _dropCaretMadeSelection() {
        if (previouslySelectedElement && _selectedFromEditor) {
            dismissUIAndCleanupState();
        }
    }

    /**
     * Highlight and scroll to what the rule reaches without selecting it: the selection
     * is held elsewhere (the layers panel) and a picked element keeps it.
     * @param {string} rule - The CSS rule to highlight
     * @returns {Element|null} the element the caret points at, null when it is the held one
     */
    function highlightRuleAroundSelection(rule) {
        _dropCaretMadeSelection();
        rule = _withoutUniversalSelector(rule);
        // already drawn: the live document and the layers panel both ask for the same caret
        if (rule && _cssSelectorHighlight && _cssSelectorHighlight.selector === rule) {
            return _caretTarget;
        }
        _caretTarget = null;
        if (!rule) {
            clearCssSelectorHighlight();
            return null;
        }
        const nodes = window.document.querySelectorAll(rule);
        const { element } = findBestElementToSelect(nodes, rule);
        if (element) {
            scrollElementToViewPort(element);
        }
        // set before drawing, the overlay paints margin and padding by it
        _caretTarget =element && element !== previouslySelectedElement ? element : null;
        createCssSelectorHighlight(nodes, rule);
        return _caretTarget;
    }

    /**
     * Highlight all elements matching a CSS rule and select the best one
     * @param {string} rule - The CSS rule to highlight
     * @param {boolean} [keepSelection] - highlight around a selection held elsewhere instead
     */
    function highlightRule(rule, keepSelection) {
        if (keepSelection) {
            highlightRuleAroundSelection(rule);
            return;
        }
        hideHighlight();

        rule = _withoutUniversalSelector(rule);
        if (!rule) {
            dismissUIAndCleanupState();
            return;
        }

        const nodes = window.document.querySelectorAll(rule);

        // Both edit and highlight modes go through the same selection path:
        // selectElement() handles scroll-to-view and the prominent click-highlight,
        // createCssSelectorHighlight() shows siblings dimly. fromEditor=true
        // suppresses tool-handler invocation, so highlight mode gets the
        // highlighting/scroll behavior without any UI boxes.
        const { element, skipSelection } = findBestElementToSelect(nodes, rule);

        if (skipSelection) {
            // A recent preview click owns the selection and its open tools.
            // Keep the existing selector highlight without re-selecting it.
            highlightAll(nodes);
            _clickHighlight.selector = rule;
        } else {
            if (element) {
                // Select first: drawing every match here would immediately be
                // cleared by selectElement() and drawn again as siblings below.
                selectElement(element, true);
            } else {
                // No valid element found, dismiss UI
                dismissUIAndCleanupState();
            }
        }

        createCssSelectorHighlight(nodes, rule);
    }

    // recreate UI boxes so that they are placed properly
    function redrawUIBoxes() {
        // commented out for unified box redesign
        // if (SHARED_STATE._toolBox) {
        //     const element = SHARED_STATE._toolBox.element;
        //     const toolBoxHandler = LivePreviewView.getToolHandler("ToolBox");
        //     if (toolBoxHandler) {
        //         toolBoxHandler.dismiss();
        //         toolBoxHandler.createToolBox(element);
        //     }
        // }

        // if (SHARED_STATE._infoBox) {
        //     const element = SHARED_STATE._infoBox.element;
        //     const infoBoxHandler = LivePreviewView.getToolHandler("InfoBox");
        //     if (infoBoxHandler) {
        //         infoBoxHandler.dismiss();
        //         infoBoxHandler.createInfoBox(element);
        //     }
        // }
    }

    // redraw active highlights
    function redrawHighlights() {
        if (_clickHighlight) {
            _clickHighlight.redraw();
        }
        if (_hoverHighlight) {
            _hoverHighlight.redraw();
        }
        // rebuilt, not redrawn: its selector also matches the selected element, which it leaves out
        if (_cssSelectorHighlight && _cssSelectorHighlight.selector) {
            const rule = _cssSelectorHighlight.selector;
            createCssSelectorHighlight(window.document.querySelectorAll(rule), rule);
        }
    }

    // just a wrapper function when we need to redraw highlights as well as UI boxes
    function redrawEverything() {
        redrawHighlights();
        redrawUIBoxes();
        // Call redraw on all registered handlers
        getAllToolHandlers().forEach(handler => {
            if (handler.redraw) {
                handler.redraw();
            }
        });
    }

    // Throttle resize redraws to one per animation frame — avoids redundant
    // layout reads when the browser fires multiple resize events per frame.
    let _pendingResizeRAF = null;
    function _onWindowResize() {
        if (!_pendingResizeRAF) {
            _pendingResizeRAF = requestAnimationFrame(function () {
                _pendingResizeRAF = null;
                redrawEverything();
            });
        }
    }
    window.addEventListener("resize", _onWindowResize);

    /**
     * Constructor
     * @param {Document} htmlDocument
     */
    function DOMEditHandler(htmlDocument) {
        this.htmlDocument = htmlDocument;
        this.rememberedNodes = null;
        this.entityParseParent = htmlDocument.createElement("div");
    }

    /**
     * @private
     * Find the first matching element with the specified data-brackets-id
     * @param {string} id
     * @return {Element}
     */
    DOMEditHandler.prototype._queryBracketsID = function (id) {
        if (!id) {
            return null;
        }

        if (this.rememberedNodes && this.rememberedNodes[id]) {
            return this.rememberedNodes[id];
        }

        var results = this.htmlDocument.querySelectorAll(`[${GLOBALS.DATA_BRACKETS_ID_ATTR}='${id}']`);
        return results && results[0];
    };

    // True for elements Weave adds to the page itself, like the tool boxes and
    // the highlight overlays. They are not part of the user's source file.
    function _isWeaveInternalNode(node) {
        return !!node && node.nodeType === Node.ELEMENT_NODE &&
            (node.hasAttribute(GLOBALS.WECODE_INTERNAL_ATTR) ||
                node.className === GLOBALS.HIGHLIGHT_CLASSNAME);
    }

    /** The first of the Weave elements sitting at the end of `parent`, else null. */
    function _firstTrailingInternalNode(parent) {
        let node = parent.lastChild;
        let first = null;
        while (_isWeaveInternalNode(node)) {
            first = node;
            node = node.previousSibling;
        }
        return first;
    }

    /**
     * @private
     * Insert a new child element
     * @param {Element} targetElement Parent element already in the document
     * @param {Element} childElement New child element
     * @param {Object} edit
     */
    DOMEditHandler.prototype._insertChildNode = function (targetElement, childElement, edit) {
        var before = this._queryBracketsID(edit.beforeID),
            after  = this._queryBracketsID(edit.afterID);

        if (edit.firstChild) {
            before = targetElement.firstChild;
        } else if (edit.lastChild) {
            // Weave's tool boxes are the last children of <body>, so appending
            // here would put the new element after them, in the wrong place.
            before = _firstTrailingInternalNode(targetElement);
            if (!before) {
                after = targetElement.lastChild;
            }
        }

        if (before) {
            targetElement.insertBefore(childElement, before);
        } else if (after && (after !== targetElement.lastChild)) {
            targetElement.insertBefore(childElement, after.nextSibling);
        } else {
            targetElement.appendChild(childElement);
        }
    };

    /**
     * @private
     * Given a string containing encoded entity references, returns the string with the entities decoded.
     * @param {string} text The text to parse.
     * @return {string} The decoded text.
     */
    DOMEditHandler.prototype._parseEntities = function (text) {
        // Kind of a hack: just set the innerHTML of a div to the text, which will parse the entities, then
        // read the content out.
        var result;
        this.entityParseParent.innerHTML = text;
        result = this.entityParseParent.textContent;
        this.entityParseParent.textContent = "";
        return result;
    };

    /**
     * @private
     * @param {Node} node
     * @return {boolean} true if node expects its content to be
     * raw text (not parsed for entities) according to the HTML5 spec.
     */
    function _isRawTextNode(node) {
        return (
            node.nodeType === Node.ELEMENT_NODE &&
            /script|style|noscript|noframes|noembed|iframe|xmp/i.test(node.tagName)
        );
    }

    /**
     * @private
     * Replace a range of text and comment nodes with an optional new text node
     * @param {Element} targetElement
     * @param {Object} edit
     */
    DOMEditHandler.prototype._textReplace = function (targetElement, edit) {
        function prevIgnoringHighlights(node) {
            do {
                node = node.previousSibling;
            } while (node && node.className === GLOBALS.HIGHLIGHT_CLASSNAME);
            return node;
        }
        function nextIgnoringHighlights(node) {
            do {
                node = node.nextSibling;
            } while (node && node.className === GLOBALS.HIGHLIGHT_CLASSNAME);
            return node;
        }
        function lastChildIgnoringHighlights(node) {
            node = (node.childNodes.length ? node.childNodes.item(node.childNodes.length - 1) : null);
            if (node && node.className === GLOBALS.HIGHLIGHT_CLASSNAME) {
                node = prevIgnoringHighlights(node);
            }
            return node;
        }

        var start           = (edit.afterID)  ? this._queryBracketsID(edit.afterID)  : null,
            startMissing    = edit.afterID && !start,
            end             = (edit.beforeID) ? this._queryBracketsID(edit.beforeID) : null,
            endMissing      = edit.beforeID && !end,
            moveNext        = start && nextIgnoringHighlights(start),

            current         = moveNext ||
            (end && prevIgnoringHighlights(end)) || lastChildIgnoringHighlights(targetElement),

            next,

            textNode        = (edit.content !== undefined) ?
                this.htmlDocument.createTextNode(
                    _isRawTextNode(targetElement) ? edit.content : this._parseEntities(edit.content)
                ) : null,

            lastRemovedWasText,
            isText;

        // remove all nodes inside the range
        while (current && (current !== end)) {
            isText = current.nodeType === Node.TEXT_NODE;

            // if start is defined, delete following text nodes
            // if start is not defined, delete preceding text nodes
            next = (moveNext) ? nextIgnoringHighlights(current) : prevIgnoringHighlights(current);

            // only delete up to the nearest element.
            // if the start/end tag was deleted in a prior edit, stop removing
            // nodes when we hit adjacent text nodes
            if ((current.nodeType === Node.ELEMENT_NODE) ||
                    ((startMissing || endMissing) && (isText && lastRemovedWasText))) {
                break;
            } else {
                lastRemovedWasText = isText;

                if (current.remove) {
                    current.remove();
                } else if (current.parentNode && current.parentNode.removeChild) {
                    current.parentNode.removeChild(current);
                }
                current = next;
            }
        }

        if (textNode) {
            // OK to use nextSibling here (not nextIgnoringHighlights) because we do literally
            // want to insert immediately after the start tag.
            if (start && start.nextSibling) {
                targetElement.insertBefore(textNode, start.nextSibling);
            } else if (end) {
                targetElement.insertBefore(textNode, end);
            } else {
                targetElement.appendChild(textNode);
            }
        }
    };

    /**
     * @private
     * Apply an array of DOM edits to the document
     * @param {Array.<Object>} edits
     */
    DOMEditHandler.prototype.apply = function (edits) {
        var targetID,
            targetElement,
            childElement,
            self = this;
        let selectedElementMutated = false;

        // ArkWeb previews project resources through generated Blob URLs while
        // keeping their source path in data-xingzhi-original-*. A visual reorder
        // can replace an element from the updated HTML source, which previously
        // restored the raw relative path and left images broken until reload.
        // Capture the active mapping before any node is removed and reapply it to
        // inserted/changed resource attributes in this same DOM edit batch.
        const resourceAttributes = ["src", "href", "poster", "data"];
        const embeddedResourceURLs = new Map();
        resourceAttributes.forEach(function (attribute) {
            const originalAttribute = "data-xingzhi-original-" + attribute;
            self.htmlDocument.querySelectorAll("[" + originalAttribute + "]").forEach(function (element) {
                const originalValue = element.getAttribute(originalAttribute);
                const resolvedValue = element.getAttribute(attribute);
                if (originalValue && resolvedValue) {
                    embeddedResourceURLs.set(attribute + "\u0000" + originalValue, resolvedValue);
                }
            });
        });

        function setPreviewAttribute(element, attribute, value) {
            const parsedValue = self._parseEntities(value);
            const resolvedValue = embeddedResourceURLs.get(attribute + "\u0000" + parsedValue);
            if (resolvedValue) {
                element.setAttribute("data-xingzhi-original-" + attribute, parsedValue);
                element.setAttribute(attribute, resolvedValue);
            } else {
                element.setAttribute(attribute, parsedValue);
            }
        }

        this.rememberedNodes = {};

        edits.forEach(function (edit) {
            var editIsSpecialTag = edit.type === "elementInsert" &&
                (edit.tag === "html" || edit.tag === "head" || edit.tag === "body");

            if (edit.type === "rememberNodes") {
                edit.tagIDs.forEach(function (tagID) {
                    var node = self._queryBracketsID(tagID);
                    self.rememberedNodes[tagID] = node;
                    if (node.remove) {
                        node.remove();
                    } else if (node.parentNode && node.parentNode.removeChild) {
                        node.parentNode.removeChild(node);
                    }
                });
                return;
            }

            targetID = new RegExp("textReplace|textDelete|textInsert|elementInsert|elementMove").test(edit.type)
                ? edit.parentID : edit.tagID;

            targetElement = self._queryBracketsID(targetID);

            if (!targetElement && !editIsSpecialTag) {
                console.error("data-brackets-id=" + targetID + " not found");
                return;
            }

            switch (edit.type) {
            case "attrChange":
            case "attrAdd":
                setPreviewAttribute(targetElement, edit.attribute, edit.value);
                if (targetElement === previouslySelectedElement) {
                    selectedElementMutated = true;
                }
                break;
            case "attrDelete":
                targetElement.removeAttribute(edit.attribute);
                if (targetElement === previouslySelectedElement) {
                    selectedElementMutated = true;
                }
                break;
            case "elementDelete":
                if (targetElement.remove) {
                    targetElement.remove();
                } else if (targetElement.parentNode && targetElement.parentNode.removeChild) {
                    targetElement.parentNode.removeChild(targetElement);
                }
                break;
            case "elementInsert":
                childElement = null;
                if (editIsSpecialTag) {
                    // If we already have one of these elements (which we should), then
                    // just copy the attributes and set the ID.
                    childElement = self.htmlDocument[edit.tag === "html" ? "documentElement" : edit.tag];
                    if (!childElement) {
                        // Treat this as a normal insertion.
                        editIsSpecialTag = false;
                    }
                }

                if (!editIsSpecialTag) {
                    // If the parent element is an instance of SVGElement or we're inserting an <svg> tag directly,
                    // we need to create it in the SVG namespace otherwise SVG elements won't render
                    // correctly in live preview until it's reloaded
                    if (targetElement instanceof SVGElement || edit.tag.toLowerCase() === "svg") {
                        childElement = self.htmlDocument.createElementNS("http://www.w3.org/2000/svg", edit.tag);
                    } else {
                        childElement = self.htmlDocument.createElement(edit.tag);
                    }
                }

                Object.keys(edit.attributes).forEach(function (attr) {
                    setPreviewAttribute(childElement, attr, edit.attributes[attr]);
                });
                childElement.setAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR, edit.tagID);

                if (!editIsSpecialTag) {
                    self._insertChildNode(targetElement, childElement, edit);
                }
                break;
            case "elementMove":
                childElement = self._queryBracketsID(edit.tagID);
                self._insertChildNode(targetElement, childElement, edit);
                break;
            case "textInsert":
                var textElement = self.htmlDocument.createTextNode(
                    _isRawTextNode(targetElement) ? edit.content : self._parseEntities(edit.content)
                );
                self._insertChildNode(targetElement, textElement, edit);
                break;
            case "textReplace":
            case "textDelete":
                self._textReplace(targetElement, edit);
                break;
            }
        });

        this.rememberedNodes = {};

        // this check makes sure that if the element is no more in the DOM then we remove it
        // skip this check if suppression is active (e.g., when some internal feature updates source)
        if (!SHARED_STATE._suppressDOMEditDismissal) {
            if (previouslySelectedElement && !previouslySelectedElement.isConnected) {
                dismissUIAndCleanupState();
            } else {
                redrawEverything();
            }
        } else {
            // Suppression is active (e.g., control box initiated a source edit)
            if (previouslySelectedElement && !previouslySelectedElement.isConnected) {
                let freshElement = null;

                // Strategy 1: Tree path (most reliable — works even with duplicate
                // text content and tag changes). Stored when suppression was activated.
                if (SHARED_STATE._suppressedElementPath) {
                    freshElement = _getElementByTreePath(SHARED_STATE._suppressedElementPath);
                }

                // Strategy 2: brackets-id (works when IDs are preserved)
                if (!freshElement) {
                    const bracketsId = previouslySelectedElement.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
                    if (bracketsId) {
                        freshElement = document.querySelector(
                            '[' + GLOBALS.DATA_BRACKETS_ID_ATTR + '="' + bracketsId + '"]'
                        );
                    }
                }

                // Strategy 3: Text + tag match (fallback — search reverse for deepest match)
                if (!freshElement) {
                    const oldText = previouslySelectedElement.textContent;
                    const oldTag = previouslySelectedElement.tagName;
                    let candidates = document.querySelectorAll(
                        oldTag.toLowerCase() + '[' + GLOBALS.DATA_BRACKETS_ID_ATTR + ']'
                    );
                    for (let i = candidates.length - 1; i >= 0; i--) {
                        if (candidates[i].textContent === oldText) {
                            freshElement = candidates[i];
                            break;
                        }
                    }
                    // Broaden if tag changed (e.g. h2→footer)
                    if (!freshElement) {
                        candidates = document.querySelectorAll('[' + GLOBALS.DATA_BRACKETS_ID_ATTR + ']');
                        for (let i = candidates.length - 1; i >= 0; i--) {
                            if (candidates[i].textContent === oldText) {
                                freshElement = candidates[i];
                                break;
                            }
                        }
                    }
                }

                if (freshElement) {
                    previouslySelectedElement = freshElement;
                    window.__current_ph_lp_selected = freshElement;
                    if (_clickHighlight) {
                        _clickHighlight.clear();
                        _clickHighlight.add(freshElement);
                    }
                    // After element replacement (e.g., tag name change), the old
                    // DOM node is gone.  Patch the element reference on any
                    // existing UI boxes so that position() doesn't bail on a
                    // disconnected node and future syncs resolve correctly.
                    // We update references directly rather than calling
                    // handler.updateContent() to avoid side-effects like
                    // re-creating a dismissed control box.
                    if (SHARED_STATE._controlBox) {
                        SHARED_STATE._controlBox.element = freshElement;
                    }
                    if (SHARED_STATE._editorBox) {
                        SHARED_STATE._editorBox.element = freshElement;
                    }
                    redrawEverything();
                    selectedElementMutated = true;
                }
            }
        }

        // neither path above refreshes selection-anchored UI CONTENT (the paths
        // only reposition / re-point element refs), so content rendered at
        // selection time — e.g. the control box's tag/#id/.classes line — would
        // stay stale after the selected element's markup changed
        if (selectedElementMutated && previouslySelectedElement && previouslySelectedElement.isConnected) {
            getAllToolHandlers().forEach(function (handler) {
                if (handler.onSelectedElementMutated) {
                    handler.onSelectedElementMutated(previouslySelectedElement);
                }
            });
        }
    };

    function applyDOMEdits(edits) {
        _editHandler.apply(edits);
    }

    function updateConfig(newConfig) {
        const oldConfig = config;
        config = newConfig;

        // Notify handlers about config changes
        getAllToolHandlers().forEach(handler => {
            if (handler.handleConfigChange) {
                handler.handleConfigChange(oldConfig, config);
            }
        });

        // Determine if configuration has changed significantly
        const oldHighlightMode = oldConfig.elemHighlights ? oldConfig.elemHighlights.toLowerCase() : "hover";
        const newHighlightMode = getHighlightMode();
        const highlightModeChanged = oldHighlightMode !== newHighlightMode;
        const isModeChanged = oldConfig.mode !== config.mode;

        // Update hot corner state when mode changes
        // Show animation when mode changes to help users discover the feature
        if (isModeChanged && SHARED_STATE._hotCorner) {
            SHARED_STATE._hotCorner.updateState(config.mode === 'preview', true);
        }

        // Clear highlights when sync is turned off
        const syncTurnedOff = oldConfig.syncSourceAndPreview !== false &&
            config.syncSourceAndPreview === false;

        // Handle configuration changes
        if (highlightModeChanged || isModeChanged || syncTurnedOff) {
            _handleConfigurationChange();
        }

        // Preserve the currently selected element across re-registration
        // so that toggling options (e.g. show measurements)
        // doesn't clear the element highlighting.
        const selectedBeforeReregister = previouslySelectedElement;
        registerHandlers();
        if (!isModeChanged && !highlightModeChanged && !syncTurnedOff
            && selectedBeforeReregister && config.mode === 'edit') {
            // Restore the click highlight for the previously selected element
            if (!_clickHighlight) {
                _clickHighlight = new Highlight(true);
            }
            _clickHighlight.add(selectedBeforeReregister);
            previouslySelectedElement = selectedBeforeReregister;
            window.__current_ph_lp_selected = selectedBeforeReregister;
        }
        return JSON.stringify(config);
    }

    /**
     * when config is changed we clear all the highlighting and stuff
     */
    function _handleConfigurationChange() {
        hideHighlight();
        dismissUIAndCleanupState();
    }

    /**
     * Helper function to cleanup previously clicked element highlighting and state
     */
    function cleanupPreviousElementState() {
        if (previouslySelectedElement) {
            previouslySelectedElement = null;
            window.__current_ph_lp_selected = null;
        }
        _unwatchSourcelessSelection();
        _namedSelection = null;

        // Reset hover tracking so the same-element skip doesn't suppress
        // re-highlighting after a full state cleanup (e.g. Escape, dismiss).
        _lastHoverTarget = null;
        _cancelHoverSettle();
        if (_pendingHoverRAF) {
            cancelAnimationFrame(_pendingHoverRAF);
            _pendingHoverRAF = null;
        }

        // the selection is gone, so a popover can no longer turn the fills back on
        SHARED_STATE._boxModelHighlightHidden = false;

        // Highlight.clear() removes all overlay divs (outline + margin/padding rects)
        hideHighlight();

        if (config.mode === 'edit') {
            // Notify handlers about cleanup
            getAllToolHandlers().forEach(handler => {
                if (handler.onElementCleanup) {
                    handler.onElementCleanup();
                }
            });
        }
    }

    // Only the children that came from the source file. Weave's own elements have
    // no data-brackets-id, and counting them would shift the tree path indexes.
    function _instrumentedChildren(parent) {
        const result = [];
        const children = (parent && parent.children) || [];
        for (let i = 0; i < children.length; i++) {
            if (children[i].hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR)) {
                result.push(children[i]);
            }
        }
        return result;
    }

    /**
     * Compute the tree path of an element as an array of child indices
     * from <html> down. Used to re-locate the element after re-instrumentation
     * when data-brackets-id changes and text matching is ambiguous.
     * E.g. [1, 0, 0, 1] means html > 2nd child > 1st child > 1st child > 2nd child.
     * @return {?Array.<number>} null if the element did not come from the source file.
     */
    function _getTreePath(element) {
        const path = [];
        let el = element;
        while (el && el.parentElement) {
            const index = _instrumentedChildren(el.parentElement).indexOf(el);
            if (index === -1) {
                return null;
            }
            path.unshift(index);
            el = el.parentElement;
        }
        return path.length ? path : null;
    }

    /**
     * Find an element by its tree path (array of child indices from <html>).
     */
    function _getElementByTreePath(path) {
        let el = document.documentElement;
        for (let i = 0; i < path.length; i++) {
            const siblings = _instrumentedChildren(el);
            if (!siblings[path[i]]) {
                return null;
            }
            el = siblings[path[i]];
        }
        return el;
    }

    /**
     * Temporarily suppress the DOM edit dismissal check in apply()
     * Used when source is modified from UI panels to prevent
     * the panel from being dismissed when the DOM is updated.
     * @param {Number} durationMs - Duration in milliseconds to suppress (default 100)
     */
    function suppressDOMEditDismissal(durationMs) {
        durationMs = durationMs || 100;
        if (SHARED_STATE._suppressDOMEditDismissalTimeout) {
            clearTimeout(SHARED_STATE._suppressDOMEditDismissalTimeout);
        }
        SHARED_STATE._suppressDOMEditDismissal = true;
        // Store the tree path while the element is still connected
        if (previouslySelectedElement && previouslySelectedElement.isConnected) {
            SHARED_STATE._suppressedElementPath = _getTreePath(previouslySelectedElement);
        }
        SHARED_STATE._suppressDOMEditDismissalTimeout = setTimeout(function() {
            SHARED_STATE._suppressDOMEditDismissal = false;
            SHARED_STATE._suppressDOMEditDismissalTimeout = null;
            SHARED_STATE._suppressedElementPath = null;
        }, durationMs);
    }

    /**
     * This function dismisses all UI elements and cleans up application state
     * Called when user presses Esc key, clicks on blank page space (the body), or other dismissal events
     */
    function dismissUIAndCleanupState() {
        getAllToolHandlers().forEach(handler => (handler.dismiss && handler.dismiss())); // to dismiss all UI boxes
        cleanupPreviousElementState();
    }

    // The editor has nothing to highlight. A selection held elsewhere stays.
    function hideEditorHighlight(keepSelection) {
        if (keepSelection) {
            _dropCaretMadeSelection();
            _caretTarget = null;
            clearCssSelectorHighlight();
            return;
        }
        dismissUIAndCleanupState();
    }

    // init
    _editHandler = new DOMEditHandler(window.document);

    function registerHandlers() {
        hideHighlight(); // clear previous highlighting
        disableHoverListeners(); // Always remove existing listeners first to avoid duplicates
        // Cancel any pending resize RAF so stale callbacks don't fire after re-init
        if (_pendingResizeRAF) {
            cancelAnimationFrame(_pendingResizeRAF);
            _pendingResizeRAF = null;
        }
        getAllToolHandlers().forEach(handler => {
            if (handler.unregisterInteractionBlocker) {
                handler.unregisterInteractionBlocker();
            }
        });

        if (config.mode === 'edit') {
            _hoverHighlight = new Highlight(true, true);
            _clickHighlight = new Highlight(true);

            // register the event handlers
            enableHoverListeners();

            // this is to block all the interactions of the user created elements
            // so that lets say user created link doesn't redirect in edit mode
            getAllToolHandlers().forEach(handler => {
                if (handler.registerInteractionBlocker) {
                    handler.registerInteractionBlocker();
                }
            });
        } else {
            // Clean up any existing UI when edit features are disabled
            dismissUIAndCleanupState();
        }
        getAllToolHandlers().forEach(handler => {
            if (handler.reRegisterEventHandlers) {
                handler.reRegisterEventHandlers();
            }
        });
    }

    function _handleEscapeKeyPress() {
        enableHoverListeners(); // so that if hover lock is there it will get cleared
        getAllToolHandlers().forEach(handler => {
            if (handler.handleEscapePress) {
                handler.handleEscapePress();
            }
        });
        dismissUIAndCleanupState();
    }

    // Modifier shortcuts forwarded to the Weave KeyBindingManager. Clipboard
    // and undo/redo are excluded so form inputs in the previewed page keep
    // working normally.
    const _KEYS_NOT_FORWARDED = { c:1, v:1, x:1, a:1, z:1, y:1, C:1, V:1, X:1, A:1, Z:1, Y:1 };

    // Forwarding only makes sense when the page runs as an embedded LP iframe
    // inside Weave; if the user popped the preview out into a real browser
    // tab, the synthetic events would go to a window with no Weave UI.
    // Default false, flip to true via __WEAVE_EMBED_INFO (per its contract:
    // guaranteed to fire in embedded iframes, not guaranteed otherwise).
    let _isWeaveEmbeddedIframe = false;
    if (window.__WEAVE_EMBED_INFO && window.__WEAVE_EMBED_INFO.onWeaveEmbeddedInfoAvailable) {
        window.__WEAVE_EMBED_INFO.onWeaveEmbeddedInfoAvailable(function (isEmbedded) {
            _isWeaveEmbeddedIframe = !!isEmbedded;
        });
    }

    function _isFunctionKey(event) {
        return event.key.length >= 2 && event.key[0] === 'F' && !isNaN(event.key.slice(1));
    }

    function _forwardKeyEventToWeave(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        MessageBroker.send({
            keyForward: true,
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey
        });
    }

    document.addEventListener('keydown', function(event) {
        if (config.mode === 'edit' && (event.key === 'Escape' || event.key === 'Esc')) {
            event.preventDefault();
            _handleEscapeKeyPress();
        }
    });

    // Forwarder for design mode: runs as late as we can manage in the standard
    // event flow — bubble phase on `window` (latest target after document),
    // and the listener itself is registered on `load` so it goes last among
    // same-target listeners. This gives the previewed page's own handlers the
    // best chance to call preventDefault (which we then honor) before we
    // forward to Weave.
    function _designModeKeyForwarder(event) {
        if (!_isWeaveEmbeddedIframe) {
            return;
        }
        if (event.defaultPrevented) {
            return;
        }
        if (_isFunctionKey(event)) {
            _forwardKeyEventToWeave(event);
            return;
        }
        const isMod = event.metaKey || event.ctrlKey;
        if (isMod && event.key && event.key.length === 1 && !_KEYS_NOT_FORWARDED[event.key]) {
            _forwardKeyEventToWeave(event);
        }
    }

    // we need to refresh the config once the load is completed
    // this is important because messageBroker gets ready for use only when load fires
    window.addEventListener('load', function() {
        window.addEventListener('keydown', _designModeKeyForwarder);
        MessageBroker.send({
            requestConfigRefresh: true
        });
    });

    function getMode() {
        return config.mode;
    }

    function isSyncEnabled() {
        return config.syncSourceAndPreview !== false;
    }

    function getHighlightCount() {
        if (!_highlightShadowRoot) { return 0; }
        return _highlightShadowRoot.querySelectorAll('.overlay-container:not(.hidden)').length;
    }

    function getHighlightTrackingElement(index) {
        if (!_highlightShadowRoot) { return null; }
        const overlay = _highlightShadowRoot.querySelectorAll('.overlay-container:not(.hidden)')[index];
        if (!overlay || !overlay.trackingElement) { return null; }
        const el = overlay.trackingElement;
        return {
            id: el.id,
            classList: Array.from(el.classList)
        };
    }

    function getHighlightStyle(index, property) {
        if (!_highlightShadowRoot) { return null; }
        const overlay = _highlightShadowRoot.querySelectorAll('.overlay-container:not(.hidden)')[index];
        return overlay ? overlay.style[property] : null;
    }

    function setHotCornerHidden(hidden) {
        if (SHARED_STATE._hotCorner && SHARED_STATE._hotCorner.hotCorner) {
            if (hidden) {
                SHARED_STATE._hotCorner.hotCorner.classList.add('hc-hidden');
            } else {
                SHARED_STATE._hotCorner.hotCorner.classList.remove('hc-hidden');
            }
        }
    }

    /**
     * Hide just the margin/padding fills of the selected element highlight, keeping
     * the outline and the selection itself. Used while editing paint properties like
     * background color, where the fills sit on top of what the user is changing.
     * @param {Boolean} hidden
     */
    function setBoxModelHighlightHidden(hidden) {
        hidden = !!hidden;
        if (SHARED_STATE._boxModelHighlightHidden === hidden) {
            return;
        }
        SHARED_STATE._boxModelHighlightHidden = hidden;
        redrawHighlights();
    }

    let customReturns = {};
    // only apis that needs to be called from weave js layer should be customReturns. APis that are shared within
    // the remote function context only should not be in customReturns and should be in
    // either SHARED_STATE for state vars, GLOBALS for global vars, or LivePreviewView for shared functions.
    customReturns = { // we have to do this else the minifier will strip the customReturns variable
        ...customReturns,
        "DOMEditHandler": DOMEditHandler,
        "hideHighlight": hideEditorHighlight,
        "highlight": highlight,
        "highlightRule": highlightRule,
        "redrawHighlights": redrawHighlights,
        "redrawEverything": redrawEverything,
        "applyDOMEdits": applyDOMEdits,
        "updateConfig": updateConfig,
        "dismissUIAndCleanupState": dismissUIAndCleanupState,
        "escapeKeyPressInEditor": _handleEscapeKeyPress,
        "getMode": getMode,
        "isSyncEnabled": isSyncEnabled,
        "suppressDOMEditDismissal": suppressDOMEditDismissal,
        "getHighlightCount": getHighlightCount,
        "getHighlightTrackingElement": getHighlightTrackingElement,
        "getHighlightStyle": getHighlightStyle,
        "setHotCornerHidden": setHotCornerHidden,
        "setBoxModelHighlightHidden": setBoxModelHighlightHidden,
        "clearHoverState": _clearHoverState
    };

    /**
     * Built-in visual inspector used by Xingzhi's VIP edit mode. Weave Pro's
     * browser-context handlers are not part of the public repository, so the
     * community build otherwise exposes selection and text editing without a
     * usable component property editor.
     */
    function createXingzhiVisualInspector() {
        // Source changes travel through the editor and return to this preview as
        // DOM edits. Keep the property panel alive for that round trip so an
        // opening-tag rewrite is not mistaken for the user deleting the selected
        // component. The success callback renews the window because the Weave
        // bridge can resolve before the live-edit diff is delivered.
        const ATTRIBUTE_SYNC_GRACE_MS = 2000;
        let selectedElement = null;
        let panelHost = null;
        let panelRoot = null;
        let commitTimer = null;
        let dragState = null;
        let pointerCandidate = null;
        // Design mode is structure-first: every component starts with
        // drag-to-reorder enabled. Overrides use the component's stable source
        // identity so a live DOM replacement does not erase the selected state.
        // Regular live-edit mode continues to use free-position dragging.
        let componentReorderModes = new Map();
        let componentReorderFallbackKeys = new WeakMap();
        let nextComponentReorderKey = 1;
        let parentDesignMode = false;
        let reorderShortcutInfo = {
            shortcut: "Ctrl+Shift+A",
            enableLabel: "Enable Drag Reordering",
            disableLabel: "End Drag Reordering",
            changeShortcutTitle: "Change drag reordering shortcut",
            enabledStatus: "Drag reordering is enabled for the selected component",
            disabledStatus: "Drag reordering has ended for the selected component",
            sectionLabel: "Component Order",
            helpText: "Drop in the middle to move inside a container, or near an edge to place before or after it.",
            defaultStatus: "Drag reordering is enabled by default in Design mode",
            exitStatus: "Drag reordering has ended",
            noTargetStatus: "No valid drop position selected"
        };
        let visualInspectorStrings = {
            dynamicNoSource: "This element is not in the source file", saved: "Done",
            imageSource: "Image Source", altText: "Alternative text", audioSource: "Audio Source",
            videoSource: "Video Source", poster: "Poster image", mediaSource: "Media Source",
            responsiveSource: "Responsive source", mediaType: "Media type", pageAddress: "URL",
            embeddedResource: "Embedded resource", objectResource: "Object resource",
            linkAddress: "Link URL", openMode: "Open mode", link: "Link", media: "Media",
            urlPlaceholder: "URL, relative path, or data URI", chooseFile: "Open File",
            formContent: "Form content", textContent: "Content", inputValue: "Value",
            placeholder: "Placeholder", innerHtml: "Inner HTML", text: "Text",
            htmlPlaceholder: "Editable text and inner HTML", textPlaceholder: "Enter component text",
            dragInstruction: "Drop in the middle to move inside a container, or near an edge to place before or after it.",
            moved: "Component moved to its new position", fileTooLarge: "Files over 15 MB must use a relative project path",
            readingMedia: "Reading media…", readMediaFailed: "The selected media could not be read",
            componentProperties: "Element Properties", close: "Close", layoutPosition: "Layout · Position",
            position: "Position", autoFlow: "Default", relative: "Relative", absolute: "Absolute",
            fixed: "Fixed", sticky: "Sticky", display: "Display", defaultValue: "Default",
            hidden: "Hidden", width: "Width", height: "Height", appearanceTypography: "Appearance and typography",
            fontSize: "Font size", radius: "Radius", textColor: "Text color", backgroundColor: "Background color",
            alignment: "Text alignment", left: "Left", center: "Center", right: "Right", justify: "Justify",
            objectFit: "Object Fit", stretch: "Stretch", contain: "Contain", cover: "Cover",
            originalSize: "Original size", className: "Class", title: "Tooltip",
            dynamicPreviewOnly: "Dynamic component: changes are preview-only", controls: "Controls",
            autoplay: "Autoplay", loop: "Loop", muted: "Muted", allowfullscreen: "Fullscreen"
        };
        let reorderTarget = null;
        let reorderPlacement = null;
        let reorderTargetStyle = null;
        let suppressClickUntil = 0;
        let statusTimer = null;

        function setStatus(message, isError) {
            if (!panelRoot) {
                return;
            }
            const status = panelRoot.querySelector(".xv-status");
            if (!status) {
                return;
            }
            status.textContent = message || "";
            status.classList.toggle("error", !!isError);
            if (statusTimer) {
                clearTimeout(statusTimer);
            }
            if (message && !isError) {
                statusTimer = setTimeout(function () {
                    if (status) {
                        status.textContent = "";
                    }
                }, 1800);
            }
        }

        function isDesignModeActive() {
            return !!config.designMode || parentDesignMode;
        }

        function componentReorderKey(element) {
            if (!element) {
                return "";
            }
            const tagId = element.getAttribute && element.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
            if (tagId) {
                return `tag:${tagId}`;
            }
            if (element.id) {
                return `id:${element.id}`;
            }
            if (!componentReorderFallbackKeys.has(element)) {
                componentReorderFallbackKeys.set(element, `element:${nextComponentReorderKey++}`);
            }
            return componentReorderFallbackKeys.get(element);
        }

        function isSelectedReorderModeEnabled() {
            if (!selectedElement || !selectedElement.isConnected) {
                return false;
            }
            const key = componentReorderKey(selectedElement);
            return componentReorderModes.has(key) ?
                componentReorderModes.get(key) : isDesignModeActive();
        }

        function updateReorderControl() {
            if (panelRoot) {
                const orderControl = panelRoot.querySelector(".xv-order-toggle");
                if (orderControl) {
                    const enabled = isSelectedReorderModeEnabled();
                    const label = orderControl.querySelector(".xv-order-label");
                    const shortcut = orderControl.querySelector(".xv-order-shortcut");
                    if (label) {
                        label.textContent = enabled ?
                            reorderShortcutInfo.disableLabel : reorderShortcutInfo.enableLabel;
                    }
                    if (shortcut) {
                        shortcut.textContent = reorderShortcutInfo.shortcut || "";
                        shortcut.hidden = !reorderShortcutInfo.shortcut;
                    }
                    orderControl.classList.toggle("active", enabled);
                    orderControl.setAttribute("aria-pressed", String(enabled));
                }
                const keyboardControl = panelRoot.querySelector(".xv-order-keyboard");
                if (keyboardControl) {
                    keyboardControl.title = reorderShortcutInfo.changeShortcutTitle;
                    keyboardControl.setAttribute("aria-label", reorderShortcutInfo.changeShortcutTitle);
                }
                const sectionTitle = panelRoot.querySelector(".xv-order-section h3");
                if (sectionTitle) {
                    sectionTitle.textContent = reorderShortcutInfo.sectionLabel;
                }
                const orderHelp = panelRoot.querySelector(".xv-order-help");
                if (orderHelp) {
                    orderHelp.textContent = reorderShortcutInfo.helpText;
                }
            }
        }

        function updateSelectedReorderShortcut(info) {
            if (info && typeof info === "object") {
                Object.keys(reorderShortcutInfo).forEach(function (key) {
                    if (typeof info[key] === "string") {
                        reorderShortcutInfo[key] = info[key];
                    }
                });
                if (info.inspector && typeof info.inspector === "object") {
                    Object.keys(visualInspectorStrings).forEach(function (key) {
                        if (typeof info.inspector[key] === "string") {
                            visualInspectorStrings[key] = info.inspector[key];
                        }
                    });
                }
                if (typeof info.designMode === "boolean") {
                    parentDesignMode = info.designMode;
                }
            }
            updateReorderControl();
            return true;
        }

        function requestReorderShortcutInfo() {
            if (!WeaveComm || !WeaveComm.execWeaveFn) {
                return;
            }
            WeaveComm.execWeaveFn("Xingzhi.getDragReorderShortcutInfo", {}).then(
                updateSelectedReorderShortcut,
                function (error) {
                    console.warn("Unable to load drag reorder shortcut information", error);
                }
            );
        }

        function setSelectedReorderMode(enabled, message) {
            if (!selectedElement || !selectedElement.isConnected) {
                return false;
            }
            componentReorderModes.set(componentReorderKey(selectedElement), !!enabled);
            updateReorderControl();
            if (message) {
                setStatus(message, false);
            }
            return isSelectedReorderModeEnabled();
        }

        function toggleSelectedReorderMode() {
            if (!selectedElement || !selectedElement.isConnected) {
                return false;
            }
            const enabled = !isSelectedReorderModeEnabled();
            setSelectedReorderMode(enabled, enabled ?
                reorderShortcutInfo.enabledStatus : reorderShortcutInfo.disabledStatus);
            return enabled;
        }

        function sourceLocator(element) {
            if (!element || !element.tagName) {
                return null;
            }
            const tagName = element.tagName.toLowerCase();
            const instrumented = Array.from(window.document.querySelectorAll(
                `[${GLOBALS.DATA_BRACKETS_ID_ATTR}]`)).filter(function (candidate) {
                return candidate.tagName && candidate.tagName.toLowerCase() === tagName;
            });
            const sourceAttribute = tagName === "object" ? "data" :
                tagName === "a" || tagName === "link" ? "href" : "src";
            return {
                tagName: tagName,
                ordinal: instrumented.indexOf(element),
                id: element.id || "",
                sourceAttribute: sourceAttribute,
                source: element.getAttribute(`data-xingzhi-original-${sourceAttribute}`) ||
                    element.getAttribute(sourceAttribute) || ""
            };
        }

        function persistAttributes(attributes, immediate) {
            if (!selectedElement || !selectedElement.isConnected) {
                return;
            }
            const tagId = selectedElement.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
            if (!tagId) {
                setStatus(visualInspectorStrings.dynamicNoSource, true);
                return;
            }
            if (commitTimer) {
                clearTimeout(commitTimer);
            }
            const persist = function () {
                commitTimer = null;
                suppressDOMEditDismissal(ATTRIBUTE_SYNC_GRACE_MS);
                WeaveComm.execWeaveFn("Xingzhi.applyVisualAttributes", {
                    tagId: tagId,
                    locator: sourceLocator(selectedElement),
                    attributes: attributes
                }).then(function () {
                    suppressDOMEditDismissal(ATTRIBUTE_SYNC_GRACE_MS);
                    setStatus(visualInspectorStrings.saved, false);
                }).catch(function (error) {
                    setStatus(String(error && error.message || error), true);
                });
            };
            if (immediate) {
                persist();
            } else {
                commitTimer = setTimeout(persist, 120);
            }
        }

        function persistStyle(immediate) {
            const styleText = selectedElement && selectedElement.getAttribute("style");
            persistAttributes({ style: styleText && styleText.trim() ? styleText : null }, immediate);
            redrawHighlights();
        }

        function persistContent(content, mode, immediate) {
            if (!selectedElement || !selectedElement.isConnected) {
                return;
            }
            const tagId = selectedElement.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
            if (!tagId) {
                setStatus(visualInspectorStrings.dynamicNoSource, true);
                return;
            }
            if (commitTimer) {
                clearTimeout(commitTimer);
            }
            const persist = function () {
                commitTimer = null;
                WeaveComm.execWeaveFn("Xingzhi.applyVisualContent", {
                    tagId: tagId,
                    locator: sourceLocator(selectedElement),
                    content: content,
                    mode: mode || "text"
                }).then(function () {
                    setStatus(visualInspectorStrings.saved, false);
                }).catch(function (error) {
                    setStatus(String(error && error.message || error), true);
                });
            };
            if (immediate) {
                persist();
            } else {
                commitTimer = setTimeout(persist, 180);
            }
        }

        function toPixels(value) {
            const number = parseFloat(value);
            return Number.isFinite(number) ? `${number}px` : "";
        }

        function rgbToHex(value) {
            if (!value || value === "transparent") {
                return "#000000";
            }
            if (value[0] === "#") {
                return value.slice(0, 7);
            }
            const parts = value.match(/[\d.]+/g);
            if (!parts || parts.length < 3) {
                return "#000000";
            }
            return "#" + parts.slice(0, 3).map(function (part) {
                return Math.max(0, Math.min(255, Math.round(parseFloat(part))))
                    .toString(16).padStart(2, "0");
            }).join("");
        }

        function field(label, key, value, options) {
            options = options || {};
            const row = window.document.createElement("label");
            row.className = options.wide ? "xv-field wide" : "xv-field";
            const caption = window.document.createElement("span");
            caption.textContent = label;
            row.appendChild(caption);
            let control;
            if (options.choices) {
                control = window.document.createElement("select");
                options.choices.forEach(function (choice) {
                    const option = window.document.createElement("option");
                    option.value = choice[0];
                    option.textContent = choice[1];
                    control.appendChild(option);
                });
                control.value = value || "";
            } else if (options.multiline) {
                control = window.document.createElement("textarea");
                control.rows = options.rows || 3;
                control.value = value === undefined || value === null ? "" : value;
                if (options.placeholder) {
                    control.placeholder = options.placeholder;
                }
            } else {
                control = window.document.createElement("input");
                control.type = options.type || "text";
                if (options.placeholder) {
                    control.placeholder = options.placeholder;
                }
                control.value = value === undefined || value === null ? "" : value;
                if (options.step) {
                    control.step = options.step;
                }
            }
            if (options.styleProperty) {
                control.dataset.styleProperty = options.styleProperty;
            }
            if (options.attribute) {
                control.dataset.attribute = options.attribute;
            }
            if (options.contentMode) {
                control.dataset.contentMode = options.contentMode;
            }
            row.appendChild(control);
            return row;
        }

        function checkbox(label, attribute, checked) {
            const row = window.document.createElement("label");
            row.className = "xv-check";
            const input = window.document.createElement("input");
            input.type = "checkbox";
            input.checked = checked;
            input.dataset.booleanAttribute = attribute;
            row.appendChild(input);
            row.appendChild(window.document.createTextNode(label));
            return row;
        }

        function section(title) {
            const wrapper = window.document.createElement("section");
            const heading = window.document.createElement("h3");
            heading.textContent = title;
            wrapper.appendChild(heading);
            const grid = window.document.createElement("div");
            grid.className = "xv-grid";
            wrapper.appendChild(grid);
            return { wrapper: wrapper, grid: grid };
        }

        function addMediaSection(container, element) {
            const tag = element.tagName.toLowerCase();
            const configurations = {
                img: { source: "src", accept: "image/*", label: visualInspectorStrings.imageSource,
                    extras: [["alt", visualInspectorStrings.altText]] },
                audio: { source: "src", accept: "audio/*", label: visualInspectorStrings.audioSource,
                    toggles: ["controls", "autoplay", "loop"] },
                video: { source: "src", accept: "video/*", label: visualInspectorStrings.videoSource,
                    extras: [["poster", visualInspectorStrings.poster]],
                    toggles: ["controls", "autoplay", "loop", "muted"] },
                source: { source: "src", accept: "image/*,audio/*,video/*", label: visualInspectorStrings.mediaSource,
                    extras: [["srcset", visualInspectorStrings.responsiveSource], ["type", visualInspectorStrings.mediaType]] },
                iframe: { source: "src", accept: null, label: visualInspectorStrings.pageAddress,
                    toggles: ["allowfullscreen"] },
                embed: { source: "src", accept: null, label: visualInspectorStrings.embeddedResource,
                    extras: [["type", visualInspectorStrings.mediaType]] },
                object: { source: "data", accept: null, label: visualInspectorStrings.objectResource,
                    extras: [["type", visualInspectorStrings.mediaType]] },
                a: { source: "href", accept: null, label: visualInspectorStrings.linkAddress,
                    extras: [["target", visualInspectorStrings.openMode]] }
            };
            const configForTag = configurations[tag];
            if (!configForTag) {
                return;
            }
            const media = section(tag === "a" ? visualInspectorStrings.link : visualInspectorStrings.media);
            media.grid.appendChild(field(configForTag.label, configForTag.source,
                element.getAttribute(`data-xingzhi-original-${configForTag.source}`) ||
                    element.getAttribute(configForTag.source) || "", {
                    attribute: configForTag.source,
                    wide: true,
                    placeholder: visualInspectorStrings.urlPlaceholder
                }));
            if (configForTag.accept) {
                const pickerRow = window.document.createElement("div");
                pickerRow.className = "xv-file-row wide";
                const picker = window.document.createElement("input");
                picker.type = "file";
                picker.accept = configForTag.accept;
                picker.className = "xv-file-input";
                picker.dataset.assetAttribute = configForTag.source;
                const button = window.document.createElement("button");
                button.type = "button";
                button.textContent = visualInspectorStrings.chooseFile;
                button.addEventListener("click", function () { picker.click(); });
                pickerRow.appendChild(button);
                pickerRow.appendChild(picker);
                media.grid.appendChild(pickerRow);
            }
            (configForTag.extras || []).forEach(function (extra) {
                media.grid.appendChild(field(extra[1], extra[0], element.getAttribute(extra[0]) || "", {
                    attribute: extra[0], wide: true
                }));
            });
            if (configForTag.toggles) {
                const toggles = window.document.createElement("div");
                toggles.className = "xv-toggle-row wide";
                configForTag.toggles.forEach(function (attribute) {
                    toggles.appendChild(checkbox(visualInspectorStrings[attribute] || attribute,
                        attribute, element.hasAttribute(attribute)));
                });
                media.grid.appendChild(toggles);
            }
            container.appendChild(media.wrapper);
        }

        function addContentSection(container, element) {
            const tag = element.tagName.toLowerCase();
            if (["img", "audio", "video", "source", "iframe", "embed", "object", "br", "hr",
                "canvas", "svg", "script", "style"].includes(tag)) {
                return;
            }
            const content = section(tag === "input" || tag === "textarea" ?
                visualInspectorStrings.formContent : visualInspectorStrings.textContent);
            if (tag === "input") {
                content.grid.appendChild(field(visualInspectorStrings.inputValue, "value", element.getAttribute("value") || "", {
                    attribute: "value", wide: true
                }));
                content.grid.appendChild(field(visualInspectorStrings.placeholder, "placeholder",
                    element.getAttribute("placeholder") || "", { attribute: "placeholder", wide: true }));
            } else {
                const hasElementChildren = element.children.length > 0;
                let editableContent = element.textContent;
                if (hasElementChildren) {
                    const cleanClone = element.cloneNode(true);
                    cleanClone.querySelectorAll("*").forEach(function (child) {
                        child.removeAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR);
                        child.removeAttribute(GLOBALS.LP_REF_ATTR);
                        child.removeAttribute(GLOBALS.WECODE_INTERNAL_ATTR);
                    });
                    editableContent = cleanClone.innerHTML;
                }
                content.grid.appendChild(field(hasElementChildren ? visualInspectorStrings.innerHtml :
                    visualInspectorStrings.text, "content",
                    editableContent, {
                        multiline: true,
                        rows: hasElementChildren ? 5 : 3,
                        contentMode: hasElementChildren ? "html" : "text",
                        wide: true,
                        placeholder: hasElementChildren ? visualInspectorStrings.htmlPlaceholder :
                            visualInspectorStrings.textPlaceholder
                    }));
            }
            container.appendChild(content.wrapper);
        }

        /**
         * Ensures the selected component can be moved with left/top offsets and
         * returns its current pixel origin.
         * @returns {{left: number, top: number}}
         */
        function prepareSelectedElementForMovement() {
            const computed = window.getComputedStyle(selectedElement);
            if (computed.position === "static") {
                selectedElement.style.position = "relative";
            }
            let left = parseFloat(selectedElement.style.left);
            let top = parseFloat(selectedElement.style.top);
            if (!Number.isFinite(left)) {
                left = computed.position === "absolute" ? selectedElement.offsetLeft :
                    computed.position === "fixed" ? selectedElement.getBoundingClientRect().left : 0;
            }
            if (!Number.isFinite(top)) {
                top = computed.position === "absolute" ? selectedElement.offsetTop :
                    computed.position === "fixed" ? selectedElement.getBoundingClientRect().top : 0;
            }
            return { left: left, top: top };
        }

        const NON_CONTAINER_TAGS = new Set([
            "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
            "param", "source", "track", "wbr", "script", "style", "head", "html"
        ]);

        function clearReorderTarget() {
            if (reorderTarget && reorderTargetStyle) {
                if (reorderTargetStyle.outline) {
                    reorderTarget.style.outline = reorderTargetStyle.outline;
                } else {
                    reorderTarget.style.removeProperty("outline");
                }
                if (reorderTargetStyle.outlineOffset) {
                    reorderTarget.style.outlineOffset = reorderTargetStyle.outlineOffset;
                } else {
                    reorderTarget.style.removeProperty("outline-offset");
                }
            }
            reorderTarget = null;
            reorderPlacement = null;
            reorderTargetStyle = null;
        }

        function findReorderTarget(node) {
            let candidate = node && node.nodeType === window.Node.ELEMENT_NODE ? node : node && node.parentElement;
            while (candidate && candidate !== window.document.documentElement) {
                if (candidate === selectedElement || selectedElement.contains(candidate)) {
                    candidate = selectedElement.parentElement;
                    continue;
                }
                if (LivePreviewView.isElementInspectable(candidate) &&
                        candidate.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR)) {
                    return candidate;
                }
                candidate = candidate.parentElement;
            }
            return null;
        }

        function getReorderPlacement(target, event) {
            const rect = target.getBoundingClientRect();
            const relativeY = rect.height ? (event.clientY - rect.top) / rect.height : 0;
            const canContainChildren = !NON_CONTAINER_TAGS.has(target.tagName.toLowerCase());
            if (canContainChildren && rect.height >= 48 && relativeY >= 0.28 && relativeY <= 0.72) {
                return "inside";
            }
            return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
        }

        /**
         * Starts moving the selected component from a direct pointer gesture.
         * A short movement threshold keeps ordinary taps as selection gestures.
         * @param {PointerEvent} event
         */
        function startDrag(event) {
            if (!selectedElement || !selectedElement.isConnected) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (isSelectedReorderModeEnabled()) {
                dragState = {
                    pointerId: event.pointerId,
                    reorder: true,
                    previousPointerEvents: selectedElement.style.pointerEvents
                };
                selectedElement.style.pointerEvents = "none";
                if (panelHost) {
                    panelHost.classList.add("xv-dragging");
                }
                setStatus(visualInspectorStrings.dragInstruction, false);
                return;
            }
            const origin = prepareSelectedElementForMovement();
            dragState = {
                pointerId: event.pointerId,
                startX: pointerCandidate ? pointerCandidate.startX : event.clientX,
                startY: pointerCandidate ? pointerCandidate.startY : event.clientY,
                left: origin.left,
                top: origin.top
            };
            if (selectedElement.setPointerCapture) {
                try {
                    selectedElement.setPointerCapture(event.pointerId);
                } catch (error) {
                    // The document-level listeners still keep the drag active.
                }
            }
            if (panelHost) {
                panelHost.classList.add("xv-dragging");
            }
        }

        function moveDrag(event) {
            if (!dragState || event.pointerId !== dragState.pointerId || !selectedElement) {
                return;
            }
            if (dragState.reorder) {
                const target = findReorderTarget(window.document.elementFromPoint(event.clientX, event.clientY));
                const placement = target ? getReorderPlacement(target, event) : null;
                if (reorderTarget !== target || reorderPlacement !== placement) {
                    clearReorderTarget();
                    reorderTarget = target;
                    reorderPlacement = placement;
                    if (reorderTarget) {
                        reorderTargetStyle = {
                            outline: reorderTarget.style.outline,
                            outlineOffset: reorderTarget.style.outlineOffset
                        };
                        reorderTarget.style.outline = placement === "inside" ?
                            "3px solid #41c98e" : "3px solid #7c8cff";
                        reorderTarget.style.outlineOffset = placement === "inside" ? "-4px" : "3px";
                    }
                }
                return;
            }
            const left = Math.round(dragState.left + event.clientX - dragState.startX);
            const top = Math.round(dragState.top + event.clientY - dragState.startY);
            selectedElement.style.left = `${left}px`;
            selectedElement.style.top = `${top}px`;
            const leftInput = panelRoot && panelRoot.querySelector('[data-style-property="left"]');
            const topInput = panelRoot && panelRoot.querySelector('[data-style-property="top"]');
            if (leftInput) { leftInput.value = left; }
            if (topInput) { topInput.value = top; }
            persistStyle(false);
        }

        function endDrag(event) {
            if (!dragState || event.pointerId !== dragState.pointerId) {
                return;
            }
            const completedDrag = dragState;
            dragState = null;
            if (panelHost) {
                panelHost.classList.remove("xv-dragging");
            }
            if (completedDrag.reorder) {
                selectedElement.style.pointerEvents = completedDrag.previousPointerEvents || "";
                if (!completedDrag.previousPointerEvents) {
                    selectedElement.style.removeProperty("pointer-events");
                }
                const target = reorderTarget;
                const placement = reorderPlacement;
                if (!target) {
                    clearReorderTarget();
                    setStatus(reorderShortcutInfo.noTargetStatus, true);
                    return;
                }
                clearReorderTarget();
                suppressDOMEditDismissal(ATTRIBUTE_SYNC_GRACE_MS);
                WeaveComm.execWeaveFn("Xingzhi.reorderVisualElement", {
                    tagId: selectedElement.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR),
                    locator: sourceLocator(selectedElement),
                    targetTagId: target.getAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR),
                    targetLocator: sourceLocator(target),
                    placement: placement
                }).then(function () {
                    setStatus(visualInspectorStrings.moved, false);
                }).catch(function (error) {
                    setStatus(String(error && error.message || error), true);
                });
                return;
            }
            persistStyle(true);
        }

        /**
         * Records a possible drag only when the pointer starts inside the
         * currently selected component. The first click therefore selects and
         * a following drag moves that same component directly on the canvas.
         * @param {PointerEvent} event
         */
        function handleDocumentPointerDown(event) {
            if (!selectedElement || !selectedElement.isConnected || event.button > 0) {
                return;
            }
            const target = event.target;
            if (!target || (target !== selectedElement && !selectedElement.contains(target)) ||
                    isPointerEditOptedOut(target)) {
                return;
            }
            pointerCandidate = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY
            };
        }

        function handleDocumentPointerMove(event) {
            if (!pointerCandidate || pointerCandidate.pointerId !== event.pointerId) {
                return;
            }
            if (!dragState) {
                const deltaX = event.clientX - pointerCandidate.startX;
                const deltaY = event.clientY - pointerCandidate.startY;
                if (Math.hypot(deltaX, deltaY) < 4) {
                    return;
                }
                startDrag(event);
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            moveDrag(event);
        }

        function handleDocumentPointerEnd(event) {
            if (!pointerCandidate || pointerCandidate.pointerId !== event.pointerId) {
                return;
            }
            pointerCandidate = null;
            if (!dragState) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClickUntil = Date.now() + 350;
            endDrag(event);
        }

        /**
         * Moves the selected component with arrow-key shortcuts. Arrow keys
         * nudge by one pixel; Shift plus an arrow nudges by ten pixels.
         * @param {KeyboardEvent} event
         */
        function handleDocumentKeyDown(event) {
            const direction = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1]
            }[event.key];
            if (!direction || !selectedElement || !selectedElement.isConnected) {
                return;
            }
            const target = event.target;
            if (target && (target.closest && target.closest(`[${GLOBALS.WECODE_INTERNAL_ATTR}]`) ||
                    target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            const origin = prepareSelectedElementForMovement();
            const distance = event.shiftKey ? 10 : 1;
            selectedElement.style.left = `${Math.round(origin.left + direction[0] * distance)}px`;
            selectedElement.style.top = `${Math.round(origin.top + direction[1] * distance)}px`;
            persistStyle(true);
            redrawHighlights();
        }

        function handleControlChange(event) {
            const control = event.target;
            if (!selectedElement || !control || !control.dataset) {
                return;
            }
            if (control.dataset.contentMode) {
                const mode = control.dataset.contentMode;
                if (mode === "html") {
                    selectedElement.innerHTML = control.value;
                } else if (selectedElement.tagName.toLowerCase() === "textarea") {
                    selectedElement.value = control.value;
                    selectedElement.textContent = control.value;
                } else {
                    selectedElement.textContent = control.value;
                }
                persistContent(control.value, mode, event.type === "change");
                redrawHighlights();
            } else if (control.dataset.styleProperty) {
                const property = control.dataset.styleProperty;
                let value = control.value;
                if (["left", "top", "width", "height", "fontSize", "borderRadius", "gap"].includes(property)) {
                    value = toPixels(value);
                }
                if (property === "position" && value === "") {
                    selectedElement.style.removeProperty("position");
                    selectedElement.style.removeProperty("left");
                    selectedElement.style.removeProperty("top");
                } else if (value) {
                    selectedElement.style[property] = value;
                } else {
                    selectedElement.style.removeProperty(property);
                }
                persistStyle(event.type === "change");
            } else if (control.dataset.attribute) {
                const name = control.dataset.attribute;
                const value = control.value.trim();
                if (value) {
                    selectedElement.setAttribute(name, value);
                } else {
                    selectedElement.removeAttribute(name);
                }
                persistAttributes({ [name]: value || null }, event.type === "change");
            } else if (control.dataset.booleanAttribute) {
                const name = control.dataset.booleanAttribute;
                if (control.checked) {
                    selectedElement.setAttribute(name, "");
                } else {
                    selectedElement.removeAttribute(name);
                }
                persistAttributes({ [name]: control.checked }, true);
            }
        }

        function handleAssetSelection(event) {
            const input = event.target;
            const file = input.files && input.files[0];
            if (!file || !selectedElement) {
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                setStatus(visualInspectorStrings.fileTooLarge, true);
                input.value = "";
                return;
            }
            setStatus(visualInspectorStrings.readingMedia, false);
            const reader = new FileReader();
            reader.onload = function () {
                const attribute = input.dataset.assetAttribute;
                const value = String(reader.result || "");
                selectedElement.setAttribute(attribute, value);
                const sourceInput = panelRoot.querySelector(`[data-attribute="${attribute}"]`);
                if (sourceInput) {
                    sourceInput.value = value;
                }
                persistAttributes({ [attribute]: value }, true);
            };
            reader.onerror = function () {
                setStatus(visualInspectorStrings.readMediaFailed, true);
            };
            reader.readAsDataURL(file);
        }

        function render(element) {
            closePanel();
            selectedElement = element;
            panelHost = window.document.createElement("div");
            panelHost.setAttribute(GLOBALS.WECODE_INTERNAL_ATTR, "visual-inspector");
            panelHost.className = "xingzhi-visual-inspector-host";
            panelRoot = panelHost.attachShadow({ mode: "open" });
            const style = window.document.createElement("style");
            style.textContent = `
                :host { all: initial; position: fixed; z-index: 2147483646; top: 12px; right: 12px;
                    width: min(304px, calc(100vw - 24px)); max-height: calc(100vh - 24px); color: #e8e9ed;
                    font: 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                * { box-sizing: border-box; }
                .xv-panel { overflow: auto; max-height: calc(100vh - 24px); background: #15171b;
                    border: 1px solid #3a3d45; border-radius: 8px; box-shadow: 0 12px 36px rgba(0,0,0,.52); }
                header { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px;
                    padding: 10px 11px; background: #1d2026; border-bottom: 1px solid #343740; }
                .xv-tag { color: #8db6ff; font-weight: 650; letter-spacing: .35px; }
                .xv-path { min-width: 0; flex: 1; color: #9ca1ad; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .xv-close { border: 0; background: transparent; color: #a9adb7; font-size: 18px; cursor: pointer; padding: 0 3px; }
                section { padding: 10px 11px; border-bottom: 1px solid #2a2d34; }
                h3 { margin: 0 0 8px; color: #c8cbd2; font-size: 11px; font-weight: 650; text-transform: uppercase; letter-spacing: .7px; }
                .xv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .xv-field { display: flex; flex-direction: column; min-width: 0; gap: 4px; color: #9fa4af; }
                .wide { grid-column: 1 / -1; }
                input, select, textarea, button { min-width: 0; border: 1px solid #3a3e48; border-radius: 4px;
                    background: #0e1014; color: #e8e9ed; font: inherit; outline: none; }
                input, select, button { height: 29px; }
                input, select, textarea { width: 100%; padding: 4px 7px; }
                textarea { min-height: 64px; resize: vertical; line-height: 1.45; }
                input:focus, select:focus, textarea:focus { border-color: #6e8fe9; box-shadow: 0 0 0 1px #6e8fe9; }
                input[type=color] { padding: 2px; }
                button { padding: 0 9px; background: #292d35; cursor: pointer; }
                button:hover { background: #343946; border-color: #515766; }
                .xv-toggle-row { display: flex; flex-wrap: wrap; gap: 8px 12px; }
                .xv-check { display: inline-flex; align-items: center; gap: 5px; color: #b5bac4; }
                .xv-check input { width: 14px; height: 14px; padding: 0; }
                .xv-file-input { display: none; }
                .xv-file-row button { width: 100%; }
                .xv-footer { min-height: 30px; padding: 7px 11px; color: #78c995; background: #121418; }
                .xv-status.error { color: #ff8585; }
                .xv-order-help { color: #858b98; font-size: 11px; line-height: 1.45; }
                .xv-order-row { display: flex; grid-column: 1 / -1; gap: 6px; min-width: 0; }
                .xv-order-toggle { display: flex; flex: 1; align-items: center; justify-content: space-between;
                    gap: 8px; min-width: 0; }
                .xv-order-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .xv-order-shortcut { flex: none; color: #9da4b3; font-size: 11px; }
                .xv-order-keyboard { flex: none; width: 31px; padding: 0; font-size: 16px; line-height: 1; }
                .xv-order-toggle.active { border-color: #7c8cff; color: #b8c0ff; }
                :host(.xv-dragging) .xv-panel { border-color: #7195f1; }
            `;
            panelRoot.appendChild(style);
            const panel = window.document.createElement("div");
            panel.className = "xv-panel";
            const header = window.document.createElement("header");
            const tagName = window.document.createElement("span");
            tagName.className = "xv-tag";
            tagName.textContent = `<${element.tagName.toLowerCase()}>`;
            const path = window.document.createElement("span");
            path.className = "xv-path";
            path.textContent = element.id ? `#${element.id}` :
                Array.from(element.classList).slice(0, 2).map(name => `.${name}`).join("") ||
                    visualInspectorStrings.componentProperties;
            const close = window.document.createElement("button");
            close.className = "xv-close";
            close.type = "button";
            close.setAttribute("aria-label", visualInspectorStrings.close);
            close.textContent = "×";
            close.addEventListener("click", closePanel);
            header.appendChild(tagName);
            header.appendChild(path);
            header.appendChild(close);
            panel.appendChild(header);

            const rect = element.getBoundingClientRect();
            const computed = window.getComputedStyle(element);
            const layout = section(visualInspectorStrings.layoutPosition);
            const positionValue = ["relative", "absolute", "fixed", "sticky"].includes(computed.position) ?
                computed.position : "";
            layout.grid.appendChild(field(visualInspectorStrings.position, "position", positionValue, {
                styleProperty: "position",
                choices: [["", visualInspectorStrings.autoFlow], ["relative", visualInspectorStrings.relative],
                    ["absolute", visualInspectorStrings.absolute], ["fixed", visualInspectorStrings.fixed],
                    ["sticky", visualInspectorStrings.sticky]]
            }));
            layout.grid.appendChild(field(visualInspectorStrings.display, "display", computed.display, {
                styleProperty: "display",
                choices: [["", visualInspectorStrings.defaultValue], ["block", "Block"], ["inline", "Inline"],
                    ["inline-block", "Inline Block"], ["flex", "Flex"], ["grid", "Grid"],
                    ["none", visualInspectorStrings.hidden]]
            }));
            layout.grid.appendChild(field("X", "left", parseFloat(element.style.left) || 0,
                { type: "number", styleProperty: "left", step: "1" }));
            layout.grid.appendChild(field("Y", "top", parseFloat(element.style.top) || 0,
                { type: "number", styleProperty: "top", step: "1" }));
            layout.grid.appendChild(field(visualInspectorStrings.width, "width", Math.round(rect.width),
                { type: "number", styleProperty: "width", step: "1" }));
            layout.grid.appendChild(field(visualInspectorStrings.height, "height", Math.round(rect.height),
                { type: "number", styleProperty: "height", step: "1" }));
            panel.appendChild(layout.wrapper);

            const ordering = section(reorderShortcutInfo.sectionLabel);
            ordering.wrapper.classList.add("xv-order-section");
            const orderRow = window.document.createElement("div");
            orderRow.className = "xv-order-row";
            const orderControl = window.document.createElement("button");
            orderControl.type = "button";
            orderControl.className = "xv-order-toggle";
            const reorderEnabled = isSelectedReorderModeEnabled();
            const orderLabel = window.document.createElement("span");
            orderLabel.className = "xv-order-label";
            orderLabel.textContent = reorderEnabled ?
                reorderShortcutInfo.disableLabel : reorderShortcutInfo.enableLabel;
            const orderShortcut = window.document.createElement("span");
            orderShortcut.className = "xv-order-shortcut";
            orderShortcut.textContent = reorderShortcutInfo.shortcut || "";
            orderShortcut.hidden = !reorderShortcutInfo.shortcut;
            orderControl.appendChild(orderLabel);
            orderControl.appendChild(orderShortcut);
            orderControl.classList.toggle("active", reorderEnabled);
            orderControl.setAttribute("aria-pressed", String(reorderEnabled));
            orderControl.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const enabled = !isSelectedReorderModeEnabled();
                setSelectedReorderMode(enabled, enabled ?
                    reorderShortcutInfo.enabledStatus : reorderShortcutInfo.disabledStatus);
                orderControl.setAttribute("aria-pressed", String(enabled));
                window.requestAnimationFrame(updateReorderControl);
            });
            orderRow.appendChild(orderControl);
            const keyboardControl = window.document.createElement("button");
            keyboardControl.type = "button";
            keyboardControl.className = "xv-order-keyboard";
            keyboardControl.title = reorderShortcutInfo.changeShortcutTitle;
            keyboardControl.setAttribute("aria-label", reorderShortcutInfo.changeShortcutTitle);
            keyboardControl.textContent = "⌨";
            keyboardControl.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                WeaveComm.execWeaveFn("Xingzhi.changeDragReorderShortcut", {}).then(null, function (error) {
                    console.warn("Unable to open drag reorder shortcut dialog", error);
                });
            });
            orderRow.appendChild(keyboardControl);
            ordering.grid.appendChild(orderRow);
            const orderHelp = window.document.createElement("div");
            orderHelp.className = "wide xv-order-help";
            orderHelp.textContent = reorderShortcutInfo.helpText;
            ordering.grid.appendChild(orderHelp);
            panel.appendChild(ordering.wrapper);
            requestReorderShortcutInfo();

            const appearance = section(visualInspectorStrings.appearanceTypography);
            appearance.grid.appendChild(field(visualInspectorStrings.fontSize, "fontSize", parseFloat(computed.fontSize) || "",
                { type: "number", styleProperty: "fontSize", step: "1" }));
            appearance.grid.appendChild(field(visualInspectorStrings.radius, "borderRadius", parseFloat(computed.borderRadius) || 0,
                { type: "number", styleProperty: "borderRadius", step: "1" }));
            appearance.grid.appendChild(field(visualInspectorStrings.textColor, "color", rgbToHex(computed.color),
                { type: "color", styleProperty: "color" }));
            appearance.grid.appendChild(field(visualInspectorStrings.backgroundColor, "backgroundColor", rgbToHex(computed.backgroundColor),
                { type: "color", styleProperty: "backgroundColor" }));
            appearance.grid.appendChild(field(visualInspectorStrings.alignment, "textAlign", computed.textAlign, {
                styleProperty: "textAlign", choices: [["", visualInspectorStrings.defaultValue],
                    ["left", visualInspectorStrings.left], ["center", visualInspectorStrings.center],
                    ["right", visualInspectorStrings.right], ["justify", visualInspectorStrings.justify]]
            }));
            if (["img", "video"].includes(element.tagName.toLowerCase())) {
                appearance.grid.appendChild(field(visualInspectorStrings.objectFit, "objectFit", computed.objectFit, {
                    styleProperty: "objectFit", choices: [["fill", visualInspectorStrings.stretch],
                        ["contain", visualInspectorStrings.contain], ["cover", visualInspectorStrings.cover],
                        ["none", visualInspectorStrings.originalSize]]
                }));
            }
            panel.appendChild(appearance.wrapper);

            addContentSection(panel, element);

            const identity = section(visualInspectorStrings.componentProperties);
            identity.grid.appendChild(field("ID", "id", element.id || "", { attribute: "id", wide: true }));
            identity.grid.appendChild(field(visualInspectorStrings.className, "class", element.getAttribute("class") || "",
                { attribute: "class", wide: true }));
            identity.grid.appendChild(field(visualInspectorStrings.title, "title", element.getAttribute("title") || "",
                { attribute: "title", wide: true }));
            panel.appendChild(identity.wrapper);
            addMediaSection(panel, element);

            const footer = window.document.createElement("div");
            footer.className = "xv-footer";
            const status = window.document.createElement("span");
            status.className = "xv-status";
            footer.appendChild(status);
            panel.appendChild(footer);
            panelRoot.appendChild(panel);
            panelRoot.addEventListener("input", handleControlChange);
            panelRoot.addEventListener("change", function (event) {
                if (event.target && event.target.classList.contains("xv-file-input")) {
                    handleAssetSelection(event);
                } else {
                    handleControlChange(event);
                }
            });
            panelHost.addEventListener("pointerdown", function (event) { event.stopPropagation(); });
            panelHost.addEventListener("click", function (event) { event.stopPropagation(); });
            window.document.documentElement.appendChild(panelHost);
            if (!element.hasAttribute(GLOBALS.DATA_BRACKETS_ID_ATTR)) {
                setStatus(visualInspectorStrings.dynamicPreviewOnly, true);
            }
        }

        function closePanel() {
            if (commitTimer) {
                clearTimeout(commitTimer);
                commitTimer = null;
            }
            if (statusTimer) {
                clearTimeout(statusTimer);
                statusTimer = null;
            }
            dragState = null;
            clearReorderTarget();
            if (panelHost) {
                panelHost.remove();
            }
            panelHost = null;
            panelRoot = null;
        }

        function dismiss() {
            closePanel();
            pointerCandidate = null;
            selectedElement = null;
        }

        function select(element) {
            closePanel();
            selectedElement = element;
        }

        function handleDocumentClick(event) {
            if (Date.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            const path = event.composedPath ? event.composedPath() : [event.target];
            const internalClick = path.some(function (node) {
                return node && node.getAttribute && node.hasAttribute(GLOBALS.WECODE_INTERNAL_ATTR);
            });
            if (internalClick) {
                return;
            }
            handleElementClick(event.target, event);
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        function handleDocumentDoubleClick(event) {
            const target = event.target;
            if (!target || isPointerEditOptedOut(target) || isBodyElement(target) ||
                    !LivePreviewView.isElementInspectable(target)) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            if (selectedElement !== target) {
                handleElementClick(target, event);
            }
            render(target);
        }

        function registerInteractionBlocker() {
            window.document.removeEventListener("click", handleDocumentClick, true);
            window.document.removeEventListener("dblclick", handleDocumentDoubleClick, true);
            window.document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
            window.document.removeEventListener("pointermove", handleDocumentPointerMove, true);
            window.document.removeEventListener("pointerup", handleDocumentPointerEnd, true);
            window.document.removeEventListener("pointercancel", handleDocumentPointerEnd, true);
            window.document.removeEventListener("keydown", handleDocumentKeyDown, true);
            window.document.addEventListener("click", handleDocumentClick, true);
            window.document.addEventListener("dblclick", handleDocumentDoubleClick, true);
            window.document.addEventListener("pointerdown", handleDocumentPointerDown, true);
            window.document.addEventListener("pointermove", handleDocumentPointerMove, true);
            window.document.addEventListener("pointerup", handleDocumentPointerEnd, true);
            window.document.addEventListener("pointercancel", handleDocumentPointerEnd, true);
            window.document.addEventListener("keydown", handleDocumentKeyDown, true);
        }

        function unregisterInteractionBlocker() {
            window.document.removeEventListener("click", handleDocumentClick, true);
            window.document.removeEventListener("dblclick", handleDocumentDoubleClick, true);
            window.document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
            window.document.removeEventListener("pointermove", handleDocumentPointerMove, true);
            window.document.removeEventListener("pointerup", handleDocumentPointerEnd, true);
            window.document.removeEventListener("pointercancel", handleDocumentPointerEnd, true);
            window.document.removeEventListener("keydown", handleDocumentKeyDown, true);
        }

        registerToolHandler("XingzhiVisualInspector", {
            onElementSelected: select,
            dismiss: dismiss,
            handleEscapePress: dismiss,
            registerInteractionBlocker: registerInteractionBlocker,
            unregisterInteractionBlocker: unregisterInteractionBlocker,
            redraw: function () {
                if (selectedElement && selectedElement.isConnected) {
                    redrawHighlights();
                }
            },
            onSelectedElementMutated: function (element) {
                if (selectedElement) {
                    const previousKey = componentReorderKey(selectedElement);
                    const hadOverride = componentReorderModes.has(previousKey);
                    const previousMode = componentReorderModes.get(previousKey);
                    selectedElement = element;
                    if (hadOverride) {
                        componentReorderModes.set(componentReorderKey(selectedElement), previousMode);
                    }
                    updateReorderControl();
                }
            },
            handleConfigChange: function (oldConfig, newConfig) {
                const wasDesignMode = !!(oldConfig && oldConfig.designMode);
                const isDesignMode = !!(newConfig && newConfig.designMode);
                parentDesignMode = isDesignMode;
                if (wasDesignMode !== isDesignMode) {
                    componentReorderModes = new Map();
                    componentReorderFallbackKeys = new WeakMap();
                    updateReorderControl();
                    setStatus(isDesignMode ?
                        reorderShortcutInfo.defaultStatus : reorderShortcutInfo.exitStatus, false);
                }
            }
        });
        customReturns["toggleSelectedReorderMode"] = toggleSelectedReorderMode;
        customReturns["updateSelectedReorderShortcut"] = updateSelectedReorderShortcut;
        requestReorderShortcutInfo();
    }

    createXingzhiVisualInspector();

    // the below code comment is replaced by added scripts for extensibility
    // DONT_STRIP_MINIFY:REPLACE_WITH_ADDED_REMOTE_SCRIPTS

    registerHandlers();
    return customReturns;
}
