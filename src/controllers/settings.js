/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    06/23/2016
 Modified:   Jay Han [Author:   Chris Brame]

 **/

var async               = require('async');
var _                   = require('lodash');
var winston             = require('winston');
var jsStringEscape      = require('js-string-escape');
var settingSchema       = require('../models/setting');
var tagSchema           = require('../models/tag');
var ticketTypeSchema    = require('../models/tickettype');
var permissions         = require('../permissions');

// 2018-6-30 JH. Article Category, System, Service and SLA. model schema. start
var userSchema          = require('../models/user');
var articleCatSchema    = require('../models/articlecategory');
var systemSchema        = require('../models/system');
var serviceSchema       = require('../models/service');
var slaSchema           = require('../models/servicelevelagreement');
// end

var settingsController = {};

settingsController.content = {};

settingsController.get = function(req, res) {
    if (!checkPerms(req, 'settings:view')) return res.redirect('/');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-general';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    settingSchema.getSettings(function(err, settings) {
        if (err) return handleError(res, 'Invalid Settings');

        var s = {};
        s.defaultTicketType = _.find(settings, function(x){return x.name === 'ticket:type:default'});
        s.defaultTicketType = (s.defaultTicketType === undefined) ? {value: ''} : s.defaultTicketType;

        s.mailerEnabled = _.find(settings, function(x){return x.name === 'mailer:enable'});
        s.mailerHost = _.find(settings, function(x) { return x.name === 'mailer:host'});
        s.mailerSSL = _.find(settings, function(x) { return x.name === 'mailer:ssl'});
        s.mailerPort = _.find(settings, function(x) { return x.name === 'mailer:port'});
        s.mailerUsername = _.find(settings, function(x) { return x.name === 'mailer:username'});
        s.mailerPassword = _.find(settings, function(x) { return x.name === 'mailer:password'});
        s.mailerFrom = _.find(settings, function(x) { return x.name === 'mailer:from'});

        s.mailerEnabled = (s.mailerEnabled === undefined) ? {value: false} : s.mailerEnabled;
        s.mailerSSL = (s.mailerSSL === undefined) ? {value: false} : s.mailerSSL;
        s.mailerHost = (s.mailerHost === undefined) ? {value: ''} : s.mailerHost;
        s.mailerPort = (s.mailerPort === undefined) ? {value: 25} : s.mailerPort;
        s.mailerUsername = (s.mailerUsername === undefined) ? {value: ''} : s.mailerUsername;
        s.mailerPassword = (s.mailerPassword === undefined) ? {value: ''} : s.mailerPassword;
        s.mailerFrom = (s.mailerFrom === undefined) ? {value: ''} : s.mailerFrom;

        s.mailerCheckEnabled = _.find(settings, function(x) { return x.name === 'mailer:check:enable' });
        s.mailerCheckHost = _.find(settings, function(x) { return x.name === 'mailer:check:host' });
        s.mailerCheckPort = _.find(settings, function(x) { return x.name === 'mailer:check:port' });
        s.mailerCheckUsername = _.find(settings, function(x) { return x.name === 'mailer:check:username' });
        s.mailerCheckPassword = _.find(settings, function(x) { return x.name === 'mailer:check:password' });
        s.mailerCheckTicketType = _.find(settings, function(x) { return x.name === 'mailer:check:ticketype' });

        s.mailerCheckEnabled = (s.mailerCheckEnabled === undefined) ? {value: false} : s.mailerCheckEnabled;
        s.mailerCheckHost = (s.mailerCheckHost === undefined) ? {value: ''} : s.mailerCheckHost;
        s.mailerCheckPort = (s.mailerCheckPort === undefined) ? {value: 143} : s.mailerCheckPort;
        s.mailerCheckUsername = (s.mailerCheckUsername === undefined) ? {value: ''} : s.mailerCheckUsername;
        s.mailerCheckPassword = (s.mailerCheckPassword === undefined) ? {value: ''} : s.mailerCheckPassword;
        s.mailerCheckTicketType = (s.mailerCheckTicketType === undefined) ? {value: ''} : s.mailerCheckTicketType;

        s.showTour = _.find(settings, function(x) { return x.name === 'showTour:enable' });
        s.showTour = (s.showTour === undefined) ? {value: true} : s.showTour;

        s.showOverdueTickets = _.find(settings, function(x) { return x.name === 'showOverdueTickets:enable' });
        s.showOverdueTickets = (s.showOverdueTickets === undefined) ? {value: true} : s.showOverdueTickets;

        s.tpsEnabled = _.find(settings, function(x) { return x.name === 'tps:enable' });
        s.tpsEnabled = (s.tpsEnabled === undefined) ? {value: false} : s.tpsEnabled;

        s.tpsUsername = _.find(settings, function(x) { return x.name === 'tps:username'});
        s.tpsUsername = (s.tpsUsername === undefined) ? { value: ''} : s.tpsUsername;

        s.tpsApiKey = _.find(settings, function(x) { return x.name === 'tps:apikey'});
        s.tpsApiKey = (s.tpsApiKey === undefined) ? { value: ''} : s.tpsApiKey;

        s.allowPublicTickets = _.find(settings, function(x) { return x.name === 'allowPublicTickets:enable' });
        s.allowPublicTickets = (s.allowPublicTickets === undefined) ? {value: false} : s.allowPublicTickets;

        s.allowUserRegistration = _.find(settings, function(x) { return x.name === 'allowUserRegistration:enable' });
        s.allowUserRegistration = (s.allowUserRegistration === undefined) ? {value: false} : s.allowUserRegistration;

        content.data.settings = s;

        return res.render('settings', content);
    });
};

