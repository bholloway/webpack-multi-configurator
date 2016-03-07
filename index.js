'use strict';

var Configurator = require('webpack-configurator'),
    assert       = require('assert'),
    flatten      = require('lodash.flattenDeep'),
    merge        = require('lodash.merge'),
    assign       = require('lodash.assign');

var defaultMerge         = require('./lib/merge'),
    definitionCollection = require('./lib/definition-collection'),
    overrideGenerator    = require('./lib/override-generator'),
    test                 = require('./lib/test');

/**
 * Create a factory that uses the given parent collection.
 * Primarily to avoid exposing the `parentCollection` as a parameter of `webpackMultiConfigurator()`.
 * @param {object} [parentCollection] An optional definition collection to inherit
 * @returns {function():{create:function,define:function,include:function,exclude:function,otherwise:function,
 * resolve:function}}
 */
function factory(parentCollection) {
  return webpackMultiConfigurator;

  /**
   * Create an instance.
   * The `options` are typically the default values.
   * The `generatorFn` is used to create instances of `webpack-configurator` where requested.
   * The `mergeFn` is used to merge options with defaults whenever `create()` is called.
   * @param {object} [options] An optional hash of options
   * @param {function} [generatorFn] An optional factory function that creates a webpack-configurator instance
   * @param {function} [mergeFn] An optional function that merges options
   * @returns {{create:function,define:function,include:function,exclude:function,otherwise:function,resolve:function}}
   */
  function webpackMultiConfigurator(options, generatorFn, mergeFn) {

    // instance state
    var includes = [],
        defaults = [];

    // instance API
    var instance = {
      create   : create,
      define   : define,
      include  : include,
      exclude  : exclude,
      otherwise: otherwise,
      resolve  : resolve
    };

    // ensure generator function
    if (typeof generatorFn !== 'function') {
      generatorFn = defaultGenerator;
    }
    // on the top-level instance any given generatorFn must inherit default generator
    else if (!parentCollection) {
      generatorFn = overrideGenerator(generatorFn, defaultGenerator);
    }

    // ensure merge function
    mergeFn = (typeof mergeFn === 'function') && mergeFn || defaultMerge;

    // create a definition collection that extends the parent
    var collection = definitionCollection(instance, options, generatorFn, parentCollection);

    // complete
    return instance;

    /**
     * Merge the given options with the existing (usually default) values and create a new instance.
     * Existing definitions will be carried over but includes will not.
     * @params {...object} optsOrConfigurator Any number of option hashes or a configurator factory function
     * @returns {object} An instance using existing options with the given overrides
     */
    function create(/*...optsOrConfigurator*/) {

      // merge options
      var flatArgs            = flatten(Array.prototype.slice.call(arguments)),
          optionOverrides     = flatArgs.filter(test.isObject),
          generatorOverrideFn = flatArgs.filter(test.isFunction).pop(),
          optionsCopy         = merge({}, options),
          mergedOptions       = mergeFn.apply(null, [optionsCopy].concat(optionOverrides));

      // override the generator function but bind the existing generator function as an argument
      if (generatorOverrideFn) {
        generatorFn = overrideGenerator(generatorOverrideFn, generatorFn);
      }

      // return a new instance and recreate definitions
      return factory(collection)(mergedOptions, generatorFn, mergeFn);
    }

    /**
     * Work with a configuration by name.
     * @param {string} name The name of the configuration
     */
    function define(name) {
      return assign({}, collection.get(name), instance);
    }

    /**
     * Mark one or more definitions for inclusion when `resolve()` is later called.
     * All given names must exists at the time of the call.
     * Includes and excludes operate in order, any `include()` may possibly be excluded by a later `exclude()`.
     * @param {...string} names Any number of names of existing definitions
     * @returns The current instance
     */
    function include(names) {
      names = validateNames(Array.prototype.slice.call(arguments));

      // add to includes
      includes.push.apply(includes, names);

      // chainable
      return instance;
    }

    /**
     * Mark one or more definitions for exclusion when `resolve()` is later called.
     * All given names must exists at the time of the call.
     * Includes and excludes operate in order, any `exclude()` may possibly be included by a later `include()`.
     * @param {...string} names Any number of names of existing definitions
     * @returns The current instance
     */
    function exclude(names) {
      names = validateNames(Array.prototype.slice.call(arguments));

      // alter includes
      includes = includes.filter(testNotExcluded);

      // chainable
      return instance;

      function testNotExcluded(value) {
        return (names.indexOf(value) < 0);
      }
    }

    /**
     * One or more definitions to include if node are explicitly included.
     * @param {...string} names Any number of names of existing definitions
     * @returns The current instance
     */
    function otherwise(names) {
      names = validateNames(Array.prototype.slice.call(arguments));

      // overwrite defaults
      defaults = names;

      // chainable
      return instance;
    }

    /**
     * Chain together definitions to produce one configuration for each item marked as included.
     * If no items have been included then use the default list marked by `otherwise`.
     * @returns {Array.<object>}
     */
    function resolve() {
      return flatten((includes.length ? includes : defaults).map(collection.resolve));
    }
  }
}

module.exports = factory();

function validateNames(list) {

  // split concatenated strings
  var names = list
    .reduce(splitAndAccumulateStrings, []);

  // validate names
  //  names must be alphanumeric strings, possibly concatenated with character _|+|&
  assert(names.every(test.isAlphanumericString),
    'Includes must be named by a simple alphanumeric string, possibly concatenated with _|+|&');

  // complete
  return names;

  function splitAndAccumulateStrings(accumulator, value) {
    if (typeof value === 'string') {
      return accumulator.concat(value.split(/[_\W]+/));
    }
    else {
      return accumulator;
    }
  }
}

function defaultGenerator() {
  return new Configurator();
}