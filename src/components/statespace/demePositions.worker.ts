/// <reference lib="webworker" />

import { forceSimulation, forceManyBody, forceX, forceY, forceCenter, forceLink, forceCollide, forceRadial, Simulation } from "d3-force";
import { interval } from "d3-timer"
import { min, max } from "d3-array";

import { DataForWorker, DemeForWorker, TransmissionCounts } from "./statespace";

// extend the main data type to indicate that d3 force functions will add properties
type DemeForWorkerExtended = DemeForWorker & {[key: string]: unknown}

let simulation: Simulation;

const UPDATE_DOM_EVERY_N_TICKS = 5;

const DEV_MODE = false; // TODO XXX

self.onmessage = (e: MessageEvent<DataForWorker>): void => {
  const action = e.data.action;
  switch (action) {
    case 'startSimulation':
      setUpSimulation(e.data.demes, e.data.transmissionCounts, e.data.svgWidth, e.data.svgHeight);
      runSimulation()
      break;
    case 'stopSimulation':
      simulation.stop();
      simulation = undefined;
      break;
    default:
      console.error(`demePositions worker: unknown action received "${action}"`);
  }
};


function setUpSimulation(demes: DemeForWorker[], transmissionCounts: TransmissionCounts, svgWidth: number, svgHeight: number): void {
  simulation = forceSimulation()
    .nodes(demes) // .map((d) => ({...d, vx: 0, vy: 0})))
    .stop();
  simulation
    .force("distribute", // fit into SVG
      forceDistribute(svgWidth, svgHeight)
        .strength(2)
    )
    .force("collision", // don't let demes overlap
      forceCollide()
        .radius((n) => n.radius)
        .strength(1)
    )
    .force("repel",
      forceManyBody()
        .strength(-15)
    );

  /** Model transmissions like springs between demes */
  if (transmissionCounts.size) {
    const links = [];
    const demeIndicies = Object.fromEntries(demes.map((d, index) => [d.name, index]));
    const linkIndicies: Record<string,number> = {}
    transmissionCounts.forEach((nTransmissions, demePair) => {
      // Sort demes to combine transmissions from A -> B with B -> A
      const [d1, d2] = demePair.split('__').sort();
      const linkIdx = linkIndicies[d1+d2]
      if (linkIdx===undefined) {
        linkIndicies[d1+d2] = links.length;
        const [source, target] = [demeIndicies[d1], demeIndicies[d2]];
        const radii = demes[source].radius + demes[target].radius; // combined radius of both demes
        links.push({source, target, nTransmissions, radii});
      } else {
        links[linkIdx].nTransmissions += nTransmissions;
      }
    });
    const maxTransmissions = links.reduce((acc, link) => {
      return link.nTransmissions>acc ? link.nTransmissions : acc;
    }, 0);
    const dist = min([svgWidth, svgHeight]);
    const zmin = dist/10;
    const zmax = dist;
    const idealDistance = (link): number => {
      return link.radii + zmin + Math.exp(-7.5*link.nTransmissions/maxTransmissions)*(zmax-zmin)
    }
    // console.log("maxTransmissions", maxTransmissions, svgWidth, svgHeight, zmin, zmax)
    simulation.force("repel",
      forceLink(links)
        .distance(idealDistance) // sets the rest length (in your layout’s pixels) that the link wants to be. It decides the equilibrium spacing between the two nodes if nothing else acted on them.
        .strength(2) // sets how hard the link pulls/pushes toward that target length each tick
    );
  }
}

function runSimulation(): void {
  if (!DEV_MODE) {
    let tickCounter = 0;
    simulation.alpha(1) // reheat if necessary
      .alphaDecay(0.05)
      .on("tick", () => {
        if (++tickCounter%UPDATE_DOM_EVERY_N_TICKS===0) {
          updateDom()
        }
      })
      .tick(100); // burn-in (doesn't call on("tick") method)
    // Manually trigger a DOM update after burn in, before we (re)start the simulation
    updateDom();
    simulation.restart();

  } else {
    const iv = interval(() => {
      simulation.tick();
      updateDom();
      if (simulation.alpha() < simulation.alphaMin()) {
        iv.stop();
      }
    }, 250);
  }
}

function updateDom(): void {
  self.postMessage({
    data: simulation.nodes().map((d) => ({x: d.x, y: d.y, name: d.name}))
  });
}

type ForceFunction = {
  (alpha: number): void;
  initialize: (demes: DemeForWorkerExtended[]) => void;
  strength: (strength: number) => ForceFunction;
};

/**
 * A d3 force function to move demes such that they span the SVG but don't fall outside it.
 * In other words we take the previous coordinates and shift and scale them treating x & y
 * axes independently (i.e. no rotation)
 */
function forceDistribute(svgWidth: number, svgHeight: number): ForceFunction {
  let nodes: DemeForWorkerExtended[];
  let strength = 1;
  const pad = 10; // pixels, i.e. 10 on each of the 4 sides of the SVG

  function force(alpha: number): void {
    const xMin = min(nodes.map((n) => n.x-n.radius-pad));
    const xMax = max(nodes.map((n) => n.x+n.radius+pad));
    const yMin = min(nodes.map((n) => n.y-n.radius-pad)); // y=0 is top of SVG
    const yMax = max(nodes.map((n) => n.y+n.radius+pad));
    
    const xSpan = xMax - xMin,             ySpan = yMax - yMin;
    const xMidpoint = xMax-xSpan/2,        yMidpoint = yMax-ySpan/2;
    const xScale = svgWidth / xSpan,       yScale = svgHeight / ySpan;
    const xShift = svgWidth/2 - xMidpoint, yShift = svgHeight/2 - yMidpoint;
    
    if (Math.abs(xShift)<1 && Math.abs(xScale-1)<0.01 && Math.abs(yShift)<1 && Math.abs(yScale-1)<0.01) {
      return;
    }

    const z = Math.max(alpha * strength, 1)

    nodes.forEach((n) => {
      const xAim = ((n.x + xShift) - svgWidth/2)*xScale + svgWidth/2;
      const yAim = ((n.y + yShift) - svgHeight/2)*yScale + svgHeight/2;
      n.vx = (xAim - n.x) * z;
      n.vy = (yAim - n.y) * z;
    });
  }

  force.initialize = function _initialize(demes: DemeForWorkerExtended[]): void {
    nodes = demes;
  };

  force.strength = function _strength(s: number): typeof force {
    strength = s;
    return force;
  };

  return force;
}