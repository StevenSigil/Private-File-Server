const express = require("express");
const path = require("path");
const fs = require("fs");

const pyRunner = require("./util/runPy");

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(express.static(path.join(__dirname, "/../dist/frontend")));
app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.route("/api/directory").get((req, res) => {
  console.log("\n====================================");
  console.log('NEW REQUEST TO: "/api/directory"', req.query);

  const query = req.query ? req.query.path : undefined;
  console.log(`QUERY: ${query}`);

  if (query) {
    pyRunner
      .runPy("main.py", query)
      .then((result) => {
        // console.log(result);
        res.send(result);
      })
      .catch((err) => {
        res.status(404).send(err);
      });
  }
});

var currViewingVideoPath = "";

app.route("/api/file-finder").get((req, res) => {
  console.log("\n====================================");
  console.log('NEW REQUEST TO: "/api/file-finder"', req.query);

  const defaultPath = "C:/USERS/Steve/Desktop/css_test/JOJO_Rabbit.mp4";
  var pathQuery = req.query.path || null;

  if (req.query && pathQuery) {
    currViewingVideoPath = pathQuery;
  }

  if (currViewingVideoPath !== "") {
    pathQuery = currViewingVideoPath;
  } else {
    pathQuery = defaultPath;
  }

  console.log("query: ", req.query.path || null);
  console.log("currViewingVideoPath: ", currViewingVideoPath);
  console.log("defaultPath: ", defaultPath);
  console.log("pathQuery: ", pathQuery);
  fs.stat(pathQuery, (err, stats) =>
    console.log("pathQuery SIZE: ", stats.size)
  );

  res.sendFile(pathQuery, (err) => {
    console.log("error: ", err);
  });
  // res.on("close", () => (currViewingVideoPath = ""));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

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
