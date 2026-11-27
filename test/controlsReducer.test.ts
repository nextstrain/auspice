/** @jest-environment jsdom */
import Controls, { getDefaultControlsState, type ControlsState } from "../src/reducers/controls";
import { CHANGE_LAYOUT } from "../src/actions/types";

describe("Controls reducer CHANGE_LAYOUT temporalConfidence display", () => {
  const baseState = (): ControlsState => ({
    ...getDefaultControlsState(),
    layout: "rect" as const,
    distanceMeasure: "num_date",
    temporalConfidence: { exists: true, display: true, on: true },
  });

  test("restores temporalConfidence.display when returning to rect layout", () => {
    const clockState = Controls(baseState(), {
      type: CHANGE_LAYOUT,
      layout: "clock",
      canRenderBranchLabels: false,
      scatterVariables: {},
    });
    expect(clockState.layout).toBe("clock");
    expect(clockState.temporalConfidence).toEqual({
      exists: true,
      display: false,
      on: false,
    });

    const rectState = Controls(clockState, {
      type: CHANGE_LAYOUT,
      layout: "rect",
      canRenderBranchLabels: true,
      scatterVariables: {},
    });
    expect(rectState.layout).toBe("rect");
    expect(rectState.temporalConfidence).toEqual({
      exists: true,
      display: true,
      on: false,
    });
  });

  test("keeps temporalConfidence.display false when distanceMeasure is div or confidence does not exist", () => {
    const divState = Controls(
      { ...baseState(), distanceMeasure: "div", layout: "clock" },
      {
        type: CHANGE_LAYOUT,
        layout: "rect",
        canRenderBranchLabels: true,
        scatterVariables: {},
      }
    );
    expect(divState.temporalConfidence.display).toBe(false);

    const noConfidenceState = Controls(
      {
        ...baseState(),
        layout: "clock",
        temporalConfidence: { exists: false, display: false, on: false },
      },
      {
        type: CHANGE_LAYOUT,
        layout: "rect",
        canRenderBranchLabels: true,
        scatterVariables: {},
      }
    );
    expect(noConfidenceState.temporalConfidence.display).toBe(false);
  });
});
