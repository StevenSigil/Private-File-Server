import express from "express";
import path from "path";
import fs from "fs";
// import fsPromises from "fs/promises";

import Constants from "./constants.js";
import { getUUID } from "./util/util.js";
import {
  checkUniqueSessionName,
  updateSessionsMaster,
} from "./util/pathHelpers.js";
import {
  createMovieFileData,
  getDirectoryContent,
  handleError,
  logRequest,
} from "./util/middleware.js";
import {
  readJSONFile,
  lookupMovieByProperty2,
  searchArrayOfObjects,
} from "./util/fileHelpers.js";

// import pyRunner from "./util/runPy.js";

const app = express();
const PORT = Constants.API_PORT;
const __dirname = path.resolve();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Range"
  );
  next();
});
app.use(express.static(path.join(__dirname, "/dist/frontend")));

// =========================================================================================
// ============================= SERVERS FRONTEND BUILD FOLDER =============================
app.get(!"/api/*", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "/dist/frontend") });
});
// =========================================================================================

app.route("/api/test").get((req, res) => {
  // const mime = {
  //   html: "text/html",
  //   txt: "txt/plain",
  //   css: "text/css",
  //   gif: "image/gif",
  //   jpg: "image/jpeg",
  //   png: "image/png",
  //   svg: "image/svg+xml",
  //   js: "application/javascript",
  // };
  // var type = "text/plain";
  // const file = req.query.path || null;
  // console.log(file, "\n");
  // type = file ? mime[path.extname(file).slice(1)] : "text/plain";
  // const s = file ? fs.createReadStream(file) : fs.createReadStream(app.route('/api/test'));
  // s.on("open", () => {
  //   res.set("Content-Type", type);
  //   s.pipe(res);
  // });
  // s.on('end', () => {
  //   s.close();
  // })
  // s.on("error", () => {
  //   res.set("Content-Type", "text/plain");
  //   res.status(404).end("Not Found!");
  // });
});

/** Retrieve data from movie_data.json with POST Body of filenames passed as array
 *  in object with key 'movieFiles'
 */
app.post("/api/movie-data", logRequest, async (req, res) => {
  // Expecting req.body to be {movieFiles: ['movieFileName', '...', 'movieFileName']}
  let data = req.body.movieFiles;
  if (!Array.isArray(data)) {
    data = [data];
  }

  // ATTEMPT TO MATCH ALL MOVIES FROM REQ BODY TO movie_data.json OBJ's
  try {
    const localMatchedData = await lookupMovieByProperty2("title", data, true);
    // console.log("\nlocalMatchedData\n", localMatchedData);
    res.send(localMatchedData);
  } catch (err) {
    handleError(res, err);
    return;
  }
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
    console.log("\nAttempting to create a new SESSION...\n");

    // Expecting req.body = {filename: fileName, type: fileType,}
    const sessionName = req.body.sessionName || req.body.session_name;
    const sessionType = req.body.type || "movies";

    const uuid = getUUID();
    const nowDate = new Date().toLocaleString();

    // Middleware already set directory, files, & folders data to res.directory_content
    let { directory, files, folders } = res.directory_content;

    // if directory ends with a colon, add slash to end for saving properly
    if (/\:$/.test(directory)) {
      directory = directory + "\\";
    }

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
      try {
        const mFD = await createMovieFileData(files);
        console.log(mFD.data);
      } catch (err) {
        handleError(res, err);
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
      console.log(writeMasterRes);

      console.log("Session created successfully!");
      res.json(data);
    } catch (err) {
      handleError(res, err);
      return;
    }
  });

app.route("/api/image/:imagePath").get(logRequest, (req, res) => {
  const iPath = req.params.imagePath;

  res.sendFile(path.join(iPath));
});

// ========================================================================================
// ==================================== VIDEO STREAMER ====================================
app.route("/api/video/:videoPath").get(logRequest, async (req, res, next) => {
  const vPath = req.params.videoPath;
  const range = req.headers.range;

  if (range) {
    const x = fs.statSync(path.join(vPath));
    const videoSize = x.size;
    const MBChunk = 10 ** 6;
    const start = range ? range.replace(/\D/g, "") : 0;
    const end = Math.min(start + MBChunk, videoSize - 1);
    const contentLength = end - start + 1;

    const stream = new fs.createReadStream(vPath, {
      start: eval(start),
      end: eval(end),
      autoClose: true,
      emitClose: true,
    });

    res.set("Content-Range", `bytes ${start}-${end}/${videoSize}`);
    res.set("Accept-Ranges", "bytes");
    res.set("Content-Length", contentLength);
    res.set("Content-Type", `video/${path.extname(vPath)}`);
    res.set("Cache-Control", "no-store");
    res.status(206);

    // console.log(x, "\n");

    stream.pipe(res);

    res.on("close", () => {
      console.log("\x1b[36m%s\x1b[0m", "CLOSED!");
      return res.destroy();
    });
  } else {
    res.send();
  }
});
// ========================================================================================
// ========================================================================================

// app.route("/api/directory").get(logRequest, (req, res) => {
//   const query = req.query ? req.query.path : undefined;
//   console.log(`QUERY: ${query}`);

//   if (query) {
//     pyRunner
//       .runPy("main.py", query)
//       .then((result) => {
//         res.send(result);
//       })
//       .catch((err) => {
//         res.status(404).send(err);
//       });
//   }
// });

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
