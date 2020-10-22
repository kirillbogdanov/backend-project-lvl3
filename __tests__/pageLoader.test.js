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
const readFixtureFile = async (fileName) => fs.readFile(getFixturePath(fileName), 'utf-8');
let resultDirPath;

beforeEach(async () => {
  resultDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('pageLoader', async () => {
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
    const resultPromise = fs.readFile(path.join(resultDirPath, resultFilePath), 'utf-8');

    const [expected, result] = await Promise.all([expectedPromise, resultPromise]);

    return expect(result).toBe(expected);
  }));
});
