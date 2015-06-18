Package.describe({
  name: 'mattkrick:lolliclock',
  version: '0.2.0',
  // Brief, one-line summary of the package.
  summary: 'A material design timepicker based on clockpicker',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/mattkrick/lolliclock',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0.3.1');
  api.use(['stylus'], 'client');
  api.addFiles(['lolliclock.js','lolliclock.styl'],'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('mattkrick:lolliclock');
  api.addFiles('lolliclock-tests.js');
});
