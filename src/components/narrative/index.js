import React from "react";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { controlsWidth } from "../../util/globals";
import { LinkedParagraph, NormalParagraph } from "./paragraphs";

const styles = {
  fontFamily: headerFont,
  fontSize: 16,
  fontWeight: 300,
  color: medGrey
};

const Narrative = () => {
  return (
    <div className={"narrative"} style={styles}>
      <p/>
      <NormalParagraph
        title={"Something normal"}
        content={"some normal content"}
      />
      <LinkedParagraph
        title={"Some header"}
        url={"http://localhost:4000/zika?c=region"}
        content={
          `something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something
          something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something
          `
        }
      />
    </div>
  );
};
export default Narrative;
