'use strict';

var Config = require('webpack-configurator');

var webpackMultiConfigurator = require('../index'),
    fakeConfigurator         = require('./fake-configurator');

describe('webpack-multi-configurator', function () {
  var options = {a: 1};
  var factory;

  function getGenerator(id) {
    return jasmine.createSpy(id, function (factory, options) {
        factory(options);
        return fakeConfigurator();
      })
      .and.callThrough();
  }

  beforeEach(function () {
    factory = getGenerator('factory1');
  });

  describe('omitted factory function', function () {
    var sut, operation;

    beforeEach(function () {
      operation = jasmine.createSpy('operation')
        .and.returnValue(fakeConfigurator('operation'));

      sut = webpackMultiConfigurator(options)
        .define('foo').append(operation)
        .include('foo');
    });

    it('should call the default factory', function () {
      sut.resolve();
      expect(operation).toHaveBeenCalledWith(jasmine.any(Config), options);
    });
  });

  describe('explicit factory function', function () {
    var sut;

    beforeEach(function () {
      sut = webpackMultiConfigurator(options, factory)
        .define('foo')
        .include('foo');
    });

    it('should be called with the default factory and options hash', function () {
      sut.resolve();
      expect(factory).toHaveBeenCalledWith(jasmine.any(Function), options);
    });
  });

  describe('overridden factory function', function () {
    var sut, factory1;

    beforeEach(function () {
      factory1 = factory;
      sut = webpackMultiConfigurator(options, factory1)
        .define('foo')
        .include('foo');
    });

    it('should be called with the previous factory and options hash', function () {
      var factory2 = getGenerator('factory2'),
          factory3 = getGenerator('factory3'),
          options2   = {b: 2},
          options3   = {b: 3, c: 3},
          optionsN   = {a: 1, b: 3, c: 3};
      sut
        .create(factory2, options2)
        .create(factory3, options3)
        .include('foo')
        .resolve();

      [factory3, factory2, factory1].forEach(function (factory) {
        expect(factory).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining(optionsN));
      });
    });
  });

  describe('explicit merge function', function () {
    var mergeFn, options2;

    function getSut(options) {
      mergeFn = jasmine.createSpy()
        .and.returnValue({});

      options2 = {b: 2};

      return webpackMultiConfigurator(options, undefined, mergeFn)
        .create(options2)
        .define('foo')
        .include('foo');
    }

    describe('initialised with options', function () {

      it('should be called with initialisation hash then create hash', function () {
        getSut(options).resolve();
        expect(mergeFn).toHaveBeenCalledWith(jasmine.objectContaining(options), jasmine.objectContaining(options2));
      });
    });

    describe('NOT initialised with options', function () {

      it('should be called with empty hash then create hash', function () {
        getSut().resolve();
        expect(mergeFn).toHaveBeenCalledWith(jasmine.objectContaining({}), jasmine.objectContaining(options2));
      });
    });
  });
});