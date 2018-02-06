/* eslint-disable no-console */
/* eslint-disable no-prototype-builtins */

// export const setUpPerf = function () {
//   window.Perf = require("react-addons-perf");
//   window.Perf.counter = -1;
//   window.Perf.show = function () {
//     const measurements = window.Perf.getLastMeasurements();
//     console.log("REACT PERFORMANCE INFO");
//     // console.log("inclusive times");
//     // window.Perf.printInclusive(measurements);
//     console.log("exclusive times");
//     window.Perf.printExclusive(measurements);
//   }
//   window.Perf.bump = function () {
//     window.Perf.counter += 1;
//     if (window.Perf.counter === 0) {
//       window.Perf.start();
//     }
//     if (window.Perf.counter === 1) {
//       /* display a single tick */
//       console.log("Performance for a single animation tick:");
//       window.Perf.show();
//     }
//     if (window.Perf.counter === 50) {
//       console.log("Performance for 50 animation ticks:");
//       window.Perf.show();
//       window.Perf.stop();
//     }
//   };
//   window.Perf.resetCount = function () {
//     window.Perf.counter = -1;
//   };
// };

const dbsingle = {};

/* array format = [start time (or false), numIter, totalTime] */


const startTwiceError = (name) => {
  console.error("Race condition bug! Perf. timer", name, "started when it was already running.");
};
const endBeforeStartError = (name) => {
  console.error("Race condition bug! Perf. timer", name, "finished before it was started.");
};

export const timerStart = (name) => {
  if (!dbsingle.hasOwnProperty(name)) {
    dbsingle[name] = [false, 0, 0];
  }
  if (dbsingle[name][0] !== false) {
    startTwiceError(name); return;
  }
  dbsingle[name][0] = performance.now();
};

export const timerEnd = (name) => {
  if (dbsingle.hasOwnProperty(name) && dbsingle[name][0] !== false) {
    const thisTook = parseInt(performance.now() - dbsingle[name][0], 10);
    dbsingle[name][0] = false;
    dbsingle[name][1]++;
    dbsingle[name][2] += thisTook;
    const msg = `Timer ${name} (#${dbsingle[name][1]}) took ${thisTook}ms. Average: ${parseInt(dbsingle[name][2] / dbsingle[name][1], 10)}ms.`;
    if (thisTook > 20) {
      console.warn(msg);
    } else {
      console.log(msg);
    }
  } else {
    endBeforeStartError(name);
  }
};
