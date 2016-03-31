'use strict';

var definitionCollection = require('../lib/definition-collection'),
    fakeConfigurator     = require('./fake-configurator');

const DEFAULT_NAME = 'foo',
      BAD_NAMES    = ['_123', 'abc_123', 'abc+', '', 123, true, undefined];

describe('definition-collection', function () {
  var owner, options, factory, parent, sut;

  beforeEach(function defaults() {
    owner = {
      ownerMethod: noop,
      ownerProp  : 5
    };
    options = {};
    factory = noop;
    parent = undefined;
  });

  describe('invocation', function () {

    it('should error when invoked without owner', function () {
      expect(invoke()).toThrow();
    });

    it('should error when invoked without options', function () {
      expect(invoke({})).toThrow();
    });

    it('should error when invoked without factory', function () {
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

    it('should copy the members of any given parent', function () {
      var parent = {'a': [1, 2, 3]},
          sut    = invoke({}, {}, noop, parent)(),
          value  = sut.valueOf();

      expect(Object.keys(value)).toEqual(['a']);
      expect(value.a).toEqual(parent.a);
      expect(value.a).not.toBe(parent.a);
    });
  });

  describe('get()', function () {

    function get(name) {
      return function () {
        sut = invoke(owner, options, factory, parent)();
        return sut.get(name);
      };
    }

    describe('permits only alphanumeric name', function () {
      BAD_NAMES.forEach(function (name) {
        it('should throw for ' + JSON.stringify(name), function () {
          expect(get(name)).toThrow();
        });
      });
    });

    describe('return value', function () {
      var definition;

      function value() {
        return sut.valueOf()[DEFAULT_NAME];
      }

      beforeEach(function () {
        definition = get(DEFAULT_NAME)();
      });

      const METHODS = ['clear', 'generate', 'prepend', 'append', 'splice'];

      it('should contain methods ' + METHODS.join(', '), function () {
        METHODS.forEach(function (name) {
          expect(definition[name]).toEqual(jasmine.any(Function));
        });
      });

      it('should contain the owner\'s enumerable members', function () {
        Object.keys(owner)
          .forEach(function (name) {
            expect(definition[name]).toBe(owner[name]);
          });
      });

      it('should contain proxied members of a default configurator instance', function () {
        var configurator = fakeConfigurator('example');
        options = {};
        factory = jasmine.createSpy('factoryFn').and.returnValue(configurator);
        definition = get(DEFAULT_NAME)();

        expect(factory).toHaveBeenCalledWith(options);

        ['merge', 'loader', 'removeLoader', 'plugin', 'removePlugin']
          .forEach(function (name) {
            expect(definition[name]).toEqual(jasmine.any(Function));
            definition[name](1,2,3);
            sut.resolve(DEFAULT_NAME);
            expect(configurator[name]).toHaveBeenCalledWith(1, 2, 3);
          });
      });

      describe('generate()', function () {
        var factory;

        beforeEach(function () {
          factory = jasmine.createSpy('factory');
        });

        it('should allow only functions or omitted arguments', function () {
          [123, 'abc', {}, true].forEach(function (value) {
            expect(() => definition.generate(value)).toThrowError();
          });
          expect(() => definition.generate(function () {
          })).not.toThrowError();
          expect(() => definition.generate()).not.toThrowError();
        });

        it('should install the supplied factory', function () {
          definition.generate(factory);
          value()[0]();
          expect(factory).toHaveBeenCalled();
        });

        it('should be chainable', function () {
          expect(definition.generate(factory)).toBe(definition);
        });
      });

      describe('clear()', function () {

        it('should clear any existing operations and custom factory', function () {
          var factory = jasmine.createSpy('factory');

          // setup
          definition.generate(factory);
          definition.append(['a', 'b', 'c']);
          expect(factory).not.toHaveBeenCalled();
          value()[0]();
          expect(factory).toHaveBeenCalled();
          expect(value().slice(1)).toEqual(['a', 'b', 'c']);

          // clear
          definition.clear();
          expect(value()).toEqual([null]);
        });

        it('should be chainable', function () {
          expect(definition.clear()).toBe(definition);
        });
      });

      describe('prepend()', function () {

        beforeEach(function () {
          definition.append(['a', 'b']);
        });

        it('should allow only names or functions', function () {
          BAD_NAMES.forEach(function (value) {
            expect(() => definition.generate(value)).toThrowError();
          });
        });

        it('should place elements to the beginning of the list', function () {
          definition.prepend(['x', 'y']);
          expect(value().slice(1)).toEqual(['x', 'y', 'a', 'b']);
        });

        it('should place elements in reverse order of function call', function () {
          definition.prepend('x');
          definition.prepend('y');
          expect(value().slice(1)).toEqual(['y', 'x', 'a', 'b']);
        });

        it('should be chainable', function () {
          expect(definition.prepend('a')).toBe(definition);
        });
      });

      describe('append()', function () {

        beforeEach(function () {
          definition.append(['a', 'b']);
        });

        it('should allow only names or functions', function () {
          BAD_NAMES.forEach(function (value) {
            expect(() => definition.append(value)).toThrowError();
          });
        });

        it('should place elements to the end of the list', function () {
          definition.append(['x', 'y']);
          expect(value().slice(1)).toEqual(['a', 'b', 'x', 'y']);
        });

        it('should place elements in order of function call', function () {
          definition.append('x');
          definition.append('y');
          expect(value().slice(1)).toEqual(['a', 'b', 'x', 'y']);
        });

        it('should be chainable', function () {
          expect(definition.append('a')).toBe(definition);
        });
      });

      describe('splice()', function () {

        beforeEach(function () {
          definition.append(['a', 'b', 'c']);
        });

        it('should allow only names or functions', function () {
          BAD_NAMES.forEach(function (value) {
            expect(() => definition.splice(0, 0, value)).toThrowError();
          });
        });

        it('should throw for out of bounds index', function () {
          expect(definition.splice.bind(null, -1)).toThrowError();
          expect(definition.splice.bind(null, +3)).toThrowError();
        });

        it('should splice at the given index', function () {
          expect(value().slice(1)).toEqual(['a', 'b', 'c']);
          definition.splice(0);
          expect(value()).toEqual([null]);
        });

        it('should splice the given delete-count', function () {
          expect(value().slice(1)).toEqual(['a', 'b', 'c']);
          definition.splice(1, 1);
          expect(value().slice(1)).toEqual(['a', 'c']);
        });

        it('should be chainable', function () {
          expect(definition.splice(0)).toBe(definition);
        });
      });

    });

  });

  describe('resolve()', function () {
    var parent, sut;
    var sequence, inputs;

    function multipleFactory(count) {
      return function () {
        return (new Array(count)).join(' ').split(' ').map(fakeConfigurator);
      };
    }

    function getSpy(id, isExplicitReturn, returnValue) {
      return jasmine.createSpy(id, function () {
          var idOrObjects = Array.prototype.slice.call(arguments)
            .map(function (candidate) {
              return candidate._id || candidate;
            });
          sequence.push(id);
          inputs.push(idOrObjects);
          return isExplicitReturn ? returnValue : fakeConfigurator(id);
        })
        .and.callThrough();
    }

    beforeEach(function resetSequence() {
      sequence = [];
      inputs = [];
    });

    beforeEach(function createSUT() {
      parent = {
        common       : [getSpy('common.G'), getSpy('common.0'), getSpy('common.1')],
        dependent    : [getSpy('dependent.G'), getSpy('dependent.0'), 'common', getSpy('dependent.2')],
        multiple     : [multipleFactory(3), getSpy('multiple.0'), 'common'],
        badFactory   : [noop],
        badDependency: [getSpy('badDependency.G'), 'baloney'],
        opNull       : [getSpy('opNull.G'), getSpy('opNull.0', true, null), getSpy('opNull.1')],
        opUndefined  : [getSpy('opUndefined.G'), getSpy('opUndefined.0', true, undefined), getSpy('opUndefined.1')],
        opNumber     : [getSpy('opNumber.G'), getSpy('opNumber.0', true, 123), getSpy('opNumber.1')],
        opTrue       : [getSpy('opTrue.G'), getSpy('opTrue.0', true, true), getSpy('opTrue.1')],
        opFalse      : [getSpy('opFalse.G'), getSpy('opFalse.0', true, false), getSpy('opFalse.1')],
        opObject     : [getSpy('opObject.G'), getSpy('opObject.0', true, {}), getSpy('opObject.1')],
        opFunction   : [getSpy('opFunction.G'), getSpy('opFunction.0', true, noop), getSpy('opFunction.1')]
      };
      sut = invoke(owner, options, factory, parent)();
    });

    describe('a common sequence', function () {

      beforeEach(function () {
        sut.resolve('common');
      });

      it('should execute in the expected order', function () {
        expect(sequence).toEqual(['common.G', 'common.0', 'common.1']);
      });

      it('should pass the configurator of the previous step and options', function () {
        expect(inputs).toEqual([[noop, options], ['common.G', options], ['common.0', options]]);
      });

      it('should have its factory invoked with options', function () {
        expect(parent.common[0]).toHaveBeenCalledWith(noop, options);
        expect(parent.dependent[0]).not.toHaveBeenCalled();
      });
    });

    describe('a dependent sequence', function () {

      beforeEach(function () {
        sut.resolve('dependent');
      });

      it('should execute in the expected order', function () {
        expect(sequence).toEqual(['dependent.G', 'dependent.0', 'common.0', 'common.1', 'dependent.2']);
      });

      it('should pass the configurator of the previous step and options', function () {
        expect(inputs).toEqual([[noop, options], ['dependent.G', options], ['dependent.0', options],
          ['common.0', options], ['common.1', options]]);
      });

      it('should have its factory invoked with options', function () {
        expect(parent.common[0]).not.toHaveBeenCalled();
        expect(parent.dependent[0]).toHaveBeenCalledWith(noop, options);
      });
    });

    describe('an unknown sequence', function () {

      it('should throw', function () {
        expect(() => sut.resolve('unknown')).toThrowError();
      });
    });

    describe('a sequence with defective factory', function () {

      it('should throw', function () {
        expect(() => sut.resolve('badFactory')).toThrowError();
      });
    });

    describe('a sequence with an unknown dependency', function () {

      it('should throw', function () {
        expect(() => sut.resolve('badDependency')).toThrowError();
      });
    });

    describe('a sequence with a bad operator', function () {
      ['opNull', 'opTrue', 'opFalse', 'opObject', 'opFunction'].forEach(function (name) {
        it('should throw for value ' + name.slice(2).toLowerCase(), function () {
          expect(() => sut.resolve(name)).toThrowError();
        });
      });
    });

    describe('a sequence with an operator that returns nothing', function () {

      beforeEach(function () {
        sut.resolve('opUndefined');
      });

      it('should execute in the expected order', function () {
        expect(sequence).toEqual(['opUndefined.G', 'opUndefined.0', 'opUndefined.1']);
      });

      it('should pass the configurator of the previous step and options', function () {
        expect(inputs).toEqual([[noop, options], ['opUndefined.G', options], ['opUndefined.G', options]]);
      });
    });

    describe('a sequence with multiple generation', function () {

      beforeEach(function () {
        sut.resolve('multiple');
      });

      it('should multiply sequences', function () {
        expect(parent.multiple[1]).toHaveBeenCalledTimes(3);
        expect(parent.common[1]).toHaveBeenCalledTimes(3);
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