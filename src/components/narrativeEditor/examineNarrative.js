import React, { useRef, useEffect } from "react";
import { useAppDispatch } from "../../hooks";
import { getDatasetNamesFromUrl } from "../../actions/loadData";
import { CLEAN_START } from "../../actions/types";
import { createStateFromQueryOrJSONs } from "../../actions/recomputeReduxState";
import * as Styles from "./styles";


const DatasetHover = ({lines}) => {
  return (
    <div>
      {lines.map((l) => (<p key={l}>{l}</p>))}
    </div>
  );
};

const formatStatus = (status) => {
  if (status && status.startsWith("Error")) return status;
  if (status && status.startsWith("Warning")) return status;
  else if (status==="inProgress") return "This file is being fetched as we speak...";
  else if (status==="success") return "Success! This file exists and has been fetched. Note that there may still be subtle errors with the data, so we still suggest previewing the slide to double check.";
  else if (status==="notAttempted") return "Status: We haven't attempted to fetch this file, as we are either waiting on the main JSON or this file is not necessary.";
  // only remaining status is (should be) "internalError"
  return "Oops, there has been some internal error here! Please consider letting us know about this.";
};

/**
 * Summary of the load status of an individual dataset.
 */
const DatasetSummary = ({slide, name, statuses, showSlide}) => {
  const n = slide.slideNumber;
  return (
    <div>
      <div style={{display: "flex", justifyContent: "space-between", cursor: "pointer"}} onClick={showSlide}>
        <Styles.SlideDataset data-tip data-for={`dataset_${n}_${name}`}>
          {name}
        </Styles.SlideDataset>
        <div style={{display: "flex", flexDirection: "row"}}>
          <Styles.DatasetIcon
            num={n}
            datasetType="main"
            status={statuses?.main}
            hoverContent={<DatasetHover lines={["The main dataset (auspice) JSON, which is necessary for this slide to display properly.", formatStatus(statuses?.main)]}/>}
          />
          <Styles.DatasetIcon
            num={n}
            datasetType="rootSeq"
            status={statuses?.rootSeq}
            hoverContent={<DatasetHover lines={["An optional (sidecar) JSON which defines the root sequence. This is only needed for certain use-cases and the absence of this file is relatively normal.", formatStatus(statuses?.rootSeq)]}/>}
          />
          <Styles.DatasetIcon
            num={n}
            datasetType="frequencies"
            status={statuses?.frequencies}
            hoverContent={<DatasetHover lines={["The frequencies JSON, which is only fetched when the dataset asks for the frequencies panel to be displayed.", formatStatus(statuses?.frequencies)]}/>}
          />
        </div>
      </div>
      <Styles.HoverBox place="bottom" effect="solid" key={`hover_dataset_${name}`} id={`dataset_${n}_${name}`}>
        <DatasetHover
          lines={statuses?.main==="success" ?
            [
              "This dataset looks like it has loaded OK",
              `The query parameters (which control how the dataset is displayed) are ${slide.queryParams.toString()}`,
              "Click here to view this slide full screen in order to check how the slide will be displayed in a narrative"
            ] :
            [
              "This dataset does't appear to be available or loaded correctly (hover over icons to the right for more details)",
              "You can still click here to load the narrative slide but errors are to be expected!"
            ]}
        />
      </Styles.HoverBox>
    </div>
  );
};

/**
 * The component to render what dataset(s) + sidecars have been successfully
 * fetched. If a mainDisplayMarkdown is to be used, this is displayed here.
 * The user should be able to understand which datasets haven't loaded, and to
 * debug this, through interactions with this component.
 */
const VizSummary = ({slide, datasetResponses, showSlide}) => {
  const names = slide.associatedDatasetNames;
  /* Do we have a tanglegram defined for this slide? */
  const isTanglegram = !!names[1];
  return (
    <Styles.SlideDatasetContainer>
      {(isTanglegram && (<div>Tanglegram</div>))}
      <DatasetSummary slide={slide} key={names[0]} name={names[0]} statuses={datasetResponses[names[0]] || {}} showSlide={showSlide}/>
      {(isTanglegram && (
        <DatasetSummary slide={slide} key={names[1]} name={names[1]} statuses={datasetResponses[names[1]] || {}} showSlide={showSlide}/>
      ))}
    </Styles.SlideDatasetContainer>
  );
};

/**
 * The component to render what sidebar (markdown) text is displayed
 */
const TextSummary = ({slide, n, onClick}) => {
  return (
    <Styles.SlideDescription onClick={onClick}>

      <div data-tip data-for={`hover_slide_${n}`}>
        {`Slide ${n+1}: ${extractTitleFromHTML(slide.blockHTML, n===0)}`}
      </div>

      <Styles.HoverBox place="bottom" effect="solid" key={`hover_slide_${n}`} id={`hover_slide_${n}`}>
        <div dangerouslySetInnerHTML={{__html: slide.blockHTML}} /> {/* eslint-disable-line react/no-danger */}
      </Styles.HoverBox>

    </Styles.SlideDescription>
  );
};


