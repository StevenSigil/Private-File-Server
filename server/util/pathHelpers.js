import fsPromises from 'fs/promises';
import path from 'path';
import Constants from '../constants.js';
import {
  readJSONFile,
  searchArrayOfObjects,
  writeJSONFile,
} from './fileHelpers.js';

export async function checkUniqueSessionName(sessionName) {
  try {
    const masterSessionsData = await readJSONFile(
      Constants.PathToSessionsMaster,
      true
    );
    const matches = await searchArrayOfObjects(
      sessionName,
      'sessionName',
      masterSessionsData,
      true,
      false // wont throw error
    );

    if (typeof matches == 'object' && matches.error) {
      // No matches are found -> unique sessionName
      return true;
    }

    // Matches are found -> Not unique sessionName
    return false;
  } catch (err) {
    throw err;
  }
}

export async function checkPathExists(
  dirPath,
  filename = null,
  isFullPath = false
) {
  const doesExist = {};
  var exists = false;

  try {
    if (isFullPath || filename) {
      dirPath = isFullPath ? path.join(dirPath) : path.join(dirPath, filename);

      exists = (await fsPromises.stat(dirPath)).isFile();
    } else {
      dirPath = path.join(dirPath);
      exists = (await fsPromises.stat(dirPath)).isDirectory();
    }
  } catch (err) {
    if (err.errno == -4058 && err.syscall == 'stat') {
      exists = false;
    } else throw err;
  }

  doesExist.exists = exists;
  doesExist.path = dirPath;
  return doesExist;
}

export async function updateSessionsMaster(updatingData) {
  // Expecting "updatingData" = {sessionName: "xyz", ...,}
  const masterFilePath = Constants.PathToSessionsMaster;
  let sessionsData = [];

  // Get existing data in MASTER file
  try {
    sessionsData = await readJSONFile(masterFilePath, true); // EXPECTING AN ARRAY of OBJECTS
    if (typeof sessionsData == 'string') {
      sessionsData = JSON.parse(sessionsData);
    }
  } catch (err) {
    // "MASTER.json" does not exist in ".../data/sessions" directory...
    if (/(no such file or directory)|(ENOENT\:)/g.test(err)) {
      console.log(
        'Cannot find "MASTER.json" file... \nAttempting to create "MASTER.json", Standby...'
      );
    }
    throw Error(err);
  } finally {
    // Add "updatingData" to sessionsData Array
    sessionsData.push(updatingData);

    // Overwrite/Create MASTER file with modified sessionsData
    try {
      const writeResponse = await writeJSONFile(masterFilePath, sessionsData);

      if (writeResponse && writeResponse.code == 'SUCCESS') {
        return writeResponse;
      }
      throw Error(
        'pathHelpers: 56:\nSomething unexpected happened... Check console and fix.'
      );
    } catch (err) {
      throw Error(err);
    }
  }

  // const {
  //   id,
  //   sessionName,
  //   created,
  //   updated,
  //   type,
  //   sessionPath,
  //   directoryPath,
  //   directoryContent,
  // } = updatingData;

  // sessionsData[sessionName] = {
  //   id,
  //   sessionName,
  //   created,
  //   updated,
  //   type,
  //   sessionPath,
  //   directoryPath,
  //   directoryContent,
  // };
}

// =================================================================
// ============================= TESTS =============================
// checkPath(destination)
//   .then((r) => console.log("checkPath\tDIRECTORY\tTRUE:\t", r))
//   .catch((err) => console.error(err));

// checkPath("C:/Users/Steve/Desktop/css tes", "index.html")
//   .then((r) => console.log("checkPath\tFILE\t\tFALSE:\t", r))
//   .catch((err) => console.error(err));
// =================================================================
