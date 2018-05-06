/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ========================================================================
 Created:    05/03/2017
 Modified:   Jay Han [Author:   Chris Brame]
 Modified:   Jay Han
 **/

var _ = require('lodash');
var redis = require('redis');
var winston = require('winston');

// var REDIS_PORT = process.env.REDIS_PORT || 6379;
// var REDIS_HOST = process.env.REDIS_HOST || 'localhost';

var client = redis.createClient(32819, '24.142.200.107');

client.on('error', function(err) {
    winston.warn(err);
});

var redisCache = {};

redisCache.setCache = function(key, value, callback, ttl) {
    if (!_.isArray(value))
        value = [value];
    if (!_.isUndefined(ttl)) {
        var importMulti = client.multi();
        var v = JSON.stringify(value);
        importMulti.hmset(rake('$trudesk', key), {data: v});
        importMulti.expire(rake('$trudesk', key), 600);

        // value.forEach(function(item) {
        //     var v = JSON.stringify(item);
        //     importMulti.hmset(rake('$trudesk', key), {_id: item._id.toString(), data: v});
        //     importMulti.expire(rake('$trudesk', key), 600);
        // });

        importMulti.exec(function(err) {
            if (err) return callback(err);

            client.quit();

            return callback();
        });

    } else {
        return client.set(key, value)
    }
};

redisCache.getCache = function(key, callback) {
    return client.hgetall(key, callback);
};

function rake() {
    return Array.prototype.slice.call(arguments).join(':');
}

module.exports = redisCache;