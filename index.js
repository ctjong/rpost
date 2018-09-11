#!/usr/bin/env node

// Entry point
function main()
{
    try
    {
        const argMap = { "-u": "userName", "-p": "password", "-ci": "clientId", "-cs": "clientSecret" };
        const argData = getArguments(argMap);
        askForMissingInputAsync(argMap, argData).then(() =>
        {
            getAccessTokenAsync(argData).then(token =>
            {
                console.log(token);
            });
        });
    }
    catch (e)
    {
        console.error(e);
    }
}

// Get arguments from stdin and from environment variables
function getArguments(argMap)
{
    // Get arguments from stdin
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
        else if (!!argMap[arg])
        {
            temp = argMap[arg]
        }
    });

    // For each required argument that is not specified in stdin,
    // check if it is set as environment variable
    Object.keys(argMap).forEach(opt => 
    {
        const argName = argMap[opt];
        if (Object.keys(argData).indexOf(argName) < 0 && !!process.env[argName])
            argData[argName] = process.env[argName];
    });

    return argData;
}

// Prompt for arguments that haven't been specified in stdin
function askForMissingInputAsync(argMap, argData)
{
    return new Promise(resolve =>
    {
        let argName = null;
        const isIncomplete = Object.keys(argMap).some(opt => 
        {
            argName = argMap[opt];
            return (Object.keys(argData).indexOf(argName) < 0)
        });
        if (!isIncomplete)
        {
            resolve();
            return;
        }

        const input = require("read");
        const options =
        {
            "prompt": `Please enter the value for ${argName}: `,
            "silent": argName === "password"
        };
        input(options, (error, result, isDefault) =>
        {
            argData[argName] = result;
            askForMissingInputAsync(argMap, argData).then(resolve);
        });
    });
}

// Retrieve access token
function getAccessTokenAsync(argData)
{
    return new Promise(resolve =>
    {
        const request = require("request");
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

main();