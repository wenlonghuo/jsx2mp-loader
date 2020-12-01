"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('fs-extra'),
    existsSync = _require.existsSync,
    mkdirpSync = _require.mkdirpSync;

var _require2 = require('path'),
    join = _require2.join;

var _require3 = require('loader-utils'),
    getOptions = _require3.getOptions;

var chalk = require('chalk');

var _require4 = require('./utils/pathHelper'),
    doubleBackslash = _require4.doubleBackslash,
    getHighestPriorityPackage = _require4.getHighestPriorityPackage;

var eliminateDeadCode = require('./utils/dce');

var defaultStyle = require('./defaultStyle');

var _require5 = require('./constants'),
    QUICKAPP = _require5.QUICKAPP;

var processCSS = require('./styleProcessor');

var _require6 = require('./output'),
    output = _require6.output;

var _require7 = require('./utils/judgeModule'),
    isTypescriptFile = _require7.isTypescriptFile;

var parse = require('./utils/parseRequest');

function createImportStatement(req) {
  return "import '" + doubleBackslash(req) + "';";
}

function generateDependencies(dependencies) {
  return Object.keys(dependencies).map(function (mod) {
    return createImportStatement(mod);
  }).join('\n');
}

module.exports = /*#__PURE__*/function () {
  var _appLoader = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(content) {
    var query, loaderOptions, rootDir, entryPath, outputPath, platform, mode, disableCopyNpm, turnOffSourceMap, aliasEntries, rawContent, sourcePath, JSXCompilerPath, compiler, compilerOptions, rawContentAfterDCE, transformed, errMsg, _yield$processCSS, style, assets, outputContent, outputOption;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            query = parse(this.request); // Only handle app role file

            if (!(query.role !== 'app')) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return", content);

          case 3:
            loaderOptions = getOptions(this);
            rootDir = loaderOptions.rootDir, entryPath = loaderOptions.entryPath, outputPath = loaderOptions.outputPath, platform = loaderOptions.platform, mode = loaderOptions.mode, disableCopyNpm = loaderOptions.disableCopyNpm, turnOffSourceMap = loaderOptions.turnOffSourceMap, aliasEntries = loaderOptions.aliasEntries;
            rawContent = content;
            if (!existsSync(outputPath)) mkdirpSync(outputPath);
            sourcePath = join(this.rootContext, entryPath);
            JSXCompilerPath = getHighestPriorityPackage('jsx-compiler', this.rootContext);
            compiler = require(JSXCompilerPath);
            compilerOptions = Object.assign({}, compiler.baseOptions, {
              resourcePath: this.resourcePath,
              outputPath: outputPath,
              sourcePath: sourcePath,
              platform: platform,
              type: 'app',
              sourceFileName: this.resourcePath,
              disableCopyNpm: disableCopyNpm,
              turnOffSourceMap: turnOffSourceMap,
              aliasEntries: aliasEntries,
              modernMode: !!rootDir
            });
            rawContentAfterDCE = eliminateDeadCode(rawContent);
            _context.prev = 12;
            transformed = compiler(rawContentAfterDCE, compilerOptions);
            _context.next = 25;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context["catch"](12);
            console.log(chalk.red("\n[" + platform.name + "] Error occured when handling App " + this.resourcePath));

            if (!(process.env.DEBUG === 'true')) {
              _context.next = 23;
              break;
            }

            throw new Error(_context.t0);

          case 23:
            errMsg = _context.t0.node ? _context.t0.message + "\nat " + this.resourcePath : "Unknown compile error! please check your code at " + this.resourcePath;
            throw new Error(errMsg);

          case 25:
            _context.next = 27;
            return processCSS(transformed.cssFiles, sourcePath);

          case 27:
            _yield$processCSS = _context.sent;
            style = _yield$processCSS.style;
            assets = _yield$processCSS.assets;
            transformed.style = style;
            transformed.assets = assets;
            outputContent = {
              code: transformed.code,
              map: transformed.map,
              css: transformed.style ? defaultStyle + transformed.style : defaultStyle
            };
            outputOption = {
              outputPath: {
                code: join(outputPath, platform.type === QUICKAPP ? 'app.ux' : 'app.js'),
                css: join(outputPath, 'app' + platform.extension.css)
              },
              mode: mode,
              isTypescriptFile: isTypescriptFile(this.resourcePath),
              type: 'app',
              platform: platform,
              rootDir: rootDir
            };
            output(outputContent, rawContent, outputOption);
            return _context.abrupt("return", ["/* Generated by JSX2MP AppLoader, sourceFile: " + this.resourcePath + ". */", generateDependencies(transformed.imported)].join('\n'));

          case 36:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[12, 16]]);
  }));

  function appLoader(_x) {
    return _appLoader.apply(this, arguments);
  }

  return appLoader;
}();