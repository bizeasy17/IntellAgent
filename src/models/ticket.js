/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Modified:   Jay Han [Author:   Chris Brame]

 **/

var async               = require('async');
var mongoose            = require('mongoose');
var _                   = require('lodash');
var moment              = require('moment');
var hash                = require('object-hash');
// var redisCache          = require('../cache/rediscache');

//Needed - Even if unused!
var groupSchema         = require('./group');
var ticketTypeSchema    = require('./tickettype');
var userSchema          = require('./user');
var commentSchema       = require('./comment');
var noteSchema          = require('./note');
var attachmentSchema    = require('./attachment');
var historySchema       = require('./history');
var tagSchema           = require('./tag');

var COLLECTION = 'tickets';


/**
 * Ticket Schema
 * @module models/ticket
 * @class Ticket
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link User}
 * @requires {@link Comment}
 * @requires {@link Attachment}
 * @requires {@link History}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {Number} uid ```Required``` ```unique``` Readable Ticket ID
 * @property {User} owner ```Required``` Reference to User Object. Owner of this Object.
 * @property {Group} group ```Required``` Group this Ticket is under.
 * @property {User} assignee User currently assigned to this Ticket.
 * @property {Date} date ```Required``` [default: Date.now] Date Ticket was created.
 * @property {Date} updated Date ticket was last updated
 * @property {Boolean} deleted ```Required``` [default: false] If they ticket is flagged as deleted.
 * @property {TicketType} type ```Required``` Reference to the TicketType
 * @property {Number} status ```Required``` [default: 0] Ticket Status. (See {@link Ticket#setStatus})
 * @property {Number} prioirty ```Required```
 * @property {Array} tags An array of Tags.
 * @property {Array} tags An array of Tags.
 * @property {String} subject ```Required``` The subject of the ticket. (Overview)
 * @property {String} issue ```Required``` Detailed information about the ticket problem/task
 * @property {Date} closedDate show the datetime the ticket was moved to status 3.
 * @property {Array} comments An array of {@link Comment} items
 * @property {Array} notes An array of {@link Comment} items for internal notes
 * @property {Array} attachments An Array of {@link Attachment} items
 * @property {Array} history An array of {@link History} items
 * @property {Array} subscribers An array of user _ids that receive notifications on ticket changes.
 */
var ticketSchema = mongoose.Schema({
    uid:        { type: Number, unique: true, index: true},
    owner:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'accounts'},
    group:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'groups'},
    assignee:   { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    date:       { type: Date, default: Date.now, required: true, index: true},
    updated:    { type: Date},
    deleted:    { type: Boolean, default: false, required: true, index: true },
    type:       { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'tickettypes' },
    status:     { type: Number, default: 0, required: true, index: true },
    priority:   { type: Number, required: true },
    tags:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'tags' }],
    system:     { type: mongoose.Schema.Types.ObjectId, ref: 'systems', required: false}, //2018-10-27 JH for ticket raise to system
    org:        { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true }, //2018-10-27 JH for ticket of organization
    subject:    { type: String, required: true },
    issue:      { type: String, required: true },
    closedDate: { type: Date },
    comments:   [commentSchema],
    notes:      [noteSchema],
    attachments:[attachmentSchema],
    history:    [historySchema],
    subscribers:[{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' }]
});

ticketSchema.index({deleted: -1, group: 1, status: 1});

ticketSchema.pre('save', function(next) {
    if (!_.isUndefined(this.uid) || this.uid) return next();

    var c = require('./counters');
    var self = this;
    c.increment('tickets', function(err, res) {
        if (err) return next(err);

        self.uid = res.value.next;

        if (_.isUndefined(self.uid)) {
            var error = new Error('Invalid UID.');
            return next(error);
        }

        return next();
    });
});

