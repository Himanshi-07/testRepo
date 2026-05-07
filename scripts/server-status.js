// Server Status Summary
//
// Runs in GitHub Actions on an hourly cron schedule.
// 1. Fetches all records from the "Servers" table in Airtable
// 2. Counts them by Status (Done / In progress / other)
// 3. Builds an HTML summary table
// 4. POSTs the result to an Airtable Automation webhook
//    The Airtable Automation then sends the email.
//
// Required env vars (set as GitHub Actions Secrets):
//   AIRTABLE_API_KEY       Personal access token with data.records:read
//   AIRTABLE_BASE_ID       e.g. app0pR4yvcZDywmDf
//   SERVER_WEBHOOK_URL     Webhook URL from the Airtable Automation trigger
//
// Optional:
//   SERVERS_TABLE          Defaults to "Servers"

const { listAllRecords } = require("./lib/airtable");

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildHtmlTable(records) {
    const rows = records
        .map((r) => {
            const name     = escapeHtml(r.fields["Name"]     || "(unnamed)");
            const status   = escapeHtml(r.fields["Status"]   || "Unknown");
            const assignee = escapeHtml(r.fields["Assignee"] || "—");

            const statusColor = r.fields["Status"] === "Done"
                ? "background:#d4edda;color:#155724;"
                : r.fields["Status"] === "In progress"
                    ? "background:#fff3cd;color:#856404;"
                    : "background:#f8f9fa;color:#333;";

            return (
                `<tr>` +
                `<td style="border:1px solid #ddd;padding:8px;">${name}</td>` +
                `<td style="border:1px solid #ddd;padding:8px;${statusColor}font-weight:bold;">${status}</td>` +
                `<td style="border:1px solid #ddd;padding:8px;">${assignee}</td>` +
                `</tr>`
            );
        })
        .join("");

    return (
        `<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">` +
        `<tr style="background-color:#4472C4;color:white;">` +
        `<th style="border:1px solid #ddd;padding:8px;text-align:left;">Server</th>` +
        `<th style="border:1px solid #ddd;padding:8px;text-align:left;">Status</th>` +
        `<th style="border:1px solid #ddd;padding:8px;text-align:left;">Assignee</th>` +
        `</tr>${rows}</table>`
    );
}

async function postToWebhook(payload) {
    const webhookUrl = process.env.SERVER_WEBHOOK_URL;
    if (!webhookUrl) {
        throw new Error("Missing required environment variable: SERVER_WEBHOOK_URL");
    }
    if (!/^https:\/\//.test(webhookUrl)) {
        throw new Error("SERVER_WEBHOOK_URL must use HTTPS");
    }

    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(
            `Webhook POST failed: ${res.status} ${res.statusText} — ${body.substring(0, 500)}`,
        );
    }
}

async function main() {
    const tableName = process.env.SERVERS_TABLE || "serverInfo";

    console.log(`Fetching records from "${tableName}"...`);
    const records = await listAllRecords(tableName, {
        fields: ["Name", "Status", "Assignee"],
    });
    console.log(`Fetched ${records.length} records.`);

    let doneCount = 0;
    let inProgressCount = 0;
    let otherCount = 0;

    for (const r of records) {
        const status = r.fields["Status"];
        if (status === "Done") doneCount++;
        else if (status === "In progress") inProgressCount++;
        else otherCount++;
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        totalServers: records.length,
        counts: {
            done: doneCount,
            inProgress: inProgressCount,
            other: otherCount,
        },
        htmlTable: buildHtmlTable(records),
    };

    console.log("Status counts:", JSON.stringify(payload.counts, null, 2));

    await postToWebhook(payload);
    console.log("Posted server status to Airtable webhook successfully.");
}

main().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
});
