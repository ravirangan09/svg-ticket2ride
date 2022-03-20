const { shuffle, pick, reject } = require("./common_helper");
const LongRoutes = require('../data/longroutes');
const ShortRoutes = require('../data/shortroutes');
const coinColors = ['blue', 'green', 'red', 'yellow'];
const clone = require('rfdc/default');
const { calculateScores, updateRouteCompletion } = require("./score_helper");


const initCloseDeck = () => {
  const cardColors = ['white', 'yellow', 'red', 'orange', 'black', 'blue', 'green', 'purple'];
  const deck = cardColors.flatMap(c=>new Array(12).fill(c))
  deck.push(...new Array(14).fill('rainbow'))
  return shuffle(deck) 
}

const initOpenDeck = (closeDeck) => {
  const openDeck = new Array(5)
  for(let i=0;i<5;i++) {
    openDeck[i] = closeDeck.pop()
  }
  return openDeck
}

const initPlayerCards = (gamePlayers, closeDeck) => {
  for(const p of gamePlayers) {
    for(let i=0;i<4;i++) {
      p.cards.push(closeDeck.pop())
    }
  }
}

const initPlayerTickets = (gamePlayers, shortTicketDeck, longTicketDeck)=>{
  for(const p of gamePlayers) {
    for(let i=0;i<3;i++) {
      p.tickets.push(shortTicketDeck.pop())
    }
    p.tickets.push(longTicketDeck.pop())   
  }
}

const initTicketDeck = ()=>{
  const shortTickets = []
  for(const r of ShortRoutes) {
    const [source, target] = r.name.split("-").sort()
    const d = { source, target, score: r.score, age: 'old', isCompleted: false }
    shortTickets.push(d)
  }
  shuffle(shortTickets)

  const longTickets = []
  for(const r of LongRoutes) {
    const [source, target] = r.name.split("-").sort()
    const d = { source, target, score: r.score }
    longTickets.push(d)
  }
  shuffle(longTickets)
  return [shortTickets, longTickets]
}

const initGame = (io)=>{
  APP_ENV.io = io;
  const colors = shuffle(coinColors)
  const gamePlayers = shuffle(clone(Array.from(APP_ENV.players.values())))
    .map((p,i)=>Object.assign(p, {  color: colors[i], 
                                    cards: [], 
                                    tickets: [], 
                                    coins: 45,
                                    score: 0,
                                    discardCount: 0,
                                    discardTickets: [],
                                  }))

  const closeDeck = initCloseDeck()
  const openDeck = initOpenDeck(closeDeck)
  initPlayerCards(gamePlayers, closeDeck) 
  const [shortTicketDeck, longTicketDeck] = initTicketDeck()
  initPlayerTickets(gamePlayers, shortTicketDeck, longTicketDeck)
  Object.assign(APP_CONTEXT, { 
                  closeDeck, 
                  openDeck, 
                  claimedSegments: [],
                  shortTicketDeck,
                  longTicketDeck,
                  gamePlayers, 
                  actionName: "start",
                  actionData: null,
                  actionCount: 0,
                  selectedCard: null,
                  prevCard: null,
                  selectedRouteIndex: -1,
                  grayRouteColor: null,                  
                  currentPlayerIndex: 0,
                  isGameOver: false,
                  finalTurnCount: 0,
                  state: 'started',
                  message: 'ok'
                }); 
  checkForTripleRainbow();
}

const sendAction = (actionName) =>{
  const pc = getPlayersContext()
  pc.forEach(context=>APP_ENV.io.to(context.me.id).emit(actionName, context))
}

const resumeGame = (socket, name) => {
  const playerIndex = APP_CONTEXT.gamePlayers.findIndex(p=>p.name == name)
  if(playerIndex < 0) {
    console.log(`Unable to find player in game ${name}`)
    return false;
  }
  const player = APP_CONTEXT.gamePlayers[playerIndex]
  player.id = socket.id;
  const pc = getPlayersContext(true)  //send claimedSegments also
  socket.emit("resumegame", pc[playerIndex])  
}

