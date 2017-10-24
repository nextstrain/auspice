import React from "react";

/* props:
content (JSX format or just a string)
callback
delay (default: 1000)
*/
class MagicBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeoutRef: null
    };
  }
  static defaultProps = {
    delay: 1000
  }
  delayedAction = () => {
    const ref = setTimeout(this.props.callback, this.props.delay);
    this.setState({timeoutRef: ref});
  }
  cancelAction = () => {
    /* i'm assuming (guessing) that it's cheaper to clear a timeout that no longer
    exists than it is to have another setState call */
    clearTimeout(this.state.timeoutRef);
  }
  render() {
    return (
      <p
        className={"mmm"}
        onMouseOver={this.delayedAction}
        onMouseLeave={this.cancelAction}
      >
        {this.props.content}
      </p>
    );
  }
}
export default MagicBlock;
