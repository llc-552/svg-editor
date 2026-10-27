import type { Rect } from '../shapes/Rect.js';
import type { Circle } from '../shapes/Circle.js';
import type { Ellipse } from '../shapes/Ellipse.js';
import type { Line } from '../shapes/Line.js';
import type { Text } from '../shapes/Text.js';
import type { Group } from '../shapes/Group.js';

export interface ShapeVisitor<T> {
  rect(shape: Rect): T;
  circle(shape: Circle): T;
  ellipse(shape: Ellipse): T;
  line(shape: Line): T;
  text(shape: Text): T;
  group(shape: Group): T;
}
