/*
    8888                            88   88         88
     88             88              88   88   88   88 88                               88
     88    8888   888888    8888    88   88       88   88  888888    8888     8888   888888
     88   88   88   88    88888888  88   88   88  8888888  88  88  88888888  88   88   88
     88   88   88   88 88  88       88   88   88  88   88  888888  88        88   88   88 88
    8888  88   88    888    88888   8889 8889 88  88   88      88    88888   88   88   8888
                                                          8888888
 ===========================================================================================
 Created:    05/17/2017
 Modified:   Jay Han

 **/

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'uikit', 'history'], function(angular, _, $, helpers, UIkit) {
    return angular.module('trudesk.controllers.articles', [])
        .controller('articlesCtrl', function($scope, $http, $timeout, $log) {

            $scope.editArticles = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target))
                    return false;
                var self = $($event.target);
                var groupId = self.attr('data-group-id');

                $http.get(
                    '/api/v1/articles/' + groupId
                )
                    .success(function(data) {
                        var group = data.group;
                        var form = $('#editArticleForm');
                        form.find('#__EditId').text(group._id);
                        form.find('#gName').val(group.name).parent().addClass('md-input-filled');
                        var $members = form.find('#gMembers')[0].selectize;
                        var $sendMailTo = form.find('#gSendMailTo')[0].selectize;

                        _.each(group.members, function(i) {
                            if (i)
                                $members.addItem(i._id, true);
                        });

                        _.each(group.sendMailTo, function(i) {
                            if (i)
                                $sendMailTo.addItem(i._id, true);
                        });

                        $members.refreshItems();
                        $sendMailTo.refreshItems();

                        UIkit.modal('#articleEditModal').show();
                    })
                    .error(function(err) {
                        $log.log('[trudesk:articles:editArticle] - Error: ' + err);
                        helpers.UI.showSnackbar(err, true);
                    });
            };

            $scope.saveEditArticle = function($event) {
                var id = $($event.target).parents('form').find('#__EditId').text();
                if (_.isUndefined(id)) {
                    helpers.UI.showSnackbar('Unable to get Group ID', true);
                    return false;
                }
                var formData = $('#editOrganizationForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    members: formData.gMembers,
                    sendMailTo: formData.gSendMailTo
                };

                $http({
                    method: 'PUT',
                    url: '/api/v1/articles/' + id,
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function() {
                        helpers.UI.showSnackbar('Articles Saved Successfully', false);
                        UIkit.modal('#articleEditModal').hide();
                        //Refresh Grid
                        refreshGrid();
                    })
                    .error(function(err) {
                        $log.log('[trudesk:groups:saveEditOrganization] - Error: ' + err);
                        helpers.UI.showSnackbar(err.error, true);
                    });
            };

            $scope.createArticle = function() {
                var formData = $('#createOrganizationForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    members: formData.gMembers,
                    sendMailTo: formData.gSendMailTo
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/organizations/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function() {
                        helpers.UI.showSnackbar('Organization Created Successfully', false);
                        UIkit.modal("#articleCreateModal").hide();
                        //Refresh Grid
                        $timeout(function() {
                            refreshGrid();
                        }, 0);
                    })
                    .error(function(err) {
                        $log.log('[trudesk:organizations:create] - Error: ' + err);
                        helpers.UI.showSnackbar(err, true);
                    })
            };

            $scope.deleteArticle = function(event) {
                event.preventDefault();
                var self = $(event.target);
                var groupID = self.attr('data-group-id');
                var card = self.parents('.tru-card-wrapper');
                if (groupID) {
                    UIkit.modal.confirm(
                    'Are you sure you want to delete group: <strong>' + card.find('h3').attr('data-group-name') + '</strong>'
                    , function() {
                            helpers.showLoader(0.8);
                            $http.delete(
                            '/api/v1/groups/' + groupID
                        )
                            .success(function() {
                                helpers.hideLoader();
                                helpers.UI.showSnackbar('Group Successfully Deleted', false);

                                card.remove();
                                UIkit.$html.trigger('changed.uk.dom');
                            })
                            .error(function(err) {
                                helpers.hideLoader();
                                $log.log('[trudesk:groups:deleteGroup] - Error: ' + err.error);
                                helpers.UI.showSnackbar(err.error, true);
                            });
                    }, {
                        labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-danger'
                    });
                }
            };

            function refreshGrid() {
                var $cards = $('#group_list').find('.tru-card-wrapper');
                $cards.each(function() {
                    var vm = this;
                    var self = $(vm);
                    self.remove();
                });

                $http.get('/api/v1/groups/all')
                    .success(function(data) {
                        var $groupList = $('#group_list');

                        var html = '';
                        _.each(data.groups, function(group) {
                            html += buildHTML(group);
                        });

                        var $injector = angular.injector(["ng", "trudesk"]);
                        $injector.invoke(["$compile", "$rootScope", function ($compile, $rootScope) {
                            var $scope = $groupList.append(html).scope();
                            $compile($groupList)($scope || $rootScope);
                            $rootScope.$digest();
                        }]);

                        UIkit.$html.trigger('changed.uk.dom');
                    })
                    .error(function(err) {
                        $log.log('[trudesk:groups:refreshGrid] - Error: ' + err.error);
                        helpers.UI.showSnackbar(err.error, true);
                    })

            }
        });
});