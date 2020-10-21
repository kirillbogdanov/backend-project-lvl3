import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { URL } from 'url';
import path from 'path';
import trimEnd from 'lodash.trimend';

const makeUrlSlug = (url) => {
  const urlWithoutScheme = url.hostname + trimEnd(url.pathname, '/');

  return `${urlWithoutScheme.replace(/[^A-Za-z0-9](?!png|jpg)/g, '-')}`;
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
      const $ = cheerio.load(html, { decodeEntities: false, xmlMode: true });
      const imgTags = $('img');
      const images = [];

      imgTags.each((i, elem) => {
        const currentSrc = $(elem).attr('src');
        const imgUrl = new URL(currentSrc, origin);
        const imgSlug = makeUrlSlug(imgUrl);
        const imgDestination = path.join(filesDirPath, imgSlug);
        const relativeDestination = path.join(filesDirName, imgSlug);

        images.push({ url: imgUrl.href, destination: imgDestination });
        $(elem).attr('src', relativeDestination);
      });

      const page = {
        data: $.html(),
        destination: resultFilePath,
      };

      return {
        page,
        images,
      };
    })
    .then((data) => {
      if (data.images.length > 0) {
        return fs.mkdir(filesDirPath).then(() => data);
      }

      return data;
    })
    .then(({ page, images }) => {
      const imagesPromises = images
        .map(({ url: imgUrl, destination }) => downloadFile(imgUrl, destination));
      const pagePromise = fs.writeFile(page.destination, page.data);
      const promises = [...imagesPromises, pagePromise];

      return Promise.all(promises);
    })
    .catch((e) => console.error(e));
};

export default pageLoader;
