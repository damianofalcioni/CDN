'use strict';
(function (root, factory) {
  root.olive = factory(root.jQuery);
}(typeof window !== "undefined" ? window : this, function ($) {
if (typeof $.fn.popover != 'function') throw 'Bootstrap Required';

var olive = {
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
    
    getHost: function () {
      var ret = ((window.location.protocol == '')?'http:':window.location.protocol) + '//' + ((window.location.hostname == '')?'127.0.0.1':window.location.hostname) + ':' + ((window.location.port == '')?'8080':window.location.port);
      return ret;
    },
    
    getPageUrl: function () {
      return _utils.getHost() + window.location.pathname;
    },
    
    getURLParameter: function (sParam) {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
          return sParameterName[1];
      }
      return null;
    },

    neverNull: function (param) {
      return param == null ? '' : param;
    },

    generateUUID: function () {
      var d = new Date().getTime();
      if (typeof performance !== 'undefined' && typeof performance.now === 'function')
        d += performance.now(); //use high-precision timer if available

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
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
    },
    
    clone: function (obj) {
      return JSON.parse(JSON.stringify(obj));
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
              ret[field.name] = _dom[field.name].val().replace(/\\n/g,"\n");
          });
          return ret;
        },
        setContent: function (_dom, content) {
          Object.keys(content).forEach(function (key) {
            _dom[key].val(content[key].replace(/\n/g,"\\n"));
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
/*
Example:
var widgetRoot = $('<div>');
var widget = olive.modules.newWidgetView({
  removeBtnClickFn: function () {
      widgetRoot.empty();
  },
  mappingFn: function (out, inp, conf) {
      Object.assign(inp, {
          menuName: out.serviceName,
          microserviceId: microserviceId,
          operationId: operationId,
          microserviceInputJSON: JSON.stringify(out.microserviceInputs),
          microserviceOutputAdaptAlg: out.microserviceOutputAdaptAlg,
      });
      widget.setWidgetTitle(out.serviceName);
  },
  newRenderModule: olive.modules.newMicroserviceCallViewUI,
  newRenderModuleConfig: {
      mscEndpoint: mscEndpoint
  },
  newContentModule: olive.modules.newMicroserviceCallConfigUI,
  newContentModuleConfig: {
      mscEndpoint: mscEndpoint,
      microserviceId: microserviceId,
      operationId: operationId,
      forceStartWhenStopped: true,
      showServiceNameTxt: true
  }
});
$('#managementBody').append(widgetRoot.append(widget.render()));
widget.afterRender();
widget.setContent(msCallConfig);
*/
olive.modules.newWidgetView = (function (Utils) {
  var _statics = {
    ui: {
      render: function (_dom) {
        return _dom.panelRoot.append(
          _dom.panelHeader.append(
            $('<h4 class="panel-title">').append(
              _dom.panelTitle).append(
              ' <span class="caret"></span>').append(
              $('<div class="btn-group pull-right">').append(
                _dom.refeshBtn).append(
                _dom.settingBtn).append(
                _dom.deleteBtn)))).append(
          _dom.panelCollapsable.append(
            $('<div class="panel-body">').append(
              _dom.messageDiv).append(
              _dom.rootDiv)));
      },
      setContent: function (_dom, _state, config, content) {
        _state.content = content;
        _statics.widget.loadContent(_dom, config, _state);
      }
    },
    init: {
      initButtonsVisibility: function (_dom, config) {
        _dom.refeshBtn.toggle(config.newRenderModule?config.refreshBtnVisible:false);
        _dom.settingBtn.toggle(config.newContentModule?config.settingBtnVisible:false);
        _dom.deleteBtn.toggle(config.removeBtnClickFn?config.deleteBtnVisible:false);
      }
    },
    widget: {
      setTitle: function (_dom, title) {
        _dom.panelRoot.attr('id', title.replace(' ', '_'));
        _dom.panelTitle.html(title);
      },
      loadContent: function (_dom, config, _state) {
        try {
          if(config.newRenderModule == null) throw 'newRenderModule not provided';
          _dom.rootDiv.empty();
          var newRenderModuleConfig = {};
          var newRenderModuleContent = {};
          if(_state.content)
            config.mappingFn(_state.content, newRenderModuleContent, newRenderModuleConfig);
          Object.assign(newRenderModuleConfig, config.newRenderModuleConfig);
          var renderModule = config.newRenderModule(newRenderModuleConfig);
          if(!renderModule.setContent) throw 'setContent function required for the newRenderModule';
          if(!renderModule.render) throw 'render function required for the newRenderModule';
          _dom.rootDiv.append(renderModule.render());
          if(renderModule.afterRender)
            renderModule.afterRender();
          renderModule.setContent(newRenderModuleContent);
        } catch (error) {
          Utils.showError(error, _dom.messageDiv);
        }
      },
      loadConfig: function (_dom, config, _state) {
        try {
          if(config.newContentModule == null) throw 'newContentModule not provided';
          _dom.rootDiv.empty();
          var contentModule = config.newContentModule(config.newContentModuleConfig);
          if(!contentModule.setContent) throw 'setContent function required for the newContentModule';
          if(!contentModule.getContent) throw 'getContent function required for the newContentModule';
          if(!contentModule.render) throw 'render function required for the newContentModule';
          _dom.rootDiv.append(contentModule.render());
          if(contentModule.afterRender)
            contentModule.afterRender();
          if(_state.content)
            contentModule.setContent(_state.content);
          _dom.rootDiv.append(
            '<br><br>').append(
            $('<button title="Save" class="btn btn-primary">Save</button>').click(function () {
            _state.content = contentModule.getContent();
            _statics.widget.loadContent(_dom, config, _state);
          }));
        } catch (error) {
          Utils.showError(error, _dom.messageDiv);
        }
      }
    }
  };
  
  return function (config={}) {
    config.removeBtnClickFn = config.removeBtnClickFn || null;
    config.refreshBtnVisible = config.refreshBtnVisible!=null?config.refreshBtnVisible:true;
    config.settingBtnVisible = config.settingBtnVisible!=null?config.settingBtnVisible:true;
    config.deleteBtnVisible = config.deleteBtnVisible!=null?config.deleteBtnVisible:true;
    config.mappingFn = config.mappingFn || function (out, inp, conf) { Object.assign(inp, out); };
    config.newRenderModule = config.newRenderModule || null;
    config.newRenderModuleConfig = config.newRenderModuleConfig || {};
    config.newContentModule = config.newContentModule || null;
    config.newContentModuleConfig = config.newContentModuleConfig || {};
    
    var _state = {
      content: null
    };
    
    var _dom = {
      rootDiv: $('<div>'),
      panelHeader: $('<div class="panel-heading clearfix link">').click(function () {
        _dom.panelCollapsable.collapse('toggle');
      }),
      panelRoot: $('<div class="panel panel-default">'),
      panelTitle: $('<span>'),
      panelCollapsable: $('<div class="panel-collapse">'),
      messageDiv: $('<div>'),
      refeshBtn: $('<button title="Refresh" class="btn btn-default btn-xs">Refresh</button>').click(function (e) { //btn-sm <span class="glyphicon glyphicon-refresh"></span>
        e.stopPropagation();
        _statics.widget.loadContent(_dom, config, _state);
      }),
      settingBtn: $('<button title="Configure" class="btn btn-default btn-xs">Configure</button>').click(function (e) {//btn-sm <span class="glyphicon glyphicon-wrench"></span>
        e.stopPropagation();
        _statics.widget.loadConfig(_dom, config, _state);
      }),
      deleteBtn: $('<button title="Remove" class="btn btn-default btn-xs">Remove</button>').click(function(e) { //btn-sm <span class="glyphicon glyphicon-trash"></span>
        e.stopPropagation();
        if(config.removeBtnClickFn)
          config.removeBtnClickFn();
      })
    };
    
    _statics.init.initButtonsVisibility(_dom, config);
    
    return {
      render: function () {
        return _statics.ui.render(_dom);
      },
      afterRender: function () {
        if(config.newContentModule != null) 
          _statics.widget.loadConfig(_dom, config, _state);
      },
      setContent: function (content={}) {
        _statics.ui.setContent(_dom, _state, config, content);
      },
      setWidgetTitle: function (title) {
        _statics.widget.setTitle(_dom, title);
      }
    };
  };
}(olive.utils));

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
          if (adaptationAlg.indexOf('return ') === -1) {
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
      initMsInputsDom: function (_dom, _state, mscEndpoint, microserviceId, operationId, afterInitFn = function(){}) {
        _statics.services.getMicroserviceIOInfo(mscEndpoint, microserviceId, operationId, function (msIOInfo) {
          _dom.tableTbody.empty();
          _state.requiredInputs = {};
          Object.keys(msIOInfo.requiredInputTemplate).forEach(function (inputId) {
            _state.requiredInputs[inputId] = {
              value: ''
            };
            var inputInfos = msIOInfo.requiredInputTemplate[inputId];
            _dom.inputTxts[inputId] = $('<textarea style="resize:vertical;" rows="1" class="form-control" placeholder="' + inputInfos.workingExample + '">' + inputInfos.workingExample + '</textarea>');
            _dom.resultDescriptionSpan.text(msIOInfo.outputDescription);
            _dom.callEndpointSpan.text(mscEndpoint + '?microserviceId=' + microserviceId + '&operationId=' + operationId);
            _dom.callMicroserviceIdSpan.text(microserviceId);
            _dom.callMicroserviceOperationIdSpan.text(operationId);
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
          afterInitFn();
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      }
    },
    ui: {
      render: function (_dom, _state) {
        return _dom.rootNode.append(_dom.messageDiv).append(
          $('<div>').toggle(_state.showServiceNameTxt).append(
            $('<div class="input-group">').append(
              '<span class="input-group-addon">Service Name: </span>').append(
              _dom.serviceNameTxt))).append('<br>').append(
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
                '<b>Miscroservice ID: </b>').append(
                _dom.callMicroserviceIdSpan).append(
                '<br><b>Microservice Operation: </b>').append(
                _dom.callMicroserviceOperationIdSpan).append(
                '<br><br><b>POST Endpoint</b><br>').append(
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
                  $('<h4 class="panel-title">Service Output Post-Rendering Preview</h4>'))).append(
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
        var microserviceInputs = (function () {
          Object.keys(_state.requiredInputs).forEach(function (inputId) {
            _state.requiredInputs[inputId].value = _dom.inputTxts[inputId].val();
          });
          return _state.requiredInputs;
        }());
        return {
          microserviceInputs: microserviceInputs,
          serviceName: _dom.serviceNameTxt.val(),
          microserviceOutputAdaptAlg: _state.aceEditor.getValue()
        };
      },
      setContent: function (_dom, _state, config, content) {
        _dom.serviceNameTxt.val(content.serviceName || '');
        
        _statics.init.initMsInputsDom(_dom, _state, config.mscEndpoint, config.microserviceId, config.operationId, function () {
          Object.keys(_dom.inputTxts).forEach(function (inputId) {
            _dom.inputTxts[inputId].val(content.microserviceInputs && content.microserviceInputs[inputId] && content.microserviceInputs[inputId].value?content.microserviceInputs[inputId].value:'');
          });
        });
        
        if(_state.aceEditor)
          _state.aceEditor.setValue(content.microserviceOutputAdaptAlg || '/*\n  Javascript algoritm that "return" a DOM object.\n  The algorithm can access the microservice output content\n  using the variable "output"\n*/');
        else
          throw 'aceEditor not initialized';
      }
    }
  };

  return function (config={}) {
    var mscEndpoint = config.mscEndpoint || '';
    var microserviceId = config.microserviceId || '';
    var operationId = config.operationId || '';
    var forceStartWhenStopped = config.forceStartWhenStopped!=null?config.forceStartWhenStopped:true;
    var showServiceNameTxt = config.showServiceNameTxt!=null?config.showServiceNameTxt:true;
    
    var _state = {
      requiredInputs: {},
      aceEditor: null,
      showServiceNameTxt: showServiceNameTxt
    };
    
    var _dom = {
      rootNode: $('<div>'),
      messageDiv: $('<div>'),
      serviceNameTxt: $('<input type="text" class="form-control" placeholder="Unique Name">'),
      inputTxts: {},
      resultTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control" placeholder="Call results"></textarea>'),
      resultDescriptionSpan: $('<span>'),
      resultDemoDiv: $('<div>'),
      callMicroserviceIdSpan: $('<span>'),
      callMicroserviceOperationIdSpan: $('<span>'),
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
        _statics.ui.setContent(_dom, _state, config, content);
      },
      render: function () {
        return _statics.ui.render(_dom, _state);
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
        Utils.callService(restEndpoint + 'msc/callMicroserviceForced', 'microserviceId=' + microserviceId + '&operationId=' + operationId, JSON.stringify(inputs), successCallback, failureCallback);
      }
    },
    init: {
      checkConfig: function (config) {
        config.mscEndpoint = config.mscEndpoint || '';
      },
      loadContent: function (_dom, msConfig, mscEndpoint) {
        _dom.outputDiv.empty().addClass('loading');

        _statics.services.callMicroserviceForced(mscEndpoint, msConfig.microserviceId, msConfig.operationId, JSON.parse(msConfig.microserviceInputJSON), function (data) {
          _dom.outputDiv.removeClass('loading');

          var alg = msConfig.microserviceOutputAdaptAlg;
          if (alg.indexOf('return ') === -1) {
            alg = 'return $("<pre>").append($("<code>").append(JSON.stringify(output, null, 2)));';
          }
          try {
            var algF = new Function('output', alg + '\n//# sourceURL=microservice_custom_alg.js');
            var domOut = algF(data);
            _dom.outputDiv.append(domOut);
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
      newDom: function () {
        var _dom = {
          messageDiv: $('<div>'),
          outputDiv: $('<div>')
        };
        return _dom;
      },
      render: function (_dom) {
        return $('<div>').append(
          _dom.messageDiv).append(
          _dom.outputDiv);
      },
      setContent: function (_dom, config, content) {
        content.menuName = content.menuName || '';
        content.microserviceId = content.microserviceId || '';
        content.operationId = content.operationId || '';
        content.microserviceInputJSON = content.microserviceInputJSON || '{}';
        content.microserviceOutputAdaptAlg = content.microserviceOutputAdaptAlg || '';
        
        _statics.init.loadContent(_dom, content, config.mscEndpoint);
      }
    }
  };

  return function (config={}) {
    _statics.init.checkConfig(config);
    
    var _dom = _statics.ui.newDom();
    
    return {
      render: function () {
        return _statics.ui.render(_dom);
      },
      setContent: function (content={}) {
        return _statics.ui.setContent(_dom, config, content);
      }
    };
  };
}(olive.utils));

//------------------------------------------------------------------------
olive.modules.newMicroserviceDefinitionUI = (function (Utils, newTable) {
  
  //------------------------------------------------------------------------
  var _newMSInputsModule = (function (Utils, newTable) {
    var _statics = {
      ui: {
        newDom: function (_sub) {
          return {
            addMSInputBtn: $('<button class="btn btn-default" type="button">Add new call configuration Input</button>').click(function () {
              _sub.msInputsTableModule.addRow();
            })
          };
        },
        render: function (_dom, _sub) {
          return $('<div class="panel panel-default">').append(
            '<div class="panel-heading"><h4 class="panel-title">Call Configuration Inputs</h4></div>').append(
            $('<div class="panel-body">').append(
              $('<div class="row form-group">').append(
                $('<div class="col-lg-3">').append(
                  _dom.addMSInputBtn))).append(
              $('<div class="row form-group">').append(
                $('<div class="col-lg-12">').append(
                  _sub.msInputsTableModule.render()))));
        },
        getContent: function (_sub) {
          return Utils.arr2obj(_sub.msInputsTableModule.getContent(), 'inputId');
        },
        setContent: function (_sub, content) {
          _sub.msInputsTableModule.setContent(Utils.obj2arr(content, 'inputId'));
        }
      }
    };
    return function () {
      var _sub = {
        msInputsTableModule: newTable({
          fieldList: [{
            name: 'inputId',
            text: 'Input ID'
          }, {
            name: 'matchingName',
            text: 'Matching Name'
          }, {
            name: 'description',
            text: 'Description'
          }, {
            name: 'workingExample',
            text: 'Working Sample'
          }]
        })
      };
      var _dom = _statics.ui.newDom(_sub);
      return {
        render: function () {
          return _statics.ui.render(_dom, _sub);
        },
        getContent: function () {
          return _statics.ui.getContent(_sub);
        },
        setContent: function (content = {}) {
          _statics.ui.setContent(_sub, content);
        }
      };
    };
  }
    (Utils, newTable));

  //------------------------------------------------------------------------
  var _newConnectorConfiguration = (function (Utils) {
    var _statics = {
      services: {
        uploadLocalFile: function (restEndpoint, fileName, fileContent, successCallback, failureCallback) {
          Utils.callService(restEndpoint + 'msc/uploadLocalFile', 'fileName=' + fileName, fileContent, successCallback, failureCallback);
        }
      },
      ui: {
        newDom: function () {
          return {
            messageDiv: $('<div>'),
            tableTbody: $('<tbody>'),
            inputs: {}
          };
        },
        render: function (_dom, config) {
          return $('<div class="panel panel-default">').append(
            $('<div class="panel-heading">' + config.title + '</div>')).append(
            _dom.messageDiv).append(
            $('<table class="table table-condensed table-hover">').append(
              _dom.tableTbody));
        },
        getContent: function (_dom) {
          var ret = {};
          Object.keys(_dom.inputs).forEach(function (inputId) {
            ret[inputId] = {
              value: _dom.inputs[inputId].inputTxt.val()
            };
          });
          return ret;
        },
        setContent: function (_dom, config, content) {
          var templateInputs = content.inputTemplates || {};
          var inputs = content.inputValues || {};
          _dom.tableTbody.empty();
          Object.keys(templateInputs).forEach(function (inputId) {
            var inputName = templateInputs[inputId].name || '';
            var inputDescription = templateInputs[inputId].description[config.lang] || '';
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
                  _statics.services.uploadLocalFile(config.mscEndpoint, fileName, content, function (data) {
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
      }
    };

    return function (config) {
      config.title = config.title || '';
      config.lang = config.lang || '';
      config.mscEndpoint = config.mscEndpoint || '';

      var _dom = _statics.ui.newDom();

      return {
        render: function () {
          return _statics.ui.render(_dom, config);
        },
        setContent: function (content = {}) {
          _statics.ui.setContent(_dom, config, content);
        },
        getContent: function () {
          return _statics.ui.getContent(_dom);
        }
      };
    };
  }
    (Utils));

  //------------------------------------------------------------------------
  var _MSAsyncInputsModule = (function (Utils, newTable) {

    function MSAsyncInputsModule() {
      this._sub = {
        msAsyncInputsTableModule: newTable({
          fieldList: [{
            name: 'id',
            text: 'Asynchronous Input ID'
          }, {
            name: 'value',
            text: 'Value'
          }]
        })
      };
      this._dom = {
        inputAdaptationAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">'),
        responseServiceIdTxt: $('<input type="text" class="form-control">'),
        responseServiceOperationIdTxt: $('<input type="text" class="form-control">'),
        responseServiceInputIdTxt: $('<input type="text" class="form-control">'),
        addAsyncRespMsInputBtn: $('<button class="btn btn-default" type="button">Add Response Input</button>').click(function () {
          //FIXME: not captured by try catch
          this._sub.msAsyncInputsTableModule.addRow();
        }.bind(this))
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
                this._dom.inputAdaptationAlgorithmTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Responses to Microservice ID</span>').append(
                this._dom.responseServiceIdTxt).append(
                '<span class="input-group-addon">using Operation</span>').append(
                this._dom.responseServiceOperationIdTxt).append(
                '<span class="input-group-addon">and Input</span>').append(
                this._dom.responseServiceInputIdTxt)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-3">').append(
              this._dom.addAsyncRespMsInputBtn))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              this._sub.msAsyncInputsTableModule.render()))));
    };

    MSAsyncInputsModule.prototype.getContent = function () {
      return {
        responseServiceId: this._dom.responseServiceIdTxt.val(),
        responseServiceOperationId: this._dom.responseServiceOperationIdTxt.val(),
        responseServiceInputId: this._dom.responseServiceInputIdTxt.val(),
        inputAdaptationAlgorithm: this._dom.inputAdaptationAlgorithmTxt.val(),
        responseServiceOtherInputs: Utils.arr2obj(this._sub.msAsyncInputsTableModule.getContent(), 'id')
      };
    };

    MSAsyncInputsModule.prototype.setContent = function (content = {}) {
      this._dom.responseServiceIdTxt.val(content.responseServiceId || '');
      this._dom.responseServiceOperationIdTxt.val(content.responseServiceOperationId || '');
      this._dom.responseServiceInputIdTxt.val(content.responseServiceInputId || '');
      this._dom.inputAdaptationAlgorithmTxt.val(content.inputAdaptationAlgorithm || '');
      this._sub.msAsyncInputsTableModule.setContent(content.responseServiceOtherInputs ? Utils.obj2arr(content.responseServiceOtherInputs, 'id') : []);
    };

    return MSAsyncInputsModule;

  }
    (Utils, newTable));

  //------------------------------------------------------------------------
  var _newMSOperationModule = (function (Utils, _newConnectorConfiguration, _newMSInputsModule, _MSAsyncInputsModule) {
    var _statics = {
      init: {
        initConnectorSelect: function (_dom, config) {
          _dom.connectorIdSelect.empty().append('<option value="">Select a connector</option>');
          Object.keys(config.connectors).forEach(function (connectorId) {
            _dom.connectorIdSelect.append(
              '<option value="' + connectorId + '">' + config.connectors[connectorId].name + '</option>');
          });
          _dom.connectorIdSelect.val('').trigger('change');
        }
      },
      ui: {
        newDom: function (_sub, _state, config) {
          var _dom = {
            panelHeader: $('<div class="panel-heading link">').click(function () {
              _dom.panelCollapsable.collapse('toggle');
            }),
            panelCollapsable: $('<div class="panel-collapse collapse">'),
            panelTitleLabel: $('<span>'),
            removeRowBtn: $('<button class="btn btn-default btn-xs" type="button">Delete</button>').click(config.removeBtnHandlerFn),
            asyncInputsDiv: $('<div class="row form-group">'),
            idTxt: $('<input type="text" class="form-control">'),
            nameTxt: $('<input type="text" class="form-control">').change(function () {
              _dom.panelTitleLabel.html('Operation ' + _dom.nameTxt.val());
            }),
            descriptionTxt: $('<input type="text" class="form-control">'),
            isDefaultChk: $('<input type="checkbox" aria-label="Is default?">').change(config.defaultChkChangeHandlerFn),
            isAutostartChk: $('<input type="checkbox" aria-label="Autostart?">'),
            connectorIdSelect: $('<select class="form-control">').change(function () {
              var selectedConnectorId = _dom.connectorIdSelect.val();
              _dom.connectorDescDiv.html(config.connectors[selectedConnectorId] ? config.connectors[selectedConnectorId].description[config.lang] : '');
              _dom.connectorOutputDescTxt.val(config.connectors[selectedConnectorId] ? config.connectors[selectedConnectorId].outputDescription : '');
              _statics.ui.setConnectorRelatedContent(_dom, _sub, _state, config, selectedConnectorId);
            }),
            connectorDescDiv: $('<pre>'),
            connectorOutputDescTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control" readonly>'),
            outputDescriptionTxt: $('<textarea style="resize:vertical;" rows="5" class="form-control">'),
            outputAdaptationAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">'),
            statusCheckAlgorithmTxt: $('<textarea style="resize:vertical;" rows="10" class="form-control">')
          };
          return _dom;
        },
        render: function (_dom, _sub) {
          return $('<div class="panel panel-default">').append(
            _dom.panelHeader.append(
              $('<div class="btn-group pull-right">').append(
                _dom.removeRowBtn)).append(
              $('<h4 class="panel-title">').append(
                _dom.panelTitleLabel).append(
                ' <span class="caret">'))).append(
            _dom.panelCollapsable.append(
              $('<div class="panel-body">').append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Operation ID</span>').append(
                      _dom.idTxt).append(
                      '<span class="input-group-addon">Name</span>').append(
                      _dom.nameTxt).append(
                      '<span class="input-group-addon">Description</span>').append(
                      _dom.descriptionTxt).append(
                      '<span class="input-group-addon">Is Default?</span>').append(
                      $('<span class="input-group-addon">').append(
                        _dom.isDefaultChk)).append(
                      $('<span class="input-group-addon">Autostart?</span>')).append(
                      $('<span class="input-group-addon">').append(
                        _dom.isAutostartChk))))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-4">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Connector</span>').append(
                      _dom.connectorIdSelect))).append(
                  $('<div class="col-lg-8">').append(
                    _dom.connectorDescDiv))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-6">').append(
                    _sub.startConfigModule.render())).append(
                  $('<div class="col-lg-6">').append(
                    _sub.callConfigModule.render()))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    _sub.msInputsModule.render()))).append(
                _dom.asyncInputsDiv.append(
                  $('<div class="col-lg-12">').append(
                    _sub.msAsyncInputsModule.render()))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Connector Output Description</span>').append(
                      _dom.connectorOutputDescTxt)))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Output Description</span>').append(
                      _dom.outputDescriptionTxt)))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Output Adaptation Algorithm</span>').append(
                      _dom.outputAdaptationAlgorithmTxt)))).append(
                $('<div class="row form-group">').append(
                  $('<div class="col-lg-12">').append(
                    $('<div class="input-group">').append(
                      '<span class="input-group-addon">Status Check Algorithm</span>').append(
                      _dom.statusCheckAlgorithmTxt))))));
        },
        getContent: function (_dom, _sub, config) {
          var ret = {
            id: _dom.idTxt.val(),
            name: _dom.nameTxt.val(),
            description: _dom.descriptionTxt.val(),
            isDefault: _dom.isDefaultChk.is(':checked'),
            autostart: _dom.isAutostartChk.is(':checked'),
            configuration: {
              connectorId: _dom.connectorIdSelect.val(),
              outputDescription: _dom.outputDescriptionTxt.val(),
              outputAdaptationAlgorithm: _dom.outputAdaptationAlgorithmTxt.val(),
              statusCheckAlgorithm: _dom.statusCheckAlgorithmTxt.val(),
              configStart: _sub.startConfigModule.getContent(),
              configCall: _sub.callConfigModule.getContent(),
              inputs: _sub.msInputsModule.getContent()
            }
          };
          if (config.connectors[ret.configuration.connectorId].asyncConnectionRequired)
            ret.configuration.inputsAsync = _sub.msAsyncInputsModule.getContent();
          return ret;
        },
        setContent: function (_dom, _sub, _state, content) {
          _state.content = content;
          _dom.idTxt.val(content.id || '');
          _dom.nameTxt.val(content.name || '').trigger('change');
          _dom.descriptionTxt.val(content.description || '');
          _dom.isDefaultChk.prop('checked', content.isDefault || false);
          _dom.isAutostartChk.prop('checked', content.autostart || false);

          var configurationContent = content.configuration || {};
          var connectorId = configurationContent.connectorId || '';
          _dom.connectorIdSelect.val(connectorId).trigger('change');
        },
        setConnectorRelatedContent: function (_dom, _sub, _state, config, selectedConnectorId) {
          var actualConnectorId = _state.content.configuration ? _state.content.configuration.connectorId : '';
          var configuration = _state.content.configuration || {};
          _dom.outputDescriptionTxt.val(configuration.outputDescription && actualConnectorId === selectedConnectorId ? configuration.outputDescription : '');
          _dom.outputAdaptationAlgorithmTxt.val(configuration.outputAdaptationAlgorithm && actualConnectorId === selectedConnectorId ? configuration.outputAdaptationAlgorithm : '');
          _dom.statusCheckAlgorithmTxt.val(configuration.statusCheckAlgorithm && actualConnectorId === selectedConnectorId ? configuration.statusCheckAlgorithm : '');

          _sub.startConfigModule.setContent({
            inputTemplates: config.connectors[selectedConnectorId] ? config.connectors[selectedConnectorId].startConfigurationTemplate : {},
            inputValues: configuration.configStart && selectedConnectorId === selectedConnectorId ? configuration.configStart : {}
          });
          _sub.callConfigModule.setContent({
            inputTemplates: config.connectors[selectedConnectorId] ? config.connectors[selectedConnectorId].callConfigurationTemplate : {},
            inputValues: configuration.configCall && selectedConnectorId === selectedConnectorId ? configuration.configCall : {}
          });

          _sub.msInputsModule.setContent(configuration.inputs && actualConnectorId===selectedConnectorId?configuration.inputs:{});

          _sub.msAsyncInputsModule.setContent(configuration.inputsAsync && actualConnectorId===selectedConnectorId?configuration.inputsAsync:{});
          _dom.asyncInputsDiv.toggle(config.connectors[selectedConnectorId] && config.connectors[selectedConnectorId].asyncConnectionRequired?config.connectors[selectedConnectorId].asyncConnectionRequired:false);
        }
      }
    };
    
    return function (config = {}) {
      config.lang = config.lang || '';
      config.mscEndpoint = config.mscEndpoint || '';
      config.connectors = config.connectors || {};
      config.removeBtnHandlerFn = config.removeBtnHandlerFn || function () {};
      config.defaultChkChangeHandlerFn = config.defaultChkChangeHandlerFn || function () {};

      var _state = {
        content: {}
      };
      var _sub = {
        startConfigModule: _newConnectorConfiguration({
          title: 'Start configuration',
          lang: config.lang,
          mscEndpoint: config.mscEndpoint
        }),
        callConfigModule: _newConnectorConfiguration({
          title: 'Call configuration',
          lang: config.lang,
          mscEndpoint: config.mscEndpoint
        }),
        msInputsModule: _newMSInputsModule(),
        msAsyncInputsModule: new _MSAsyncInputsModule()
      };
      var _dom = _statics.ui.newDom(_sub, _state, config);

      _statics.init.initConnectorSelect(_dom, config);
      
      return {
        render: function () {
          return _statics.ui.render(_dom, _sub);
        },
        setContent: function (content = {}) {
          _statics.ui.setContent(_dom, _sub, _state, content);
        },
        getContent: function () {
          return _statics.ui.getContent(_dom, _sub, config);
        },
        isDefault: function () {
          return _dom.isDefaultChk.is(':checked');
        },
        setDefault: function (bool) {
          _dom.isDefaultChk.prop('checked', bool || false);
        },
        getId: function () {
          return _dom.idTxt.val();
        }
      };
    };
  }
    (Utils, _newConnectorConfiguration, _newMSInputsModule, _MSAsyncInputsModule));

  //------------------------------------------------------------------------
  var _newMSDetailsModule = (function (Utils) {
    var _statics = {
      init: {
        initSummerNote: function (_dom) {
          _dom.descriptionHtmlDiv.summernote();
        }
      },
      ui: {
        newDom: function () {
          var _dom = {
            ownerHtmlTxt: $('<input type="text" class="form-control">'),
            presentationImageUrlTxt: $('<input type="text" class="form-control">'),
            descriptionHtmlDiv: $('<div>'),
            imageUploadBtn: $('<button class="btn btn-default" type="button">Upload</button>').click(function (e) {
              e.preventDefault();
              _dom.imageUploadFile.trigger('click');
            }),
            imageUploadFile: $('<input type="file" style="display: none;">').change(function (e) {
              var fileName = e.target.files[0].name;
              Utils.readFileAsDataURL(e.target.files[0], function (content) {
                _dom.presentationImageUrlTxt.val(content);
              });
            })
          };
          _dom.descriptionHtmlParent = $('<div class="input-group">').append(
              '<span class="input-group-addon">Details</span>').append(
              _dom.descriptionHtmlDiv);
          return _dom;
        },
        render: function (_dom) {
          return $('<div>').append(
            $('<div class="row form-group">').append(
              $('<div class="col-lg-12">').append(
                $('<div class="input-group">').append(
                  '<span class="input-group-addon">Owner</span>').append(
                  _dom.ownerHtmlTxt)))).append(
            $('<div class="row form-group">').append(
              $('<div class="col-lg-12">').append(
                $('<div class="input-group">').append(
                  '<span class="input-group-addon">Image URL</span>').append(
                  _dom.presentationImageUrlTxt).append(
                  $('<span class="input-group-btn">').append(
                    _dom.imageUploadBtn).append(
                    _dom.imageUploadFile))))).append(
            $('<div class="row form-group">').append(
              $('<div class="col-lg-12">').append(
                _dom.descriptionHtmlParent)));
        },
        getContent: function (_dom) {
          return {
            ownerHtml: _dom.ownerHtmlTxt.val(),
            presentationImageUrl: _dom.presentationImageUrlTxt.val(),
            descriptionHtml: _dom.descriptionHtmlDiv.summernote('code')
          };
        },
        setContent: function (_dom, content) {
          _dom.ownerHtmlTxt.val(content.ownerHtml || '');
          _dom.presentationImageUrlTxt.val(content.presentationImageUrl || '');
          _dom.descriptionHtmlDiv.summernote('code', content.descriptionHtml || '');
        }
      }
    };
    
    return function () {
      var _dom = _statics.ui.newDom();
      _statics.init.initSummerNote(_dom);
      return {
        render: function () {
          return _statics.ui.render(_dom);
        },
        getContent: function () {
          return _statics.ui.getContent(_dom);
        },
        setContent: function (content = {}) {
          _statics.ui.setContent(_dom, content);
        }
      };
    };
  }
    (Utils));
  
  
  //------------------------------------------------------------------------
  var _statics = {
    msDefinition: {
      addOperation(_dom, _sub, config, content = {}) {
        var _localDiv = $('<div>');
        var msOperationModule = _newMSOperationModule({
            lang: config.lang,
            mscEndpoint: config.mscEndpoint,
            connectors: config.connectors,
            removeBtnHandlerFn: function () {
              //delete handler
              _localDiv.remove();
              _sub.msOperationModuleList.splice(_sub.msOperationModuleList.indexOf(msOperationModule), 1);
            },
            defaultChkChangeHandlerFn: function () {
              //is public chk change function
              if (msOperationModule.isDefault()) {
                _sub.msOperationModuleList.forEach(function (anotherOperationModule) {
                  anotherOperationModule.setDefault(false);
                });
              }
              msOperationModule.setDefault(true);
            }
          });
        msOperationModule.setContent(content);
        _sub.msOperationModuleList.push(msOperationModule);
        _dom.operationsDiv.append(
          _localDiv.append(
            msOperationModule.render()));
      }
    },
    ui: {
      newDom: function (_sub, config) {
        var _dom = {
          idTxt: $('<input type="text" class="form-control" readonly>'),
          nameTxt: $('<input type="text" class="form-control">'),
          descriptionTxt: $('<input type="text" class="form-control">'),
          isPublicChk: $('<input type="checkbox" aria-label="Is Public?">'),
          detailsDiv: $('<div class="row form-group">').hide(),
          operationsDiv: $('<div>'),
          showDetailsBtn: $('<button class="btn btn-default" type="button">Show Details</button>').click(function () {
            _dom.detailsDiv.toggle();
            if (_dom.detailsDiv.is(':visible'))
              _dom.showDetailsBtn.html('Hide Details');
            else
              _dom.showDetailsBtn.html('Show Details');
          }),
          addOperationBtn: $('<button class="btn btn-default" type="button">New Operation</button>').click(function () {
            _statics.msDefinition.addOperation(_dom, _sub, config, {});
          })
        };
        return _dom;
      },
      render: function (_dom, _sub) {
        return $('<div>').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Microservice Name</span>').append(
                _dom.nameTxt).append(
                '<span class="input-group-addon">Description</span>').append(
                _dom.descriptionTxt).append(
                '<span class="input-group-addon">Is Public?</span>').append(
                $('<span class="input-group-addon">').append(
                  _dom.isPublicChk)).append(
                $('<span class="input-group-btn">').append(
                  _dom.showDetailsBtn))))).append(
          _dom.detailsDiv.append(
            $('<div class="col-lg-12">').append(
              _sub.msDetailsModule.render()))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-3">').append(
              _dom.addOperationBtn))).append(
          _dom.operationsDiv);
      },
      getContent: function (_dom, _sub, _state) {
        var ops = {};
        var defaultOpId = _sub.msOperationModuleList[0] ? _sub.msOperationModuleList[0].getId() : '';
        _sub.msOperationModuleList.forEach(function (operationModule) {
          var opContent = operationModule.getContent();
          var opId = opContent.id;
          delete opContent.id;
          ops[opId] = opContent;
          if (opContent.isDefault)
            defaultOpId = opId;
        });
        var more = _sub.msDetailsModule.getContent();
        more.visible = _dom.isPublicChk.is(':checked');
        return {
          id: _state.microserviceId,
          name: _dom.nameTxt.val(),
          description: _dom.descriptionTxt.val(),
          public: _dom.isPublicChk.is(':checked'),
          defaultOperationId: defaultOpId,
          operations: ops,
          moreInfos: more
        };
      },
      setContent: function (_dom, _sub, _state, config, content = {}) {
        _state.microserviceId = content.id || '';
        _dom.idTxt.val(content.id || '');
        _dom.nameTxt.val(content.name || '');
        _dom.descriptionTxt.val(content.description || '');
        _dom.isPublicChk.prop('checked', content.public || false);
        _sub.msDetailsModule.setContent(content.moreInfos || {});
        _dom.operationsDiv.empty();
        _sub.msOperationModuleList = [];
        var operations = content.operations || {};
        Object.keys(operations).forEach(function (operationId) {
          var operationConfig = operations[operationId];
          operationConfig.id = operationId;
          operationConfig.isDefault = (operationId === content.defaultOperationId);
          _statics.msDefinition.addOperation(_dom, _sub, config, operationConfig);
        });
      }
    }
  };
  
  return function (config = {}) {
    config.lang = config.lang || '';
    config.mscEndpoint = config.mscEndpoint || '';
    config.connectors = config.connectors || {};

    var _state = {
      microserviceId: ''
    };

    var _sub = {
      msDetailsModule: _newMSDetailsModule(),
      msOperationModuleList: []
    };

    var _dom = _statics.ui.newDom(_sub, config);

    return {
      render: function () {
        return _statics.ui.render(_dom, _sub);
      },
      getContent: function () {
        return _statics.ui.getContent(_dom, _sub, _state);
      },
      setContent: function (content = {}) {
        _statics.ui.setContent(_dom, _sub, _state, config, content);
      }
    };
  };
}(olive.utils, olive.modules.newTable));

