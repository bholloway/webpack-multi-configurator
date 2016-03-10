'use strict';

var merge = require('../lib/merge');

describe('merge', function () {

  describe('conventional key', function () {
    var sources;

    beforeEach(function () {
      sources = [
        {
          a: 1,
          b: '1',
          c: false,
          d: {
            x: 11,
            y: 12
          }
        }, {
          a: 2,
          b: '2',
          c: true,
          d: {
            x: 21,
            y: 22
          }
        }, {
          a: 3,
          b: '3',
          c: true,
          d: {}
        }, {
          a: '4',
          b: 4,
          c: false
        }, {
          a: '4',
          b: '4',
          c: 'true'
        }
      ];
    });

    describe('with initialisation', function () {

      it('should merge single value', function () {
        var result = merge(sources[0], sources[1]);
        expect(result).toEqual(jasmine.objectContaining(sources[1]));
      });

      it('should merge multiple values, left to right', function () {
        var result = merge(sources[0], sources[1], sources[2]);
        expect(result).toEqual(jasmine.objectContaining({
          a: 3,
          b: '3',
          c: true,
          d: {
            x: 21,
            y: 22
          }
        }));
      });

      it('should parse values to match the destination type', function () {
        var result = merge(sources[2], sources[3]);
        expect(result).toEqual(jasmine.objectContaining({
          a: 4,
          b: '4',
          c: false,
          d: sources[2].d
        }));
      });
    });

    describe('without initialisation', function () {

      it('should assign single value', function () {
        var result = merge({}, sources[1]);
        expect(result).toEqual(jasmine.objectContaining(sources[1]));
      });

      it('should merge multiple values, left to right', function () {
        var result = merge({}, sources[0], sources[1], sources[2]);
        expect(result).toEqual(jasmine.objectContaining({
          a: 3,
          b: '3',
          c: true,
          d: {
            x: 21,
            y: 22
          }
        }));
      });

      it('should parse values to match the preceding type', function () {
        var result = merge({}, sources[2], sources[3]);
        expect(result).toEqual(jasmine.objectContaining({
          a: 4,
          b: '4',
          c: false,
          d: sources[2].d
        }));
      });

      it('should NOT parse values', function () {
        var result = merge({}, sources[3]);
        expect(result).toEqual(jasmine.objectContaining(sources[3]));
      });

    });
  });

  describe('uppercase key', function () {
    var sources;

    beforeEach(function () {
      sources = [
        {
          aaBb: 1,
          ccDd: '1',
          eeFf: false,
          g   : {
            x: 11,
            y: '12'
          }
        }, {
          AA_BB: 2,
          CC_DD: '2',
          EE_FF: true,
          G__X : 21,
          G__Y : '22',
          G__Z : false
        }, {
          AA_BB: 3,
          CC_DD: '3',
          EE_FF: true,
          G__X : 31,
          G__Y : '32'
        }, {
          AA_BB: '4',
          CC_DD: '4',
          EE_FF: 'false',
          G__X : '41',
          G__Y : '42',
          G__Z : 'true'
        }
      ];
    });

    it('should NOT support object values', function () {
      expect(()=> merge(sources[0], {G:{}})).toThrowError();
    });

    describe('with initialisation', function () {

      it('should merge single value', function () {
        var result = merge(sources[0], sources[1]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 2,
          ccDd: '2',
          eeFf: true,
          g   : {
            x: 21,
            y: '22',
            z: false
          }
        }));
      });

      it('should merge multiple values, left to right', function () {
        var result = merge(sources[0], sources[1], sources[2]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 3,
          ccDd: '3',
          eeFf: true,
          g   : {
            x: 31,
            y: '32',
            z: false
          }
        }));
      });

      it('should parse values to match the destination type', function () {
        var result = merge(sources[0], sources[3]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 4,
          ccDd: '4',
          eeFf: false,
          g   : {
            x: 41,
            y: '42',
            z: 'true'
          }
        }));
      });
    });

    describe('without initialisation', function () {

      it('should merge single value', function () {
        var result = merge({}, sources[1]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 2,
          ccDd: '2',
          eeFf: true,
          g   : {
            x: 21,
            y: '22',
            z: false
          }
        }));
      });

      it('should merge multiple values, left to right', function () {
        var result = merge({}, sources[0], sources[1], sources[2]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 3,
          ccDd: '3',
          eeFf: true,
          g   : {
            x: 31,
            y: '32',
            z: false
          }
        }));
      });

      it('should NOT parse values that are NOT initialised', function () {
        var result = merge({}, sources[3]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: '4',
          ccDd: '4',
          eeFf: 'false',
          g   : {
            x: '41',
            y: '42',
            z: 'true'
          }
        }));
      });

      it('should parse values to match the preceding type', function () {
        var result = merge({}, sources[0], sources[3]);
        expect(result).toEqual(jasmine.objectContaining({
          aaBb: 4,
          ccDd: '4',
          eeFf: false,
          g   : {
            x: 41,
            y: '42',
            z: 'true'
          }
        }));
      });

    });
  });
});
