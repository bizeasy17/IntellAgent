/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ============================================================================================
 Created:    05/12/2018
 Modified:   Jay Han [Author:   Chris Brame]

 **/

var async           = require('async'),
    _               = require('lodash'),
    moment          = require('moment'),
    winston         = require('winston'),
    permissions     = require('../../../permissions'),
    emitter         = require('../../../emitter');

var api_articles = {};

/**
 * @api {get} /api/v1/articles/ Get Articles
 * @apiName getArticles
 * @apiDescription Gets articles for the given User
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/articles
 *
 * @apiSuccess {object}     _id                 The MongoDB ID
 * @apiSuccess {number}     uid                 Unique ID (seq num)
 * @apiSuccess {object}     owner               User
 * @apiSuccess {object}     owner._id           The MongoDB ID of Owner
 * @apiSuccess {string}     owner.username      Username
 * @apiSuccess {string}     owner.fullname      User Full Name
 * @apiSuccess {string}     owner.email         User Email Address
 * @apiSuccess {string}     owner.role          User Permission Role
 * @apiSuccess {string}     owner.title         User Title
 * @apiSuccess {string}     owner.image         User Image Rel Path
 * @apiSuccess {object}     group               Group
 * @apiSuccess {object}     group._id           Group MongoDB ID
 * @apiSuccess {string}     group.name          Group Name
 * @apiSuccess {object}     assignee            User Assigned
 * @apiSuccess {object}     assignee._id        The MongoDB ID of Owner
 * @apiSuccess {string}     assignee.username   Username
 * @apiSuccess {string}     assignee.fullname   User Full Name
 * @apiSuccess {string}     assignee.email      User Email Address
 * @apiSuccess {string}     assignee.role       User Permission Role
 * @apiSuccess {string}     assignee.title      User Title
 * @apiSuccess {string}     assignee.image      User Image Rel Path
 * @apiSuccess {date}       date                Created Date
 * @apiSuccess {date}       updated             Last Updated DateTime
 * @apiSuccess {boolean}    deleted             Deleted Flag
 * @apiSuccess {object}     type                Ticket Type
 * @apiSuccess {object}     type._id            Type MongoDB ID
 * @apiSuccess {string}     type.name           Type Name
 * @apiSuccess {number}     status              Status of Ticket
 * @apiSuccess {number}     prioirty            Prioirty of Ticket
 * @apiSuccess {array}      tags                Array of Tags
 * @apiSuccess {string}     subject             Subject Text
 * @apiSuccess {string}     issue               Issue Text
 * @apiSuccess {date}       closedDate          Date Ticket was closed
 * @apiSuccess {array}      comments            Array of Comments
 * @apiSuccess {array}      attachments         Array of Attachments
 * @apiSuccess {array}      history             Array of History items
 *
 */