const ExplainSlides = () => (
  <Styles.Introduction>
    The <em>slides</em> column shows the title of each slide in the narrative.
    Hovering will show you a preview of how the markdown content will appear, while clicking clicking on the title
    will preview the entire narrative at that slide (you can click in the top-left
    of the narrative to return to this editor).
    <br/>
    The <em>datasets</em> for each slide are shown to the right. Each dataset may comprise multiple
    JSON files, the status of each is shown by icons to the right (hover for more details of
    the status of individual files). Clicking will preview the entire narrative at that slide.
  </Styles.Introduction>
);

const NarrativeSummary = ({summary, datasetResponses, showNarrative}) => {
  return (
    <>
      <Styles.GridContainer>
        {/* HEADER ROW */}
        <Styles.GridHeaderCell key={'description'}>
          Slides
        </Styles.GridHeaderCell>
        <Styles.GridHeaderCell key={'dataset'}>
          Datasets (per slide)
        </Styles.GridHeaderCell>
        {/* ONE ROW PER SLIDE */}
        {summary.reduce(
          (els, slide) => {
            const n = parseInt(slide.slideNumber, 10);
            els.push(
              <TextSummary key={`slide_${n}`} slide={slide} n={n} onClick={() => showNarrative(n)}/>
            );
            els.push(
              <VizSummary key={`dataset_${n}`} slide={slide} datasetResponses={datasetResponses} showSlide={() => showNarrative(n)}/>
            );
            return els;
          },
          []
        )}
      </Styles.GridContainer>
    </>
  );
};

const ExamineNarrative = ({narrative, datasetResponses, setDisplayNarrative}) => {
  const dispatch = useAppDispatch();
  const el = useRef(null);
  useEffect(() => {
    /* when a narrative is loaded then we want to focus on <ExamineNarrative> however
    on laptop screens this can be below the fold and thus not apparent. Solve this
    by scrolling it into view on load time */
    el.current.scrollIntoView();
  }, [el]);

  const summary = narrative.blocks.map((block, idx) => {
    return {
      blockHTML: block.__html,
      associatedDatasetNames: getDatasetNamesFromUrl(block.dataset),
      queryParams: new URLSearchParams(block.query),
      slideNumber: String(idx)
    };
  });

  /**
   * Show the narrative at this slide. This is base upon the `loadNarrative` function (loadData.js).
   * As the debug narrative page is still a prototype I attempted to avoid modifying too many existing auspice
   * functions, but in the future we should refactor `loadNarrative` so that we can reuse
   * the core functionality.
   * We explicity make a CLEAN_START each time so we don't have to worry about
   * previous redux state (e.g. from a previous narrative in the editor)
   *
   * There is one (subtle) difference between loading a normal narrative and
   * this approach with regards to the initial dataset if the frontmatter dataset
   * isn't valid and the 1st slide's dataset is (and vice versa). As we're debugging
   * I want us to flag this as an error rather than being clever about it.
   * @param {int} n
   */
  const showNarrative = async (n=0) => {
    const datasetNames = summary[n].associatedDatasetNames;

    let cleanStartAction;
    try {
      cleanStartAction = {
        type: CLEAN_START,
        pathnameShouldBe: undefined,
        preserveCache: true, // specific for the narrative debugger
        ...createStateFromQueryOrJSONs({
          json: await narrative.datasets[datasetNames[0]].main,
          measurementsData: narrative.datasets[datasetNames[0]].measurements ? (await narrative.datasets[datasetNames[0]].measurements) : undefined,
          secondTreeDataset: datasetNames[1] ? await narrative.datasets[datasetNames[1]].main : undefined,
          query: n ? {n} : {}, // query is things like n=3 to load a specific page
          narrativeBlocks: narrative.blocks,
          mainTreeName: narrative.datasets[narrative.initialNames[0]].pathname,
          secondTreeName: datasetNames[1] || null,
          dispatch
        })
      };
    } catch (err) {
      // todo
      console.error(`Failed to load the narrative on slide ${n}`, err);
      return;
    }
    dispatch(cleanStartAction);
    setDisplayNarrative(true);

    /* the CLEAN_START action _does not_ consider sidecars, so we do this manually... */
    narrative.datasets[datasetNames[0]].loadSidecars(dispatch);
  };

  return (
    <div ref={el}>
      <ExplainSlides/>
      <NarrativeSummary summary={summary} datasetResponses={datasetResponses} showNarrative={showNarrative}/>
      <Styles.ButtonContainer>
        <Styles.Button onClick={() => showNarrative()}>
          View Narrative
        </Styles.Button>
      </Styles.ButtonContainer>
      <div style={{minHeight: "50px"}}/>
    </div>
  );
};

/**
 * Our narrative parsing functions don't return the underlying markdown, but
 * because we control the HTML output we can make certain assumptions about
 * where the title is. This function should be considered fit for purpose only
 * for the MVP -- we should instead modify `parseMarkdownNarrativeFile`
 * to return this information
 * @param {string} html
 * @returns {string} the title
 */
function extractTitleFromHTML(html, isTitleSlide) {
  try {
    const matchingElements = (new DOMParser()).parseFromString(html, "text/html")
      .querySelectorAll(isTitleSlide ? "h2" : "h1");
    return matchingElements[0].innerText;
  } catch (err) {
    console.error(`Error extracting title:`, err.message);
    return "Unknown slide title";
  }
}

export default ExamineNarrative;
