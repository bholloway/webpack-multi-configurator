'use strict';

var Jasmine      = require('jasmine'),
    SpecReporter = require('jasmine-spec-reporter'),
    figures      = require('figures');

var instance = new Jasmine();

/*jshint camelcase: false */
instance.loadConfig({
  spec_dir  : 'test',
  spec_files: [
    '**/*.spec.js'
  ],
  helpers   : [
    '**/*.helper.js'
  ]
});
/*jshint camelcase: true */

instance.addReporter(new SpecReporter({
  displayStacktrace     : 'all',
  displayFailuresSummary: true,
  displayPendingSummary : true,
  displaySuccessfulSpec : true,
  displayFailedSpec     : true,
  displayPendingSpec    : true,
  displaySpecDuration   : true,
  displaySuiteNumber    : true,
  colors                : {
    success: 'green',
    failure: 'red',
    pending: 'yellow'
  },
  prefixes              : {
    success: figures.tick + ' ',
    failure: figures.cross + ' ',
    pending: figures.circleDotted + ' '
  },
  customProcessors      : []
}));

instance.execute();