import React, { useState } from "react";
import { useDispatch } from "react-redux"
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { LegendValues } from "../../reducers/controls";
import Flex from "../framework/flex";
import { ColorScale } from "../../reducers/controls";
import { updateMetadata } from "../../actions/updateMetadata/updateMetadata";
import { NewMetadata } from "../../actions/updateMetadata/updateMetadata.types";
import { getBrighterColorHex, getDarkerColorHex } from "../../util/colorHelpers";
import { ColorByEditorForm } from "./styles";

export default function ColorByEditor({
  dismissModal
}: {
  dismissModal: () => void
}): JSX.Element {
  const { t } = useTranslation();
  const dispatch: AppDispatch = useDispatch();
  const colorScale: ColorScale = useSelector((state: RootState) => state.controls.colorScale);
  const coloring = useSelector((state: RootState) => {
    if (!state.metadata.loaded) throw new Error("[INTERNAL ERROR] metadata state not loaded");
    return state.metadata.colorings[colorScale.colorBy];
  });

  function handleSubmit(e: React.SyntheticEvent): void {
    e.preventDefault();
    const newScale: [string, string][] = colorScale.legendValues.map((val) => [
      val, e.target[val].dataset.color
    ]);

    const newMetadata: NewMetadata = {
      edited: true,
      attributes: {
        [colorScale.colorBy]: {
          key: colorScale.colorBy,
          name: coloring?.title,
          scaleType: coloring?.type,
          strains: {},
          colors: newScale,
        }
      }
    }

    dispatch(updateMetadata(newMetadata, true, false));
    dismissModal();
  }

  return (
    <ColorByEditorForm onSubmit={handleSubmit}>
      <h2>
        {t("Edit colors for")} {colorScale.colorBy}
      </h2>
      <ColorInputs
        legendValues={colorScale.legendValues}
        scale={colorScale.scale}
      />
      <Flex justifyContent="center">
        <button type="submit" style={{ margin: 10 }}>
          {t("Apply changes")}
        </button>
        <button type="button" style={{ margin: 10 }} onClick={dismissModal}>
          {t("Discard changes")}
        </button>
      </Flex>
    </ColorByEditorForm>
  );
}

export const colorByEditorStyles = {
  container: (s: React.CSSProperties): React.CSSProperties => {
    s.backgroundColor = "rgba(0, 0, 0, .30)";
    return s
  },
  panel: (s: React.CSSProperties): React.CSSProperties => {
    s.padding = "2em";
    s.color = "#1f2328";
    s.backgroundColor = "#ffffff";
    return s
  }
};

function ColorInputs({
  legendValues,
  scale
}: {
  legendValues: LegendValues,
  scale: (value: any) => string
}): JSX.Element {
  // hardcoded to 2 columns to match legend display
  const maxNumPerColumn = Math.ceil(legendValues.length/2);
  const values = legendValues.slice(0, maxNumPerColumn);
  const values2 = legendValues.slice(maxNumPerColumn);

  /**
   * The color input value is set to the internally calculated brighter
   * color to match the legend swatch. The border color is set to the
   * darker color and saved as a data attribute so that it can be saved as
   * the main color in the Redux state.
   */
  function ColorInput(val: any): JSX.Element {
    const [color, setColor] = useState(getBrighterColorHex(scale(val)));
    const borderColor = getDarkerColorHex(color);
    const id = `color-${val}`;
    return (
      <div key={val} className="row" style={{ margin: "5px" }}>
        <div className="col-xs-12">
          <Flex justifyContent="flex-start" alignContent="center">
            <input
              name={val}
              id={id}
              type="color"
              style={{ borderColor }}
              value={color}
              data-color={borderColor}
              onChange={(e): void => setColor(e.target.value)}
            />
            <label htmlFor={id}>
              {val}
            </label>
          </Flex>
        </div>
      </div>
    )
  }

  return (
    <div className="row">
      <div className="col-xs-6">
        {values.map((val) => ColorInput(val))}
      </div>
      <div className="col-xs-6">
        {values2.map((val) => ColorInput(val))}
      </div>
    </div>
  )
}
