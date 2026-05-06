// Weekly leadership summary — counts releases by phase and builds HTML table.
// Runs via airtable-loader.js. Uses base, output, input from Airtable's scope.

const config = (input && input.config && input.config()) || {};
const tableName = config.tableName || "Releases";

const table = base.getTable(tableName);
const query = await table.selectRecordsAsync({
    fields: [
        "Name of the MCP Server (include version number if any)",
        "Current Release Phase",
    ],
});

let planningCount = 0;
let designDevelopCount = 0;
let privateBetaCount = 0;
let publicBetaCount = 0;
let generalAvailabilityCount = 0;
const tableRows = [];

for (const record of query.records) {
    const releasePhase = record.getCellValueAsString("Current Release Phase");
    const serverName = record.getCellValueAsString(
        "Name of the MCP Server (include version number if any)",
    );
    let phaseLabel = "";

    if (releasePhase === "Planning") {
        planningCount++;
        phaseLabel = "Planning";
    } else if (releasePhase === "Design & Develop") {
        designDevelopCount++;
        phaseLabel = "Design & Develop";
    } else if (releasePhase === "Private Beta") {
        privateBetaCount++;
        phaseLabel = "Private Beta";
    } else if (releasePhase === "Public Beta") {
        publicBetaCount++;
        phaseLabel = "Public Beta";
    } else if (releasePhase === "General Availability") {
        generalAvailabilityCount++;
        phaseLabel = "General Availability";
    } else {
        phaseLabel = "Unknown";
    }

    tableRows.push(
        "<tr><td style='border: 1px solid #ddd; padding: 8px;'>" +
        serverName +
        "</td><td style='border: 1px solid #ddd; padding: 8px;'>" +
        phaseLabel +
        "</td></tr>"
    );
}

const htmlTable =
    "<table style='border-collapse: collapse; width: 100%;'>" +
    "<tr style='background-color: #4472C4; color: white;'>" +
    "<th style='border: 1px solid #ddd; padding: 8px; text-align: left;'>MCP Server</th>" +
    "<th style='border: 1px solid #ddd; padding: 8px; text-align: left;'>Release Phase</th>" +
    "</tr>" +
    tableRows.join("") +
    "</table>";

output.set("planningCount", planningCount);
output.set("designDevelopCount", designDevelopCount);
output.set("privateBetaCount", privateBetaCount);
output.set("publicBetaCount", publicBetaCount);
output.set("generalAvailabilityCount", generalAvailabilityCount);
output.set("totalReleases", query.records.length);
output.set("htmlTable", htmlTable);
