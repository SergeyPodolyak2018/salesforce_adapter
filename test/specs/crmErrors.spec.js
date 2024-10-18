define([
  'bluebird',
  'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('Salesforce', function() {
    var injector = new Squire();


    injector.mock('external/genesys', {
        wwe: {
          eventBroker: new Backbone.Model()
        }
    });

    injector.mock('external/sforce', {
      opencti: {
          setSoftphonePanelVisibility: sinon.stub(),
          isSoftphonePanelVisible: sinon.stub()
      },
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

    before(injector.run([
      'events/crmErrors'
    ], function(crmErrors) {
      crmErrors.startListening();
    }));

    var crm;
    beforeEach(injector.run([
      'crm/crm'
    ], function(_crm) {
      crm = _crm;
    }));


    describe('initErrors', function() {


      it('crmErrors:: focus should trigger on notifDown', injector.run([
        'external/genesys'
      ], function(genesys) {

        sandbox.spy(crm, 'focus');
        genesys.wwe.eventBroker.trigger('notifDown');
        assert.sinonCalledOnce(crm.focus);
      }));


      it('crmErrors:: focus should not trigger on notifDisconnected', injector.run([
        'external/genesys'
      ], function(genesys) {

        var crmSpy = sandbox.spy(crm, 'focus');
        crmSpy.reset();

        genesys.wwe.eventBroker.trigger('notifDisconnected');
        assert.equal(crmSpy.callCount, 0, 'crm.focys should be not be called on disconnect.');
      }));

    });


  });
});
