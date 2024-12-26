import { type SchemaTypeDefinition } from 'sanity';
import { postType } from './postType';
import { categoryType } from './categoryType';
import { authorType } from './authorType';

export const schema = {
  types: [postType, categoryType, authorType],
};

export const schemaTypes = [postType, categoryType, authorType];
