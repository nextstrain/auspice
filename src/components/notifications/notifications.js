import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { REMOVE_NOTIFICATION } from "../../actions/types";

const generateIcon = (notificationType) => {
  switch (notificationType) {
    case "info":
      // https://octicons.github.com/ -> comment.svg
      return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 16">
          <path id="Shape" d="M14,1H2C1.5,1,1,1.4,1,2v8c0,0.6,0.5,1,1,1h2v3.5L7.5,11H14c0.6,0,1-0.4,1-1V2C15,1.4,14.6,1,14,1L14,1z"/>
        </svg>
      );
    case "warning":
      // https://octicons.github.com/ -> alert.svg
      return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 16">
          <path d="M8.865,1.51999998 C8.685,1.20999998 8.355,1.01999998 7.995,1.01999998 C7.635,1.01999998 7.305,1.20999998 7.125,1.51999998 L0.275000001,13.5 C0.0950000006,13.81 0.0950000006,14.19 0.275000001,14.5 C0.465000001,14.81 0.795000001,15 1.145,15 L14.845,15 C15.205,15 15.535,14.81 15.705,14.5 C15.875,14.19 15.885,13.81 15.715,13.5 L8.865,1.51999998 Z M8.995,13 L6.995,13 L6.995,11 L8.995,11 L8.995,13 L8.995,13 Z M8.995,9.99999998 L6.995,9.99999998 L6.995,5.99999998 L8.995,5.99999998 L8.995,9.99999998 L8.995,9.99999998 Z" id="Shape"/>
        </svg>
      );
    case "success":
      // https://octicons.github.com/ -> check.svg
      return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 13 16">
          <polygon id="Shape" points="12 5 4 13 0 9 1.5 7.5 4 10 10.5 3.5"/>
        </svg>
      );
    case "error":
      // https://octicons.github.com/ -> flame.svg
      return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 13 16">
          <path d="M5.05,0.31 C5.86,2.48 5.46,3.69 4.53,4.62 C3.55,5.67 1.98,6.45 0.9,7.98 C-0.55,10.03 -0.8,14.51 4.43,15.68 C2.23,14.52 1.76,11.16 4.13,9.07 C3.52,11.1 4.66,12.4 6.07,11.93 C7.46,11.46 8.37,12.46 8.34,13.6 C8.32,14.38 8.03,15.04 7.21,15.41 C10.63,14.82 11.99,11.99 11.99,9.85 C11.99,7.01 9.46,6.63 10.74,4.24 C9.22,4.37 8.71,5.37 8.85,6.99 C8.94,8.07 7.83,8.79 6.99,8.32 C6.32,7.91 6.33,7.13 6.93,6.54 C8.18,5.31 8.68,2.45 5.05,0.32 L5.03,0.3 L5.05,0.31 Z" id="Shape"/>
        </svg>
      );
    default:
      return "";
  }
};

@connect((state) => {
  return {
    stack: state.notifications.stack,
    pageWidth: state.browserDimensions.browserDimensions.width
  };
})
class Notifications extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    stack: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    pageWidth: PropTypes.number.isRequired
  }
  closeIcon(d) {
    return (
      <div onClick={() => { this.removeNotificationCallback(d.id); }}
        style={{cursor: "pointer"}}
        className={"close-icon"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 15 15">
          <polygon id="Shape" points="7.48 8 11.23 11.75 9.75 13.23 6 9.48 2.25 13.23 0.77 11.75 4.52 8 0.77 4.25 2.25 2.77 6 6.52 9.75 2.77 11.23 4.25"/>
        </svg>
      </div>
    );
  }
  generateEl(d) {
    return (
      <div key={d.id} className={d.classes.join(" ")}>
        <div className="icon icon-main">
          {generateIcon(d.notificationType)}
        </div>
        <div className="content">
          <div className="message item">
            {d.message}
          </div>
          <div className="detail item">
            <div className="detail-content">
              {typeof d.details === "string" ? d.details : d.details.map((el) => (
                <div key={el}>
                  {el}
                </div>
              ))}
            </div>
          </div>
        </div>
        {d.notificationType === "error" ? this.closeIcon(d) : null}
        {/* <div className="close icon icon-x"></div> */}
      </div>
    );
  }
  removeNotificationCallback(id) {
    this.props.dispatch({type: REMOVE_NOTIFICATION, id});
  }
  render() {
    /* don't display on small screens */
    if (this.props.pageWidth < 600) {
      return null;
    }
    return (
      <ReactCSSTransitionGroup className="notifications"
        transitionName="notification"
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}
        style={{zIndex: 20000}}
      >
        {this.props.stack.map((d) => this.generateEl(d))}
      </ReactCSSTransitionGroup>
    );
  }
}

export default Notifications;
