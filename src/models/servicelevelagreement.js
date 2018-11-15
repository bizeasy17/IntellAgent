/*
 Created:    06/27/2018
 Modified:   Jay Han

 **/

var mongoose = require('mongoose');

var COLLECTION = 'servicelevelagreements';

/**
 * System Schema
 * @module models/system
 * @class System

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of System
 */
var serviceLevelAgreementSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }
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
serviceLevelAgreementSchema.statics.getSystems = function (callback) {
    var q = this.model(COLLECTION).find({});

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
serviceLevelAgreementSchema.statics.getType = function (id, callback) {
    var q = this.model(COLLECTION).findOne({ _id: id });

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
serviceLevelAgreementSchema.statics.getTypeByName = function (name, callback) {
    var q = this.model(COLLECTION).findOne({ name: name });

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, serviceLevelAgreementSchema);