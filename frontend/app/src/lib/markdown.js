// Minimal markdown subset for the Gemini coaching text: headings, bullet/numbered
// lists (indented continuation lines become extra paragraphs of the item),
// paragraphs, **bold** / *italic*. Returns plain data -- rendered as React
// elements, never as HTML, so model output can't inject markup.
// ponytail: no tables/links/code blocks; swap for a real parser if the prompt starts emitting them.

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const INDENTED = /^\s{2,}\S/;

export function parseMarkdown(text) {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = null;
  let list = null;

  const closePara = () => {
    if (para) blocks.push({ type: "p", text: para.join(" ") });
    para = null;
  };
  const closeList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const line of lines) {
    if (!line.trim()) {
      closePara();
      continue;
    }
    const h = line.match(HEADING);
    if (h) {
      closePara();
      closeList();
      blocks.push({ type: "h", level: h[1].length, text: h[2].trim() });
      continue;
    }
    const b = line.match(BULLET);
    const n = b ? null : line.match(NUMBERED);
    if (b || n) {
      closePara();
      const type = b ? "ul" : "ol";
      if (!list || list.type !== type) {
        closeList();
        list = { type, items: [] };
      }
      list.items.push([(b || n)[1].trim()]);
      continue;
    }
    if (list && INDENTED.test(line)) {
      list.items[list.items.length - 1].push(line.trim());
      continue;
    }
    closeList();
    (para ||= []).push(line.trim());
  }
  closePara();
  closeList();
  return blocks;
}

export function splitInline(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/)
    .filter(Boolean)
    .map((s) =>
      s.startsWith("**") && s.endsWith("**") && s.length > 4
        ? { t: "b", v: s.slice(2, -2) }
        : s.startsWith("*") && s.endsWith("*") && s.length > 2
          ? { t: "i", v: s.slice(1, -1) }
          : { t: "text", v: s }
    );
}
