define([
  'lodash',

  'interactions/interactions',
  'events/globalEvent',
  'external/genesys',
  'events/crmEvents',
  'events/crmErrors',
  'logger',
  'crm/crm'
], function(_, interactions, globalEvent, genesys, crmEvents, crmErrors, logger, crm) {

  var Events = function() {
    this.resolveScreenPop = _.memoize(function(uid, events) {
        events.push('INTERACTION_SCREEN_POP');
        return uid;
    });
  };

  Events.prototype.resolveAgentDesktopEvent = function(data) {
      logger.debug('Events: Creating interaction for event data:', data);
      var interaction = interactions.create(data.interaction);

      if (!interaction) {
        logger.debug('Events: no interaction created for event:', data);
        return false;
      }

      var eventNames = this.resolveEventNames(data, interaction);

      _.each(eventNames, function(eventName) {
          logger.debug('Events: publishing event [' + eventName + ']:', interaction);
          globalEvent.trigger(eventName, interaction);
      });

      return eventNames;
  };

  Events.prototype.resolveEventNames = function(data, interaction) {
    var eventType = data.eventType;

    var basicEvent = 'INTERACTION_' + eventType;
    var eventNames = [basicEvent];

    if (interaction.shouldScreenPopAt(basicEvent)) {
      this.resolveScreenPop(interaction.getUID(), eventNames);
    }

    if (eventType === 'REMOVED') {
      if (!interaction.shouldMarkDoneAt()) {
        eventNames.push('INTERACTION_CANCELED');
      }
    }

    logger.debug('Events: resolveAgentDesktopEvent eventNames', eventNames);
    return eventNames;
  };

  Events.prototype.startListening = function() {
    var interactions = genesys.wwe.interactionManager.get('interactions');
    var that = this;

    crmEvents.startListening();
    crmErrors.startListening();

    interactions.on('add', function(interaction) {

      that.resolveAgentDesktopEvent(that.createInteractionEvent('ADDED', interaction));


      interaction.on('event', function(event) {
        that.resolveAgentDesktopEvent(event);
      });

    });

    interactions.on('remove', function(interaction) {

        that.resolveAgentDesktopEvent(
            that.createInteractionEvent('REMOVED', interaction)
        );

    });

      genesys.wwe.agent.on("change:state", function() {
          var name = genesys.wwe.agent.get('state');
          console.log('genesys.wwe.agent.on');
          logger.debug('change:state', name);
          crm.setIcon(name);

      }, {test:'test'});

      // genesys.wwe.mediaState.on("change:state", function() {
      //     var name = genesys.wwe.mediaState.get('state');
      //     console.log('genesys.wwe.mediaState.on');
      //     logger.debug('mediaState:name', name);
      //
      // });

  };

  /**
   * createInteractionEvent creates standard agent-desktop compliant event
   * @param {string} eventType
   * @param {interaction} interaction
   * @returns {{eventType: *, interaction: *}}
   */
  Events.prototype.createInteractionEvent = function(eventType, interaction, additionalData) {
      return _.merge({
            eventType: eventType,
            interaction: interaction
        }, additionalData);
  };


  return new Events();
});
