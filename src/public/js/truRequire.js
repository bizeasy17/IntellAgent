//This gets loaded for accessing require from outside Webpack bundle.
var allMods = {
    jquery: function() { return require('jquery'); },
    snackbar: function() { return require('snackbar'); },
    underscore: function() { return require('underscore'); },
    helpers: function() { return require('modules/helpers'); },
    datatables: function() { return require('datatables'); },
    dt_ipaddress: function() { return require('dt_ipaddress'); },
    dt_scroller: function() { return require('dt_scroller'); },
    uikit: function() { return require('uikit'); }//,
    //2018-5-27, JH add i18next for Angular START, can not build
    //ng_i18next: function() { return require('ng-i18next'); }
    //END
    //2018-6-9, JH markdown editor start
    // md_editor: function() {return require('md_editor')}
    //end
};

module.exports = function (modules, cb) {
    var loadedModules = modules.map(function(x) {
        return allMods[x]();
    });

    cb(loadedModules);
};