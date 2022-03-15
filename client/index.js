import BoardSection from './objects/BoardSection';
import "./css/main.css";
import TrainCard from './objects/TrainCard';
import CloseDeckSection from './objects/CloseDeckSection';
import OpenDeckSection from './objects/OpenDeckSection';
import * as SVGWrapper from './objects/SVGWrapper';
import { io } from 'socket.io-client';
import { initToast } from './helpers/game_helper';
import PlayerTrainSection from './objects/PlayerTrainSection';
import PlayerRouteSection from './objects/PlayerRouteSection';

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
                            .attachTo(gameConfig.parent)
    const defsObject = new SVGWrapper.SVGDefs().attachTo(this.rootSVG)
    this.rootSVG.data('defs', defsObject)
    this.boardRendered = false;
    this.gameConfig = gameConfig
    this.context = {}
    this.initSocket()
    initToast(this)
  }

  do(actionName, actionData=null) {
    this.socket.emit("do", actionName, actionData)
  }

  render(context) {
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
  }

  setContext(context) {
    Object.assign(this.context, context)
    this.renderContext()
  }

  isGameOver() {
    return this.context.isGameOver && this.context.finalTurnCount == 0;
  }

  renderContext() {
    this.closeDeckSection.setCards();
    this.openDeckSection.setCards();
    this.playerTrainSection.setCards();
    this.playerRouteSection.setTickets();
    // this.routeDeckSection.setTickets();
    // if(this.context.claimedSegments.length)
    //   this.boardSection.renderClaimedSegments();
  }

  doLogin() {
    this.socket.emit("login", "Player 1", 1, res=> {
      if(res.status != "ok") {
        alert(res.reason)
        window.location.reload();
      }
    })
  }

  initSocket() {
    const socket = io();
    socket.on("connect", ()=>{ 
      this.socket = socket; 
      setTimeout(()=>this.doLogin(), 500);
    });
    socket.on("startgame", (context)=>{
      this.render(context)
    })
    socket.on("resumegame", (context)=>{
      console.log("resume game")
      this.render(context)
    })
  } //end initSocket
} //end class Game

new Game(GAME_CONFIG);

