export class UIManager {
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('new-snippet').onclick = () => this.snippetManager.createNewSnippet();
        document.getElementById('save-snippet').onclick = () => this.snippetManager.saveCurrentSnippet();
        document.getElementById('version-switch').onclick = () => {
            this.snippetManager.loadSnippet(this.snippetManager.currentSnippetId, !this.snippetManager.isDraftVersion);
        };
    }

    renderSnippetList(snippets, currentSnippetId) {
        const container = document.getElementById('snippet-list');
        container.innerHTML = '';

        snippets.forEach(snippet => {
            const div = document.createElement('div');
            div.className = `snippet-item ${snippet.id === currentSnippetId ? 'active' : ''}`;
            div.onclick = () => this.snippetManager.loadSnippet(snippet.id);
            
            const hasChanges = this.snippetManager.hasDraftChanges(snippet.id);
            const indicator = hasChanges ? '🟡' : '🟢';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'snippet-content';
            contentDiv.textContent = `${indicator} ${snippet.name}`;
            div.appendChild(contentDiv);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-snippet';
            deleteButton.innerHTML = '❌';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                this.snippetManager.deleteSnippet(snippet.id);
            };
            div.appendChild(deleteButton);
            
            container.appendChild(div);
        });
    }

    updateSaveButton(hasUnsavedChanges) {
        const saveButton = document.getElementById('save-snippet');
        saveButton.disabled = !hasUnsavedChanges;
    }

    updateVersionSwitch(currentSnippetId, isDraftVersion, hasDraftChanges) {
        const versionSwitch = document.getElementById('version-switch');
        if (!versionSwitch) return;

        versionSwitch.style.display = hasDraftChanges ? 'block' : 'none';
        versionSwitch.textContent = isDraftVersion ? 
            'View Saved Version (Read-only)' : 
            'Switch to Draft Version (Editable)';
    }
}
