import { createViewConvert } from '../core/view/convert.js';
import { galleryViewModel } from './gallery/index.js';
import { kanbanViewModel } from './kanban/index.js';
import { tableViewModel } from './table/index.js';

export const viewConverts = [
  createViewConvert(tableViewModel, kanbanViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(kanbanViewModel, tableViewModel, data => ({
    filter: data.filter,
    groupBy: data.groupBy,
  })),
  createViewConvert(tableViewModel, galleryViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(galleryViewModel, tableViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(kanbanViewModel, galleryViewModel, data => ({
    filter: data.filter,
  })),
  createViewConvert(galleryViewModel, kanbanViewModel, data => ({
    filter: data.filter,
  })),
];
