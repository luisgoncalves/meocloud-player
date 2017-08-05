export class CloudConfiguration {
  authzEndpoint: string;
  apiBaseAddress: string;
  adjustApiPath?: (path: string) => string;
  root: string;
  clientId: string;
  name: string;
  displayName: string;
  shouldReadTags: boolean;
}

export function createMEOCloud(clientId: string): CloudConfiguration {
  return {
    authzEndpoint: 'https://meocloud.pt/oauth2/authorize',
    apiBaseAddress: 'https://publicapi.meocloud.pt/1',
    root: 'meocloud',
    clientId,
    name: 'meocloud',
    displayName: 'MEO Cloud',
    shouldReadTags: false
  };
}

export function createDropbox(clientId: string): CloudConfiguration {
  return {
    authzEndpoint: 'https://www.dropbox.com/1/oauth2/authorize',
    apiBaseAddress: 'https://api.dropboxapi.com/1',
    adjustApiPath: function (p: string) { return p.toLowerCase(); },
    root: 'auto',
    clientId,
    name: 'dropbox',
    displayName: 'Dropbox',
    shouldReadTags: true
  };
}

export const clouds: { [key: string]: (clientId: string) => CloudConfiguration } = {
  'meocloud': createMEOCloud,
  'dropbox': createDropbox
};
