/* eslint no-console: off */
const ReactDOMServer = require('react-dom/server');
const React = require("react");

// class ReportContent extends React.Component {
//   render() {
//     return (
//       <div>
//         <h1>from the server!</h1>
//       </div>
//     );
//   }
// }


const serveStaticReport = (query, res) => {

  console.log("sending static react");
  res.send("fucking something")
  // res.send(ReactDOMServer.renderToString(<ReportContent/>));
};

module.exports = {
  serveStaticReport
};
