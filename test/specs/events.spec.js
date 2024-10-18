define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('events', function() {

    var injector = new Squire();

    injector.mock('interactions/interactions', {
      create: function() {
        return {
          isDone: function() {return false},
          shouldScreenPopAt: function() {return false},
          shouldMarkDoneAt: function() {return false}
        }
      }
    });

    injector.mock('external/genesys', {
      wwe: {
        interactionManager: {
          get: function() {}
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

    describe('events::resolveEventNames', function() {

      it('events::resolveEventNames eventType always triggers eventType-related event', injector.run([
        'interactions/interactions',
        'events/events'
      ], function(interactions, events) {

        assert.deepEqual(events.resolveEventNames({eventType: 'PING'}, interactions.create()), ['INTERACTION_PING']);
        assert.deepEqual(events.resolveEventNames({eventType: 'PONG'}, interactions.create()), ['INTERACTION_PONG']);
        assert.deepEqual(events.resolveEventNames({eventType: 'ESTABLISHED'}, interactions.create()), ['INTERACTION_ESTABLISHED']);
      }));


      it('events::resolveEventNames eventType triggers SCREEN_POP when interaction says that is should screenPop', injector.run([
        'interactions/interactions',
        'events/events'
      ], function(interactions, events) {

        var interactionsCreateStub = sandbox.stub(interactions, 'create');
        var shouldScreenPopAtStub = sandbox.stub();
        shouldScreenPopAtStub.withArgs('INTERACTION_SOME_EVENT').returns(true);


        interactionsCreateStub.withArgs( {
          interaction: 'SHOULD_SCREEN_POP'
        }).returns({
          isDone: function() {return false},
          shouldScreenPopAt: shouldScreenPopAtStub,
          shouldMarkDoneAt: function() { return false },
          getUID: function() {return 'UID'}
        });

        var data = {eventType: 'SOME_EVENT', interaction: {interaction: 'SHOULD_SCREEN_POP'}};

        assert.deepEqual(events.resolveEventNames(data, interactions.create(data.interaction)), ['INTERACTION_SOME_EVENT', 'INTERACTION_SCREEN_POP']);
      }));


      it('events::resolveEventNames eventType does not trigger MARK_DONE when interaction says that it should markDone but activity creation is disabled', injector.run([
        'interactions/interactions',
        'events/events'
      ], function(interactions, events) {

        var interactionsCreateStub = sandbox.stub(interactions, 'create');
        var shouldMarkDoneAtStub = sandbox.stub();
        shouldMarkDoneAtStub.withArgs('INTERACTION_SOME_EVENT').returns(true);
        var shouldActivityBeCreatedStub = sandbox.stub();
        shouldActivityBeCreatedStub.returns(false);

        interactionsCreateStub.withArgs( {
          interaction: 'SHOULD_MARK_DONE'
        }).returns({
          isDone: function() {return false},
          shouldScreenPopAt: function() {return false},
          shouldMarkDoneAt: shouldMarkDoneAtStub,
          shouldActivityBeCreated: shouldActivityBeCreatedStub,
          getUID: function() {return 'UID'}
        });

        var data = {eventType: 'SOME_EVENT', interaction: {interaction: 'SHOULD_MARK_DONE'}};

        console.log(events.resolveEventNames(data, interactions.create(data.interaction)));
        assert.deepEqual(events.resolveEventNames(data, interactions.create(data.interaction)), ['INTERACTION_SOME_EVENT']);
      }));


      it('events::resolveEventNames eventType trigger INTERACTION_CANCELED when interaction says that is shouldn\'t markDone and screenpop.on-ringing=true',
        injector.run([
          'interactions/interactions',
          'events/events'
        ], function(interactions, events) {

          var interactionsCreateStub = sandbox.stub(interactions, 'create');
          var shouldMarkDoneAtStub = sandbox.stub();
          shouldMarkDoneAtStub.withArgs('REMOVED').returns(false);

          interactionsCreateStub.withArgs( {
            interaction: 'SHOULD_MARK_DONE'
          }).returns({
            isDone: function() {return false},
            shouldScreenPopAt: function() {return false},
            shouldMarkDoneAt: shouldMarkDoneAtStub,
            getUID: function() {return 'UID'}
          });

          var data = {eventType: 'REMOVED', interaction: {interaction: 'SHOULD_MARK_DONE'}};

          console.log(events.resolveEventNames(data, interactions.create(data.interaction)));
          assert.deepEqual(events.resolveEventNames(data, interactions.create(data.interaction)), ['INTERACTION_REMOVED', 'INTERACTION_CANCELED']);
        }));



      it('events::resolveEventNames eventType does not trigger INTERACTION_CANCELED when interaction says that is should markDone',
        injector.run([
          'interactions/interactions',
          'events/events'
        ], function(interactions, events) {

          var interactionsCreateStub = sandbox.stub(interactions, 'create');
          var shouldMarkDoneAtStub = sandbox.stub();
          shouldMarkDoneAtStub.withArgs().returns(true);

          interactionsCreateStub.withArgs( {
            interaction: 'SHOULD_MARK_DONE'
          }).returns({
            isDone: function() {return false},
            shouldScreenPopAt: function() {return false},
            shouldMarkDoneAt: shouldMarkDoneAtStub,
            getUID: function() {return 'UID'}
          });

          var data = {eventType: 'REMOVED', interaction: {interaction: 'SHOULD_MARK_DONE'}};

          console.log(events.resolveEventNames(data, interactions.create(data.interaction)));
          assert.deepEqual(events.resolveEventNames(data, interactions.create(data.interaction)), ['INTERACTION_REMOVED']);
        }));



    });


    describe('events::resolveAgentDesktopEvent', function() {

      it('events::resolveAgentDesktopEvent should do nothing if interaction is not resolved', injector.run([
        'interactions/interactions',
        'events/events'
      ], function(interactions, events) {
        sandbox.stub(interactions, 'create').returns(false);

        assert.isFalse(events.resolveAgentDesktopEvent({data:{interaction: 'UNRESOLVED'}}));
      }));

      it('events::resolveAgentDesktopEvent should pass events to globalEvent', injector.run([
        'events/globalEvent',
        'interactions/interactions',
        'events/events'
      ], function(globalEvent, interactions, events) {

        var resolveEventNamesStub = sandbox.stub(events, 'resolveEventNames');
        resolveEventNamesStub.returns(['ON_THE_ROAD', 'AGAIN']);

        sandbox.stub(globalEvent, 'trigger');
        sandbox.stub(interactions, 'create').returns({wrapped: 'interaction'});


        events.resolveAgentDesktopEvent({data: {interaction: {some: 'interaction'}, eventType: 'HERE_I_AM'}});

        assert.sinonCalledOnceWithExactly(globalEvent.trigger, 'ON_THE_ROAD', interactions.create({some: 'interaction'}));
        assert.sinonCalledOnceWithExactly(globalEvent.trigger, 'AGAIN', interactions.create({some: 'interaction'}));
      }));


    });


    describe('events::startListening', function() {

      it('events::startListening initiate monitoring of adding items to interactions collection', injector.run([
        'events/crmEvents',
        'events/crmErrors',
        'events/events',
        'external/genesys',
        'events/globalEvent'
      ], function(crmEvents, crmErrors, events, genesys, globalEvent) {

        console.log('====== ', JSON.stringify(globalEvent.SERVICE_INITIALIZED, null, 4));

        var getInteractionsStub = sandbox.stub(genesys.wwe.interactionManager, 'get');
        getInteractionsStub.withArgs('interactions').returns(new Backbone.Collection([]));

        sandbox.stub(events, 'resolveAgentDesktopEvent');
        sandbox.stub(crmEvents, 'startListening');
        sandbox.stub(crmErrors, 'startListening');

        events.startListening();
        var interactionsCollection = genesys.wwe.interactionManager.get('interactions');

        var interaction = new Backbone.Model({some: 'interaction'});

        interactionsCollection.add(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(crmEvents.startListening);

        assert.sinonCalledOnceWithExactly(events.resolveAgentDesktopEvent, {
          eventType: 'ADDED',
          interaction: interaction
        });
      }));


      it('events::startListening initiate monitoring of events on added interaction', injector.run([
        'events/events',
        'external/genesys',
        'events/crmErrors'
      ], function(events, genesys, crmErrors) {

        var interaction = new Backbone.Model({some: 'interaction'});

        var getInteractionsStub = sandbox.stub(genesys.wwe.interactionManager, 'get');
        getInteractionsStub.withArgs('interactions').returns(new Backbone.Collection([]));
        sandbox.stub(events, 'resolveAgentDesktopEvent');
        sandbox.stub(crmErrors, 'startListening');

        events.startListening();
        var interactionsCollection = genesys.wwe.interactionManager.get('interactions');
        interactionsCollection.add(interaction);

        interaction.trigger('event', {
          eventType: 'CUSTOM_EVENT',
          interaction: interaction
        });

        assert.sinonCalledOnceWithExactly(events.resolveAgentDesktopEvent, {
          eventType: 'CUSTOM_EVENT',
          interaction: interaction
        });
      }));


      it('events::startListening initiate monitoring of removing items to interactions collection', injector.run([
        'events/events',
        'external/genesys',
        'events/crmErrors'
      ], function(events, genesys, crmErrors) {

        var interaction = new Backbone.Model({some: 'interaction'});

        var getInteractionsStub = sandbox.stub(genesys.wwe.interactionManager, 'get');
        getInteractionsStub.withArgs('interactions').returns(new Backbone.Collection([interaction]));
        sandbox.stub(events, 'resolveAgentDesktopEvent');
        sandbox.stub(crmErrors, 'startListening');

        events.startListening();
        var interactionsCollection =  genesys.wwe.interactionManager.get('interactions');

        interactionsCollection.remove(interaction);

        assert.sinonCalledOnceWithExactly(events.resolveAgentDesktopEvent, {
          eventType: 'REMOVED',
          interaction: interaction
        });
      }));


    });

    describe('events::createInteractionEvent', function() {
      it('events::createInteractionEvent creates standard agent-desktop compliant event', injector.run([
        'events/events'
      ], function(events) {
          assert.deepEqual(events.createInteractionEvent('EVENT_TYPE', 'INTERACTION'), {
            eventType: 'EVENT_TYPE',
            interaction: 'INTERACTION'
          })
      }))
    });


  });
});
