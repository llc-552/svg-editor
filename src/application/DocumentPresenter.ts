import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/shapes/Shape.js';

export class DocumentPresenter {
  tree(document: SvgDocument, id?: string): string {
    if (id !== undefined) {
      const shape = document.find(id);
      return [shape.summary(), ...this.children(shape.children, '')].join('\n');
    }
    return [`svg (${document.width}x${document.height})`, ...this.children(document.children, '')].join('\n');
  }
  show(document: SvgDocument, id: string): string {
    const shape = document.find(id);
    const entries = Object.entries(shape.attributes()).filter(([key]) => key !== 'id');
    if (shape.textContent !== undefined) entries.push(['text', JSON.stringify(shape.textContent)]);
    return [`${shape.label}  parent=${document.parentLabel(shape)}`, ...entries.map(([key, value]) => `  ${key}=${value}`)].join('\n');
  }
  private children(nodes: readonly Shape[], prefix: string): string[] {
    return nodes.flatMap((node, index) => {
      const last = index === nodes.length - 1;
      return [
        `${prefix}${last ? '└── ' : '├── '}${node.summary()}`,
        ...this.children(node.children, prefix + (last ? '    ' : '│   ')),
      ];
    });
  }
}
