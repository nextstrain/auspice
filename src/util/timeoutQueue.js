const timeouts = {};

export const addTimeout = (component, fn, delay, ...args) => {
  if (!timeouts[component]) timeouts[component] = [];
  const newTimeout = setTimeout(() => {
    fn(...args);
    timeouts[component] = timeouts[component].filter((to) => to !== newTimeout);
  }, delay);
  timeouts[component].push(newTimeout);
  return newTimeout;
};

export const removeTimeout = (component, timeout) => {
  if (!timeouts[component]) {
    console.error('Cannot remove timeout for component', component, 'ref', timeout);
    return;
  }
  if (timeouts[component].some((to) => to === timeout)) {
    clearTimeout(timeout);
    timeouts[component] = timeouts[component].filter((to) => to !== timeout);
  } else {
    console.error('Timeout is not in component', component, 'ref', timeout);
  }
};

export const clearAllTimeouts = (component) => {
  if (timeouts[component]) {
    timeouts[component].forEach((to) => {
      clearTimeout(to);
    });
  }
  timeouts[component] = [];
};
