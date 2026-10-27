import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EditorHarness } from './support/EditorHarness.js';

test('SVG round trip retains all six types, styles, text and child order', async () => {
  const h = new EditorHarness(); await h.ok('init 400 200'); await h.ok('create g scene');
  await h.ok('set scene fill red');
  for (const line of [
    'create rect r 1 2 3 4 in scene', 'create circle c 1 2 3 blue in scene',
    'create ellipse e 1 2 3 4 in scene', 'create line l 1 2 3 4 black in scene',
    String.raw`create text t 10 20 "中文 <开始> & \"引号\"" in scene`,
  ]) await h.ok(line);
  const source = h.snapshot(); assert.match(source, /&lt;开始&gt;/); assert.match(source, /&amp;/);
  const result = h.codec.decode(source);
  assert.equal(h.codec.encode(result.document), source);
  assert.equal(result.document.find('t').textContent, '中文 <开始> & "引号"');
  assert.equal(result.document.find('r').attributes().fill, undefined);
});

test('missing IDs avoid explicit IDs later in file and warnings match requirement', () => {
  const h = new EditorHarness();
  const result = h.codec.decode('<svg width="100" height="100"><g><rect/><rect id="rect1"/><rect/></g></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id rect3 to unnamed <rect>',
  ]);
  assert.equal(result.document.size, 4);
});

test('SVG dimensions accept px and matching viewBox, infer missing sizes', () => {
  const codec = new EditorHarness().codec;
  assert.equal(codec.decode('<svg width="400px" height="200px" viewBox="0 0 400 200"/>').document.width, 400);
  assert.equal(codec.decode('<svg viewBox="0,0,400,200"/>').document.height, 200);
  assert.throws(() => codec.decode('<svg width="100%" height="200"/>'), /invalid number/);
  assert.throws(() => codec.decode('<svg width="100" height="200" viewBox="0 0 200 200"/>'), /viewBox/);
  assert.throws(() => codec.decode('<svg viewBox="1 0 100 100"/>'), /viewBox/);
});

test('SVG retains supported text presentation without expanding set whitelist', () => {
  const h = new EditorHarness();
  const result = h.codec.decode('<svg width="100" height="100"><text id="t" x="10" y="20" font-size="16" text-anchor="middle" font-family="sans-serif">Hi</text></svg>');
  const source = h.codec.encode(result.document);
  assert.match(source, /font-size="16"/); assert.match(source, /text-anchor="middle"/);
  assert.throws(() => result.document.find('t').set('font-size', '20'), /unknown attribute/);
});

test('malformed and unsupported SVG is rejected instead of silently losing data', () => {
  const codec = new EditorHarness().codec;
  for (const source of [
    '<svg width="100" height="100"><rect></svg>',
    '<svg width="100" height="100"><path id="p" d="M0 0"/></svg>',
    '<svg width="100" height="100"><g id="g" transform="translate(1,2)"/></svg>',
    '<svg width="100" height="100"><rect id="r" opacity=".5"/></svg>',
    '<svg width="100" height="100"><rect id="r"/><circle id="r"/></svg>',
    '<svg width="100" height="100"><rect id=""/></svg>',
    '<svg width="100" height="100" style="background:red"/>',
    '<svg width="100" height="100"><g id="g">lost text</g></svg>',
    '<svg width="100" height="100"><text id="t"><g/></text></svg>',
    '<!DOCTYPE svg [<!ENTITY x "abc">]><svg width="100" height="100"/>',
    '<?xml-stylesheet href="x.css"?><svg width="100" height="100"/>',
    '<svg xmlns="https://wrong.example" width="100" height="100"/>',
  ]) assert.throws(() => codec.decode(source), source);
});

test('save remembers successful path and disables undo; failed save preserves redo and path', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g a');
  await h.fails('save', /no file path/); await h.ok('undo'); await h.ok('redo');
  await h.ok('save first.svg'); await h.fails('undo', /undo not allowed/);
  await h.ok('create g b'); await h.ok('undo'); const before = h.snapshot();
  h.files.failWrites = true; await h.fails('save failed.svg', /cannot write file/);
  assert.equal(h.snapshot(), before); await h.ok('redo');
  h.files.failWrites = false; await h.ok('save');
  assert.ok(!h.files.files.has('failed.svg'));
  assert.match(h.files.files.get('first.svg')!, /id="b"/);
});

test('failed read and parse preserve document, remembered path and history', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('save valid.svg');
  await h.ok('create g a'); await h.ok('create g b'); await h.ok('undo');
  const before = h.snapshot(); h.files.files.set('bad.svg', '<svg>broken');
  await h.fails('read absent.svg', /cannot read file/);
  await h.fails('read bad.svg', /invalid SVG|missing SVG/);
  assert.equal(h.snapshot(), before); await h.ok('redo'); await h.ok('save');
  assert.match(h.files.files.get('valid.svg')!, /id="b"/);
});

test('successful read replaces document, reports warnings and resets history', async () => {
  const h = new EditorHarness(); await h.ok('init'); await h.ok('create g old');
  h.files.files.set('other.svg', await readFile('fixtures/other.svg', 'utf8'));
  const result = await h.ok('read other.svg');
  assert.match(result, /warning: assigned id rect1 to unnamed <rect>/);
  assert.equal(h.session.document().size, 7);
  assert.ok(!h.session.document().has('old'));
  await h.fails('redo', /undo not allowed/);
  await h.ok('save'); assert.match(h.files.files.get('other.svg')!, /id="rect1"/);
});
