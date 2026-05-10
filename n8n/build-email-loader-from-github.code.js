/**
 * n8n Code node — Build email using latest script from GitHub (no n8n API)
 *
 * Replace your static "Build Email" Code node with THIS file when you want
 * GitHub `main` to always be the source of truth on every workflow run.
 *
 * Wire: … → HTTP GET Airtable (returns { records: [...] }) → THIS node → POST Airtable webhook
 *
 * SECURITY: This runs code downloaded from a fixed raw URL (your repo). Anyone who can
 * push to that path can change what executes here. Prefer branch protection + reviews.
 * Workspace rule "avoid Function on dynamic input" is consciously traded for free-tier sync.
 */

const SCRIPT_URL =
    "https://raw.githubusercontent.com/Himanshi-07/testRepo/main/n8n/serverinfo-weekly-email.code.js";

const airtablePayload = $input.first().json;

const scriptText = await this.helpers.httpRequest({
    url: SCRIPT_URL,
    method: "GET",
    headers: { Accept: "text/plain,*/*" },
    responseFormat: "text",
});

if (!scriptText || typeof scriptText !== "string") {
    throw new Error("Could not load script from GitHub raw URL (empty response).");
}

const $inputProxy = {
    first: () => ({ json: airtablePayload }),
    all: () => [{ json: airtablePayload }],
};

let runResult;
try {
    runResult = new Function("$input", `"use strict";\n${scriptText}`)($inputProxy);
} catch (err) {
    throw new Error(`Loaded script crashed: ${err.message}`);
}

if (!Array.isArray(runResult)) {
    throw new Error("Script must return an array of n8n items, e.g. return [{ json: { subject, html } }];");
}

return runResult;
