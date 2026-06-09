/* eslint-disable global-require */
import React from "react";
import Flex from "../../components/framework/flex";

export const CenterContent = (props) => (
  <div style={{display: "flex", justifyContent: "center"}}>
    <div style={{flex: "0 1 83.33%"}}>
      <div className="line"/>
      <Flex wrap="wrap" style={{marginTop: 20, justifyContent: "space-around"}}>
        {props.children}
      </Flex>
    </div>
  </div>
);
