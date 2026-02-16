import { GalleryCard } from './card.js';
import { GalleryViewUI } from './gallery-view-ui-logic.js';

export function pcEffects() {
  customElements.define('affine-data-view-gallery-card', GalleryCard);
  customElements.define('dv-gallery-view-ui', GalleryViewUI);
}
