import { Numeric } from './Numeric.js';
import { Shape } from './shapes/Shape.js';
import { Rect } from './shapes/Rect.js';
import { Circle } from './shapes/Circle.js';
import { Ellipse } from './shapes/Ellipse.js';
import { Line } from './shapes/Line.js';
import { Text } from './shapes/Text.js';
import { Group } from './shapes/Group.js';

type Definition = {
  readonly keys: readonly string[];
  readonly create: (id: string, values: readonly number[], text: string) => Shape;
  readonly text?: boolean;
  readonly color?: string;
};

export class ShapeFactory {
  // The single type-name dispatch point; replace with providers in the plugin phase.
  private readonly definitions = new Map<string, Definition>([
    ['rect', { keys: ['x', 'y', 'width', 'height'], color: 'fill', create: (id, v) => new Rect(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['circle', { keys: ['cx', 'cy', 'r'], color: 'fill', create: (id, v) => new Circle(id, v[0]!, v[1]!, v[2]!) }],
    ['ellipse', { keys: ['cx', 'cy', 'rx', 'ry'], color: 'fill', create: (id, v) => new Ellipse(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['line', { keys: ['x1', 'y1', 'x2', 'y2'], color: 'stroke', create: (id, v) => new Line(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['text', { keys: ['x', 'y'], text: true, create: (id, v, text) => new Text(id, v[0]!, v[1]!, text) }],
    ['g', { keys: [], create: id => new Group(id) }],
  ]);
  create(type: string, id: string, parameters: readonly string[]): Shape {
    const definition = this.definition(type);
    const required = definition.keys.length + (definition.text ? 1 : 0);
    if (parameters.length < required || parameters.length > required + (definition.color ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}`);
    }
    const values = parameters.slice(0, definition.keys.length).map(value => Numeric.parse(value));
    const shape = definition.create(id, values, definition.text ? parameters[definition.keys.length]! : '');
    if (definition.color && parameters.length > required) shape.set(definition.color, parameters[required]!);
    return shape;
  }
  fromSvg(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const definition = this.definition(type);
    const parameters = definition.keys.map(key => attributes[key] ?? '0');
    if (definition.text) parameters.push(text);
    const shape = this.create(type, id, parameters);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'id' || definition.keys.includes(key)) continue;
      if (['fill', 'stroke', 'stroke-width'].includes(key)) shape.set(key, value);
      else shape.preservePresentation(key, value);
    }
    return shape;
  }
  private definition(type: string): Definition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
}
