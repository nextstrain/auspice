import React from "react";
import styled from 'styled-components';
import { MdDateRange } from "react-icons/md";
import { FiSave } from "react-icons/fi";

const FloatDiv = styled.div`
  float: ${(props) => props.right ? "right" : "left"};
  max-width: 50%;
`;
const TextSpan = styled.span`
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
  cursor: pointer;
`;
const IconSpan = styled(TextSpan)`
  font-size: 16px;
  margin: 0 3px;
  vertical-align: middle;
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
  let content;
  if (editing) {
    const dateInput = (
      <input
        type="date"
        defaultValue={value}
        min={minDate}
        max={maxDate}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
      />
    );
    const saveIcon = <IconSpan onClick={() => setEditing(false)}><FiSave /></IconSpan>;
    content = right ? <>{dateInput}{saveIcon}</> : <>{saveIcon}{dateInput}</>;
  } else {
    const dateLabel = <TextSpan onClick={() => setEditing(true)}>{value}</TextSpan>;
    const calenderIcon = <IconSpan onClick={() => setEditing(true)}><MdDateRange /></IconSpan>;
    content = right ? <>{dateLabel}{calenderIcon}</> : <>{calenderIcon}{dateLabel}</>;
  }
  return (
    <FloatDiv right={right}>
      {content}
    </FloatDiv>
  );
};

export default DatePicker;
