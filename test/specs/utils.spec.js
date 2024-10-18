define([
  'lodash',
  'backbone',
  'Squire'
], function(_, Backbone, Squire) {
  'use strict';

  describe('utils', function() {
      
      
    var Interaction = Backbone.Model.extend({
      defaults: {
        interactionId: null,
        bundleId: null,
        caseId: null,
        parentInteraction: null,
        userData: {},
        contactId: '',
        contact: '',
        capabilities: [],
        option: null
      },
      initialize: function () {
        this.set({
          userData: {},
          capabilities: [],
          media: null
        });
        return this;
      }
    });

    var injector = new Squire();

    var sandbox = sinon.sandbox.create();
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('utils.defaultANIPreprocessing', function() {
      it('utils.defaultANIPreprocessing should return US international phone prefix', injector.run([
        'utils'
      ], function(utils) {
          assert.equal(utils.defaultANIPreprocessing('+1 (415) 777-7878'), ' (415) 777-7878');
      }));
    });

    describe('utils.preprocessANI', function() {

      it('utils.preprocessANI should invoke defaultANIPreprocessing if "screenpop.preprocessing-rule" is default one', injector.run([
        'configuration',
        'utils'
      ], function(configuration, utils) {
        var configStub = sandbox.stub(configuration, 'get');
        configStub.withArgs('screenpop.preprocessing-rule', 'default', 'crm-adapter').returns('default');

        sandbox.spy(utils, 'defaultANIPreprocessing');

        assert.equal(utils.preprocessANI('+14157777878'), '4157777878');
        assert.equal(utils.preprocessANI('14157777878'), '14157777878');

        assert.sinonCalledOnceWithExactly(utils.defaultANIPreprocessing, '14157777878');
        assert.sinonCalledOnceWithExactly(utils.defaultANIPreprocessing, '+14157777878');
      }));

      it('utils.preprocessANI should return raw ani value as is if "screenpop.preprocessing-rule" is set to "none"', injector.run([
        'configuration',
        'utils'
      ], function(configuration, utils) {
        var configStub = sandbox.stub(configuration, 'get');
        configStub.withArgs('screenpop.preprocessing-rule', 'default', 'crm-adapter').returns('none');

        sandbox.spy(utils, 'defaultANIPreprocessing');

        assert.equal(utils.preprocessANI('+14157777878'), '+14157777878');
        assert.equal(utils.preprocessANI('4157777878'), '4157777878');
      }));


      it('utils.preprocessANI should return raw ani value as is if "screenpop.preprocessing-rule" is a trimmed empty string', injector.run([
        'configuration',
        'utils'
      ], function(configuration, utils) {
        var configStub = sandbox.stub(configuration, 'get');
        configStub.withArgs('screenpop.preprocessing-rule', 'default', 'crm-adapter').returns('            ');

        assert.equal(utils.preprocessANI('+14157777878'), '+14157777878');
        assert.equal(utils.preprocessANI('4157777878'), '4157777878');
      }));

      it('utils.preprocessANI should return raw ani if specific rule was not found', injector.run([
        'configuration',
        'utils'
      ], function(configuration, utils) {
        var configStub = sandbox.stub(configuration, 'get');
        configStub.withArgs('screenpop.preprocessing-rule', 'default', 'crm-adapter').returns('SECTION_NAME');
        configStub.withArgs('expression', '', 'SECTION_NAME').returns('');

        assert.equal(utils.preprocessANI('+14157777878'), '+14157777878');
        assert.equal(utils.preprocessANI('4157777878'), '4157777878');
      }));


      it('utils.preprocessANI should return raw ani if specific rule was set', injector.run([
        'configuration',
        'utils'
      ], function(configuration, utils) {
        var configStub = sandbox.stub(configuration, 'get');
        configStub.withArgs('screenpop.preprocessing-rule', 'default', 'crm-adapter').returns('SECTION_NAME');
        configStub.withArgs('expression', '', 'SECTION_NAME').returns('4|5');
        configStub.withArgs('replacement', '', 'SECTION_NAME').returns('XXX');

        assert.equal(utils.preprocessANI('+14157777878'), '+1XXX157777878');
        assert.equal(utils.preprocessANI('4157777878'), 'XXX157777878');
      }));


    });

    describe('utils.convertTime', function() {

      it('utils.convertTime should add 12 am/pm format', injector.run([
        'utils'
      ], function(utils) {

        _.each(_.range(1, 12), function(hour) {
           var dateString = '06/12/2015 ' + hour + ':28:32';
           var date = new Date(dateString);
           assert.equal(utils.convertTime(date), (hour + ':28 am'));
        });

        _.each(_.range(1, 12), function(hour) {
          var dateString = '06/12/2015 ' + (hour + 12) + ':28:32';
          var date = new Date(dateString);
          assert.equal(utils.convertTime(date), (hour + ':28 pm'));
        });

        assert.equal(utils.convertTime(new Date('06/12/2013 00:01')), '12:01 am');
      }))

    });

    describe('utils.filterData', function() {

      it('utils.filterData should return empty array not attribute is present', injector.run([
        'utils'
      ], function(utils) {

        assert.deepEqual(utils.filterData(null, 'WHATEVER_IS_HERE'), []);
      }));

      it('utils.filterData should return specifically formed array  if attribute values intersect with set of keys of userData', injector.run([
        'utils'
      ], function(utils) {

        var attribute = new Backbone.Model({
          values: new Backbone.Collection([
            {name: 'ATTR_A', displayName: 'Attribute_A'},
            {name: 'ATTR_B', displayName: 'Attribute_B'},
            {name: 'ATTR_C', displayName: 'Attribute_C'}
          ])
        });

        var userData = {
          'ATTR_A': 'USER_DATA_A',
          'ATTR_C': 'USER_DATA_C',
          'ATTR_D': 'USER_DATA_D'
        };

        var expectedResult = [{'displayName':'Attribute_A','value':'USER_DATA_A','name':'ATTR_A'},{'displayName':'Attribute_C','value':'USER_DATA_C','name':'ATTR_C'}];

        assert.deepEqual(utils.filterData(attribute, userData), expectedResult);
      }))


    });


    describe('utils.sanitizePhoneNumber', function() {

      it('utils.sanitizePhoneNumber replaces any non-numeric characters', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.sanitizePhoneNumber('1a2z#3~4-5 6  7"8+9"0'), '1234567890');
      }));

      it('utils.sanitizePhoneNumber - extension should be removed', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.sanitizePhoneNumber('12345x222'), '12345');
      }));


      it('utils.sanitizePhoneNumber returns false for any falsy value', injector.run([
        'utils'
      ], function(utils) {

        assert.isFalse(utils.sanitizePhoneNumber(false));
        assert.isFalse(utils.sanitizePhoneNumber(null));
        assert.isFalse(utils.sanitizePhoneNumber(undefined));
        assert.isFalse(utils.sanitizePhoneNumber(0));
      }));

    });


    describe('utils.defaultPhoneNumberPreprocessing', function() {

      it('utils.defaultPhoneNumberPreprocessing adds +1 for 10 digit length phone numbers', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.defaultPhoneNumberPreprocessing('1234567890'), '+11234567890');
      }));

      it('utils.defaultPhoneNumberPreprocessing adds + for 11 digit length phone numbers', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.defaultPhoneNumberPreprocessing('12345678901'), '+12345678901');
      }));

      it('utils.defaultPhoneNumberPreprocessing does not modified phone number it their length is less then 10', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.defaultPhoneNumberPreprocessing('1'), '1');
        assert.equal(utils.defaultPhoneNumberPreprocessing('12'), '12');
        assert.equal(utils.defaultPhoneNumberPreprocessing('123'), '123');
        assert.equal(utils.defaultPhoneNumberPreprocessing('1234'), '1234');
        assert.equal(utils.defaultPhoneNumberPreprocessing('12345'), '12345');
        assert.equal(utils.defaultPhoneNumberPreprocessing('123456'), '123456');
        assert.equal(utils.defaultPhoneNumberPreprocessing('1234567'), '1234567');
        assert.equal(utils.defaultPhoneNumberPreprocessing('12345678'), '12345678');
        assert.equal(utils.defaultPhoneNumberPreprocessing('123456789'), '123456789');
      }));

      it('utils.defaultPhoneNumberPreprocessing adds 011 prefix for 12+ length phone numbers if it was not present', injector.run([
        'utils'
      ], function(utils) {

        assert.equal(utils.defaultPhoneNumberPreprocessing('123456789012'), '011123456789012');
        assert.equal(utils.defaultPhoneNumberPreprocessing('0111234567890123'), '0111234567890123');
      }));


    });

    describe('utils.preprocessPhoneNumber', function() {

      it('utils.preprocessPhoneNumber returns get default preprocessing is for click-to-dial.preprocessing-rules == "default"', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

          sandbox.stub(configuration, 'get');
          configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('default');

          sandbox.stub(utils, 'defaultPhoneNumberPreprocessing');
          utils.defaultPhoneNumberPreprocessing.withArgs('PHONE_NUMBER').returns('DEFAULT_PHONE_NUMBER');

          assert.equal(utils.preprocessPhoneNumber('PHONE_NUMBER'), 'DEFAULT_PHONE_NUMBER');
      }));

      it('utils.preprocessPhoneNumber returns unmodified input phone number is for click-to-dial.preprocessing-rules == "none"', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('none');

        assert.equal(utils.preprocessPhoneNumber('PHONE_NUMBER_AS_IS'), 'PHONE_NUMBER_AS_IS');
      }));


      it('utils.preprocessPhoneNumber returns unmodified input phone number is for click-to-dial.preprocessing-rules section is missing or blank', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('             ');

        assert.equal(utils.preprocessPhoneNumber('PHONE_NUMBER_AS_IS_BLANK'), 'PHONE_NUMBER_AS_IS_BLANK');
      }));

      it('utils.preprocessPhoneNumber returns unmodified input phone number if relevant expression is missing', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('SECTION_NO_EXPRESSION');
        configuration.get.withArgs('expression', '', 'SECTION_NO_EXPRESSION').returns(false);

        assert.equal(utils.preprocessPhoneNumber('PHONE_NUMBER_AS_IS_NO_EXPRESSION'), 'PHONE_NUMBER_AS_IS_NO_EXPRESSION');
      }));

      it('utils.preprocessPhoneNumber returns unmodified input phone number if relevant prefix is missing', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('SECTION_NO_PREFIX');
        configuration.get.withArgs('expression', '', 'SECTION_NO_PREFIX').returns(true);
        configuration.get.withArgs('prefix', '', 'SECTION_NO_PREFIX').returns(false);

        assert.equal(utils.preprocessPhoneNumber('PHONE_NUMBER_AS_IS_NO_PREFIX'), 'PHONE_NUMBER_AS_IS_NO_PREFIX');
      }));


      it('utils.preprocessPhoneNumber returns modified input phone number if phone number matches the expression', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('click-to-dial.preprocessing-rules', 'default', 'crm-adapter').returns('SECTION_MATCHING_EXPRESSION');
        configuration.get.withArgs('expression', '', 'SECTION_MATCHING_EXPRESSION').returns('^\\d+$');
        configuration.get.withArgs('prefix', '', 'SECTION_MATCHING_EXPRESSION').returns('PREFIXED_');

        assert.equal(utils.preprocessPhoneNumber('1234'), 'PREFIXED_1234');
        assert.equal(utils.preprocessPhoneNumber('1234_SHOULD_NOT_BE_PREFIXED'), '1234_SHOULD_NOT_BE_PREFIXED');
      }));

    });


    describe('utils.filterByBusinessAttribute', function() {

      injector.mock('external/genesys', {
        wwe: {
          businessAttributeCollection: new Backbone.Collection([
            {name: 'BUSINESS_ATTRIBUTE_A'},
            {name: 'BUSINESS_ATTRIBUTE_B'},
            {name: 'BUSINESS_ATTRIBUTE_C'}
          ])
        }
      });

      it('utils.filterByBusinessAttribute returns empty array if business attribute is not found', injector.run([
        'utils',
        'configuration'
      ], function(utils, configuration) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('SOME_BUSINESS_ATTRIBUTE').returns('BUSINESS_ATTRIBUTE_Z');

        assert.deepEqual(utils.filterByBusinessAttribute('SOME_BUSINESS_ATTRIBUTE'), []);
      }));

      it('utils.filterByBusinessAttribute returns filterData', injector.run([
        'utils',
        'configuration',
        'external/genesys'
      ], function(utils, configuration, genesys) {

        sandbox.stub(configuration, 'get');
        configuration.get.withArgs('SOME_BUSINESS_ATTRIBUTE').returns('BUSINESS_ATTRIBUTE_B');


        sandbox.stub(utils, 'filterData');
        utils.filterData.withArgs(genesys.wwe.businessAttributeCollection.at(1), {user: 'data'}).returns('FILTERED_USER_DATA');

        assert.equal(utils.filterByBusinessAttribute('SOME_BUSINESS_ATTRIBUTE', {user: 'data'}), 'FILTERED_USER_DATA');
      }));

    });



    describe('utils.filterCaseData', function() {

      it('utils.filterCaseData returns filterByBusinessAttribute', injector.run([
        'utils'
      ], function(utils) {
        sandbox.stub(utils, 'filterByBusinessAttribute');
        utils.filterByBusinessAttribute.withArgs('interaction.case-data.format-business-attribute', {
          filterCaseData: {user: 'data'}
        }).returns(['FILTERED', 'CASE', 'DATA']);

        assert.deepEqual(utils.filterCaseData({
          filterCaseData: {user: 'data'}
        }), ['FILTERED', 'CASE', 'DATA']);
      }));

    });


    describe('utils.filterToastData', function() {

      it('utils.filterToastData returns filterByBusinessAttribute', injector.run([
        'utils'
      ], function(utils) {
        sandbox.stub(utils, 'filterByBusinessAttribute');
        utils.filterByBusinessAttribute.withArgs('toast.case-data.format-business-attribute', {
          filterToastData: {user: 'data'}
        }).returns(['FILTERED', 'TOAST', 'DATA']);

        assert.deepEqual(utils.filterToastData({
          filterToastData: {user: 'data'}
        }), ['FILTERED', 'TOAST', 'DATA']);
      }));


    });

    describe('utils.getUrlParam', function() {
      it('utils.getUrlParam should return values presented in url', injector.run([
        'utils'
      ], function(utils) {
        var url = 'https://127.0.0.1/ui/crm-adapter/index.html?crm=salesforce&oauthID=d3a16977-9125-4421-a657-b2f72b4afac9&sfdcIFrameOrigin=https%3A%2F%2Feu5.salesforce.com&nonce=3f6b26abec37237959758397e4641e93a537e64971406fb5606e7fef472386f6&'
        assert.equal(utils.getUrlParam('crm', url), 'salesforce');
        assert.equal(utils.getUrlParam('oauthID', url), 'd3a16977-9125-4421-a657-b2f72b4afac9');
        assert.equal(utils.getUrlParam('nonce', url), '3f6b26abec37237959758397e4641e93a537e64971406fb5606e7fef472386f6');

        assert.isUndefined(utils.getUrlParam('missing', url), 'When param is missing, undefined should be returned');
      }));
    });
    
    describe('utils.getSalesforceParameter', function() {
        var injector = new Squire();
        var template;

        injector.mock('configuration', {
            get: function(){return template;}
        });
        
        it('utils.getSalesforceParameter should call parseTemplate if a template exists', injector.run([
           'configuration',
           'utils'
        ], function(configuration, utils) {
           var parseTemplateStub = sandbox.stub(utils, 'parseTemplate');
           template = 'This is the template.';
           var interaction = new Interaction;
           utils.getSalesforceParameter('', interaction);
           assert(parseTemplateStub.calledWithExactly(template, interaction));
        }));
        
        it('utils.getSalesforceParameter should not call parseTemplate if no template exists', injector.run([
          'configuration',
          'utils'
        ], function(configuration, utils) {
          var parseTemplateStub = sandbox.stub(utils, 'parseTemplate');
          template = 'false';
          var interaction = new Interaction;
          var defaultCallbackStub = sandbox.stub()
          utils.getSalesforceParameter('', interaction, defaultCallbackStub);
          assert.equal(parseTemplateStub.callCount, 0);
          assert(defaultCallbackStub.calledOnce);
        }));
    });
    
    describe('utils.parseTemplate', function() {
        
        it('utils.parseTemplate should return the template unaltered if no variables exist', injector.run([
            'utils'
        ], function(utils) {
            var template = 'This is the template.';
            assert.equal(utils.parseTemplate(template), template);
        }));
        
        it('utils.parseTemplate should return the template unaltered if all variables are invalid', injector.run([
            'utils'
        ], function(utils) {
            var template = '{invalid.variable}';
            assert.equal(utils.parseTemplate(template), template);
        }));
        
        it('utils.parseTemplate should replace the template variables with the correct variables', injector.run([
            'utils'
        ], function(utils) {
            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}, contact : new Backbone.Model({test : 'contact test'}), test : 'interaction test'});
            var template = '{interaction.test}';
            assert.equal(utils.parseTemplate(template, interaction), interaction.get('test'));
            template = '{userData.test}';
            assert.equal(utils.parseTemplate(template, interaction), interaction.get('userData').test);
            template = '{contact.test}';
            assert.equal(utils.parseTemplate(template, interaction), interaction.get('contact').get('test'));
        }));
        
        it('utils.parseTemplate shouldn\'t replace variables with no .', injector.run([
           'utils'
        ], function(utils) {
          var interaction = new Interaction;
          interaction.set({userData : {test : 'userData test'}, contact : new Backbone.Model({test : 'contact test'}), test : 'interaction test'});
          var template = '{interaction}';
          assert.equal(utils.parseTemplate(template, interaction), template);
          template = '{userData}';
          assert.equal(utils.parseTemplate(template, interaction), template);
          template = '{contact}';
          assert.equal(utils.parseTemplate(template, interaction), template);
        }));
        
        it('utils.parseTemplate shouldn\'t replace variables whose interaction data is missing with undefined', injector.run([
          'utils'
        ], function(utils) {
          var interaction = new Interaction;
          var template = '{userData.test}';
          assert.equal(utils.parseTemplate(template, interaction), 'undefined');
          template = '{contact.test}';
          assert.equal(utils.parseTemplate(template, interaction), 'undefined');
        }));
        
        it('utils.parseTemplate should replace template variables which resolve to functions with "undefined"', injector.run([
            'utils'
        ], function(utils) {
            var interaction = new Interaction;
            interaction.set({userData : {test : function(){}}, contact : new Backbone.Model({test : function(){}}), test : function(){}});
            var template = '{interaction.test}';
            assert.equal(utils.parseTemplate(template, interaction), 'undefined');
            template = '{userData.test}';
            assert.equal(utils.parseTemplate(template, interaction), 'undefined');
            template = '{contact.test}';
            assert.equal(utils.parseTemplate(template, interaction), 'undefined');
        }));
        
        it('utils.parseTemplate should replace interaction.startDate and interaction.endDate as a timestamp and not an integer', injector.run([
            'utils'
        ], function(utils) {
            var interaction = new Interaction;
            interaction.set({receivedDate : 1, endDate : 2});
            var template = '{interaction.receivedDate}';
            var receivedDate = new Date(interaction.get('receivedDate'));
            var endDate = new Date(interaction.get('endDate'));
            assert.equal(utils.parseTemplate(template, interaction), receivedDate.toLocaleDateString() + ' ' + receivedDate.toLocaleTimeString());
            template = '{interaction.endDate}';
            assert.equal(utils.parseTemplate(template, interaction), endDate.toLocaleDateString() + ' ' + endDate.toLocaleTimeString());
        }));
    });
    describe('utils.prepareObjectForGetTask', function() {
        var injector = new Squire();
        var template;

        injector.mock('configuration', {
            get: function(){return template;}
        });

        it('utils.prepareObjectForGetTask', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            var notCompatibleObject = {
                "success": true,
                "returnValue": {
                    "12345": {
                        "RecordType": "Test_object",
                        "Name": "Willard Clinton100",
                        "Id": "12345"
                    }
                },
                "errors": null
            };
            var compatibleObject={
                "SCREEN_POP_DATA": {
                    "type": "sobject",
                    "params": {
                        "recordId": "12345"
                    }
                },
                "12345":{
                    "RecordType":"Test_object",
                    "Id": "12345"
                }
            };
            assert.deepEqual(utils.prepareObjectForGetTask(notCompatibleObject), compatibleObject);
        }));
    });

    describe('utils.prepareObjectForScreenPopWithParametr', function() {
        var injector = new Squire();
        var template;

        injector.mock('configuration', {
            get: function(){return template;}
        });
      it('utils.prepareObjectForScreenPopWithParametr: URL static', injector.run([
          'configuration',
          'utils'
      ], function(configuration, utils) {
          sandbox.stub(configuration, 'get');
          configuration.get.withArgs('screenpop.object-type-url', '', 'crm-adapter').returns('test-url-section');
          configuration.get.withArgs('url', '', 'test-url-section').returns('http://test');
          var interaction = new Interaction;
          interaction.set({userData : {test : 'userData test'}});
          var compatibleObject={
              url:'http://test'
          };
          assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('URL',interaction), compatibleObject);
      }));
        it('utils.prepareObjectForScreenPopWithParametr: URL dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-url', '', 'crm-adapter').returns('test-url-section');
            configuration.get.withArgs('url', '', 'test-url-section').returns('$test$');

            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test : 'a'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test').returns('a');

            var compatibleObject={
                url:'a'
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('URL',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: OBJECTHOME static', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-object-home', '', 'crm-adapter').returns('test-object-home-section');
            configuration.get.withArgs('scope', '', 'test-object-home-section').returns('test');
            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}});
            var compatibleObject={
                scope:'test'
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('OBJECTHOME',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: OBJECTHOME dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-object-home', '', 'crm-adapter').returns('test-object-home-section');
            configuration.get.withArgs('scope', '', 'test-object-home-section').returns('$test$');

            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test : 'test'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test').returns('test');

            var compatibleObject={
                scope:'test'
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('OBJECTHOME',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: LIST static', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-list', '', 'crm-adapter').returns('test-list-section');
            configuration.get.withArgs('listViewId', '', 'test-list-section').returns('test1');
            configuration.get.withArgs('scope', '', 'test-list-section').returns('test2');
            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}});
            var compatibleObject={
                listViewId:'test1',
                scope:'test2'
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('LIST',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: LIST dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-list', '', 'crm-adapter').returns('test-list-section');
            configuration.get.withArgs('listViewId', '', 'test-list-section').returns('$test1$');
            configuration.get.withArgs('scope', '', 'test-list-section').returns('$test2$');

            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test : 'test'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test1').returns('test1');
            interaction.getParametrFromAttachData.withArgs('test2').returns('test2');

            var compatibleObject={
                listViewId:'test1',
                scope:'test2'
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('LIST',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: SEARCH static', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-search', '', 'crm-adapter').returns('test-search-section');
            configuration.get.withArgs('searchString', '', 'test-search-section').returns('test1');

            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}});
            var compatibleObject={
                searchString:'test1'

            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('SEARCH',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: SEARCH dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-search', '', 'crm-adapter').returns('test-search-section');
            configuration.get.withArgs('searchString', '', 'test-search-section').returns('$test1$');


            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test1 : 'test1'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test1').returns('test1');


            var compatibleObject={
                searchString:'test1'

            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('SEARCH',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: NEW_RECORD_MODAL static', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-new-record', '', 'crm-adapter').returns('test-new-record-section');
            configuration.get.withArgs('entityName', '', 'test-new-record-section').returns('test1');

            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}});
            var compatibleObject={
                entityName:'test1'

            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('NEW_RECORD_MODAL',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: NEW_RECORD_MODAL dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-new-record', '', 'crm-adapter').returns('test-new-record-section');
            configuration.get.withArgs('entityName', '', 'test-new-record-section').returns('$test1$');


            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test1 : 'test1'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test1').returns('test1');


            var compatibleObject={
                entityName:'test1'

            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('NEW_RECORD_MODAL',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: FLOW static', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-flow', '', 'crm-adapter').returns('test-flow-section');
            configuration.get.withArgs('flowDevName', '', 'test-flow-section').returns('test1');
            configuration.get.withArgs('flowArgs', '', 'test-flow-section').returns('[{"name": "text", "type": "String", "value": "Test ha ha"}, {"name": "number", "type": "Number","value": 5}]');
            var interaction = new Interaction;
            interaction.set({userData : {test : 'userData test'}});
            var compatibleObject={
                flowDevName:'test1',
                flowArgs:[{"name": "text", "type": "String", "value": "Test ha ha"}, {"name": "number", "type": "Number","value": 5}]
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('FLOW',interaction), compatibleObject);
        }));
        it('utils.prepareObjectForScreenPopWithParametr: FLOW dinamic', injector.run([
            'configuration',
            'utils'
        ], function(configuration, utils) {
            sandbox.stub(configuration, 'get');
            configuration.get.withArgs('screenpop.object-type-flow', '', 'crm-adapter').returns('test-flow-section');
            configuration.get.withArgs('flowDevName', '', 'test-flow-section').returns('$test1$');
            configuration.get.withArgs('flowArgs', '', 'test-flow-section').returns('$test2$');

            var interaction = new Interaction;
            interaction['getParametrFromAttachData']=function(){return null};
            sandbox.stub(interaction, 'get');
            interaction.get.withArgs('userData').returns({test : 'test'});
            sandbox.stub(interaction, 'getParametrFromAttachData');
            interaction.getParametrFromAttachData.withArgs('test1').returns('test1');
            interaction.getParametrFromAttachData.withArgs('test2').returns('[{"name": "text", "type": "String", "value": "Test ha ha"}, {"name": "number", "type": "Number","value": 5}]');

            var compatibleObject={
                flowDevName:'test1',
                flowArgs:[{"name": "text", "type": "String", "value": "Test ha ha"}, {"name": "number", "type": "Number","value": 5}]
            };
            assert.deepEqual(utils.prepareObjectForScreenPopWithParametr('FLOW',interaction), compatibleObject);
        }));
    });
  });

});
