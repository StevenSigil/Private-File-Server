import axios from 'axios';

/**
 * Attempts to query Wikipedia (external) for a single page matching `searchTitle`
 * @param {string} searchTitle String to search query Wikipedia's (external) API
 * @returns Data with `Title`, `Page Image`, `Page Description`, etc... - OR - `Error`
 */
export async function getFromWikipedia(searchTitle) {
  try {
    const res = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        prop: 'pageimages|description',
        generator: 'search',
        piprop: 'thumbnail|name|original',
        pilicense: 'any',
        gsrsearch: searchTitle,
        gsrlimit: '1',
        gsrsort: 'relevance',
      },
    });

    return res.data;
  } catch (err) {
    throw await err;
  }
}
