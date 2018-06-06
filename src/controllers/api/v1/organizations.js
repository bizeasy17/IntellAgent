/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ===========================================================================================
 Created:   05/16/2018
 Author:    Jay Han

 **/

var _ = require('lodash'),
    async = require('async'),
    organizationSchema = require('../../../models/organization'),
    userSchema = require('../../../models/user');//2018-5-25, JH: to check if the organization has user assigned

var api_organizations = {};

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
api_organizations.get = function (req, res) {
    var user = req.user;
    // var permissions = require('../../../permissions');
    // var hasPublic = permissions.canThis(user.role, 'ticket:public');

    organizationSchema.getAllOrgsOfUser(user._id, function (err, organizations) {
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

api_organizations.getAll = function (req, res) {
    organizationSchema.getAllOrganizations(function (err, organizations) {
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
api_organizations.getSingleOrganization = function (req, res) {
    var id = req.params.id;
    if (_.isUndefined(id)) return res.status(400).json({ error: req.t('shared.invalid-request')});

    organizationSchema.getOrganizationById(id, function (err, organization) {
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
api_organizations.create = function (req, res) {
    var user = req.user;
    var Organization = new organizationSchema();
    Organization.name = req.body.name;
    Organization.shortName = req.body.shortName;
    Organization.members = req.body.members;
    Organization.type = req.body.type;
    Organization.city = req.body.city;
    Organization.address1 = req.body.address1;
    Organization.address2 = req.body.address2;
    Organization.address3 = req.body.address3;
    Organization.createdBy = user._id;

    Organization.save(function (err, org) {
        if (err) return res.status(400).json({ success: false, error: 'Error: ' + err.message });

        res.json({ success: true, error: null, organization: org });
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
api_organizations.updateOrganization = function (req, res) {
    var id = req.params.id;
    var data = req.body;
    if (_.isUndefined(id) || _.isUndefined(data) || !_.isObject(data)) return res.status(400).json({ error: 'Invalid Post Data' });

    // if (!_.isArray(data.members))
    //     data.members = [data.members];
    // if (!_.isArray(data.sendMailTo))
    //     data.sendMailTo = [data.sendMailTo];

    organizationSchema.getOrganizationById(id, function (err, organization) {
        if (err) return res.status(400).json({ error: err.message });

        // organization.name = data.name;
        organization.shortName = data.shortName;
        organization.type = data.type;
        organization.city = data.city;
        organization.address1 = data.address1;
        organization.address2 = data.address2;
        organization.address3 = data.address3;

        organization.save(function (err, savedOrganization) {
            if (err) return res.status(400).json({ error: err.message });

            return res.json({ success: true, organization: savedOrganization });
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
api_organizations.deleteOrganization = function (req, res) {
    var id = req.params.id;
    if (_.isUndefined(id)) return res.status(400).json({ success: false, error: 'Error: Invalid Organization Id.' });

    async.series([
        function (next) {
            var orgs = [id];
            userSchema.getUsersByOrganization(orgs, function (err, users) {
                if (err) {
                    return next('Error: ' + err.message);
                }

                if (_.size(users) > 0) {
                    return next('Error: Cannot delete a organization with users.');
                }

                return next();
            });
        },
        function (next) {
            organizationSchema.getOrganizationById(id, function (err, organization) {
                if (err) return next('Error: ' + err.message);

                organization.remove(function (err, success) {
                    if (err) return next('Error: ' + err.message);

                    return next(null, success);
                });
            });
        }
    ], function (err) {
        if (err) return res.status(400).json({ success: false, error: err });

        return res.json({ success: true });
    });
};

module.exports = api_organizations;