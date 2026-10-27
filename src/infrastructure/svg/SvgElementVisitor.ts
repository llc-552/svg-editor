import type { Document, Element } from '@xmldom/xmldom';
import type { ShapeVisitor } from '../../domain/traversal/ShapeVisitor.js';
import type { Shape } from '../../domain/shapes/Shape.js';
import type { Rect } from '../../domain/shapes/Rect.js';
import type { Circle } from '../../domain/shapes/Circle.js';
import type { Ellipse } from '../../domain/shapes/Ellipse.js';
import type { Line } from '../../domain/shapes/Line.js';
import type { Text } from '../../domain/shapes/Text.js';
import type { Group } from '../../domain/shapes/Group.js';

export class SvgElementVisitor implements ShapeVisitor<Element> {
  constructor(private readonly document: Document) {}
  rect(shape: Rect): Element { return this.element(shape); }
  circle(shape: Circle): Element { return this.element(shape); }
  ellipse(shape: Ellipse): Element { return this.element(shape); }
  line(shape: Line): Element { return this.element(shape); }
  text(shape: Text): Element {
    const element = this.element(shape);
    element.appendChild(this.document.createTextNode(shape.textContent));
    return element;
  }
  group(shape: Group): Element {
    const element = this.element(shape);
    for (const child of shape.children) element.appendChild(child.accept(this));
    return element;
  }
  private element(shape: Shape): Element {
    const element = this.document.createElementNS('http://www.w3.org/2000/svg', shape.type);
    for (const [key, value] of Object.entries(shape.attributes())) element.setAttribute(key, value);
    return element;
  }
}
