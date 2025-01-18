import { PanelResizer } from './PanelResizer.js';
import { SnippetManager } from './SnippetManager.js';

// Initialize Monaco
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs' } });

const snippetManager = new SnippetManager();

require(['vs/editor/editor.main'], async function () {
    const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        language: 'json',
        theme: 'vs-light',
        wordWrap: 'on',
        minimap: { enabled: false },
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true
    });

    const resizer = new PanelResizer();
    window.editor = editor;

    snippetManager.setEditor(editor);
});
