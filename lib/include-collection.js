'use strict';

var assert = require('assert');

var test = require('./test');

/**
 * A collection that manages included definitions.
 * @returns {{include:function, exclude:function, otherwise:function, list:function}}
 */
function includeCollection() {

  // state
  var includes = [],
      defaults = [];

  // instance API
  var instance = {
    include  : include,
    exclude  : exclude,
    otherwise: otherwise,
    list     : list
  };
  return instance;

  /**
   * Mark one or more definitions for inclusion when `resolve()` is later called.
   * All given names must exists at the time of the call.
   * Includes and excludes operate in order, any `include()` may possibly be excluded by a later `exclude()`.
   * @param {string|Array.<string>} names Any number of names of existing definitions
   * @returns {{include:function, exclude:function, otherwise:function, list:function}} Chainable
   */
  function include(names) {
    var validated = validateNames(names);

    // add to includes
    includes = includes.concat(validated)
      .filter(test.isFirstOccurrence);

    // chainable
    return instance;
  }

  /**
   * Mark one or more definitions for exclusion when `resolve()` is later called.
   * All given names must exists at the time of the call.
   * Includes and excludes operate in order, any `exclude()` may possibly be included by a later `include()`.
   * @param {string|Array.<string>} names Any number of names of existing definitions
   * @returns {{include:function, exclude:function, otherwise:function, list:function}} Chainable
   */
  function exclude(names) {
    var validated = validateNames(names);

    // alter includes
    includes = includes
      .filter(testNotExcluded)
      .filter(test.isFirstOccurrence);

    // chainable
    return instance;

    function testNotExcluded(value) {
      return (validated.indexOf(value) < 0);
    }
  }

  /**
   * One or more definitions to include if node are explicitly included.
   * @param {string|Array.<string>} names Any number of names of existing definitions
   * @returns {{include:function, exclude:function, otherwise:function, list:function}} Chainable
   */
  function otherwise(names) {
    var validated = validateNames(names);

    // overwrite defaults
    defaults = validated
      .filter(test.isFirstOccurrence);

    // chainable
    return instance;
  }

  /**
   * List the names of definitions that are included.
   * @returns {Array.<string>} A list of included definitions
   */
  function list() {
    return includes.length ? includes.slice() : defaults.slice();
  }
}

module.exports = includeCollection;

function validateNames(candidate) {

  // split concatenated strings
  var names = ((typeof candidate === 'undefined') ? [] : [].concat(candidate))
    .reduce(splitAndAccumulateStrings, []);

  // validate names
  //  names must be alphanumeric strings, possibly concatenated with non-alphanumeric character
  assert(names.every(test.isAlphanumericString),
    'Includes must be named by a simple alphanumeric string, possibly concatenated with a non-alphanumeric character');

  // complete
  return names;

  function splitAndAccumulateStrings(accumulator, value) {
    if (typeof value === 'string') {
      return accumulator
        .concat(value.split(/[^a-zA-Z0-9]+/))
        .filter(Boolean);
    }
    else {
      return accumulator.concat(value);
    }
  }
}