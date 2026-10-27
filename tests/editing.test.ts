import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorHarness } from './support/EditorHarness.js';

test('create supports all six types and validates target containers atomically', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g root');
  for (const line of [
    'create rect r 1 2 3 4 #ffffff in root', 'create circle c 5 6 7 in root',
    'create ellipse e 1 2 3 4 red in root', 'create line l 1 2 3 4 black in root',
    'create text t 10 20 "hello world" in root', 'create g nested in root',
  ]) await h.ok(line);
  assert.equal(h.session.document().size, 7);
  const before = h.snapshot();
  for (const [line, error] of [
    ['create g r', /id already exists/], ['create g bad in missing', /no such container/],
    ['create g bad in r', /not a container/], ['create box bad', /unknown shape type/],
  ] as const) { await h.fails(line, error); assert.equal(h.snapshot(), before); }
  assert.equal(h.session.document().find('c').attributes().fill, undefined);
});

test('nested move and scale are single undo units and snapshots remain independent', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g g1');
  await h.ok('create g g2 in g1'); await h.ok('create rect r 1 2 3 4 in g2');
  const original = h.snapshot();
  await h.ok('move g1 10 20'); const moved = h.snapshot();
  await h.ok('scale g1 2'); const scaled = h.snapshot();
  assert.equal(h.session.document().find('r').value('x'), 22);
  await h.ok('undo'); assert.equal(h.snapshot(), moved);
  await h.ok('undo'); assert.equal(h.snapshot(), original);
  await h.ok('redo'); assert.equal(h.snapshot(), moved);
  await h.ok('redo'); assert.equal(h.snapshot(), scaled);
  await h.ok('undo'); await h.ok('undo'); assert.equal(h.snapshot(), original);
});

test('failed edits preserve redo while successful new edits clear it', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create rect r 1 2 3 4');
  await h.ok('move r 10 0'); const moved = h.snapshot(); await h.ok('undo');
  await h.fails('set r width -1', /nonnegative/);
  await h.ok('tree'); await h.ok('show r'); await h.ok('help');
  await h.ok('redo'); assert.equal(h.snapshot(), moved);
  await h.ok('undo'); await h.ok('set r fill red');
  await h.fails('redo', /nothing to redo/);
});

test('overflow halfway through recursive edits does not change current document or history', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g g');
  await h.ok('create rect small 1 2 3 4 in g');
  await h.ok('create circle huge 1e308 0 1 in g');
  const before = h.snapshot();
  await h.fails('scale g 2', /finite/); assert.equal(h.snapshot(), before);
  await h.fails('move g 1e308 0', /finite/); assert.equal(h.snapshot(), before);
  await h.ok('undo'); assert.ok(!h.session.document().has('huge'));
  await h.ok('redo'); assert.equal(h.snapshot(), before);
});

test('delete a subtree and undo restores children, parent and sibling position', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g root');
  await h.ok('create g a in root'); await h.ok('create g nested in root');
  await h.ok('create text t 1 2 "label" in nested'); await h.ok('create g tail in root');
  const before = h.snapshot(); await h.ok('delete nested');
  assert.ok(!h.session.document().has('nested')); assert.ok(!h.session.document().has('t'));
  await h.ok('undo'); assert.equal(h.snapshot(), before);
  await h.ok('redo'); assert.equal(h.session.document().size, 3);
});

test('group preserves original order and one undo restores all original parents', async () => {
  const h = new EditorHarness(); await h.ok('init');
  await h.ok('create g a'); await h.ok('create g b');
  await h.ok('create rect r 1 2 3 4 in a'); await h.ok('create circle c 1 2 3 in b');
  const before = h.snapshot(); await h.ok('group combined c r');
  assert.deepEqual(h.session.document().find('combined').children.map(child => child.id), ['r', 'c']);
  const grouped = h.snapshot(); await h.ok('undo'); assert.equal(h.snapshot(), before);
  await h.ok('redo'); assert.equal(h.snapshot(), grouped);
});

