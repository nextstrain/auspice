

const getDefaultMeasurementsState = () => ({
  // TODO: set default loaded to false
  loaded: true
});

const measurements = (state = getDefaultMeasurementsState(), action) => {
  switch (action.type) {
    default:
      return state;
  }
};

export default measurements;
