import {
  updateProfile as updateProfileSvc,
  changePassword as changePasswordSvc,
} from "../services/userService.js";

export async function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body || {};
    const updated = await updateProfileSvc(req.user, { name, email });
    res.json({ user: updated.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    await changePasswordSvc(req.user, { currentPassword, newPassword });
    // Refresh tokens are revoked inside the service. The current access
    // cookie still works until it expires (≤15 min); the client should
    // sign out to be safe.
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
