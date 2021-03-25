"use strict";

var _require = require('path'),
    join = _require.join,
    isAbsolute = _require.isAbsolute,
    relative = _require.relative,
    dirname = _require.dirname;

var ALIAS_TYPE = {
  // react -> rax
  MODULE: 1,
  // @component/comp.jsx -> /User/name/code/src/component/comp.jsx
  PATH: 2,
  // @components -> /User/name/code/src/component
  COMPLEX_PATH: 3
};

function getAliasType(aliasEntries, importedModule) {
  if (aliasEntries[importedModule]) {
    if (isAbsolute(aliasEntries[importedModule])) {
      return [ALIAS_TYPE.PATH];
    } else {
      return [ALIAS_TYPE.MODULE];
    }
  }

  var correspondingAlias = '';
  var useComplexPath = Object.keys(aliasEntries).some(function (alias) {
    if (importedModule.startsWith(alias) && importedModule[alias.length] === '/') {
      correspondingAlias = alias;
      return true;
    }
  });
  if (useComplexPath) return [ALIAS_TYPE.COMPLEX_PATH, correspondingAlias];
  return [];
}

function getAliasCorrespondingValue(aliasEntries, value, resourcePath) {
  if (aliasEntries === void 0) {
    aliasEntries = {};
  }

  if (value === void 0) {
    value = '';
  }

  if (resourcePath === void 0) {
    resourcePath = '';
  }

  var _getAliasType = getAliasType(aliasEntries, value),
      aliasType = _getAliasType[0],
      correspondingAlias = _getAliasType[1];

  if (aliasType) {
    var replacedValue;

    switch (aliasType) {
      case ALIAS_TYPE.MODULE:
        // e.g. react -> rax
        replacedValue = aliasEntries[value];
        break;

      case ALIAS_TYPE.PATH:
        // e.g. @logo -> ../components/Logo (alias: @logo -> src/components/Logo)
        replacedValue = relative(dirname(resourcePath), aliasEntries[value]);
        break;

      case ALIAS_TYPE.COMPLEX_PATH:
        // e.g. @components/Logo -> ../components/logo (alias: @components -> src/components)
        var realAbsolutePath = join(aliasEntries[correspondingAlias], value.replace(correspondingAlias, ''));
        replacedValue = './' + relative(dirname(resourcePath), realAbsolutePath); // Add relative path in case the path is recognized as npm package

        break;
    }

    return replacedValue;
  }

  return null;
}

module.exports = getAliasCorrespondingValue;