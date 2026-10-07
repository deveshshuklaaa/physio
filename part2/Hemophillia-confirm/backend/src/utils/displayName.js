// Composed name for API responses. fullName is never stored.
const displayName = (u) =>
  [u?.firstName, u?.middleName, u?.lastName].filter(Boolean).join(" ");

module.exports = { displayName };

// Split a single free-text name (Google profile, legacy rows). 1->first; 2->first+last; 3+->first+middle(s)+last.
const splitName = (s) => {
  const t = String(s || "").trim().split(/\s+/).filter(Boolean);
  if (!t.length) return { firstName: "", middleName: "", lastName: "" };
  if (t.length === 1) return { firstName: t[0], middleName: "", lastName: "" };
  return { firstName: t[0], middleName: t.slice(1, -1).join(" "), lastName: t[t.length - 1] };
};

module.exports.splitName = splitName;

// Add the computed fullName to a plain (lean) doc for API output.
module.exports.withFullName = (o) => (o ? { ...o, fullName: displayName(o) } : o);
