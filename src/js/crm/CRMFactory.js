define([
  'utils',
  'crm/Salesforce',
  'crm/Zendesk',
  'crm/USD',
  'crm/Lightning'
], function(utils, Salesforce, Zendesk, USD, Lightning) {

  var CRMFactory = function() {};
  CRMFactory.prototype.resolve = function() {
      /*var crmParam = utils.getUrlParam('crm', location.href);
      if (crmParam === 'zendesk') {
        return new Zendesk();
      } else if (crmParam === 'usd') {
        return new USD();
      } else if (crmParam === 'lightning'){
        return new Lightning();
      }
      return new Salesforce();*/

      return new Lightning();
  };

  return CRMFactory;

});