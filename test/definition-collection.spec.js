'use strict';

var definitionCollection = require('../lib/definition-collection');

describe('definition-collection', function () {

  describe('invocation', function () {

    it('should error when invoked without owner', function () {
      expect(invoke()).toThrow();
    });

    it('should error when invoked without options', function () {
      expect(invoke({})).toThrow();
    });

    it('should error when invoked without generator', function () {
      expect(invoke({}, {})).toThrow();
    });

    it('should not error when invoked without parent', function () {
      expect(invoke({}, {}, noop)).not.toThrow();
    });

    it('should have empty value when invoked without parent', function () {
      var sut   = invoke({}, {}, noop)(),
          value = sut.valueOf();
      expect(Object.keys(value)).toEqual([]);
    });

    it('should copy the content of any given parent', function () {
      var parent = {'a': [1, 2, 3]},
          sut    = invoke({}, {}, noop, parent)(),
          value  = sut.valueOf();

      expect(Object.keys(value)).toEqual(['a']);
      expect(value.a).toEqual(parent.a);
      expect(value.a).not.toBe(parent.a);
    });
  });

  describe('get()', function () {
    const METHODS = ['clear', 'generate', 'prepend', 'append', 'splice'];
    var owner, sut;

    function get(name) {
      return function () {
        return invoke(owner, {}, noop)().get(name);
      };
    }

    beforeEach(function () {
      owner = {
        ownerMethod: noop,
        ownerProp  : 5
      };
    });

    describe('permits only alphanumeric name', function () {
      ['_123', 'abc_123', 'abc+', '', 123, true, undefined].forEach(function (name) {
        it('should throw for ' + JSON.stringify(name), function () {
          expect(get(name)).toThrow();
        });
      });
    });

    it('should contain methods ' + METHODS.join(', '), function () {
      sut = get('foo')();

      METHODS.forEach(function (name) {
        expect(sut[name]).toEqual(jasmine.any(Function));
      });
    });

    it('should contain the owner\'s enumerable members', function () {
      sut = get('foo')();

      Object.keys(owner)
        .forEach(function (name) {
          expect(sut[name]).toBe(owner[name]);
        });
    });
  });

});

function invoke() {
  var args = Array.prototype.slice.call(arguments);
  return function () {
    return definitionCollection.apply(null, args);
  };
}

function noop() {
}