import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  ACCESS_STATUS,
  getAccessRecords,
  hasApprovedAccess,
  isOwner,
} from '../../shared/access.ts';

const STATUS_MAP = {
  [ACCESS_STATUS.PENDING]: 'pending',
  [ACCESS_STATUS.APPROVED]: 'approved',
  [ACCESS_STATUS.REJECTED]: 'rejected',
  [ACCESS_STATUS.REVOKED]: 'revoked',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ signedIn: false, isAdmin: false, isOwner: false, status: 'signed_out' });
    }

    const owner = isOwner(user);
    const records = await getAccessRecords(base44, user.email);
    // A HozzaferesiKeres az egyetlen forrás: tulajdonos vagy jóváhagyott rekord ad admin jogot.
    const isAdmin = owner || hasApprovedAccess(records);

    // A szerepkör mindig a kérelmek állapotához igazodik (a nem jóváhagyott felhasználó nem lesz admin).
    const desiredRole = isAdmin ? 'admin' : 'user';
    if ((user.role || 'user') !== desiredRole) {
      await base44.asServiceRole.entities.User.update(user.id, { role: desiredRole }).catch((error) => {
        console.error('Szerepkör frissítése nem sikerült', { message: error && error.message });
      });
    }

    const profile = {
      signedIn: true,
      name: user.full_name || '',
      email: user.email || '',
      isOwner: owner,
      isAdmin,
    };

    if (isAdmin) return Response.json({ ...profile, status: 'approved' });

    const latest = records[0] || null;
    const status = (latest && STATUS_MAP[latest.status]) || 'none';
    return Response.json({ ...profile, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}