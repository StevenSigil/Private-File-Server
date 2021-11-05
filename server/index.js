import express from "express";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import Constants from "./data/constants.js";

import pyRunner from "./util/runPy.js";
import {
  getDirectoryContent,
  handleError,
  logRequest,
} from "./util/middleware.js";
import { checkPathExists, updateSessionsMaster } from "./util/pathHelpers.js";
import { getJSONFile, writeJSONFile } from "./util/fileHelpers.js";
import { getUUID } from "./util/uuid.js";
import { throwError } from "rxjs";

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

app.route("/api/test").get((req, res) => {
  const testFile =
    "C:/Users/Steve/Desktop/PythonDirectoryTest/frontend/server/data/sessions/test.json";

  getJSONFile(testFile)
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

app
  .route("/api/directory2")
  .get(logRequest, getDirectoryContent, (req, res) => {
    if (res.directory_content && !res.directory_content.errno) {
      res.json(res.directory_content);
    } else {
      handleError(res, res.directory_content);
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

app
  .route("/api/create-session-file")
  .post(logRequest, getDirectoryContent, async (req, res) => {
    // Expecting req.body = {path: directory, filename: fileName}

    // =====================================================
    // ======================= TODO ========================
    //   TODO: Separate below into functions to simplify!
    // =====================================================
    // =====================================================

    console.log("Attempting to create a new SESSION...");

    const body = req.body;
    const fileName = body.fileName || body.filename;

    const sessionDestination = path.join(
      Constants.PathToSessions,
      fileName + ".json"
    );

    try {
      // Check if file is already in data folder...
      const fileExists = await checkPathExists(sessionDestination, null, true);
      // console.log("isExistingFile:\t", fileExists);

      if (fileExists.exists) {
        const e = new Error(`File already found at ${sessionDestination}`);
        throw e;
      }
    } catch (e) {
      // Reject response and exit if file is found
      handleError(res, e, null, "EXISTS");
      return;
    }

    const uuid = getUUID();
    const nowDate = new Date().toLocaleString();

    // Middleware already set directory, files, & folders data to res.directory_content
    const { directory, files, folders } = res.directory_content;

    const data = {
      uuid: uuid,
      sessionName: fileName,
      created: nowDate,
      updated: nowDate,
      sessionPath: sessionDestination,
      directoryInfo: {
        basePath: directory,
        files,
        folders,
      },
    };

    try {
      const writeData = data;

      // Write file in data folder
      const writeResponse = await writeJSONFile(sessionDestination, writeData);

      //
      if (writeResponse) {
        const writeMasterRes = await updateSessionsMaster(writeData);
        // console.log("updateSessionsMaster was successful!");
        const finalResponse = {
          session: writeResponse,
          master: writeMasterRes,
        };
        res.json(finalResponse);
        console.log("Session created successfully!");
      } else {
        throw new Error(writeResponse);
      }
    } catch (err) {
      handleError(res, err);
      return;
    }
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

app.listen(PORT, () =>
  console.log(`SERVER STARTED...\nListening: http://localhost:${PORT}`)
);

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
