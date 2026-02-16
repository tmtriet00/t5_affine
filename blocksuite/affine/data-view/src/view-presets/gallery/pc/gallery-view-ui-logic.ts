import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css } from '@emotion/css';
import { signal } from '@preact/signals-core';
import { html, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import {
  createUniComponentFromWebComponent,
  renderUniLit,
} from '../../../core/index.js';
import {
  DataViewUIBase,
  DataViewUILogicBase,
} from '../../../core/view/data-view-base.js';
import type { GallerySingleView } from '../gallery-view-manager.js';

// Gallery view doesn't need complex selection for MVP
type GalleryViewSelection = any;

export class GalleryViewUILogic extends DataViewUILogicBase<
  GallerySingleView,
  GalleryViewSelection
> {
  ui$ = signal<GalleryViewUI | undefined>();

  renderer = createUniComponentFromWebComponent(GalleryViewUI);

  clearSelection = () => {
    // No-op for MVP — gallery doesn't have cell selection
  };

  addRow = (position: InsertToPosition) => {
    if (this.view.readonly$.value) return;
    const rowId = this.view.rowAdd(position);
    if (rowId) {
      this.root.openDetailPanel({
        view: this.view,
        rowId,
      });
    }
    return rowId;
  };

  focusFirstCell = () => {
    // No-op for MVP — gallery cards open detail panel on click
  };

  showIndicator = (_evt: MouseEvent) => {
    // No-op for MVP — drag-and-drop not implemented
    return false;
  };

  hideIndicator = () => {
    // No-op for MVP — drag-and-drop not implemented
  };

  moveTo = (_id: string, _evt: MouseEvent) => {
    // No-op for MVP — drag-and-drop not implemented
  };
}

export class GalleryViewUI extends DataViewUIBase<GalleryViewUILogic> {
  private renderCards() {
    const rows = this.logic.view.rowIds$.value;
    const filteredRows = rows.filter(rowId => this.logic.view.isShow(rowId));

    return html`
      ${repeat(
        filteredRows,
        rowId => rowId,
        rowId => html`
          <affine-data-view-gallery-card
            .cardId="${rowId}"
            .galleryViewLogic="${this.logic}"
          ></affine-data-view-gallery-card>
        `
      )}
    `;
  }

  private renderAddButton() {
    if (this.logic.view.readonly$.value) return html``;

    return html`
      <div
        class="${addCardButtonStyle}"
        @click="${() => this.logic.addRow('end')}"
      >
        <div class="${addCardContentStyle}">${AddCursorIcon()} New Card</div>
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.logic.ui$.value = this;
    this.classList.add(galleryViewStyle);
    this.style.display = 'flex';
    this.style.flexDirection = 'column';
    this.style.height = '100%';
    this.style.overflow = 'hidden';
  }

  override render(): TemplateResult {
    return html`
      ${renderUniLit(this.logic.root.config.headerWidget, {
        dataViewLogic: this.logic,
      })}
      <div style="flex: 1; overflow-y: auto;">
        <div class="${galleryContainerStyle}">
          ${this.renderCards()} ${this.renderAddButton()}
        </div>
      </div>
    `;
  }
}

const galleryViewStyle = css({
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
});

const galleryContainerStyle = css({
  padding: '24px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '16px',
  width: '100%',
});

const addCardButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100px',
  border: '1px dashed var(--affine-border-color)',
  borderRadius: '8px',
  cursor: 'pointer',
  color: 'var(--affine-text-secondary-color)',
  transition: 'all 0.2s',
  backgroundColor: 'var(--affine-background-primary-color)',

  '&:hover': {
    backgroundColor: 'var(--affine-hover-color)',
    borderColor: 'var(--affine-primary-color)',
    color: 'var(--affine-primary-color)',
  },
});

const addCardContentStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
});

declare global {
  interface HTMLElementTagNameMap {
    'dv-gallery-view-ui': GalleryViewUI;
  }
}