api_articles.get = function(req, res) {
    var l = (req.query.limit ? req.query.limit : 10);
    var limit = parseInt(l);
    var page = parseInt(req.query.page);
    var assignedSelf = req.query.assignedself;
    var status = req.query.status;
    var user = req.user;

    var object = {
        user: user,
        limit: limit,
        page: page,
        assignedSelf: assignedSelf,
        status: status
    };

    var ticketModel = require('../../../models/article');
    var groupModel = require('../../../models/group');

    async.waterfall([
        function(callback) {
            groupModel.getAllGroupsOfUserNoPopulate(user._id, function(err, grps) {
                callback(err, grps);
            })
        },
        function(grps, callback) {
            if (permissions.canThis(user.role, 'ticket:public')) {
                groupModel.getAllPublicGroups(function(err, publicGroups) {
                    if (err) return callback(err);

                    grps = grps.concat(publicGroups);

                    return callback(null, grps);
                });
            } else {
                return callback(null, grps);
            }
        },
        function(grps, callback) {
            ticketModel.getTicketsWithObject(grps, object, function(err, results) {
                if (!permissions.canThis(user.role, 'notes:view')) {
                    _.each(results, function(ticket) {
                        ticket.notes = [];
                    });
                }

                return callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return res.send('Error: ' + err.message);

        return res.json(results);
    });
};

/**
 * @api {get} /api/v1/tickets/search/?search={searchString} Get Tickets by Search String
 * @apiName search
 * @apiDescription Gets tickets via search string
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/search/?search=searchString
 *
 * @apiSuccess {number} count Count of Tickets Array
 * @apiSuccess {array} tickets Tickets Array
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Ticket"
 }
 */
api_articles.search = function(req, res) {
    var searchString = req.query.search;

    var ticketModel = require('../../../models/ticket');
    var groupModel = require('../../../models/group');

    async.waterfall([
        function(callback) {
            groupModel.getAllGroupsOfUserNoPopulate(req.user._id, function(err, grps) {
                callback(err, grps);
            });
        },
        function(grps, callback) {
            if (permissions.canThis(req.user.role, 'ticket:public')) {
                groupModel.getAllPublicGroups(function(err, publicGroups) {
                    if (err) return callback(err);

                    grps = grps.concat(publicGroups);

                    return callback(null, grps);
                });
            } else {
                return callback(null, grps);
            }
        },
        function(grps, callback) {
            ticketModel.getTicketsWithSearchString(grps, searchString, function(err, results) {

                if (!permissions.canThis(req.user.role.role, 'notes:view')) {
                    _.each(results, function(ticket) {
                        ticket.notes = [];
                    });
                }

                return callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return res.status(400).json({success: false, error: 'Error - ' + err.message});

        return res.json({success: true, error: null, count: _.size(results), tickets: _.sortBy(results, 'uid').reverse()});
    });
};

/**
 * @api {post} /api/v1/articles/create Create Article
 * @apiName createArticle
 * @apiDescription Creates a article with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Article
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "subject": "Subject",
 *      "issue": "Issue Exmaple",
 *      "owner": {OwnerId},
 *      "group": {GroupId},
 *      "type": {TypeId},
 *      "prioirty": 0-3
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"subject\":\"{subject}\",\"owner\":{ownerId}, group: \"{groupId}\", type: \"{typeId}\", issue: \"{issue}\", prioirty: \"{prioirty}\"}"
 *      -l http://localhost/api/v1/articles/create
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Saved Article Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
        {
            "error": "Invalid Post Data"
        }
 */

api_articles.create = function(req, res) {
    var response = {};
    response.success = true;

    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({'success': false, error: 'Invalid Post Data'});

    var socketId = _.isUndefined(postData.socketId) ? '' : postData.socketId;

    if (_.isUndefined(postData.tags) || _.isNull(postData.tags)) {
        postData.tags = [];
    } else if (!_.isArray(postData.tags)) {
        postData.tags = [postData.tags];
    }

    var HistoryItem = {
        action: 'article:created',
        description: 'Articles was created.',
        owner: req.user._id
    };

    var articleModel = require('../../../models/article');
    var article = new articleModel(postData);
    article.author = req.user._id;
    var d = new Date();
    article.dateGmt = d;
    article.modifiedDateGmt = d;
    var marked = require('marked');
    var aContent = article.content;
    aContent = aContent.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
    article.aContent = marked(aContent);
    article.history = [HistoryItem];
    article.subscribers = [req.user._id];

    article.save(function(err, a) {
        if (err) {
            response.success = false;
            response.error = err;
            winston.debug(response);
            return res.status(400).json(response);
        }

        emitter.emit('article:created', {hostname: req.headers.host, socketId: socketId, article: a});

        response.article = a;
        res.json(response);
    });
};

/**
 * @api {post} /api/v1/public/tickets/create Create Public Ticket
 * @apiName createPublicTicket
 * @apiDescription Creates a ticket with the given post data via public ticket submission. [Limited to Server Origin]
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "fullname": "Full Name",
 *      "email": "email@email.com",
 *      "subject": "Subject",
 *      "issue": "Issue Exmaple"
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -d "{\"fullname\":\"{fullname}\",\"email\":{email}, \"subject\": \"{subject}\", \"issue\": \"{issue}\"}"
 *      -l http://localhost/api/v1/public/tickets/create
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Saved Ticket Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_articles.createPublicTicket = function(req, res) {
    var origin = req.headers.origin;
    var host = req.headers.host;
    if (req.secure) host = 'https://' + host;
    if (!req.secure) host = 'http://' + host;

    if (origin !== host) return res.status(400).json({success: false, error: 'Invalid Origin!'});

    var Chance = require('chance'),
        chance = new Chance();
    var response = {};
    response.success = true;
    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({'success': false, 'error': 'Invalid Post Data'});

    var user    = undefined,
        group   = undefined,
        ticket  = undefined,
        plainTextPass = undefined;

    async.waterfall([
        function(next) {
            var userSchema = require('../../../models/user');
            plainTextPass = chance.string({length: 6, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'});

            user = new userSchema({
                username: postData.user.email,
                password: plainTextPass,
                fullname: postData.user.fullname,
                email: postData.user.email,
                role: 'user'
            });

            user.save(function(err, savedUser) {
                if (err) return next(err);

                return next(null, savedUser);
            });
        },

        function(savedUser, next) {
            //Group Creation
            var groupSchema = require('../../../models/group');
            group = new groupSchema({
                name: savedUser.email,
                members: [savedUser._id],
                sendMailTo: [savedUser._id],
                public: true
            });

            group.save(function(err, group) {
                if (err) return next(err);

                return next(null, group, savedUser);
            });
        },

        function(group, savedUser, next) {
            var settingsSchema = require('../../../models/setting');
            settingsSchema.getSettingByName('ticket:type:default', function(err, defaultType) {
                if (err) return next(err);

                if (defaultType.value)
                    return next(null, defaultType.value, group, savedUser);
                else
                    return next('Failed: Invalid Default Ticket Type.');
            });
        },

        function(defaultTicketType, group, savedUser, next) {
            //Create Ticket
            var ticketTypeSchema = require('../../../models/tickettype');
            ticketTypeSchema.getType(defaultTicketType, function(err, ticketType) {
                if (err) return next(err);

                var ticketSchema = require('../../../models/ticket');
                var HistoryItem = {
                    action: 'ticket:created',
                    description: 'Ticket was created.',
                    owner: savedUser._id
                };
                ticket = new ticketSchema({
                    owner: savedUser._id,
                    group: group._id,
                    type: ticketType._id,
                    priority: 1,
                    subject: postData.ticket.subject,
                    issue: postData.ticket.issue,
                    history: [HistoryItem],
                    subscribers: [savedUser._id]
                });

                var marked = require('marked');
                var tIssue = ticket.issue;
                tIssue = tIssue.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
                ticket.issue = marked(tIssue);

                ticket.save(function(err, t) {
                    if (err) return next(err);

                    emitter.emit('ticket:created', {hostname: req.headers.host, socketId: '', ticket: t});

                    return next(null, {user: savedUser, group: group, ticket: t});
                });
            });
        }

    ], function(err, result) {
        if (err) winston.debug(err);
        if (err) return res.status(400).json({'success': false, 'error': err.message});

        delete result.user.password;
        result.user.password = undefined;

        return res.json({success: true, userData: {savedUser: result.user, chancepass: plainTextPass}, ticket: result.ticket});
    });
};

/**
 * @api {get} /api/v1/tickets/:uid Get Single Ticket
 * @apiName singleTicket
 * @apiDescription Gets a ticket with the given UID.
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/1000
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Ticket"
 }
 */
api_articles.single = function(req, res) {
    var uid = req.params.uid;
    if (_.isUndefined(uid)) return res.status(200).json({'success': false, 'error': 'Invalid Ticket'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketByUid(uid, function(err, ticket) {
        if (err) return res.send(err);

        if (_.isUndefined(ticket)
            || _.isNull(ticket))
            return res.status(200).json({'success': false, 'error': 'Invalid Ticket'});

        ticket = _.clone(ticket._doc);
        if (!permissions.canThis(req.user.role, 'notes:view')) {
            delete ticket.notes;
        }

        return res.json({'success': true, 'ticket': ticket});
    });
};

/**
 * @api {put} /api/v1/tickets/:id Update Ticket
 * @apiName updateTicket
 * @apiDescription Updates ticket via given OID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -X PUT -d "{\"status\": {status},\"group\": \"{group}\"}"
 *      -l http://localhost/api/v1/tickets/{id}
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Updated Ticket Object
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_articles.update = function(req, res) {
    var user = req.user;
    if (!_.isUndefined(user) && !_.isNull(user)) {
        var permissions = require('../../../permissions');
        if (!permissions.canThis(user.role, 'ticket:update'))
            return res.status(401).json({success: false, error: 'Invalid Permissions'});
        var oId = req.params.id;
        var reqTicket = req.body;
        if (_.isUndefined(oId)) return res.status(400).json({success: false, error: "Invalid Post Data"});
        var ticketModel = require('../../../models/ticket');
        ticketModel.getTicketById(oId, function(err, ticket) {
            if (err) return res.status(400).json({success: false, error: "Invalid Post Data"});
            async.parallel([
                function(cb) {
                    if (!_.isUndefined(reqTicket.status)) {
                        ticket.setStatus(req.user, reqTicket.status, function (e, t) {
                            ticket = t;

                            cb();
                        });
                    } else {
                        cb();
                    }
                },
                function(cb) {
                    if (!_.isUndefined(reqTicket.group)) {
                        ticket.group = reqTicket.group._id;

                        ticket.populate('group', function() {
                             cb();
                        });
                    } else {
                        cb();
                    }
                },
                function(cb) {
                    if (!_.isUndefined(reqTicket.closedDate))
                        ticket.closedDate = reqTicket.closedDate;

                    cb();
                },
                function(cb) {
                    if (!_.isUndefined(reqTicket.tags) && !_.isNull(reqTicket.tags))
                        ticket.tags = reqTicket.tags;

                    cb();
                },
                function(cb) {
                    if (!_.isUndefined(reqTicket.issue) && !_.isNull(reqTicket.issue))
                        ticket.issue = reqTicket.issue;

                    cb();
                },
                function(cb) {
                    if (!_.isUndefined(reqTicket.assignee) && !_.isNull(reqTicket.assignee)) {
                        ticket.assignee = reqTicket.assignee;
                        ticket.populate('assignee', function(err, t) {
                            var HistoryItem = {
                                action: 'ticket:set:assignee',
                                description: t.assignee.fullname + ' was set as assignee',
                                owner: req.user._id
                            };

                            ticket.history.push(HistoryItem);

                            cb();
                        });
                    } else {
                        cb();
                    }
                }
            ], function() {
                ticket.save(function(err, t) {
                    if (err) {
                        return res.status(400).json({success: false, error: err.message});
                    }

                    if (!permissions.canThis(user.role, 'notes:view'))
                        t.notes = [];

                    emitter.emit('ticket:updated', t);

                    return res.json({
                        success: true,
                        error: null,
                        ticket: t
                    });
                });
            });
        });
    } else {
        return res.status(403).json({success: false, error: "Invalid Access Token"});
    }
};

/**
 * @api {delete} /api/v1/tickets/:id Delete Ticket
 * @apiName deleteTicket
 * @apiDescription Deletes ticket via given OID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/{id}
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_articles.delete = function(req, res) {
    var oId = req.params.id;
    var user = req.user;

    if (_.isUndefined(oId) || _.isUndefined(user)) return res.status(400).json({success: false, error: "Invalid Post Data"});



    var ticketModel = require('../../../models/ticket');
    ticketModel.softDelete(oId, function(err) {
        if (err) return res.status(400).json({success: false, error: "Invalid Post Data"});

        emitter.emit('ticket:deleted', oId);
        res.json({success: true, error: null});
    });
};

/**
 * @api {post} /api/v1/tickets/addcomment Add Comment
 * @apiName addComment
 * @apiDescription Adds comment to the given Ticket Id
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"comment\":\"{comment}\",\"owner\":{ownerId}, ticketId: \"{ticketId}\"}"
 *      -l http://localhost/api/v1/tickets/addcomment
 *
 * @apiParamExample {json} Request:
 * {
 *      "comment": "Comment Text",
 *      "owner": {OwnerId},
 *      "ticketid": {TicketId}
 * }
 *
 * @apiSuccess {boolean} success Successful
 * @apiSuccess {string} error Error if occurrred
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_articles.postComment = function(req, res) {
    var commentJson = req.body;
    var comment = commentJson.comment;
    var owner = commentJson.ownerId;
    var ticketId = commentJson._id;

    if (_.isUndefined(ticketId)) return res.status(400).json({success: false, error: "Invalid Post Data"});
    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, t) {
        if (err) return res.status(400).json({success: false, error: "Invalid Post Data"});

        if (_.isUndefined(comment)) return res.status(400).json({success: false, error: "Invalid Post Data"});

        var marked = require('marked');
        comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        var Comment = {
            owner: owner,
            date: new Date(),
            comment: marked(comment)
        };

        t.updated = Date.now();
        t.comments.push(Comment);
        var HistoryItem = {
            action: 'ticket:comment:added',
            description: 'Comment was added',
            owner: owner
        };
        t.history.push(HistoryItem);

        t.save(function(err, tt) {
            if (err) return res.status(400).json({success: false, error: err.message});

            if (!permissions.canThis(req.user.role, 'notes:view'))
                tt.notes = [];

            ticketModel.populate(tt, 'subscribers comments.owner', function(err) {
                if (err) return res.json({success: true, error: null, ticket: tt});

                emitter.emit('ticket:comment:added', tt, Comment, req.headers.host);

                return res.json({success: true, error: null, ticket: tt});
            });
        });
    });
};


/**
 * @api {get} /api/v1/tickets/types Get Ticket Types
 * @apiName getTicketTypes
 * @apiDescription Gets all available ticket types.
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/types
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_articles.getTypes = function(req, res) {
    var ticketType = require('../../../models/tickettype');
    ticketType.getTypes(function(err, types) {
        if (err) return res.status(400).json({error: "Invalid Post Data"});

        res.json(types);
    });
};

/**
 * @api {post} /api/v1/tickets/types/create Create Ticket Type
 * @apiName createType
 * @apiDescription Creates a new ticket type
 * @apiVersion 0.1.10
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"name\": \"TypeName\"}"
 *      -l http://localhost/api/v1/tickets/types/create
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {Object} tickettype Returns the newly create ticket type
 *
 */
api_articles.createType = function(req, res) {
    var typeName = req.body.name;
    if (_.isUndefined(typeName) || typeName.length < 3) return res.status(400).json({success: false, error: 'Invalid Type Name!'});

    var ticketTypeSchema = require('../../../models/tickettype');
    ticketTypeSchema.create({name: typeName}, function(err, ticketType) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true, tickettype: ticketType});
    })
};

/**
 * @api {put} /api/v1/tickets/types/:id Update Ticket Type
 * @apiName updateType
 * @apiDescription Updates given ticket type
 * @apiVersion 0.1.10
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X PUT -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/types/:id
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} tag Updated Ticket Type
 *
 */
api_articles.updateType = function(req, res) {
    var id = req.params.id;
    var data = req.body;
    if (_.isUndefined(id) || _.isNull(id) || _.isNull(data) || _.isUndefined(data))
        return res.status(400).json({success: false, error: 'Invalid Put Data'});

    var ticketTypeSchema = require('../../../models/tickettype');
    ticketTypeSchema.getType(id, function(err, type) {
        if (err) return res.status(400).json({success: false, error: err.message});

        type.name = data.name;

        type.save(function(err, t) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, type: t});
        });
    });
};

/**
 * @api {delete} /api/v1/tickets/types/:id Delete Ticket Type
 * @apiName deleteType
 * @apiDescription Deletes given ticket type
 * @apiVersion 0.1.10
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"newTypeId\": \"{ObjectId}\"}"
 *      -l http://localhost/api/v1/tickets/types/:id
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {number} updated Count of Tickets updated to new type
 *
 */
api_articles.deleteType = function(req, res) {
    var newTypeId = req.body.newTypeId;
    var delTypeId = req.params.id;

    if (_.isUndefined(newTypeId) || _.isUndefined(delTypeId))
        return res.status(400).json({success: false, error: 'Invalid POST data.'});

    var ticketTypeSchema = require('../../../models/tickettype');
    var ticketSchema = require('../../../models/ticket');
    var settingsSchema = require('../../../models/setting');
    async.waterfall([
        function(next) {
            settingsSchema.getSettingByName('mailer:check:ticketype', function(err, setting) {
                if (err) return next(err);
                if (setting.value.toString().toLowerCase() === delTypeId.toString().toLowerCase())
                    return next({custom: true, message: 'Type currently "Default Ticket Type" for mailer check.'});

                return next(null);
            });
        },
        function(next) {
            ticketSchema.updateType(delTypeId, newTypeId, next);
        },
        function(result, next) {
            ticketTypeSchema.getType(delTypeId, function(err, type) {
                if (err) return next(err);

                type.remove(function(err) {
                    if (err) return next(err);
                    return next(null, result);
                });
            });
        }
    ], function(err, result) {
        if (err) return res.status(400).json({success: false, error: err});
        return res.json({success: true, updated: result.nModified});
    });
};


/**
 * @api {get} /api/v1/tickets/count/tags Get Tags Count
 * @apiName getTagCount
 * @apiDescription Gets cached count of all tags
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/count/tags
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_articles.getTagCount = function(req, res) {
    var cache = global.cache;
    var timespan = req.params.timespan;
    if (_.isUndefined(timespan) || _.isNaN(timespan)) timespan = 0;

    if (_.isUndefined(cache))
        return res.status(400).send('Tag stats are still loading...');

    var tags = cache.get('tags:' + timespan + ':usage');

    res.json({success: true, tags: tags});
};


/**
 * @api {delete} /api/v1/tickets/:tid/attachments/remove/:aid Remove Attachment
 * @apiName removeAttachment
 * @apiDescription Remove Attachemtn with given Attachment ID from given Ticket ID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/:tid/attachments/remove/:aid
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidRequest Invalid Request
 * @apiError InvalidPermissions Invalid Permissions
 */
api_articles.removeAttachment = function(req, res) {
    var ticketId = req.params.tid;
    var attachmentId = req.params.aid;
    if (_.isUndefined(ticketId) || _.isUndefined(attachmentId)) return res.status(400).json({'error': 'Invalid Attachment'});

    //Check user perm
    var user = req.user;
    if (_.isUndefined(user)) return res.status(400).json({'error': 'Invalid User Auth.'});

    var permissions = require('../../../permissions');
    if (!permissions.canThis(user.role, 'tickets:removeAttachment')) return res.status(401).json({'error': 'Invalid Permissions'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, ticket) {
        if (err) return res.status(400).send('Invalid Ticket Id');
        ticket.getAttachment(attachmentId, function(a) {
            ticket.removeAttachment(user._id, attachmentId, function(err, ticket) {
                if (err) return res.status(400).json({'error': 'Invalid Request.'});

                var fs = require('fs');
                var path = require('path');
                var dir = path.join(__dirname, '../../../../public', a.path);
                if (fs.existsSync(dir)) fs.unlinkSync(dir);

                ticket.save(function(err, t) {
                    if (err) return res.status(400).json({'error': 'Invalid Request.'});

                    res.json({success: true, ticket: t});
                });
            });
        });
    });
};

/**
 * @api {put} /api/v1/tickets/:id/subscribe Subscribe/Unsubscribe
 * @apiName subscribeTicket
 * @apiDescription Subscribe/Unsubscribe user to the given ticket OID
 * @apiVersion 0.1.4
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X PUT -d "{\"user\": {user},\"subscribe\": {boolean}}" -l http://localhost/api/v1/tickets/{id}
 *
 * @apiParamExample {json} Request-Example:
   {
       "user": {user},
       "subscribe": {boolean}
   }
 *
 * @apiSuccess {boolean} success Successfully?
 *
 * @apiError InvalidPostData Invalid Post Data
 */
api_articles.subscribe = function(req, res) {
    var ticketId = req.params.id;
    var data = req.body;
    if (_.isUndefined(data.user) || _.isUndefined(data.subscribe)) return res.status(400).json({'error': 'Invalid Post Data.'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, ticket) {
        if (err) return res.status(400).json({'error': 'Invalid Ticket Id'});

        async.series([
            function(callback) {
                if (data.subscribe) {
                    ticket.addSubscriber(data.user, function() {
                        callback();
                    });
                } else {
                    ticket.removeSubscriber(data.user, function() {
                        callback();
                    });
                }
            }
        ], function() {
            ticket.save(function(err) {
                if (err) return res.status(400).json({'error': err});

                emitter.emit('ticket:subscribers:update');

                res.json({'success': true});
            });
        });
    });
};

/**
 * @api {post} /api/v1/tickets/addtag Add Ticket Tag
 * @apiName addTag
 * @apiDescription Adds a Ticket Tag
 * @apiVersion 0.1.6
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X POST -d "{\"tag\": {tag}}" -l http://localhost/api/v1/tickets/addtag
 *
 * @apiParamExample {json} Request-Example:
 {
     "tag": {tag}
 }
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} tag Saved Tag
 *
 * @apiError InvalidPostData Invalid Post Data
 */
api_articles.addTag = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data.tag)) return res.status(400).json({error: 'Invalid Post Data'});

    var tagSchema = require('../../../models/tag');
    var Tag = new tagSchema({
        name: data.tag
    });

    Tag.save(function(err, T) {
        if (err) return res.status(400).json({error: err.message});

        return res.json({success: true, tag: T});
    });
};

