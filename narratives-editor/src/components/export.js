import React from "react"; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from "react-redux"; // eslint-disable-line import/no-extraneous-dependencies
import { FaDownload } from "react-icons/fa"; // eslint-disable-line import/no-extraneous-dependencies
import { Container, Button } from "./styles";

@connect((state) => {
  return {
    blocks: state.narrative.blocks
  };
})
class Export extends React.Component {
  constructor(props) {
    super(props);
    this.download = this.download.bind(this);
  }
  download() {
    const markdown = this.props.blocks.map((b) => b.md).join("\n\n");
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown));
    element.setAttribute('download', "edited-narrative.md");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  render() {
    if (!this.props.blocks) return null;
    return (
      <Container>
        <Button onClick={this.download}>
          <FaDownload/>{` save (edited) narrative markdown`}
        </Button>
      </Container>
    );
  }
}

export default Export;

