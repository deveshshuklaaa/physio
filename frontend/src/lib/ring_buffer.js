/**
 * ring_buffer.js — G4. Fixed-capacity ring buffer, overwrite-oldest, with a
 * `dropped` counter. Used for: session capture buffer, WS outbound buffer,
 * browser-side log buffer (G14). §3.2 R3.
 */
export class RingBuffer {
  constructor(capacity) {
    if (!(capacity > 0)) throw new Error("capacity must be > 0");
    this.capacity = capacity;
    this._buf = new Array(capacity);
    this._start = 0; // index of oldest element
    this._size = 0;
    this.dropped = 0;
  }

  get length() {
    return this._size;
  }

  /** Push one item. If full, overwrites the oldest and increments `dropped`. */
  push(item) {
    if (this._size < this.capacity) {
      const idx = (this._start + this._size) % this.capacity;
      this._buf[idx] = item;
      this._size++;
    } else {
      this._buf[this._start] = item;
      this._start = (this._start + 1) % this.capacity;
      this.dropped++;
    }
  }

  /** Remove and return all currently buffered items, oldest first. Empties the buffer. */
  drain() {
    const out = [];
    for (let i = 0; i < this._size; i++) {
      out.push(this._buf[(this._start + i) % this.capacity]);
    }
    this._start = 0;
    this._size = 0;
    return out;
  }

  /** Peek without removing. */
  toArray() {
    const out = [];
    for (let i = 0; i < this._size; i++) {
      out.push(this._buf[(this._start + i) % this.capacity]);
    }
    return out;
  }

  clear() {
    this._start = 0;
    this._size = 0;
  }
}
