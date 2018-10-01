'use strict';
this.olive = {};
//------------------------------------------------------------------------
olive.utils = (function () {
  var _utils = {
    showError: function (error, parentDom) {
      console.log(error);
      $('<div class="alert alert-danger fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Error occurred:<br><pre>' + error + '</pre></div>')
        .fadeTo(5000, 500)
        .appendTo((parentDom != null) ? parentDom : $('#mainContainer'));
    },

    showSuccess: function (info, parentDom) {
      console.log(info);
      $('<div class="alert alert-success fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + info + '</div>')
        .fadeTo(5000, 500)
        .slideUp(500, function () {
            $(this).remove();
        })
        .appendTo((parentDom != null) ? parentDom : $('#mainContainer'));
    },

    callService: function (url, paramsQueryString, postData, successCallback, failureCallback) {
      var serviceUrl = url + (paramsQueryString != null ? '?' + paramsQueryString : '');
      var ajaxConfig = {
        type: 'GET',
        url: serviceUrl,
        dataType: 'json',
        async: true,
        success: function (data, status) {
          if (data.status == 0)
            successCallback(data.data);
          else
            failureCallback('Internal error: ' + data.error);
        },
        error: function (request, status, error) {
          failureCallback('Error contacting the service: ' + serviceUrl + ' : ' + status + ' ' + error);
        }
      };

      if (postData != null) {
        ajaxConfig.type = 'POST';
        ajaxConfig.processData = false;
        if (!(postData instanceof ArrayBuffer)) {
          ajaxConfig.contentType = 'application/json';
          ajaxConfig.data = postData;
        } else {
          ajaxConfig.contentType = 'application/octet-stream';
          ajaxConfig.data = postData;
        }
      }

      $.ajax(ajaxConfig);
    },

    createDialogBootstrap: function (content, title, okCallback, onSuccessCallback, onContentLoadedCallback) {
      var modalDiv = document.createElement('div');
      $(modalDiv)
      .prependTo($(document.body))
      .addClass('modal')
      .addClass('fade')
      .attr('role', 'dialog')
      .attr('tabindex', '-1')
      .append(
        $('<div class="modal-dialog" role="document">').append(
          $('<div class="modal-content">').append(
            $('<div class="modal-header">').append(
              $('<button title="Close" type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>')).append(
              $('<h4 class="modal-title">' + title + '</h4>'))).append(
            $('<div class="modal-body">').append(content)).append(
            $('<div class="modal-footer">').append(
              $('<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>')).append(
              $('<button type="button" class="btn btn-primary">Continue</button>').click(function () {
                var ok = false;
                if (okCallback != null && typeof okCallback === 'function')
                  ok = okCallback.call();
                if (ok === true) {
                  $(modalDiv).modal('hide');
                  onSuccessCallback.call();
                }
              }))))).on('hidden.bs.modal', function () {
        modalDiv.outerHTML = '';
      }).on('shown.bs.modal', function () {
        //$(modalDiv).focus();
        onContentLoadedCallback();
      }).modal('show');
    },

    readFileAsArrayBuffer: function (file, onLoadFunction) {
      if (!file)
        return;
      if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert('The File APIs are not fully supported in this browser.');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var content = e.target.result;
        onLoadFunction(content);
      };
      reader.readAsArrayBuffer(file);
    },

    readFileAsDataURL: function (file, onLoadFunction) {
      if (!file)
        return;
      if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert('The File APIs are not fully supported in this browser.');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var content = e.target.result;
        onLoadFunction(content);
      };
      reader.readAsDataURL(file);
    },

    arr2obj: function (arr, idName) {
      var ret = {};
      arr.forEach(function (arrObj) {
        var key = arrObj[idName];
        delete arrObj[idName];
        ret[key] = arrObj;
      });
      return ret;
    },

    obj2arr: function (obj, idName) {
      var ret = [];
      Object.keys(obj).forEach(function (key) {
        var arrObj = obj[key];
        arrObj[idName] = key;
        ret.push(arrObj);
      });
      return ret;
    }

  };
  return _utils;
}());

