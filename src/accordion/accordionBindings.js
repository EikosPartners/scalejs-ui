import { computed } from 'knockout';
import 'ko-bindings/slideVisible';
import { has } from 'scalejs';
import moment from 'moment';

// todo evaluate if should move to advanced grid?
function aggregateValues(node) {
    let value;
    if (node.getValue) {
        value = [].concat(node.getValue());
    } else if (node.mappedChildNodes) {
        value = node.mappedChildNodes.reduce((vals, childNode) => {
            const childValue = aggregateValues(childNode);
            let values;

            if (childValue) {
                values = values.concat(childValue);
            }
            return values;
        }, []);
    }

    // convert objects to strings
    value = value.map((valObj) => {
        let val = valObj;
        if (!has(val)) { val = ''; }
        if (typeof val === 'object') {
            if (val.op) { delete val.op; } // we don't want to custom operators values in preview
            return val = Object.keys(val).map((key) => {
                if (Date.parse(val[key])) {
                    return moment.utc(val[key]).format('MM/DD/YYYY');
                }
                return val[key];
            }).join(' ');
        }
        return val;
    });
    return value;
}

export default {
    'accordion-header': function () {
        return {
            click: this.toggleVisibility,
            // todo this should be an SVG / class
            css: {
                'fa-caret-down': this.visible(),
                'fa-caret-right': !this.visible()
            }

        };
    },
    'accordion-expand-all': function (ctx) {
        return {
            fontIcon: 'expand-all',
            click: function () {
                ctx.$parents[1].setAllSectionVisibility(true);
            },
            clickBubble: false
        };
    },
    'accordion-collapse-all': function (ctx) {
        return {
            fontIcon: 'collapse-all',
            click: function () {
                ctx.$parents[1].setAllSectionVisibility(false);
            },
            clickBubble: false
        };
    },
    // todo move to advanced grid
    'accordion-header-preview-text': function (ctx) {
        const accordionChild = ctx.$parents[1].mappedChildNodes[ctx.$index()],
            count = computed(() => {
                const values = aggregateValues(accordionChild);
                return values.length > 0 && values[0] ? values.length : '';
            });

        return {
            text: count
        };
    },
    'accordion-header-text': function () {
        return {
            text: typeof this.header === 'string' ? this.header : this.header.text
        };
    },
    'accordion-sections': function () {
        const visibleSections = this.sections.filter(section =>
                !section.isShown || section.isShown());
        return {
            foreach: visibleSections
        };
    }
};