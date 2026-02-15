import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const qrDialogContent = style({
  padding: '0 !important',
});

export const qrDialogBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
});

export const qrCanvasContainer = style({
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
  border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
});

export const qrCanvas = style({
  maxWidth: '100%',
  height: 'auto',
});

export const qrButtonRow = style({
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
});

export const qrLoadingOverlay = style({
  padding: '12px 16px',
  borderRadius: '8px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  color: cssVarV2('text/secondary'),
  fontSize: cssVar('fontSm'),
  textAlign: 'center',
});

export const qrError = style({
  padding: '12px 16px',
  borderRadius: '8px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  fontSize: cssVar('fontSm'),
  textAlign: 'center',
});

export const qrWarning = style({
  padding: '8px 12px',
  borderRadius: '6px',
  backgroundColor: cssVarV2('layer/background/secondary'),
  color: cssVarV2('text/secondary'),
  fontSize: cssVar('fontXs'),
  lineHeight: '1.4',
  textAlign: 'center',
});
