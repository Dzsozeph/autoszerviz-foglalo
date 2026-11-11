import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  ACCESS_STATUS,
  APP_URL,
  OWNER_EMAIL,
  SHOP,
  findAccountByEmail,
  isOwner,
  listAppUsers,
  normalizeEmail,
  sendTemplateEmail,
} from '../../shared/access.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9()\s-]{7,24}$/;

const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = str(body.action, 20) || 'submit';

    if (action === 'submit') {
      const data = {
        name: str(body.name, 120),
        email: normalizeEmail(str(body.email, 160)),
        company: str(body.company, 120),
        phone: str(body.phone, 32),
      };

      const errors = {};
      if (!data.name) errors.name = 'Adja meg a teljes nevét.';
      if (!EMAIL_RE.test(data.email)) errors.email = 'Adjon meg egy érvényes e-mail-címet.';
      if (!data.company) errors.company = 'Adja meg a szerviz vagy cég nevét.';
      if (!PHONE_RE.test(data.phone)) errors.phone = 'Adjon meg egy érvényes telefonszámot.';
      if (Object.keys(errors).length > 0) {
        return Response.json({ error: 'validation_failed', fields: errors }, { status: 400 });
      }

      const requester = await base44.auth
        .me()
        .catch((e) => (e.status === 401 || e.status === 403 ? null : Promise.reject(e)));
      if (requester && (isOwner(requester) || requester.role === 'admin')) {
        return Response.json({ ok: true, alreadyApproved: true });
      }

      const page = await base44.asServiceRole.entities.HozzaferesiKeres.filter(
        { email: data.email },
        { sort: '-created_date', limit: 1 }
      );
      const items = page && page.items ? page.items : page;
      const existing = (items && items[0]) || null;

      if (existing && existing.status === ACCESS_STATUS.APPROVED) {
        return Response.json({ ok: true, alreadyApproved: true });
      }
      if (existing && existing.status === ACCESS_STATUS.PENDING) {
        return Response.json({ ok: true, alreadyPending: true });
      }

      const record = existing
        ? await base44.asServiceRole.entities.HozzaferesiKeres.update(existing.id, {
            ...data,
            status: ACCESS_STATUS.PENDING,
            reviewed_date: null,
          })
        : await base44.asServiceRole.entities.HozzaferesiKeres.create({
            ...data,
            status: ACCESS_STATUS.PENDING,
          });

      const emailResult = await sendTemplateEmail(base44, {
        to: OWNER_EMAIL,
        template: 'UjHozzaferesiKeres',
        variables: {
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          admin_url: `${APP_URL}/admin`,
        },
      });

      return Response.json({ ok: true, id: record.id, emailSent: emailResult.ok });
    }

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!isOwner(user)) return Response.json({ error: 'forbidden' }, { status: 403 });

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.HozzaferesiKeres.list('-created_date', 100);
      const requests = page && page.items ? page.items : page;
      const adminItems = await listAppUsers(base44);
      const admins = adminItems
        .filter((account) => normalizeEmail(account.email) !== OWNER_EMAIL && account.role === 'admin')
        .map((account) => ({
          id: account.id,
          name: account.full_name || account.email,
          email: account.email,
        }));
      return Response.json({ ok: true, requests: requests || [], admins });
    }

    if (action === 'pendingCount') {
      const count = await base44.asServiceRole.entities.HozzaferesiKeres.count({
        status: ACCESS_STATUS.PENDING,
      });
      return Response.json({ ok: true, count });
    }

    if (action === 'approve' || action === 'reject') {
      const id = str(body.id, 60);
      if (!id) return Response.json({ error: 'missing_id' }, { status: 400 });

      const record = await base44.asServiceRole.entities.HozzaferesiKeres.get(id).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!record) return Response.json({ error: 'not_found' }, { status: 404 });

      const approving = action === 'approve';
      const nextStatus = approving ? ACCESS_STATUS.APPROVED : ACCESS_STATUS.REJECTED;

      await base44.asServiceRole.entities.HozzaferesiKeres.update(id, {
        status: nextStatus,
        reviewed_date: new Date().toISOString(),
      });

      const email = normalizeEmail(record.email);
      const account = await findAccountByEmail(base44, email);
      if (account && normalizeEmail(account.email) !== OWNER_EMAIL) {
        await base44.asServiceRole.entities.User.update(account.id, {
          role: approving ? 'admin' : 'user',
        }).catch((error) => {
          console.error('Felhasználói jog módosítása nem sikerült', {
            message: error && error.message,
          });
        });
      }

      const emailResult = await sendTemplateEmail(base44, {
        to: email,
        template: approving ? 'HozzaferesJovahagyva' : 'HozzaferesElutasitva',
        variables: {
          name: record.name || '',
          email,
          admin_url: `${APP_URL}/admin`,
          app_url: APP_URL,
          shop_phone: SHOP.phone,
        },
      });

      return Response.json({ ok: true, status: nextStatus, emailSent: emailResult.ok });
    }

    if (action === 'revoke') {
      const email = normalizeEmail(str(body.email, 160));
      if (!email) return Response.json({ error: 'missing_email' }, { status: 400 });
      if (email === OWNER_EMAIL) {
        return Response.json({ error: 'owner_protected' }, { status: 400 });
      }

      const account = await findAccountByEmail(base44, email);
      if (!account) return Response.json({ error: 'not_found' }, { status: 404 });

      await base44.asServiceRole.entities.User.update(account.id, { role: 'user' });
      await base44.asServiceRole.entities.HozzaferesiKeres.updateMany(
        { email, status: ACCESS_STATUS.APPROVED },
        { $set: { status: ACCESS_STATUS.REJECTED } }
      );

      return Response.json({ ok: true });
    }

    return Response.json({ error: 'unknown_action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}