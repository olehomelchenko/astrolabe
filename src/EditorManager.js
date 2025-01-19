export class EditorManager {
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
        this.editor = null;
        this.timeoutId = null;
    }

    setEditor(editor) {
        this.editor = editor;
        this.setupEditorEvents();
    }

    setupEditorEvents() {
        this.editor.onDidChangeModelContent(() => {
            // Skip event handling if in read-only mode
            if (this.snippetManager.readOnlyMode) return;

            this.snippetManager.hasUnsavedChanges = true;
            this.snippetManager.uiManager.updateSaveButton(true);

            // Auto-save to draft
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.snippetManager.saveDraft();
                this.updateVisualization();
            }, 1000);
        });
    }

    revertChanges() {
        const snippet = this.snippetManager.snippets.find(
            s => s.id === this.snippetManager.currentSnippetId
        );
        this.editor.setValue(JSON.stringify(snippet.content, null, 2));
    }

    updateVisualization() {
        try {
            const value = this.editor.getValue();
            const content = JSON.parse(value);
            this.snippetManager.visualizationManager.updateVisualization(content);
        } catch (e) {
            console.error('Invalid JSON:', e);
        }
    }

    updateReadOnlyState(readOnly) {
        if (!this.editor) {
            throw new Error('Editor not initialized');
        }
        this.editor.updateOptions({ readOnly });
    }

    getValue() {
        if (!this.editor) {
            throw new Error('Editor not initialized');
        }
        return this.editor.getValue();
    }

    setValue(content) {
        if (!this.editor) {
            throw new Error('Editor not initialized');
        }
        this.editor.setValue(JSON.stringify(content, null, 2));
    }
}
