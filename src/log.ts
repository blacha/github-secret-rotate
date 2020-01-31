import * as pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';

const outputStream = process.stdout.isTTY ? PrettyTransform.stream() : process.stdout;
export const Logger = pino({ level: 'debug' }, outputStream);
