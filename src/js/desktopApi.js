define([
    'logger',
    'external/sforce',
    'external/genesys',
    'language'
], function(logger, sforce,genesys, language) {
  return {
    init:function(){
      var that=this;
      window.addEventListener('message', that.processPostMessage, false);
    },

    processPostMessage:function(event){
      var data = event.data;
      if(data.target==='test'){
        if (data.type==='softphoneIcon') {
            sforce.opencti.setSoftphoneItemIcon({
                key:'anchor',
                callback:function(response) {
                if (response.success) {
                    console.log('API method call executed successfully! returnValue:', response.returnValue);
                } else {
                    console.error('Something went wrong! Errors:', response.errors);
                }
            }
          });
        }
          if (data.type==='softphoneLable') {
              sforce.opencti.setSoftphoneItemLabel({
                  label:'Test test',
                  callback:function(response) {
                      if (response.success) {
                          console.log('API method call executed successfully! returnValue:', response.returnValue);
                      } else {
                          console.error('Something went wrong! Errors:', response.errors);
                      }
                  }
              });
          }
      }
      if(data.type==='getSection'){
          var sectionOptions = genesys.wwe.configuration.getOptionsForSection('crm-flow-section');
          console.log('API method call executed successfully! returnValue:', sectionOptions);
      }

      if(data.type==='runApex'){
          sforce.opencti.runApex({
              apexClass:'UserInfo',
              methodName:'getLanguage',
              methodParams:'',
              callback:function(response) {
                  if (response.success) {
                      console.log('API method call executed successfully! returnValue:', response.returnValue["runApex"].toLowerCase());
                      console.log(window.genesys.wwe.api.getLang(language[response.returnValue["runApex"]]));
                  } else {
                      console.error('Something went wrong! Errors:', response.errors);
                  }
              }
          });
      }
        if(data.type==='window'){
            console.log(window);
        }
      logger.debug('DesctopApi processPostMessage: '+ data);
    },

    getAgent: function() {
      return window.genesys.wwe.agent;
    },

    getEventBroker: function() {
      // TODO (shabunc): this somehow should be merged and/or coexist with our globalEvent object
      return window.genesys.wwe.eventBroker;
    },

    getInteractionManager: function() {
      return window.genesys.wwe.interactionManager;
    },

    getCommandManager: function() {
      return window.genesys.wwe.commandManager;
    },

    getConfiguration: function() {
      return window.genesys.wwe.configuration;
    },

    getOutboundManager: function(){
      return window.genesys.wwe.Outbound.OutboundManager;
    }
  }
});

// test script in salesforce
/*
document.getElementsByClassName('openctiSoftPhone')[1].contentWindow.postMessage({target:'test',type:'softphoneIcon'}, '*');
document.getElementsByClassName('openctiSoftPhone')[1].contentWindow.postMessage({target:'test',type:'softphoneLable'}, '*');
document.getElementsByClassName('openctiSoftPhone')[1].contentWindow.postMessage({target:'test',type:'getSection'}, '*');
document.getElementsByClassName('openctiSoftPhone')[1].contentWindow.postMessage({target:'test',type:'runApex'}, '*');
document.getElementsByClassName('openctiSoftPhone')[1].contentWindow.postMessage({target:'test',type:'window'}, '*');
*/
