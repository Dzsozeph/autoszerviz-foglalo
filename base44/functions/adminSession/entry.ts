import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ACCESS_STATUS, getLatestAccessRequest, isOwner } from '../../shared/access.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ signedIn: false, isAdmin: false, isOwner: false, status: 'signed_out' });
    }

    const profile = {
      signedIn: true,
      name: user.full_name || '',
      email: user.email || '',
    };

    const promote = async () => {
      await base44.asServiceRole.entities.User.update(user.id, { role: 'admin' }).catch((error) => {
        console.error('Admin jog beállítása nem sikerült', { message: error && error.message });
      });
    };

    if (isOwner(user)) {
      if (user.role !== 'admin') await promote();
      return Response.json({ ...profile, isOwner: true, isAdmin: true, status: 'approved' });
    }

    if (user.role === 'admin') {
      return Response.json({ ...profile, isOwner: false, isAdmin: true, status: 'approved' });
    }

    const request = await getLatestAccessRequest(base44, user.email);

    if (request && request.status === ACCESS_STATUS.APPROVED) {
      await promote();
      return Response.json({ ...profile, isOwner: false, isAdmin: true, status: 'approved' });
    }

    if (request && request.status === ACCESS_STATUS.PENDING) {
      return Response.json({ ...profile, isOwner: false, isAdmin: false, status: 'pending' });
    }

    if (request && request.status === ACCESS_STATUS.REJECTED) {
      return Response.json({ ...profile, isOwner: false, isAdmin: false, status: 'rejected' });
    }

    return Response.json({ ...profile, isOwner: false, isAdmin: false, status: 'none' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}