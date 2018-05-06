/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ========================================================================
 Created:    02/15/2016
 Modified:   Jay Han [Author:   Chris Brame]
 Modified:   Jay Han
 **/

var _               = require('lodash');
var async           = require('async');
var moment          = require('moment');

var ticketSchema    = require('../models/ticket');

var init = function(tickets, timespan, callback) {
    var tags = [];
    var $tickets = [];
    if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = 99999;

    var today = moment().hour(23).minute(59).second(59);
    var tsDate = today.clone().subtract(timespan, 'd').toDate().getTime();
    today = today.toDate().getTime();

    async.series([
        function(done) {
            if (tickets) {
                ticketSchema.populate(tickets, {path: 'tags'}, function(err, _tickets) {
                    if (err) return done(err);

                    $tickets = _tickets;
                    return done();
                });
            } else {
                ticketSchema.getForCache(function(err, tickets) {
                    if (err) return done(err);
                    ticketSchema.populate(tickets, {path: 'tags'}, function(err, _tickets) {
                        if (err) return done(err);

                        $tickets = _tickets;

                        return done();
                    });
                });
            }
        },
        function(done) {
            var t = [];

            $tickets = _.filter($tickets, function(v) {
                return (v.date < today && v.date > tsDate);
            });

            for (var i = 0; i < $tickets.length; i++) {
                _.each(tickets[i].tags, function(tag) {
                    t.push(tag.name);
                });
            }

            tags = _.reduce(t, function(counts, key) {
                counts[key]++;
                return counts;
            }, _.fromPairs(_.map(t, function(key) {
                return [key, 0];
            })));

            tags = _.fromPairs(_.sortBy(_.toPairs(tags), function(a){ return a[1]}).reverse());

            return done();
        }

    ], function(err) {
        if (err) return callback(err);

        $tickets = null; //clear it

        return callback(null, tags);
    });
};

module.exports = init;