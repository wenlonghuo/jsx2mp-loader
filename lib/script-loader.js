"use strict";

var _require = require('path'),
    join = _require.join,
    dirname = _require.dirname,
    relative = _require.relative,
    resolve = _require.resolve,
    sep = _require.sep,
    extname = _require.extname;

var _require2 = require('fs-extra'),
    copySync = _require2.copySync,
    existsSync = _require2.existsSync,
    mkdirpSync = _require2.mkdirpSync,
    ensureFileSync = _require2.ensureFileSync,
    writeJSONSync = _require2.writeJSONSync,
    readFileSync = _require2.readFileSync,
    readJSONSync = _require2.readJSONSync;

var _require3 = require('loader-utils'),
    getOptions = _require3.getOptions;

var resolveModule = require('resolve');

var _require4 = require('miniapp-builder-shared'),
    QUICKAPP = _require4.constants.QUICKAPP;

var cached = require('./cached');

var _require5 = require('./utils/pathHelper'),
    removeExt = _require5.removeExt,
    doubleBackslash = _require5.doubleBackslash,
    normalizeOutputFilePath = _require5.normalizeOutputFilePath,
    addRelativePathPrefix = _require5.addRelativePathPrefix,
    isFromTargetDirs = _require5.isFromTargetDirs;

var _require6 = require('./utils/judgeModule'),
    isNpmModule = _require6.isNpmModule,
    isJSONFile = _require6.isJSONFile,
    isTypescriptFile = _require6.isTypescriptFile;

var isMiniappComponent = require('./utils/isMiniappComponent');

var parse = require('./utils/parseRequest');

var _require7 = require('./output'),
    output = _require7.output,
    transformCode = _require7.transformCode;

var ScriptLoader = __filename;
var cwd = process.cwd();
var MINIAPP_CONFIG_FIELD = 'miniappConfig'; // 1. JSON file will be written later because usingComponents may be modified
// 2. .d.ts file in rax base components are useless

var OMIT_FILE_EXTENSION_IN_OUTPUT = ['.json', '.ts'];

