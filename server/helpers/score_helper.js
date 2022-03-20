const SEGMENT_SCORES = { 1:1, 2:2, 3:4, 4:7, 6:15, 8:21 };
const routes = require('../../client/data/routes.json')

const getNeighbourRoutes = (claimedRoutes) => {
  const neighbours = {}
  for(const ri of claimedRoutes) {
    neighbours[ri] = []
    const { source, target } = routes[ri][0];
    for(const nri of claimedRoutes) {
      if(nri == ri) continue
      const { source: nsource, target: ntarget } = routes[nri][0]
      if(source == nsource || source == ntarget || target == nsource || target == ntarget) {
        neighbours[ri].push(nri)
      }
    }
  }
  return neighbours;
}

const getAllPaths = (pathArr, neighbourRoutes) => {
  const allPaths = []
  let isChanged = false;
  for(const path of pathArr) {
    const ri = path.at(-1) 
    let isPathChanged = false;
    for(const nri of neighbourRoutes[ri]) {
      if(path.includes(nri)) continue; //prev route 
      if(path.length >= 2) {
        //find end point
        const { source:s2, target: t2 } = routes[path.at(-1)][0]
        const { source:s1, target: t1 } = routes[path.at(-2)][0]
        const dest = (s2 == s1 || s2 == t1 ) ? t2 : s2
        const { source: ns, target: nt } = routes[nri][0]
        if(dest != ns && dest != nt) continue;
      }
      const newArr = [ ...path, nri]
      isPathChanged = true;
      allPaths.push(newArr)
    }
    if(!isPathChanged)
      allPaths.push(path)
    else 
      isChanged = true;
  }
  return [allPaths, isChanged];
}

const getPathScores = (allPaths)=> {
  const result = []
  for(const path of allPaths) {
    const score = path.reduce((a,r)=>a+routes[r].length, 0)
    result.push([path, score])
  }
  return result;
}

const calculateLongestRouteForPlayer = (playerIndex)=>{
  const claimedRouteIndexes = getRouteIndexesForPlayer(playerIndex)
  // const claimedRouteIndexes = claimedSegments.map(s=>s.routeIndex)
  //                               .filter((v,i,a)=>a.indexOf(v) == i)
  const neighbourRoutes = getNeighbourRoutes(claimedRouteIndexes)
  let pathScores = []
  for(const r in neighbourRoutes) {
    let allPaths = [[ parseInt(r) ]]
    let isChanged = false;
    for(let i=0;i<100;i++) {
      [allPaths, isChanged ] = getAllPaths(allPaths, neighbourRoutes)
      if(!isChanged) break;
    }
    pathScores.push(...getPathScores(allPaths))
  }
  pathScores.sort((a,b)=>b[1]-a[1])
  //dump score
  const [maxPath, score ] = pathScores[0]
  console.log("Score: ", score)
  for(let ri of maxPath) {
    console.log(routes[ri][0].source, routes[ri][0].target)
  }
  return score
}

const getNeighbours = (claimedRouteIndexes) => {
  const neighbours = {}
  for(const ri of claimedRouteIndexes) {
    const { source, target } = routes[ri][0];
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

const getRouteIndexesForPlayer = (playerIndex) => {
  return APP_CONTEXT.claimedSegments
          .filter(s=>s.playerIndex == playerIndex)
          .map(s=>s.routeIndex)
          .filter((v,i,a)=>a.indexOf(v) == i)
}

const calculateSegmentScoresForPlayer = (playerIndex) => {
  const claimedRouteIndexes = getRouteIndexesForPlayer(playerIndex)

  return claimedRouteIndexes.reduce((a,ri)=>a+SEGMENT_SCORES[routes[ri].length], 0)
} 

const calculateTicketScoresForPlayer = (playerIndex) => {
  const claimedRouteIndexes = getRouteIndexesForPlayer(playerIndex)
  const neighbours = getNeighbours(claimedRouteIndexes)
  const tickets = APP_CONTEXT.gamePlayers[playerIndex].tickets;
  return tickets.reduce((a,t)=>isConnected(t, neighbours) ? (a+t.score): (a-t.score), 0)
}

const updateRouteCompletion = (playerIndex) => {
  const claimedRouteIndexes = getRouteIndexesForPlayer(playerIndex)
  const neighbours = getNeighbours(claimedRouteIndexes)
  const tickets = APP_CONTEXT.gamePlayers[playerIndex].tickets;
  tickets.forEach(t=>t.isCompleted = isConnected(t, neighbours))
}

const calculateScores = ()=>{
  for(const index in APP_CONTEXT.gamePlayers) {
    const p = APP_CONTEXT.gamePlayers[index];
    p.score = calculateSegmentScoresForPlayer(index)+
                  calculateTicketScoresForPlayer(index);
    p.longestPathScore = calculateLongestRouteForPlayer(index)
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
  updateRouteCompletion,
  calculateLongestRouteForPlayer
}
