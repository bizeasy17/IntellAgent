/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888  
 ========================================================================
 Created:    06/05/2018
 Author:     Jay Han
 */

var _ = require('lodash');
var mongoose = require('mongoose');
var historySchema = require('./history');
var commentSchema = require('./comment');

var COLLECTION = 'articles';

/**
 * Group Schema
 * @module models/knowledgebase
 * @class Article
 * @requires {@link Tag}
 * @requires {@link User}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {Number} uid ```Required``` ```unique``` Readable Article ID
 * @property {String} author ```Required``` ```unique``` author of Article
 * @property {Date} date created date of the article
 * @property {Date} dateGmt created date of article (GMT)
 * @property {String} subject article subject 
 * @property {String} content article content
 * @property {String} excerpt article excerpt
 * @property {Array} tags article tags
 * @property {Array} systems article for which systems
 * @property {Array} services article for which services
 * @property {String} permalink permalink of article
 * @property {String} password password of the article
 * @property {String} status status of article draft | published
 * @property {Boolean} deleted ```Required``` [default: false] If article is flagged as deleted.
 * @property {String} commentStatus to allow comments or not open | closed
 * @property {String} pingStatus to allow ping or not open | closed
 * @property {String} shortName short name of articles
 * @property {Date} modifiedDate modified date
 * @property {Date} modifiedDateGmt modified date GMT
 * @property {Number} commentCount count of comments
 * @property {Array} subscribers subscribers of the article
 * @property {Array} likers article likers
 * @property {Number} likeCount count of likers
 * @property {Array} history An array of {@link History} items
 */
var articleSchema = mongoose.Schema({
    uid: { type: Number, unique: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
    date: { type: Date, required: true , default: Date.now},
    dateGmt: {type: Date, required: true },
    subject: { type: String, required: true, unique: true },
    content: { type: String, required: true},
    contentHtml: { type: String, required: true },
    excerpt: { type: String, required: false},
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'articlecategories' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'tags' }],
    systems: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'systems' }],
    services: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'services' }],
    organizations: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'organizations' },
    isOriginal: { type: Boolean, default: true, required: false},
    permalink: { type: String, required: false, unique: false },
    postType: { type: String, required: false, default: 'page'},
    password: { type: String, required: false },
    status: { type: String, required: true, default: 'publish' },
    deleted: { type: Boolean, default: false, required: false, index: true },
    commentStatus: { type: String, required: false, default: 'open' }, //open | closed
    pingStatus: { type: String, required: false, default: 'closed' }, //open | closed
    shortName: { type: String, required: false },
    modifiedDate: { type: Date, required: false, default: Date.now },
    modifiedDateGmt: { type: Date, required: false },
    comments: [commentSchema],
    commentCount: { type: Number },
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false }],
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false }],
    likeCount: {type: Number, default: 0},
    history: [historySchema],
});

articleSchema.index({ deleted: -1, author: 1, excerpt: 1, status: 1 });

articleSchema.pre('save', function (next) {
    if (!_.isUndefined(this.uid) || this.uid) return next();

    var c = require('./counters');
    var self = this;
    c.increment('articles', function (err, res) {
        if (err) return next(err);

        self.uid = res.value.next;

        if (_.isUndefined(self.uid)) {
            var error = new Error('Invalid UID.');
            return next(error);
        }

        return next();
    });
});

/**
 * Mark a article as deleted in MongoDb <br/><br/>
 * *Article has its ```deleted``` flag set to true*
 *
 * @memberof Article
 * @static
 * @method softDelete
 *
 * @param {Object} oId Article Object _id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
articleSchema.statics.softDelete = function (oId, callback) {
    if (_.isUndefined(oId)) return callback("Invalid ObjectID - ArticleSchema.SoftDelete()", null);

    var self = this;

    return self.model(COLLECTION).findOneAndUpdate({ _id: oId }, { deleted: true }, callback);
};

/**
 * Gets Tickets with a given group id and a JSON Object <br/><br/>
 * *Sorts on UID desc.*
 * @memberof Ticket
 * @static
 * @method getTicketsWithObject
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Object} object JSON Object with various options
 * @param {QueryCallback} callback MongoDB Query Callback
 *
 * @example
 * //Object Options
 * {
 *    limit: 10,
 *    page: 0,
 *    closed: false,
 *    status: 1
 * }
 */
articleSchema.statics.getPublishedArticlesByCategory = function (orgId, categoryId, callback, limit) {
    if (_.isUndefined(orgId)) return callback("Invalid Org Ids = articleSchema.GetPublishedArticlesByCategory()", null);
    if (_.isUndefined(categoryId)) return callback("Invalid Category Type Id - articleSchema.GetPublishedArticlesByCategory()", null);

    var self = this;

    var q = self.model(COLLECTION).find({ organizations: orgId, category: categoryId, deleted: false });
    if (limit)
        q.limit(1000);

    return q.lean().exec(callback);
};

articleSchema.statics.getCountWithObject = function (userId, object, callback) {
    if (_.isUndefined(userId)) {
        return callback("Invalid UserId - ArticleSchema.GetArticles()", null);
    }

    // if (!_.isArray(grpId)) {
    //     return callback("Invalid GroupId (Must be of type Array) - ArticleSchema.GetTicketsWithObject()", null);
    // }

    if (!_.isObject(object)) {
        return callback("Invalid Object (Must be of type Object) - Articlechema.GetArticlesWithObject()", null);
    }

    var self = this;
    var q = [];
    // if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.groups)) {
    //     var g = _.map(grpId, '_id').map(String);
    //     grpId = _.intersection(object.filter.groups, g);
    // }
    if (!_.isUndefined(userId)) {
        q = self.model(COLLECTION).count({ author: userId , deleted: false });
    } else {
        q = self.model(COLLECTION).count({ deleted: false });
    }

    if (!_.isUndefined(object.status) && _.isArray(object.status)) {
        var status = object.status.map(Number);
        q.where({ status: { $in: status } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.assignee)) {
        q.where({ assignee: { $in: object.filter.assignee } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.types)) {
        q.where({ type: { $in: object.filter.types } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.subject)) q.where({ subject: new RegExp(object.filter.subject, "i") });

    if (!_.isUndefined(object.assignedSelf) && object.assignedSelf === true && !_.isUndefined(object.assignedUserId) && !_.isNull(object.assignedUserId)) {
        q.where('assignee', object.assignedUserId);
    }

    return q.lean().exec(callback)
};

module.exports = mongoose.model(COLLECTION, articleSchema);