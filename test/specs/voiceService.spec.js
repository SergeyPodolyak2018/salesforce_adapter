define([
  'backbone',
  'Squire'
], function (Backbone, Squire) {
  'use strict';

  describe('voiceService', function () {

    var injector = new Squire();

    var setDestinationStub = sinon.stub().returns('TARGET');

    injector.mock('external/genesys', {
      wwe: {
        agent: new Backbone.Model({
          mediaList: new Backbone.Collection([{
            name: 'voice'
          }])
        }),
        Main: {
          CustomContact: function () {
            this.setDestination = setDestinationStub;
          }
        },
        commandManager: {
            execute: sinon.stub()
        }
      }
    });

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('voiceService::isPresent', function () {

      it('voiceService::isPresent returns true if relevant media channel is found', injector.run([
        'voiceService'
      ], function (voiceService) {
        assert.isTrue(voiceService.isPresent());
      }));


    });

    describe('voiceService::dial', function () {

      it('voiceService::dial returns false if voice media channel is not enabled', injector.run([
        'voiceService'
      ], function (voiceService) {
        sandbox.stub(voiceService, 'isPresent').returns(false);

        assert.isFalse(voiceService.dial('ANY_NUMBER'));
      }));


      it('voiceService::dial invokes genesys.wwe.Main.commandManager execution', injector.run([
        'utils',
        'voiceService',
        'external/genesys'
      ], function (utils, voiceService, genesys) {

        sandbox.stub(utils, 'sanitizePhoneNumber');
        utils.sanitizePhoneNumber.withArgs('PHONE_NUMBER').returns('SANITIZED_PHONE_NUMBER');

        sandbox.stub(utils, 'preprocessPhoneNumber');
        utils.preprocessPhoneNumber.withArgs('SANITIZED_PHONE_NUMBER').returns('PREPROCESSED_PHONE_NUMBER');

        voiceService.dial('PHONE_NUMBER','test');

        // TODO (shabunc): get rid of sinon.match.any in favor of something stricter
        assert.sinonAlwaysCalledOnceWithExactly(genesys.wwe.commandManager.execute, 'MediaVoiceDial', {
          destination: 'PREPROCESSED_PHONE_NUMBER',
          media: 'voice',
          target: sinon.match.any,
          attachedData:{
              SF_Contact_Data:'test'
          }
        })
      }));


    });


    describe('voiceService::createTarget', function () {

      it('voiceService::createTarget invokes genesys.wwe.Main.CustomContact', injector.run([
        'utils',
        'voiceService'
      ], function (utils, voiceService) {

        voiceService.createTarget('PHONE_NUMBER');
        assert.sinonCalledOnceWithExactly(setDestinationStub, 'PHONE_NUMBER');
      }));


    });


  });
});
