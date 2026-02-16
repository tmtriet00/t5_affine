import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { computed } from '@preact/signals-core';

import { evalFilter } from '../../core/filter/eval.js';
import { FilterTrait, filterTraitKey } from '../../core/filter/trait.js';
import { emptyFilterGroup } from '../../core/filter/utils.js';
import { PropertyBase } from '../../core/view-manager/property.js';
import { SingleViewBase } from '../../core/view-manager/single-view.js';
import type { ViewManager } from '../../core/view-manager/view-manager.js';
import type { GalleryViewColumn, GalleryViewData } from './define.js';

const materializeColumnsByPropertyIds = (
  columns: GalleryViewColumn[],
  propertyIds: string[]
) => {
  const needShow = new Set(propertyIds);
  const orderedColumns: GalleryViewColumn[] = [];

  for (const column of columns) {
    if (needShow.has(column.id)) {
      orderedColumns.push(column);
      needShow.delete(column.id);
    }
  }

  for (const id of needShow) {
    // New properties are hidden by default in gallery view
    orderedColumns.push({ id, hide: true });
  }

  return orderedColumns;
};

export const materializeGalleryColumns = (
  columns: GalleryViewColumn[],
  propertyIds: string[]
) => {
  const nextColumns = materializeColumnsByPropertyIds(columns, propertyIds);
  const unchanged =
    columns.length === nextColumns.length &&
    columns.every((column, index) => {
      const nextColumn = nextColumns[index];
      return (
        nextColumn != null &&
        column.id === nextColumn.id &&
        column.hide === nextColumn.hide
      );
    });

  return unchanged ? columns : nextColumns;
};

export class GallerySingleView extends SingleViewBase<GalleryViewData> {
  propertiesRaw$ = computed(() => {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    this.data$.value?.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result.map(id => this.propertyGetOrCreate(id));
  });

  properties$ = computed(() => {
    return this.propertiesRaw$.value.filter(property => !property.hide$.value);
  });

  detailProperties$ = computed(() => {
    return this.propertiesRaw$.value.filter(
      property => property.type$.value !== 'title'
    );
  });

  mainProperties$ = computed(() => {
    return (
      this.data$.value?.header ?? {
        titleColumn: this.propertiesRaw$.value.find(
          property => property.type$.value === 'title'
        )?.id,
        iconColumn: 'type',
      }
    );
  });

  // Properties shown on the card body (excluding title)
  shownProperties$ = computed(() => {
    return this.properties$.value.filter(
      property => property.id !== this.header?.titleColumn
    );
  });

  filter$ = computed(() => {
    return this.data$.value?.filter ?? emptyFilterGroup;
  });

  filterTrait = this.traitSet(
    filterTraitKey,
    new FilterTrait(this.filter$, this, {
      filterSet: filter => {
        this.dataUpdate(() => {
          return {
            filter,
          };
        });
      },
    })
  );

  readonly$ = computed(() => {
    return this.manager.readonly$.value;
  });

  get columns(): GalleryViewColumn[] {
    return this.data$.value?.columns ?? [];
  }

  get header() {
    return this.view?.header;
  }

  get type(): string {
    return this.view?.mode ?? 'gallery';
  }

  get view() {
    return this.data$.value;
  }

  private materializeColumns() {
    const view = this.view;
    if (!view) {
      return;
    }

    const nextColumns = materializeGalleryColumns(
      view.columns,
      this.dataSource.properties$.value
    );
    if (nextColumns === view.columns) {
      return;
    }

    this.dataUpdate(() => ({ columns: nextColumns }));
  }

  constructor(viewManager: ViewManager, viewId: string) {
    super(viewManager, viewId);
    this.materializeColumns();
  }

  isShow(rowId: string): boolean {
    if (this.filter$.value?.conditions.length) {
      const rowMap = Object.fromEntries(
        this.propertiesRaw$.value.map(column => [
          column.id,
          column.cellGetOrCreate(rowId).jsonValue$.value,
        ])
      );
      return evalFilter(this.filter$.value, rowMap);
    }
    return true;
  }

  propertyGetOrCreate(columnId: string): GalleryColumn {
    return new GalleryColumn(this, columnId);
  }

  getHeaderTitle(_rowId: string): GalleryColumn | undefined {
    const columnId = this.view?.header.titleColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGetOrCreate(columnId);
  }

  getHeaderIcon(_rowId: string): GalleryColumn | undefined {
    const columnId = this.view?.header.iconColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGetOrCreate(columnId);
  }

  getHeaderCover(_rowId: string): GalleryColumn | undefined {
    const columnId = this.view?.header.coverColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGetOrCreate(columnId);
  }
}

type GalleryColumnData = GalleryViewData['columns'][number];

export class GalleryColumn extends PropertyBase {
  override move(position: InsertToPosition): void {
    this.galleryView.dataUpdate(view => {
      const columnIndex = view.columns.findIndex(v => v.id === this.id);
      if (columnIndex < 0) {
        return {};
      }
      const columns = [...view.columns];
      const [column] = columns.splice(columnIndex, 1);
      if (!column) {
        return {};
      }
      const index = insertPositionToIndex(position, columns);
      columns.splice(index, 0, column);
      return {
        columns,
      };
    });
  }

  override hideSet(hide: boolean): void {
    this.viewDataUpdate(data => {
      return {
        ...data,
        hide,
      };
    });
  }

  hide$ = computed(() => {
    const hideFromViewData = this.viewData$.value?.hide;
    if (hideFromViewData != null) {
      return hideFromViewData;
    }
    // Default to true (hidden) if not specified, unless it's the title
    const isTitle = this.galleryView.header?.titleColumn === this.id;
    if (isTitle) return false;

    return true;
  });

  viewData$ = computed(() => {
    return this.galleryView.data$.value?.columns.find(v => v.id === this.id);
  });

  viewDataUpdate(
    updater: (viewData: GalleryColumnData) => Partial<GalleryColumnData>
  ): void {
    this.galleryView.dataUpdate(data => {
      return {
        ...data,
        columns: data.columns.map(v =>
          v.id === this.id ? { ...v, ...updater(v) } : v
        ),
      };
    });
  }

  constructor(
    private readonly galleryView: GallerySingleView,
    columnId: string
  ) {
    super(galleryView, columnId);
  }
}
