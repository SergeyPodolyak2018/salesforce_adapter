define([
  'bluebird',
  'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('Salesforce', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    before(injector.run([
      'events/crmEvents'
    ], function(crmEvents) {
      crmEvents.startListening();
    }));

    var crm;
    beforeEach(injector.run([
      'crm/crm'
    ], function(_crm) {
      crm = _crm;
    }));


    describe('initEvents', function() {


      it('interaction::SCREEN_POP event should trigger onInteractionScreenPop', injector.run([
        'events/globalEvent',
        'interactions/interactions'
      ], function(globalEvent, interactions) {
        sandbox.stub(crm, 'onInteractionScreenPop');
        var interaction = interactions.create(new Backbone.Model({some: 'interaction'}));
        globalEvent.INTERACTION_SCREEN_POP.dispatch(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(crm.onInteractionScreenPop, interaction);
      }));


      it('interaction::ADDED event should trigger onInteractionAdded', injector.run([
        'events/globalEvent'
      ], function(globalEvent) {
        sandbox.stub(crm, 'onInteractionAdded');
        var ixn = {some: 'interaction'};
        globalEvent.INTERACTION_ADDED.dispatch(ixn);

        assert.sinonAlwaysCalledOnceWithExactly(crm.onInteractionAdded, {some: 'interaction'});
      }));


      it('interaction::REMOVED event should trigger onInteractionCanceled', injector.run([
        'events/globalEvent',
        'interactions/interactions'
      ], function(globalEvent, interactions) {
        sandbox.stub(crm, 'onInteractionCanceled');
        var interaction = interactions.create(new Backbone.Model({some: 'interaction'}));
        globalEvent.INTERACTION_CANCELED.dispatch(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(crm.onInteractionCanceled, interaction);
      }));


      it('interaction::MARK_DONE event should trigger onMarkDone', injector.run([
        'events/globalEvent',
        'interactions/interactions'
      ], function(globalEvent, interactions) {
        sandbox.stub(crm, 'onMarkDone');
        var interaction = interactions.create(new Backbone.Model({some: 'interaction'}));
        globalEvent.INTERACTION_MARK_DONE.dispatch(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(crm.onMarkDone, interaction);
      }));
      
      it('interaction::SENT event - reply', injector.run([
        'events/globalEvent',
        'interactions/interactions'
      ], function(globalEvent, interactions) {
        sandbox.stub(crm, 'onMarkDone');
        var address = 'addressVal';
        var interaction = interactions.create(new Backbone.Model({media: new Backbone.Model({name: 'email'}), 
                                                                  parentInteraction: new Backbone.Model({fromAddress: address}),
                                                                  toAddresses: [address]}));
        globalEvent.INTERACTION_SENT.dispatch(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(crm.onMarkDone, interaction);
      }));
      it('interaction::SENT event - not reply', injector.run([
        'events/globalEvent',
        'interactions/interactions'
      ], function(globalEvent, interactions) {
        sandbox.stub(crm, 'onMarkDone');
        var address = 'addressVal';
        var interaction = interactions.create(new Backbone.Model({media: new Backbone.Model({name: 'email'}), 
                                                                  parentInteraction: new Backbone.Model({fromAddress: address}),
                                                                  toAddresses: []}));
        globalEvent.INTERACTION_SENT.dispatch(interaction);
      
        assert.isFalse(crm.onMarkDone.called);
      }));


    });


  });
});