/**
 * @api {get} /api/v1/tickets/tags Get Ticket Tags
 * @apiName getTags
 * @apiDescription Gets all ticket tags
 * @apiVersion 0.1.6
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/tags
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} tags Array of Tags
 *
 */
api_articles.getTags = function(req, res) {
    var tagSchema = require('../../../models/tag');
    tagSchema.getTags(function(err, tags) {
        if (err) return res.status(400).json({success: false, error: err});

        _.each(tags, function(item) {
            item.__v = undefined;
        });

        res.json({success: true, tags: tags});
    });
};

/**
 * @api {put} /api/v1/tickets/tags/:id Update Tag
 * @apiName updateTag
 * @apiDescription Updates given ticket tag
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/tags/:id
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} tag Updated Tag
 *
 */
api_articles.updateTag = function(req, res) {
    var id = req.params.id;
    var data = req.body;
    if (_.isUndefined(id) || _.isNull(id) || _.isNull(data) || _.isUndefined(data))
        return res.status(400).json({success: false, error: 'Invalid Put Data'});

    var tagSchema = require('../../../models/tag');
    tagSchema.getTag(id, function(err, tag) {
        if (err) return res.status(400).json({success: false, error: err.message});

        tag.name = data.name;

        tag.save(function(err, t) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, tag: t});
        });
    });
};

/**
 * @api {delete} /api/v1/tickets/tags/:id Delete Tag
 * @apiName deleteTag
 * @apiDescription Deletes the given ticket tag
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/tags/:id
 *
 * @apiSuccess {boolean} success Successfully?
 *
 */
api_articles.deleteTag = function(req, res) {
    var id = req.params.id;
    if (_.isUndefined(id) || _.isNull(id)) return res.status(400).json({success: false, error: 'Invalid Tag Id'});

    async.series([
        function(next) {
            var ticketModel = require('../../../models/ticket');
            ticketModel.getAllTicketsByTag(id, function(err, tickets) {
                if (err) return next(err);
                async.each(tickets, function(ticket, cb) {
                    ticket.tags = _.reject(ticket.tags, function(o) { return o._id === id; });

                    ticket.save(function(err) {
                        return cb(err);
                    });

                }, function(err) {
                    if (err) return next(err);

                    return next(null);
                });
            });
        },
        function(next) {
            var tagSchema = require('../../../models/tag');
            tagSchema.findByIdAndRemove(id, function(err) {
                return next(err);
            });
        }
    ], function(err) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true});
    });
};


module.exports = api_articles;