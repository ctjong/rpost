# rpost

[![npm](https://img.shields.io/npm/dt/rpost.svg)](https://www.npmjs.com/package/rpost) [![npm](https://img.shields.io/npm/v/rpost.svg)](https://www.npmjs.com/package/rpost) [![David](https://img.shields.io/david/ctjong/rpost.svg)](https://www.npmjs.com/package/rpost)

A CLI that helps you to submit a reddit post to multiple subreddits. The script will automatically wait between submissions to conform with Reddit rules (so you don't have to manually wait, just run the script and that's it).

## Installation

```bash
$ npm install -g rpost
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
$ rpost [-u <redditUserName>] [-p <redditPassword>] [-ci <clientId>] [-cs <clientSecret>] [-t <type>] [-pt <postTitle>] [-px <postText>] [-pu <postUrl>] [-s <subreddits>]
```

**Arguments (all required):**
- **-u redditUserName**: your Reddit username
- **-p redditPassword**: your Reddit password
- **-ci clientId**: client ID. See [Getting client ID and secret](#getting-client-id-and-secret) for more details.
- **-cs clientSecret**: client secret. See [Getting client ID and secret](#getting-client-id-and-secret) for more details.
- **-t type**: post type (link/text).
- **-pt postTitle**: post title.
- **-px postText**: post text. Required only if post type is text.
- **-pu postUrl**: post URL. Required only if post type is link.
- **-s subreddits**: comma separated list of subreddits (without the r/ prefix).

If you miss some of the arguments on the first invocation, don't worry, you will be prompted to fill them after you hit enter.

**Environment variables**

Alternatively, to avoid having to enter the arguments every time you run the program, you can also set the values as environment
variables. The variable name should be "rpost_" plus the argument name specified in the above list.
Example: rpost_redditUserName, rpost_redditPassword, etc.


## Links

[Contributing](https://github.com/ctjong/rpost/tree/master/CONTRIBUTING.md)

[License](https://github.com/ctjong/rpost/tree/master/LICENSE)

