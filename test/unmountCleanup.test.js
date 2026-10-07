/**
 * @jest-environment jsdom
 */
import Mousetrap from "mousetrap";
import { TreeComponent } from "../src/components/tree/tree";
import EntropyPanel from "../src/components/entropy";
import EntropyChart from "../src/components/entropy/entropyD3";

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

test("the entropy panel destroys its chart and stops its observer on unmount", () => {
  const observer = { observe: jest.fn(), disconnect: jest.fn() };
  const originalIntersectionObserver = global.IntersectionObserver;
  global.IntersectionObserver = jest.fn(() => observer);
  try {
    const entropy = new Entropy({ loaded: true });
    entropy.setUp = jest.fn();
    entropy.d3entropy = svgGroupWithDrawing();
    const chart = { destroy: jest.fn() };
    entropy.state = { ...entropy.state, chart };
    entropy.componentDidMount();
    entropy.componentWillUnmount();
    expect(observer.observe).toHaveBeenCalledWith(entropy.d3entropy);
    expect(observer.disconnect).toHaveBeenCalled();
    expect(chart.destroy).toHaveBeenCalled();
  } finally {
    global.IntersectionObserver = originalIntersectionObserver;
  }
});

test("EntropyChart.destroy removes the SVG elements", () => {
  const svg = svgGroupWithDrawing();
  const chart = new EntropyChart(svg, {}, {});
  const unbind = jest.spyOn(Mousetrap, "unbind");
  try {
    chart.destroy();
    expect(svg.childNodes).toHaveLength(0);
  } finally {
    unbind.mockRestore();
  }
});
