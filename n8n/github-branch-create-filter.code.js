/**
 * n8n Code node — GitHub webhook filter: branch creation only
 *
 * GitHub: Webhook → enable **Create** event (branch/tag). This script ignores tags.
 *
 * Paste after Webhook → before IF (proceed === true).
 *
 * Edit ALLOWED_BRANCHES: short names like "main", "develop".
 * Use [] (empty array) to allow any branch name.
 */

const ALLOWED_BRANCHES = ["main", "develop"];

const root = $input.first().json;
const payload =
    root.body &&
    typeof root.body === "object" &&
    !Array.isArray(root.body) &&
    ("ref_type" in root.body || "ref" in root.body)
        ? root.body
        : root;

const isBranchCreate =
    payload.ref_type === "branch" && typeof payload.ref === "string";

if (!isBranchCreate) {
    return [{ json: { proceed: false, reason: "not-branch-create" } }];
}

const branch = payload.ref.replace(/^refs\/heads\//, "");

const proceed =
    ALLOWED_BRANCHES.length === 0 || ALLOWED_BRANCHES.includes(branch);

return [
    {
        json: {
            proceed,
            branch,
            default_branch: payload.repository?.default_branch || "",
            reason: proceed ? "branch-created" : "branch-not-in-allowlist",
        },
    },
];
