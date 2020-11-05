page-loader
=====================
[![Hexlet Check Status](https://github.com/kirillbogdanov/backend-project-lvl3/workflows/hexlet-check/badge.svg?branch=main)](https://github.com/kirillbogdanov/backend-project-lvl3/actions?query=workflow%3Ahexlet-check)
[![CI](https://github.com/kirillbogdanov/backend-project-lvl3/workflows/CI/badge.svg?branch=main&event=push)](https://github.com/kirillbogdanov/backend-project-lvl3/actions?query=workflow%3ACI)
[![Maintainability](https://api.codeclimate.com/v1/badges/810b38aa5a6d7bcca960/maintainability)](https://codeclimate.com/github/kirillbogdanov/backend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/810b38aa5a6d7bcca960/test_coverage)](https://codeclimate.com/github/kirillbogdanov/backend-project-lvl3/test_coverage)

* [Requirements](#requirements)
* [Usage](#usage)
* [Commands](#commands)

# Requirements
- Node.js v13.14.0 and later
- npm v6.14.14 and later
- GNU Make v3.81 and later

# Usage
As CLI:
```shell
$ git clone https://github.com/kirillbogdanov/backend-project-lvl3.git
$ cd backend-project-lvl3
$ make install
$ page-loader --output /var/tmp https://ru.hexlet.io/courses
$ open /var/tmp/ru-hexlet-io-courses.html
```
As dependency:
```js
import pageLoader from '../backend-project-lvl3';

await pageLoader('https://ru.hexlet.io/courses', '/var/tmp');
```

# Commands
* [`page-loader [options] <pageUrl>`](#page-loader-options-pageUrl)

## `page-loader [options] <pageUrl>`

```
Usage: page-loader [options] <pageUrl>

Downloads the page on specified url to output directory path.

Options:
  --output [dirPath]  output directory path (default: "process.cwd()")
  -V, --version       output the version number
  -h, --help          display help for command
```

# Usage
## Download page
[![asciicast](https://asciinema.org/a/sY8Unr35ZGOyLTr5ZW7NOm9R5.svg)](https://asciinema.org/a/sY8Unr35ZGOyLTr5ZW7NOm9R5)
## Download page images
[![asciicast](https://asciinema.org/a/liLucBxjjQ1nTglfJierhmpXG.svg)](https://asciinema.org/a/liLucBxjjQ1nTglfJierhmpXG)
## Download page resources
[![asciicast](https://asciinema.org/a/tNwQc1MjPoG2yfzYkz0tvCkVK.svg)](https://asciinema.org/a/tNwQc1MjPoG2yfzYkz0tvCkVK)
## Debug
[![asciicast](https://asciinema.org/a/pZmWAEq1uLTjy42isdTfWOw5U.svg)](https://asciinema.org/a/pZmWAEq1uLTjy42isdTfWOw5U)
## Error handling
[![asciicast](https://asciinema.org/a/I19oGnhQERwFo0qpNpVRytgr1.svg)](https://asciinema.org/a/I19oGnhQERwFo0qpNpVRytgr1)
## Progress logging
[![asciicast](https://asciinema.org/a/R2VFgIo3UO9efQ7F6zDx5VEjE.svg)](https://asciinema.org/a/R2VFgIo3UO9efQ7F6zDx5VEjE)
