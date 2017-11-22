import React from "react";
import { connect } from "react-redux";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { controlsWidth, charonAPIAddress } from "../../util/globals";
import { LinkedParagraph, NormalParagraph } from "./paragraphs";
import { warningNotification } from "../../actions/notifications";

@connect((state) => ({
  datasetPathName: state.controls.datasetPathName
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: undefined
    };
  }
  getDataFromServer(datasetPathName) {
    const errorHandler = (e) => {
      this.props.dispatch(warningNotification({message: "Failed to get narrative from server"}));
      console.error(e);
    };
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        this.setState({blocks: JSON.parse(xmlHttp.responseText)});
      } else {
        errorHandler(xmlHttp);
      }
    };
    xmlHttp.onerror = errorHandler;
    const name = datasetPathName.replace(/^\//, '').replace(/\//, '_');
    xmlHttp.open("get", `${charonAPIAddress}request=narrative&name=${name}`, true);
    xmlHttp.send(null);
  }
  componentDidMount() {
    if (this.props.datasetPathName && this.props.datasetPathName !== "") {
      this.getDataFromServer(this.props.datasetPathName);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.datasetPathName && this.props.datasetPathName !== nextProps.datasetPathName) {
      this.getDataFromServer(nextProps.datasetPathName);
    }
  }
  render() {
    if (this.state.blocks === undefined) {
      return null;
    }
    return (
      <div className={"narrative"}>
        {this.state.blocks.map((block, idx) => {
          if (block.type === "action") {
            return (
              <LinkedParagraph
                url={block.url}
                content={{__html: block.__html}} // eslint-disable-line no-underscore-dangle
                key={idx.toString()}
              />
            );
          }
          return (
            // eslint-disable-next-line react/no-danger
            <div dangerouslySetInnerHTML={block} key={idx.toString()}/>
          );
        })}
      </div>
    );
  }
}
export default Narrative;
