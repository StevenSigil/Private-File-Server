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
  movieData?: MovieDataInterface[];
  imageData?: ImageDataInterface[];
}

export interface MovieDataInterface {
  title: string;
  description?: string;
  poster?: {
    type?: string;
    url?: string;
    width?: number;
    height?: number;
  };
  wikiID?: number | string;
  id: string;
  matchedSearchTerms?: string[];
  originalSearchValue?: string;
  matchScore?: number;
  probableMatch?: number;
}

export interface ImageDataInterface {
  title: string;
  fileName: string;
  url: string;
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
