// Weekly leadership summary email — counts releases by phase and builds an HTML table.
//
// Trigger: At a scheduled time (weekly).
// Action 1 (this script): generate the counts + HTML table.
// Action 2 (Send email): use {{htmlTable}} and the counts in the body.
//
// Required input variables (set in Airtable Automation):
//   (none required — defaults to "Releases" table)
//
// Optional:
//   tableName  — defaults to "Releases"

async function run(base, output, input) {
    const config = (input && input.config && input.config()) || {};
    const tableName = config.tableName || "Releases";

    // Phase categories — adjust these arrays if Airtable uses additional/renamed values.
    const planningPhases = ["Planning"];
    const designDevelopPhases = ["Design & Develop"];
    const privateBetaPhases = ["Private Beta"];
    const publicBetaPhases = ["Public Beta"];
    const generalAvailabilityPhases = ["General Availability"];

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
    const totalCount = query.records.length;

    const tableRows = [];

    for (const record of query.records) {
        const releasePhase = record.getCellValueAsString("Current Release Phase");
        const serverName = record.getCellValueAsString(
            "Name of the MCP Server (include version number if any)",
        );
        let phaseLabel = "";

        if (planningPhases.includes(releasePhase)) {
            planningCount++;
            phaseLabel = "Planning";
        } else if (designDevelopPhases.includes(releasePhase)) {
            designDevelopCount++;
            phaseLabel = "Design & Develop";
        } else if (privateBetaPhases.includes(releasePhase)) {
            privateBetaCount++;
            phaseLabel = "Private Beta";
        } else if (publicBetaPhases.includes(releasePhase)) {
            publicBetaCount++;
            phaseLabel = "Public Beta";
        } else if (generalAvailabilityPhases.includes(releasePhase)) {
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
                "</td></tr>",
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
    output.set("totalReleases", totalCount);
    output.set("htmlTable", htmlTable);
}

run;
