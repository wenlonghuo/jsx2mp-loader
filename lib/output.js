"use strict";

var _require = require('fs-extra'),
    writeJSONSync = _require.writeJSONSync,
    writeFileSync = _require.writeFileSync,
    readFileSync = _require.readFileSync,
    existsSync = _require.existsSync,
    mkdirpSync = _require.mkdirpSync;

var _require2 = require('path'),
    extname = _require2.extname,
    dirname = _require2.dirname,
    join = _require2.join,
    relative = _require2.relative;

var _require3 = require('@babel/core'),
    transformSync = _require3.transformSync;

var _require4 = require('./utils/minifyCode'),
    minify = _require4.minify,
    minifyJS = _require4.minifyJS,
    minifyCSS = _require4.minifyCSS,
    minifyXML = _require4.minifyXML;

var addSourceMap = require('./utils/addSourceMap');

var _require5 = require('./constants'),
    QUICKAPP = _require5.QUICKAPP;

function transformCode(rawContent, mode, externalPlugins, externalPreset) {
  if (externalPlugins === void 0) {
    externalPlugins = [];
  }

  if (externalPreset === void 0) {
    externalPreset = [];
  }

  var presets = [].concat(externalPreset);
  var plugins = externalPlugins.concat([require('@babel/plugin-proposal-export-default-from'), // for support of export default
  [require('babel-plugin-transform-define'), {
    'process.env.NODE_ENV': mode === 'build' ? 'production' : 'development'
  }], [require('babel-plugin-minify-dead-code-elimination-while-loop-fixed'), {
    optimizeRawSize: true,
    keepFnName: true
  }]]);
  var babelParserOption = {
    plugins: ['classProperties', 'jsx', 'typescript', 'trailingFunctionCommas', 'asyncFunctions', 'exponentiationOperator', 'asyncGenerators', 'objectRestSpread', ['decorators', {
      decoratorsBeforeExport: false
    }], 'dynamicImport'] // support all plugins

  };
  return transformSync(rawContent, {
    presets: presets,
    plugins: plugins,
    parserOpts: babelParserOption
  });
}
/**
 * Process and write file
 * @param {object} content Compiled result
 * @param {string} raw Original file content
 * @param {object} options
 */


