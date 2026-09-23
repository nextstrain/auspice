import React from "react";
import { connect, MapStateToProps } from "react-redux";
import { rgb } from "d3-color";
import LegendItem from "./item";
import { headerFont, darkGrey } from "../../globalStyles";
import { fastTransitionDuration, months } from "../../util/globals";
import { getBrighterColor, getColorByTitle } from "../../util/colorHelpers";
import { formatBounds } from "../../util/colorScale";
import { numericToCalendar } from "../../util/dateHelpers";
import { TOGGLE_LEGEND } from "../../actions/types";
import { SET_MODAL } from "../../actions/types";
import { warningNotification } from "../../actions/notifications";
import { isColorByGenotype } from "../../util/getGenotype";
import { enableDatasetEditor } from "../datasetEditor/datasetEditor";
import type { ColorScale } from "../../reducers/controls";
import type { Colorings, LegendPlacement } from "../../reducers/metadata.types";
import type { RootState, AppDispatch } from "../../store";

const ITEM_RECT_SIZE = 15;
const LEGEND_SPACING = 4;
const COLUMN_WIDTH = 145;

/** StateProps are those supplied via react-redux's connect */
interface StateProps {
  colorBy: string;
  colorings: Colorings;
  colorScale: ColorScale;
  legendOpen: boolean | undefined;
}

/** SuppliedProps are those supplied via the calling component */
interface SuppliedProps {
  width: number;
  legendPlacement: LegendPlacement;
}

interface DispatchProps {
  dispatch: AppDispatch;
}

class Legend extends React.Component<StateProps & DispatchProps & SuppliedProps> {
  constructor(props: StateProps & DispatchProps & SuppliedProps) {
    super(props);
    this.handleLegendItemOnClick = this.handleLegendItemOnClick.bind(this);
  }

  showLegend(): boolean {
    // redux state takes precedent
    if (this.props.legendOpen !== undefined) { return this.props.legendOpen; }

    // Our default state changes based on the size of the window or the number of items in the legend.
    if (this.props.width < 600 || this.props.colorScale.visibleLegendValues.length > 32) {
      return false;
    }
    return true;
  }

  /**
   * NOTE: There's a well known bug / problem where we have so many swatches that
   * the calculated legend height is greater than the panel height. This should be
   * solved by reducing the number of swatches and showing some "..." UI
   */
  getSVGSwatchHeight(): number {
    const nItems = this.props.colorScale.visibleLegendValues.length;
    const titlePadding = 20;
    return Math.ceil(nItems / 2) *
      (ITEM_RECT_SIZE + LEGEND_SPACING) + LEGEND_SPACING + titlePadding || 100;
  }

  getSVGWidth(): number {
    if (this.showLegend()) {
      return 290;
    }
    return this.getTitleWidth() + 20;
  }

  getTransformationForLegendItem(maxNumPerColumn: number, itemIdx: number): string {
    const colIdx = Math.floor(itemIdx/maxNumPerColumn);
    const colPos = colIdx * COLUMN_WIDTH + 10;
    const rowIdx = (itemIdx % maxNumPerColumn); // hardcoded for 2 rows
    const rowPos = rowIdx * (ITEM_RECT_SIZE + LEGEND_SPACING);
    return `translate(${colPos},${rowPos})`;
  }

  getTitleWidth(): number {
    // This is a hack because we can't use getBBox in React.
    // Lots of work to get measured width of DOM element.
    // Works fine, but will need adjusting if title font is changed.
    return 15 + 5.3 * getColorByTitle(this.props.colorings, this.props.colorBy).length;
  }

  toggleLegend(): void {
    this.props.dispatch({type: TOGGLE_LEGEND, value: !this.props.legendOpen});
  }

  /*
   * draws legend title
   * coordinate system from top,left of parent SVG
   */
  legendTitle(): JSX.Element {
    return (
      <g id="Title">
        <rect width={this.getTitleWidth()} height="12" fill="rgba(255,255,255,.85)"/>
        <text
          x={this.getTitleOffset()}
          y={10}
          style={{
            fontSize: 12,
            fill: darkGrey,
            fontFamily: headerFont,
            backgroundColor: "#fff"
          }}
        >
          {getColorByTitle(this.props.colorings, this.props.colorBy)}
        </text>
      </g>
    );
  }

  /*
   * draws show/hide chevron
   * coordinate system from top,left of parent SVG
   */
  legendChevron(): JSX.Element {
    const degrees = this.showLegend() ? -180 : 0;

    const offset = this.getArrowOffset();
    return (
      <g id="Chevron" transform={`translate(${offset},0)`}>
        <svg width="12" height="12" viewBox="0 0 1792 1792">
          <rect width="1792" height="1792" fill="rgba(255,255,255,.85)"/>
          <path
            fill={darkGrey}
            style={{
              transform: `rotate(${degrees}deg)`,
              transformOrigin: "50% 50%",
              transition: `${fastTransitionDuration}ms ease-in-out`
            }}
            d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"
          />
        </svg>
      </g>
    );
  }

  styleLabelText(label: any): any {
    if (this.props.colorScale.legendLabels && this.props.colorScale.legendLabels.has(label)) {
      return this.props.colorScale.legendLabels.get(label);
    }
    /* depending on the colorBy, we display different labels! */
    if (this.props.colorBy === "num_date" || this.props.colorScale.scaleType==="temporal") {
      const legendValues = this.props.colorScale.visibleLegendValues;
      if (
        (legendValues[legendValues.length-1] - legendValues[0] > 10) && /* range spans more than 10 years */
        (legendValues[legendValues.length-1] - parseInt(label, 10) >= 10) /* current label (value) is more than 10 years from the most recent */
      ) {
        return parseInt(label, 10);
      }
      const [yyyy, mm, _dd] = numericToCalendar(label).split('-');
      return `${months[mm]} ${yyyy}`;
    }
    return label;
  }

