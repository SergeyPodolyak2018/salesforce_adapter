define([
  'bluebird',
  'lodash',

  'events/globalEvent',
  'configuration',
  'utils',

  'external/sforce',
  'crm/AbstractCRM',
  'logger'
], function(Promise, _, globalEvent, configuration, utils, sforce, AbstractCRM, logger) {


  var USD = function() {};

  USD.prototype = new AbstractCRM();


  USD.prototype.onInteractionScreenPop = function(interaction) {

    var URI = 'http://localhost:5000/';
    var parameters = {};
    var userData = interaction.getUserData();

    var idKeyExpression = configuration.get('screenpop.id-key-regex', '^id_', 'crm-adapter');
    if (idKeyExpression === '') {
        idKeyExpression = '^id_';
    }
    
    var searchKeyExpression = configuration.get('screenpop.search-key-regex', '^cti_', 'crm-adapter');
    if (searchKeyExpression === '') {
      searchKeyExpression = '^cti_';
    }

    var idKeyRegex = new RegExp(idKeyExpression);
    var searchKeyRegex = new RegExp(searchKeyExpression);

    var shouldIncludeAni = configuration.get('screenpop.include-ani-in-search', 'true', 'crm-adapter');
    if (shouldIncludeAni === 'true') {
      var ani = interaction.getANI();

      if (ani) {
        // preprocess ani
        ani = utils.preprocessANI(ani);
        parameters['ANI'] = ani;
      }
    }
    else{
      parameters['ANI'] = 'undefined';
    }


    var matchingUserData = _.pickBy(userData, function (val, key) {
      return key && (!_.isEmpty(val)) && (searchKeyRegex.test(key) || idKeyRegex.test(key));
    });
    
    if (_.isEmpty(matchingUserData) && (parameters['ANI'] === 'undefined' || !parameters['ANI'])){
      return;
    }
    parameters = _.extend(parameters, matchingUserData);
    logger.debug('USD: Sending CTI request with parameters ' + JSON.stringify(parameters));
    

    //Send the request with the filtered parameters to the CTI listener
    $.post(URI, parameters);
  };

  USD.prototype.isActivityHistorySupported = function() {
    return false;
  };

  USD.prototype.isInConsole = function(callback) {
    if (callback) {
      callback({
        result: true
      });
    }
  };

  USD.prototype.getPageInfo = function() {
    return new Promise(function(resolve) {
      resolve();
    });
  };

  USD.prototype.updateDataForTransfer = function() {
    return Promise.resolve(true);
  };
  

  return USD;
});
