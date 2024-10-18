define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('ChatInteraction', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('ChatInteraction::getANI', function() {

      it('ChatInteraction::getANI should return empty string', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        var chatInteraction = new ChatInteraction(new Backbone.Model({notAHtccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(chatInteraction.getANI(), '');
      }));
    });
    

    describe('ChatInteraction::getSubject', function() {

      it('ChatInteraction::getSubject calls utils::getSalesforceParameter with chat parameter', injector.run([
        'interactions/ChatInteraction',
        'utils'
      ], function(ChatInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        var chatInteraction = new ChatInteraction(interaction);
        chatInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.chat.subject', interaction, sinon.match.func));
      }));

    });

    describe('ChatInteraction::getTitle', function() {

      it('ChatInteraction::getTitle minimal title is Chat', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        var chatInteraction = new ChatInteraction(new Backbone.Model({media: new Backbone.Model({name: 'chat'})}));
        assert.equal(chatInteraction.getTitle(), 'Chat');
      }));


      it('ChatInteraction::getTitle should rely on htccInteractionId if it is present', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
          var chatInteraction = new ChatInteraction(new Backbone.Model({htccInteractionId: 'HTCC_INTERACTION_ID', media: new Backbone.Model({name: 'chat'})}));
          assert.equal(chatInteraction.getTitle(), 'Chat HTCC_INTERACTION_ID');
      }));

    });

    describe('ChatInteraction::getTask', function() {

      var injector = new Squire();

      injector.mock('configuration', {
          get: function() {return  ''},
          getAsBoolean: function() {return false;}
        }
      );

      it('ChatInteraction::getTask should add custom activity fields', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {

        sandbox.stub(configuration, 'get');

        var chatInteraction = new ChatInteraction(new Backbone.Model({}));
        sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
        sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([{name: 'CUSTOM_ACTIVIY_FIELD', value: 'CUSTOM_ACTIVITY_VALUE'}]);

        var checkFragment = 'CUSTOM_ACTIVIY_FIELD=' + encodeURIComponent('CUSTOM_ACTIVITY_VALUE');
        assert.include(chatInteraction.getTask(), checkFragment);
      }));


      it('ChatInteraction::getTask should add transcript to a custom field described in salesforce.chat.transcript-custom-field-name', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {

          sandbox.stub(configuration, 'get');
          configuration.get.withArgs('salesforce.chat.transcript-custom-field-name', '', 'crm-adapter').returns('CUSTOM_FIELD_NAME');

          var chatInteraction = new ChatInteraction(new Backbone.Model({}));
          sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
          sandbox.stub(chatInteraction, 'getTranscriptText').returns('TRANSCRIPT TEXT!!!');
          sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([]);

          var checkFragment = 'CUSTOM_FIELD_NAME=' + encodeURIComponent('TRANSCRIPT TEXT!!!');
          assert.include(chatInteraction.getTask(), checkFragment)
      }));

      it('ChatInteraction::getTask should add htccInteractionId if relevant', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        var interaction = new Backbone.Model({
          htccInteractionId: 'CHAT_HTCC_INTERACTION_ID'
        });

        var chatInteraction = new ChatInteraction(interaction);
        sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
        sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([]);

        assert.include(chatInteraction.getTask(), 'CallObject=' + encodeURIComponent('CHAT_HTCC_INTERACTION_ID'));
      }));

      it('ChatInteraction::getTask should add selectedDispositionItemId if relevant', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        var interaction = new Backbone.Model({});

        var chatInteraction = new ChatInteraction(interaction);
        sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
        sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([]);

        sandbox.stub(ChatInteraction.prototype, 'getDisposition');
        ChatInteraction.prototype.getDisposition.returns('SELECTED DISPOSITION_ITEM_ID');

        assert.include(chatInteraction.getTask(), 'CallDisposition=' + encodeURIComponent('SELECTED DISPOSITION_ITEM_ID'));
      }));

      it('ChatInteraction::getTask should add duration if relevant', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        var interaction = new Backbone.Model({
          selectedDispositionItemId: 'SELECTED_DISPOSITION_ITEM_ID'
        });

        var chatInteraction = new ChatInteraction(interaction);
        sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
        sandbox.stub(chatInteraction, 'getDuration').returns(77000);
        sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([]);

        assert.include(chatInteraction.getTask(), 'CallDurationInSeconds=' + encodeURIComponent(77) + '&');
      }));

      it('ChatInteraction::getTask should add inbound call type', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {

        sandbox.stub(configuration, 'getAsBoolean').returns(true);

        var chatInteraction = new ChatInteraction(new Backbone.Model({}));
        sandbox.stub(chatInteraction, 'getDescription').returns('CHAT_DESCRIPTION');
        sandbox.stub(chatInteraction, 'buildCustomActivityFields').returns([]);
        assert.include(chatInteraction.getTask(), 'CallType=Inbound');
      }));
      
    });

    describe('ChatInteraction::isDone', function() {

      it('ChatInteraction::isDone should return false if interaction.state is not IDLE', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {

        var emailInteraction = new ChatInteraction(new Backbone.Model({state: 'NOT_IDLE'}));
        assert.isFalse(emailInteraction.isDone());
      }));

      it('ChatInteraction::isDone should return true for relevant interactions', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {

        var emailInteraction = new ChatInteraction(new Backbone.Model({state: 'IDLE'}));
        assert.isTrue(emailInteraction.isDone());
      }));


    });

    describe('ChatInteraction::getTranscriptText', function() {

      it('ChatInteraction::getTranscriptText returns empty script if no transcript was found', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
          var chatInteraction = new ChatInteraction(new Backbone.Model({}));
          assert.strictEqual(chatInteraction.getTranscriptText(), '');
      }));

      it('ChatInteraction::getTranscriptText filters message from transcript', injector.run([
        'utils',
        'interactions/ChatInteraction'
      ], function(utils, ChatInteraction) {
        var chatInteraction = new ChatInteraction(new Backbone.Model({
          transcript: new Backbone.Collection([
            {type: 'message', message: 'MESSAGE_A', date: 'DATE_A', party: new Backbone.Model({displayName: 'DISPLAY_NAME_A'})},
            {type: 'not_a_message'},
            {type: 'message', message: 'MESSAGE_B', date: 'DATE_B', party: new Backbone.Model({displayName: 'DISPLAY_NAME_B'})}
          ])
        }));

        sandbox.stub(utils, 'convertTime');
        utils.convertTime.withArgs('DATE_A').returns('CONVERTED_DATE_A');
        utils.convertTime.withArgs('DATE_B').returns('CONVERTED_DATE_B');

        assert.strictEqual(chatInteraction.getTranscriptText(), 'Transcript:\nCONVERTED_DATE_A[DISPLAY_NAME_A]: MESSAGE_A\nCONVERTED_DATE_B[DISPLAY_NAME_B]: MESSAGE_B\n\n');
      }));


    });



    describe('ChatInteraction::getDescription', function() {

      it('ChatInteraction::getDescription calls super', injector.run([
        'configuration',
        'interactions/VoiceInteraction',
        'interactions/ChatInteraction'
      ], function(configuration, VoiceInteraction, ChatInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'getDescription').returns('SUPER_GET_DESCRIPTION\n');
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.chat.include-transcript-in-desc', 'true', 'crm-adapter').returns('false');

        var chatInteraction = new ChatInteraction(new Backbone.Model({htccInteraction: {}}));
        assert.equal(chatInteraction.getDescription(), 'SUPER_GET_DESCRIPTION\nSubject: \nNote:\n');
      }));

      it('ChatInteraction::getDescription adds transcript if salesforce.chat.include-transcript-in-desc', injector.run([
        'configuration',
        'interactions/VoiceInteraction',
        'interactions/ChatInteraction'
      ], function(configuration, VoiceInteraction, ChatInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'getDescription').returns('SUPER_GET_DESCRIPTION\n');
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.chat.include-transcript-in-desc', 'true', 'crm-adapter').returns('true');

        var chatInteraction = new ChatInteraction(new Backbone.Model({htccInteraction: {}}));
        sandbox.stub(chatInteraction, 'getTranscriptText').returns('AND_TRANSCRIPT\n');

        assert.equal(chatInteraction.getDescription(), 'SUPER_GET_DESCRIPTION\nSubject: \nAND_TRANSCRIPT\nNote:\n');
      }));

      it('ChatInteraction::getDescription should add comment if relevant', injector.run([
        'configuration',
        'interactions/VoiceInteraction',
        'interactions/ChatInteraction'
      ], function(configuration, VoiceInteraction, ChatInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'getDescription').returns('SUPER_GET_DESCRIPTION\n');
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.chat.include-transcript-in-desc', 'true', 'crm-adapter').returns('false');

        var interaction = new Backbone.Model({
          comment: 'CHAT_INTERACTION_COMMENT',
          htccInteraction: {}
        });

        var chatInteraction = new ChatInteraction(interaction);

        assert.equal(chatInteraction.getDescription(), 'SUPER_GET_DESCRIPTION\nSubject: \nNote:\nCHAT_INTERACTION_COMMENT');
      }));


    });

    describe('ChatInteraction::shouldScreenPopAt', function() {
      
      var injector = new Squire();
      
      injector.mock('configuration', {
        get: function() {}
      });

      it('ChatInteraction::shouldScreenPopAt should return false if eventName is not equal to INTERACTION_ACCEPTED', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {

        var voiceInteraction = new ChatInteraction({state: 'whatever'});
        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
      }));

      it('ChatInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_ACCEPTED', injector.run([
        'interactions/ChatInteraction'
      ], function(OutboundInteraction) {

        var voiceInteraction = new OutboundInteraction({state: 'whatever'});
        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_ACCEPTED'));
      }));
      
      it('ChatInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_INVITED and screenpop.chat.on-invite is configured', injector.run([
        'interactions/ChatInteraction',
        'configuration'
      ], function(OutboundInteraction, configuration) {
        sandbox.stub(configuration, 'get').returns('true');
        var voiceInteraction = new OutboundInteraction({state: 'whatever'});
        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_INVITED'));
      }));

    });
    
    describe('ChatInteraction::shouldActivityBeCreated', function() {
      
      var injector = new Squire();
      
      injector.mock('configuration', {
        get: function() {}
      });
      
      it('ChatInteraction::shouldActivityBeCreated is true if the chat type is configured', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {
        var interaction = new ChatInteraction(new Backbone.Model({htccInteraction : {interactionType : 'TestChat'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-chat-types', 'Inbound', 'crm-adapter').returns('OtherType, TestChat, OneMoreType');
        assert(interaction.shouldActivityBeCreated());
      }));
      
      it('ChatInteraction::shouldActivityBeCreated is false if the chat is monitored by current users', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {
        var interaction = new ChatInteraction(new Backbone.Model({htccInteraction : {interactionType : 'TestChat'}}));
        
        sandbox.stub(ChatInteraction.prototype, 'isMonitoredByMe');
        ChatInteraction.prototype.isMonitoredByMe.returns(true);
        
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-chat-types', 'Inbound', 'crm-adapter').returns('OtherType, TestChat, OneMoreType');
        assert.isFalse(interaction.shouldActivityBeCreated());
      }));
      
      it('ChatInteraction::shouldActivityBeCreated user data changes chat type in case of consultation', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {
        var interaction = new ChatInteraction(new Backbone.Model({htccInteraction: {callType : 'TestCall'},
                                                                  isChatConsultation : true}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-chat-types', 
            'Inbound', 'crm-adapter').returns('OtherType, Consult, OneMoreType');
        assert(interaction.shouldActivityBeCreated());
      }));
      
      it('ChatInteraction::shouldActivityBeCreated is false if the chat type is not configured', injector.run([
        'configuration',
        'interactions/ChatInteraction'
      ], function(configuration, ChatInteraction) {
        var interaction = new ChatInteraction(new Backbone.Model({htccInteraction: {chatType : 'TestCall'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-chat-types', 
          'Inbound', 'crm-adapter').returns('Inbound');
        assert.isFalse(interaction.shouldActivityBeCreated());
      }));
    });

    describe('ChatInteraction::shouldMarkDoneAt', function() {

      it('ChatInteraction::shouldMarkDoneAt returns false if isDone returns false', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        sandbox.stub(ChatInteraction.prototype, 'isDone');
        ChatInteraction.prototype.isDone.returns(false);

        assert.isFalse(new ChatInteraction().shouldMarkDoneAt('INTERACTION_BUNDLE_CLOSE'));
      }));

      it('ChatInteraction::shouldMarkDoneAt returns false if isConsultation returns true', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        sandbox.stub(ChatInteraction.prototype, 'isDone');
        ChatInteraction.prototype.isDone.returns(true);

        sandbox.stub(ChatInteraction.prototype, 'isConsultation');
        ChatInteraction.prototype.isConsultation.returns(true);

        assert.isFalse(new ChatInteraction().shouldMarkDoneAt('INTERACTION_BUNDLE_CLOSE'));
      }));


      it('ChatInteraction::shouldMarkDoneAt returns true if isConsultation and isMonitoredByMe checks invoked and returns false', injector.run([
        'interactions/ChatInteraction'
      ], function(ChatInteraction) {
        sandbox.stub(ChatInteraction.prototype, 'isDone');
        ChatInteraction.prototype.isDone.returns(true);

        sandbox.stub(ChatInteraction.prototype, 'isConsultation');
        ChatInteraction.prototype.isConsultation.returns(false);
        
        sandbox.stub(ChatInteraction.prototype, 'isMonitoredByMe');
        ChatInteraction.prototype.isMonitoredByMe.returns(false);

        assert.isTrue(new ChatInteraction().shouldMarkDoneAt('INTERACTION_BUNDLE_CLOSE'));
      }));


    });



  });
});
