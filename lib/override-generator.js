'use strict';

/**
 * Create a generator or factory function which invokes the newer implementation, passing the older one as an argument
 * @param {function} newFn The new function
 * @param {function} oldFn The old function that will be provided as the first argument when invoking the new
 * @returns {function(object)} A function that invokes the new function with the old function and the options object
 */
function overrideGenerator(newFn, oldFn) {
  return function callGenerator(options) {
    return newFn(oldFn, options);
  };
}

module.exports = overrideGenerator;