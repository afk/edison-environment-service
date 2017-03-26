# edison-environment-service
A concept for a WebApp that displays data collected by an Edison device &
streamed to http://streammyiot.com/

Each device has sensors for light, temperature, air pollution etc.

We fetch a list with devices belonging to an account and set them on google maps. Displaying
the devices on a map helps us better understand what the noise level in specific areas is,
what the air pollution is, sun hours etc.

This repository contains just the code to display the data on the map.

The code that streams the data to http://streammyiot.com/ is located in the following
[repository](https://github.com/afk/edison-environment-service)

## Launching this project
Prerequisite is node.js on your machine. After that you need to do the following things

1. `npm install` in the main directory
2. `npm install in the .\api directory`
3. Rename credentials.dist.json to credentials.json and provide your login credentials in the file
4. Replace YOUR_API_KEY in index.html with your google maps api key
5. launch main.js in node `node main.js`. You should see "Edison Environment server is listening 8082!" in the console

Now you can open the index.html file in the browser and it should be able to connect to your 
streammyiot account and display your devices on the map

Thanks to WHD.global for having us at the WHD.Hackatlon 2017

Thanks to Intel for providing us with the Edison Kits and to 1and1 for providing us with the
necessary servers to play with the service.