define([
  'lodash',
  'external/genesys',
    'version'
], function (_, genesys,version) {
  var prefix='[crm-workspace - '+version.version+']';
  var Logger = function() {
      //TODO (shabunc): move this to SimpleLogger
      console.log("version" + version);
      this.logger = {
        debug: function(msg) {
          // console.log('[DEBUG] [crm-workspace - '+version.version+']', msg);
            console.log('[DEBUG] '+ prefix, msg);
        }
      }
  };

  /**
   * Returning saved logs - the name is consistent with CRM Adapter
   * @returns {Array}
   */
  Logger.prototype.getMessages = function() {
    return _.map(this.getFeedbackLogs(), 'log');
  };

  
  Logger.prototype.switchToAPI = function() {
    this.logger = genesys.wwe.createLogger('crm-workspace - '+ version.version);
  };

  Logger.prototype.serializeArgument = function(argument) {
    if (typeof argument == 'object') {
        try {
          return JSON.stringify(argument, null, 2);
        } catch(e) {
          return argument
        }
    }

    return argument;
  };

  Logger.prototype.serializeArguments = function(args) {
    var that = this;
    return _.map(args, function(arg) {
      return that.serializeArgument(arg);
    });
  };

  Logger.prototype.debug = function() {
    return this.logger.debug.apply(this.logger, this.serializeArguments(arguments));
  };
  Logger.prototype.error = function() {
      return this.logger.error.apply(this.logger, this.serializeArguments(arguments));
  };

  Logger.prototype.getFeedbackLogs = function() {
    return genesys.wwe.Utils.getFeedbackLogs();
  };


  var crmLogger = new Logger();

  // we need this for test
  window.crmLogger = crmLogger;

  return crmLogger;
});
