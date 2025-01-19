export class VisualizationManager {
    constructor(containerId = 'vis') {
        this.containerId = containerId;
    }

    async updateVisualization(spec) {
        try {
            const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
            parsedSpec.width = parsedSpec.width || 'container';
            parsedSpec.height = parsedSpec.height || 'container';
            
            await vegaEmbed(`#${this.containerId}`, parsedSpec, {
                actions: true,
                theme: 'light'
            });
        } catch (err) {
            console.error('Error rendering visualization:', err);
            document.getElementById(this.containerId).innerHTML =
                `<div style="color: red; padding: 1rem;">Error rendering visualization: ${err.message}</div>`;
        }
    }
}
