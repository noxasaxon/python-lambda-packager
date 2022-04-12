import * as path from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, } from 'fs';
// fs-extra isn't converted to ESM syntax, so we need to use regular fs
// https://ar.al/2021/03/07/fs-extra-to-fs/
export function ensureDirSync(directory) {
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }
}
// fs-extra isn't converted to ESM syntax, so we need to use regular fs
// https://ar.al/2021/03/07/fs-extra-to-fs/
export function customCopyDirSync(directory, destination) {
    var filePaths = readdirSync(directory);
    filePaths.forEach(function (fPath) {
        var source = path.join(directory, fPath);
        var dest = path.join(destination, fPath);
        var stat = statSync(source);
        if (stat.isDirectory()) {
            ensureDirSync(dest);
            console.log('RECURSING!');
            customCopyDirSync(source, dest);
        }
        else {
            copyFileSync(source, dest);
        }
    });
}
//# sourceMappingURL=utils.js.map