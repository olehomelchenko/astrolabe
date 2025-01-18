export class PanelResizer {
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
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
            this.normalizePanelWidths();
        } else {
            const defaultLayout = {
                snippetWidth: '0.25fr',
                editorWidth: '0.25fr',
                previewWidth: '0.5fr'
            };
            localStorage.setItem('panelLayout', JSON.stringify(defaultLayout));
            document.documentElement.style.setProperty('--snippet-width', defaultLayout.snippetWidth);
            document.documentElement.style.setProperty('--editor-width', defaultLayout.editorWidth);
            document.documentElement.style.setProperty('--preview-width', defaultLayout.previewWidth);
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
        let leftFr = (this.leftWidth + dx) / containerWidth;
        let rightFr = (this.rightWidth - dx) / containerWidth;

        // Ensure minimum width of 0.1fr for each panel
        const minFr = 0.1;
        leftFr = Math.max(minFr, leftFr);
        rightFr = Math.max(minFr, rightFr);

        // Apply new widths based on which handle is being dragged
        if (this.activeHandle === 0) {
            document.documentElement.style.setProperty('--snippet-width', `${leftFr}fr`);
            document.documentElement.style.setProperty('--editor-width', `${rightFr}fr`);
        } else {
            document.documentElement.style.setProperty('--editor-width', `${leftFr}fr`);
            document.documentElement.style.setProperty('--preview-width', `${rightFr}fr`);
        }
        
        this.normalizePanelWidths();
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

        // Update visualization after resize is complete
        if (this.snippetManager && typeof this.snippetManager.updateVisualization === 'function') {
            // Get the current editor value and update visualization
            const editorValue = this.snippetManager.editor.getValue();
            this.snippetManager.updateVisualization(editorValue);
        }
    }

    normalizePanelWidths() {
        const snippetWidth = parseFloat(document.documentElement.style.getPropertyValue('--snippet-width'));
        const editorWidth = parseFloat(document.documentElement.style.getPropertyValue('--editor-width'));
        const previewWidth = parseFloat(document.documentElement.style.getPropertyValue('--preview-width'));
        
        const total = snippetWidth + editorWidth + previewWidth;
        if (total !== 1) {
            const factor = 1 / total;
            document.documentElement.style.setProperty('--snippet-width', `${snippetWidth * factor}fr`);
            document.documentElement.style.setProperty('--editor-width', `${editorWidth * factor}fr`);
            document.documentElement.style.setProperty('--preview-width', `${previewWidth * factor}fr`);
        }
    }
}