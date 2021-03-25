"use strict";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function splitOnFirst(str, separator) {
  if (str === void 0) {
    str = '';
  }

  if (separator === void 0) {
    separator = '';
  }

  var separatorIndex = str.indexOf(separator);

  if (separatorIndex === -1) {
    return [];
  }

  return [str.slice(0, separatorIndex), str.slice(separatorIndex + separator.length)];
}

function parse(request) {
  if (request === void 0) {
    request = '';
  }

  var lastExclamationMark = request.lastIndexOf('!');

  if (lastExclamationMark) {
    var ret = {};
    var originalRequest = request.substr(lastExclamationMark + 1);

    var _splitOnFirst = splitOnFirst(originalRequest, '?'),
        queryString = _splitOnFirst[1];

    if (queryString) {
      for (var _iterator = _createForOfIteratorHelperLoose(queryString.split('&')), _step; !(_step = _iterator()).done;) {
        var param = _step.value;

        var _splitOnFirst2 = splitOnFirst(param, '='),
            key = _splitOnFirst2[0],
            value = _splitOnFirst2[1];

        ret[key] = value;
      }
    }

    return ret;
  }

  return {};
}

module.exports = parse;