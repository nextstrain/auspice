import React from "@libraries/react"; // eslint-disable-line
import { CenterContent } from "@auspice/components/splash/centerContent"; // eslint-disable-line
import { handleDroppedFiles } from "./handleDroppedFiles";

const p = {textAlign: "center", padding: "20px"};

class SplashContent extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.addEventListener("dragover", (e) => {e.preventDefault();}, false);
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      handleDroppedFiles(this.props.dispatch, e.dataTransfer.files);
    }, false);
  }
  datasetLink(path) {
    return (
      <div
        style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
        onClick={() => this.props.dispatch(this.props.changePage({path, push: true}))}
      >
        {path}
      </div>
    );
  }
  render() {
    console.log("props", this.props);
    return (
      <div className="static container">
        <h1 style={p}>
          auspice.us
        </h1>
        <div style={p}>
          {`
            auspice.us allows interactive exploration of phylogenomic datasets and is targeted at academic use.
            Simply drag and drop your datasets (newick / auspice JSON v2).
            Metadata CSVs can be dragged on once the dataset is loaded.
          `}
        </div>
        <div style={p}>
          {`UNDER DEVELOPMENT`}
        </div>

        <CenterContent>
          <div>
            <h2>{`Drag & Drop your (v2) JSON / newick on here to view`}</h2>
          </div>
        </CenterContent>

        <CenterContent>
          <p>{`auspice.us is built by `}<a href="https://twitter.com/hamesjadfield">james hadfield</a></p>
          <p>{`auspice.us is powered by `}<a href="https://github.com/nextstrain/auspice">auspice</a></p>
        </CenterContent>

      </div>
    );
  }
}

export default SplashContent;
