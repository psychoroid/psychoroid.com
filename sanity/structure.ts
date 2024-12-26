import { type StructureBuilder, type DefaultDocumentNodeResolver } from 'sanity/desk';

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure = (S: StructureBuilder) => {
  return S.list()
    .title('Blog')
    .items([
      S.documentTypeListItem('post').title('Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('author').title('Authors'),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !['post', 'category', 'author'].includes(listItem.getId() ?? ''),
      ),
    ]);
};
