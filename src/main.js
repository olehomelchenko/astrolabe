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

    const resizer = new PanelResizer(snippetManager);
    window.editor = editor;

    snippetManager.setEditor(editor);

    document.getElementById('export-snippets').addEventListener('click', () => {
        snippetManager.storageManager.exportSnippets();
    });

    document.getElementById('import-snippets').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            try {
                const snippets = await snippetManager.storageManager.importSnippets(e.target.files[0]);
                snippetManager.snippets = snippets;
                snippetManager.uiManager.renderSnippetList(snippets, snippetManager.currentSnippetId);
                if (snippets.length > 0) {
                    snippetManager.loadSnippet(snippets[0].id);
                }
                e.target.value = ''; // Reset file input
            } catch (err) {
                alert(err.message);
            }
        }
    });
});
