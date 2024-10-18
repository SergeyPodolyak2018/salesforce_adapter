define([
  'backbone',
  'Squire'
], function(Backbone, Squire) {
  'use strict';

  describe('OpenmediaInteraction', function() {
    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });
    
    it('OpenmediaInteraction screenpop should be configured with screenpop.openmedia.on-invite.', injector.run([
        'interactions/OpenmediaInteraction',
        'configuration'
    ], function(OpenmediaInteraction, configuration) {
        configuration.getAsBoolean = sandbox.stub();
        configuration.getAsBoolean.returns(true);
        assert(new OpenmediaInteraction(new Backbone.Model()).shouldScreenPopAt('INTERACTION_INVITED'));
        assert.isFalse(new OpenmediaInteraction(new Backbone.Model()).shouldScreenPopAt('INTERACTION_ACCEPTED'));
        configuration.getAsBoolean.returns(false);
        assert.isFalse(new OpenmediaInteraction(new Backbone.Model()).shouldScreenPopAt('INTERACTION_INVITED'));
        assert(new OpenmediaInteraction(new Backbone.Model()).shouldScreenPopAt('INTERACTION_ACCEPTED'));
    }));
    
    it('OpenmediaInteraction getSubject should use templates.salesforce.openmedia.subject', injector.run([
        'interactions/OpenmediaInteraction',
        'utils'
    ], function(OpenmediaInteraction, utils) {
        utils.getSalesforceParameter = sandbox.stub();
        var interaction = new Backbone.Model();
        new OpenmediaInteraction(interaction).getSubject();
        assert(utils.getSalesforceParameter.calledWith('templates.salesforce.openmedia.subject', interaction));
    }));
    
    it('OpenmediaInteraction shouldActivityBeCreated should be true', injector.run([
      'interactions/OpenmediaInteraction','configuration'
    ], function(OpenmediaInteraction, configuration) {
        var interaction = new OpenmediaInteraction(new Backbone.Model({htccInteraction: {interactionType : 'Inbound'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-openmedia-types',
            'Inbound', 'crm-adapter').returns('Inbound');

        assert(interaction.shouldActivityBeCreated());
    }));

    it('OpenmediaInteraction shouldActivityBeCreated should be false', injector.run([
      'interactions/OpenmediaInteraction','configuration'
    ], function(OpenmediaInteraction,configuration) {
        var interaction = new OpenmediaInteraction(new Backbone.Model({htccInteraction: {interactionType : 'Inbound'}}));
        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('salesforce.activity-log.enabled-openmedia-types',
            'Inbound', 'crm-adapter').returns('');
        assert.isFalse(interaction.shouldActivityBeCreated());
    }));
  });
});