"use strict";

var _require = require('@babel/core'),
    transformSync = _require.transformSync;

var parserOpts = {
  plugins: ['classProperties', 'jsx', 'typescript', 'trailingFunctionCommas', 'asyncFunctions', 'exponentiationOperator', 'asyncGenerators', 'objectRestSpread', ['decorators', {
    decoratorsBeforeExport: false
  }], 'dynamicImport'] // support all plugins

};

function removeUnusedImport(source) {
  return transformSync(source, {
    parserOpts: parserOpts,
    plugins: [[require('babel-plugin-danger-remove-unused-import'), {
      ignore: 'rax'
    }]]
  }).code;
}

var codeProcessor = function codeProcessor(processors, sourceCode) {
  if (processors === void 0) {
    processors = [];
  }

  return processors.filter(function (processor) {
    return typeof processor === 'function';
  }).reduce(function (prevCode, currProcessor) {
    return currProcessor(prevCode);
  }, sourceCode);
};

function eliminateDeadCode(source) {
  var processors = [removeUnusedImport];
  return codeProcessor(processors, source);
}

module.exports = eliminateDeadCode;