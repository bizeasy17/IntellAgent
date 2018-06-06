/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888  
 ========================================================================
 Created:    06/05/2018
 Author:     Jay Han
 */

var async = require('async');
var _ = require('lodash');
var userSchema = require('../models/user');
var articleSchema = require('../models/article');
var permissions = require('../permissions');

// 2018-5-5 JH workaround for i18next not work in handlebar each loop. START
var hbs = require('express-hbs');
var path = require('path');
var i18next = require('i18next');
var i18nextMiddleware = require('i18next-express-middleware');
var Backend = require('i18next-node-fs-backend');

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: path.join(__dirname, '../../', 'locales/{{lng}}/{{ns}}.json'),
            addPath: path.join(__dirname, '../../', 'locales/{{lng}}/{{ns}}.missing.json')
        },
        fallbackLng: 'en',
        preload: ['en', 'zh-cn'],
        saveMissing: true
    });
// END

var articleController = {};

articleController.content = {};

/**
 * Get Ticket View based on article active articles
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Articles
 */
articleController.getSelf = function (req, res, next) {
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Articles";
    processor.nav = 'articles';
    processor.subnav = 'articles-self';
    processor.renderpage = 'articles';
    processor.pagetype = 'active';
    processor.object = {
        limit: 50,
        page: page,
        status: [0, 1, 2]
    };

    req.processor = processor;

    return next();
};

/**
 * Get Ticket View based on article all articles
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Articles
 */
articleController.getAll = function (req, res, next) {
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Articles";
    processor.nav = 'articles';
    processor.subnav = 'articles-all';
    processor.renderpage = 'articles';
    processor.pagetype = 'active';
    processor.object = {
        limit: 50,
        page: page,
        status: [0, 1, 2]
    };

    req.processor = processor;

    return next();
};

articleController.processor = function (req, res) {
    var processor = req.processor;
    if (_.isUndefined(processor)) return res.redirect('/');

    // 2018-5-7 JH workaround for i18next helper not work in handlebar each loop.  START
    // need to registerHelper agian for 't' 
    hbs.registerHelper('t', function (options) {
        return req.t(options).toString();
    });
    // END

    var content = {};
    content.title = processor.title;
    content.nav = processor.nav;
    content.subnav = processor.subnav;

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var object = processor.object;
    object.limit = (object.limit === 1) ? 10 : object.limit;

    content.data.filter = object.filter;

    var userOrgs = [];

    async.waterfall([
        function (callback) {
            userSchema.getUser(req.user._id, function (err, user) {
                if (err) return callback(err);
                return callback(err, user.organization);
            });
        },
        function (orgId, callback) {
            articleSchema.getArticlesOfOrgWithObject(orgId, object, function (err, results) {
                if (err) return handleError(res, err);

                if (!permissions.canThis(req.user.role, 'notes:view')) {
                    _.each(results, function (article) {
                        article.notes = [];
                    });
                }

                return callback(null, results);
            });
        }
    ],function(err, results){
        //Article Data
        content.data.articles = results;

        var countObject = {
            status: object.status,
            filter: object.filter
        };

        //Get Pagination
        articleSchema.getCountWithObject(userOrgs, countObject, function (err, totalCount) {
            if (err) return handleError(res, err);

            content.data.pagination = {};
            content.data.pagination.type = processor.pagetype;
            content.data.pagination.currentpage = object.page;
            content.data.pagination.start = (object.page === 0) ? 1 : object.page * object.limit;
            content.data.pagination.end = (object.page === 0) ? object.limit : (object.page * object.limit) + object.limit;
            content.data.pagination.enabled = false;

            content.data.pagination.total = totalCount;
            if (content.data.pagination.total > object.limit)
                content.data.pagination.enabled = true;

            content.data.pagination.prevpage = (object.page === 0) ? 0 : Number(object.page) - 1;
            content.data.pagination.prevEnabled = (object.page !== 0);
            content.data.pagination.nextpage = ((object.page * object.limit) + object.limit <= content.data.pagination.total) ? Number(object.page) + 1 : object.page;
            content.data.pagination.nextEnabled = ((object.page * object.limit) + object.limit <= content.data.pagination.total);
            content.data.user = req.user;

            res.render(processor.renderpage, content);
        });
    });
};

articleController.getCreate = function (req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'articles:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    // 2018-5-29 JH workaround for i18next helper not work in handlebar each loop.  START
    // need to registerHelper agian for 't' 
    hbs.registerHelper('t', function (options) {
        return req.t(options).toString();
    });
    // END

    var content = {};
    content.title = "Articles";
    content.nav = 'articles';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;
    content.data.article = {};

    userSchema.findAll(function (err, users) {
        if (err) return handleError(res, err);

        content.data.users = _.sortBy(users, "fullname");

        res.render('subviews/createArticle', content);
    });
};

articleController.edit = function (req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'article:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var content = {};
    content.title = "Articles";
    content.nav = 'articles';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;
    content.data.users = [];
    var groupId = req.params.id;
    if (_.isUndefined(groupId)) return res.redirect('/groups/');

    async.parallel({
        users: function (next) {
            userSchema.findAll(function (err, users) {
                if (err) return next(err);

                next(null, users);
            });
        },
        group: function (next) {
            articleSchema.getGroupById(groupId, function (err, group) {
                if (err) return next(err);

                next(null, group);
            });
        }
    }, function (err, done) {
        if (err) return handleError(res, err);

        content.data.users = _.sortBy(done.users, 'fullname');
        content.data.group = done.group;

        res.render('subviews/editGroup', content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', { layout: false, error: err, message: err.message });
    }
}

module.exports = articleController;