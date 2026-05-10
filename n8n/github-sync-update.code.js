/**
 * n8n Code node — GitHub Sync: Patch the weekly email workflow
 *
 * Place this as the final Code node in the GitHub Sync workflow.
 * It receives two inputs:
 *   - Item 0: raw JS file content (string) from GitHub (HTTP Request node)
 *   - Item 1: current workflow JSON from n8n API GET (HTTP Request node)
 *
 * It finds the Code node inside the weekly email workflow and replaces
 * its jsCode parameter with the latest content from GitHub.
 *
 * The output is the full patched workflow object — pass it directly
 * to the final HTTP Request node that does PATCH /api/v1/workflows/{id}.
 *
 * Wire:
 *   HTTP (GitHub raw) ─┐
 *                       ├─ Merge → THIS Code → HTTP (n8n PATCH)
 *   HTTP (n8n GET)   ─┘
 *
 * IMPORTANT: Set the Merge node to "Combine" mode → "Combine by position".
 */

// Item 0 = raw JS from GitHub; Item 1 = workflow JSON from n8n API
const rawCode = $input.all()[0].json.data;         // n8n returns text responses under .data
const workflow = $input.all()[1].json;

if (!rawCode || typeof rawCode !== "string") {
    throw new Error("GitHub raw file content is empty or not a string. Check HTTP Request node response format (set to Text).");
}

if (!workflow || !Array.isArray(workflow.nodes)) {
    throw new Error("n8n workflow JSON is missing or has no nodes array. Check the n8n GET request and API key.");
}

// Find the Code node — matches by type; if you have multiple Code nodes,
// change this to match by name: n.name === "Build Email"
const codeNodeIndex = workflow.nodes.findIndex(
    (n) => n.type === "n8n-nodes-base.code"
);

if (codeNodeIndex === -1) {
    throw new Error("No Code node found in the weekly email workflow. Make sure the workflow ID is correct.");
}

// Replace the jsCode parameter with the latest file contents from GitHub
workflow.nodes[codeNodeIndex].parameters.jsCode = rawCode;

return [{ json: workflow }];
