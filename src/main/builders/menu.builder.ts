/**
 * Builder used by main process for building Menu
 *
 * TODO: Using defaults, needs to be looked into before release
 */

import {
  BrowserWindow,
  dialog,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from 'electron';

import { IAppBuilder, IAppMain } from '../../interfaces';
import { PlatformOS } from '../../modules/platform';
import { IPCRendererCommChannel } from '../../modules/ipc';

import { DatastoreModule } from '../modules';
import { Links } from '../../constants';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
}

export default class MenuBuilder implements IAppBuilder {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
  }

  build(mainWindow: BrowserWindow): void {
    if (this.app.debug) {
      this.setupDevelopmentEnvironment(mainWindow);
    }

    const menuTemplate = this.app.platform === PlatformOS.Darwin
      ? this.buildDarwinTemplate(mainWindow)
      : this.buildDefaultTemplate(mainWindow);

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  private setupDevelopmentEnvironment(browserWindow: BrowserWindow): void {
    browserWindow.webContents.on('context-menu', (_, props) => {
      const {
        x,
        y,
      } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            browserWindow.webContents.inspectElement(x, y);
          },
        }])
        .popup({
          window: browserWindow,
        });
    });
  }

  private buildDarwinTemplate(browserWindow: BrowserWindow): DarwinMenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: this.app.displayName,
      submenu: [
        {
          label: `About ${this.app.displayName}`,
          click: () => {
            this.openAboutWindow();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Settings',
          accelerator: 'Command+,',
          click: () => {
            this.openSettings();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: `Hide ${this.app.displayName}`,
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideOthers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            this.app.quit();
          },
        },
      ],
    };

    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'Command+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'Command+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'Command+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          role: 'selectAll',
        },
      ],
    };

    const subMenuViewDev: DarwinMenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            browserWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            browserWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: DarwinMenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuView = this.app.debug ? subMenuViewDev : subMenuViewProd;

    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Close',
          accelerator: 'Command+W',
          role: 'close',
        },
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          role: 'minimize',
        },
        {
          label: 'Fill',
          click: () => {
            this.app.toggleWindowFill();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Bring All to Front',
          role: 'front',
        },
      ],
    };

    const subMenuHelp: DarwinMenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Report Issue',
          click: () => shell.openExternal(Links.ProjectReportIssue),
        },
        {
          label: 'Source Code',
          click: () => shell.openExternal(Links.Project),
        },
      ],
    };

    const subMenuList = [
      subMenuAbout,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
    ];
    if (this.app.debug) {
      subMenuList.push(this.buildDebugMenu());
    }

    return subMenuList;
  }

  private buildDefaultTemplate(browserWindow: BrowserWindow): MenuItemConstructorOptions[] {
    const subMenuFile: MenuItemConstructorOptions = {
      label: '&File',
      submenu: [
        {
          label: `&About ${this.app.displayName}`,
          click: () => {
            this.openAboutWindow();
          },
        },
        {
          label: '&Settings',
          accelerator: 'Ctrl+,',
          click: () => this.openSettings(),
        },
        {
          type: 'separator',
        },
        {
          label: '&Quit',
          accelerator: 'Ctrl+Q',
          click: () => this.app.quit(),
        },
      ],
    };

    const subMenuEdit: MenuItemConstructorOptions = {
      label: '&Edit',
      submenu: [
        {
          label: '&Undo',
          accelerator: 'Ctrl+Z',
          role: 'undo',
        },
        {
          label: '&Redo',
          accelerator: 'Ctrl+Shift+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cu&t',
          accelerator: 'Ctrl+X',
          role: 'cut',
        },
        {
          label: '&Copy',
          accelerator: 'Ctrl+C',
          role: 'copy',
        },
        {
          label: '&Paste',
          accelerator: 'Ctrl+V',
          role: 'paste',
        },
        {
          label: 'Select &All',
          accelerator: 'Ctrl+A',
          role: 'selectAll',
        },
      ],
    };

    const subMenuViewDev: MenuItemConstructorOptions = {
      label: '&View',
      submenu: [
        {
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click: () => browserWindow.webContents.reload(),
        },
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => browserWindow.setFullScreen(!browserWindow.isFullScreen()),
        },
        {
          label: 'Toggle &Developer Tools',
          accelerator: 'Ctrl+Shift+I',
          click: () => browserWindow.webContents.toggleDevTools(),
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: '&View',
      submenu: [
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => browserWindow.setFullScreen(!browserWindow.isFullScreen()),
        },
      ],
    };
    const subMenuView = this.app.debug ? subMenuViewDev : subMenuViewProd;

    const subMenuWindow: MenuItemConstructorOptions = {
      label: '&Window',
      submenu: [
        {
          label: '&Close',
          accelerator: 'Ctrl+W',
          role: 'close',
        },
        {
          label: '&Minimize',
          accelerator: 'Ctrl+M',
          role: 'minimize',
        },
        {
          label: '&Fill',
          click: () => this.app.toggleWindowFill(),
        },
      ],
    };

    const subMenuHelp: MenuItemConstructorOptions = {
      label: '&Help',
      submenu: [
        {
          label: '&Report Issue',
          click: () => shell.openExternal(Links.ProjectReportIssue),
        },
        {
          label: '&Source Code',
          click: () => shell.openExternal(Links.Project),
        },
      ],
    };

    const menu: MenuItemConstructorOptions[] = [
      subMenuFile,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
    ];

    if (this.app.debug) {
      menu.push(this.buildDebugMenu());
    }

    return menu;
  }

  private buildDebugMenu(): MenuItemConstructorOptions {
    return {
      label: 'Debug',
      submenu: [
        {
          label: 'Open Application Data Folder',
          click: () => {
            const appDataPath = this.app.getDataPath();
            this.app.openPath(appDataPath);
          },
        },
        {
          label: 'Remove AppData and Reload',
          click: () => {
            this.removeAppData();
            this.reloadApp();
          },
        },
        {
          label: 'Remove DataStores and Reload',
          click: () => {
            this.removeDataStores();
            this.reloadApp();
          },
        },
        {
          label: 'Remove Persisted States and Reload',
          click: () => {
            this.removePersistedStates();
            this.reloadApp();
          },
        },
        {
          label: 'Compact DataStores',
          click: () => {
            const datastore = this.app.getModule(DatastoreModule);
            datastore.compactDatastores();
          },
        },
      ],
    };
  }

  private removeAppData() {
    this.app.removeAppData();
  }

  private removeDataStores() {
    const datastore = this.app.getModule(DatastoreModule);
    datastore.removeDatastores();
  }

  private removePersistedStates() {
    this.app.removePersistedStates();
  }

  private reloadApp() {
    this.app.reloadApp();
  }

  private openSettings() {
    this.app.sendMessageToRenderer(IPCRendererCommChannel.UIOpenSettings);
  }

  private openAboutWindow() {
    dialog.showMessageBox({
      type: 'info',
      title: 'About',
      message: `${this.app.displayName} - ${this.app.version}`,
      detail: this.app.description,
      buttons: ['Close', 'Source Code', 'Report Issue'],
    }).then((result) => {
      if (result.response === 1) shell.openExternal(Links.Project);
      if (result.response === 2) shell.openExternal(Links.ProjectReportIssue);
    });
  }
}
