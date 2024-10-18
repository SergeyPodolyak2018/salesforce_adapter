define([
  'crm/crm',
  'logger',
  'external/genesys'
], function (crm, logger, genesys) {

  var CRMErrors = function(){};

  CRMErrors.prototype.startListening = function() {

    genesys.wwe.eventBroker.on('notifDisconnected', function() {
        logger.debug('crm-workspace disconnected...');
    });

    genesys.wwe.eventBroker.on('notifDown', function() {
        logger.debug('crm-workspace: Reconnect failed...');
        crm.focus();
    });
  };

  return new CRMErrors();
});
