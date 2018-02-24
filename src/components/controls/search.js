import React from "react";
import { connect } from "react-redux";
import Awesomplete from 'awesomplete'; /* https://leaverou.github.io/awesomplete/ */
import "../../css/awesomplete.css";

@connect((state) => ({
  nodes: state.tree.nodes,
  version: state.tree.version
}))
class SearchStrains extends React.Component {
  constructor() {
    super();
    this.state = {strains: []};
  }
  componentDidMount() {
    this.ref.addEventListener('awesomplete-selectcomplete', (e) => {
      console.log("you've selected", e.text.value);
      const strain = e.text.value;
      for (let i = 0; i < this.props.nodes.length; i++) {
        if (this.props.nodes[i].strain === strain) {
          console.log(this.props.nodes[i]);
        }
      }
    });
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.version !== nextProps.version && nextProps.version) {
      console.log("CWRP version change", nextProps.version);
      new Awesomplete(this.ref, { // eslint-disable-line no-new
        list: this.props.nodes.filter((n) => !n.hasChildren).map((n) => n.strain)
      });
    }
  }

  render() {
    return (
      <div>
        <input ref={(r) => {this.ref = r;}}/>
      </div>
    );
  }
}

export default SearchStrains;
