
// Default snippets
const defaultSnippets = [
    {
        id: 'simple-bar',
        name: 'Simple Bar Chart',
        content: {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "A simple bar chart with embedded data.",
            "data": {
                "values": [
                    { "category": "A", "value": 28 },
                    { "category": "B", "value": 55 },
                    { "category": "C", "value": 43 }
                ]
            },
            "mark": "bar",
            "encoding": {
                "x": { "field": "category", "type": "nominal" },
                "y": { "field": "value", "type": "quantitative" }
            }
        }
    },
    {
        id: 'scatter-plot',
        name: 'Basic Scatter Plot',
        content: {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "A scatter plot example.",
            "data": {
                "values": [
                    { "x": 1, "y": 28 }, { "x": 2, "y": 55 }, { "x": 3, "y": 43 }
                ]
            },
            "mark": "point",
            "encoding": {
                "x": { "field": "x", "type": "quantitative" },
                "y": { "field": "y", "type": "quantitative" }
            }
        }
    }
];

class PanelResizer {
    constructor() {
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.loadLayout();
        this.initializeResizeHandles();
    }

    loadLayout() {
        const stored = localStorage.getItem('panelLayout');
        if (stored) {
            const layout = JSON.parse(stored);
            document.documentElement.style.setProperty('--snippet-width', layout.snippetWidth);
            document.documentElement.style.setProperty('--editor-width', layout.editorWidth);
            document.documentElement.style.setProperty('--preview-width', layout.previewWidth);
        }
    }

    saveLayout() {
        const layout = {
            snippetWidth: document.documentElement.style.getPropertyValue('--snippet-width'),
            editorWidth: document.documentElement.style.getPropertyValue('--editor-width'),
            previewWidth: document.documentElement.style.getPropertyValue('--preview-width')
        };
        localStorage.setItem('panelLayout', JSON.stringify(layout));
    }

    initializeResizeHandles() {
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach((handle, index) => {
            handle.addEventListener('mousedown', (e) => this.handleDragStart(e, index));
        });
    }

    handleDragStart(e, handleIndex) {
        this.activeHandle = handleIndex;
        this.startX = e.clientX;
        this.handle = e.target;
        this.handle.classList.add('active');

        // Get the panels adjacent to the handle
        const panels = document.querySelectorAll('.panel');
        this.leftPanel = panels[handleIndex];
        this.rightPanel = panels[handleIndex + 1];

        // Store initial widths
        this.leftWidth = this.leftPanel.getBoundingClientRect().width;
        this.rightWidth = this.rightPanel.getBoundingClientRect().width;

        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
    }

    handleDrag(e) {
        if (!this.handle) return;

        const dx = e.clientX - this.startX;
        const containerWidth = document.querySelector('.container').getBoundingClientRect().width;

        // Calculate new widths as fractions
        const newLeftWidth = `${(this.leftWidth + dx) / containerWidth}fr`;
        const newRightWidth = `${(this.rightWidth - dx) / containerWidth}fr`;

        // Apply new widths based on which handle is being dragged
        if (this.activeHandle === 0) {
            document.documentElement.style.setProperty('--snippet-width', newLeftWidth);
            document.documentElement.style.setProperty('--editor-width', newRightWidth);
        } else {
            document.documentElement.style.setProperty('--editor-width', newLeftWidth);
            document.documentElement.style.setProperty('--preview-width', newRightWidth);
        }
    }

    handleDragEnd() {
        if (!this.handle) return;

        this.handle.classList.remove('active');
        this.handle = null;
        this.saveLayout();

        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);

        // Trigger Monaco editor resize
        if (window.editor) {
            window.editor.layout();
        }
    }
}

// Snippet management
class SnippetManager {
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

// Initialize Monaco
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs' } });

const snippetManager = new SnippetManager();

require(['vs/editor/editor.main'], async function () {
    // Create editor instance
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

    // Connect editor to snippet manager
    snippetManager.setEditor(editor);
});
