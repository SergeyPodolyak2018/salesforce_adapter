define([
  'bluebird',
  'backbone',
  'Squire'
], function (Promise, Backbone, Squire) {
  'use strict';

  describe('loader', function () {
    var injector = new Squire();


    injector.mock('external/genesys', {
      wwe: {
          configuration: {
              getAsString: function() {
                  return false;
              }
          },
        eventBroker: {
          on: function () {
          }
        },
        createApplication: function () {
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

    describe('loader.init', function () {

      it('loader.init is an abstract method', injector.run([
        'crm/crm',
        'loader'
      ], function (crm, loader) {
        sandbox.stub(crm, 'isInConsole', function (callback) {
          callback('RESPONSE');
        });
        sandbox.stub(loader, 'isInConsoleResolved');

        loader.init();
        assert.sinonAlwaysCalledOnceWithExactly(loader.isInConsoleResolved, 'RESPONSE');
      }));
    });

    describe('loader.onAgentDesktopRendered', function () {

      it('loader.onAgentDesktopRendered triggers SERVICE_INITIALIZED event', injector.run([
        'events/globalEvent',
        'loader',
          'crm/crm'
      ], function (globalEvent, loader,crm) {
        sandbox.stub(globalEvent.SERVICE_INITIALIZED, 'dispatch');
        crm.checkVisibilityPeriodically=function () {};

        loader.onAgentDesktopRendered();
        assert.sinonCalledOnceWithExactly(globalEvent.SERVICE_INITIALIZED.dispatch);
      }));
    });

    /*describe('loader.onApplicationCreated', function () {

      it('loader.onApplicationCreated passed data by promise chain and invokes onDataResolved', injector.run([
        'loader'
      ], function (loader) {
        sandbox.stub(loader, 'showComponents');
        sandbox.stub(loader, 'onDataResolved');

        return loader.onApplicationCreated(Promise.resolve()).then(function () {
          assert.sinonAlwaysCalledOnceWithExactly(loader.onDataResolved);
        }, function () {
          assert.isImpossible();
        });

      }));
    });*/

    describe('loader.onDataResolved', function () {

      it('loader.onDataResolved initalized genesys.wwe.eventBroker.on("agentDesktopRendered") event', injector.run([
        'external/genesys',
        'loader'
      ], function (genesys, loader) {
        sandbox.stub(loader, 'onAgentDesktopRendered');

        sandbox.stub(genesys.wwe.eventBroker, 'on', function (evtName, callback) {
          callback();
        }).withArgs('agentDesktopRendered', sinon.match.func);

        loader.onDataResolved();
        assert.sinonAlwaysCalledOnceWithExactly(loader.onAgentDesktopRendered);
      }));
    });

    /*describe('loader.showComponents', function () {

      it('loader.showComponents changes some DOM values', injector.run([
        'loader'
      ], function (loader) {
        var myCustomWaitingDOM = {style: {display: ''}};
        var myCustomAppDOM = {style: {display: ''}};

        sandbox.stub(document, 'getElementById');
        document.getElementById.withArgs('myCustomWaiting').returns(myCustomWaitingDOM);
        document.getElementById.withArgs('myCustomApp').returns(myCustomAppDOM);

        loader.showComponents('PING', 'PONG');
        assert.equal(myCustomWaitingDOM.style.display, 'PING');
        assert.equal(myCustomAppDOM.style.display, 'PONG');
      }));
    });*/


    /*describe('loader.isInConsoleResolved', function () {

      it('loader.isInConsoleResolved shows special layout when not in console', injector.run([
        'loader'
      ], function (loader) {
        var notInConsoleDOM = {style: {display: ''}};

        sandbox.stub(document, 'getElementById');
        document.getElementById.withArgs('notInConsole').returns(notInConsoleDOM);

        sandbox.stub(loader, 'showComponents');
        loader.isInConsoleResolved({result: false});
        assert.sinonAlwaysCalledOnceWithExactly(loader.showComponents, 'none', 'none');
        assert.equal(notInConsoleDOM.style.display, 'block');
      }));

      it('loader.isInConsoleResolved returns genesys.wwe.createApplication() when in console', injector.run([
        'external/genesys',
        'loader'
      ], function (genesys, loader) {
        sandbox.stub(loader, 'showComponents');
        sandbox.stub(loader, 'onApplicationCreated');
        sandbox.stub(genesys.wwe, 'createApplication').returns(Promise.resolve({application: 'DATA'}));

        return loader.isInConsoleResolved({result: true}).then(function () {
          assert.sinonAlwaysCalledOnceWithExactly(loader.onApplicationCreated, {application: 'DATA'});
        }, function () {
          assert.isImpossible();
        });
      }));

    });*/

    
  });
});
