import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { EditorHarness } from './support/EditorHarness.js';

test('tokenizer preserves colors, empty strings, escapes and Windows paths', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # comment'), []);
  assert.deepEqual(tokenizer.tokenize('create rect r -1 .5 20 30 #ffffff'), ['create', 'rect', 'r', '-1', '.5', '20', '30', '#ffffff']);
  assert.deepEqual(tokenizer.tokenize('set t text ""'), ['set', 't', 'text', '']);
  assert.deepEqual(tokenizer.tokenize(String.raw`set t text "中文 \"title\" \\ end"`), ['set', 't', 'text', '中文 "title" \\ end']);
  assert.deepEqual(tokenizer.tokenize(String.raw`read F:\绘图\test.svg`), ['read', String.raw`F:\绘图\test.svg`]);
  assert.throws(() => tokenizer.tokenize('set t text "unfinished'), /unterminated/);
});

test('document guard, help and bad command inputs provide single-line errors', async () => {
  const h = new EditorHarness();
  assert.match(await h.ok('help'), /create <type>/);
  await h.fails('tree', /no document/);
  await h.fails('undo', /no document/);
  await h.fails('wrong', /unknown command/);
  await h.fails('init a 1', /invalid number/);
  await h.ok('init');
  assert.equal(await h.ok('canvas'), 'canvas 800x600');
  await h.fails('create rect r 0 0 10', /invalid parameters/);
  await h.fails('move', /usage/);
  await h.fails('canvas 10', /usage/);
  const error = await h.fails('set t text "first\nsecond"', /no such shape/);
  assert.ok(!error.includes('\n'));
});

test('tree and show include key geometry, content and parent', async () => {
  const h = new EditorHarness();
  await h.ok('init 400 300'); await h.ok('create g g1');
  await h.ok('create text title 10 20 "My Diagram 中文" in g1');
  const tree = await h.ok('tree');
  assert.match(tree, /svg \(400x300\)/);
  assert.match(tree, /└── g#g1\n    └── text#title  \(10,20\) "My Diagram 中文"/);
  assert.match(await h.ok('show title'), /parent=g#g1/);
  assert.match(await h.ok('tree title'), /^text#title/);
  assert.ok(!(await h.ok('tree title')).includes('svg ('));
});

test('actual CLI processes piped commands, recovers after errors and exits on EOF', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 15000,
    input: '# replay\ninit 400 200\ncreate rect r 10 20 30 40 red\nmove missing 1 2\ntree\n',
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /canvas 400x200 created/);
  assert.match(result.stdout, /error: no such shape: missing/);
  assert.match(result.stdout, /rect#r  x=10 y=20 w=30 h=40 fill=red/);
  assert.equal(result.stderr, '');
});
