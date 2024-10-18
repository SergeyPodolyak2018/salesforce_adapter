define([
  'bluebird',
  'crm/AbstractCRM',
  'events/globalEvent',
  'configuration',
  'utils',
  'desktopApi',
  'logger'
], function(Promise, AbstractCRM, globalEvent, configuration, utils, desktopApi, logger) {

  var Zendesk = function() {};

  Zendesk.prototype = new AbstractCRM();

  Zendesk.prototype.zendeskCallBacks = {};

  Zendesk.prototype.zafClient = null;

  Zendesk.prototype.getObjectId = function(data) {
    var idKeyExpression = configuration.get('screenpop.id-key-regex', '^id_', 'crm-adapter');

    if (idKeyExpression === '') {
      idKeyExpression = '^id_';
    }

    var idKeyRegex = new RegExp(idKeyExpression);

    var keys = _.keys(data);
    return _.find(keys, function(key) {
      return key && idKeyRegex.test(key);
    });
  };

  Zendesk.prototype.updateDataForTransfer = function() {
    return Promise.resolve(true);
  };

  Zendesk.prototype.getSearchExpression = function(data) {
    var searchKeyExpression = configuration.get('screenpop.search-key-regex', '^cti_', 'crm-adapter');
    if (searchKeyExpression === '') {
      searchKeyExpression = '^cti_';
    }

    var searchKeyRegex = new RegExp(searchKeyExpression);

    return _.filter(_.keys(data), function(key) {
      return key && searchKeyRegex.test(key);
    });
  };

  Zendesk.prototype.onInteractionScreenPop = function (voiceInteraction) {

    var interaction = voiceInteraction.originalInteraction;
    logger.debug('Zendesk: Screen pop for interaction:', interaction);


    var userData = interaction.get('userData');
    var key = this.getObjectId(userData);

    if (key && userData[key]) {
      logger.debug('Requesting screen pop for id:' + userData[key]);
      var data = {};
      //data[key] = userData[key];
      if(key.indexOf('user') !== -1) {
        data['id_user_'] = userData[key];
      } else {
        data['id_ticket'] = userData[key];
      }
      this.searchAndScreenPop(data, null);
    } else {
      logger.debug('No id key found. Looking for search keys...');
      var data = {};

      var shouldIncludeAni = configuration.get('screenpop.include-ani-in-search', 'true', 'crm-adapter');
      if (shouldIncludeAni == 'true') {
        logger.debug('screenpop.include-ani-in-search is true, adding ANI...');
        var ani;
        if (interaction.get('ani')) {
          logger.debug('Reading ani directly...');
          ani = interaction.get('ani');
          /* istanbul ignore next */
        } else if (interaction.get('parties') && interaction.get('parties').length) {
          logger.debug('Reading ANI from parties collection...');
          ani = interaction.get('parties').at(0).get('name');
        }
        /* istanbul ignore next */
        if (ani) {
          logger.debug('Found ANI [' + ani + '].');
          ani = utils.preprocessANI(ani);
          data['cti_phone'] = ani;
        }
      } else {
        logger.debug('screenpop.include-ani-in-search is false, skipping ANI...');
      }


      var matches = this.getSearchExpression(userData);

      if (matches && matches.length) {
        for (var i = 0; i < matches.length; i++) {
          var key = (matches[i]);

          if (!userData[key]) {
            logger.debug('Skipping empty value for [' + key + ']...');
            continue;
          }

          data[key] = userData[key];
        }
      }
      this.searchAndScreenPop(data, null);
    }
  };

  Zendesk.prototype.searchAndScreenPop = function (data, cb) {
    logger.debug('Zendesk: searchAndScreenPop was called ', data, cb);
    var _sig = 'SEARCH' + '_' + new Date().getTime();
    if (typeof (cb) != 'undefined') {
      this.zendeskCallBacks[_sig] = cb;
    }
    if (data) {
      if (data.callNumber === undefined) {
        var msg = {
          sig: _sig,
          action: 'SEARCH_PAGE',
          format: 'JSON',
          message: data
        };

        logger.debug('Zendesk: postMessage with:', msg);
        this.zafClient.postMessage('cti', msg);
      }
    }
  }

  Zendesk.prototype.onInteractionCanceled = function () {

    var msg = {
        action: 'CALL_CANCELED',
        format: 'JSON',
        message: ''
      };

    logger.debug('Zendesk: postMessage with:', msg);
    this.zafClient.postMessage('cti', msg);
  };


  Zendesk.prototype.onInteractionAdded = function (voiceInteraction) {
    var interaction = voiceInteraction.originalInteraction;
    if(interaction.get('call')) {
      var data = {
        call: interaction.get('call')
      };
      var _sig = 'SEARCH' + '_' + new Date().getTime();

      var msg = {
        sig: _sig,
        action: 'CALL_NOTIFY',
        format: 'JSON',
        message: data
      };

      logger.debug('Zendesk: postMessage with:', msg);
      this.zafClient.postMessage('cti', msg);
    } else {
      //console.log('NO GET CALL IN INTERACTION, DO NOTHING!!!')
    }
  };

  Zendesk.prototype.onMarkDone = function (voiceInteraction) {
    this.saveActivityForInteraction(voiceInteraction);
  };

  Zendesk.prototype.storeCallback = function(cid, callback) {
    this.zendeskCallBacks[cid] = callback
  }

  Zendesk.prototype.saveActivityForInteraction = function(voiceInteraction) {

    var interaction = voiceInteraction.originalInteraction;
    var title = voiceInteraction.getTitle();

    var note = '';

    if (interaction.get('callNote')){
        note = interaction.get('callNote');
    }
    else if (interaction.get('comment')){
        note = interaction.get('comment');
    }

    if (_.isEmpty(note)) {
      note = '<none>';
    }

    var disposition = interaction.get('selectedDispositionItemId');
    if (_.isEmpty(disposition)) {
      disposition = '<none>';
    }

    var call = interaction.get('call');

    var _sig = 'INSERT' + '_' + new Date().getTime();

    /* istanbul ignore next */
    this.storeCallback(_sig, function() {
      return Promise.resolve('Zendesk: insert complete');
    });

    var msg = {
      sig: _sig,
      action: 'INSERT',
      format: 'JSON',
      message: {
        recordType: 'ticket',
        fieldValue: {
          title: title,
          message: note,
          disposition: disposition,
          detail: {
            callType    : call.callType,
            callDuration: call.duration,
            calluuid    : call.callUuid,
            callOrigin  : interaction.getOrigin(),
            caseData    : voiceInteraction.getCaseData()
          }
        }
      }
    };

    logger.debug('Zendesk: postMessage with:', msg);
    this.zafClient.postMessage('cti', msg);
  };

  Zendesk.prototype.setOptions = function () {
    this.registerZafClient(0);
  };

  Zendesk.prototype.setZafClient = function (client) {
    this.zafClient = client;

    var that = this;
    //invalidate isLoggedIn var
    /* istanbul ignore next */
    this.zafClient.postMessage('cti', {
      action: 'LOGOUT',
      format: 'JSON',
      message: ''
    });

    this.zafClient.on('cti', function (data) {
      var msg = data;
      if (msg.action == 'INSERT') {
        that.saveConfirmation(msg);
      }
      else if (msg.action == 'DIAL') {
        that.onClickToDial(msg.number);
      }
    });

    /* istanbul ignore next */
    globalEvent.SERVICE_INITIALIZED.add(function() {
      that.zafClient.postMessage('cti', {
        action: 'LOGIN',
        format: 'JSON',
        message: ''
      });
    })

    this.zafClient.on('logging', function(data) {
      logger.debug('Zendesk: log for ', data.event, data.result);
    });

  };

  Zendesk.prototype.createTarget = function(phoneNumber) {
    var target = new genesys.wwe.Main.CustomContact();
    target.setDestination(phoneNumber);
    return target;
  };

  Zendesk.prototype.onClickToDial = function(number) {
    var voiceMedia = desktopApi.getAgent().get('mediaList').find(function(media) {
      return media.get('name') === 'voice';
    });

    if(!voiceMedia) {
      // No voice media...
      //logger.debug('No voice media...');
      return;
    }

    var phoneNumber = utils.sanitizePhoneNumber(number);
    phoneNumber = utils.preprocessPhoneNumber(phoneNumber);

    var target = this.createTarget(phoneNumber);
    desktopApi.getCommandManager().execute('MediaVoiceCall',
      {
        destination: phoneNumber,
        media: 'voice',
        target: target
      });
  };

  Zendesk.prototype.saveConfirmation = function (rslt) {
    var _con = rslt.result;

    this.zendeskCallBacks[rslt.sig]().then(function(res) {
      logger.debug(res);
    })
    delete this.zendeskCallBacks[rslt.sig];

    /* istanbul ignore next */
    logger.debug('Zendesk: saveConfirmation', _con);
  };

  Zendesk.prototype.registerZafClient = function (attempt) {
    var that = this;
    if (window.ZAFClient && window.ZAFClient.init) {
      var zafClient = window.ZAFClient.init();
      this.setZafClient(zafClient);
    }
    else {
      if (attempt < 100) {
        /* istanbul ignore next */
        setTimeout(function(attempt) {
          that.registerZafClient(attempt);
        }, 500, attempt + 1);
      }
    }
  };

  Zendesk.prototype.getResources = function() {
    return [
      'zendesk_integration'
    ]
  };

  Zendesk.prototype.isInConsole = function (callback) {
    //logger.debug('Zendesk.inInConsole was called!');
    if (callback) {
      callback({ result: true });
    }
  };


  Zendesk.prototype.getPageInfo = function() {
    return Promise.resolve(true);
  };

  return Zendesk;
});
