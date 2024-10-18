define([
  'lodash',
  'utils',
  'configuration',
  'interactions/ChatInteraction',
    'logger'
], function(_, utils, configuration, ChatInteraction,logger) {
    
    var OpenmediaInteraction = function(interaction) {
        this.originalInteraction = interaction;
        this.isOpenmedia = true;
    };
    
    OpenmediaInteraction.prototype = new ChatInteraction();
    
    OpenmediaInteraction.prototype.shouldScreenPopAt = function(eventName) {
        if (configuration.getAsBoolean('screenpop.openmedia.on-invite', false, 'crm-adapter')){
            return eventName == 'INTERACTION_INVITED';
        }
        return eventName == 'INTERACTION_ACCEPTED';
    };
    
    OpenmediaInteraction.prototype.getSubject = function() {
        var interaction = this.originalInteraction;
        return utils.getSalesforceParameter('templates.salesforce.openmedia.subject', interaction, _.bind(this.getTitle, this));
    };
    
    OpenmediaInteraction.prototype.shouldActivityBeCreated = function(){
        var mediaType = this.originalInteraction.get('htccInteraction').interactionType;
        logger.debug('Interaction: Openmedia type is [' + mediaType + ']...');
        var enabledTypes = configuration.get('salesforce.activity-log.enabled-openmedia-types', 'Inbound', 'crm-adapter');
        logger.debug('Interaction: salesforce.activity-log.enabled-openmedia-types is [' + enabledTypes + ']...');
        if (mediaType && enabledTypes.indexOf(mediaType) !== -1) {
            logger.debug('Interaction: Activity log should be created.');
            return true;
        }
        return false;

    };
    
    return OpenmediaInteraction;

});