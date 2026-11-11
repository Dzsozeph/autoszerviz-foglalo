export const OWNER_EMAIL = 'dzsozeph93@gmail.com';
export const APP_URL = 'https://autoszerviz-foglalo.base44.app';

export const ACCESS_STATUS = {
  PENDING: 'Jóváhagyásra vár',
  APPROVED: 'Jóváhagyva',
  REJECTED: 'Elutasítva',
};

export const SHOP = {
  name: 'Profi Autószerviz',
  phone: '+36 1 234 5678',
  email: 'info@profiautoszerviz.hu',
  address: '1117 Budapest, Minta utca 12.',
};

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isOwner(user) {
  return normalizeEmail(user && user.email) === OWNER_EMAIL;
}

export async function sendTemplateEmail(base44, { to, template, variables }) {
  const recipient = normalizeEmail(to);
  if (!recipient) return { ok: false, error: 'missing_recipient' };
  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient,
      template_name: template,
      variables: variables || {},
      category: 'transactional',
    });
    if (result && result.success === false) {
      console.error('E-mail elutasítva', { template, reason: result.reason });
      return { ok: false, error: result.reason || 'refused' };
    }
    return { ok: true };
  } catch (error) {
    console.error('E-mail küldési hiba', { template, message: error && error.message });
    return { ok: false, error: (error && error.message) || 'send_failed' };
  }
}

export async function getLatestAccessRequest(base44, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const page = await base44.asServiceRole.entities.HozzaferesiKeres.filter(
    { email: normalized },
    { sort: '-created_date', limit: 1 }
  );
  const items = page && page.items ? page.items : page;
  return (items && items[0]) || null;
}

export async function listAppUsers(base44) {
  try {
    const result = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const items = result && result.items ? result.items : result;
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('Felhasználók betöltése nem sikerült', { message: error && error.message });
    return [];
  }
}

export async function findAccountByEmail(base44, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const users = await listAppUsers(base44);
  return users.find((item) => normalizeEmail(item.email) === normalized) || null;
}

export async function getAdminRecipients(base44) {
  const recipients = new Set([OWNER_EMAIL]);
  try {
    const items = await listAppUsers(base44);
    items
      .filter((item) => item.role === 'admin')
      .forEach((item) => {
        const email = normalizeEmail(item.email);
        if (email) recipients.add(email);
      });
  } catch (error) {
    console.error('Admin címzettek betöltése nem sikerült', { message: error && error.message });
  }
  return Array.from(recipients);
}

export async function sendToAll(base44, recipients, template, variables) {
  const results = await Promise.allSettled(
    recipients.map((to) => sendTemplateEmail(base44, { to, template, variables }))
  );
  return results.map((result) => (result.status === 'fulfilled' ? result.value : { ok: false }));
}