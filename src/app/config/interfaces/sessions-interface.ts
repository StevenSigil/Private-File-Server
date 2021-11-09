export interface SessionsInterface {
  created: Date | string;
  directoryContent: {
    files: string[];
    folders: string[];
  };
  directoryPath: string;
  id: string;
  sessionName: string;
  type: string;
  updated: Date | string;
}

export interface MasterSessionsInterface {
  uuid: string;
  sessionName: string;
  created: Date | string;
  updated: Date | string;
  type: string;
  sessionPath: string;
  directoryPath: string;
}

export interface SessionErrorInterface {
  error: object | string;
}
