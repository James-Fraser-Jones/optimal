import { initializeMatter, addExpression } from "./matter";
import { setupEditor } from "./codemirror";
import "./style.css";

setupEditor("codemirror");
initializeMatter("matter");
addExpression("(λx.x)(λy.y)");
