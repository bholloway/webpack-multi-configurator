'use strict';

function overrideGenerator(newFn, oldFn) {
  return function callGenerator(options) {
    return newFn(oldFn, options);
  };
}

module.exports = overrideGenerator;