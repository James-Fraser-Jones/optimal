import { EditorView, basicSetup } from "codemirror";

export function setupEditor(parentName: string) {
  const editorView = new EditorView({
    doc: "(λx.x)(λy.y)",
    extensions: [basicSetup],
    parent: document.getElementById(parentName)!,
  });
}
