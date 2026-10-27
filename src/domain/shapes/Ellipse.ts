import { Shape } from './Shape.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, { cx, cy, rx, ry }, ['rx', 'ry']); }
  get type(): string { return 'ellipse'; }
  move(dx: number, dy: number): void { this.translate(['cx'], ['cy'], dx, dy); }
  clone(): Ellipse { return this.copyAppearance(new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry'))); }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.ellipse(this); }
  summary(): string { return `${this.label}  cx=${this.value('cx')} cy=${this.value('cy')} rx=${this.value('rx')} ry=${this.value('ry')}${this.styleSummary()}`; }
}
