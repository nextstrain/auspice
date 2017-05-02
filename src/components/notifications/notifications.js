import React from "react";
import { connect } from "react-redux";

const generateEl = function (msg, id) {
  return (
    <div key={id}>
      <div className="content">
        <div className="message item"></div>
        <div className="detail item">
          <div className="detail-content">
            {msg}
          </div>
          <a href="#" className="stack-toggle"></a>
          <div className="stack-container"></div>
        </div>
        <div className="meta item"></div>
      </div>
      <div className="close icon icon-x"></div>
    </div>
  );
};

@connect((state) => {
  return {
    stack: state.notifications.stack
  };
})
class Notifications extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    stack: React.PropTypes.array.isRequired
  }
  render() {
    return (
      <div>
        {this.props.stack.map((d) => generateEl(d.message, d.id))}
      </div>
    );
  }
}

export default Notifications;
