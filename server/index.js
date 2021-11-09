import express from "express";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import Constants from "./constants.js";

import pyRunner from "./util/runPy.js";
import {
  getMovieData,
  getDirectoryContent,
  handleError,
  logRequest,
  writeNewMovieData,
} from "./util/middleware.js";
import {
  checkPathExists,
  checkUniqueSessionName,
  updateSessionsMaster,
} from "./util/pathHelpers.js";
import {
  readJSONFile,
  lookupMovieByProperty,
  writeJSONFile,
  searchArrayOfObjects,
} from "./util/fileHelpers.js";
import { checkForVideoFiles, getUUID } from "./util/util.js";
import { throwError } from "rxjs";

// API to search for page and get main image and description of page
//    https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cdescription&titles=shaun%20of%20the%20dead&redirects=1&pilimit=750&pilicense=any
//      prop: cirrusbuilddoc.opening_text USE FOR DESCRIPTIONS?

const app = express();
const PORT = Constants.API_PORT;
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "/dist/frontend")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/movie-data", logRequest, async (req, res) => {
  // Expecting req.body to be {movieFiles: ['movieFileName', '...', 'movieFileName']}
  const data = req.body.movieFiles;

  // ATTEMPT TO MATCH ALL MOVIES FROM REQ BODY TO movie_data.json OBJ's
  try {
    const localMatchedData = await lookupMovieByProperty("title", data, true);
    // console.log("\nlocalMatchedData\n", localMatchedData);
    res.send(localMatchedData);
  } catch (err) {
    handleError(res, err);
    return;
  }
});

app.route("/api/test").get((req, res) => {
  const testFile =
    "C:/Users/Steve/Desktop/PythonDirectoryTest/frontend/server/data/sessions/test.json";

  readJSONFile(testFile)
    .then((d) => {
      console.log("\n\nCONTENTS OF FILE:", d);
      d ? res.json({ data: d }) : res.json({ error: "NO DATA" });
    })
    .catch((err) => {
      handleError(res, err);
    });
});

app.route("/").get((req, res) => {
  res.sendFile("/index.html");
});

app.route("/api/session-data").get(logRequest, async (req, res) => {
  // Expecting: req.query = { sessionName: 'wxYz' }
  try {
    if (req.query && req.query.sessionName) {
      let sessName = req.query.sessionName;

      // if (!/.json$/.test(sessName)) {
      //   sessName = sessName + ".json";
      // }

      const sessionsPath = Constants.PathToSessionsMaster;
      const data = await readJSONFile(sessionsPath);

      // Get session obj. from list of all sessions -> names should be unique so use idx0
      const foundSession = searchArrayOfObjects(
        sessName,
        "sessionName",
        data,
        true
      )[0];
      // console.log("\n\n FOUND SESSIONS", foundSession);

      if (foundSession) {
        return res.json(foundSession);
      }

      // TODO: make sure session names are unique when saving

      return res.json(data);
    } else {
      throw new Error("Invalid query parameters for this endpoint...");
    }
  } catch (err) {
    handleError(res, err);
  }
});

