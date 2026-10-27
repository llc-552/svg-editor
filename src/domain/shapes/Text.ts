import { Shape } from './Shape.js';
import { SvgText } from '../SvgText.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Text extends Shape {
  constructor(id: string, x: number, y: number, private content: string) {
    super(id, { x, y }); SvgText.validate(content);
  }
  get type(): string { return 'text'; }
  override get textContent(): string { return this.content; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') { SvgText.validate(value); this.content = value; }
    else super.set(attribute, value);
  }
  move(dx: number, dy: number): void { this.translate(['x'], ['y'], dx, dy); }
  clone(): Text { return this.copyAppearance(new Text(this.id, this.value('x'), this.value('y'), this.content)); }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.text(this); }
  summary(): string { return `${this.label}  (${this.value('x')},${this.value('y')}) ${JSON.stringify(this.content)}${this.styleSummary()}`; }
}
