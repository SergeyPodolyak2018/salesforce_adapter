define([
  'lodash',
  'Squire'
], function(_, Squire) {
  'use strict';

  describe('globalEvent', function() {

    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('globalEvent.trigger', function() {

      it('globalEvent.trigger dispatches to the appropriate event if it exists', injector.run([
        'events/globalEvent'
      ], function(globalEvent) {
        sandbox.stub(globalEvent.INTERACTION_ADDED, 'dispatch');

        globalEvent.trigger('INTERACTION_ADDED', {interaction: 'added'});
        assert.sinonAlwaysCalledOnceWithExactly(globalEvent.INTERACTION_ADDED.dispatch, {interaction: 'added'});
      }));

      it('globalEvent.trigger does not dispatch if event is not known', injector.run([
        'signals',
        'events/globalEvent'
      ], function(signals, globalEvent) {
        sandbox.stub(signals.Signal.prototype, 'dispatch');

        globalEvent.trigger('INTERACTION_UNKNOWN', {interaction: 'added'});
        assert.equal(signals.Signal.prototype.dispatch.callCount, 0);
      }))


    });



  });

});
