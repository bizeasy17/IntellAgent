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
 Created:    05/17/2018
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
    content.data.organizations = {};
    content.data.users = [];

    organizationSchema.getAllOrgsOfUser(user._id, function (err, organizations) {
        if (err) handleError(res, err);

        content.data.organizations = _.sortBy(organizations, 'name');

        userSchema.findAll(function (err, users) {
            if (err) handleError(res, err);

            content.data.users = _.sortBy(users, 'fullname');

            res.render('organizations', content);
        });
    });
};


function handleError(res, err) {
    if (err) {
        return res.render('error', { layout: false, error: err, message: err.message });
    }
}

module.exports = organizationsController;