require.config({
  paths: {
    'salesforce_interaction': 'https://c.na1.visual.force.com/support/api/45.0/interaction',
    'salesforce_integration': 'https://c.na1.visual.force.com/support/console/45.0/integration',
    'lightning_integration' : 'https://c.na1.visual.force.com/support/api/45.0/lightning/opencti_min',
    'zendesk_integration'   : 'https://assets.zendesk.com/apps/sdk/latest/zaf_sdk'
  }
});

require([
  'bluebird',
  'lodash',
  'jquery',
  'crm/crm',
  'external/genesys',
  'voiceService',
  'events/globalEvent',
  'events/events',
  'commands',
  'logFactory',
  'loader',
  'external/APP_LOADER',
  'logger',
  'desktopApi'
], function(Promise, _, jquery, crm, genesys, voiceService, globalEvent, events, commands, logFactory, loader, APP_LOADER, logger,desktopApi) {

  window.$ = jquery;
  logFactory.enable('crm-workspace:*');
  var log = logFactory('crm-workspace:init');
  log('Awaiting for onGenesysAPIReady callback');

  globalEvent.SERVICE_INITIALIZED.add(function() {
    log('globalEvent.SERVICE_INITIALIZED event triggered');
    events.startListening();
    commands.init();
    desktopApi.init();

    crm.onDial(function(callData) {
      voiceService.dial(callData.number, callData);
    });

  });

  //init application 'https://localhost:3322'  /   https://192.168.1.138:443/ui/wwe'
  crmWorkspace.require(crm.getResources(), function() {
      logger.debug('genesys.wwe application is created');
      addApi();
      //addApi('https://192.168.0.101/ui/wwe');
      // addApi('https://localhost/ui/wwe');

      //addApi('https://docker-vm16.gws.genesys.com/ui/wwe');
  });


  window.onGenesysApiReady = function() {
      crm.setOptions();
      loader.init();
      logger.switchToAPI();
  };

  window.onunload = function() {
      logger.debug('DESTROY');
      crm.onDestroy();
  };

  function addApi(url) {
    url = url || (location.origin + '/ui/wwe');
    var api = document.createElement('script');
    api.src = url + '/api.js';
    api.setAttribute('data-genesys-api-callback', 'onGenesysApiReady');
    document.head.appendChild(api);
  }

  /*
    //sforce.opencti.getCallCenterSettings({callback: getCallCenterSettingsCallback});
  function getCallCenterSettingsCallback(response) {
      var url = response.returnValue['/reqGeneralInfo/reqWweUrl'] || location.origin + '/ui/wwe';
      addApi(url);
  }*/
});