//------------------------------------------------------------------------
olive.newMicroserviceCallConfigUI = (function (Utils, ace) {

  var _statics = {
    services: {
      callMicroserviceForced: function (restEndpoint, microserviceId, operationId, inputs, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/callMicroserviceForced', 'microserviceId=' + microserviceId + '&operationId=' + operationId, JSON.stringify(inputs), successCallback, failureCallback);
      },
      callMicroservice: function (restEndpoint, microserviceId, operationId, inputs, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/callMicroservice', 'microserviceId=' + microserviceId + '&operationId=' + operationId, JSON.stringify(inputs), successCallback, failureCallback);
      },
      getMicroserviceIOInfo: function (restEndpoint, microserviceId, operationId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/getMicroserviceIOInfo', 'microserviceId=' + microserviceId + '&operationId=' + operationId, null, successCallback, failureCallback);
      }
    },
    view: {
      showMSResult = function (output, adaptationAlg, originalResultTxt, adaptedResultDiv, messagesDiv) {
          if (originalResultTxt && originalResultTxt.val)
            originalResultTxt.val(JSON.stringify(output, null, 4));
          if (adaptationAlg.indexOf('return') === -1) {
            adaptationAlg = 'return $("<pre>").append($("<code>").append(JSON.stringify(output, null, 2)));';
          }
          try {
            var algF = new Function('output', adaptationAlg + '\n//# sourceURL=microservice_custom_alg.js');
            var domDemoRes = algF(output);
            if(adaptedResultDiv)
              adaptedResultDiv.empty().append(domDemoRes);
          } catch (e) {
            Utils.showError(e, messagesDiv);
          }
        };
    },
    init: {
      initACEEditor: function (_dom, _status) {
        _status.aceEditor = ace.edit(_dom.microserviceOutputAdaptAlgDiv[0], {
            mode: "ace/mode/javascript",
            autoScrollEditorIntoView: true,
            minLines: 5
          });
      },
      initMsInputsDom: function (_dom, _status, mscEndpoint, microserviceId, operationId) {
        _statics.services.getMicroserviceIOInfo(mscEndpoint, microserviceId, operationId, function (msIOInfo) {
          Object.keys(msIOInfo.requiredInputTemplate).forEach(function (inputId) {
            _status.requiredInputs[inputId] = {
              value: ''
            };
            var inputInfos = msIOInfo.requiredInputTemplate[inputId];
            _dom.inputTxts[inputId] = $('<textarea style="resize:vertical;" rows="1" class="form-control" placeholder="' + inputInfos.workingExample + '">' + inputInfos.workingExample + '</textarea>');
            _dom.resultDescriptionSpan.text(msIOInfo.outputDescription);
            _dom.callEndpointSpan.text(mscEndpoint + '?microserviceId=' + microserviceId + '&operationId=' + operationId);
            _dom.callInputJsonPre.html(JSON.stringify(requiredInputs, null, 4));

            _dom.tableTbody.append(
              $('<tr>').append(
                $('<td>').append(
                  $('<div class="input-group">').append(
                    $('<span class="input-group-addon">' + inputId + '</span>').popover({
                      placement: 'auto left',
                      container: _dom.rootNode,
                      html: true,
                      title: inputId + ' details',
                      content: inputInfos.description,
                      trigger: 'hover click'
                    })).append(
                    _dom.inputTxts[inputId]))));
          });
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      }
    },
    ui: {
      render: function (_dom) {
        return _dom.rootNode.append(
          $('<div class="input-group">').append(
            '<span class="input-group-addon">Service Name: </span>').append(
            _dom.serviceNameTxt)).append('<br>').append(
          $('<div class="container-fluid">').append(
            $('<div class="row">').append(
              $('<div class="col-md-6">').append(
                '<b>Microservice Required Inputs</b>').append(
                $('<table class="table table-condensed table-hover">').append(
                  _dom.tableTbody))).append(
              $('<div class="col-md-6">').append(
                '<b>Custom Rendering Algorithm</b>').append(
                _dom.microserviceOutputAdaptAlgDiv)))).append(
          _dom.testCallBtn).append('<br><br>').append(
          $('<div class="row">').append(
            $('<div class="col-md-6">').append(
              $('<div class="well">').append(
                '<b>POST Endpoint</b><br>').append(
                _dom.callEndpointSpan).append(
                '<br><b>POST Input Data</b><br>').append(
                _dom.callInputJsonPre).append(
                '<br><b>Output description:</b> ').append(
                _dom.resultDescriptionSpan).append(
                '<br><b>Output</b><br>').append(
                _dom.resultTxt))).append(
            $('<div class="col-md-6">').append(
              $('<div class="panel panel-default">').append(
                $('<div class="panel-heading">').append(
                  $('<h4 class="panel-title">Service Output Page Preview</h4>'))).append(
                $('<div class="panel-body">').append(
                  _dom.resultDemoDiv)))));
      },
      afterRender: function (_dom, _status) {
        _dom.microserviceOutputAdaptAlgDiv.width(_dom.microserviceOutputAdaptAlgDiv.parent().width());
        _dom.microserviceOutputAdaptAlgDiv.height(250);
        _statics.init.initACEEditor(_dom, _status);
        _status.aceEditor.resize();
      },
      
      getContent: function (_dom, _status) {
        return {
          microserviceInputs: (function () {
            Object.keys(_status.requiredInputs).forEach(function (inputId) {
              _status.requiredInputs[inputId].value = _dom.inputTxts[inputId].val();
            });
            return _status.requiredInputs;
          }()),
          serviceName: _dom.serviceNameTxt.val(),
          microserviceOutputAdaptAlg: _status.aceEditor.getValue()
        };
      },

      setContent: function (_dom, _status, content) {
        _dom.serviceNameTxt.val(content.menuName || '');
        Object.keys(_dom.inputTxts).forEach(function (inputId) {
          _dom.inputTxts[inputId].val(content.inputs && content.inputs[inputId] && content.inputs[inputId].value?content.inputs[inputId].value:'');
        });
        _status.aceEditor.setValue(content.alg || '');
      }
    }
  };

  return function (config) {
    var mscEndpoint = config.mscEndpoint || '';
    var microserviceId = config.microserviceId || '';
    var operationId = config.operationId || '';
    var forceStartWhenStopped = config.forceStartWhenStopped || true;
    
    var _status = {
      requiredInputs: {},
      aceEditor: null
    };
    
    var _dom = {
      rootNode: $('<div>'),
      messageDiv: $('<div>'),
      serviceNameTxt: $('<input type="text" class="form-control" placeholder="Unique Name">'),
      inputTxts: {},
      resultTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control" placeholder="Call results"></textarea>'),
      resultDescriptionSpan: $('<span>'),
      resultDemoDiv: $('<div>'),
      callEndpointSpan: $('<span>'),
      callInputJsonPre: $('<pre>'),
      tableTbody: $('<tbody>'),
      testCallBtn: $('<button class="btn btn-primary" type="button">Test a Call</button>').click(function () {
        Object.keys(_status.requiredInputs).forEach(function (inputId) {
          _status.requiredInputs[inputId].value = _dom.inputTxts[inputId].val();
        });
        _dom.callInputJsonPre.html(JSON.stringify(_status.requiredInputs, null, 4));
        if (forceStartWhenStopped) {
          _statics.services.callMicroserviceForced(mscEndpoint, microserviceId, operationId, _status.requiredInputs, function (output) {
            _statics.view.showMSResult(output, aceEditor.getValue(), _dom.resultTxt, _dom.resultDemoDiv, _dom.rootNode);
          }, function (error) {
            Utils.showError(error, _dom.rootNode);
          });
        } else {
          _statics.services.callMicroservice(mscEndpoint, microserviceId, operationId, _status.requiredInputs, function (output) {
            _statics.view.showMSResult(output, aceEditor.getValue(), _dom.resultTxt, _dom.resultDemoDiv, _dom.rootNode);
          }, function (error) {
            Utils.showError(error, _dom.rootNode);
          });
        }
      }),
      microserviceOutputAdaptAlgDiv: $('<div>')
    };

    _statics.init.initMsInputsDom(_dom, _status, mscEndpoint, microserviceId, operationId);

    return {
      getContent: function () {
        return _statics.ui.getContent(_dom, _status);
      },
      setContent: function (content) {
        _statics.ui.setContent(_dom, _status, content);
      },
      render: function () {
        return _statics.ui.render(_dom);
      },
      afterRender: function () {
        _statics.ui.afterRender(_dom, _status);
      }
    };
  }
}(olive.utils, ace));


//------------------------------------------------------------------------
var newInputTableModule = (function (newMicroserviceCallConfigUI) {

  var _newTableRowModule = function (menuName = '', microserviceId = '', operationId = '', microserviceInputJSON = '{}', microserviceOutputAdaptAlg = '', removeBtnHandlerFn = function () {}, editBtnHandlerFn = function () {}) {
    var _dom = {
      menuNameTxt: $('<input type="text" class="form-control">').val(menuName),
      microserviceIdTxt: $('<input type="text" class="form-control">').val(microserviceId),
      operationIdTxt: $('<input type="text" class="form-control">').val(operationId),
      microserviceInputJSONTxt: $('<input type="text" class="form-control">').val(microserviceInputJSON),
      microserviceOutputAdaptAlgTxt: $('<input type="text" class="form-control">').val(microserviceOutputAdaptAlg),
      removeRowBtn: $('<div class="input-group-addon link" style="font-size:20px;font-weight:700;">&times;</div>').click(removeBtnHandlerFn),
      editRowBtn: $('<div class="input-group-addon link"></div>').click(editBtnHandlerFn)
    };

    return {
      render: function () {
        return $('<div class="input-group">').append(
          '<span class="input-group-addon">Name: </span>').append(
          _dom.menuNameTxt).append(
          '<span class="input-group-addon">Microservice ID: </span>').append(
          _dom.microserviceIdTxt).append(
          '<span class="input-group-addon">Operation ID: </span>').append(
          _dom.operationIdTxt).append(
          '<span class="input-group-addon">Input: </span>').append(
          _dom.microserviceInputJSONTxt).append(
          '<span class="input-group-addon">Alg: </span>').append(
          _dom.microserviceOutputAdaptAlgTxt).append(
          _dom.editRowBtn.append(
            '<span class="glyphicon glyphicon-pencil"></span>')).append(
          _dom.removeRowBtn);
      },

      getContent: function () {
        return {
          menuName: _dom.menuNameTxt.val(),
          microserviceId: _dom.microserviceIdTxt.val(),
          operationId: _dom.operationIdTxt.val(),
          microserviceInputJSON: _dom.microserviceInputJSONTxt.val(),
          microserviceOutputAdaptAlg: _dom.microserviceOutputAdaptAlgTxt.val()
        };
      },

      setContent: function (data) {
        _dom.menuNameTxt.val(data.menuName);
        _dom.microserviceIdTxt.val(data.microserviceId);
        _dom.operationIdTxt.val(data.operationId);
        _dom.microserviceInputJSONTxt.val(data.microserviceInputJSON);
        _dom.microserviceOutputAdaptAlgTxt.val(data.microserviceOutputAdaptAlg);
      }
    };
  };

  return function (mscEndpoint) {

    var _rowModuleList = [];

    var _dom = {
      rootTbody: $('<tbody>')
    };

    var _fns = {
      editRow: function (row) {
        var rowContent = row.getContent();
        var microserviceCallConfigUI = newMicroserviceCallConfigUI({
          mscEndpoint: mscEndpoint,
          microserviceId: rowContent.microserviceId,
          operationId: rowContent.operationId,
          forceStartWhenStopped: true
        });
        microserviceCallConfigUI.setContent({
          menuName: rowContent.menuName,
          microserviceInputs: JSON.parse(rowContent.microserviceInputJSON),
          microserviceOutputAdaptAlg: rowContent.microserviceOutputAdaptAlg
        });
        
        Utils.createDialogBootstrap(microserviceCallConfigUI.render(), 'Edit microservice details', function () {
          return true;
        }, function () {
          var callConfigUIContent = microserviceCallConfigUI.getContent();
          row.setContent({
            menuName: callConfigUIContent.serviceName,
            microserviceId: rowContent.microserviceId,
            operationId: rowContent.operationId,
            microserviceInputJSON: JSON.stringify(callConfigUIContent.microserviceInputs),
            microserviceOutputAdaptAlg: callConfigUIContent.microserviceOutputAdaptAlg
          });
        }, function () {
          microserviceCallConfigUI.afterRender();
        });
      },
      addRow: function (menuName, microserviceId, operationId, microserviceInputJSON, microserviceOutputAdaptAlg) {
        var tr = $('<tr>');
        var newRow = _newTableRowModule(menuName, microserviceId, operationId, microserviceInputJSON, microserviceOutputAdaptAlg, function () {
            tr.remove();
            _rowModuleList.splice(_rowModuleList.indexOf(newRow), 1);
          }, function () {
            _fns.editRow(newRow);
          });

        _rowModuleList.push(newRow);

        _dom.rootTbody.append(
          tr.append(
            $('<td>').append(
              newRow.render())));

        return this;
      }
    };

    return {
      render: function () {
        return $('<table class="table table-condensed table-hover">').append(
          _dom.rootTbody);
      },

      getContent: function () {
        var ret = [];
        _rowModuleList.forEach(function (rowModule) {
          ret.push(rowModule.getContent());
        });
        return ret;
      },

      setContent: function (contentJsonArray = []) {
        _dom.rootTbody.empty();
        _rowModuleList = [];
        contentJsonArray.forEach(function (item) {
          _fns.addRow(item.menuName, item.microserviceId, item.operationId, item.microserviceInputJSON, item.microserviceOutputAdaptAlg);
        });
        return this;
      },

      addRow: function (menuName, microserviceId, operationId, microserviceInputJSON, microserviceOutputAdaptAlg) {
        _fns.addRow(menuName, microserviceId, operationId, microserviceInputJSON, microserviceOutputAdaptAlg);
      },

      addRowDialog: function (microserviceId, operationId) {
        var addMicroserviceModule = newMicroserviceCallConfigUI(, null, null, null);

        var microserviceCallConfigUI = newMicroserviceCallConfigUI({
          mscEndpoint: mscEndpoint,
          microserviceId: microserviceId,
          operationId: operationId,
          forceStartWhenStopped: true
        });

        Utils.createDialogBootstrap(microserviceCallConfigUI.render(), 'Add microservice', function () {
          return true;
        }, function () {
          var content = microserviceCallConfigUI.getContent();
          _fns.addRow(content.serviceName, microserviceId, operationId, JSON.stringify(content.microserviceInputs), content.microserviceOutputAdaptAlg);
        }, function () {
          microserviceCallConfigUI.afterRender();
        });
      }
    };
  };
}(newMicroserviceCallConfigUI));

/*TEST-START*/

var _newMSInputsTableModule = (function () {

  var _newTableRowMSInputModule = function (removeBtnHandlerFn = function () {}) {
    var _dom = {
      inputIdTxt: $('<input type="text" class="form-control">'),
      matchingNameTxt: $('<input type="text" class="form-control">'),
      descriptionTxt: $('<input type="text" class="form-control">'),
      workingExampleTxt: $('<input type="text" class="form-control">'),
      removeRowBtn: $('<div class="input-group-addon link" style="font-size:20px;font-weight:700;">&times;</div>').click(removeBtnHandlerFn)
    };
    return {
      render: function () {
        return $('<div class="input-group">').append(
          '<span class="input-group-addon">Input ID</span>').append(
          _dom.inputIdTxt).append(
          '<span class="input-group-addon">Matching Name</span>').append(
          _dom.matchingNameTxt).append(
          '<span class="input-group-addon">Description</span>').append(
          _dom.descriptionTxt).append(
          '<span class="input-group-addon">Working Sample</span>').append(
          _dom.workingExampleTxt).append(
          _dom.removeRowBtn);
      },
      getContent: function () {
        return {
          inputId: _dom.inputIdTxt.val(),
          matchingName: _dom.matchingNameTxt.val(),
          description: _dom.descriptionTxt.val(),
          workingExample: _dom.workingExampleTxt.val()
        };
      },
      setContent: function (content = {}) {
        _dom.inputIdTxt.val(content.inputId || '');
        _dom.matchingNameTxt.val(content.matchingName || '');
        _dom.descriptionTxt.val(content.description || '');
        _dom.workingExampleTxt.val(content.workingExample || '');
      }
    };
  };

  return function () {
    var _rowModuleList = [];
    var _dom = {
      rootTbody: $('<tbody>')
    };
    var _fns = {
      addRow: function (content = {}) {
        var tr = $('<tr>');
        var newRow = _newTableRowMSInputModule(function () {
            tr.remove();
            _rowModuleList.splice(_rowModuleList.indexOf(newRow), 1);
          });
        newRow.setContent(content);
        _rowModuleList.push(newRow);
        _dom.rootTbody.append(
          tr.append(
            $('<td>').append(
              newRow.render())));
      },

      getContent: function () {
        return _rowModuleList.map(function (_rowModule) {
          return _rowModule.getContent();
        });
      },

      setContent: function (contentArray) {
        _dom.rootTbody.empty();
        _rowModuleList = [];
        contentArray.forEach(function (config) {
          _fns.addRow(config);
        });
      }
    };

    return {
      render: function () {
        return $('<table class="table table-condensed table-hover">').append(
          _dom.rootTbody);
      },
      getContent: _fns.getContent,
      setContent: _fns.setContent,
      addRow: _fns.addRow
    };
  };
}
  ());

var _newMSInputsModule = (function (Utils, _newMSInputsTableModule) {
  return function () {
    var msInputsTableModule = _newMSInputsTableModule();
    var _doms = {
      addMSInputBtn: $('<button class="btn btn-default" type="button">Add new call configuration Input</button>').click(function () {
        msInputsTableModule.addRow();
      })
    };
    return {
      render: function () {
        return $('<div class="panel panel-default">').append(
          '<div class="panel-heading"><h4 class="panel-title">Call Configuration Inputs</h4></div>').append(
          $('<div class="panel-body">').append(
            $('<div class="row form-group">').append(
              $('<div class="col-lg-3">').append(
                _doms.addMSInputBtn))).append(
            $('<div class="row form-group">').append(
              $('<div class="col-lg-12">').append(
                msInputsTableModule.render()))));
      },

      getContent: function () {
        return Utils.arr2obj(msInputsTableModule.getContent(), 'inputId');
      },

      setContent: function (content = {}) {
        msInputsTableModule.setContent(Utils.obj2arr(content, 'inputId'));
      }
    };
  };
}
  (Utils, _newMSInputsTableModule));

var _newConnectorConfiguration = (function (Utils) {
  var services = {
    uploadLocalFile: function (restEndpoint, fileName, fileContent, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/uploadLocalFile', 'fileName=' + fileName, fileContent, successCallback, failureCallback);
    }
  };

  return function (config) {
    var title = config.title || '';
    var lang = config.lang || '';
    var mscEndpoint = config.mscEndpoint || '';

    var _dom = {
      messageDiv: $('<div>'),
      tableTbody: $('<tbody>'),
      inputs: {}
    };

    var _fns = {
      setContent: function (content = {}) {
        var templateInputs = content.inputTemplates || {};
        var inputs = content.inputValues || {};

        _dom.tableTbody.empty();
        Object.keys(templateInputs).forEach(function (inputId) {

          var inputName = templateInputs[inputId].name || '';
          var inputDescription = templateInputs[inputId].description[lang] || '';
          var inputValue = inputs[inputId] ? (inputs[inputId].value || '') : '';
          var requireUpload = (templateInputs[inputId].moreInfos != null && templateInputs[inputId].moreInfos.requireUpload != null) ? templateInputs[inputId].moreInfos.requireUpload : false;
          var rowsNumber = (templateInputs[inputId].moreInfos != null && templateInputs[inputId].moreInfos.rowsNumber != null) ? templateInputs[inputId].moreInfos.rowsNumber : 1;
          var choiceValues = (templateInputs[inputId].moreInfos != null && templateInputs[inputId].moreInfos.choiceValues != null) ? (templateInputs[inputId].moreInfos.choiceValues instanceof Array ? templateInputs[inputId].moreInfos.choiceValues : null) : null;

          _dom.inputs[inputId] = {
            nameSpan: $('<span class="input-group-addon">' + inputName + '</span>').popover({
              placement: 'auto left',
              container: 'body',
              html: true,
              title: inputName + ' details',
              content: inputDescription,
              trigger: 'hover click'
            })
          };

          if (choiceValues != null) {
            _dom.inputs[inputId].inputTxt = $('<select class="form-control">').append(choiceValues.map(function (item) {
                  return '<option value="' + item + '" ' + (item == inputValue ? 'selected' : '') + '>' + item + '</option>';
                }));
          } else {
            _dom.inputs[inputId].inputTxt = $('<textarea style="width:100%;resize:vertical;" class="form-control" rows="' + rowsNumber + '">' + inputValue + '</textarea>');
          }

          if (requireUpload) {
            _dom.inputs[inputId].uploadBtn = $('<button class="btn btn-default" type="button">Upload</button>').click(function (e) {
                e.preventDefault();
                _dom.inputs[inputId].uploadInputFile.trigger('click');
              });
            _dom.inputs[inputId].uploadInputFile = $('<input type="file" style="display: none;">').change(function (e) {
                var fileName = e.target.files[0].name;
                Utils.readFileAsArrayBuffer(e.target.files[0], function (content) {
                  services.uploadLocalFile(mscEndpoint, fileName, content, function (data) {
                    dom.inputs[inputId].inputTxt.val(data.fileId);
                    Utils.showSuccess(fileName + ' correctly uploaded', _dom.messageDiv);
                  }, function (error) {
                    Utils.showError(error, _dom.messageDiv);
                  });
                });
              });
          }

          _dom.tableTbody.append(
            $('<tr>').append(
              $('<td>').append(
                $('<div class="input-group">').append(
                  _dom.inputs[inputId].nameSpan).append(
                  _dom.inputs[inputId].inputTxt).append(
                  requireUpload ? $('<span class="input-group-btn">').append(_dom.inputs[inputId].uploadBtn).append(_dom.inputs[inputId].uploadInputFile) : null))));
        });
      }
    };

    return {
      render: function () {
        return $('<div class="panel panel-default">').append(
          $('<div class="panel-heading">' + title + '</div>')).append(
          _dom.messageDiv).append(
          $('<table class="table table-condensed table-hover">').append(
            _dom.tableTbody));
      },

      setContent: function (content = {}) {
        _fns.setContent(content);
      },

      getContent: function () {
        var ret = {};
        Object.keys(_dom.inputs).forEach(function (inputId) {
          ret[inputId] = {
            value: _dom.inputs[inputId].inputTxt.val()
          };
        });
        return ret;
      }
    };
  };
}
  (Utils));

var _newMSAsyncInputsTableModule = (function () {

  var _newTableRowMSAsyncInputModule = function (removeBtnHandlerFn = function () {}) {
    var _dom = {
      responseInputIdTxt: $('<input type="text" class="form-control">'),
      responseInputValueTxt: $('<input type="text" class="form-control">'),
      removeRowBtn: $('<div class="input-group-addon link" style="font-size:20px;font-weight:700;">&times;</div>').click(removeBtnHandlerFn)
    };
    return {
      render: function () {
        return $('<div class="input-group">').append(
          '<span class="input-group-addon">Asynchronous Input ID</span>').append(
          _dom.responseInputIdTxt).append(
          '<span class="input-group-addon">Value</span>').append(
          _dom.responseInputValueTxt).append(
          _dom.removeRowBtn);
      },
      getContent: function () {
        return {
          id: _dom.responseInputIdTxt.val(),
          value: _dom.responseInputValueTxt.val()
        };
      },
      setContent: function (content) {
        _dom.responseInputIdTxt.val(content.id || '');
        _dom.responseInputValueTxt.val(content.value || '');
      }
    };
  };

  return function () {
    var _rowModuleList = [];
    var _dom = {
      rootTbody: $('<tbody>')
    };
    var _fns = {
      addRow: function (content = {}) {
        var tr = $('<tr>');
        var newRow = _newTableRowMSAsyncInputModule(function () {
            tr.remove();
            _rowModuleList.splice(_rowModuleList.indexOf(newRow), 1);
          });
        newRow.setContent(content);
        _rowModuleList.push(newRow);
        _dom.rootTbody.append(
          tr.append(
            $('<td>').append(
              newRow.render())));
        return this;
      },

      getContent: function () {
        return _rowModuleList.map(function (_rowModule) {
          return _rowModule.getContent();
        });
      },

      setContent: function (contentArray) {
        _dom.rootTbody.empty();
        _rowModuleList = [];
        contentArray.forEach(function (config) {
          _fns.addRow(config);
        });
      }
    };

    return {
      render: function () {
        return $('<table class="table table-condensed table-hover">').append(
          _dom.rootTbody);
      },
      getContent: _fns.getContent,
      setContent: _fns.setContent,
      addRow: _fns.addRow
    };
  };
}
  ());

var _MSAsyncInputsModule = (function (Utils, _newMSAsyncInputsTableModule) {

  function MSAsyncInputsModule() {
    this._subs = {
      msAsyncInputsTableModule: _newMSAsyncInputsTableModule()
    };
    this._doms = {
      inputAdaptationAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">'),
      responseServiceIdTxt: $('<input type="text" class="form-control">'),
      responseServiceOperationIdTxt: $('<input type="text" class="form-control">'),
      responseServiceInputIdTxt: $('<input type="text" class="form-control">'),
      addAsyncRespMsInputBtn: $('<button class="btn btn-default" type="button">Add Response Input</button>').click(function () {
        //FIXME: not captured by try catch
        this._subs.msAsyncInputsTableModule.addRow();
      }
        .bind(this))
    };
  }

  MSAsyncInputsModule.prototype.render = function () {
    return $('<div class="panel panel-default">').append(
      '<div class="panel-heading"><h4 class="panel-title">Configuration for Management of Asynchronous Responses</h4></div>').append(
      $('<div class="panel-body">').append(
        $('<div class="row form-group">').append(
          $('<div class="col-lg-12">').append(
            $('<div class="input-group">').append(
              '<span class="input-group-addon">Input Adaptation Algorithm</span>').append(
              this._doms.inputAdaptationAlgorithmTxt)))).append(
        $('<div class="row form-group">').append(
          $('<div class="col-lg-12">').append(
            $('<div class="input-group">').append(
              '<span class="input-group-addon">Responses to Microservice ID</span>').append(
              this._doms.responseServiceIdTxt).append(
              '<span class="input-group-addon">using Operation</span>').append(
              this._doms.responseServiceOperationIdTxt).append(
              '<span class="input-group-addon">and Input</span>').append(
              this._doms.responseServiceInputIdTxt)))).append(
        $('<div class="row form-group">').append(
          $('<div class="col-lg-3">').append(
            this._doms.addAsyncRespMsInputBtn))).append(
        $('<div class="row form-group">').append(
          $('<div class="col-lg-12">').append(
            this._subs.msAsyncInputsTableModule.render()))));
  };

  MSAsyncInputsModule.prototype.getContent = function () {
    return {
      responseServiceId: this._doms.responseServiceIdTxt.val(),
      responseServiceOperationId: this._doms.responseServiceOperationIdTxt.val(),
      responseServiceInputId: this._doms.responseServiceInputIdTxt.val(),
      inputAdaptationAlgorithm: this._doms.inputAdaptationAlgorithmTxt.val(),
      responseServiceOtherInputs: Utils.arr2obj(this._subs.msAsyncInputsTableModule.getContent(), 'id')
    };
  };

  MSAsyncInputsModule.prototype.setContent = function (content = {}) {
    this._doms.responseServiceIdTxt.val(content.responseServiceId || '');
    this._doms.responseServiceOperationIdTxt.val(content.responseServiceOperationId || '');
    this._doms.responseServiceInputIdTxt.val(content.responseServiceInputId || '');
    this._doms.inputAdaptationAlgorithmTxt.val(content.inputAdaptationAlgorithm || '');
    this._subs.msAsyncInputsTableModule.setContent(content.responseServiceOtherInputs ? Utils.obj2arr(content.responseServiceOtherInputs, 'id') : []);
  };

  return MSAsyncInputsModule;

}
  (Utils, _newMSAsyncInputsTableModule));

var _newMSOperationModule = (function (Utils, _newConnectorConfiguration, _newMSInputsModule, _MSAsyncInputsModule) {

  function staticSetContent(connectors = {}, content = {}, dom, sub) {
    dom.idTxt.val(content.id || '');
    dom.nameTxt.val(content.name || '').trigger('change');
    dom.descriptionTxt.val(content.description || '');
    dom.isDefaultChk.prop('checked', content.isDefault || false);
    dom.isAutostartChk.prop('checked', content.autostart || false);

    var configurationContent = content.configuration || {};
    var connectorId = configurationContent.connectorId || '';
    dom.connectorIdSelect.val(connectorId).trigger('change');
    staticSetConnectorRelatedContent(connectorId, connectorId, connectors, configurationContent, dom, sub);
  }

  function staticSetConnectorRelatedContent(actualConnectorId, selectedConnectorId, connectors = {}, content = {}, dom, sub) {
    dom.outputDescriptionTxt.val(content.outputDescription && actualConnectorId === selectedConnectorId ? content.outputDescription : '');
    dom.outputAdaptationAlgorithmTxt.val(content.outputAdaptationAlgorithm && actualConnectorId === selectedConnectorId ? content.outputAdaptationAlgorithm : '');
    dom.statusCheckAlgorithmTxt.val(content.statusCheckAlgorithm && actualConnectorId === selectedConnectorId ? content.statusCheckAlgorithm : '');

    sub.startConfigModule.setContent({
      inputTemplates: connectors[selectedConnectorId] ? connectors[selectedConnectorId].startConfigurationTemplate : {},
      inputValues: content.configStart && selectedConnectorId === selectedConnectorId ? content.configStart : {}
    });
    sub.callConfigModule.setContent({
      inputTemplates: connectors[selectedConnectorId] ? connectors[selectedConnectorId].callConfigurationTemplate : {},
      inputValues: content.configCall && selectedConnectorId === selectedConnectorId ? content.configCall : {}
    });

    sub.msInputsModule.setContent(content.inputs || {});

    sub.msAsyncInputsModule.setContent(content.inputsAsync || {});
    dom.asyncInputsDiv.toggle(connectors[selectedConnectorId] && connectors[selectedConnectorId].asyncConnectionRequired);
  }

  function staticGetContent(dom, sub, connectors = {}) {
    var ret = {
      id: dom.idTxt.val(),
      name: dom.nameTxt.val(),
      description: dom.descriptionTxt.val(),
      isDefault: dom.isDefaultChk.is(':checked'),
      autostart: dom.isAutostartChk.is(':checked'),
      configuration: {
        connectorId: dom.connectorIdSelect.val(),
        outputDescription: dom.outputDescriptionTxt.val(),
        outputAdaptationAlgorithm: dom.outputAdaptationAlgorithmTxt.val(),
        statusCheckAlgorithm: dom.statusCheckAlgorithmTxt.val(),
        configStart: sub.startConfigModule.getContent(),
        configCall: sub.callConfigModule.getContent(),
        inputs: sub.msInputsModule.getContent()
      }
    };

    if (connectors[ret.configuration.connectorId].asyncConnectionRequired)
      ret.configuration.inputsAsync = sub.msAsyncInputsModule.getContent();

    return ret;
  }

  function staticInitConnectorSelect(dom, connectors = {}) {
    dom.connectorIdSelect.empty().append('<option value="">Select a connector</option>');
    Object.keys(connectors).forEach(function (connectorId) {
      dom.connectorIdSelect.append(
        '<option value="' + connectorId + '">' + connectors[connectorId].name + '</option>');
    });
    dom.connectorIdSelect.val('').trigger('change');
  }

  function staticRender(_doms, _subs) {
    return $('<div class="panel panel-default">').append(
      _doms.panelHeader.append(
        $('<div class="btn-group pull-right">').append(
          _doms.removeRowBtn)).append(
        $('<h4 class="panel-title">').append(
          _doms.panelTitleLabel).append(
          ' <span class="caret">'))).append(
      _doms.panelCollapsable.append(
        $('<div class="panel-body">').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Operation ID</span>').append(
                _doms.idTxt).append(
                '<span class="input-group-addon">Name</span>').append(
                _doms.nameTxt).append(
                '<span class="input-group-addon">Description</span>').append(
                _doms.descriptionTxt).append(
                '<span class="input-group-addon">Is Default?</span>').append(
                $('<span class="input-group-addon">').append(
                  _doms.isDefaultChk)).append(
                $('<span class="input-group-addon">Autostart?</span>')).append(
                $('<span class="input-group-addon">').append(
                  _doms.isAutostartChk))))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-4">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Connector</span>').append(
                _doms.connectorIdSelect))).append(
            $('<div class="col-lg-8">').append(
              _doms.connectorDescDiv))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-6">').append(
              _subs.startConfigModule.render())).append(
            $('<div class="col-lg-6">').append(
              _subs.callConfigModule.render()))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              _subs.msInputsModule.render()))).append(
          _doms.asyncInputsDiv.append(
            $('<div class="col-lg-12">').append(
              _subs.msAsyncInputsModule.render())).hide()).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Connector Output Description</span>').append(
                _doms.connectorOutputDescTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Output Description</span>').append(
                _doms.outputDescriptionTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Output Adaptation Algorithm</span>').append(
                _doms.outputAdaptationAlgorithmTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Status Check Algorithm</span>').append(
                _doms.statusCheckAlgorithmTxt))))));
  }

  return function (config = {}, removeBtnHandlerFn = function () {}, defaultChkChangeHandlerFn = function () {}) {
    var lang = config.lang || '';
    var mscEndpoint = config.mscEndpoint || '';
    var connectors = config.connectors || {};

    var _content = {};
    var _subs = {
      startConfigModule: _newConnectorConfiguration({
        title: 'Start configuration',
        lang: lang,
        mscEndpoint: mscEndpoint
      }),
      callConfigModule: _newConnectorConfiguration({
        title: 'Call configuration',
        lang: lang,
        mscEndpoint: mscEndpoint
      }),
      msInputsModule: _newMSInputsModule(),
      msAsyncInputsModule: new _MSAsyncInputsModule()
    };
    var _doms = {
      panelHeader: $('<div class="panel-heading link">').click(function () {
        _doms.panelCollapsable.collapse('toggle');
      }),
      panelCollapsable: $('<div class="panel-collapse collapse">'),
      panelTitleLabel: $('<span>'),
      removeRowBtn: $('<button class="btn btn-default btn-xs" type="button">Delete</button>').click(removeBtnHandlerFn),

      asyncInputsDiv: $('<div class="row form-group">'),

      idTxt: $('<input type="text" class="form-control">'),
      nameTxt: $('<input type="text" class="form-control">').change(function () {
        _doms.panelTitleLabel.html('Operation ' + _doms.nameTxt.val());
      }),
      descriptionTxt: $('<input type="text" class="form-control">'),
      isDefaultChk: $('<input type="checkbox" aria-label="Is default?">').change(defaultChkChangeHandlerFn),
      isAutostartChk: $('<input type="checkbox" aria-label="Autostart?">'),
      connectorIdSelect: $('<select class="form-control">').change(function () {
        var selectedConnectorId = _doms.connectorIdSelect.val();
        _doms.connectorDescDiv.html(connectors[selectedConnectorId] ? connectors[selectedConnectorId].description[lang] : '');
        _doms.connectorOutputDescTxt.val(connectors[selectedConnectorId] ? connectors[selectedConnectorId].outputDescription : '');

        staticSetConnectorRelatedContent(_content.configuration ? _content.configuration.connectorId : '', selectedConnectorId, connectors, _content.configuration, _doms, _subs);
      }),
      connectorDescDiv: $('<pre>'),
      connectorOutputDescTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control" readonly>'),
      outputDescriptionTxt: $('<textarea style="resize:vertical;" rows="5" class="form-control">'),
      outputAdaptationAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">'),
      statusCheckAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">')
    };

    staticInitConnectorSelect(_doms, connectors);

    return {
      render: function () {
        return staticRender(_doms, _subs);
      },
      setContent: function (content = {}) {
        _content = content;
        staticSetContent(connectors, content, _doms, _subs);
      },
      getContent: function () {
        return staticGetContent(_doms, _subs, connectors);
      },
      isDefault: function () {
        return _doms.isDefaultChk.is(':checked');
      },
      setDefault: function (bool) {
        _doms.isDefaultChk.prop('checked', bool || false);
      },
      getId: function () {
        return _doms.idTxt.val();
      }
    };
  };
}
  (Utils, _newConnectorConfiguration, _newMSInputsModule, _MSAsyncInputsModule));

