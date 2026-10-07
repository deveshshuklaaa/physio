// 400 on anything not explicitly allowed (allow) or wrongly typed / too long (check). Never coerces.
const bad = (msg) => {
  const e = new Error(msg);
  e.status = 400;
  throw e;
};

const allow = (body, keys) => {
  if (body === null || typeof body !== "object" || Array.isArray(body)) bad("Request body must be an object");
  const extra = Object.keys(body).filter((k) => !keys.includes(k));
  if (extra.length) bad(`Unexpected fields: ${extra.join(", ")}`);
  return body;
};

// spec: { field: { type: "string"|"bool"|"int"|"array", max?, re?, blank?, of?: "string", itemMax? } }
// max = length (string/array) or upper bound (int). blank = also accept "".
// Absent keys are skipped (presence is the route's job). null/undefined values are rejected.
const check = (body, spec) => {
  for (const [k, r] of Object.entries(spec)) {
    if (!(k in body)) continue;
    const v = body[k];
    if (r.blank && v === "") continue; // forms post "" for "unanswered"
    if (r.type === "string") {
      if (typeof v !== "string") bad(`${k} must be text`);
      if (r.max && v.length > r.max) bad(`${k} must be at most ${r.max} characters`);
      if (r.re && !r.re.test(v)) bad(`${k} is not valid`);
    } else if (r.type === "bool") {
      if (typeof v !== "boolean") bad(`${k} must be true or false`);
    } else if (r.type === "int") {
      if (!Number.isInteger(v)) bad(`${k} must be a whole number`);
      if (r.max !== undefined && v > r.max) bad(`${k} must be at most ${r.max}`);
    } else if (r.type === "array") {
      if (!Array.isArray(v)) bad(`${k} must be a list`);
      if (r.max && v.length > r.max) bad(`${k} must have at most ${r.max} items`);
      if (r.of && v.some((x) => typeof x !== "string" || (r.itemMax && x.length > r.itemMax))) bad(`${k} items must be text of at most ${r.itemMax} characters`);
    }
  }
  return body;
};

module.exports = { allow, check };
