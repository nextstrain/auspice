import React from "react";
import Select, { components } from "react-select";

/**
 * The DropdownIndicator must be a custom component because the new version
 * of react-select uses an SVG as the dropdown arrow that must be replaced.
 *
 * Uses the css from v1 of react-select to create the filled dropdown
 * icon. See `Select-arrow` class in
 * https://github.com/JedWatson/react-select/blob/v1.x/dist/react-select.css
 */
const DropdownIndicator = (props) => {
  const dropDownArrowStyle = {
    borderColor: "#999 transparent transparent",
    borderStyle: "solid",
    borderWidth: "5px 5px 2.5px",
    display: "inline-block",
    height: 0,
    width: 0,
    position: "relative"
  };

  return (
    <components.DropdownIndicator {...props}>
      <span style={dropDownArrowStyle} />
    </components.DropdownIndicator>
  );
};

const customSelectComponents = {
  IndicatorSeparator: () => null,
  DropdownIndicator
};

// Uses the react-select styles API to customize component styles
// See https://react-select.com/styles for more details
export const customSelectStyles = {
  menu: (base) => ({ ...base, marginTop: 0}),
  placeholder: (base) => ({ ...base, color: "#aaa"})
};

const CustomSelect = (props) => {
  // Merge our custom components with passed components but
  // passed components can override our default custom components
  const newComponents = {
    ...customSelectComponents,
    ...props.components
  };

  // Merge our custom styles with passed styles but passed styles can override
  // our default custom styles
  const newStyles = {
    ...customSelectStyles,
    ...props.styles
  };

  const newProps = {...props, components: newComponents, styles: newStyles};

  return (
    <Select {...newProps}/>
  );
};

export default CustomSelect;
