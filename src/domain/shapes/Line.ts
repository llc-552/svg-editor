import { Shape } from './Shape.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) { super(id, { x1, y1, x2, y2 }); }
  get type(): string { return 'line'; }
  move(dx: number, dy: number): void { this.translate(['x1', 'x2'], ['y1', 'y2'], dx, dy); }
  clone(): Line { return this.copyAppearance(new Line(this.id, this.value('x1'), this.value('y1'), this.value('x2'), this.value('y2'))); }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.line(this); }
  summary(): string { return `${this.label}  (${this.value('x1')},${this.value('y1')}) -> (${this.value('x2')},${this.value('y2')})${this.styleSummary()}`; }
}
