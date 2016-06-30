'use strict';

var _scalejs = require('scalejs.sandbox');

var _scalejs2 = _interopRequireDefault(_scalejs);

var _scalejs3 = require('scalejs.metadataFactory');

var _scalejs4 = require('scalejs.mvvm');

var _scalejs5 = require('scalejs.popup');

var _scalejs6 = _interopRequireDefault(_scalejs5);

var _scalejs7 = require('scalejs.messagebus');

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

var _popupBindings = require('./popupBindings');

var _popupBindings2 = _interopRequireDefault(_popupBindings);

var _popup = require('./popup.html');

var _popup2 = _interopRequireDefault(_popup);

var _actionModule = require('../../actionModule');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var merge = _scalejs2.default.object.merge;
var popupRoot = _scalejs6.default.popupRoot;

function popupAction(options) {
    var context = this,
        message = {},
        onHidePopup = void 0,
        actions = void 0,
        data = void 0,
        modal = void 0,
        merged = void 0;

    actions = (options.actions || []).map(function (action) {
        action.type = 'action';
        return _scalejs3.createViewModel.call(context, action);
    });

    data = this && this.data && this.data();

    if (options.message) {
        options.message = _mustache2.default.render(options.message, data || {});
    }

    if (options.hidePopupAction) {
        onHidePopup = _scalejs3.createViewModel.call(context, options.hidePopupAction).action;
    }

    modal = typeof options.modal === 'undefined' || typeof options.modal === 'boolean' ? options.modal : evaluate(options.modal, this.getValue);
    merged = merge(options, {
        title: options.title,
        message: options.message,
        template: options.template,
        actions: actions,
        modal: modal,
        options: options.children,
        onHidePopup: onHidePopup,
        context: this
    });

    _scalejs6.default.onHidePopup(merged.onHidePopup);
    _scalejs6.default.renderPopup((0, _scalejs4.template)(merged.wrapperTemplate || 'popup_default_wrapper_template', {
        hidePopup: _scalejs6.default.hidePopup,
        title: merged.title || 'Popup',
        modal: merged.modal || false,
        popupContent: {
            name: merged.template || 'popup_default_region_template',
            data: merge(merged, {
                hidePopup: _scalejs6.default.hidePopup
            })
        }
    }));

    if (options.hideDelay) {
        setTimeout(closePopup, options.hideDelay);
    }
}

function closePopup() {
    _scalejs6.default.hidePopup();
}

function init() {
    var popupDiv = document.querySelector('*[data-bind="render: popupRoot"], *[data-bind="render:popupRoot"]');
    if (!popupDiv) {
        var att = document.createAttribute('data-bind');
        att.value = 'render: popupRoot';
        popupDiv = document.createElement('div');
        popupDiv.setAttributeNode(att);
        document.body.insertBefore(popupDiv, document.body.lastChild.nextSibling);
    }
    _knockout2.default.applyBindings({ popupRoot: popupRoot }, popupDiv);
}

init();

(0, _scalejs4.registerBindings)(_popupBindings2.default);
(0, _scalejs4.registerTemplates)(_popup2.default);
(0, _actionModule.registerActions)({ popup: popupAction, closePopup: closePopup });
//# sourceMappingURL=popup.js.map