import { initializeMatter, addExpression } from "./matter";
import "./style.css";

document.addEventListener("DOMContentLoaded", function (this: Document) {
  initializeMatter();
  const expressionInput = this.getElementById(
    "expression-input"
  )! as HTMLInputElement;
  expressionInput.addEventListener("input", function (this: HTMLInputElement) {
    this.value = this.value.replace(/\\/g, "\u03BB");
    addExpression(this.value);
  });
  addExpression(expressionInput.value);
});