const getPlayersContext = (includeClaimedSegments=false) => {
  const closeDeck = APP_CONTEXT.closeDeck
  //for security just send last card and make other cards dummy
  const closeDeckPlayer = new Array(closeDeck.length-1);
  closeDeckPlayer.fill('dummy').push(closeDeck.at(-1))   
  const players = APP_CONTEXT.gamePlayers.map(p=>pick(p, ['name', 
                                                          'id', 
                                                          'coins', 
                                                          'color', 
                                                          'score'
                                                        ]))
  const ac = reject(APP_CONTEXT, ['closeDeck', 'gamePlayers', 
                                  'longTicketDeck', 'claimedSegments'
                                ])
  ac.claimedSegments = includeClaimedSegments ? APP_CONTEXT.claimedSegments : [];

  const playersContext = APP_CONTEXT.gamePlayers
                                .map((p,i)=>({
                                  ...ac,
                                  players,
                                  me: p,
                                  myIndex: i,
                                  myTurn: ac.currentPlayerIndex == i,
                                  closeDeck: closeDeckPlayer,
                                }))
  return playersContext;
}

const TURN_TIMEOUT = 2000

const doNextTurn = () => {
  setTimeout(()=>{
    checkGameOver(APP_CONTEXT.currentPlayerIndex)
    flushDiscardTickets();
    Object.assign(APP_CONTEXT, {
      actionName: "start",
      actionCount: 0,
      selectedCard: null,
      prevCard: null,
      selectedRouteIndex: -1,
      grayRouteColor: null,
      currentPlayerIndex: (APP_CONTEXT.currentPlayerIndex + 1) % APP_CONTEXT.gamePlayers.length
    })
    sendAction("next-turn")
  }, TURN_TIMEOUT)
}

const doMoveCloseCardToPlayer = () => {
  const card = APP_CONTEXT.closeDeck.pop();
  const ci = APP_CONTEXT.currentPlayerIndex;
  APP_CONTEXT.actionCount++;
  APP_CONTEXT.gamePlayers[ci].cards.push(card);
  if(APP_CONTEXT.actionCount == 2)
    doNextTurn();
}

const checkForTripleRainbow = (recursiveCount=0) => {
  const rainbowCount = APP_CONTEXT.openDeck.reduce((a,c)=>c == 'rainbow' ? a+1: a, 0)
  if(rainbowCount >= 3 && recursiveCount < 3) {
    //push it back and shuffle
    const count = APP_CONTEXT.openDeck.length
    for(let i=0;i<count;i++) {
      const card = APP_CONTEXT.openDeck[i]
      APP_CONTEXT.closeDeck.push(card)
    }
    shuffle(APP_CONTEXT.closeDeck)
    for(let i=0;i<count;i++) {
      const card = APP_CONTEXT.closeDeck.pop();
      APP_CONTEXT.openDeck[i] = card;
    }
    checkForTripleRainbow(recursiveCount+1)
  }
}

const doMoveOpenCardToPlayer = (cardPos) => {
  const card = APP_CONTEXT.openDeck[cardPos];
  const ci = APP_CONTEXT.currentPlayerIndex;
  APP_CONTEXT.actionCount++;
  APP_CONTEXT.gamePlayers[ci].cards.push(card);
  const newCard = APP_CONTEXT.closeDeck.pop();
  APP_CONTEXT.openDeck[cardPos] = newCard;
  checkForTripleRainbow();
  APP_CONTEXT.prevCard = card;
  if(APP_CONTEXT.actionCount == 2 || card == 'rainbow')
    doNextTurn();
}

const doMoveTicketsToPlayer = () => {
  const ci = APP_CONTEXT.currentPlayerIndex;
  APP_CONTEXT.actionCount++;
  //make all other cards old once player wants more tickets
  const cp = APP_CONTEXT.gamePlayers[ci];
  cp.tickets.forEach(t=>t.age = 'old')
  cp.discardCount = 0;
  for(let i=0;i<3;i++) {
    const ticket = APP_CONTEXT.shortTicketDeck.pop()
    ticket.age = 'new'
    cp.tickets.push(ticket);
  }
  doNextTurn();
}

