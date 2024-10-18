define([
  'bluebird',
  'backbone',
  'Squire'
], function(Promise, Backbone, Squire) {
  'use strict';

  describe('AbstractCRM', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });


    describe('AbstractCRM::onInteractionScreenPop', function() {

      it('AbstractCRM::onInteractionScreenPop is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
         assert.isUndefined(new AbstractCRM().onInteractionScreenPop());
      }));
    });

    describe('AbstractCRM::onInteractionAdded', function() {

      it('AbstractCRM::onInteractionAdded is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().onInteractionAdded());
      }));
    });

    describe('AbstractCRM::onMarkDone', function() {

      it('AbstractCRM::onMarkDone is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().onMarkDone());
      }));
    });

    describe('AbstractCRM::updateDataForTransfer', function() {

      it('AbstractCRM::updateDataForTransfer is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().updateDataForTransfer());
      }));
    });

    describe('AbstractCRM::setOptions', function() {

      it('AbstractCRM::setOptions is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().setOptions());
      }));
    });

    describe('AbstractCRM::onDial', function() {

      it('AbstractCRM::onDial is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().onDial());
      }));
    });


    describe('AbstractCRM::onInteractionCanceled', function() {

      it('AbstractCRM::onInteractionCanceled is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().onInteractionCanceled());
      }));
    });

    describe('AbstractCRM::isInConsole', function() {

      it('AbstractCRM::isInConsole is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isFalse(new AbstractCRM().isInConsole());
      }));
    });

    describe('AbstractCRM::isActivityHistorySupported', function() {

      it('AbstractCRM::isActivityHistorySupported is true', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isTrue(new AbstractCRM().isActivityHistorySupported());
      }));
    });

    describe('AbstractCRM::isInFocusPageTransferSupported', function() {

      it('AbstractCRM::isInFocusPageTransferSupported is true', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isFalse(new AbstractCRM().isInFocusPageTransferSupported());
      }));
    });

    describe('AbstractCRM::getResources', function() {

      it('AbstractCRM::getResources returns an empty list', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.deepEqual(new AbstractCRM().getResources(), []);
      }));
    });

    describe('AbstractCRM::getPageInfo', function() {

      it('AbstractCRM::getPageInfo', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        var pageInfo = new AbstractCRM().getPageInfo();

        assert.isFunction(pageInfo.then);
        assert.isUndefined(pageInfo.then());
      }));
    });

    describe('AbstractCRM::focus', function() {

      it('AbstractCRM::focus is an abstract method', injector.run([
        'crm/AbstractCRM'
      ], function(AbstractCRM) {
        assert.isUndefined(new AbstractCRM().focus());
      }));
    });


  });
});
