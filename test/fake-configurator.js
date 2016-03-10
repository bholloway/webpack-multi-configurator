'use strict';

function fakeConfigurator(id) {
  return ['merge', 'loader', 'removeLoader', 'plugin', 'removePlugin', 'resolve']
    .reduce(fakeProp, {_id: id});

  function fakeProp(object, key) {
    object[key] = noop;
    return object;
  }
}

module.exports = fakeConfigurator;

function noop() {
}