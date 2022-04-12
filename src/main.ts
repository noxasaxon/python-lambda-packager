import {
  command,
  run,
  string,
  // number,
  positional,
  option,
  optional,
} from 'cmd-ts';
import { ArgParser } from 'cmd-ts/dist/cjs/argparser';
import { ProvidesHelp } from 'cmd-ts/dist/cjs/helpdoc';
import {
  PackagingArgs,
  useDockerOptions,
  makePackages,
  defaultPackagingArgs,
} from '../lib/index.js';

type GenericCmdArgs<T> = {
  [P in keyof Required<T>]: ArgParser<any> & Partial<ProvidesHelp>;
};

const PackagingCmdArgs: GenericCmdArgs<PackagingArgs> = {
  functionsDir: positional({
    displayName: 'functionsDir',
    description: 'functions directory',
  }),
  commonDir: option({
    type: optional(string),
    long: 'common',
    description: 'common shared code directory path',
  }),
  outputDir: option({
    type: optional(string),
    long: 'output',
    short: 'u',
    description: 'output directory for archive files',
  }),
  useDocker: option({
    type: optional(string),
    long: 'useDocker',
    short: 'u',
    description: 'functions directory',
  }),
  language: option({
    type: {
      ...string,
      defaultValue: () => defaultPackagingArgs.language,
      defaultValueIsSerializable: true,
    },

    long: 'language',
    short: 'l',
    description: 'functions directory',
  }),
};

// get input using cmd-ts
const myCmd = command({
  name: 'lambda-packager',

  args: PackagingCmdArgs,
  handler: (args) => {
    // do stuff with args
    const allArgNames = Object.keys(args);
    allArgNames.forEach((argName) => {
      console.log(argName, args[argName]);
    });

    makePackages(args);
    // console.log(args);

    // console.log(args.functionsDir);
  },
});

async function main() {
  console.log(process.argv);
  await run(myCmd, process.argv.slice(2));
}

main();
