import { Shape } from './Shape.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Rect extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ['width', 'height']);
  }
  get type(): string { return 'rect'; }
  move(dx: number, dy: number): void { this.translate(['x'], ['y'], dx, dy); }
  clone(): Rect { return this.copyAppearance(new Rect(this.id, this.value('x'), this.value('y'), this.value('width'), this.value('height'))); }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.rect(this); }
  summary(): string { return `${this.label}  x=${this.value('x')} y=${this.value('y')} w=${this.value('width')} h=${this.value('height')}${this.styleSummary()}`; }
}
