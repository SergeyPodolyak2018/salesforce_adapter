define([
  'lodash',
  'Squire'
],function(_, Squire) {

  describe('deskTopApi', function() {

    var injector = new Squire();
    var sandbox;
    var genesys;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      genesys = {
        wwe : {
          agent              : function(){},
          eventBroker        : function(){},
          interactionManager : function(){},
          configuration      : function(){},
          commandManager     : function(){},
          Outbound : {
            OutboundManager  : function() {}
          }
        }
      };

      window.genesys = genesys;
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('desktopApi', function() {
      it('desktopApi:getAgent', injector.run([
         'desktopApi'
      ], function(desktopApi) {

        var agent               = new (desktopApi.getAgent());
        var eventBroker         = new (desktopApi.getEventBroker());
        var interactionManager  = new (desktopApi.getInteractionManager());
        var commandManager      = new (desktopApi.getCommandManager());
        var configuration       = new (desktopApi.getConfiguration());
        var outboundManager     = new (desktopApi.getOutboundManager());

        assert.instanceOf(agent, window.genesys.wwe.agent,
          'desktopApi.getAgent() should return genesys.wwe.agent');

        assert.instanceOf(eventBroker, window.genesys.wwe.eventBroker,
          'desktopApi.getEventBroker() should return genesys.wwe.agent');

        assert.instanceOf(interactionManager, window.genesys.wwe.interactionManager,
          'desktopApi.getInteractionManager should return genesys.wwe.interactionManager');

        assert.instanceOf(commandManager, window.genesys.wwe.commandManager,
          'desktopApi.getCommandManager() should return genesys.wwe.interactionManager');

        assert.instanceOf(configuration, window.genesys.wwe.configuration,
          'desktopApi.getConfiguration() should return genesys.wwe.configuration');

        assert.instanceOf(outboundManager, window.genesys.wwe.Outbound.OutboundManager,
          'desktopApi.getOutboundManager() should return window.genesys.wwe.Outbound.OutboundManager');

      }));
    });

  });
});
