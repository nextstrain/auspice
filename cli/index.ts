import argparse from 'argparse';
import { version } from './version.ts';
import * as view from "./view.ts";
import * as build from "./build.ts";
import * as develop from "./develop.ts";
import * as convert from "./convert.ts";

export function main(): void {
  const parser = new argparse.ArgumentParser({
    version: version,
    addHelp: true,
    description: `Auspice version ${version}.`,
    epilog: `
    Auspice is an interactive visualisation tool for phylogenomic data.
    It can be used to display local datasets (see "auspice view -h" for details),
    or to build a customised version of the software (see "auspice build -h" for details).
    This is the software which powers the visualisations on nextstrain.org and auspice.us, among others.
    `
  });

  const subparsers = parser.addSubparsers({title: 'Auspice commands', dest: "subcommand"});
  view.addParser(subparsers);
  build.addParser(subparsers);
  develop.addParser(subparsers);
  convert.addParser(subparsers);

  const args = parser.parseArgs();

  if (args.verbose) global.AUSPICE_VERBOSE = true;

  if (args.subcommand === "build") {
    build.run(args);
  } else if (args.subcommand === "view") {
    view.run(args);
  } else if (args.subcommand === "develop") {
    develop.run(args);
  } else if (args.subcommand === "convert") {
    convert.run(args);
  }
}
