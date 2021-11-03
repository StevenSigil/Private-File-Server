const express = require("express");
const path = require("path");
const fs = require("fs");
const util = require("util");

const readDir = util.promisify(fs.readdir);
const lStat = util.promisify(fs.lstat);

const pyRunner = require("./util/runPy");
const { kill } = require("process");
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

app.route("/api/directory2").get(getDirectoryContent, (req, res) => {
  console.log("\n====================================");
  console.log('NEW REQUEST TO: "/api/directory2"', req.query);

  // console.log("directory_content:\t", res.directory_content);

  res.json(res.directory_content);
});

/**
 * @description Middleware function to get directory from a given path provided in request query "path" params
 *
 * @returns {Response}  Response.locals.filenames: string[]
 */
async function getDirectoryContent(req, res, next) {
  const query = req.query && req.query.path ? req.query.path : "C:/Users";

  try {
    const dirContent = await readDir(path.join(query));
    const files = [];
    const folders = [];
    const fileTypes = {};
    const ret = {};

    for (let name of dirContent) {
      const stats = await lStat(path.join(path.resolve(query), name));

      if (stats.isFile()) {
        files.push(name);

        const ext = path.extname(path.join(query, name));

        if (ext !== "") {
          fileTypes[ext] = fileTypes[ext] + 1 || 1;
        }
        //
      } else {
        folders.push(name);
      }
    }

    ret.directory = query;
    ret.files = files;
    ret.folders = folders;
    ret.stats = {
      counts: [
        { name: "files", value: files.length, type: "base" },
        {
          name: "folders",
          value: folders.length,
          type: "base",
        },
      ],
      fileTypes: nameValueObj(fileTypes, "file_type"),
    };

    res.directory_content = ret;
    next();
  } catch (err) {
    console.log(err);
  }
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

// function checkIfFile(fp) {
//   fs.lstat(fp, (err, stats) => {
//     if (err) return console.log(err);

//     const pathIsFile = stats.isFile();
//     console.log("Is file:\t", pathIsFile, fp);
//     return pathIsFile;
//   });
// }

app.route("/api/directory").get((req, res) => {
  console.log("\n====================================");
  console.log('NEW REQUEST TO: "/api/directory"', req.query);

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

app.route("/api/file-finder").get(async (req, res) => {
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
