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
    if (this.props.url === nextProps.url) {
      return;
    }
    if (this.state.timeoutRef) {
      clearTimeout(this.state.timeoutRef);
    }
    if (!nextProps.url) {
      return;
    }
    const ref = setTimeout(
      () => {
        this.props.dispatch(changePageQuery({query: queryString.parse(nextProps.url.split('?')[1]), push: true}));
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
        padding: "20px",
        margin: "0px"}}
      >
        <div style={{fontSize: 26}}>
          {this.props.title}
        </div>
        <div dangerouslySetInnerHTML={this.props.content}/>
      </div>
    );
  }
}
