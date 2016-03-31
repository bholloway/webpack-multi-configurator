'use strict';

/**
 * Create a method that proxies all the methods on the given configurator instance.
 * @param {object} template A webpack-configurator instance
 * @returns {function(function):object} A method that takes an attach method and calls it with each operation
 */
function proxyConfigurator(template) {

  // locate all methods of the template, regardless of how they are inherited
  var keys = [];
  if (!!template && (typeof template === 'object')) {
    for (var key in template) {

      // chose only functions with public names
      if (/^\w+$/.test(key) && (typeof template[key] === 'function')) {
        keys.push(key);
      }
    }
  }

  /**
   * Create a set of functions that, when called, wrap the corresponding webpack-configurator instance and call the
   * given attachment method.
   * @param {function(function):object} A method that cann add an operation
   */
  return function using(attach) {
    return keys.reduce(reduceKeys, {});

    function reduceKeys(reduced, key) {
      reduced[key] = attachOperation;
      return reduced;

      function attachOperation() {
        var args = Array.prototype.slice.call(arguments);
        return attach(operation);

        function operation(configurator) {
          return configurator[key].apply(configurator, args);
        }
      }
    }
  };
}

module.exports = proxyConfigurator;