settingsController.legal = function(req, res) {
    var content = {};
    content.title = "Legal Settings";
    content.nav = 'settings';
    content.subnav = 'settings-legal';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    settingSchema.getSettings(function(err, settings) {
        if (err) return handleError(res, 'Invalid Settings');

        var s = {};
        s.privacyPolicy = _.find(settings, function(x){return x.name === 'legal:privacypolicy'});
        s.privacyPolicy = (s.privacyPolicy === undefined) ? {value: ''} : s.privacyPolicy;
        s.privacyPolicy.value = jsStringEscape(s.privacyPolicy.value);

        content.data.settings = s;

        return res.render('subviews/settings/legal', content);
    });
};

settingsController.logs = function(req, res) {
    if (!checkPerms(req, 'settings:logs')) return res.redirect('/settings');

    var content = {};
    content.title = "Server Logs";
    content.nav = 'settings';
    content.subnav = 'settings-logs';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var fs = require('fs'),
        path = require('path'),
        AnsiUp = require('ansi_up'),
        ansi_up = new AnsiUp.default,
        file = path.join(__dirname, '../../logs/output.log');

    fs.readFile(file, 'utf-8', function(err, data) {
        if (err)  {
            content.data.logFileContent = err;
            return res.render('logs', content);
        }

        content.data.logFileContent = data.toString().trim();
        content.data.logFileContent = ansi_up.ansi_to_html(content.data.logFileContent);

        return res.render('logs', content);
    });
};

settingsController.tags = function(req, res) {
    if (!checkPerms(req, 'settings:tags'))  return res.redirect('/settings');

    var content = {};
    content.title = "Ticket Tags";
    content.nav = 'settings';
    content.subnav = 'settings-tags';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var resultTags = [];
    async.waterfall([
        function(next) {
            tagSchema.getTags(function(err, tags) {
                if (err) return handleError(res, err);

                return next(null, tags);
            });
        },
        function(tags, next) {
            var ts = require('../models/ticket');
            async.each(tags, function(tag, cb) {
                ts.getTagCount(tag._id, function(err, count) {
                    if (err) return cb(err);
                    //tag count for id

                    resultTags.push({tag: tag, count: count});

                    cb();
                });
            }, function(err) {
               return next(err);
            });
        }
    ], function() {
        content.data.tags = _.sortBy(resultTags, function(o){ return o.tag.name; });
        return res.render('tags', content)
    });
};

