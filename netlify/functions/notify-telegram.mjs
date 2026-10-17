// Runs on a verified Netlify Forms submission (not from the visitor's browser).
// Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Netlify environment variables.
// Never add the bot token to index.html, script.js, or GitHub.

export default {
  async formSubmitted(event) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return; // Email-only setup is fully supported.

    const data = event?.data || {};
    // Form events include each submitted field. This site currently has one form.
    if (data['form-name'] && data['form-name'] !== 'toba-project-inquiry') return;
    const field = (key, length = 1000) => String(data[key] || '').trim().slice(0, length);
    const msg = [
      '📩 NEW TOBA PROJECT ENQUIRY',
      '',
      'Name: ' + field('name', 120),
      'Email: ' + field('email', 254),
      'Service: ' + field('service', 120),
      'Budget: ' + (field('budget', 120) || 'Not specified'),
      '',
      'Project details:',
      field('project-details', 2900),
      '',
      'Reply directly to the customer’s email address above.'
    ].join('\n').slice(0, 4096);

    try {
      const response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, disable_web_page_preview: true }),
      });
      if (!response.ok) {
        console.error('ToBa Telegram notification failed (status ' + response.status + ').');
      }
    } catch {
      console.error('ToBa Telegram notification failed (network error).');
    }
  },
};
