'use strict'

const fs = require('fs')

class FileSystem{
  /**
   *
   * @param action
   */
  static manageDirectoryTemp (action) {
    const dir = './tmp'

    if (!fs.existsSync(dir)){
      if (action === 'create') {
        fs.mkdirSync(dir)
      }
    } else {
      if (action === 'delete') {
        FileSystem.deleteFolderRecursive(dir)
      }
    }
  }

  /**
   *
   * @param path
   */
  static deleteFolderRecursive (path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        const curPath = path + '/' + file
        if (fs.lstatSync(curPath).isDirectory()) {
          deleteFolderRecursive(curPath)
        } else {
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(path)
    }
  }

  /**
   *
   * @returns {string}
   */
  static generateNameTemp () {
    let fileNameTemp = Math.floor(Date.now() / 1000)

    return fileNameTemp.toString()
  }

  /**
   *
   * @param file
   * @returns {*}
   */
  static readFileSync (file) {
    return fs.readFileSync(file, 'utf8')
  }
}

module.exports = FileSystem