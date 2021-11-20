import path from "path";
import fs from "fs";
import util from "util";
import { throwError } from "rxjs";
import axios from "axios";

import Constants from "../constants.js";
import { checkForVideoFiles, getUUID, normalizeFileName } from "./util.js";
import { getFromWikipedia } from "./externalAPI.js";
import {
  readJSONFile,
  writeJSONFile,
  lookupMovieByProperty2,
} from "./fileHelpers.js";

const readDir = util.promisify(fs.readdir);
const lStat = util.promisify(fs.lstat);

/**
 * Middleware function to get directory from a given path provided in request query `path` params
 *
 * @returns {Response}  Response.directory_content: string[]
 */
export async function getDirectoryContent(req, res, next) {
  const method = req.method;
  var query = null;

  switch (method) {
    case "POST":
      query = typeof req.body == "object" ? req.body.path : req.body;
      break;

    case "GET":
      query = typeof req.query == "object" ? req.query.path : req.query;
      break;
  }
  query = query != null ? query : "C:/Users";

  var dirContent;

  try {
    dirContent = await readDir(path.resolve(query + "/"));
    // console.log(dirContent, query, '\n', path.join(query));
  } catch (err) {
    if (err.code === "EPERM") {
      console.log(`\nmiddleware: 23:\nSYSCALL: "${err.syscall}" NOT PERMITTED`);
      console.log("Attempting to open from link...");

      try {
        const tmp = fs.readlinkSync(path.join(query));
        dirContent = await readDir(tmp);
        console.log(`\n29:\nChanging "${query}" to "${tmp}" as Link`);
        if (dirContent) query = cleanPath(tmp);
        return;
      } catch (err) {
        console.error(
          `\nmiddleware: 33:\nUnable to open "${query}" as Link...\n`,
          err
        );

        return throwError(`Unable to open "${query}" as Link...`);
      }
    } else {
      console.error(`\nmiddleware: 38\nERROR: CANNOT READ DIRECTORY: ${query}`);
      console.error(err);

      res.directory_content = {
        message: `ERROR: CANNOT READ DIRECTORY: ${query}`,
        errno: err.errno,
        code: err.code,
        syscall: err.syscall,
        path: err.path,
      };

      return throwError(err);
    }
  } finally {
    if (dirContent && !res.directory_content) {
      const files = [];
      const folders = [];
      const fileTypes = {};
      const errFiles = [];
      const ret = {};

      try {
        for (let name of dirContent) {
          try {
            // Get rid of files starting with "$" and hidden -- ie starts with "."
            if (/^(\$|\.)/g.test(name)) {
              var E = new Error(`NOT ADDING ${name} to results...`);
              E.path = path.join(query, name);
              throw E;
            }

            const stats = await lStat(path.resolve(path.join(query, name)));
            if (stats.isFile()) {
              files.push(name);
              const ext = path.extname(path.join(query, name));

              if (ext !== "") {
                fileTypes[ext] = fileTypes[ext] + 1 || 1;
              }
            } else folders.push(name);
          } catch (err) {
            if (/^(EBUSY|EPERM|NOT ADD)/g.test(err.message)) {
              console.error("middleware: 68:\n", err.message);
              errFiles.push(err.path);
            } else return throwError("\n\nSomething unexpected happened!!\n\n");
          }
        }

        ret.directory = query;
        ret.files = files;
        ret.folders = folders;
        ret.stats = {
          counts: [
            { name: "files", value: files.length, type: "base" },
            { name: "folders", value: folders.length, type: "base" },
            { name: "errPaths", value: errFiles.length, type: "errors" },
          ],
          fileTypes: nameValueObj(fileTypes, "file_type"),
        };

        res.directory_content = ret;
      } catch (err) {
        err = new Error(err);
        console.error(err);

        res.directory_content = {
          message: err.message,
          errno: err.errno,
          code: err.code,
          syscall: err.syscall,
          path: err.path,
        };
      }
    }
    next();
  }
}

export async function createMovieFileData(sessionFiles) {
  const videoFiles = checkForVideoFiles(sessionFiles);

  // // ========================================================================
  // // ================================= TODO =================================
  // // TODO: if (videoFiles.length < 1) ADD ALERT TO RESPONSE SAYING NOT FOUND!

  // Check if each movie is already stored in movie_data.json
  try {
    const localMatchMovies = await lookupMovieByProperty2(
      "title",
      videoFiles,
      true
    );

    // console.log("\n\n==================================================");
    // console.log("localMatchMovies\n", localMatchMovies, "\n");

    // Separate the not found videoFiles with >= 70% probability
    const notFound = localMatchMovies.filter((obj) => {
      if (obj.error && obj.originalSearchValue) {
        return true;
      } else {
        if (obj.probableMatch && obj.probableMatch >= 0.7) {
          return false;
        }
        if (!obj.probableMatch) {
          return false;
        }
        return true;
      }
    });
    // console.log("\n\n==================================================");
    // console.log("notFoundMovies\n", notFound, "\n");

    // Attempt to get data for each fileNotFound & write to movie_data.json
    const allVideoData = [];

    for (let file of notFound) {
      file = file.originalSearchValue;

      try {
        const videoData = await getMovieData(file, true);
        allVideoData.push(videoData);
      } catch (err) {
        throw err;
      }
    }

    // console.log("\n\n====================================================");
    // console.log("ALL VIDEO DATA\n", allVideoData, "\n");

    if (allVideoData.length > 0) {
      try {
        return await writeNewMovieData(allVideoData);
      } catch (err) {
        throw err;
      }
    }
    return { data: "No new files found in list of files..." };
  } catch (err) {
    throw err;
  }
}

