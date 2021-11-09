import { readFile, writeFile } from 'fs/promises';
import Constants from '../constants.js';
import { normalizeFileName } from './util.js';

export async function readJSONFile(path, returnJson = true, encoding = 'utf8') {
  try {
    let contents = await readFile(path, encoding);
    contents = returnJson ? JSON.parse(contents) : contents;

    return contents;
  } catch (err) {
    // console.error(err);
    throw Error(err);
  }
}

export async function writeJSONFile(path, writeData, encoding = 'utf8') {
  if (typeof writeData !== 'string') {
    writeData = JSON.stringify(writeData, null, 2);
  }

  try {
    await writeFile(path, writeData, encoding);

    return {
      data: `Successfully wrote data to ${path}`,
      code: 'SUCCESS',
      path: path,
    };
  } catch (err) {
    // console.error(err);
    throw Error(err);
  }
}

export function searchArrayOfObjects(
  value,
  prop,
  array = [],
  exactVal = false,
  throwErr = true
) {
  // Returns the found objects from the *array* matching *value* to *prop*
  const foundObjs = [];

  if (exactVal) {
    array.filter((obj) => {
      if (obj[prop] === value) {
        foundObjs.push(obj);
      }
    });
  } else {
    // console.log('====================================');
    // console.log('\n\n\nHERE');

    array.forEach((obj) => {
      const propVal = obj[prop].replace(/[^\w]/gi, '');

      // console.log(obj);
      // console.log(prop);
      // console.log(propVal);
      // console.log(value);

      // const rCheck = new RegExp(`${value}`, 'gi');

      if (RegExp(`${value}`, 'gi').test(propVal)) {
        // console.log('CHECK:\t', RegExp(`${value}`, 'gi').test(propVal));
        foundObjs.push(obj);
      }
    });
  }

  // console.log('\nFOUND OBJS:\n', foundObjs);
  // console.log('\n\n\n====================================');

  // Throw error as Error or return error as Data
  if (foundObjs.length < 1) {
    const e = new Error(
      `Could not find a matching object given property: "${prop}" and value: "${value}"`
    );
    if (throwErr) {
      throw e;
    } else {
      return { error: e.message };
    }
  } else {
    return foundObjs;
  }
}

/**
 *
 * @param {String} property MUST be one of ['id', 'title', 'description', wikiID]
 * @param {String} matchValue Value to match with "property"
 * @returns Array of matching, JSON formatted entries
 */
export async function lookupMovieByProperty(
  property,
  matchValue,
  multiple = false
) {
  const movieFilePath = Constants.PathToMovieData;
  let movieFile = {};

  try {
    movieFile = await readJSONFile(movieFilePath);
  } catch (err) {
    throw err;
  }
  const movieData = movieFile.movie_data;
  let foundData = [];

  if (multiple && Array.isArray(matchValue)) {
    matchValue.forEach((value) => {
      const val = normalizeFileName(value);
      const matchedMovies = [];
      const splitValue = val.split(' ');

      splitValue.forEach((v) => {
        v = v.replace(/[^\w]/gi, '');

        const searchResults = searchArrayOfObjects(
          v,
          property,
          movieData,
          false,
          false
        );

        if (!searchResults.error) {
          searchResults.forEach((r) => {
            r.matchScore = 1;
            var index = matchedMovies.findIndex((x) => x.title === r.title);
            // console.log('INDEX: ', index);

            index === -1
              ? matchedMovies.push(r)
              : (matchedMovies[index].matchScore += 1);
          });
        }
        // console.log('SEARCHING: ', v, '\tFROM: ', val);
        // console.log('MATCHES:\n', matchedMovies, '\n\n');
      });

      // Return the object with highest matching score
      if (matchedMovies.length > 0) {
        const maxScoredMovie = matchedMovies.reduce((prev, current) => {
          return prev.matchScore > current.matchScore ? prev : current;
        });
        // console.log(maxScoredMovie);
        foundData.push(maxScoredMovie);
      } else {
        const notFound = {};
        notFound.error = 'NOT FOUND';
        notFound.fileName = value;
        foundData.push(notFound);
      }
    });
  }

  return foundData;
}
