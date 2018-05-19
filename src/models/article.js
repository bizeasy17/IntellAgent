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

var COLLECTION = 'articles';

/**
 * Group Schema
 * @module models/knowledgebase
 * @class Group
 * @requires {@link Tag}
 * @requires {@link User}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} author ```Required``` ```unique``` author of Article
 * @property {Date} date created date of the article
 * @property {Date} dateGmt created date of article (GMT)
 * @property {String} subject article subject 
 * @property {String} content article content
 * @property {String} excerpt article excerpt
 * @property {Array} tags article tags
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
    excerpt: { type: String, required: false},
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],
    permalink: { type: String, required: false, unique: true },
    password: { type: String, required: false },
    status: { type: String, required: true },
    deleted: { type: Boolean, default: false, required: true, index: true },
    commentStatus: { type: String, required: true, default: 'open' }, //open | closed
    pingStatus: { type: String, required: true, default: 'closed' }, //open | closed
    shortName: { type: String, required: true },
    modifiedDate: { type: Date, required: false, default: Date.now },
    modifiedDateGmt: { type: Date, required: false },
    commentCount: { type: Number },
    subscribers: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false },
    likers: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
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
articleSchema.statics.getArticlesWithObject = function (grpId, object, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTicketsWithObject()", null);
    }

    if (!_.isObject(object)) {
        return callback("Invalid Object (Must be of type Object) - TicketSchema.GetTicketsWithObject()", null);
    }

    var self = this;

    var limit = (object.limit === null ? 10 : object.limit);
    var page = (object.page === null ? 0 : object.page);
    var _status = object.status;

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.groups)) {
        var g = _.map(grpId, '_id').map(String);
        grpId = _.intersection(object.filter.groups, g);
    }

    var q = self.model(COLLECTION).find({ group: { $in: grpId }, deleted: false })
        .populate('owner assignee subscribers comments.owner notes.owner history.owner', 'username fullname email role image title')
        .populate('assignee', 'username fullname email role image title')
        .populate('type tags group')
        .populate('group.members', 'username fullname email role image title')
        .populate('group.sendMailTo', 'username fullname email role image title')
        .sort('-uid');

    if (limit !== -1) {
        q.skip(page * limit).limit(limit);
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.uid)) {
        object.filter.uid = parseInt(object.filter.uid);
        if (!_.isNaN(object.filter.uid))
            q.or([{ uid: object.filter.uid }]);
    }

    if (!_.isUndefined(_status) && !_.isNull(_status) && _.isArray(_status) && _.size(_status) > 0) {
        q.where({ status: { $in: _status } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.priority)) {
        q.where({ priority: { $in: object.filter.priority } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.types)) {
        q.where({ type: { $in: object.filter.types } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.tags)) {
        q.where({ tags: { $in: object.filter.tags } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.assignee)) {
        q.where({ assignee: { $in: object.filter.assignee } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.owner)) {
        q.where({ owner: { $in: object.filter.owner } });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.subject)) q.or([{ subject: new RegExp(object.filter.subject, "i") }]);
    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.issue)) q.or([{ issue: new RegExp(object.filter.issue, "i") }]);

    if (!_.isUndefined(object.assignedSelf) && !_.isNull(object.assignedSelf)) q.where('assignee', object.user);

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.date)) {
        var startDate = new Date(2000, 0, 1, 0, 0, 1);
        var endDate = new Date();
        if (!_.isUndefined(object.filter.date.start))
            startDate = new Date(object.filter.date.start);
        if (!_.isUndefined(object.filter.date.end))
            endDate = new Date(object.filter.date.end);

        q.where({ date: { $gte: startDate, $lte: endDate } });
    }

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, articleSchema);