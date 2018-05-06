/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var async           = require('async');
var _               = require('lodash');
var userSchema      = require('../models/user');
var groupSchema     = require('../models/group');
var permissions     = require('../permissions');

// 2018-5-5 JH START
var path                = require('path');
var i18next             = require('i18next');
var i18nextMiddleware   = require('i18next-express-middleware');
var Backend             = require('i18next-node-fs-backend');

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

// var i18n = exphbs.create({
//     // Specify helpers which are only registered on this instance.
//     helpers: {
//         foo: function (str) { return i18next.t(str); }
//     }
// });
// END

var groupsController = {};

groupsController.content = {};

groupsController.get = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:view')) {
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

    groupSchema.getAllGroups(function(err, groups) {
        if (err) handleError(res, err);

        content.data.groups = _.sortBy(groups, 'name');

        // 2018-5-5 JH START
        var editMenu = {edit: req.t('groups.edit').toString()};
        var removeMenu = {remove: req.t('groups.remove').toString()};
        //Object.assign(content.data.groups, editMenu, removeMenu);
        // END
        //res.send(req.t('groups.remove').toString());

        userSchema.findAll(function(err, users) {
            if (err) handleError(res, err);

            content.data.users = _.sortBy(users, 'fullname');

            // 2018-5-5 JH START
            //content.data.groups.menu1 = req.t('groups.edit').toString();
            //content.data.groups.menu2 = req.t('groups.remove').toString();
            // END

            res.render('groups', content);
                //content: content,
                // editMenu: req.t('groups.edit'),
                // removeMenu: req.t('groups.remove'),
                // data: content.data,
                // helpers: { 
                //      foo: function (str) { return i18next.t(str); }
                // }
            // });
        });
    });
};

groupsController.getCreate = function(req, res) {
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

    userSchema.findAll(function(err, users) {
        if (err) return handleError(res, err);

        content.data.users = _.sortBy(users, "fullname");

        res.render('subviews/createGroup', content);
    });
};

groupsController.edit = function(req, res) {
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
        users: function(next) {
            userSchema.findAll(function(err, users) {
                if (err) return next(err);

                next(null, users);
            });
        },
        group: function (next) {
            groupSchema.getGroupById(groupId, function (err, group) {
                if (err) return next(err);

                next(null, group);
            });
        }
        }, function(err, done) {
            if (err) return handleError(res, err);

            content.data.users =  _.sortBy(done.users, 'fullname');
            content.data.group = done.group;

            res.render('subviews/editGroup', content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = groupsController;