import * as H from 'history';

export type AppSyncMessageHandler = (...args: any[]) => any;

export type AppAsyncMessageHandler = (...args: any[]) => Promise<any>;

// following fields are not exposed by default when using useHistory()
// these additional fields are present when obtaining history from MemoryRouter
export type AppBrowserHistory = H.History & {
  index: number,
  entries: [H.Location],
};
