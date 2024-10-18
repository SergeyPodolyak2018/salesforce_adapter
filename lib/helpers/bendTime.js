define([], function() {

  var bendTime = function(func) {
    return function() {
      try {
          var clock = sinon.useFakeTimers();
          func.apply(null, arguments);
          clock.tick(2000);
      } finally {
          clock.restore();
      } 
    }
  };

  return bendTime;
});
