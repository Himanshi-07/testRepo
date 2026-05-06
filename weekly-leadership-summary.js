// Weekly leadership summary — counts releases by phase and builds HTML table.
// Loaded by airtable-loader.js. Globals: base, output, input are injected.

const __config = (input && input.config && input.config()) || {};
const __tableName = __config.tableName || "Releases";

const __planningPhases = ["Planning"];
const __designDevelopPhases = ["Design & Develop"];
const __privateBetaPhases = ["Private Beta"];
const __publicBetaPhases = ["Public Beta"];
const __generalAvailabilityPhases = ["General Availability"];

const __table = base.getTable(__tableName);
const __query = await __table.selectRecordsAsync({
    fields: [
        "Name of the MCP Server (include version number if any)",
        "Current Release Phase",
    ],
});

let __planningCount = 0;
let __designDevelopCount = 0;
let __privateBetaCount = 0;
let __publicBetaCount = 0;
let __generalAvailabilityCount = 0;
const __tableRows = [];

for (const record of __query.records) {
    const releasePhase = record.getCellValueAsString("Current Release Phase");
    const serverName = record.getCellValueAsString(
        "Name of the MCP Server (include version number if any)",
    );
    let phaseLabel = "";

    if (__planningPhases.includes(releasePhase)) {
        __planningCount++;
        phaseLabel = "Planning";
    } else if (__designDevelopPhases.includes(releasePhase)) {
        __designDevelopCount++;
        phaseLabel = "Design & Develop";
    } else if (__privateBetaPhases.includes(releasePhase)) {
        __privateBetaCount++;
        phaseLabel = "Private Beta";
    } else if (__publicBetaPhases.includes(releasePhase)) {
        __publicBetaCount++;
        phaseLabel = "Public Beta";
    } else if (__generalAvailabilityPhases.includes(releasePhase)) {
        __generalAvailabilityCount++;
        phaseLabel = "General Availability";
    } else {
        phaseLabel = "Unknown";
    }

    __tableRows.push(
        "<tr><td style='border: 1px solid #ddd; padding: 8px;'>" +
        serverName +
        "</td><td style='border: 1px solid #ddd; padding: 8px;'>" +
        phaseLabel +
        "</td></tr>",
    );
}

const __htmlTable =
    "<table style='border-collapse: collapse; width: 100%;'>" +
    "<tr style='background-color: #4472C4; color: white;'>" +
    "<th style='border: 1px solid #ddd; padding: 8px; text-align: left;'>MCP Server</th>" +
    "<th style='border: 1px solid #ddd; padding: 8px; text-align: left;'>Release Phase</th>" +
    "</tr>" +
    __tableRows.join("") +
    "</table>";

output.set("planningCount", __planningCount);
output.set("designDevelopCount", __designDevelopCount);
output.set("privateBetaCount", __privateBetaCount);
output.set("publicBetaCount", __publicBetaCount);
output.set("generalAvailabilityCount", __generalAvailabilityCount);
output.set("totalReleases", __query.records.length);
output.set("htmlTable", __htmlTable);
