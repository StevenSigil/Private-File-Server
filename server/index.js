const express = require("express");
const path = require("path");
const fs = require("fs");

const pyRunner = require("./util/runPy");
const { getDirectoryContent, logRequest } = require("./util/middleware");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "/../dist/frontend")));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.route("/").get((req, res) => {
  res.sendFile("index.html");
});

app
  .route("/api/directory2")
  .get(logRequest, getDirectoryContent, (req, res) => {
    if (res.directory_content && !res.directory_content.errno) {
      res.json(res.directory_content);
    } else {
      const { code, syscall, path } = res.directory_content;
      const jsonError = {
        error: `ERROR RETRIEVING DIRECTORY!\tSee terminal for details.`,
        code,
        syscall,
        path,
      };
      res.status(400).send(jsonError);
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

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

// ======================================================================================
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
