﻿var umbraco = angular.module('umbraco');

umbraco.controller('FallbackTextstringController', ['$scope', 'assetsService', 'contentResource', 'editorState', function ($scope, assetsService, contentResource, editorState) {

    var templateDictionary = {};
    var template;

    assetsService
        .load([
            '~/App_Plugins/FallbackTextstring/lib/mustache.min.js'
        ])
        .then(function () {
            init();
        });

    $scope.onUseValueChange = function() {
        $scope.model.value.useValue = $scope.useValue === 'true';
    };

    function init() {
        if (!$scope.model.value.value) {
            $scope.model.value = {
                value: '',
                fallback: null,
                useValue: false
            }
        }

        if ($scope.model.value.hasValue && !$scope.model.value) {
            $scope.model.value.hasValue = false;
        }

        $scope.useValue = $scope.model.value.useValue.toString();

        template = $scope.model.config.fallbackTemplate;

        // Add current node to the template dictionary
        addToDictionary(editorState.getCurrent());

        var otherNodeIds = getOtherNodeIds();

        var promises = otherNodeIds.map((nodeId) => {
            return new Promise((resolve) => {
                contentResource.getById(nodeId).then(function(node) {
                    addToDictionary(node, true);
                }).catch(function (err) {
                    console.log(`Couldn't find node mentioned in template (${nodeId})`);
                }).finally(function() {
                    resolve();
                });
            });
        });

        // Update fallback all the nodes have been loaded into the dictionary
        Promise.all(promises).then(() => {
            updateFallbackValue();
        });
    }

    function updateFallbackValue() {
        $scope.model.value.fallback = Mustache.render(template, templateDictionary);
    }

    function addToDictionary(node, prefix) {
        var variant = node.variants[0];
        for (var tab of variant.tabs) {
            for (var property of tab.properties) {
                var key = prefix ? `${node.id}:${property.alias}` : property.alias;
                templateDictionary[key] = property.value;
            }
        }
    }

    function getOtherNodeIds() {
        var regex = new RegExp(/([0-9]+):/g);
        var matches = template.matchAll(regex);

        var nodeIds = [];
        for (var match of matches) {
            nodeIds.push(parseInt(match[1]));
        }

        return nodeIds;
    }
}]);