ticketSchema.virtual('statusFormatted').get(function() {
    var s = this.status;
    var formatted;
    switch (s) {
        case 0:
            formatted = 'New';
            break;
        case 1:
            formatted = 'Open';
            break;
        case 2:
            formatted = 'Pending';
            break;
        case 3:
            formatted = 'Closed';
            break;
        default:
            formatted = 'New';
    }

    return formatted;
});

ticketSchema.virtual('priorityFormatted').get(function() {
    var p = this.priority;
    var formatted;

    switch(p) {
        case 1:
            formatted = 'Normal';
            break;
        case 2:
            formatted = 'Urgent';
            break;
        case 3:
            formatted = 'Critical';
            break;
        default:
            formatted = 'Normal';
    }

    return formatted;
});

ticketSchema.virtual('commentsAndNotes').get(function() {
    _.each(this.comments, function(i) { i.isComment = true; });
    _.each(this.notes, function(i) { i.isNote = true; });
    var combined = _.union(this.comments, this.notes);
    combined = _.sortBy(combined, 'date');

    return combined;
});

/**
 * Set Status on Instanced Ticket
 * @instance
 * @method setStatus
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} status Status to set
 * @param {TicketCallback} callback Callback with the updated ticket.
 *
 * @example
 * Status:
 *      0 - New
 *      1 - Open
 *      2 - Pending
 *      3 - Closed
 */
