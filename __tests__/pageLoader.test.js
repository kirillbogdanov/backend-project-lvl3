/* eslint-disable no-underscore-dangle */
import nock from 'nock';
import fs from 'fs/promises';
import os from 'os';
import { URL, fileURLToPath } from 'url';
import path from 'path';
import pageLoader from '../index.js';

nock.disableNetConnect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
const readFixtureFile = async (fileName) => fs.readFile(getFixturePath(fileName), 'utf-8')
  .then((data) => data.trim());
let resultDirPath;

beforeEach(async () => {
  resultDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
  await fs.rmdir(resultDirPath, { recursive: true });
});

test('Downloads html and page assets', async () => {
  const pageUrl = 'https://domain.com/page';
  const stubs = [
    {
      url: pageUrl,
      replyFixtureName: 'page.html',
      expectedFixtureName: 'resultPage.html',
      resultFilePath: 'domain-com-page.html',
    },
    {
      url: 'https://domain.com/assets/professions/nodejs.png',
      replyFixtureName: 'nodejs.png',
      resultFilePath: 'domain-com-page_files/domain-com-assets-professions-nodejs.png',
      expectedFixtureName: 'nodejs.png',
    },
    {
      url: 'https://domain.com/assets/doge.jpg',
      replyFixtureName: 'doge.jpg',
      resultFilePath: 'domain-com-page_files/domain-com-assets-doge.jpg',
      expectedFixtureName: 'doge.jpg',
    },
    {
      url: 'https://domain.com/assets/application.css',
      replyFixtureName: 'application.css',
      resultFilePath: 'domain-com-page_files/domain-com-assets-application.css',
      expectedFixtureName: 'application.css',
    },
    {
      url: 'https://domain.com/courses',
      replyFixtureName: 'courses.html',
      resultFilePath: 'domain-com-page_files/domain-com-courses.html',
      expectedFixtureName: 'courses.html',
    },
    {
      url: 'https://domain.com/packs/js/runtime.js',
      replyFixtureName: 'runtime.js',
      resultFilePath: 'domain-com-page_files/domain-com-packs-js-runtime.js',
      expectedFixtureName: 'runtime.js',
    },
  ];

  stubs.forEach(({ url, replyFixtureName }) => {
    const parsedUrl = new URL(url);

    nock(parsedUrl.origin)
      .get(parsedUrl.pathname)
      .replyWithFile(200, getFixturePath(replyFixtureName));
  });

  await pageLoader(pageUrl, resultDirPath);

  await Promise.all(stubs.map(async ({ expectedFixtureName, resultFilePath }) => {
    const expectedPromise = readFixtureFile(expectedFixtureName);
    const resultPromise = fs.readFile(path.join(resultDirPath, resultFilePath), 'utf-8')
      .then((data) => data.trim());

    const [expected, result] = await Promise.all([expectedPromise, resultPromise]);

    return expect(result).toBe(expected);
  }));
});

test('Throws error if page response code is other than 200', async () => {
  const pageUrl = new URL('https://domain.com/non-existent-page');

  nock(pageUrl.origin)
    .get(pageUrl.pathname)
    .reply(404, 'Not found');

  await expect(pageLoader(pageUrl.href, resultDirPath))
    .rejects.toThrow(`Error while requesting ${pageUrl.href}:`);
});

test('Throws error if asset response code is other than 200', async () => {
  const pageUrl = new URL('https://domain.com/one-img-page');
  const imgUrl = new URL('https://domain.com/non-existent-image.png');

  nock(pageUrl.origin)
    .get(pageUrl.pathname)
    .reply(200, `<img src="${imgUrl.pathname}"/>`);
  nock(imgUrl.origin)
    .get(imgUrl.pathname)
    .reply(404, 'Not found');

  await expect(pageLoader(pageUrl.href, resultDirPath))
    .rejects.toThrow(`Error while requesting ${imgUrl.href}:`);
});

test('Throws error if files directory cannot be created', async () => {
  const pageUrl = new URL('https://domain.com/page');
  const imgUrl = new URL('https://domain.com/doge.png');
  const filesDirName = 'domain-com-page_files';
  const filesDirPath = path.join(resultDirPath, filesDirName);

  nock(pageUrl.origin)
    .get(pageUrl.pathname)
    .reply(200, `<img src="${imgUrl.pathname}"/>`);

  await fs.mkdir(filesDirPath);

  await expect(pageLoader(pageUrl.href, resultDirPath))
    .rejects.toThrow(`Error while creating files directory ${filesDirPath}:`);
});

test('Throws error if one of the files cannot be created', async () => {
  const pageUrl = new URL('https://domain.com/page');
  const dirPath = path.join(resultDirPath, 'non_existent_dir');
  const filePath = path.join(dirPath, 'domain-com-page.html');

  nock(pageUrl.origin)
    .get(pageUrl.pathname)
    .reply(200, '<html></html>');

  await expect(pageLoader(pageUrl.href, dirPath))
    .rejects.toThrow(`Error while writing file ${filePath}:`);
});
