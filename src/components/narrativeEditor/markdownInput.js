import React, { useEffect, useRef, useState } from "react";
import * as Styles from "./styles";
import { updateApiCalls } from "./updateApiCalls";
import { parseMarkdownNarrativeFile } from "../../util/parseNarrative";
import { parseNarrativeDatasets } from "../../actions/loadData";
import { parseMarkdown } from "../../util/parseMarkdown";

/* inspired by Ivan's work in https://github.com/nextstrain/nextclade/blob/129f549b454f6c95b60ccb3d22161023814b3d6f/packages_rs/nextclade-web/src/components/FilePicker/FilePicker.tsx */

export const MarkdownInput = ({fileName, setNarrative, setError}) => {

  const el = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    async function handleDrop(event) {
      event.preventDefault();
      setIsDragging(false);
      setError(null); // reset any previous errors
      setNarrative(undefined); // reset any previous narrative state
      /* Ideally we wouldn't clobber the previous narrative state (via `setNarrative(undefined)`)
      as we want to avoid fetching the same dataset again and agin, e.g. when the user drops on
      the same markdown file but with non-dataset changes. */
      let narrativeFile;
      for (const file of event.dataTransfer.files) {
        if (file.name.endsWith(".md")) {
          narrativeFile = file;
          break;
        }
      }
      if (!narrativeFile) {
        setError("No appropriate markdown file dragged on");
        return;
      }
      let narrativeData = {};
      try {
        const blocks = await parseMarkdownNarrativeFile(await readFile(narrativeFile, false), parseMarkdown);
        const {datasets, initialNames, frontmatterNames} = parseNarrativeDatasets(blocks, {});
        narrativeData = {blocks, datasets, initialNames, frontmatterNames, fileName: narrativeFile.name};
      } catch (err) {
        const msg = `Error obtaining narratives from ${narrativeFile.name}. Details: ${err.message}`;
        console.error(msg);
        setError(msg);
        return;
      }
      updateApiCalls(narrativeData.datasets);
      setNarrative(narrativeData);
    }
    function handleDragover(event) {
      event.preventDefault();
    }
    function handleDragEnter() {
      setIsDragging(true);
    }
    function handleDragLeave() {
      setIsDragging(false);
    }
    const domElement = el.current; // important for the clean up function
    domElement.addEventListener("dragover", handleDragover, false);
    domElement.addEventListener("drop", handleDrop, false);
    domElement.addEventListener("dragenter", handleDragEnter, false);
    domElement.addEventListener("dragleave", handleDragLeave, false);

    return () => {
      domElement.removeEventListener("dragover", handleDragover, false);
      domElement.removeEventListener("drop", handleDrop, false);
      domElement.removeEventListener("dragenter", handleDragEnter, false);
      domElement.removeEventListener("dragleave", handleDragLeave, false);

    };
  }, [setNarrative, setError, isDragging, setIsDragging]);

  return (
    <Styles.FilePickerContainer ref={el}>
      <Styles.FilePickerHeader>
        <h4>Provide a narrative to analyse</h4>
      </Styles.FilePickerHeader>
      <Styles.FilePickerBody dragActive={isDragging}>
        <Styles.FileIcon size={70}/> {/* todo: dragActive prop */}
        {fileName ? (
          <Styles.DraggedText>
            <p>{`Currently analysing ${fileName}`}</p>
            <p>Drag & Drop another markdown file to restart</p>
          </Styles.DraggedText>
        ) : (
          <Styles.DraggedText>
            Drag & Drop markdown file to begin
          </Styles.DraggedText>
        )}
      </Styles.FilePickerBody>
    </Styles.FilePickerContainer>
  );

};

/** promisify FileReader's readAsText() so we can use it within
 * async functions via `await readJson(file)`.
 * Originally adapted from https://stackoverflow.com/a/51026615
 * Taken from https://github.com/nextstrain/auspice.us/blob/427c138dcfce1f0e6fff8049dacc4e416304ff7a/auspice_client_customisation/handleDroppedFiles.js#L24-L44
 */
function readFile(file, isJSON=true) {
  return new Promise((resolve, reject) => {
    const fileReader = new window.FileReader();
    fileReader.onloadend = function onloadend(e) {
      if (isJSON) {
        const json = JSON.parse(e.target.result);
        resolve(json);
      } else {
        resolve(e.target.result);
      }
    };
    fileReader.onerror = function onerror(e) {
      reject(e);
    };
    fileReader.readAsText(file);
  });
}
