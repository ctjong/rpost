#!/usr/bin/env node


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

function getArguments(argMap)
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
        else if (!!argMap[arg])
        {
            temp = argMap[arg]
        }
    });
    return argData;
}

function askForMissingInputAsync(argMap, argData)
{
    return new Promise(resolve =>
    {
        let argName = null;
        const isIncomplete = Object.keys(argMap).some(opt => 
        {
            argName = argMap[opt];
            if (Object.keys(argData).indexOf(argName) >= 0)
                return false;
            if (!!process.env[argName])
            {
                argData[argName] = process.env[argName];
                return false;
            }
            return true;
        });
        if (!isIncomplete)
        {
            resolve();
            return;
        }

        const readline = require("readline");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`Please enter the value for ${argName}: `, answer =>
        {
            argData[argName] = answer;
            rl.close();
            askForMissingInputAsync(argMap, argData).then(resolve);
        });
    });
}

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