import { createIcon } from '../../core/utils/uni-icon.js';
import { galleryViewModel } from './define.js';
import { GalleryViewUILogic } from './pc/gallery-view-ui-logic.js';

export * from './define.js';
export * from './gallery-view-manager.js';

export const galleryViewMeta = galleryViewModel.createMeta({
  // TODO: Replace with proper Gallery/Card View icon when available
  icon: createIcon('DatabaseTableViewIcon'),
  // @ts-expect-error fixme: typesafe
  pcLogic: () => GalleryViewUILogic,
});
