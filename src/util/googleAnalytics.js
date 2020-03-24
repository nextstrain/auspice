import ReactGA from "react-ga"; /* https://github.com/react-ga/react-ga */
import { hasExtension, getExtension } from "./extensions";


export const initialiseGoogleAnalyticsIfRequired = () => {
  ReactGA.doNotUse = true; // a flag to indicate whether we are using GA
  if (!hasExtension("googleAnalyticsKey")) {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line
    console.log("Not setting up Google Analytics as we are not in production mode");
    return;
  }
  ReactGA.doNotUse = false;
  ReactGA.initialize(getExtension("googleAnalyticsKey"));
};

export const analyticsNewPage = () => {
  if (ReactGA.doNotUse) return;
  // console.log("GA page change to", window.location.pathname)
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const analyticsControlsEvent = (action) => {
  if (ReactGA.doNotUse) return;
  ReactGA.event({
    category: "Controls",
    action
  });
};

export const triggerOutboundEvent = (address) => {
  if (ReactGA.doNotUse) return;
  ReactGA.outboundLink(
    {label: address},
    () => console.log("outbound event triggered", address) // eslint-disable-line no-console
  );
};
