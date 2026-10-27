import { Shape } from './Shape.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number) { super(id, { cx, cy, r }, ['r']); }
  get type(): string { return 'circle'; }
  move(dx: number, dy: number): void { this.translate(['cx'], ['cy'], dx, dy); }
  clone(): Circle { return this.copyAppearance(new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r'))); }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.circle(this); }
  summary(): string { return `${this.label}  cx=${this.value('cx')} cy=${this.value('cy')} r=${this.value('r')}${this.styleSummary()}`; }
}
