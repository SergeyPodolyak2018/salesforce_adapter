(function(window) {
  "use strict";

  var karma = window.__karma__;

  // Put Karma into an asynchronous waiting mode until we have loaded our
  // tests.
  karma.loaded = function() {};

  if (window.chai) {
    sinon.assert.expose(chai.assert, { prefix: "sinon" });


    chai.assert.sinonCalledOnceWithExactly = function() {
      var args =  Array.prototype.slice.call(arguments);
      chai.assert.sinonCalledWithExactly.apply(chai.assert, args);

      var spy = args.shift();
      var spyWithRestriction = spy.withArgs.apply(spy, args);
      args.unshift(spyWithRestriction);

      chai.assert.sinonCalledOnce.apply(chai.assert, args);
    };

    chai.assert.sinonAlwaysCalledOnceWithExactly = function() {
      var args =  Array.prototype.slice.call(arguments);
      chai.assert.sinonAlwaysCalledWithExactly.apply(chai.assert, args);

      var spy = args.shift();
      var spyWithRestriction = spy.withArgs.apply(spy, args);
      args.unshift(spyWithRestriction);

      chai.assert.sinonCalledOnce.apply(chai.assert, args);
    };

    chai.assert.isImpossible = function() {
      chai.assert.isFalse(true, "Never supposed to be here");
    }
  }

  var DEST_PREFIX = "../../target/build/webapp/";

  var baseUrl = "/base/src/js";
  var libPath = "../../lib/";
  var staticPath = "../../src/static/";

  // Set the application endpoint and load the configuration.
  require.config({
    paths: {
      "helpers": libPath + "helpers",
      "backbone": libPath + "backbone/backbone",
      "bluebird": libPath + "bluebird/bluebird",
      "signals": libPath + "signals/signals",
      "Squire": libPath + "squire/src/Squire",
      "jade": staticPath + "js/lib/runtime",
      "underscore": libPath + "underscore/underscorejs",
      "lodash": libPath + "lodash-4.17.15/lodash",
      "crm-workspace/logger": "../../src/js/logger",
      "version": libPath + "version/version"

    },

    map: {
      '*': {
        jquery: 'helpers/noconflict'
      },
      'noconflict': {
        jquery: libPath + "jquery/dist/jquery"
      }
    },

    shim: {
      lodash: {
        exports: '_'
      },
      jquery: {
        exports: '$'
      }
    },

    baseUrl: baseUrl
  });

  require([
  ], function() {

    var specs = Object.keys(karma.files).filter(function(file) {
      return /^\/base\/test\/.*\.spec\.js$/.test(file);
    });

    window.genesys = {wwe: {}};
    window.sforce = {};

    // Load all specs and start Karma.
    require(specs, karma.start);
  });



})(this);
