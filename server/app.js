const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(
  express.static(__dirname.replace(/(\\|\/)\w+$/, "/") + "dist/frontend")
);

app.get("/", (req, res) => {
  console.log(__dirname.replace(/(\\|\/)\w+$/, "") + "dist/frontend");
  res.sendFile("index.html");
});
app.get("/t", (req, res) => {
  // fs.readFile(__dirname)
  // const curDir = __dirname;
  var newDir = path.join(
    // path.parse(curDir).root,
    "C:/USERS/Steve/Desktop/css_test/JOJO_Rabbit.mp4"
  );

  res.sendFile(newDir);

  // fs.readdir(newDir, (err, files) => {
  //   if (err) {
  //     res.send(`<h1>${err}</h1>`);
  //   }

  //   var fileList = '';
  //   files.forEach((file) => (fileList += `<h1>${file}</h1>`));
  //   console.log('files: ', fileList);
  //   res.send(fileList);
  // });
});

app.listen(PORT, () => console.log(`listening @ http://localhost:${PORT}/`));
