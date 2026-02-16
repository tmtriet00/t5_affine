import { galleryViewMeta } from './gallery/index.js';
import { kanbanViewMeta } from './kanban/index.js';
import { tableViewMeta } from './table/index.js';

export * from './convert.js';
export * from './gallery/index.js';
export * from './kanban/index.js';
export * from './table/index.js';

export const viewPresets = {
  tableViewMeta: tableViewMeta,
  kanbanViewMeta: kanbanViewMeta,
  galleryViewMeta: galleryViewMeta,
};
