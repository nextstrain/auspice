import React, { Suspense, lazy } from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { FaExclamationTriangle } from "react-icons/fa";
import { withTranslation } from 'react-i18next';

const MarkdownDisplay = lazy(() => import("../markdownDisplay"));

const WarningContainer = styled.div`
  background-color: #FFF1D1;
  display: flex;
  align-items: stretch;
`;

const WarningIconContainer = styled.div`
  background-color: #FFC641;
  padding: 0 7px;
  display: flex;
  align-items: center;
`;

const WarningIcon = styled.div`
  padding-top: 3px;
  color: white;
  font-size: 24px;
`;

const WarningText = styled.div`
  padding: 0 7px;
  font-size: 15px;
`;

/**
 * React component for the warning of the current dataset.
 */
@connect((state) => {
  return {
    warning: state.metadata.warning
  };
})
class Warning extends React.Component {
  render() {
    const { warning } = this.props;

    if (warning === undefined) return null;

    return (
      <Suspense fallback={null}>
        <WarningContainer>
          <WarningIconContainer>
            <WarningIcon>
              <FaExclamationTriangle />
            </WarningIcon>
          </WarningIconContainer>
          <WarningText>
            <MarkdownDisplay
              mdstring={warning}
              placeholder="This dataset contained a warning message to be displayed here, however it wasn't correctly formatted."/>
          </WarningText>
        </WarningContainer>
      </Suspense>
    );
  }
}

const WithTranslation = withTranslation()(Warning);
export default WithTranslation;
