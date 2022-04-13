var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { ok, err } from 'neverthrow';
import { mkdirSync, readdirSync, rmSync, writeFileSync, } from 'fs';
import { customCopyDirSync, ensureDirSync, DEFAULT_FUNCTIONS_DIR_NAME, DEFAULT_OUTPUT_DIR_NAME, checkDirExists, getUTF8File, removeUndefinedValues, } from './internal.js';
import { spawn } from 'child_process';
import { DEFAULT_DOCKER_IMAGE } from './constants.js';
import { spawnDockerCmd } from './docker.js';
import * as path from 'path';
export var defaultPackagingArgs = {
    functionsDir: DEFAULT_FUNCTIONS_DIR_NAME,
    outputDir: DEFAULT_OUTPUT_DIR_NAME,
    // no common files directory by default
    commonDir: undefined,
    useDocker: 'no-linux',
    language: 'python'
};
function shouldUseDocker(useDockerChoice) {
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
function getRequirementsFilePath(functionDirPath, language) {
    switch (language) {
        case 'python':
            return "".concat(functionDirPath, "/requirements.txt");
        case 'ts':
            return "".concat(functionDirPath, "/package.json");
        case 'js':
            return "".concat(functionDirPath, "/package.json");
        default:
            throw new Error("Unsupported language: ".concat(language));
    }
}
function checkArgErrors(args) {
    // error check the args
    var functionsDirResult = checkDirExists(args.functionsDir);
    if (functionsDirResult.isErr()) {
        return err("Directory of code to package does not exist: ".concat(functionsDirResult.error));
    }
    if (args.commonDir !== undefined) {
        var commonDirResult = checkDirExists(args.commonDir);
        if (commonDirResult.isErr()) {
            return err("Directory of \"common\" code to include with all functions does not exist: ".concat(commonDirResult.error));
        }
    }
    if (args.language !== 'python') {
        return err("Unsupported language: ".concat(args.language));
    }
    return ok('');
}
export function makePackages(args) {
    return __awaiter(this, void 0, void 0, function () {
        var argsPlusDefaults, errors, functionsDir, commonDir, outputDir, useDocker, language, functionDirs, commonRequirementsContents, commonRequirementsFilePath, commonRequirementsFileContents, _loop_1, _i, functionDirs_1, functionDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    argsPlusDefaults = __assign(__assign({}, defaultPackagingArgs), removeUndefinedValues(args));
                    errors = checkArgErrors(argsPlusDefaults);
                    if (errors.isErr())
                        throw new Error(errors.error);
                    functionsDir = argsPlusDefaults.functionsDir, commonDir = argsPlusDefaults.commonDir, outputDir = argsPlusDefaults.outputDir, useDocker = argsPlusDefaults.useDocker, language = argsPlusDefaults.language;
                    functionDirs = readdirSync(functionsDir, {
                        withFileTypes: true
                    }).filter(function (dir) { return dir.isDirectory(); });
                    ensureDirSync(outputDir);
                    commonRequirementsContents = '';
                    // copy the common code to the archive directory
                    if (commonDir !== undefined) {
                        commonRequirementsFilePath = getRequirementsFilePath(commonDir, language);
                        commonRequirementsFileContents = getUTF8File(commonRequirementsFilePath);
                        if (commonRequirementsFileContents.isErr()) {
                            console.log("No common requirements file found in ".concat(commonRequirementsFilePath));
                            throw new Error("Error reading common requirements file: ".concat(commonRequirementsFileContents.error));
                        }
                        else {
                            commonRequirementsContents = commonRequirementsFileContents.value;
                        }
                    }
                    _loop_1 = function (functionDir) {
                        var moduleName, moduleCodeDirPath, moduleArchiveDirPath, functionRequirementsFilePath, fnRequirementsContents, fnRequirementsQuery, combinedRequirementsFileContentsString, combinedRequirementsFilePath, childProcessInstallReqs, pipDockerCmds, dockerCmds, exitCode;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    moduleName = functionDir.name;
                                    moduleCodeDirPath = "".concat(functionsDir, "/").concat(moduleName);
                                    moduleArchiveDirPath = "".concat(outputDir, "/").concat(moduleName);
                                    // delete and re-make the archive directory
                                    rmSync(moduleArchiveDirPath, { recursive: true, force: true });
                                    mkdirSync(moduleArchiveDirPath, { recursive: true });
                                    // copy the function code to the archive directory
                                    customCopyDirSync(moduleCodeDirPath, moduleArchiveDirPath);
                                    functionRequirementsFilePath = getRequirementsFilePath(moduleCodeDirPath, language);
                                    fnRequirementsContents = '';
                                    fnRequirementsQuery = getUTF8File(functionRequirementsFilePath);
                                    if (fnRequirementsQuery.isErr()) {
                                        console.log("No requirements file found in ".concat(moduleCodeDirPath));
                                    }
                                    else {
                                        fnRequirementsContents = fnRequirementsQuery.value;
                                    }
                                    combinedRequirementsFileContentsString = "".concat(commonRequirementsContents, "\n").concat(fnRequirementsContents);
                                    combinedRequirementsFilePath = "".concat(moduleArchiveDirPath, "/requirements.txt");
                                    console.log(combinedRequirementsFileContentsString);
                                    // copy the common code to the archive directory
                                    customCopyDirSync(commonDir, moduleArchiveDirPath);
                                    // write the combined requirements file over the existing one
                                    writeFileSync(combinedRequirementsFilePath, combinedRequirementsFileContentsString, { encoding: 'utf8', flag: 'w' });
                                    if (!shouldUseDocker(useDocker)) return [3 /*break*/, 2];
                                    console.log('USING DOCKER');
                                    pipDockerCmds = [
                                        'python',
                                        '-m',
                                        'pip',
                                        'install',
                                        '-t',
                                        '/var/task/',
                                        '-r',
                                        '/var/task/requirements.txt',
                                    ];
                                    dockerCmds = __spreadArray([
                                        // 'docker',
                                        'run',
                                        '--rm',
                                        '-v',
                                        // `${bindPath}:/var/task:z`,
                                        "".concat(path.join(process.cwd(), moduleArchiveDirPath), ":/var/task:z"),
                                        DEFAULT_DOCKER_IMAGE
                                    ], pipDockerCmds, true);
                                    return [4 /*yield*/, spawnDockerCmd(dockerCmds)];
                                case 1:
                                    // childProcessInstallReqs = spawn('pip', [
                                    //   'install',
                                    //   '-r',
                                    //   moduleArchiveDirPath + '/requirements.txt',
                                    //   '-t',
                                    //   moduleArchiveDirPath,
                                    // ]);
                                    childProcessInstallReqs = _b.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    console.log('NOT USING DOCKER');
                                    // not using docker
                                    childProcessInstallReqs = spawn('pip', [
                                        'install',
                                        '-r',
                                        moduleArchiveDirPath + '/requirements.txt',
                                        '-t',
                                        moduleArchiveDirPath,
                                    ]);
                                    _b.label = 3;
                                case 3:
                                    // install the requirements using spawn without docker
                                    childProcessInstallReqs.stdout.on('data', function (data) {
                                        console.log("".concat(data));
                                    });
                                    childProcessInstallReqs.stderr.on('data', function (data) {
                                        var dataAsString = data.toString();
                                        if (dataAsString.includes('command not found')) {
                                            throw new Error('docker not found! Please install it.');
                                        }
                                        else if (dataAsString.includes('Cannot connect to the Docker daemon')) {
                                            throw new Error('Docker daemon not running! Please start it.');
                                        }
                                        else if (dataAsString.includes('WARNING: You are using pip version')) {
                                            // do nothing
                                        }
                                        else {
                                            console.error(dataAsString);
                                        }
                                    });
                                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            childProcessInstallReqs.on('close', resolve);
                                        })];
                                case 4:
                                    exitCode = _b.sent();
                                    if (exitCode) {
                                        throw new Error("subprocess error exit ".concat(exitCode));
                                    }
                                    childProcessInstallReqs.on('close', function (data) {
                                        console.log("ALL DONE: ".concat(data));
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, functionDirs_1 = functionDirs;
                    _a.label = 1;
                case 1:
                    if (!(_i < functionDirs_1.length)) return [3 /*break*/, 4];
                    functionDir = functionDirs_1[_i];
                    return [5 /*yield**/, _loop_1(functionDir)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=packaging.js.map