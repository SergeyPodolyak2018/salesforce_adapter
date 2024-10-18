define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('USD', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    var usd;
    beforeEach(injector.run([
      'crm/USD'
    ], function(USD) {
      usd = new USD();
    }));

    describe('USD.isInConsole', function () {

      it('USD.isInConsole always passes true result to callback', function() {
        var resultCallback = sandbox.stub();
        usd.isInConsole(resultCallback);

        assert.sinonAlwaysCalledOnceWithExactly(resultCallback, {result : true});
      });
      
      it('USD.isInConsole should run without error with no callback', function() {
          usd.isInConsole();
      });
    });

    describe('USD::isActivityHistorySupported', function() {

      it('USD::isActivityHistorySupported is false', function() {
        assert.isFalse(usd.isActivityHistorySupported());
      });
    });
    
    describe('USD.getPageInfo', function(){
        
      it('USD.getPageInfo should return promise', function(){
          assert(usd.getPageInfo().isFulfilled());
      });
    });

    describe('USD.updateDataForTransfer', function() {
      it('USD.updateDataForTransfer returns true-promise', function() {
          return usd.updateDataForTransfer().then(function(result) {
              return assert.isTrue(result)
          }, function() {
              return assert.isImpossible();
          })
      });
    });
    
    describe('USD.onInteractionScreenPop', function() {
        it('USD.onInteractionScreenPop - search key + don\'t include ani', injector.run([
          'configuration'
        ], function(configuration) {
          var interaction = {getUserData : sandbox.stub().returns({cti_test: 'testval', id_test: 'idval', nomatch: 'otherval'})};
          window.$ = {post: sandbox.stub()};
          var configurationStub = sandbox.stub(configuration, 'get');
          configurationStub.onCall(0).returns('^id_');
          configurationStub.onCall(1).returns('^cti_');
          configurationStub.onCall(2).returns('');
          usd.onInteractionScreenPop(interaction);
          assert($.post.calledWithExactly('http://localhost:5000/', {ANI: 'undefined', id_test: 'idval', cti_test: 'testval'}));
        }));
        
        it('USD.onInteractionScreenPop - no search key + no ani', injector.run([
          'configuration'
        ], function(configuration) {
          var interaction = {getUserData : sandbox.stub().returns({cti_test: 'testval', id_test: 'idval', nomatch: 'otherval'}), getANI: sandbox.stub().returns(undefined)};
          window.$ = {post: sandbox.stub()};
          var configurationStub = sandbox.stub(configuration, 'get');
          configurationStub.onCall(0).returns('');
          configurationStub.onCall(1).returns('');
          configurationStub.onCall(2).returns('true');
          usd.onInteractionScreenPop(interaction);
          assert($.post.calledWithExactly('http://localhost:5000/', {cti_test: 'testval', id_test: 'idval'}));
        }));
        
        it('USD.onInteractionScreenPop - search key + ani', injector.run([
          'configuration',
          'utils'
        ], function(configuration, utils) {
          var interaction = {getUserData : sandbox.stub().returns({testmatch: 'testval', idtest: 'idval', nomatch: 'otherval'}), getANI: sandbox.stub().returns('1234')};
          window.$ = {post: sandbox.stub()};
          var configurationStub = sandbox.stub(configuration, 'get');
          configurationStub.onCall(0).returns('^idtest');
          configurationStub.onCall(1).returns('^test');
          configurationStub.onCall(2).returns('true');
          
          var preprocessAniStub = sandbox.stub(utils, 'preprocessANI', function(ani){return ani;});
         
          usd.onInteractionScreenPop(interaction);
          assert(preprocessAniStub.calledWithExactly('1234'));
          assert($.post.calledWithExactly('http://localhost:5000/', {testmatch: 'testval', idtest: 'idval', ANI: '1234'}));
        }));
        
        it('USD.onInteractionScreenPop - no user data match + no ani', injector.run([
          'configuration'
        ], function(configuration) {
          var interaction = {getUserData : sandbox.stub().returns({nomatch: 'otherval'}), getANI: sandbox.stub().returns(undefined)};
          window.$ = {post: sandbox.stub()};
          var configurationStub = sandbox.stub(configuration, 'get');
          configurationStub.onCall(0).returns('');
          configurationStub.onCall(1).returns('');
          configurationStub.onCall(2).returns('true');
          usd.onInteractionScreenPop(interaction);
          assert.isFalse($.post.called);
        }));
      });
    
  });
});
