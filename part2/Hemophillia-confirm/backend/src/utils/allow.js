// 400 on anything not explicitly allowed.
const allow = (body, keys) => {
  const extra = Object.keys(body || {}).filter((k) => !keys.includes(k));
  if (extra.length) {
    const e = new Error(`Unexpected fields: ${extra.join(", ")}`);
    e.status = 400;
    throw e;
  }
  return body;
};

module.exports = { allow };
