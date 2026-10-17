# ToBa — Direct Enquiries edition

**Admin panel removed.** Use Netlify Forms email notifications or Telegram bot alerts instead.

Start with `SETUP_DIRECT_ENQUIRIES.md` for exact setup steps.

- Public site: `index.html`
- Customer form: on home page in “Start your project”
- After submitting: `/thank-you`
- Edit price guide: `prices.js` (then redeploy)
- Telegram serverless notifier: `netlify/functions/notify-telegram.mjs` (optional, configure secret env vars in Netlify)
- Upwork/Fiverr copy and action plan: the other `.md` files.

The front-end is ready; email and Telegram settings have **not** been activated and live delivery still needs testing after deployment.
