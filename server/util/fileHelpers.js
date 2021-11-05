import { readFile, writeFile } from 'fs/promises';

export async function getJSONFile(path) {
  try {
    // const controller = new AbortController();
    // const { signal } = controller;
    // // Abort the request before the promise settles.
    // controller.abort();

    let contents = await readFile(path, { encoding: 'utf8' }); //, signal });
    contents = contents ? JSON.parse(contents) : {};
    return contents;
  } catch (err) {
    // console.error(err);
    throw Error(err);
  }
}

export async function writeJSONFile(path, writeData) {
  if (typeof writeData !== 'string') {
    writeData = JSON.stringify(writeData, null, 2);
  }

  try {
    await writeFile(path, writeData);
    return {
      data: `Successfully wrote data to ${path}`,
      code: 'SUCCESS',
      path: path,
    };
  } catch (err) {
    // console.error(err);
    throw new Error(err);
  }
}