settingsController.editTag = function(req, res) {
    if (!checkPerms(req, 'settings:tags'))  return res.redirect('/settings');

    var tagId = req.params.id;
    if (_.isUndefined(tagId)) return res.redirect('/settings/tags');

    var content = {};
    content.title = "Edit Tag";
    content.nav = 'settings';
    content.subnav = 'settings-tags';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function(cb) {
            tagSchema.getTag(tagId, function(err, tag) {
                if (err) return cb(err);

                if (!tag) {
                    winston.debug('Invalid Tag - ' + tag);
                    return res.redirect('/settings/tags');
                }

                content.data.tag = tag;

                return cb();
            });
        },
        function(cb) {
            var ticketSchema = require('../models/ticket');
            var groupSchema = require('../models/group');
            groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, function(err, grps) {
                if (err) return cb(err);

                async.series([
                    function(next) {
                        var permissions = require('../permissions');
                        if (permissions.canThis(req.user.role, 'ticket:public')) {
                            groupSchema.getAllPublicGroups(function(err, publicGroups) {
                                if (err) return next(err);

                                grps = grps.concat(publicGroups);

                                return next();
                            });
                        } else
                            return next();
                    }
                ], function(err) {
                    if (err) return cb(err);

                    ticketSchema.getTicketsByTag(grps, tagId, function(err, tickets) {
                        if (err) return cb(err);

                        content.data.tickets = tickets;

                        return cb();
                    });
                });
            });
        }
    ], function(err) {
        if (err) return handleError(res, err);
        return res.render('subviews/editTag', content);
    });
};

settingsController.ticketTypes = function(req, res) {
    if (!checkPerms(req, 'settings:tickettypes'))  return res.redirect('/settings');

    var content = {};
    content.title = "Ticket Types";
    content.nav = 'settings';
    content.subnav = 'settings-tickettypes';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var resultTypes = [];
    async.series([
        function(next) {
            ticketTypeSchema.getTypes(function(err, types) {
                if (err) return handleError(res, err);
                resultTypes = types;
                return next(null, types);
            });
        }
    ], function() {
        content.data.types = _.sortBy(resultTypes, function(o){ return o.name; });

        return res.render('subviews/settings/ticketTypes', content)
    });
};

settingsController.editTicketType = function(req, res) {
    if (!checkPerms(req, 'settings:tickettypes'))  return res.redirect('/settings');

    var typeId = req.params.id;
    if (_.isUndefined(typeId)) return res.redirect('/settings/tickettypes');

    var content = {};
    content.title = "Edit Ticket Type";
    content.nav = 'settings';
    content.subnav = 'settings-tickettypes';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function(cb) {
            ticketTypeSchema.getType(typeId, function(err, type) {
                if (err) return cb(err);

                if (!type) {
                    winston.debug('Invalid Type - ' + type);
                    return res.redirect('/settings/tickettypes');
                }

                content.data.tickettype = type;

                return cb();
            });
        },
        function(cb) {
            var ticketSchema = require('../models/ticket');
            var groupSchema = require('../models/group');
            groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, function(err, grps) {
                if (err) return cb(err);

                async.series([
                    function(next) {
                        var permissions = require('../permissions');
                        if (permissions.canThis(req.user.role, 'ticket:public')) {
                            groupSchema.getAllPublicGroups(function(err, publicGroups) {
                                if (err) return next(err);

                                grps = grps.concat(publicGroups);

                                return next();
                            });
                        } else
                            return next();
                    }
                ], function(err) {
                    if (err) return cb(err);

                    ticketSchema.getTicketsByType(grps, typeId, function(err, tickets) {
                        if (err) return cb(err);

                        content.data.tickets = tickets;
                        content.data.hasTickets = _.size(tickets) > 0;

                        return cb();
                    }, true);
                });
            });
        }
    ], function(err) {
        if (err) return handleError(res, err);
        return res.render('subviews/settings/editTicketType', content);
    });
};

// 2018-6-30. JH, Article Category, System, Services, SLA. start
settingsController.articleCategories = function (req, res) {
    if (!checkPerms(req, 'settings:articleCategories')) return res.redirect('/settings');

    var content = {};
    content.title = "Article Categories";
    content.nav = 'settings';
    content.subnav = 'settings-articlecategories';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    // var resultCategories = [];
    async.waterfall([
        function (callback) {
            userSchema.getUser(req.user._id, function (err, user) {
                if (err) return callback(err);
                return callback(err, user.organization);
            });
        },
        function (org, next) {
            articleCatSchema.getCategoriesByOrg(org, function (err, categories) {
                if (err) return handleError(res, err);

                return next(null, categories);
            });
        }
    ], function (err, results) {
        // resultCategories = results;
        content.data.categories = _.sortBy(results, function (o) { return o.name; });
        return res.render('subviews/settings/articleCategories', content)
    });
};

