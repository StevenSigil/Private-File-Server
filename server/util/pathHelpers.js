import fsPromises from "fs/promises";
import path from "path";
import Constants from "../data/constants.js";
import { getJSONFile, writeJSONFile } from "./fileHelpers.js";

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
    if (err.errno == -4058 && err.syscall == "stat") {
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
  let sessionsData = {};

  // Get existing data in MASTER file
  try {
    sessionsData = await getJSONFile(masterFilePath);
    // console.log('SESSIONS DATA:', sessionsData);
    if (typeof sessionsData == "string") {
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
    // Add "sessionName" as key for value of "data"
    const { uuid, sessionName, created, updated, sessionPath } = updatingData;
    const writeData = sessionsData;
    writeData[sessionName] = {
      uuid,
      sessionName,
      created,
      updated,
      sessionPath,
    };

    // Overwrite/Create MASTER file with modified sessionsData
    try {
      const writeResponse = await writeJSONFile(masterFilePath, writeData);

      if (writeResponse && writeResponse.code == "SUCCESS") {
        return writeResponse;
      }
      throw Error(
        "pathHelpers: 56:\nSomething unexpected happened... Check console and fix."
      );
    } catch (err) {
      throw Error(err);
    }
  }
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
