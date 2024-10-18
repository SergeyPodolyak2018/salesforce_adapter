define([
  'bluebird',
  'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('zendesk', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('Zendesk::onInteractionScreenPop', function() {
        var zafClient;
        beforeEach(injector.run([
          'utils',
          'crm/Zendesk'
        ], function(utils, Zendesk) {
          sandbox.stub(utils, 'preprocessANI').returns('5005');
          var zendesk = new Zendesk();
          zafClient = {
            postMessage: sandbox.stub(),
            on: sandbox.stub()
          }
          zendesk.setZafClient(zafClient);
        }));

      it('Zendesk.screenPop - id_ticket', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');

        var zendesk = new Zendesk();
        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var interactionProperties = {
          'userData' : {_id_1 : 'value1'}
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['id_ticket'], 'value1', 'searchAndScreenPop should be called with the provided id.');
      }));


      it('Zendesk.screenPop - id_user', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');

        var zendesk = new Zendesk();
        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var interactionProperties = {
          'userData' : {_id_user : 'value1'}
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['id_user_'], 'value1', 'searchAndScreenPop should be called with the provided id.');
      }));


      it('Zendesk.screenPop - cti_ screenpop.include-ani-in-search is true with ani', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {

        var zendesk = new Zendesk();
        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var interactionProperties = {
          'userData' : {cti_name : 'value1'},
          'ani': '5005'
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');




        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_name'], 'value1', 'searchAndScreenPop should be called with the provided id.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_phone'], '5005', 'ani should be included as cti_phone.');
      }));


      it('Zendesk.screenPop - cti_ screenpop.include-ani-in-search is true key with undefined value', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {


        var zendesk = new Zendesk();
        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var value;
        var interactionProperties = {
          'userData' : {cti_name : value},
          'ani': '5005'
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert(_.isEmpty(searchAndScreenPopStub.args[0][0]['cti_name']), 'undefined value should be skipped.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_phone'], '5005', 'ani should be included as cti_phone.');
      }));



      it('Zendesk.screenPop - cti_ screenpop.include-ani-in-search is true with party data', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {


        var zendesk = new Zendesk();

        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var party = new Backbone.Model({name: '5005'});

        var parties = new Backbone.Collection();
        parties.add(party);
        var interactionProperties = {
          'userData' : {cti_name : 'value1'},
          'parties': parties
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_name'], 'value1', 'searchAndScreenPop should be called with the provided id.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_phone'], '5005', 'ani should be included as cti_phone.');
      }));

      it('Zendesk.screenPop - cti_ screenpop.include-ani-in-search is true but no party data', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {


        var zendesk = new Zendesk();

        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var interactionProperties = {
          'userData' : {cti_name : 'v3'}
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_name'], 'v3', 'searchAndScreenPop should be called with the provided cti param.');
      }));


      it('Zendesk.screenPop - cti_ screenpop.include-ani-in-search is false', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {

        var zendesk = new Zendesk();
        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');
        var party = new Backbone.Model({name: '5005'});

          var party = new Backbone.Model({name: '5005'});

        var parties = new Backbone.Collection();
        parties.add(party);

        var interactionProperties = {
          'userData' : {cti_name : 'value1'},
          'parties': parties
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('false');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');

        zendesk.onInteractionScreenPop(interaction);

        assert(searchAndScreenPopStub.calledOnce, 'searchAndScreenPop should be called.');
        assert.equal(searchAndScreenPopStub.args[0][0]['cti_name'], 'value1', 'searchAndScreenPop should be called with the provided id.');
        assert(_.isEmpty(searchAndScreenPopStub.args[0][0]['cti_phone']), 'ani should be included as cti_phone.');
      }));

      it('Zendesk.screenPop - no screen pop keys', injector.run([
        'crm/Zendesk',
        'configuration',
        'interactions/VoiceInteraction'
      ], function(Zendesk, configuration, VoiceInteraction) {


        var zendesk = new Zendesk();

        var searchAndScreenPopStub = sandbox.stub(zendesk, 'searchAndScreenPop');

        var interactionProperties = {
          'userData' : {}
        };

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('false');


        zendesk.onInteractionScreenPop(interaction);

        assert.equal(searchAndScreenPopStub.callCount, 1, 'searchAndScreenPop should be called.');
      }));

    });

    describe('Zendesk::searchAndScreenPop', function() {

      it('Zendesk.searchAndScreenPop', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var zafClient = {
          postMessage: sandbox.stub(),
          on         : sandbox.stub()
        };
        zendesk.setZafClient(zafClient);


        var data = {};
        var callback = sandbox.stub();
        zendesk.searchAndScreenPop(data, callback);

        assert(zafClient.postMessage.callCount, 2, 'postMessage should be called 2 times.');
      }));

      it('Zendesk.searchAndScreenPop - no data', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        zendesk.setZafClient(zafClient);

        var data;
        var callback = sandbox.stub();
        zendesk.searchAndScreenPop(data, callback);

        assert.equal(zafClient.postMessage.callCount, 1, 'postMessage should be called once.');
      }));

      it('Zendesk.searchAndScreenPop - no callback', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        zendesk.setZafClient(zafClient);

        var data = {};
        var callback;
        zendesk.searchAndScreenPop(data, callback);

        assert.equal(zafClient.postMessage.callCount, 2, 'postMessage should be called 2 times.');
      }));

      it('Zendesk.searchAndScreenPop - callNumber > 0', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        zendesk.setZafClient(zafClient);

        var data = { callNumber: 1};
        var callback = sandbox.stub();
        zendesk.searchAndScreenPop(data, callback);

        assert.equal(zafClient.postMessage.callCount, 1, 'postMessage should called once');
      }));
    });


    describe('Zendesk::onInteractionCanceled', function() {

      it('Zendesk.onNewInteraction', injector.run([
        'crm/Zendesk',
        'interactions/VoiceInteraction'
      ], function(Zendesk, VoiceInteraction) {

        var zendesk = new Zendesk();

        var interactionProperties = {
          'userData' : {id_1 : 'value1'},
          'call'     : {}
        };

        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        zendesk.setZafClient(zafClient);

        var onInteractionCanceledSpy = sandbox.spy(zendesk, 'onInteractionCanceled');

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        zendesk.onInteractionCanceled(interaction);
        assert.equal(onInteractionCanceledSpy.callCount, 1, 'onInteractionCanceledSpy should be called one time');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should be called 2 times');


      }));
    });


    describe('Zendesk::onInteractionAdded', function() {

      it('Zendesk.onNewInteraction', injector.run([
        'crm/Zendesk',
        'interactions/VoiceInteraction'
      ], function(Zendesk, VoiceInteraction) {

        var zendesk = new Zendesk();

        var interactionProperties = {
          'userData' : {id_1 : 'value1'},
          'call'     : {}
        };

        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        zendesk.setZafClient(zafClient);

        var onNewInteractionStub = sandbox.spy(zendesk, 'onInteractionAdded');

        var originalInteraction = new Backbone.Model(interactionProperties);
        var interaction = new VoiceInteraction(originalInteraction);

        zendesk.onInteractionAdded(interaction);
        assert.equal(onNewInteractionStub.callCount, 1, 'onNewInteraction should be called one time');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should be called 2 times');


        originalInteraction.unset('call');
        zendesk.onInteractionAdded(interaction);
        assert.equal(onNewInteractionStub.callCount, 2, 'onNewInteractionStub should be called twice');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should be called 2 times');

      }));
    });

    describe('zendesk::onMarkDone', function() {

      it('Zendesk.onMarkDone', injector.run([
        'crm/Zendesk',
        'interactions/VoiceInteraction'
      ], function(Zendesk, VoiceInteraction) {

        var zendesk = new Zendesk();

        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        var saveActivityForInteractionStub = sandbox.spy(zendesk, 'saveActivityForInteraction');


        var interactionProperties = {
          title    : 'title',
          comment : 'note',
          call     : {
            callType   : 'callType',
            duration   : 'duration',
            callUuid   : 'callUuid'
          }
        };


        var originalInteraction = Backbone.Model.extend({
          defaults: interactionProperties,
          getOrigin : sandbox.stub()
        })

        var voiceInteraction = new originalInteraction();

        var interaction = new VoiceInteraction(voiceInteraction);



        sandbox.stub(interaction, 'getTitle').returns('someTitle');



        zendesk.setZafClient(zafClient);
        zendesk.onMarkDone(interaction);

        assert.equal(saveActivityForInteractionStub.callCount, 1, 'zendesk.saveActivityForInteraction should be called once');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should be called 2 times');

      }));


    });

    describe('Zendesk::saveActivityForInteraction', function() {

      it('Zendesk::saveActivityForInteraction none-empty', injector.run([
        'utils',
        'crm/Zendesk',
        'interactions/VoiceInteraction'
      ], function(utils, Zendesk, VoiceInteraction) {

        var zendesk = new Zendesk();

        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        var saveActivityForInteractionStub = sandbox.spy(zendesk, 'saveActivityForInteraction');
        var storeCallbackStub              = sandbox.stub(zendesk, 'storeCallback');

        var interactionProperties = {
          title    : 'title',
          callNote : 'callNote',
          selectedDispositionItemId : 'dispositionID',
          call     : {
            callType : 'callType',
            duration : 'duration',
            callUuid : 'callUuid'
          }
        };

        var originalInteraction = Backbone.Model.extend({
          defaults: interactionProperties,
          getOrigin : sandbox.stub()
        })

        var voiceInteraction = new originalInteraction();

        var interaction = new VoiceInteraction(voiceInteraction);


        zendesk.setZafClient(zafClient);
        zendesk.saveActivityForInteraction(interaction);

        assert.equal(saveActivityForInteractionStub.callCount, 1, 'zendesk.saveActivityForInteraction should be called once');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should be called 2 times');
        assert.equal(storeCallbackStub.callCount, 1, 'storeCallbackStub should be called once');

      }));


      it('Zendesk::saveActivityForInteraction empty title, callNote, selectedDispositionItemId', injector.run([
        'utils',
        'crm/Zendesk',
        'interactions/VoiceInteraction'
      ], function(utils, Zendesk, VoiceInteraction) {

        var zendesk = new Zendesk();

        var zafClient = {
          postMessage: sandbox.stub(),
          on: sandbox.stub()
        };
        var saveActivityForInteractionStub = sandbox.spy(zendesk, 'saveActivityForInteraction');

        var interactionProperties = {
          title    : '',
          callNote : '',
          selectedDispositionItemId : '',
          call     : {
            callType : 'callType',
            duration : 'duration',
            callUuid : 'callUuid'
          }
        };

        var originalInteraction = Backbone.Model.extend({
          defaults: interactionProperties,
          getOrigin : sandbox.stub()
        })

        var voiceInteraction = new originalInteraction();

        var interaction = new VoiceInteraction(voiceInteraction);


        zendesk.setZafClient(zafClient);
        zendesk.saveActivityForInteraction(interaction);

        assert.equal(saveActivityForInteractionStub.callCount, 1, 'zendesk.saveActivityForInteraction should be called once');
        assert.equal(zafClient.postMessage.callCount, 2, 'zafClient.postMessage should called 2 times');

      }));


    });

    describe('Zendesk::setOptions', function() {
      it('Zendesk.setOptions - registerZafClient', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {
        var zendesk = new Zendesk();
        var registerZafClientStub = sandbox.stub(zendesk, 'registerZafClient');
        zendesk.setOptions();

        assert(registerZafClientStub.calledOnce, 'registerZafClientStub should be called.');

      }));
    });

    describe('Zendesk::setZafClient', function() {

      it('Zendesk.setZafClient', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();

        var zafClient = {
          on         : sandbox.stub(),
          postMessage: sandbox.stub()
        };

        var saveConfirmationSpy = sandbox.stub(zendesk, 'saveConfirmation');
        var onClickToDialSpy    = sandbox.stub(zendesk, 'onClickToDial');

        zendesk.setZafClient(zafClient);
        assert.equal(zafClient.on.callCount, 2, 'zafClient.on should be called once');


        zafClient.on.yield({action:'INSERT'});
        assert.equal(saveConfirmationSpy.callCount, 1, 'zafClient.saveConfirmation should be called once');

        zafClient.on.yield({action:'DIAL'});
        assert.equal(onClickToDialSpy.callCount, 1, 'zafClient.onClickToDialSpy should be called once');

        zafClient.on.yield({});
        assert.equal(onClickToDialSpy.callCount, 1, 'zafClient.onClickToDialSpy should not be called');
        assert.equal(saveConfirmationSpy.callCount, 1, 'zafClient.onClickToDialSpy should not be called');

      }));
    });

    describe('Zendesk::createTarget', function() {

      it('Zendesk.registerZafClient', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var setDestinationStub = sandbox.stub();

        var genesys = {
          wwe: {
            Main: {
              CustomContact: function () {}
            }
          }
        }

        window.genesys = genesys;
        window.genesys.wwe.Main.CustomContact.prototype.setDestination = setDestinationStub;

        var zendesk = new Zendesk();

        zendesk.createTarget();

        assert.equal(setDestinationStub.callCount, 1, 'setDestinationStub should be called once');
      }));
    });

    describe('Zendesk::saveConfirmation', function() {

      it('Zendesk.saveConfirmation', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var callbackStub = sandbox.stub().returns(Promise.resolve());



        zendesk.zendeskCallBacks = {
          'sig1' : callbackStub
        }

        zendesk.saveConfirmation({sig : 'sig1', result : ''});

        assert.equal(callbackStub.callCount, 1, 'callbackStub should be called');
        assert.equal(zendesk.zendeskCallBacks['sig1'], undefined, 'the callback should not be present afterwards');

      }));
    });


    describe('Zendesk::storeCallBack', function() {

      it('Zendesk.storeCallBack', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();


        zendesk.zendeskCallBacks = {};

        zendesk.storeCallback('sig1', {});

        assert.deepEqual(zendesk.zendeskCallBacks['sig1'], {}, 'the callback should be present');

      }));
    });

    describe('Zendesk::onClickToDial', function() {
      var sanitizePhoneNumberStub;
      var preprocessPhoneNumberStub;
      var executeStub;
      var media;
      var getAgentStub;

      // TODO (shabunc): report a but to eslint team, this variable is IS used
      console.log(getAgentStub);

      beforeEach(injector.run([
        'utils',
        'desktopApi'
      ], function(utils, desktopApi) {

        sanitizePhoneNumberStub = sandbox.stub(utils, 'sanitizePhoneNumber').returns('sanitized');
        preprocessPhoneNumberStub = sandbox.stub(utils, 'preprocessPhoneNumber').returns('processed');
        executeStub = sandbox.stub();

        var commandManager = {
          execute: executeStub
        };

        sandbox.stub(desktopApi, 'getCommandManager').returns(commandManager);

        var mediaList = new Backbone.Collection();
        media = new Backbone.Model({name: 'voice'});
        mediaList.add(media);

        var agent = new Backbone.Model({mediaList: mediaList});

        getAgentStub = sandbox.stub(desktopApi, 'getAgent').returns(agent);
      }));

      it('Zendesk.onClickToDial - valid number', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();

        var target = new Backbone.Model();
        var createTargetStub = sandbox.stub(zendesk, 'createTarget').returns(target);
        var number = '5005';
        zendesk.onClickToDial(number);

        assert(sanitizePhoneNumberStub.calledOnce, 'sanitizePhoneNumber should be called');
        assert.equal(sanitizePhoneNumberStub.args[0][0], '5005', 'phone number should be passed to sanitizePhoneNumber');
        assert(preprocessPhoneNumberStub.calledOnce, 'preprocessPhoneNumber should be called');
        assert.equal(preprocessPhoneNumberStub.args[0][0], 'sanitized', 'sanitized phone number should be passed to preprocessPhoneNumber');
        assert(createTargetStub.calledOnce, 'create target should be called once');
        assert.equal(createTargetStub.args[0][0], 'processed', 'Target should be created with the processed number');
        assert(executeStub.calledOnce, 'executeStub should be called');
        assert.equal(executeStub.args[0][0], 'MediaVoiceCall', 'Command name should be MediaVoiceCall');
        assert.equal(executeStub.args[0][1].destination, 'processed', 'Processed phone number should be passed to command.');
        assert.equal(executeStub.args[0][1].media, 'voice', 'Voice media should be passed to command.');
        assert.equal(executeStub.args[0][1].target, target, 'target should be passed to command.');
      }));

      it('Zendesk.onClickToDial - no voice media', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();

        media.set('name', 'email');
        var target = new Backbone.Model();
        var createTargetStub = sandbox.stub(zendesk, 'createTarget').returns(target);
        var number = '5005';
        zendesk.onClickToDial(number);

        assert.equal(sanitizePhoneNumberStub.callCount, 0, 'sanitizePhoneNumber should not be called');
        assert.equal(preprocessPhoneNumberStub.callCount, 0,  'preprocessPhoneNumber should not be called');
        assert.equal(createTargetStub.callCount, 0, 'create target should be called once');
        assert.equal(executeStub.callCount, 0, 'executeStub should not be called');
      }));
    });

    describe('Zendesk::registerZafClient', function() {

      it('Zendesk.registerZafClient', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var zendesk = new Zendesk();
        var setZafClientStub     = sandbox.stub(zendesk, 'setZafClient');
        var registerZafClientSpy = sandbox.spy(zendesk, 'registerZafClient');

        window.ZAFClient = { init : function(){}};
        zendesk.registerZafClient(0);
        assert.equal(setZafClientStub.callCount, 1, 'Zendesk.setZafClientStub should be called once');

        delete window['ZAFClient'];
        zendesk.registerZafClient(99);

        assert.equal(registerZafClientSpy.callCount, 2, 'Zendesk.setZafClientStub should not be called');

        zendesk.registerZafClient(101);
        assert.equal(registerZafClientSpy.callCount, 3, 'Zendesk.setZafClientStub should not be called');

      }));
    });

    describe('Zendesk::getResources', function() {

      it('Zendesk::getResources returns an list of specific resources', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {
        assert.deepEqual(new Zendesk().getResources(), [
            'zendesk_integration'
          ]
        );
      }));
    });

    describe('zendesk::isInConsole', function() {

      it('zendesk::isInConsole calls callback with result = true', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        var stub = sandbox.stub();
        new Zendesk().isInConsole(stub);

        assert.sinonAlwaysCalledOnceWithExactly(stub, {result: true});
      }));

      it('zendesk::isInConsole does nothing if called without callback', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {

        new Zendesk().isInConsole();

      }));
    });

    describe('Zendesk.getObjectId', function() {

      it('Zendesk.getObjectId fetches first key from field which starts with regexp from screenpop.id-key-regex', injector.run([
        'crm/Zendesk',
        'configuration'
      ], function(Zendesk, configuration) {

        var zendesk = new Zendesk();
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('debug$');

        assert.equal(zendesk.getObjectId({record_debug: '00324000005qIFb'}), 'record_debug', 'record_debug not found');
        assert.equal(zendesk.getObjectId({whatever_debug: '00324034005qIFb'}), 'whatever_debug', 'nid_whatever not found');
        assert.isUndefined(zendesk.getObjectId({nid_whatever: '00324034005qIFb'}), 'nid_whatever should not be found');
      }))

      it('zendesk.getObjectId uses ^id_ for default screenpop.id-key-regex even if blank option defined.', injector.run([
        'crm/Zendesk',
        'configuration'
      ], function(Zendesk, configuration) {
        var zendesk = new Zendesk();
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('');

        assert.equal(zendesk.getObjectId({id_object: '00324000005qIFb'}), 'id_object', 'id not found');
      }))

    });

    describe('Zendesk.getSearchExpression', function() {

      it('Zendesk.getSearchExpression fetches first key from field which starts with regexp from screenpop.id-key-regex', injector.run([
        'crm/Zendesk',
        'configuration'
      ], function(Zendesk, configuration) {

        var zendesk = new Zendesk();
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('debug$');

        assert.equal(zendesk.getSearchExpression({record_debug: '00324000005qIFb'})[0], 'record_debug', 'record_debug not found');
        assert.equal(zendesk.getSearchExpression({whatever_debug: '00324034005qIFb'})[0], 'whatever_debug', 'nid_whatever not found');
        assert.equal(zendesk.getSearchExpression({nid_whatever: '00324034005qIFb'}).length, 0, 'nid_whatever should not be found');
      }))

      it('zendesk.getObjectId uses ^id_ for default screenpop.id-key-regex even if blank option defined.', injector.run([
        'crm/Zendesk',
        'configuration'
      ], function(Zendesk, configuration) {
        var zendesk = new Zendesk();
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('');

        assert.equal(zendesk.getSearchExpression({cti_object: '00324000005qIFb'})[0], 'cti_object', 'id not found');
      }))

    });

    describe('zendesk.updateDataForTransfer', function() {
      it('zendesk.updateDataForTransfer returns true-promise', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {
          var zendesk = new Zendesk();
          return zendesk.updateDataForTransfer().then(function(result) {
              return assert.isTrue(result)
          }, function() {
              return assert.isImpossible();
          })
      }))
    });

    describe('zendesk.getPageInfo', function() {
      it('zendesk.getPageInfo returns true-promise', injector.run([
        'crm/Zendesk'
      ], function(Zendesk) {
          var zendesk = new Zendesk();
          return zendesk.getPageInfo().then(function(pageInfo) {
              return assert.isTrue(pageInfo)
          }, function() {
              return assert.isImpossible();
          })
      }))
    })



  });
});
