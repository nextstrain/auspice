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
        title={"Introduction"}
        content={"A paragraph which has no effect on state"}
      />
      <LinkedParagraph
        title={"Colorby #1"}
        url={"http://localhost:4000/zika?c=region"}
        content={
          `hover over this paragrapha and change the colorBy to region`
        }
      />
      <LinkedParagraph
        title={"Colorby #2 (can click also...)"}
        url={"http://localhost:4000/zika?c=country"}
        content={
          `change the colorBy to country`
        }
      />
      <LinkedParagraph
        title={"Look at the recent sequences"}
        url={"http://localhost:4000/zika?c=num_date&dmax=2017-04-20&dmin=2016-09-19"}
        content={
          `Recently...`
        }
      />
      <LinkedParagraph
        title={"Now for something different"}
        url={"http://localhost:4000/zika?l=radial&m=div"}
        content={
          `let's look at a radial tree with divergence instead of time...`
        }
      />
      <LinkedParagraph
        title={"Finally"}
        url={"http://localhost:4000/zika?"}
        content={
          `return back to normal / no URL query`
        }
      />
    </div>
  );
};
export default Narrative;
