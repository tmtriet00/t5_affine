import { generateDocUpdate } from '@affine/nbstore';
import { IndexedDBBlobStorage, IndexedDBDocStorage } from '@affine/nbstore/idb';
import {
  catchErrorInto,
  effect,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import JSZip from 'jszip';
import { switchMap, tap } from 'rxjs';

import { WorkspacesService } from '../../workspace';
import {
  LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY,
  setLocalWorkspaceIds,
} from '../../workspace-engine/impls/local';
import { BaseBackupService } from './base';

export class WebBackupService extends BaseBackupService {
  constructor(private readonly workspacesService: WorkspacesService) {
    super();
  }

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);
  pageBackupWorkspaces$ = new LiveData<any>(undefined);

  readonly revalidate = effect(
    switchMap(() =>
      fromPromise(async () => {
        // web version doesn't support listing archived backup workspaces
        return undefined;
      }).pipe(
        tap(data => {
          this.pageBackupWorkspaces$.setValue(data);
        }),
        catchErrorInto(this.error$),
        onStart(() => this.isLoading$.setValue(true)),
        onComplete(() => this.isLoading$.setValue(false))
      )
    )
  );

  private async generateBackupZipBlob(workspaceId: string): Promise<Blob> {
    const workspaceMeta = this.workspacesService.list.workspaces$.value.find(
      w => w.id === workspaceId
    );
    if (!workspaceMeta) {
      throw new Error('Workspace not found');
    }
    const { workspace, dispose } = this.workspacesService.open({
      metadata: workspaceMeta,
    });

    try {
      // Wait for root doc to be ready before exporting
      await workspace.engine.doc.waitForDocReady(workspace.id);

      const zip = new JSZip();

      // 1. Export Info
      const info = {
        workspaceId,
        createdAt: new Date().toISOString(),
        version: 1,
      };
      zip.file('info.json', JSON.stringify(info, null, 2));

      // 2. Export Docs (Yjs binary updates)
      const docStorage = workspace.engine.doc.storage;
      const docTimestamps = await docStorage.getDocTimestamps();
      const docsFolder = zip.folder('docs');

      if (docsFolder) {
        for (const docId of Object.keys(docTimestamps)) {
          const doc = await docStorage.getDoc(docId);
          if (doc) {
            docsFolder.file(docId + '.bin', doc.bin);
          }
        }
      }

      // 3. Export Blobs with metadata manifest
      const blobStorage = workspace.engine.blob.storage;
      const blobsList = await blobStorage.list();
      const blobsFolder = zip.folder('blobs');

      const blobManifest: Record<string, { mime: string; size: number }> = {};

      if (blobsFolder) {
        for (const blobRecord of blobsList) {
          const blob = await blobStorage.get(blobRecord.key);
          if (blob) {
            blobsFolder.file(blobRecord.key, blob.data);
            blobManifest[blobRecord.key] = {
              mime: blob.mime,
              size: blobRecord.size,
            };
          }
        }
      }
      zip.file('blobs.json', JSON.stringify(blobManifest, null, 2));

      return await zip.generateAsync({ type: 'blob' });
    } finally {
      dispose();
    }
  }

  async downloadBackup(workspaceId: string) {
    this.isLoading$.setValue(true);
    try {
      const content = await this.generateBackupZipBlob(workspaceId);
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      a.download = `workspace-backup-${timestamp}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export backup.', e);
      this.error$.setValue(e);
    } finally {
      this.isLoading$.setValue(false);
    }
  }

  async exportBackupAsQrVideo(workspaceId: string): Promise<Blob> {
    this.isLoading$.setValue(true);
    try {
      return await this.generateBackupZipBlob(workspaceId);
    } catch (e) {
      console.error('Failed to generate backup for QR video.', e);
      this.error$.setValue(e);
      throw e;
    } finally {
      this.isLoading$.setValue(false);
    }
  }

  async importBackup(file?: File, targetWorkspaceId?: string): Promise<string> {
    this.isLoading$.setValue(true);
    try {
      // If no file provided on web, we need to prompt user to select one
      if (!file) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        const selectedFile = await new Promise<File>((resolve, reject) => {
          input.onchange = () => {
            if (input.files && input.files[0]) {
              resolve(input.files[0]);
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.click();
        });
        file = selectedFile;
      }

      const zip = await JSZip.loadAsync(file);

      // Validate backup file
      const infoFile = zip.file('info.json');
      if (!infoFile) {
        throw new Error('Invalid backup file: info.json missing');
      }

      const info = JSON.parse(await infoFile.async('string'));
      const backupWorkspaceId = info.workspaceId;

      if (!backupWorkspaceId) {
        throw new Error(
          'Invalid backup file: workspaceId missing in info.json'
        );
      }

      // Determine which workspace ID to use
      const workspaceId = targetWorkspaceId ?? backupWorkspaceId;

      // Load blob manifest if available
      const blobManifestFile = zip.file('blobs.json');
      let blobManifest: Record<string, { mime: string; size: number }> = {};
      if (blobManifestFile) {
        blobManifest = JSON.parse(await blobManifestFile.async('string'));
      }

      // Find existing workspace
      const workspaceMeta = this.workspacesService.list.workspaces$.value.find(
        w => w.id === workspaceId
      );

      if (workspaceMeta) {
        // Workspace exists — merge into it
        return await this.importIntoExistingWorkspace(
          zip,
          workspaceMeta,
          blobManifest
        );
      } else {
        // Workspace doesn't exist — create storage directly with this ID
        return await this.importAsNewWorkspace(zip, workspaceId, blobManifest);
      }
    } catch (e) {
      console.error('Failed to import backup', e);
      this.error$.setValue(e);
      throw e;
    } finally {
      this.isLoading$.setValue(false);
    }
  }

  private async importIntoExistingWorkspace(
    zip: JSZip,
    workspaceMeta: { id: string; flavour: string },
    blobManifest: Record<string, { mime: string; size: number }>
  ): Promise<string> {
    const { workspace, dispose } = this.workspacesService.open({
      metadata: workspaceMeta,
    });

    try {
      await workspace.engine.doc.waitForDocReady(workspace.id);

      const docStorage = workspace.engine.doc.storage;
      const blobStorage = workspace.engine.blob.storage;

      // Restore Docs
      const docsFolder = zip.folder('docs');
      if (docsFolder) {
        const docEntries = Object.entries(docsFolder.files).filter(
          ([path, entry]) => path.startsWith('docs/') && !entry.dir
        );

        for (const [filePath, entry] of docEntries) {
          const fileName = filePath.split('/').pop();
          if (!fileName) continue;
          const docId = fileName.replace('.bin', '');
          const docData = await entry.async('uint8array');
          if (docData) {
            const currentDoc = await docStorage.getDoc(docId);
            if (currentDoc) {
              const docUpdateBin = generateDocUpdate(currentDoc.bin, docData);
              await docStorage.pushDocUpdate({
                docId: docId,
                bin: docUpdateBin,
              });
            } else {
              // Doc is new to this workspace — push it directly
              await docStorage.pushDocUpdate({
                docId: docId,
                bin: docData,
              });
            }
          }
        }
      }

      // Restore Blobs
      await this.restoreBlobs(zip, blobStorage, blobManifest);

      return workspaceMeta.id;
    } finally {
      dispose();
    }
  }

  private async importAsNewWorkspace(
    zip: JSZip,
    workspaceId: string,
    blobManifest: Record<string, { mime: string; size: number }>
  ): Promise<string> {
    // Create IndexedDB storage directly with the backup's workspace ID
    const docStorage = new IndexedDBDocStorage({
      id: workspaceId,
      flavour: 'local',
      type: 'workspace',
    });
    docStorage.connection.connect();
    await docStorage.connection.waitForConnected();

    const blobStorage = new IndexedDBBlobStorage({
      id: workspaceId,
      flavour: 'local',
      type: 'workspace',
    });
    blobStorage.connection.connect();
    await blobStorage.connection.waitForConnected();

    try {
      // Restore Docs
      const docsFolder = zip.folder('docs');
      if (docsFolder) {
        const docEntries = Object.entries(docsFolder.files).filter(
          ([path, entry]) => path.startsWith('docs/') && !entry.dir
        );

        for (const [filePath, entry] of docEntries) {
          const fileName = filePath.split('/').pop();
          if (!fileName) continue;
          const docId = fileName.replace('.bin', '');
          const docData = await entry.async('uint8array');
          if (docData) {
            await docStorage.pushDocUpdate({
              docId: docId,
              bin: docData,
            });
          }
        }
      }

      // Restore Blobs
      await this.restoreBlobs(zip, blobStorage, blobManifest);

      // Register workspace ID in localStorage
      setLocalWorkspaceIds(ids => [...ids, workspaceId]);

      // Notify other browser tabs about the new workspace
      const channel = new BroadcastChannel(
        LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY
      );
      channel.postMessage(workspaceId);
      channel.close();

      return workspaceId;
    } finally {
      docStorage.connection.disconnect();
      blobStorage.connection.disconnect();
    }
  }

  private async restoreBlobs(
    zip: JSZip,
    blobStorage: {
      set: (blob: {
        key: string;
        data: Uint8Array;
        mime: string;
      }) => Promise<void>;
    },
    blobManifest: Record<string, { mime: string; size: number }>
  ): Promise<void> {
    const blobsFolder = zip.folder('blobs');
    if (blobsFolder) {
      const blobEntries = Object.entries(blobsFolder.files).filter(
        ([path, entry]) => path.startsWith('blobs/') && !entry.dir
      );

      for (const [filePath, entry] of blobEntries) {
        const key = filePath.split('/').pop();
        if (!key) continue;
        const blobData = await entry.async('uint8array');
        if (blobData) {
          const mime = blobManifest[key]?.mime || 'application/octet-stream';
          await blobStorage.set({
            key,
            data: blobData,
            mime,
          });
        }
      }
    }
  }

  // These methods are desktop-only and not applicable on web
  async recoverBackupWorkspace(_dbPath: string): Promise<string> {
    throw new Error('Not supported on web platform');
  }

  async deleteBackupWorkspace(_backupWorkspaceId: string): Promise<void> {
    throw new Error('Not supported on web platform');
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
