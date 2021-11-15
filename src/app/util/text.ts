export function normalizeFromCamel(str: string) {
  const ret = str
    .replace(/([A-Z]+(?=[A-Z])|[A-Z](?=[a-z]))/g, ' $1')
    .replace(/^\w/, (l) => l.toUpperCase());
  return ret;
}

export function normalizeFileName(str: string) {
  // Will convert "JOJO_Rabbit.mp4" to "Jojo Rabbit"

  const rExtension = new RegExp(/\.\w+$/g);
  let ret = str.toString();
  if (rExtension.test(ret)) ret = ret.substr(0, ret.search(rExtension)); // remove file extension

  ret = ret
    .replace(/\B[A-Z](?=[a-z])/g, (l) => ' ' + l.toLowerCase()) // Replace camel case for lowercase + space before
    .replace(/([^(\w|\d|\s|\'|\,)])/g, ' ') //                     Replace special (char + space || special char) with space - except ' or ,
    .replace(/(\'|\,|\_)/g, '') //                                 Replace ' or , or _ with none
    .replace(/(\B[A-Z])/g, (l) => l.toLowerCase()) //              Lowercase letters after word start
    .replace(/^\w/g, (l) => l.toUpperCase()) //                    Capitalize first letter in string
    .trim();

  if (/\b(\s|)the$/gi.test(ret)) {
    ret = 'The ' + ret.replace(/\b(\s|)the$/gi, '');
  }

  return ret;
}
