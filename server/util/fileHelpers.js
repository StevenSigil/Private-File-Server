import { readFile, writeFile } from "fs/promises";
import Constants from "../constants.js";
import { cloneObject, normalizeFileName } from "./util.js";

export async function readJSONFile(path, returnJson = true, encoding = "utf8") {
  try {
    let contents = await readFile(path, encoding);
    contents = returnJson ? JSON.parse(contents) : contents;

    return contents;
  } catch (err) {
    // console.error(err);
    throw Error(err);
  }
}

export async function writeJSONFile(path, writeData, encoding = "utf8") {
  if ("string" !== typeof writeData) {
    writeData = JSON.stringify(writeData, null, 2);
  }

  try {
    await writeFile(path, writeData, encoding);

    return {
      data: `Successfully wrote data to ${path}`,
      code: "SUCCESS",
      path: path,
    };
  } catch (err) {
    console.error("\x1b[36m%s\x1b[0m", err);
    throw Error(err);
  }
}

/**
 * Returns the found objects from the *array* matching *value* to *prop*
 *
 * TRANSFORMS TO `value` SHOULD BE DONE BEFORE CALLING FUNCTION.
 * If `transformProp` is true, it will use the `normalizeFileName()` function to transform the value of `prop`
 */
export function searchArrayOfObjects(
  value,
  prop,
  array = [],
  exactVal = false,
  throwErr = true,
  transformProp = false
) {
  console.log(`(searchArrayOfObjects): Searching for\t\t${value}`);

  const foundObjs = [];

  if (exactVal) {
    for (const obj of array) {
      if (Array.isArray(obj[prop])) {
        // Value of property is an Array

        obj[prop].forEach((propVal) => {
          propVal = transformProp ? normalizeFileName(propVal) : propVal;

          // console.log("VAL", propVal == value);
          if (propVal == value) {
            foundObjs.push(obj);
            return;
          }
        });
      } else {
        // Value of property is NOT an Array

        let propVal = transformProp ? normalizeFileName(obj[prop]) : obj[prop];

        if (propVal == value) {
          foundObjs.push(obj);
          break;
        }
      }
    }

    //
  } else {
    array.forEach((obj) => {
      let propVal = obj[prop];

      if (typeof propVal == "string") {
        propVal = transformProp ? normalizeFileName(propVal) : propVal;

        if (RegExp(`${value}`, "gi").test(propVal)) {
          foundObjs.push(obj);
        }
        return;
      }

      // Value of property is an Array
      if (Array.isArray(propVal) || typeof propVal == "object") {
        const objArrVal = propVal;

        // console.log("\n\nV (92):", prop, objArrVal, "\n", obj);
        const foundValsInArr = objArrVal.filter((v) => {
          const formattedObjVal = transformProp ? normalizeFileName(v) : v;
          const formattedVal = value;

          const valueInPropertyVal = new RegExp(`${formattedVal}`, "gi").test(
            formattedObjVal
          );
          return valueInPropertyVal;

          // console.log("VALUE:\t",formattedVal,"FORMATTED:\t",formattedObjVal);
          // console.log("PROP VAL:\t", obj[prop]);
          // console.log("MATCHES:\t", valueInPropertyVal, "\n\n");
        });

        if (foundValsInArr.length > 0) {
          foundObjs.push(obj);
        }
        return;
      }
    });
  }

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
    // console.log("FOUNDOBJS\n", foundObjs);
    return foundObjs;
  }
}

// =========================================================================================
// =========================================================================================
// =========================================================================================

