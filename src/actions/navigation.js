import { getPathnameAndMaybeChangeURL } from "../util/urlHelpers";
import { PAGE_CHANGE } from "./types";


const getPageFromPathname = (pathname) => {
  if (pathname === "/") {
    return "splash";
  } else if (pathname.startsWith("/methods")) {
    return "methods";
  } else if (pathname.startsWith("/posts")) {
    return "posts";
  } else if (pathname.startsWith("/about")) {
    return "about";
  }
  return "app"; // fallthrough
};


/* this is an action, rather than the reducer, as it is not pure (it may change the URL) */
// eslint-disable-next-line
export const changePage = (pathIn) => (dispatch, getState) => {
  const { datasets } = getState();
  const page = getPageFromPathname(pathIn);
  const pathname = page === "app" ? getPathnameAndMaybeChangeURL(pathIn, datasets.pathogen) : undefined;
  console.log("ACTION chanegPAge. PAGE CHANGE TO:", page, " DATAPATH:", pathname)
  dispatch({type: PAGE_CHANGE, page, pathname});
};
