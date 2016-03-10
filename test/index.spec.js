'use strict';

var webpackMultiConfigurator = require('../index'),
    fakeConfigurator         = require('./fake-configurator');

describe('webpack-multi-configurator', function () {
  var options = {a: 1};
  var generator, sut;

  function getGenerator(id) {
    return jasmine.createSpy(id, function (factory, options) {
        factory(options);
        return fakeConfigurator();
      })
      .and.callThrough();
  }

  beforeEach(function () {
    generator = getGenerator('generator1');
    sut = webpackMultiConfigurator(options, generator)
      .define('foo')
      .include('foo');
  });

  describe('explicit generator function', function () {

    it('should be called with the default generator and options hash', function () {
      sut.resolve();
      expect(generator).toHaveBeenCalledWith(jasmine.any(Function), options);
    });
  });

  describe('overridden generator function', function () {

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

      expect(generator3).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining(optionsN));
      expect(generator2).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining(optionsN));
    });
  });

});