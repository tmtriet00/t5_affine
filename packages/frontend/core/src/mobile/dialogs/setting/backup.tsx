import { notify } from '@affine/component';
import { BackupService } from '@affine/core/modules/backup';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { WorkspacesService } from '@affine/core/modules/workspace';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { SettingGroup } from './group';
import { RowLayout } from './row.layout';

export const BackupGroup = () => {
  const backupService = useService(BackupService);
  const workspacesService = useService(WorkspacesService);
  const globalContext = useService(GlobalContextService).globalContext;
  const workspaceId = useLiveData(globalContext.workspaceId.$);
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    if (!workspaceId) {
      notify.error({ title: 'No active workspace to export' });
      return;
    }
    setLoading(true);
    try {
      await backupService.downloadBackup(workspaceId);
      notify.success({ title: 'Backup exported successfully' });
    } catch (e: any) {
      notify.error({ title: 'Export failed', message: e.message });
    } finally {
      setLoading(false);
    }
  }, [backupService, workspaceId]);

  const handleImport = useCallback(async () => {
    setLoading(true);
    try {
      await backupService.importBackup();
      workspacesService.list.revalidate();
      notify.success({ title: 'Backup imported successfully' });
    } catch (e: any) {
      // Cancelled or failed
      if (e.message !== 'No file selected') {
        notify.error({ title: 'Import failed', message: e.message });
      }
    } finally {
      setLoading(false);
    }
  }, [backupService, workspacesService]);

  return (
    <SettingGroup title="Backup">
      <RowLayout
        label={loading ? 'Processing...' : 'Export Current Workspace'}
        onClick={() => {
          handleExport().catch(e => {
            console.error(e);
            notify.error({ title: 'Export failed', message: e.message });
          });
        }}
      />
      <RowLayout
        label={loading ? 'Processing...' : 'Import Workspace'}
        onClick={() => {
          handleImport().catch(e => {
            console.error(e);
            notify.error({ title: 'Import failed', message: e.message });
          });
        }}
      />
    </SettingGroup>
  );
};
