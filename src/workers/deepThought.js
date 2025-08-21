
self.onmessage = ({ data: { question } }) => {
  console.log("[this message comes from the worker] the question was:", question)
  self.postMessage({
    answer: 42,
  });
};