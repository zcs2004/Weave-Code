define(function (require, exports, module) {
    const AppInit = require("utils/AppInit");
    const CommandManager = require("command/CommandManager");
    const KeyBindingManager = require("command/KeyBindingManager");
    const LiveDevMultiBrowser = require("LiveDevelopment/LiveDevMultiBrowser");
    const LiveDevProtocol = require("LiveDevelopment/MultiBrowserImpl/protocol/LiveDevProtocol");
    const Menus = require("command/Menus");
    const Strings = require("strings");
    const WorkspaceManager = require("view/WorkspaceManager");

    const COMMAND_ID = "view.toggleSelectedDragReorder";
    const DEFAULT_SHORTCUT = "Ctrl-Shift-A";

    function localized(key, fallback) {
        return Strings[key] || fallback;
    }

    function getInspectorStrings() {
        return {
            dynamicNoSource: localized("LIVE_PREVIEW_LAYERS_NOT_IN_SOURCE", "This element is not in the source file"),
            saved: localized("DONE", "Done"),
            imageSource: localized("XINGZHI_VISUAL_IMAGE_SOURCE", "Image source"),
            altText: localized("XINGZHI_VISUAL_ALT_TEXT", "Alternative text"),
            audioSource: localized("XINGZHI_VISUAL_AUDIO_SOURCE", "Audio source"),
            videoSource: localized("XINGZHI_VISUAL_VIDEO_SOURCE", "Video source"),
            poster: localized("XINGZHI_VISUAL_POSTER", "Poster image"),
            mediaSource: localized("XINGZHI_VISUAL_MEDIA_SOURCE", "Media source"),
            responsiveSource: localized("XINGZHI_VISUAL_RESPONSIVE_SOURCE", "Responsive source"),
            mediaType: localized("XINGZHI_VISUAL_MEDIA_TYPE", "Media type"),
            pageAddress: localized("URL", "URL"),
            embeddedResource: localized("XINGZHI_VISUAL_EMBEDDED_RESOURCE", "Embedded resource"),
            objectResource: localized("XINGZHI_VISUAL_OBJECT_RESOURCE", "Object resource"),
            linkAddress: localized("XINGZHI_VISUAL_LINK_ADDRESS", "Link URL"),
            openMode: localized("XINGZHI_VISUAL_OPEN_MODE", "Open mode"),
            link: localized("LIVE_DEV_HB_LINK", "Link"),
            media: localized("XINGZHI_VISUAL_MEDIA", "Media"),
            urlPlaceholder: localized("XINGZHI_VISUAL_URL_PLACEHOLDER", "URL, relative path, or data URI"),
            chooseFile: localized("OPEN_FILE", "Open File"),
            formContent: localized("XINGZHI_VISUAL_FORM_CONTENT", "Form content"),
            textContent: localized("LIVE_DEV_CB_LABEL_CONTENT", "Content"),
            inputValue: localized("LIVE_DEV_ELEMENT_PROPS_ATTR_VALUE", "Value"),
            placeholder: localized("XINGZHI_VISUAL_PLACEHOLDER", "Placeholder"),
            innerHtml: localized("XINGZHI_VISUAL_INNER_HTML", "Inner HTML"),
            text: localized("LIVE_DEV_STYLER_CURSOR_TEXT", "Text"),
            htmlPlaceholder: localized("XINGZHI_VISUAL_HTML_PLACEHOLDER", "Editable text and inner HTML"),
            textPlaceholder: localized("XINGZHI_VISUAL_TEXT_PLACEHOLDER", "Enter component text"),
            dragInstruction: localized("XINGZHI_DRAG_REORDER_HELP", "Drop in the middle to move inside a container, or near an edge to place before or after it."),
            moved: localized("XINGZHI_VISUAL_COMPONENT_MOVED", "Component moved to its new position"),
            fileTooLarge: localized("XINGZHI_VISUAL_FILE_TOO_LARGE", "Files over 15 MB must use a relative project path"),
            readingMedia: localized("XINGZHI_VISUAL_READING_MEDIA", "Reading media…"),
            readMediaFailed: localized("NOT_READABLE_ERR", "The selected media could not be read"),
            componentProperties: localized("LIVE_DEV_ELEMENT_PROPS_TITLE", "Element Properties"),
            close: localized("CLOSE", "Close"),
            layoutPosition: `${localized("LIVE_DEV_STYLER_LAYOUT", "Layout")} · ${localized("LIVE_DEV_STYLER_POSITION", "Position")}`,
            position: localized("LIVE_DEV_STYLER_POSITION", "Position"),
            autoFlow: localized("DEFAULT", "Default"),
            relative: localized("LIVE_DEV_STYLER_RELATIVE", "Relative"),
            absolute: localized("LIVE_DEV_STYLER_ABSOLUTE", "Absolute"),
            fixed: localized("LIVE_DEV_STYLER_FIXED", "Fixed"),
            sticky: localized("LIVE_DEV_STYLER_STICKY", "Sticky"),
            display: localized("LIVE_DEV_STYLER_DISPLAY", "Display"),
            defaultValue: localized("DEFAULT", "Default"),
            hidden: localized("LIVE_DEV_STYLER_HIDDEN", "Hidden"),
            width: localized("LIVE_DEV_STYLER_WIDTH", "Width"),
            height: localized("LIVE_DEV_STYLER_HEIGHT", "Height"),
            appearanceTypography: localized("LIVE_DEV_STYLER_TEXT_STYLE", "Appearance and typography"),
            fontSize: localized("LIVE_DEV_STYLER_SIZE", "Font size"),
            radius: localized("LIVE_DEV_STYLER_RADIUS", "Radius"),
            textColor: localized("LIVE_DEV_STYLER_TEXT_COLOR", "Text color"),
            backgroundColor: localized("LIVE_DEV_STYLER_BACKGROUND", "Background color"),
            alignment: localized("LIVE_DEV_STYLER_ALIGN", "Text alignment"),
            left: localized("LIVE_DEV_STYLER_LEFT", "Left"),
            center: localized("LIVE_DEV_STYLER_CENTER", "Center"),
            right: localized("LIVE_DEV_STYLER_RIGHT", "Right"),
            justify: localized("LIVE_DEV_STYLER_ALIGN_JUSTIFY", "Justify"),
            objectFit: localized("LIVE_DEV_CB_TIP_OBJECT_FIT", "Object Fit"),
            stretch: localized("XINGZHI_VISUAL_FIT_STRETCH", "Stretch"),
            contain: localized("XINGZHI_VISUAL_FIT_CONTAIN", "Contain"),
            cover: localized("XINGZHI_VISUAL_FIT_COVER", "Cover"),
            originalSize: localized("XINGZHI_VISUAL_FIT_ORIGINAL", "Original size"),
            className: localized("LIVE_DEV_ELEMENT_PROPS_CLASS", "Class"),
            title: localized("XINGZHI_VISUAL_TITLE_ATTRIBUTE", "Tooltip"),
            dynamicPreviewOnly: localized("XINGZHI_VISUAL_DYNAMIC_PREVIEW_ONLY", "Dynamic component: changes are preview-only"),
            controls: localized("XINGZHI_VISUAL_CONTROLS", "Controls"),
            autoplay: localized("XINGZHI_VISUAL_AUTOPLAY", "Autoplay"),
            loop: localized("XINGZHI_VISUAL_LOOP", "Loop"),
            muted: localized("XINGZHI_VISUAL_MUTED", "Muted"),
            allowfullscreen: localized("CMD_TOGGLE_FULLSCREEN", "Fullscreen")
        };
    }

    function getShortcutInfo() {
        return {
            shortcut: KeyBindingManager.getKeyBindingsDisplay(COMMAND_ID) || "",
            enableLabel: Strings.XINGZHI_ENABLE_DRAG_REORDER,
            disableLabel: Strings.XINGZHI_END_DRAG_REORDER,
            changeShortcutTitle: Strings.XINGZHI_CHANGE_DRAG_REORDER_SHORTCUT,
            enabledStatus: Strings.XINGZHI_DRAG_REORDER_ENABLED,
            disabledStatus: Strings.XINGZHI_DRAG_REORDER_ENDED,
            sectionLabel: Strings.XINGZHI_COMPONENT_ORDER,
            helpText: Strings.XINGZHI_DRAG_REORDER_HELP,
            defaultStatus: Strings.XINGZHI_DRAG_REORDER_DEFAULT_ENABLED,
            exitStatus: Strings.XINGZHI_DRAG_REORDER_EXITED,
            noTargetStatus: Strings.XINGZHI_DRAG_REORDER_NO_TARGET,
            inspector: getInspectorStrings(),
            designMode: WorkspaceManager.isInDesignMode()
        };
    }

    function evaluateInPreview(expression) {
        const liveDocument = LiveDevMultiBrowser.getCurrentLiveDoc();
        const protocol = liveDocument && liveDocument.protocol;
        if (protocol && protocol.evaluate) {
            return protocol.evaluate(expression);
        }
    }

    function toggleSelectedDragReorder() {
        return evaluateInPreview(
            "_LD.toggleSelectedReorderMode && _LD.toggleSelectedReorderMode()"
        );
    }

    const command = CommandManager.register(
        Strings.XINGZHI_TOGGLE_DRAG_REORDER,
        COMMAND_ID,
        toggleSelectedDragReorder,
        { supportsDesignMode: true }
    );

    // Register the shortcut from the command module as well as keyboard.json.
    // This guarantees that extension commands become part of the key binding
    // manager's default snapshot and known-bindable command list. Consequently,
    // resetting user shortcuts restores this default, while an explicit user
    // removal can leave the command visible in the shortcuts panel without a key.
    KeyBindingManager.addBinding(COMMAND_ID, DEFAULT_SHORTCUT);

    function updateCommandEnabled() {
        if (command) {
            command.setEnabled(true);
        }
    }

    function notifyPreviewOfShortcut() {
        evaluateInPreview(
            `_LD.updateSelectedReorderShortcut && _LD.updateSelectedReorderShortcut(${JSON.stringify(getShortcutInfo())})`
        );
    }

    function showShortcutSelectionDialog() {
        KeyBindingManager.showShortcutSelectionDialog(command);
        return true;
    }

    LiveDevProtocol.registerWeaveFn(
        "Xingzhi.getDragReorderShortcutInfo",
        getShortcutInfo
    );
    LiveDevProtocol.registerWeaveFn(
        "Xingzhi.changeDragReorderShortcut",
        showShortcutSelectionDialog
    );

    WorkspaceManager.on(
        WorkspaceManager.EVENT_WORKSPACE_DESIGN_MODE_CHANGE,
        function () {
            updateCommandEnabled();
            notifyPreviewOfShortcut();
        }
    );
    KeyBindingManager.on(
        KeyBindingManager.EVENT_KEY_BINDING_ADDED,
        notifyPreviewOfShortcut
    );
    KeyBindingManager.on(
        KeyBindingManager.EVENT_KEY_BINDING_REMOVED,
        notifyPreviewOfShortcut
    );

    updateCommandEnabled();
    AppInit.appReady(function () {
        const viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (viewMenu) {
            // Menu commands are included by the existing Tools > Keyboard Shortcuts panel.
            viewMenu.addMenuItem(COMMAND_ID, "", Menus.LAST);
        }
        updateCommandEnabled();
        notifyPreviewOfShortcut();
    });

    exports.COMMAND_ID = COMMAND_ID;
});