settingsController.editArticleCategory = function (req, res) {
    if (!checkPerms(req, 'settings:articlecategory')) return res.redirect('/settings/articlecategories');

    var categoryId = req.params.id;
    if (_.isUndefined(categoryId)) return res.redirect('/settings/articlecategories');

    var content = {};
    content.title = "Edit Article Category";
    content.nav = 'settings';
    content.subnav = 'settings-articlecategories';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function (cb) {
            articleCatSchema.getCategory(categoryId, function (err, category) {
                if (err) return cb(err);

                if (!category) {
                    winston.debug('Invalid Category - ' + category);
                    return res.redirect('/settings/articlecategories');
                }

                content.data.category = category;

                return cb();
            });
        },
        function (cb) {
            // var ticketSchema = require('../models/ticket');
            var articleSchema = require('../models/article');

            articleSchema.getPublishedArticlesByCategory(req.user.organization, categoryId, function (err, articles) {
                if (err) return cb(err);

                content.data.articles = articles;
                content.data.hasArticles = _.size(articles) > 0;

                return cb();
            });
        }
    ], function (err) {
        if (err) return handleError(res, err);
        return res.render('subviews/settings/editArticleCategory', content);
    });
};

settingsController.systems = function (req, res) {
    if (!checkPerms(req, 'settings:systems')) return res.redirect('/settings');

    var content = {};
    content.title = "Systems";
    content.nav = 'settings';
    content.subnav = 'settings-systems';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    
    systemSchema.getSystemsByOrg(req.user.organization, function (err, systems) {
        if (err) return handleError(res, err);

        content.data.systems = _.sortBy(systems, function (o) { return o.name; });
        return res.render('subviews/settings/systems', content)
    });
};

settingsController.editSystem = function (req, res) {
    if (!checkPerms(req, 'settings:systems')) return res.redirect('/settings/systems');

    var systemId = req.params.id;
    if (_.isUndefined(systemId)) return res.redirect('/settings/systems');

    var content = {};
    content.title = "Edit System";
    content.nav = 'settings';
    content.subnav = 'settings-systems';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function(cb){
            systemSchema.getSystemById(systemId, function (err, system) {
                if (err) return handleError(res, err);

                if (!system) {
                    winston.debug('Invalid Systems - ' + system);
                    return res.redirect('/settings/systems');
                }

                content.data.system = system;
        
                return cb;
            });
            
        },
        function (cb) {
            // var ticketSchema = require('../models/ticket');
            var ticketSchema = require('../models/ticket');

            ticketSchema.getTicketsBySystem(systemId, function (err, tickets) {
                if (err) return cb(err);

                content.data.tickets = tickets;
                content.data.hasTickets = _.size(tickets) > 0;

                return cb();
            }, true);
        }
    ],function(err){
        if (err) return handleError(res, err);
        return res.render('subviews/settings/editSystem', content);
    });
};

settingsController.services = function (req, res) {
    if (!checkPerms(req, 'settings:tags')) return res.redirect('/settings');

    var content = {};
    content.title = "Services";
    content.nav = 'settings';
    content.subnav = 'settings-services';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var resultTags = [];
    async.waterfall([
        function (next) {
            tagSchema.getTags(function (err, tags) {
                if (err) return handleError(res, err);

                return next(null, tags);
            });
        },
        function (tags, next) {
            var ts = require('../models/ticket');
            async.each(tags, function (tag, cb) {
                ts.getTagCount(tag._id, function (err, count) {
                    if (err) return cb(err);
                    //tag count for id

                    resultTags.push({ tag: tag, count: count });

                    cb();
                });
            }, function (err) {
                return next(err);
            });
        }
    ], function () {
        content.data.tags = _.sortBy(resultTags, function (o) { return o.tag.name; });
        return res.render('subviews/settings/services', content)
    });
};

