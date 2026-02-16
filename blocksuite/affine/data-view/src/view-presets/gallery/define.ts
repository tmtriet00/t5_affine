import type { FilterGroup } from '../../core/filter/types.js';
import type { Sort } from '../../core/sort/types.js';
import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { GallerySingleView } from './gallery-view-manager.js';

export const galleryViewType = viewType('gallery');

export type GalleryViewColumn = {
  id: string;
  hide?: boolean;
};

type DataType = {
  columns: GalleryViewColumn[];
  filter: FilterGroup;
  sort?: Sort;
  header: {
    titleColumn?: string;
    iconColumn?: string;
    coverColumn?: string;
  };
  cardSize?: 'small' | 'medium' | 'large';
};

export type GalleryViewData = BasicViewDataType<
  typeof galleryViewType.type,
  DataType
>;

export const galleryViewModel = galleryViewType.createModel<GalleryViewData>({
  defaultName: 'Card View',
  dataViewManager: GallerySingleView,
  defaultData: viewManager => {
    const columns = viewManager.dataSource.properties$.value;

    return {
      columns: columns.map(id => ({
        id: id,
        // Hide all columns by default in gallery view except title,
        // unlike table view where all are shown.
        // User can manually opt-in to show properties on card.
        hide: true,
      })),
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      header: {
        titleColumn: viewManager.dataSource.properties$.value.find(
          id => viewManager.dataSource.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      },
      cardSize: 'medium',
    };
  },
});
