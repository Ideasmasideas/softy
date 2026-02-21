const { google } = require('googleapis');
const Configuracion = require('../models/Configuracion');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/api/gmail/callback'
  );
}

function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

async function handleCallback(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Get user email
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  // Save tokens to DB
  await Configuracion.update({
    gmail_access_token: tokens.access_token,
    gmail_refresh_token: tokens.refresh_token || '',
    gmail_connected_email: profile.data.emailAddress
  });

  return profile.data.emailAddress;
}

async function getClient() {
  const config = await Configuracion.getAll();
  if (!config.gmail_access_token) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: config.gmail_access_token,
    refresh_token: config.gmail_refresh_token || undefined
  });

  // Auto-save refreshed tokens
  oauth2Client.on('tokens', async (tokens) => {
    const updates = {};
    if (tokens.access_token) updates.gmail_access_token = tokens.access_token;
    if (tokens.refresh_token) updates.gmail_refresh_token = tokens.refresh_token;
    if (Object.keys(updates).length > 0) {
      await Configuracion.update(updates);
    }
  });

  return oauth2Client;
}

async function fetchEmails(maxResults = 20, query = '') {
  const auth = await getClient();
  if (!auth) throw new Error('Gmail no conectado');

  const gmail = google.gmail({ version: 'v1', auth });

  const params = {
    userId: 'me',
    maxResults,
    labelIds: ['INBOX']
  };
  if (query) params.q = query;

  const list = await gmail.users.messages.list(params);
  if (!list.data.messages || list.data.messages.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    list.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });

      const headers = detail.data.payload.headers;
      const getHeader = (name) => {
        const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : '';
      };

      return {
        id: msg.id,
        threadId: detail.data.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: detail.data.snippet
      };
    })
  );

  return emails;
}

async function getEmailContent(messageId) {
  const auth = await getClient();
  if (!auth) throw new Error('Gmail no conectado');

  const gmail = google.gmail({ version: 'v1', auth });
  const detail = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const headers = detail.data.payload.headers;
  const getHeader = (name) => {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  // Extract body text
  let body = '';
  const payload = detail.data.payload;

  function extractText(part) {
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.mimeType === 'text/html' && part.body && part.body.data) {
      // Strip HTML tags for plain text
      const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (part.parts) {
      for (const sub of part.parts) {
        const text = extractText(sub);
        if (text) return text;
      }
    }
    return '';
  }

  body = extractText(payload);

  // Parse from header: "Name <email@example.com>"
  const fromRaw = getHeader('From');
  const fromMatch = fromRaw.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
  const fromName = fromMatch ? fromMatch[1].trim() : fromRaw;
  const fromEmail = fromMatch ? fromMatch[2].trim() : fromRaw;

  return {
    id: messageId,
    subject: getHeader('Subject'),
    from: fromRaw,
    fromName,
    fromEmail,
    date: getHeader('Date'),
    snippet: detail.data.snippet,
    body
  };
}

async function disconnect() {
  await Configuracion.update({
    gmail_access_token: '',
    gmail_refresh_token: '',
    gmail_connected_email: ''
  });
}

async function getStatus() {
  const config = await Configuracion.getAll();
  return {
    connected: !!config.gmail_access_token,
    email: config.gmail_connected_email || null
  };
}

module.exports = { getAuthUrl, handleCallback, getClient, fetchEmails, getEmailContent, disconnect, getStatus };
