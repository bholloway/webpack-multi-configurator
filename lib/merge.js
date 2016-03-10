'use strict';

var camelcase = require('camelcase'),
    assert    = require('assert'),
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
      var sourceValue    = source[key],
          isObjectSource = !!sourceValue && (typeof sourceValue === 'object');

      // uppercase key
      if (key.toUpperCase() === key) {

        // recursion is not supported
        assert(!isObjectSource, 'An upper-case key may not be used to assign an object value');

        // decode the given key to a camel-case object path
        var expectedKey = key
          .replace(/\W/g, '')     // only word characters are permitted
          .split('__')            // double-underscore replaces "." as the property delimiter
          .filter(Boolean)        // ignore zero length elements
          .map(camelcaseElement)  // convert "SOME_PROP" to "someProp"
          .join('.');             // convert back to "." property delimiter

        // parse and assign
        var existingValue = get(destination, expectedKey),
            newValue      = parse(sourceValue, typeof existingValue);
        set(reduced, expectedKey, newValue);
      }
      // otherwise recurse object sources
      else if (isObjectSource) {
        reduced[key] = recurse(destination[key], sourceValue);
      }
      // otherwise parse
      else {
        reduced[key] = parse(sourceValue, typeof destination[key]);
      }

      // next
      return reduced;
    }
  }

  function recurse(existingValue, sourceValue) {
    var isObject  = !!existingValue && (typeof existingValue === 'object'),
        destValue = isObject ? existingValue : {};
    return merge(destValue, sourceValue);
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
  return (text.length < 2) ? text.toLowerCase() : camelcase(text);
}