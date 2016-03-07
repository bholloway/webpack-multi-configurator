'use strict';

var camelcase = require('camelcase'),
    get       = require('lodash.get'),
    set       = require('lodash.set');

/**
 * Merge where keys may be in camel-case or as environment variable.
 * Nested fields are supported by dot-delimited camel-case, or double-underscore delimited uppercase
 * IEEE Std 1003.1-2001.
 * @param {object} destination A destination hash
 * @param {...object} options Any number of source hashes
 * @returns {object} A complete assigned set
 */
function merge(destination, options) {
  options = Array.prototype.slice.call(arguments, 1);

  return options
    .reduce(reduceOptions, destination);

  function reduceOptions(destination, source) {
    return Object.keys(source)
      .reduce(reduceKeys, destination);

    function reduceKeys(reduced, key) {
      var expectedKey = key
        .split('__')
        .map(camelcaseElement)
        .join('.');

      var existingValue = get(destination, expectedKey),
          sourceValue   = source[key],
          isObject      = !!sourceValue && (typeof sourceValue === 'object'),
          newValue      = isObject ? merge(existingValue, sourceValue) : parse(sourceValue, typeof existingValue);
      set(reduced, expectedKey, newValue);

      return reduced;
    }
  }
}

module.exports = merge;

function parse(value, type) {
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return parseInt(value);
    case 'boolean':
      return /^\s*true\s*$/.test(value);
    default:
      return value;
  }
}

function camelcaseElement(text) {
  return camelcase(text);
}