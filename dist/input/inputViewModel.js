'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = inputViewModel;

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _scalejs = require('scalejs.metadataFactory');

var _scalejs2 = require('scalejs.expression-jsep');

var _scalejs3 = require('scalejs.messagebus');

var _scalejs4 = require('scalejs');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _scalejs5 = require('scalejs.noticeboard');

var _scalejs6 = _interopRequireDefault(_scalejs5);

var _autocompleteViewModel = require('./autocomplete/autocompleteViewModel');

var _autocompleteViewModel2 = _interopRequireDefault(_autocompleteViewModel);

var _selectViewModel = require('./select/selectViewModel');

var _selectViewModel2 = _interopRequireDefault(_selectViewModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inputTypes = {
    autocomplete: _autocompleteViewModel2.default,
    select: _selectViewModel2.default,
    multiselect: function multiselect(node, inputVM) {
        node.options = (0, _scalejs4.merge)(node.options || {}, {
            addBlank: false
        }); // do not add blanks in multiselect

        return _selectViewModel2.default.call(this, node, inputVM);
    }
};

function inputViewModel(n) {
    var // metadata node + context
    node = _lodash2.default.merge({}, (0, _scalejs.globalMetadata)().input_defaults || {}, n),
        options = node.options || {},
        context = this || {},


    // values which can be chosen from
    values = (0, _knockout.observableArray)(Array.isArray(options.values) ? options.values : []),


    // Depricated? //TODO: Yes isShown is depricated in favor of rendered
    isShown = (0, _knockout.observable)(!node.hidden),


    // 2-way binding with state of focus
    hasFocus = (0, _knockout.observable)(),


    // 1-way binding with state of hover
    hover = (0, _knockout.observable)(),


    // validations
    required = options.validations ? options.validations.required : false,
        customError = (0, _knockout.observable)(),


    // attributes
    disabled = (0, _knockout.observable)(!!options.disabled),
        readonly = deriveReadonly(options.readonly),
        maxlength = options.validations && options.validations.maxLength,


    // patterns
    pattern = options.pattern === true ? getPattern() : options.pattern,
        tooltipShown = (0, _knockout.observable)(false),
        // for patterns
    shake = (0, _knockout.observable)(false),


    // specific datepicker
    datePlaceholder = node.inputType === 'datepicker' && _knockout2.default.pureComputed(function () {
        var placeholder = !hover() || hasFocus() ? '' : 'mm/dd/yyyy';
        return placeholder;
    }),


    // custom setValue functions for input types
    setValueFuncs = {
        checkboxList: setCheckboxListValue,
        multiselect: setCheckboxListValue,
        checkbox: setCheckboxValue
    },


    // subs disposable array
    subs = [],


    // move out to utility?
    formatters = {
        dateFormatter: dateFormatter
    },
        format = options.values && options.values.textFormatter ? formatters[options.values.textFormatter] : _lodash2.default.identity;

    var viewmodel = {},
        validations = options.validations || null,
        computedValueExpression = void 0,

    // registered action vars
    registeredAction = void 0,
        initialRegisteredAction = void 0,

    // inputValue: accepts user input via KO Binding
    inputValue = createInputValue(),
        initial = void 0;

    viewmodel = {
        mapItem: mapItem,
        inputValue: inputValue,
        hasFocus: hasFocus,
        format: format,
        subs: subs,
        readonly: readonly,
        values: values
    };

    /*
     * PJSON API (refine)
     */
    function getValue() {
        if (node.inputType === 'checkbox') {
            return inputValue() ? (0, _scalejs4.get)(options, 'checkedValue', true) : (0, _scalejs4.get)(options, 'uncheckedValue', false);
        }
        if (inputValue() === '') {
            return {}.hasOwnProperty.call(options, 'emptyValue') ? options.emptyValue : '';
        }
        if (options.number) {
            return Number(inputValue());
        }
        return inputValue();
    }

    function setValue(data) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var value = (0, _scalejs4.is)(data, 'object') ? data.value : data,
            // TODO: Refactor - should only accept "value", not "data".
        wasModified = inputValue.isModified();

        initial = opts.initial;

        if (data === getValue()) {
            return;
        }
        // uses setValueFunc if defined, else updates inputValue
        if (setValueFuncs[node.inputType]) {
            setValueFuncs[node.inputType](data);
        } else if (viewmodel.setValue) {
            viewmodel.setValue(data);
        } else {
            inputValue(value);
        }

        // programtically setting the inputValue will not cause isModified to become true
        if (!wasModified) {
            inputValue.isModified(false);
        }

        initial = false;
    }

    function update(data) {
        if ({}.hasOwnProperty.call(data, 'value')) {
            setValue(data.value);
        }
        if ({}.hasOwnProperty.call(data, 'error')) {
            customError(data.error);
        }
        if ({}.hasOwnProperty.call(data, 'values')) {
            values(data.values);
        }
    }

    function validate() {
        // can rely on "this" when properties are garuenteed
        // from MD factory and used with compliance
        inputValue.isModified(true);
        return !inputValue.isValid() && isShown() && this.rendered() && inputValue.severity() === 1;
    }

    // TODO: How to allow for custom visible message specific to project?
    function visibleMessage() {
        // returns the message to be displayed (based on validations)
        var severity = inputValue.severity();
        var inputMessage = void 0,
            message = void 0;

        if (!inputValue.isModified() || inputValue.isValid() || !this.rendered() || !isShown()) {
            // the user has yet to modify the input
            // or there is no message. return nothing
            return;
        }

        inputMessage = inputValue.error();
        inputMessage = inputMessage[inputMessage.length - 1] === '.' ? inputMessage : inputMessage + '.';

        if (inputMessage === 'Required.') {
            message = (node.errorLabel || node.label) + ' is required.';
        } else {
            message = (node.errorLabel || node.label) + ' is invalid. ' + inputMessage;
        }

        return {
            message: message,
            severity: severity,
            onClick: function onClick() {
                hasFocus(true);
            }
        };
    }

    /*
     * Rule Engine (todo - Refactor out)
     */

    function assignDate(value, params) {
        if (!(0, _scalejs4.is)(params, 'object')) {
            console.error('Assign date only supports object params', params);
            return;
        }
        var newDate = (0, _moment2.default)(value).add(params).format(options.rawFormat || 'YYYY-MM-DD');
        setValue(newDate);
    }

    function setReadonly(bool) {
        readonly(bool);
    }

    function setCheckboxListValue(data) {
        if (data && data.value) {
            console.warn('Using depricated setValue { value: <> } interface. Please update code.');
        }
        if (Array.isArray(data)) {
            inputValue(data);
        } else if (data !== null && data !== undefined) {
            console.warn('Setting a checkbox list with a non-array value. Converting to array...');
            inputValue([data]);
        } else {
            inputValue([]);
        }
    }

    function setCheckboxValue(data) {
        inputValue(data === (0, _scalejs4.get)(options, 'checkedValue', true));
    }

    /*
     * Internal
     */
    function createInputValue() {
        // checkboxList can have multiple answers so make it an array
        if (['checkboxList', 'multiselect'].indexOf(node.inputType) !== -1) {
            return (0, _knockout.observableArray)(options.value || []);
        }
        // if there is no initial value, set it to empty string,
        // so that isModified does not get triggered for empty dropdowns
        var value = options.value;
        if (node.inputType === 'checkbox') {
            value = options.value === (0, _scalejs4.get)(options, 'checkedValue', true);
        }
        return (0, _knockout.observable)((0, _scalejs4.has)(options.value) ? value : '');
    }

    function getPattern() {
        // implicitly determine pattern (inputmask) if there is a Regex validation
        if (options.validations && options.validations.pattern) {
            if (!options.validations.pattern.params) {
                console.error('Pattern validation must have params and message', node);
                return;
            }

            return {
                alias: 'Regex',
                regex: options.validations.pattern.params
            };
        }
    }

    function deriveReadonly(readonlyParam) {
        if ((0, _scalejs4.is)(readonlyParam, 'string')) {
            var _ret = function () {
                var override = (0, _knockout.observable)();
                return {
                    v: (0, _knockout.computed)({
                        read: function read() {
                            return (0, _scalejs4.has)(override()) ? override() : (0, _scalejs2.evaluate)(readonlyParam, context.getValue);
                        },
                        write: function write(value) {
                            override(value);
                        }
                    })
                };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
        return (0, _knockout.observable)(!!readonlyParam);
    }
    /*
     * Utils (can be Refactored to common)
     */

    function dateFormatter(date) {
        return (0, _moment2.default)(date).format('MM/DD/YYYY');
    }

    function mapItem(mapper) {
        var textFormatter = formatters[mapper.textFormatter] || _lodash2.default.identity,
            delimiter = mapper.delimeter || ' / ';

        function formatText(val, key) {
            if (Array.isArray(key)) {
                return key.map(function (k) {
                    return val[k];
                }).join(delimiter);
            }
            return val[key];
        }

        return function (val) {
            return {
                text: textFormatter(formatText(val, mapper.textKey)),
                value: formatText(val, mapper.valueKey),
                original: val
            };
        };
    }

    function fetchData() {
        var newValue = inputValue(),
            action = initial ? initialRegisteredAction : registeredAction;
        // our own sub gets called before context is updated
        action.options.data[node.id] = newValue;

        if (newValue !== '') {
            action.action({
                callback: function callback(error, data) {
                    if (error) {
                        return;
                    }
                    Object.keys(data).forEach(function (key) {
                        if (key === 'store') {
                            Object.keys(data[key]).forEach(function (storeKey) {
                                var valueToStore = data[key][storeKey];
                                _scalejs6.default.setValue(storeKey, valueToStore);
                            });
                            return;
                        }

                        if (!context.dictionary && !context.data) {
                            console.warn('Using a registered input when no data/dictionary available in context', node);
                            return;
                        }
                        var updateNode = context.dictionary && context.dictionary()[key];
                        if (updateNode && updateNode.update) {
                            updateNode.update(data[key]);
                        }
                    });
                }
            });
        }
    }
    /*
     * Init
     */

    // Mixin the viewModel specific to the inputType
    if (inputTypes[node.inputType]) {
        (0, _lodash.extend)(viewmodel, inputTypes[node.inputType].call(context, node, viewmodel));
    }

    // TODO: Specific to data, move into custom viewModel?
    // make min/max date into observables
    if (options.minDate) {
        viewmodel.minDate = _knockout2.default.observable(options.minDate);
    }
    if (options.maxDate) {
        viewmodel.maxDate = _knockout2.default.observable(options.maxDate);
    }

    if (options.registered) {
        registeredAction = _scalejs.createViewModel.call(this, {
            type: 'action',
            actionType: 'ajax',
            options: (0, _scalejs4.merge)(options.registered.update || options.registered, { data: {} })
        });

        initialRegisteredAction = _scalejs.createViewModel.call(this, {
            type: 'action',
            actionType: 'ajax',
            options: (0, _scalejs4.merge)(options.registered.initial || options.registered, { data: {} })
        });

        inputValue.subscribe(function () {
            fetchData();
        });

        // listen for 'refresh' event
        subs.push((0, _scalejs3.receive)(node.id + '.refreshRegistered', function (eventOptions) {
            // console.log('--> refreshing registered', node);
            fetchData(eventOptions);
        }));

        // make initial call if default value is set--fetchData checks if inputValue() is ''
        fetchData();
    }

    // TODO: Clean up validation Code
    // add validations to the inputvalue
    validations = (0, _scalejs4.merge)(_lodash2.default.cloneDeep(options.validations), { customError: customError });
    if (validations.expression) {
        if (options.validations.expression.message && !options.validations.expression.term) {
            console.error('[input] if providing a message for expression validation, must also provide term');
            options.validations.expression.term = 'true'; // don't cause exceptions.
        }
        validations.expression.params = [options.validations.expression.message ? options.validations.expression.term : options.validations.expression, context.getValue];
    }

    // Updates input component
    subs.push((0, _scalejs3.receive)(node.id + '.update', update));

    if (options.unique && node.inputType !== 'autocomplete') {
        inputValue.subscribe(function (oldValue) {
            context.unique[node.id].remove(oldValue);
        }, null, 'beforeChange');

        inputValue.subscribe(function (newValue) {
            if (context.deleteFlag && context.deleteFlag()) {
                return;
            }
            context.unique[node.id].push(newValue);
        });

        if (context.deleteFlag) {
            context.deleteFlag.subscribe(function (deleted) {
                if (deleted) {
                    context.unique[node.id].remove(inputValue());
                }
            });
        }

        context.unique[node.id].subscribe(function (newValues) {
            var occurances = newValues.filter(function (value) {
                return value === inputValue();
            }).length;

            customError(occurances > 1 ? 'Identifier must be unique' : undefined);
        });
    }

    if (viewmodel.validations) {
        validations = (0, _scalejs4.merge)(validations, viewmodel.validations);
    }
    inputValue = inputValue.extend(validations);

    // Allows us to set values on an input from expression
    if (options.valueExpression) {
        computedValueExpression = (0, _knockout.computed)(function () {
            if (options.allowSet === false) {
                inputValue(); // re-eval when inputValue is set
            }
            return (0, _scalejs2.evaluate)(options.valueExpression, context.getValue);
        });
        setValue(computedValueExpression());
        computedValueExpression.subscribe(function (value) {
            setValue(value);
        });

        subs.push(computedValueExpression);
    }

    // TODO: make into insert zeros option?
    if ((0, _scalejs4.get)(options, 'pattern.alias') === 'percent') {
        inputValue.subscribe(function (value) {
            if (value && isFinite(Number(value))) {
                inputValue(Number(value).toFixed(3));
            }
        });
    }

    shake.subscribe(function (shook) {
        shook && setTimeout(function () {
            shake(false);
        }, 1000);
    });

    return (0, _scalejs4.merge)(node, viewmodel, {
        inputValue: inputValue,
        visibleMessage: visibleMessage,
        customError: customError,
        hasFocus: hasFocus,
        hover: hover,
        datePlaceholder: datePlaceholder,
        assignDate: assignDate,
        isShown: isShown,
        required: required,
        readonly: readonly,
        disabled: disabled,
        maxlength: maxlength,
        pattern: pattern,
        tooltipShown: tooltipShown,
        shake: shake,
        options: options,
        setValue: setValue,
        update: update,
        context: this,
        error: inputValue.error,

        // Mixin-Overrides
        getValue: viewmodel.getValue || getValue,
        values: viewmodel.values || values,
        setReadonly: viewmodel.setReadonly || setReadonly,
        validate: viewmodel.validate || validate,

        dispose: function dispose() {
            if (viewmodel.dispose) {
                viewmodel.dispose();
            }
            (subs || []).forEach(function (sub) {
                sub.dispose && sub.dispose();
            });

            if (options.unique) {
                context.unique[node.id].remove(inputValue());
            }
        }
    });
}

// implements an input of type
// text, select, date, radio, checkbox, checkboxList

// TODO: Refactor Session
// - createJSDocs
// - revisit and de-tangle bindings
// - refactor validations so that the tooltip works without
// inputText wrapper in the inputType template
// - move tooltip/helpText in options

/**
 *  input is the component to use when accepting user-input.
 *  This is the best way to create an interactive UI and
 *  autogenerate your underlying data model by using an adapter in the parent chain.
 *
 * @module input
 *
 * @param {object} node
 *  The configuration specs for the component.
 * @param {string} [node.id]
 *  By specifying an "id" on your input, you are automatically
 * adding your input's data to the data context model.
 * @param {object} node.options
 *  The options pertaining to your specific inputType
 * @param {boolean|string} [node.rendered=true]
 *  Boolean or expression to render the input (or not)
 * @param {array} [node.options.values]
 *  The values that can be chosen from for inputTypes that have selections
 * (e.g. radio, checkboxList)
 * @param {object} [node.options.validations]
 *  KO validations object to validate the inputValue
 * @param {boolean} [node.options.validations.required]
 *  Required validation for ko - also will show * next to label indicating it is required
 * @param {boolean|string} [node.options.readonly=false]
 *  Boolean or expression to set the input as readonly
 * @param {boolean} [node.options.disabled]np
 *  Disables the input (different from readonly)
 * @param {object|string|boolean} [node.options.pattern]
 *  Sets an inputmask for the input. If a string, this is the mask.
 * If an object, gets passed as is.
 *  If boolean = true, uses pattern validation.
 * @param {boolean} [node.options.vertical=false]
 *  For multi-option types (e.g. checkboxList, radio),
 * sets the display to block if true for the options
 */
//# sourceMappingURL=inputViewModel.js.map