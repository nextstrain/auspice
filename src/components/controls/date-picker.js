import React from "react";
import styled from 'styled-components';

const DateLabel = styled.div`
  font-family: ${(props) => props.theme["font-family"]};
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
  float: ${(props) => props.right ? "right" : "left"};
`;
const DateInput = styled.input`
  float: ${(props) => props.right ? "right" : "left"};
`;

const DatePicker = ({ value, minDate, maxDate, onChange, right }) => {
  const [editing, setEditing] = React.useState(false);
  function processNewValue(newValue) {
    setEditing(false);
    onChange(newValue);
  }
  function onKeyUp(e) {
    if (e.key === 'Enter') {
      processNewValue(e.target.value);
    }
  }
  function onBlur(e) {
    processNewValue(e.target.value);
  }
  if (editing) {
    return (
      <DateInput
        type="date"
        defaultValue={value}
        min={minDate}
        max={maxDate}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        right={right}
      />
    );
  }
  return <DateLabel onClick={() => setEditing(true)} right={right}>{value}</DateLabel>;
};

export default DatePicker;
