"use strict";

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('fs-extra'),
    readFileSync = _require.readFileSync,
    existsSync = _require.existsSync,
    mkdirpSync = _require.mkdirpSync,
    readJSONSync = _require.readJSONSync;

var _require2 = require('path'),
    relative = _require2.relative,
    join = _require2.join,
    dirname = _require2.dirname,
    resolve = _require2.resolve;

var _require3 = require('loader-utils'),
    getOptions = _require3.getOptions;

var chalk = require('chalk');

var cached = require('./cached');

var _require4 = require('./utils/pathHelper'),
    removeExt = _require4.removeExt,
    isFromTargetDirs = _require4.isFromTargetDirs,
    doubleBackslash = _require4.doubleBackslash,
    normalizeOutputFilePath = _require4.normalizeOutputFilePath,
    addRelativePathPrefix = _require4.addRelativePathPrefix,
    getHighestPriorityPackage = _require4.getHighestPriorityPackage;

var eliminateDeadCode = require('./utils/dce');

var processCSS = require('./styleProcessor');

var _require5 = require('./output'),
    output = _require5.output;

var _require6 = require('./utils/judgeModule'),
    isTypescriptFile = _require6.isTypescriptFile;

var parse = require('./utils/parseRequest');

var ScriptLoader = require.resolve('./script-loader');

var MINIAPP_PLUGIN_COMPONENTS_REG = /^plugin\:\/\//;

