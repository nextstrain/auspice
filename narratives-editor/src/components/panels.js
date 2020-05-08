import React from "react"; // eslint-disable-line import/no-extraneous-dependencies
import styled from "styled-components"; // eslint-disable-line import/no-extraneous-dependencies
import ErrorBoundary from "./errorBoundary";
import DataHandler from "./dataHandler";
import Editor from "./editor";
import MainVizHandler from "./mainVizHandler";
import Summary from "./summary";
import Export from "./export";
import Header from "./header";

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 98%;
  max-height: 98%;
`;

const Half = styled.div`
  flex: 0 1 50%;
  min-height: 100%;
  max-width: 50%;
  border: 1px solid red;
`;

const Panels = () => {
  return (
    <Container>
      <Half>
        <Header/>
        <DataHandler/>
        <ErrorBoundary>
          <Summary/>
        </ErrorBoundary>
        <Editor/>
        <Export/>
      </Half>
      <Half>
        <MainVizHandler/>
      </Half>
    </Container>
  );
};

export default Panels;
