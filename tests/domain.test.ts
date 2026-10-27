import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { Group } from '../src/domain/shapes/Group.js';
import { Rect } from '../src/domain/shapes/Rect.js';

test('all geometry scales, including position, endpoints and nested descendants', () => {
  const factory = new ShapeFactory();
  const document = new SvgDocument();
  document.add(new Group('scene'));
  document.add(new Group('nested'), 'scene');
  const inputs = [
    ['rect', ['1', '2', '3', '4']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4']], ['text', ['1', '2', '中文']],
  ] as const;
  for (const [type, args] of inputs) document.add(factory.create(type, type, args), 'nested');
  document.find('scene').move(10, -5);
  document.find('scene').scale(2);
  assert.deepEqual(document.find('rect').attributes(), { id: 'rect', x: '22', y: '-6', width: '6', height: '8' });
  assert.deepEqual(document.find('line').attributes(), { id: 'line', x1: '22', y1: '-6', x2: '26', y2: '-2' });
  assert.equal(document.find('circle').value('r'), 6);
  assert.equal(document.find('ellipse').value('ry'), 8);
  assert.equal(document.find('text').textContent, '中文');
});

test('clone has independent nodes, parents, styles and ID index', () => {
  const document = new SvgDocument();
  document.add(new Group('g')); document.add(new Rect('r', 1, 2, 3, 4), 'g');
  document.find('g').set('fill', 'red');
  const copy = document.clone();
  copy.find('g').move(10, 0); copy.find('g').set('fill', 'blue');
  assert.equal(document.find('r').value('x'), 1);
  assert.equal(document.find('g').attributes().fill, 'red');
  assert.notEqual(copy.find('r').parent, document.find('r').parent);
  copy.delete('g');
  assert.equal(copy.size, 0); assert.equal(document.size, 2);
});

test('group uses tree order, common ancestor and stable insertion position', () => {
  const document = new SvgDocument();
  document.add(new Group('left')); document.add(new Group('right'));
  document.add(new Rect('a', 0, 0, 1, 1), 'left'); document.add(new Rect('b', 0, 0, 1, 1), 'right');
  document.group('joined', ['b', 'a']);
  assert.deepEqual(document.children.map(node => node.id), ['joined', 'left', 'right']);
  assert.deepEqual(document.find('joined').children.map(node => node.id), ['a', 'b']);
  assert.equal(document.find('a').parent?.id, 'joined');
});

test('cycles, ancestor selections and duplicate IDs are rejected', () => {
  const document = new SvgDocument();
  document.add(new Group('outer')); document.add(new Group('inner'), 'outer');
  assert.throws(() => document.addTo('inner', 'outer'), /own descendant/);
  assert.throws(() => document.group('bad', ['inner', 'outer']), /own descendant/);
  assert.throws(() => document.add(new Group('inner')), /id already exists/);
  assert.deepEqual(document.children.map(node => node.id), ['outer']);
  assert.equal(document.find('inner').parent?.id, 'outer');
});

test('nested ungroup replaces position and retains inherited style', () => {
  const document = new SvgDocument();
  document.add(new Group('outer')); document.add(new Group('inner'), 'outer');
  document.find('inner').set('fill', 'red');
  document.add(new Rect('a', 0, 0, 1, 1), 'inner');
  document.add(new Rect('b', 0, 0, 1, 1), 'inner'); document.find('b').set('fill', 'blue');
  document.add(new Rect('tail', 0, 0, 1, 1), 'outer');
  document.ungroup('inner');
  assert.deepEqual(document.find('outer').children.map(node => node.id), ['a', 'b', 'tail']);
  assert.equal(document.find('a').attributes().fill, 'red');
  assert.equal(document.find('b').attributes().fill, 'blue');
  assert.throws(() => document.ungroup('outer'), /top-level/);
});

test('geometry and attribute constraints are enforced', () => {
  const factory = new ShapeFactory();
  assert.throws(() => factory.create('box', 'b', []), /unknown shape type/);
  assert.throws(() => factory.create('rect', 'r', ['0', '0', '-1', '2']), /nonnegative/);
  const rectangle = new Rect('r', 0, 0, 1, 1);
  assert.throws(() => rectangle.set('r', '2'), /unknown attribute/);
  assert.throws(() => rectangle.set('x', 'NaN'), /invalid number/);
  assert.throws(() => rectangle.scale(0), /positive/);
  assert.equal(rectangle.attributes().fill, undefined);
});
