// Shared runtime bridge between the web page (Index) and the ability lifecycle
// (EntryAbility). The page reports whether the editor has unsaved changes; the
// ability uses that flag in onPrepareToTerminate to decide whether to confirm
// before closing, and can ask the page to flush pending work before exiting.
export class UnsavedStateStore {
  private static hasUnsaved: boolean = false;
  private static saveHandler?: () => Promise<void> = undefined;
  private static closeHandler?: () => Promise<void> = undefined;
  private static terminationHandler?: (shouldExit: boolean) => void = undefined;

  static setDirty(dirty: boolean): void {
    UnsavedStateStore.hasUnsaved = dirty;
  }

  static isDirty(): boolean {
    return UnsavedStateStore.hasUnsaved;
  }

  static setSaveHandler(handler: () => Promise<void>): void {
    UnsavedStateStore.saveHandler = handler;
  }

  static setCloseHandler(handler: () => Promise<void>): void {
    UnsavedStateStore.closeHandler = handler;
  }

  static setTerminationHandler(handler: (shouldExit: boolean) => void): void {
    UnsavedStateStore.terminationHandler = handler;
  }

  static completeClose(shouldExit: boolean): void {
    UnsavedStateStore.terminationHandler?.(shouldExit);
  }

  static async requestClose(): Promise<boolean> {
    if (UnsavedStateStore.closeHandler === undefined) {
      return false;
    }
    try {
      await UnsavedStateStore.closeHandler();
      return true;
    } catch (error) {
      return false;
    }
  }

  static async requestSave(): Promise<boolean> {
    if (UnsavedStateStore.saveHandler === undefined) {
      return false;
    }
    try {
      await UnsavedStateStore.saveHandler();
      return true;
    } catch (error) {
      return false;
    }
  }
}
