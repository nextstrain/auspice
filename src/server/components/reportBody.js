const React = require("react");

/* this component renders the actual content for the reports
it will sent to the client as rendered HTML via server side react
but that's for another function in another file...
*/

const ReportBody = (props) => { // args: props, context
  return (
    <div>
      <h1>Server rendered {props.path}</h1>
    </div>
  );
};

module.exports = {
  ReportBody
};
