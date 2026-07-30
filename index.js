/** This file exports the functions / objects available to node packages
 * which import auspice (e.g. via `import { convertFromV1 } from "auspice"`)
 *
 * These are intended to be "helper functions" for those wishing to write
 * their own auspice server, i.e. a server which handles the GET
 * requests originating from a auspice client.
 */

import { cliModule } from './cli-entry.js';

const { convertFromV1 } = await import(cliModule('server/convertJsonSchemas'));

export { convertFromV1 };
