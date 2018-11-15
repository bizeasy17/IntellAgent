/*
 Created:    05/28/2018
 Modified:   Jay Han

 **/

var mongoose = require('mongoose');

var COLLECTION = 'systems';

/**
 * System Schema
 * @module models/system
 * @class System

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of System
 */
var systemSchema = mongoose.Schema({
    // uid:        { type: Number, unique: true, index: true },
    name:       { type: String, required: true, unique: true },
    type:       { type: String, required: false },
    // version:    { type: String, required: false },
    desc:       { type: String, required: false},
    status:     { type: Boolean, required: true, default: true},
    // startDate:  { type: Date, required: false },
    // endDate:    { type: Date, required: false },
    service:    { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'services' },
    createDate: { type: Date, default: Date.now, required: true },
    editDate:   { type: Date },
    organization:   { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'organizations' }
});

/**
 * Return all System
 *
 * @memberof System
 * @static
 * @method getSystems
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
systemSchema.statics.getSystems = function(callback) {
    var q = this.model(COLLECTION).find({});

    return q.exec(callback);
};

/**
 * Return all System
 *
 * @memberof System
 * @static
 * @method getSystems
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
systemSchema.statics.getSystemById = function (sysId, callback) {
    var q = this.model(COLLECTION).findOne({_id: sysId});
        // .populate('services'); //2018-10-27 JH

    return q.exec(callback);
};

/**
 * Return Single Ticket Types
 *
 * @memberof TicketType
 * @static
 * @method getType
 *
 * @param {String} id Object Id of ticket type
 * @param {QueryCallback} callback MongoDB Query Callback
 */
systemSchema.statics.getType = function(id, callback) {
    var q = this.model(COLLECTION).findOne({_id: id});

    return q.exec(callback);
};

/**
 * Return Single Ticket Type based on given type name
 *
 * @memberof TicketType
 * @static
 * @method getTypeByName
 *
 * @param {String} name Name of Ticket Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
systemSchema.statics.getSystemsByOrg = function(organization, callback) {
    var q = this.model(COLLECTION).find({organization: organization});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, systemSchema);