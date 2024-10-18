define([
  'lodash',
  'configuration',
  'external/genesys',
  'logger'
], function(_, configuration, genesys, logger) {

    var Utils = function () {
    };


    Utils.prototype.defaultANIPreprocessing = function (ani) {
        ani = ani.replace(new RegExp('^\\+1'), '');
        return ani;
    };

    Utils.prototype.sanitizePhoneNumber = function (phoneNumber) {
        logger.debug('Sanitizing phone number [' + phoneNumber + ']...');
        if (!phoneNumber) {
            logger.debug('Skipping sanitization of empty value...');
            return false;
        }

        var extension = phoneNumber.lastIndexOf('x');
        if (extension >= 0) {
            logger.debug('Extension was found, stripping it out...');
            phoneNumber = phoneNumber.substring(0, extension);
        }

        logger.debug('Removing non-numeric characters...');
        phoneNumber = phoneNumber.replace(/([^0-9]+)/gi, '');

        logger.debug('Returning sanitized value [' + phoneNumber + '].');
        return phoneNumber;
    };

    Utils.prototype.defaultPhoneNumberPreprocessing = function (phoneNumber) {
        logger.debug('Applying default phone number preprocessing for click-to-dial...');
        logger.debug('Preprocessing phone number [' + phoneNumber + '] (' + phoneNumber.length + ') digits...');

        var modifiedPhoneNumber = phoneNumber;

        if (phoneNumber.length == 10) {
            logger.debug('Number is 10 digits, assuming the number is a US number, adding +1...');
            modifiedPhoneNumber = '+1' + phoneNumber;
        }
        else if (phoneNumber.length == 11) {
            logger.debug('Number is 11 digits, assuming the number is a US number, adding +...');
            modifiedPhoneNumber = '+' + phoneNumber;
        } else if (phoneNumber.length > 11) {
            if (!phoneNumber.match(/^011/)) {
                logger.debug('Number is greater than 11 digits, assuming international and adding 011...');
                modifiedPhoneNumber = '011' + phoneNumber;
            }
        }

        return modifiedPhoneNumber;
    };

    Utils.prototype.preprocessPhoneNumber = function (phoneNumber) {
        logger.debug('Preprocessing phone number [' + phoneNumber + ']...');
        // TODO (shabunc): I'm not sure we should have try/catch here, it's very unlikely RegExp can be broken
        var option = configuration.get('click-to-dial.preprocessing-rules', 'default', 'crm-adapter');
        if (option == 'default') {
            logger.debug('Default preprocessing will be used...');
            return this.defaultPhoneNumberPreprocessing(phoneNumber);
        } else if (option == 'none') {
            logger.debug('Phone number preprocessing has been disabled. Skipping..');
            return phoneNumber;
        }

        logger.debug('Applying custom phone number preprocessing for click-to-dial...');
        logger.debug('Read section names [' + option + ']...');

        var sectionNames = option.split(',');
        for (var i = 0; i < sectionNames.length; i++) {
            var sectionName = sectionNames[i].trim();
            logger.debug('Reading rule [' + sectionName + ']...');
            if (!sectionName) {
                logger.debug('Skipping blank section name...');
                continue;
            }

            try {
                var expression = configuration.get('expression', '', sectionName);
                var prefix = configuration.get('prefix', '', sectionName);
                var description = configuration.get('description', '', sectionName);

                logger.debug('preprocessPhoneNumber: Read rule expression[' + expression + '], prefix[' + prefix + '], description[' + description + ']...');

                if (!expression || !prefix) {
                    logger.debug('preprocessPhoneNumber: Skipping incomplete rule definition...');
                    continue;
                }

                var regex = new RegExp(expression);
                if (phoneNumber.match(regex)) {
                    logger.debug('preprocessPhoneNumber: Phone number [' + phoneNumber + '] matches expression [' + expression + '].. adding prefix [' + prefix + '].');
                    return (prefix + phoneNumber);
                }

            } catch (e) {
                /* istanbul ignore next */
                logger.debug('preprocessPhoneNumber: Processing of rule [' + sectionName + '] failed.', e);
            }
        }

        logger.debug('preprocessPhoneNumber: No rules matched phone number. Returning unmodified...');
        return phoneNumber;
    };

    Utils.prototype.preprocessANI = function (ani) {
        var option = configuration.get('screenpop.preprocessing-rule', 'default', 'crm-adapter');
        if (option == 'default') {
            return this.defaultANIPreprocessing(ani);
        } else if (option == 'none') {
            return ani;
        }

        var sectionName = option.trim();
        if (!sectionName) {
            return ani;
        }

        var expression = configuration.get('expression', '', sectionName);
        if (!expression) {
            return ani;
        }


        // TODO (shabunc): I'm intentionally do not porting any logging logic so far
        // and this variable ise used only in loggin
        //var description = configuration.get('description', '', sectionName);

        var replacement = configuration.get('replacement', '', sectionName);
        try {
            var regex = new RegExp(expression);
            return ani.replace(regex, replacement);
        }catch (e) {
            logger.error('Preprocess number, expression in section '+sectionName+':' + e.toString());
            return false;
        }
    };

    Utils.prototype.filterData = function (attribute, userData) {
        var filteredData = [];

        if (!attribute) {
            return filteredData;
        }

        var values = attribute.get('values');

        values.each(function (attributeValue) {
            var name = attributeValue.get('name');
            var value = userData[name];
            if (value) {
                filteredData.push({
                    displayName: attributeValue.get('displayName'),
                    value: value,
                    name: name
                });
            }
        });

        return filteredData;
    };


    Utils.prototype.filterByBusinessAttribute = function (attributeConfigKey, userData) {
        var attributeName = configuration.get(attributeConfigKey);

        var businessAttribute = genesys.wwe.businessAttributeCollection.find(function (attribute) {
            return attribute.get('name') === attributeName;
        });

        if (!businessAttribute) {
            return [];
        }

        return this.filterData(businessAttribute, userData);
    };


    Utils.prototype.filterToastData = function (userData) {
        return this.filterByBusinessAttribute('toast.case-data.format-business-attribute', userData);
    };


    Utils.prototype.filterCaseData = function (userData) {
        return this.filterByBusinessAttribute('interaction.case-data.format-business-attribute', userData);
    };

    Utils.prototype.convertTime = function (timestampSeconds) {
        // TODO (shabunc): shoule we add zero to make hour 2-digit always?
        var date = new Date(timestampSeconds);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var meridian = 'am';

        if (hours >= 12) {
            hours = hours - 12;
            meridian = 'pm';
        }
        if (hours === 0) {
            hours = 12;
        }
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return (hours + ':' + minutes + ' ' + meridian);
    };

    Utils.prototype.getUrlParam = function (name, urlString) {
        var searchString = urlString.replace(/.*\?/g, '');
        var params = searchString.split('&');
        for (var i = 0; i < params.length; i++) {
            var paramName = params[i].split('=');
            if (paramName[0] == name) {
                return paramName[1];
            }
        }
    };


    Utils.prototype.getSalesforceParameter = function (configOption, interaction, defaultCallback) {
        var configTemplate = configuration.get(configOption, 'false', 'crm-adapter');
        logger.debug('Template: ' + configTemplate);
        if (configTemplate === 'false') {
            return defaultCallback();
        } else {
            return this.parseTemplate(configTemplate, interaction);
        }

    };

    Utils.prototype.parseTemplate = function (template, interaction) {
        var templateVariables = template.match(/\{[^\{\}]*\}/g);
        if (templateVariables) {
            for (var i = 0; i < templateVariables.length; i++) {
                var variableComponents = templateVariables[i].slice(1, -1).split('.');
                var replacement;
                if (variableComponents[0] === 'interaction' && variableComponents[1]) {
                    replacement = interaction.get(variableComponents[1]);
                    if (typeof replacement === 'function') {
                        replacement = 'undefined';
                    } else if (variableComponents[1] === 'receivedDate' || variableComponents[1] === 'endDate' || variableComponents[1] === 'startDate') {
                        var date = new Date(replacement);
                        replacement = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    }
                    template = template.replace(templateVariables[i], replacement);
                } else if (variableComponents[0] === 'userData' && variableComponents[1] && interaction.get('userData')) {
                    replacement = interaction.get('userData')[variableComponents[1]];
                    if (typeof replacement === 'function') {
                        replacement = 'undefined';
                    }
                    template = template.replace(templateVariables[i], replacement);
                } else if (variableComponents[0] === 'contact' && variableComponents[1] && interaction.get('contact')) {
                    replacement = interaction.get('contact').get(variableComponents[1]);
                    if (typeof replacement === 'function') {
                        replacement = 'undefined';
                    }
                    template = template.replace(templateVariables[i], replacement);
                } else if ((variableComponents[0] === 'interaction' || variableComponents[0] === 'userData' || variableComponents[0] === 'contact') && variableComponents[1]) {
                    replacement = 'undefined';
                    template = template.replace(templateVariables[i], replacement);
                }
                logger.debug('Template: replace ' + templateVariables[i] + ' with ' + replacement);
            }
        }
        return template;
    };
    Utils.prototype.prepareObjectForGetTask = function (notCompatibleObject, objectId) {
        var objectType;
        var recordId;
        var compatibleObject;
        var partOfCompatibleObject;
        if (!objectId) {
            if (notCompatibleObject['success'] && notCompatibleObject['errors'] === null && Object.keys(notCompatibleObject['returnValue']).length === 1) {
                recordId = Object.keys(notCompatibleObject['returnValue'])[0];
                objectType = notCompatibleObject['returnValue']['' + recordId]['RecordType'];
                partOfCompatibleObject = {
                    "RecordType": objectType,
                    "Id": recordId
                };
                compatibleObject = {
                    "SCREEN_POP_DATA": {
                        "type": "sobject",
                        "params": {
                            "recordId": recordId
                        }
                    },
                };
                compatibleObject['' + recordId] = partOfCompatibleObject;
            } else {
                compatibleObject = {
                    "RecordType": null,
                    "Id": null
                };
            }
        } else {
            partOfCompatibleObject = {
                "RecordType": 'Contact',
                "Id": objectId
            };
            compatibleObject = {
                "SCREEN_POP_DATA": {
                    "type": "sobject",
                    "params": {
                        "recordId": objectId
                    }
                },
            };
            compatibleObject['' + objectId] = partOfCompatibleObject;
        }
        return compatibleObject;
    };

    Utils.prototype.prepareObjectForScreenPopWithParametr=function (type,interaction) {
        var compatibleObject=null;
        var section;
        var firstValue;
        var secondValue;
        switch (type) {
            case 'URL':
                section = configuration.get('screenpop.object-type-url', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'url');
                if(section && firstValue){
                    compatibleObject = {
                        url: firstValue
                    };
                }else{
                    logger.debug('Object type parameters not valid: section: ' + section + ' url: ' + firstValue);
                }
                break;
            case 'OBJECTHOME':
                section = configuration.get('screenpop.object-type-object-home', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'scope');
                if(section && firstValue){
                    compatibleObject = {
                        scope: firstValue
                    };
                }else{
                    logger.debug('Object type parameters not valid: section: ' + section + ' scope: ' + firstValue);
                }
                break;
            case 'LIST':
                section = configuration.get('screenpop.object-type-list', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'listViewId');
                secondValue = this.checkParametrType(section,interaction,'scope');
                if(section && firstValue && secondValue){
                    compatibleObject = {
                        listViewId: firstValue,
                        scope: secondValue
                    };
                }else{
                    logger.debug('Object type parameters not valid: section: ' + section + ' listViewId: ' + firstValue + ' scope: ' + secondValue);
                }
                break;
            case 'SEARCH':
                section = configuration.get('screenpop.object-type-search', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'searchString');
                if(section && firstValue){
                    compatibleObject = {
                        searchString: firstValue
                    };
                }else{
                    logger.debug('Object type parameters not valid: section: ' + section + ' searchString: ' + firstValue);
                }
                break;
            case 'NEW_RECORD_MODAL':
                section = configuration.get('screenpop.object-type-new-record', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'entityName');
                if(section && firstValue){
                    compatibleObject = {
                        entityName: firstValue
                    };
                }else{
                    logger.debug('Object type parameters not valid: section ' + section + ' entityName: ' + firstValue);
                }
                break;
            case 'FLOW':
                section = configuration.get('screenpop.object-type-flow', '', 'crm-adapter');
                firstValue = this.checkParametrType(section,interaction,'flowDevName');
                secondValue = this.checkParametrType(section,interaction,'flowArgs');
                if(section && firstValue && secondValue) {
                    compatibleObject = {
                        flowDevName: firstValue,
                        flowArgs: JSON.parse(secondValue)
                    }
                }else{
                    logger.debug('Object type parameters not valid: section: ' + section + ' flowDevName :' + firstValue + ' flowArgs: ' + firstValue);
                }
                break;
            default: break;
        }
        return compatibleObject;
    };


    Utils.prototype.checkParametrType=function (section,interaction,parameter) {
        var nameRegex = '^\\$(.*)\\$$';
        var regexp = new RegExp(nameRegex);
        if(section){
            var paramValue = configuration.get(parameter, '', section);
            if(paramValue){
                if(regexp.test(paramValue)){
                    logger.debug('CheckParametrType from attach data section ' + section + ' ' + parameter + ' : ' + paramValue);
                    var matchAll = paramValue.match(regexp);
                    //var matchAllArr = Array.from(matchAll);
                    return interaction.getParametrFromAttachData(matchAll[1]);
                }else{
                    logger.debug('CheckParametrType section: ' + section + ' ' + parameter + ' : ' + paramValue);
                    return paramValue;
                }
            }else{
                logger.debug('Object type parametr not valid: section: ' + section + ' ' + parameter + ' : ' + paramValue);
            }
        }
        return null
    };

    return new Utils();

});


