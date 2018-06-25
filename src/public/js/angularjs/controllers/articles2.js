'use strict';

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'angularjs/services/session', 'marked', 'editormd', 'history'], function (angular, _, $, helpers, editormd) {
    return angular.module('trudesk.controllers.articles', [])
        .controller('createArticleCtrl', function (SessionService, md, $scope, $http, $timeout, $log) {
            // var testEditor = testEditor;
            
            var testEditor = editormd("test-editormd", {
                width: "100%",
                height: "100%",
                path: '/js/lib/',
                markdown: md,
                // codeFold: true,
                searchReplace: true,
                saveHTMLToTextarea: true,                // 保存HTML到Textarea
                htmlDecode: "style,script,iframe|on*",       // 开启HTML标签解析，为了安全性，默认不开启    
                emoji: true,
                taskList: true,
                tex: true,
                tocm: true,         // Using [TOCM]
                autoLoadModules: false,
                previewCodeHighlight: true,
                flowChart: true,
                sequenceDiagram: true,
                //dialogLockScreen : false,   // 设置弹出层对话框不锁屏，全局通用，默认为true
                //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为true
                //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为true
                //dialogMaskOpacity : 0.4,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
                //dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
                imageUpload: true,
                imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
                imageUploadURL: "./php/upload.php",
                onload: function () {
                    console.log('onload', this);
                    //this.fullscreen();
                    //this.unwatch();
                    //this.watch().fullscreen();

                    //this.setMarkdown("#PHP");
                    //this.width("100%");
                    //this.height(480);
                    //this.resize("100%", 640);
                }
            });

            var editor = testEditor;

            $scope.loggedInAccount = SessionService.getUser();

            $scope.init = function () {
                
                // console.log(editor.getPreviewedHTML());
                // alert("create article alert");
                // var testEditor;

                // testEditor = editormd("test-editormd", {
                //     // 
                //     width: "100%",
                //     height: 640,
                //     syncScrolling: "single",
                //     path: "./lib"
                // });
            }
            $scope.init();

            $scope.publishArticle = function($event) {
                // alert('here');
                $event.preventDefault();
                //$log.log('[trudesk:organizations:createGroup] - Info: enter the create function');
                var formData = $('#createArticleForm').serializeObject();
                var tags = {id: '5aef10be7d151d1124c0440e'}; 
                var systems = {};
                var services = {};

                var apiData = {
                    author: $scope.loggedInAccount._id,
                    subject: formData.aSubject,
                    content: formData.aContent,
                    contentHtml: editor.getPreviewedHTML(),
                    excerpt: formData.aContent.substring(0,100),
                    category: formData.aCategory
                    // tags: tags,
                    // systems: systems,
                    // services: services,
                    // organization: formData.aOrganization,
                    // commentStatus: formData.aCommentStatus
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/article/post',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json' }
                })
                    .success(function () {
                        helpers.UI.showSnackbar('Publish Article Successfully', false);
                        // UIkit.modal("#groupCreateModal").hide();
                        History.pushState(null, null, '/articles');
                    })
                    .error(function (err) {
                        $log.log('[trudesk:articles:publishArticle] - Error: ' + err);
                        helpers.UI.showSnackbar(err, true);
                    })
            }
    });
});

// 'use strict';

// angular.module('trudesk.controllers.articles', ['hc.marked', 'hljs', 'angular-markdown-editor'])
//     .config(['markedProvider', 'hljsServiceProvider', function (markedProvider, hljsServiceProvider) {
//         // marked config
//         markedProvider.setOptions({
//             gfm: true,
//             tables: true,
//             sanitize: true,
//             highlight: function (code, lang) {
//                 if (lang) {
//                     return hljs.highlight(lang, code, true).value;
//                 } else {
//                     return hljs.highlightAuto(code).value;
//                 }
//             }
//         });

//         // highlight config
//         hljsServiceProvider.setOptions({
//             // replace tab with 4 spaces
//             tabReplace: '    '
//         });
//     }])
//     .controller("articlesCtrl", ["$rootScope", "$scope", "marked", function MarkdownController($rootScope, $scope, marked) {
//         $scope.editor1 = "*This* **is** [markdown](https://daringfireball.net/projects/markdown/)\n and `{{ 1 + 2 }}` = {{ 1 + 2 }}";
//         $scope.markdownService = marked('#TEST');

//         // --
//         // normal flow, function call
//         $scope.convertMarkdown = function () {
//             vm.convertedMarkdown = marked(vm.markdown);
//         }

//         /**
//          * For some convenience, Angular-Markdown-Editor Directive also save each Markdown Editor inside $rootScope
//          * Each of editor object are available through their $rootScope.markdownEditorObjects[editorName]
//          *
//          * Example: <textarea name="editor1" markdown-editor="{'iconlibrary': 'fa'}"></textarea>
//          * We would then call our object through $rootScope.markdownEditorObjects.editor1
//          */
//         $scope.fullScreenPreview = function () {
//             $rootScope.markdownEditorObjects.editor1.showPreview();
//             $rootScope.markdownEditorObjects.editor1.setFullscreen(true);
//         }

//         /** Markdown event hook onFullscreen, in this example we will automatically show the result preview when going in full screen
//          * the argument (e) is the actual Markdown object returned which help call any of API functions defined in Markdown Editor
//          * For a list of API functions take a look on official demo site http://www.codingdrama.com/bootstrap-markdown/
//          * @param object e: Markdown Editor object
//          */
//         $scope.onFullScreenCallback = function (e) {
//             e.showPreview();
//         }

//         /** After exiting from full screen, let's go back to editor mode (which mean hide the preview)
//          * NOTE: If you want this one to work, you will have to manually download the JS file, not sure why but they haven't released any versions in a while
//          *       https://github.com/toopay/bootstrap-markdown/tree/master/js
//          */
//         $scope.onFullScreenExitCallback = function (e) {
//             e.hidePreview();
//         }

//     }]);
