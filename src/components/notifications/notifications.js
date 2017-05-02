import React from "react";
import { connect } from "react-redux";

const generateEl = function (d) {
  return (
    <div key={d.id} className={ d.classes.join(" ") }>
      <div className="content">
        <div className="message item">
          {d.message}
        </div>
        <div className="detail item">
          <div className="detail-content">
            {d.details}
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
      <div className="notifications">
        {this.props.stack.map((d) => generateEl(d))}
      </div>
    );
  }
}

export default Notifications;