// Utils.prototype.prepareObjectForScreenPopWithParametr=function (type,interaction) {
//     var compatibleObject;
//     switch (type) {
//         case 'URL':
//             compatibleObject = {
//                 url: configuration.get('screenpop.object-type-url', 'https://www.youtube.com', 'crm-adapter')
//             };
//             break;
//         case 'OBJECTHOME':
//             compatibleObject = {
//                 scope: configuration.get('screenpop.object-type-object-home', 'Account', 'crm-adapter')
//             };
//             break;
//         case 'LIST':
//             compatibleObject = {
//                 listViewId: configuration.get('screenpop.object-type-list-id', '00B1P000003EbB2UAK', 'crm-adapter'),
//                 scope: configuration.get('screenpop.object-type-list-scope', 'Contact', 'crm-adapter')
//             };
//             break;
//         case 'SEARCH':
//             compatibleObject = {
//                 searchString: configuration.get('screenpop.object-type-search', 'Willard AND Clinton024', 'crm-adapter')
//             };
//             break;
//         case 'NEW_RECORD_MODAL':
//             compatibleObject = {
//                 entityName: configuration.get('screenpop.object-type-new-record-name', 'Contact', 'crm-adapter')
//             };
//             break;
//         case 'FLOW':
//             // compatibleObject={
//             //     flowDevName:configuration.get('screenpop.object-type-flow-name', 'Test_Flow', 'crm-adapter'),
//             //     flowArgs:JSON.parse(configuration.get('screenpop.object-type-flow-args', '[{"name": "test_flow_1","type":"Text","value":"Test ha ha"}]', 'crm-adapter'))
//             // };
//             compatibleObject = {
//                 flowDevName: configuration.get('screenpop.object-type-flow-name', 'test_flow', 'crm-adapter'),
//                 flowArgs: [{"name": "text", "type": "String", "value": "Test ha ha"}, {"name": "number", "type": "Number","value": 5}]
//             };
//             break;
//     }
// };