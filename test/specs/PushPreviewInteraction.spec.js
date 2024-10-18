define([
    'backbone',
    'Squire'
  ], function(Backbone, Squire) {
    'use strict';
  
    describe('PushPreviewInteraction', function() {
      var injector = new Squire();
  
      var sandbox = sinon.sandbox.create();
      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });
  
      afterEach(function () {
        sandbox.restore();
      });
  
  
      describe('PushPreviewInteraction::getTitle', function() {
  
        it('PushPreviewInteraction::getTitle minimal title is Outbound', injector.run([
          'interactions/PushPreviewInteraction'
        ], function(PushPreviewInteraction) {
          var pushPreviewInteraction = new PushPreviewInteraction(new Backbone.Model({notAHtccInteractionId: 'HTCC_INTERACTION_ID'}));
          assert.equal(pushPreviewInteraction.getTitle(), 'Outbound');
        }));
  
  
        it('PushPreviewInteraction::getTitle should rely on htccInteractionId if it is present', injector.run([
          'interactions/PushPreviewInteraction'
        ], function(PushPreviewInteraction) {
          var pushPreviewInteraction = new PushPreviewInteraction(new Backbone.Model({htccInteractionId: 'HTCC_INTERACTION_ID'}));
          assert.equal(pushPreviewInteraction.getTitle(), 'Outbound HTCC_INTERACTION_ID');
        }));
  
      });
      
      it('PushPreviewInteraction::shouldActivityBeCreated should return false', injector.run([
         'interactions/PushPreviewInteraction'
       ], function(PushPreviewInteraction) {

         var voiceInteraction = new PushPreviewInteraction({state: 'whatever'});
         assert.isFalse(voiceInteraction.shouldActivityBeCreated());
       }));
      
      describe('PushPreviewInteraction::shouldScreenPopAt', function() {

          it('PushPreviewInteraction::shouldScreenPopAt should return false if eventName is not equal to INTERACTION_Dialing', injector.run([
            'interactions/PushPreviewInteraction'
          ], function(PushPreviewInteraction) {

            var voiceInteraction = new PushPreviewInteraction({state: 'whatever'});
            assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
          }));

          it('PushPreviewInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_DIALING', injector.run([
            'interactions/PushPreviewInteraction'
          ], function(PushPreviewInteraction) {

            var voiceInteraction = new PushPreviewInteraction({state: 'whatever'});
            assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_ACCEPTED'));
          }));

        });
  
    });
  });
  