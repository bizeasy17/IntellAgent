/*
/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ===========================================================================================
 Created:    02/10/2015
 Author:     Jay Han 
 **/

var async = require('async');
var _ = require('lodash');
var userSchema = require('../models/user');
var organizationSchema = require('../models/organization');
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

var organizationsController = {};

organizationsController.content = {};

organizationsController.get = function (req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'organizations:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    // 2018-5-5 JH workaround for i18next not work in handlebar each loop. START
    hbs.registerHelper('i18n', function (options) {
        return req.t(options).toString();
    });
    // END

    var content = {};
    content.title = "Organizations";
    content.nav = 'organizations';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;
    content.data.users = [];

    organizationSchema.getAllOrgsOfUser(user._id, function (err, organizations) {
        if (err) handleError(res, err);

        content.data.groups = _.sortBy(organizations, 'name');

        userSchema.findAll(function (err, users) {
            if (err) handleError(res, err);

            content.data.users = _.sortBy(users, 'fullname');

            res.render('organizations', content);
        });
    });
};

organizationsController.getCreate = function (req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var content = {};
    content.title = "Groups";
    content.nav = 'groups';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;
    content.data.groups = {};
    content.data.users = [];

    userSchema.findAll(function (err, users) {
        if (err) return handleError(res, err);

        content.data.users = _.sortBy(users, "fullname");

        res.render('subviews/createGroup', content);
    });
};

organizationsController.edit = function (req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var content = {};
    content.title = "Groups";
    content.nav = 'groups';

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
            organizationSchema.getGroupById(groupId, function (err, group) {
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

module.exports = organizationsController;