// Genesys - Zendesk App
(function () {
    return {
        timeOuts: [],
        searchCrit: null,
        searchRslt: null,
        userFieldRslt: {},
        ticketFieldRslt: {},
        resize : false,
        resizeX : 800,
        resizeY : 600,
        width  : 800,
        height : 600,
        min_height: 350,
        min_width: 350,
        requests: {
            ticketCreateRequest: function (data) { return this.TicketDao.createRequest(data); },
            ticketUpdateRequest: function (id, data) { return this.TicketDao.updateRequest(id, data); },
            getUserRequest: function (userId) { return this.InfoUtil.getUserRequest(userId); },
            getOrgRequest: function (orgId) { return this.InfoUtil.getOrgRequest(orgId); },
            getUserOrgRequest_1: function (userId) { return this.InfoUtil.getUserRequest(userId); },
            getUserOrgRequest_2: function (orgId) { return this.InfoUtil.getOrgRequest(orgId); },
            getSearchRequest: function (crit) { return this.SearchDao.getSearchRequest(crit); },
            getAgentRequest: function (crit) { return this.SearchDao.getAgentRequest(crit); },
            adminPaneSettingRequest: function (arg) { return this.AdminPane.getSettingRequest(arg); },
            notificationRequest: function (arg) { return this.NotificationUtil.getRequest(arg); },
            getUserFieldRequest: function (arg) { return this.InfoUtil.getUserFieldRequest(arg); },
            getTicketFieldRequest: function (arg) { return this.InfoUtil.getTicketFieldRequest(arg); },
            loadTicket: function (arg) { return this.TicketDao.loadTicket(arg); },
            loadUser: function (arg) { return this.SearchDao.loadUser(arg); }
        },
        events: {
            'iframe.cti': function (data) {
                this.ZendeskAction.processMessage(this, data);
            },

            'message.login' : function(data) {
                this.ClickToDialPane.populatePhones(this, data);
            },

            'message.revealClickToDial' : function(data) {
                var $ctd_app = this.$().parents('.app_view_outer');
                if(data.isShown) {
                    $ctd_app.css({'position' : 'absolute', 'bottom':'0'});
                } else {
                    $ctd_app.css({'position' : 'static', 'bottom':'auto'});
                }
            },

            'app.activated': function (data) {
                this.init();
                if(data.firstLoad && this.currentLocation() == 'top_bar') {

                    //preload the pane in background once the app is activated
                    this.preloadPane();
                }
                this.PaneUtil.switchTo(this, this.currentLocation(), { 'data': data });
            },

            'app.deactivated': function (data) {
                var cl = this.currentLocation();
                var ci = this.StoreUtil.getCurrentInstance(this);
                if (cl == 'user_sidebar') {
                    if (ci !== null && ci.type == 'user' && this.user() !== null && this.user().id() == ci.id) {
                        this.StoreUtil.setCurrentInstance(this, { type: null, id: null });
                    }
                }
                else if (cl == 'ticket_sidebar') {
                    if (ci !== null && ci.type == 'ticket' && this.ticket() !== null && this.ticket().id() == ci.id) {
                        this.StoreUtil.setCurrentInstance(this, { type: null, id: null });
                    }
                }
            },


            'pane.deactivated' : function (data) {
                this.message('revealClickToDial', { isShown: false }, ['user_sidebar', 'ticket_sidebar']);
                this.store('hasPopover', null);
            },
            'pane.activated': function (data) {

                this.init();
                var currentLocation = this.currentLocation();
                var _ref = this;

                this.PaneUtil.switchTo(this, currentLocation, { 'data': data });

                if (currentLocation == 'top_bar') {

                    this.message('revealClickToDial', { isShown: true }, ['user_sidebar', 'ticket_sidebar']);

                    if (!data.firstLoad) {

                        this.width  = this.setting('crm_width')  <= this.min_width ? this.min_width : this.setting('crm_width');
                        this.height = this.setting('crm_height') <= this.min_width ? this.min_width : this.setting('crm_height');

                        //there is no need to set inDOM here anymore, since we preload this pane and set this property elswhere
                        //this.inDOM = true;

                        this.popover({
                            width:  this.width,
                            height: this.height
                        });

                        //Mac browser fix
                        this.timeOuts.push(setTimeout(function () {
                            _ref.$('.div-cti-panel').css('display', 'inline');
                        }, 500));
                        this.timeOuts.push(setTimeout(function () {
                            _ref.$('.div-cti-panel').css('display', '');
                        }, 2500));
                        //
                    }
                    if (this.store('hasPopover') === null) {
                        this.store('hasPopover', 'T');
                        this.popover({
                            width: this.width,
                            height: this.height
                        });
                        /*
                        var toId = setTimeout(function () {
                            _ref.store('hasPopover', null);
                        }, 5000);
                        this.timeOuts.push(toId);
                        */
                    }

                    this.PaneUtil.showHeader(this, false);
                    this.$('.div-cti-panel').parents('div').eq(0).show();

                    /* re-size drag handles */
                    this.$("<div class='resize-handle-x'></div>").appendTo(this.$('.div-cti-panel'));
                    this.$("<div class='resize-handle-y'></div>").appendTo(this.$('.div-cti-panel'));

                    this.CtiPane.registerEvents(this);

                    var _cti = this.CtiPane.getCtiPanel(this);

                    if (_cti) {
                        _cti.css('height', this.height);
                        this.$('.div-cti-panel').parents('div').eq(0).css("height", "");
                    }
                }
            },

            'app.willDestroy': function () {
                while (this.timeOuts.length > 0) {
                    clearTimeout(this.timeOuts[0]);
                    this.timeOuts.splice(0, 1);
                }
            },

            'getUserOrgRequest_1.done': function (result) {
                if (result.user && result.user.organization_id) {
                    this.ajax('getUserOrgRequest_2', result.user.organization_id);
                }
                else {
                    result = this.InfoUtil.getCallCenterParam(this, null);
                    for (var cb in this.ZendeskAction.callBacks) {
                        if (cb.indexOf('getUserOrgRequest_2') === 0) {
                            var msg = this.ZendeskAction.callBacks[cb];
                            if (cb == 'getUserOrgRequest_2.done___' + msg.sig) {
                                var msg1 = { sig: msg.sig, action: msg.action, format: msg.format };
                                msg1.result = result;
                                this.ZendeskAction.sendMessage(this, msg1);
                                delete this.ZendeskAction.callBacks[cb];
                            }
                        }
                    }
                }
            },

            'getUserOrgRequest_2.done': function (result) {

                this.ZendeskAction.sendLogMessage(this, { event: 'getUserOrgRequest_2.done', result: result });

                result = this.InfoUtil.getCallCenterParam(this, result);
                for (var cb in this.ZendeskAction.callBacks) {
                    if (cb.indexOf('getUserOrgRequest_2') === 0) {
                        var msg = this.ZendeskAction.callBacks[cb];
                        if (cb == 'getUserOrgRequest_2.done___' + msg.sig) {
                            var msg1 = { sig: msg.sig, action: msg.action, format: msg.format };
                            msg1.result = result;
                            this.ZendeskAction.sendMessage(this, msg1);
                            delete this.ZendeskAction.callBacks[cb];
                        }
                    }
                }
            },

            'getUserRequest.done': function (result) {

            },

            'getSearchRequest.done': function (result) {

                this.ZendeskAction.sendLogMessage(this, { event: 'getSearchRequest.done', result: result });
                var _ref = this;
                var __status = false;
                var x = 0;
                var y = 0;
                if (result && result.results && result.results.length > 0) {
                    result.results = this.SearchDao.sortDescByDate(result.results);
                }

                if (this.searchCrit === null || this.searchCrit.length === 0) {
                    if (this.searchRslt !== null && this.searchRslt.length > 0) {
                        if (result && result.results && result.results.length > 0) {
                            for (y = 0; y < result.results.length; y++) {
                                __status = true;
                                for (x = 0; x < this.searchRslt.length; x++) {
                                    if (result.results[y].result_type == this.searchRslt[x].result_type && result.results[y].id == this.searchRslt[x].id) {
                                        __status = false;
                                        break;
                                    }
                                }
                                if (__status === true) {
                                    this.searchRslt.push(result.results[y]);
                                }
                            }
                        }
                        result = { results: this.searchRslt };
                    }
                    if (result && result.results && result.results.length == 1) {
                        this.$('.lnk-search-single').attr('href', '/agent/#/' + result.results[0].result_type + 's/' + result.results[0].id);
                        this.$('.lnk-search-single')[0].click();
                    }
                    else {
                        result = this.SearchDao.getMinColumns(result);
                        result = this.SearchDao.filterResult(this, result);
                        if (this.SearchDao.countResult(this, result) > 1) {
                            //screenpop
                            var search_result_html = this.SearchDao.getMinColumnsHtml(result);
                            this.$('.div2-gen-cti-table #screenpop_nav').html(search_result_html.nav);
                            this.$('.div2-gen-cti-table #screenpop_results').html(search_result_html.html);
                            this.$('.lnk-gen-result').show();


                            if (this.store('show_search_page') === true) {
                                this.store('searchpage_result', this.SearchDao.getSearchColumnsHtml(result));
                                this.$('.lnk-search-page')[0].click();
                            }
                        }
                        else {
                            for (x in result) {
                                this.$('.lnk-search-single').attr('href', '/agent/#/' + x + 's/' + result[x][0].id);
                                this.$('.lnk-search-single')[0].click();
                                break;
                            }
                        }
                    }
                    this.searchRslt = null;
                    this.searchCrit = null;
                }
                else {
                    var __crit = this.searchCrit.splice(0, 1);
                    if (result && result.results && result.results.length > 0) {
                        this.searchRslt = this.searchRslt === null ? [] : this.searchRslt;
                        for (y = 0; y < result.results.length; y++) {
                            __status = true;
                            for (x = 0; x < this.searchRslt.length; x++) {
                                if (result.results[y].result_type == this.searchRslt[x].result_type && result.results[y].id == this.searchRslt[x].id) {
                                    __status = false;
                                    break;
                                }
                            }
                            if (__status === true) {
                                this.searchRslt.push(result.results[y]);
                            }
                        }
                    }
                    this.ajax('getSearchRequest', __crit);
                }
            },

            'ticketCreateRequest.done': function (result) {
                for (var cb in this.ZendeskAction.callBacks) {
                    if (cb.indexOf('ticketRequest') === 0) {
                        var msg = this.ZendeskAction.callBacks[cb];
                        if (cb == 'ticketRequest.done___' + msg.sig) {
                            var msg1 = { sig: msg.sig, action: msg.action, format: msg.format };
                            msg1.result = result.ticket.id;
                            this.ZendeskAction.sendMessage(this, msg1);
                            delete this.ZendeskAction.callBacks[cb];
                            services.notify('Ticket #' + result.ticket.id + ' created');
                            services.notify('Please refresh the page');
                        }
                    }
                }
            },

            'ticketUpdateRequest.done': function (result) {
                for (var cb in this.ZendeskAction.callBacks) {
                    if (cb.indexOf('ticketRequest') === 0) {
                        var msg = this.ZendeskAction.callBacks[cb];
                        if (cb == 'ticketRequest.done___' + msg.sig) {
                            var msg1 = { sig: msg.sig, action: msg.action, format: msg.format };
                            msg1.result = result.ticket.id;
                            this.ZendeskAction.sendMessage(this, msg1);
                            delete this.ZendeskAction.callBacks[cb];
                            services.notify('Ticket #' + result.ticket.id + ' updated');
                            services.notify('Please refresh the page');
                        }
                    }
                }
            },

            'getAgentRequest.done': function (result) {
                var roles = {};
                var roleArr = [];
                var h = '';
                var x = 0;
                var perm = 0;
                var perm_id = { 'perm_cti_panel': 'ddCtiGen', 'perm_agent_monitor': 'ddAgentMGen', 'perm_admin_monitor': 'ddAdminMGen' };
                var perm_val = null;
                if (result !== null && result.results !== null && result.results.length > 0) {
                    for (x = 0; x < result.results.length; x++) {
                        roles['r_' + result.results[x].role] = 1;
                    }
                    for (x in roles) {
                        roleArr.push(x.split('_')[1]);
                    }
                    for (perm in perm_id) {
                        perm_val = this.settings[perm];
                        perm_val = !this.Utility.isBlankOrNull(perm_val) ? perm_val.split(',') : [];
                        h = '';
                        for (x = 0; x < roleArr.length; x++) {
                            h += '<option value="' + roleArr[x] + '"' +
                                    (this.Utility.indexOfArray(perm_val, roleArr[x]) >= 0 ? ' selected="selected"' : '') +
                                    '>' + roleArr[x] + '</option>';
                        }
                        this.$('.' + perm_id[perm]).append(h);
                    }
                }
            },

            //Phone Start
            'getTicketFieldRequest.always': function (result) {
                var _ticket = this.ticket();
                var phone = null;
                var phones = [];
                var tfr = this.ticketFieldRslt['t_' + _ticket.id()];
                if (tfr) {
                    tfr.idx = tfr.idx + 1;
                    if (tfr.idx < tfr.ids.length) {
                        if (result && result.ticket_field) {
                            tfr.result = tfr.result.concat(result);
                        }
                        this.ajax('getTicketFieldRequest', tfr);
                    }
                    else {
                        if (result && result.ticket_field) {
                            tfr.result = tfr.result.concat(result);
                        }
                        for (var x = 0; x < tfr.result.length; x++) {
                            if (tfr.result[x].ticket_field) {
                                phone = _ticket.customField('custom_field_' + tfr.result[x].ticket_field.id);
                                if (phone)
                                    phones.push({
                                        number: phone,
                                        label: tfr.result[x].ticket_field.title
                                    });
                            }
                        }
                        tfr.cb(phones);
                        delete this.ticketFieldRslt['t_' + _ticket.id()];
                    }
                }
            },

            'getUserFieldRequest.always': function (result) {
                var _user = this.user();
                var phone = null;
                var phones = [];
                var idx = null;
                var x = 0;
                var ufr = this.userFieldRslt['u_' + _user.id()];
                if (ufr) {
                    if (ufr.step == 1) {
                        if (result) {
                            if (!this.Utility.isBlankOrNull(result.user.phone))
                                ufr.phones.push({ number: result.user.phone, label: 'Phone' });
                            ufr.user = result.user;
                            ufr.step = 2;
                            this.ajax('getUserFieldRequest', ufr);
                        }
                    }
                    else if (ufr.step == 2) {
                        if (result.user_fields && result.user_fields.length > 0) {
                            for (x = 0; x < result.user_fields.length; x++) {
                                idx = this.Utility.indexOfArray(ufr.ids, result.user_fields[x].key);
                                if (idx >= 0) {
                                    ufr.ids[idx] = result.user_fields[x].id;
                                }
                            }
                            ufr.step = 3;
                            this.ajax('getUserFieldRequest', ufr);
                        }
                    }
                    else {
                        ufr.idx = ufr.idx + 1;
                        if (ufr.idx < ufr.ids.length) {
                            if (result && result.user_field) {
                                ufr.result = ufr.result.concat(result);
                            }
                            this.ajax('getUserFieldRequest', ufr);
                        }
                        else {
                            phones = ufr.phones;
                            if (result && result.user_field) {
                                ufr.result = ufr.result.concat(result);
                            }
                            for (x = 0; x < ufr.result.length; x++) {
                                if (ufr.result[x].user_field) {
                                    phone = ufr.user.user_fields[ufr.result[x].user_field.key];
                                    if (phone)
                                        phones.push({
                                            number: phone,
                                            label: ufr.result[x].user_field.title
                                        });
                                }
                            }
                            ufr.cb(phones);
                            delete this.userFieldRslt['u_' + _user.id()];
                        }
                    }
                }
            },
            //Phone End

            //Custom Start
            'click .lnk-search-page': function (data) {
                return true;
            },
            'click .lnk-search-single': function (data) {
                return true;
            },
            'notification.dialing': function (data) {
                //console.log("NOTIFICATION DIALING");
                if (this.currentLocation() == 'top_bar') {
                    this.ZendeskAction.processMessage(this, data.message);
                    this.popover({
                        width: this.width,
                        height: this.height
                    });
                    //_this.$('.lnk-gen-col-exp').trigger('click');
                }
            },
            'dial': function (data) {
                var _ref = this;
                this.NotificationUtil.notify(_ref, {
                    app_id: _ref.id(),
                    event: 'dialing',
                    body: { message: { action: 'DIAL', number: data.num} },
                    agent_id: _ref.currentUser().id()
                });
                //this.ZendeskAction.sendLogMessage(this, { event: 'dial', result: data });
            },
            'notification.whatisitresponse': function (data) {
                var comment = this.store('comment_wrapup');
                if (this.currentLocation() == 'top_bar' && data.message && data.message.action == 'IDENTIFY' && comment) {
                    var ci = this.StoreUtil.getCurrentInstance(this);
                    if (ci !== null && ci.type == data.message.type && ci.id == data.message.id) {
                        this.store('comment_wrapup', null);
                        this.StoreUtil.setCurrentInstance(this, { 'id': data.message.id, 'type': data.message.type });
                        this.TicketDao.create(this, comment, this.InfoUtil.getRecordInfo(this));
                    }
                    this.ZendeskAction.sendLogMessage(this, { event: 'notification.whatisitresponse', result: data });
                }

            },
            'notification.whatisit': function (data) {
                var _ref = this;
                var cl = this.currentLocation();
                var ty = null;
                var _id = null;
                if ((cl == 'user_sidebar' || cl == 'ticket_sidebar') && data.message && data.message.action == 'GET_ID') {
                    ty = cl == 'user_sidebar' ? 'user' : 'ticket';
                    _id = cl == 'user_sidebar' ? this.user().id() : this.ticket().id();
                    this.NotificationUtil.notify(_ref, {
                        app_id: _ref.id(),
                        event: 'whatisitresponse',
                        body: { message: { action: 'IDENTIFY', type: ty, id: _id} },
                        agent_id: _ref.currentUser().id()
                    });
                }

            },
            'whatis': function (data) {
                var _ref = this;
                this.NotificationUtil.notify(_ref, {
                    app_id: _ref.id(),
                    event: 'whatisit',
                    body: { message: { action: 'GET_ID'} },
                    agent_id: _ref.currentUser().id()
                });
            },
            'notification.inboundcallevent': function (data) {
                var _ref = this;
                if (this.currentLocation() == 'top_bar') {
                    this.popover({
                        width: this.width,
                        height: this.height
                    });
                }

            },
            'inboundcall': function (data) {
                var _ref = this;
                this.NotificationUtil.notify(_ref, {
                    app_id: _ref.id(),
                    event: 'inboundcallevent',
                    body: { message: { action: 'INBOUND_CALL'} },
                    agent_id: _ref.currentUser().id()
                });
                this.ZendeskAction.sendLogMessage(this, { event: 'inboundcall', result: data });
            },


            //Custom End

            //CTI Start
            'click .lnk-gen-result': function (event) {
                this.CtiPane.lnkResultClick(this);
                return false;
            },
            //CTI End

            //CTD Start
            'click a.click-to-dial': function (event) {
                event.preventDefault();
                var num = event.target.innerText;
                this.ClickToDialPane.dial(this, num);
                //return false;
            },
            //CTD End

            //Nav Start
            'click .lnk-gen-adws': function (event) {
                this.NavPane.refreshMonitorFrame(this, event);
                return false;
            },
            'click .lnk-gen-agws': function (event) {
                this.NavPane.refreshMonitorFrame(this, event);
                return false;
            },
            //Nav End

            //Search Result Start
            'click a.lnk-search-result': function (event) {
                this.SearchDao.showHideLnkResult(this, true);
            },
            //Search Result End


            'mouseover a.lnk-search-result': function (event) {
                this.$(event.target).popover('show');
            },

            'mouseout a.lnk-search-result': function (event) {
                this.$().popover('hide');
            },
            //Search Result End

            'click #screenpop_nav a' : function(event) {
              //event.preventDefault();
              console.log(event);
              var target_id  = this.$(event.target).data('target');
              var clicked    = this.$(event.target);
              var navigation = clicked.parents('nav');
              var content    = navigation.siblings();

              navigation.find('.active').removeClass('active');
              clicked.addClass('active');

              content.find('.active').removeClass('active');
              content.find('#' + target_id).addClass('active');

              console.log("TARGET ID IS ", target_id);
            },

            //AdminPane Events Start
            'click .lnk-gen-admin-settings': function (event) {
                this.AdminPane.showCredModal();
                return false;
            },
            'click .lnk-gen-loginidchange': function (event) {
                this.AdminPane.txtLoginIdChange();
                return false;
            },
            'click .lnk-gen-loginsubmit': function (event) {
                this.AdminPane.hideCredModal();
                return false;
            },
            'adminPaneSettingRequest.always': function (result) {
                var _ref = this;
                var toId = setTimeout(function () { _ref.$('.lnk-gen-admin-settings').show(); _ref.$('.sp-gen-admin-settings').hide(); }, 3000);
                this.timeOuts.push(toId);
            }
            //AdminPane Events End
        },

        init: function () {
            this.AdminPane._parent = this;
            this.ClickToDialPane._parent = this;
            this.CtiPane._parent = this;
            this.InfoUtil._parent = this;
            this.NavPane._parent = this;
            this.NotificationUtil._parent = this;
            this.PaneUtil._parent = this;
            this.SearchDao._parent = this;
            this.StoreUtil._parent = this;
            this.TicketDao._parent = this;
            this.Utility._parent = this;
            this.ZendeskAction._parent = this;
        },
        //custom library functions start
        Utility: {
            _parent: null,
            isBlankOrNull: function (str) {
                return str === null || typeof (str) === 'undefined' || str === '';
            },
            isArray: function (arr) {
                return arr instanceof Array;
            },
            indexOfArray: function (arr, val) {
                if (this.isArray(arr) && arr.length > 0) {
                    for (var x = 0; x < arr.length; x++) {
                        if (arr[x] == val)
                            return x;
                    }
                }
                return -1;
            }
        },

        PaneUtil: {
            _parent: null,
            resources: {
                PATTERN: /[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+/
            },

            getDomainFromURL: function (baseURI) {
                try {
                    var regexResult = this.resources.PATTERN.exec(baseURI);
                    return regexResult && regexResult.length > 0 ? regexResult[0] : '';
                }
                catch (exp) {
                    return '';
                }
            },

            switchTo: function (app, paneId, arg) {

                var role = null;
                var ctiRoles = app.setting('perm_cti_panel');
                var adMRoles = app.setting('perm_admin_monitor');
                var agMRoles = app.setting('perm_agent_monitor');
                var phones = null;

                ctiRoles = !this._parent.Utility.isBlankOrNull(ctiRoles) ? ctiRoles.split(',') : [];
                adMRoles = !this._parent.Utility.isBlankOrNull(adMRoles) ? adMRoles.split(',') : [];
                agMRoles = !this._parent.Utility.isBlankOrNull(agMRoles) ? agMRoles.split(',') : [];

                app.$('.hd-genesys-app-id').val(app.id());

                if (paneId == 'top_bar') {

                    if (app.inDOM) return;

                    role = app.currentUser().role();

                    if (this._parent.Utility.indexOfArray(ctiRoles, role) != -1) {

                        //set inDOM property to true after the top-bar app was preloaded
                        app.inDOM = true;

                        app.switchTo('pane', {
                            desc: app.I18n.t('desc'),
                            adapterDomain: this._parent.InfoUtil.getAdapterDomain(app.setting('cti_url')),
                            adapterUrl: app.setting('cti_url'),
                            arrowUpUrl: app.assetURL('icon_arrow_up.png'),
                            arrowDownUrl: app.assetURL('icon_arrow_down.png'),
                            phoneIds: app.setting('ticket_phone_id'),
                            collapseExpand: app.assetURL('arrow-up.png')
                        });

                        app.setIconState('active', app.assetURL('top_all.png'));
                        app.setIconState('inactive', app.assetURL('top_all.png'));
                        app.setIconState('hover', app.assetURL('top_all.png'));
                    }
                    else {
                        app.setIconState('active', app.assetURL('top_all.png'));
                        app.setIconState('inactive', app.assetURL('top_all.png'));
                        app.setIconState('hover', app.assetURL('top_all.png'));
                        app.switchTo('error', {});
                        this.showHeader(app, true, 'Genesys Cloud - Notification');
                    }
                }
                else if (paneId == 'nav_bar') {
                    var sr = app.store('searchpage_result');
                    if (sr !== null) {
                        app.switchTo('leftpane', {
                            'isDefaultUrl': false
                        });

                        var h1 = '<a id=\'lnkADWS\' class=\'lnk-gen-adws\' href=\'/agent/#/apps/genesys-cloud-cti\'>Refresh to view Monitor Url</a>';

                        this.showHeader(app, true, h1);
                        app.$('.search-result').html(sr);
                        app.store('searchpage_result', null);
                    }
                    else {
                        role = app.currentUser().role();

                        var descAgent = app.I18n.t('descAgentMonitor');
                        var descAdmin = app.I18n.t('descAdminMonitor');
                        var isAgentUrl = this._parent.Utility.indexOfArray(agMRoles, role) != -1;
                        var agentUrl = app.setting('agent_monitor_url');
                        var isAdminUrl = this._parent.Utility.indexOfArray(adMRoles, role) != -1;
                        var adminUrl = app.setting('admin_monitor_url');
                        var defaultUrl = isAdminUrl ? app.setting('admin_monitor_url') : (
                                        isAgentUrl ? app.setting('agent_monitor_url') : null
                                    );
                        var h = '';

                        if (isAdminUrl || isAgentUrl) {
                            app.switchTo('leftpane', {
                                'isDefaultUrl': (isAdminUrl || isAgentUrl),
                                'defaultUrl': defaultUrl
                            });

                            app.store('ws_url', defaultUrl);
                            app.setIconState('active', app.assetURL('icon_nav_bar_active.png'));
                            app.setIconState('inactive', app.assetURL('icon_nav_bar_inactive.png'));
                            app.setIconState('hover', app.assetURL('icon_nav_bar_active.png'));

                            if (isAdminUrl)
                                h += '<a id=\'lnkADWS\' class=\'lnk-gen-adws\' href=\'' + adminUrl + '\'>' + descAdmin + '</a>';
                            if (isAdminUrl && isAgentUrl)
                                h += '<a href="#" onclick="return false;">&nbsp;&nbsp;|&nbsp;&nbsp</a>';
                            if (isAgentUrl)
                                h += '<a id=\'lnkAGWS\' class=\'lnk-gen-agws\' href=\'' + agentUrl + '\'>' + descAgent + '</a>';

                            this.showHeader(app, true, h);
                        }
                        else {
                            app.setIconState('active', app.assetURL('icon_nav_bar_inactive.png'));
                            app.setIconState('inactive', app.assetURL('icon_nav_bar_inactive.png'));
                            app.setIconState('hover', app.assetURL('icon_nav_bar_inactive.png'));
                            app.switchTo('error', {});
                            this.showHeader(app, true, 'Genesys Cloud - Notification');
                        }
                    }
                }
                else if (paneId == 'user_sidebar') {
                    role = app.currentUser().role();
                    if (app.user() !== null) {
                        app.store('current_record_link', '/agent/#/users/' + app.user().id());
                        /*
                        if (role == 'admin' && app.currentUser().id() == app.user().id()) {
                        this._parent.AdminPane.app = app;
                        this.showAppSettings(app, arg.data);
                        this._parent.SearchDao.getAgents(app, 'type:user -role:end-user');
                        this.showHeader(app, true, 'Genesys Permission');
                        }
                        else {
                        */

                        this.showHeader(app, true, 'Genesys - ClickToDial');
                        this._parent.ClickToDialPane.populatePhones(app);

                        //}
                        this._parent.StoreUtil.setCurrentInstance(app, { 'id': app.user().id(), 'type': 'user' });
                        if(this._parent.store('hasPopover') == 'T') {
                          app.$().parents('.app_view_outer').css({'position' : 'absolute', 'bottom':'0'});
                        }
                    }
                    else {
                        //this._parent.StoreUtil.setCurrentInstance(app, { 'id': null, 'type': null });
                    }
                }
                else if (paneId == 'ticket_sidebar') {

                    app.store('current_record_link', '/agent/#/tickets/' + app.ticket().id());
                    this.showHeader(app, true, 'Genesys - ClickToDial');
                    this._parent.ClickToDialPane.populatePhones(app);
                    this._parent.StoreUtil.setCurrentInstance(app, { 'id': app.ticket().id(), 'type': 'ticket' });

                    if(this._parent.store('hasPopover') == 'T') {
                      app.$().parents('.app_view_outer').css({'position' : 'absolute', 'bottom':'0'});
                    }


                }
            },

            showHeader: function (app, show, header) {
                if (show) {
                    app.$('header').show();
                    app.$('header').find('h1.h1-genesys-pm').eq(0).show().html(header);
                    app.$('header').find('h1.h1-genesys-ws').eq(0).hide();
                }
                else {
                    app.$('header').hide();
                }
            },

            showAppSettings: function (app, data) {
                app.switchTo('adminpane', {
                    settings: app.settings,
                    email: app.currentUser().email(),
                    uri: this.getDomainFromURL(data.currentTarget.baseURI),
                    installation_id: app.installationId(),
                    descAgentLbl: app.I18n.t('descAgentMonitor'),
                    descAdminLbl: app.I18n.t('descAdminMonitor')
                });
            }
        },

        InfoUtil: {
            _parent: null,
            getAdapterDomain: function (url) {
                var protocol = url.split('://')[0];
                var domain = url.split('://')[1].split('/')[0];
                return (protocol + '://' + domain);
            },
            getCurrentUser: function (obj) {
                var userId = obj.currentUser().id();
                return this.getUser(obj, userId);
            },
            getUser: function (obj, userId) {
                return obj.ajax('getUserRequest', userId);
            },
            getCallCenter: function (obj) {
                return obj.ajax('getUserOrgRequest_1', obj.currentUser().id());
            },
            getOrgRequest: function (orgId) {
                return {
                    url: ('/api/v2/organizations/' + orgId + '.json'),
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            getUserRequest: function (userId) {
                return {
                    url: ('/api/v2/users/' + userId + '.json'),
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            getRecordInfo: function (app) {
                var obj = this._parent.StoreUtil.getCurrentInstance(app);
                return obj ? obj : { type: null, id: null };
            },
            getCallCenterParam: function (obj, org) {
                var result = {};
                var organization = org ? org.organization : null;

                result.agentLoginTimeout = (organization && organization.organization_fields.agent_login_timeout) ? organization.organization_fields.agent_login_timeout : obj.setting('agent_login_timeout');
                result.agentMonitorUrl = (organization && organization.organization_fields.agent_monitor_url) ? organization.organization_fields.agent_monitor_url : obj.setting('agent_monitor_url');
                result.authenticationUrl = 'DEPRECATED';
                result.backupServerAddress = 'DEPRECATED';
                result.center_name = (organization && organization.organization_fields.center_name) ? organization.organization_fields.center_name : obj.setting('center_name');
                result.confirmAgentTransfers = (organization && organization.organization_fields.confirm_agent_transfers) ? organization.organization_fields.confirm_agent_transfers : obj.setting('confirm_agent_transfers');
                result.domainCode = '';
                result.failOverPollingInterval = (organization && organization.organization_fields.failover_pooling_interval) ? organization.organization_fields.failover_pooling_interval : obj.setting('failover_pooling_interval');
                result.failOverStatusUrl = 'DEPRECATED';
                result.localLoginEnabled = (organization && organization.organization_fields.local_logging) ? organization.organization_fields.local_logging : obj.setting('local_logging');
                result.pageCode = '';
                result.serverAddress = (organization && organization.organization_fields.server_url) ? organization.organization_fields.server_url : obj.setting('server_url');
                result.agentWrapupTime = (organization && organization.organization_fields.agent_wrapup_time) ? organization.organization_fields.agent_wrapup_time : obj.setting('agent_wrapup_time');

                result.confirmAgentTransfers = result.confirmAgentTransfers === true ? 'T' : 'F';
                result.localLoginEnabled = result.localLoginEnabled === true ? 'T' : 'F';

                obj.store('auto_create_ticket', ((organization && organization.organization_fields.auto_create_ticket) ? organization.organization_fields.auto_create_ticket : obj.setting('auto_create_ticket')));
                obj.store('search_customer', ((organization && organization.organization_fields.search_customer) ? organization.organization_fields.search_customer : obj.setting('search_customer')));
                obj.store('search_ticket', ((organization && organization.organization_fields.search_ticket) ? organization.organization_fields.search_ticket : obj.setting('search_ticket')));
                obj.store('search_organization', ((organization && organization.organization_fields.search_organization) ? organization.organization_fields.search_organization : obj.setting('search_organization')));
                obj.store('show_search_page', ((organization && organization.organization_fields.show_search_page) ? organization.organization_fields.show_search_page : obj.setting('show_search_page')));
                obj.store('disable_call_activity', ((organization && organization.organization_fields.disable_call_activity) ? organization.organization_fields.disable_call_activity : obj.setting('disable_call_activity')));

                return result;
            },
            getUserFieldRequest: function (arg) {
                var _url = '';
                if (arg.step == 1) {
                    _url = '/api/v2/users/' + arg.userid + '.json';
                }
                else if (arg.step == 2) {
                    _url = '/api/v2/user_fields.json';
                }
                else {
                    _url = '/api/v2/user_fields/[id].json';
                    _url = _url.replace('[id]', arg.ids[arg.idx]);
                }
                return {
                    url: _url,
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            getTicketFieldRequest: function (arg) {
                var _url = '/api/v2/ticket_fields/[id].json';
                _url = _url.replace('[id]', arg.ids[arg.idx]);
                return {
                    url: _url,
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            getPhoneNumbers: function (app, type, cb) {
                var phones = [];
                var phone = '';
                var ids = app.setting('ticket_phone_id');
                var x = 0;
                var idx = -1;
                var ticket = null;
                var _ref = null;

                ids = ids ? ids.split(',') : [];
                if (type == 'ticket') {
                    ticket = app.ticket();
                    if (ids.length > 0 && ticket.id() !== null) {
                        app.ticketFieldRslt['t_' + ticket.id()] = { 'ids': ids, 'idx': 0, 'result': [], 'cb': cb };
                        app.ajax('getTicketFieldRequest', app.ticketFieldRslt['t_' + ticket.id()]);
                    }
                }
                else if (type == 'user') {
                    app.userFieldRslt['u_' + app.user().id()] = { 'ids': ids, 'idx': 0, 'result': [], 'cb': cb, 'userid': app.user().id(), 'user': null, 'phones': [], 'step': 1 };
                    app.ajax('getUserFieldRequest', app.userFieldRslt['u_' + app.user().id()]);
                }
                return phones;
            }
        },

        StoreUtil: {
            _parent: null,
            getTicketPhone: function (app) {
                var phoneId = app.setting('ticket_phone_id');
                var phone = null;
                if (phoneId && phoneId !== '') {
                    phone = app.store('tpid_' + phoneId);
                    app.store('tpid_' + phoneId, null);
                }
                return phone;
            },
            setTicketPhone: function (app, phone) {
                var phoneId = app.setting('ticket_phone_id');
                if (phoneId && phoneId !== '') {
                    app.store('tpid_' + phoneId, phone);
                }
            },
            setCurrentInstance: function (app, obj) {
                app.store('currentInstance', obj);
            },
            getCurrentInstance: function (app) {
                return app.store('currentInstance');
            }
        },

        TicketDao: {
            _parent: null,
            createRequest: function (json) {
                return {
                    url: '/api/v2/tickets.json',
                    type: 'POST', async: false, contentType: 'application/json',
                    data: json
                };
            },
            updateRequest: function (id, json) {
                return {
                    url: '/api/v2/tickets/' + id + '.json',
                    type: 'PUT', async: false, contentType: 'application/json',
                    data: json
                };
            },
            create: function (obj, data, recordInfo) {
                var autoCreate = obj.setting('auto_create_ticket');
                var disableActivity = obj.setting('disable_call_activity');
                var isCreate = false;
                var requesterId = null;
                var assigneeId = obj.currentUser().id();
                var phone = null;
                var isOutbound = false;
                var rec = { ticket: { subject: null, comment: { body: null}} };
                rec.ticket.subject = data.fieldValue.title;
                rec.ticket.comment.public = false;


                isOutbound = (data && data.fieldValue && data.fieldValue.detail &&
                              data.fieldValue.detail.callType && data.fieldValue.detail.callType.toLowerCase() == 'outbound');


                if (data.fieldValue.message && data.fieldValue.message.toLowerCase().indexOf('public:') === 0) {
                    data.fieldValue.message = data.fieldValue.message.substring(7);
                    rec.ticket.comment.public = true;
                }

                var callDurationMs = parseInt(data.fieldValue.detail.callDuration) * 1000;

                var callActivity = "Time of Interaction: " + new Date().toString() + "\n" +
                                   "Interaction From: " + obj.store('phoneNumber') + "\n" +
                                   "Call Id: " + data.fieldValue.detail.calluuid + "\n" +
                                   "Call Duration: " + moment.utc(moment.duration(callDurationMs).asMilliseconds()).format("HH:mm:ss") + "\n" +
                                   "Call Type: " + data.fieldValue.detail.callType + "\n" +
                                   "\n" +
                                   "Disposition: " + data.fieldValue.disposition + "\n" +
                                   "\n" +
                                   "Note: " + "\n" + data.fieldValue.message + "\n";

                var caseData = data.fieldValue.detail.caseData ? "Case Data: \n" + data.fieldValue.detail.caseData : '';


                rec.ticket.comment.body = data.fieldValue.detail.callOrigin + "\n" +
                                          "Answered By: " + obj.currentUser().name() + "\n" +
                                          "\n" +
                                          callActivity +
                                          "\n" +
                                          caseData;
                phone = this._parent.StoreUtil.getTicketPhone(obj);
                obj.store('phoneNumber', '');
                if (phone) {
                    //don't update custom field phone
                    //rec.ticket.custom_fields = [{ "id": obj.setting('ticket_phone_id'), "value": phone}];
                }
                if (recordInfo) {
                    if (recordInfo.type == 'user') {
                        isCreate = true;
                        requesterId = recordInfo.id;
                    }
                    else if (recordInfo.type == 'ticket') {
                        if (disableActivity !== true) {
                            delete rec.ticket.subject;
                            if (recordInfo.id == obj.store('id_ticketid')) {
                                if (assigneeId)
                                    rec.ticket.assignee_id = assigneeId;
                                rec.ticket.via_id = 46;
                            }
                            obj.store('id_ticketid', '');
                            obj.ajax('ticketUpdateRequest', recordInfo.id, JSON.stringify(rec));
                        }
                    }
                    else
                        isCreate = true;
                }
                else
                    isCreate = true;

                if (isCreate) {
                    if (autoCreate === true && isOutbound === true) {
                        if (requesterId)
                            rec.ticket.requester_id = requesterId;
                        if (assigneeId)
                            rec.ticket.assignee_id = assigneeId;
                        rec.ticket.via_id = 46;
                        rec.ticket.tags = ['phone_ticket_assigned'];
                        obj.ajax('ticketCreateRequest', JSON.stringify(rec));
                    }
                    else {
                        for (var cb in this._parent.ZendeskAction.callBacks) {
                            if (cb.indexOf('ticketRequest') === 0) {
                                var msg = this._parent.ZendeskAction.callBacks[cb];
                                if (cb == 'ticketRequest.done___' + msg.sig) {
                                    var msg1 = { sig: msg.sig, action: msg.action, format: msg.format };
                                    msg1.result = null;
                                    this._parent.ZendeskAction.sendMessage(obj, msg1);
                                    delete this._parent.ZendeskAction.callBacks[cb];
                                }
                            }
                        }
                    }
                }
            },
            getTicketLinkText: function (ticket) {
                if (ticket === null) return null;
                var txt = '#' + ticket.id;
                return txt;
            },
            loadTicket: function (arg) {
                return {
                    url: '/api/v2/channels/voice/agents/' + arg.uid + '/tickets/' + arg.tid + '/display.json',
                    type: 'POST',
                    data: {}
                };
            }
        },

        SearchDao: {
            _parent: null,
            getUsers: function (crit) {

            },
            getTickets: function (crit) {

            },
            sortDescByDate: function(arr) {
                for(var x = 0; x < arr.length - 1; x++) {
                    for (var y = x + 1; y < arr.length; y++) {
                        if (new Date(arr[x].updated_at).getTime() < new Date(arr[y].updated_at).getTime()) {
                            var temp = arr[x];
                            arr[x] = arr[y];
                            arr[y] = temp;
                        }
                    }
                }
                return arr;
            },
            getMinColumnsHtml: function (result) {
                var html   = [];
                var nav_html = [];
                var x, y;
                for (x in result) {
                  if (x != 'user') {
                    nav_html.push('<h4><a data-target="tab1" class="navigation-item active">Tickets (' + result[x].length + ')</a></h4>');
                  } else {
                    nav_html.push('<h4><a data-target="tab2" class="navigation-item">Customers (' + result[x].length + ')</a></h4>');
                  }
                }



                for (x in result) {

                    if (x == 'user') {

                      html.push('<div class="tab-pane" id="tab2">');

                        //html.push('<h2>Customers</h2>');
                        html.push('<table class="filter_tickets">');
                        html.push('<thead>');
                        html.push('<tr>');
                        html.push('<th>Name</th>');
                        html.push('<th>Email</th>');
                        html.push('<th>Phone</th>');
                        html.push('<th>Role</th>');
                        html.push('</tr>');
                        html.push('</thead>');
                        for (y = 0; y < result[x].length; y++) {
                          var email = result[x][y].email && result[x][y].email !== 'null' ? result[x][y].email : '';
                          html.push('<tr>');
                          html.push('<td><a class="lnk-search-result title" href="/agent/#/' + x + 's/' + result[x][y].id + '">' + result[x][y].label + '</a></td>');
                          html.push('<td>' + email + '</td>');
                          html.push('<td>' + result[x][y].phone + '</td>');
                          html.push('<td>' + result[x][y].role + '</td>');
                          html.push('</tr>');
                        }
                        html.push('</table>');

                      html.push('</div>');
                    } else {

                      html.push('<div class="tab-pane active" id="tab1">');
                        //html.push('<h2>Tickets</h2>');
                        html.push('<table class="filter_tickets">');
                        html.push('<thead>');
                        html.push('<tr>');
                        html.push('<th></th>');
                        html.push('<th class=\"status\">Status</th>');
                        html.push('<th></th>');
                        html.push('<th>ID</th>');
                        html.push('<th>Subject</th>');
                        html.push('<th>Requested</th>');
                        html.push('</tr>');
                        html.push('</thead>');
                        for (y = 0; y < result[x].length; y++) {
                          html.push('<tr>');
                          html.push('<td class="collision"><div></div></td>');
                          html.push('<td class="status"><span class="ticket_status_label ' +  result[x][y].status + '" >' + result[x][y].status + '</span></td>');
                          html.push('<td class="collision"><div></div></td>');
                          html.push('<td class="id">' + result[x][y].label + '</td>');
                          html.push('<td class="truncate"><a class="lnk-search-result title" data-placement="left" data-original-title="' + result[x][y].title + '" data-content="' + result[x][y].description + '" href="/agent/#/' + x + 's/' + result[x][y].id + '">' + result[x][y].title + '</a></td>');
                          html.push('<td class="created">' + moment(result[x][y].created_at).format('MMM Do YY') + '</td>');
                          html.push('</tr>');
                        }
                        html.push('</table>');
                      html.push('</div>');
                    }


                }

                return {html : html.join(''), nav: nav_html.join('')};
            },
            getSearchColumnsHtml: function (result) {
                var html = [];
                html.push('<div><ul class="gen-search">');
                for (var x in result) {
                    html.push('<li class="gen-heading">' + (x == 'user' ? 'customer' : x) + '</li>');
                    html.push('<li class="' + (x == 'user' ? 'gen-rows-user' : 'gen-rows-ticket') + '">');
                    html.push('<ul class="gen-rows">');
                    for (var y = 0; y < result[x].length; y++) {
                        html.push('<li class="gen-li-item">');
                        html.push('<div class="gen-content">');
                        html.push('<a class="gen-title" href="/agent/#/' + x + 's/' + result[x][y].id + '">');
                        if (x == 'ticket') {
                            html.push(result[x][y].title);
                        }
                        else {
                            html.push(result[x][y].label);
                        }
                        html.push('</a>');
                        html.push('<div class="gen-description">');
                        if (x == 'ticket') {
                            html.push(result[x][y].desc);
                        }
                        else {
                            html.push(result[x][y].email);
                        }
                        html.push('</div>');
                        html.push('</div>');
                        html.push('</li>');
                    }
                    html.push('</ul>');
                    html.push('</li>');
                }
                html.push('</ul></div>');
                return html.join('');
            },
            getMinColumns: function (result) {
                var obj = {};
                result = result && result.results ? result.results : null;
                if (result) {

                    for (var x = 0; x < result.length; x++) {
                        if (obj[result[x].result_type] === undefined)
                            obj[result[x].result_type] = [];

                        if (result[x].result_type == 'ticket') {
                          obj[result[x].result_type].push({
                            label: (result[x].result_type == 'ticket' ? this._parent.TicketDao.getTicketLinkText(result[x]) : result[x].name),
                            title: (result[x].result_type == 'ticket' ? result[x].subject : ''),
                            url: result[x].url,
                            id: result[x].id,
                            description : result[x].description,
                            channel: result[x].via ? result[x].via.channel : '',
                            created_at: result[x].created_at,
                            status: result[x].status
                          });
                        } else {
                          obj[result[x].result_type].push({
                            label: result[x].name,
                            title: '',
                            url: result[x].url,
                            id: result[x].id,
                            phone: result[x].phone,
                            email: result[x].email,
                            role: result[x].role,
                            created_at: result[x].created_at
                          });
                        }

                    }
                }

                //make sure 'ticket' type is always on the top of the list
                var keys = _.keys(obj).sort(function(a, b) {
                    if (a !== 'ticket') {
                        return a > b ? 1 : a < b ? -1 : 0;
                    } else {
                        return -1;
                    }
                });

                var newObj = {};
                _.each(keys, function(k) {
                    newObj[k] = obj[k];
                });

                return newObj;
            },
            search: function (app, crit) {
                var _crit = [];
                var __crit = null;
                var phone = crit.cti_phone;
                var excParam = ['dialednumber', 'callguid', 'callstarttime'];
                for (var x in crit) {
                    if (crit[x] && crit[x] !== '' && excParam.indexOf(x.toLowerCase()) == -1)
                        _crit.push(crit[x]);
                }

                if (this.hasCriteriaUrl(app, crit) === false) {
                    this._parent.StoreUtil.setTicketPhone(app, phone);
                    app.store('search_criteria', _crit.join(','));
                    __crit = _crit.splice(0, 1);
                    app.searchCrit = _crit;
                    this._parent.ZendeskAction.sendLogMessage(app, { event: 'getSearchRequest', result: __crit });
                    app.ajax('getSearchRequest', __crit);
                }
            },
            hasCriteriaUrl: function(app, crit) {
                var hasCrit = false;
                for (var x in crit) {
                    if (crit[x] && crit[x] !== '') {
                        var _temp = crit[x].toLowerCase();
                        if (_temp.indexOf('www.') >= 0 || _temp.indexOf('http:') >= 0 || _temp.indexOf('https:') >= 0) {
                            hasCrit = true;
                            if (_temp.indexOf('www.') === 0) {
                                _temp = 'http://' + _temp;
                            }
                            app.$('.lnk-external').attr('href', _temp);
                            app.$('.lnk-external')[0].click();
                        }
                    }
                }
                return hasCrit;
            },
            getSearchRequest: function (crit) {
                return {
                    url: '/api/v2/search.json?query=' + crit.join('+'),
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            filterResult: function (app, result) {
                if (app.setting("search_ticket") !== true && result.user)
                    delete result.ticket;
                if (app.setting("search_customer") !== true && result.ticket)
                    delete result.user;
                if (app.setting('search_organization') !== true && result.organization)
                    delete result.organization;
                return result;
            },
            countResult: function (app, result) {
                var cnt = 0;
                for (var x in result) {
                    cnt += (result[x] ? result[x].length : 0);
                }
                return cnt;
            },
            getAgentRequest: function (crit) {
                return {
                    url: '/api/v2/search.json?query=' + crit,
                    type: 'GET', async: false, contentType: 'application/json'
                };
            },
            getAgents: function (app, crit) {
                app.ajax('getAgentRequest', crit);
            },
            showHideLnkResult: function (app, status) {
                var arrowUp = app.assetURL('icon_arrow_up.png');
                var arrowDown = app.assetURL('icon_arrow_down.png');
                var lnk = app.$('.lnk-gen-result');
                if (status) {
                    app.$('.div2-gen-cti-table').slideUp('slow');
                    app.$('.img-gen-search').attr('src', arrowDown);
                    lnk.data('is_shown', 'F');
                }
                else {
                    app.$('.div2-gen-cti-table').slideDown('slow');
                    app.$('.img-gen-search').attr('src', arrowUp);
                    lnk.data('is_shown', 'T');
                }
            },
            loadUser: function (arg) {
                return {
                    url: '/api/v2/channels/voice/agents/' + arg.uid + '/users/' + arg.tid + '/display.json',
                    type: 'POST',
                    data: {}
                };
            }
        },

        ZendeskAction: {
            _parent: null,
            callBacks: {},
            toast: null,
            addToastData: function (param, app) {
                if (this.toast && this.toast.length > 0) {
                    var dn = null;
                    param = param ? param : {};
                    for (var x = 0; x < this.toast.length; x++) {
                        dn = this.toast[x].displayName;
                        if (dn && (dn.toLowerCase().indexOf('cti_') === 0 || dn.toLowerCase().indexOf('id_') === 0)) {
                            param[dn] = this.toast[x].value;
                            dn = dn.toLowerCase();
                            if (dn.indexOf('id_') === 0 && dn.indexOf('id_user_') !== 0) {
                                app.store('id_ticketid', this.toast[x].value);
                            }
                        }
                    }
                }
                this.toast = null;
                return param;
            },
            processMessage: function (app, msg) {
                if (msg) {
                    if (msg.action == 'CONNECT') {
                        this._parent.InfoUtil.getCallCenter(app);
                        this.callBacks['getUserOrgRequest_2.done___' + msg.sig] = msg;
                    }
                    else if (msg.action == 'INSERT') {
                        this.callBacks['ticketRequest.done___' + msg.sig] = msg;
                        app.store('comment_wrapup', msg.message);
                        app.trigger('whatis', {});
                        //this._parent.TicketDao.create(app, msg.message, this._parent.InfoUtil.getRecordInfo(app));
                        app.$('.lnk-gen-result').hide();
                    }
                    else if (msg.action == 'SEARCH_PAGE') {

                        var srchStatus = true;
                        var param = msg.message;
                        param = this.addToastData(param, app);
                        for (var x in param) {
                            if (x && x.toLowerCase().indexOf('id_') === 0 && param[x] &&
                                     x.toLowerCase().indexOf('id_user_') !== 0 && param[x] !== '') {
                                srchStatus = false;
                                app.store('id_ticketid', msg.message[x]);
                                app.ajax('loadTicket', { uid: app.currentUser().id(), tid: msg.message[x] });
                                break;
                            }
                            else if (x && x.toLowerCase().indexOf('id_user_') === 0 && param[x] && param[x] !== '') {
                                srchStatus = false;
                                app.ajax('loadUser', { uid: app.currentUser().id(), tid: msg.message[x] });
                                break;
                            }
                            else {

                            }
                        }
                        if (srchStatus === true) {
                            this._parent.SearchDao.search(app, msg.message);
                        }
                    }
                    else if (msg.action == 'DIAL') {
                        this.sendMessageWindow(app, {
                            action: msg.action,
                            number: msg.number
                        });
                    }
                    else if (msg.action == 'CALL_NOTIFY') {
                        if (msg.message && msg.message.call && msg.message.call.callType) {
                            this.toast = msg.message.call.toast;
                            if (msg.message.call.participants && msg.message.call.participants.length === 1) {
                                app.store('phoneNumber', msg.message.call.participants[0].formattedPhoneNumber);
                            }
                            else {
                                app.store('phoneNumber', msg.message.call.dnis);
                            }

                            app.trigger('inboundcall', {});
                        }
                        else {
                            this.toast = null;
                            app.store('phoneNumber', '');
                        }
                    }
                    else if (msg.action == 'CALL_CANCELED') {
                        app.$('.lnk-gen-result').hide();
                    }
                    else if (msg.action == 'LOGIN') {
                        //console.log("LOGIN WAS CALLED", app);
                        app.store('isLoggedIn', true);
                        app.message('login', { isLoggedIn: true }, ['user_sidebar', 'ticket_sidebar']);
                    }
                    else if (msg.action == 'LOGOUT') {
                        //console.log("LOGOUT WAS CALLED", app);
                        app.store('isLoggedIn', false);
                        app.message('login', { isLoggedIn: false }, ['user_sidebar', 'ticket_sidebar']);
                    }
                }
            },

            sendLogMessage: function (app, msg) {
                app.postMessage('logging', msg);
            },

            sendMessage: function (app, msg) {
                app.postMessage('cti', msg);
            },
            sendMessageWindow: function (app, msg) {
                app.postMessage('cti', msg);
            }
        },

        NotificationUtil: {
            _parent: null,
            notify: function (app, data) {
                app.ajax('notificationRequest', data);
            },
            getRequest: function (arg) {
                return {
                    url: '/api/v2/apps/notify.json',
                    type: 'POST', async: false, contentType: 'application/json',
                    data: JSON.stringify(arg)
                };
            }
        },

        CtiPane: {
            _parent: null,
            getCtiPanel: function (app) {
                var cti = app.$('.div-cti-panel').parent();
                var max_iteration = 10;
                var x = 0;
                var appCls = 'app-' + app.id();
                do {
                    if (cti.hasClass('apps_top_bar') && cti.hasClass(appCls)) {
                        break;
                    }
                    cti = cti.parent();
                    x++;
                } while (x < max_iteration);
                if (x >= max_iteration) cti = null;
                return cti;
            },
            ctiCollapse: function (app) {
                var _ref = this;
                var _top = _ref.getCtiPanel(app);
                if (_top !== null && _top.css('display') == 'block' && app.store('ctiToggle') === null) {
                    _top.animate({
                        height: '10%'
                    }, function () {
                        app.$('.div-cti-panel').parents('div').eq(0).css("height", "10%");
                        app.store('ctiToggle', 'T');
                        app.store('onCollapseExpand', 'T');
                        _ref.setCollapseExpandArrow(app, app.$('.genesys-collapse-expand')).show();
                    });
                }
            },
            ctiExpand: function (app, isHover) {
                var _ref = this;
                var _top = this.getCtiPanel(app);
                if (_top !== null && app.store('ctiToggle') == 'T') {
                    _top.animate({
                        height: '600px'
                    }, function () {
                        app.$('.div-cti-panel').parents('div').eq(0).css("height", "");
                        app.store('ctiToggle', (isHover === true ? 'F' : null));
                        _ref.setCollapseExpandArrow(app, app.$('.genesys-collapse-expand'));
                    });
                }
            },
            lnkResultClick: function (app) {
                var lnk = app.$('.lnk-gen-result');
                if (lnk.data('is_shown') === 'T') {
                    lnk.data('is_shown', 'F');
                    lnk.attr({ 'alt': 'Result Panel', 'title': 'Result Panel' });
                    this.showHideLnkResult(app, true);
                }
                else {
                    lnk.data('is_shown', 'T');
                    lnk.attr({ 'alt': 'CTI Panel', 'title': 'CTI Panel' });
                    this.showHideLnkResult(app, false);
                }
                return false;
            },
            expandOnCall: function (app) {
                if (app.store('ctiToggle') == 'T') {
                    this.ctiExpand(app);
                }
                else {
                    //this.ctiCollapse(app);
                }
                return false;
            },
            showHideLnkResult: function (app, status) {
                var arrowUp = app.assetURL('icon_arrow_up.png');
                var arrowDown = app.assetURL('icon_arrow_down.png');
                if (status) {
                    app.$('.div2-gen-cti-table').slideUp('slow');
                    app.$('.img-gen-search').attr('src', arrowDown);
                }
                else {
                    app.$('.div2-gen-cti-table').slideDown('slow');
                    app.$('.img-gen-search').attr('src', arrowUp);
                }
            },
            setCollapseExpandArrow: function (app, elem) {
                var up = app.assetURL('arrow-up.png');
                var down = app.assetURL('arrow-down.png');
                var img = up;
                if (app.store('ctiToggle') == 'T') {
                    img = down;
                }
                elem.find('.img-gen-col-exp').eq(0).attr('src', img);
                return elem;
            },
            registerEvents: function (app) {
                var _ref = this;
                app.store('ctiToggle', null);
                app.store('onCollapseExpand', null);
                app.$('.lnk-gen-col-exp').click(function () {
                    if (app.store('ctiToggle') == 'T') {
                        _ref.ctiExpand(app);
                    }
                    else {
                        _ref.ctiCollapse(app);
                    }
                    return false;
                });

                app.$('.img-gen-col-exp').hover(
                    function (event) {
                        app.store('onCollapseExpand', 'T');
                        _ref.setCollapseExpandArrow(app, app.$('.genesys-collapse-expand')).show();
                    },
                    function (event) {
                        if (app.store('ctiToggle') != 'T') {
                            app.store('onCollapseExpand', null);
                            _ref.setCollapseExpandArrow(app, app.$('.genesys-collapse-expand')).hide();
                        }
                    });
                app.$('.div-cti-panel .resize-handle-x').mousedown(
                  function(event) {
                      app.$('.div-cti-panel iframe').css({'pointer-events' : 'none'});
                      app.resize_x = true;
                      app.resize_y = false;
                      app.resize   = false;
                      app.resizeX  = event.pageX;
                  });

                app.$('.div-cti-panel .resize-handle-y').mousedown(
                  function(event) {
                    app.$('.div-cti-panel iframe').css({'pointer-events' : 'none'});
                    app.resize_x = false;
                    app.resize_y = true;
                    app.resize   = false;
                    app.resizeY  = event.pageY;
                  });

                app.$('.div-cti-panel').parents(document).mouseup(
                  function(event) {
                    if (app.resize_x) {
                      app.resize_x = false;
                      app.$('.div-cti-panel iframe').css({'pointer-events': 'auto'});
                      app.width = app.$('.div-cti-panel').parent().parent().width();
                    } else if (app.resize_y) {
                      app.resize_y = false;
                      app.$('.div-cti-panel iframe').css({'pointer-events': 'auto'});
                      app.height = app.$('.div-cti-panel').parent().parent().height();
                    }
                  });

                  app.$('.div-cti-panel').parents("#wrapper").mousemove(
                    function(event) {
                      if(app.resize_y || app.resize_x) {
                        event.preventDefault();
                        var _width  = app.width  - (event.pageX - app.resizeX);
                        var _height = app.height - (app.resizeY - event.pageY);
                        if(app.resize_x && _width >= app.min_width) {
                          app.popover({
                            width : _width,
                            height: app.height
                          });
                        } else if (app.resize_y && _height >= app.min_height) {
                          app.popover({
                            width : app.width,
                            height: _height
                          });
                        }
                      } else {
                        return true;
                      }
                  });

                app.$('.div-cti-panel').on('mouseenter', function() {
                    app.resize = false;
                });
            }
        },

        ClickToDialPane: {
            _parent: null,
            dial: function (app, num) {
                var cti = null;
                //var num = app.$('.ddl-gen-phone').val();
                //if (num && num.length >= 7) {
                if (num && num.length >= 3) {
                    app.trigger('dial', { 'num': num });
                }
            },
            populatePhones: function(app) {
              //console.log("PopulatePhones was called!", app);
              var locationType = _.has(app, "user") ? 'user' : _.has(app, "ticket") ? 'ticket' : null;
              if (app.store("isLoggedIn") === true) {
                this._parent.InfoUtil.getPhoneNumbers(app, locationType, function (phones) {
                  app.switchTo('clicktodial', {isLoggedIn: app.store('isLoggedIn'),phones: phones});
                });
              } else {
                  app.switchTo('clicktodial', {isLoggedIn: app.store('isLoggedIn'),phones: []});
              }
            }
        },

        NavPane: {
            _parent: null,
            refreshMonitorFrame: function (app, evt) {
                var lnk = app.$(evt.target);
                var url = lnk.attr('href');
                var url1 = app.store('ws_url');
                if (url1 != url)
                    app.$('.frame-genesys-ws').attr('src', url);

                app.store('ws_url', url);
            }
        },

        AdminPane: {
            _parent: null,
            app: null,
            installationId: null,
            perm_id: { 'ddCtiGen': 'perm_cti_panel', 'ddAdminMGen': 'perm_admin_monitor', 'ddAgentMGen': 'perm_agent_monitor' },
            btnSettings: function (uid, secret) {
                var rec = { 'settings': {}, 'enabled': true };
                var perm_val = null;
                for (var perm in this.perm_id) {
                    perm_val = this.app.$('.' + perm).val();
                    if (perm_val && perm_val instanceof Array && perm_val.length > 0) {
                        rec.settings[this.perm_id[perm]] = perm_val.join(',');
                    }
                    else {
                        rec.settings[this.perm_id[perm]] = '';
                    }
                }
                this.app.$('.sp-gen-admin-settings').show();
                this.app.$('.lnk-gen-admin-settings').hide();
                this.app.ajax('adminPaneSettingRequest', { 'uid': uid, 'secret': secret, 'data': rec });
            },
            getSettingRequest: function (arg) {
                return {
                    url: ('/api/v2/apps/installations/' + this.app.installationId() + '.json'),
                    type: 'PUT', async: false, contentType: 'application/json',
                    data: JSON.stringify(arg.data),
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(arg.uid + ":" + arg.secret));
                    }
                };
            },
            showCredModal: function () {
                this.app.$('.txt-gen-loginsecret').val('');
                this.app.$('.div-gen-cred').modal();
            },
            hideCredModal: function () {
                var id = this.app.$('.txt-gen-loginid').val();
                var secret = this.app.$('.txt-gen-loginsecret').val();
                this.app.$('.txt-gen-loginsecret').val('');
                this.app.$('.div-gen-cred').modal('hide');
                this.btnSettings(id, secret);
            },
            txtLoginIdChange: function () {
                if (this.app.$('.txt-gen-loginid').attr('disabled') == 'disabled') {
                    this.app.$('.txt-gen-loginid').attr('disabled', false);
                }
                else {
                    this.app.$('.txt-gen-loginid').attr('disabled', true);
                }
            }
        }
    };
} ());
