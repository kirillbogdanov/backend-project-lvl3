install-deps:
	npm ci

link:
	npm link

install:
	make install-deps
	make link

lint:
	npx eslint .

test:
	npm run test

test-coverage:
	npm run test -- --coverage

check:
	make lint
	make test

publish:
	npm publish --dry-run

run:
	bin/page-loader.js
