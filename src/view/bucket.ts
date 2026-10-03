/**
 * Controlled randomness (the user, 2026-10-03): a bucket holds a fixed set of entries; each take removes a random
 * one, until it's empty and refills with the same set. Every entry comes up once per round, in a new order.
 */
export class Bucket<T> {
  private left: T[] = [];
  private last: T | undefined;

  constructor(
    private readonly entries: readonly T[],
    private readonly random: () => number = Math.random,
  ) {}

  get size(): number {
    return this.entries.length;
  }

  /** A random entry still in the bucket, or undefined if the bucket was made empty. */
  take(): T | undefined {
    if (this.entries.length === 0) return undefined;
    const refilled = this.left.length === 0;
    if (refilled) this.left = [...this.entries];
    let index = Math.floor(this.random() * this.left.length);
    // A fresh bucket doesn't open with the entry the last one ended on: the same track twice in a row.
    if (refilled && this.left.length > 1 && this.left[index] === this.last) index = (index + 1) % this.left.length;
    const [entry] = this.left.splice(index, 1);
    this.last = entry;
    return entry;
  }
}
