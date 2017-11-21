import React from "react";
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import { changeURLQueryAndUpdateState } from "../../util/urlHelpers";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";


const makeTitle = (title, url) => {
  if (!title) {return null;}
  if (url) {
    return (<h3><a href={url}>{title}</a></h3>);
  }
  return (<h3>{title}</h3>);
};

/* props:
content (JSX format or just a string)
url to push onto the history stack
delay (default: 1000)
*/
@connect()
export class LinkedParagraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeoutRef: null
    };
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static defaultProps = {
    delay: 1000,
    title: null,
    url: null
  }
  delayedAction = () => {
    const ref = setTimeout(
      () => {changeURLQueryAndUpdateState(this.context.router, this.props.dispatch, this.props.url);},
      this.props.delay
    );
    this.setState({timeoutRef: ref});
  }
  cancelAction = () => {
    /* i'm guessing that it's cheaper to clear a timeout that no longer exists than it is to have another setState call */
    clearTimeout(this.state.timeoutRef);
  }
  render() {
    return (
      <div
        className={"mmm"}
        onMouseOver={this.delayedAction}
        onMouseLeave={this.cancelAction}
      >
        {makeTitle(this.props.title, this.props.url)}
        {this.props.content}
      </div>
    );
  }
}

export const NormalParagraph = (props) => {
  const {title, url, content} = props;
  return (
    <div
      style={{color: darkGrey}}
    >
      {makeTitle(title, url)}
      {content}
    </div>
  );
};
