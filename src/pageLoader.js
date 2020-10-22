import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { URL } from 'url';
import path from 'path';
import trimEnd from 'lodash.trimend';

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

  return axios({
    method: 'get',
    responseType: 'stream',
    url,
  })
    .then((response) => {
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    });
};

const pageLoader = (url, dirPath = process.cwd()) => {
  const pageUrl = new URL(url);
  const { origin } = pageUrl;
  const pageSlug = makeUrlSlug(pageUrl);
  const resultFilePath = path.join(dirPath, `${pageSlug}.html`);
  const filesDirName = `${pageSlug}_files`;
  const filesDirPath = path.join(dirPath, filesDirName);

  return axios.get(pageUrl.href)
    .then(({ data: html }) => {
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
      if (data.files.length > 0) {
        return fs.mkdir(filesDirPath).then(() => data);
      }

      return data;
    })
    .then(({ page, files }) => {
      const filesPromises = files.map(
        ({ url: fileUrl, destination: fileDestination }) => downloadFile(fileUrl, fileDestination),
      );
      const pagePromise = fs.writeFile(page.destination, page.data);
      const promises = [...filesPromises, pagePromise];

      return Promise.all(promises);
    })
    .catch((e) => console.error(e));
};

export default pageLoader;
