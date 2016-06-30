import { registerTemplates, registerBindings } from 'scalejs.mvvm';
import { registerViewModels } from 'scalejs.metadataFactory';

import listAdvancedViewModel from './listAdvancedViewModel';
import listAdvancedBindings from './listAdvancedBindings';
import listAdvancedTemplates from './listAdvanced.html';


    registerBindings(listAdvancedBindings);
    registerTemplates(listAdvancedTemplates);
    registerViewModels({
        listAdvanced: listAdvancedViewModel
    });