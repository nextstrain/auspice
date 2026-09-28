import React, { useLayoutEffect, useReducer, useRef } from "react";
import { List } from "react-virtualized/dist/es/List";
import { CellMeasurer, CellMeasurerCache } from "react-virtualized/dist/es/CellMeasurer";
import { isEqual } from "lodash";
import { controlsWidth } from "../../util/globals";

const DEFAULT_ROW_HEIGHT = 40;
const getOptionKeys = (options) => options.map((option) => option.key);

/**
 * A virtualized list expected to be used to replace the MenuList
 * component in `react-select`
 */
const VirtualizedMenuList = ({ children, maxHeight, focusedOption }) => {
  const listRef = useRef(null);
  const options = useRef(null);
  const cache = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: DEFAULT_ROW_HEIGHT
    })
  );
  const [, rerender] = useReducer((count) => count + 1, 0);

  /**
   * If the focused option is outside of the currently displayed options, we
   * need to create the scrollToIndex so that the List can be forced to scroll
   * to display the focused option.
   */
  let scrollToIndex;
  if (children instanceof Array) {
    const focusedOptionIndex = children.findIndex((option) => (
      isEqual(focusedOption, option.props.data)
    ));
    if (focusedOptionIndex >= 0) {
      scrollToIndex = focusedOptionIndex;
    }
  }

  /**
   * When the children options have changed, the cache has to be manually cleared
   * and the list has to recompute the row heights to correctly display the
   * new options.
   * See answer from react-virtualized maintainer @bvaughn at
   * https://stackoverflow.com/a/43837929
   */
  useLayoutEffect(() => {
    const newOptions = children instanceof Array ? getOptionKeys(children) : children;
    if (!isEqual(options.current, newOptions)) {
      cache.current.clearAll();
      listRef.current.recomputeRowHeights();
      options.current = newOptions;
    }
  }, [children]);

  /**
   * Wraps each option in a CellMeasurer which measures the row height based
   * on the contents of the option and passes this height to the parent List
   * component via the cache
   */
  const rowRenderer = ({ index, key, parent, style }) => (
    <CellMeasurer
      cache={cache.current}
      columnIndex={0}
      key={key}
      parent={parent}
      rowIndex={index}
    >
      <div style={style}>
        {children instanceof Array ? children[index] : children}
      </div>
    </CellMeasurer>

  );

  /**
   * The list height is the sum of the measured row heights, up to maxHeight.
   * Rows that have not been measured yet do not count.
   */
  const calcListHeight = () => {
    const currentRowHeights = Object.values(cache.current._rowHeightCache);
    const totalRowHeight = currentRowHeights.reduce((a, b) => a + b, 0);
    return totalRowHeight === 0 ? maxHeight : Math.min(maxHeight, totalRowHeight);
  };
  const listHeight = calcListHeight();

  /**
   * The rows are measured after this component has rendered, so render again
   * whenever the measured height differs from the height rendered with.
   */
  useLayoutEffect(() => {
    if (calcListHeight() !== listHeight) rerender();
  });

  return (
    <List
      ref={listRef}
      height={listHeight}
      deferredMeasurementCache={cache.current}
      rowHeight={cache.current.rowHeight}
      rowRenderer={rowRenderer}
      rowCount={children.length || 1}
      width={controlsWidth}
      scrollToIndex={scrollToIndex}
    />
  );
};

export default VirtualizedMenuList;
