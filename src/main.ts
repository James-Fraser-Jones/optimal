import { initializeMatter } from "./matter";
import { initializeCodeMirror } from "./codemirror";
import { initializeD3, type GraphData } from "./d3";
import dataJson2 from "../d3data2.json";
import dataJson3 from "../d3data3.json";
import "./style.css";

initializeMatter();
initializeCodeMirror();
initializeD3(dataJson2 as GraphData);
setTimeout(() => {
  initializeD3(dataJson3 as GraphData);
}, 5000);
