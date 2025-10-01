/**
 * Builder used by main process for building Menu
 *
 * TODO: Using defaults, needs to be looked into before release
 */

import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
} from 'electron';

import { IAppBuilder, IAppMain } from '../../interfaces';
import { PlatformOS } from '../../modules/platform';

import { DatastoreModule } from '../modules';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
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
      label: 'Electron',
      submenu: [
        {
          label: 'About ElectronReact',
          selector: 'orderFrontStandardAboutPanel:',
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
          label: 'Hide ElectronReact',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        {
          label: 'Show All',
          selector: 'unhideAllApplications:',
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
          selector: 'undo:',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          selector: 'redo:',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'Command+X',
          selector: 'cut:',
        },
        {
          label: 'Copy',
          accelerator: 'Command+C',
          selector: 'copy:',
        },
        {
          label: 'Paste',
          accelerator: 'Command+V',
          selector: 'paste:',
        },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
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
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Close',
          accelerator: 'Command+W',
          selector: 'performClose:',
        },
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
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
          selector: 'arrangeInFront:',
        },
      ],
    };
    const subMenuDebug: DarwinMenuItemConstructorOptions = {
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

    const subMenuView = this.app.debug ? subMenuViewDev : subMenuViewProd;
    const subMenuList = [
      subMenuAbout,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
    ];
    if (this.app.debug) {
      subMenuList.push(subMenuDebug);
    }

    return subMenuList;
  }

  private buildDefaultTemplate(browserWindow: BrowserWindow): MenuItemConstructorOptions[] {
    const subMenuFile: MenuItemConstructorOptions = {
      label: '&File',
      submenu: [
        {
          label: '&Open',
          accelerator: 'Ctrl+O',
        },
        {
          label: '&Close',
          accelerator: 'Ctrl+W',
          click: () => {
            browserWindow.close();
          },
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: '&View',
      submenu: [
        {
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            browserWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle &Developer Tools',
          accelerator: 'Alt+Ctrl+I',
          click: () => {
            browserWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: '&View',
      submenu: [
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => {
            browserWindow.setFullScreen(!browserWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuDebug: MenuItemConstructorOptions = {
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

    const subMenuList = [
      subMenuFile,
    ];
    if (this.app.debug) {
      subMenuList.push(subMenuViewDev, subMenuDebug);
    } else {
      subMenuList.push(subMenuViewProd);
    }

    return subMenuList;
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
}
