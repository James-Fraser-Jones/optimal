import { basicSetup } from "codemirror";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

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

let editorView: EditorView;

export function setupEditor(parentName: string) {
  editorView = new EditorView({
    doc: "(λx.x)(λy.y)",
    extensions: [basicSetup, lambdaExtension],
    parent: document.getElementById(parentName)!,
  });
}
