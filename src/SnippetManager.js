import { StorageManager } from './StorageManager.js';
import { UIManager } from './UIManager.js';
import { VisualizationManager } from './VisualizationManager.js';
import { EditorManager } from './EditorManager.js';

export class SnippetManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.uiManager = new UIManager(this);
        this.visualizationManager = new VisualizationManager();
        this.editorManager = new EditorManager(this);

        this.currentSnippetId = null;
        this.hasUnsavedChanges = false;
        this.isDraftVersion = false;
        this.readOnlyMode = false;

        this.snippets = this.storageManager.loadSnippets();
        this.uiManager.renderSnippetList(this.snippets, this.currentSnippetId);
    }

    setEditor(editor) {
        this.editorManager.setEditor(editor);
        if (this.snippets.length > 0) {
            this.loadSnippet(this.snippets[0].id);
        }
    }

    hasDraftChanges(id) {
        const snippet = this.snippets.find(s => s.id === id);
        return snippet && snippet.draft !== undefined;
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
            
            this.editorManager.setValue(content);
            this.hasUnsavedChanges = false;
            this.updateReadOnlyState();
            this.uiManager.updateSaveButton(this.hasUnsavedChanges);
            this.uiManager.updateVersionSwitch(this.currentSnippetId, this.isDraftVersion, this.hasDraftChanges(this.currentSnippetId));
            this.uiManager.renderSnippetList(this.snippets, this.currentSnippetId);
            this.visualizationManager.updateVisualization(content);
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
        this.storageManager.saveSnippets(this.snippets);
        this.loadSnippet(id);
    }

    saveDraft() {
        if (!this.currentSnippetId) return;

        try {
            const content = JSON.parse(this.editorManager.getValue());
            const snippetIndex = this.snippets.findIndex(s => s.id === this.currentSnippetId);
            
            if (snippetIndex !== -1) {
                const currentSnippet = this.snippets[snippetIndex];
                if (JSON.stringify(content) !== JSON.stringify(currentSnippet.content)) {
                    this.snippets[snippetIndex].draft = content;
                    this.isDraftVersion = true;
                    this.storageManager.saveSnippets(this.snippets);
                    this.uiManager.renderSnippetList(this.snippets, this.currentSnippetId);
                    this.uiManager.updateVersionSwitch(this.currentSnippetId, this.isDraftVersion, this.hasDraftChanges(this.currentSnippetId));
                    this.visualizationManager.updateVisualization(content);
                }
            }
        } catch (e) {
            console.error('Invalid JSON in editor');
        }
    }

    saveCurrentSnippet() {
        if (!this.currentSnippetId) return;

        try {
            const content = JSON.parse(this.editorManager.getValue());
            const snippetIndex = this.snippets.findIndex(s => s.id === this.currentSnippetId);

            if (snippetIndex !== -1) {
                this.snippets[snippetIndex].content = content;
                delete this.snippets[snippetIndex].draft; // Remove draft after saving
                this.storageManager.saveSnippets(this.snippets);
                this.hasUnsavedChanges = false;
                this.isDraftVersion = false;
                this.uiManager.updateSaveButton(this.hasUnsavedChanges);
                this.uiManager.updateVersionSwitch(this.currentSnippetId, this.isDraftVersion, this.hasDraftChanges(this.currentSnippetId));
                this.uiManager.renderSnippetList(this.snippets, this.currentSnippetId);
            }
        } catch (e) {
            alert('Invalid JSON in editor');
        }
    }

    handleReadOnlyOverride() {
        this.readOnlyMode = false;
        this.isDraftVersion = true;
        delete this.snippets.find(s => s.id === this.currentSnippetId).draft;
        this.storageManager.saveSnippets(this.snippets);
        this.uiManager.updateVersionSwitch(this.currentSnippetId, this.isDraftVersion, this.hasDraftChanges(this.currentSnippetId));
        this.uiManager.renderSnippetList(this.snippets, this.currentSnippetId);
    }

    // Remove these methods as they're now in UIManager
    updateSaveButton() {
        this.uiManager.updateSaveButton(this.hasUnsavedChanges);
    }

    updateVersionSwitch() {
        this.uiManager.updateVersionSwitch(
            this.currentSnippetId,
            this.isDraftVersion,
            this.hasDraftChanges(this.currentSnippetId)
        );
    }

    updateReadOnlyState() {
        const hasChanges = this.hasDraftChanges(this.currentSnippetId);
        this.readOnlyMode = hasChanges && !this.isDraftVersion;
        this.editorManager.updateReadOnlyState(this.readOnlyMode);
    }
}