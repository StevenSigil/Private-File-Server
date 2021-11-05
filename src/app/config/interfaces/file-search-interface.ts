export interface FileSearchInterface {
  directory: string;
  folders: object[];
  files: object[];
  stats?: object;
  splitDirectory?: string[];
}

export interface FileSearchErrorInterface {
  error: object;
}
