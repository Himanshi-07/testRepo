# n8n — ServerInfo weekly email + auto GitHub sync

The weekly email runs entirely inside n8n — no server, no deployment needed.  
**Git is the source of truth.** When you push a change to `serverinfo-weekly-email.code.js`, a second n8n workflow automatically patches the Code node in the weekly email workflow. No copy-pasting required.

---

## How it works

```
── Weekly Email workflow ────────────────────────────────────────────
Schedule Trigger (every Monday 09:00)
    └── HTTP Request — GET Airtable ServerInfo records
            └── Code node ◄── auto-updated by sync workflow
                    └── HTTP Request — POST to Airtable webhook
                            └── Airtable Automation sends the email

── GitHub Sync workflow ─────────────────────────────────────────────
GitHub push webhook
    └── Code: did serverinfo-weekly-email.code.js change?
            └── IF yes:
                    ├── HTTP: GET raw file from GitHub
                    ├── HTTP: GET weekly email workflow JSON from n8n API
                    └── Merge → Code: patch Code node → HTTP: PATCH n8n workflow
```

---

## Files in this repo

| File | Used in |
|------|---------|
| `serverinfo-weekly-email.code.js` | Pasted into the weekly email workflow Code node (and auto-synced from GitHub) |
| `github-sync-check.code.js` | Node 2 in the GitHub Sync workflow — detects if the file changed |
| `github-sync-update.code.js` | Node 6 in the GitHub Sync workflow — patches the n8n workflow via API |
| `README.md` | This file |

---

## Part 1 — Airtable setup (one time)

### Step 1 — Confirm your ServerInfo table fields

Open your base → `ServerInfo` table. Fields must be named **exactly**:

| Field | Type | Notes |
|-------|------|-------|
| `Name` | Single line text | — |
| `Status` | Single select | Options must be exactly `Done` and `In progress` |
| `Assignee` | Collaborator | — |

> If Status options are spelled differently (e.g. `In Progress` with capital P) the script won't match. Rename the option in Airtable to fix it.

### Step 2 — Create the Airtable email automation

1. In your base → **Automations** → **+ New automation**
2. **Trigger**: When webhook received → **copy the webhook URL**
3. **Action**: Send email
   - To: your team address
   - Subject: `ServerInfo weekly summary`
   - Body (HTML tab): insert field → pick `html` from the webhook payload
4. Toggle the automation **On**

---

## Part 2 — Weekly email workflow (4 nodes)

### Node 1 — Schedule Trigger
- Every **Monday** at **09:00**, set your timezone explicitly

### Node 2 — HTTP Request (Airtable)
- Method: `GET`
- URL: `https://api.airtable.com/v0/app9hWEsOA1OwSE9o/ServerInfo`
- Auth: **Generic Credential → Header Auth**
  - Name: `Authorization`
  - Value: `Bearer <your AIRTABLE_API_KEY>`
- Query params: `fields[]` = `Name`, `fields[]` = `Status`, `fields[]` = `Assignee`

### Node 3 — Code (name it exactly: `Build Email`)
- Language: JavaScript
- Paste contents of `serverinfo-weekly-email.code.js`
- **Name this node `Build Email`** — the sync workflow targets it by name

### Node 4 — HTTP Request (Airtable webhook)
- Method: `POST`
- URL: the webhook URL from Step 2
- Body content type: JSON → body: `={{ $json }}`

Connect: `Schedule → HTTP (Airtable) → Build Email → HTTP (webhook)` → **Save → note the workflow ID from the URL bar** (e.g. `http://localhost:5678/workflow/8` → ID is `8`)

---

## Part 3 — n8n API key (one time)

The sync workflow needs to call the n8n API to patch the weekly email workflow.

1. In n8n → top-right menu → **Settings** → **API**
2. Click **Create API Key** → copy the key
3. Save it — you'll paste it into the sync workflow as a credential

---

## Part 4 — GitHub Sync workflow (7 nodes)

Create a second workflow, name it `GitHub → n8n Code Sync`.

### Node 1 — Webhook Trigger
- HTTP method: `POST`
- Path: `github-sync` (or any name you like)
- **Copy the webhook URL** — you'll give this to GitHub

### Node 2 — Code (check if file changed)
- Paste contents of `github-sync-check.code.js`

### Node 3 — IF
- Condition: `{{ $json.changed }}` **equals (boolean)** `true`
- Only the `true` branch continues

### Node 4 — HTTP Request (fetch raw file from GitHub)
- Method: `GET`
- URL:
  ```
  https://raw.githubusercontent.com/YOUR_ORG/mcprp-test-repo/develop/n8n/serverinfo-weekly-email.code.js
  ```
  Replace `YOUR_ORG` with your GitHub org/username
- Response format: **Text** (important — this gives you the raw string, not parsed JSON)

### Node 5 — HTTP Request (GET current workflow from n8n API)
- Method: `GET`
- URL: `http://localhost:5678/api/v1/workflows/WORKFLOW_ID`
  Replace `WORKFLOW_ID` with the ID you noted when saving the weekly email workflow
- Auth: **Generic Credential → Header Auth**
  - Name: `X-N8N-API-KEY`
  - Value: your n8n API key from Part 3

> If n8n is on a remote host, replace `localhost:5678` with that host URL.

### Node 6 — Merge
- Mode: **Combine**
- Combination mode: **Combine by position**
- This combines the raw GitHub file (Node 4) and the workflow JSON (Node 5) into one item

### Node 7 — Code (patch the workflow JSON)
- Paste contents of `github-sync-update.code.js`

### Node 8 — HTTP Request (PATCH n8n workflow)
- Method: `PATCH`
- URL: `http://localhost:5678/api/v1/workflows/WORKFLOW_ID`
  Same workflow ID as Node 5
- Auth: same `X-N8N-API-KEY` Header Auth credential
- Body content type: **JSON**
- Body: `={{ $json }}` (the patched workflow object from Node 7)

Connect: `Webhook → Check Code → IF (true) → HTTP (GitHub) + HTTP (n8n GET) → Merge → Patch Code → HTTP (n8n PATCH)`

**Save → Activate**

---

## Part 5 — GitHub webhook (one time)

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: paste the n8n Webhook Trigger URL from Node 1 of the sync workflow

   > If n8n is running locally on `localhost`, GitHub can't reach it. Options:
   > - Use **n8n Cloud** (has a public URL)
   > - Run a tunnel: `npx localtunnel --port 5678` → use the tunnel URL

3. **Content type**: `application/json`
4. **Events**: Just the **push** event
5. Click **Add webhook**

---

## Part 6 — Test the full sync

1. Edit `n8n/serverinfo-weekly-email.code.js` in your IDE — add a comment like `// sync test`
2. Commit and push:
   ```bash
   git add n8n/serverinfo-weekly-email.code.js
   git commit -m "Test auto-sync"
   git push origin develop
   ```
3. In n8n → open the `GitHub → n8n Code Sync` workflow → **Executions** tab
4. You should see a new execution appear — it should succeed (green)
5. Open the **weekly email workflow** → double-click the `Build Email` Code node
6. Confirm the code inside now includes `// sync test`

---

## Part 7 — Going forward

**Whenever you change the email logic:**

1. Edit `n8n/serverinfo-weekly-email.code.js`
2. Commit and push
3. GitHub notifies n8n automatically → Code node updates itself in ~5 seconds

No manual copy-paste. Git push = deployed.