// Mostly used to attempt a match with a movie filename with title in DB
export async function lookupMovieByProperty2(
  property,
  valsToMatch,
  multiple = false
) {
  // ============================================== TODO =============================================
  // TODO: Make sure the frontend is displaying movies in sessionData even if they aren't return here!

  const movieFilePath = Constants.PathToMovieData;
  let movieData = {};

  try {
    const movieFileFunc = await readJSONFile(movieFilePath);
    movieData = cloneObject(movieFileFunc);
  } catch (err) {
    throw err;
  } finally {
    if (multiple && Array.isArray(valsToMatch)) {
      const finalMatches = [];

      for (const valToMatch of valsToMatch) {
        console.log("\nORIGINAL VALUE TO MATCH:\t", valToMatch);

        const tempObj = {};
        tempObj.originalSearchValue = valToMatch;

        // ========================= 1.
        // Try to find with original search term (ie: filename) in already matched terms
        const foundData0 = searchArrayOfObjects(
          valToMatch,
          "matchedSearchTerms",
          movieData,
          true,
          false,
          false
        );

        // Check if it was found then add to main-single object or continue
        if (Array.isArray(foundData0)) {
          const singleReturnMatch = {
            ...foundData0[0],
            ...tempObj,
          };

          finalMatches.push(singleReturnMatch);
          console.log("\nMATCHED FIRST TIME!\t", valToMatch, "\n");
          continue;
        }
        //

        // ========================= 2.
        // Try to find unknowns (from above) with cleaner value in already matched terms
        const cleanedVal = normalizeFileName(valToMatch);

        // Try to find 'matchValue' in known "matchedSearchTerms" on object
        const foundData1 = searchArrayOfObjects(
          cleanedVal,
          "matchedSearchTerms",
          movieData,
          false,
          false,
          true
        );

        // Separate found data from not-found
        if (Array.isArray(foundData1) && foundData1.length == 1) {
          const singleReturnMatch2 = {
            ...foundData1[0],
            ...tempObj,
          };
          finalMatches.push(singleReturnMatch2);
          console.log("\nMATCHED SECOND TIME!\t", valToMatch, "\n");
          continue;
          //
        }
        //

        // ========================= 3.
        // Use array of matches in found data to searchByScore with "property" vs. cleanedTerm
        if (Array.isArray(foundData1) && foundData1.length > 1) {
          const foundData2 = await searchWithScore(
            property,
            [cleanedVal],
            movieData,
            Constants.PathToMovieData
          );

          if (foundData2[0].probableMatch > 0.65) {
            const singleReturnMatch3 = {
              ...foundData2[0],
              ...tempObj,
            };

            finalMatches.push(singleReturnMatch3);
            console.log("\nMATCHED THIRD TIME (VIA SCORE)!\t", valToMatch);
            continue;
          }
        }
        //

        // ========================= 4.
        // Search term not found -> Use cleaned value to searchByScore with title vs. cleanedTerm
        const foundData3 = await searchWithScore(
          "title",
          [cleanedVal],
          movieData,
          Constants.PathToMovieData
        );

        if (Array.isArray(foundData3) && foundData3[0].probableMatch > 0.65) {
          const singleReturnMatch4 = {
            ...foundData3[0],
            ...tempObj,
          };

          finalMatches.push(singleReturnMatch4);
          console.log("\nMATCHED FOURTH TIME (VIA SCORE)!\t", "\n");
          continue;
        } else {
          // COULD NOT FIND! Return "tempObj" with original searchID and Err msg.
          tempObj.error = `Could not find movie from filename "${valToMatch}"`;
          finalMatches.push(tempObj);
          console.log(
            "COULD NOT MATCH WITH KNOWN FILES!\t",
            valToMatch,
            "\n",
            finalMatches,
            "\n"
          );
          continue;
        }
      }

      // console.log("\n\n==================================================");
      // console.log("finalMatches\n", finalMatches);
      // console.log("==================================================\n\n");

      return finalMatches;
    } else {
      // If matchValue is not in array, put in array and do again...
      const matchArr = [valsToMatch];
      return lookupMovieByProperty2(property, matchArr, true);
    }
  }
}

// =========================================================================================
// =========================================================================================

/**Returns the most likely matching object from an Array of Objects where `valueMatch == Object[property]`
 *
 * @param {string} property Key of key value pair in "searching for" object
 * @param {string[]} valueMatch Array of strings to match as Value in key value pair of "searching for" object
 * @param {object[]} array Array of Objects to search through
 * @param {sting | undefined} writeFilePath Path of original file to update with Key: `matchedSearchTerms`
 * @returns Array of objects matching `valueMatch` @ `property` in `array`
 */
