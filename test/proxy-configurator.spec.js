'use strict';

var proxyConfigurator = require('../lib/proxy-configurator');

describe('proxy-configurator', function () {
  var template, attach, sut;

  beforeEach(function () {
    template = {
      a: 1,
      b: '2',
      c: true,
      d: jasmine.createSpy('template.d').and.returnValue('d'),
      e: jasmine.createSpy('template.e').and.returnValue('e')
    };
    sut = proxyConfigurator(template);
  });

  beforeEach(function () {
    attach = jasmine.createSpy().and.returnValue('attach');
  });

  it('should proxy only function', function () {
    expect(sut(attach)).toEqual(jasmine.objectContaining({
      d: jasmine.any(Function),
      e: jasmine.any(Function)
    }));
  });

  it('should call the attach method when each proxy is invoked', function () {
    expect(attach.calls.count()).toBe(0);

    expect(sut(attach).d()).toBe('attach');
    expect(attach.calls.count()).toBe(1);
    expect(attach.calls.argsFor(0)).toEqual([jasmine.any(Function)]);

    expect(sut(attach).e()).toBe('attach');
    expect(attach.calls.count()).toBe(2);
    expect(attach.calls.argsFor(1)).toEqual([jasmine.any(Function)]);
  });

  describe('invocation', function () {
    var configurator;

    beforeEach(function() {
      configurator = {
        d: jasmine.createSpy('configurator.d'),
        e: jasmine.createSpy('configurator.e')
      };
    });

    it('should throw were a configurator is not present', function () {
      sut(attach).d();
      expect(attach.calls.argsFor(0)[0]).toThrow();
    });

    it('should invoke the underlying method', function () {
      expect(configurator.d).not.toHaveBeenCalled();
      sut(attach).d(1, 2, 3);
      attach.calls.argsFor(0)[0](configurator);
      expect(configurator.d).toHaveBeenCalledWith(1, 2, 3);

      expect(configurator.e).not.toHaveBeenCalled();
      sut(attach).e(4, 5, 6);
      attach.calls.argsFor(1)[0](configurator);
      expect(configurator.e).toHaveBeenCalledWith(4, 5, 6);
    });

    it('should not invoke the template method', function () {
      sut(attach).d(1, 2, 3);
      attach.calls.argsFor(0)[0](configurator);
      expect(template.d).not.toHaveBeenCalled();

      expect(configurator.e).not.toHaveBeenCalled();
      sut(attach).e(4, 5, 6);
      attach.calls.argsFor(1)[0](configurator);
      expect(template.e).not.toHaveBeenCalled();
    });
  });
});