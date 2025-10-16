import { basicSetup } from "codemirror";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { addExpression } from "./matter";

const lambdaExtension = EditorView.inputHandler.of((view, from, to, text) => {
  if (text === "\\") {
    view.dispatch({
      changes: { from, to, insert: "λ" },
      selection: EditorSelection.cursor(from + 1),
      userEvent: "input.replace.lambda",
    });
    return true;
  }
  return false;
});

const changeListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const currentText = update.state.doc.toString();
    addExpression(currentText);
  }
});

let editorView: EditorView;

export function initializeCodeMirror() {
  const input = "(λx.x)(λy.y)";
  editorView = new EditorView({
    doc: input,
    extensions: [basicSetup, lambdaExtension, changeListener],
    parent: document.getElementById("codemirror")!,
  });
  addExpression(input);
}
