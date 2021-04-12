import {NoContentError} from "./exceptions";

export const fetchWithErrorHandling = async (path) => {
  const res = await fetch(path);

  if (res.status !== 200) {
    if (res.status === 204) {
      throw new NoContentError();
    }
    throw new Error(`${await res.text()} (${res.statusText})`);
  }
  return res;
};

export const fetchJSON = async (path) => {
  const res = await fetchWithErrorHandling(path);
  return await res.json();
};
