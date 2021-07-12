"use strict";

var _require = require('path'),
    join = _require.join,
    relative = _require.relative,
    dirname = _require.dirname,
    extname = _require.extname;

var enhancedResolve = require('enhanced-resolve');

var chalk = require('chalk');

var _require2 = require('miniapp-builder-shared'),
    QUICKAPP = _require2.constants.QUICKAPP;

var _require3 = require('./utils/judgeModule'),
    isNpmModule = _require3.isNpmModule,
    isWeexModule = _require3.isWeexModule,
    isExternalModule = _require3.isExternalModule,
    isQuickAppModule = _require3.isQuickAppModule,
    isRaxModule = _require3.isRaxModule,
    isRaxAppModule = _require3.isRaxAppModule,
    isJsx2mpRuntimeModule = _require3.isJsx2mpRuntimeModule,
    isNodeNativeModule = _require3.isNodeNativeModule;

var _require4 = require('./utils/pathHelper'),
    addRelativePathPrefix = _require4.addRelativePathPrefix,
    normalizeOutputFilePath = _require4.normalizeOutputFilePath,
    removeExt = _require4.removeExt;

var getAliasCorrespondingValue = require('./utils/getAliasCorrespondingValue');

var RUNTIME = 'jsx2mp-runtime';

var getRuntimeByPlatform = function getRuntimeByPlatform(platform) {
  return RUNTIME + "/dist/jsx2mp-runtime." + platform + ".esm";
};

var getRuntimeRelativePath = function getRuntimeRelativePath(distSourcePath, outputPath) {
  return addRelativePathPrefix(normalizeOutputFilePath(join(relative(dirname(distSourcePath), join(outputPath, 'npm')), RUNTIME)));
};

var defaultOptions = {
  normalizeNpmFileName: function normalizeNpmFileName(s) {
    return s;
  }
};
var transformPathMap = {};
var resolveWithTS = enhancedResolve.create.sync({
  extensions: ['.ts', '.js']
});

