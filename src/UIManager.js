export class UIManager {
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
        this.setupEventListeners();
        this.setupSearchInput();
    }

    setupEventListeners() {
        this.setupEventListener('new-snippet', 'onclick', () => this.snippetManager.createNewSnippet());
        this.setupEventListener('save-snippet', 'onclick', () => this.snippetManager.saveCurrentSnippet());
        this.setupEventListener('version-switch', 'onclick', () => {
            this.snippetManager.loadSnippet(this.snippetManager.currentSnippetId, !this.snippetManager.isDraftVersion);
        });
        this.setupEventListener('export-snippets', 'onclick', () => this.snippetManager.storageManager.exportSnippets());
        this.setupEventListener('import-snippets', 'onclick', () => document.getElementById('import-file').click());
        this.setupEventListener('import-file', 'onchange', (e) => this.handleImport(e));
        this.setupEventListener('comment-modal-background', 'onclick', () => this.saveComment());
        this.setupEventListener('save-comment', 'onclick', () => this.saveComment());
    }

    setupEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element[event] = handler;
        }
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

        // Sort snippets by creation date (most recent first)
        snippets.sort((a, b) => b.createdAt - a.createdAt);

        snippets.forEach(snippet => {
            const div = document.createElement('div');
            div.className = `snippet-item ${snippet.id === currentSnippetId ? 'active' : ''}`;
            div.onclick = () => this.snippetManager.loadSnippet(snippet.id);

            const hasChanges = this.snippetManager.hasDraftChanges(snippet.id);
            const indicator = hasChanges ? '🟡' : '🟢';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'snippet-content';
            contentDiv.textContent = `${indicator} ${snippet.name}`;
            contentDiv.title = `Created at: ${new Date(snippet.createdAt).toLocaleString()}`;
            div.appendChild(contentDiv);

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'snippet-buttons';

            const commentButton = this.createButton('💬', 'comment-snippet', (e) => {
                e.stopPropagation();
                this.openCommentModal(snippet.id);
            });
            if (snippet.comment && snippet.comment.trim() !== '') {
                commentButton.classList.add('has-comment');
            }
            buttonsDiv.appendChild(commentButton);

            buttonsDiv.appendChild(this.createButton('✏️', 'edit-snippet', (e) => {
                e.stopPropagation();
                this.snippetManager.renameSnippet(snippet.id);
            }));

            buttonsDiv.appendChild(this.createButton('📄', 'duplicate-snippet', (e) => {
                e.stopPropagation();
                this.snippetManager.duplicateSnippet(snippet.id);
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

    openCommentModal(snippetId) {
        const snippet = this.snippetManager.snippets.find(s => s.id === snippetId);
        if (!snippet) return;

        const commentEditor = window.commentEditor;
        commentEditor.setValue(snippet.comment || '');
        document.getElementById('comment-modal').style.display = 'block';
        document.getElementById('comment-modal-background').style.display = 'block';
        document.getElementById('comment-modal-title').textContent = `Edit comment for snippet: ${snippet.name}`;
        this.currentCommentSnippetId = snippetId;
    }

    saveComment() {
        const commentEditor = window.commentEditor;
        const snippet = this.snippetManager.snippets.find(s => s.id === this.currentCommentSnippetId);
        if (snippet) {
            snippet.comment = commentEditor.getValue();
            this.snippetManager.saveSnippetsAndUpdateUI();
        }
        document.getElementById('comment-modal').style.display = 'none';
        document.getElementById('comment-modal-background').style.display = 'none';
    }

    closeCommentModal() {
        const commentTextarea = document.getElementById('comment-textarea');
        const snippet = this.snippetManager.snippets.find(s => s.id === this.currentCommentSnippetId);
        if (snippet) {
            snippet.comment = commentTextarea.value;
            this.snippetManager.saveSnippetsAndUpdateUI();
        }
        document.getElementById('comment-modal').style.display = 'none';
        document.getElementById('comment-modal-background').style.display = 'none';
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

    setupSearchInput() {
        const searchInput = document.getElementById('snippet-search');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            let filteredSnippets;
            try {
                const regex = new RegExp(query, 'i');
                filteredSnippets = this.snippetManager.snippets.filter(snippet => {
                    const snippetText = JSON.stringify(snippet);
                    return regex.test(snippetText);
                });
            } catch (err) {
                filteredSnippets = this.snippetManager.snippets.filter(snippet => {
                    const snippetText = JSON.stringify(snippet).toLowerCase();
                    return snippetText.includes(query.toLowerCase());
                });
            }
            this.renderSnippetList(filteredSnippets, this.snippetManager.currentSnippetId);
        });
    }
}
