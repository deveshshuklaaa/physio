#!/usr/bin/env node
/**
 * ring_buffer_selfcheck.mjs — runnable check for RingBuffer's
 * overwrite-oldest + dropped-counter behaviour (G4). Kept OUT of
 * src/lib/ring_buffer.js on purpose: that file is loaded directly by the
 * browser (worker, ws client, logger) and must not contain any Node-only
 * code (an earlier version did — a bare `import "url"` for a
 * `require.main`-style self-check — which threw at browser module-load time
 * and was only caught by actually running the page in Chrome; see
 * docs/09_live_frontend.md).
 */
import { RingBuffer } from "../src/lib/ring_buffer.js";

const rb = new RingBuffer(3);
rb.push(1); rb.push(2); rb.push(3);
console.assert(rb.dropped === 0, "no drops yet");
console.assert(JSON.stringify(rb.toArray()) === "[1,2,3]", "fifo order before overwrite");
rb.push(4); // overwrites 1
console.assert(rb.dropped === 1, "one drop after overwrite: got " + rb.dropped);
console.assert(JSON.stringify(rb.toArray()) === "[2,3,4]", "oldest overwritten: got " + JSON.stringify(rb.toArray()));
rb.push(5); rb.push(6);
console.assert(rb.dropped === 3, "drops accumulate: got " + rb.dropped);
console.assert(JSON.stringify(rb.toArray()) === "[4,5,6]", "got " + JSON.stringify(rb.toArray()));
const drained = rb.drain();
console.assert(JSON.stringify(drained) === "[4,5,6]", "drain returns in order");
console.assert(rb.length === 0, "drain empties buffer");
console.log("ring_buffer.js self-check OK");
