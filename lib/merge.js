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
      var sourceValue = source[key];

      // uppercase key
      if (key.toUpperCase() === key) {
        var expectedKey = key
          .replace(/\W/g, '')     // only word characters are permitted
          .split('__')            // double-underscore replaces "." as the property delimiter
          .map(camelcaseElement)  // convert SOME_TAG to someTag
          .join('.');             // convert back to "." property delimiter

        // find the existing value
        var existingValue = get(destination, expectedKey);

        // possible recursion
        var isObjectSource = !!sourceValue && (typeof sourceValue === 'object'),
            newValue;
        if (isObjectSource) {
          var isObjectExisting = !!destination && (typeof destination === 'object'),
              destObject       = isObjectExisting ? existingValue : {};
          newValue = merge(destObject, sourceValue);
        }
        // otherwise parse source to existing type
        else {
          newValue = parse(sourceValue, typeof existingValue);
        }

        // assign
        set(reduced, expectedKey, newValue);
      }
      // otherwise treat key as conventional
      else {
        reduced[key] = parse(sourceValue, typeof destination[key]);
      }

      // next
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