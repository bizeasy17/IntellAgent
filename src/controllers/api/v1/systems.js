/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ===========================================================================================
 Created:   09/02/2018
 Author:    Jay Han

 **/

var _ = require('lodash'),
    async = require('async'),
    systemSchema = require('../../../models/system');
    // userSchema = require('../../../models/user');//2018-5-25, JH: to check if the organization has user assigned

var api_systems = {};

/**
 * @api {get} /api/v1/groups Get Groups
 * @apiName getGroups
 * @apiDescription Gets groups for the current logged in user
 * @apiVersion 0.1.0
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      groups              Array of returned Groups
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */
api_systems.get = function (req, res) {
    var user = req.user;
    // var permissions = require('../../../permissions');
    // var hasPublic = permissions.canThis(user.role, 'ticket:public');

    systemSchema.getAllOrgsOfUser(user._id, function (err, organizations) {
        if (err) return res.status(400).json({ success: false, error: err.message });

        return res.json({ success: true, organizations: organizations });
    });
};

/**
 * @api {get} /api/v1/groups/all Get Groups
 * @apiName getALlGroups
 * @apiDescription Gets all groups
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups/all
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      groups              Array of returned Groups
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */

api_systems.getAll = function (req, res) {
    systemSchema.getAllOrganizations(function (err, organizations) {
        if (err) return res.status(400).json({ success: false, error: err.message });

        return res.json({ success: true, groups: organizations });
    });
};

/**
 * @api {get} /api/v1/groups/:id Get Single Group
 * @apiName getSingleGroup
 * @apiDescription Gets Single Group via ID param
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/group/:id
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {object}     group               Returned Group
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */
api_systems.getSingleSystem = function (req, res) {
    var id = req.params.id;
    if (_.isUndefined(id)) return res.status(400).json({ error: req.t('shared.invalid-request')});

    systemSchema.getOrganizationById(id, function (err, organization) {
        if (err) return res.status(400).json({ error: err.message });

        return res.status(200).json({ success: true, organization: organization });
    });
};

/**
 * @api {post} /api/v1/groups/create Create Group
 * @apiName createGroup
 * @apiDescription Creates a group with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Group Name",
 *      "members": [members],
 *      "sendMailTo": [sendMailTo]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"name\": \"Group Name\", \"members\": [members], \"sendMailTo\": [sendMailTo] }"
 *      -l http://localhost/api/v1/groups/create
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} group Saved Group Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_systems.create = function (req, res) {
    var user = req.user;
    var system = new systemSchema();
    system.name = req.body.name;
    system.type = req.body.type;
    system.desc = req.body.description;
    system.status = req.body.status;
    system.organization = user.organization;

    system.save(function (err, sys) {
        if (err) return res.status(400).json({ success: false, error: 'Error: ' + err.message });

        res.json({ success: true, error: null, system: sys });
    });
};

/**
 * @api {put} /api/v1/groups/:id Edit Group
 * @apiName editGroup
 * @apiDescription Updates giving group with PUT data
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Group Name",
 *      "members": [members],
 *      "sendMailTo": [sendMailTo]
 * }
 *
 * @apiExample Example usage:
 * curl -X PUT
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"name\": \"Group Name\", \"members\": [members], \"sendMailTo\": [sendMailTo] }"
 *      -l http://localhost/api/v1/groups/:id
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} group Saved Group Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_systems.updateSystem = function (req, res) {
    var id = req.params.id;
    var data = req.body;
    if (_.isUndefined(id) || _.isUndefined(data) || !_.isObject(data)) return res.status(400).json({ error: 'Invalid Post Data' });

    // if (!_.isArray(data.members))
    //     data.members = [data.members];
    // if (!_.isArray(data.sendMailTo))
    //     data.sendMailTo = [data.sendMailTo];

    systemSchema.getSystemById(id, function (err, system) {
        if (err) return res.status(400).json({ error: err.message });

        // organization.name = data.name;
        system.name = data.name;
        system.type = data.type;
        system.desc = data.desc;
        system.status = data.status;

        system.save(function (err, savedSystem) {
            if (err) return res.status(400).json({ error: err.message });

            return res.json({ success: true, system: savedSystem });
        });
    });
};

/**
 * @api {delete} /api/v1/groups/:id Delete Group
 * @apiName deleteGroup
 * @apiDescription Deletes the given group by ID
 * @apiVersion 0.1.6
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups/:id
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_systems.deleteSystem = function (req, res) {
    var id = req.params.id;
    if (_.isUndefined(id)) return res.status(400).json({ success: false, error: 'Error: Invalid System Id.' });

    var ticketSchema = require('../../../models/ticket');

    ticketSchema.getTicketsBySystem(id, function (err, tickets) {
        if (err) return res.json({ success: false });

        var hasTickets = _.size(tickets) > 0;
        if (hasTickets) return res.status(400).json({ success: false, error: 'Error: System has tickets.' });
    });
    

    systemSchema.getSystemById(id, function (err, system) {
        if (err) return res.status(400).json({ success: false, error: err });

        system.remove(function (err, success) {
            if (err) return res.status(400).json({ success: false, error: err });

            return res.json({ success: success });
        });
    });
};

module.exports = api_systems;