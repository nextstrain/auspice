const React = require("react");

/* this component renders the actual content for the reports
it will sent to the client as rendered HTML via server side react
but that's for another function in another file...
*/

const ReportBody = () => { // args: props, context
  return (
    <div>
      <h1>here is the report content coming in from the server</h1>
    </div>
  );
};

module.exports = {
  ReportBody
};