module.exports = /*#__PURE__*/function () {
  var _pageLoader = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(content) {
    var _this = this;

    var query, loaderOptions, rootDir, platform, entryPath, mode, disableCopyNpm, constantDir, turnOffSourceMap, outputPath, aliasEntries, injectAppCssComponent, resourcePath, rootContext, absoluteConstantDir, sourcePath, relativeSourcePath, targetFilePath, isFromConstantDir, JSXCompilerPath, compiler, compilerOptions, rawContentAfterDCE, transformed, errMsg, _yield$processCSS, style, assets, pageDistDir, distFileWithoutExt, pageConfigPath, config, pageConfig, usingComponents, appCssComponentPath, relativeAppCssComponentPath, outputContent, outputOption, isCustomComponent, dependencies;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            isCustomComponent = function _isCustomComponent(name, usingComponents) {
              if (usingComponents === void 0) {
                usingComponents = {};
              }

              var matchingPath = join(dirname(resourcePath), name);

              for (var key in usingComponents) {
                if (usingComponents.hasOwnProperty(key) && usingComponents[key].indexOf(matchingPath) === 0) {
                  return true;
                }
              }

              return false;
            };

            query = parse(this.request); // Only handle page role file

            if (!(query.role !== 'page')) {
              _context.next = 4;
              break;
            }

            return _context.abrupt("return", content);

          case 4:
            loaderOptions = getOptions(this);
            rootDir = loaderOptions.rootDir, platform = loaderOptions.platform, entryPath = loaderOptions.entryPath, mode = loaderOptions.mode, disableCopyNpm = loaderOptions.disableCopyNpm, constantDir = loaderOptions.constantDir, turnOffSourceMap = loaderOptions.turnOffSourceMap, outputPath = loaderOptions.outputPath, aliasEntries = loaderOptions.aliasEntries, injectAppCssComponent = loaderOptions.injectAppCssComponent;
            resourcePath = this.resourcePath;
            rootContext = this.rootContext;
            absoluteConstantDir = constantDir.map(function (dir) {
              return join(rootContext, dir);
            });
            sourcePath = join(rootContext, dirname(entryPath));
            relativeSourcePath = relative(sourcePath, this.resourcePath);
            targetFilePath = join(outputPath, relativeSourcePath);
            isFromConstantDir = cached(isFromTargetDirs(absoluteConstantDir));
            JSXCompilerPath = getHighestPriorityPackage('jsx-compiler', this.rootContext);
            compiler = require(JSXCompilerPath);
            compilerOptions = Object.assign({}, compiler.baseOptions, {
              resourcePath: this.resourcePath,
              outputPath: outputPath,
              sourcePath: sourcePath,
              type: 'page',
              platform: platform,
              sourceFileName: this.resourcePath,
              disableCopyNpm: disableCopyNpm,
              turnOffSourceMap: turnOffSourceMap,
              aliasEntries: aliasEntries
            });
            rawContentAfterDCE = eliminateDeadCode(content);
            _context.prev = 17;
            transformed = compiler(rawContentAfterDCE, compilerOptions);
            _context.next = 30;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context["catch"](17);
            console.log(chalk.red("\n[" + platform.name + "] Error occured when handling Page " + this.resourcePath));

            if (!(process.env.DEBUG === 'true')) {
              _context.next = 28;
              break;
            }

            throw new Error(_context.t0);

          case 28:
            errMsg = _context.t0.node ? _context.t0.message + "\nat " + this.resourcePath : "Unknown compile error! please check your code at " + this.resourcePath;
            throw new Error(errMsg);

          case 30:
            _context.next = 32;
            return processCSS(transformed.cssFiles, sourcePath);

          case 32:
            _yield$processCSS = _context.sent;
            style = _yield$processCSS.style;
            assets = _yield$processCSS.assets;
            transformed.style = style;
            transformed.assets = assets;
            pageDistDir = dirname(targetFilePath);
            if (!existsSync(pageDistDir)) mkdirpSync(pageDistDir);
            distFileWithoutExt = removeExt(join(outputPath, relativeSourcePath), platform.type);
            pageConfigPath = distFileWithoutExt + '.json';
            config = _extends({}, transformed.config);

            if (existsSync(pageConfigPath)) {
              pageConfig = readJSONSync(pageConfigPath);
              delete pageConfig.usingComponents;
              Object.assign(config, pageConfig);
            }

            if (Array.isArray(transformed.dependencies)) {
              transformed.dependencies.forEach(function (dep) {
                _this.addDependency(dep);
              });
            }

            if (config.usingComponents) {
              usingComponents = {};
              Object.keys(config.usingComponents).forEach(function (key) {
                var value = config.usingComponents[key];

                if (/^c-/.test(key)) {
                  var result = MINIAPP_PLUGIN_COMPONENTS_REG.test(value) ? value : removeExt(addRelativePathPrefix(relative(dirname(_this.resourcePath), value)));
                  usingComponents[key] = normalizeOutputFilePath(result);
                } else {
                  usingComponents[key] = normalizeOutputFilePath(value);
                }
              });
              config.usingComponents = usingComponents;
            } // Only works when developing miniapp plugin, to declare the use of __app_css component


            if (injectAppCssComponent) {
              appCssComponentPath = resolve(outputPath, '__app_css', 'index');
              relativeAppCssComponentPath = relative(pageDistDir, appCssComponentPath);
              config.usingComponents = _extends({
                '__app_css': relativeAppCssComponentPath
              }, config.usingComponents);
            }

            outputContent = {
              code: transformed.code,
              map: transformed.map,
              css: transformed.style || '',
              json: config,
              template: transformed.template,
              assets: transformed.assets,
              importComponents: transformed.importComponents,
              iconfontMap: transformed.iconfontMap
            };
            outputOption = {
              outputPath: {
                code: distFileWithoutExt + '.js',
                json: pageConfigPath,
                css: distFileWithoutExt + platform.extension.css,
                template: distFileWithoutExt + platform.extension.xml,
                assets: outputPath
              },
              mode: mode,
              platform: platform,
              isTypescriptFile: isTypescriptFile(this.resourcePath),
              rootDir: rootDir
            };
            output(outputContent, content, outputOption);
            dependencies = [];
            Object.keys(transformed.imported).forEach(function (name) {
              if (isCustomComponent(name, transformed.usingComponents)) {
                var componentPath = resolve(dirname(resourcePath), name);
                dependencies.push({
                  name: isFromConstantDir(componentPath) ? name : name + "?role=component",
                  // Native miniapp component js file will be loaded by script-loader
                  options: loaderOptions
                });
              } else {
                var importedArray = transformed.imported[name];
                var entirePush = false;
                importedArray.forEach(function (importedContent) {
                  // Component library
                  if (importedContent.isFromComponentLibrary) {
                    dependencies.push({
                      name: name,
                      loader: ScriptLoader,
                      options: Object.assign({}, loaderOptions, {
                        importedComponent: importedContent.local
                      })
                    });
                  } else {
                    if (!entirePush) {
                      dependencies.push({
                        name: name
                      });
                      entirePush = true;
                    }
                  }
                });
              }
            });
            return _context.abrupt("return", ["/* Generated by JSX2MP PageLoader, sourceFile: " + this.resourcePath + ". */", generateDependencies(dependencies)].join('\n'));

          case 52:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[17, 21]]);
  }));

  function pageLoader(_x) {
    return _pageLoader.apply(this, arguments);
  }

  return pageLoader;
}();

function createImportStatement(req) {
  return "import '" + doubleBackslash(req) + "';";
}

function generateDependencies(dependencies) {
  return dependencies.map(function (_ref) {
    var name = _ref.name,
        loader = _ref.loader,
        options = _ref.options;
    var mod = name;
    if (loader) mod = loader + '?' + JSON.stringify(options) + '!' + mod;
    return createImportStatement(mod);
  }).join('\n');
}