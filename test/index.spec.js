'use strict';

var Config = require('webpack-configurator');

var webpackMultiConfigurator = require('../index'),
    fakeConfigurator         = require('./fake-configurator');

describe('webpack-multi-configurator', function () {
  var options = {a: 1};
  var generator;

  function getGenerator(id) {
    return jasmine.createSpy(id, function (factory, options) {
        factory(options);
        return fakeConfigurator();
      })
      .and.callThrough();
  }

  beforeEach(function () {
    generator = getGenerator('generator1');
  });

  describe('omitted generator function', function () {
    var sut, operation;

    beforeEach(function () {
      operation = jasmine.createSpy('operation')
        .and.returnValue(fakeConfigurator('operation'));

      sut = webpackMultiConfigurator(options)
        .define('foo').append(operation)
        .include('foo');
    });

    it('should call the default generator', function () {
      sut.resolve();
      expect(operation).toHaveBeenCalledWith(jasmine.any(Config), options);
    });
  });

  describe('explicit generator function', function () {
    var sut;

    beforeEach(function () {
      sut = webpackMultiConfigurator(options, generator)
        .define('foo')
        .include('foo');
    });

    it('should be called with the default generator and options hash', function () {
      sut.resolve();
      expect(generator).toHaveBeenCalledWith(jasmine.any(Function), options);
    });
  });

  describe('overridden generator function', function () {
    var sut, generator1;

    beforeEach(function () {
      generator1 = generator;
      sut = webpackMultiConfigurator(options, generator1)
        .define('foo')
        .include('foo');
    });

    it('should be called with the previous generator and options hash', function () {
      var generator2 = getGenerator('generator2'),
          generator3 = getGenerator('generator3'),
          options2   = {b: 2},
          options3   = {b: 3, c: 3},
          optionsN   = {a: 1, b: 3, c: 3};
      sut
        .create(generator2, options2)
        .create(generator3, options3)
        .include('foo')
        .resolve();

      [generator3, generator2, generator1].forEach(function (generator) {
        expect(generator).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining(optionsN));
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