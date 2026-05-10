/**
 * n8n Code node — ServerInfo weekly email (Done / In progress)
 *
 * To auto-load this file from GitHub on each run (no n8n API), use
 *   n8n/build-email-loader-from-github.code.js in the Code node instead of pasting this file.
 *
 * Paste this entire file into an n8n "Code" node that runs AFTER an HTTP Request
 * node that GETs Airtable:
 *   GET https://api.airtable.com/v0/{BASE_ID}/ServerInfo
 *   Headers: Authorization: Bearer {PAT}
 *
 * Wire: Schedule → HTTP (Airtable) → THIS Code → Send Email
 *
 * Field names must match your base exactly ("Done", "In progress").
 */

const data = $input.first().json;
const records = data.records || [];

const done = [];
const inProgress = [];
const other = [];

function assigneeLabel(f) {
    const a = f.Assignee;
    if (!a) return "—";
    if (Array.isArray(a)) {
        return a.map((x) => x.name || x.email || String(x)).join(", ");
    }
    return a.name || a.email || String(a);
}

for (const r of records) {
    const f = r.fields || {};
    const name = f.Name || "(no name)";
    const status = f.Status || "Unknown";
    const who = assigneeLabel(f);
    const line = `${name} — ${who}`;

    if (status === "Done") {
        done.push(line);
    } else if (status === "In progress") {
        inProgress.push(line);
    } else {
        other.push(`${name} — ${status} — ${who}`);
    }
}

const subject = `ServerInfo weekly: ${done.length} done, ${inProgress.length} in progress`;

const html =
    `<p><strong>Done (${done.length})</strong></p>` +
    `<ul>${done.length ? done.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : "<li>None</li>"}</ul>` +
    `<p><strong>In progress (${inProgress.length})</strong></p>` +
    `<ul>${inProgress.length ? inProgress.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : "<li>None</li>"}</ul>` +
    (other.length
        ? `<p><strong>Other</strong></p><ul>${other.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
        : "");

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

return [
    {
        json: {
            subject,
            html,
            counts: { done: done.length, inProgress: inProgress.length },
        },
    },
];
