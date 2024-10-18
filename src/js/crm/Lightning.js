define([
    'bluebird',
    'external/sforce',
    'crm/Salesforce',
    'logger',
    'configuration',
    'external/genesys',
    'utils',
], function(Promise, sforce, Salesforce, logger, configuration, genesys, utils) {


  var Lightning = function() {
      this.intervalId = '';
      this.checkSoftphoneVisibilityInterval='';
  };

  Lightning.prototype = new Salesforce();

  Lightning.prototype.setOptions = function() {
    return true;
  };

  Lightning.prototype.messageAdded = function() {
      var self = this;
      sforce.opencti.isSoftphonePanelVisible({
          callback: function(response) {
              if (!response.returnValue.visible) {
                  self.focus();
              }
          }
      });
  };

  Lightning.prototype.keepSession = function() {
      var keepAlive = configuration.get('salesforce.keep-session-alive', 'false', 'crm-adapter') === 'true';
      if (keepAlive) {
          this.intervalId = setInterval(this.refreshSession, 30000);
      }
  };

  Lightning.prototype.refreshSession = function() {
      sforce.opencti.runApex({
          apexClass: 'genesysDummyClass',
          methodName: 'genesysDummySessionRenew',
          callback:function() {
              console.info('Keep session alive');
          }
      });
  };


  Lightning.prototype.setVisible = function(visibilityFlag) {
    logger.debug('Lightning: setVisible [' + visibilityFlag + ']...');
    sforce.opencti.setSoftphonePanelVisibility({visible: visibilityFlag, callback: function(response){
      if(response.success){
        logger.debug('Lightning: setVisible succeed! returnValue:' + response.returnValue);
         // genesys.wwe.viewManager.updateLayout();
      }else{
        logger.debug('Lightning: setVisible failed! Errors: '+ response.errors);
      }
    }});
  };

  Lightning.prototype.checkVisible = function(action) {
    logger.debug('Lightning: checkVisible...');
    var callback = function(response) {
        if (response.success) {
            logger.debug('API method isSoftphonePanelVisible executed successfully! returnValue:', response.returnValue);
            if(!response.returnValue.visible){
                action(true);
            }
        } else {
            logger.debug('Something went in isSoftphonePanelVisible wrong! Errors:', response.errors);
        }
    };
    sforce.opencti.isSoftphonePanelVisible({callback: callback})
  };

  Lightning.prototype.getTask = function(interaction, pageInfo, externalStatus) {
    var task = '';
    var status;
    var savedActivityId = interaction.getSavedActivityId();
    if(interaction.shouldSaveLog() && !savedActivityId){
        if (pageInfo.SCREEN_POP_DATA && pageInfo.SCREEN_POP_DATA['params'] && pageInfo.SCREEN_POP_DATA.params['recordId']){
            var recordId = pageInfo.SCREEN_POP_DATA.params.recordId;
            var pageInfoNew = pageInfo[recordId];

            switch (pageInfoNew.RecordType) {
                case 'Contact':
                case 'Lead':
                    task += 'WhoId=' + encodeURIComponent(pageInfoNew.Id) + '&';
                    break;
                default:
                    task += 'WhatId=' + encodeURIComponent(pageInfoNew.Id) + '&';
                    break;
            }
        }
    }
    if(externalStatus){
        status=externalStatus;
    }else{
        status = configuration.get('salesforce.activity-log.status', 'Completed', 'crm-adapter');
    }
    if(savedActivityId){
        task += 'Id=' +savedActivityId+ '&';
    }else{
        task += 'Subject=' + encodeURIComponent(interaction.getSubject()) + '&';
        task += 'Priority=High&';
    }
    task += interaction.getTask()+ '&';
    task += 'Status='+status+'&';
    var date = new Date();
    var value =  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    task += 'ActivityDate=' + value;

    return task;
  };



  Lightning.prototype.apiSaveLog = function(task, callback){
    logger.debug('Lightning.apiSaveLog');
    var taskParams = task.split('&');
    var valueObject = {entityApiName: 'Task'};
    var taskPair;
    for (var i = 0; i < taskParams.length; i++){
      taskPair = taskParams[i].split('=');
      taskPair[0] = decodeURIComponent(taskPair[0]);
      taskPair[1] = decodeURIComponent(taskPair[1]);
      if (taskPair[0] === 'CallDurationInSeconds'){
        valueObject[taskPair[0]] = parseInt(taskPair[1]);
      } else if (configuration.get('salesforce.chat.transcript-custom-field-name', '', 'crm-adapter') === taskPair[0] && taskPair[1].length > 255){
         valueObject[taskPair[0]] = taskPair[1].substring(0, 255);
      } else {
        valueObject[taskPair[0]] = taskPair[1];
      }
      
    }

    logger.debug('Lightning.apiSaveLog: saveLog value: ' + JSON.stringify(valueObject));
    sforce.opencti.saveLog({value: valueObject, callback: callback});
  };

  Lightning.prototype.apiScreenPop = function(objectId, callback){
    sforce.opencti.screenPop({
        type: sforce.opencti.SCREENPOP_TYPE.SOBJECT,
        params: {recordId: objectId},
        callback: callback});
  };
  Lightning.prototype.apiScreenPopWithParametr = function(paramObject,type){
    logger.debug('Lightning.apiScreenPopWithParametr: parametrs: ' + JSON.stringify(paramObject));
    sforce.opencti.screenPop({
        type: sforce.opencti.SCREENPOP_TYPE[''+type],
        params: paramObject,
        callback: function(response) {
            logger.debug('Salesforce: screenPop with type '+type+': ', response);
        }});
  };

  Lightning.prototype.apiSearchAndScreenPop = function(search, url, callback) {
    sforce.opencti.searchAndScreenPop({
        searchParams: search,
        queryParams: url,
        callType: sforce.opencti.CALL_TYPE.INBOUND,
        callback: callback
    });
  };

  Lightning.prototype.refreshView = function(callback) {
      callback = callback || function() {
          logger.debug('Session Alive');
      };
      sforce.opencti.refreshView({callback: callback});
  };

  Lightning.prototype.apiEnableClickToDial = function(callback){
    sforce.opencti.enableClickToDial({callback: callback});
  };

  Lightning.prototype.apiOnClickToDial = function(callback){
    sforce.opencti.onClickToDial({listener: function(payload){callback({result: payload});}});
  };


  //Important ================================================================

  // Lightning.prototype.apiGetPageInfo = function(callback){
  //   sforce.opencti.getAppViewInfo({callback: function(payload){
  //       if (payload.returnValue){
  //           payload.returnValue.objectId = payload.returnValue.recordId;
  //           payload.returnValue.object = payload.returnValue.objectType;
  //       }
  //       callback({result: payload.returnValue});
  //   }});
  // };
  Lightning.prototype.apiGetPageInfo = function(iteraction,callback){


    if(iteraction){
        var searchData = this.searchObjectGenerator(iteraction, 'OR');
        logger.debug('Lightning: apiGetPageInfo', searchData);
        sforce.opencti.searchAndScreenPop({
                searchParams: searchData.search,
                queryParams: searchData.url,
                callType: sforce.opencti.CALL_TYPE.INBOUND,
                deferred:true,
                callback: function(payload){

                    if (payload.returnValue){
                        payload.returnValue.objectId = payload.returnValue.recordId;
                        payload.returnValue.object = payload.returnValue.objectType;
                    }
                    callback({result: payload.returnValue});
                }
            });
    }else{
        // callback({result: undefined});

        sforce.opencti.getAppViewInfo({callback: function(payload){
                if (payload.returnValue){
                    payload.returnValue.objectId = payload.returnValue.recordId;
                    payload.returnValue.object = payload.returnValue.objectType;
                }
                callback({result: payload.returnValue});
            }});
    }

  };
  //===========================================================================

  Lightning.prototype.isInConsole = function(callBack) {
    //workaround for Summer '17 rendering issue, remove when issue fixed
    document.getElementById('myCustomWWE').style.height = 'calc(100% - 2.5rem)';
    callBack({result: true});
  };
  
  Lightning.prototype.getResources = function() {
    return ['lightning_integration'];
  };

  Lightning.prototype.checkVisibilityPeriodically = function() {
      var stateVisibil=false;
      var callback = function(response){
          if (response.returnValue.visible) {
              if(!stateVisibil){
                  logger.debug('Lightning: timer updateLayout');
                  if(genesys.hasOwnProperty('wwe') && genesys.wwe.hasOwnProperty('viewManager')){
                      setTimeout(function () {
                          genesys.wwe.viewManager.updateLayout();
                      },200);
                      stateVisibil=true;
                  }
              }
          }else{
              stateVisibil=false;
          }
      };

      this.checkSoftphoneVisibilityInterval=setInterval(function () {
          if(sforce.hasOwnProperty('opencti') && sforce.opencti.hasOwnProperty('isSoftphonePanelVisible')){
              sforce.opencti.isSoftphonePanelVisible({
                  callback: callback
              });
          }
      },1000)
  };

    Lightning.prototype.setIcon = function(mainstate) {
        var state = mainstate.get('state');
        logger.debug('Lightning: setIcon', state);
        var key='call';
        var lable = 'Gplus';
        switch (state) {
            case 'UNKNOWN':
                key='clear';
                lable = 'Gplus';
                break;
            case 'LOGOUT':
                key='clear';
                lable = 'Logout';
                break;
            case 'READY':
                key='routing_offline';
                lable = 'Ready';
                break;
            case 'PARTIAL_READY':
                key='away';
                lable = 'Partial ready';
                break;
            case 'NOT_READY':
                key='error';
                lable = 'Not ready';
                break;
            case 'READY_ACTION_CODE':
                key='routing_offline';
                lable = 'Gplus';
                break;
            case 'NOT_READY_ACTION_CODE':
                key='routing_offline';
                lable = 'Gplus';
                break;
            case 'NOT_READY_AFTER_CALLWORK':
                key='routing_offline';
                lable = 'Gplus';
                break;
            case 'NOT_READY_AFTER_CALLWORK_ACTION_CODE':
                key='routing_offline';
                lable = 'Gplus';
                break;
            case 'DND_ON':
                key='ban';
                lable = 'Do not disturb';
                break;
            case 'OUT_OF_SERVICE':
                key='routing_offline';
                lable = 'Gplus';
                break;
            case 'LOGOUT_DND_ON':
                key='routing_offline';
                lable = 'Gplus';
                break;
            default: break;
        }


        sforce.opencti.setSoftphoneItemIcon({
            key:key,
            callback:function(response) {
                if (response.success) {
                    console.log('API method setSoftphoneItemIcon call executed successfully! returnValue:', response.returnValue);
                } else {
                    console.error('Something went wrong with setSoftphoneItemIcon! Errors:', response.errors);
                }
            }
        });
        sforce.opencti.setSoftphoneItemLabel({
            label:lable,
            callback:function(response) {
                if (response.success) {
                    console.log('API method setSoftphoneItemLabel executed successfully! returnValue:', response.returnValue);
                } else {
                    console.error('Something went wrong with setSoftphoneItemLabel ! Errors:', response.errors);
                }
            }
        });

    };
    Lightning.prototype.getLanguage = function() {
        return new Promise(function(resolve, reject) {
            sforce.opencti.runApex({
                apexClass:'UserInfo',
                methodName:'getLanguage',
                methodParams:'',
                callback:function(response) {
                    if (response.success) {
                        logger.debug('API method call executed successfully! returnValue:', response.returnValue);
                        resolve(response.returnValue["runApex"]);
                        // console.log(window.genesys.wwe.api.getLang(language[response.returnValue["runApex"]]));
                    } else {
                        logger.debug('Something went wrong! Errors:', response.errors);
                        reject('Something went wrong!: Salesforce do not return language');
                    }
                }
            });
        });
    };

  Lightning.prototype.onDestroy = function() {
      if (this.intervalId) {
          clearInterval(this.intervalId)
      }
      if (this.checkSoftphoneVisibilityInterval) {
          clearInterval(this.checkSoftphoneVisibilityInterval)
      }

  };

  return Lightning;
});
