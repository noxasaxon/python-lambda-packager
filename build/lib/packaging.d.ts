export declare type useDockerOptions = 'no-linux' | 'true' | 'false';
export declare type languageOptions = 'python' | 'ts' | 'js';
export interface PackagingArgs {
    functionsDir: string;
    commonDir?: string;
    outputDir?: string;
    useDocker: useDockerOptions;
    language: languageOptions;
}
export declare const defaultPackagingArgs: PackagingArgs;
export declare function makePackages(args: PackagingArgs): Promise<void>;
