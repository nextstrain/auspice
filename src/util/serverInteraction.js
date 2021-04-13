import {NoContentError, RedirectToAnotherNextstrainPage} from "./exceptions";

export const fetchWithErrorHandling = async (path) => {
  const res = await fetch(path);

  if (res.status !== 200) {
    if (res.status === 204) {
      throw new NoContentError();
    }
    /* The nextstrain.org server may send a 404 page with a custom header
    instructing us that the dataset doesn't exist so we should redirect
    to another page (which usually won't be routed to Auspice) */
    if (res.status === 404 && res.headers.has("nextstrain-parent-page")) {
      throw new RedirectToAnotherNextstrainPage(res.headers.get("nextstrain-parent-page"));
    }

    throw new Error(`${await res.text()} (${res.statusText})`);
  }
  return res;
};

export const fetchJSON = async (path) => {
  const res = await fetchWithErrorHandling(path);
  return await res.json();
};
