define([
  'bluebird',
  'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('CRMFactory', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });


    describe('CRMFactory::resolve', function() {

      it('CRMFactory::resolve by default returns salesforce', injector.run([
        'utils',
        'crm/Lightning',
        'crm/CRMFactory'
      ], function(utils, Lightning, CRMFactory) {
        sandbox.stub(utils, 'getUrlParam').withArgs('crm', sinon.match.any).returns('whatever');
        assert.deepEqual(new CRMFactory().resolve(), new Lightning);
      }));


      it('CRMFactory::resolve relies on crm GET param', injector.run([
        'utils',
        'crm/Zendesk',
        'crm/CRMFactory',
        'crm/USD',
        'crm/Lightning'
      ], function(utils, Zendesk, CRMFactory, USD, Lightning) {
        var getUrlParamStub = sandbox.stub(utils, 'getUrlParam').withArgs('crm', sinon.match.any).returns('lightning');
        getUrlParamStub.withArgs('crm', sinon.match.any).returns('lightning');
        assert.deepEqual(new CRMFactory().resolve(), new Lightning);
      }));
    });


  });
});
