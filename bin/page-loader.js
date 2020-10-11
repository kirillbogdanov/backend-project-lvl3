#!/usr/bin/env node
import commander from 'commander';
import pageLoader from '../index.js';

const program = new commander.Command();

program
  .arguments('<pageUrl>')
  .option('--output [dirPath]', 'output directory path', process.cwd())
  .description('Downloads the page on specified url to output directory path.')
  .version('0.0.1')
  .action((pageUrl) => {
    pageLoader(pageUrl, program.output).then(() => {});
  });

program.parse(process.argv);
