// Pure: AdminProfile doc (or null) -> effective { adminLevel, permissions }. Fail closed:
// no profile => ADMIN with nothing; permissions only count when strictly true; SUPER_ADMIN => all.
const KEYS = ["canManageAdmins", "canManageDoctors", "canViewPatients", "canManageDoctorRequests"];
function resolveAdminAuthz(profile) {
  const adminLevel = profile?.adminLevel === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
  const permissions = {};
  for (const k of KEYS) permissions[k] = adminLevel === "SUPER_ADMIN" || profile?.permissions?.[k] === true;
  return { adminLevel, permissions };
}
module.exports = { resolveAdminAuthz };
