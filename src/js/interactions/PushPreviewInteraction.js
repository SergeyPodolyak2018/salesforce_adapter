define([
  'lodash',
  'utils',
  'interactions/OutboundInteraction'
], function(_, utils, OutboundInteraction) {

  var OutboundPushInteraction = function(interaction) {
    this.originalInteraction = interaction;
  };

  OutboundPushInteraction.prototype = new OutboundInteraction();

  OutboundPushInteraction.prototype.shouldScreenPopAt = function(eventName) {
    return eventName == 'INTERACTION_ACCEPTED';
  };
  
  OutboundPushInteraction.prototype.shouldActivityBeCreated = function(){
    return false;
  };

  OutboundPushInteraction.prototype.revertAniDni = function() {
      return false;
  };


  return OutboundPushInteraction;
});