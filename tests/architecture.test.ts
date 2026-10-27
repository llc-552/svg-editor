import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';

test('source imports respect module dependency rules and classes use matching file names', async () => {
  const root = resolve('src');
  const entries = await readdir(root, { recursive: true });
  const allowed = new Map<string, readonly string[]>([
    ['domain', ['domain']], ['application', ['application', 'domain']],
    ['cli', ['cli', 'application']], ['infrastructure', ['infrastructure', 'application', 'domain']],
  ]);
  for (const file of entries.filter(file => file.endsWith('.ts'))) {
    const absolute = resolve(root, file);
    const source = await readFile(absolute, 'utf8');
    const layer = file.split(/[\\/]/)[0]!;
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const dependency = match[1]!;
      if (dependency.startsWith('.')) {
        const target = relative(root, resolve(dirname(absolute), dependency)).split(/[\\/]/)[0]!;
        if (layer !== 'main.ts') assert.ok(allowed.get(layer)?.includes(target), `${file} -> ${dependency}`);
      } else if (layer === 'domain' || layer === 'application') {
        assert.fail(`${file} must not depend on external module ${dependency}`);
      }
    }
    const classes = [...source.matchAll(/export (?:abstract )?class (\w+)/g)].map(match => match[1]);
    assert.ok(classes.length <= 1, `${file} defines multiple classes`);
    if (classes.length) assert.equal(file.split(/[\\/]/).at(-1), `${classes[0]}.ts`);
    assert.doesNotMatch(source, /\bswitch\s*\(/, `${file} must use polymorphic dispatch`);
  }
});
