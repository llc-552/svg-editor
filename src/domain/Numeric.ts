export class Numeric {
  static parse(value: string): number {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`invalid number: ${value}`);
    }
    return Numeric.finite(Number(value));
  }

  static finite(value: number): number {
    if (!Number.isFinite(value)) throw new Error('number must be finite');
    return Object.is(value, -0) ? 0 : value;
  }

  static nonnegative(value: number): number {
    Numeric.finite(value);
    if (value < 0) throw new Error('size must be nonnegative');
    return value;
  }

  static positive(value: number, message = 'size must be positive'): number {
    Numeric.finite(value);
    if (value <= 0) throw new Error(message);
    return value;
  }
}
