
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

/*
 Permissions for TruDesk. Define Roles / Groups.
 --- group:action action action

 *                              = all permissions for grp
 create                         = create permission for grp
 delete                         = delete permission for grp
 edit                            = edit permission for grp
 editSelf                       = edit Self Created Items
 assignee                       = allowed to be assigned to a ticket
 view                           = view permission for grp

 ticket:attachment              = can add attachment
 ticket:removeAttachment        = can remove attachment
 ticket:viewHistory             = can view ticket history on single page
 ticket:setAssignee             = can set ticket Assignee
 ticket:public                  = can view public created tickets
 ticket:notifications_create    = send notification on ticket created

 notes:                         = Internal Notes on tickets

 plugins:manage                 = user can add/remove Plugins
 */
var roles = {
    admin: {
        id: "admin",
        name: "Administrators",
        description: "Administrators",
        allowedAction: ["*"]
    },
    // 2018-5-9 JH add organization related role:action pair. START
    adminOrg: {
        id: "adminOrg",
        name: "AdminOrganization",
        description: "Organization Administrators",
        allowedAction: ["users:create editSelf view delete", "groups:create editSelf view delete", "organizations:create editSelf view delete", "notices:create editSelf view delete", "settings:*"]
    },
    // END
    // 2018-5-9 JH add article related role:action pair. START
    // 2018-5-9 for moderator, can view articles only
    mod: {
        id: "mod",
        name: "Moderators",
        description: "Moderators",
        allowedAction: ["mod:*", "ticket:create edit view attachment removeAttachment", "comment:*", "notes:*", "reports:view", "articles:view"]
    },
    // 2018-5-9 for support, can create,edit,view,delete (only for self created) articles
    support: {
        id: "support",
        name: "Support",
        description: "Support User",
        allowedAction: ["ticket:*", "accounts:create edit view delete", "comment:editSelf create delete", "notes:create view", "reports:view", "notices:*", "articles:create edit view delete"]
    },
    // 2018-5-9 for user, can view, comments articles
    user: {
        id: "user",
        name: "User",
        description: "User",
        allowedAction: ["ticket:create editSelf attachment", "comment:create editSelf", "articles:view"]
    }
    // END
};

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = roles;
    }
} else {
    window.ROLES = roles;
}