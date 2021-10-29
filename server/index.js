const express = require("express");
const { spawn } = require("child_process");

const app = express();
const port = 3000;

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

app.get("/api/directory", (req, res) => {
  console.log("request to: directory");

  const query = req.query ? req.query.path : undefined;

  if (query) {
    console.log(query);

    var dataToSend;
    const python = spawn("python", ["../../main.py", query]);

    python.stdout.on("data", function (data) {
      dataToSend = JSON.parse(data);
      console.log(dataToSend);
    });

    python.on("close", (code, signal) => {
      console.log(`child process closed with code ${code}`);
      console.log(`signal: ${signal}`);
      res.send(dataToSend);
    });
    return;
  }

  res.json([{ message: "Invalid query parameters." }]);
});

app.post("/api/directory", (req, res) => {
  // expecting {body: {data: {path: String}}}
  const reqPath = req.body.data.path;
  console.log(reqPath);

  var dataToSend;
  // spawn new child process to call the python script
  const python = spawn("python", ["../../main.py", reqPath]);

  // collect data from script
  python.stdout.on("data", function (data) {
    console.log("Pipe data from python script ...");
    dataToSend = data.toString();
  });

  // in close event we are sure that stream from child process is closed
  python.on("close", (code) => {
    console.log(`child process close all stdio with code ${code}`);
    res.send(dataToSend);
  });
});

// app.use(express.static("../dist/frontend"));
// app.get("/", (req, res) => {
//   res.sendFile("index.html", { root: __dirname });
// });

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
