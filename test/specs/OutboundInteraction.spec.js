define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('OutboundInteraction', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });


    describe('OutboundInteraction::getTitle', function() {

      it('OutboundInteraction::getTitle minimal title is Outbound', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {
        var outboundInteraction = new OutboundInteraction(new Backbone.Model({notAHtccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(outboundInteraction.getTitle(), 'Outbound');
      }));


      it('OutboundInteraction::getTitle should rely on htccInteractionId if it is present', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {
        var outboundInteraction = new OutboundInteraction(new Backbone.Model({htccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(outboundInteraction.getTitle(), 'Outbound HTCC_INTERACTION_ID');
      }));

    });

    describe('OutboundInteraction::isDone', function() {

      it('OutboundInteraction::isDone should always return false so far', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {

        var outboundInteraction = new OutboundInteraction(new Backbone.Model({state: 'NOT_COMPLETED'}));
        assert.isFalse(outboundInteraction.isDone());
      }));

    });
    
    describe('OutboundInteraction::shouldActivityBeCreated', function() {

      it('OutboundInteraction::shouldActivityBeCreated should return true by default', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {

        var outboundInteraction = new OutboundInteraction(new Backbone.Model({state: 'NOT_COMPLETED'}));
        assert(outboundInteraction.shouldActivityBeCreated());
      }));
      
      
      it('OutboundInteraction::shouldActivityBeCreated should return false if interaction is monitored by the current user', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {

        var outboundInteraction = new OutboundInteraction(new Backbone.Model({state: 'NOT_COMPLETED'}));
        sandbox.stub(OutboundInteraction.prototype, 'isMonitoredByMe');
        OutboundInteraction.prototype.isMonitoredByMe.returns(true);

        assert.isFalse(outboundInteraction.shouldActivityBeCreated());
      }));

    });

    describe('OutboundInteraction::shouldScreenPopAt', function() {

      it('OutboundInteraction::shouldScreenPopAt should return false if eventName is not equal to INTERACTION_ADDED', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {

        var voiceInteraction = new OutboundInteraction({state: 'whatever'});
        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
      }));

      it('OutboundInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_ADDED', injector.run([
        'interactions/OutboundInteraction'
      ], function(OutboundInteraction) {

        var voiceInteraction = new OutboundInteraction({state: 'whatever'});
        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_ADDED'));
      }));

    });


  });
});
