'use strict';
this.olive = {
  modules: {}
};
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
olive.modules.newTable = (function () {
  
  var _newRow = (function () {
    var _statics = {
      init: {
        initDom: function (_dom, fieldList, rowThis) {
          fieldList.forEach(function (field) {
            var name = field.name || '';
            if(name==='') throw 'Table field name required';
            var type = field.type || 'input'; //or button
            var text = field.text || '';
            var iconClass = field.iconClass || '';
            var style = field.style || '';
            var fn = field.fn || function () {};
            if(type==='input')
              _dom[name] = $('<input type="text" class="form-control">');
            else
              _dom[name] = $('<div class="input-group-addon link" style="'+style+'">'+text+'</div>').click(function () {
                fn(rowThis);
              });
            if(iconClass!='')
              _dom[name].append('<span class="'+iconClass+'"></span>');
          });
        }
      },
      ui: {
        render: function (_dom, fieldList) {
          var root = $('<div class="input-group">');
          fieldList.forEach(function (field) {
            if(field.type!=='button')
              root.append('<span class="input-group-addon">'+(field.text || field.name)+': </span>');
            root.append(_dom[field.name]);
          });
          return root;
        },
        getContent: function (_dom, fieldList) {
          var ret = {};
          fieldList.forEach(function (field) {
            if(field.type!=='button')
              ret[field.name] = _dom[field.name].val();
          });
          return ret;
        },
        setContent: function (_dom, content) {
          Object.keys(content).forEach(function (key) {
            _dom[key].val(content[key]);
          });
        }
      }
    };
    return function (config={}) {
      var fieldList = config.fieldList || [];
      var _dom = {};
      
      var rowThis = {
        render: function () {
          return _statics.ui.render(_dom, fieldList);
        },
        getContent: function () {
          return _statics.ui.getContent(_dom, fieldList);
        },
        setContent: function (content={}) {
          _statics.ui.setContent(_dom, content);
        }
      };
      
      _statics.init.initDom(_dom, fieldList, rowThis);
      
      return rowThis;
    };
  }());
  
  var _statics = {
    ui: {
      render: function (_dom) {
        return $('<table class="table table-condensed table-hover">').append(
          _dom.rootTbody);
      },
      getContent: function (_dom, _sub) {
        return _sub.rowList.map(function (row) {
          return row.getContent();
        });
      },
      setContent: function (_dom, _sub, fieldList, rowContentList) {
        _dom.rootTbody.empty();
        _sub.rowList = [];
        rowContentList.forEach(function (rowContent) {
          _statics.ui.addRow(_dom, _sub, fieldList, rowContent);
        });
      },
      addRow: function (_dom, _sub, fieldList, rowContent) {
        var tr = $('<tr>');
        var row = null;
        var removeRowFn = function () {
          tr.remove();
          _sub.rowList.splice(_sub.rowList.indexOf(row), 1);
        };
        fieldList.push({
          name: 'removeRow',
          type: 'button',
          text: '&times;',
          iconClass: '',
          style: 'font-size:20px;font-weight:700;',
          fn: removeRowFn
        });
        row = _newRow({
          fieldList: fieldList
        });
        row.setContent(rowContent);
        _sub.rowList.push(row);
        _dom.rootTbody.append(
          tr.append(
            $('<td>').append(
              row.render())));
      }
      
    }
  };
  
  return function (config={}) {
    var fieldList = config.fieldList || [];
    
    var _sub = {
      rowList: []
    };
    var _dom = {
      rootTbody: $('<tbody>')
    };
    
    return {
      render: function () {
        return _statics.ui.render(_dom);
      },
      getContent: function () {
        return _statics.ui.getContent(_dom, _sub);
      },
      setContent: function (contentList=[]) {
        _statics.ui.setContent(_dom, _sub, fieldList, contentList);
      },
      addRow: function (content={}) {
        _statics.ui.addRow(_dom, _sub, fieldList, content);
      }
    };
  };
}());

