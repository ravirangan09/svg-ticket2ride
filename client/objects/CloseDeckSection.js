import TrainCard from "./TrainCard"
const TOP = 20
const LEFT = (150+1594+20)

const SECTTON_HEIGHT = 120
const SECTION_WIDTH = 170

export default class CloseDeckSection {

  constructor(game) {
    this.game = game;
    this.location = 'closedeck';
    this.deck = []
    // this.initEvents();
  }

  popCard() {
    return this.deck.length ? this.deck.pop() : null;
  }

  async moveCard(card) {
    const firstCard = this.deck[0]
    const x = LEFT + firstCard.width/2
    const y = TOP + firstCard.height/2
    await card.moveTo(x, y, false)
  }

  cleanup() {
    this.deck.forEach(c=>c.hasImage() && c.destroy())
    delete this.deck
  }

  setCards() {
    // const cards = this.scene.context.closeDeck;
    const cards = ['yellow', 'yellow', 'yellow'];
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
      const card = new TrainCard(this.game, color, false)
      if(i < oldLength)
        this.deck[i] = card;  //new card
      else
        this.deck.push(card)
    }
    this.deck.length = newLength;
    this.render()
  }
 
  render() {
    const x = LEFT
    const y = TOP
    for(let card of this.deck) {
      card.setPosition(x, y, false)
      card.setLocation(this.location)
    }
  }

  initEvents() {
    const scene = this.scene
    const graphics = scene.add.graphics()
    const { context, input, socket, events } = scene

    const canDoAction = () => {
      if(scene.isGameOver()) return false;
      if(!context.myTurn) return false;
      if(context.actionCount == 0) return true;
      if(context.actionCount >= 2 ) return false;
      if(context.prevCard == 'rainbow') return false;
      return context.actionName == "move-open-card-to-player" || 
        context.actionName == "move-close-card-to-player";
    }

    const gameObjectOver = (pointer, gameObject)=>{
      const card = gameObject.getData('card')
      if(canDoAction() && card && card.location == this.location) {
        graphics.clear()
        graphics.lineStyle(8, 0x00FF00)
        graphics.strokeRect(card.left, card.top, card.width, card.height)
      }
    }

    const gameObjectOut = (pointer, gameObject)=>{
      const card = gameObject.getData('card')
      if(card && card.location == this.location) {
        graphics.clear()
      }
    }

    let inProgress = false;

    const doMoveAction = async (newContext) => {
      const topCard = this.popCard()
      if(context.myTurn) {
        const movedCard = newContext.me.cards.at(-1)
        if(movedCard != topCard.color) {
          throw new Error(`Mismatch in color ${movedCard} ${topCard.color}`)
        }
        await scene.playerTrainSection.moveCard(topCard)
      }
      else {
        await scene.playersSection.moveCard(topCard, context.currentPlayerIndex)
      }
      scene.setContext(newContext)
      inProgress = false;
    }

    const sendAction = () => {
      inProgress = true;
      scene.do("move-close-card-to-player")
    }

    const gameObjectDown = async (pointer, gameObject)=>{
      if(inProgress) return false;
      const card = gameObject.getData('card')
      if(canDoAction() && card && card.location == this.location) {
        graphics.clear()
        sendAction()
      }
    }

    input.on("gameobjectover", gameObjectOver)
    input.on("gameobjectout", gameObjectOut);
    input.on("gameobjectdown", gameObjectDown);
    socket.on("move-close-card-to-player", doMoveAction);

    const shutdown = ()=>{
      this.cleanup()
      events.off("shutdown", shutdown)
      input.off("gameobjectover", gameObjectOver)
      input.off("gameobjectout", gameObjectOut)
      input.off("gameobjectdown", gameObjectDown);
      socket.off("move-close-card-to-player", doMoveAction);
    }

    events.on("shutdown", shutdown);
  }
}
