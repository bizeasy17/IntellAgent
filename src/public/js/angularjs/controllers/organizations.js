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
            $scope.editOrganization = function ($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target))
                    return false;
                var self = $($event.target);
                var orgId = self.attr('data-organization-id');

                $http.get(
                    '/api/v1/organizations/' + orgId
                )
                    .success(function (data) {
                        var organization = data.organization;
                        var form = $('#editOrganizationForm');
                        form.find('#__EditId').text(organization._id);
                        form.find('#gName').val(organization.name).prop('disabled', true).parent().addClass('md-input-filled');
                        form.find('#gShortName').val(organization.shortName).parent().addClass('md-input-filled');
                        form.find('#gType').val(organization.type).parent().addClass('md-input-filled');
                        form.find('#gCity').val(organization.city).parent().addClass('md-input-filled');
                        form.find('#gAddress1').val(organization.address1).parent().addClass('md-input-filled');
                        form.find('#gAddress2').val(organization.address2).parent().addClass('md-input-filled');
                        form.find('#gAddress3').val(organization.address3).parent().addClass('md-input-filled');

                        UIkit.modal('#organizationEditModal').show();
                    })
                    .error(function (err) {
                        $log.log('[trudesk:organization:editOrganization] - Error: ' + err);
                        helpers.UI.showSnackbar(err, true);
                    });
            };

            $scope.saveEditOrganization = function ($event) {
                var id = $($event.target).parents('form').find('#__EditId').text();
                if (_.isUndefined(id)) {
                    helpers.UI.showSnackbar('Unable to get Organization ID', true);
                    return false;
                }
                var formData = $('#editOrganizationForm').serializeObject();
                var apiData = {
                    // name: formData.gName,
                    shortName: formData.gShortName,
                    // members: formData.gMembers,
                    type: formData.gType,
                    city: formData.gCity,
                    address1: formData.gAddress1,
                    address2: formData.gAddress2,
                    address3: formData.gAddress3
                };

                $http({
                    method: 'PUT',
                    url: '/api/v1/organizations/' + id,
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function () {
                        helpers.UI.showSnackbar('Organization Saved Successfully', false);
                        UIkit.modal('#organizationEditModal').hide();
                        //Refresh Grid
                        refreshGrid();
                    })
                    .error(function (err) {
                        $log.log('[trudesk:organization:saveEditOrganization] - Error: ' + err);
                        helpers.UI.showSnackbar(err.error, true);
                    });
            };
            
            $scope.createOrganization = function () {
                //var msg = i18next('organization.created-smsg');
                var formData = $('#createOrganizationForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    shortName: formData.gShortName,
                    // members: formData.gMembers,
                    type: formData.gType,
                    city: formData.gCity,
                    address1: formData.gAddress1,
                    address2: formData.gAddress2,
                    address3: formData.gAddress3
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/organizations/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function () {
                        helpers.UI.showSnackbar('Organization Created Successfully', false);//$i18next.t('organization.created-smsg'), false);//;
                        UIkit.modal("#organizationCreateModal").hide();
                        //Refresh Grid
                        $timeout(function () {
                            refreshGrid();
                        }, 0);
                    })
                    .error(function (err) {
                        $log.log('[trudesk:organizations:createOrganization] - Error: ' + err);
                        helpers.UI.showSnackbar(err.error, true);
                    })
            };

            $scope.deleteOrganization = function (event) {
                event.preventDefault();
                var self = $(event.target);
                var orgID = self.attr('data-organization-id');
                var card = self.parents('.tru-card-wrapper');
                if (orgID) {
                    UIkit.modal.confirm(
                        'Are you sure you want to delete organization: <strong>' + card.find('h3').attr('data-organization-name') + '</strong>'
                        , function () {
                            helpers.showLoader(0.8);
                            $http.delete(
                                '/api/v1/organizations/' + orgID
                            )
                                .success(function () {
                                    helpers.hideLoader();
                                    helpers.UI.showSnackbar('Organization Successfully Deleted', false);

                                    card.remove();
                                    UIkit.$html.trigger('changed.uk.dom');
                                })
                                .error(function (err) {
                                    helpers.hideLoader();
                                    $log.log('[trudesk:organizations:deleteOrganization] - Error: ' + err.error);
                                    helpers.UI.showSnackbar(err.error, true);
                                });
                        }, {
                            labels: { 'Ok': 'Yes', 'Cancel': 'No' }, confirmButtonClass: 'md-btn-danger'
                        });
                }
            };

            function refreshGrid() {
                var $cards = $('#group_list').find('.tru-card-wrapper');//JH, workaround
                $cards.each(function () {
                    var vm = this;
                    var self = $(vm);
                    self.remove();
                });

                $http.get('/api/v1/organizations/get')
                    .success(function (data) {
                        var $orgList = $('#group_list');//workaround for not layout correct; still using #group_list as ID

                        var html = '';
                        _.each(data.organizations, function (org) {
                            html += buildHTML(org);
                        });

                        var $injector = angular.injector(["ng", "trudesk"]);
                        $injector.invoke(["$compile", "$rootScope", function ($compile, $rootScope) {
                            var $scope = $orgList.append(html).scope();
                            $compile($orgList)($scope || $rootScope);
                            $rootScope.$digest();
                        }]);

                        UIkit.$html.trigger('changed.uk.dom');
                    })
                    .error(function (err) {
                        $log.log('[trudesk:organizations:refreshGrid] - Error: ' + err.error);
                        helpers.UI.showSnackbar(err.error, true);
                    })

            }

            function buildHTML(org) {
                var html = '';
                html += '<div class="tru-card-wrapper" data-uk-filter="' + org.name + '">';
                html += '<div class="tru-card tru-card-hover">';
                html += '<div class="tru-card-head">';
                html += '<div class="tru-card-head-menu" data-uk-dropdown="{pos: \'bottom-right\',mode:\'click\'}">';
                html += '<i class="material-icons tru-icon">&#xE5D4;</i>';
                html += '<div class="uk-dropdown uk-dropdown-small">';
                html += '<ul class="uk-nav">';
                html += '<li><a href="#" class="no-ajaxy" data-organization-id="' + org._id + '" ng-click="editOrganization($event)">Edit</a></li>';
                html += '<li><a href="#" class="no-ajaxy" data-organization-id="' + org._id + '" ng-click="deleteOrganization($event)">Remove</a></li>';
                html += '</ul>';
                html += '</div>';
                html += '</div>';
                html += '<h3 class="tru-card-head-text uk-text-center" style="padding-top:60px;">';
                html += org.name;
                html += '<span class="uk-text-truncate">';
                html += _.size(org.members).toString() + ' ' + (_.size(org.members) === 1 ? 'member' : 'members');
                html += '</span>';
                html += '</h3>';
                html += '</div>';
                html += '</div>';
                html += '</div>';

                return html;
            }
        });
});