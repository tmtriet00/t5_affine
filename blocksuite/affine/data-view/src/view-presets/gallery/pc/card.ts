import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { CenterPeekIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { signal } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { CellRenderProps } from '../../../core/property/index.js';
import { renderUniLit } from '../../../core/utils/uni-component/uni-component.js';
import type { Property } from '../../../core/view-manager/property.js';
import type { GalleryViewUILogic } from './gallery-view-ui-logic.js';

const styles = css`
  affine-data-view-gallery-card {
    display: flex;
    position: relative;
    flex-direction: column;
    border: 1px solid ${unsafeCSS(cssVarV2.layer.insideBorder.border)};
    box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: background-color 100ms ease-in-out;
    background-color: var(--affine-background-primary-color);
    cursor: pointer;
    overflow: hidden;
    height: 100%;
  }

  affine-data-view-gallery-card:hover {
    background-color: var(--affine-hover-color);
    box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.1);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 8px;
    flex-grow: 1;
  }

  /* Title Rendering */
  .card-title-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 4px;
    min-height: 24px;
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .card-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }

  .card-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    color: var(--affine-text-primary-color);
    word-break: break-word;
    flex-grow: 1;
  }

  /* Properties Rendering */
  .card-properties {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-property {
    display: flex;
    font-size: 12px;
    line-height: 20px;
    min-height: 20px;
    align-items: center;
    gap: 8px;
  }

  .card-property-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    height: 20px;
  }

  .card-property-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }

  .card-property-value {
    color: var(--affine-text-primary-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    display: block;
  }

  /* Hover Operations */
  .card-ops {
    position: absolute;
    right: 8px;
    top: 8px;
    visibility: hidden;
    display: flex;
    gap: 4px;
    z-index: 2;
  }

  /* Show ops on hover or focus */
  affine-data-view-gallery-card:hover .card-ops,
  affine-data-view-gallery-card:focus-within .card-ops {
    visibility: visible;
  }

  .card-op {
    display: flex;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    background-color: var(--affine-background-primary-color);
    cursor: pointer;
  }

  .card-op:hover {
    background-color: var(--affine-hover-color);
  }

  .card-op svg {
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
    width: 16px;
    height: 16px;
  }
`;

export class GalleryCard extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  @property({ attribute: false })
  accessor cardId!: string;

  @property({ attribute: false })
  accessor galleryViewLogic!: GalleryViewUILogic;

  get view() {
    return this.galleryViewLogic.view;
  }

  private readonly clickCard = (e: MouseEvent) => {
    // Prevent default if clicking on an interactive element inside
    if ((e.target as HTMLElement).closest('.interactive')) return;

    this.galleryViewLogic.root.openDetailPanel({
      view: this.view,
      rowId: this.cardId,
    });
  };

  private readonly clickEdit = (e: MouseEvent) => {
    e.stopPropagation();
    this.galleryViewLogic.root.openDetailPanel({
      view: this.view,
      rowId: this.cardId,
    });
  };

  private renderIcon() {
    const iconColumn = this.view.getHeaderIcon(this.cardId);
    if (!iconColumn) return html``;

    return html`
      <div class="card-icon">
        ${iconColumn.cellGetOrCreate(this.cardId).value$.value}
      </div>
    `;
  }

  private renderTitle() {
    const titleColumn = this.view.getHeaderTitle(this.cardId);
    if (!titleColumn) return html``;

    return this.renderCellValue(titleColumn, true);
  }

  /**
   * Render a cell value using the property's own renderer.
   * This is the same approach as KanbanCell.render() but without
   * the selection/editing concerns.
   */
  private renderCellValue(column: Property, contentOnly = false) {
    const isEditing$ = signal(false);
    const renderer = column.renderer$.value;
    if (!renderer) return html``;
    const { view } = renderer;

    const props: CellRenderProps = {
      cell: column.cellGetOrCreate(this.cardId),
      isEditing$,
      selectCurrentCell: () => {
        // Gallery cards don't support inline cell editing for MVP
        // Clicking opens the detail panel instead
      },
    };

    const icon = contentOnly
      ? html``
      : html`<uni-lit
          class="card-property-icon"
          .uni="${column.icon}"
        ></uni-lit>`;

    return html`
      ${icon}
      ${renderUniLit(view, props, {
        class: 'card-property-value',
        style: { display: 'block', flex: '1', overflow: 'hidden' },
      })}
    `;
  }

  private renderProperties() {
    const properties = this.view.shownProperties$.value;
    if (properties.length === 0) return html``;

    return html`
      <div class="card-properties">
        ${repeat(
          properties,
          p => p.id,
          p => html`
            <div class="card-property">${this.renderCellValue(p, false)}</div>
          `
        )}
      </div>
    `;
  }

  private renderOps() {
    if (this.view.readonly$.value) return html``;

    return html`
      <div class="card-ops">
        <div class="card-op" @click="${this.clickEdit}">
          ${CenterPeekIcon()}
        </div>
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.clickCard);
  }

  override render() {
    return html`
      <div class="card-content">
        <div class="card-title-row">
          ${this.renderIcon()}
          <div class="card-title">${this.renderTitle()}</div>
        </div>
        ${this.renderProperties()}
      </div>
      ${this.renderOps()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-gallery-card': GalleryCard;
  }
}
