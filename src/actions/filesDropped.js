export const filesDropped = (files) => {
  return function (dispatch, getState) {
    for (const file of files) {
      console.log("Dropped", file.name, file.type)
    }
  };
};