ticketSchema.methods.setStatus = function(ownerId, status, callback) {
    if (_.isUndefined(status)) return callback('Invalid Status', null);

    var self = this;

    if (status === 3) {
        self.closedDate = new Date();
    } else {
        self.closedDate = null;
    }

    self.status = status;
    var historyItem = {
        action: 'ticket:set:status:' + status,
        description: 'Ticket Status set to: ' + statusToString(status),
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Set Assignee on Instanced Ticket
 * @instance
 * @method setAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} userId User ID to set as assignee
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setAssignee = function(ownerId, userId, callback) {
    if (_.isUndefined(userId)) return callback('Invalid User Id', null);
    var permissions = require('../permissions');
    var self = this;

    self.assignee = userId;
    userSchema.getUser(userId, function(err, user) {
        if (err) return callback(err, null);

        if (!permissions.canThis(user.role, 'ticket:assignee'))
            return callback('User does not have permission to be set as an assignee.', null);

        var historyItem = {
            action: 'ticket:set:assignee',
            description: user.fullname + ' was set as assignee',
            owner: ownerId
        };

        self.history.push(historyItem);

        return callback(null, self);
    });
};

/**
 * Clear the current assignee
 * @instance
 * @method clearAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.clearAssignee = function(ownerId, callback) {
    var self = this;
    self.assignee = undefined;
    var historyItem = {
        action: 'ticket:set:assignee',
        description: 'Assignee was cleared',
        owner: ownerId
    };
    self.history.push(historyItem);
    callback(null, self);
};

/**
 * Sets the ticket type for the instanced Ticket
 * @instance
 * @method setTicketType
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} typeId TicketType Id to set as ticket type
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketType = function(ownerId, typeId, callback) {
    var self = this;
    self.type = typeId;
    var historyItem = {
        action: 'ticket:set:type',
        description: 'Ticket type set to: ' + typeId.name,
        owner: ownerId
    };

    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Sets the ticket priority
 * @instance
 * @method setTicketPriority
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} priority Priority to set
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketPriority = function(ownerId, priority, callback) {
    if (_.isNaN(priority)) return callback('Priority must be a number.', null);

    var self = this;
    self.priority = priority;
    var historyItem = {
        action: 'ticket:set:priority',
        description: 'Ticket Priority set to: ' + priority,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Sets this ticket under the given group Id
 * @instance
 * @method setTicketGroup
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} groupId MongoDB group Id to assign this ticket to
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketGroup = function(ownerId, groupId, callback) {
    var self = this;
    self.group = groupId;

    self.populate('group', function(err, ticket) {
        var historyItem = {
            action: 'ticket:set:group',
            description: 'Ticket Group set to: ' + ticket.group.name,
            owner: ownerId
        };
        self.history.push(historyItem);

        callback(null, ticket);

    });
};

/**
 * Sets this ticket's issue text
 * @instance
 * @method setIssue
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} issue Issue text to set on the ticket
 * @param {TicketCallback} callback Callback with the updated ticket.
 * @example
 * ticket.setIssue({ownerId}, 'This is the new issue string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.setIssue = function(ownerId, issue, callback) {
    var self = this;
    self.issue = issue;
    var historyItem = {
        action: 'ticket:update:issue',
        description: 'Ticket Issue was updated.',
        owner: ownerId
    };

    self.history.push(historyItem);

    return callback(null, self);
};

/**
 * Updates a given comment inside the comment array on this ticket
 * @instance
 * @method updateComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to update
 * @param {String} commentText Text to update the comment to
 * @param {TicketCallback} callback Callback with the updated ticket.
 * @example
 * ticket.updateComment({ownerId}, {commentId} 'This is the new comment string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.updateComment = function(ownerId, commentId, commentText, callback) {
    var self = this;
    var comment = _.find(self.comments, function(c){return c._id.toString() === commentId.toString()});
    if (_.isUndefined(comment)) return callback("Invalid Comment", null);

    comment.comment = commentText;

    var historyItem = {
        action: 'ticket:comment:updated',
        description: 'Comment was updated: ' + commentId,
        owner: ownerId
    };
    self.history.push(historyItem);

    return callback(null, self);
};

/**
 * Removes a comment from the comment array on this ticket.
 * @instance
 * @method removeComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to remove
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.removeComment = function(ownerId, commentId, callback) {
    var self = this;
    self.comments = _.reject(self.comments, function(o) { return o._id.toString() === commentId.toString(); });

    var historyItem = {
        action: 'ticket:delete:comment',
        description: 'Comment was deleted: ' + commentId,
        owner: ownerId
    };
    self.history.push(historyItem);

    return callback(null, self);
};

/**
 * Updates a given Note inside the note array on this ticket
 * @instance
 * @method updateNote
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} noteId Note ID to update
 * @param {String} noteText Text to update the note to
 * @param {TicketCallback} callback Callback with the updated ticket.
 * @example
 * ticket.updateNote({ownerId}, {noteId} 'This is the new note string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.updateNote = function(ownerId, noteId, noteText, callback) {
    var self = this;
    var note = _.find(self.notes, function(c){return c._id.toString() === noteId.toString()});
    if (_.isUndefined(note)) return callback("Invalid Note", null);

    note.note = noteText;

    var historyItem = {
        action: 'ticket:note:updated',
        description: 'Note was updated: ' + noteId,
        owner: ownerId
    };
    self.history.push(historyItem);

    return callback(null, self);
};

/**
 * Removes a note from the note array on this ticket.
 * @instance
 * @method removeNote
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} noteId Comment ID to remove
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.removeNote = function(ownerId, noteId, callback) {
    var self = this;
    self.notes = _.reject(self.notes, function(o) { return o._id.toString() === noteId.toString(); });

    var historyItem = {
        action: 'ticket:delete:note',
        description: 'Note was deleted: ' + noteId,
        owner: ownerId
    };
    self.history.push(historyItem);

    return callback(null, self);
};

ticketSchema.methods.getAttachment = function(attachmentId, callback) {
    var self = this;
    var attachment = _.find(self.attachments, function(o){return o._id.toString() === attachmentId.toString(); });

    return callback(attachment);
};

ticketSchema.methods.removeAttachment = function(ownerId, attachmentId, callback) {
    var self = this;
    var attachment = _.find(self.attachments, function(o) { return o._id.toString() === attachmentId.toString(); });
    self.attachments = _.reject(self.attachments, function(o) { return o._id.toString() === attachmentId.toString(); });

    if (_.isUndefined(attachment))
        return callback(null, self);

    var historyItem = {
        action: 'ticket:delete:attachment',
        description: 'Attachment was deleted: ' + attachment.name,
        owner: ownerId
    };

    self.history.push(historyItem);

    return callback(null, self);
};

ticketSchema.methods.addSubscriber = function(userId, callback) {
    var self = this;

    var hasSub = _.some(self.subscribers, function(i) {
        return i._id.toString() === userId.toString();
    });

    if (!hasSub)
        self.subscribers.push(userId);

    return callback(null, self);
};

ticketSchema.methods.removeSubscriber = function(userId, callback) {
    var self = this;

    var user = _.find(self.subscribers, function(i) { return i._id.toString() === userId.toString(); });

    if (_.isUndefined(user) || _.isEmpty(user) || _.isNull(user)) return callback(null, self);

    self.subscribers = _.reject(self.subscribers, function(i) { return i._id.toString() === userId.toString(); });

    return callback(null, self);
};

/**
 * Gets all tickets that are not marked as deleted <br> <br>
 *
 * **Deep populates: group, group.members, group.sendMailTo, comments, comments.owner**
 *
 * @memberof Ticket
 * @static
 * @method getAll
 * @param {QueryCallback} callback MongoDB Query Callback
 *
 * @example
 * ticketSchema.getAll(function(err, tickets) {
 *    if (err) throw err;
 *
 *    //tickets is an array
 * });
 */
ticketSchema.statics.getAll = function(callback) {
    var self = this;
    var q = self.model(COLLECTION).find({deleted: false})
        .populate('owner assignee', '-password -__v -preferences -iOSDeviceTokens -tOTPKey')
        .populate('type tags group')
        .sort({'status': 1})
        .lean();

    return q.exec(callback);
};

ticketSchema.statics.getForCache = function(callback) {
    var self = this;
    var t365 = moment().hour(23).minute(59).second(59).subtract(365, 'd').toDate();
    self.model(COLLECTION).find({date: {$gte: t365}, deleted: false})
        .select('_id uid date status history comments assignee owner tags')
        .sort('date')
        .lean()
        .exec(callback);
};

ticketSchema.statics.getAllNoPopulate = function(callback) {
    var self = this;
    var q = self.model(COLLECTION).find({deleted: false}).sort({'status': 1}).lean();

    return q.exec(callback);
};

ticketSchema.statics.getAllByStatus = function(status, callback) {
    var self = this;

    if (!_.isArray(status))
        status = [status];

    var q = self.model(COLLECTION).find({status: {$in: status}, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags group')
        .sort({'status': 1})
        .lean();

    return q.exec(callback);
};

/**
 * Gets Tickets with a given group id.
 *
 * @memberof Ticket
 * @static
 * @method getTickets
 * @param {Array} grpIds Group Id to retrieve tickets for.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTickets = function(grpIds, callback) {
    if (_.isUndefined(grpIds)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpIds)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()", null);
    }

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpIds}, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags group')
        .sort({'status': 1});

    return q.exec(callback);
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
ticketSchema.statics.getTicketsWithObject = function(grpId, object, callback) {
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

    var q = self.model(COLLECTION).find({group: {$in: grpId}, deleted: false})
        .populate('owner assignee subscribers comments.owner notes.owner history.owner', 'username fullname email role image title')
        .populate('assignee', 'username fullname email role image title')
        .populate('type tags group')
        .populate('group.members', 'username fullname email role image title')
        .populate('group.sendMailTo', 'username fullname email role image title')
        .sort('-uid');

    if (limit !== -1) {
        q.skip(page*limit).limit(limit);
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.uid)) {
        object.filter.uid = parseInt(object.filter.uid);
        if (!_.isNaN(object.filter.uid))
            q.or([{uid: object.filter.uid}]);
    }

    if (!_.isUndefined(_status) && !_.isNull(_status) && _.isArray(_status) && _.size(_status) > 0) {
        q.where({status: {$in: _status}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.priority)) {
        q.where({priority: {$in: object.filter.priority}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.types)) {
        q.where({type: {$in: object.filter.types}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.tags)) {
        q.where({tags: {$in: object.filter.tags}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.assignee)) {
        q.where({assignee: {$in: object.filter.assignee}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.owner)) {
        q.where({owner: {$in: object.filter.owner}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.subject)) q.or([{subject: new RegExp(object.filter.subject, "i")}]);
    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.issue)) q.or([{issue: new RegExp(object.filter.issue, "i")}]);

    if (!_.isUndefined(object.assignedSelf) && !_.isNull(object.assignedSelf)) q.where('assignee', object.user);

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.date)) {
        var startDate = new Date(2000, 0, 1, 0, 0, 1);
        var endDate = new Date();
        if (!_.isUndefined(object.filter.date.start))
            startDate = new Date(object.filter.date.start);
        if (!_.isUndefined(object.filter.date.end))
            endDate = new Date(object.filter.date.end);

        q.where({date: {$gte: startDate, $lte: endDate}});
    }

    return q.exec(callback);
};

ticketSchema.statics.getCountWithObject = function(grpId, object, callback) {
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

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.groups)) {
        var g = _.map(grpId, '_id').map(String);
        grpId = _.intersection(object.filter.groups, g);
    }

    var q = self.model(COLLECTION).count({group: {$in: grpId}, deleted: false});
    if (!_.isUndefined(object.status) && _.isArray(object.status)) {
        var status = object.status.map(Number);
        q.where({status: {$in: status} });
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.assignee)) {
        q.where({assignee: {$in: object.filter.assignee}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.types)) {
        q.where({type: {$in: object.filter.types}});
    }

    if (!_.isUndefined(object.filter) && !_.isUndefined(object.filter.subject)) q.where({subject: new RegExp(object.filter.subject, "i")});

    if (!_.isUndefined(object.assignedSelf) && object.assignedSelf === true && !_.isUndefined(object.assignedUserId) && !_.isNull(object.assignedUserId)) {
        q.where('assignee', object.assignedUserId);
    }

    return q.lean().exec(callback)
};


/**
 * Gets Tickets for status in given group. <br/><br/>
 * *Sorts on UID desc*
 * @memberof Ticket
 * @static
 * @method getTicketsByStatus
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Number} status Status number to check
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByStatus = function(grpId, status, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()", null);
    }

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, status: status, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags group')
        .sort({'uid': -1});

    return q.exec(callback);
};

/**
 * Gets Single ticket with given UID.
 * @memberof Ticket
 * @static
 * @method getTicketByUid
 *
 * @param {Number} uid Unique Id for ticket.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketByUid = function(uid, callback) {
    if (_.isUndefined(uid)) return callback("Invalid Uid - TicketSchema.GetTicketByUid()", null);

    var self = this;

    var q = self.model(COLLECTION).findOne({uid: uid, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags group');

    return q.exec(callback);
};

/**
 * Gets Single ticket with given object _id.
 * @memberof Ticket
 * @static
 * @method getTicketById
 *
 * @param {Object} id MongoDb _id.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketById = function(id, callback) {
    if (_.isUndefined(id)) return callback("Invalid Id - TicketSchema.GetTicketById()", null);

    var self = this;

    var q = self.model(COLLECTION).findOne({_id: id, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags')
        .populate({
            path: 'group',
            model: groupSchema,
            populate: [
                {
                    path: 'members',
                    model: userSchema,
                    select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
                },
                {
                    path: 'sendMailTo',
                    model: userSchema,
                    select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
                }
            ]
        });

    return q.exec(callback);
};

/**
 * Gets tickets by given Requester User Id
 * @memberof Ticket
 * @static
 * @method getTicketsByRequester
 *
 * @param {Object} userId MongoDb _id of user.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByRequester = function(userId, callback) {
    if (_.isUndefined(userId)) return callback("Invalid Requester Id - TicketSchema.GetTicketsByRequester()", null);

    var self = this;

    var q = self.model(COLLECTION).find({owner: userId, deleted: false})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags')
        .populate({
            path: 'group',
            model: groupSchema,
            populate: [
                {
                    path: 'members',
                    model: userSchema,
                    select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
                },
                {
                    path: 'sendMailTo',
                    model: userSchema,
                    select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
                }
            ]
        });

    return q.exec(callback);
};

ticketSchema.statics.getTicketsWithSearchString = function(grps, search, callback) {
    if (_.isUndefined(grps) || _.isUndefined(search)) return callback("Invalid Post Data - TicketSchema.GetTicketsWithSearchString()", null);

    var self = this;

    var tickets = [];

    async.parallel([
        function(callback) {
            var q = self.model(COLLECTION).find({group: {$in: grps}, deleted: false, $where: '/^' + search + '.*/.test(this.uid)'})
                .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
                .populate('type tags group')
            q.exec(function(err, results) {
                if (err) return callback(err);
                tickets.push(results);

                return callback(null);
            });
        },
        function(callback) {
            var q = self.model(COLLECTION).find({group: {$in: grps}, deleted: false, subject: { $regex: search, $options: 'i'}})
                .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
                .populate('type tags group')
            q.exec(function(err, results) {
                if (err) return callback(err);
                tickets.push(results);

                return callback(null);
            });
        },
        function(callback) {
            var q = self.model(COLLECTION).find({group: {$in: grps}, deleted: false, issue: { $regex: search, $options: 'i'}})
                .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
                .populate('type tags group')
            q.exec(function(err, results) {
                if (err) return callback(err);
                tickets.push(results);

                return callback(null);
            });
        }
    ], function(err) {
        if (err) return callback(err, null);

        var t = _.uniq(_.flatten(tickets), function(i){ return i.uid; });

        return callback(null, t);
    });
};

