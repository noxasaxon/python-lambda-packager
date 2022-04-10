import { Result, ok, err } from 'neverthrow';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {
  customCopyDirSync,
  ensureDirSync,
  DEFAULT_FUNCTIONS_DIR_NAME,
  DEFAULT_OUTPUT_DIR_NAME,
} from './internal.js';
import { exec } from 'child_process';

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
      // get common reguirements file path
      const commonRequirementsFilePath = getRequirementsFilePath(
        commonDir,
        language,
      );
      const commonRequirementsFileContents = getUTF8File(
        commonRequirementsFilePath,
      );
      if (commonRequirementsFileContents.isErr()) {
        throw new Error(
          `Error reading common requirements file: ${commonRequirementsFileContents.error}`,
        );
      }

      // get function requirements file path
      const functionRequirementsFilePath = getRequirementsFilePath(
        moduleCodeDirPath,
        language,
      );
      const functionRequirementsFileContents = getUTF8File(
        functionRequirementsFilePath,
      );
      if (functionRequirementsFileContents.isErr()) {
        throw new Error(
          `Error reading function requirements file: ${functionRequirementsFileContents.error}`,
        );
      }

      // get the common requirements file contents
      const commonRequirementsFileContentsString =
        commonRequirementsFileContents.value;

      // get the function requirements file contents
      const functionRequirementsFileContentsString =
        functionRequirementsFileContents.value;

      // combine the requirements files
      const combinedRequirementsFileContentsString = `${commonRequirementsFileContentsString}\n${functionRequirementsFileContentsString}`;

      // write the combined requirements file
      const combinedRequirementsFilePath = `${moduleArchiveDirPath}/requirements.txt`;

      writeFileSync(
        combinedRequirementsFilePath,
        combinedRequirementsFileContentsString,
        { encoding: 'utf8', flag: 'w' },
      );

      // copy the common code to the archive directory
      customCopyDirSync(commonDir, moduleArchiveDirPath);

      // install the requirements without docker
      const installRequirements = `pip install -r ${moduleArchiveDirPath}/requirements.txt`;
      const installRequirementsResult = exec(installRequirements);
      installRequirementsResult.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      installRequirementsResult.stderr.on('data', (data) => {
        console.error(`${data}`);
      });
    }
  });
}