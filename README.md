# mcprp-test-repo

GitHub Actions scripts for Airtable automation. Scripts run on a schedule, fetch data from Airtable via the REST API, and POST results to Airtable webhook triggers — which then send emails.

Edit any script in this repo and push. No changes needed in Airtable.

## Folder Structure

```
mcprp-test-repo/
├── scripts/
│   ├── lib/
│   │   └── airtable.js       # Shared Airtable REST helper (pagination, auth)
│   └── server-status.js      # Hourly server status summary
├── .github/
│   └── workflows/
│       └── server-status.yml # Cron: every hour
└── .env.example              # Copy to .env for local testing
```

## How it works

```
GitHub Actions (every hour)
    └── runs node scripts/server-status.js
            ├── reads "Servers" table via Airtable REST API
            ├── builds HTML table + status counts
            └── POSTs JSON to Airtable webhook URL
                    └── Airtable Automation:
                            Trigger:  "When webhook received"
                            Action:   "Send email"
```

## Setup

### 1. Airtable — create a webhook automation (once)

1. Create an automation with trigger **"When webhook received"**
2. Add action **"Send email"** — use these fields in the body:
   - `{{htmlTable}}` — styled HTML table of all servers
   - `{{totalServers}}` — total count
   - `{{counts.done}}` — done count
   - `{{counts.inProgress}}` — in progress count
3. Copy the webhook URL Airtable provides

### 2. GitHub — add repository secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `AIRTABLE_API_KEY` | Personal access token with `data.records:read` |
| `AIRTABLE_BASE_ID` | Base ID from the Airtable URL (`app...`) |
| `SERVER_WEBHOOK_URL` | Webhook URL from step 1 |

### 3. Test manually

Go to **Actions tab → Server Status → Run workflow**

## Local testing

```bash
cp .env.example .env
# fill in values in .env

node --env-file=.env scripts/server-status.js
```

## Adding a new script

1. Add `scripts/<new-script>.js` — use `scripts/server-status.js` as a template
2. Add `.github/workflows/<new-script>.yml` — copy the existing workflow and change the cron + script name
3. Create a matching Airtable webhook automation
4. Add the new webhook URL as a GitHub secret
