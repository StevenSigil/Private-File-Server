const express = require("express");
const fs = require("fs");
const path = require("path");

const { promisify } = require("util");
const { pipeline } = require("stream");
const sampleVideo = "C:/Users/Steve/Desktop/css_test/Shaun of the Dead.mp4";
const fileInfo = promisify(fs.stat);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(
  express.static(__dirname.replace(/(\\|\/)\w+$/, "/") + "dist/frontend")
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  console.log(__dirname.replace(/(\\|\/)\w+$/, "") + "dist/frontend");
  res.sendFile("index.html");
});

app.get("/api/testing", async (req, res) => {
  try {
    console.log("\n====================================");
    console.log('NEW REQUEST TO: "/api/t"', req.query);

    const vFile =
      req.query.path !== undefined
        ? path.normalize(req.query.path)
        : path.normalize(sampleVideo);
    const videoSize = fs.statSync(vFile).size;
    const range = req.headers.range;

    console.log("vFile: ", vFile);

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

// app.route('/api/file-finder').get(async (req, res) => {
//   console.log('\n====================================');
//   console.log('NEW REQUEST TO: "/api/file-finder"', req.query);

//   const { size } = await fileInfo(sampleVideo);
//   const range = req.headers.range;

//   if (range) {
//     let [start, end] = range.replace(/bytes=/, '').split('-');
//     start = parseInt(start, 10);
//     end = end ? parseInt(end, 10) : size - 1;

//     if (!isNaN(start) && isNaN(end)) {
//       start = start;
//       end = size - 1;
//     }
//     if (isNaN(start) && !isNaN(end)) {
//       start = size - end;
//       end = size - 1;
//     }

//     if (start >= size || end >= size) {
//       res.writeHead(416, {
//         'Content-Range': `bytes */${size}`,
//       });
//       return res.end();
//     }

//     console.log(
//       'end',
//       end,
//       '\nstart:',
//       start,
//       '\nend-start+1:',
//       end - start + 1
//     );

//     res.writeHead(206, {
//       // "Content-Length": size,
//       'Content-Range': `bytes ${start}-${end}/${size}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': end - start + 1,
//       'Content-Type': 'video/mp4',
//     });

//     let readable = fs.createReadStream(sampleVideo, { start: start, end: end });
//     pipeline(readable, res, (err) => {
//       console.log(err);
//     });
//   } else {
//     res.writeHead(200, {
//       'Content-Length': size,
//       'Content-Type': 'video/mp4',
//     });

//     let readable = fs.createReadStream(sampleVideo);
//     pipeline(readable, res, (err) => {
//       console.log(err);
//     });
//   }
// });

app.listen(PORT, () => console.log(`listening @ http://localhost:${PORT}/`));
