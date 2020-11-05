import path from 'path';
import { URL } from 'url';
import fs from 'fs/promises';
import cheerio from 'cheerio';
import Listr from 'listr';
import axios from 'axios';
import 'axios-debug-log';

const makeUrlSlug = (url) => {
  const urlWithoutScheme = url.hostname + url.pathname;

  return urlWithoutScheme.replace(/\W/g, '-');
};

export const makeFileName = (url) => {
  const originalExtname = path.extname(url.href);
  const extname = originalExtname || '.html';
  const urlWithoutExtname = new URL(url.href.replace(originalExtname, ''));
  const fileSlug = makeUrlSlug(urlWithoutExtname);

  return `${fileSlug}${extname}`;
};

export const makePageFilesDirName = (url) => `${makeUrlSlug(url)}_files`;

export const loadContent = (url) => axios.get(url, { responseType: 'arraybuffer' })
  .then(({ data }) => data)
  .catch((e) => {
    throw new Error(`Error while requesting ${url}: ${e.message}`);
  });

export const writeFile = (destination, data) => fs.writeFile(destination, data)
  .catch((e) => {
    throw new Error(`Error while writing file ${destination}: ${e.message}`);
  });

export const modifyHtml = (html, origin, filesDirPath) => {
  const tagToLinkAttrNameMapping = {
    img: 'src',
    link: 'href',
    script: 'src',
  };

  const tagNamesToProcess = Object.keys(tagToLinkAttrNameMapping);
  const $ = cheerio.load(html, { decodeEntities: false });
  const filesDirName = path.parse(filesDirPath).base;
  const resources = [];

  tagNamesToProcess.forEach((tagName) => {
    const tags = $(tagName);
    const linkAttrName = tagToLinkAttrNameMapping[tagName];

    tags.each((i, elem) => {
      const currentLink = $(elem).attr(linkAttrName);
      const fileUrl = new URL(currentLink, origin);

      if (fileUrl.origin === origin && currentLink) {
        const fileName = makeFileName(fileUrl);
        const fileDestination = path.join(filesDirPath, fileName);
        const fileRelativeDestination = path.join(filesDirName, fileName);

        if (!resources.find((file) => file.url === fileUrl.href)) {
          resources.push({ url: fileUrl.href, destination: fileDestination });
        }
        $(elem).attr(linkAttrName, fileRelativeDestination);
      }
    });
  });

  return {
    modifiedHtml: $.html(),
    resources,
  };
};

export const downloadResources = (resources) => {
  const tasks = resources.map(({ url: fileUrl, destination: fileDestination }) => ({
    title: fileUrl,
    task: () => loadContent(fileUrl)
      .then((data) => writeFile(fileDestination, data)),
  }));

  const listr = new Listr(tasks, { concurrent: true });

  return listr.run();
};
