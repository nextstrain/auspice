import React from "react";
import { connect, MapStateToProps } from "react-redux";
import { rgb } from "d3-color";
import LegendItem from "./item";
import Demes from "./demes";
import { Title, Chevron } from "./title";
import { months } from "../../util/globals";
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
/** width (px) of the legend when open (fits two columns of swatches) */
const LEGEND_WIDTH = 290;
/** vertical space (px) occupied by a single row of swatches */
const SWATCH_ROW_HEIGHT = ITEM_RECT_SIZE + LEGEND_SPACING;
/** padding (px) above the first row of swatches within the swatch SVG */
const SWATCH_TOP_PADDING = LEGEND_SPACING;

export const BACKGROUND_FILL = 'rgba(255, 255, 255, .85)';

/**
 * The swatches are rendered within a scrollable container whose height is
 * capped at the smaller of these two values so that a legend with many
 * swatches never grows taller than (roughly half of) the panel it sits in.
 */
const MAX_SWATCH_HEIGHT_FRACTION_OF_PANEL = 0.667;
const MAX_SWATCH_HEIGHT_PX = 500; 

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
  /** The available height (px) of the entire panel the legend is rendered within */
  height: number;
  legendPlacement: LegendPlacement;
  maxDemeCount?: number;
  demeRadiusFn?: (count: number) => number;
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
   * Compute the swatch heights (px). `fullHeight` is the height required to
   * render every swatch. When this exceeds the space we want to use
   * then we use a smaller `displayHeight` and make the swatches scrollable.
   */
  getSVGSwatchHeight(show: boolean): { fullHeight: number, displayedHeight: number, scrollable: boolean } {
    if (!show) {
      return { fullHeight: 0, displayedHeight: 0, scrollable: false };
    }
    
    const nItems = this.props.colorScale.visibleLegendValues.length;
    const nRows = Math.ceil(nItems / 2); // hardcoded to 2 columns
    const fullHeight = SWATCH_TOP_PADDING + nRows * SWATCH_ROW_HEIGHT + LEGEND_SPACING || 100;
    
    const maxDisplayHeight = Math.min(
      this.props.height * MAX_SWATCH_HEIGHT_FRACTION_OF_PANEL,
      MAX_SWATCH_HEIGHT_PX
    );
    
    if (fullHeight <= maxDisplayHeight) {
      return { fullHeight, displayedHeight: fullHeight, scrollable: false };
    }

    /** Adjust the displayedHeight so that it doesn't cut off swatches in the middle.
     * This leaves the top-border of the remaining swatches in view as a UI hint that
     * there are more available *
     */
    const rowsToShow = Math.max(1, Math.floor((maxDisplayHeight - SWATCH_TOP_PADDING) / SWATCH_ROW_HEIGHT));
    const displayedHeight = SWATCH_TOP_PADDING + rowsToShow * SWATCH_ROW_HEIGHT;
    return { fullHeight, displayedHeight, scrollable: true };
  }

  getTransformationForLegendItem(maxNumPerColumn: number, itemIdx: number): string {
    const colIdx = Math.floor(itemIdx/maxNumPerColumn);
    const colPos = colIdx * COLUMN_WIDTH + 10;
    const rowIdx = (itemIdx % maxNumPerColumn); // hardcoded for 2 rows
    const rowPos = rowIdx * SWATCH_ROW_HEIGHT;
    return `translate(${colPos},${rowPos})`;
  }

  toggleLegend(): void {
    this.props.dispatch({type: TOGGLE_LEGEND, value: !this.props.legendOpen});
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
    { height }: { height: number }
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
        <g id="Items">
          {items}
        </g>
      </g>
    );
  }

  getContainerStyles(): React.CSSProperties {
    const styles: React.CSSProperties = {
      position: "absolute",
      borderRadius: 4,
      overflow: "hidden", // keeps the rounded corners over the (square) child SVGs
      zIndex: 1000,
      userSelect: "none"
    };
    // vertical = top or bottom, horizontal = left or right
    const { vertical, horizontal } =  this.props.legendPlacement;
    styles[vertical] = 26;
    styles[horizontal] = 5;
    return styles;
  }

  override render(): JSX.Element | null {
    // catch the case where we try to render before anything's ready
    if (!this.props.colorScale) return null;
    const show = this.showLegend();
    const alignRight = this.props.legendPlacement.horizontal === "right";

    // The full height needed to draw every swatch, and the (potentially smaller)
    // height we actually display. When `scrollable`, the swatches overflow the
    // displayed height and are reachable by scrolling.
    const swatchHeights = this.getSVGSwatchHeight(show);

    const showDemes = show && this.props.maxDemeCount !== undefined && this.props.demeRadiusFn !== undefined;
    const demesHeight = 150; // TODO XXX

    return (
      <div id="LegendContainer" style={this.getContainerStyles()}>
        {/* The title & chevron remain fixed above the (potentially scrollable) swatches */}
        <div
          id="TitleAndChevron"
          onClick={() => this.toggleLegend()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            justifyContent: alignRight ? "flex-end" : "flex-start",
            padding: "4px 10px",
            backgroundColor: BACKGROUND_FILL,
            cursor: "pointer",
          }}
        >
          <Title text={getColorByTitle(this.props.colorings, this.props.colorBy)} />
          <Chevron open={show} />
        </div>

        {/* color-by swatches */}
        {show &&
          <div style={{maxHeight: swatchHeights.displayedHeight, overflowY: swatchHeights.scrollable ? "auto" : "hidden", overflowX: "hidden"}}>
            <svg width={LEGEND_WIDTH} height={swatchHeights.fullHeight} style={{ display: "block" }}>
              <Background width={LEGEND_WIDTH} height={swatchHeights.fullHeight} />
              {this.legendItems({ height: swatchHeights.fullHeight})}
            </svg>
          </div>
        }

        {/* map deme circles */}
        {showDemes && <>
          <div
            style={{
              display: "flex",
              justifyContent: alignRight ? "flex-end" : "flex-start",
              padding: "4px 10px",
              backgroundColor: BACKGROUND_FILL,
            }}
          >
            <Title text="Deme (circle) tip count" />
          </div>
          <Demes
            availableHeight={demesHeight}
            availableWidth={LEGEND_WIDTH}
            maxDemeCount={this.props.maxDemeCount}
            demeRadiusFn={this.props.demeRadiusFn}
          />
        </>}

      </div>
    );
  }
}

export function Background({ width, height }: { width: number, height: number }): JSX.Element {
  return (
    <rect width={width} height={height} fill={BACKGROUND_FILL} />
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
