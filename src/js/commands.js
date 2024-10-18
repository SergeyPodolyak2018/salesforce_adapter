
define([
  'bluebird',
  'lodash',
  'external/genesys',
  'events/events',
  'crm/crm',
  'logger',
  'interactions/interactions'
], function (Promise, _, genesys, events, crm, logger, interactions) {
  return {
    /**
     * make native-like promise $.when-compatible
     */
    wrapPromise: function(promise) {
      return {
        promise: function() {
          return promise;
        }
      }
    },

    onCloseExecute: function(data, originalInteraction, preclose) {
      logger.debug('Commands onCloseExecute: data, originalInteraction, preclose = '+ preclose);
      var shouldUpdate = genesys.wwe.configuration.getAsBoolean('interaction.case-data.is-read-only-on-idle') === false;
      var defer = window.$.Deferred();

      if(originalInteraction){
        originalInteraction.isMarkingDone = true;
      }

      crm.getPageInfo().then(function(pageInfo) {

        interaction = interactions.create(originalInteraction);

        
        if (!interaction){
          logger.debug('Commands: interaction has no adapter-applicable media type');
          defer.resolve();
          return;
        }


        if (!shouldUpdate || (originalInteraction.get('htccInteraction') && originalInteraction.get('htccInteraction').state === 'InWorkbin' && !preclose)) {
            logger.debug('InteractionCloseHook is not updating interaction');
            updatePageInfo = new window.$.Deferred().resolve();
            
        } else {
            var updatePageInfo = interaction.updateInteractionByPageInfo(pageInfo);
        }


        window.$.when(updatePageInfo).then(function(){
            logger.debug('Events: Activity shouldActivityBeCreated ' + interaction.shouldActivityBeCreated() + '.');
          if (interaction.shouldActivityBeCreated() && !preclose) {
            // TODO (shabunc): it looks like it would be better to pass wrapped interaction to events.createInteractionEvent
            var interactionEvent = events.createInteractionEvent('MARK_DONE', originalInteraction, {
              pageInfo: pageInfo
            }); 

            events.resolveAgentDesktopEvent(interactionEvent);
          } else {
            logger.debug('Events: Activity log should NOT be created. Preclose is ' + preclose + '.');
          }
          defer.resolve();
        })
      },function(err){
        logger.debug(err);
        defer.resolve();
      });
      return defer.promise();
    },

    getInteractionCloseHookDescription: function() {
      var that = this;
      return {
        name: 'InteractionCloseHook',

        onExecute: function(data) {
          var originalInteraction = data.interaction;
            logger.debug('CloseHook getInteractionCloseHookDescription ', data);
          if (!originalInteraction) {
            logger.debug('InteractionCloseHook interaction not found in data:', data);
            return false;
          }

          return that.onCloseExecute(data, originalInteraction, originalInteraction.isMarkingDone);
        }
      }
    },
    
    getParentInteractionCloseExecute: function(isPreclose){
        var that = this;

        return function(data) {
            var originalInteraction = data.interaction;
            logger.debug('CloseHook getParentInteractionCloseExecute preclose = '+isPreclose, data);
            if (!originalInteraction) {
              logger.debug('InteractionCloseHook interaction not found in data:', data);
              return false;
            }

            var parentInteraction = originalInteraction.get('parentInteraction');
            if (!parentInteraction) {
               logger.debug('No parent interaction found, must be non-reply outbound.');
               return that.onCloseExecute(data, originalInteraction, isPreclose);
            }

            return that.onCloseExecute(data, parentInteraction, isPreclose);
          }
    },

    getParentInteractionCloseHookDescription: function() {
      var that = this;
        logger.debug('CloseHook getParentInteractionCloseHookDescription ');
      return {
        name: 'ParentInteractionCloseHook',
        
        isPreclose: false,

        onExecute: _.bind(that.getParentInteractionCloseExecute(false), that)
      }
    },
    
    getPrecloseHookDescription: function() {
        var that = this;
        logger.debug('CloseHook getPrecloseHookDescription ');
        return {
          name: 'ParentInteractionCloseHook',

          onExecute: _.bind(that.getParentInteractionCloseExecute(true), that)
        }
    },
    
    init: function() {
      var that = this;
      var CRMUpdateTransferData = genesys.wwe.Main.ChainOfCommand.extend(
        {
          name: 'CRMUpdateTransferData',

          onExecute: function(context) {
            return that.wrapPromise(crm.updateDataForTransfer(context));
          }
        });


      var commandManager = genesys.wwe.commandManager;

      if(crm.isInFocusPageTransferSupported()) {
        commandManager.insertCommandBefore('InteractionVoiceInitiateTransfer', 'InitiateTransfer', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionVoiceInitiateConference', 'InitiateConference', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionVoiceSingleStepConference', 'AddConferencedComment', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionVoiceSingleStepTransfer', 'AddTransferredComment', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionChatInitiateTransfer', 'InitiateTransfer', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionChatInitiateConference', 'InitiateConference', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionChatSingleStepConference', 'AddConferenceEstablishedComment', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionOpenMediaSingleStepTransfer', 'AddTransferredComment', CRMUpdateTransferData);
        commandManager.insertCommandBefore('InteractionWorkitemSingleStepTransfer', 'AddTransferredComment', CRMUpdateTransferData);
      }

      var InteractionCloseHook =  genesys.wwe.Main.ChainOfCommand.extend(this.getInteractionCloseHookDescription());

      var InteractionCloseHookEnsure =  genesys.wwe.Main.ChainOfCommand.extend({
        name: 'InteractionCloseHookEnsure',

        onExecute: function() {
          // this is cheap yet makes debugging easier
          logger.debug('InteractionCloseHook executed successfully');
        }
      });

      if (crm.isActivityHistorySupported()) {
        commandManager.insertCommandBefore('InteractionVoiceClose', 'SaveComment', InteractionCloseHook);
        commandManager.insertCommandBefore('InteractionVoiceClose', 'SaveComment', InteractionCloseHookEnsure);

        commandManager.insertCommandAfter('InteractionBeforeClose', 'IsItPossibleToClose', InteractionCloseHookEnsure);
        commandManager.insertCommandAfter('InteractionBeforeClose', 'IsItPossibleToClose', InteractionCloseHook);

        var ParentInteractionCloseHook = genesys.wwe.Main.ChainOfCommand.extend(this.getParentInteractionCloseHookDescription());
        commandManager.insertCommandAfter('InteractionEmailSend', 'CheckMandatoryCaseData', ParentInteractionCloseHook);
        commandManager.insertCommandAfter('InteractionEmailSend', 'ParentInteractionCloseHook', InteractionCloseHookEnsure);
        
        var PreCloseHook = genesys.wwe.Main.ChainOfCommand.extend(this.getPrecloseHookDescription());
        
        commandManager.insertCommandBefore('InteractionEmailSend', 'IsPossibleToSend', PreCloseHook);

        
      }
    }
  };
});