function output(content, raw, options) {
  var mode = options.mode,
      outputPath = options.outputPath,
      _options$externalPlug = options.externalPlugins,
      externalPlugins = _options$externalPlug === void 0 ? [] : _options$externalPlug,
      isTypescriptFile = options.isTypescriptFile,
      platform = options.platform,
      type = options.type,
      rootDir = options.rootDir;
  var code = content.code,
      config = content.config,
      json = content.json,
      css = content.css,
      map = content.map,
      template = content.template,
      assets = content.assets,
      _content$importCompon = content.importComponents,
      importComponents = _content$importCompon === void 0 ? [] : _content$importCompon,
      iconfontMap = content.iconfontMap;
  var isQuickApp = platform.type === QUICKAPP;

  if (isTypescriptFile) {
    externalPlugins.unshift(require('@babel/plugin-transform-typescript'));
  }

  if (mode === 'build') {
    // Compile ES6 => ES5 and minify code
    code && (code = minifyJS(transformCode(code, mode, externalPlugins.concat([require('@babel/plugin-proposal-class-properties')]), [[require('@babel/preset-env'), {
      exclude: ['@babel/plugin-transform-regenerator']
    }]]).code));
    config && (config = minifyJS(transformCode(config, mode, externalPlugins.concat([require('@babel/plugin-proposal-class-properties')]), [require('@babel/preset-env')]).code));
    css && (css = minifyCSS(css));
    template && (template = minifyXML(template));
  } else {
    if (code) {
      code = transformCode(code, mode, externalPlugins.concat([require('@babel/plugin-proposal-class-properties')])).code; // Add source map

      if (map) {
        code = addSourceMap(code, raw, map);
      }
    }
  } // Write file


  if (code) {
    if (isQuickApp) {
      // wrap with script for app.ux
      if (type === 'app') {
        code = "<script>\n" + code + "\n</script>\n";
        writeFileWithDirCheck(outputPath.code, code, {
          rootDir: rootDir
        }); // check if update fns exists

        if (global._appUpdateFns && global._appUpdateFns.length) {
          global._appUpdateFns.map(function (fn) {
            fn.call();
          });

          global._appUpdateFns = [];
        }
      } else {
        // insert global iconfont in app.ux if iconfont detected in page/component
        if (iconfontMap && iconfontMap.length) {
          var appPath = join(outputPath.assets, 'app.ux');
          var appContent = readFileSync(appPath, 'utf8');

          if (appContent.length) {
            updateAppUx(appContent, iconfontMap, appPath);
          } else {
            // cache update fns in case app.ux is not ready yet
            global._appUpdateFns = global._appUpdateFns || [];

            global._appUpdateFns.push(updateAppUx.bind(null, appContent, iconfontMap, appPath));
          }
        }
      }
    }

    writeFileWithDirCheck(outputPath.code, code, {
      rootDir: rootDir
    });
  }

  if (json) {
    writeFileWithDirCheck(outputPath.json, json, {
      rootDir: rootDir,
      type: 'json'
    });
  }

  if (template) {
    if (isQuickApp) {
      if (importComponents && importComponents.length) {
        template = importComponents.join('\n') + "\n" + template + "\n";
      }

      if (code) {
        template += "<script>\n" + code + "\n</script>\n";
      }

      if (css && outputPath.css) {
        template += "<style src=\"./" + relative(dirname(outputPath.template), outputPath.css) + "\"></style>\n";
      } else {
        template += "<style>\n    .__rax-view {\n      border: 0 solid black;\n      display:flex;\n      flex-direction:column;\n      align-content:flex-start;\n      flex-shrink:0;\n    }\n    </style>\n";
      }
    }

    writeFileWithDirCheck(outputPath.template, template, {
      rootDir: rootDir
    });
  }

  if (css) {
    if (isQuickApp) {
      // add common style in css files
      if (!css.includes('.__rax-view')) {
        css = "\n  .__rax-view {\n    border: 0 solid black;\n    display:flex;\n    flex-direction:column;\n    align-content:flex-start;\n    flex-shrink:0;\n  }\n  " + css;
      }

      css = css.replace(/rpx/g, 'px');
    }

    writeFileWithDirCheck(outputPath.css, css, {
      rootDir: rootDir
    });
  }

  if (config) {
    writeFileWithDirCheck(outputPath.config, config, {
      rootDir: rootDir
    });
  } // Write extra assets


  if (assets) {
    Object.keys(assets).forEach(function (asset) {
      var ext = extname(asset);
      var content = assets[asset];

      if (isQuickApp) {
        content = content.replace(/rpx/g, 'px');
      }

      if (mode === 'build') {
        content = minify(content, ext);
      }

      var assetsOutputPath = join(outputPath.assets, asset);
      writeFileWithDirCheck(assetsOutputPath, content, {
        rootDir: rootDir
      });
    });
  }
}
/**
 * Insert iconfont configure in app.ux
 * @param {string} appContent Content of compiled app.ux
 * @param {object} iconfontMap Compiled iconfont's map
 * @param {string} appPath Path for app.ux
 */


function updateAppUx(appContent, iconfontMap, appPath) {
  var insertIndex = appContent.indexOf('</style>');

  if (insertIndex < 0) {
    appContent = appContent + "\n<style>\n" + iconfontMap.map(function (v) {
      return "@font-face {\n  font-family: " + v.fontFamily + ";\n  src: url('" + v.url + "');\n}\n." + v.iconClass + " {\n  font-family: " + v.fontFamily + ";\n}";
    }).join('\n') + "\n</style>";
  } else {
    appContent = appContent.substr(0, insertIndex) + "\n" + iconfontMap.map(function (v) {
      return "@font-face {\n  font-family: " + v.fontFamily + ";\n  src: url('" + v.url + "');\n}\n." + v.iconClass + " {\n  font-family: " + v.fontFamily + ";\n}";
    }).join('\n') + "\n</style>";
  }

  writeFileSync(appPath, appContent);
}
/**
 * mkdir before write file if dir does not exist
 * @param {string} filePath
 * @param {string|Buffer|TypedArray|DataView} content
 * @param {Object} options
 * @param {string} options.type - [type=file] 'file' or 'json'
 * @param {string} options.rootDir
 * @
 */


function writeFileWithDirCheck(filePath, content, _ref) {
  var _ref$type = _ref.type,
      type = _ref$type === void 0 ? 'file' : _ref$type,
      rootDir = _ref.rootDir;
  var dirPath = dirname(filePath); // Although only write file to rootDir, it still need be compatible with old project

  if (!rootDir || dirPath.indexOf(rootDir) > -1) {
    if (!existsSync(dirPath)) {
      mkdirpSync(dirPath);
    }

    if (type === 'file') {
      writeFileSync(filePath, content);
    } else if (type === 'json') {
      writeJSONSync(filePath, content, {
        spaces: 2
      });
    }
  }
}

module.exports = {
  output: output,
  transformCode: transformCode
};