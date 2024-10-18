define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('EmailInteraction', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('EmailInteraction::getANI', function() {

      it('EmailInteraction::getANI should return empty string', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {
        var emailInteraction = new EmailInteraction(new Backbone.Model({notAHtccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(emailInteraction.getANI(), '');
      }));
    });
    
    describe('EmailInteraction::getSubject', function() {

      it('EmailInteraction::getSubject calls utils::getSalesforceParameter with email parameter', injector.run([
        'interactions/EmailInteraction',
        'utils'
      ], function(EmailInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        var emailInteraction = new EmailInteraction(interaction);
        emailInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.email.subject', interaction, sinon.match.func));
      }));

    });

    describe('EmailInteraction::getTitle', function() {

      it('EmailInteraction::getTitle minimal title is Email', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {
        var emailInteraction = new EmailInteraction(new Backbone.Model({notAHtccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(emailInteraction.getTitle(), 'Email');
      }));


      it('EmailInteraction::getTitle should rely on htccInteractionId if it is present', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {
        var emailInteraction = new EmailInteraction(new Backbone.Model({htccInteractionId: 'HTCC_INTERACTION_ID'}));
        assert.equal(emailInteraction.getTitle(), 'Email HTCC_INTERACTION_ID');
      }));

    });

    describe('EmailInteraction::isDone', function() {

      it('EmailInteraction::isDone should return false if interaction.state is not COMPLETED', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {

        var emailInteraction = new EmailInteraction(new Backbone.Model({state: 'NOT_COMPLETED'}));
        assert.isFalse(emailInteraction.isDone());
      }));

      it('EmailInteraction::isDone should return false if interaction.previousState is not ACCEPTED', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {

        var emailInteraction = new EmailInteraction(new Backbone.Model({
          state: 'COMPLETED',
          previousState: 'NOT_ACCEPTED'
        }));
        assert.isFalse(emailInteraction.isDone());
      }));

      it('EmailInteraction::isDone should return true for relevant interactions', injector.run([
        'interactions/EmailInteraction'
      ], function(EmailInteraction) {

        var emailInteraction = new EmailInteraction(new Backbone.Model({
          state: 'COMPLETED',
          previousState: 'ACCEPTED'
        }));
        assert.isTrue(emailInteraction.isDone());
      }));


    });


    describe('EmailInteraction::shouldScreenPopAt', function() {

      it('EmailInteraction::shouldScreenPopAt should return false if eventName is not equal to INTERACTION_ACCEPTED', injector.run([
        'interactions/EmailInteraction',
        'configuration'
      ], function(EmailInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(false);
        var voiceInteraction = new EmailInteraction({state: 'whatever'});
        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
      }));

      it('EmailInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_ACCEPTED', injector.run([
        'interactions/EmailInteraction',
        'configuration'
      ], function(OutboundInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(false);
        var voiceInteraction = new OutboundInteraction({state: 'whatever'});
        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_ACCEPTED'));
      }));
      
      it('EmailInteraction::shouldScreenPopAt should return true if eventName is equal to INTERACTION_INVETED when screenpop.email.on-invite is true', injector.run([
        'interactions/EmailInteraction',
        'configuration'
      ], function(EmailInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(true);
        var voiceInteraction = new EmailInteraction({state: 'whatever'});
        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_ACCEPTED'));
        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_INVITED'));
      }));


    });

    describe('EmailInteraction::getTask', function() {

      it('EmailInteraction::getTask should add custom activity fields', injector.run([
        'utils',
        'interactions/EmailInteraction',
        'configuration'
      ], function(utils, EmailInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(false);
        
        sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([{name: 'CUSTOM_ACTIVIY_FIELD', value: 'CUSTOM_ACTIVITY_VALUE'}]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        var checkFragment = 'CUSTOM_ACTIVIY_FIELD=' + encodeURIComponent('CUSTOM_ACTIVITY_VALUE');
        assert.include(new EmailInteraction(new Backbone.Model({userData: {IW_CallType: 'Consult'}})).getTask(), checkFragment);
      }));


      it('EmailInteraction::getTask should add description if comment is present', injector.run([
        'utils',
        'interactions/EmailInteraction',
        'configuration'
      ], function(utils, EmailInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(false);
        sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        sandbox.stub(EmailInteraction.prototype, 'getTitle').returns('SOME TITLE');

        var checkFragment = 'Description=' + encodeURIComponent('SOME TITLE\n\nCase Data:\nTo: \nSubject: \nNote:\nSOMETHING IMPORTANT');
        assert.include(new EmailInteraction(new Backbone.Model({
          comment: 'SOMETHING IMPORTANT'
        })).getTask(), checkFragment);
      }));
      
      
      it('EmailInteraction::getTask should add callType if interactionType is present', injector.run([
         'utils',
         'interactions/EmailInteraction',
         'configuration'
       ], function(utils, EmailInteraction, configuration) {
         configuration.getAsBoolean = sandbox.stub();
         configuration.getAsBoolean.returns(true);
         sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([]);

         sandbox.stub(utils, 'filterCaseData').returns([]);
         sandbox.stub(utils, 'filterToastData').returns([]);

         sandbox.stub(EmailInteraction.prototype, 'getTitle').returns('SOME TITLE');

         assert.include(new EmailInteraction(new Backbone.Model({
           interactionType: 'Inbound'
         })).getTask(), 'CallType=Inbound');
       }));
      
      it('EmailInteraction::getTask should add description with email body if option is set', injector.run([
        'utils',
        'interactions/EmailInteraction',
        'configuration'
      ], function(utils, EmailInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(true);
        
        sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        sandbox.stub(EmailInteraction.prototype, 'getTitle').returns('SOME TITLE');

        var checkFragment = 'Description=' + encodeURIComponent('SOME TITLE\n\nCase Data:\nTo: \nSubject: \nNote:\nSOMETHING IMPORTANT\nEmail Content:\nEmail body');
        assert.include(new EmailInteraction(new Backbone.Model({
          comment: 'SOMETHING IMPORTANT',
          text: 'Email body'
        })).getTask(), checkFragment);
      }));

      it('EmailInteraction::getTask should add CallObject if htccInteractionId is present', injector.run([
        'utils',
        'interactions/EmailInteraction'
      ], function(utils, EmailInteraction) {
        sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        var checkFragment = 'CallObject=' + encodeURIComponent('HTCC UUID');
        assert.include(new EmailInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'},
          htccInteractionId: 'HTCC UUID'
        })).getTask(), checkFragment);
      }));


      it('EmailInteraction::getTask should add CallDisposition if selectedDispositionItemId is present', injector.run([
        'utils',
        'interactions/EmailInteraction'
      ], function(utils, EmailInteraction) {
        sandbox.stub(EmailInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        sandbox.stub(EmailInteraction.prototype, 'getDisposition');
        EmailInteraction.prototype.getDisposition.returns('SELECTED DISPOSITION_ITEM_ID');

        var checkFragment = 'CallDisposition=' + encodeURIComponent('SELECTED DISPOSITION_ITEM_ID');
        assert.include(new EmailInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'}
        })).getTask(), checkFragment);
      }));
      
      describe('EmailInteraction::shouldActivityBeCreated', function() {

        it('EmailInteraction::shouldActivityBeCreated should always return true so far', injector.run([
          'interactions/EmailInteraction'
        ], function(EmailInteraction) {

          var emailInteraction = new EmailInteraction(new Backbone.Model({state: 'NOT_COMPLETED'}));
          assert(emailInteraction.shouldActivityBeCreated());
        }));
      });


    });



  });
});