/**
 * Gets tickets that are overdue
 * @memberof Ticket
 * @static
 * @method getOverdue
 *
 * @param {Array} grpId Group Array of User
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getOverdue = function(grpId, callback) {
    if (_.isUndefined(grpId)) return callback("Invalid Group Ids - TicketSchema.GetOverdue()", null);

    var self = this;
    var grpHash = hash(grpId);

    var cache = global.cache;
    if (cache) {
        var overdue = cache.get('tickets:overdue:' + grpHash);
        if (overdue) {
            return callback(null, overdue);
        }
    }

    var q = self.model(COLLECTION).find({group: {$in: grpId}, status: 1, deleted: false})
        .$where(function() {
            var now = new Date();
            var updated = new Date(this.updated);
            var timeout = new Date(updated);
            timeout.setDate(timeout.getDate() + 2);
            return now > timeout;
        }).select('_id uid subject updated');

    q.lean().exec(function(err, results) {
        if (err) return callback(err, null);
        if (cache) cache.set('tickets:overdue:' + grpHash, results, 600); //10min

        return callback(null, results);
    });

    //TODO: Turn on when REDIS is impl
    // This will be pres through server reload
    // redisCache.getCache('$trudesk:tickets:overdue' + grpHash, function(err, value) {
    //     if (err) return callback(err, null);
    //     if (value) {
    //         console.log('served from redis');
    //         return callback(null, JSON.parse(value.data));
    //     } else {
    //         var q = self.model(COLLECTION).find({group: {$in: grpId}, status: 1, deleted: false})
    //             .$where(function() {
    //                 var now = new Date();
    //                 var updated = new Date(this.updated);
    //                 var timeout = new Date(updated);
    //                 timeout.setDate(timeout.getDate() + 2);
    //                 return now > timeout;
    //             }).select('_id uid subject updated');
    //
    //         return q.lean().exec(function(err, results) {
    //             if (err) return callback(err, null);
    //             if (cache) {
    //                 cache.set('tickets:overdue:' + grpHash, results, 600);
    //             }
    //             redisCache.setCache('tickets:' + grpHash, results, function(err) {
    //                 return callback(err, results);
    //             }, 600);
    //         });
    //     }
    // });
};

/**
 * Gets tickets via tag id
 * @memberof Ticket
 * @static
 * @method getTicketsByTag
 *
 * @param {Array} grpId Group Array of User
 * @param {string} tagId Tag Id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByTag = function(grpId, tagId, callback) {
    if (_.isUndefined(grpId)) return callback("Invalid Group Ids - TicketSchema.GetTicketsByTag()", null);
    if (_.isUndefined(tagId)) return callback("Invalid Tag Id - TicketSchema.GetTicketsByTag()", null);

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, tags: tagId, deleted: false});

    return q.exec(callback);
};

/**
 * Gets all tickets via tag id
 * @memberof Ticket
 * @static
 * @method getAllTicketsByTag
 *
 * @param {string} tagId Tag Id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getAllTicketsByTag = function(tagId, callback) {
    if (_.isUndefined(tagId)) return callback("Invalid Tag Id - TicketSchema.GetAllTicketsByTag()", null);

    var self = this;

    var q = self.model(COLLECTION).find({tags: tagId, deleted: false});

    return q.lean().exec(callback);
};

/**
 * Gets tickets via type id
 * @memberof Ticket
 * @static
 * @method getTicketsByType
 *
 * @param {Array} grpId Group Array of User
 * @param {string} typeId Type Id
 * @param {QueryCallback} callback MongoDB Query Callback
 * @param {Boolean} limit Should Limit results?
 */
