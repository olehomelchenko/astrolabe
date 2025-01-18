export class PanelResizer {
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