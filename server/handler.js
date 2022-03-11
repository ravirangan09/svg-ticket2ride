const { initGame, doAction, sendAction, resumeGame, getScores, discardTicket } = require('./helpers/t2r_helper')

global.APP_CONTEXT = {
  state: 'init'
};

global.APP_ENV = { 
  players: new Map()
};

const success = (data=null)=>({ status: 'ok', data });
const error = (reason="Error")=>({ status: "error", reason });

module.exports = (io, socket)=>{
    console.log('A user connected', socket.id);
    socket.on("login", (name, playerCount, callback)=>{
      for(const [,d] of APP_ENV.players) {
        if(d.name == name)
          return callback(error(`${name} already connected. Choose a different user...`))
      }
      if(APP_ENV.players.size >= playerCount) {
        return callback(error(`More than ${playerCount} connected. Try closing any open game windows...`))
      }
      APP_ENV.players.set(socket.id, { name, id: socket.id });
      callback(success(true));
      if(APP_ENV.players.size == playerCount) {   
        if(APP_CONTEXT.state == 'init') {
          console.log("start game")
          initGame(io)
          return sendAction("startgame")
        }
      }
      if(APP_CONTEXT.state == 'started') {
        console.log("resume game for ", name)
        return resumeGame(socket, name)
      }
    })
   
    socket.on("do", (actionName, actionData)=>{
      doAction(actionName, actionData)
    })

    socket.on("scores", (callback)=>{
      callback(getScores());
    })

    socket.on("discard-ticket", (playerIndex, ticket)=>{
      discardTicket(playerIndex, ticket)
    })

    socket.on("disconnect", (reason)=>{
      console.log("disconnected ", reason, socket.id)
      APP_ENV.players.delete(socket.id);
    })
}
