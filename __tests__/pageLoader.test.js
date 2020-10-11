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
  nock(new RegExp(testPageUrl.hostname))
    .get(testPageUrl.pathname)
    .replyWithFile(200, getFixturePath('testPage.html'));
  const expected = await readFixtureFile('testPage.html');

  await pageLoader(testPageUrl.toString(), resultDirPath);

  const resultFilePath = path.join(resultDirPath, 'test-page-com-test-page.html');
  const result = await fs.readFile(resultFilePath, 'utf-8');

  expect(result).toBe(expected);
});
