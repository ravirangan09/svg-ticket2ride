// import Button from "./Button"
import { button } from "../helpers/game_helper";
import * as SVGWrapper from "./SVGWrapper";

const TOP = 20
const LEFT = 20

const BOX_WIDTH = 110
const BOX_HEIGHT = 100
const GUTTER = 20

export default class PlayersSection {

  constructor(game) {
    this.game = game
    this.location = "allplayers"
    this._groups = []
    this.initEvents();
  }

  renderPlayer(player) {
    const { rootSVG } = this.game;

    const group = new SVGWrapper.SVGGroup()
                      .attachTo(rootSVG)
          
                        

    new SVGWrapper.SVGRect(BOX_WIDTH, BOX_HEIGHT)
                      .move(0, 0)
                      .stroke("#0CF")
                      .attachTo(group)


    const color = "white";
    new SVGWrapper.SVGText(player.name)
                          .attr("dominant-baseline", "hanging")
                          .move(15, 10)
                          .fill(color) 
                          .attr("font-size", "14px")
                          .attachTo(group)

    new SVGWrapper.SVGRect(16, 16)
                                .fill(player.color)
                                .move(BOX_WIDTH - 25, 10)
                                .attachTo(group)
                  

    const coinsText = new SVGWrapper.SVGText(player.coins)
                                .fill("orange")
                                .attr("dominant-baseline", "middle")
                                .move(BOX_WIDTH - 30, BOX_HEIGHT - 20)
                                .attachTo(group)
    group.data("coinsText", coinsText)
    const bbox = coinsText.bbox()
    coinsText.x(BOX_WIDTH - bbox.width - 10)
    const turnIcon = new SVGWrapper.SVGPolygon([[5,7], [5, 23], [13,15]])
                                  .fill("#0f0")
                                  .attachTo(group)
    group.data("turnIcon", turnIcon)
    
    return group;
  }

  showTurnIcon() {
    const context = this.game.context;
    for(const index in this._groups) {
      this._groups[index].data("turnIcon").setVisible(index == context.currentPlayerIndex)
    }
  }

  async moveCard(card, playerIndex) {
    const x = LEFT
    const y = TOP + (card.height+GUTTER)*playerIndex
    await card.moveTo(x, y, false)
    card.destroy()
  }

  async moveTicket(ticket, playerIndex) {
    const x = LEFT
    const y = TOP + (ticket.height+GUTTER)*playerIndex
    await ticket.moveTo(x, y, false)
    ticket.destroy()
  }

  updateCurrentPlayerCoins() {
    const context = this.game.context;
    const player = context.players[context.currentPlayerIndex]
    const coinsText = this._groups[context.currentPlayerIndex].data("coinsText")
    coinsText.text = player.coins.toString()
    const bbox = coinsText.bbox()
    coinsText.x(BOX_WIDTH - bbox.width - 10)
  }

  renderAdditionalButtons() {
    const { rootSVG } = this.game;
    const playerCount = this.game.context.players.length
    const  x = LEFT;
    let y = TOP + playerCount*(BOX_HEIGHT+GUTTER) + GUTTER;

    this.scoreButton = button(rootSVG, "My Score", BOX_WIDTH, { action: "scores" })
                        .move(x, y)
                        .data("y", y) //as groups do not have y attribute
  }

  showScores(scores) {
    const { context, rootSVG } = this.game;
    const  x = LEFT;
    let y = this.scoreButton.data("y")+60;
    const {name, score } = scores.find(s=>s.name == context.me.name)
    const textObject = new SVGWrapper.SVGText(`${name}: ${score}`)
                          .attr("font-size", "16px")
                          .attr("dominant-baseline", "middle")
                          .fill("white")
                          .move(x, y)
                          .attachTo(rootSVG)

    setTimeout(()=>textObject.remove(), 5000)
  }

  render() {
    const players = this.game.context.players
    const  x = LEFT;
    let y = TOP;
    this._groups = []
    for(let p of players) {
      const group = this.renderPlayer(p)
      group.move(x, y)
      y += BOX_HEIGHT + GUTTER
      this._groups.push(group)
    }
    this.showTurnIcon()
    this.renderAdditionalButtons();
  } //end render

  async moveCardToClose(playerIndex) {
    const closeDeckSection = this.game.closeDeckSection;
    const card = closeDeckSection.popCard()
    const x = LEFT
    const y = TOP + (card.height+GUTTER)*playerIndex
    card.setPosition(x, y, false);
    await closeDeckSection.moveCard(card)
    card.destroy() 
  }

  initEvents() {
    const { socket } = this.game;
    const getScores = (e)=>{
      const action = e.detail.action
      if(action == "scores") {
        socket.emit("scores", (scores)=>{
          this.showScores(scores)
        })
      }
    }
    document.addEventListener("button-click", getScores)
  }

}

