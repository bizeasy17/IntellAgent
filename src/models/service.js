/*
 ========================================================================
 Created:    05/28/2018
 Modified:   Jay Han

 **/

var mongoose = require('mongoose');

var COLLECTION = 'services';

/**
 * Service Schema
 * @module models/service
 * @class Service

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Ticket Type
 */
var serviceSchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true }
});

/**
 * Return all Ticket Types
 *
 * @memberof Service
 * @static
 * @method getTypes
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
serviceSchema.statics.getTypes = function(callback) {
    var q = this.model(COLLECTION).find({});

    return q.exec(callback);
};

/**
 * Return Single Ticket Types
 *
 * @memberof Service
 * @static
 * @method getType
 *
 * @param {String} id Object Id of ticket type
 * @param {QueryCallback} callback MongoDB Query Callback
 */
serviceSchema.statics.getType = function(id, callback) {
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
serviceSchema.statics.getTypeByName = function(name, callback) {
    var q = this.model(COLLECTION).findOne({name: name});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, serviceSchema);