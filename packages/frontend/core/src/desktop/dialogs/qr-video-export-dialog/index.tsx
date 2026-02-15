import { Button,Modal } from '@affine/component';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BackupService,
  type BaseBackupService,
} from '../../../modules/backup/services/base';
import * as styles from './dialog.css';

// Define the Emscripten Module interface for cimbar
interface CimbarModule {
  onRuntimeInitialized: () => void;
  locateFile: (path: string) => string;
  canvas: HTMLCanvasElement | null;
  _cimbare_init_encode: (
    namePtr: number,
    nameLen: number,
    ecc: number
  ) => number;
  _cimbare_encode: (dataPtr: number, dataLen: number) => number;
  _cimbare_encode_bufsize: () => number;
  _cimbare_render: () => void;
  _cimbare_next_frame: () => number;
  _cimbare_configure: (mode: number, ecc: number) => void;
  _cimbare_get_aspect_ratio: () => number;
  _cimbare_rotate_window: (rotate: boolean) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
}

declare global {
  interface Window {
    Module: CimbarModule;
  }
}

export interface QrVideoExportDialogProps {
  open?: boolean;
  onClose?: () => void;
  close?: () => void;
  workspaceId?: string;
  workspaceName?: string;
  backupService?: BaseBackupService;
}

export const QrVideoExportDialog = ({
  open = true,
  onClose,
  close,
  workspaceId: propsWorkspaceId,
  workspaceName: propsWorkspaceName,
  backupService: propsBackupService,
}: QrVideoExportDialogProps) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const defaultBackupService = useService(BackupService);
  const currentWorkspaceName = useLiveData(currentWorkspace.name$);

  const workspaceId = propsWorkspaceId ?? currentWorkspace.id;
  const workspaceName = propsWorkspaceName ?? currentWorkspaceName ?? 'Unknown';
  const backupService = propsBackupService ?? defaultBackupService;
  const [cimbarLoaded, setCimbarLoaded] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupBlob, setBackupBlob] = useState<Blob | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Load backup blob when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingBlob(true);
    setError(null);

    backupService
      .exportBackupAsQrVideo(workspaceId)
      .then((blob: Blob) => {
        if (!cancelled) {
          setBackupBlob(blob);
          setLoadingBlob(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error('Failed to generate backup blob:', err);
          setError('Failed to generate backup data');
          setLoadingBlob(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, backupService, workspaceId]);

  // Load cimbar WASM when dialog opens AND canvas is mounted
  useEffect(() => {
    console.log('open>>>', open);
    console.log('canvasRef.current>>>', canvasRef.current);
    if (!open || !canvasRef.current) return;

    console.log('loading cimbar...');

    // Set canvas on Module BEFORE loading the script
    const canvas = canvasRef.current;
    canvas.style.backgroundColor = 'black';

    // Setup global Module object for Emscripten
    window.Module = {
      onRuntimeInitialized: () => {
        console.log('Cimbar WASM Runtime Initialized');
        setCimbarLoaded(true);
        // Initialize config: Mode 'B' -> 68, ECC -> -1 (default)
        if (window.Module._cimbare_configure) {
          window.Module._cimbare_configure(68, -1);
          console.log('Cimbar configured to Mode B');

          if (window.Module.canvas) {
            window.Module._cimbare_rotate_window(false);
          }
        }
      },
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return '/static/cimbar/cimbar_js.2025-10-13T0307.wasm';
        }
        return path;
      },
      canvas: canvas, // Canvas is already mounted
      _cimbare_init_encode: () => 0,
      _cimbare_encode: () => 0,
      _cimbare_encode_bufsize: () => 0,
      _cimbare_render: () => {},
      _cimbare_next_frame: () => 0,
      _cimbare_configure: () => {},
      _cimbare_get_aspect_ratio: () => 1,
      _cimbare_rotate_window: () => {},
      _malloc: () => 0,
      _free: () => {},
      HEAPU8: new Uint8Array(0),
    };

    // Load the JS glue code
    const script = document.createElement('script');
    script.src = '/static/cimbar/cimbar_js.2025-10-13T0307.js';
    script.async = true;
    scriptRef.current = script;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCimbarLoaded(false);
      setEncoding(false);
      setError(null);
      setBackupBlob(null);
      setLoadingBlob(false);
    };
  }, [open, canvasRef.current]);

  const copyToWasmHeap = useCallback((str: string) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    const ptr = window.Module._malloc(encoded.length + 1);
    const heapBytes = new Uint8Array(
      window.Module.HEAPU8.buffer,
      ptr,
      encoded.length + 1
    );
    heapBytes.set(encoded);
    heapBytes[encoded.length] = 0; // null terminate
    return { ptr, len: encoded.length };
  }, []);

  const startRenderLoop = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    console.log('Starting Render Loop');
    const interval = 66; // ~15 FPS

    const tick = () => {
      if (!canvasRef.current) return;

      window.Module._cimbare_render();
      window.Module._cimbare_next_frame();

      timeoutRef.current = setTimeout(() => {
        requestRef.current = requestAnimationFrame(tick);
      }, interval);
    };

    tick();
  }, []);

  const startEncoding = useCallback(async () => {
    if (!backupBlob || !cimbarLoaded || !canvasRef.current) return;
    setEncoding(true);
    setError(null);

    try {
      window.Module.canvas = canvasRef.current;
      window.Module._cimbare_configure(68, -1);

      const width = canvasRef.current.clientWidth || 800;
      const height = canvasRef.current.clientHeight || 600;
      const ratio = window.Module._cimbare_get_aspect_ratio();
      const needRotate = ratio > 1 && height > width;
      window.Module._cimbare_rotate_window(needRotate);

      // Initialize encoder with a filename
      const fileName = `backup-${workspaceName}.zip`;
      const wasmFn = copyToWasmHeap(fileName);
      const initRes = window.Module._cimbare_init_encode(
        wasmFn.ptr,
        wasmFn.len,
        -1
      );
      window.Module._free(wasmFn.ptr);
      console.log('Init Code returned:', initRes);

      // Prepare buffer
      const chunkSize = window.Module._cimbare_encode_bufsize();
      const compressBuffPtr = window.Module._malloc(chunkSize);

      // Read blob and encode in chunks
      const arrayBuffer = await backupBlob.arrayBuffer();
      const fullData = new Uint8Array(arrayBuffer);
      let offset = 0;

      const encodeNextChunk = () => {
        if (offset >= fullData.length) {
          // Done reading, flush with 0 length
          console.log('Finished reading. Flushing...');
          window.Module._cimbare_encode(compressBuffPtr, 0);
          window.Module._free(compressBuffPtr);
          startRenderLoop();
          return;
        }

        const end = Math.min(offset + chunkSize, fullData.length);
        const chunk = fullData.slice(offset, end);

        // Re-acquire HEAPU8 view as buffer might have grown
        const heapView = new Uint8Array(
          window.Module.HEAPU8.buffer,
          compressBuffPtr,
          chunkSize
        );
        heapView.set(chunk);

        window.Module._cimbare_encode(compressBuffPtr, chunk.length);
        offset = end;

        // Use requestAnimationFrame to avoid blocking
        requestAnimationFrame(() => encodeNextChunk());
      };

      encodeNextChunk();
    } catch (e) {
      console.error('Encoding failed:', e);
      setError('Failed to encode backup as QR video');
      setEncoding(false);
    }
  }, [
    backupBlob,
    cimbarLoaded,
    workspaceName,
    copyToWasmHeap,
    startRenderLoop,
  ]);

  const stopEncoding = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setEncoding(false);
  }, []);

  const handleClose = useCallback(() => {
    stopEncoding();
    onClose?.();
    close?.();
  }, [stopEncoding, onClose, close]);

  if (!open) return null;

  console.log('canvasRef.current++++', canvasRef.current);

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose();
      }}
      title="Export as QR Video"
      width={680}
      contentOptions={{ className: styles.qrDialogContent }}
    >
      <div className={styles.qrDialogBody}>
        {(!cimbarLoaded || loadingBlob) && (
          <div className={styles.qrLoadingOverlay}>
            {loadingBlob
              ? 'Generating backup data...'
              : 'Loading Cimbar encoder...'}
          </div>
        )}

        {error && <div className={styles.qrError}>{error}</div>}

        <div className={styles.qrCanvasContainer}>
          <canvas
            id="canvas"
            ref={canvasRef}
            width={800}
            height={600}
            className={styles.qrCanvas}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className={styles.qrButtonRow}>
          {!encoding ? (
            <Button
              variant="primary"
              onClick={() => void startEncoding()}
              disabled={!cimbarLoaded || !backupBlob || loadingBlob}
            >
              Start Encoding
            </Button>
          ) : (
            <Button variant="error" onClick={stopEncoding}>
              Stop
            </Button>
          )}
          <Button onClick={handleClose}>Close</Button>
        </div>

        <div className={styles.qrWarning}>
          Experimental: Uses WebAssembly to encode the backup into a Cimbar
          video stream. Point your phone camera at the screen to receive the
          data.
        </div>
      </div>
    </Modal>
  );
};
