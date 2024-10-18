define([
  'lodash',
  'utils',
  'interactions/VoiceInteraction'
], function(_, utils, VoiceInteraction) {

  var OutboundInteraction = function(interaction) {
    this.originalInteraction = interaction;
  };

  OutboundInteraction.prototype = new VoiceInteraction();

  OutboundInteraction.prototype.getTitle = function() {
    // TODO (cmunn): - We can consider some enhancements here in the future (ex. access the email subject, parties to get the from address, etc.)
    var title = 'Outbound';

    var interaction = this.originalInteraction;
    var htccInteractionId = interaction.get('htccInteractionId');
    if (htccInteractionId) {
      title += ' '  + htccInteractionId;
    }

    return title;
  };

  OutboundInteraction.prototype.isDone = function() {
    return false;
  };
  
  OutboundInteraction.prototype.shouldActivityBeCreated = function(){
    if (this.isMonitoredByMe()){
      return false;
    }
    return true;
  };

  OutboundInteraction.prototype.shouldScreenPopAt = function(eventName) {
    return eventName == 'INTERACTION_ADDED';
  };

  OutboundInteraction.prototype.shouldSaveLog = function() {
    return true;
  };
  OutboundInteraction.prototype.revertAniDni = function() {
      return false;
  };

  return OutboundInteraction;
});
