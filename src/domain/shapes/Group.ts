import { Shape } from './Shape.js';
import { Numeric } from '../Numeric.js';
import type { ShapeVisitor } from '../traversal/ShapeVisitor.js';

export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  constructor(id: string) { super(id); }
  get type(): string { return 'g'; }
  override get children(): readonly Shape[] { return [...this.nodes]; }
  override asGroup(): Group { return this; }
  move(dx: number, dy: number): void { for (const child of this.nodes) child.move(dx, dy); }
  override scale(factor: number): void {
    Numeric.positive(factor, 'scale factor must be positive');
    for (const child of this.nodes) child.scale(factor);
  }
  insert(child: Shape, index = this.nodes.length): void {
    if (child.contains(this)) throw new Error(`cannot group a container into its own descendant: ${child.id}`);
    if (!Number.isInteger(index) || index < 0 || index > this.nodes.length) throw new Error('invalid child index');
    child.parent?.remove(child);
    this.nodes.splice(Math.min(index, this.nodes.length), 0, child);
    child.attachTo(this);
  }
  remove(child: Shape): void {
    const index = this.nodes.indexOf(child);
    if (index < 0) throw new Error(`no such child: ${child.id}`);
    this.nodes.splice(index, 1);
    child.attachTo(undefined);
  }
  clone(): Group {
    const group = this.copyAppearance(new Group(this.id));
    for (const child of this.nodes) group.insert(child.clone());
    return group;
  }
  accept<T>(visitor: ShapeVisitor<T>): T { return visitor.group(this); }
  summary(): string { return `${this.label}${this.styleSummary()}`; }
}
