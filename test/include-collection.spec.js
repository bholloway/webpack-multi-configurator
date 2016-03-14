'use strict';

var includeCollection = require('../lib/include-collection');

describe('include-collection', function () {
  const ILLEGAL_NAMES = [123, true, ()=>undefined, {}, null],
        VALID_NAMES   = [
          'abc', 'ab&cd', 'ab+cd', 'ab%cd', 'ab,cd', 'ab_cd', '_abc', 'abc_',
          ['abc', 'ab&cd', 'ab+cd', 'ab%cd', 'ab,cd'],
          undefined
        ];

  var sut;

  beforeEach(function () {
    sut = includeCollection();
  });

  describe('include', function () {

    describe('accepts strings or Array thereof', function () {
      ILLEGAL_NAMES.forEach(function (value) {
        it('should throw for value ' + JSON.stringify(value), function () {
          expect(()=> sut.include(value)).toThrowError();
        });
      });

      VALID_NAMES.forEach(function (value) {
        it('should allow value ' + JSON.stringify(value), function () {
          expect(()=> sut.include(value)).not.toThrowError();
        });
      });
    });

    it('should add alphanumeric string to list', function () {
      sut.include('foo');
      expect(sut.list()).toEqual(['foo']);
    });

    it('should add alphanumeric Array.<string> to list', function () {
      sut.include(['foo', 'bar']);
      expect(sut.list()).toEqual(['foo', 'bar']);
    });

    describe('split on character +|_|&', function () {
      ['foo&bar', 'foo_bar', 'foo_bar'].forEach(function (value) {
        it('should split ' + JSON.stringify(value), function () {
          sut.include(value);
          expect(sut.list()).toEqual(['foo', 'bar']);
        });
      });
    });

    it('should include uniquely', function () {
      ['foo', 'bar', 'foo+bar+baz'].forEach((value)=>sut.include(value));
      expect(sut.list()).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('exclude', function () {

    beforeEach(function () {
      sut.include(['foo', 'bar']);
    });

    describe('accepts strings or Array thereof', function () {
      ILLEGAL_NAMES.forEach(function (value) {
        it('should throw for value ' + JSON.stringify(value), function () {
          expect(()=> sut.exclude(value)).toThrowError();
        });
      });

      VALID_NAMES.forEach(function (value) {
        it('should allow value ' + JSON.stringify(value), function () {
          expect(()=> sut.exclude(value)).not.toThrowError();
        });
      });
    });

    it('should remove alphanumeric string from list', function () {
      sut.exclude('foo');
      expect(sut.list()).toEqual(['bar']);
    });

    it('should remove alphanumeric Array.<string> from list', function () {
      sut.exclude(['foo', 'bar']);
      expect(sut.list()).toEqual([]);
    });

    describe('split on character +|_|&', function () {
      ['foo&bar', 'foo_bar', 'foo_bar'].forEach(function (value) {
        it('should split ' + JSON.stringify(value), function () {
          sut.exclude(value);
          expect(sut.list()).toEqual([]);
        });
      });
    });

    it('should exclude uniquely', function () {
      sut.include('baz');
      ['foo', 'bar', 'foo+bar'].forEach((value)=>sut.exclude(value));
      expect(sut.list()).toEqual(['baz']);
    });
  });

  describe('otherwise', function () {

    describe('accepts strings or Array thereof', function () {
      ILLEGAL_NAMES.forEach(function (value) {
        it('should throw for value ' + JSON.stringify(value), function () {
          expect(()=> sut.otherwise(value)).toThrowError();
        });
      });

      VALID_NAMES.forEach(function (value) {
        it('should allow value ' + JSON.stringify(value), function () {
          expect(()=> sut.otherwise(value)).not.toThrowError();
        });
      });
    });

    it('should add alphanumeric string to list', function () {
      sut.otherwise('foo');
      expect(sut.list()).toEqual(['foo']);
    });

    it('should add alphanumeric Array.<string> to list', function () {
      sut.otherwise(['foo', 'bar']);
      expect(sut.list()).toEqual(['foo', 'bar']);
    });

    describe('split on character +|_|&', function () {
      ['foo&bar', 'foo_bar', 'foo_bar'].forEach(function (value) {
        it('should split ' + JSON.stringify(value), function () {
          sut.otherwise(value);
          expect(sut.list()).toEqual(['foo', 'bar']);
        });
      });
    });

    it('should include uniquely', function () {
      ['foo', 'bar', 'foo+bar+baz'].forEach((value)=>sut.otherwise(value));
      expect(sut.list()).toEqual(['foo', 'bar', 'baz']);
    });

    it('should be absent if there are any includes', function () {
      sut.otherwise('foo');
      sut.include('bar');
      expect(sut.list()).toEqual(['bar']);
    });
  });

});