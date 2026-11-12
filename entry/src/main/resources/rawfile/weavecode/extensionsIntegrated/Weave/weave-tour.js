define(function (require, exports, module) {
    "use strict";

    // Weave Code intentionally does not show a first-run product tour.
    // Keep the exported API so the surrounding startup module remains compatible.
    function startTour() {}

    exports.startTour = startTour;
});