//------------------------------------------------------------------------
olive.modules.newMicroserviceManagementInlineUI = (function (Utils, newTable, newMicroserviceCallConfigUI, newMicroserviceDefinitionUI) {
  var _statics = {
    services: {
      retrieveAllMicroservices: function (restEndpoint, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/retrieveAllMicroservices', null, null, successCallback, failureCallback);
      },
      retrieveMicroserviceDetails: function (restEndpoint, microserviceId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/retrieveMicroserviceDetails', 'microserviceId=' + microserviceId, null, function (data) {
          data.id = microserviceId;
          successCallback(data);
        }, failureCallback);
      },
      retrieveMicroserviceConfiguration: function (restEndpoint, microserviceId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/retrieveMicroserviceConfiguration', 'microserviceId=' + microserviceId, null, successCallback, failureCallback);
      },
      createMicroservice: function (restEndpoint, microserviceConfiguration, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/createMicroservice', null, JSON.stringify(microserviceConfiguration), successCallback, failureCallback);
      },
      updateMicroservice: function (restEndpoint, microserviceId, microserviceConfiguration, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/updateMicroservice', 'microserviceId=' + microserviceId, JSON.stringify(microserviceConfiguration), successCallback, failureCallback);
      },
      deleteMicroservice: function (restEndpoint, microserviceId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/deleteMicroservice', 'microserviceId=' + microserviceId, null, successCallback, failureCallback);
      },
      getAvailableConnectors: function (restEndpoint, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/getAvailableConnectors', null, null, successCallback, failureCallback);
      },
      createDemoMicroserviceConfiguration: function (restEndpoint, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/createDemoMicroserviceConfiguration', null, null, successCallback, failureCallback);
      },
      createEmptyMicroserviceConfiguration: function (restEndpoint, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/createEmptyMicroserviceConfiguration', null, null, successCallback, failureCallback);
      },
      startMicroservice: function (restEndpoint, microserviceId, operationId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/startMicroservice', 'microserviceId=' + microserviceId + '&operationId=' + operationId, null, successCallback, failureCallback);
      },
      startAllMicroserviceOperations: function (restEndpoint, microserviceId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/startAllMicroserviceOperations', 'microserviceId=' + microserviceId, null, successCallback, failureCallback);
      },
      stopMicroservice: function (restEndpoint, microserviceId, operationId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/stopMicroservice', 'microserviceId=' + microserviceId + '&operationId=' + operationId, null, successCallback, failureCallback);
      },
      stopAllMicroserviceOperations: function (restEndpoint, microserviceId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/stopAllMicroserviceOperations', 'microserviceId=' + microserviceId, null, successCallback, failureCallback);
      },
      checkMicroserviceConnectorStatus: function (restEndpoint, microserviceId, operationId, successCallback, failureCallback) {
        Utils.callService(restEndpoint + 'msc/checkMicroserviceConnectorStatus', 'microserviceId=' + microserviceId + '&operationId=' + operationId, null, successCallback, failureCallback);
      },
    },
    init: {
      initMicroserviceSelect: function (_dom, _state, config) {
        _statics.services.retrieveAllMicroservices(config.mscEndpoint, function (msInfos) {
          _dom.allMicroserviceSelect.empty().append('<option value="">Select a public Microservice</option>');
          Object.keys(msInfos).forEach(function (microservicesId) {
            _dom.allMicroserviceSelect.append('<option value="' + microservicesId + '">' + msInfos[microservicesId].name + '</option>');
          });
          _dom.allMicroserviceSelect.trigger('change');
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      },
      initOperationsSelect: function (_dom, _state, config, microserviceId) {
        _dom.allMicroserviceOperationsSelect.empty();
        if (microserviceId != '') {
          _dom.allMicroserviceOperationsSelect.append('<option value="">Select a Microservice Operation</option>');
          _statics.services.retrieveMicroserviceDetails(config.mscEndpoint, microserviceId, function (msDetails) {
            _state.lastMicroserviceSelectedDetails = msDetails;
            Object.keys(msDetails.operations).forEach(function (operationId) {
              _dom.allMicroserviceOperationsSelect.append('<option value="' + operationId + '">' + msDetails.operations[operationId].name + '</option>');
            });
            _dom.allMicroserviceOperationsSelect.trigger('change');
          }, function (error) {
            _dom.allMicroserviceOperationsSelect.trigger('change');
            Utils.showError(error, _dom.messageDiv);
          });
        } else {
          _dom.allMicroserviceOperationsSelect.append('<option value="">First select a Microservice</option>').trigger('change');
        }
      },
      initCheckStatusSpan: function (_dom, _state, config, microserviceId, operationId) {
        if(operationId=='') {
          _state.lastOperationStatus.status = null;
          _state.lastOperationStatus.errorDesc = null;
          _dom.checkStatusSpan.empty().append(
            _statics.utils.createSVGCircle('grey')
          );
          return;
        }
        _statics.services.checkMicroserviceConnectorStatus(config.mscEndpoint, microserviceId, operationId, function (checkStatus) {
          var status = checkStatus.connectorInstanceStatus;
          var errorDesc = checkStatus.error;
          _state.lastOperationStatus.status = status;
          _state.lastOperationStatus.errorDesc = errorDesc;
          _dom.checkStatusSpan.empty().append(
            _statics.utils.createSVGCircle(status==='STARTED'?'green':status==='STOPPED'?'red':status==='ERROR'?'yellow':'grey')
          );
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      },
      initConnectors: function (_dom, _state, config) {
        _statics.services.getAvailableConnectors(config.mscEndpoint, function (data) {
          _state.connectors = data;
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      },
      
      initMain: function (_dom, _state, config) {
        _statics.init.initConnectors(_dom, _state, config);
        _statics.init.initMicroserviceSelect(_dom, _state, config);
      }
    },
    utils: {
      createSVGCircle: function (color) {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="'+color+'" stroke="'+color+'" stroke-opacity="0.4" stroke-width="2"/></svg>';
      }
    },
    msManagement: {
      createMicroservice: function (_dom, _state, config, msConfiguration) {
        _statics.services.createMicroservice(config.mscEndpoint, msConfiguration, function (createMicroserviceReturnData) {
          _statics.init.initMicroserviceSelect(_dom, _state, config);
          _dom.microserviceIdTxt.val(createMicroserviceReturnData.microserviceId).trigger('change');
          Utils.showSuccess('Microservice created', _dom.messageDiv);
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      },
      updateMicroservice: function (_dom, _state, config, microserviceId, msConfiguration) {
        if(microserviceId != '') {
          _statics.services.updateMicroservice(config.mscEndpoint, microserviceId, msConfiguration, function () {
            _statics.init.initMicroserviceSelect(_dom, _state, config);
            _dom.microserviceIdTxt.val(microserviceId).trigger('change');
            Utils.showSuccess('Microservice updated', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }
      },
      deleteMicroservice: function (_dom, _state, config, microserviceId) {
        if(microserviceId != '') {
          _statics.services.deleteMicroservice(config.mscEndpoint, microserviceId, function () {
            _statics.init.initMicroserviceSelect(_dom, _state, config);
            _dom.microserviceIdTxt.val(microserviceId).trigger('change');
            Utils.showSuccess('Microservice deleted', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }
      },
      showMicroserviceDefinitionUI: function (_dom, config, _state, msDefinition, okHandlerFn) {
        try {
          if(!_state.connectors) throw 'connectors not initialized';
          var msModule = newMicroserviceDefinitionUI({
            lang: 'en',
            mscEndpoint: config.mscEndpoint,
            connectors: _state.connectors
          });
          msModule.setContent(msDefinition);
          
          Utils.createDialogBootstrap(msModule.render(), 'Microservice Definition', function () {
            return true;
          }, function () {
            okHandlerFn(msModule.getContent());
          }, function () {});
        }catch(e) {
          Utils.showError(e, _dom.messageDiv);
        }
      },
      showMicroserviceCallUI: function (_dom, config, microserviceId, operationId, content, okHandlerFn) {
        try {
          if (microserviceId == '' || operationId == '') throw 'Select a microservice and an operation first';
          var microserviceCallConfigUI = newMicroserviceCallConfigUI({
            mscEndpoint: config.mscEndpoint,
            microserviceId: microserviceId,
            operationId: operationId,
            forceStartWhenStopped: true,
            showServiceNameTxt: config.showServiceNameTxt
          });
          
          Utils.createDialogBootstrap(microserviceCallConfigUI.render(), 'Call Microservice with ID: ' + microserviceId + ' Operation: '+operationId, function () {
            return true;
          }, function () {
            okHandlerFn(microserviceCallConfigUI.getContent(), microserviceId, operationId);
          }, function () {
            microserviceCallConfigUI.afterRender();
            microserviceCallConfigUI.setContent(content);
          });
        }catch(e) {
          Utils.showError(e, _dom.messageDiv);
        }
      }
    },
    ui: {
      render: function (_dom) {
        /*
        return $('<div class="container-fluid">').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Microservice ID:</span>').append(
                _dom.microserviceIdTxt).append(
                '<span class="input-group-addon">or</span>').append(
                _dom.allMicroserviceSelect).append(
                _dom.deleteMicroserviceBtn).append(
                _dom.editMicroserviceBtn).append(
                _dom.newEmptyMicroserviceBtn)))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-9">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Operation Name:</span>').append(
                _dom.allMicroserviceOperationsSelect).append(
                _dom.checkStatusSpan).append(
                _dom.startMicroserviceBtn).append(
                _dom.stopMicroserviceBtn).append(
                _dom.callMicroserviceBtn)))).append(
          _dom.messageDiv);
          */
          return $('<div class="container-fluid">').append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-12">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Microservice ID:</span>').append(
                _dom.microserviceIdTxt).append(
                '<span class="input-group-addon">or</span>').append(
                _dom.allMicroserviceSelect).append(
                '<span class="input-group-addon"></span>').append(
                $('<span class="input-group-btn">').append(
                  _dom.deleteMicroserviceBtn).append(
                  _dom.editMicroserviceBtn).append(
                  _dom.newEmptyMicroserviceBtn))))).append(
          $('<div class="row form-group">').append(
            $('<div class="col-lg-9">').append(
              $('<div class="input-group">').append(
                '<span class="input-group-addon">Operation Name:</span>').append(
                _dom.allMicroserviceOperationsSelect).append(
                _dom.checkStatusSpan).append(
                $('<span class="input-group-btn">').append(
                  _dom.startMicroserviceBtn).append(
                  _dom.stopMicroserviceBtn).append(
                  _dom.callMicroserviceBtn))))).append(
          _dom.messageDiv);
      }
    }
  };

  var functionRet = function (config={}) {
    config.mscEndpoint = config.mscEndpoint || '';
    config.callConfigHandlerFn = config.callConfigHandlerFn || function (msCallConfig, microserviceId, operationId) {};
    config.callBtnText = config.callBtnText || 'Call';
    config.showServiceNameTxt = config.showServiceNameTxt!=null?config.showServiceNameTxt:true;
    
    var _state = {
      lastMicroserviceSelectedDetails: null,
      connectors: '',
      lastOperationStatus: {}
    };

    var _dom = {
      microserviceIdTxt: $('<input type="text" class="form-control" placeholder="Provide a Microservice ID">').change(function () {
        _statics.init.initOperationsSelect(_dom, _state, config, _dom.microserviceIdTxt.val());
        _dom.allMicroserviceSelect.val('');
      }).keypress(function (e) {
        if(e.which == 13) {  // the enter key code
          _statics.init.initOperationsSelect(_dom, _state, config, _dom.microserviceIdTxt.val());
          _dom.allMicroserviceSelect.val('');
        }
      }).popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Description ' + (_state.lastMicroserviceSelectedDetails && _state.lastMicroserviceSelectedDetails.id === _dom.microserviceIdTxt.val() && _state.lastMicroserviceSelectedDetails.name?_state.lastMicroserviceSelectedDetails.name:''),
        content: function () {
          return (_state.lastMicroserviceSelectedDetails && _state.lastMicroserviceSelectedDetails.id === _dom.microserviceIdTxt.val() && _state.lastMicroserviceSelectedDetails.description) ? _state.lastMicroserviceSelectedDetails.description : 'No microservice selected';
        },
        trigger: 'hover'
      }),
      allMicroserviceSelect: $('<select class="form-control">').change(function () {
        _statics.init.initOperationsSelect(_dom, _state, config, _dom.allMicroserviceSelect.val());
      }).popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Description ' + (_state.lastMicroserviceSelectedDetails && _state.lastMicroserviceSelectedDetails.id === _dom.allMicroserviceSelect.val() && _state.lastMicroserviceSelectedDetails.name?_state.lastMicroserviceSelectedDetails.name:''),
        content: function () {
          return (_state.lastMicroserviceSelectedDetails && _state.lastMicroserviceSelectedDetails.id === _dom.allMicroserviceSelect.val() && _state.lastMicroserviceSelectedDetails.description) ? _state.lastMicroserviceSelectedDetails.description : 'No microservice selected';
        },
        trigger: 'hover'
      }),
      allMicroserviceOperationsSelect: $('<select class="form-control">').change(function () {
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        var operationId = _dom.allMicroserviceOperationsSelect.val();
        _statics.init.initCheckStatusSpan(_dom, _state, config, microserviceId, operationId);
      }).popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Description',
        content: function () {
          return (_state.lastMicroserviceSelectedDetails && _state.lastMicroserviceSelectedDetails.operations && _state.lastMicroserviceSelectedDetails.operations[_dom.allMicroserviceOperationsSelect.val()]) ? _state.lastMicroserviceSelectedDetails.operations[_dom.allMicroserviceOperationsSelect.val()].description : 'No operation selected';
        },
        trigger: 'hover'
      }),
      newEmptyMicroserviceBtn: $('<button title="Create New" class="btn btn-default">Create New</button>').click(function () { //$('<span class="input-group-addon link">Create New</span>')
        _statics.services.createEmptyMicroserviceConfiguration(config.mscEndpoint, function (msDefinition) {
          _statics.msManagement.showMicroserviceDefinitionUI(_dom, config, _state, msDefinition, function (msDefinitionOut) {
            _statics.msManagement.createMicroservice(_dom, _state, config, msDefinitionOut);
          });
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      }),
      editMicroserviceBtn: $('<button title="Edit" class="btn btn-default">Edit</button>').click(function () { //<span class="input-group-addon link">Edit</span>
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        if(microserviceId === '')
          return;
        _statics.services.retrieveMicroserviceConfiguration(config.mscEndpoint, microserviceId, function (msDefinition) {
          _statics.msManagement.showMicroserviceDefinitionUI(_dom, config, _state, msDefinition, function (msDefinitionOut) {
            _statics.msManagement.updateMicroservice(_dom, _state, config, microserviceId, msDefinitionOut);
          });
        }, function (error) {
          Utils.showError(error, _dom.messageDiv);
        });
      }),
      deleteMicroserviceBtn: $('<button title="Delete" class="btn btn-default">Delete</button>').click(function () { //<span class="input-group-addon link">Delete</span>
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        _statics.msManagement.deleteMicroservice(_dom, _state, config, microserviceId);
      }),
      callMicroserviceBtn: $('<button title="Call" class="btn btn-default">'+config.callBtnText+'</button>').click(function () { // $('<span class="input-group-addon link">'+config.callBtnText+'</span>')
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        var operationId = _dom.allMicroserviceOperationsSelect.val();
        _statics.msManagement.showMicroserviceCallUI(_dom, config, microserviceId, operationId, {}, function (msCallConfig, microserviceId, operationId) {
          config.callConfigHandlerFn(msCallConfig, microserviceId, operationId);
        });
      }),
      startMicroserviceBtn: $('<button title="Start" class="btn btn-default">Start</button>').click(function () { //<span class="input-group-addon link">Start</span>
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        var operationId = _dom.allMicroserviceOperationsSelect.val();
        if(microserviceId === '')
          return;
        
        if(operationId === '') {
          _statics.services.startAllMicroserviceOperations(config.mscEndpoint, microserviceId, function () {
            _statics.init.initCheckStatusSpan(_dom, _state, config, microserviceId, operationId);
            Utils.showSuccess('All Microservice operations started', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        } else {
          _statics.services.startMicroservice(config.mscEndpoint, microserviceId, operationId, function () {
            _statics.init.initCheckStatusSpan(_dom, _state, config, microserviceId, operationId);
            Utils.showSuccess('Microservice operation "'+operationId+'" started', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }
      }),
      stopMicroserviceBtn: $('<button title="Stop" class="btn btn-default">Stop</button>').click(function () { //<span class="input-group-addon link">Stop</span>
        var microserviceId = _dom.allMicroserviceSelect.val();
        if(microserviceId === '')
          microserviceId = _dom.microserviceIdTxt.val();
        var operationId = _dom.allMicroserviceOperationsSelect.val();
        if(microserviceId === '')
          return;
        
        if(operationId === '') {
          _statics.services.stopAllMicroserviceOperations(config.mscEndpoint, microserviceId, function () {
            _statics.init.initCheckStatusSpan(_dom, _state, config, microserviceId, operationId);
            Utils.showSuccess('All Microservice operations stopped', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        } else {
          _statics.services.stopMicroservice(config.mscEndpoint, microserviceId, operationId, function () {
            _statics.init.initCheckStatusSpan(_dom, _state, config, microserviceId, operationId);
            Utils.showSuccess('Microservice operation "'+operationId+'" stopped', _dom.messageDiv);
          }, function (error) {
            Utils.showError(error, _dom.messageDiv);
          });
        }
      }),
      checkStatusSpan: $('<span class="input-group-addon">').popover({
        placement: 'auto left',
        container: 'body',
        html: true,
        title: 'Status Check',
        content: function () {
          return 'Status: ' + (_state.lastOperationStatus && _state.lastOperationStatus.status?_state.lastOperationStatus.status:'Nothing selected') + (_state.lastOperationStatus && _state.lastOperationStatus.errorDesc && _state.lastOperationStatus.errorDesc!=''?'<br>Error: '+_state.lastOperationStatus.errorDesc:'');
        },
        trigger: 'hover'
      }),
      messageDiv: $('<div>')
    };

    _statics.init.initMain(_dom, _state, config);

    return {
      render: function () {
        return _statics.ui.render(_dom);
      }
    };
  };
  
  //Statics Methods
  functionRet.showMicroserviceCallUI = _statics.msManagement.showMicroserviceCallUI;
  
  return functionRet;
}(olive.utils, olive.modules.newTable, olive.modules.newMicroserviceCallConfigUI, olive.modules.newMicroserviceDefinitionUI));


//------------------------------------------------------------------------
olive.modules.newOliveAdminUI = (function (Utils, newTable, newMicroserviceManagementInlineUI) {

  var _statics = {
    services: {
      saveOliveConfig: function (_dom, config) {
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
      }
    },
    init: {
      initInputTableModule: function (_dom, _sub, config) {
        _sub.inputTableModule = newTable({
          fieldList: [{
            name: 'menuName',
            text: 'Name',
            type: 'input'
          }, {
            name: 'microserviceId',
            text: 'Microservice ID',
            type: 'input'
          }, {
            name: 'operationId',
            text: 'Operation ID',
            type: 'input'
          }, {
            name: 'microserviceInputJSON',
            text: 'Inputs',
            type: 'input'
          }, {
            name: 'microserviceOutputAdaptAlg',
            text: 'Alg',
            type: 'input'
          }, {
            name: 'editBtn',
            text: '',
            type: 'button',
            style: '',
            iconClass: 'glyphicon glyphicon-pencil',
            fn: function (row) {
              var rowContent = row.getContent();
              newMicroserviceManagementInlineUI.showMicroserviceCallUI(_dom, {
                mscEndpoint: config.mscEndpoint
              }, rowContent.microserviceId, rowContent.operationId, {
                serviceName: rowContent.menuName,
                microserviceInputs: JSON.parse(rowContent.microserviceInputJSON),
                microserviceOutputAdaptAlg: rowContent.microserviceOutputAdaptAlg
              }, function (callConfigUIContent, microserviceId, operationId) {
                row.setContent({
                  menuName: callConfigUIContent.serviceName,
                  microserviceId: microserviceId,
                  operationId: operationId,
                  microserviceInputJSON: JSON.stringify(callConfigUIContent.microserviceInputs),
                  microserviceOutputAdaptAlg: callConfigUIContent.microserviceOutputAdaptAlg
                });
              });
            }
          }]
        });
      },
      initMsManagementInlineModule: function (_sub, config) {
        _sub.msManagementInlineModule = newMicroserviceManagementInlineUI({
          mscEndpoint: config.mscEndpoint,
          callConfigHandlerFn: function (callConfigUIContent, microserviceId, operationId) {
            _sub.inputTableModule.addRow({
              menuName: callConfigUIContent.serviceName,
              microserviceId: microserviceId,
              operationId: operationId,
              microserviceInputJSON: JSON.stringify(callConfigUIContent.microserviceInputs),
              microserviceOutputAdaptAlg: callConfigUIContent.microserviceOutputAdaptAlg
            });
          },
          callBtnText: 'Add to View',
          showServiceNameTxt: true
        });
      },
      initMain: function (_dom, _sub, config) {
        _statics.init.initInputTableModule(_dom, _sub, config);
        _statics.init.initMsManagementInlineModule(_sub, config);
      }
    },
    ui: {
      render: function (_dom, _sub) {
        return $('<div>').append(
          _sub.msManagementInlineModule.render()).append(
          '<br><h4>Microservices to Visualize:</h4><br>').append(
          _sub.inputTableModule.render()).append('<br>').append(
          _dom.saveBtn).append(
          _dom.messageDiv);
      },
      setContent: function (_sub, content) {
        _sub.inputTableModule.setContent(content);
      }
    }
  };

  return function (config={}) {
    config.mscEndpoint = config.mscEndpoint || '';
    
    var _sub = {
      msManagementInlineModule: null,
      inputTableModule: null
    };

    var _dom = {
      saveBtn: $('<button class="btn btn-primary" type="button">Save</button>').click(function () {
        var config = _sub.inputTableModule.getContent();
        _statics.services.saveOliveConfig(_dom, config);
      }),
      messageDiv: $('<div>')
    };

    _statics.init.initMain(_dom, _sub, config);

    return {
      render: function () {
        return _statics.ui.render(_dom, _sub);
      },
      setContent: function (content=[]) {
        _statics.ui.setContent(_sub, content);
      }
    };
  };
}(olive.utils, olive.modules.newTable, olive.modules.newMicroserviceManagementInlineUI));

//------------------------------------------------------------------------
olive.modules.newOliveViewUI = (function (newMicroserviceCallViewUI, newWidgetView) {

  var _statics = {
    view: {
      createWidget: function (config) {
        var widget = newWidgetView({
          mappingFn: function (out, inp, conf) {
              Object.assign(inp, out);
              widget.setWidgetTitle(out.menuName);
          },
          newRenderModule: newMicroserviceCallViewUI,
          newRenderModuleConfig: {
              mscEndpoint: config.mscEndpoint
          }
        });
        return widget;
      }
    },
    ui: {
      render: function (_dom) {
        return $('<div>').append(
          _dom.messageDiv
        ).append(
          _dom.panelsDiv);
      },
      setContent: function (_dom, config, content) {
        var showAll = true;
        content.forEach(function (serviceConfig) {
          if (config.viewName === serviceConfig.menuName)
            showAll = false;
        });
        _dom.panelsDiv.empty();
        content.forEach(function (serviceConfig) {
          if (showAll || config.viewName === serviceConfig.menuName) {
            var singleService = _statics.view.createWidget(config);
            singleService.setContent({
              menuName: serviceConfig.menuName,
              microserviceId: serviceConfig.microserviceId,
              operationId: serviceConfig.operationId,
              microserviceInputJSON: serviceConfig.microserviceInputJSON,
              microserviceOutputAdaptAlg: serviceConfig.microserviceOutputAdaptAlg,
            });
            _dom.panelsDiv.append(singleService.render());
          }
        });
      }
    }
  };

  return function (config = {}) {
    config.viewName = config.viewName || '';
    config.mscEndpoint = config.mscEndpoint || '';
    
    var _dom = {
      messageDiv: $('<div>'),
      panelsDiv: $('<div>')
    };
    
    return {
      render: function () {
        return _statics.ui.render(_dom);
      },
      setContent: function (content=[]) {
        _statics.ui.setContent(_dom, config, content);
      }
    };
  };
}(olive.modules.newMicroserviceCallViewUI, olive.modules.newWidgetView));

return olive;
}));
