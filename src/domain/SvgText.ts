export class SvgText {
  static validate(value: string): void {
    // XML 1.0 permits tabs, newlines and Unicode scalar values, but not these characters.
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF\p{Cs}]/u.test(value)) {
      throw new Error('text contains invalid XML characters');
    }
  }
}
