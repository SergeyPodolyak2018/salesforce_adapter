define([
  'lodash',
  'signals',
  'logger'
], function(_, signals, logger) {

  var globalEvent = {
    INTERACTION_SCREEN_POP: new signals.Signal(),
    INTERACTION_ADDED: new signals.Signal(),
    INTERACTION_RELEASED: new signals.Signal(),
    INTERACTION_CANCELED: new signals.Signal(),
    INTERACTION_MARK_DONE: new signals.Signal(),
    SERVICE_INITIALIZED: new signals.Signal(),
    INTERACTION_BUNDLE_CLOSE: new signals.Signal(),
    INTERACTION_SENT: new signals.Signal(),
    INTERACTION_DIALING: new signals.Signal()
  };

  globalEvent.trigger = function(eventName, data) {
    if (_.has(this, eventName)) {
      logger.debug('globalEvent.trigger event: ', eventName);
      this[eventName].dispatch(data);
    } else {
      logger.debug('globalEvent.trigger event not found: ', eventName);
    }
  };

  return globalEvent;
});