'use strict';

module.exports = {
  isObject             : isObject,
  isFunction           : isFunction,
  isStringOrFunction   : isStringOrFunction,
  isAlphanumericString : isAlphanumericString,
  isFirstOccurrence    : isFirstOccurrence,
  isWebpackConfigurator: isWebpackConfigurator
};

function isObject(value) {
  return !!value && (typeof value === 'object');
}

function isFunction(value) {
  return (typeof value === 'function');
}

function isStringOrFunction(value) {
  return (typeof value === 'function') || isAlphanumericString(value);
}

function isAlphanumericString(value) {
  return (typeof value === 'string') && /^[a-zA-Z0-9]+$/.test(value);
}

function isFirstOccurrence(value, i, array) {
  return (array.indexOf(value) === i);
}

function isWebpackConfigurator(value) {
  return !!value && (typeof value === 'object') &&
    ['merge', 'loader', 'removeLoader', 'plugin', 'removePlugin', 'resolve'].map(getField).every(isFunction);

  function getField(key) {
    return value[key];
  }
}