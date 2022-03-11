const SEGMENT_SCORES = { 1:1, 2:2, 3:4, 4:7, 6:15, 8:21 };
const routes = require('../../client/data/routes.json')

const getNeighbours = (claimSegments) => {
  const neighbours = {}
  for(const r of claimSegments) {
    const { routeIndex, index } = r;
    const { source, target } = routes[routeIndex][index];
    if(!neighbours.hasOwnProperty(source)) {
      neighbours[source] = [];
    }
    neighbours[source].push(target)
    if(!neighbours.hasOwnProperty(target)) {
      neighbours[target] = [];
    }
    neighbours[target].push(source)
  }
  return neighbours;
}

const getRoutesForPlayer = (playerIndex) => {
  return APP_CONTEXT.claimedSegments
          .filter(s=>s.playerIndex == playerIndex)
          .filter((s,i,a)=>a.findIndex(ts=>ts.routeIndex == s.routeIndex) == i)
}

const calculateSegmentScoresForPlayer = (playerIndex) => {
  const claimedRoutes = getRoutesForPlayer(playerIndex)

  return claimedRoutes.reduce((a,s)=>a+SEGMENT_SCORES[routes[s.routeIndex].length], 0)
} 

const calculateTicketScoresForPlayer = (playerIndex) => {
  const claimedRoutes = getRoutesForPlayer(playerIndex)
  const neighbours = getNeighbours(claimedRoutes)
  const tickets = APP_CONTEXT.gamePlayers[playerIndex].tickets;
  return tickets.reduce((a,t)=>isConnected(t, neighbours) ? (a+t.score): (a-t.score), 0)
}

const updateRouteCompletion = (playerIndex) => {
  const claimedRoutes = getRoutesForPlayer(playerIndex)
  const neighbours = getNeighbours(claimedRoutes)
  const tickets = APP_CONTEXT.gamePlayers[playerIndex].tickets;
  tickets.forEach(t=>t.isCompleted = isConnected(t, neighbours))
}

const calculateScores = ()=>{
  for(const index in APP_CONTEXT.gamePlayers) {
    const p = APP_CONTEXT.gamePlayers[index];
    p.score = calculateSegmentScoresForPlayer(index)+
                  calculateTicketScoresForPlayer(index);
  }
}

// https://stackoverflow.com/questions/354330/how-to-determine-if-two-nodes-are-connected
const isConnected = (ticket, neighbours) => {
  const { source, target } = ticket;
  const todoSet = [];
  const doneSet = [];
  todoSet.push(source);
  while(todoSet.length > 0) {
    const elem = todoSet.shift();
    doneSet.push(elem);
    if(!neighbours.hasOwnProperty(elem)) continue;
    for(const n of neighbours[elem]) {
      if(n == target) return true;
      if(!doneSet.includes(n)) {
        todoSet.push(n);
      }
    } //end for
  } //end while
  return false;
}

module.exports = {
  calculateScores,
  updateRouteCompletion
}
