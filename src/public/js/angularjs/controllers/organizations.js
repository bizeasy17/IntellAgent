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
    return angular.module('trudesk.controllers.organizations', [])
        .controller('organizationsCtrl', function($scope, $http, $timeout, $log) {
            $scope.createOrganization = function () {
                var formData = $('#createOrganizationForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    members: formData.gMembers
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/organizations/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function () {
                        helpers.UI.showSnackbar('Organization Created Successfully', false);
                        UIkit.modal("#organizationCreateModal").hide();
                        //Refresh Grid
                        $timeout(function () {
                            refreshGrid();
                        }, 0);
                    })
                    .error(function (err) {
                        $log.log('[trudesk:organizations:createOrganization] - Error: ' + err);
                        helpers.UI.showSnackbar(err, true);
                    })
            };
        });
});