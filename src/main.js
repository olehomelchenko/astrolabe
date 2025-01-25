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

    // Initialize Monaco editor for comment modal
    window.commentEditor = monaco.editor.create(document.getElementById('comment-editor'), {
        language: 'markdown',
        theme: 'vs-light',
        wordWrap: 'on',
        minimap: { enabled: false },
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true
    });

    // Fetch JSON schemas
    const vegaSchema = await fetch('https://vega.github.io/schema/vega/v5.json').then(response => response.json());
    const vegaLiteSchema = await fetch('https://vega.github.io/schema/vega-lite/v5.json').then(response => response.json());

    // Configure JSON schema
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
            {
                uri: "https://vega.github.io/schema/vega/v5.json",
                fileMatch: ["*"],
                schema: vegaSchema
            },
            {
                uri: "https://vega.github.io/schema/vega-lite/v5.json",
                fileMatch: ["*"],
                schema: vegaLiteSchema
            }
        ]
    });

    const resizer = new PanelResizer(snippetManager);
    window.editor = editor;
    snippetManager.setEditor(editor);
});
