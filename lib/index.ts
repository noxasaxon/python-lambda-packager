export type useDockerOptions = 'no-linux' | 'true' | 'false';

export interface PackagingArgs {
  functionsDir: string;
  commonDir: string;
  outputDir: string;
  useDocker: useDockerOptions;
}

export const defaultPackagingArgs: PackagingArgs = {
  functionsDir: './functions',
  commonDir: './common',
  outputDir: './archives',
  useDocker: 'no-linux',
};