test('invalid structural commands preserve tree and history', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g outer');
  await h.ok('create g inner in outer'); await h.ok('create rect r 0 0 10 10 in inner');
  const before = h.snapshot();
  for (const [line, error] of [
    ['group bad r outer', /own descendant/], ['group bad r r', /duplicate/],
    ['addto inner outer', /own descendant/], ['addto inner inner', /own descendant/],
    ['ungroup outer', /top-level/], ['ungroup r', /not a container/],
  ] as const) { await h.fails(line, error); assert.equal(h.snapshot(), before); }
  await h.ok('undo'); assert.ok(!h.session.document().has('r'));
});

test('addto appends and undo restores original parent and order', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g a'); await h.ok('create g b');
  await h.ok('create g first in a'); await h.ok('create g middle in a'); await h.ok('create g last in a');
  await h.ok('create g existing in b'); const before = h.snapshot();
  await h.ok('addto b middle');
  assert.deepEqual(h.session.document().find('b').children.map(node => node.id), ['existing', 'middle']);
  await h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('front/back only reorder siblings and their undo restores exact order', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g root');
  for (const id of ['a', 'b', 'c']) await h.ok(`create g ${id} in root`);
  const before = h.snapshot(); await h.ok('front a');
  assert.deepEqual(h.session.document().find('root').children.map(node => node.id), ['b', 'c', 'a']);
  await h.ok('back c');
  assert.deepEqual(h.session.document().find('root').children.map(node => node.id), ['c', 'b', 'a']);
  await h.ok('undo'); await h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('nested ungroup replaces original slot and is one undo unit', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g outer');
  await h.ok('create g inner in outer'); await h.ok('create g a in inner'); await h.ok('create g b in inner');
  await h.ok('create g tail in outer'); const before = h.snapshot();
  await h.ok('ungroup inner');
  assert.deepEqual(h.session.document().find('outer').children.map(node => node.id), ['a', 'b', 'tail']);
  await h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('set changes only whitelisted attributes and text, including empty content', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g g');
  await h.ok('create text t 1 2 "old" in g'); await h.ok('set t text "new 中文"');
  await h.ok('set t x -1.5'); await h.ok('set g fill red');
  assert.equal(h.session.document().find('t').attributes().fill, undefined);
  assert.equal(h.session.document().find('g').attributes().fill, 'red');
  await h.ok('set t text ""'); assert.equal(h.session.document().find('t').textContent, '');
  const before = h.snapshot();
  await h.fails('set t font-size 20', /unknown attribute/);
  await h.fails('set t stroke-width -1', /nonnegative/);
  await h.fails('set t id new', /unknown attribute/);
  assert.equal(h.snapshot(), before);
});

test('canvas query preserves history; successful document changes disable it', async () => {
  const h = new EditorHarness(); await h.ok('init');
  await h.fails('undo', /undo not allowed after io command/);
  await h.ok('create g g'); await h.ok('canvas'); await h.ok('undo'); await h.ok('redo');
  await h.ok('canvas 400 300'); await h.fails('undo', /undo not allowed after io command/);
  await h.fails('create rect r 0 0 -1 1', /nonnegative/);
  await h.fails('redo', /undo not allowed after io command/);
  await h.ok('create g after'); await h.ok('undo'); await h.fails('undo', /nothing to undo/);
  await h.ok('init'); assert.equal(h.session.document().size, 0);
});

test('failed init and invalid canvas preserve document and redo', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g a');
  await h.ok('create g b'); await h.ok('undo'); const before = h.snapshot();
  await h.fails('init -1 20', /positive/); await h.fails('canvas 20 NaN', /invalid number/);
  assert.equal(h.snapshot(), before); await h.ok('redo'); assert.ok(h.session.document().has('b'));
});

test('text rejects invalid XML characters atomically and accepts supplementary Unicode', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create text t 1 2 "开始 🚀"');
  const before = h.snapshot();
  await h.fails('set t text "bad\u0000text"', /invalid XML/);
  await h.fails('set t text "bad\ud800text"', /invalid XML/);
  assert.equal(h.snapshot(), before);
  assert.equal(h.codec.decode(before).document.find('t').textContent, '开始 🚀');
});
