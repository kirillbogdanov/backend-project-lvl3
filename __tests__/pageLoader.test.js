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
  const testPageUrl = new URL('https://test-page.com/test-page');
  const img1Url = new URL('https://test-page.com/assets/professions/nodejs.png');
  const img2Url = new URL('https://test-page.com/assets/doge.jpg');

  nock(new RegExp(testPageUrl.hostname))
    .get(testPageUrl.pathname)
    .replyWithFile(200, getFixturePath('testPage.html'));
  nock(new RegExp(img1Url.hostname))
    .get(img1Url.pathname)
    .replyWithFile(200, getFixturePath('nodejs.png'));
  nock(new RegExp(img2Url.hostname))
    .get(img2Url.pathname)
    .replyWithFile(200, getFixturePath('doge.jpg'));

  const expectedHtml = await readFixtureFile('resultPage.html');
  const expectedImg1 = await readFixtureFile('nodejs.png');
  const expectedImg2 = await readFixtureFile('doge.jpg');

  await pageLoader(testPageUrl.toString(), resultDirPath);

  const resultHtmlPath = path.join(resultDirPath, 'test-page-com-test-page.html');
  const resultHtml = await fs.readFile(resultHtmlPath, 'utf-8');
  expect(resultHtml).toBe(expectedHtml);

  const resultImg1Path = path.join(resultDirPath,
    'test-page-com-test-page_files/test-page-com-assets-professions-nodejs.png');
  const resultImg1 = await fs.readFile(resultImg1Path, 'utf-8');
  expect(resultImg1).toBe(expectedImg1);

  const resultImg2Path = path.join(resultDirPath,
    'test-page-com-test-page_files/test-page-com-assets-doge.jpg');
  const resultImg2 = await fs.readFile(resultImg2Path, 'utf-8');
  expect(resultImg2).toBe(expectedImg2);
});
