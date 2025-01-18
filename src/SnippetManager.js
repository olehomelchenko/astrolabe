export class SnippetManager {
    constructor() {
        this.currentSnippetId = null;
        this.hasUnsavedChanges = false;
        this.loadSnippets();
        this.setupUI();
    }

    loadSnippets() {
        // Try to load from localStorage
        const stored = localStorage.getItem('vegaSnippets');
        this.snippets = stored ? JSON.parse(stored) : defaultSnippets;

        // Initialize localStorage if empty
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
            div.textContent = snippet.name;
            div.onclick = () => this.loadSnippet(snippet.id);
            container.appendChild(div);
        });
    }

    loadSnippet(id) {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            this.currentSnippetId = id;
            this.editor.setValue(JSON.stringify(snippet.content, null, 2));
            this.hasUnsavedChanges = false;
            this.updateSaveButton();
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

    saveCurrentSnippet() {
        if (!this.currentSnippetId) return;

        try {
            const content = JSON.parse(this.editor.getValue());
            const snippetIndex = this.snippets.findIndex(s => s.id === this.currentSnippetId);

            if (snippetIndex !== -1) {
                this.snippets[snippetIndex].content = content;
                this.saveToStorage();
                this.hasUnsavedChanges = false;
                this.updateSaveButton();
            }
        } catch (e) {
            alert('Invalid JSON in editor');
        }
    }

    updateSaveButton() {
        const saveButton = document.getElementById('save-snippet');
        saveButton.disabled = !this.hasUnsavedChanges;
    }

    setupUI() {
        // New snippet button
        document.getElementById('new-snippet').onclick = () => this.createNewSnippet();

        // Save button
        document.getElementById('save-snippet').onclick = () => this.saveCurrentSnippet();

        // Initial render
        this.renderSnippetList();
    }

    setEditor(editor) {
        this.editor = editor;

        // Setup change tracking and visualization update
        let timeoutId = null;
        editor.onDidChangeModelContent(() => {
            this.hasUnsavedChanges = true;
            this.updateSaveButton();

            // Debounce visualization updates
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                try {
                    const value = editor.getValue();
                    this.updateVisualization(value);
                } catch (e) {
                    console.error('Invalid JSON:', e);
                }
            }, 300);
        });

        // Load first snippet if available
        if (this.snippets.length > 0) {
            this.loadSnippet(this.snippets[0].id);
        }
    }

    async updateVisualization(spec) {
        try {
            const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
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