app.route("/api/all-sessions-data").get(logRequest, async (req, res) => {
  try {
    const data = await readJSONFile(Constants.PathToSessionsMaster);

    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

app
  .route("/api/directory2")
  .get(logRequest, getDirectoryContent, (req, res) => {
    if (res.directory_content && !res.directory_content.errno) {
      res.json(res.directory_content);
    } else {
      handleError(res, res.directory_content);
    }
  });

app
  .route("/api/new-session")
  .post(logRequest, getDirectoryContent, async (req, res) => {
    console.log("Attempting to create a new SESSION...");

    // Expecting req.body = {filename: fileName, type: fileType,}
    const sessionName = req.body.sessionName || req.body.session_name;
    const sessionType = req.body.type || "movies";

    const uuid = getUUID();
    const nowDate = new Date().toLocaleString();

    // Middleware already set directory, files, & folders data to res.directory_content
    const { directory, files, folders } = res.directory_content;

    const data = {
      id: uuid,
      sessionName: sessionName,
      created: nowDate,
      updated: nowDate,
      type: sessionType,
      directoryPath: path.join(directory),
      directoryContent: {
        files,
        folders,
      },
    };

    // Attempt to get information from external API for movie files not in local File
    if (/movie/gi.test(sessionType)) {
      const videoFiles = checkForVideoFiles(files);

      // ========================================================================
      // ================================= TODO =================================
      // TODO: if (videoFiles.length < 1) ADD ALERT TO RESPONSE SAYING NOT FOUND!

      // Check if each movie is already stored in movie_data.json
      try {
        const localMatchMovies = await lookupMovieByProperty(
          "title",
          videoFiles,
          true
        );

        // Separate the not found videoFiles
        const notFound = localMatchMovies.filter((obj) => obj.error);

        // Attempt to get data for each fileNotFound & write to movie_data.json
        notFound.forEach(async (nf) => {
          const extData = await getMovieData(nf.fileName);
          await writeNewMovieData(extData);

          var counter = 0;
          setTimeout(() => {
            counter += 1;
          }, 1000);
        });
      } catch (err) {
        handleError();
        return;
      }
    }

    try {
      // Check to make sure sessionName is unique!
      const nameIsUnique = await checkUniqueSessionName(sessionName); // Boolean

      if (!nameIsUnique) {
        throw Error("Session name is not unique!");
      }
    } catch (err) {
      handleError(res, err, null, "EXISTS");
      return;
    }

    try {
      // Name is unique => continue to write data to MASTER sessions file
      const writeMasterRes = await updateSessionsMaster(data);

      res.json(writeMasterRes);
      console.log("Session created successfully!");
    } catch (err) {
      handleError(res, err);
      return;
    }

    // ========================================================================
    // ================================= TODO =================================
    // if (/movie/gi.test(sessionType)) {
    //   try {
    //     // FOR EACH MOVIE => CHECK IF MOVIE IS IN movie_data.json AND IF NOT => GETmOVIEdATA (WRITE to movie_data.json)
    //     // THEN ADD MOVIE UUID'S TO SESSION INFO (FRONTEND WILL RETRIEVE movie_data.json DATA TO DISPLAY)!!!!!
    //     const movieData = await getMovieData('shaun of the dead.mp4');
    //   } catch (err) {
    //     let m = ('ERROR RETRIEVING MOVIE DATA!\n', err);
    //     console.log(m);
    //     handleError(res, err, m);
    //   }
    // }
    // ========================================================================
    // ========================================================================
  });

var currViewingVideoPath = "";
const sampleVideo = "C:/Users/Steve/Desktop/css_test/Shaun of the Dead.mp4";

app.route("/api/video").get(async (req, res) => {
  try {
    console.log("\n====================================");
    console.log('NEW REQUEST TO: "/api/t"', req.query);

    const vFile =
      req.query.path !== undefined
        ? path.normalize(req.query.path)
        : path.normalize(sampleVideo);
    const videoSize = fs.statSync(vFile).size;
    const range = req.headers.range;

    console.log("vFile: ", vFile); // DELETE ME

    if (range) {
      console.log("RANGE FOUND IN HEADER");
      const rangeStringParts = range.replace(/bytes=/, "").split("-");
      const bStart = parseInt(rangeStringParts[0]);
      const bEnd = rangeStringParts[1]
        ? parseInt(rangeStringParts[1])
        : videoSize - 1;

      const CHUNK_SIZE = bEnd - bStart + 1; //1MB

      const vStream = fs.createReadStream(vFile, {
        start: bStart,
        end: bEnd,
      });

      const headers = {
        "Content-Range": `bytes ${bStart}-${bEnd}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": CHUNK_SIZE,
        "Content-Type": "video/mp4",
      };

      res.writeHead(206, headers);
      vStream.pipe(res);
      return;
    }

    const headers = {
      "Content-Length": videoSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, headers);
    fs.createReadStream(vFile).pipe(res);
  } catch (err) {
    console.log("AN ERROR OCCURRED IN TRY/CATCH BLOCK...\n", err);
    res.status(400).send(err);
  }
});

app.route("/api/directory").get(logRequest, (req, res) => {
  const query = req.query ? req.query.path : undefined;
  console.log(`QUERY: ${query}`);

  if (query) {
    pyRunner
      .runPy("main.py", query)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(404).send(err);
      });
  }
});

app.listen(PORT, () =>
  console.log(`SERVER STARTED...\nListening: http://localhost:${PORT}`)
);

// ========================================================================
// ============================== DEPRECATED ==============================
// app
//   .route("/api/create-session-file")
//   .post(logRequest, getDirectoryContent, async (req, res) => {
//     console.log("Attempting to create a new SESSION...");

//     // Expecting req.body = {path: directory, filename: fileName, type: fileType,}
//     const body = req.body;
//     const sessionName = body.sessionName || body.session_name;
//     const type = body.type || "movies";
//     // const sessionDestination = path.join(
//     //   Constants.PathToSessions,
//     //   sessionName + '.json'
//     // );
//     // try {
//     //   // Check if file is already in data folder...
//     //   const fileExists = await checkPathExists(sessionDestination, null, true);
//     //   if (fileExists.exists)
//     //     throw new Error(`File already found at ${sessionDestination}`);
//     // } catch (e) {
//     //   // Reject response and exit if file is found
//     //   handleError(res, e, null, 'EXISTS');
//     //   return;
//     // }
//     const uuid = getUUID();
//     const nowDate = new Date().toLocaleString();
//     // Middleware already set directory, files, & folders data to res.directory_content
//     const { directory, files, folders } = res.directory_content;
//     const data = {
//       id: uuid,
//       sessionName: sessionName,
//       created: nowDate,
//       updated: nowDate,
//       type: type,
//       // sessionPath: sessionDestination,
//       directoryPath: path.join(directory),
//       directoryContent: {
//         files,
//         folders,
//       },
//     };
//     try {
//       // Write file in data folder
//       // const writeResponse = await writeJSONFile(sessionDestination, data);
//       // if (writeResponse) {
//       const writeMasterRes = await updateSessionsMaster(data);
//       // console.log("updateSessionsMaster was successful!");
//       const finalResponse = {
//         // session: writeResponse,
//         master: writeMasterRes,
//       };
//       res.json(finalResponse);
//       console.log("Session created successfully!");
//       // } else {
//       //   throw new Error(writeResponse);
//       // }
//     } catch (err) {
//       handleError(res, err);
//       return;
//     }
//   });

// =======================================================================================================
// =======================================================================================================
// app.get("/api/directory", async (req, res) => {
//   console.log("\n====================================");
//   console.log('NEW REQUEST TO: "/api/t"');
//   const query = req.query ? req.query.path : undefined;
//   console.log(`QUERY: ${query}\n`);

//   if (query) {
//     const result = await pyRunner.runPy("main.py", query);
//     res.send(result);
//   }
// });

// app.get("/api/directory", (req, res) => {
//   console.log("request to: directory");

//   const query = req.query ? req.query.path : undefined;

//   if (query) {
//     console.log(query);

//     var dataToSend;
//     const python = spawn("python", ["../main.py", query]);

//     python.stdout.on("data", function (data) {
//       dataToSend = JSON.parse(data);
//     });

//     python.stderr.on("data", (data) => {
//       dataToSend = data.toString();
//     });

//     python.stdout.on("end", (code, signal) => {
//       console.log("Sending Data:\n", __dirname, "\n");
//       res.send(dataToSend);
//     });

//     // python.on("close", (code, signal) => {
//     //   console.log(`child process closed with code ${code}`);
//     //   console.log(`signal: ${signal}`);
//     //   res.send(dataToSend);
//     // });
//     return;
//   }

//   res.json([{ message: "Invalid query parameters." }]);
// });

// app.post("/api/directory", (req, res) => {
//   // expecting {body: {data: {path: String}}}
//   const reqPath = req.body.data.path;
//   console.log(reqPath);

//   var dataToSend;
//   // spawn new child process to call the python script
//   const python = spawn("python", ["../../main.py", reqPath]);

//   // collect data from script
//   python.stdout.on("data", function (data) {
//     console.log("Pipe data from python script ...");
//     dataToSend = data.toString();
//   });

//   // in close event we are sure that stream from child process is closed
//   python.on("close", (code) => {
//     console.log(`child process close all stdio with code ${code}`);
//     res.send(dataToSend);
//   });
// });
