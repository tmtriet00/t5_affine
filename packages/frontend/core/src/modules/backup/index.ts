import { type Framework } from '@toeverything/infra';

import { DesktopApiService } from '../desktop-api';
import { WorkspacesService } from '../workspace';
import {
  BackupService,
  DesktopBackupService,
  WebBackupService,
} from './services';

export { BackupService } from './services';

export function configureBackupModule(framework: Framework) {
  if (BUILD_CONFIG.isElectron) {
    framework.impl(BackupService, DesktopBackupService, [
      DesktopApiService,
      WorkspacesService,
    ]);
  } else {
    framework.impl(BackupService, WebBackupService, [WorkspacesService]);
  }
}

export { MobileFileProvider } from './providers';
import { MobileFileProvider } from './providers';
import { MobileBackupService } from './services';

export function configureMobileBackupModule(framework: Framework) {
  framework.impl(BackupService, MobileBackupService, [
    WorkspacesService,
    MobileFileProvider,
  ]);
}