ticketSchema.statics.getTicketsByType = function(grpId, typeId, callback, limit) {
    if (_.isUndefined(grpId)) return callback("Invalid Group Ids = TicketSchema.GetTicketsByType()", null);
    if (_.isUndefined(typeId)) return callback("Invalid Ticket Type Id - TicketSchema.GetTicketsByType()", null);

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, type: typeId, deleted: false});
    if (limit)
        q.limit(1000);

    return q.lean().exec(callback);
};

/**
 * Gets tickets via type id
 * @memberof Ticket
 * @static
 * @method getTicketsBySystem
 *
 * @param {Array} grpId Group Array of User
 * @param {string} typeId Type Id
 * @param {QueryCallback} callback MongoDB Query Callback
 * @param {Boolean} limit Should Limit results?
 */
ticketSchema.statics.getTicketsBySystem = function (systemId, callback, limit) {
    if (_.isUndefined(systemId)) return callback("Invalid System Ids = TicketSchema.getTicketsBySystem()", null);
    // if (_.isUndefined(typeId)) return callback("Invalid Ticket Type Id - TicketSchema.getTicketsBySystem()", null);

    var self = this;

    var q = self.model(COLLECTION).find({ system: systemId, deleted: false });
    if (limit)
        q.limit(1000);

    return q.lean().exec(callback);
};