var _newMSDetailsModule = (function (Utils) {
  return function () {

    var _doms = {
      ownerHtmlTxt: $('<input type="text" class="form-control">'),
      presentationImageUrlTxt: $('<input type="text" class="form-control">'),
      descriptionHtmlDiv: $('<div>'),
      imageUploadBtn: $('<button class="btn btn-default" type="button">Upload</button>').click(function (e) {
        e.preventDefault();
        _doms.imageUploadFile.trigger('click');
      }),
      imageUploadFile: $('<input type="file" style="display: none;">').change(function (e) {
        var fileName = e.target.files[0].name;
        Utils.readFileAsDataURL(e.target.files[0], function (content) {
          _doms.presentationImageUrlTxt.val(content);
        });
      })
    };

    _doms.descriptionHtmlParent = $('<div class="input-group">').append(
        '<span class="input-group-addon">Details</span>').append(
        _doms.descriptionHtmlDiv);

    static_init(_doms);

    return {
      render: function () {
        return $('<div>').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Owner</span>').append(
                _doms.ownerHtmlTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Image URL</span>').append(
                _doms.presentationImageUrlTxt).append(
                $('<span class="input-group-btn">').append(
                  _doms.imageUploadBtn).append(
                  _doms.imageUploadFile))))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              _doms.descriptionHtmlParent)));
      },
      getContent: function () {
        return {
          ownerHtml: _doms.ownerHtmlTxt.val(),
          presentationImageUrl: _doms.presentationImageUrlTxt.val(),
          descriptionHtml: _doms.descriptionHtmlDiv.summernote('code')
        };
      },
      setContent: function (content = {}) {
        _doms.ownerHtmlTxt.val(content.ownerHtml || '');
        _doms.presentationImageUrlTxt.val(content.presentationImageUrl || '');
        _doms.descriptionHtmlDiv.summernote('insertText', content.descriptionHtml || '');
      }
    };
  };

  function static_init(_doms) {
    _doms.descriptionHtmlDiv.summernote();
  }
}
  (Utils));

