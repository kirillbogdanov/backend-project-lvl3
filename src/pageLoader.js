import axios from 'axios';
import fs from 'fs/promises';
import URL from 'url';
import path from 'path';

const urlToFilename = (url) => {
  const parsedUrl = URL.parse(url);
  const urlWithoutScheme = parsedUrl.hostname + parsedUrl.pathname;

  return `${urlWithoutScheme.replace(/[^A-Za-z0-9]/g, '-')}.html`;
};

const pageLoader = (pageUrl, dirPath = process.cwd()) => {
  const resultFileName = urlToFilename(pageUrl);
  const resultFilePath = path.join(dirPath, resultFileName);

  return axios.get(pageUrl)
    .then(({ data }) => fs.writeFile(resultFilePath, data));
};

export default pageLoader;