settingsController.editService = function (req, res) {
    if (!checkPerms(req, 'settings:tags')) return res.redirect('/settings');

    var tagId = req.params.id;
    if (_.isUndefined(tagId)) return res.redirect('/settings/services');

    var content = {};
    content.title = "Edit Service";
    content.nav = 'settings';
    content.subnav = 'settings-services';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function (cb) {
            tagSchema.getTag(tagId, function (err, tag) {
                if (err) return cb(err);

                if (!tag) {
                    winston.debug('Invalid Tag - ' + tag);
                    return res.redirect('/settings/tags');
                }

                content.data.tag = tag;

                return cb();
            });
        },
        function (cb) {
            var ticketSchema = require('../models/ticket');
            var groupSchema = require('../models/group');
            groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, function (err, grps) {
                if (err) return cb(err);

                async.series([
                    function (next) {
                        var permissions = require('../permissions');
                        if (permissions.canThis(req.user.role, 'ticket:public')) {
                            groupSchema.getAllPublicGroups(function (err, publicGroups) {
                                if (err) return next(err);

                                grps = grps.concat(publicGroups);

                                return next();
                            });
                        } else
                            return next();
                    }
                ], function (err) {
                    if (err) return cb(err);

                    ticketSchema.getTicketsByTag(grps, tagId, function (err, tickets) {
                        if (err) return cb(err);

                        content.data.tickets = tickets;

                        return cb();
                    });
                });
            });
        }
    ], function (err) {
        if (err) return handleError(res, err);
        return res.render('subviews/settings/editServices', content);
    });
};

settingsController.sla = function (req, res) {
    if (!checkPerms(req, 'settings:tags')) return res.redirect('/settings');

    var content = {};
    content.title = "SLA";
    content.nav = 'settings';
    content.subnav = 'settings-sla';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var resultTags = [];
    async.waterfall([
        function (next) {
            tagSchema.getTags(function (err, tags) {
                if (err) return handleError(res, err);

                return next(null, tags);
            });
        },
        function (tags, next) {
            var ts = require('../models/ticket');
            async.each(tags, function (tag, cb) {
                ts.getTagCount(tag._id, function (err, count) {
                    if (err) return cb(err);
                    //tag count for id

                    resultTags.push({ tag: tag, count: count });

                    cb();
                });
            }, function (err) {
                return next(err);
            });
        }
    ], function () {
        content.data.tags = _.sortBy(resultTags, function (o) { return o.tag.name; });
        return res.render('subviews/settings/sla', content)
    });
};

settingsController.editSLA = function (req, res) {
    if (!checkPerms(req, 'settings:tags')) return res.redirect('/settings');

    var tagId = req.params.id;
    if (_.isUndefined(tagId)) return res.redirect('/settings/tags');

    var content = {};
    content.title = "Edit SLA";
    content.nav = 'settings';
    content.subnav = 'settings-sla';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    async.parallel([
        function (cb) {
            tagSchema.getTag(tagId, function (err, tag) {
                if (err) return cb(err);

                if (!tag) {
                    winston.debug('Invalid Tag - ' + tag);
                    return res.redirect('/settings/tags');
                }

                content.data.tag = tag;

                return cb();
            });
        },
        function (cb) {
            var ticketSchema = require('../models/ticket');
            var groupSchema = require('../models/group');
            groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, function (err, grps) {
                if (err) return cb(err);

                async.series([
                    function (next) {
                        var permissions = require('../permissions');
                        if (permissions.canThis(req.user.role, 'ticket:public')) {
                            groupSchema.getAllPublicGroups(function (err, publicGroups) {
                                if (err) return next(err);

                                grps = grps.concat(publicGroups);

                                return next();
                            });
                        } else
                            return next();
                    }
                ], function (err) {
                    if (err) return cb(err);

                    ticketSchema.getTicketsByTag(grps, tagId, function (err, tickets) {
                        if (err) return cb(err);

                        content.data.tickets = tickets;

                        return cb();
                    });
                });
            });
        }
    ], function (err) {
        if (err) return handleError(res, err);
        return res.render('subviews/settings/editSLA', content);
    });
};
// end

function checkPerms(req, role) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, role)) {
        req.flash('message', 'Permission Denied.');

        return false;
    }

    return true;
}

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = settingsController;