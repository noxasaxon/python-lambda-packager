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
  checkDirExists,
  getUTF8File,
  removeUndefinedValues,
  buildImage,
} from './internal.js';
import { spawn } from 'child_process';
import { DEFAULT_DOCKER_IMAGE } from './constants.js';
import { spawnDockerCmd } from './docker.js';
import * as path from 'path';

export type useDockerOption = 'no-linux' | 'true' | 'false';
export type languageOption = 'python' | 'ts' | 'js';

export interface PackagingArgs {
  functionsDir: string;
  commonDir?: string;
  outputDir?: string;
  useDocker: useDockerOption;
  language: languageOption;
}

export const defaultPackagingArgs: PackagingArgs = {
  functionsDir: DEFAULT_FUNCTIONS_DIR_NAME,
  outputDir: DEFAULT_OUTPUT_DIR_NAME,
  // no common files directory by default
  commonDir: undefined,
  useDocker: 'no-linux',
  language: 'python',
};

function shouldUseDocker(useDockerChoice: useDockerOption): boolean {
  switch (useDockerChoice) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'no-linux':
      return process.platform !== 'linux';
  }
}

// does not handle non-pip installations (poetry, etc)
function getRequirementsFilePath(
  functionDirPath: string,
  language: languageOption,
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
  const argsPlusDefaults = {
    ...defaultPackagingArgs,
    ...removeUndefinedValues(args),
  };

  // error check the args
  const errors = checkArgErrors(argsPlusDefaults);
  if (errors.isErr()) throw new Error(errors.error);

  const { functionsDir, commonDir, outputDir, useDocker, language } =
    argsPlusDefaults;

  // get list of directories in the specified functions folder
  const functionDirs = readdirSync(functionsDir, {
    withFileTypes: true,
  }).filter((dir) => dir.isDirectory());

  ensureDirSync(outputDir);

  let commonRequirementsContents = '';

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
      console.log(
        `No common requirements file found in ${commonRequirementsFilePath}`,
      );
      throw new Error(
        `Error reading common requirements file: ${commonRequirementsFileContents.error}`,
      );
    } else {
      commonRequirementsContents = commonRequirementsFileContents.value;
    }
  }

  for (const functionDir of functionDirs) {
    const moduleName = functionDir.name;

    const moduleCodeDirPath = `${functionsDir}/${moduleName}`;
    const moduleArchiveDirPath = `${outputDir}/${moduleName}`;

    // delete and re-make the archive directory
    rmSync(moduleArchiveDirPath, { recursive: true, force: true });
    mkdirSync(moduleArchiveDirPath, { recursive: true });

    // copy the function code to the archive directory
    customCopyDirSync(moduleCodeDirPath, moduleArchiveDirPath);

    // get function requirements file path
    const functionRequirementsFilePath = getRequirementsFilePath(
      moduleCodeDirPath,
      language,
    );

    let fnRequirementsContents = '';

    const fnRequirementsQuery = getUTF8File(functionRequirementsFilePath);
    if (fnRequirementsQuery.isErr()) {
      console.log(`No requirements file found in ${moduleCodeDirPath}`);
    } else {
      fnRequirementsContents = fnRequirementsQuery.value;
    }

    // combine the requirements files
    const combinedRequirementsFileContentsString = `${commonRequirementsContents}\n${fnRequirementsContents}`;
    const combinedRequirementsFilePath = `${moduleArchiveDirPath}/requirements.txt`;
    console.log(combinedRequirementsFileContentsString);

    // copy the common code to the archive directory
    customCopyDirSync(commonDir, moduleArchiveDirPath);

    // write the combined requirements file over the existing one
    writeFileSync(
      combinedRequirementsFilePath,
      combinedRequirementsFileContentsString,
      { encoding: 'utf8', flag: 'w' },
    );

    let childProcessInstallReqs;

    if (shouldUseDocker(useDocker)) {
      console.log('USING DOCKER');
      // installation of reqs inside docker
      const pipDockerCmds = [
        'python',
        '-m',
        'pip',
        'install',
        '-t',
        '/var/task/',
        '-r',
        '/var/task/requirements.txt',
      ];

      // ! if custom image
      // buildImage(customDockerfile)
      // const imageName = CUSTOM_IMAGE_NAME
      // path.join(process.cwd(), moduleArchiveDirPath);

      const dockerCmds = [
        // 'docker',
        'run',
        '--rm',
        '-v',
        // `${bindPath}:/var/task:z`,
        `${path.join(process.cwd(), moduleArchiveDirPath)}:/var/task:z`,
        DEFAULT_DOCKER_IMAGE,
        ...pipDockerCmds,
      ];

      childProcessInstallReqs = await spawnDockerCmd(dockerCmds);
    } else {
      console.log('NOT USING DOCKER');
      // not using docker
      childProcessInstallReqs = spawn('pip', [
        'install',
        '-r',
        moduleArchiveDirPath + '/requirements.txt',
        '-t',
        moduleArchiveDirPath,
      ]);
    }

    // install the requirements using spawn without docker

    childProcessInstallReqs.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    childProcessInstallReqs.stderr.on('data', (data) => {
      const dataAsString = data.toString();
      if (dataAsString.includes('command not found')) {
        throw new Error('docker not found! Please install it.');
      } else if (dataAsString.includes('Cannot connect to the Docker daemon')) {
        throw new Error('Docker daemon not running! Please start it.');
      } else if (dataAsString.includes('WARNING: You are using pip version')) {
        // do nothing
      } else {
        console.error(dataAsString);
      }
    });

    const exitCode = await new Promise((resolve, reject) => {
      childProcessInstallReqs.on('close', resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}`);
    }

    childProcessInstallReqs.on('close', (data) => {
      console.log(`ALL DONE: ${data}`);
    });
  }
}