/**
 * Gets all tickets via type id
 * @memberof Ticket
 * @static
 * @method getAllTicketsByType
 *
 * @param {string} typeId Type Id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getAllTicketsByType = function(typeId, callback) {
    if (_.isUndefined(typeId)) return callback("Invalid Ticket Type Id - TicketSchema.GetAllTicketsByType()", null);

    var self = this;
    var q = self.model(COLLECTION).find({type: typeId});

    return q.lean().exec(callback);
};

ticketSchema.statics.updateType = function(oldTypeId, newTypeId, callback) {
    if (_.isUndefined(oldTypeId) || _.isUndefined(newTypeId))
        return callback("Invalid IDs - TicketSchema.UpdateType()", null);

    var self = this;
    return self.model(COLLECTION).update({type: oldTypeId}, {$set: {type: newTypeId}}, {multi: true, new: false}, callback);
};

ticketSchema.statics.getAssigned = function(user_id, callback) {
    if (_.isUndefined(user_id)) return callback("Invalid Id - TicketSchema.GetAssigned()", null);

    var self = this;

    var q = self.model(COLLECTION).find({assignee: user_id, deleted: false, status: {$ne: 3}})
        .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
        .populate('type tags group');

    return q.exec(callback);
};

/**
 * Gets count of X Top Groups
 *
 * @memberof Ticket
 * @static
 * @method getTopTicketGroups
 *
 * @param {Number} timespan Timespan to get the top groups (default: 9999)
 * @param {Number} top Top number of Groups to return (default: 5)
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getTopTicketGroups(5, function(err, results) {
 *    if (err) throw err;
 *
 *    //results is an array with name of group and count of total tickets
 *    results[x].name
 *    results[x].count
 * });
 */
