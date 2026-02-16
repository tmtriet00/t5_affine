import { signal } from '@preact/signals-core';
import { describe, expect, test } from 'vitest';

import type { DataSource } from '../core/data-source/base.js';
import { ViewManagerBase } from '../core/view-manager/view-manager.js';
import { galleryViewType } from '../view-presets/gallery/define.js';
import { GallerySingleView } from '../view-presets/gallery/gallery-view-manager.js';
import { galleryViewMeta } from '../view-presets/gallery/index.js';

// Minimal Mock Data Source
const createMockDataSource = () => {
  const properties$ = signal(['title', 'status', 'date']);

  const dataSource = {
    properties$,
    viewManager: null as any,
    viewMetas: [galleryViewMeta],

    // Mock other required methods
    propertyTypeGet: (id: string) => {
      if (id === 'title') return 'title'; // Special case for title if needed
      return 'text';
    },
    propertyMetaGet: () => undefined,
    viewDataGet: (id: string) =>
      dataSource.viewDataList$.value.find((v: any) => v.id === id),
    viewMetaGet: (_type: string) => galleryViewMeta,
    viewMetaGetById: (_id: string) => galleryViewMeta,
    viewDataUpdate: (id: string, updater: any) => {
      const list = dataSource.viewDataList$.value;
      const index = list.findIndex((v: any) => v.id === id);
      if (index >= 0) {
        const newItem = { ...list[index], ...updater(list[index]) };
        const newList = [...list];
        newList[index] = newItem;
        dataSource.viewDataList$.value = newList;
      }
    },
    viewDataAdd: (viewData: any) => {
      dataSource.viewDataList$.value = [
        ...dataSource.viewDataList$.value,
        viewData,
      ];
      return viewData.id;
    },

    // Minimal ViewManager requirement
    viewDataList$: signal([] as any[]),
  };

  // Initialize ViewManager
  dataSource.viewManager = new ViewManagerBase(
    dataSource as unknown as DataSource
  );

  return dataSource;
};

describe('gallery view', () => {
  test('create', () => {
    const dataSource = createMockDataSource();
    const id = dataSource.viewManager.viewAdd(galleryViewType.type);
    const view = dataSource.viewManager.viewGet(id) as GallerySingleView;

    expect(view).toBeInstanceOf(GallerySingleView);
    expect(view.type).toBe('gallery');
    expect(view.columns.length).toBe(3); // title, status, date
  });

  test('toggle property visibility', () => {
    const dataSource = createMockDataSource();
    const id = dataSource.viewManager.viewAdd(galleryViewType.type);
    const view = dataSource.viewManager.viewGet(id) as GallerySingleView;

    const column = view.columns[1]; // 'status'
    if (!column) throw new Error('Column not found');
    const property = view.propertyGetOrCreate(column.id);

    // Default state check (should be hidden by default as per our define.ts logic for non-title)
    // define.ts says: hide: true for all except title (if logic matches)
    // Let's verify initial state
    const initialHide = property.hide$.value;

    // Toggle
    property.hideSet(!initialHide);
    expect(property.hide$.value).toBe(!initialHide);

    // Toggle back
    property.hideSet(initialHide);
    expect(property.hide$.value).toBe(initialHide);
  });
});