var newMSModule = (function (Utils, _newMSDetailsModule, _newMSOperationModule) {
  return function (config = {}) {
    config.lang = config.lang || '';
    config.mscEndpoint = config.mscEndpoint || '';
    config.connectors = config.connectors || {};

    var _status = {
      microserviceId: ''
    };

    var _subs = {
      msDetailsModule: _newMSDetailsModule(),
      msOperationModuleList: []
    };

    var _doms = {
      idTxt: $('<input type="text" class="form-control" readonly>'),
      nameTxt: $('<input type="text" class="form-control">'),
      descriptionTxt: $('<input type="text" class="form-control">'),
      isPublicChk: $('<input type="checkbox" aria-label="Is Public?">'),
      detailsDiv: $('<div class="row form-group">').hide(),
      operationsDiv: $('<div>'),
      showDetailsBtn: $('<button class="btn btn-default" type="button">Show Details</button>').click(function () {
        _doms.detailsDiv.toggle();
        if (_doms.detailsDiv.is(':visible'))
          _doms.showDetailsBtn.html('Hide Details');
        else
          _doms.showDetailsBtn.html('Show Details');
      }),
      addOperationBtn: $('<button class="btn btn-default" type="button">New Operation</button>').click(function () {
        static_addOperation(_doms, _subs, config, {});
      })
    };

    return {
      render: function () {
        return static_render(_doms, _subs);
      },
      getContent: function () {
        return static_getContent(_doms, _subs, _status);
      },
      setContent: function (content = {}) {
        static_setContent(_doms, _subs, _status, config, content);
      }
    };
  };

  function static_addOperation(_doms, _subs, config, content = {}) {
    var _localDiv = $('<div>');
    var msOperationModule = _newMSOperationModule({
        lang: config.lang,
        mscEndpoint: config.mscEndpoint,
        connectors: config.connectors
      }, function () {
        //delete handler
        _localDiv.remove();
        _subs.msOperationModuleList.splice(_subs.msOperationModuleList.indexOf(msOperationModule), 1);
      }, function () {
        //is public chk change function
        if (msOperationModule.isDefault()) {
          _subs.msOperationModuleList.forEach(function (anotherOperationModule) {
            anotherOperationModule.setDefault(false);
          });
        }
        msOperationModule.setDefault(true);
      });
    msOperationModule.setContent(content);
    _subs.msOperationModuleList.push(msOperationModule);
    _doms.operationsDiv.append(
      _localDiv.append(
        msOperationModule.render()));
  }

  function static_getContent(_doms, _subs, _status) {
    var ops = {};
    var defaultOpId = _subs.msOperationModuleList[0] ? _subs.msOperationModuleList[0].getId() : '';
    _subs.msOperationModuleList.forEach(function (operationModule) {
      var opContent = operationModule.getContent();
      var opId = opContent.id;
      delete opContent.id;
      ops[opId] = opContent;
      if (opContent.isDefault)
        defaultOpId = opId;
    });

    var more = _subs.msDetailsModule.getContent();
    more.visible = _doms.isPublicChk.is(':checked');

    return {
      id: _status.microserviceId,
      name: _doms.nameTxt.val(),
      description: _doms.descriptionTxt.val(),
      public: _doms.isPublicChk.is(':checked'),
      defaultOperationId: defaultOpId,
      operations: ops,
      moreInfos: more
    };
  }

  function static_setContent(_doms, _subs, _status, config = {}, content = {}) {
    _status.microserviceId = content.id || '';
    _doms.idTxt.val(content.id || '');
    _doms.nameTxt.val(content.name || '');
    _doms.descriptionTxt.val(content.description || '');
    _doms.isPublicChk.prop('checked', content.public || false);
    _subs.msDetailsModule.setContent(content.moreInfos || {});

    _doms.operationsDiv.empty();
    _subs.msOperationModuleList = [];
    var operations = content.operations || {};
    Object.keys(operations).forEach(function (operationId) {
      var operationConfig = operations[operationId];
      operationConfig.id = operationId;
      operationConfig.isDefault = (operationId === content.defaultOperationId);
      static_addOperation(_doms, _subs, config, operationConfig);
    });
  }

  function static_render(_doms, _subs) {
    return $('<div>').append(
      $('<div class="row form-group">').append(
        $('<div class="col-lg-12">').append(
          $('<div class="input-group">').append(
            '<span class="input-group-addon">Microservice Name</span>').append(
            _doms.nameTxt).append(
            '<span class="input-group-addon">Description</span>').append(
            _doms.descriptionTxt).append(
            '<span class="input-group-addon">Is Public?</span>').append(
            $('<span class="input-group-addon">').append(
              _doms.isPublicChk)).append(
            $('<span class="input-group-btn">').append(
              _doms.showDetailsBtn))))).append(
      _doms.detailsDiv.append(
        $('<div class="col-lg-12">').append(
          _subs.msDetailsModule.render()))).append(
      $('<div class="row form-group">').append(
        $('<div class="col-lg-3">').append(
          _doms.addOperationBtn))).append(
      _doms.operationsDiv);
  }

}
  (Utils, _newMSDetailsModule, _newMSOperationModule));

