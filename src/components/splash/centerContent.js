/* eslint-disable global-require */
import React from "react";
import Flex from "../../components/framework/flex";

export const CenterContent = (props) => (
  <div className="row">
    <div className="col-md-1"/>
    <div className="col-md-10">
      <div className="line"/>
      <Flex wrap="wrap" style={{marginTop: 20, justifyContent: "space-around"}}>
        {props.children}
      </Flex>
    </div>
    <div className="col-md-1"/>
  </div>
);
