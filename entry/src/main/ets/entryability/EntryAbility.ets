import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { UnsavedStateStore } from '../common/UnsavedStateStore';

const DOMAIN = 0x0000;
export default class EntryAbility extends UIAbility {
  private closeRequestInProgress: boolean = false;
  private exitApproved: boolean = false;

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_DARK);
    } catch (err) {
      hilog.error(DOMAIN, 'testTag', 'Failed to set colorMode. Cause: %{public}s', JSON.stringify(err));
    }
    UnsavedStateStore.setTerminationHandler((shouldExit: boolean): void => {
      this.closeRequestInProgress = false;
      if (!shouldExit) {
        hilog.info(DOMAIN, 'testTag', 'Application close cancelled in Weave');
        return;
      }
      this.exitApproved = true;
      this.context.terminateSelf().catch((error: Error) => {
        hilog.error(DOMAIN, 'testTag', 'Unable to terminate application: %{public}s', String(error));
      });
    });
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onCreate');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(DOMAIN, 'testTag', 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    // Ability has brought to foreground
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onBackground');
  }

  onPrepareToTerminate(): boolean {
    hilog.info(DOMAIN, 'testTag', 'Ability onPrepareToTerminate, dirty=%{public}s', String(UnsavedStateStore.isDirty()));
    if (this.exitApproved) {
      return false;
    }
    if (this.closeRequestInProgress) {
      return true;
    }
    // Always route termination through Weave, even for a clean project. This
    // gives ProjectManager a chance to unwatch the directory, persist the
    // working set and release its file-system session before the process dies.
    this.closeRequestInProgress = true;
    UnsavedStateStore.requestClose().then((started: boolean): void => {
      if (!started) {
        this.closeRequestInProgress = false;
        hilog.error(DOMAIN, 'testTag', 'Weave close flow was unavailable; termination remains blocked');
      }
    });
    return true;
  }
}
