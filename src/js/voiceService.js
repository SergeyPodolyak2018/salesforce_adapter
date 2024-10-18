define([
  'utils',
  'external/genesys',
  'logger'
], function(utils, genesys, logger) {

  var VoiceService = function() {};

  VoiceService.prototype.isPresent = function() {
    return genesys.wwe.agent.get('mediaList').find(function(media) {
      return media.get('name') === 'voice';
    }) !== undefined;
  };

  VoiceService.prototype.createTarget = function(phoneNumber) {
    var target = new genesys.wwe.Main.CustomContact();
    target.setDestination(phoneNumber);

    return target;
  };

  VoiceService.prototype.dial = function(destination, data) {
    logger.debug('VoiceService: Handling dial request...'+data);
    if (!this.isPresent()) {
      logger.debug('VoiceService: VoiceService is not present!');
      return false;
    }

    logger.debug('VoiceService: sanitizing and preprocessing phone number [' + destination + ']...');
    var phoneNumber = utils.preprocessPhoneNumber(utils.sanitizePhoneNumber(destination));

    logger.debug('VoiceService: Creating dial request for [' + phoneNumber + ']...');
    var target = this.createTarget(phoneNumber);

    genesys.wwe.commandManager.execute('MediaVoiceDial',
      {
        destination: phoneNumber,
        media: 'voice',
        target: target,
        attachedData:{
          SF_Contact_Data:data
        }
      });

  };


  return new VoiceService();
});
