'use strict';

var assert = require('assert'),
    assign = require('lodash.assign');

var test              = require('./test'),
    overrideGenerator = require('./override-generator');

/**
 * Create a collection.
 * Note that the `generatorFn` must accept only the options hash.
 * @param {object} owner An object whose methods should mix-in
 * @param {object} options A set of options to use during `resolve()`
 * @param {function(object):Config} generatorFn Generator function that yields webpack-configurator instance
 * @param {{valueOf:function}} [parent] Optional parent collection to clone
 * @returns {{get: get, resolve: resolve, valueOf: valueOf}}
 */
function definitionCollection(owner, options, generatorFn, parent) {

  // validate arguments
  assert(test.isObject(owner), 'Owner is not optional');
  assert(test.isObject(options), 'Options are not optional');
  assert(test.isFunction(generatorFn), 'Generator function is not optional');

  // ensure definitions
  var definitions = !!parent && (typeof parent === 'object') && parent.valueOf() || {};

  return {
    get    : get,
    resolve: resolve,
    valueOf: valueOf
  };

  /**
   * Create or retrieve a configuration for the given name.
   * @param {string} name An alphanumeric named configuration
   * @returns {{generate: generate, prepend: prepend, append: append}}
   */
  function get(name) {

    // validate name
    assert(test.isAlphanumericString(name), 'Name "' + name + '" is not a simple alphanumeric string');

    // retrieve this item or create it
    var list = definitions[name] = definitions[name] || [generatorFn];

    // the element mixes-in the owner methods
    var element = assign({
      clear   : clear,
      generate: generate,
      prepend : prepend,
      append  : append,
      splice  : splice
    }, owner);
    return element;

    /**
     * Specify a function that generates configurator instances.
     * @param {function} fn A factory function for webpack-configurator
     * @returns {{generate: generate, prepend: prepend, append: append, splice: splice}} chainable
     */
    function generate(fn) {
      assert((typeof fn === 'function'), 'Generator must be a function');

      // the new generator function should be passed the old one
      list[0] = overrideGenerator(fn, generatorFn);

      // chainable
      return element;
    }

    /**
     * Clear all steps following the generator function.
     */
    function clear() {
      setOperations();

      // chainable
      return element;
    }

    /**
     * Add steps that immediately follow the generator function.
     * @param {string|function|Array<string|function>} nameOrFn A step to add or Array thereof
     * @returns {{generate: generate, prepend: prepend, append: append, splice: splice}} chainable
     */
    function prepend(nameOrFn) {
      var additional = [].concat(nameOrFn);
      assert(additional.every(test.isStringOrFunction), 'Values must be function or alphanumeric string');

      // ensure no repetition, mutate existing list
      var operations = additional.concat(list.slice(1))
        .filter(test.isFirstOccurrence);
      setOperations(operations);

      // chainable
      return element;
    }

    /**
     * Add steps following any originally there.
     * @param {string|function|Array<string|function>} nameOrFn A step to add or Array thereof
     * @returns {{generate: generate, prepend: prepend, append: append, splice: splice}} chainable
     */
    function append(nameOrFn) {
      var additional = [].concat(nameOrFn);
      assert(additional.every(test.isStringOrFunction), 'Values must be function or alphanumeric string');

      // ensure no repetition, mutate existing list
      var operations = list.slice(1).concat(additional)
        .filter(test.isFirstOccurrence);
      setOperations(operations);

      // chainable
      return element;
    }

    /**
     * Splice steps.
     * @param {number} index The index at which to splice
     * @param {number} [deleteCount] Optional number of elements to delete
     * @param {string|function|Array<string|function>} [nameOrFn] Optional step to add or Array thereof
     * @returns {{generate: generate, prepend: prepend, append: append, splice: splice}} chainable
     */
    function splice(index, deleteCount, nameOrFn) {
      var additional = [].concat(nameOrFn);

      assert((typeof index === 'number') && (index in list), 'Given index is out of bounds');
      assert(additional.every(test.isStringOrFunction), 'Values must be function or alphanumeric string');

      // ensure no repetition, mutate existing list
      list.splice.apply(list, [index, deleteCount].concat(additional));
      var operations = list
        .filter(test.isFirstOccurrence);
      setOperations(operations);

      // chainable
      return element;
    }

    function setOperations(operations) {
      var args = [1, list.length - 1].concat(operations || []);
      list.splice.apply(list, args);
    }
  }

  /**
   * Resolve the named configurator into an object suitable for webpack.
   * @param {string} name An alphanumeric named configuration
   * @returns {Array.<object>} Some number of webpack configuration objects.
   */
  function resolve(name) {
    return dereferenceAndApply(name)
      .map(resolveConfigurator);

    function dereferenceAndApply(key, configurator) {

      // validate name
      assert(test.isAlphanumericString(key), 'Name "' + key + '" is not a simple alphanumeric string');
      assert(key in definitions, 'Definition named "' + key + '" cannot be found');

      // retrieve this item
      var list       = definitions[key],
          factoryFn  = list[0],
          operations = list.slice(1);

      // existing configurator bypasses generation
      //  just apply operations to the single configurator
      if (configurator) {
        return eachConfigurator(configurator);
      }
      // call the generator to get the configurators
      //  then apply the operators to each configurator
      else {
        var configurators = [].concat(factoryFn(options));
        assert(configurators.every(test.isWebpackConfigurator),
          'Generator function must return webpack-configurator or Array thereof');

        return configurators
          .map(eachConfigurator);
      }

      function eachConfigurator(configurator) {
        return operations
          .reduce(reduceDefinitionElements, configurator);
      }

      function reduceDefinitionElements(configurator, element, i) {

        // dereference and recurse string elements
        if (typeof element === 'string') {
          return dereferenceAndApply(element, configurator);
        }
        // apply function elements
        else if (typeof element === 'function') {
          var returned = element(configurator, options),
              isValid  = (typeof returned === 'undefined') || test.isWebpackConfigurator(returned);

          // validate return value from calling the element
          assert(isValid, 'Definition named "' + element + '" (step ' + i + ') must return single ' +
            'webpack-configurator instance (by duck typing) or else return nothing');

          // use the input configurator where one is not returned
          return returned || configurator;
        }
      }
    }

    function resolveConfigurator(configurator) {
      return configurator.resolve();
    }
  }

  /**
   * Get a copy of the internal definitions object.
   * @returns {object}
   */
  function valueOf() {
    return Object.keys(definitions)
      .reduce(eachKey, {});

    function eachKey(reduced, key) {
      reduced[key] = definitions[key].slice();
      return reduced;
    }
  }
}

module.exports = definitionCollection;