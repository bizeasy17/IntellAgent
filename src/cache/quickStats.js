/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ========================================================================
 Created:    02/24/2016
 Modified:   Jay Han [Author:   Chris Brame]
 Modified:   Jay Han
 **/

var _               = require('lodash');
var async           = require('async');
var ticketSchema    = require('../models/ticket');

_.mixin({
    'sortKeysBy': function (obj, comparator) {
        var keys = _.sortBy(_.keys(obj), function (key) {
            return comparator ? comparator(obj[key], key) : key;
        });

        return _.zipObject(keys, _.map(keys, function (key) {
            return obj[key];
        }));
    }
});

var init = function(tickets, callback) {
    var obj = {};
    var $tickets = [];

    async.series([
        function(done) {
            if (tickets) {
                ticketSchema.populate(tickets, {path: 'owner comments.owner assignee'}, function(err, _tickets) {
                    $tickets = _tickets;

                    return done();
                });
            } else {
                ticketSchema.getForCache(function(err, tickets) {
                    if (err) return done(err);

                    ticketSchema.populate(tickets, {path: 'owner comments.owner assignee'}, function(err, _tickets) {
                        if (err) return done(err);

                        $tickets = _tickets;

                        return done();
                    });
                });
            }
        },
        function(done) {
            buildMostRequester($tickets, function(result) {
                obj.mostRequester = _.first(result);

                return done();
            });
        },
        function(done) {
            buildMostComments($tickets, function(result) {
                obj.mostCommenter = _.first(result);

                return done();
            });
        },
        function(done) {
            buildMostAssignee($tickets, function(result) {
                obj.mostAssignee = _.first(result);

                return done();
            });
        },
        function(done) {
            buildMostActiveTicket($tickets, function(result) {
                obj.mostActiveTicket = _.first(result);

                return done();
            });
        }

    ], function(err) {
        $tickets = null; //clear it
        if (err) return callback(err);

        return callback(null, obj);
    });
};

function buildMostRequester(ticketArray, callback) {
    var requesters = _.map(ticketArray, function(m) {
        return m.owner.fullname;
    });

    var r = _.countBy(requesters, function(k) { return k; });
    r = _(r).value();

    r = _.map(r, function(v, k) {
        return { name: k, value: v};
    });

    r = _.sortBy(r, function(o) { return -o.value; });

    return callback(r);
}

function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

function buildMostComments(ticketArray, callback) {
    var commenters = _.map(ticketArray, function(m) {
        return _.map(m.comments, function(i) {
            return i.owner.fullname;
        });
    });

    commenters = flatten(commenters);

    var c = _.countBy(commenters, function(k) {
        return k;
    });

    c = _(c).value();

    c = _.map(c, function(v, k) {
        return { name: k, value: v};
    });

    c = _.sortBy(c, function(o) { return -o.value; });

    return callback(c);
}

function buildMostAssignee(ticketArray, callback) {
    ticketArray = _.reject(ticketArray, function(v) {
        return (_.isUndefined(v.assignee) || _.isNull(v.assignee));
    });

    var assignees = _.map(ticketArray, function(m) {
        return m.assignee.fullname;
    });

    var a = _.countBy(assignees, function(k) { return k; });

    a = _(a).value();

    a = _.map(a, function(v, k) {
        return { name: k, value: v};
    });

    a = _.sortBy(a, function(o) { return -o.value; });

    return callback(a);
}

function buildMostActiveTicket(ticketArray, callback) {
    var tickets = _.map(ticketArray, function(m) {
        return {uid: m.uid, cSize: _.size(m.history) };
    });

    tickets = _.sortBy(tickets, 'cSize').reverse();

    return callback(tickets);
}

module.exports = init;