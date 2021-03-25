"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('path'),
    relative = _require.relative,
    join = _require.join,
    dirname = _require.dirname,
    extname = _require.extname;

var sass = require('sass');

var less = require('less');

var stylus = require('stylus');

var stylesheetLoader = require('stylesheet-loader').default;
/**
 * convert sass/stylus to css
 *
 * @param {string} cssType  css/sass/scss/stylus
 * @param {string} content
 * @param {string} filename
 * @returns {string}
 */


function compileCSS(_x, _x2, _x3) {
  return _compileCSS.apply(this, arguments);
}

function _compileCSS() {
  _compileCSS = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(cssType, content, filename) {
    var processedContent;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            processedContent = content;
            _context.t0 = cssType;
            _context.next = _context.t0 === 'sass' ? 4 : _context.t0 === 'scss' ? 4 : _context.t0 === 'styl' ? 6 : _context.t0 === 'less' ? 8 : 11;
            break;

          case 4:
            processedContent = sass.renderSync({
              file: filename,
              includePaths: ['node_modules']
            }).css.toString();
            return _context.abrupt("break", 11);

          case 6:
            processedContent = stylus(content).set('filename', filename).render();
            return _context.abrupt("break", 11);

          case 8:
            _context.next = 10;
            return less.render(content, {
              filename: filename
            });

          case 10:
            processedContent = _context.sent.css;

          case 11:
            return _context.abrupt("return", processedContent);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _compileCSS.apply(this, arguments);
}

function convertCSSUnit(raw, originExt, targetExt) {
  if (originExt === void 0) {
    originExt = 'rem';
  }

  if (targetExt === void 0) {
    targetExt = 'rpx';
  }

  var regexp = new RegExp(originExt, 'g');
  return raw.replace(regexp, targetExt); // Maybe could use postcss plugin instead.
}

function createCSSModule(content) {
  var loaderContext = {
    query: '?log=false'
  };
  return stylesheetLoader.call(loaderContext, content);
}

function processCSS(_x4, _x5) {
  return _processCSS.apply(this, arguments);
}

function _processCSS() {
  _processCSS = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(cssFiles, sourcePath) {
    var style, assets, _iterator, _step, cssFile, cssType, relativePath;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            style = '';
            assets = {};
            _iterator = _createForOfIteratorHelperLoose(cssFiles);

          case 3:
            if ((_step = _iterator()).done) {
              _context2.next = 12;
              break;
            }

            cssFile = _step.value;
            cssType = extname(cssFile.filename).slice(1);
            _context2.next = 8;
            return compileCSS(cssType, cssFile.content, cssFile.filename);

          case 8:
            cssFile.content = _context2.sent;

            if (cssFile.type === 'cssObject') {
              relativePath = relative(sourcePath, cssFile.filename);
              assets[relativePath + '.js'] = createCSSModule(cssFile.content);
            } else if (cssFile.type === 'cssFile') {
              style += convertCSSUnit(cssFile.content);
            }

          case 10:
            _context2.next = 3;
            break;

          case 12:
            return _context2.abrupt("return", {
              style: style,
              assets: assets
            });

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _processCSS.apply(this, arguments);
}

module.exports = processCSS;