import { ShapeFactory } from './domain/ShapeFactory.js';
import { EditorSession } from './application/EditorSession.js';
import { CommandRouter } from './application/CommandRouter.js';
import { XmlSvgCodec } from './infrastructure/svg/XmlSvgCodec.js';
import { NodeFileStore } from './infrastructure/filesystem/NodeFileStore.js';
import { CliEngine } from './cli/CliEngine.js';
import { Repl } from './cli/Repl.js';

const factory = new ShapeFactory();
const session = new EditorSession(new NodeFileStore(), new XmlSvgCodec(factory));
const engine = new CliEngine(new CommandRouter(session, factory));
await new Repl(engine).run();
