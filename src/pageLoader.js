import fs from 'fs/promises';
import { URL } from 'url';
import path from 'path';
import debug from 'debug';
import {
  makeFileName,
  makePageFilesDirName,
  loadContent,
  modifyHtml,
  downloadResources,
  writeFile,
} from './utils.js';

const log = debug('page-loader');

const pageLoader = (url, dirPath = process.cwd()) => {
  const pageUrl = new URL(url);
  const resultFilePath = path.join(dirPath, makeFileName(pageUrl));
  const filesDirPath = path.join(dirPath, makePageFilesDirName(pageUrl));

  log('Downloading HTML');
  return loadContent(pageUrl.href)
    .then((html) => {
      log('Modifying HTML');
      const { modifiedHtml, resources } = modifyHtml(html, pageUrl.origin, filesDirPath);

      return {
        page: {
          data: modifiedHtml,
          destination: resultFilePath,
        },
        resources,
      };
    })
    .then(({ page, resources }) => {
      const filesCount = resources.length;

      if (filesCount > 0) {
        log(`${filesCount} page resources to download found. Creating files directory`);

        return fs.mkdir(filesDirPath)
          .then(() => ({ page, resources }))
          .catch((e) => {
            throw new Error(`Error while creating files directory ${filesDirPath}: ${e.message}`);
          });
      }

      return { page, resources };
    })
    .then(({ page, resources }) => {
      log('Downloading page resources');
      return downloadResources(resources).then(() => page);
    })
    .then(({ data, destination }) => {
      log(`Writing HTML to ${destination}`);
      return writeFile(destination, data);
    })
    .then(() => resultFilePath);
};

export default pageLoader;
