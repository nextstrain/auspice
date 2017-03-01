/*eslint-env browser*/
import ReactGA from "react-ga";
/* https://github.com/react-ga/react-ga */

export const analyticsNewPage = () => {
  // console.log("GA page change to", window.location.pathname)
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const analyticsControlsEvent = (action) => {
  ReactGA.event({
    category: "Controls",
    action
  });
};

export const triggerOutboundEvent = (address) => {
  ReactGA.outboundLink(
    {label: address},
    () => console.log("outbound event triggered", address)
  );
  return null;
};