//------------------------------------------------------------------------
olive.modules.newMicroserviceCallConfigUI = (function (Utils, ace) {

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
      showMSResult: function (output, adaptationAlg, originalResultTxt, adaptedResultDiv, messagesDiv) {
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
        }
    },
    init: {
      initACEEditor: function (_dom, _state) {
        _state.aceEditor = ace.edit(_dom.microserviceOutputAdaptAlgDiv[0], {
            mode: "ace/mode/javascript",
            autoScrollEditorIntoView: true,
            minLines: 5
          });
      },
      initMsInputsDom: function (_dom, _state, mscEndpoint, microserviceId, operationId) {
        _statics.services.getMicroserviceIOInfo(mscEndpoint, microserviceId, operationId, function (msIOInfo) {
          Object.keys(msIOInfo.requiredInputTemplate).forEach(function (inputId) {
            _state.requiredInputs[inputId] = {
              value: ''
            };
            var inputInfos = msIOInfo.requiredInputTemplate[inputId];
            _dom.inputTxts[inputId] = $('<textarea style="resize:vertical;" rows="1" class="form-control" placeholder="' + inputInfos.workingExample + '">' + inputInfos.workingExample + '</textarea>');
            _dom.resultDescriptionSpan.text(msIOInfo.outputDescription);
            _dom.callEndpointSpan.text(mscEndpoint + '?microserviceId=' + microserviceId + '&operationId=' + operationId);
            _dom.callInputJsonPre.html(JSON.stringify(_state.requiredInputs, null, 4));

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
        return _dom.rootNode.append(_dom.messageDiv).append(
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
      afterRender: function (_dom, _state) {
        _dom.microserviceOutputAdaptAlgDiv.width(_dom.microserviceOutputAdaptAlgDiv.parent().width());
        _dom.microserviceOutputAdaptAlgDiv.height(250);
        _statics.init.initACEEditor(_dom, _state);
        _state.aceEditor.resize();
      },
      getContent: function (_dom, _state) {
        return {
          microserviceInputs: (function () {
            Object.keys(_state.requiredInputs).forEach(function (inputId) {
              _state.requiredInputs[inputId].value = _dom.inputTxts[inputId].val();
            });
            return _state.requiredInputs;
          }()),
          serviceName: _dom.serviceNameTxt.val(),
          microserviceOutputAdaptAlg: _state.aceEditor.getValue()
        };
      },
      setContent: function (_dom, _state, content) {
        _dom.serviceNameTxt.val(content.menuName || '');
        Object.keys(_dom.inputTxts).forEach(function (inputId) {
          _dom.inputTxts[inputId].val(content.microserviceInputs && content.microserviceInputs[inputId] && content.microserviceInputs[inputId].value?content.microserviceInputs[inputId].value:'');
        });
        if(_state.aceEditor)
          _state.aceEditor.setValue(content.microserviceOutputAdaptAlg || '');
        else
          throw 'aceEditor not initialized';
      }
    }
  };

  return function (config={}) {
    var mscEndpoint = config.mscEndpoint || '';
    var microserviceId = config.microserviceId || '';
    var operationId = config.operationId || '';
    var forceStartWhenStopped = config.forceStartWhenStopped || true;
    
    var _state = {
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
        Object.keys(_state.requiredInputs).forEach(function (inputId) {
          _state.requiredInputs[inputId].value = _dom.inputTxts[inputId].val();
        });
        _dom.callInputJsonPre.html(JSON.stringify(_state.requiredInputs, null, 4));
        if (forceStartWhenStopped) {
          _statics.services.callMicroserviceForced(mscEndpoint, microserviceId, operationId, _state.requiredInputs, function (output) {
            _statics.view.showMSResult(output, _state.aceEditor.getValue(), _dom.resultTxt, _dom.resultDemoDiv, _dom.rootNode);
          }, function (error) {
            Utils.showError(error, _dom.rootNode);
          });
        } else {
          _statics.services.callMicroservice(mscEndpoint, microserviceId, operationId, _state.requiredInputs, function (output) {
            _statics.view.showMSResult(output, _state.aceEditor.getValue(), _dom.resultTxt, _dom.resultDemoDiv, _dom.rootNode);
          }, function (error) {
            Utils.showError(error, _dom.rootNode);
          });
        }
      }),
      microserviceOutputAdaptAlgDiv: $('<div>')
    };

    _statics.init.initMsInputsDom(_dom, _state, mscEndpoint, microserviceId, operationId);

    return {
      getContent: function () {
        return _statics.ui.getContent(_dom, _state);
      },
      setContent: function (content={}) {
        _statics.ui.setContent(_dom, _state, content);
      },
      render: function () {
        return _statics.ui.render(_dom);
      },
      afterRender: function () {
        _statics.ui.afterRender(_dom, _state);
      }
    };
  }
}(olive.utils, ace));

//------------------------------------------------------------------------
olive.modules.newMicroserviceCallViewUI = (function (Utils) {

  var _statics = {
    services: {
      callMicroserviceForced: function (restEndpoint, microserviceId, operationId, inputs, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/callMicroserviceForced', 'microserviceId=' + microserviceId + '&operationId=' + operationId, inputs, successCallback, failureCallback);
      }
    },
    init: {
      loadContent: function (_dom, msConfig, mscEndpoint) {
        _dom.outputDiv.addClass('loading');

        _statics.services.callMicroserviceForced(mscEndpoint, msConfig.microserviceId, msConfig.operationId, msConfig.microserviceInputJSON, function (data) {
          _dom.outputDiv.removeClass('loading');

          var alg = msConfig.microserviceOutputAdaptAlg;
          if (alg.indexOf('return') === -1) {
            alg = 'return $("<pre>").append($("<code>").append(JSON.stringify(output, null, 2)));';
          }
          try {
            var algF = new Function('output', alg + '\n//# sourceURL=microservice_custom_alg.js');
            var domOut = algF(data);
            _dom.outputDiv.empty().append(domOut);
          } catch (e) {
            Utils.showError(e, _dom.messageDiv);
          }

        }, function (error) {
          _dom.outputDiv.removeClass('loading');
          Utils.showError(error, _dom.messageDiv);
        });
      }
    },
    ui: {
      render: function (_dom, msConfig) {
        var menuName = msConfig.menuName || '';
        return $('<div id="' + menuName.replace(' ', '_') + '" class="panel panel-default">').append(
          _dom.panelHeader.append(
            '<h4 class="panel-title">' + menuName + ' <span class="caret"></span></h4>')).append(
          _dom.panelCollapsable.append(
            $('<div class="panel-body">').append(
              _dom.messageDiv).append(
              _dom.outputDiv)));
      }
    }
  };

  return function (config={}) {
    var msConfig = config.msConfig || {};
    var mscEndpoint = config.mscEndpoint || '';

    var _dom = {
      panelHeader: $('<div class="panel-heading link">').click(function () {
        _dom.panelCollapsable.collapse('toggle');
      }),
      panelCollapsable: $('<div class="panel-collapse">'),
      messageDiv: $('<div>'),
      outputDiv: $('<div>')
    };

    _statics.init.loadContent(_dom, msConfig, mscEndpoint);

    return {
      render: function () {
        return _statics.ui.render(_dom, msConfig);
      }
    };
  };
}(olive.utils));


//------------------------------------------------------------------------
olive.modules.newOliveViewUI = (function (newMicroserviceCallViewUI) {

  var _statics = {
    init: {
      loadPanels: function (_dom, config) {
        var showAll = true;
        config.contentJsonArray.forEach(function (serviceConfig) {
          if (config.viewName === serviceConfig.menuName)
            showAll = false;
        });
        config.contentJsonArray.forEach(function (serviceConfig) {
          if (showAll || config.viewName === serviceConfig.menuName) {
            var singleService = newMicroserviceCallViewUI({
                msConfig: serviceConfig,
                mscEndpoint: config.mscEndpoint
              });
            _dom.panelList.push(singleService.render());
          }
        });
      }
    },
    ui: {
      render: function (_dom) {
        return $('<div>').append(
          _dom.messageDiv
        ).append(
          _dom.panelList);
      }
    }
  };

  return function (config = {}) {
    config.contentJsonArray = config.contentJsonArray || [];
    config.viewName = config.viewName || '';
    config.mscEndpoint = config.mscEndpoint || '';
    
    var _dom = {
      messageDiv: $('<div>'),
      panelList: []
    };
    
    _statics.init.loadPanels(_dom, config);
    
    return {
      render: function () {
        return _statics.ui.render(_dom);
      }
    };
  };
}(olive.modules.newMicroserviceCallViewUI));

