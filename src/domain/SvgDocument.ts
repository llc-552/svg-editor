import { Group } from './shapes/Group.js';
import { Shape } from './shapes/Shape.js';
import { Numeric } from './Numeric.js';

export class SvgDocument {
  private rootNode = new Group('__svg_root__');
  private index = new Map<string, Shape>();
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(width = 800, height = 600) {
    this.canvasWidth = Numeric.positive(width);
    this.canvasHeight = Numeric.positive(height);
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return this.rootNode.children; }
  get size(): number { return this.index.size; }
  resize(width: number, height: number): void {
    Numeric.positive(width); Numeric.positive(height);
    this.canvasWidth = width; this.canvasHeight = height;
  }
  has(id: string): boolean { return this.index.has(id); }
  find(id: string): Shape {
    const shape = this.index.get(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    if (!this.has(id)) throw new Error(`no such container: ${id}`);
    return this.find(id).asGroup();
  }
  parentLabel(shape: Shape): string {
    return shape.parent === this.rootNode ? 'svg' : shape.parent?.label ?? 'none';
  }
  add(shape: Shape, parentId?: string): void {
    const parent = parentId === undefined ? this.rootNode : this.container(parentId);
    const additions = this.flatten([shape]);
    const ids = new Set(this.index.keys());
    for (const child of additions) {
      if (ids.has(child.id)) throw new Error(`id already exists: ${child.id}`);
      ids.add(child.id);
    }
    if (shape.parent) throw new Error(`shape is already attached: ${shape.id}`);
    parent.insert(shape);
    this.reindex();
  }
  delete(id: string): void {
    const shape = this.find(id);
    shape.parent!.remove(shape);
    this.reindex();
  }
  addTo(groupId: string, id: string): void {
    this.container(groupId).insert(this.find(id));
    this.reindex();
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }
  group(id: string, selectedIds: readonly string[]): void {
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
    if (!selectedIds.length) throw new Error('group requires at least one shape');
    if (new Set(selectedIds).size !== selectedIds.length) throw new Error('duplicate group target');
    const selected = selectedIds.map(target => this.find(target));
    for (const a of selected) for (const b of selected) {
      if (a !== b && a.contains(b)) throw new Error(`cannot group a container into its own descendant: ${a.id}`);
    }
    const ordered = this.flatten(this.children).filter(shape => selected.includes(shape));
    let parent = ordered[0]!.parent!;
    while (!ordered.every(shape => parent.contains(shape))) parent = parent.parent!;
    const position = parent.children.findIndex(branch => ordered.some(shape => branch.contains(shape)));
    const group = new Group(id);
    parent.insert(group, position);
    for (const shape of ordered) group.insert(shape);
    this.reindex();
  }
  ungroup(id: string): void {
    const group = this.find(id).asGroup();
    const parent = group.parent!;
    if (parent === this.rootNode) throw new Error(`cannot ungroup top-level container: ${id}`);
    let index = parent.children.indexOf(group);
    const children = group.children;
    parent.remove(group);
    for (const child of children) {
      group.inheritStyles(child);
      parent.insert(child, index++);
    }
    this.reindex();
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    copy.rootNode = this.rootNode.clone();
    copy.reindex();
    return copy;
  }
  private flatten(nodes: readonly Shape[]): Shape[] {
    return nodes.flatMap(node => [node, ...this.flatten(node.children)]);
  }
  private reindex(): void {
    this.index = new Map(this.flatten(this.children).map(shape => [shape.id, shape]));
  }
}
