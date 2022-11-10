import React, {useState, lazy} from "react";
import NavBar from "../navBar";
import * as Styles from "./styles";
import ExamineNarrative from "./examineNarrative";
import { useDatasetFetch } from "./useDatasetFetch";
import { MarkdownInput } from "./markdownInput";
import NarrativeViewHeader from "./NarrativeViewHeader";

const Main = lazy(() => import("../main"));

/**
 * TODO in the future (post MVP)
 * - mainDisplayMarkdown
 * - allow some form of markdown text editing. This could be the entire file (easy to program but nasty to use)
 *   or it could be per-slide (but then you have all the stuff around adding / dropping slides etc). We could
 *   also edit the dataset and/or query. And then lots of stuff like allowing users to visualise the dataset
 *   in-app, change view settings etc, and return here with those settings changed.
 *   the general editing could be implemented in a series of incremental updates rather than one daunting task.
 * - fetching the narrative markdown via URL inspection rather than drag&drop
 * - saving, uploading the narrative etc (perhaps also by URL inspection?)
 *   (the above two points are related to the ability to upload _datasets_ via a web UI in that they should visually be consistent)
 * - styling (can always do more!)
 * - consider alternative ways of displaying the narrative other than a full-page preview
 */

const IntroductionContent = () => (
  <Styles.Introduction>
    {`This page provides an interactive approach to testing and debugging `}
    <a href="https://docs.nextstrain.org/en/latest/guides/communicate/narratives-intro.html">Nextstrain Narratives</a>
    {`. Simply drag & drop your narrative (markdown file) below to see a summary of each slide and the associated
    datasets, with the ability to preview individual slides or the entire narrative. Please see the `}
    <a href="https://docs.nextstrain.org/en/latest/tutorials/narratives-how-to-write.html">associated tutorial</a>
    {` for more.`}
  </Styles.Introduction>
);

/**
 * Main component (only missing the header)
 */
const DebugNarrative = () => {
  const [narrative, setNarrative] = useState();
  const [error, setError] = useState(null);
  const [displayNarrative, setDisplayNarrative] = useState();
  const datasetResponses = useDatasetFetch(narrative?.datasets);

  if (displayNarrative) {
    return (
      <>
        <NarrativeViewHeader setDisplayNarrative={setDisplayNarrative}/>
        <Main/>
      </>
    );
  }
  return (
    <>
      <NavBar/>

      <Styles.ExperimentalBanner>
        <span>
          This narrative debugger is a beta release!
          <br/>
          {`If you discover issues or have suggestions
          please get in touch or make issue on `}
          <a href="https://github.com/nextstrain/auspice/issues">GitHub</a>
        </span>
      </Styles.ExperimentalBanner>

      <IntroductionContent/>

      <MarkdownInput fileName={narrative?.fileName} setNarrative={setNarrative} setError={setError}/>

      {(error!==null) && <Styles.ErrorContainer>{`${error}`}</Styles.ErrorContainer>}
      {narrative && <ExamineNarrative narrative={narrative} datasetResponses={datasetResponses} setDisplayNarrative={setDisplayNarrative}/>}
    </>
  );

};

export default DebugNarrative;