ticketSchema.statics.getTopTicketGroups = function(timespan, top, callback) {
    if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = -1;
    if (_.isUndefined(top) || _.isNaN(top)) top = 5;

    var self = this;

    var today = moment().hour(23).minute(59).second(59);
    var tsDate = today.clone().subtract(timespan, 'd');
    var query = {date: {$gte: tsDate.toDate(), $lte: today.toDate()}, deleted: false};
    if (timespan === -1)
        query = {deleted: false};

    var q = self.model(COLLECTION).find(query)
        .select('group')
        .populate('group', 'name')
        .lean();

    var topCount = [];
    var ticketsDb = [];

    async.waterfall([
        function(next) {
            q.exec(function(err, t) {
                if (err) return next(err);

                var a = [];

                for (var i = 0; i < t.length; i++) {
                    var ticket = t[i];
                    if (ticket.group) {
                        ticketsDb.push({ticketId: t[i]._id, groupId: t[i].group._id});
                        var o = {};
                        o._id = ticket.group._id;
                        o.name = ticket.group.name;

                        if (!_.filter(a, {'name': o.name}).length)
                            a.push(o);
                        else
                            o = null;

                    }
                    ticket = null;
                }

                var final = _.uniq(a);

                return next(null, final);
            });
        },
        function(grps, next) {
            for (var g = 0; g < grps.length; g++) {
                var tickets = [];
                var grp = grps[g];
                for (var i = 0; i < ticketsDb.length; i++) {
                    if (ticketsDb[i].groupId === grp._id)
                        tickets.push(ticketsDb);
                }

                topCount.push({'name': grp.name, 'count': tickets.length});
            }

            topCount = _.sortBy(topCount, function(o) { return -o.count; });

            topCount = topCount.slice(0, top);

            return next(null, topCount);
        }

    ], function(err, result) {
        if (err) return callback(err, null);

        return callback(null, result);
    });
};

