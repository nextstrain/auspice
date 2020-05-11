// import ReactGA from "react-ga"; /* https://github.com/react-ga/react-ga */
import { hasExtension, getExtension } from "./extensions";

let ReactGA;
let importReactGa;

export const initialiseGoogleAnalyticsIfRequired = async () => {
  if (!hasExtension("googleAnalyticsKey")) {
    return;
  }
  importReactGa = import("react-ga");
  ReactGA = (await importReactGa).default;
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line
    console.log("Not setting up Google Analytics as we are not in production mode");
    return;
  }
  ReactGA.initialize(getExtension("googleAnalyticsKey"));
};

export const analyticsNewPage = async () => {
  if (importReactGa) await importReactGa;
  else return;
  // console.log("GA page change to", window.location.pathname)
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const analyticsControlsEvent = async (action) => {
  if (importReactGa) await importReactGa;
  else return;
  ReactGA.event({
    category: "Controls",
    action
  });
};

export const triggerOutboundEvent = async (address) => {
  if (importReactGa) await importReactGa;
  else return;
  ReactGA.outboundLink(
    {label: address},
    () => console.log("outbound event triggered", address) // eslint-disable-line no-console
  );
};
