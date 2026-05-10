/**
 * n8n Code node — GitHub Sync: Check if target file changed
 *
 * Place this as Node 2 in the GitHub Sync workflow, right after the Webhook Trigger.
 * It reads the GitHub push payload and checks whether the watched file was modified.
 *
 * Output:
 *   { changed: true/false, ref: "refs/heads/develop", commitCount: 3 }
 *
 * Wire: Webhook Trigger → THIS Code → IF (changed === true) → ...
 */

const TARGET_FILE = "n8n/serverinfo-weekly-email.code.js";

const payload = $input.first().json;
const commits = payload.commits || [];

const changed = commits.some((c) => {
    const touched = [
        ...(c.added || []),
        ...(c.modified || []),
    ];
    return touched.includes(TARGET_FILE);
});

return [
    {
        json: {
            changed,
            ref: payload.ref || "",
            commitCount: commits.length,
            targetFile: TARGET_FILE,
        },
    },
];
