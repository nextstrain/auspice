/*eslint-env browser*/
import ReactGA from "react-ga";
/* https://github.com/react-ga/react-ga */

export const analyticsNewPage = () => {
  console.log("GA page change to", window.location.pathname)
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const outboundLinkWithAnalytics = (address) => {
  ReactGA.outboundLink(
    {label: address},
    () => window.location.assign(address)
    // () => window.open(address, "_blank") /* pop-up blocked */
  );
  return null;
};
