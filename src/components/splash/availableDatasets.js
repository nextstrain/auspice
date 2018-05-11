import React from "react";
import {processAvailableDatasets} from "../status";
import { changePage } from "../../actions/navigation";
import { red } from "./displayError";

const formatDataset = (fields, dispatch) => {
  const path = fields.join("/");
  return (
    <li key={path}>
      <div
        style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
        onClick={() => dispatch(changePage({path: `/${path}`, push: true}))}
      >
        {path}
      </div>
    </li>
  );
};

export const displayAvailableDatasets = (availableDatasets, dispatch) => {
  if (!availableDatasets) {
    return (
      <div style={{fontSize: "20px", fontWeight: 400, color: red}}>
        {"There was an error getting the manifest JSON, which defines the available datasets"}
      </div>
    );
  }
  const queries = processAvailableDatasets(availableDatasets);
  return (
    <div>
      <div style={{fontSize: "26px"}}>
        {"Available Datasets:"}
      </div>
      <ul style={{marginLeft: "-22px"}}>
        {queries.map((data) => formatDataset(data, dispatch))}
      </ul>
    </div>
  );
};
