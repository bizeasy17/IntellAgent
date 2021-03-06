/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/03/2017
 Modified:   Jay Han [Author:   Chris Brame]

 **/

var pluginHelpers = {};

pluginHelpers.checkPermissions = function(userRole, permissions) {
    if (userRole === undefined || permissions === undefined)
        return false;

    var permissionArray = permissions.split(' ');
    var result = false;
    for (var i = 0; i < permissionArray.length; i++) {
        if (userRole.toString().toLowerCase() === permissionArray[i].toString().toLowerCase())
            result = true;
    }

    return result;
};


module.exports = pluginHelpers;