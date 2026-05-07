// Minimal Airtable REST API helper. No external SDK needed.
// Handles pagination automatically using Bearer auth.

const AIRTABLE_API = "https://api.airtable.com/v0";

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function airtableFetch(path, options = {}) {
    const apiKey = requireEnv("AIRTABLE_API_KEY");
    const url = `${AIRTABLE_API}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(
            `Airtable API ${res.status} ${res.statusText}: ${body.substring(0, 500)}`,
        );
    }

    return res.json();
}

// Fetches ALL records from a table, handling pagination automatically.
// params: { fields: string[], filterByFormula, view }
async function listAllRecords(tableNameOrId, params = {}) {
    const baseId = requireEnv("AIRTABLE_BASE_ID");
    const records = [];
    let offset;

    do {
        const query = new URLSearchParams();
        if (params.fields) {
            for (const field of params.fields) {
                query.append("fields[]", field);
            }
        }
        if (params.filterByFormula) {
            query.set("filterByFormula", params.filterByFormula);
        }
        if (params.view) {
            query.set("view", params.view);
        }
        if (offset) {
            query.set("offset", offset);
        }

        const path = `/${encodeURIComponent(baseId)}/${encodeURIComponent(
            tableNameOrId,
        )}?${query.toString()}`;
        const data = await airtableFetch(path);

        records.push(...data.records);
        offset = data.offset;
    } while (offset);

    return records;
}

module.exports = { listAllRecords };
