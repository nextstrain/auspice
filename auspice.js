#!/usr/bin/env node

import { cliModule } from './cli-entry.js';

const { main } = await import(cliModule('index'));

main();
