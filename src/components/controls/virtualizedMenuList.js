import React from "react";
import { List } from "react-virtualized/dist/es/List";
import { isEqual } from "lodash";
import { controlsWidth } from "../../util/globals";

/**
 * A virtualized list expected to be used to replace the MenuList
 * component in `react-select`
 */
const VirtualizedMenuList = ({ children, maxHeight, focusedOption }) => {
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

  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>{children[index]}</div>
  );

  return (
    <List
      height={maxHeight}
      rowHeight={40}
      rowRenderer={rowRenderer}
      rowCount={children.length || 0}
      width={controlsWidth}
      scrollToIndex={scrollToIndex}
    />
  );
};

export default VirtualizedMenuList;
