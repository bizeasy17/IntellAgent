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
 * @property {String} name ```Required``` ```unique``` Name of Ticket Type
 */
var systemSchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true }
});

/**
 * Return all Ticket Types
 *
 * @memberof TicketType
 * @static
 * @method getTypes
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
systemSchema.statics.getTypes = function(callback) {
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
systemSchema.statics.getTypeByName = function(name, callback) {
    var q = this.model(COLLECTION).findOne({name: name});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, systemSchema);