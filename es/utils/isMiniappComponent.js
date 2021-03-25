"use strict";

var _require = require('fs-extra'),
    existsSync = _require.existsSync;

var _require2 = require('./pathHelper'),
    removeExt = _require2.removeExt;

var suffix = {
  ali: ['.js', '.json', '.axml'],
  wechat: ['.js', '.json', '.wxml'],
  bytedance: ['.js', '.json', '.ttml'],
  quickapp: ['.ux']
}; // e.g file:   /root/lib/miniapp/index

module.exports = function (filename, platform) {
  if (platform === void 0) {
    platform = 'ali';
  }

  return suffix[platform].every(function (s) {
    return existsSync(removeExt(filename) + s);
  });
};