export const defaultSnippets = [
    {
        id: 'simple-bar',
        name: 'Simple Bar Chart',
        content: {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "A simple bar chart with embedded data.",
            "data": {
                "values": [
                    { "category": "A", "value": 28 },
                    { "category": "B", "value": 55 },
                    { "category": "C", "value": 43 }
                ]
            },
            "mark": "bar",
            "encoding": {
                "x": { "field": "category", "type": "nominal" },
                "y": { "field": "value", "type": "quantitative" }
            }
        }
    },
    {
        id: 'scatter-plot',
        name: 'Basic Scatter Plot',
        content: {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "A scatter plot example.",
            "data": {
                "values": [
                    { "x": 1, "y": 28 }, { "x": 2, "y": 55 }, { "x": 3, "y": 43 }
                ]
            },
            "mark": "point",
            "encoding": {
                "x": { "field": "x", "type": "quantitative" },
                "y": { "field": "y", "type": "quantitative" }
            }
        }
    }
];
