define([
  'bluebird',
  'lodash',

  'events/globalEvent',
  'configuration',
  'utils',

  'external/sforce',
  'crm/AbstractCRM',
  'logger',
  'jquery',
], function(Promise, _, globalEvent, configuration, utils, sforce, AbstractCRM, logger, $) {


  var Salesforce = function() {
  };

  Salesforce.prototype = new AbstractCRM();

   Salesforce.prototype.isInFocusPageTransferSupported = function() {
     return true;
   };

   Salesforce.prototype.onInteractionScreenPop = function(interaction) {
     logger.debug('Salesforce: onInteractionScreenPop:', interaction);
     this.resolveScreenPop(interaction);
   };

   Salesforce.prototype.onInteractionAdded = function() {
     logger.debug('Salesforce: onInteractionAdded');
     var action = this.setVisible;
     this.checkVisible(action)
   };

   Salesforce.prototype.onInteractionCanceled = function() {
       logger.debug('Salesforce: onInteractionCanceled');
   };


   Salesforce.prototype.onMarkDone = function(interaction) {
     logger.debug('Salesforce: onMarkDone' + JSON.stringify(interaction));
     this.saveLog(interaction);
   };

   Salesforce.prototype.focus = function(){
       logger.debug('Salesforce: focus');
      //this.setVisible(true);
       var action = this.setVisible;
       this.checkVisible(action)
   };

    Salesforce.prototype.checkVisible = function(action){
        action(true);
    };

   Salesforce.prototype.setOptions = function() {

     logger.debug('Salesforce: calling setCustomConsoleComponentPopoutable...');
     try {
       sforce.console.setCustomConsoleComponentPopoutable(true, function (result) {
         logger.debug('Salesforce: setCustomConsoleComponentPopoutable result:', result);
       });
     } catch (e) {
       logger.debug('Salesforce: ', e);
       return false;
     }

    logger.debug('Salesforce: calling setCustomConsoleComponentButtonText...');
    try {
      sforce.console.setCustomConsoleComponentButtonText('Workspace', function (result) {
        logger.debug('Salesforce: setCustomConsoleComponentButtonText result:', result);
      });
    } catch(e) {
      logger.debug('Salesforce: Handling error:', e);
      return false;
    }

    return true;
   };

  Salesforce.prototype.setVisible = function(visibilityFlag) {
    logger.debug('Salesforce: setVisible [' + visibilityFlag + ']...');
    sforce.interaction.setVisible(visibilityFlag);
  };

  Salesforce.prototype.getTask = function(interaction, pageInfo) {
    var task = '';
    if(encodeURIComponent(pageInfo.objectId) !== 'undefined') {
      switch (pageInfo.object) {
          case 'Contact':
          case 'Lead':
              task += 'WhoId=' + encodeURIComponent(pageInfo.objectId) + '&';
              break;
          default:
              task += 'WhatId=' + encodeURIComponent(pageInfo.objectId) + '&';
              break;
      }
    }

    task += 'Subject=' + encodeURIComponent(interaction.getSubject()) + '&';
    task += 'Status=Completed&';
    task += 'Priority=High&';

    var date = new Date();
    var value =  date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    task += 'ActivityDate=' + value + '&';

    task += interaction.getTask();

    return task;
  };

  Salesforce.prototype.onLogdataResolved = function(interaction, pageInfo) {
    var task = this.getTask(interaction, pageInfo);
    logger.debug('Salesforce: saveLog with task [' + task + ']...');
    this.apiSaveLog(task, function (result) {
      logger.debug('Salesforce: saveLog result:', result);
    });
  };
  
  Salesforce.prototype.apiSaveLog = function(task, callback){
    sforce.interaction.saveLog('Task', task, callback);
  };

  Salesforce.prototype.saveLog = function(interaction) {
    var that = this;
    var iteractionTemp = interaction;
    this.getPageInfo(iteractionTemp).then(function(pageInfo) {
      that.onLogdataResolved(iteractionTemp, pageInfo)
    },function (res) {
        logger.debug('Salesforce: getPageInfo rejected:', res);
    });
  };
  

  Salesforce.prototype.resolveScreenPop = function(interaction) {
    var that=this;
    var userData = interaction.getUserData();
    this.initTranscriptSubscription(interaction);
    var objectId = this.getObjectId(userData);
    // this.searchAndScreenPop(interaction);
    objectType = interaction.getSearshObjectType();
    if(objectType==='SOBJECT'){
        if (objectId) {
            logger.debug('Salesforce: screenPop with [' + objectId + ']...');
            this.apiScreenPop(objectId, function(response) {
                logger.debug('Salesforce: screenPop response: ', response);
                if(interaction.souldCreateActivityOnScreenPop()){
                    that.saveLogOnScreenPop(interaction,undefined,objectId);
                }
            });
        }else {
            this.searchAndScreenPop(interaction);
        }
    }else{
        var compatibleObject = utils.prepareObjectForScreenPopWithParametr(objectType,interaction);
        if(compatibleObject){
            this.apiScreenPopWithParametr(compatibleObject,objectType);
        }
    }

  };

  Salesforce.prototype.initTranscriptSubscription = function(interaction) {
    var transcript = null;
    if (interaction.originalInteraction) {
      transcript = interaction.originalInteraction.get('transcript');
    }
    if(interaction.transcript) {
      transcript = interaction.transcript;
    }

    if (transcript) {
      transcript.on("add", this.messageAdded, this)
    }
  };

  Salesforce.prototype.messageAdded = function() {
  };

  Salesforce.prototype.apiScreenPop = function(objectId, callback){
    sforce.interaction.screenPop(objectId, true, callback);
  };

  Salesforce.prototype.searchAndScreenPop = function (interaction) {
    // var userData = interaction.getUserData();
    //
    // var searchKeyExpression = configuration.get('screenpop.search-key-regex', '^cti_', 'crm-adapter');
    // if (searchKeyExpression === '') {
    //   searchKeyExpression = '^cti_';
    // }
    // var searchKeyRegex = new RegExp(searchKeyExpression);
    //
    // var searchFragments = [];
    // var urlFragments = [];
    // // TODO (shabunc): include real config, still discussed with Stéphane
    // var shouldIncludeAni = configuration.get('screenpop.include-ani-in-search', 'true', 'crm-adapter');
    // if (shouldIncludeAni == 'true') {
    //   var ani = interaction.getANI();
    //
    //   if (ani) {
    //     // preprocess ani
    //     ani = utils.preprocessANI(ani);
    //     searchFragments.push(ani);
    //     urlFragments.push('ANI=' + ani);
    //   }
    // }
    //
    //
    // var matchingUserData = _.pickBy(userData, function (val, key) {
    //   return key && (!_.isEmpty(val)) && searchKeyRegex.test(key);
    // });
    //
    //
    // var search = searchFragments.concat(_.map(matchingUserData)).join(' OR ');
    // var url = urlFragments.concat(_.map(matchingUserData, function(val, key) {
    //   return (encodeURIComponent(key) + '=' + encodeURIComponent(val));
    // })).join('&');
    var that=this;
    var searchObject = this.searchObjectGenerator(interaction,'OR');
    if (searchObject.search && searchObject.url) {
      logger.debug('Salesforce: Sending searchAndScreenPop with search[' + searchObject.search + '] and url [' + searchObject.url + ']...');
      this.apiSearchAndScreenPop(searchObject.search, searchObject.url, function (response) {
        logger.debug('Salesforce: searchAndScreenPop response:', response);
        if(interaction.souldCreateActivityOnScreenPop()){
            // that.apiGetPageInfo(null,callBackFunction);
            that.saveLogOnScreenPop(interaction,response,undefined);
        }
      });
    }else{
        logger.debug('Salesforce: searchAndScreenPop unfortunately search is empty');
    }
  };
  
  Salesforce.prototype.apiSearchAndScreenPop = function(search, url, callback) {
    sforce.interaction.searchAndScreenPop(search, url, 'inbound', callback);
  };

  Salesforce.prototype.enableClickToDial = function() {
    var that = this;
    logger.debug('Salesforce: enableClickToDial...');
    return new Promise(function(resolve, reject) {

      that.apiEnableClickToDial(function(data) {
        logger.debug('Salesforce: enableClickToDial result:', data);
        if (!(data.result || data.success)) {
          reject('NO_RESULT');
        } else {
          resolve();
        }
      });

    });

  };
  
  Salesforce.prototype.apiEnableClickToDial = function(callback){
    sforce.interaction.cti.enableClickToDial(callback);
  };

  Salesforce.prototype.onClickToDial = function(handler) {

    this.apiOnClickToDial(function(data) {
      if (data.result) {
        handler(data.result);
      }
    });

  };
  
  Salesforce.prototype.apiOnClickToDial = function(callback){
    sforce.interaction.cti.onClickToDial(function(data){
        if (data.result){
            data.result = JSON.parse(data.result)
        }
        callback(data)
    });
  };

  Salesforce.prototype.onDial = function(handler) {
    var  that = this;
    return _.bind(this.enableClickToDial, this)().then(function() {
      _.bind(that.onClickToDial, that)(handler);
    });
  };

  Salesforce.prototype.getObjectId = function(data) {
    var idKeyExpression = configuration.get('screenpop.id-key-regex', '^id_', 'crm-adapter');
    if (idKeyExpression === '') {
        idKeyExpression = '^id_';
    }

    var idKeyRegex = new RegExp(idKeyExpression);

    return _.find(data, function(val, key) {
        return key && idKeyRegex.test(key);
    });
  };

  // Salesforce.prototype.getPageInfo = function() {
  //
  //   logger.debug('Salesforce: requesting page info...');
  //   var defer = $.Deferred();
  //
  //   this.apiGetPageInfo(function (res) {
  //       logger.debug('Salesforce: getPageInfo result:', res);
  //       if(!res.result) {
  //         defer.reject('NO_RESULT');
  //       } else {
  //         defer.resolve(res.result);
  //       }
  //   });
  //   return defer;
  //
  // };
    Salesforce.prototype.getPageInfo = function(iteraction) {

        logger.debug('Salesforce: requesting page info...');
        var defer = $.Deferred();

        this.apiGetPageInfo(iteraction,function (res) {
            logger.debug('Salesforce: getPageInfo result:', res);
            if(!res.result) {
                defer.reject('NO_RESULT');
            } else {
                defer.resolve(res.result);
            }
        });
        return defer;

    };
  
  Salesforce.prototype.apiGetPageInfo = function(interaction, callback){
    sforce.interaction.getPageInfo(function(res){
        if (res.result){
            res.result = JSON.parse(res.result);
        }
        callback(res);
    });
  };

  Salesforce.prototype.updateDataForTransfer = function(context) {
    // TODO (shabunc): ask cmunn is it ok to resolve with different values

    var value = configuration.get('salesforce.enable-in-focus-page-transfer', 'false', 'crm-adapter');
    if (value === 'false') {
      return $.Deferred().resolve('UPDATE_DATA_FOCUS_PAGE_DISABLED');
    }

    return this.getPageInfo().then(function(pageInfo) {

      logger.debug('PAGE_INFO', pageInfo);

      if (pageInfo.objectId) {

        if (!context.userData) {
          context.userData = {};
        }

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

        var ignoredKeysFilter = function(val, key) {
          return key && (idKeyRegex.test(key) || searchKeyRegex.test(key));
        };

        var keysToRemove = [];
        context.userData = _.omitBy(context.userData, function(val, key) {
            var toOmit = ignoredKeysFilter(val, key);
            if (toOmit) {
                keysToRemove.push(key);
            }
            return toOmit;
        });


        _.each(
          _.uniq(
            keysToRemove.concat(
              _.keys(_.pickBy(context.interaction.get('userData'), ignoredKeysFilter))
            )
          ), function(key) {
            context.interaction.deleteUserData(key);
          });

        var transferObjectKey = configuration.get('screenpop.transfer-object-key', 'id_transfer_object', 'crm-adapter');
        var data = {};
        data[transferObjectKey] = pageInfo.objectId;
        context.interaction.updateUserData(data);
        context.userData[transferObjectKey] = pageInfo.objectId;

        logger.debug('GOING TO RETURN');

        return $.Deferred().resolve('UPDATE_DATA_DONE');
      } else {
        return $.Deferred().resolve('UPDATE_DATA_OBJECT_ID_MISSING');
      }

    }, function() {
      return $.Deferred().resolve('UPDATE_DATA_PAGE_INFO_REJECTED'); // TODO (cmunn): Double check that we should continue here.
    });


  };

  Salesforce.prototype.isInConsole = function(callBack) {
    logger.debug('Salesforce isInConsole request');
    sforce.interaction.isInConsole(callBack);
  };

  Salesforce.prototype.getResources = function() {
     return [
       'salesforce_interaction',
       'salesforce_integration'
     ]
  };

  Salesforce.prototype.onDestroy = function() {};

  Salesforce.prototype.searchObjectGenerator = function (interaction, logicOperator) {
      var userData = interaction.getUserData();
      var searchKeyExpression;
      var searchKeyRegex;
      var searchFragments = [];
      var urlFragments = [];
      var shouldIncludeAni;
      var matchingUserData;
      var ani;
      var dnis;
      var email;
      var revertAniDni = interaction.revertAniDni();
      var sfContactData = userData['SF_Contact_Data'];
      var interactionTypeName = interaction.getTypeName();
      var shouldIncludeDnis = configuration.get('screenpop.include-dnis-in-search', 'false', 'crm-adapter')==='true';


      searchKeyExpression = configuration.get('screenpop.search-key-regex', '^cti_', 'crm-adapter');
      if (searchKeyExpression === '') {
          searchKeyExpression = '^cti_';
      }
      searchKeyRegex = new RegExp(searchKeyExpression);
      if (interactionTypeName !== 'email') {
          if(!revertAniDni){
              // TODO (shabunc): include real config, still discussed with Stéphane
              shouldIncludeAni = configuration.get('screenpop.include-ani-in-search', 'true', 'crm-adapter');
              if (shouldIncludeAni == 'true') {
                  if(!sfContactData || (sfContactData && interaction.getDirection()==='IN')){
                      ani = interaction.getANI();
                  }else{
                      ani = sfContactData['number'];
                  }
                  if (ani) {
                      // preprocess ani
                      ani = utils.preprocessANI(ani);
                      if(ani){
                          searchFragments.push(ani);
                          urlFragments.push('ANI=' + ani);
                      }
                  }
              }
              if (shouldIncludeDnis) {
                  dnis = interaction.getDnis();
                  if (dnis) {
                      // preprocess ani
                      dnis = utils.preprocessANI(dnis);
                      if(dnis){
                          searchFragments.push(dnis);
                          urlFragments.push('DNIS=' + dnis);
                      }

                  }
              }

          }else{
              if(!sfContactData){
                  ani = interaction.getDnis();
              }else{
                  ani = sfContactData['number'];
              }
              if (ani) {
                  // preprocess ani
                  ani = utils.preprocessANI(ani);
                  if(ani){
                      searchFragments.push(ani);
                      urlFragments.push('ANI=' + ani);
                  }
              }
          }
      }else{
          email = interaction.getEmail();
          searchFragments.push(email);
          urlFragments.push('Email=' + email);
      }




      matchingUserData = _.pickBy(userData, function (val, key) {
          return key && (!_.isEmpty(val)) && searchKeyRegex.test(key);
      });


      var search = searchFragments.concat(_.map(matchingUserData)).join(' ' + logicOperator + ' ');
      var url = urlFragments.concat(_.map(matchingUserData, function(val, key) {
          return (encodeURIComponent(key) + '=' + encodeURIComponent(val));
      })).join('&');


      return {search:search,url:url};

  };

  Salesforce.prototype.saveLogOnScreenPop = function (interaction,viewObject, objectId) {
      logger.debug('Salesforce: searchAndScreenPop openedRecord:', viewObject);
      var task = this.getTask(interaction,utils.prepareObjectForGetTask(viewObject,objectId),'In Progress');
      logger.debug('Salesforce: searchAndScreenPop openedRecord next task:', task);
      this.apiSaveLog(task,function (payload) {
          logger.debug('Salesforce: screenPop openedRecord create activity:', payload);
          if(payload['success']){
              interaction.updateInteractionByActivityId({activityId:payload.returnValue.recordId});
          }
    });
  };

  return Salesforce;

});
