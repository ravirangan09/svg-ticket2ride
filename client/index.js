import BoardSection from './objects/BoardSection';
import "./css/main.css";
import TrainCard from './objects/TrainCard';
import CloseDeckSection from './objects/CloseDeckSection';
import OpenDeckSection from './objects/OpenDeckSection';
import * as SVGWrapper from './objects/SVGWrapper';
import { io } from 'socket.io-client';
import { initToast, toast } from './helpers/game_helper';
import PlayerTrainSection from './objects/PlayerTrainSection';
import PlayerRouteSection from './objects/PlayerRouteSection';
import PlayersSection from './objects/PlayersSection';
import { LoginSection } from './objects/LoginSection';
import RouteDeckSection from './objects/RouteDeckSection';

const GAME_CONFIG = {
  width: 1920,
  height: 1080,
  parent: '#game',
  publicPath: '/'   //terminate wuth slash
}

class Game {
  constructor(gameConfig) {
    // this.render()
    this.rootSVG = new SVGWrapper.SVGRoot()
                            .size('100%', '100%')
                            .viewBox(0, 0, gameConfig.width, gameConfig.height)
                            .attr("preserveAspectRatio", "none")
                            .attachTo(gameConfig.parent)
    const defsObject = new SVGWrapper.SVGDefs().attachTo(this.rootSVG)
    this.rootSVG.data('defs', defsObject)
    this.boardRendered = false;
    this.gameConfig = gameConfig
    this.context = {}
    this.initEvents()
    initToast(this)
  }

  do(actionName, actionData=null) {
    this.socket.emit("do", actionName, actionData)
  }

  render(context) {
    document.title = `Ticket to Ride - ${context.me.name}`
    if(!this.boardRendered) 
      this.renderGameBoard()
    this.setContext(context)
  }

  renderGameBoard() {
    this.boardRendered = true
    this.cardDefs = TrainCard.drawCards(this.rootSVG)
    this.boardSection = new BoardSection(this)
    this.boardSection.render()
    this.closeDeckSection = new CloseDeckSection(this)
    this.openDeckSection = new OpenDeckSection(this)
    this.playerTrainSection = new PlayerTrainSection(this)
    this.playerRouteSection = new PlayerRouteSection(this)
    this.playersSection = new PlayersSection(this)
    this.routeDeckSection = new RouteDeckSection(this)
  }

  setContext(context) {
    Object.assign(this.context, context)
    this.renderContext()
  }

  isGameOver() {
    return this.context.isGameOver && this.context.finalTurnCount == 0;
  }

  renderContext() {
    this.playersSection.render()
    this.closeDeckSection.setCards();
    this.openDeckSection.setCards();
    this.playerTrainSection.setCards();
    this.playerRouteSection.setTickets();
    this.routeDeckSection.setTickets();
    if(this.context.claimedSegments.length)
      this.boardSection.renderClaimedSegments();
  }

  
  initEvents() {
    const socket = io();

    let loginSection = null;
    const showLogin = ()=> {
      loginSection = new LoginSection(this)
      loginSection.render()  
    }

    const nextTurn = (newContext) => {
      this.setContext(newContext)
      const playerName = newContext.players[newContext.currentPlayerIndex].name;
      // this.playersSection.showTurnIcon();
      if(newContext.isGameOver) {
        if(newContext.finalTurnCount == 0) {
          this.showGameOver()
        }
        else {
          toast(this, `Final round. ${playerName}'s turn to play`)
        }
      }
      else {
        toast(this, `${playerName}'s turn to play`)
      }
    }

    socket.on("connect", ()=>{ 
      this.socket = socket; 
      setTimeout(()=>showLogin(), 500);
    });
    socket.on("startgame", (context)=>{
      loginSection.destroy();
      this.render(context)
    })
    socket.on("resumegame", (context)=>{
      loginSection.destroy();
      this.render(context)
    })
    socket.on("next-turn", nextTurn)

  } //end initSocket
} //end class Game

new Game(GAME_CONFIG);

