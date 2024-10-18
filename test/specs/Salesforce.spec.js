define([
  'bluebird',
   'backbone',
  'Squire',

], function(Promise, Backbone, Squire) {
  'use strict';

  describe('Salesforce', function() {
    var injector = new Squire();

    injector.mock('external/sforce', {
      interaction: {
        getPageInfo: sinon.stub(),
        setVisible: sinon.stub(),
        checkVisible: sinon.stub(),
        isInConsole: sinon.stub(),
        screenPop: sinon.spy(function(url, force, handler) {
          handler();
        }),
        searchAndScreenPop: sinon.stub()
      },
      console: {
        setCustomConsoleComponentPopoutable: sinon.spy(function(enabled, handler) {
          handler({result: '{"some": {"valid": "json"}}'});
        }),
        setCustomConsoleComponentButtonText: sinon.spy(function(text, handler) {
          handler({result: '{"some": {"valid": "json"}}'});
        })
      }
    });

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    var salesforce;
    beforeEach(injector.run([
      'crm/Salesforce'
    ], function(Salesforce) {
      salesforce = new Salesforce();
    }));

    describe('salesforce.isInConsole', function () {

      it('salesforce.isInConsole passes call to native salesforce object', injector.run([
        'external/sforce'
      ], function(sforce) {
        salesforce.isInConsole('CALLBACK');

        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.isInConsole, 'CALLBACK');
      }));
    });


    describe('salesforce.onInteractionScreenPop invokes resolveScreenPop', function () {

      it('salesforce.onInteractionScreenPop invokes resolveScreenPop', injector.run([], function () {
        sandbox.stub(salesforce, 'resolveScreenPop');
        salesforce.onInteractionScreenPop({some: 'INTERACTION'});

        assert.sinonAlwaysCalledOnceWithExactly(salesforce.resolveScreenPop, {some: 'INTERACTION'});
      }));
    });

    describe('salesforce.onInteractionAdded invokes setVisible', function () {

      it('salesforce.onInteractionAdded invokes setVisible', injector.run([], function () {
        sandbox.stub(salesforce, 'setVisible');
        salesforce.onInteractionAdded({some: 'INTERACTION'});

        //assert.sinonAlwaysCalledOnceWithExactly(salesforce.setVisible, true);
        assert.sinonAlwaysCalledOnceWithExactly(salesforce.setVisible,true);
      }));
    });

    describe('salesforce.onInteractionCanceled does nothing', function () {

      it('salesforce.onInteractionCanceled does nothing', injector.run([], function () {

        salesforce.onInteractionCanceled({some: 'INTERACTION'});

      }));
    });

    describe('salesforce.onMarkDone invokes saveLog', function () {

      it('salesforce.onMarkDone invokes saveLog', injector.run([], function () {
        sandbox.stub(salesforce, 'saveLog');
        salesforce.onMarkDone({some: 'INTERACTION'});

        assert.sinonAlwaysCalledOnceWithExactly(salesforce.saveLog, {some: 'INTERACTION'});
      }));
    });

    describe('salesforce.saveLog', function() {

      it('salesforce.saveLog fetches page info data and pass it to onLogdataResolved', injector.run([

      ], function() {
        sandbox.stub(salesforce, 'getPageInfo').returns({
          then: function(handler) {
            handler({pageInfo: 'data'})
          }
        });

        sandbox.stub(salesforce, 'onLogdataResolved');

        salesforce.saveLog({specific: 'interaction'});
        assert.sinonAlwaysCalledOnceWithExactly(salesforce.getPageInfo,{specific: 'interaction'});
        assert.sinonAlwaysCalledOnceWithExactly(salesforce.onLogdataResolved, {specific: 'interaction'}, {pageInfo: 'data'});
      }));

    });

    describe('salesforce.getObjectId', function() {

      it('salesforce.getObjectId fetches first value from field which starts with regexp from screenpop.id-key-regex', injector.run([
        'configuration'
      ], function(configuration) {
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('debug$');

        assert.equal(salesforce.getObjectId({record_debug: '00324000005qIFb'}), '00324000005qIFb', 'record_debug not found');
        assert.equal(salesforce.getObjectId({whatever_debug: '00324034005qIFb'}), '00324034005qIFb', 'nid_whatever not found');
        assert.isUndefined(salesforce.getObjectId({nid_whatever: '00324034005qIFb'}), 'nid_whatever should not be found');
      }))

      it('salesforce.getObjectId uses ^id_ for default screenpop.id-key-regex even if blank option defined.', injector.run([
        'configuration'
      ], function(configuration) {
        var configurationStub = sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('');

        assert.equal(salesforce.getObjectId({id_object: '00324000005qIFb'}), '00324000005qIFb', 'id not found');
      }))

    });

    describe('saleforce.getPageInfo resolved', function() {

      var injector   = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          getPageInfo: function(callback) {
              callback({result: '{"pageInfo": {"fetched": true}}'});
          }
        }
      });

     /* it('saleforce.getPageInfo should invoke sforce.interaction.getPageInfo and to be resolved with data.result', injector.run([
         'crm/Salesforce'
      ], function(Salesforce){
        return new Salesforce().getPageInfo().then(function(pageData) {
          assert.deepEqual(pageData, {pageInfo: {fetched: true}});
        })
      }));*/

    });

    describe('saleforce.getPageInfo rejected', function() {

      var injector   = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          getPageInfo: function(callback) {
            callback({rezult: '{"pageInfo": {"fetched": true}}'});
          }
        }
      });

      /*it('saleforce.getPageInfo should invoke sforce.interaction.getPageInfo and to be rejected when no result was found', injector.run([
        'crm/Salesforce'
      ], function(Salesforce){
        return new Salesforce().getPageInfo().then(function() {
          // this is intentionally wrong, we should never get here in this specific test
          // if, say, we are in success then branch and no false assertions are made, we just won't notice that tests are unintentionally skipped
          assert.isTrue(false)
        }, function(pageData) {
          assert.equal(pageData, 'NO_RESULT');
        })
      }));*/

    });

    describe('salesforce.setOptions', function() {

      var injector = new Squire();

      injector.mock('external/sforce', {
        console: {
          setCustomConsoleComponentPopoutable: function(enabled, handler) {
            handler({result: '{"some": {"valid": "json"}}'});
          },
          setCustomConsoleComponentButtonText: function(text, handler) {
            handler({result: '{"some": {"valid": "json"}}'});
          }
        }
      });

      it('salesforce.setOptions calls sforce.console methods', injector.run([
        'crm/Salesforce',
        'external/sforce'
      ], function(Salesforce, sforce) {
          sandbox.spy(sforce.console, 'setCustomConsoleComponentPopoutable');
          sandbox.spy(sforce.console, 'setCustomConsoleComponentButtonText');
          var setOptionsResult = new Salesforce().setOptions();
          assert.isTrue(setOptionsResult);

          assert.sinonCalledOnceWithExactly(sforce.console.setCustomConsoleComponentPopoutable, true, sinon.match.func);
          assert.sinonCalledOnceWithExactly(sforce.console.setCustomConsoleComponentButtonText, 'Workspace', sinon.match.func);


      }));

      it('salesforce.setOptions call catches setCustomConsoleComponentPopoutable', injector.run([
        'crm/Salesforce',
        'external/sforce'
      ], function(Salesforce, sforce) {
        sandbox.stub(sforce.console, 'setCustomConsoleComponentPopoutable').throws('POPOUTABLE_ERROR');
        sandbox.stub(sforce.console, 'setCustomConsoleComponentButtonText');

        assert.isFalse(new Salesforce().setOptions());
      }));

      it('salesforce.setOptions call catches setCustomConsoleComponentButtonText', injector.run([
        'crm/Salesforce',
        'external/sforce'
      ], function(Salesforce, sforce) {

        sandbox.stub(sforce.console, 'setCustomConsoleComponentPopoutable');
        sandbox.stub(sforce.console, 'setCustomConsoleComponentButtonText').throws('BUTTONTEXT_ERROR');

        assert.isFalse(new Salesforce().setOptions());

      }));

    });

    describe('salesforce.setVisible', function() {

      it('salesforce.setVisible invokes sforce.interaction.setVisible', injector.run([
        'external/sforce'
      ], function(sforce) {
          salesforce.setVisible(true);
          assert.sinonCalledOnceWithExactly(sforce.interaction.setVisible, true);

          salesforce.setVisible(false);
          assert.sinonCalledOnceWithExactly(sforce.interaction.setVisible, false);
      }));

    });

    describe('salesforce.resolveScreenPop', function () {

      it('salesforce.resolveScreenPop invokes sforce.interaction.screenPop if specific object id has been found', injector.run([
        'interactions/VoiceInteraction',
        'external/sforce'
      ], function (VoiceInteraction, sforce) {
        sandbox.stub(salesforce, 'getObjectId');
        sandbox.stub(salesforce, 'saveLogOnScreenPop');
        salesforce.getObjectId.withArgs({'id_record': 'ID_RECORD'}).returns('ID_RECORD');

        salesforce.resolveScreenPop(new VoiceInteraction(new Backbone.Model({userData: {'id_record': 'ID_RECORD'}})));


        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.screenPop, 'ID_RECORD', true, sinon.match.func);
      }));

      it('salesforce.resolveScreenPop invokes sforce.interaction.screenPop if specific object id has not been found', injector.run([
        'interactions/VoiceInteraction'
      ], function (VoiceInteraction) {
        sandbox.stub(salesforce, 'getObjectId');
        sandbox.stub(salesforce, 'searchAndScreenPop');
        salesforce.getObjectId.withArgs({'id_record': 'ID_RECORD'}).returns(false);

        var interaction = new VoiceInteraction(new Backbone.Model({userData: {'id_record': 'ID_RECORD'}}));
        sandbox.stub(interaction, 'getSearshObjectType').returns('SOBJECT');
        salesforce.resolveScreenPop(interaction);

        assert.sinonAlwaysCalledOnceWithExactly(salesforce.searchAndScreenPop, interaction);
      }));


    });

    describe('salesforce.getTask', function() {

      var injector = new Squire();

      injector.mock('configuration',  {
        get: function() {}
      });

      it('salesforce.getTask pageIngo.object == "Contact" => *WhoId=*', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        var interaction = new Backbone.Model({});
        interaction.updateUserData = function() {};
        interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};

        var voiceInteraction = new VoiceInteraction(interaction);
        sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
        sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');

        var task = salesforce.getTask(voiceInteraction, {object: 'Contact', objectId: 'CONTACT ID!'});
        var checkFragment = 'WhoId=' + encodeURIComponent('CONTACT ID!') + '&';
        assert.include(task,  checkFragment);
      }));

      it('salesforce.getTask pageIngo.object == "Lead" => *WhoId=*', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        var interaction = new Backbone.Model({});
        interaction.updateUserData = function() {};
        interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};

        var voiceInteraction = new VoiceInteraction(interaction);
        sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
        sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');

        var task = salesforce.getTask(voiceInteraction, {object: 'Lead', objectId: 'LEAD ID!'});
        var checkFragment = 'WhoId=' + encodeURIComponent('LEAD ID!') + '&';
        assert.include(task,  checkFragment);
      }));

      it('salesforce.getTask pageIngo.object == * => *WhatId=*', injector.run([
        'utils',
        'interactions/VoiceInteraction'
      ], function(utils, VoiceInteraction) {

        var interaction = new Backbone.Model({});
        interaction.updateUserData = function() {};
        interaction.getOrigin = function() {return 'INTERACTION_ORIGIN'};

        var voiceInteraction = new VoiceInteraction(interaction);
        sandbox.stub(voiceInteraction, 'getTask').returns('VOICE_INTERACTION_TASK');
        sandbox.stub(voiceInteraction, 'getSubject').returns('SUBJECT');

        var task = salesforce.getTask(voiceInteraction, {object: 'Whatever', objectId: 'WHATEVER ID!'});
        var checkFragment = 'WhatId=' + encodeURIComponent('WHATEVER ID!') + '&';
        assert.include(task,  checkFragment);
      }));

    });

    describe('salesforce.enableClickToDial', function() {

      var injector   = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          cti: {
            enableClickToDial: function() {}
          }
        }
      });

      it('salesforce.enableClickToDial resolved if native enableClickToDial is resolved and parsed', injector.run([
        'external/sforce',
        'crm/Salesforce'
      ], function(sforce, Salesforce) {
        sandbox.stub(sforce.interaction.cti, 'enableClickToDial', function(handler) {
          handler({result: '{"some": {"valid": "json"}}'});
        });

        return new Salesforce().enableClickToDial().then(function(data) {
            assert.deepEqual(data, {some: {valid: 'json'}})
        });
      }));

      it('salesforce.enableClickToDial resolved if native enableClickToDial is resolved but no result is present', injector.run([
        'external/sforce',
        'crm/Salesforce'
      ], function(sforce, Salesforce) {
        sandbox.stub(sforce.interaction.cti, 'enableClickToDial', function(handler) {
          handler({lesult: '{"some": {"valid": "json"}}'});
        });

        return new Salesforce().enableClickToDial().then(function() {
          assert(true, false, 'This never should be called');
        },function(data) {
          assert.equal(data, 'NO_RESULT')
        });
      }));


      it('salesforce.enableClickToDial rejected if native enableClickToDial is rejected', injector.run([
        'external/sforce',
        'crm/Salesforce'
      ], function(sforce, Salesforce) {
        sandbox.stub(sforce.interaction.cti, 'enableClickToDial', function(handler, errorHandler) {
          errorHandler('WHATEVER_REASON_IT_WILL_BE');
        });

        return new Salesforce().enableClickToDial().then(function() {
          assert.isTrue(false, 'We never supposed to be in then section');
        }, function(reason) {
          assert.equal(reason, 'WHATEVER_REASON_IT_WILL_BE');
        });
      }));


    });

    describe('salesforce.searchAndScreenPop', function() {

      var injector   = new Squire();

      injector.mock('external/sforce', {
        interaction: {
            searchAndScreenPop: sandbox.spy(function(search, url, searchType, handler) {
              handler();
            })
        }
      });

      afterEach(injector.run([
        'external/sforce'
      ], function(sforce) {
        sforce.interaction.searchAndScreenPop.reset();
      }));

      it('salesforce.searchAndScreenPop respect ANI if screenpop.include-ani-in-search is "true"', injector.run([
        'interactions/VoiceInteraction',
        'configuration',
        'crm/Salesforce',
        'utils',
        'external/sforce'
      ], function(VoiceInteraction, configuration, Salesforce, utils, sforce) {
        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
        // configurationStub.withArgs('callType').returns('call');
        sandbox.stub(utils, 'preprocessANI').returns('3002_PREPROCESSED');

          // var voiceStub =  sandbox.stub(VoiceInteraction, 'getTypeName');
          // configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
          // voiceStub.returns('call');
          var getTypeName = function () {
              return {mediatype:'call'};
          };
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({ani: '3002',userData:{},htccInteraction:{mediatype:'call'}}));
        sandbox.stub(voiceInteraction, 'souldCreateActivityOnScreenPop').returns(false);
        new Salesforce().searchAndScreenPop(voiceInteraction);

        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.searchAndScreenPop,
                         sinon.match('3002'),
                         sinon.match('ANI=3002'),
                     'inbound', sinon.match.func);
      }));

      // it('salesforce.searchAndScreenPop ignores ANI if screenpop.include-ani-in-search is "true" but ANI itself is not found', injector.run([
      //   'interactions/VoiceInteraction',
      //   'configuration',
      //   'crm/Salesforce',
      //   'external/sforce'
      // ], function(VoiceInteraction, configuration, Salesforce, sforce) {
      //   var configurationStub =  sandbox.stub(configuration, 'get');
      //   configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
      //   new Salesforce().searchAndScreenPop(new VoiceInteraction(new Backbone.Model({not_ani: '3002'})));
      //     sandbox.stub(utils, 'preprocessANI').returns('3002_PREPROCESSED');
      //   assert.sinonNeverCalledWith(sforce.interaction.searchAndScreenPop);
      // }));



      it('salesforce.searchAndScreenPop build url and search buy fetching relevant keys from userData', injector.run([
        'interactions/VoiceInteraction',
        'configuration',
        'crm/Salesforce',
        'external/sforce'
      ], function(VoiceInteraction, configuration, Salesforce, sforce) {
        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({userData: {
                cti_record: 'CTI_RECORD',
                cti_meta: 'CTI_META'
            },
            htccInteraction:{mediatype:'call'}
        }));
        sandbox.stub(voiceInteraction, 'souldCreateActivityOnScreenPop').returns(false);
        new Salesforce().searchAndScreenPop(voiceInteraction);
        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.searchAndScreenPop,
          'CTI_RECORD OR CTI_META',
          'cti_record=CTI_RECORD&cti_meta=CTI_META',
          'inbound', sinon.match.func);
      }));

      it('salesforce.searchAndScreenPop build url and search buy fetching relevant keys from userData - blank expression in config', injector.run([
        'interactions/VoiceInteraction',
        'configuration',
        'crm/Salesforce',
        'external/sforce'
      ], function(VoiceInteraction, configuration, Salesforce, sforce) {
        var configurationStub =  sandbox.stub(configuration, 'get');
        configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('');
        var voiceInteraction = new VoiceInteraction(new Backbone.Model({userData: {
                cti_record: 'CTI_RECORD',
                cti_meta: 'CTI_META'
            },
            htccInteraction:{mediatype:'call'}
        }));
        sandbox.stub(voiceInteraction, 'souldCreateActivityOnScreenPop').returns(false);
        new Salesforce().searchAndScreenPop(voiceInteraction);
        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.searchAndScreenPop,
          'CTI_RECORD OR CTI_META',
          'cti_record=CTI_RECORD&cti_meta=CTI_META',
          'inbound', sinon.match.func);
      }));


    });


    describe('salesforce.onClickToDial success', function() {

      var injector = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          cti: {
            onClickToDial: function(handler) {
              //handler({result: '{"is": "ok"}'})
              handler({result: '{\"is\": \"ok\"}'})
              //handler({result: JSON.stringify({is: 'ok'})})
            }
          }
        }
      });

      it('salesforce.onClickToDial when result is present handler should be invoked', injector.run([
        'crm/Salesforce'
      ], function(Salesforce) {
         var callback = sandbox.stub();
         new Salesforce().onClickToDial(callback);
         assert.sinonAlwaysCalledOnceWithExactly(callback, {is: 'ok'});
      }));

    });

    describe('salesforce.onClickToDial failure', function() {

      var injector = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          cti: {
            onClickToDial: function(handler) {
              handler({notResult: '{"is": "ok"}'});
            }
          }
        }
      });

      it('salesforce.onClickToDial when result is not present handler should not be invoked', injector.run([
        'crm/Salesforce'
      ], function(Salesforce) {
        var callback = sandbox.stub();
        new Salesforce().onClickToDial(callback);
        assert.equal(callback.callCount, 0);
      }));

    });


    describe('salesforce.onLogdataResolved', function() {

      var injector = new Squire();

      injector.mock('external/sforce', {
        interaction: {
          saveLog: sandbox.spy(function(objectName, saveParams, handler) {
              handler();
          })
        }
      });

      beforeEach(injector.run([
        'external/sforce'
      ], function(sforce) {
        sforce.interaction.saveLog.reset();
      }));

      it('salesforce.onLogdataResolved passes params to salesforce.getTask', injector.run([
        'external/sforce',
        'crm/Salesforce'
      ], function(sforce, Salesforce) {
        sandbox.stub(Salesforce.prototype, 'getTask');
        
        var interaction = {updateInteractionByPageInfo : sandbox.stub()}

        new Salesforce().onLogdataResolved(interaction, {page: 'data'});

        assert.sinonAlwaysCalledOnceWithExactly(Salesforce.prototype.getTask, interaction, {page: 'data'});
      }));


      it('salesforce.onLogdataResolved passes data to sforce.interaction.saveLog through salesforce.getTask', injector.run([
        'external/sforce',
        'crm/Salesforce'
      ], function(sforce, Salesforce) {
        var interaction = {updateInteractionByPageInfo : sandbox.stub()}
        var getTaskStub = sandbox.stub(Salesforce.prototype, 'getTask');
        getTaskStub.withArgs(interaction, {page: 'data'}).returns('TASK_IS_THIS_ONE');

        
        
        new Salesforce().onLogdataResolved(interaction, {page: 'data'});

        assert.sinonAlwaysCalledOnceWithExactly(sforce.interaction.saveLog, 'Task', 'TASK_IS_THIS_ONE', sinon.match.func);
      }));


    });

    describe('salesforce.onDial', function () {

      it('salesforce.onDial invokes enableClickToDial and onClickToDial', injector.run([
        'crm/Salesforce'
      ], function (Salesforce) {
        sandbox.stub(Salesforce.prototype, 'enableClickToDial').returns(Promise.resolve());
        sandbox.stub(Salesforce.prototype, 'onClickToDial');

        var dialHandler = function dialHandler() {};

        return new Salesforce().onDial(dialHandler).then(function() {
          assert.sinonAlwaysCalledOnceWithExactly(Salesforce.onClickToDial, dialHandler);
        }, function() {
          assert.isImpossible();
        })
      }));

    });

    describe('salesforce.updateDataForTransfer', function () {

      /*it('salesforce.updateDataForTransfer is resolved when salesforce.enable-in-focus-page-transfer is "false"', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('false');

        return new Salesforce().updateDataForTransfer().then(function(status) {
          assert.equal(status, 'UPDATE_DATA_FOCUS_PAGE_DISABLED');
        }, function() {
          assert.isImpossible();
        })
      }));*/


      it('salesforce.updateDataForTransfer is resolved when objectId is missing', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('true');

        sandbox.stub(Salesforce.prototype, 'getPageInfo').returns(Promise.resolve({no: 'pageId'}));

        return new Salesforce().updateDataForTransfer().then(function(status) {
          assert.equal(status, 'UPDATE_DATA_OBJECT_ID_MISSING');
        }, function() {
          assert.isImpossible();
        })
      }));

      it('salesforce.updateDataForTransfer is resolved when getPageInfo is rejected', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('true');

        sandbox.stub(Salesforce.prototype, 'getPageInfo').returns(Promise.reject());

        return new Salesforce().updateDataForTransfer().then(function(status) {
          assert.equal(status, 'UPDATE_DATA_PAGE_INFO_REJECTED');
        }, function() {
          assert.isImpossible();
        })
      }));

      it('salesforce.updateDataForTransfer updates userData if  objectId is present', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('true');
        configuration.get.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');
        configuration.get.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configuration.get.withArgs('screenpop.transfer-object-key', 'id_transfer_object', 'crm-adapter').returns('TRANSFER_OBJECT');

        sandbox.stub(Salesforce.prototype, 'getPageInfo').returns(Promise.resolve({objectId: 'OBJECT_ID'}));

        var context = {
          userData: {
            id_A: 1,
            id_B: 1,
            id_X: 1,
            cti_A: 1,
            cti_B: 1,
            ping: 'ping',
            pong: 'pong'
          }
        };

        context.interaction = {
          get: sandbox.stub(),
          updateUserData: sandbox.stub(),
          deleteUserData: sandbox.stub()
        };

        context.interaction.get.withArgs('userData').returns({
          id_A: 1,
          id_B: 1,
          id_D: 1,
          cti_C: 1
        });

        return new Salesforce().updateDataForTransfer(context).then(function(status) {
          assert.deepEqual(context.userData, {ping: 'ping', pong: 'pong', TRANSFER_OBJECT: 'OBJECT_ID'});
          assert.equal(status, 'UPDATE_DATA_DONE');
          assert.sinonAlwaysCalledOnceWithExactly(context.interaction.updateUserData, {
            TRANSFER_OBJECT: 'OBJECT_ID'
          });

          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_A');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_B');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_X');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_A');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_B');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_D');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_C');
        }, function() {
          assert.isImpossible();
        })
      }));

