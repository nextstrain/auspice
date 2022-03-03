import React, { useCallback } from "react";
import styled from 'styled-components';
import { MdDateRange } from "react-icons/md";
import { FiSave } from "react-icons/fi";

const FloatDiv = styled.div`
  float: ${(props) => props.right ? "right" : "left"};
`;
const TextSpan = styled.span`
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
`;
const TextSpanClickable = styled(TextSpan)`
  cursor: pointer;
`;
const IconSpan = styled(TextSpan)`
  font-size: 16px;
  margin: 0 3px;
  vertical-align: middle;
`;

const DatePicker = ({ value, minDate, maxDate, onChange, right }) => {
  const [editing, setEditing] = React.useState(false);

  const processNewValue = useCallback((newValue) => {
    setEditing(false);
    onChange(newValue);
  }, [setEditing, onChange]);

  const onKeyUp = useCallback((e) => {
    if (e.key === 'Enter') {
      processNewValue(e.target.value);
    }
  }, [processNewValue]);

  const onBlur = useCallback((e) => {
    processNewValue(e.target.value);
  }, [processNewValue]);

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
    return right ? <>{dateInput}{saveIcon}</> : <>{saveIcon}{dateInput}</>;
  }
  const dateText = <TextSpanClickable onClick={() => setEditing(true)}>{value}</TextSpanClickable>;
  const calenderIcon = <IconSpan onClick={() => setEditing(true)}><MdDateRange /></IconSpan>;
  return right ? <>{dateText}{calenderIcon}</> : <>{calenderIcon}{dateText}</>;
};

const DateLabel = ({ value, minDate, maxDate, onChange, right }) => {
  let content;
  // eslint-disable-next-line no-self-compare
  const isNumeric = +value === +value; // https://stackoverflow.com/q/175739#comment32052139_175787
  if (isNumeric) {
    // numeric dates are not editable by HTML date picker
    content = <TextSpan>{value}</TextSpan>;
  } else {
    content = (
      <DatePicker
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        onChange={onChange}
        right={right}
      />
    );
  }
  return (
    <FloatDiv right={right}>
      {content}
    </FloatDiv>
  );
};

export default DateLabel;
