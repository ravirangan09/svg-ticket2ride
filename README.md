# Ticket to Ride Europe
This is a local version of Ticket to Ride Europe. Works with 2-5 players. It uses socket.io for communication and runs of a local node serer. With ngrok or any tunneling tool, once can expose the http port to external users

## Install 
1. `yarn install` to install node packages
2. `yarn build` to build the frontend using the excellent esbuild bundler
3. `yarn server` to run the server. It listens on port `4000`

Users then connect to http://ip-address:4000, where ip address is the IP address of the machine running the server. e.g. http: /10.0.0.1:4000.

**Tip**: To change names of players, update the `client/data/userlist.json` with the names of your players and rebuild `yarn build` and restart server `yarn server`.

## Features
* Users can disconnect and connect back again and state is preserved

## Tech stack
* Javascript and nodejs on backend
* esbuild bundler for frontend bundling
* Frontend vanilla javascript using SVG elements and CSS animations. An earlier verion used the popular Phaser game engine, but ended up rewriting to make it lighter and faster, with vanilla javascript and svg

## Limitations
* Undo not supported yet
* Tunnels and ferries feature not implemented. Simpler game play treating all gray routes the same