it('salesforce.updateDataForTransfer updates userData if objectId is present - using default expressions when blank strings defined.', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('true');
        configuration.get.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('');
        configuration.get.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('');
        configuration.get.withArgs('screenpop.transfer-object-key', 'id_transfer_object', 'crm-adapter').returns('TRANSFER_OBJECT');

        sandbox.stub(Salesforce.prototype, 'getPageInfo').returns(Promise.resolve({objectId: 'OBJECT_ID'}));

        var context = {
          userData: {
            id_A: 1,
            id_B: 1,
            id_X: 1,
            cti_A: 1,
            cti_B: 1,
            ping: 'ping',
            pong: 'pong'
          }
        };

        context.interaction = {
          get: sandbox.stub(),
          updateUserData: sandbox.stub(),
          deleteUserData: sandbox.stub()
        };

        context.interaction.get.withArgs('userData').returns({
          id_A: 1,
          id_B: 1,
          id_D: 1,
          cti_C: 1
        });

        return new Salesforce().updateDataForTransfer(context).then(function(status) {
          assert.deepEqual(context.userData, {ping: 'ping', pong: 'pong', TRANSFER_OBJECT: 'OBJECT_ID'});
          assert.equal(status, 'UPDATE_DATA_DONE');
          assert.sinonAlwaysCalledOnceWithExactly(context.interaction.updateUserData, {
            TRANSFER_OBJECT: 'OBJECT_ID'
          });

          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_A');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_B');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_X');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_A');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_B');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_D');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_C');
        }, function() {
          assert.isImpossible();
        })
      }));



      it('salesforce.updateDataForTransfer should create userData if it is missing', injector.run([
        'configuration',
        'crm/Salesforce'
      ], function (configuration, Salesforce) {
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter').returns('true');
        configuration.get.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^id_');
        configuration.get.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^cti_');
        configuration.get.withArgs('screenpop.transfer-object-key', 'id_transfer_object', 'crm-adapter').returns('TRANSFER_OBJECT');

        sandbox.stub(Salesforce.prototype, 'getPageInfo').returns(Promise.resolve({objectId: 'OBJECT_ID'}));

        var context = {};

        context.interaction = {
          get: sandbox.stub(),
          updateUserData: sandbox.stub(),
          deleteUserData: sandbox.stub()
        };

        context.interaction.get.withArgs('userData').returns({
          id_A: 1,
          id_B: 1,
          id_D: 1,
          cti_C: 1
        });

        return new Salesforce().updateDataForTransfer(context).then(function(status) {
          assert.deepEqual(context.userData, {TRANSFER_OBJECT: 'OBJECT_ID'});
          assert.equal(status, 'UPDATE_DATA_DONE');
          assert.sinonAlwaysCalledOnceWithExactly(context.interaction.updateUserData, {
            TRANSFER_OBJECT: 'OBJECT_ID'
          });

          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_A');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_B');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'id_D');
          assert.sinonCalledOnceWithExactly(context.interaction.deleteUserData, 'cti_C');
        }, function() {
          assert.isImpossible();
        })
      }))


    });


    describe('Salesforce::getResources', function() {

      it('Salesforce::getResources returns an list of specific resources', injector.run([
        'crm/Salesforce'
      ], function(Salesforce) {
        assert.deepEqual(new Salesforce().getResources(), [
            'salesforce_interaction',
            'salesforce_integration'
          ]
        );
      }));
    });

      describe('salesforce.searchObjectGenerator', function() {

          it('salesforce.searchObjectGenerator respect ANI if screenpop.include-ani-in-search is "true"', injector.run([
              'configuration',
              'utils',
              'external/sforce'
          ], function(configuration, utils, sforce) {
              var configurationStub = sandbox.stub(configuration, 'get')
              configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('true');
              configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('');
              sandbox.stub(utils, 'preprocessANI').returns('3002');

              var voiceInteraction = {getUserData:function () {
                      return {cti_record: 'CTI_RECORD',
                          cti_meta: 'CTI_META'
                      };
                  },
                  getANI:function () {
                      return '3002';
                  },
                  revertAniDni:function () {
                      return false;
                  },
                  getTypeName:function() {
                      return 'call';
                  }
              };


              var result = salesforce.searchObjectGenerator(voiceInteraction,'OR');



              assert.deepEqual(result,{search:'3002 OR CTI_RECORD OR CTI_META',url:'ANI=3002&cti_record=CTI_RECORD&cti_meta=CTI_META'});

          }));
          it('salesforce.searchObjectGenerator respect ANI if screenpop.include-ani-in-search is "false"', injector.run([
              'configuration',
              'utils',
              'external/sforce'
          ], function(configuration, utils, sforce) {
              var configurationStub = sandbox.stub(configuration, 'get')
              configurationStub.withArgs('screenpop.include-ani-in-search', 'true', 'crm-adapter').returns('false');
              configurationStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('');
              sandbox.stub(utils, 'preprocessANI').returns('3002');
              var voiceInteraction = {getUserData:function () {
                      return {cti_record: 'CTI_RECORD',
                          cti_meta: 'CTI_META'
                      };
                  },
                  getANI:function () {
                      return '3002';
                  },
                  revertAniDni:function () {
                      return false;
                  },
                  getTypeName:function() {
                      return 'call';
                  }
              };


              var result = salesforce.searchObjectGenerator(voiceInteraction,'OR');



              assert.deepEqual(result,{search:'CTI_RECORD OR CTI_META',url:'cti_record=CTI_RECORD&cti_meta=CTI_META'});

          }));

      });



  });
});
