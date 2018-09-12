#!/usr/bin/env node

(function ()
{
    const request = require("request");
    const read = require("read");

    const ARGUMENT_OPTIONS =
    {
        "-u": "userName", "-p": "password", "-ci": "clientId", "-cs": "clientSecret",
        "-pt": "postTitle", "-pu": "postUrl", "-s": "subreddits"
    };

    // Entry point
    function main()
    {
        try
        {
            const argData = getArguments(ARGUMENT_OPTIONS);
            askForMissingArgsAsync(ARGUMENT_OPTIONS, argData).then(() =>
            {
                getAccessTokenAsync(argData).then(token =>
                {
                    submitPostsAsync(argData, token);
                });
            });
        }
        catch (e)
        {
            console.error(e);
        }
    }

    // Get arguments from stdin
    function getArguments(ARGUMENT_OPTIONS)
    {
        const [, , ...args] = process.argv;
        const argData = {};
        let temp = null;
        args.forEach(arg =>
        {
            if (temp !== null)
            {
                argData[temp] = arg;
                temp = null;
            }
            else if (!!ARGUMENT_OPTIONS[arg])
            {
                temp = ARGUMENT_OPTIONS[arg]
            }
        });

        return argData;
    }

    // Ask for arguments that haven't been specified in stdin
    function askForMissingArgsAsync(ARGUMENT_OPTIONS, argData)
    {
        const missingArgs = [];
        Object.keys(ARGUMENT_OPTIONS).forEach(opt => 
        {
            const argName = ARGUMENT_OPTIONS[opt];
            if (!argData[argName])
                missingArgs.push(argName);
        });
        return chainPromise(missingArgs, (missingArg, resolve) =>
        {
            const options =
            {
                "prompt": `Please enter the value for ${missingArg}: `,
                "silent": missingArg === "password"
            };
            read(options, (error, result, isDefault) =>
            {
                argData[missingArg] = result;
                resolve();
            });
        });
    }

    // Retrieve access token
    function getAccessTokenAsync(argData)
    {
        return new Promise(resolve =>
        {
            request.post(
                {
                    url: 'https://www.reddit.com/api/v1/access_token',
                    auth:
                    {
                        "username": argData["clientId"],
                        "password": argData["clientSecret"]
                    },
                    formData:
                    {
                        "grant_type": "password",
                        "username": argData["userName"],
                        "password": argData["password"]
                    },
                    headers:
                    {
                        "User-Agent": "ChangeMeClient/0.1"
                    }
                },
                (e, r, body) =>
                {
                    const parsed = JSON.parse(body);
                    resolve(parsed["access_token"]);
                });
        });
    }

    // Submit multiple subreddit posts
    function submitPostsAsync(argData, token)
    {
        const posts = [];
        const subreddits = argData["subreddits"].split(",");
        subreddits.forEach(subreddit =>
        {
            posts.push(new Post(subreddit, argData["postTitle"], argData["postUrl"]));
        });
        return chainPromise(posts, (post, resolve) =>
        {
            waitAndSubmitPostAsync(post, 0, token).then(resolve);
        });
    }

    // Wait and then submit a single subreddit post
    function waitAndSubmitPostAsync(post, timeout, token)
    {
        return new Promise(resolve =>
        {
            if (timeout > 0)
                console.log(`Waiting ${timeout / 1000} seconds before posting to r/${post.target}`);
            setTimeout(() =>
            {
                console.log(`Submitting to r/${post.target}`);
                request.post(
                    {
                        url: 'https://oauth.reddit.com/api/submit',
                        form: { "api_type": "json", "kind": "link", "sr": post.target, "title": post.title, "url": post.url },
                        headers: { "User-Agent": "ChangeMeClient/0.1", "Authorization": `Bearer ${token}` }
                    },
                    (e, r, body) =>
                    {
                        console.log(`Received response: ${body}`);
                        const parsed = JSON.parse(body);
                        if (parsed && parsed.json && parsed.json.errors && parsed.json.errors.length === 0)
                        {
                            console.log(`Post submitted to r/${post.target}`);
                            resolve();
                        }
                        else if (parsed && parsed.json && parsed.json.ratelimit)
                        {
                            // Submitted too early. Wait for the remaining timeout and retry.
                            const remaining = Math.ceil(parsed.json.ratelimit * 1000);
                            waitAndSubmitPostAsync(post, remaining, token).then(resolve);
                        }
                        else 
                        {
                            console.log(`Failed to submit to r/${post.target}`);
                            resolve();
                        }
                    });
            }, timeout);
        });
    }

    // Execute an async function against each item in an argument array, one after the other,
    // by chaining the function promises.
    function chainPromise(args, asyncFunction)
    {
        return new Promise(finalResolve => 
        {
            let currentPromise = null;
            args.forEach(arg => 
            {
                const promiseFunction = resolve => asyncFunction(arg, resolve);
                if (currentPromise)
                    currentPromise = currentPromise.then(() => new Promise(promiseFunction));
                else
                    currentPromise = new Promise(promiseFunction);
            });
            if (currentPromise)
                currentPromise.then(finalResolve);
            else
                finalResolve();
        });
    }

    // class representing a post object
    class Post
    {
        constructor(target, title, url)
        {
            this.target = target;
            this.title = title;
            this.url = url;
        }
    }

    main();
})();