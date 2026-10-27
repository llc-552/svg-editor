import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeFileStore } from '../src/infrastructure/filesystem/NodeFileStore.js';
import { EditorHarness } from './support/EditorHarness.js';

test('assignment transcript replays with exactly its two intentional errors', async () => {
  const h = new EditorHarness();
  h.files.files.set('fixtures/other.svg', await readFile('fixtures/other.svg', 'utf8'));
  const outputs = await h.script(await readFile('fixtures/session.commands', 'utf8'));
  const errors = outputs.filter(output => output.startsWith('error:'));
  assert.deepEqual(errors, [
    'error: cannot group a container into its own descendant: markers',
    'error: undo not allowed after io command',
  ]);
  assert.equal(h.codec.decode(h.files.files.get('output/demo.svg')!).document.size, 5);
  assert.equal(h.session.document().size, 7);
  assert.match(outputs.at(-1)!, /rect#rect1/);
});

test('flowchart example produces the complete nested document and expected geometry', async () => {
  const h = new EditorHarness();
  const outputs = await h.script(await readFile('fixtures/flowchart.commands', 'utf8'));
  assert.deepEqual(outputs.filter(output => output.startsWith('error:')), []);
  const document = h.codec.decode(h.files.files.get('output/flowchart.svg')!).document;
  assert.equal(document.size, 8);
  assert.equal(document.find('process').value('y'), 100);
  assert.equal(document.find('process-label').textContent, '处理数据 v2');
  assert.equal(document.find('process-label').parent?.id, 'node2');
  assert.equal(document.find('arrow1').parent?.id, 'flowchart');
});

test('real file store overwrites atomically and cleans temporary files after success and failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-editor-'));
  const files = new NodeFileStore();
  try {
    const path = join(directory, 'demo.svg');
    await files.write(path, 'first'); await files.write(path, 'second 中文');
    assert.equal(await files.read(path), 'second 中文');
    await assert.rejects(() => files.write(join(directory, 'absent', 'bad.svg'), 'bad'));
    await mkdir(join(directory, 'existing-directory'));
    await assert.rejects(() => files.write(join(directory, 'existing-directory'), 'bad'));
    assert.deepEqual((await readdir(directory)).sort(), ['demo.svg', 'existing-directory']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
