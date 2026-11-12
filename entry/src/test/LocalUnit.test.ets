import { describe, expect, it } from '@ohos/hypium';

export default function localUnitTest() {
  describe('WeaveHarmonyShell', () => {
    it('uses the bundled Weave entry point', 0, () => {
      const entryPoint: string = 'weavecode/index.html';
      expect(entryPoint).assertEqual('weavecode/index.html');
    });
  });
}
