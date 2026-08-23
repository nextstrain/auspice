/**
 * Parse and collect Auspice's `src/util/perf.js` console timer output.
 *
 * perf.js prints one line per timerEnd():
 *   `Timer {name} (#{n}) took {X}ms. Average: {Y}ms.`
 * via console.warn when the call took >20ms, else console.log. We must therefore
 * accept BOTH Playwright console message types 'log' and 'warning' — dropping
 * 'warning' would silently discard every slow (interesting) span.
 *
 * We record the per-call `took` value (per-interaction). The reported `Average`
 * is a cumulative session mean held in perf.js's module-scoped `dbsingle`, so it
 * is NOT per-interaction and is deliberately ignored.
 */

export const TIMER_RE = /^Timer (.+?) \(#(\d+)\) took (\d+)ms\. Average: (\d+)ms\.$/;

export function parseTimerLine(text) {
  const m = TIMER_RE.exec(text);
  if (!m) return null;
  return { name: m[1], callIndex: Number(m[2]), took: Number(m[3]), avg: Number(m[4]) };
}

export class TimerCollector {
  constructor() {
    this.samples = [];       // { marker, name, took, callIndex }
    this.marker = null;      // label of the interaction currently in flight
    this._waiters = [];      // one-shot resolvers keyed by span name
  }

  attach(page) {
    page.on("console", (msg) => {
      const type = msg.type();
      if (type !== "log" && type !== "warning") return;
      const parsed = parseTimerLine(msg.text());
      if (!parsed) return;
      this.samples.push({
        marker: this.marker,
        name: parsed.name,
        took: parsed.took,
        callIndex: parsed.callIndex,
      });
      this._notify(parsed);
    });
  }

  setMarker(marker) {
    this.marker = marker;
  }

  hadAnyTimer() {
    return this.samples.length > 0;
  }

  /** All collected samples (marker-tagged). */
  all() {
    return this.samples;
  }

  _notify(parsed) {
    if (this._waiters.length === 0) return;
    const remaining = [];
    for (const w of this._waiters) {
      if (w.name === parsed.name) w.resolve(true);
      else remaining.push(w);
    }
    this._waiters = remaining;
  }

  /**
   * Resolve when the NEXT console line for `name` arrives (after this call),
   * or `false` on timeout. Used as an interaction-settled signal, e.g. wait for
   * the "phyloTree render()" or "phylotree.change()" line that ends a render.
   */
  waitForSpan(name, timeoutMs) {
    return new Promise((resolve) => {
      const waiter = { name, resolve };
      this._waiters.push(waiter);
      setTimeout(() => {
        this._waiters = this._waiters.filter((w) => w !== waiter);
        resolve(false);
      }, timeoutMs);
    });
  }
}
