# MultiSubPoster CLI

[![npm](https://img.shields.io/npm/dt/multisubposter-cli.svg)](https://www.npmjs.com/package/multisubposter-cli) [![npm](https://img.shields.io/npm/v/multisubposter-cli.svg)](https://www.npmjs.com/package/multisubposter-cli) [![David](https://img.shields.io/david/ctjong/multisubposter-cli.svg)](https://www.npmjs.com/package/multisubposter-cli)

A CLI that helps you to submit a post to multiple subreddits. The script will automatically wait between submissions to conform with Reddit rules (so you don't have to manually wait, just run the script and that's it).

## Installation

```bash
$ npm install -g multisubposter-cli
```

## Getting client ID and secret

Before running the script, you need to get a client ID and secret from your Reddit profile first. You can do it as follows:
1. Login to Reddit
2. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
3. Scroll down, click the "create an app" button
4. Enter the following for the fields:
    - Name: anything (won't be used)
    - Type: script
    - Description: leave it blank
    - About URL: leave it blank
    - Redirect URL: any valid URL (i.e. https://reddit.com)
5. Click create app
6. Take a note of the client ID (below the app title) and the client secret. Make sure to keep them confidential.

## Running the script

**Usage:**
```bash
$ multisubposter-cli -u <username> -p <password> -ci <client_id> -cs <client_secret> -pt <post_title> -pu <post_url> -s <subreddits>
```

**Arguments (all required):**
- **-u username**: your Reddit username
- **-p password**: your Reddit password
- **-ci client_id**: client ID. See [Getting client ID and secret](#getting-client-id-and-secret) for more details.
- **-cs client_secret**: client secret. See [Getting client ID and secret](#getting-client-id-and-secret) for more details.
- **-pt post_title**: post title (wrapped in double quote if contains spaces).
- **-pu post_url**: post URL (must be a valid URL).
- **-s subreddits**: comma separated list of subreddits (without the r/ prefix).

If you miss some of the arguments on the first invocation, don't worry, you will be prompted to fill them after you hit enter.

## Links

[Contributing](https://github.com/ctjong/multisubposter/tree/master/CONTRIBUTING.md)

[License](https://github.com/ctjong/multisubposter/tree/master/LICENSE)

