const path = require('path');
const fs = require('fs');
const util = require('util');
const { throwError } = require('rxjs');

const readDir = util.promisify(fs.readdir);
const lStat = util.promisify(fs.lstat);

/**
 * @description Middleware function to get directory from a given path provided in request query "path" params
 *
 * @returns {Response}  Response.locals.filenames: string[]
 */
async function getDirectoryContent(req, res, next) {
  var query = req.query && req.query.path ? req.query.path : 'C:/Users';
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
      }
    }
    console.error(`\nmiddleware: 38\nERROR: CANNOT READ DIRECTORY: ${query}`);
    console.error(err);
    return throwError(err);
  } finally {
    const files = [];
    const folders = [];
    const fileTypes = {};
    const errFiles = [];
    const ret = {};

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
        //
      } catch (err) {
        if (/^(EBUSY|EPERM|NOT ADD)/g.test(err.message)) {
          console.error('middleware: 68:\n', err.message);
          errFiles.push(err.path);
          //
        } else console.log('\n\nSomething unexpected happened!!\n\n');
      }
    }

    // } finally {
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

    next();
    // }
  }
}

function cleanPath(path) {
  return path
    .trim()
    .replace(/\\{1,}/g, '/')
    .replace(/\/+$/, '');
}

function logRequest(req, res, next) {
  const reqPath = req.path;

  console.log('\n====================================');
  console.log(`NEW REQUEST TO: "${reqPath}"\nPARAMS:`, req.query);
  next();
}

function nameValueObj(d = Object, t = String) {
  returnList = [];

  for (let k of Object.keys(d)) {
    tempObj = { name: k, value: d[k] };

    if (t) tempObj.type = t;

    returnList.push(tempObj);
  }
  return returnList;
}

module.exports.getDirectoryContent = getDirectoryContent;
module.exports.logRequest = logRequest;
