/**
 * @jest-environment jsdom
 */
import { TreeComponent } from "../src/components/tree/tree";
import EntropyPanel from "../src/components/entropy";

const Entropy = EntropyPanel.WrappedComponent.WrappedComponent;

const svgGroupWithDrawing = () => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
  return group;
};

test("the tree clears both of its SVG groups on unmount", () => {
  const tree = new TreeComponent({});
  tree.domRefs = { mainTree: svgGroupWithDrawing(), secondTree: svgGroupWithDrawing() };
  const { mainTree, secondTree } = tree.domRefs;
  tree.componentWillUnmount();
  expect(mainTree.childNodes).toHaveLength(0);
  expect(secondTree.childNodes).toHaveLength(0);
});

test("the entropy panel clears its SVG and stops its observer on unmount", () => {
  const observer = { observe: jest.fn(), disconnect: jest.fn() };
  global.IntersectionObserver = jest.fn(() => observer);
  const entropy = new Entropy({ loaded: true });
  entropy.setUp = jest.fn();
  entropy.d3entropy = svgGroupWithDrawing();
  entropy.componentDidMount();
  entropy.componentWillUnmount();
  expect(observer.observe).toHaveBeenCalledWith(entropy.d3entropy);
  expect(observer.disconnect).toHaveBeenCalled();
  expect(entropy.d3entropy.childNodes).toHaveLength(0);
});
