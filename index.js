#!/usr/bin/env node

(function ()
{
    const readlineSync = require('readline-sync');
    const request = require("request");

    const ARGUMENT_OPTIONS =
    {
        "-u": { name: "redditUserName", prompt: "Please enter your reddit user name", isSecret: false },
        "-p": { name: "redditPassword", prompt: "Please enter your reddit password", isSecret: true },
        "-ci": { name: "clientId", prompt: "Please enter your reddit client ID from https://www.reddit.com/prefs/apps", isSecret: false },
        "-cs": { name: "clientSecret", prompt: "Please enter your reddit client secret from https://www.reddit.com/prefs/apps", isSecret: false },
        "-t": { name: "type", prompt: "Please enter the post type (text/link)", isSecret: false },
        "-pt": { name: "postTitle", prompt: "Please enter the post title", isSecret: false },
        "-px": { name: "postText", prompt: "Please enter the post text (leave empty for link-type post)", isSecret: false },
        "-pu": { name: "postUrl", prompt: "Please enter the post URL (leave empty for text-type post)", isSecret: false },
        "-s": { name: "subreddits", prompt: "Please enter a comma-separated list of subreddits you want to post to", isSecret: false },
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

            const inputData = getInputData(args);
            askForMissingInputs(inputData);
            const token = await getAccessTokenAsync(inputData);

            const subreddits = inputData["subreddits"].split(",");
            subreddits.forEach(async (subreddit) =>
            {
                const post = new Post(subreddit, inputData["type"], inputData["postTitle"], inputData["postText"], inputData["postUrl"]);
                await waitAndSubmitPostAsync(post, 0, token);
            });
        }
        catch (e)
        {
            console.error(e);
            process.exit(1);
        }
    }

    // Get input data from command line arguments and environment variables
    function getInputData(args)
    {
        // Get from command line arguments
        const inputData = {};
        let lastArgumentname = null;
        args.forEach(arg =>
        {
            if (!!ARGUMENT_OPTIONS[arg])
            {
                lastArgumentname = ARGUMENT_OPTIONS[arg].name;
            }
            else if (lastArgumentname !== null)
            {
                inputData[lastArgumentname] = arg;
                lastArgumentname = null;
            }
        });

        // Get from environment variables
        Object.keys(ARGUMENT_OPTIONS).forEach(opt => 
        {
            const argName = ARGUMENT_OPTIONS[opt].name;
            if (!inputData[argName])
            {
                const envVarName = `rpost_${argName}`;
                if(process.env[envVarName])
                    inputData[argName] = process.env[envVarName];
            }
        });

        return inputData;
    }

    // Ask for inputs that haven't been specified as command line arguments
    function askForMissingInputs(inputData)
    {
        const missingArgs = [];
        Object.keys(ARGUMENT_OPTIONS).forEach(opt => 
        {
            const arg = ARGUMENT_OPTIONS[opt];
            if (!inputData[arg.name])
                missingArgs.push(arg);
        });
        missingArgs.forEach(missingArg =>
        {
            inputData[missingArg.name] = readlineSync.question(
                `${missingArg.prompt}: `,
                { hideEchoBack: missingArg.isSecret }
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

                const data = { "api_type": "json", "sr": post.target, "title": post.title };
                if(post.type === "text")
                {
                    data.kind = "self";
                    data.text = post.text;
                }
                else if(post.type === "link")
                {
                    data.kind = "link";
                    data.url = post.url;
                }
                else
                {
                    throw `Unrecognized type ${post.type}`;
                }

                request.post(
                    {
                        url: 'https://oauth.reddit.com/api/submit',
                        form: data,
                        headers: { "User-Agent": "ChangeMeClient/0.1", "Authorization": `Bearer ${token}` }
                    },
                    async (e, r, body) =>
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

    // Show the program usage
    function showUsage()
    {
        console.log("Usage:");
        console.log("rpost [-u <redditUserName>] [-p <redditPassword>] [-ci <clientId>] [-cs <clientSecret>] [-t <type>] [-pt <postTitle>] [-px <postText>] [-pu <postUrl>] [-s <subreddits>]");
        console.log("-u redditUserName: your Reddit username");
        console.log("-p redditPassword: your Reddit password");
        console.log("-ci clientId: client ID. See Getting client ID and secret for more details.");
        console.log("-cs clientSecret: client secret. See Getting client ID and secret for more details.");
        console.log("-t type: post type (link/text).");
        console.log("-pt postTitle: post title.");
        console.log("-px postText: post text. Required only if post type is text.");
        console.log("-pu postUrl: post URL. Required only if post type is link.");
        console.log("-s subreddits: comma separated list of subreddits (without the r/ prefix)");
        console.log("");
        console.log("If you miss one of the command line arguments, don't worry, you will be prompted for it after you execute the program.");
        console.log("Alternatively you can also set the values as environment variables to avoid having to enter it every time you execute the program. ");
    }

    // class representing a post object
    class Post
    {
        constructor(target, type, title, text, url)
        {
            this.target = target;
            this.type = type;
            this.title = title;
            this.text = text;
            this.url = url;
        }
    }

    main();
})();