/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888  
 ========================================================================
 Created:    16/05/2018
 Author:     Jay Han
 */

var _ = require('lodash');
var mongoose = require('mongoose');

var COLLECTION = 'locations';

/**
 * Group Schema
 * @module models/location
 * @class Group
 * @requires {@link Tag}
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
 * @property {String} permalink permalink of article
 * @property {String} password password of the article
 * @property {String} status status of article draft | published
 * @property {Boolean} deleted ```Required``` [default: false] If article is flagged as deleted.
 * @property {Date} createDate to allow comments or not open | closed
 */
var locationSchema = mongoose.Schema({
    uid: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: false },
    type: { type: String, required: true },
    deleted: { type: Boolean, default: false, required: true, index: true },
    createDate: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model(COLLECTION, locationSchema);