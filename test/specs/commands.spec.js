define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('commands', function() {
    var injector = new Squire();


    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    injector.mock('external/genesys', {
        wwe: {
          Main: {
            ChainOfCommand: {
              extend: function() {
                return function() {}
              }
            }
          },
          configuration: {
            getAsBoolean: function() {},
            getAsString: function() {}
          },
          commandManager: {
            insertCommandBefore: function() {},
            insertCommandAfter: function() {}
          }
        }
    });

    describe('commands.wrapPromise', function() {
        it('commands.wrapPromise', injector.run([
          'commands'
        ], function(commands) {
          assert.equal(commands.wrapPromise('WHATEVER').promise(), 'WHATEVER');
        }));
    });

    describe('commands.getParentInteractionCloseHookDescription', function() {
      it('commands.getParentInteractionCloseHookDescription.onExecute returns false if no interaction was found in data', injector.run([
        'commands'
      ], function(commands) {
        assert.isFalse(commands.getParentInteractionCloseHookDescription().onExecute({}));
      }));

      it('commands.getParentInteractionCloseHookDescription.onExecute returns on interaction if no parent interaction was found in data.interaction', injector.run([
        'commands'
      ], function(commands) {
        sandbox.stub(commands, 'onCloseExecute');
        var data = {interaction: new Backbone.Model()};
        commands.onCloseExecute.withArgs(data, data.interaction).returns('ON_CLOSE_EXECUTE');
        assert.equal(commands.getParentInteractionCloseHookDescription().onExecute(data), 'ON_CLOSE_EXECUTE');
      }));

      it('commands.getParentInteractionCloseHookDescription.onExecute returns passes parentInteraction to onCloseExecute', injector.run([
        'commands'
      ], function(commands) {
        sandbox.stub(commands, 'onCloseExecute');

        var data = {interaction: new Backbone.Model({parentInteraction: 'PARENT_INTERACTION'})};
        commands.onCloseExecute.withArgs(data, 'PARENT_INTERACTION').returns('ON_CLOSE_EXECUTE');

        assert.equal(commands.getParentInteractionCloseHookDescription().onExecute(data), 'ON_CLOSE_EXECUTE');
      }));

    });


    describe('commands.getInteractionCloseHookDescription', function() {
      it('commands.getInteractionCloseHookDescription.onExecute returns false if no interaction was found in data', injector.run([
        'commands'
      ], function(commands) {
        assert.isFalse(commands.getInteractionCloseHookDescription().onExecute({}));
      }));


      it('commands.getInteractionCloseHookDescription.onExecute returns passes interaction to onCloseExecute', injector.run([
        'commands'
      ], function(commands) {
        sandbox.stub(commands, 'onCloseExecute');

        var data = {interaction: 'INTERACTION'};
        commands.onCloseExecute.withArgs(data, 'INTERACTION').returns('ON_CLOSE_EXECUTE');

        assert.equal(commands.getInteractionCloseHookDescription().onExecute(data), 'ON_CLOSE_EXECUTE');
      }));

    });



    describe('commands.onCloseExecute', function() {

      it('commands.onCloseExecute should not update, should not save log', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction',
        'events/events'
      ], function(genesys, commands, crm, interactions, VoiceInteraction,events) {

        sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
        genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(true);

        var deferStub = sandbox.stub();
        var resolveStub = sandbox.stub();
        deferStub.returns({
          resolve: resolveStub,
          promise: sandbox.stub()
        });

        var whenStub = sandbox.stub();
        whenStub.returns({then: function(callback){
          callback();
        }});
        window.$ = {
          Deferred: deferStub,
          when: whenStub
        };

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback) {
          callback();
        }})


        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated').returns(false);
        sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
        sandbox.stub(events, 'createInteractionEvent');

        sandbox.stub(interactions, 'create');

        var interaction = new VoiceInteraction(new Backbone.Model({
          call: {callType: 'whatever'}
        }));
        interactions.create.returns(interaction);

        commands.onCloseExecute({interaction: interaction});
        assert.isFalse(interaction.updateInteractionByPageInfo.called);
        assert.isFalse(events.createInteractionEvent.called);
      }));

      it('commands.onCloseExecute doesn\'t fail if no interaction is returned', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction',
        'events/events'
      ], function(genesys, commands, crm, interactions, VoiceInteraction, events) {

        sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
        genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(true);

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback) {
          callback();
        }})


        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
        sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
        sandbox.stub(events, 'createInteractionEvent');

        sandbox.stub(interactions, 'create');

        var interaction = new VoiceInteraction(new Backbone.Model({
          call: {callType: 'whatever'}
        }));
        interactions.create.returns(false);

        commands.onCloseExecute({interaction: interaction});
        assert.isFalse(interaction.updateInteractionByPageInfo.called);
        assert.isFalse(events.createInteractionEvent.called);
      }));

      it('commands.onCloseExecute should update, should not save log', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction',
        'events/events'
      ], function(genesys, commands, crm, interactions, VoiceInteraction, events) {

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback) {
          callback();
        }})

        sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
        genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(false);

        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
        sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
        sandbox.stub(events, 'createInteractionEvent');
        
        var originalInteraction = new Backbone.Model({
            call: {callType: 'whatever'},
            htccInteraction: {}
          });

        var interaction = new VoiceInteraction(originalInteraction);

        sandbox.stub(interactions, 'create');
        interactions.create.returns(interaction);

        commands.onCloseExecute({interaction: interaction}, originalInteraction);
        assert.isTrue(interaction.updateInteractionByPageInfo.called);
        assert.isFalse(events.createInteractionEvent.called);
      }));
      
      it('commands.onCloseExecute should update, should not save log if preclose', injector.run([
         'external/genesys',
         'commands',
         'crm/crm',
         'interactions/interactions',
         'interactions/VoiceInteraction',
         'events/events'
       ], function(genesys, commands, crm, interactions, VoiceInteraction, events) {

         sandbox.stub(crm, 'getPageInfo');
         crm.getPageInfo.returns({then: function(callback) {
           callback();
         }})

         sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
         genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(false);

         sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
         sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
         sandbox.stub(events, 'createInteractionEvent');
         
         var originalInteraction = new Backbone.Model({
             call: {callType: 'whatever'},
             htccInteraction: {state: 'InWorkbin'}
           });

         var interaction = new VoiceInteraction(originalInteraction);

         sandbox.stub(interactions, 'create');
         interactions.create.returns(interaction);

         commands.onCloseExecute({interaction: interaction}, originalInteraction, true);
         assert.isTrue(interaction.updateInteractionByPageInfo.called);
         assert.isFalse(events.createInteractionEvent.called);
       }));

      it('commands.onCloseExecute should update, should save log', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction',
        'events/events'
      ], function(genesys, commands, crm, interactions, VoiceInteraction,events) {

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback) {
          callback();
        }})

        sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
        genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(false);

        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
        sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
        sandbox.stub(events, 'createInteractionEvent');
        sandbox.stub(events, 'resolveAgentDesktopEvent');

        VoiceInteraction.prototype.shouldActivityBeCreated.returns(true);

        var originalInteraction = new Backbone.Model({
            call: {callType: 'whatever'},
            htccInteraction: {}
          });
        
        var interaction = new VoiceInteraction(originalInteraction);

        sandbox.stub(interactions, 'create');
        interactions.create.returns(interaction);

        commands.onCloseExecute({interaction: interaction}, originalInteraction);
        assert.isTrue(interaction.updateInteractionByPageInfo.called);
        assert.isTrue(events.createInteractionEvent.called);
      }));
      
      it('commands.onCloseExecute should not block chain of command on crm error', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction',
        'events/events'
      ], function(genesys, commands, crm, interactions, VoiceInteraction,events) {

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback1, callback2) {
          callback2({error: 'err'});
        }})

        sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
        genesys.wwe.configuration.getAsBoolean.withArgs('interaction.case-data.is-read-only-on-idle').returns(true);

        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
        sandbox.stub(VoiceInteraction.prototype,'updateInteractionByPageInfo');
        sandbox.stub(events, 'createInteractionEvent');
        sandbox.stub(events, 'resolveAgentDesktopEvent');

        var interaction = new VoiceInteraction(new Backbone.Model({
          call: {callType: 'whatever'}
        }));

        sandbox.stub(interactions, 'create');
        interactions.create.returns(interaction);

        commands.onCloseExecute({interaction: interaction});
        assert.isFalse(interaction.updateInteractionByPageInfo.called);
        assert.isFalse(events.createInteractionEvent.called);
      }))

    });



    describe('commands.init', function() {

      it('commands.init extends chain of commands', injector.run([
        'external/genesys',
        'commands',
        'crm/crm',
        'interactions/interactions',
        'interactions/VoiceInteraction'
      ], function(genesys, commands, crm, interactions, VoiceInteraction) {
        var extendStub = sandbox.stub(genesys.wwe.Main.ChainOfCommand, 'extend', function(command) {
          return function() {
            command.onExecute({mainInteraction: new Backbone.Model()});
            this.ping = 'pong'
          }
        });


        sandbox.stub(genesys.wwe.commandManager, 'insertCommandBefore');
        sandbox.stub(genesys.wwe.commandManager, 'insertCommandAfter');

        sandbox.stub(crm, 'updateDataForTransfer');
        crm.updateDataForTransfer.withArgs({some: 'CONTEXT'}).returns('COMMAND_CREATED');

        sandbox.stub(crm, 'getPageInfo');
        crm.getPageInfo.returns({then: function(callback) {
          callback();
        }})


        sandbox.stub(VoiceInteraction.prototype,'shouldActivityBeCreated');
        
        sandbox.stub(interactions, 'create');
        interactions.create.returns(new VoiceInteraction(new Backbone.Model({
          call: {callType: 'whatever'}
        })));

        sandbox.stub(commands, 'wrapPromise');

        commands.init();

        assert.sinonCalledOnceWithExactly(extendStub, {
          name: 'CRMUpdateTransferData',
          onExecute: sinon.match.func
        });

        assert.sinonCalledOnceWithExactly(extendStub, {
          name: 'InteractionCloseHook',
          onExecute: sinon.match.func
        });

        assert.sinonCalledOnceWithExactly(extendStub, {
          name: 'InteractionCloseHook',
          onExecute: sinon.match.func
        });

        assert.sinonCalledOnceWithExactly(extendStub, {
          name: 'ParentInteractionCloseHook',
          onExecute: sinon.match.func
        });

        /*assert.sinonCalledOnceWithExactly(genesys.wwe.commandManager.insertCommandBefore,
          'InteractionVoiceInitiateTransfer', 'InitiateTransfer', {ping: 'pong'});

        assert.sinonCalledOnceWithExactly(genesys.wwe.commandManager.insertCommandBefore,
          'InteractionVoiceInitiateConference', 'InitiateConference', {ping: 'pong'});

        assert.sinonCalledOnceWithExactly(genesys.wwe.commandManager.insertCommandBefore,
          'InteractionVoiceSingleStepConference', 'AddConferencedComment', {ping: 'pong'});

        assert.sinonCalledOnceWithExactly(genesys.wwe.commandManager.insertCommandBefore,
          'InteractionVoiceSingleStepTransfer', 'AddTransferredComment', {ping: 'pong'});

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceClose', 'SaveComment', {ping: 'pong'})
          .callCount, 2);*/

       /* assert.equal(genesys.wwe.commandManager.insertCommandAfter
          .withArgs('InteractionBeforeClose', 'IsItPossibleToClose', {ping: 'pong'})
          .callCount, 2);

        assert.equal(genesys.wwe.commandManager.insertCommandAfter
          .withArgs('InteractionEmailSend', 'CheckMandatoryCaseData', {ping: 'pong'})
          .callCount, 1);
        
        assert.equal(genesys.wwe.commandManager.insertCommandAfter
            .withArgs('InteractionEmailSend', 'ParentInteractionCloseHook', {ping: 'pong'})
            .callCount, 1);*/
      }));

      it('commands.init commands are not registered when features are not supported.', injector.run([
        'external/genesys',
        'commands',
        'crm/crm'
      ], function(genesys, commands, crm) {

        sandbox.stub(genesys.wwe.commandManager, 'insertCommandBefore');
        sandbox.stub(crm, 'isInFocusPageTransferSupported').returns(false);
        sandbox.stub(crm, 'isActivityHistorySupported').returns(false);

        sandbox.stub(commands, 'wrapPromise');

        commands.init();

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceInitiateTransfer', 'InitiateTransfer', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceInitiateConference', 'InitiateConference', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceSingleStepConference', 'AddConferencedComment', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceSingleStepTransfer', 'AddTransferredComment', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionVoiceClose', 'SaveComment', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionBeforeClose', 'IsItPossibleToClose', {ping: 'pong'})
          .callCount, 0);

        assert.equal(genesys.wwe.commandManager.insertCommandBefore
          .withArgs('InteractionEmailSend', 'IsPossibleToSend', {ping: 'pong'})
          .callCount, 0);
      }));

    });

  });
});
