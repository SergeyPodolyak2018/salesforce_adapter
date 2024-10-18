define([
  'bluebird',
  'backbone',
  'Squire',
  'version'
], function (Promise, Backbone, Squire, version) {
  'use strict';

  describe('logger', function () {

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('logger', function () {
      var injector = new Squire();

      injector.mock('external/genesys', {
        wwe: {
          createLogger: function(){}
        }
      });

      it('logger default logger just invokes console.log', injector.run([
        'crm-workspace/logger'
      ], function (logger) {
        sandbox.stub(console, 'log');
        logger.debug('MESSAGE');
        assert.sinonAlwaysCalledOnceWithExactly(console.log, '[DEBUG] [crm-workspace - '+version.version+']', 'MESSAGE');
      }));
    });


    describe('logger.switchToAPI', function () {
      var injector = new Squire();

      injector.mock('external/genesys', {
        wwe: {
          createLogger: function(){}
        }
      });

      it('logger.switchToAPI redefines logger', injector.run([
        'external/genesys',
        'crm-workspace/logger'
      ], function (genesys, logger) {
        sandbox.stub(genesys.wwe, 'createLogger');
        genesys.wwe.createLogger.withArgs('crm-workspace - '+version.version).returns('LOGGER');
        logger.switchToAPI();
        assert.equal(logger.logger, 'LOGGER');
      }));
    });


    describe('logger.debug', function () {
      var injector = new Squire();

      it('logger.debug applies logger.logger.debug', injector.run([
        'crm-workspace/logger'
      ], function (logger) {
        sandbox.stub(logger.logger.debug, 'apply');
        sandbox.stub(logger, 'serializeArguments');
        logger.serializeArguments.returns('SERIALIZED_PARAMS');

        logger.logger.debug.apply.withArgs(sinon.match.any, 'SERIALIZED_PARAMS').returns('DONE');
        assert.equal(logger.debug('MESSAGE'), 'DONE');
      }));


    });


    describe('logger.getMessages', function() {
      var injector = new Squire();

      it('logger.getMessages returns feedback logs', injector.run([
        'crm-workspace/logger'
      ], function(logger) {
        sandbox.stub(logger, 'getFeedbackLogs').returns([{log:'FA'}, {log: 'FB'}]);
        assert.deepEqual(logger.getMessages(), ['FA', 'FB']);
      }));


    });

    describe('logger.serializeArgument', function() {

      var injector = new Squire();

      it('logger.serializeArgument serializes objects, including null', injector.run([
        'logger'
      ], function(logger) {
        assert.deepEqual(logger.serializeArgument('string should remains string'), 'string should remains string');
        assert.deepEqual(logger.serializeArgument({x: 1, y: 2}), '{\n  "x": 1,\n  "y": 2\n}');
        assert.deepEqual(logger.serializeArgument(null), 'null');
        assert.deepEqual(logger.serializeArgument(0), 0);
        assert.deepEqual(logger.serializeArgument(5), 5);
        assert.isUndefined(logger.serializeArgument(undefined));
      }));

      it('logger.serializeArgument is JSON.stringify-failure-tolerant', injector.run([
        'logger'
      ], function(logger) {
        var a = {};
        a.selfReference = a;
        assert.isObject(logger.serializeArgument(a));
      }));

    });


    describe('logger.serializeArguments', function() {

      var injector = new Squire();

      it('logger.serializeArguments passes collection through map with logger.serializeArgument', injector.run([
        'logger'
      ], function(logger) {
        var loggerSerializeArgumentStub = sandbox.stub(logger, 'serializeArgument');
        loggerSerializeArgumentStub.withArgs(4).returns('FIVE'); // A-ha-ha, dirty lie!!! )))
        loggerSerializeArgumentStub.withArgs('string').returns('STRING');
        loggerSerializeArgumentStub.withArgs(null).returns('NULL');

        assert.deepEqual(logger.serializeArguments([4, 'string', null]), ['FIVE', 'STRING', 'NULL']);
      }));

    });



    describe('logger.getFeedbackLogs', function() {
      var injector = new Squire();
      injector.mock('external/genesys', {
        wwe: {
          Utils: {
            getFeedbackLogs: sandbox.stub().returns('WWE_FEEDBACK_LOGS')
          }
        }
      });


      it('logger.getFeedbackLogs invokes genesys.wwe.Utils.getFeedbackLogs call', injector.run([
        'logger'
      ], function(logger) {
        assert.equal(logger.getFeedbackLogs(), 'WWE_FEEDBACK_LOGS');
      }));

    });




  });
});
