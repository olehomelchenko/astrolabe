import { defaultSnippets } from './config.js';

export class StorageManager {
    constructor() {
        this.SNIPPETS_KEY = 'vegaSnippets';
    }

    loadSnippets() {
        const stored = localStorage.getItem(this.SNIPPETS_KEY);
        return stored ? JSON.parse(stored) : defaultSnippets;
    }

    saveSnippets(snippets) {
        localStorage.setItem(this.SNIPPETS_KEY, JSON.stringify(snippets));
    }

    exportSnippets() {
        const snippets = this.loadSnippets();
        const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'astrolabe-snippets.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importSnippets(file) {
        try {
            const text = await file.text();
            const snippets = JSON.parse(text);
            if (!Array.isArray(snippets)) {
                throw new Error('Invalid snippets format');
            }
            this.saveSnippets(snippets);
            return snippets;
        } catch (err) {
            throw new Error('Failed to import snippets: ' + err.message);
        }
    }
}