const checkGameOver = (playerIndex) => {
  if(APP_CONTEXT.isGameOver) {
    APP_CONTEXT.finalTurnCount--;
    return true;
  }
  const player = APP_CONTEXT.gamePlayers[playerIndex]
  if(player.coins > 2) return false;
  APP_CONTEXT.isGameOver = true;
  APP_CONTEXT.finalTurnCount =  APP_CONTEXT.gamePlayers.length;
}

const doClaimRoute = ({ routeLength, routeIndex, index, selectedCardColor, routeColor }) => {
  APP_CONTEXT.selectedRouteIndex = routeIndex;
  APP_CONTEXT.actionCount += 2;  //claim route is double action
  const currentPlayer = APP_CONTEXT.gamePlayers[APP_CONTEXT.currentPlayerIndex];
  const coinColor = currentPlayer.color
  currentPlayer.coins--;
  const pos = currentPlayer.cards.indexOf(selectedCardColor);
  currentPlayer.cards.splice(pos, 1)  //remove from players and add to close deck
  APP_CONTEXT.closeDeck.push(selectedCardColor);
  //to make sure we are not losing cards, temp hack
  const tempCount = APP_CONTEXT.gamePlayers.reduce((a,p)=>a+p.cards.length, 
                      APP_CONTEXT.closeDeck.length+APP_CONTEXT.openDeck.length)
  console.log("total card count should be 110 = ", tempCount)
  if(routeColor == 'gray' && selectedCardColor != 'rainbow')
    APP_CONTEXT.grayRouteColor = selectedCardColor;
  APP_CONTEXT.claimedSegments.push({ routeIndex, 
                                      index, 
                                      coinColor, 
                                      playerIndex: APP_CONTEXT.currentPlayerIndex 
                                    })
  if((APP_CONTEXT.actionCount/2) >= routeLength) {
    updateRouteCompletion(APP_CONTEXT.currentPlayerIndex)
    //shuffle closeDeck
    shuffle(APP_CONTEXT.closeDeck)
    doNextTurn();
  }
}

const discardTicket = (playerIndex, ticket) => {
  const player = APP_CONTEXT.gamePlayers[playerIndex]
  const ticketIndex = player.tickets.findIndex(t=>t.source == ticket.source && t.target == ticket.target)
  player.discardTickets.push(player.tickets[ticketIndex]);
  player.tickets.splice(ticketIndex, 1)
  player.discardCount++;
  if(player.discardCount >= 2) {
    player.tickets.forEach(t=>t.age = 'old')
  }
}

const flushDiscardTickets = ()=>{
  let hasDiscards = false;
  APP_CONTEXT.gamePlayers.forEach(p=>{
    if(p.discardTickets.length) {
      hasDiscards = true;
      p.discardTickets.forEach(t=>APP_CONTEXT.shortTicketDeck.push(t))
      p.discardTickets.length = 0
    }
  })
  if(hasDiscards)
    shuffle(APP_CONTEXT.shortTicketDeck)
  return true;
}

const doAction = (actionName, actionData) => {
  APP_CONTEXT.actionName = actionName;
  APP_CONTEXT.actionData = actionData;
  switch(actionName) {
  case "move-close-card-to-player":
    doMoveCloseCardToPlayer();
    break;
  case "move-open-card-to-player":
    doMoveOpenCardToPlayer(actionData);
    break;
  case "claim-route":
    doClaimRoute(actionData);
    break;
  case "move-tickets-to-player":
    doMoveTicketsToPlayer()
    break;
  }
  return sendAction(actionName);
}

const getScores = () => {
  calculateScores();
  return APP_CONTEXT.gamePlayers.map(p=>pick(p, ['name', 'score', 'longestPathScore']))
}

module.exports = {
  initGame,
  sendAction,
  doAction,
  resumeGame,
  getScores,
  discardTicket
}