module.exports = function visitor(_ref, options) {
  var t = _ref.types;
  options = Object.assign({}, defaultOptions, options);
  var _options = options,
      normalizeNpmFileName = _options.normalizeNpmFileName,
      distSourcePath = _options.distSourcePath,
      resourcePath = _options.resourcePath,
      outputPath = _options.outputPath,
      disableCopyNpm = _options.disableCopyNpm,
      platform = _options.platform,
      aliasEntries = _options.aliasEntries,
      externals = _options.externals;

  var source = function source(value, rootContext) {
    // Example:
    // value => '@ali/universal-goldlog' or '@ali/xxx/foo/lib'
    // filename => '/Users/xxx/workspace/yyy/src/utils/logger.js'
    // rootContext => '/Users/xxx/workspace/yyy/'
    var target = enhancedResolve.sync(resourcePath, value);
    var rootNodeModulePath = join(rootContext, 'node_modules');
    var filePath = relative(dirname(distSourcePath), join(outputPath, 'npm', relative(rootNodeModulePath, target)));
    var modifiedValue = normalizeNpmFileName(addRelativePathPrefix(normalizeOutputFilePath(filePath))); // json file will be transformed to js file

    if (extname(value) === '.json') {
      modifiedValue = removeExt(modifiedValue);
    }

    return t.stringLiteral(modifiedValue);
  }; // In WeChat MiniProgram, `require` can't get index file if index is omitted


  var ensureIndexInPath = function ensureIndexInPath(value, resourcePath) {
    var target = resolveWithTS(dirname(resourcePath), value);
    var result = relative(dirname(resourcePath), target);
    return removeExt(addRelativePathPrefix(normalizeOutputFilePath(result)));
  };

  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(path, state) {
        var value = path.node.source.value; // Handle alias

        var aliasCorrespondingValue = getAliasCorrespondingValue(aliasEntries, value, resourcePath);

        if (aliasCorrespondingValue) {
          path.node.source = t.stringLiteral(aliasCorrespondingValue);
          value = path.node.source.value;
        }

        if (isNpmModule(value)) {
          if (isExternalModule(value, externals)) {
            path.skip();
            return;
          }

          if (isWeexModule(value)) {
            path.remove();
            return;
          }

          if (isQuickAppModule(value)) {
            if (platform.type === QUICKAPP) {
              path.skip();
            } else {
              path.remove();
            }

            return;
          }

          if (isNodeNativeModule(value)) {
            path.skip();
            return;
          }

          if (isRaxModule(value) || isRaxAppModule(value)) {
            var runtimePath = disableCopyNpm ? getRuntimeByPlatform(platform.type) : getRuntimeRelativePath(distSourcePath, outputPath);
            path.node.source = t.stringLiteral(runtimePath);
            transformPathMap[runtimePath] = true;
            return;
          }

          if (isJsx2mpRuntimeModule(value)) {
            var _runtimePath = disableCopyNpm ? value : getRuntimeRelativePath(distSourcePath, outputPath);

            path.node.source = t.stringLiteral(_runtimePath);
            transformPathMap[_runtimePath] = true;
            return;
          }

          if (!disableCopyNpm) {
            var processedSource = source(value, state.cwd); // Add lock to avoid repeatly transformed in CallExpression if @babel/preset-env invoked

            transformPathMap[processedSource.value] = true;
            path.node.source = processedSource;
          }
        } else {
          var ensuredPath = ensureIndexInPath(value, resourcePath);
          path.node.source = t.stringLiteral(ensuredPath);
        }
      },
      CallExpression: function CallExpression(path, state) {
        var node = path.node;

        if (node.callee.name === 'require' && node.arguments && node.arguments.length === 1) {
          if (t.isStringLiteral(node.arguments[0])) {
            var moduleName = node.arguments[0].value; // Handle alias

            var aliasCorrespondingValue = getAliasCorrespondingValue(aliasEntries, moduleName, resourcePath);

            if (aliasCorrespondingValue) {
              path.node.arguments = [t.stringLiteral(aliasCorrespondingValue)];
              moduleName = node.arguments[0].value;
            }

            if (isNpmModule(moduleName)) {
              if (isExternalModule(moduleName, externals)) {
                path.skip();
                return;
              }

              if (isWeexModule(moduleName)) {
                path.replaceWith(t.nullLiteral());
                return;
              }

              if (isQuickAppModule(moduleName)) {
                if (platform.type === QUICKAPP) {
                  path.skip();
                } else {
                  path.replaceWith(t.nullLiteral());
                }

                return;
              }

              if (isNodeNativeModule(moduleName)) {
                path.skip();
                return;
              }

              if (isRaxModule(moduleName) || isRaxAppModule(moduleName)) {
                var runtimePath = disableCopyNpm ? getRuntimeByPlatform(platform.type) : getRuntimeRelativePath(distSourcePath, outputPath);
                path.node.arguments = [t.stringLiteral(runtimePath)];
                return;
              }

              if (isJsx2mpRuntimeModule(moduleName)) {
                var _runtimePath2 = disableCopyNpm ? moduleName : getRuntimeRelativePath(distSourcePath, outputPath);

                path.node.arguments = [t.stringLiteral(_runtimePath2)];
                return;
              }

              if (!disableCopyNpm) {
                var processedSource = source(moduleName, state.cwd);
                transformPathMap[processedSource.value] = true;
                path.node.arguments = [processedSource];
              }
            } else {
              if (!transformPathMap[moduleName]) {
                path.node.arguments = [t.stringLiteral(ensureIndexInPath(moduleName, resourcePath))];
              }
            }
          } else if (t.isExpression(node.arguments[0])) {
            // require with expression, can not staticly find target.
            console.warn(chalk.yellow("Critical requirement of \"" + path.toString() + "\", which have been removed at \n" + state.filename + "."));
            path.replaceWith(t.nullLiteral());
          }
        }
      }
    }
  };
};