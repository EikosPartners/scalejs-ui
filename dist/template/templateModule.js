'use strict';

var _scalejs = require('scalejs.mvvm');

var _scalejs2 = require('scalejs.metadataFactory');

var _templateViewModel = require('./templateViewModel');

var _templateViewModel2 = _interopRequireDefault(_templateViewModel);

var _template = require('./template.html');

var _template2 = _interopRequireDefault(_template);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _scalejs.registerTemplates)(_template2.default);

(0, _scalejs2.registerViewModels)({
    template: _templateViewModel2.default
});
//# sourceMappingURL=templateModule.js.map