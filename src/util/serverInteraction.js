export const fetchJSON = (path) => {
  const p = fetch(path)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(res.statusText);
      }
      return res;
    })
    .then((res) => res.json());
  return p;
};
