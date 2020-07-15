import { addTimeout, removeTimeout, clearAllTimeouts } from '../../../src/util/timeoutQueue';

const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

test('Add and execute timeouts', async () => {
  let a = false;
  let b = false;
  addTimeout('test', () => { a = true; }, 100);
  addTimeout('test', () => { b = true; }, 200);
  await wait(70);
  expect(a).toBe(false);
  expect(b).toBe(false);
  await wait(70);
  expect(a).toBe(true);
  expect(b).toBe(false);
  await wait(70);
  expect(b).toBe(true);
});

test('Added timeouts are recallable', async () => {
  let b = false;
  const toB = addTimeout('test', () => { b = true; }, 200);
  await wait(110);
  removeTimeout('test', toB);
  await wait(100);
  expect(b).toBe(false);
});

test('Can clear all timeout of a component', async () => {
  let a = false;
  let bOne = false;
  let bTwo = false;
  addTimeout('a', () => { a = true; }, 200);
  addTimeout('b', () => { bOne = true; }, 200);
  addTimeout('b', () => { bTwo = true; }, 200);
  await wait(110);
  clearAllTimeouts('b');
  await wait(100);
  expect(a).toBe(true);
  expect(bOne).toBe(false);
  expect(bTwo).toBe(false);
});
