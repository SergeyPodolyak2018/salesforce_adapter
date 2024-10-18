define([
  'external/genesys'
], function(genesys) {

  var Configuration = function(){};

  Configuration.prototype.get = function(key, defaultValue, section) {
    return genesys.wwe.configuration.getAsString(key, defaultValue, section);
  };
  
  Configuration.prototype.getAsBoolean = function(key, defaultValue, section) {
    return genesys.wwe.configuration.getAsBoolean(key, defaultValue, section);
  };

  return new Configuration();
});