"use strict";

var convertSourceMap = require('convert-source-map');

function addSourceMap(code, rawCode, originalMap) {
  var map = Object.assign(originalMap, {
    sourcesContent: [rawCode]
  });
  var sourceMapString = convertSourceMap.fromObject(map).toComment();
  return code + '\n' + sourceMapString;
}

module.exports = addSourceMap;