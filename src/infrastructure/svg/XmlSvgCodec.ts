import { DOMImplementation, DOMParser, XMLSerializer, onWarningStopParsing } from '@xmldom/xmldom';
import type { Element, Node } from '@xmldom/xmldom';
import type { SvgCodec } from '../../application/ports/SvgCodec.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
import { SvgDocument } from '../../domain/SvgDocument.js';
import { Numeric } from '../../domain/Numeric.js';
import type { Shape } from '../../domain/shapes/Shape.js';
import { SvgElementVisitor } from './SvgElementVisitor.js';

export class XmlSvgCodec implements SvgCodec {
  private static readonly namespace = 'http://www.w3.org/2000/svg';
  constructor(private readonly factory: ShapeFactory) {}

  decode(source: string): { document: SvgDocument; warnings: readonly string[] } {
    if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(source)) throw new Error('unsupported SVG: DTD and entity definitions');
    let xml;
    try { xml = new DOMParser({ onError: onWarningStopParsing }).parseFromString(source, 'application/xml'); }
    catch { throw new Error('invalid SVG XML'); }
    const root = xml.documentElement;
    if (!root || root.tagName !== 'svg') throw new Error('expected SVG root element');
    this.checkNamespace(root);
    for (const node of Array.from(xml.childNodes)) {
      if (node.nodeType === 7 && node.nodeName !== 'xml') throw new Error('unsupported SVG processing instruction');
      if (node.nodeType === 3 && node.nodeValue?.trim()) throw new Error('unexpected text outside SVG');
    }
    const rootAttributes = this.attributes(root);
    for (const key of Object.keys(rootAttributes)) {
      if (!['xmlns', 'width', 'height', 'viewBox'].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    }
    let viewBox: number[] | undefined;
    if (rootAttributes.viewBox !== undefined) {
      viewBox = rootAttributes.viewBox.trim().split(/[\s,]+/).map(value => Numeric.parse(value));
      if (viewBox.length !== 4 || viewBox[0] !== 0 || viewBox[1] !== 0) throw new Error('unsupported SVG viewBox');
      Numeric.positive(viewBox[2]!); Numeric.positive(viewBox[3]!);
    }
    const width = this.dimension(rootAttributes.width, viewBox?.[2], 'width');
    const height = this.dimension(rootAttributes.height, viewBox?.[3], 'height');
    if (viewBox && (viewBox[2] !== width || viewBox[3] !== height)) throw new Error('unsupported SVG viewBox: must match canvas dimensions');
    const document = new SvgDocument(width, height);
    const used = new Set<string>();
    const elements = Array.from(root.getElementsByTagName('*'));
    for (const element of elements) {
      if (element.hasAttribute('id')) {
        const id = element.getAttribute('id')!;
        if (!id) throw new Error('invalid id: empty SVG id');
        if (used.has(id)) throw new Error(`id already exists: ${id}`);
        used.add(id);
      }
    }
    const warnings: string[] = [];
    for (const element of this.elementChildren(root)) document.add(this.readShape(element, used, warnings));
    return { document, warnings };
  }

  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(XmlSvgCodec.namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns', XmlSvgCodec.namespace);
    root.setAttribute('width', String(document.width));
    root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    const visitor = new SvgElementVisitor(xml);
    for (const shape of document.children) {
      root.appendChild(xml.createTextNode('\n  '));
      root.appendChild(shape.accept(visitor));
    }
    root.appendChild(xml.createTextNode('\n'));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }

  private readShape(element: Element, used: Set<string>, warnings: string[]): Shape {
    this.checkNamespace(element);
    const attributes = this.attributes(element);
    const missing = !element.hasAttribute('id');
    let id = attributes.id;
    if (missing) {
      let serial = 1;
      while (used.has(`${element.tagName}${serial}`)) serial++;
      id = `${element.tagName}${serial}`;
      used.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${element.tagName}>`);
    }
    // Type-name dispatch remains inside ShapeFactory, shared with CLI creation.
    const shape = this.factory.fromSvg(element.tagName, id!, attributes, element.textContent ?? '');
    const children = this.elementChildren(element, shape.textContent !== undefined);
    for (const child of children) shape.asGroup().insert(this.readShape(child, used, warnings));
    return shape;
  }

  private attributes(element: Element): Record<string, string> {
    return Object.fromEntries(Array.from(element.attributes).map(attribute => [attribute.name, attribute.value]));
  }

  private elementChildren(parent: Element, allowText = false): Element[] {
    const elements: Element[] = [];
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === 1) elements.push(node as Element);
      else if ((node.nodeType === 3 || node.nodeType === 4) && (allowText || !node.nodeValue?.trim())) continue;
      else if (node.nodeType === 8) continue;
      else this.unsupportedNode(node);
    }
    return elements;
  }

  private unsupportedNode(node: Node): never {
    throw new Error(`unsupported SVG content: ${node.nodeName}`);
  }

  private checkNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== XmlSvgCodec.namespace) throw new Error('unsupported SVG namespace');
  }

  private dimension(value: string | undefined, fallback: number | undefined, name: string): number {
    if (value !== undefined) return Numeric.positive(Numeric.parse(value.trim().replace(/px$/, '')));
    if (fallback !== undefined) return fallback;
    throw new Error(`missing SVG ${name}`);
  }
}