async function searchWithScore(
  property,
  valueMatch,
  array,
  writeFilePath = null
) {
  if (!array) {
    throw new Error("ARRAY IS NOT DEFINED!");
  }
  if (!Array.isArray(valueMatch)) {
    valueMatch = [valueMatch];
  }

  let foundData = []; // Return array of matching movie data objects

  valueMatch.forEach((value) => {
    const wordArr = value.split(" ");

    // Break down string into words and search for each word @ property in "array"
    console.log(`\n------------>\tSEARCHING BY SCORE FOR:\t"${value}"`);

    const wordSearchResults = []; // list of matching results for the given value
    wordArr.forEach((word) => {
      const searchResults = searchArrayOfObjects(
        word,
        property,
        array,
        false,
        false,
        true
      );

      // If any results are found --> Assign score of likeliness of matching
      if (!searchResults.error) {
        searchResults.forEach((match) => {
          // Check if the matched word is already in 'wordSearchResults'
          const matchedIdx = wordSearchResults.findIndex(
            (x) => x.id === match.id
          );
          if (matchedIdx == -1) {
            match.matchScore = 1;
            wordSearchResults.push(match);
          } else {
            wordSearchResults[matchedIdx].matchScore += 1;
          }
        });
      }
    });

    // Highest amount of matching words between property and searched word of term
    const maxScoredObj = wordSearchResults.reduce((prev, curr) => {
      if (wordSearchResults.length > 1) {
        return prev.matchScore > curr.matchScore ? prev : curr;
      } else return wordSearchResults[0];
    }, {});

    if (maxScoredObj[property]) {
      // Assign probableMatch between searchingForWords and maxScoredObj.lengthOfWords
      // to returning data to display to user (0.0 - 1.0)
      const probableMatch =
        maxScoredObj.matchScore / maxScoredObj[property].split(" ").length;

      // Add original searching value ("value") to confirmed search terms property
      // if its exact enough match, then write new data to movie_data.json
      if (probableMatch > 0.85) {
        const objAtIdx = array.find((mov) => mov.id == maxScoredObj.id);

        // Check if search term is already in confirmed searches...
        if (
          objAtIdx.matchedSearchTerms &&
          objAtIdx.matchedSearchTerms.some((mov) => mov == value)
        ) {
          null;
        } else {
          // Otherwise add it to data before writing to file
          objAtIdx.matchedSearchTerms
            ? objAtIdx.matchedSearchTerms.push(value)
            : (objAtIdx.matchedSearchTerms = [value]);
        }
      }

      maxScoredObj.probableMatch = probableMatch;
    }

    // console.log(wordArr, "\t", value, "\t", property, "\n", probableMatch);

    // Push data to "foundData"
    foundData.push(maxScoredObj);
  });

  if (writeFilePath) {
    // Remove "matchScore" & "probableMatch" key/value from array
    // before writing back to file
    const writeData = [];
    array.forEach((entry) => {
      entry = Object.keys(entry)
        .filter((k) => k != "matchScore")
        .filter((k) => k != "probableMatch")
        .reduce((obj, key) => {
          obj[key] = entry[key];
          return obj;
        }, {});
      writeData.push(entry);
    });

    // Write
    try {
      await writeJSONFile(writeFilePath, writeData);
    } catch (err) {
      throw err;
    } finally {
      return foundData;
    }

    // try {
    //   await writeJSONFile(writeFilePath, writeData);
    // } catch (err) {
    //   throw err;
    // }
  } else {
    // Return array of matching movie_data objects
    return foundData;
  }
}

// =========================================================================================
// =========================================================================================
// =========================================================================================

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
      const splitValue = val.split(" ");

      splitValue.forEach((v) => {
        v = v.replace(/[^\w]/gi, "");

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
        maxScoredMovie.fileName = value;
        // console.log(maxScoredMovie);
        foundData.push(maxScoredMovie);
      } else {
        const notFound = {};
        notFound.error = "NOT FOUND";
        notFound.fileName = value;
        foundData.push(notFound);
      }
    });
  } else {
    // If matchValue is not in array, put in array and do again...
    const matchArr = [matchValue];
    return lookupMovieByProperty(property, matchArr, true);
  }

  return foundData;
}
