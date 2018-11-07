"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
class FileSystem {
    static manageDirectoryTemp(action) {
        const dir = './tmp';
        if (!fs.existsSync(dir)) {
            if (action === 'create') {
                fs.mkdirSync(dir);
            }
        }
        else {
            if (action === 'delete') {
                FileSystem.deleteFolderRecursive(dir);
            }
        }
    }
    static deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file, index) => {
                const curPath = path + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    static generateNameTemp() {
        let fileNameTemp = Math.floor(Date.now() / 1000);
        return fileNameTemp.toString();
    }
    static readFileSync(file) {
        return fs.readFileSync(file, 'utf8');
    }
}
exports.FileSystem = FileSystem;
//# sourceMappingURL=FileSystem.js.map