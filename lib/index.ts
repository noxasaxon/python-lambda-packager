import { Result, ok, err } from 'neverthrow';
import { ensureDirSync } from './utils';
import { existsSync, readdirSync } from 'fs';
import {
  DEFAULT_FUNCTIONS_DIR_NAME,
  DEFAULT_OUTPUT_DIR_NAME,
} from './constants';

export type useDockerOptions = 'no-linux' | 'true' | 'false';
export type languageOptions = 'python' | 'ts' | 'js';

export interface PackagingArgs {
  functionsDir: string;
  commonDir?: string;
  outputDir?: string;
  useDocker: useDockerOptions;
  language: languageOptions;
}

export const defaultPackagingArgs: PackagingArgs = {
  functionsDir: DEFAULT_FUNCTIONS_DIR_NAME,
  outputDir: DEFAULT_OUTPUT_DIR_NAME,
  // no common files directory by default
  commonDir: undefined,
  useDocker: 'no-linux',
  language: 'python',
};

function checkDirExists(dir: string): Result<string, string> {
  if (!existsSync(dir)) {
    return err(`${dir} does not exist`);
  }
  return ok(dir);
}

export async function makePackages(args: PackagingArgs) {
  // use default args if not provided
  const { functionsDir, commonDir, outputDir, useDocker, language } = {
    ...defaultPackagingArgs,
    ...args,
  };

  // error check the args
  const functionsDirResult = checkDirExists(functionsDir);
  if (functionsDirResult.isErr()) {
    console.error(
      `Directory of code to package does not exist: ${functionsDirResult.error}`,
    );
    return;
  }
  if (commonDir !== undefined) {
    const commonDirResult = checkDirExists(commonDir);
    if (commonDirResult.isErr()) {
      console.error(
        `Directory of "common" code to include with all functions does not exist: ${commonDirResult.error}`,
      );
      return;
    }
  }
  if (language !== 'python') {
    console.error(`Unsupported language: ${language}`);
  }

  // get list of directories in the specified functions folder
  const functionDirs = readdirSync(functionsDir, { withFileTypes: true });
  const functionDirsNames = functionDirs.filter((dir) => dir.isDirectory());
  console.log('fnDirNames', functionDirsNames);

  ensureDirSync(outputDir);

  // functionDirs.forEach((functionDir) => {
  //   // get the path to the function directory
  //   const functionDirPath = `${functionsDir}/${functionDir}`;
  //   // get the path to the archive directory
  //   const archiveDirPath = `${outputDir}/${functionDir}`;
  //   // make the archive directory
  //   fs.mkdirSync(archiveDirPath);
  //   // get the path to the function code
  //   const functionCodePath = `${functionDirPath}/function.${language}`;
  //   // get the path to the common code
  //   const commonCodePath =
  //     commonDir === undefined ? undefined : `${commonDir}/common.${language}`;
  //   // get the path to the archive code
  //   const archiveCodePath = `${archiveDirPath}/function.${language}`;
  //   // copy the function code to the archive directory
  //   fs.copySync(functionCodePath, archiveCodePath);
  //   // if there is common code, copy it to the archive directory
  //   if (commonCodePath !== undefined) {
  //     fs.copySync(commonCodePath, archiveCodePath);
  //   }

  // // if the useDocker flag is set to true, copy the dockerfile to the archive directory
  // if (useDocker === 'true') {
  //   fs.copySync(
  //     `${functionDirPath}/Dockerfile`,
  //     `${archiveDirPath}/Dockerfile`,
  //   );
  // }
  // });
}
