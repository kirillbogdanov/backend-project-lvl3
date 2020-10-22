import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { URL } from 'url';
import path from 'path';
import trimEnd from 'lodash.trimend';
import debug from 'debug';
import axiosDebugLog from 'axios-debug-log';

const log = debug('page-loader');
const axiosClient = axios.create();
axiosDebugLog.addLogger(axiosClient);

const tagToLinkAttrNameMapping = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const makeUrlSlug = (url) => {
  const urlWithoutScheme = url.hostname + trimEnd(url.pathname, '/');

  return `${urlWithoutScheme.replace(/(_|\/|(?<!\/\w*)\.)/g, '-')}`;
};

const downloadFile = (url, destination) => {
  const writer = createWriteStream(destination);

  return axiosClient({
    method: 'get',
    responseType: 'stream',
    url,
  })
    .then((response) => {
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      }).then(() => log(`Wrote ${url} to ${destination}`));
    });
};

const pageLoader = (url, dirPath = process.cwd()) => {
  const pageUrl = new URL(url);
  const { origin } = pageUrl;
  const pageSlug = makeUrlSlug(pageUrl);
  const resultFilePath = path.join(dirPath, `${pageSlug}.html`);
  const filesDirName = `${pageSlug}_files`;
  const filesDirPath = path.join(dirPath, filesDirName);

  log(`Requesting ${url}`);
  return axiosClient.get(pageUrl.href)
    .then(({ data: html }) => {
      log('Page response received. Modifying HTML');
      const tagNamesToProcess = Object.keys(tagToLinkAttrNameMapping);
      const $ = cheerio.load(html, { decodeEntities: false, xmlMode: true });
      const files = [];

      tagNamesToProcess.forEach((tagName) => {
        const tags = $(tagName);
        const linkAttrName = tagToLinkAttrNameMapping[tagName];

        tags.each((i, elem) => {
          const currentLink = $(elem).attr(linkAttrName);
          const fileUrl = new URL(currentLink, origin);

          if (fileUrl.origin === origin && currentLink) {
            const fileSlug = makeUrlSlug(fileUrl);
            const fileSlugWithExtname = !path.extname(fileSlug) ? `${fileSlug}.html` : fileSlug;
            const fileDestination = path.join(filesDirPath, fileSlugWithExtname);
            const fileRelativeDestination = path.join(filesDirName, fileSlugWithExtname);

            files.push({ url: fileUrl.href, destination: fileDestination });
            $(elem).attr(linkAttrName, fileRelativeDestination);
          }
        });
      });

      return {
        page: {
          data: $.html(),
          destination: resultFilePath,
        },
        files,
      };
    })
    .then((data) => {
      log('HTML modified');
      const filesCount = data.files.length;

      if (filesCount > 0) {
        log(`${filesCount} page assets to download found. Creating files directory`);

        return fs.mkdir(filesDirPath).then(() => {
          log('Files directory created');
          return data;
        });
      }

      log('No additional assets found. Skipping files directory creation');
      return data;
    })
    .then(({ page, files }) => {
      log('Starting downloading page assets');
      const filesPromises = files.map(
        ({ url: fileUrl, destination: fileDestination }) => downloadFile(fileUrl, fileDestination),
      );
      const pagePromise = fs.writeFile(page.destination, page.data)
        .then(() => log(`HTML written to ${page.destination}`));
      const promises = [...filesPromises, pagePromise];

      return Promise.all(promises);
    })
    .catch((e) => log(e));
};

export default pageLoader;
