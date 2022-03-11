import TrainCard from "./TrainCard"

const TOP = 160
const LEFT = (150+1594+20)

const SECTTON_HEIGHT = 600
const SECTION_WIDTH = 170
const GUTTER = 20


export default class OpenDeckSection {

  constructor(game) {
    this.game = game
    this.location = 'opendeck';
    this.deck = []
    // this.initEvents();
  }

  async setCards() {
    const cards = ['green', 'yellow', 'red', 'rainbow', 'white'];
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
    const scene = this.scene
    const { input, events, socket, context } = scene;
    let inProgress = false;
    
    const graphics = scene.add.graphics()
    const canDoAction = () => {
      if(scene.isGameOver()) return false;
      if(!context.myTurn) return false;
      if(context.actionCount == 0) return true;
      if(context.actionCount >= 2) return false;
      if(context.prevCard == 'rainbow') return false;   //if user chooses rainbow only one trial
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
        toast(scene, 'Nice try !')
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

    input.on("gameobjectout", gameObjectOut);
    input.on("gameobjectover", gameObjectOver)
    input.on("gameobjectdown", gameObjectDown);
    socket.on("move-open-card-to-player", doMoveAction);

    const shutdown = ()=>{
      this.cleanup()
      events.off("shutdown", shutdown)
      input.off("gameobjectover", gameObjectOver)
      input.off("gameobjectout", gameObjectOut)
      input.off("gameobjectdown", gameObjectDown)
      socket.off("move-open-card-to-player", doMoveAction);
    }

    events.on("shutdown", shutdown);
  }

}
