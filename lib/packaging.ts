import { Result, ok, err } from 'neverthrow';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import {
  customCopyDirSync,
  ensureDirSync,
  DEFAULT_FUNCTIONS_DIR_NAME,
  DEFAULT_OUTPUT_DIR_NAME,
} from './internal.js';

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

// does not handle non-pip installations (poetry, etc)
function getRequirementsFilePath(
  functionDirPath: string,
  language: languageOptions,
): string {
  switch (language) {
    case 'python':
      return `${functionDirPath}/requirements.txt`;
    case 'ts':
      return `${functionDirPath}/package.json`;
    case 'js':
      return `${functionDirPath}/package.json`;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

function getUTF8File(filePath: string): Result<string, string> {
  if (!existsSync(filePath)) {
    return err(`File not found: ${filePath}`);
  }

  const fileContents = readFileSync(filePath, 'utf8');

  return ok(fileContents);
}

function checkDirExists(dir: string): Result<string, string> {
  if (!existsSync(dir)) {
    return err(`${dir} does not exist`);
  }
  return ok(dir);
}

function checkArgErrors(args: PackagingArgs): Result<string, string> {
  // error check the args
  const functionsDirResult = checkDirExists(args.functionsDir);
  if (functionsDirResult.isErr()) {
    return err(
      `Directory of code to package does not exist: ${functionsDirResult.error}`,
    );
  }
  if (args.commonDir !== undefined) {
    const commonDirResult = checkDirExists(args.commonDir);
    if (commonDirResult.isErr()) {
      return err(
        `Directory of "common" code to include with all functions does not exist: ${commonDirResult.error}`,
      );
    }
  }
  if (args.language !== 'python') {
    return err(`Unsupported language: ${args.language}`);
  }

  return ok('');
}

export async function makePackages(args: PackagingArgs) {
  // use default args if not provided
  const { functionsDir, commonDir, outputDir, useDocker, language } = {
    ...defaultPackagingArgs,
    ...args,
  };

  // error check the args
  const errors = checkArgErrors(args);
  if (errors.isErr()) {
    console.error(errors.error);
    throw new Error(errors.error);
  }
  // get list of directories in the specified functions folder
  const functionDirs = readdirSync(functionsDir, {
    withFileTypes: true,
  }).filter((dir) => dir.isDirectory());

  ensureDirSync(outputDir);

  functionDirs.forEach((functionDir) => {
    const moduleName = functionDir.name;

    const moduleCodeDirPath = `${functionsDir}/${moduleName}`;
    const moduleArchiveDirPath = `${outputDir}/${moduleName}`;

    // delete and re-make the archive directory
    rmSync(moduleArchiveDirPath, { recursive: true, force: true });
    mkdirSync(moduleArchiveDirPath, { recursive: true });

    // copy the function code to the archive directory
    customCopyDirSync(moduleCodeDirPath, moduleArchiveDirPath);

    // copy the common code to the archive directory
    if (commonDir !== undefined) {
      // get common reguirements file
      const commonRequirementsFilePath = getRequirementsFilePath(
        commonDir,
        language,
      );
      const commonRequirementsFileContents = getUTF8File(
        commonRequirementsFilePath,
      );
      if (commonRequirementsFileContents.isErr()) {
        console.error(
          `Error reading common requirements file: ${commonRequirementsFilePath}`,
        );
        throw new Error(commonRequirementsFileContents.error);
      }

      // get function requirements file from archive dir
      const functionRequirementsFilePath = getRequirementsFilePath(
        moduleArchiveDirPath,
        language,
      );
      const functionRequirementsFileContents = getUTF8File(
        functionRequirementsFilePath,
      );
      if (functionRequirementsFileContents.isErr()) {
        console.error(
          `Error reading function requirements file: ${functionRequirementsFilePath}`,
        );
        throw new Error(functionRequirementsFileContents.error);
      }

      // append common requirements to function requirements
      const functionRequirementsFileContentsWithCommon = `${commonRequirementsFileContents.value}\n${functionRequirementsFileContents.value}`;

      // write the combined requirements file to the archive dir
      ensureDirSync(moduleArchiveDirPath);
      writeFileSync(
        functionRequirementsFilePath,
        functionRequirementsFileContentsWithCommon,
        'utf8',
      );
    }
    
      // customCopyDirSync(commonDir, moduleArchiveDirPath);
    }

    // get the path to the common code
    const commonCodePath =
      commonDir === undefined ? undefined : `${commonDir}/common.${language}`;
    // get the path to the archive code
    const archiveCodePath = `${moduleArchiveDirPath}/function.${language}`;
    // copy the function code to the archive directory
    // copySync(functionCodePath, archiveCodePath);
    // if there is common code, copy it to the archive directory
    // if (commonCodePath !== undefined) {
    //   fs.copySync(commonCodePath, archiveCodePath);
    // }
  });
  // // if the useDocker flag is set to true, copy the dockerfile to the archive directory
  // if (useDocker === 'true') {
  //   fs.copySync(
  //     `${functionDirPath}/Dockerfile`,
  //     `${archiveDirPath}/Dockerfile`,
  //   );
  // }
  // });
}
