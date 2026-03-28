import { JS_TEMPLATES } from './templates/jsTemplates';
import { CPP_TEMPLATES } from './templates/cppTemplates';

export interface CodeTemplate {
  name: string;
  category: string;
  description: string;
  language: string;
  tags?: string[];
  code: string;
}

export { JS_TEMPLATES, CPP_TEMPLATES };
