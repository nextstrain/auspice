
export const setUpPerf = function () {
  window.Perf = require("react-addons-perf");
  window.Perf.counter = -1;
  window.Perf.show = function () {
    const measurements = window.Perf.getLastMeasurements();
    console.log("REACT PERFORMANCE INFO");
    // console.log("inclusive times");
    // window.Perf.printInclusive(measurements);
    console.log("exclusive times");
    window.Perf.printExclusive(measurements);
  }
  window.Perf.bump = function () {
    window.Perf.counter += 1;
    if (window.Perf.counter === 0) {
      window.Perf.start();
    }
    if (window.Perf.counter === 1) {
      /* display a single tick */
      console.log("Performance for a single animation tick:");
      window.Perf.show();
    }
    if (window.Perf.counter === 50) {
      console.log("Performance for 50 animation ticks:");
      window.Perf.show();
      window.Perf.stop();
    }
  };
  window.Perf.resetCount = function () {
    window.Perf.counter = -1;
  };
};
