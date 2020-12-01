"use strict";

var _require = require('path'),
    extname = _require.extname;

var WEEX_MODULE_REG = /^@?weex-/;
var QUICKAPP_MODULE_REG = /^@system\./;
var JSX2MP_RUNTIME_MODULE_REG = /^jsx2mp-runtime/;

function isNpmModule(value) {
  return !(value[0] === '.' || value[0] === '/');
}

function isWeexModule(value) {
  return WEEX_MODULE_REG.test(value);
}

function isQuickAppModule(value) {
  return QUICKAPP_MODULE_REG.test(value);
}

function isRaxModule(value) {
  return value === 'rax';
}

function isRaxAppModule(value) {
  return value === 'rax-app';
}

function isJsx2mpRuntimeModule(value) {
  return JSX2MP_RUNTIME_MODULE_REG.test(value);
}

function isNodeNativeModule(value) {
  return process.binding('natives').hasOwnProperty(value);
}

function isJSONFile(value) {
  return extname(value) === '.json';
}

function isTypescriptFile(value) {
  return extname(value) === '.ts' || extname(value) === '.tsx';
}

module.exports = {
  isNpmModule: isNpmModule,
  isWeexModule: isWeexModule,
  isQuickAppModule: isQuickAppModule,
  isRaxModule: isRaxModule,
  isRaxAppModule: isRaxAppModule,
  isJsx2mpRuntimeModule: isJsx2mpRuntimeModule,
  isNodeNativeModule: isNodeNativeModule,
  isJSONFile: isJSONFile,
  isTypescriptFile: isTypescriptFile
};