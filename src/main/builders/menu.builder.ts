/**
 * Builder used by main process for building Menu
 *
 * TODO: Using defaults, needs to be looked into before release
 */

import {
  shell,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
} from 'electron';

import {AppEnums} from '../../enums';
import {IAppBuilder, IAppMain} from '../../interfaces';

import {DatastoreModule} from '../modules';

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

    const menuTemplate = this.app.platform === AppEnums.Platforms.Darwin
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

  private buildDarwinTemplate(browserWindow: BrowserWindow): MenuItemConstructorOptions[] {
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
    const subMenuViewDev: MenuItemConstructorOptions = {
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
          label: 'Remove Datastores and Reload',
          accelerator: 'Command+Shift+R',
          click: () => {
            const datastore = this.app.getModule(DatastoreModule);

            datastore.removeDatastores();
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
    const subMenuViewProd: MenuItemConstructorOptions = {
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
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        {
          label: 'Close',
          accelerator: 'Command+W',
          selector: 'performClose:',
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
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://electronjs.org');
          },
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://github.com/electron/electron/tree/master/docs#readme',
            );
          },
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://www.electronjs.org/community');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/electron/electron/issues');
          },
        },
      ],
    };

    const subMenuView = this.app.debug ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  private buildDefaultTemplate(browserWindow: BrowserWindow): MenuItemConstructorOptions[] {
    return [
      {
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
      },
      {
        label: '&View',
        submenu: this.app.debug
          ? [
            {
              label: '&Reload',
              accelerator: 'Ctrl+R',
              click: () => {
                browserWindow.webContents.reload();
              },
            },
            {
              label: 'Remove Datastores and Reload',
              accelerator: 'Ctrl+Shift+R',
              click: () => {
                const datastore = this.app.getModule(DatastoreModule);

                datastore.removeDatastores();
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
          ]
          : [
            {
              label: 'Toggle &Full Screen',
              accelerator: 'F11',
              click: () => {
                browserWindow.setFullScreen(!browserWindow.isFullScreen());
              },
            },
          ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://electronjs.org');
            },
          },
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://github.com/electron/electron/tree/master/docs#readme',
              );
            },
          },
          {
            label: 'Community Discussions',
            click() {
              shell.openExternal('https://www.electronjs.org/community');
            },
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal('https://github.com/electron/electron/issues');
            },
          },
        ],
      },
    ];
  }
}
