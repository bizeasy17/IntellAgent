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

var mongoose = require('mongoose');

var COLLECTION = 'articlecategory';

/**
 * ArticleCategory Schema
 * @module models/articlecategory
 * @class ArticleCategory

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Article Category Type
 */
var articleCategorySchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: false },
    org:        { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: false },
    isDefault:  { type: Boolean, default: false, required: true },
    createDate: { type: Date, default: Date.now, required: true },
    editDate:   { type: Date }
});

/**
 * Return all Article Categories
 *
 * @memberof ArticleCategory
 * @static
 * @method getCategories
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
articleCategorySchema.statics.getCategories = function(callback) {
    var q = this.model(COLLECTION).find({});

    return q.exec(callback);
};

/**
 * Return Single Article Category Types
 *
 * @memberof ArticleCategory
 * @static
 * @method getCategory
 *
 * @param {String} id Object Id of article category type
 * @param {QueryCallback} callback MongoDB Query Callback
 */
articleCategorySchema.statics.getCategory = function(id, callback) {
    var q = this.model(COLLECTION).findOne({_id: id});

    return q.exec(callback);
};

/**
 * Return Single Article Category based on given category name
 *
 * @memberof ArticleCategory
 * @static
 * @method getCategoryByName
 *
 * @param {String} name Name of Article Category Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
articleCategorySchema.statics.getCategoryByName = function(name, callback) {
    var q = this.model(COLLECTION).findOne({name: name});

    return q.exec(callback);
};

/**
 * Return Single Article Category based on given category name
 *
 * @memberof ArticleCategory
 * @static
 * @method getCategoryByName
 *
 * @param {String} name Name of Article Category Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
articleCategorySchema.statics.getCategoriesByOrg = function (org, callback) {
    var q = this.model(COLLECTION).find({ org: org });

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, articleCategorySchema);