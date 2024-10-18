define(function () {
  var AbstractCRM = function () {};

  AbstractCRM.prototype.onInteractionScreenPop = function () {};
  AbstractCRM.prototype.onInteractionAdded = function () {};
  AbstractCRM.prototype.onMarkDone = function () {};
  AbstractCRM.prototype.updateDataForTransfer = function () {};
  AbstractCRM.prototype.setOptions = function () {};
  AbstractCRM.prototype.onDial = function () {};
  AbstractCRM.prototype.isInConsole = function () {return false};
  AbstractCRM.prototype.isActivityHistorySupported = function () { return true};
  AbstractCRM.prototype.isInFocusPageTransferSupported = function() { return false};
  AbstractCRM.prototype.onInteractionCanceled = function () {};
  AbstractCRM.prototype.focus = function () {};

  // just to be sure that we won't break other CRMs
  AbstractCRM.prototype.getPageInfo = function () {return {then:function(){}}};

  /**
   * List of CRM javascript files that should be loaded to invoke third-party API
   */
  AbstractCRM.prototype.getResources = function () {
    // TODO (shabunc): may be we need to rename this
    return [];
  };

  return AbstractCRM;
});
