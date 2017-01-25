import { registerTemplates, registerBindings } from 'scalejs.mvvm';
import { registerViewModels } from 'scalejs.metadataFactory';
import 'ko-bindings/fontIcon';

import accordionViewModel from './accordionViewModel';
import accordionBindings from './accordionBindings';
import accordionTemplates from './accordion.html';

registerBindings(accordionBindings);
registerTemplates(accordionTemplates);
registerViewModels({
    accordion: accordionViewModel
});
