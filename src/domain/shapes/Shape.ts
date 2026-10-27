import { Numeric } from '../Numeric.js';
import { SvgText } from '../SvgText.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';
import type { Group } from './Group.js';

export abstract class Shape {
  private readonly geometry = new Map<string, number>();
  private readonly styles = new Map<string, string>();
  private readonly presentation = new Map<string, string>();
  private parentNode: Group | undefined;
  private static readonly styleKeys = new Set(['fill', 'stroke', 'stroke-width']);
  private static readonly presentationKeys = new Set([
    'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline',
  ]);

  protected constructor(
    readonly id: string,
    values: Readonly<Record<string, number>> = {},
    private readonly nonnegativeKeys: readonly string[] = [],
  ) {
    if (!/^[\p{L}_][\p{L}\p{N}_.:-]*$/u.test(id)) throw new Error(`invalid id: ${id}`);
    for (const [key, value] of Object.entries(values)) this.assignGeometry(key, value);
  }

  abstract get type(): string;
  abstract move(dx: number, dy: number): void;
  abstract clone(): Shape;
  abstract accept<T>(visitor: ShapeVisitor<T>): T;
  abstract summary(): string;

  get parent(): Group | undefined { return this.parentNode; }
  get label(): string { return `${this.type}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }

  asGroup(): Group { throw new Error(`not a container: ${this.id}`); }

  /** Membership is changed only by Group's checked insert/remove operations. */
  attachTo(parent: Group | undefined): void {
    if ((parent && !parent.children.includes(this)) || (!parent && this.parentNode?.children.includes(this))) {
      throw new Error('membership must be changed through a container');
    }
    this.parentNode = parent;
  }

  value(key: string): number {
    const value = this.geometry.get(key);
    if (value === undefined) throw new Error(`unknown attribute: ${key}`);
    return value;
  }

  attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([
      ['id', this.id],
      ...Array.from(this.geometry, ([key, value]) => [key, String(value)]),
      ...this.styles, ...this.presentation,
    ]);
  }

  set(attribute: string, value: string): void {
    if (this.geometry.has(attribute)) {
      this.assignGeometry(attribute, Numeric.parse(value));
      return;
    }
    if (!Shape.styleKeys.has(attribute)) throw new Error(`unknown attribute: ${attribute}`);
    Shape.validatePresentation(value);
    if (attribute === 'stroke-width') Numeric.nonnegative(Numeric.parse(value));
    this.styles.set(attribute, value);
  }

  preservePresentation(attribute: string, value: string): void {
    if (!Shape.presentationKeys.has(attribute)) throw new Error(`unsupported SVG attribute: ${attribute}`);
    Shape.validatePresentation(value);
    this.presentation.set(attribute, value);
  }

  scale(factor: number): void {
    Numeric.positive(factor, 'scale factor must be positive');
    const next = Array.from(this.geometry, ([key, value]) => [key, Numeric.finite(value * factor)] as const);
    for (const [key, value] of next) this.assignGeometry(key, value);
  }

  contains(shape: Shape): boolean {
    return this === shape || this.children.some(child => child.contains(shape));
  }

  inheritStyles(child: Shape): void {
    for (const [key, value] of [...this.styles, ...this.presentation]) {
      if (child.attributes()[key] === undefined) {
        if (Shape.styleKeys.has(key)) child.set(key, value);
        else child.preservePresentation(key, value);
      }
    }
  }

  protected translate(xKeys: readonly string[], yKeys: readonly string[], dx: number, dy: number): void {
    Numeric.finite(dx); Numeric.finite(dy);
    const next = [
      ...xKeys.map(key => [key, Numeric.finite(this.value(key) + dx)] as const),
      ...yKeys.map(key => [key, Numeric.finite(this.value(key) + dy)] as const),
    ];
    for (const [key, value] of next) this.assignGeometry(key, value);
  }

  protected copyAppearance<T extends Shape>(target: T): T {
    for (const [key, value] of this.styles) target.set(key, value);
    for (const [key, value] of this.presentation) target.preservePresentation(key, value);
    return target;
  }

  protected styleSummary(): string {
    return Array.from(this.styles, ([key, value]) => ` ${key}=${value}`).join('');
  }

  private assignGeometry(key: string, value: number): void {
    this.geometry.set(key, this.nonnegativeKeys.includes(key) ? Numeric.nonnegative(value) : Numeric.finite(value));
  }

  private static validatePresentation(value: string): void {
    SvgText.validate(value);
    if (!value.trim() || /(?:url\s*\(|var\s*\(|inherit|currentColor|context-fill|context-stroke|unset|revert|initial)/i.test(value)) {
      throw new Error(`unsupported presentation value: ${value}`);
    }
  }
}
