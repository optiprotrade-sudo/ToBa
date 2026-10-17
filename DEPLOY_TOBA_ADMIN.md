# ToBa – Simple Admin Inbox (Netlify/GitHub)

## What is new

This upgrade keeps ToBa's public website, replaces the form delivery with a persistent, private inbox, and adds `/admin` with a **simple single-password login** (no registration flow).

When a visitor clicks **Send project enquiry**, the server validates the message, stores it in **Netlify Blobs** (persistent site-wide storage), and only then shows the thank-you page. You can view the customer's name, email, service, budget and project text in the admin inbox, search, change status to `Replied`/`Completed`, export CSV, and click **Reply by email**. Existing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` variables remain optional, as a best-effort alert sent *after* saving to the inbox; the inbox works even when Telegram/email alerts do not.

## Step 1: Update the EXISTING ToBa repository (important)

On GitHub, open the `ToBa` repo that's already linked to your existing Netlify site. Upload/replace the **contents** of this ZIP into that same repository's **root** (`netlify.toml`, `package.json`, the `public/` folder containing `index.html`, and the `netlify/functions/` folder should all be at their corresponding paths). Don't place them in a new parent directory and don't create a second Netlify site.

Delete the old `netlify/functions/notify-telegram.mjs` file from GitHub, because that obsolete Netlify Forms event handler should not be used by this inbox version.

The build publishes **only** the `public/` folder (not server-side source or dependencies). The repo contains `@netlify/blobs` in `package.json` so Netlify installs the dependency on deployment; Node 22 is requested by `netlify.toml` and `.nvmrc`.

## Step 2: Configure one admin password (NO sign-up)

Inside your EXISTING Netlify project (currently `flourishing-kulfi-e72b58`):

**Project configuration → Environment variables → Add a variable**

- **Key:** `TOBA_ADMIN_PASSWORD`
- **Value:** Choose a unique password **at least 14 characters long**. Use a password manager to generate one.
- **All scopes** is fine for your Free plan. You may choose the **Production** deploy context only. Keep the value **out of GitHub, screenshots and chats**.
- If Netlify allows you to mark it `Contains secret values` without upgrading, do so. Otherwise use Netlify's ordinary server-side environment variable, but restrict team access and don't share your Netlify account.

Save the variable. Trigger a new production deploy *after* saving it. **The `/admin` login will show a configuration error if the variable is missing or too short.**

No customer account, admin registration or separate database credentials are required.

## Step 3: Check the deployment

Wait for Netlify → Deploys → latest production deploy → **Published** (and check logs if it failed). Use the existing `.netlify.app` address.

Public website: `https://flourishing-kulfi-e72b58.netlify.app/`

Private inbox: `https://flourishing-kulfi-e72b58.netlify.app/admin`

Enter the password you saved, then open the inbox.

## Step 4: Test the real data flow

1. Open the public website in another tab.
2. Submit a valid project enquiry with a real, controlled email address and at least 15 characters in the description.
3. The website should show its thank-you page. **A thank-you page alone is not sufficient evidence**; after submitting, refresh `/admin` and confirm that the new card appears with your test name, email and description.
4. Try **Reply by email**. It opens your normal email app to write to the client.
5. Change the enquiry status from `New` to `Replied` and refresh the inbox; it should persist.

**Previously submitted Netlify Forms messages do not automatically migrate to this new inbox.** You can still view them in Netlify → Forms and export them separately. After this upgrade, new submissions go through the serverless function and Netlify Blobs, not the old Forms notification pipeline. The old email notification configured under Forms will therefore **not send for new submissions**. The private inbox is the reliable destination, and Telegram is optional.

## Important technical notes

- Netlify Blobs `getStore()` uses persistent site-wide storage; records survive deployments. It does **not** require you to set a Netlify API token yourself.
- The admin password is checked **only on Netlify's server**. Access is granted by an `HttpOnly`, `SameSite=Strict`, HTTPS `Secure` signed session cookie (8-hour lifetime). There is no public signup route. Failed admin login attempts are rate-limited.
- Customers never need an account and can't read inbox contents.
- This is a small-business starter inbox, not a replacement for a full CRM or transactional database. Export CSV regularly to keep independent backups. For higher volumes add CAPTCHA/abuse controls, retention/deletion policy, and audit logging.
- The inbox **does not show old Netlify Forms submissions**; it begins tracking new submissions after deployment.
- Prices are still adjusted in `prices.js` followed by a deployment. The admin does not edit prices in this version.

## Troubleshooting

**Admin gives “Login is not configured”** → confirm `TOBA_ADMIN_PASSWORD` exists, is 14+ characters, and redeploy.

**Admin loads but inbox errors** → check Netlify → Logs → Functions for `admin-inquiries`; ensure the new `@netlify/blobs` package was installed and the site deploy is Published.

**Enquiry form shows “could not save”** → check Netlify → Logs → Functions for `submit-inquiry`; do not give customers a false success message.

**Telegram fails but inbox works** → you can ignore Telegram until later; submitted messages remain saved. Ensure bot has been started and your existing Netlify env vars are correct.

**New submissions not in Netlify → Forms** → expected: this version uses a private inbox instead of Netlify Forms.

### Files to look for in GitHub after upload

```text
ToBa/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── admin.js
│   ├── admin.css
│   └── (other website assets)
├── netlify/
│   └── functions/
│       ├── submit-inquiry.mjs
│       ├── admin-auth.mjs
│       ├── admin-inquiries.mjs
│       └── _auth-utils.mjs
├── netlify.toml
└── package.json
```

The Netlify publish directory is now `public`, configured in `netlify.toml`. Previous files at the repository root can remain temporarily, but are NOT used by this updated deployment.
