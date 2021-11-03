export function normalizeFromCamel(str: string) {
  const ret = str
    .replace(/([A-Z]+(?=[A-Z])|[A-Z](?=[a-z]))/g, ' $1')
    .replace(/^\w/, (l) => l.toUpperCase());
  return ret;
}
