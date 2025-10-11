import initializeMatter from "./matter";
import "./style.css";

document.addEventListener("DOMContentLoaded", function (this: Document) {
  this.getElementById("expression-input")!.addEventListener(
    "input",
    function (this: HTMLInputElement) {
      this.value = this.value.replace(/\\/g, "\u03BB");
    }
  );
});

initializeMatter();