  handleLegendItemOnClick(e: React.MouseEvent): void {
    if (!enableDatasetEditor()) return;

    if (e.shiftKey) {
      // We do not support editing Genotype colors because we do not keep nuc/aa colors in Redux state.
      if (isColorByGenotype(this.props.colorBy)) {
        this.props.dispatch(warningNotification({
          message: "Genotype color editing is not currently supported",
          autoClose: true
        }))
      } else {
        this.props.dispatch({ type: SET_MODAL, modal: "colorByEditor" });
      }
    }
  }

  /*
   * draws rects and titles for each legend item
   * coordinate system from top,left of parent SVG
   */
  legendItems(
    { height, verticalOffset }: { height: number, verticalOffset: number }
  ): JSX.Element {
    const values = this.props.colorScale.visibleLegendValues;
    const maxNumPerColumn = Math.ceil(values.length/2); // hardcoded to 2 columns
    const items = values
      .filter((d) => d !== undefined)
      .map((d, i) => {
        return (
          <LegendItem
            dispatch={this.props.dispatch}
            legendRectSize={ITEM_RECT_SIZE}
            legendSpacing={LEGEND_SPACING}
            rectFill={getBrighterColor(this.props.colorScale.scale(d))}
            rectStroke={rgb(this.props.colorScale.scale(d)).toString()}
            transform={this.getTransformationForLegendItem(maxNumPerColumn, i)}
            key={this.props.colorScale.colorBy+d+i /* eslint-disable-line react/no-array-index-key */}
            value={d}
            label={this.styleLabelText(d)}
            index={i}
            tooltip={tooltipText(this.props.colorScale, d)}
            clipId={i<maxNumPerColumn ? "legendFirstColumnClip" : undefined}
            handleOnClick={this.handleLegendItemOnClick}
          />
        );
      });
    // This gives the nice looking show/hide animation. Should restore while maintaining
    // legend collapse functionality.
    // <g style={{
    //   opacity: opacity,
    //   transform: `translate(0, ${offset}px)`,
    //   transition: `${fastTransitionDuration}ms ease-in-out`
    //   }}>
    return (
      <g id="ItemsContainer" height={height}>
        <clipPath id="legendFirstColumnClip">
          <rect x="0" y="0" width={COLUMN_WIDTH-5} height={height} fill="rgb(150, 154, 223)"/>
        </clipPath>
        <g id="Items" transform={`translate(0,${verticalOffset})`}>
          {items}
        </g>
      </g>
    );
  }
  getContainerStyles(): React.CSSProperties {
    const styles: React.CSSProperties = {
      position: "absolute",
      borderRadius: 4,
      zIndex: 1000,
      userSelect: "none"
    };
    // vertical = top or bottom, horizontal = left or right
    const { vertical, horizontal } =  this.props.legendPlacement;
    styles[vertical] = 26;
    styles[horizontal] = 5;
    return styles;
  }

  getArrowOffset(): number {
    if (this.props.legendPlacement.horizontal === "right") {
      return this.getSVGWidth() - 20;
    }
    return this.getTitleWidth();
  }

  getTitleOffset(): number {
    if (this.props.legendPlacement.horizontal === "right") {
      return this.getSVGWidth() - this.getTitleWidth() - 15;
    }
    return 5;
  }
  
  override render(): JSX.Element | null {
    // catch the case where we try to render before anything's ready
    if (!this.props.colorScale) return null;

    const show = this.showLegend();
    const titleHeight = show ? 20 : 18; // closed title is 18px vs open title 20px
    const swatchHeight = show ? this.getSVGSwatchHeight() : 0;
    const width = this.getSVGWidth();
    
    return (
      <svg
        id="TreeLegendContainer"
        width={width}
        height={titleHeight + swatchHeight}
        style={this.getContainerStyles()}
      >
        <Background width={width} height={titleHeight + swatchHeight} />
        <g
          id="TitleAndChevron"
          onClick={() => this.toggleLegend()}
          style={{cursor: "pointer", textAlign: "right" }}
        >
          {this.legendTitle()}
          {this.legendChevron()}
        </g>
        {show && this.legendItems({ height: swatchHeight, verticalOffset: titleHeight})}
      </svg>
    );
  }
}

function Background({ width, height }: { width: number, height: number }): JSX.Element {
  return (
    <rect width={width} height={height} fill="rgba(255,255,255,.85)"/>
  )
}

/**
 * Create the text to be shown as a tooltip on the legend entry
 */
function tooltipText(colorScale: ColorScale, value: any): any {
  if (!colorScale.continuous) {
    return value
  }

  const bounds = colorScale.legendBounds[value];
  const temporal = colorScale.colorBy==='num_date';

  return `Bounds: ${formatBounds(bounds, temporal)}`;
}


const mapStateToProps: MapStateToProps<StateProps, SuppliedProps, RootState> = (
  state: RootState,
): StateProps => ({
  colorBy: state.controls.colorBy,
  colorings: state.metadata.loaded ? state.metadata.colorings : undefined,
  colorScale: state.controls.colorScale,
  legendOpen: state.controls.legendOpen,
});

export default connect(mapStateToProps)(Legend);
