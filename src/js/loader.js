define([
    'utils',
  'bluebird',
  'external/document',
  'external/genesys',
  'crm/crm',
  'events/globalEvent',
  'logger',
    'desktopApi',
    'language',
    'configuration'
], function(utils, Promise, document, genesys, crm, globalEvent, logger,desktopApi, language, configuration) {

  var Loader = function() {};

  Loader.prototype.showComponents = function(waiting, login,  app) {
    logger.debug('Loader.prototype.showComponents');
    document.getElementById('myCustomWaiting').style.display = waiting;
    document.getElementById("authLoginContainer").style.display = login;
    document.getElementById('myCustomApp').style.display = app;
  };

  Loader.prototype.onAgentDesktopRendered = function() {
    logger.debug('App is rendered');
    globalEvent.SERVICE_INITIALIZED.dispatch();
    crm.keepSession();
    //Call the new method to check visibility
    // crm.checkVisibilityPeriodically();
  };

  Loader.prototype.onDataResolved = function() {
    var that = this;
    logger.debug('genesys.wwe applciation is authorized');
    logger.debug('WWE is loaded and Agent is logged in');
    genesys.wwe.eventBroker.on('agentDesktopRendered', function() {
      that.onAgentDesktopRendered();
    });
  };

  Loader.prototype.onApplicationCreated = function() {
      logger.debug('genesys.wwe applciation is created');
      //console.log('genesys.wwe applciation is created');
      var self = this;
      self.showComponents('none', 'none', 'block');
      self.onDataResolved();
  };

  Loader.prototype.isInConsoleResolved = function(response) {
    logger.debug('CRM isInConsole response: ' + JSON.stringify(response));
    var that = this;
    if (response.result) {
        crm.getLanguage()
            .then(function (salesforceLang) {
                // var optionList = configuration.get('login.list-available-locales', 'en-us', 'interaction-workspace');
                // console.log('login.list-available-locales: '+ optionList);

                return new Promise.resolve(genesys.wwe.api.getLang(language[salesforceLang]));
            })
            .catch(function (message) {
                logger.debug(message);
                return new Promise.resolve(genesys.wwe.api.getLang(''));

            })
            .then(function (language) {
                that.showComponents('none', 'block', 'none');
                var options = {};

                options.target = 'authLoginContainer';
                options.createNode = true;
                options.authMode = 'iframe';
                options.lang = language;
                options.wweMode = 'embedded';
                options.embeddedTarget = '.main_body';

                //genesys.localStorage.wwe.locale= language; - do not exist at this moment

                logger.debug('Auth.login set options: ' + JSON.stringify(options));
                genesys.wwe.auth.login(options,
                    function() {
                        logger.debug('genesys.wwe.auth.login Login Succeeded');
                        //console.log('genesys.wwe.auth.login Login Succeeded');
                        that.onApplicationCreated();
                    },
                    function(errorCode) {
                        //console.log('genesys.wwe.auth.login error:');
                        logger.debug('genesys.wwe.auth.login error:' + errorCode);
                    },
                    function(progressType, message) {
                        // Login progress status
                        console.log("Login progress: " + progressType);
                        switch(progressType) {
                            case "authenticationStarted":
                                logger.debug("authenticationStarted: " + message);
                                // When the authentication has been prompted to the user
                                break;
                            case "authenticationEnded":
                                logger.debug("authenticationEnded: " + message);
                                // When the authentication is completed
                                break;
                            case "authenticationPopupClosed":
                                logger.debug("authenticationPopupClosed: " + message);
                                // When the authentication popup has been closed without been authenticated
                                break;
                            case "authenticationNotNeeded":
                                logger.debug("authenticationNotNeeded: " + message);
                                // When the authentication is not needed because the user is already authenticated
                                break;
                            case "initializationFailed":
                                // When something is wrong with Workspace initialization
                                logger.debug("Initialization failed: " + message);
                                break;
                            default:
                                break;
                        }
                    }
                );
            });

    } else {
      that.showComponents('none', 'none', 'none');
      document.getElementById('notInConsole').style.display = 'block';
    }
  };

  Loader.prototype.init = function() {
    logger.debug('Loader.prototype.init');
    var that = this;

    crm.isInConsole(function(response) {
      that.isInConsoleResolved(response);
    });


  };

  return new Loader();
});
