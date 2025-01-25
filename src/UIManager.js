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
        document.getElementById('export-snippets').onclick = () => this.snippetManager.storageManager.exportSnippets();
        document.getElementById('import-snippets').onclick = () => document.getElementById('import-file').click();
        document.getElementById('import-file').onchange = (e) => this.handleImport(e);
    }

    async handleImport(e) {
        if (e.target.files.length > 0) {
            try {
                const snippets = await this.snippetManager.storageManager.importSnippets(e.target.files[0]);
                this.snippetManager.snippets = snippets;
                this.renderSnippetList(snippets, this.snippetManager.currentSnippetId);
                if (snippets.length > 0) {
                    this.snippetManager.loadSnippet(snippets[0].id);
                }
                e.target.value = ''; // Reset file input
            } catch (err) {
                alert(err.message);
            }
        }
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

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'snippet-buttons';

            buttonsDiv.appendChild(this.createButton('✏️', 'edit-snippet', (e) => {
                e.stopPropagation();
                this.snippetManager.renameSnippet(snippet.id);
            }));

            buttonsDiv.appendChild(this.createButton('❌', 'delete-snippet', (e) => {
                e.stopPropagation();
                this.snippetManager.deleteSnippet(snippet.id);
            }));
            
            div.appendChild(buttonsDiv);
            container.appendChild(div);
        });
    }

    createButton(innerHTML, className, onClick) {
        const button = document.createElement('button');
        button.className = className;
        button.innerHTML = innerHTML;
        button.onclick = onClick;
        return button;
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
            'View Saved' : 
            'View Draft';
    }
}