/**
 * Attempt to retrieve movie data from external search API(s)
 * @param {string} title string to attempt retrieval of data from external API
 * @returns `MovieDataInterface` object to send to frontend or ready to write to main file
 */
export async function getMovieData(title) {
  const fTitle = normalizeFileName(title);
  console.log(`ATTEMPTING TO GET DATA WITH SEARCH TERM "${fTitle}"\n`);

  try {
    const translatedData = await getFromWikipedia(fTitle);
    let translatedValues = Object.values(translatedData.query.pages)[0];

    if (!translatedValues.original) {
      try {
        translatedValues = await getFromWikipedia(fTitle + " film");
        translatedValues = Object.values(translatedValues.query.pages)[0];
      } catch (err) {
        throw err;
      }
    }

    console.log("\n\n========================================================");
    console.log("DATA FROM WIKIPEDIA\n", translatedValues);

    const retData = {
      title: translatedValues.title,
      description: translatedValues.description,
      poster: {
        type: "external",
        url: translatedValues.original.source,
        width: translatedValues.original.width,
        height: translatedValues.original.height,
      },
      wikiID: translatedValues.pageid,
      matchedSearchTerms: [], // [fTitle, title],
      id: getUUID(),
    };

    retData.matchedSearchTerms.push(fTitle);
    retData.matchedSearchTerms.push(title);

    return retData;
  } catch (err) {
    throw err;
  }
}

/**
 * Adds a new `MovieDataInterface` instance to `movie_data.json` - Assumes **checking for uniqueness** has already been handled if desired!
 * @param {object[] | object} data The data to write to `movie_data.json` file.
 * @returns `SuccessObject` || `Error`
 */
export async function writeNewMovieData(data) {
  const movieFilePath = Constants.PathToMovieData;
  let movieFile = []; // Contents of "movie_data.json"

  try {
    movieFile = await readJSONFile(movieFilePath);

    if (movieFile.length > 0) {
      let wData = data;

      // console.log("\n\nwDATA:\n", wData, "\n");

      function checkForIDAndSet(obj) {
        if (!Object.keys(obj).some((d) => d == "id")) {
          obj.id = getUUID();
        }
        return obj;
      }

      // Check and set "id" for movie if not found in data
      if (Array.isArray(wData)) {
        wData = wData.map((wd) => {
          wd = checkForIDAndSet(wd);
          return wd;
        });
        wData.forEach((datum) => movieFile.push(datum));
      } else {
        wData = checkForIDAndSet(wData);
        movieFile.push(wData);
      }

      // console.log("\n\n====================================");
      // console.log(movieFile);
      // console.log("====================================\n\n");

      // Write data back to movie file
      try {
        const updatedMovieFile = await writeJSONFile(movieFilePath, movieFile);
        return updatedMovieFile;
      } catch (err) {
        throw err;
      }
    } else {
      throw new Error(
        "\n\nERROR: CANNOT FIND MOVIE FILE!...\nUNABLE TO WRITE TO movie_data.json!"
      );
    }
  } catch (err) {
    throw err;
  }
}

export function handleError(res, err, errMes = null, code = null) {
  const jsonError = {};
  const m =
    errMes || err.message || err.error || err.err || "AN ERROR HAS OCCURRED!";

  console.error(err);

  if (typeof err == "object" && err.code && err.syscall && err.path) {
    const { code, syscall, path } = err;

    jsonError.code = code;
    jsonError.syscall = syscall;
    jsonError.path = path;
  }

  code ? (jsonError.code = code) : null;

  jsonError.error = m;
  return res.status(400).send(jsonError);
}

function cleanPath(path) {
  return path
    .trim()
    .replace(/\\{1,}/g, "/")
    .replace(/\/+$/, "");
}

export function logRequest(req, res, next) {
  const reqURL = req.path;
  const method = req.method;
  const params = req.params;
  const data = {};

  switch (method) {
    case "POST":
      data.type = "BODY";
      data.data = req.body;
      break;
    case "GET":
      data.type = "QUERY";
      data.data = req.query;

      params ? ((data.type = "PARAMS"), (data.data = params)) : null;
      break;

    default:
      console.log(`middleware: 140:\nMethod: "${method}" not found in switch!`);
  }

  console.log("\n=====================================================");
  console.log(`NEW REQUEST TO: "${reqURL}"\n${data.type}:`, data.data);
  next();
}

function nameValueObj(obj = Object, typeVal = String) {
  const returnList = [];

  for (let k of Object.keys(obj)) {
    const tempObj = { name: k, value: obj[k] };

    if (typeVal) tempObj.type = typeVal;

    returnList.push(tempObj);
  }
  return returnList;
}
