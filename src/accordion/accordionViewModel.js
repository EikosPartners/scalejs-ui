import { createViewModels as createViewModelsUnbound } from 'scalejs.metadataFactory';
import { observable } from 'knockout';
import { receive } from 'scalejs.messagebus';
import { merge } from 'scalejs';


/*
 * Responsible for combining sections with children
 * Sections contain the names of the headers
 * There is one child per section
 */

// TODO: add docs
export default function (node) {
    const subs = [],
        createViewModels = createViewModelsUnbound.bind(this), // ensures context is passed
        options = node.options || {},
        isShown = observable(true),
        mappedChildNodes = createViewModels(node.children),
        sections = node.sections.map((section, index) => {
            const visible = observable(options.openByDefault === false ? false : true);
            return merge(mappedChildNodes[index], {
                header: section,
                visible: visible,
                toggleVisibility: function () {
                    if (!visible() && options && options.trueAccordion) {
                        setAllSectionVisibility(false);
                    }
                    visible(!visible());
                }
            });
        });

    function setAllSectionVisibility(visiblity) {
        sections.forEach((section) => {
            section.visible(visiblity);
        });
    }

    subs.push(receive(`${node.id}.collapseAll`, () => {
        setAllSectionVisibility(false);
    }));

    subs.push(receive(`${node.id}.expandAll`, () => {
        setAllSectionVisibility(true);
    }));

    return merge(node, {
        isShown: isShown,
        sections: sections,
        mappedChildNodes: mappedChildNodes,
        setAllSectionVisibility: setAllSectionVisibility,
        dispose: function () {
            subs.forEach((sub) => {
                sub.dispose();
            });
        }
    });
}
