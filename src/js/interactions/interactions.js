define([
  'interactions/VoiceInteraction',
  'interactions/ChatInteraction',
  'interactions/EmailInteraction',
  'interactions/OutboundInteraction',
  'interactions/PushPreviewInteraction',
  'interactions/OpenmediaInteraction'
], function(VoiceInteraction, ChatInteraction, EmailInteraction, OutboundInteraction, OutboundPushInteraction, OpenmediaInteraction) {

  var Interactions = function() {};

  Interactions.prototype.create = function(interaction) {

    var media = interaction.get('media');
    if(!media && interaction.get('htccOutbound')){
      return new OutboundInteraction(interaction);
    } else if (!media){
      return false;
    }

    var mediaName = media.get('name');
    
    if (mediaName === 'outboundpreview'){
      return new OutboundPushInteraction(interaction);
    }
    
    if (mediaName == 'voice') {
      return new VoiceInteraction(interaction);
    }
  
    if (mediaName == 'chat') {
      return new ChatInteraction(interaction);
    }
  
    if (mediaName == 'email') {
      return new EmailInteraction(interaction);
    }
    
    var htccInteraction = interaction.get('htccInteraction');
    
    if(htccInteraction && htccInteraction.mediatype){
      return new OpenmediaInteraction(interaction);
    }
      return false;
  };

  return new Interactions();
});