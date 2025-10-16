import { basicSetup } from "codemirror";
import { EditorSelection, type Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  scrollPastEnd,
} from "@codemirror/view";
import { addExpression } from "./matter";
import { oneDark } from "@codemirror/theme-one-dark";

function regexClassifier(regex: string, className: string): Extension {
  const matcherDecorator = new MatchDecorator({
    regexp: new RegExp(regex, "g"),
    decoration: () => Decoration.mark({ class: className }),
  });
  return ViewPlugin.define(
    (view) => ({
      decorations: matcherDecorator.createDeco(view),
      update(update) {
        this.decorations = matcherDecorator.updateDeco(
          update,
          this.decorations
        );
      },
    }),
    {
      decorations: (v) => v.decorations,
    }
  );
}
const highlightParens = regexClassifier(`\\(|\\)`, "token-paren");
const highlightBinders = regexClassifier(`λ|\\.`, "token-binder");

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

const largerFontTheme = EditorView.theme({
  "&.cm-editor": {
    fontSize: "20px",
    height: "100%",
  },
});

let editorView: EditorView;

export function initializeCodeMirror() {
  const newlines = "\n".repeat(49);
  let input = "(λx.x)(λy.y)";
  input += newlines;
  editorView = new EditorView({
    doc: input,
    extensions: [
      basicSetup,
      lambdaExtension,
      changeListener,
      scrollPastEnd(),
      oneDark,
      largerFontTheme,
      highlightParens,
      highlightBinders,
    ],
    parent: document.getElementById("codemirror")!,
  });
  addExpression(input);
}
