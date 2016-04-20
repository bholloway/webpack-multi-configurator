'use strict';

var Configurator = require('webpack-configurator'),
    flatten      = require('lodash.flattendeep'),
    merge        = require('lodash.merge'),
    assign       = require('lodash.assign');

var defaultMerge         = require('merge-env'),
    definitionCollection = require('./lib/definition-collection'),
    includeCollection    = require('./lib/include-collection'),
    overrideGenerator    = require('./lib/override-generator'),
    test                 = require('./lib/test');

/**
 * Create a lexical scope that uses the given parent collection.
 * Primarily to avoid exposing the `parentCollection` as a parameter of the returned `webpackMultiConfigurator()`.
 * @param {object} [parentCollection] An optional definition collection to inherit
 * @returns {function():{create:function,define:function,include:function,exclude:function,otherwise:function,
 * resolve:function}}
 */
function factory(parentCollection) {
  return webpackMultiConfigurator;

  /**
   * Create an instance.
   * The `options` are typically the default values.
   * The `factoryFn` is used to create instances of `webpack-configurator` where requested.
   * The `mergeFn` is used to merge options with defaults whenever `create()` is called.
   * @param {object} [options] An optional hash of options
   * @param {function} [factoryFn] An optional factory function that creates a webpack-configurator instance
   * @param {function} [mergeFn] An optional function that merges options
   * @returns {{create:function,define:function,include:function,exclude:function,otherwise:function,resolve:function}}
   */
  function webpackMultiConfigurator(options, factoryFn, mergeFn) {

    // ensure options
    options = (typeof options === 'object') && options || {};

    // ensure factory function
    if (typeof factoryFn !== 'function') {
      factoryFn = defaultFactoryFn;
    }
    // on the top-level instance any given factoryFn must inherit the default
    else if (!parentCollection) {
      factoryFn = overrideGenerator(factoryFn, defaultFactoryFn);
    }

    // ensure merge function
    mergeFn = (typeof mergeFn === 'function') && mergeFn || defaultMerge;

    // start with the include API
    var instance = includeCollection();

    // create a definition collection that extends the parent and can include the instance API
    var definitions = definitionCollection(instance, options, factoryFn, parentCollection);

    // extend the instance API
    //  mutation ensures both collections get the changes
    assign(instance, {
      create : create,
      define : definitions.get,
      resolve: resolve
    });

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
      var flatArgs          = flatten(Array.prototype.slice.call(arguments)),
          optionOverrides   = flatArgs.filter(test.isObject),
          factoryFnOverride = flatArgs.filter(test.isFunction).pop(),
          optionsCopy       = merge({}, options),
          mergedOptions     = mergeFn.apply(null, [optionsCopy].concat(optionOverrides));

      // override the factory function but bind the existing factory function as an argument
      if (factoryFnOverride) {
        factoryFn = overrideGenerator(factoryFnOverride, factoryFn);
      }

      // return a new instance and recreate definitions
      return factory(definitions)(mergedOptions, factoryFn, mergeFn);
    }

    /**
     * Chain together definitions to produce one configuration for each item marked as included.
     * If no items have been included then use the default list marked by `otherwise`.
     * @returns {Array.<object>}
     */
    function resolve() {
      return flatten(instance.list().map(definitions.resolve));
    }
  }
}

module.exports = factory();

function defaultFactoryFn() {
  return new Configurator();
}