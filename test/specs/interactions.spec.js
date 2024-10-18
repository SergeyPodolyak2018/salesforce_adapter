define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('interactions', function() {
    var injector = new Squire();

    beforeEach(function() {
      injector.mock('interactions/VoiceInteraction', sandbox.spy());
      injector.mock('interactions/ChatInteraction', sandbox.spy());
      injector.mock('interactions/EmailInteraction', sandbox.spy());
      injector.mock('interactions/OutboundInteraction', sandbox.spy());
      injector.mock('interactions/PushPreviewInteraction', sandbox.spy());
      injector.mock('interactions/OpenmediaInteraction', sandbox.spy());
    });


    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });


    describe('interactions.create', function() {

      it('interaction.create returns false for missing media', injector.run([
        'interactions/interactions'
      ], function(interactions) {
        var interaction = interactions.create(new Backbone.Model({}));

        assert.isFalse(interaction);
      }));

      it('interaction.create instantiates VoiceInteraction if media = "voice"', injector.run([
        'interactions/interactions',
        'interactions/VoiceInteraction'
      ], function (interactions, VoiceInteractionStub) {
        var originalInteraction = new Backbone.Model({media: new Backbone.Model({name: 'voice'})});
        interactions.create(originalInteraction);

        assert.sinonAlwaysCalledOnceWithExactly(VoiceInteractionStub, originalInteraction);

        assert.isTrue(VoiceInteractionStub.calledWithNew());
      }));

      it('interaction.create instantiates ChatInteraction if media = "chat"', injector.run([
        'interactions/interactions',
        'interactions/ChatInteraction'
      ], function(interactions, ChatInteractionStub) {
        var originalInteraction = new Backbone.Model({media: new Backbone.Model({name: 'chat'})});
        interactions.create(originalInteraction);

        assert.sinonAlwaysCalledOnceWithExactly(ChatInteractionStub, originalInteraction);

        assert.isTrue(ChatInteractionStub.calledWithNew());
      }));

      it('interaction.create instantiates EmailInteraction if media = "email"', injector.run([
        'interactions/interactions',
        'interactions/EmailInteraction'
      ], function(interactions, EmailInteractionStub) {
        var originalInteraction = new Backbone.Model({media: new Backbone.Model({name: 'email'})});
        interactions.create(originalInteraction);

        assert.sinonAlwaysCalledOnceWithExactly(EmailInteractionStub, originalInteraction);

        assert.isTrue(EmailInteractionStub.calledWithNew());
      }));

      it('interaction.create instantiates OutboundInteraction if no media but htccOutbound is present', injector.run([
        'interactions/interactions',
        'interactions/OutboundInteraction'
      ], function(interactions, OutboundInteractionStub) {
        var originalInteraction = new Backbone.Model({htccOutbound: 'HAS_HTCC_OUTBOUND'});
        interactions.create(originalInteraction);

        assert.sinonAlwaysCalledOnceWithExactly(OutboundInteractionStub, originalInteraction);
        assert.isTrue(OutboundInteractionStub.calledWithNew());
      }));

      it('interaction.create instantiates PushPreviewInteractionStub if media is ', injector.run([
        'interactions/interactions',
        'interactions/PushPreviewInteraction'
      ], function(interactions, PushPreviewInteractionStub) {
          var originalInteraction = new Backbone.Model({media: new Backbone.Model({name: 'outboundpreview'})});
          interactions.create(originalInteraction);

        assert.sinonCalledWithExactly(PushPreviewInteractionStub, originalInteraction);
        assert.isTrue(PushPreviewInteractionStub.calledWithNew());
      }));
      
      it('interaction.create instantiates PushPreviewInteractionStub if media is ', injector.run([
         'interactions/interactions',
         'interactions/OpenmediaInteraction'
       ], function(interactions, OpenmediaInteractionStub) {
         var originalInteraction = new Backbone.Model({media: new Backbone.Model(), htccInteraction: {mediatype: 'Inbound'}});
         interactions.create(originalInteraction);
    
         assert.sinonCalledWithExactly(OpenmediaInteractionStub, originalInteraction);
         assert.isTrue(OpenmediaInteractionStub.calledWithNew());
       }));


      it('interaction.create returns false for unknown media', injector.run([
        'interactions/interactions'
      ], function(interactions) {
        var interaction = interactions.create(new Backbone.Model({
          media: new Backbone.Model({name: 'exoticMedia'})
        }));

        assert.isFalse(interaction);
      }));



    });


  });
});
