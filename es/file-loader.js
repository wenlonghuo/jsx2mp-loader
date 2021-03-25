"use strict";

var _require = require('path'),
    join = _require.join,
    relative = _require.relative,
    dirname = _require.dirname;

var _require2 = require('fs-extra'),
    copySync = _require2.copySync;

var loaderUtils = require('loader-utils');

module.exports = function fileLoader(content) {
  var _ref = loaderUtils.getOptions(this) || {},
      entryPath = _ref.entryPath,
      outputPath = _ref.outputPath;

  var rootContext = this.rootContext;
  var relativeFilePath = relative(join(rootContext, dirname(entryPath)), this.resourcePath);
  var distSourcePath = join(outputPath, relativeFilePath);
  copySync(this.resourcePath, distSourcePath);
  return '';
};