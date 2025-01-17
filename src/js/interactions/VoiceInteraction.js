define([
  'lodash',
  'utils',
  'configuration',
  'logger'
], function(_, utils, configuration, logger) {

  var VoiceInteraction = function(interaction) {
    this.originalInteraction = interaction;
  };

  VoiceInteraction.prototype.getSubject = function() {
      var interaction = this.originalInteraction;
      if (interaction.get('userData') && interaction.get('userData').GCS_TransferringDate){
        return utils.getSalesforceParameter('templates.salesforce.transfer-voice.subject', interaction, _.bind(this.getTitle, this));
      } else if (interaction.get('callType') === 'Outbound'){
        return utils.getSalesforceParameter('templates.salesforce.outbound-voice.subject', interaction, _.bind(this.getTitle, this));
      } else if (interaction.get('callType') === 'Inbound'){
        return utils.getSalesforceParameter('templates.salesforce.inbound-voice.subject', interaction, _.bind(this.getTitle, this));
      } else {
        return utils.getSalesforceParameter('templates.salesforce.internal-voice.subject', interaction, _.bind(this.getTitle, this));
      }
  };

  VoiceInteraction.prototype.getTitle = function() {
    var interaction = this.originalInteraction;
    var title = interaction.getOrigin();

    logger.debug('Interaction: returning title [' + title + ']...');
    return title;
  };


  VoiceInteraction.prototype.getCaseData = function() {
    var userData = this.getUserData();
    if (userData) {
      var filteredData = this.filterUserData();
      return _.map(filteredData, function(pair) {
        return (pair.displayName + ': ' + pair.value + '\n');
      }).join('');
    }
    return null;
  };

  VoiceInteraction.prototype.getDescription = function() {
    var description = this.getTitle() + '\n\nCase Data:\n';

    var userData = this.getUserData();

    if (userData) {
      var filteredData = this.filterUserData();

      var filteredFragment = _.map(filteredData, function(pair) {
        return (pair.displayName + ': ' + pair.value + '\n');
      }).join('');

      description += filteredFragment;

      // TODO (shabunc): ask Chris whether we need this particular new line
      //description += '\n';
    }

    logger.debug('Interaction: returning description [' + description + ']...');
    return description;
  };

  VoiceInteraction.prototype.filterUserData = function() {
    var filteredData = [];
    var interaction = this.originalInteraction;

    var userData = this.getUserData();

    if (!userData) {
      return filteredData;
    }

    var state = interaction.get('state');
    if (state === 'RINGING' || state === 'DIALING' || state === 'INVITED') {
      filteredData = utils.filterToastData(userData);
    } else {
      filteredData = utils.filterCaseData(userData);
    }

    return filteredData;
  };

  VoiceInteraction.prototype.getTask = function () {
    var interaction = this.originalInteraction;

    var taskParams = this.buildCustomActivityFields(interaction);

    var callType = interaction.get('callType');
    var userData = this.getUserData();

    if (userData.IW_CallType == 'Consult') {
      callType = 'Consult';
    }

    if (callType) {
      taskParams.push({name: 'CallType', value: callType});
    }


    taskParams.push({
      name: 'CallDurationInSeconds',
      value: Math.round(this.getDuration() / 1000)
    });

    var callUuid = interaction.get('callUuid');
    if (callUuid) {
      taskParams.push({name: 'CallObject', value: callUuid});
    }


    var selectedDispositionItemId = this.getDisposition();

    if (selectedDispositionItemId) {
      taskParams.push({
        name: 'CallDisposition',
        value: selectedDispositionItemId
      });
    }

    // TODO: buildDescription here

    var description = this.getDescription();
    description += 'Note:\n';


    var callNote = '';

    if (interaction.get('callNote')) {
        callNote = interaction.get('callNote');
    }
    else if (interaction.get('comment')) {
        callNote = interaction.get('comment');
    }

    if (callNote) {
        description += callNote;
    }

    taskParams.push({name: 'Description', value: description});
    taskParams.push({name: 'Type', value: 'Call'});

    var task = taskParams.map(function (param) {
        return (param.name + '=' + encodeURIComponent(param.value))
      }).join('&');

    return task;
  };

  VoiceInteraction.prototype.getDisposition = function() {
    logger.debug('Interaction: getDisposition');
    var interaction = this.originalInteraction;
    var selectedDispositionItemId;
    var modelSelectedDispositionItemId = interaction.get('selectedDispositionItemId');

    logger.debug('Interaction: modelSelectedDispositionItemId = ', modelSelectedDispositionItemId);
    // https://jira.genesys.com/browse/HTCC-15621
    if (modelSelectedDispositionItemId == '-1') {
      logger.debug('Interaction: no disposition associated with interaction, trying to fetch it from userData');
      selectedDispositionItemId = null;
      // https://jira.genesys.com/browse/HTCC-18342 - Selected disposition code for chat sometimes is not present in interaction content
      // https://jira.genesys.com/browse/HTCC-16174
      var userDataSelectedDispositionItemId = _.get(this.getUserData(), 'IWAttachedDataInformation.SelectedDispositionCodeDisplayName');
      logger.debug('Interaction: userDataSelectedDispositionItemId = ', userDataSelectedDispositionItemId);
      if (userDataSelectedDispositionItemId === 'undefined') {
        logger.debug('Interaction: no disposition associated with user data for interaction');
      } else {
        selectedDispositionItemId = userDataSelectedDispositionItemId;
      }
    } else {
      selectedDispositionItemId = modelSelectedDispositionItemId
    }

    logger.debug('Interaction: disposition is ' + selectedDispositionItemId);

    return selectedDispositionItemId;
  };

  VoiceInteraction.prototype.getDuration = function() {
    var interaction = this.originalInteraction;

    // TODO (shabunc): this should be in interactions wrapper

    // ported from cloud-server/agent-desktop/webapp/module/wwe-voice/model/interaction/interaction-voice.js
    var startDate = interaction.get('startDate');
    if(startDate) {
      var endDate = interaction.get('endDate');
      if(endDate) {
        return endDate - startDate;
      } else {
        return Date.now() - startDate;
      }
    }
  };

  VoiceInteraction.prototype.getUserData = function() {
    return this.originalInteraction.get('userData');
  };

  VoiceInteraction.prototype.getANI = function() {
    var interaction = this.originalInteraction;
    var ani = null;

    var interactionAni = interaction.get('ani');
    var parties = interaction.get('parties');

    if (interactionAni) {
      ani = interactionAni;
    } else if (parties && parties.at(0)) {
      ani = parties.at(0).get('name');
    }

    return ani;
  };

  VoiceInteraction.prototype.isDone = function() {
    var interaction = this.originalInteraction;
    var state = interaction.get('state');
    var previousState = interaction.get('previousState');
    return ((state == 'IDLE') && (previousState != 'RINGING') && (previousState != 'DIALING'));
  };

  VoiceInteraction.prototype.shouldScreenPopAt = function (eventName) {
    var interaction = this.originalInteraction;
    var enableForConsult = configuration.getAsBoolean('screenpop.enable-for-consult', false, 'crm-adapter')
    logger.debug('Interaction: call type is: ' + interaction.get('callType') + 
            ' Screenpop.enable-for-consult is: ' + enableForConsult);

    if (interaction.get('callType') == 'Internal' || (interaction.get('callType') === 'Consult' && !enableForConsult)) {
      var screenPopForInternalCalls = configuration.get('screenpop.enable-for-internal-calls', 'true', 'crm-adapter') === 'true';
      logger.debug('Interaction: call type is internal and screenpop.enable-for-internal-calls is [' + screenPopForInternalCalls + ']...');
      if (!screenPopForInternalCalls) {
        return false;
      }
    } 

    // TODO (shabunc): ask Chris about: ACCEPTED, screenPopping on ESTABLISHED for internal calls
    var screenPopOnRinging = configuration.get('screenpop.on-ringing', 'false', 'crm-adapter') == 'true';
    logger.debug('Interaction: screenpop.on-ringing is [' + screenPopOnRinging + ']');
    if ((eventName == 'INTERACTION_RINGING') && screenPopOnRinging) {
      logger.debug('Interaction: call is ringing and screen pop is ringing is enabled. Screen pop should be sent.');
      return true;
    } else if ((eventName == 'INTERACTION_ESTABLISHED') && (interaction.get('previousState') == 'RINGING')) {
      logger.debug('Interaction: call is established and previous state was ringing, should screen pop.');
      return true;
    }

    logger.debug('Interaction: should NOT screen pop.');
    return false;
  };

  VoiceInteraction.prototype.getUID = function() {
    return String(this.originalInteraction.get('interactionId'));
  };

  VoiceInteraction.prototype.getDirection = function() {
      return String(this.originalInteraction.get('direction'));
  };

  VoiceInteraction.prototype.getCallType = function() {
      return String(this.originalInteraction.get('callType'));
  };

  VoiceInteraction.prototype.getDnis = function() {
        return String(this.originalInteraction.get('dnis'));
  };
  VoiceInteraction.prototype.getTypeName = function() {
      var htccInteraction = this.originalInteraction.get('htccInteraction');
      if(htccInteraction){
        return htccInteraction.mediatype;
      }
      return undefined;
  };
  VoiceInteraction.prototype.shouldSaveLog = function() {
      if(this.getDirection() === 'IN'){
        return true;
      }else{
          if(this.getDirection() === 'OUT' && this.getCallType() === 'Outbound'){
              return true;
          }
      }
      return false;
  };
  VoiceInteraction.prototype.revertAniDni = function() {
      if(this.getCallType() === 'Outbound'){
          return true;
      }
      return false;
  };

  VoiceInteraction.prototype.buildCustomActivityFields = function(interaction) {
    logger.debug('Interaction: Checking for custom activity fields...');
    // TODO (shabunc): there was definitely another place where we should fetch config from
    var interaction = this.originalInteraction;

    var interactionConfig = interaction.getContextualConfiguration();
    var sectionName = interactionConfig.getAsString('salesforce.activity-log.field-mapping', '', 'crm-adapter');

    if (!sectionName) {
      logger.debug('Interaction: salesforce.activity-log.field-mapping is not defined. Skipping custom fields.');
      return [];
    }

    var userData = interaction.get('userData');

    // being more imperative )
    var activityFields = [];

    var options = interactionConfig.getOptionsForSection(sectionName);

    _.each(options, function(val, key) {
      if (val && userData[key]) {
        logger.debug('Interaction: Adding custom activity field [' + val + '] with value [' + userData[key] + '].');
        activityFields.push({name: val, value: userData[key]})
      }
    });

    return activityFields;
  };

  VoiceInteraction.prototype.updateInteractionByPageInfo = function (pageInfo) {
    logger.debug('Interaction: Checking if current page info should be saved to userdata...');
    var defer = window.$.Deferred();
    var pageData = {};

    var oidKey = configuration.get('salesforce.user-data.object-id-key', '', 'crm-adapter');
    if (pageInfo.objectId && oidKey) {
      logger.debug('Interaction: Saving object id [' + pageInfo.objectId + '] with key [' + oidKey +']...');
      pageData[oidKey] = pageInfo.objectId;
    }

    var nameKey = configuration.get('salesforce.user-data.object-name-key', '', 'crm-adapter');
    if ((pageInfo.objectName || pageInfo.recordName) && nameKey) {
      logger.debug('Interaction: Saving object name [' + pageInfo.objectName + '] with key [' + nameKey + ']...');
      pageData[nameKey] = pageInfo.objectName || pageInfo.recordName;
    }

    var objectKey = configuration.get('salesforce.user-data.object-type-key', '', 'crm-adapter');
    if (pageInfo.object && objectKey) {
      logger.debug('Salesforce: Adding object type with key [' + objectKey + ']...');
      pageData[objectKey] = pageInfo.object;
    }

    var interaction = this.originalInteraction;


    if (_.isEmpty(pageData)) {
      logger.debug('updateInteractionByPageInfo, pageData is empty, won\'t update original interaction with', pageData);
      defer.resolve();
    } else {
      logger.debug('updateInteractionByPageInfo, trying to update with', pageData);
      interaction.updateUserData(pageData).then(function(){
        defer.resolve();
      });
    }

    return defer.promise();
  };

  VoiceInteraction.prototype.isConsultation = function() {
    return this.originalInteraction.get('isConsultation') === true;
  };

  VoiceInteraction.prototype.isMonitoredByMe = function() {
    return this.originalInteraction.get('isMonitoredByMe') === true;
  };


  VoiceInteraction.prototype.shouldActivityBeCreated = function(){
      if (this.isMonitoredByMe()){
          return false;
      }
      var callType = this.originalInteraction.get('call').callType;
      if(this.getUserData() && this.getUserData().IW_CallType == 'Consult')
          callType = 'Consult';
      logger.debug('Interaction: Call type is [' + callType + ']...');

      var enabledTypes = configuration.get('salesforce.activity-log.enabled-call-types', 'Inbound, Outbound, Internal, Consult', 'crm-adapter');
      logger.debug('Interaction: salesforce.activity-log.enabled-call-types is [' + enabledTypes + ']...');
      if (callType && enabledTypes.indexOf(callType) != -1) {
        logger.debug('Interaction: Activity log should be created.');
        return true;
      }
      return false;
  };

  VoiceInteraction.prototype.shouldMarkDoneAt = function () {
    if (this.isDone()) {
      // https://jira.genesys.com/browse/HTCC-15666
      if (!this.isConsultation() && !this.isMonitoredByMe()) {
        return true;
      }
    }

    return false;
  };

  VoiceInteraction.prototype.updateInteractionByActivityId = function (activity) {
    var defer = window.$.Deferred();
    var interaction = this.originalInteraction;
    var activityData = {SF_started_activityId:activity.activityId};
    interaction.updateUserData(activityData).then(function(){
        defer.resolve();
    });
  };

  VoiceInteraction.prototype.souldCreateActivityOnScreenPop = function (activity) {
      var interaction = this.originalInteraction;
      var media = interaction.get('media');
      if(media){
          var mediaName =media.get('name');
          var callType = interaction.get('callType');
          var screenPopActivitycreation = configuration.get('salesforce.activity-log.on-screenpop', 'false', 'crm-adapter')==='true';
          if(screenPopActivitycreation && mediaName==='voice' && (callType==='Internal' || callType==='Inbound')){
              return true;
          }
      }
      return false;
  };
  VoiceInteraction.prototype.getSavedActivityId = function () {
      var interaction = this.originalInteraction;
      var userData = interaction.get('userData');
      var savedActivity = userData['SF_started_activityId'];
      return savedActivity;
  };
  VoiceInteraction.prototype.getDurationInSec=function () {
      return Math.round(this.getDuration() / 1000);
  };

  VoiceInteraction.prototype.getSearshObjectType = function () {
      var interaction = this.originalInteraction;
      var media = interaction.get('media');
      if(media){
          var mediaName = media.get('name');
          var callType = interaction.get('callType');
          var screenPopSearchObjectType = configuration.get('screenpop.object-type', 'SOBJECT', 'crm-adapter');
          if(mediaName==='voice' && (callType==='Internal' || callType==='Inbound')){
              return screenPopSearchObjectType;
          }
      }

      return 'SOBJECT';
  };

    VoiceInteraction.prototype.getParametrFromAttachData = function (parametr) {
        var interaction = this.originalInteraction;
        var userData = interaction.get('userData');
        logger.debug('Interaction voice: Get from attach data:'+ parametr);
        return userData[''+parametr];
    };


    return VoiceInteraction;
});
