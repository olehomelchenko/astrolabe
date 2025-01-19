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
}