ticketSchema.statics.getTagCount = function(tagId, callback) {
    if (_.isUndefined(tagId)) return callback("Invalid Tag Id - TicketSchema.GetTagCount()", null);

    var self = this;

    var q = self.model(COLLECTION).count({tags: tagId, deleted: false});

    return q.exec(callback);
};

ticketSchema.statics.getTypeCount = function(typeId, callback) {
    if (_.isUndefined(typeId)) return callback("Invalid Type Id - TicketSchema.GetTypeCount()", null);

    var self = this;

    var q = self.model(COLLECTION).count({type: typeId, deleted: false});

    return q.exec(callback);
};

/**
 * Mark a ticket as deleted in MongoDb <br/><br/>
 * *Ticket has its ```deleted``` flag set to true*
 *
 * @memberof Ticket
 * @static
 * @method softDelete
 *
 * @param {Object} oId Ticket Object _id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.softDelete = function(oId, callback) {
    if (_.isUndefined(oId)) return callback("Invalid ObjectID - TicketSchema.SoftDelete()", null);

    var self = this;

    return self.model(COLLECTION).findOneAndUpdate({_id: oId}, {deleted: true}, callback);
};

function statusToString(status) {
    var str;
    switch (status) {
        case 0:
            str = 'New';
            break;
        case 1:
            str = 'Open';
            break;
        case 2:
            str = 'Pending';
            break;
        case 3:
            str = 'Closed';
            break;
        default:
            str = status;
            break;
    }

    return str;
}

module.exports = mongoose.model(COLLECTION, ticketSchema);