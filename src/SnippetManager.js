import { defaultSnippets } from './config.js';

export class SnippetManager {
    constructor() {
        this.currentSnippetId = null;
        this.hasUnsavedChanges = false;
        this.isDraftVersion = false;
        this.readOnlyMode = false;
        this.loadSnippets();
        this.setupUI();
    }

    hasDraftChanges(id) {
        const snippet = this.snippets.find(s => s.id === id);
        return snippet && snippet.draft !== undefined;
    }

    loadSnippets() {
        const stored = localStorage.getItem('vegaSnippets');
        this.snippets = stored ? JSON.parse(stored) : defaultSnippets;
        if (!stored) {
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem('vegaSnippets', JSON.stringify(this.snippets));
    }

    renderSnippetList() {
        const container = document.getElementById('snippet-list');
        container.innerHTML = '';

        this.snippets.forEach(snippet => {
            const div = document.createElement('div');
            div.className = `snippet-item ${snippet.id === this.currentSnippetId ? 'active' : ''}`;
            const hasChanges = this.hasDraftChanges(snippet.id);
            const indicator = hasChanges ? '🟡' : '🟢';
            div.textContent = `${indicator} ${snippet.name}`;
            div.onclick = () => this.loadSnippet(snippet.id);
            container.appendChild(div);
        });
    }

    loadSnippet(id, forceDraft = null) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            this.currentSnippetId = id;
            const hasChanges = this.hasDraftChanges(id);
            
            this.isDraftVersion = forceDraft !== null ? forceDraft : hasChanges;
            const content = this.isDraftVersion && snippet.draft ? 
                snippet.draft : 
                snippet.content;
            
            this.editor.setValue(JSON.stringify(content, null, 2));
            this.hasUnsavedChanges = false;
            this.updateReadOnlyState();
            this.updateSaveButton();
            this.updateVersionSwitch();
            this.renderSnippetList();
        }
    }

    createNewSnippet() {
        const name = prompt('Enter snippet name:', 'New Snippet');
        if (!name) return;

        const id = 'snippet-' + Date.now();
        const newSnippet = {
            id,
            name,
            content: {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "description": "New visualization",
                "mark": "bar"
            }
        };

        this.snippets.push(newSnippet);
        this.saveToStorage();
        this.loadSnippet(id);
    }

    saveDraft() {
        if (!this.currentSnippetId) return;

        try {
            const content = JSON.parse(this.editor.getValue());
            const snippetIndex = this.snippets.findIndex(s => s.id === this.currentSnippetId);
            
            if (snippetIndex !== -1) {
                const currentSnippet = this.snippets[snippetIndex];
                if (JSON.stringify(content) !== JSON.stringify(currentSnippet.content)) {
                    this.snippets[snippetIndex].draft = content;
                    this.isDraftVersion = true;
                    this.saveToStorage();
                    this.renderSnippetList();
                    this.updateVersionSwitch();
                }
            }
        } catch (e) {
            console.error('Invalid JSON in editor');
        }
    }

    saveCurrentSnippet() {
        if (!this.currentSnippetId) return;

        try {
            const content = JSON.parse(this.editor.getValue());
            const snippetIndex = this.snippets.findIndex(s => s.id === this.currentSnippetId);

            if (snippetIndex !== -1) {
                this.snippets[snippetIndex].content = content;
                delete this.snippets[snippetIndex].draft; // Remove draft after saving
                this.saveToStorage();
                this.hasUnsavedChanges = false;
                this.isDraftVersion = false;
                this.updateSaveButton();
                this.updateVersionSwitch();
                this.renderSnippetList();
            }
        } catch (e) {
            alert('Invalid JSON in editor');
        }
    }

    updateSaveButton() {
        const saveButton = document.getElementById('save-snippet');
        saveButton.disabled = !this.hasUnsavedChanges;
    }

    updateVersionSwitch() {
        const versionSwitch = document.getElementById('version-switch');
        if (!versionSwitch) return;

        const hasChanges = this.hasDraftChanges(this.currentSnippetId);
        versionSwitch.style.display = hasChanges ? 'block' : 'none';
        
        const buttonText = this.isDraftVersion ? 
            'View Saved Version (Read-only)' : 
            'Switch to Draft Version (Editable)';
        versionSwitch.textContent = buttonText;
    }

    setupUI() {
        // New snippet button
        document.getElementById('new-snippet').onclick = () => this.createNewSnippet();

        // Save button
        document.getElementById('save-snippet').onclick = () => this.saveCurrentSnippet();

        // Version switch button
        const versionSwitch = document.getElementById('version-switch');
        versionSwitch.onclick = () => {
            this.loadSnippet(this.currentSnippetId, !this.isDraftVersion);
        };

        // Initial render
        this.renderSnippetList();
    }

    setEditor(editor) {
        this.editor = editor;

        let timeoutId = null;
        editor.onDidChangeModelContent((e) => {
            // Only show warning if we're in read-only mode AND this is a user edit
            // (not a programmatic change from loadSnippet)
            if (this.readOnlyMode && e.isUndoRedo === false) {
                if (confirm('Editing the saved version will overwrite your draft. Continue?')) {
                    this.readOnlyMode = false;
                    this.isDraftVersion = true;
                    delete this.snippets.find(s => s.id === this.currentSnippetId).draft;
                    this.saveToStorage();
                    this.updateVersionSwitch();
                    this.renderSnippetList();
                } else {
                    // Revert the change
                    const snippet = this.snippets.find(s => s.id === this.currentSnippetId);
                    this.editor.setValue(JSON.stringify(snippet.content, null, 2));
                    return;
                }
            }

            this.hasUnsavedChanges = true;
            this.updateSaveButton();

            // Auto-save to draft
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.saveDraft();
                try {
                    const value = editor.getValue();
                    this.updateVisualization(value);
                } catch (e) {
                    console.error('Invalid JSON:', e);
                }
            }, 1000);
        });

        // Load first snippet if available
        if (this.snippets.length > 0) {
            this.loadSnippet(this.snippets[0].id);
        }
    }

    updateReadOnlyState() {
        const hasChanges = this.hasDraftChanges(this.currentSnippetId);
        this.readOnlyMode = hasChanges && !this.isDraftVersion;
        this.editor.updateOptions({ readOnly: this.readOnlyMode });
    }

    async updateVisualization(spec) {
        try {
            const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
            parsedSpec.width = parsedSpec.width? parsedSpec.width : 'container';
            parsedSpec.height = parsedSpec.height? parsedSpec.height : 'container';
            await vegaEmbed('#vis', parsedSpec, {
                actions: true, // This adds the export/view source buttons
                theme: 'light'
            });
        } catch (err) {
            console.error('Error rendering visualization:', err);
            // Optionally show error in the preview panel
            document.getElementById('vis').innerHTML =
                `<div style="color: red; padding: 1rem;">Error rendering visualization: ${err.message}</div>`;
        }
    }
}