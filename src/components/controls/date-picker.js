import React from "react";
import styled from 'styled-components';
import { MdDateRange } from "react-icons/md";
import { FiSave } from "react-icons/fi";

const FloatDiv = styled.div`
  float: ${(props) => props.right ? "right" : "left"};
  max-width: 50%;
`;
const IconSpan = styled.span`
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
  padding: 0 5px;
  cursor: pointer;
`;
const DateLabel = styled.div`
  font-family: ${(props) => props.theme["font-family"]};
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
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
    const inputElement = <input
      type="date"
      defaultValue={value}
      min={minDate}
      max={maxDate}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
    />;
    const saveIcon = <IconSpan onClick={() => setEditing(false)}><FiSave /></IconSpan>;
    const labelValue = right ? <>{inputElement}{saveIcon}</> : <>{saveIcon}{inputElement}</>;
    return <FloatDiv right={right}>{labelValue}</FloatDiv>;
  }
  const calenderIcon = <IconSpan onClick={() => setEditing(true)}><MdDateRange /></IconSpan>;
  const labelValue = right ? <>{value}{calenderIcon}</> : <>{calenderIcon}{value}</>;
  return <FloatDiv right={right}>
    <DateLabel>{labelValue}</DateLabel>
  </FloatDiv>;
};

export default DatePicker;
