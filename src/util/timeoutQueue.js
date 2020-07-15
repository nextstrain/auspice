const timeouts = {};

export const addTimeout = (component, fn, delay) => {
  if (!timeouts[component]) timeouts[component] = [];
  const newTimeout = setTimeout(() => {
    fn();
    timeouts[component] = timeouts[component].filter((to) => to !== newTimeout);
  }, delay);
  timeouts[component].push(newTimeout);
  return newTimeout;
};

export const removeTimeout = (component, timeout) => {
  if (timeouts[component].some((to) => to === timeout)) {
    clearTimeout(timeout);
    timeouts[component] = timeouts[component].filter((to) => to !== timeout);
  }
};

export const clearAllTimeouts = (component) => {
  timeouts[component].forEach((to) => {
    clearTimeout(to);
  });
  timeouts[component] = [];
};
