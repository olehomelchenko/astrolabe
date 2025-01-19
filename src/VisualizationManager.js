export class VisualizationManager {
    constructor(containerId = 'vis') {
        this.containerId = containerId;
    }

    async updateVisualization(spec) {
        try {
            const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
            const displaySpec = {
                ...parsedSpec,
                width: parsedSpec.width || 'container',
                height: parsedSpec.height || 'container'
            };
            
            await vegaEmbed(`#${this.containerId}`, displaySpec, {
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
