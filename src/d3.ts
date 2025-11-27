import * as d3 from "d3";
import dataJson from "../d3data.json";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  radius: number;
  citing_patents_count: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function initializeD3() {
  const parent = document.getElementById("d3")!;
  const width = parent.clientWidth;
  const height = parent.clientHeight;
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");
  parent.append(svg.node()!);

  const g = svg.append("g");

  const data: GraphData = dataJson as GraphData;
  const simulation = d3
    .forceSimulation(data.nodes)
    .force(
      "link",
      d3.forceLink(data.links).id((d) => (d as Node).id)
    )
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const link = g
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));
  const node = g
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", (d) => color(d.group));

  node.append("title").text((d) => d.id);

  node.call(
    (d3 as any)
      .drag()
      .on("start", (event: any) => {
        if (!event.active) {
          simulation.alphaTarget(0.3).restart();
        }
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: any) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: any) => {
        if (!event.active) {
          simulation.alphaTarget(0);
        }
        event.subject.fx = null;
        event.subject.fy = null;
      })
  );

  function zoomed({ transform }: any) {
    g.attr("transform", transform);
  }

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .on("zoom", zoomed)
    .filter((event) => event.button === 2 || event.type === "wheel");

  svg.on("contextmenu", (event) => {
    event.preventDefault();
  });

  svg.call(zoom as any);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => (d.source as Node).x!)
      .attr("y1", (d) => (d.source as Node).y!)
      .attr("x2", (d) => (d.target as Node).x!)
      .attr("y2", (d) => (d.target as Node).y!);
    node.attr("cx", (d) => (d as Node).x!).attr("cy", (d) => (d as Node).y!);
  });
}
