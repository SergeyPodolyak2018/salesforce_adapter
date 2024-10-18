define([
  'bluebird',
   'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('Lightning', function() {
    var injector = new Squire();

    injector.mock('external/sforce', {
      opencti: {
        getPageInfo: sinon.stub(),
        setSoftphonePanelVisibility: sinon.stub(),
        isInConsole: sinon.stub(),
        screenPop: sinon.stub(),
        searchAndScreenPop: sinon.stub(),
        saveLog: sinon.stub(),
        SCREENPOP_TYPE: {SOBJECT: 'SOBJECT_DUMMY'},
        CALL_TYPE: {INBOUND: 'INBOUND_DUMMY'},
        enableClickToDial: sinon.stub()
      }
    });

    injector.mock('external/genesys', {
        wwe: {
            viewManager: {
                updateLayout:sinon.stub()
            },
            configuration: {
                getAsBoolean: function() {},
                getAsString: function() {}
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

    var lightning;
    beforeEach(injector.run([
      'crm/Lightning'
    ], function(Lightning) {
      lightning = new Lightning();
    }));


    describe('lightning.setOptions', function() {

      it('lightning.setOptions returns true', injector.run([
        'crm/Lightning'
      ], function(Lightning) {
        assert.isTrue(new Lightning().setOptions());

      }));

    });
    
    describe('lightning.isInConsole', function() {

      it('lightning.isInConsole calls callback with result true', injector.run([
        'crm/Lightning'
      ], function(Lightning) {
        sandbox.stub(document, 'getElementById').returns({style : {}});
        var callbackStub = sandbox.stub();
        new Lightning().isInConsole(callbackStub);
      
        assert.sinonCalledOnceWithExactly(callbackStub, {result: true});

      }));

    });

    describe('lightning.setVisible', function() {

      it('lightning.setVisible invokes sforce.opencti.setSoftphonePanelVisibility', injector.run([
        'external/sforce'
      ], function(sforce) {
          sforce.opencti.setSoftphonePanelVisibility = sandbox.spy(function(arg) {
            arg.callback({success: true, returnValue: 'value'});
          })
          lightning.setVisible(true);
          assert.isTrue(sforce.opencti.setSoftphonePanelVisibility.args[0][0].visible);
          assert.isFunction(sforce.opencti.setSoftphonePanelVisibility.args[0][0].callback);

          sforce.opencti.setSoftphonePanelVisibility = sandbox.spy(function(arg) {
            arg.callback({success: false, errors: 'errors'});
          });
          lightning.setVisible(false);
          assert.isFalse(sforce.opencti.setSoftphonePanelVisibility.args[0][0].visible);
          assert.isFunction(sforce.opencti.setSoftphonePanelVisibility.args[0][0].callback);
      }));

    });
    
    describe('lightning.apiSaveLog', function() {

      it('lightning.apiSaveLog parses task and passes it to sforce.opencti.saveLog', injector.run([
        'external/sforce',
        'configuration'
      ], function(sforce, configuration) {
        sandbox.stub(configuration, 'get').returns('transcriptParam');
        var transcript = '';
        for (var i = 0; i < 20000; i++){
            transcript += 'a';
        }
        var callbackStub = sandbox.stub();
        lightning.apiSaveLog('CallDurationInSeconds=30&testParam=test&transcriptParam=' + transcript, callbackStub);
        assert.sinonCalledOnceWithExactly(sforce.opencti.saveLog, {value: {CallDurationInSeconds: 30, entityApiName: 'Task', testParam: 'test', transcriptParam: transcript.substring(0, 255)}, callback: callbackStub});
      }));

    });
    
    describe('lightning.apiScreenPop', function() {

      it('lightning.apiScreenPop takes objectId and passes it to sforce.opencti.screenPop', injector.run([
        'external/sforce'
      ], function(sforce) {
        var callbackStub = sandbox.stub();
        lightning.apiScreenPop('test-object', callbackStub);
        assert.sinonCalledOnceWithExactly(sforce.opencti.screenPop, {type: sforce.opencti.SCREENPOP_TYPE.SOBJECT, params: {recordId: 'test-object'}, callback: callbackStub});
      }));
    
    });
    
    describe('lightning.apiSearchAndScreenPop', function() {

      it('lightning.apiSearchAndScreenPop takes search and query params and passes it to sforce.opencti.searchAndscreenPop', injector.run([
        'external/sforce'
      ], function(sforce) {
        var callbackStub = sandbox.stub();
        lightning.apiSearchAndScreenPop('test-search', 'test-query', callbackStub);
        assert.sinonCalledOnceWithExactly(sforce.opencti.searchAndScreenPop, {searchParams: 'test-search', queryParams: 'test-query', callType: sforce.opencti.CALL_TYPE.INBOUND, callback: callbackStub});
      }));
      
    });
    
    describe('lightning.apiEnableClickToDial', function() {

      it('lightning.apiEnableClickToDial calls sforce.opencti.enableClickToDial', injector.run([
        'external/sforce'
      ], function(sforce) {
        var callbackStub = sandbox.stub();
        lightning.apiEnableClickToDial(callbackStub);
        assert.sinonCalledOnceWithExactly(sforce.opencti.enableClickToDial, {callback: callbackStub});
      }));
      
    });
    
    describe('lightning.apiOnClickToDial', function() {

      it('lightning.apiOnClickToDial calls sforce.opencti.onClickToDial with wrapped callback', injector.run([
        'external/sforce'
      ], function(sforce) {
        var callbackStub = sandbox.stub();
        sforce.opencti.onClickToDial = function(params) {params.listener('test-payload')};
        lightning.apiOnClickToDial(callbackStub);
        assert.sinonCalledOnceWithExactly(callbackStub, {result: 'test-payload'});
      }));
      
    });
    
    describe('lightning.apiGetPageInfo', function() {

        it('lightning.apiGetPageInfo calls sforce.opencti.getAppViewInfo with wrapped callback iteraction not exist', injector.run([
          'external/sforce'
        ], function(sforce) {
          var callbackStub = sandbox.stub();
          sforce.opencti.getAppViewInfo = function(params) {params.callback('test-payload')};
          lightning.apiGetPageInfo(undefined,callbackStub);
          assert.sinonCalledOnceWithExactly(callbackStub, {result: undefined});
        }));


        it('sforce.opencti.getAppViewInfo wrapped callback converts returnValue to old style', injector.run([
          'external/sforce'
        ], function(sforce) {
          var callbackStub = sandbox.stub();
          sforce.opencti.getAppViewInfo = function(params) {params.callback({returnValue: {recordId: 'test-id', objectType: 'test-object'}})};
          lightning.apiGetPageInfo(undefined,callbackStub);
          assert.sinonCalledOnceWithExactly(callbackStub, {result: {objectId: 'test-id', recordId: 'test-id', objectType: 'test-object', object: 'test-object'}});
        }));

        it('lightning.apiGetPageInfo calls sforce.opencti.getAppViewInfo with wrapped callback iteraction exist', injector.run([
            'external/sforce'
        ], function(sforce) {
            var callbackStub = sandbox.stub();
            sforce.opencti.searchAndScreenPop = function(params) {params.callback({returnValue: {recordId: 'test-id', objectType: 'test-object'}})};
            lightning.searchObjectGenerator = function(param, logic) {return {search:'search', url:'url',}};
            lightning.apiGetPageInfo(undefined,callbackStub);
            assert.sinonCalledOnceWithExactly(callbackStub, {result: {objectId: 'test-id', recordId: 'test-id', objectType: 'test-object', object: 'test-object'}});
        }));

      });


    describe('Lightning::getResources', function() {

      it('Salesforce::getResources returns an list of specific resources', injector.run([
        'crm/Lightning'
      ], function(Lightning) {
        assert.deepEqual(new Lightning().getResources(), [
            'lightning_integration'
          ]
        );
      }));
    });

      describe('Lightning.getTask', function() {

          var injector = new Squire();
          // injector.mock('external/genesys', {
          //     wwe: {
          //         configuration: {
          //             getAsString: function() {},
          //             getAsBoolean: function() {}
          //         }
          //     }
          // });

          injector.mock('configuration',  {
              get: function() {}
          });

          it('Lightning.getTask pageIngo.object == "Contact" => *WhoId=*', injector.run([
              'utils',
              'interactions/VoiceInteraction',
              'configuration',
              'external/genesys',
          ], function(utils, VoiceInteraction,Configuration,genesys) {
              // sandbox.stub(genesys.wwe.configuration, 'getAsString');
              // genesys.wwe.configuration.getAsString.withArgs('salesforce.activity-log.status', 'Completed', 'crm-adapter').returns('Completed');



              var interaction = new Backbone.Model({});
              interaction.updateUserData = function() {};
              interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};
              // interaction.getSavedActivityId = function() {return null};
              var voiceInteraction = new VoiceInteraction(interaction);
              sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
              sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');
              sandbox.stub(voiceInteraction, 'shouldSaveLog').returns(true);
              sandbox.stub(voiceInteraction, 'getSavedActivityId').returns(null);

              var pageInfo = {
                  object: 'Contact',
                  objectId: 'CONTACT ID!',
                  SCREEN_POP_DATA:{
                      params:{
                          recordId:'test'
                      }
                  },
                  test:{
                      RecordType:'Contact',
                      Id:'CONTACT ID!'
                  }
              };

              var task = lightning.getTask(voiceInteraction, pageInfo);
              var checkFragment = 'WhoId=' + encodeURIComponent('CONTACT ID!') + '&';
              assert.include(task,  checkFragment);
          }));

          it('Lightning.getTask pageIngo.object == "Lead" => *WhoId=*', injector.run([
              'utils',
              'interactions/VoiceInteraction'
          ], function(utils, VoiceInteraction) {

              var interaction = new Backbone.Model({});
              interaction.updateUserData = function() {};
              interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};

              var voiceInteraction = new VoiceInteraction(interaction);
              sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
              sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');
              sandbox.stub(voiceInteraction, 'shouldSaveLog').returns(true);
              sandbox.stub(voiceInteraction, 'getSavedActivityId').returns(null);
              var pageInfo = {
                  SCREEN_POP_DATA:{
                      params:{
                          recordId:'test'
                      }
                  },
                  test:{
                      RecordType:'Lead',
                      Id:'LEAD ID!'
                  }
              };
              var task = lightning.getTask(voiceInteraction, pageInfo);
              var checkFragment = 'WhoId=' + encodeURIComponent('LEAD ID!') + '&';
              assert.include(task,  checkFragment);
          }));

          it('Lightning.getTask pageIngo.object == * => *WhatId=*', injector.run([
              'utils',
              'interactions/VoiceInteraction'
          ], function(utils, VoiceInteraction) {

              var interaction = new Backbone.Model({});
              interaction.updateUserData = function() {};
              interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};

              var voiceInteraction = new VoiceInteraction(interaction);
              sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
              sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');
              sandbox.stub(voiceInteraction, 'shouldSaveLog').returns(true);
              sandbox.stub(voiceInteraction, 'getSavedActivityId').returns(null);
              var pageInfo = {
                  SCREEN_POP_DATA:{
                      params:{
                          recordId:'test'
                      }
                  },
                  test:{
                      RecordType:'Whatever',
                      Id:'WHATEVER ID!'
                  }
              };
              var task = lightning.getTask(voiceInteraction, pageInfo);
              var checkFragment = 'WhatId=' + encodeURIComponent('WHATEVER ID!') + '&';
              assert.include(task,  checkFragment);
          }));

      });



  });
});
