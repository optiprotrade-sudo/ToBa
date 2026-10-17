# ToBa — direct email / Telegram enquiry setup (NO admin panel)

## What happens when a visitor clicks “Send project enquiry”?
1. Netlify Forms accepts the submission, applies its spam checks and stores a backup in its Forms area.
2. If you enable Netlify email notifications, Netlify sends you the enquiry details by email.
3. If Telegram is configured and the function is deployed, the same verified submission also generates a Telegram message with the name, email, service, budget, and project description.
4. The visitor sees the ToBa thank-you page.

**No ToBa admin login, no custom backend server and no PostgreSQL database.**

## First: set up EMAIL notifications (simplest route)
1. Extract this ZIP. Keep all the files together.
2. Sign in at https://app.netlify.com/ and deploy the website folder (or connect its GitHub repository).
3. In Netlify open your ToBa site → **Forms**. If prompted, **Enable form detection** and **redeploy the site** so the form is registered.
4. Open **Forms → Submission notifications → Add notification → Email notification**.
5. Select the **toba-project-inquiry** form and enter **your own destination email address**; save.
6. Submit a real test enquiry from the *public deployed site*. Check inbox and spam, and check Forms submissions.

Email notifications are **not enabled automatically** just by uploading this ZIP.
Netlify Forms is subject to Netlify's current usage allowance and billing policy.

## Optional: get the same enquiry in your Telegram bot
**Best deployed through a GitHub-connected Netlify site** so Netlify builds the function in `netlify/functions/notify-telegram.mjs`. Drag-and-drop of static site files by itself may not package this serverless function; do not assume Telegram works until tested on the live site.

1. Create or use an existing Telegram bot via @BotFather. Save the bot token privately.
2. Open your bot in Telegram and press **Start**, or add it to the intended group and allow messages. Get the correct target **chat ID**.
3. In Netlify → **Project configuration → Environment variables**, add:
   - `TELEGRAM_BOT_TOKEN` = your bot token
   - `TELEGRAM_CHAT_ID` = your personal or group chat ID (might start with `-` for a group)
4. Use the same values for Functions/runtime deployment; after setting them, **redeploy**.
5. Submit a test enquiry using your live ToBa link. Confirm you get the message in Telegram. Check function logs if not.

**Security:** Do not put the bot token in HTML, `script.js`, `prices.js`, a GitHub file or this chat. Keep it only in Netlify's private environment settings. Never use a frontend JavaScript call directly to the Bot API.

## Change public starting prices without an admin panel
Edit `prices.js`:
```js
const TOBA_STARTING_PRICES = {
  landing: 40,
  business: 90
};
```
Save, then redeploy your site. The custom web-app package is still quote-based. Price changes cannot publish instantly from the browser without an admin/CMS setup; changes are part of each website deployment.

## Local preview vs live delivery
- Opening `index.html` by double-clicking previews the website but **does not send enquiries**.
- Email and Telegram delivery require a live Netlify deployment with their respective settings configured.
- No credentials are contained in this ZIP.
- Built-in Netlify Forms storage exists only as a backup and does not require your own admin page.

Docs: https://docs.netlify.com/manage/forms/setup/
Docs: https://docs.netlify.com/manage/forms/notifications/
Docs: https://docs.netlify.com/build/functions/trigger-on-events/
