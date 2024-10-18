define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('VoiceInteraction', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('VoiceInteraction::getDuration', function() {

      it('VoiceInteraction::getInteractionDuration returns undefined if interaction missing startDate', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        assert.isUndefined(new VoiceInteraction(new Backbone.Model({ztartDate: 0})).getDuration());
      }));

      it('VoiceInteraction::getInteractionDuration returns  difference between current time and startDate if interaction missing endDate', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        sandbox.stub(Date, 'now').returns(2000);
        assert.equal(new VoiceInteraction(new Backbone.Model({startDate: 500, endDade: 3})).getDuration(), 1500);
      }));

      it('VoiceInteraction::getInteractionDuration returns  difference between endDate and startDate', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        assert.equal(new VoiceInteraction(new Backbone.Model({startDate: 1500, endDate: 2200})).getDuration(), 700);
      }));

    });

    describe('VoiceInteraction::getSubject', function() {

      it('VoiceInteraction::getSubject calls utils::getSalesforceParameter with internal voice parameter by default', injector.run([
        'interactions/VoiceInteraction',
        'utils'
      ], function(VoiceInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        interaction.set({userData : {}});
        var voiceInteraction = new VoiceInteraction(interaction);
        voiceInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.internal-voice.subject', interaction, sinon.match.func));
      }));

      it('VoiceInteraction::getSubject calls utils::getSalesforceParameter with transfer-voice parameter if interaction has been transfered', injector.run([
        'interactions/VoiceInteraction',
        'utils'
      ], function(VoiceInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        interaction.set({userData : {GCS_TransferringDate : 'defined'}});
        var voiceInteraction = new VoiceInteraction(interaction);
        voiceInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.transfer-voice.subject', interaction, sinon.match.func));
      }));

      it('VoiceInteraction::getSubject calls utils::getSalesforceParameter with outbound-voice parameter if outbound', injector.run([
        'interactions/VoiceInteraction',
        'utils'
      ], function(VoiceInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        interaction.set({userData : {}, callType : 'Outbound'});
        var voiceInteraction = new VoiceInteraction(interaction);
        voiceInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.outbound-voice.subject', interaction, sinon.match.func));
      }));

      it('VoiceInteraction::getSubject calls utils::getSalesforceParameter with inbound-voice parameter if inbound', injector.run([
        'interactions/VoiceInteraction',
        'utils'
      ], function(VoiceInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        interaction.set({userData : {}, callType : 'Inbound'});
        var voiceInteraction = new VoiceInteraction(interaction);
        voiceInteraction.getSubject();
        assert(utils.getSalesforceParameter.calledWithExactly('templates.salesforce.inbound-voice.subject', interaction, sinon.match.func));
      }));

    });

    describe('VoiceInteraction::getTitle', function() {

      it('VoiceInteraction::getTitle should return original interaction.getOrigin()', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var originalInterfaction = new Backbone.Model({
          callType: 'SECRET',
          direction: 'OUT'
        });

        originalInterfaction.getOrigin = function() { return 'INTERACTION_ORIGIN';};

        assert.equal(new VoiceInteraction(originalInterfaction).getTitle(), 'INTERACTION_ORIGIN');
      }));

    });


    describe('VoiceInteraction::getCaseData', function() {

      it('VoiceInteraction::getCaseData should return key:value pairs', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        sandbox.stub(VoiceInteraction.prototype, 'filterUserData').returns([
          {
            displayName: 'DISPLAY_A',
            value: 'AAA'
          },
          {
            displayName: 'DISPLAY_A',
            value: 'BBB'
          }
        ]);

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          ani: 'John Smith',
          userData: true
        }));
        assert.equal(voiceInteraction.getCaseData(), 'DISPLAY_A: AAA\nDISPLAY_A: BBB\n');

      }));

    });

    describe('VoiceInteraction::getTask', function() {

      it('VoiceInteraction::getTask should add custom activity fields', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'buildCustomActivityFields').returns([{name: 'CUSTOM_ACTIVIY_FIELD', value: 'CUSTOM_ACTIVITY_VALUE'}]);
        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('INTERACTION_TITLE');


        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        var checkFragment = 'CUSTOM_ACTIVIY_FIELD=' + encodeURIComponent('CUSTOM_ACTIVITY_VALUE');
        assert.include(new VoiceInteraction(new Backbone.Model({userData: {IW_CallType: 'Consult'}})).getTask(), checkFragment);
      }));


      it('VoiceInteraction::getTask should tell apart consultations', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);
        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('INTERACTION_TITLE');

        var checkFragment = 'CallType=' + encodeURIComponent('Consult');
        assert.include(new VoiceInteraction(new Backbone.Model({userData: {IW_CallType: 'Consult'}})).getTask(), checkFragment);
      }));

      it('VoiceInteraction::getTask should add description if callNote is present', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);

        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('SOME TITLE');

        var checkFragment = 'Description=' + encodeURIComponent('SOME TITLE\n\nCase Data:\nNote:\nSOMETHING IMPORTANT');
        assert.include(new VoiceInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'},
          callNote: 'SOMETHING IMPORTANT'
        })).getTask(), checkFragment);

        var checkFragment = 'Description=' + encodeURIComponent('SOME TITLE\n\nCase Data:\nNote:\nSOMETHING IMPORTANT');
        assert.include(new VoiceInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'},
          comment: 'SOMETHING IMPORTANT'
        })).getTask(), checkFragment);

      }));

      it('VoiceInteraction::getTask should add CallObject if callUuid is present', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);
        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('INTERACTION_TITLE');

        var checkFragment = 'CallObject=' + encodeURIComponent('CALL UUID');
        assert.include(new VoiceInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'},
          callUuid: 'CALL UUID'
        })).getTask(), checkFragment);
      }));

      it('VoiceInteraction::getDisposition attempts to fetch disposition from userData when selectedDispositionItemId was not detected', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'buildCustomActivityFields').returns([]);

        sandbox.stub(utils, 'filterCaseData').returns([]);
        sandbox.stub(utils, 'filterToastData').returns([]);
        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('INTERACTION_TITLE');

        sandbox.stub(VoiceInteraction.prototype, 'getDisposition');
        VoiceInteraction.prototype.getDisposition.returns('SELECTED DISPOSITION_ITEM_ID');

        var checkFragment = 'CallDisposition=' + encodeURIComponent('SELECTED DISPOSITION_ITEM_ID');
        assert.include(new VoiceInteraction(new Backbone.Model({
          userData: {IW_CallType: 'Whatever'}
        })).getTask(), checkFragment);
      }));

    });

    describe('VoiceInteraction::getUserData', function() {

      it('VoiceInteraction::getUserData should return undefined when no userData was present in original interaction', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({noUserData: 'at all'}));
        assert.isUndefined(voiceInteraction.getUserData());
      }));

    });


    describe('VoiceInteraction::getANI', function() {

      it('VoiceInteraction::getANI should return ani if it is present', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
         var voiceInteraction = new VoiceInteraction(new Backbone.Model({
           ani: 'John Smith',
           parties: new Backbone.Collection([{name: 'A'}, {name: 'B'}])
         }));
         assert.equal(voiceInteraction.getANI(), 'John Smith');
      }));

      it('VoiceInteraction::getANI should return first name from parties (if such found)', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          not_ani: 'John Smith',
          parties: new Backbone.Collection([{name: 'Agent1'}, {name: 'B'}])
        }));
        assert.equal(voiceInteraction.getANI(), 'Agent1');
      }));

      it('VoiceInteraction::getANI should return undefined if neither ani nor parties are present in original interaction', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          not_ani: 'John Smith',
          not_parties: [{name: 'Agent1'}, {name: 'B'}]
        }));
        assert.isNull(voiceInteraction.getANI());
      }));


    });


    describe('VoiceInteraction::getDescription', function() {

      it('VoiceInteraction::getDescription should return specific title-dependent string if no userData is present', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('CALL_FROM_JOHN');

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          ani: 'John Smith',
          no: {user: 'data'}
        }));
        assert.equal(voiceInteraction.getDescription(), 'CALL_FROM_JOHN\n\nCase Data:\n');
      }));

      it('VoiceInteraction::getDescription should return filtered data if userData is present', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        sandbox.stub(VoiceInteraction.prototype, 'getTitle').returns('CALL_FROM_ANN');
        sandbox.stub(VoiceInteraction.prototype, 'filterUserData').returns([
          {
            displayName: 'DISPLAY_A',
            value: 'AAA'
          },
          {
            displayName: 'DISPLAY_A',
            value: 'BBB'
          }
        ]);

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          ani: 'John Smith',
          userData: true
        }));
        assert.equal(voiceInteraction.getDescription(), 'CALL_FROM_ANN\n\nCase Data:\nDISPLAY_A: AAA\nDISPLAY_A: BBB\n');
      }));


    });


    describe('VoiceInteraction::filterUserData', function() {

      it('VoiceInteraction::filterUserData should return empty array if no data is present', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          ani: 'Janfranco Latezzi',
          no: {user: 'data'}
        }));
        assert.deepEqual(voiceInteraction.filterUserData(), []);
      }));

      it('VoiceInteraction::filterUserData should invoke utils.filterToastData if STATE = RINGING|DIALING|INVITED', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        var filterToastDataStub = sandbox.stub(utils, 'filterToastData');
        filterToastDataStub.withArgs({test: 'RINGING'}).returns(['FILTERED_RINGING']);
        filterToastDataStub.withArgs({test: 'DIALING'}).returns(['FILTERED_DIALING']);
        filterToastDataStub.withArgs({test: 'INVITED'}).returns(['FILTERED_INVITED']);


        assert.deepEqual(new VoiceInteraction(new Backbone.Model({
          state: 'RINGING',
          userData: {test: 'RINGING'}
        })).filterUserData(), ['FILTERED_RINGING']);

        assert.deepEqual(new VoiceInteraction(new Backbone.Model({
          state: 'DIALING',
          userData: {test: 'DIALING'}
        })).filterUserData(), ['FILTERED_DIALING']);

        assert.deepEqual(new VoiceInteraction(new Backbone.Model({
          state: 'INVITED',
          userData: {test: 'INVITED'}
        })).filterUserData(), ['FILTERED_INVITED']);

      }));

      it('VoiceInteraction::filterUserData should invoke utils.filterCaseData if STATE is not in RINGING|DIALING|INVITED', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        var filterToastDataStub = sandbox.stub(utils, 'filterCaseData');
        filterToastDataStub.withArgs({test: 'CASE_STATE'}).returns(['CASE_STATE']);

        assert.deepEqual(new VoiceInteraction(new Backbone.Model({
          state: 'CASE',
          userData: {test: 'CASE_STATE'}
        })).filterUserData(), ['CASE_STATE']);

      }));


    });


    describe('VoiceInteraction::isDone', function() {

      it('VoiceInteraction::isDone should return false if interaction.state is not IDLE', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({state: 'NOT_IDLE'}));
        assert.isFalse(voiceInteraction.isDone());
      }));

      it('VoiceInteraction::isDone should return false if interaction.previousState is RINGING', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          state: 'IDLE',
          previousState: 'RINGING'
        }));
        assert.isFalse(voiceInteraction.isDone());
      }));

      it('VoiceInteraction::isDone should return false if interaction.previousState is DIALING', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          state: 'IDLE',
          previousState: 'DIALING'
        }));
        assert.isFalse(voiceInteraction.isDone());
      }));

      it('VoiceInteraction::isDone should return true if interaction.state is IDLE and previousState is relevant', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({
          state: 'IDLE',
          previousState: 'NEITHER_RINGING_NOR_DIALING'
        }));
        assert.isTrue(voiceInteraction.isDone());
      }));


    });

    describe('VoiceInteraction::shouldScreenPopAt', function() {
      // TODO (shabunc): ask Chris whether this one still should be ESTABLISHED

      var injector = new Squire();

      injector.mock('configuration', {
        get: sandbox.stub(),
        getAsBoolean: sandbox.stub()
      });

      it('VoiceInteraction::shouldScreenPopAt returns false if call is internal and screen pops are disabled for internal calls', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({callType: 'Internal'}));
        //sandbox.stub(configuration, 'get');
        configuration.get.withArgs('screenpop.enable-for-internal-calls', 'true', 'crm-adapter').returns('false');

        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
      }));
      
      it('VoiceInteraction::shouldScreenPopAt returns false if call is consult, screenpop.enable-for-consult is true and screen pops are disabled for internal calls', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({callType: 'Consult'}));
        configuration.getAsBoolean.withArgs('screenpop.enable-for-consult', false, 'crm-adapter').returns(false);
        configuration.get.withArgs('screenpop.enable-for-internal-calls', 'true', 'crm-adapter').returns('false');

        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_WHATEVER'));
      }));

      it('VoiceInteraction::shouldScreenPopAt returns true if RINGING and screenPop is enabled for RINGING', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({callType: 'Internal'}));

        configuration.get.withArgs('screenpop.on-ringing', 'false', 'crm-adapter').returns('true');
        configuration.get.withArgs('screenpop.enable-for-internal-calls', 'true', 'crm-adapter').returns('true');


        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_RINGING'));
      }));


      it('VoiceInteraction::shouldScreenPopAt returns true if ESTABLISHED and previousState was RINGING', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({callType: 'Fancy', previousState: 'RINGING'}));

        assert.isTrue(voiceInteraction.shouldScreenPopAt('INTERACTION_ESTABLISHED'));
      }));

      it('VoiceInteraction::shouldScreenPopAt returns false if ESTABLISHED but previousState wasn"t RINGING', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({callType: 'Fancy', previousState: 'NOT_RINGING'}));

        assert.isFalse(voiceInteraction.shouldScreenPopAt('INTERACTION_ESTABLISHED'));
      }));



    });

    describe('VoiceInteraction::getUID', function() {

      it('VoiceInteraction::getUID returns interactionId or original interaction', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var voiceInteraction = new VoiceInteraction(new Backbone.Model({interactionId: 35}));
        assert.deepEqual(voiceInteraction.getUID(), '35');
      }));

    });

    describe('VoiceInteraction::updateInteractionByPageInfo', function() {

      it('VoiceInteraction::updateInteractionByPageInfo updates interaction if pageInfo.objectId and salesforce.user-data.object-id-key are present', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {

        var updateUserDataStub = sandbox.stub();
        updateUserDataStub.returns({
          then: function(handler) {
            handler();
          }
        });

        var interaction = {
          updateUserData: updateUserDataStub
        }
        
        var deferStub = sandbox.stub();
        var resolveStub = sandbox.stub();
        deferStub.returns({
          resolve: resolveStub,
          promise: sandbox.stub()
        })
        window.$ = {Deferred: deferStub};

        var voiceInteraction = new VoiceInteraction(interaction);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.user-data.object-id-key', '', 'crm-adapter').returns('USER_DATA_OBJECT_KEY');

        voiceInteraction.updateInteractionByPageInfo({objectId: 'OBJECT_ID'});
        assert.sinonAlwaysCalledOnceWithExactly(updateUserDataStub, {USER_DATA_OBJECT_KEY: 'OBJECT_ID'});
      }));

      it('VoiceInteraction::updateInteractionByPageInfo updates interaction if pageInfo.objectName and salesforce.user-data.object-name-key are present', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {

        var updateUserDataStub = sandbox.stub();

        updateUserDataStub.returns({
          then: function(handler) {
            handler();
          }
        });
        
        var interaction = {
          updateUserData: updateUserDataStub
        }

        var voiceInteraction = new VoiceInteraction(interaction);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.user-data.object-name-key', '', 'crm-adapter').returns('USER_DATA_OBJECT_NAME');

        voiceInteraction.updateInteractionByPageInfo({objectName: 'OBJECT_NAME'});
        assert.sinonAlwaysCalledOnceWithExactly(updateUserDataStub, {USER_DATA_OBJECT_NAME: 'OBJECT_NAME'});
      }));
      
      it('VoiceInteraction::updateInteractionByPageInfo updates interaction if pageInfo.recordName and salesforce.user-data.object-name-key are present', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {

        var updateUserDataStub = sandbox.stub();
        updateUserDataStub.returns({
          then: function(handler) {
            handler();
          }
        });
        
        var interaction = {
          updateUserData: updateUserDataStub
        }

        var voiceInteraction = new VoiceInteraction(interaction);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.user-data.object-name-key', '', 'crm-adapter').returns('USER_DATA_OBJECT_NAME');

        voiceInteraction.updateInteractionByPageInfo({recordName: 'RECORD_NAME'});
        assert.sinonAlwaysCalledOnceWithExactly(updateUserDataStub, {USER_DATA_OBJECT_NAME: 'RECORD_NAME'});
      }));

      it('VoiceInteraction::updateInteractionByPageInfo updates interaction if pageInfo.object and salesforce.user-data.object-type-key are present', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {

        var updateUserDataStub = sandbox.stub();
        updateUserDataStub.returns({
          then: function(handler) {
            handler();
          }
        });
        
        var interaction = {
          updateUserData: updateUserDataStub
        }

        var voiceInteraction = new VoiceInteraction(interaction);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.user-data.object-type-key', '', 'crm-adapter').returns('USER_DATA_OBJECT_TYPE');

        voiceInteraction.updateInteractionByPageInfo({object: 'OBJECT_TYPE'});
        assert.sinonAlwaysCalledOnceWithExactly(updateUserDataStub, {USER_DATA_OBJECT_TYPE: 'OBJECT_TYPE'});
      }));


      it('VoiceInteraction::updateInteractionByPageInfo does not call updateUserData if object is empty', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {

        var updateUserDataStub = sandbox.stub();
        updateUserDataStub.returns({
          then: function(handler) {
            handler();
          }
        });
        
        var interaction = {
          updateUserData: updateUserDataStub
        }

        var voiceInteraction = new VoiceInteraction(interaction);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.user-data.object-type-key', '', 'crm-adapter').returns('');
        configuration.get.withArgs('salesforce.user-data.object-name-key', '', 'crm-adapter').returns('');
        configuration.get.withArgs('salesforce.user-data.object-type-key', '', 'crm-adapter').returns('');


        voiceInteraction.updateInteractionByPageInfo({object: 'OBJECT_TYPE'});
        assert.isFalse(updateUserDataStub.called);
      }))
    });


    describe('VoiceInteraction::buildCustomActivityFields', function() {

      it('VoiceInteraction::buildCustomActivityFields returns specifically formed array if context is relevant', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var config = {
          getAsString: sandbox.stub()
        };

        config.getAsString.withArgs('salesforce.activity-log.field-mapping', '', 'crm-adapter').returns(false);

        var interaction = {};
        interaction.getContextualConfiguration = function() {return config};

        assert.deepEqual(new VoiceInteraction(interaction).buildCustomActivityFields(), []);
      }));


      it('VoiceInteraction::buildCustomActivityFields returns specifically formed array if context is relevant', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {

        var config = {
          getAsString: sandbox.stub(),
          getOptionsForSection: sandbox.stub()
        };

        config.getAsString.withArgs('salesforce.activity-log.field-mapping', '', 'crm-adapter').returns('SECTION_NAME');
        config.getOptionsForSection.withArgs('SECTION_NAME').returns({'': 'fieldD', fieldA: 'OPTION_A', fieldB: 'OPTION_B', fieldC: 'OPTION_C'});

        var interaction =  new Backbone.Model({
          userData: {fieldA: 'FIELD_A', fieldB: false, fieldC: 'FIELD_C', fieldD: false}
        });

        interaction.getContextualConfiguration = function() {return config};

        assert.deepEqual(new VoiceInteraction(interaction).buildCustomActivityFields(), [{name: 'OPTION_A', value: 'FIELD_A'}, {name: 'OPTION_C', value: 'FIELD_C'}]);
      }));

    });

    describe('VoiceInteraction::isConsultation', function() {
        it('VoiceInteraction::isConsultation returns true if isConsultation field is true in original interaction', injector.run([
          'interactions/VoiceInteraction'
        ], function(VoiceInteraction) {
          assert.isTrue(new VoiceInteraction(new Backbone.Model({isConsultation: true})).isConsultation());
          assert.isFalse(new VoiceInteraction(new Backbone.Model({isConsultation: 'SOME_CONSULTATION'})).isConsultation());
          assert.isFalse(new VoiceInteraction(new Backbone.Model({})).isConsultation());
        }));
    });

    describe('VoiceInteraction::isMonitoredByMe', function() {
        it('VoiceInteraction::isMonitoredByMe returns true if isMonitoredByMe field is true in original interaction', injector.run([
          'interactions/VoiceInteraction'
        ], function(VoiceInteraction) {
          assert.isTrue(new VoiceInteraction(new Backbone.Model({isMonitoredByMe: true})).isMonitoredByMe());
          assert.isFalse(new VoiceInteraction(new Backbone.Model({isMonitoredByMe: 'SOME_CONSULTATION'})).isMonitoredByMe());
          assert.isFalse(new VoiceInteraction(new Backbone.Model({})).isMonitoredByMe());
        }));
    });


    describe('VoiceInteraction::shouldMarkDoneAt', function() {

      it('VoiceInteraction::shouldMarkDoneAt returns false if isDone returns false', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'isDone');
        VoiceInteraction.prototype.isDone.returns(false);

        assert.isFalse(new VoiceInteraction().shouldMarkDoneAt('INTERACTION_REMOVED'));
      }));

      it('VoiceInteraction::shouldMarkDoneAt returns false if isConsultation returns true', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'isDone');
        VoiceInteraction.prototype.isDone.returns(true);

        sandbox.stub(VoiceInteraction.prototype, 'isConsultation');
        VoiceInteraction.prototype.isConsultation.returns(true);

        assert.isFalse(new VoiceInteraction().shouldMarkDoneAt('INTERACTION_REMOVED'));
      }));


      it('VoiceInteraction::shouldMarkDoneAt returns true if isConsultation and isMonitoredByMe checks invoked and returns false', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        sandbox.stub(VoiceInteraction.prototype, 'isDone');
        VoiceInteraction.prototype.isDone.returns(true);

        sandbox.stub(VoiceInteraction.prototype, 'isConsultation');
        VoiceInteraction.prototype.isConsultation.returns(false);

        sandbox.stub(VoiceInteraction.prototype, 'isMonitoredByMe');
        VoiceInteraction.prototype.isMonitoredByMe.returns(false);

        assert.isTrue(new VoiceInteraction().shouldMarkDoneAt('INTERACTION_REMOVED'));
      }));


    });

    describe('VoiceInteraction::shouldActivityBeCreated', function() {

      var injector = new Squire();

      injector.mock('configuration', {
        get: function() {}
      });

      it('VoiceInteraction::shouldActivityBeCreated is true if the call type is configured', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({call: {callType : 'TestCall'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-call-types',
            'Inbound, Outbound, Internal, Consult', 'crm-adapter').returns('OtherType, TestCall, OneMoreType');
        assert(interaction.shouldActivityBeCreated());
      }));

      it('VoiceInteraction::shouldActivityBeCreated is false if the call is monitored by current user', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({htccInteraction : {chatType : 'TestCall'}}));

        sandbox.stub(VoiceInteraction.prototype, 'isMonitoredByMe');
        VoiceInteraction.prototype.isMonitoredByMe.returns(true);

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-call-types', 'Inbound', 'crm-adapter').returns('OtherType, TestCall, OneMoreType');
        assert.isFalse(interaction.shouldActivityBeCreated());
      }));

      it('VoiceInteraction::shouldActivityBeCreated user data changes call type in case of consultation', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({call: {callType : 'TestCall'},
                                                                   userData : {IW_CallType : 'Consult'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-call-types',
            'Inbound, Outbound, Internal, Consult', 'crm-adapter').returns('OtherType, Consult, OneMoreType');
        assert(interaction.shouldActivityBeCreated());
      }));

      it('VoiceInteraction::shouldActivityBeCreated is false if the call type is not configured', injector.run([
        'configuration',
        'interactions/VoiceInteraction'
      ], function(configuration, VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({call: {callType : 'TestCall'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-call-types',
          'Inbound, Outbound, Internal, Consult', 'crm-adapter').returns('Inbound, Outbound, Internal, Consult');
        assert.isFalse(interaction.shouldActivityBeCreated());
      }));
    });

    describe('VoiceInteraction::getDisposition', function() {

      it('VoiceInteraction::getDisposition returns selectedDispositionItemId', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
            var interaction = new VoiceInteraction(new Backbone.Model({selectedDispositionItemId: 'SOME_DISPOSITION'}));
            assert.equal(interaction.getDisposition(), 'SOME_DISPOSITION');
      }));

      it('VoiceInteraction::getDisposition returns "undefined" if selectedDispositionItemId is equal to -1', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({selectedDispositionItemId: '-1'}));
        assert.isUndefined(interaction.getDisposition());
      }));

      it('VoiceInteraction::getDisposition attempts to fetch disposition from userData when selectedDispositionItemId was not detected', injector.run([
        'interactions/VoiceInteraction'
      ], function(VoiceInteraction) {
        var interaction = new VoiceInteraction(new Backbone.Model({
          selectedDispositionItemId: '-1',
          userData: {
            IWAttachedDataInformation: {
              SelectedDispositionCodeDisplayName: 'DISPOSITION_FROM_USER_DATA'
            }
          }
        }));
        assert.equal(interaction.getDisposition(), 'DISPOSITION_FROM_USER_DATA');

        interaction = new VoiceInteraction(new Backbone.Model({
          selectedDispositionItemId: '-1',
          userData: {
            IWAttachedDataInformation: {
              SelectedDispositionCodeDisplayName: 'undefined'
            }
          }
        }));
        assert.isNull(interaction.getDisposition());
      }));

    });
    describe('VoiceInteraction::updateInteractionByActivityId', function() {
        var injector = new Squire();
        injector.mock('configuration', {
            get: function() {}
        });

        it('VoiceInteraction::updateInteractionByActivityId', injector.run([
            'configuration',
            'interactions/VoiceInteraction'
        ], function(configuration, VoiceInteraction) {
            var updateUserDataStub = sandbox.stub();
            updateUserDataStub.returns({
                then: function(handler) {
                    handler();
                }
            });
            var interaction = {
                updateUserData: updateUserDataStub
            };
            var deferStub = sandbox.stub();
            var resolveStub = sandbox.stub();
            deferStub.returns({
                resolve: resolveStub,
                promise: sandbox.stub()
            });
            window.$ = {Deferred: deferStub};
            var voiceInteraction = new VoiceInteraction(interaction);
            voiceInteraction.updateInteractionByActivityId({activityId: 'OBJECT_ID'});
            assert.sinonAlwaysCalledOnceWithExactly(updateUserDataStub, {SF_started_activityId: 'OBJECT_ID'});
        }));
    });
    describe('VoiceInteraction::souldCreateActivityOnScreenPop', function() {

        it('VoiceInteraction::souldCreateActivityOnScreenPop', injector.run([
            'configuration',
            'interactions/VoiceInteraction'
        ], function(configuration, VoiceInteraction) {
            var interaction = new VoiceInteraction(new Backbone.Model({callType:'Internal', media: new Backbone.Model({name: 'voice'})}));
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('salesforce.activity-log.on-screenpop', 'false', 'crm-adapter').returns('true');
            assert.isTrue(interaction.souldCreateActivityOnScreenPop());
        }));
    });
    describe('VoiceInteraction::getSavedActivityId', function() {

        it('VoiceInteraction::getSavedActivityId', injector.run([
            'configuration',
            'interactions/VoiceInteraction'
        ], function(configuration, VoiceInteraction) {
            var interaction = new VoiceInteraction(new Backbone.Model({userData:{SF_started_activityId:1111}}));
            assert.equal(interaction.getSavedActivityId(), 1111);
        }));
    });
    describe('VoiceInteraction::getSearshObjectType', function() {

        it('VoiceInteraction::getSearshObjectType', injector.run([
            'configuration',
            'interactions/VoiceInteraction'
        ], function(configuration, VoiceInteraction) {
            var interaction = new VoiceInteraction(new Backbone.Model({callType:'Internal', media: new Backbone.Model({name: 'voice'})}));
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type', 'SOBJECT', 'crm-adapter').returns('SOBJECT');
            assert.equal(interaction.getSearshObjectType(), 'SOBJECT');
        }));
    });
    describe('VoiceInteraction::getParametrFromAttachData', function() {

        it('VoiceInteraction::getParametrFromAttachData', injector.run([
            'configuration',
            'interactions/VoiceInteraction'
        ], function(configuration, VoiceInteraction) {
            var interaction = new VoiceInteraction(new Backbone.Model({userData:{'test.param':777}}));
            assert.equal(interaction.getParametrFromAttachData('test.param'), 777);
        }));
    });
  });
});
