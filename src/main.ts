import {
  command,
  run,
  string,
  number,
  positional,
  option,
  optional,
} from 'cmd-ts';
import { ArgParser } from 'cmd-ts/dist/cjs/argparser';
import { ProvidesHelp } from 'cmd-ts/dist/cjs/helpdoc';
import { PackagingArgs, useDockerOptions } from '../lib';

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
    description: 'output directory for archive files',
  }),
  useDocker: option({
    type: optional(string),
    long: 'useDocker',
    description: 'functions directory',
  }),
};

declare type PackagerCmdArgs = Record<
  string,
  ArgParser<any> & Partial<ProvidesHelp>
>;

// declare type PackagerCmdArgs = Record<
//   string,
//   ArgParser<any> & Partial<ProvidesHelp>
// >;

// function buildCliArgs() {
//   // instantiate this type here to ensure we cover all use cases
//   // const tests =  [keyof PackagingArgs] as const;
//   const defaultArgs: PackagingArgs = {
//     functionsDir: 'functions',
//     commonDir: 'common',
//     outputDir: 'dist',
//     useDocker: 'no-linux',
//   };
// }

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
    // console.log(args);

    // console.log(args.functionsDir);
  },
});

async function main() {
  console.log(process.argv);
  await run(myCmd, process.argv.slice(2));
}

main();
