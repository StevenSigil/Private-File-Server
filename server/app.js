const express = require("express");
// const path = require("path");
const PORT = 8080;
const app = express();

let runPy = new Promise(function (success, noSuccess) {
  const { spawn } = require("child_process");
  const pProg = spawn("python", ["./../../main.py"]);

  pProg.stdout.on("data"),
    (data) => {
      success(data);
    };
  pProg.stderr.on("data", (data) => {
    noSuccess(data);
  });
});

app.use(express.static("../dist/frontend"));
// app.set('view engin', 'pug');

// app.get("/", (req, res) => {
//   res.sendFile("index.html", { root: __dirname });
// });

app.get("/t", (req, res) => {
  const { spawn } = require("child_process");
  const pyProg = spawn("python", ["../mainModule.py"]);

  res.send(
    new Promise((resolve, reject) => {
      pyProg.stdout.on("data", (data) => {
        console.log(data.toString());
        resolve(data.toString());
      });
      pyProg.stderr.on("data", reject);
    })
  );
});

// app.get("/t", (req, res) => {
//   res.write("welcome\n");

//   runPy
//     .then(function (fromRunpy) {
//       console.log(fromRunpy.toString());
//       res.send(fromRunpy);
//     })
//     .catch((err) => {
//       throw {err};
//     });
// });

app.listen(80, () => {
  console.log(`listening @ http://localhost:${PORT}`);
});
