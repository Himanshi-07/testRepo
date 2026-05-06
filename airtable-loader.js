// ============================================================
// AIRTABLE AUTOMATION LOADER
// Paste this ONCE into: Airtable → Automations → Run a script
//
// Configure the automation's "Input variables":
//   scriptName  → e.g. "weekly-leadership-summary"
//   githubToken → optional — only needed if repo is private
//   branch      → optional, defaults to "main"
//
// The loader fetches the latest version from the repo and runs it.
// Update logic by editing the file in the repo — no re-paste needed.
// ============================================================

const REPO_OWNER = "Himanshi-07";
const REPO_NAME = "testRepo";

const config = input.config();
const scriptName = config.scriptName;
const githubToken = config.githubToken; // optional — not needed for public repo
const branch = config.branch || "main"; // optional — defaults to main

if (!scriptName || !/^[a-zA-Z0-9-_]+$/.test(scriptName)) {
    // Validate scriptName to prevent path traversal in the URL.
    throw new Error("Invalid or missing scriptName in input config");
}

const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${scriptName}.js?ref=${branch}`;

const headers = { Accept: "application/vnd.github.v3.raw" };
if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
}

try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Failed to fetch script "${scriptName}": ${response.status} ${response.statusText} — ${body.substring(0, 200)}`,
        );
    }

    const code = await response.text();

    // Run with Airtable globals passed in explicitly. new Function is used
    // so the loaded script runs in its own scope.
    const fn = new Function(
        "base",
        "output",
        "input",
        `return (${code})(base, output, input)`,
    );

    await fn(base, output, input);
} catch (err) {
    output.set("error", err.message);
    throw new Error(`Loader failed for "${scriptName}": ${err.message}`);
}
