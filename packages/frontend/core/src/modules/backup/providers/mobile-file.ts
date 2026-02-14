import { createIdentifier } from '@toeverything/infra';

export interface MobileFileProvider {
  download(blob: Blob, filename: string): Promise<void>;
  select(): Promise<File | null>;
}

export const MobileFileProvider =
  createIdentifier<MobileFileProvider>('MobileFileProvider');
