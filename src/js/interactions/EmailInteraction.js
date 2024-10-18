define([
  'lodash',
  'utils',
  'interactions/VoiceInteraction',
  'configuration'
], function(_, utils, VoiceInteraction, configuration) {

  var EmailInteraction = function(interaction) {
    this.originalInteraction = interaction;
  };

  EmailInteraction.prototype = new VoiceInteraction();

  EmailInteraction.prototype.getANI = function() {
    return '';
  };
  
  EmailInteraction.prototype.getSubject = function() {
      var interaction = this.originalInteraction;
      return utils.getSalesforceParameter('templates.salesforce.email.subject', interaction, _.bind(this.getTitle, this));
  };

  EmailInteraction.prototype.getTitle = function() {
    // TODO (cmunn): - We can consider some enhancements here in the future (ex. access the email subject, parties to get the from address, etc.)
    var title = 'Email';
    var interaction = this.originalInteraction;
    var htccInteractionId = interaction.get('htccInteractionId');
    if (htccInteractionId) {
      title += ' '  + htccInteractionId;
    } 

    return title;
  };

  EmailInteraction.prototype.isDone = function() {
    // TODO (shabunc): discuss with cmunn whether this is the exact logic we want to rely on
    var interaction = this.originalInteraction;
    var state = interaction.get('state');
    var previousState = interaction.get('previousState');
    return ((state == 'COMPLETED') && (previousState == 'ACCEPTED'));
  };

  EmailInteraction.prototype.shouldScreenPopAt = function(eventName) {
    var screenPopOnInvite = configuration.getAsBoolean('screenpop.email.on-invite', false, 'crm-adapter');
    return screenPopOnInvite ? eventName == 'INTERACTION_INVITED' : eventName == 'INTERACTION_ACCEPTED';
  };

  EmailInteraction.prototype.getTask = function () {
    // TODO (shabunc): discuss what could be thwon out from here (call-related stuff)
    var interaction = this.originalInteraction;

    var taskParams = this.buildCustomActivityFields(interaction);

    var userData = this.getUserData();

    taskParams.push({
      name: 'CallDurationInSeconds',
      value: Math.round(this.getDuration() / 1000)
    });

    var htccInteractionId = interaction.get('htccInteractionId');
    if (htccInteractionId) {
      taskParams.push({name: 'CallObject', value: htccInteractionId});
    }


    var selectedDispositionItemId = this.getDisposition();

    if (selectedDispositionItemId) {
      taskParams.push({
        name: 'CallDisposition',
        value: selectedDispositionItemId
      });
    }


    // TODO (shabunc): it looks like we can somehow improve buildCustomActivityFields instead
    var description = this.getDescription();

    description += 'To: ';
    var to = (userData && userData.To) || '';
    description += to + '\n';

    description += 'Subject: ';
    var subject = interaction.get('subject') || '';
    description += subject + '\n';
    

    description += 'Note:\n';
    var callNote = interaction.get('comment') || '';
    description += callNote + '\n';
    
    if (configuration.getAsBoolean('salesforce.email.include-body-in-desc', false, 'crm-adapter')){
        description += 'Email Content:\n';
        var emailContent = interaction.get('text') || '';
        description += emailContent + '\n';
    }

    taskParams.push({name: 'Description', value: description});
    taskParams.push({name: 'Type', value: 'Email'});
    if (interaction.get('interactionType')){
        taskParams.push({name: 'CallType', value: interaction.get('interactionType')});
    }

    var task = taskParams.map(function (param) {
        return (param.name + '=' + encodeURIComponent(param.value))
      }).join('&') + '&';

    return task;
  };
  
  EmailInteraction.prototype.shouldActivityBeCreated = function(){
      return true;
  };

  EmailInteraction.prototype.shouldSaveLog = function() {
      return true;
  };
  EmailInteraction.prototype.revertAniDni = function() {
      return false;
  };
  EmailInteraction.prototype.getEmail=function() {
      var interaction = this.originalInteraction;
      var type = interaction.get('interactionType');
      var userData = this.getUserData();
      if(type==='Inbound'){
        return userData['EmailAddress'];
      }
      return userData['toAddresses'];
  };

  return EmailInteraction;
});
