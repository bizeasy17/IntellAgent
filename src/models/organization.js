/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888  
 ========================================================================
 Created:    15/05/2018
 Author:     Jay Han
 */

var _ = require('lodash');
var mongoose = require('mongoose');

var COLLECTION = 'organizations';

/**
 * Group Schema
 * @module models/organization
 * @class Organization
 * @requires {@link User}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` name of Organization
 * @property {String} shortName created date of the article
 * @property {String} type created date of the article
 * @property {String} location created date of article (GMT)
 * @property {String} address1 article subject 
 * @property {String} address2 article content
 * @property {String} address3 article excerpt
 * @property {String} status article tags
 * @property {String} status status of article draft | published
 * @property {Boolean} deleted ```Required``` [default: false] If article is flagged as deleted.
 * @property {Date} createDate to allow comments or not open | closed
 */
var organizationSchema = mongoose.Schema({
    //uid: { type: Number, unique: true, index: true },
    name: { type: String, required: true, unique: true},
    shortName: { type: String, required: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false }],
    type: {type: String, required: true },
    city: { type: String, required: true },
    address1: { type: String, required: true},
    address2: { type: String, required: false },
    address3: { type: String, required: false },
    status: { type: String, required: true, default: '1'},
    deleted: { type: Boolean, default: false, required: true, index: true },
    createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' }],
    createDate: { type: Date, required: true, default: Date.now },
});

organizationSchema.statics.getAllOrgsOfUser = function (userId, callback) {
    if (_.isUndefined(userId)) return callback("Invalid UserId - organizationSchema.GetAllOrgsOfUser()");

    var q = this.model(COLLECTION).find({ createdBy: userId })
        .populate('members', '_id username fullname email role preferences image title')
        .sort('name');

    return q.exec(callback)
};

organizationSchema.statics.getOrganizationById = function (orgId, callback) {
    if (_.isUndefined(orgId)) return callback("Invalid OrganizationId - OrganizationSchema.GetOrganizationById()");

    var q = this.model(COLLECTION).findOne({ _id: orgId });
        // .populate('members', '_id username fullname email role preferences image title')
        // .populate('sendMailTo', '_id username fullname email role preferences image title');

    return q.exec(callback);
};

organizationSchema.statics.getOrganizationById = function (orgId, callback) {
    if (_.isUndefined(orgId)) return callback("Invalid OrganizationId - GroupSchema.GetOrganizationById()");

    var q = this.model(COLLECTION).findOne({ _id: orgId });

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, organizationSchema);