module.exports = function scriptLoader(content) {
  var _this = this;

  var query = parse(this.request);

  if (query.role) {
    return content;
  }

  var loaderOptions = getOptions(this);
  var rootDir = loaderOptions.rootDir,
      disableCopyNpm = loaderOptions.disableCopyNpm,
      outputPath = loaderOptions.outputPath,
      mode = loaderOptions.mode,
      entryPath = loaderOptions.entryPath,
      platform = loaderOptions.platform,
      _loaderOptions$import = loaderOptions.importedComponent,
      importedComponent = _loaderOptions$import === void 0 ? '' : _loaderOptions$import,
      _loaderOptions$isRela = loaderOptions.isRelativeMiniappComponent,
      isRelativeMiniappComponent = _loaderOptions$isRela === void 0 ? false : _loaderOptions$isRela,
      aliasEntries = loaderOptions.aliasEntries,
      constantDir = loaderOptions.constantDir,
      _loaderOptions$extern = loaderOptions.externals,
      externals = _loaderOptions$extern === void 0 ? {} : _loaderOptions$extern;
  var rootContext = this.rootContext;
  var isJSON = isJSONFile(this.resourcePath);
  var isAppJSon = this.resourcePath === join(rootContext, 'src', 'app.json');
  var isCommonJSON = isJSON && !isAppJSon;
  var rawContent = isCommonJSON ? content : readFileSync(this.resourcePath, 'utf-8');
  var nodeModulesPathList = getNearestNodeModulesPath(rootContext, this.resourcePath);
  var currentNodeModulePath = nodeModulesPathList[nodeModulesPathList.length - 1];
  var rootNodeModulePath = join(rootContext, 'node_modules');
  var isFromNodeModule = cached(function isFromNodeModule(path) {
    return path.indexOf(rootNodeModulePath) === 0;
  });
  var isFromConstantDir = cached(isFromTargetDirs(constantDir));
  var getNpmFolderName = cached(function getNpmName(relativeNpmPath) {
    var isScopedNpm = /^_?@/.test(relativeNpmPath);
    return relativeNpmPath.split(sep).slice(0, isScopedNpm ? 2 : 1).join(sep);
  });

  var outputFile = function outputFile(rawContent, isFromNpm) {
    if (isFromNpm === void 0) {
      isFromNpm = true;
    }

    var distSourcePath;

    if (isFromNpm) {
      var relativeNpmPath = relative(currentNodeModulePath, _this.resourcePath);
      var splitedNpmPath = relativeNpmPath.split(sep);
      if (/^_?@/.test(relativeNpmPath)) splitedNpmPath.shift(); // Extra shift for scoped npm.

      splitedNpmPath.shift(); // Skip npm module package, for cnpm/tnpm will rewrite this.

      distSourcePath = normalizeNpmFileName(join(outputPath, 'npm', relative(rootNodeModulePath, _this.resourcePath)));
    } else {
      var relativeFilePath = relative(join(rootContext, dirname(entryPath)), _this.resourcePath);
      distSourcePath = join(outputPath, relativeFilePath);
    }

    var outputContent = {};
    var outputOption = {};
    outputContent = {
      code: rawContent
    };
    outputOption = {
      outputPath: {
        code: removeExt(distSourcePath) + '.js'
      },
      mode: mode,
      externalPlugins: [[require('./babel-plugin-rename-import'), {
        normalizeNpmFileName: normalizeNpmFileName,
        distSourcePath: distSourcePath,
        resourcePath: _this.resourcePath,
        outputPath: outputPath,
        disableCopyNpm: disableCopyNpm,
        platform: platform,
        aliasEntries: aliasEntries,
        externals: externals
      }]],
      platform: platform,
      isTypescriptFile: isTypescriptFile(_this.resourcePath),
      rootDir: rootDir
    };
    output(outputContent, null, outputOption);
  };

  var outputDir = function outputDir(source, target, _temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$isThirdMiniappCo = _ref.isThirdMiniappComponent,
        isThirdMiniappComponent = _ref$isThirdMiniappCo === void 0 ? false : _ref$isThirdMiniappCo,
        resourcePath = _ref.resourcePath;

    if (existsSync(source)) {
      mkdirpSync(target);
      copySync(source, target, {
        overwrite: false,
        filter: function filter(filename) {
          var isJSONFile = extname(filename) === '.json';
          var isNpmDirFile = filename.indexOf('npm') > -1; // if isThirdMiniappComponent, only exclude the json file of the component itself

          var filterJSONFile = isThirdMiniappComponent ? isNpmDirFile || !isJSONFile : !isJSONFile;
          return !/__(mocks|tests?)__/.test(filename) && filterJSONFile; // JSON file will be written later because usingComponents may be modified
        }
      });
    }
  };

  var checkUsingComponents = function checkUsingComponents(dependencies, originalComponentConfigPath, distComponentConfigPath, sourceNativeMiniappScriptFile, npmName) {
    // quickapp component doesn't maintain config file
    if (platform.type === QUICKAPP) {
      return;
    }

    if (existsSync(originalComponentConfigPath)) {
      var componentConfig = readJSONSync(originalComponentConfigPath);

      if (componentConfig.usingComponents) {
        for (var key in componentConfig.usingComponents) {
          if (componentConfig.usingComponents.hasOwnProperty(key)) {
            var componentPath = componentConfig.usingComponents[key];

            if (isNpmModule(componentPath)) {
              // component from node module
              var realComponentPath = resolveModule.sync(componentPath, {
                basedir: cwd,
                paths: [_this.resourcePath],
                preserveSymlinks: false
              });
              var relativeComponentPath = normalizeNpmFileName(addRelativePathPrefix(relative(dirname(sourceNativeMiniappScriptFile), realComponentPath)));
              componentConfig.usingComponents[key] = normalizeOutputFilePath(removeExt(relativeComponentPath)); // Native miniapp component js file will loaded by script-loader

              dependencies.push({
                name: realComponentPath,
                options: loaderOptions
              });
            } else if (componentPath.indexOf('/npm/') === -1) {
              // Exclude the path that has been modified by jsx-compiler
              var absComponentPath = resolve(dirname(sourceNativeMiniappScriptFile), componentPath); // Native miniapp component js file will loaded by script-loader

              dependencies.push({
                name: absComponentPath,
                options: Object.assign({
                  isRelativeMiniappComponent: true
                }, loaderOptions)
              });
            }
          }
        }
      }

      if (!existsSync(distComponentConfigPath)) {
        ensureFileSync(distComponentConfigPath);
        writeJSONSync(distComponentConfigPath, componentConfig);
      }
    } else {
      _this.emitWarning('Cannot found miniappConfig component for: ' + npmName);
    }
  }; // Third miniapp component may come from npm or constantDir


  var isThirdMiniappComponent = isMiniappComponent(this.resourcePath, platform.type);

  if (isFromNodeModule(this.resourcePath)) {
    if (disableCopyNpm) {
      return isCommonJSON ? '{}' : content;
    }

    var relativeNpmPath = relative(currentNodeModulePath, this.resourcePath);
    var npmFolderName = getNpmFolderName(relativeNpmPath);
    var sourcePackagePath = join(currentNodeModulePath, npmFolderName);
    var sourcePackageJSONPath = join(sourcePackagePath, 'package.json');
    var pkg = readJSONSync(sourcePackageJSONPath);
    var npmName = pkg.name; // Update to real npm name, for that tnpm will create like `_rax-view@1.0.2@rax-view` folders.

    var npmMainPath = join(sourcePackagePath, pkg.main || '');
    var isUsingMainMiniappComponent = pkg.hasOwnProperty(MINIAPP_CONFIG_FIELD) && this.resourcePath === npmMainPath; // Is miniapp compatible component.

    if (isUsingMainMiniappComponent || isRelativeMiniappComponent || isThirdMiniappComponent) {
      var mainName = platform.type === 'ali' ? 'main' : "main:" + platform.type; // Case 1: Single component except those old universal api with pkg.miniappConfig
      // Case 2: Component library which exports multiple components

      var isSingleComponent = pkg.miniappConfig && pkg.miniappConfig[mainName];
      var isComponentLibrary = pkg.miniappConfig && pkg.miniappConfig.subPackages && pkg.miniappConfig.subPackages[importedComponent];
      var dependencies = [];

      if (isSingleComponent || isComponentLibrary || isRelativeMiniappComponent) {
        var miniappComponentPath = isRelativeMiniappComponent ? relative(sourcePackagePath, removeExt(this.resourcePath)) : isSingleComponent ? pkg.miniappConfig[mainName] : pkg.miniappConfig.subPackages[importedComponent][mainName];
        var sourceNativeMiniappScriptFile = join(sourcePackagePath, miniappComponentPath); // Exclude quickapp native component for resolving issue

        if (platform.type !== QUICKAPP) {
          // Native miniapp component js file will loaded by script-loader
          dependencies.push({
            name: sourceNativeMiniappScriptFile,
            options: loaderOptions
          });
        } // Handle subComponents


        if (isComponentLibrary && pkg.miniappConfig.subPackages[importedComponent].subComponents) {
          var subComponents = pkg.miniappConfig.subPackages[importedComponent].subComponents;
          Object.keys(subComponents).forEach(function (subComponentName) {
            var subComponentScriptFile = join(sourcePackagePath, subComponents[subComponentName][mainName]);
            dependencies.push({
              name: subComponentScriptFile,
              loader: ScriptLoader,
              options: loaderOptions
            });
          });
        }

        var miniappComponentDir = miniappComponentPath.slice(0, miniappComponentPath.lastIndexOf('/'));
        var source = join(sourcePackagePath, miniappComponentDir);
        var target = normalizeNpmFileName(join(outputPath, 'npm', relative(rootNodeModulePath, sourcePackagePath), miniappComponentDir));
        outputDir(source, target, {
          isThirdMiniappComponent: isThirdMiniappComponent,
          resourcePath: this.resourcePath
        }); // Modify referenced component location according to the platform

        var originalComponentConfigPath = join(sourcePackagePath, miniappComponentPath + '.json');
        var distComponentConfigPath = normalizeNpmFileName(join(outputPath, 'npm', relative(rootNodeModulePath, sourcePackagePath), miniappComponentPath + '.json'));
        checkUsingComponents(dependencies, originalComponentConfigPath, distComponentConfigPath, sourceNativeMiniappScriptFile, npmName);
      }

      if (isThirdMiniappComponent) {
        var _source = dirname(this.resourcePath);

        var _target = dirname(normalizeNpmFileName(join(outputPath, 'npm', relative(rootNodeModulePath, this.resourcePath))));

        outputDir(_source, _target);
        outputFile(rawContent);

        var _originalComponentConfigPath = removeExt(this.resourcePath) + '.json';

        var _distComponentConfigPath = normalizeNpmFileName(join(outputPath, 'npm', relative(rootNodeModulePath, removeExt(this.resourcePath) + '.json')));

        checkUsingComponents(dependencies, _originalComponentConfigPath, _distComponentConfigPath, this.resourcePath, npmName);
      }

      return ["/* Generated by JSX2MP ScriptLoader, sourceFile: " + this.resourcePath + ". */", generateDependencies(dependencies), content].join('\n');
    } else {
      outputFile(rawContent);
    }
  } else if (isFromConstantDir(this.resourcePath) && isThirdMiniappComponent) {
    var _dependencies = [];
    outputFile(rawContent, false); // Find dependencies according to usingComponents config

    var componentConfigPath = removeExt(this.resourcePath) + '.json';
    var componentConfig = readJSONSync(componentConfigPath);

    for (var key in componentConfig.usingComponents) {
      var componentPath = componentConfig.usingComponents[key];
      var absComponentPath = resolve(dirname(this.resourcePath), componentPath);

      _dependencies.push({
        name: absComponentPath,
        options: loaderOptions
      });
    }

    return ["/* Generated by JSX2MP ScriptLoader, sourceFile: " + this.resourcePath + ". */", generateDependencies(_dependencies), content].join('\n');
  } else if (!isAppJSon) {
    outputFile(rawContent, false);
  }

  return isJSON ? '{}' : transformCode(content, mode, [require('@babel/plugin-proposal-class-properties')]).code; // For normal js file, syntax like class properties can't be parsed without babel plugins
};
/**
 * For that alipay build folder can not contain `@`, escape to `_`.
 */


function normalizeNpmFileName(filename) {
  var repalcePathname = function repalcePathname(pathname) {
    return pathname.replace(/@/g, '_').replace(/node_modules/g, 'npm');
  };

  if (!filename.includes(cwd)) return repalcePathname(filename); // Support for `@` in cwd path

  var relativePath = relative(cwd, filename);
  return join(cwd, repalcePathname(relativePath));
}

function getNearestNodeModulesPath(root, current) {
  var relativePathArray = relative(root, current).split(sep);
  var index = root;
  var result = [];

  while (index !== current) {
    var ifNodeModules = join(index, 'node_modules');

    if (existsSync(ifNodeModules)) {
      result.push(ifNodeModules);
    }

    index = join(index, relativePathArray.shift());
  }

  return result;
}

function generateDependencies(dependencies) {
  return dependencies.map(function (_ref2) {
    var name = _ref2.name,
        loader = _ref2.loader,
        options = _ref2.options;
    var mod = name;
    if (loader) mod = loader + '?' + JSON.stringify(options) + '!' + mod;
    return createImportStatement(mod);
  }).join('\n');
}

function createImportStatement(req) {
  return "import '" + doubleBackslash(req) + "';";
}