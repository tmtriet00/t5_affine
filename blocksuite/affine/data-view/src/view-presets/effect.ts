import { galleryEffects } from './gallery/effect.js';
import { kanbanEffects } from './kanban/effect.js';
import { tableEffects } from './table/effect.js';

export function viewPresetsEffects() {
  galleryEffects();
  kanbanEffects();
  tableEffects();
}
