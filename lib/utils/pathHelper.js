"use strict";

var _require = require('path'),
    extname = _require.extname,
    sep = _require.sep,
    join = _require.join;

function removeExt(path, platform) {
  var ext = extname(path);
  var extReg = new RegExp(("" + (platform ? "(." + platform + ")?" : '') + ext + "$").replace(/\\./g, '\\.'));
  return path.replace(extReg, '');
}
/**
 * judge whether the child dir is part of parent dir
 * @param {string} child
 * @param {string} parent
 */


function isChildOf(child, parent) {
  var childArray = child.split(sep).filter(function (i) {
    return i.length;
  });
  var parentArray = parent.split(sep).filter(function (i) {
    return i.length;
  });
  var clen = childArray.length;
  var plen = parentArray.length;
  var j = 0;

  for (var i = 0; i < plen; i++) {
    if (parentArray[i] === childArray[j]) {
      j++;
    }

    if (j === clen) {
      return true;
    }
  }

  return false;
}
/**
 * Check whether testPath is from targetDir
 *
 * @param {string} testPath
 * @param {string} targetDir
 * @returns {boolean}
 */


function isFromTargetDir(testPath, targetDir) {
  return isChildOf(targetDir, testPath);
}
/**
 * Check whether testPath is from one of the targetDirs
 *
 * @param {string} testPath
 * @returns {Function}
 */


function isFromTargetDirs(targetDirs) {
  return function (testPath) {
    return targetDirs.some(function (targetDir) {
      return isFromTargetDir(testPath, targetDir);
    });
  };
}
/**
 * replace the file's extension with new extension
 *
 * @param {string} filePath
 * @param {string} newExtension eg. .ts .js
 * @returns {string}
 */


function replaceExtension(filePath, newExtension) {
  var lastDot = filePath.lastIndexOf('.');
  return filePath.slice(0, lastDot) + newExtension;
}
/**
 * add double backslashs in case that filePath contains single backslashs
 * @param {string} filePath
 * @returns {string}
 */


function doubleBackslash(filePath) {
  return filePath.replace(/\\/g, '\\\\');
}
/**
 * Use '/' as path sep regardless of OS when outputting the path to code
 * @param {string} filepath
 */


function normalizeOutputFilePath(filepath) {
  return filepath.replace(/\\/g, '/');
}
/**
 * Add ./ at the start of filepath
 * @param {string} filepath
 * @returns {string}
 */


function addRelativePathPrefix(filepath) {
  return filepath[0] !== '.' ? "./" + filepath : filepath;
}
/**
 *  Some packages like jsx-compiler should be a dependency of jsx2mp-loader. But if the project has installed it, then it will take the priority.
 * @param {string} packageName
 * @param {string} rootDir
 */


function getHighestPriorityPackage(packageName, rootDir) {
  var resolvePaths = require.resolve.paths(packageName);

  resolvePaths.unshift(join(rootDir, 'node_modules'));

  var packagePath = require.resolve(packageName, {
    paths: resolvePaths
  });

  return require.resolve(packagePath);
}

module.exports = {
  removeExt: removeExt,
  isFromTargetDirs: isFromTargetDirs,
  replaceExtension: replaceExtension,
  doubleBackslash: doubleBackslash,
  normalizeOutputFilePath: normalizeOutputFilePath,
  addRelativePathPrefix: addRelativePathPrefix,
  getHighestPriorityPackage: getHighestPriorityPackage
};