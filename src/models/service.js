/*
 ========================================================================
 Created:    05/28/2018
 Modified:   Jay Han

 **/

var mongoose = require('mongoose');
var historySchema = require('./history');

var COLLECTION = 'services';

/**
 * Service Schema
 * @module models/service
 * @class Service

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Service Name
 */
var serviceSchema = mongoose.Schema({
    uid:        { type: Number, unique: true, index: true },
    name:       { type: String, required: true, unique: true },
    customer:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true }],
    type:       { type: String, required: true},
    industry:   { type: String, required: false },
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
    contact:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false }],
    sla:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'servicelevelagreements', required: false }],
    isVip:      { type: Boolean, required: true, default: false },
    desc:       { type: String, required: true},
    createDate: { type: Date, default: Date.now, required: true },
    editDate:   { type: Date },
    isValid:    { type: Boolean, required: true, default: true },
    startDate:  { type: Date, required: false },
    endDate:    { type: Date, required: false },
    // systems:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'systems' , required: false }],
    history:    [historySchema]
});

/**
 * Return all Services
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
 * Return Single Service
 *
 * @memberof Service
 * @static
 * @method getType
 *
 * @param {String} id Object Id of Service
 * @param {QueryCallback} callback MongoDB Query Callback
 */
serviceSchema.statics.getType = function(id, callback) {
    var q = this.model(COLLECTION).findOne({_id: id});

    return q.exec(callback);
};

/**
 * Return Single Service Type based on given type name
 *
 * @memberof Service
 * @static
 * @method getServiceByName
 *
 * @param {String} name Name of Ticket Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
serviceSchema.statics.getServiceByName = function(name, callback) {
    var q = this.model(COLLECTION).findOne({name: name});

    return q.exec(callback);
};

/**
 * Return Single Service Type based on given type name
 *
 * @memberof Service
 * @static
 * @method getServiceByName
 *
 * @param {String} name Name of Ticket Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
// serviceSchema.statics.getServicesBySystem = function (sysId, callback) {
//     var q = this.model(COLLECTION).count();

//     if(q.exec(callback) > 0) {
//         q = this.model(COLLECTION).find({ systems: sysId });
//         return q.exec(callback);
//     }

//     return null;
// };

module.exports = mongoose.model(COLLECTION, serviceSchema);