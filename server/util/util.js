import { v4 as uuidv4 } from "uuid";

export function getUUID() {
  return uuidv4();
}

export function normalizeFileName(str = String) {
  // Will convert "JOJO_Rabbit.mp4" to "Jojo Rabbit"

  const rExtension = new RegExp(/\.\w+$/g);
  let ret = str.toString();
  if (rExtension.test(ret)) ret = ret.substr(0, ret.search(rExtension)); // remove file extension

  ret = ret
    .replace(/\B[A-Z](?=[a-z])/g, (l) => " " + l.toLowerCase()) // Replace camel case for lowercase + space before
    .replace(/([^(\w|\d|\s|\'|\,)])/g, " ") //                     Replace special (char + space || special char) with space - except ' or ,
    .replace(/(\'|\,)/g, "") //                                    Replace ' or , with none
    .replace(/(\B[A-Z])/g, (l) => l.toLowerCase()) //              Lowercase letters after word start
    .replace(/^\w/g, (l) => l.toUpperCase()) //                   Capitalize first letter in string
    .trim();

  if (/\b(\s|)the$/gi.test(ret)) {
    ret = "The " + ret.replace(/\b(\s|)the$/gi, "");
  }

  return ret;
}

export function checkForVideoFiles(files = []) {
  const videoFormats = [
    "WEBM",
    ".MPG",
    ".MP2",
    ".MPEG",
    ".MPE",
    ".MPV",
    ".OGG",
    ".MP4",
    ".M4P",
    ".M4V",
    ".AVI",
    ".WMV",
    ".MOV",
    ".QT",
    ".FLV",
    ".SWF",
    "AVCHD",
  ];

  const videoFiles = [];
  files.forEach((file) => {
    // Get file extension
    let ext = "";
    const m = file.match(/\.(\w|\d)+$/gi);
    if (m) {
      // match extension to list of video formats & if matched, return filename
      ext = m[0];
      if (videoFormats.some((f) => f.toUpperCase() == ext.toUpperCase())) {
        videoFiles.push(file);
        return;
      }
    } else return;
  });

  return videoFiles;
}
