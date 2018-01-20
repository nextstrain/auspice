import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { changePageQuery } from "../../actions/navigation";

@connect()
export class Focus extends React.Component { // eslint-disable-line
  constructor(props) {
    super(props);
    this.state = {
      timeoutRef: null
    };
  }
  static defaultProps = {
    delay: 500
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.content.url === nextProps.content.url) {
      return;
    }
    if (this.state.timeoutRef) {
      clearTimeout(this.state.timeoutRef);
    }
    if (!nextProps.content.url) {
      return;
    }
    const ref = setTimeout(
      () => {
        this.props.dispatch(changePageQuery({query: queryString.parse(nextProps.content.url.split('?')[1]), push: true}));
        this.setState({timeoutRef: null});
      },
      this.props.delay
    );
    this.setState({timeoutRef: ref});
  }

  render() {
    return (
      <div style={{
        minWidth: `${this.props.width}px`,
        minHeight: `${this.props.height}px`,
        maxHeight: `${this.props.height}px`,
        padding: "5px, 0px, 0px, 5px",
        backgroundColor: "#bbff00"}}
      >
        <h3>{this.props.title}</h3>
        <div dangerouslySetInnerHTML={this.props.content}/>
      </div>
    );
  }
}
