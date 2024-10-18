define([
  'events/globalEvent',
  'crm/crm',
  'lodash'
], function (globalEvent, crm, _) {

  var CRMEvents = function(){};

  CRMEvents.prototype.startListening = function() {
    globalEvent.INTERACTION_SCREEN_POP.add(function(interaction) {
      crm.onInteractionScreenPop(interaction);
    });

    globalEvent.INTERACTION_ADDED.add(function(interaction) {
      crm.onInteractionAdded(interaction);
    });

    globalEvent.INTERACTION_RELEASED.add(function(interaction) {
      crm.onInteractionAdded(interaction);
    });

    globalEvent.INTERACTION_CANCELED.add(function(interaction) {
      crm.onInteractionCanceled(interaction);
    });

    globalEvent.INTERACTION_MARK_DONE.add(function(interaction) {
      crm.onMarkDone(interaction);
    });
    
    globalEvent.INTERACTION_SENT.add(function(interaction) {
      var oi = interaction.originalInteraction;
      var parent = oi.get('parentInteraction');
      var toAddresses = oi.get('toAddresses');
      if (parent && parent.get('fromAddress') && toAddresses && _.includes(toAddresses, parent.get('fromAddress'))){
        crm.onMarkDone(interaction);
      }
    });
  };

  return new CRMEvents();
});
