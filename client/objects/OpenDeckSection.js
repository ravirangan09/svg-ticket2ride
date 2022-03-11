import TrainCard from "./TrainCard"
import * as SVGWrapper from "./SVGWrapper";

const TOP = 160
const LEFT = (150+1594+20)

const GUTTER = 20


export default class OpenDeckSection {

  constructor(game) {
    this.game = game
    this.location = 'opendeck';
    this.deck = []
    this.initEvents();
  }

  async setCards() {
    const cards = this.game.context.openDeck;
    const oldLength = this.deck.length;
    const newLength = cards.length;

    const count = Math.max(newLength, oldLength)
    for(let i=0;i<count;i++) {
      if(i >= newLength) {
        //remove it from deck
        this.deck[i].destroy();
        this.deck[i] = null;
        continue;
      }
      const color = cards[i]
      if(i < oldLength) {
        if(color == this.deck[i].color && this.deck[i].hasImage()) continue; //same color, keep it
        this.deck[i].destroy()  //diff color destroy
      }
      const card = new TrainCard(this.game, color, true)
                      .setInteractive()
      if(i < oldLength)
        this.deck[i] = card;  //new card
      else
        this.deck.push(card)
    }
    this.deck.length = newLength;
    this.render()
  }

  cleanup() {
    this.deck.forEach(c=>c.hasImage() && c.destroy())
    delete this.deck
  }

  render() {
    const firstCard = this.deck[0]
    const x = LEFT
    for(let i=0;i<5;i++) {
      const card = this.deck[i]
      let y = TOP + (firstCard.height + GUTTER)*i
      card.setPosition(x, y, true)
      card.setLocation(this.location)
    }
  }

  initEvents() {
    const game = this.game
    const { rootSVG, socket, context } = game;
    let inProgress = false;
    let highlightRect = new SVGWrapper.SVGRect(TrainCard.width, TrainCard.height)
                            .stroke("#00FF00", 6)
                            .fill("none")
                            .attachTo(rootSVG)
                            .hide()
                            .attr("pointer-events", "none") //IMPORTANT - as no mouse action should work

    const canDoAction = () => {
      // if(scene.isGameOver()) return false;
      if(!context.myTurn) return false;
      if(context.actionCount == 0) return true;
      if(context.actionCount >= 2) return false;
      if(context.prevCard == 'rainbow') return false;   //if user chooses rainbow only one trial
      return context.actionName == "move-open-card-to-player" || 
        context.actionName == "move-close-card-to-player";
    }

    const cardMouseOver= (e)=>{
      const card = e.detail
      if(canDoAction() && card && card.location == this.location) {
        highlightRect.move(card.x, card.y).visible().bringToFront();
      }
    }

    const cardMouseOut = (e)=>{
      const card = e.detail
      console.log("mouse out")
      if(card && card.location == this.location) {
        highlightRect.hide()
      }
    }

    const doMoveAction = async (newContext) => {
      const cardPos = newContext.actionData
      const card = this.deck[cardPos]
      if(context.myTurn) {
        await scene.playerTrainSection.moveCard(card)
      }
      else {
        await scene.playersSection.moveCard(card, context.currentPlayerIndex)
      }
      scene.setContext(newContext)
      inProgress = false;
    }

    const sendAction = (card) => {
      if(card.color == 'rainbow' && context.actionCount == 1) {
        // toast(scene, 'Nice try !')
        return false;
      }
      inProgress = true;
      const cardPos = this.deck.indexOf(card)
      scene.do("move-open-card-to-player", cardPos)
    }

    const gameObjectDown = async (pointer, gameObject)=>{
      if(inProgress) return false;
      const card = gameObject.getData('card')
      if(canDoAction() && card && card.location == this.location) {
        graphics.clear()
        sendAction(card)
      }
    }

    // document.on("card-mouseover", gameObjectOut);
    document.addEventListener("card-mouseover", cardMouseOver)
    document.addEventListener("card-mouseout", cardMouseOut)
    // input.on("gameobjectdown", gameObjectDown);
    // socket.on("move-open-card-to-player", doMoveAction);

    const shutdown = ()=>{
      this.cleanup()
      events.off("shutdown", shutdown)
      input.off("gameobjectover", gameObjectOver)
      input.off("gameobjectout", gameObjectOut)
      input.off("gameobjectdown", gameObjectDown)
      socket.off("move-open-card-to-player", doMoveAction);
    }

    // events.on("shutdown", shutdown);
  }

}
