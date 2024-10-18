define([
  'Squire'
], function(Squire) {
  'use strict';

   describe('configuration', function() {

     var injector = new Squire();    injector.mock('external/genesys', {
       wwe: {
        configuration: {
          getAsString: function() {},
          getAsBoolean: function() {}
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

     describe('configuration.get', function() {
        it('configuration.get currently returns the same as the wwe equivalent', injector.run([
          'external/genesys',
          'configuration'
        ], function(genesys, configuration) {

            var getAsStringStub = sandbox.stub(genesys.wwe.configuration, 'getAsString');
            getAsStringStub.withArgs('screenpop.id-key-regex', '^id_', 'crm-adapter').returns('^configId');
            getAsStringStub.withArgs('screenpop.search-key-regex', '^cti_', 'crm-adapter').returns('^configCti');


            assert.equal(configuration.get('screenpop.id-key-regex', '^id_', 'crm-adapter'), '^configId');
            assert.equal(configuration.get('screenpop.search-key-regex', '^cti_', 'crm-adapter'), '^configCti');
        }));
     });
     
     describe('configuration.getAsBoolean', function() {
         it('configuration.getAsBoolean returns the same as the wwe equivalent', injector.run([
           'external/genesys',
           'configuration'
         ], function(genesys, configuration) {

             var getAsStringStub = sandbox.stub(genesys.wwe.configuration, 'getAsBoolean');
             getAsStringStub.withArgs('salesforce.activity-log.save-email-body', false, 'crm-adapter').returns(true);

             assert(configuration.getAsBoolean('salesforce.activity-log.save-email-body', false, 'crm-adapter'));
         }));
      });

   });

});
