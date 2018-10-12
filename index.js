#!/usr/bin/env node

(function ()
{
    const readlineSync = require('readline-sync');
    const request = require("request");

    const ARGUMENT_OPTIONS =
    {
        "-u": "redditUserName", "-p": "redditPassword", "-ci": "clientId", "-cs": "clientSecret",
        "-pt": "postTitle", "-pu": "postUrl", "-s": "subreddits"
    };

    // Entry point
    async function main()
    {
        try
        {
            const [, , ...args] = process.argv;
            if(args[0] === "-h" || args[0] === "--help")
            {
                showUsage();
                return;
            }

            const inputData = getInputData(ARGUMENT_OPTIONS, args);
            askForMissingInputs(ARGUMENT_OPTIONS, inputData);
            const token = await getAccessTokenAsync(inputData);
            await submitPostsAsync(inputData, token);
        }
        catch (e)
        {
            console.error(e);
            process.exit(1);
        }
    }

    // Show the program usage
    function showUsage()
    {
        console.log("Usage:");
        console.log("rpost [-u <redditUserName>] [-p <redditPassword>] [-ci <clientId>] [-cs <clientSecret>] [-pt <postTitle>] [-pu <postUrl>] [-s <subreddits>]");
        console.log("-u redditUserName: your Reddit username");
        console.log("-p redditPassword: your Reddit password");
        console.log("-ci clientId: client ID. See Getting client ID and secret for more details.");
        console.log("-cs clientSecret: client secret. See Getting client ID and secret for more details.");
        console.log("-pt postTitle: post title (wrapped in double quote if contains spaces).");
        console.log("-pu postUrl: post URL (must be a valid URL).");
        console.log("-s subreddits: comma separated list of subreddits (without the r/ prefix)");
        console.log("");
        console.log("If you miss one of the command line arguments, don't worry, you will be prompted for it after you execute the program.");
        console.log("Alternatively you can also set the values as environment variables to avoid having to enter it every time you execute the program. ");
    }

    // Get input data from command line arguments and environment variables
    function getInputData(ARGUMENT_OPTIONS, args)
    {
        // Get from command line arguments
        const inputData = {};
        let temp = null;
        args.forEach(arg =>
        {
            if (temp !== null)
            {
                inputData[temp] = arg;
                temp = null;
            }
            else if (!!ARGUMENT_OPTIONS[arg])
            {
                temp = ARGUMENT_OPTIONS[arg]
            }
        });

        // Get from environment variables
        Object.keys(ARGUMENT_OPTIONS).forEach(opt => 
        {
            const argName = ARGUMENT_OPTIONS[opt];
            if (!inputData[argName])
            {
                const varName = `rpost_${argName}`;
                if(process.env[varName])
                    inputData[argName] = process.env[varName];
            }
        });

        return inputData;
    }

    // Ask for inputs that haven't been specified as command line arguments
    function askForMissingInputs(ARGUMENT_OPTIONS, inputData)
    {
        const missingArgs = [];
        Object.keys(ARGUMENT_OPTIONS).forEach(opt => 
        {
            const argName = ARGUMENT_OPTIONS[opt];
            if (!inputData[argName])
                missingArgs.push(argName);
        });
        missingArgs.forEach(missingArg =>
        {
            inputData[missingArg] = readlineSync.question(
                `Please enter the value for ${missingArg}: `,
                { hideEchoBack: missingArg === "redditPassword" }
            );
        });
    }

    // Retrieve access token
    function getAccessTokenAsync(inputData)
    {
        return new Promise(resolve =>
        {
            request.post(
                {
                    url: 'https://www.reddit.com/api/v1/access_token',
                    auth:
                    {
                        "username": inputData["clientId"],
                        "password": inputData["clientSecret"]
                    },
                    formData:
                    {
                        "grant_type": "password",
                        "username": inputData["redditUserName"],
                        "password": inputData["redditPassword"]
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
    function submitPostsAsync(inputData, token)
    {
        const subreddits = inputData["subreddits"].split(",");
        subreddits.forEach(subreddit =>
        {
            const post = new Post(subreddit, inputData["postTitle"], inputData["postUrl"]);
            await waitAndSubmitPostAsync(post, 0, token);
        });
    }

    // Wait and submit a single subreddit post
    async function waitAndSubmitPostAsync(post, timeout, token)
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
                            await waitAndSubmitPostAsync(post, remaining, token);
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