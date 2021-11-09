import path from 'path';
import fs from 'fs';
import util from 'util';
import { throwError } from 'rxjs';
import axios from 'axios';

import { readJSONFile, writeJSONFile } from './fileHelpers.js';

import { getUUID, normalizeFileName } from './util.js';
import Constants from '../constants.js';

const readDir = util.promisify(fs.readdir);
const lStat = util.promisify(fs.lstat);
const __dirname = path.resolve();

/**
 * @description Middleware function to get directory from a given path provided in request query "path" params
 *
 * @returns {Response}  Response.directory_content: string[]
 */
export async function getDirectoryContent(req, res, next) {
  const method = req.method;
  var query = null;

  switch (method) {
    case 'POST':
      query = typeof req.body == 'object' ? req.body.path : req.body;
      break;

    case 'GET':
      query = typeof req.query == 'object' ? req.query.path : req.query;
      break;
  }
  query = query != null ? query : 'C:/Users';

  var dirContent;

  try {
    dirContent = await readDir(path.resolve(query + '/'));
    // console.log(dirContent, query, '\n', path.join(query));
  } catch (err) {
    if (err.code === 'EPERM') {
      console.log(`\nmiddleware: 23:\nSYSCALL: "${err.syscall}" NOT PERMITTED`);
      console.log('Attempting to open from link...');

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

              if (ext !== '') {
                fileTypes[ext] = fileTypes[ext] + 1 || 1;
              }
            } else folders.push(name);
          } catch (err) {
            if (/^(EBUSY|EPERM|NOT ADD)/g.test(err.message)) {
              console.error('middleware: 68:\n', err.message);
              errFiles.push(err.path);
            } else return throwError('\n\nSomething unexpected happened!!\n\n');
          }
        }

        ret.directory = query;
        ret.files = files;
        ret.folders = folders;
        ret.stats = {
          counts: [
            { name: 'files', value: files.length, type: 'base' },
            { name: 'folders', value: folders.length, type: 'base' },
            { name: 'errPaths', value: errFiles.length, type: 'errors' },
          ],
          fileTypes: nameValueObj(fileTypes, 'file_type'),
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

export async function getMovieData(title) {
  // https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cdescription&titles=shaun%20of%20the%20dead&redirects=1&piprop=thumbnail%7Cname%7Coriginal&pilicense=any

  try {
    const fTitle = normalizeFileName(title);

    const data = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        prop: 'pageimages|description',
        titles: fTitle,
        redirects: 1,
        piprop: 'thumbnail|name|original',
        pilicense: 'any',
      },
    });
    const rData = data.data;

    if (rData.warnings || rData.errors) {
      console.log(
        '\n\nPROBLEM FROM EXTERNAL API!!!\n',
        rData.errors || rData.warnings,
        '\n'
      );
    }

    const d = Object.values(rData.query.pages)[0];
    const retData = {
      title: d.title,
      description: d.description,
      poster: {
        type: 'external',
        url: d.original.source,
        width: d.original.width,
        height: d.original.height,
      },
      wikiID: d.pageid,
    };

    return retData;
  } catch (err) {
    throw err;
  }
}

export async function writeNewMovieData(data) {
  const movieFilePath = Constants.PathToMovieData;

  // Get contents of "movie_data.json"
  let movieFile = {};
  try {
    movieFile = await readJSONFile(movieFilePath);
  } catch (err) {
    throw err;
  }

  if (movieFile && movieFile.movie_data) {
    const wData = data;

    // Check and set "id" for movie if not found in data
    if (!Object.keys(wData).some((d) => d == 'id')) {
      wData.id = getUUID();
    }

    movieFile.movie_data.push(wData);

    // Re-Write data to movie file
    try {
      const updatedMovieFile = await writeJSONFile(movieFilePath, movieFile);
      return updatedMovieFile;
    } catch (err) {
      throw err;
    }
  } else {
    throw new Error(
      '\n\nERROR: CANNOT FIND movie_data OBJECT IN movieFile!\nUNABLE TO WRITE TO movie_data.json!'
    );
  }
}

// =====================================

// =====================================

// =====================================
// =====================================
// =====================================
// =====================================
// =====================================
// =====================================

export function handleError(res, err, errMes = null, code = null) {
  const jsonError = {};
  const m =
    errMes || err.message || err.error || err.err || 'AN ERROR HAS OCCURRED!';

  console.error(err);

  if (typeof err == 'object' && err.code && err.syscall && err.path) {
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
    .replace(/\\{1,}/g, '/')
    .replace(/\/+$/, '');
}

export function logRequest(req, res, next) {
  const reqURL = req.path;
  const method = req.method;
  const data = {};

  switch (method) {
    case 'POST':
      data.type = 'BODY';
      data.data = req.body;
      break;
    case 'GET':
      data.type = 'QUERY';
      data.data = req.query;
      break;

    default:
      console.log(`middleware: 140:\nMethod: "${method}" not found in switch!`);
  }

  console.log('\n=====================================================');
  console.log(`NEW REQUEST TO: "${reqURL}"\n${data.type}:`, data.data);
  next();
}

function nameValueObj(d = Object, t = String) {
  const returnList = [];

  for (let k of Object.keys(d)) {
    const tempObj = { name: k, value: d[k] };

    if (t) tempObj.type = t;

    returnList.push(tempObj);
  }
  return returnList;
}
