define([
  'lodash',
  'utils',
  'configuration',
  'interactions/VoiceInteraction',
  'logger'
], function(_, utils, configuration, VoiceInteraction, logger) {

  var ChatInteraction = function(interaction) {
    this.originalInteraction = interaction;
  };

  ChatInteraction.prototype = new VoiceInteraction();

  ChatInteraction.prototype.getANI = function() {
    return '';
  };
  
  ChatInteraction.prototype.getSubject = function() {
      var interaction = this.originalInteraction;
      return utils.getSalesforceParameter('templates.salesforce.chat.subject', interaction, _.bind(this.getTitle, this));
  };

  ChatInteraction.prototype.getTitle = function() {
    // TODO (cmunn): consider some enhancements here - ex. use chat subject, customer nickname, email.
    var interaction = this.originalInteraction;
    var mediaName = interaction.get('media').get('name')
    var title = mediaName.charAt(0).toUpperCase() + mediaName.substring(1);
    
    var htccInteractionId = interaction.get('htccInteractionId');
    if (htccInteractionId) {
      title += ' '  + htccInteractionId;
    } 

    logger.debug('ChatInteraction: returning title [' + title + ']');
    return title;
  };

  ChatInteraction.prototype.getDescription = function() {
    var interaction = this.originalInteraction;
    var description = VoiceInteraction.prototype.getDescription.apply(this, arguments);

    description += 'Subject: ';
    var subject = interaction.get('subject') || interaction.get('htccInteraction').subject || '';
    description += subject + '\n';

    var includeTranscriptInDescription = configuration.get('salesforce.chat.include-transcript-in-desc', 'true', 'crm-adapter');
    if (includeTranscriptInDescription === 'true') {
      description += this.getTranscriptText();
    }

    // TODO (shabunc): should we leave 'Note:' without a comment?
    description += 'Note:\n';
    var comment = interaction.get('comment');
    if(comment) {
      description += comment;
    }

    logger.debug('ChatInteraction: returning description [' + description + ']');
    return description;
  };

  ChatInteraction.prototype.getTranscriptText = function() {
    var interaction = this.originalInteraction;
    var transcript = interaction.get('transcript');
    var transcriptText = '';

    if (transcript) {
      transcriptText += 'Transcript:\n';

      transcriptText += transcript.filter(function(message) {
        return message.get('type') == 'message';
      }).map(function(message) {
        var timestamp = utils.convertTime(message.get('date'));
        var party = message.get('party').get('displayName');
        var text = message.get('message');
        return (timestamp + '[' + party + ']: ' + text);
      }).join('\n');

      transcriptText += '\n\n';
    }

    logger.debug('ChatInteraction: returning transcript text:\n' + transcriptText);
    return transcriptText;
  };


  ChatInteraction.prototype.getTask = function() {
    logger.debug('ChatInteraction: creating task...');
    var interaction = this.originalInteraction;

    var taskParams = this.buildCustomActivityFields(interaction);

    var chatTranscriptCustomFieldName = configuration.get('salesforce.chat.transcript-custom-field-name', '', 'crm-adapter');
    if (chatTranscriptCustomFieldName !== '' && !this.isOpenmedia) {
      logger.debug('ChatInteraction: salesforce.chat.transcript-custom-field-name is [' + chatTranscriptCustomFieldName + ']...');
      taskParams.push({name: chatTranscriptCustomFieldName, value: this.getTranscriptText()});
    }

    var htccInteractionId = interaction.get('htccInteractionId');
    if (htccInteractionId) {
      
      taskParams.push({name: 'CallObject', value: htccInteractionId});
    }

    taskParams.push({name: 'CallDurationInSeconds', value: Math.round(this.getDuration() / 1000)});

    var selectedDispositionItemId = this.getDisposition();
    if (selectedDispositionItemId) {
      taskParams.push({name: 'CallDisposition', value: selectedDispositionItemId});
    }

    var description = this.getDescription();


    taskParams.push({name: 'Description', value: description});
    taskParams.push({name: 'Type', value: 'Other'});
    taskParams.push({name: 'CallType', value: 'Inbound'});

    
    var task = taskParams.map(function(param) {
      return (param.name + '=' + encodeURIComponent(param.value))
    }).join('&') + '&';

    return task;
  };

  ChatInteraction.prototype.isDone = function() {
    var interaction = this.originalInteraction;
    var state = interaction.get('state');
    return (state == 'IDLE');
  };


  ChatInteraction.prototype.shouldScreenPopAt = function(eventName) {
    if (configuration.get('screenpop.chat.on-invite', 'false', 'crm-adapter') == 'true'){
        return eventName == 'INTERACTION_INVITED';
    }
    return eventName == 'INTERACTION_ACCEPTED';
  };
  
  ChatInteraction.prototype.shouldActivityBeCreated = function(){
      if (this.isMonitoredByMe()){
          return false;
      }
      
      var interaction = this.originalInteraction;
      
      var chatType = interaction.get('htccInteraction').interactionType;
      if (interaction.get('isChatConsultation')) {
        chatType = 'Consult';
      }

      logger.debug('ChatInteraction: Chat type is [' + chatType + ']...');

      var enabledTypes = configuration.get('salesforce.activity-log.enabled-chat-types', 'Inbound', 'crm-adapter');
      logger.debug('ChatInteraction: salesforce.activity-log.enabled-chat-types is [' + enabledTypes + ']...');

      if (chatType && enabledTypes.indexOf(chatType) != -1) {
        logger.debug('ChatInteraction: Activity log should be created.');
        return true;
      }
      
      return false;
  }

  ChatInteraction.prototype.shouldMarkDoneAt = function() {
    // https://jira.genesys.com/browse/HTCC-15669
    if (this.isDone()) {
      // https://jira.genesys.com/browse/HTCC-15666
      if (!this.isConsultation() && !this.isMonitoredByMe()) {
        logger.debug('ChatInteraction.shouldMarkDoneAt resosolved as true');
        return true;
      }
    }

    logger.debug('ChatInteraction.shouldMarkDoneAt resolved as false');
    return false;
  };

  ChatInteraction.prototype.shouldSaveLog = function() {
    return true;
  };
  ChatInteraction.prototype.revertAniDni = function() {
      return false;
  };


  return ChatInteraction;
});
