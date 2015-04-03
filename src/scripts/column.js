/*
* The MIT License
*
* Copyright (c) 2015, Sebastian Sdorra
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/


/* global angular */
angular.module('adf')
    .directive('adfDashboardColumn', function ($log, $compile, adfTemplatePath, rowTemplate, dashboard) {
        'use strict';

        /**
         * converts string to boolean
         */
        function stringToBoolean(string){
            switch(string !== null ? string.toLowerCase() : null){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
            }
        }

        /**
         * moves a widget in between a column
         */
        function moveWidgetInColumn($scope, column, evt){
          var widgets = column.widgets;
          // move widget and apply to scope
          $scope.$apply(function(){
            widgets.splice(evt.newIndex, 0, widgets.splice(evt.oldIndex, 1)[0]);
          });
        }

        /**
         * finds a widget by its id in the column
         */
        function findWidget(column, index){
          var widget = null;
          for (var i=0; i<column.widgets.length; i++){
            var w = column.widgets[i];
            if (w.wid == index){
              widget = w;
              break;
            }
          }
          return widget;
        }

        /**
         * finds a column by its id in the model
         */
        function findColumn(model, index){
          var column = null;
          for (var i=0; i<model.rows.length; i++){
            var r = model.rows[i];
            for (var j=0; j<r.columns.length; j++){
              var c = r.columns[j];
              if ( c.cid == index ){
                column = c;
                break;
              } else if (c.rows){
                column = findColumn(c, index);
              }
            }
            if (column){
              break;
            }
          }
          return column;
        }

        /**
         * adds a widget to a column
         */
        function addWidgetToColumn($scope, model, targetColumn, evt){
          // find source column
          var cid = evt.from.getAttribute('rel');
          var sourceColumn = findColumn(model, cid);

          if (sourceColumn){
            // find moved widget
            var wid = evt.item.getAttribute('rel');
            var widget = findWidget(sourceColumn, wid);

            if (widget){
              // add new item and apply to scope
              $scope.$apply(function(){
                targetColumn.widgets.splice(evt.newIndex, 0, widget);
              });
            } else {
              $log.warn('could not find widget with id ' + wid);
            }
          } else {
            $log.warn('could not find column with id ' + cid);
          }
        }

        /**
         * removes a widget from a column
         */
        function removeWidgetFromColumn($scope, column, evt){
          // remove old item and apply to scope
          $scope.$apply(function(){
            column.widgets.splice(evt.oldIndex, 1);
          });
        }

        /**
         * enable sortable
         */
        function applySortable($scope, $element, model, column){
          // enable drag and drop
          var el = $element[0];
          var sortable = Sortable.create(el, {
            group: 'widgets',
            handle: '.glyphicon-move',
            ghostClass: 'placeholder',
            animation: 150,
            onAdd: function(evt){
              addWidgetToColumn($scope, model, column, evt);
            },
            onRemove: function(evt){
              removeWidgetFromColumn($scope, column, evt);
            },
            onUpdate: function(evt){
              moveWidgetInColumn($scope, column, evt);
            }
          });

          // destroy sortable on column destroy event
          $element.on('$destroy', function () {
            sortable.destroy();
          });
        }

        return {
            restrict: "E",
            replace: true,
            scope: {
                column: "=",
                editMode: "@",
                adfModel: "=",
                sortableOptions: "="
            },
            templateUrl: adfTemplatePath + "dashboard-column.html",
            link: function ($scope, $element, $attr) {
                // set id
                var col = $scope.column;
                if (!col.cid){
                  col.cid = dashboard.id();
                }

                // pass edit mode
                $attr.$observe('editMode', function (value) {
                    $scope.editMode = stringToBoolean(value);
                });

                if (angular.isDefined(col.rows) && angular.isArray(col.rows)) {
                    // be sure to tell Angular about the injected directive and push the new row directive to the column
                    $compile(rowTemplate)($scope, function (cloned) {
                        $element.append(cloned);
                    });
                } else {
                  // enable drag and drop for widget only columns
                  applySortable($scope, $element, $scope.adfModel, col);
                }
            }
        };
    });