/*TEST-END*/

var newAdminModule = (function (Utils, newInputTableModule, newMSModule) {

  var _statics = {
    retrieveAllMicroservices: function (restEndpoint, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/retrieveAllMicroservices', null, null, successCallback, failureCallback);
    },
    retrieveMicroserviceDetails: function (restEndpoint, microserviceId, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/retrieveMicroserviceDetails', 'microserviceId=' + microserviceId, null, successCallback, failureCallback);
    },
    createMicroservice: function (restEndpoint, microserviceConfiguration, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/createMicroservice', null, JSON.stringify(microserviceConfiguration), successCallback, failureCallback);
    },
    getAvailableConnectors: function (restEndpoint, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/getAvailableConnectors', null, null, successCallback, failureCallback);
    },
    createDemoMicroserviceConfiguration: function (restEndpoint, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/createDemoMicroserviceConfiguration', null, null, successCallback, failureCallback);
    },
    createEmptyMicroserviceConfiguration: function (restEndpoint, successCallback, failureCallback) {
      Utils.callService(restEndpoint + 'msc/createEmptyMicroserviceConfiguration', null, null, successCallback, failureCallback);
    }
  };

  return function (config) {

    var inputTableModule = null;
    var _lastMicroserviceSelectedDetails = null;

    var connectors = '';
    _statics.getAvailableConnectors(config.mscEndpoint, function (data) {
      connectors = data;
    }, function (error) {
      Utils.showError(error, _dom.messageDiv);
    });

    var _dom = {
      allMicroserviceSelect: $('<select class="form-control">').change(function () {
        _dom.allMicroserviceOperationsSelect.empty().append('<option value="">Select an operation</option>');
        var microserviceId = _dom.allMicroserviceSelect.val();
        if (microserviceId != '') {
          _statics.retrieveMicroserviceDetails(config.mscEndpoint, microserviceId, function (msDetails) {
            _lastMicroserviceSelectedDetails = msDetails;
            Object.keys(msDetails.operations).forEach(function (operationId) {
              _dom.allMicroserviceOperationsSelect.append('<option value="' + operationId + '">' + msDetails.operations[operationId].name + '</option>');
            });
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }
        _dom.allMicroserviceOperationsSelect.trigger('change');
      }).popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Description',
        content: function () {
          return (_lastMicroserviceSelectedDetails && _lastMicroserviceSelectedDetails.description) ? _lastMicroserviceSelectedDetails.description : 'No microservice selected';
        },
        trigger: 'hover'
      }),

      allMicroserviceOperationsSelect: $('<select class="form-control">').popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Description',
        content: function () {
          return (_lastMicroserviceSelectedDetails && _lastMicroserviceSelectedDetails.operations && _lastMicroserviceSelectedDetails.operations[_dom.allMicroserviceOperationsSelect.val()]) ? _lastMicroserviceSelectedDetails.operations[_dom.allMicroserviceOperationsSelect.val()].description : 'No operation selected';
        },
        trigger: 'hover'
      }),

      addMicroserviceBtn: $('<button class="btn btn-default" type="button">Add</button>').click(function () {
        try {
          var microserviceId = _dom.allMicroserviceSelect.val();
          var operationId = _dom.allMicroserviceOperationsSelect.val();
          if (microserviceId == '' || operationId == '')
            throw 'Select a microservice and an operation';

          inputTableModule.addRowDialog(microserviceId, operationId);
        } catch (error) {
          Utils.showError(error, _dom.messageDiv);
        }
      }),

      demoMicroserviceBtn: $('<button class="btn btn-default" type="button">New Demo</button>').click(function () {
        //window.open(config.mscEndpoint, '_blank').focus();
        _statics.createDemoMicroserviceConfiguration(config.mscEndpoint, function (data) {

          var msModule = newMSModule({
              lang: 'en',
              mscEndpoint: config.mscEndpoint,
              connectors: connectors
            });
          msModule.setContent(data);
          Utils.createDialogBootstrap(msModule.render(), 'New microservice', function () {
            return true;
          }, function () {
            var msConfig = msModule.getContent();
            _statics.createMicroservice(config.mscEndpoint, msConfig, function () {
              _fns.loadMicroserviceSelect();
              Utils.showSuccess('Microservice created', _dom.messageDiv);
            }, function (error) {
              Utils.showError(error, _dom.messageDiv);
            });
          }, function () {});

        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      }),

      newMicroserviceBtn: $('<button class="btn btn-default" type="button">New</button>').click(function () {

        var msModule = newMSModule({
            lang: 'en',
            mscEndpoint: config.mscEndpoint,
            connectors: connectors
          });
        Utils.createDialogBootstrap(msModule.render(), 'New microservice', function () {
          return true;
        }, function () {
          var msConfig = msModule.getContent();
          _statics.createMicroservice(config.mscEndpoint, msConfig, function () {
            _fns.loadMicroserviceSelect();
            Utils.showSuccess('Microservice created', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }, function () {});

      }),

      saveBtn: $('<button class="btn btn-default" type="button">Save</button>').click(function () {
        var config = inputTableModule.getContent();
        $.ajax({
          type: 'POST',
          url: document.location.href + '&save=true',
          data: 'config=' + encodeURIComponent(JSON.stringify(config)),
          success: function (data) {
            if (data.indexOf('OK_UNIQUE_ID_a2317769-1bc0-429a-b97f-5c866c863894') !== -1) {
              Utils.showSuccess('Configuration correctly saved', _dom.messageDiv);
            } else if (data.indexOf('ERROR_UNIQUE_ID_a2317769-1bc0-429a-b97f-5c866c863894') !== -1) {
              var msg = data.substring(data.indexOf('ERROR_UNIQUE_ID_a2317769-1bc0-429a-b97f-5c866c863894') + 'ERROR_UNIQUE_ID_a2317769-1bc0-429a-b97f-5c866c863894'.length, data.indexOf('ERROR_END_UNIQUE_ID_a2317769-1bc0-429a-b97f-5c866c863894'));
              Utils.showError(msg, _dom.messageDiv);
            } else
              Utils.showError('Unexpected status', _dom.messageDiv);
          },
          error: function (error) {
            Utils.showError(error, _dom.messageDiv);
            console.log('error: ' + error);
          }
        });
      }),

      messageDiv: $('<div>')
    };

    var _fns = {

      loadMicroserviceSelect: function () {
        _statics.retrieveAllMicroservices(config.mscEndpoint, function (msInfos) {
          _dom.allMicroserviceSelect.empty().append('<option value="">Select a Microservice</option>');
          Object.keys(msInfos).forEach(function (microservicesId) {
            _dom.allMicroserviceSelect.append('<option value="' + microservicesId + '">' + msInfos[microservicesId].name + '</option>');
          });
          _dom.allMicroserviceSelect.trigger('change');
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      },

      initInputTableModule: function () {
        inputTableModule = newInputTableModule(config.mscEndpoint);
        inputTableModule.setContent(config.contentJsonArray);
      },

      init: function () {
        _fns.initInputTableModule();
        _fns.loadMicroserviceSelect();
      }
    };

    _fns.init();

    return {
      render: function () {
        return $('<div>').append(
          $('<div class="input-group">').append(
            '<span class="input-group-addon">Select a Microservice</span>').append(
            _dom.allMicroserviceSelect).append(
            '<span class="input-group-addon"></span>').append(
            _dom.allMicroserviceOperationsSelect).append(
            $('<span class="input-group-btn">').append(
              _dom.addMicroserviceBtn).append(
              _dom.newMicroserviceBtn).append(
              _dom.demoMicroserviceBtn))).append('<br>').append(
          inputTableModule.render()).append('<br>').append(
          _dom.saveBtn).append(
          _dom.messageDiv);
      }
    };
  };
}
  (Utils, newInputTableModule, newMSModule));

var MSC2 = (function (Utils, newMSModule) {

  var newMSRow = (function () {
    return function (config = {}) {

      return {
        render: function () {
          return null;
        }

      };
    };
  }
    ());

  return function (config = {}) {

    var _subs = {};

    var _doms = {
      msListDiv: $('<div class="list-group">'),
      addMicroserviceBtn: $('<button class="btn btn-default" type="button">New Microservice</button>').click(function () {})
    };

    return {
      render: function () {
        return $('<div>').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-3">').append(
              _doms.addMicroserviceBtn))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              _doms.msListDiv)));
      },
      setContent: function (content = {}) {}
    }
  };
}
  ());