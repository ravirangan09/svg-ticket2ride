import TrainCard from "./TrainCard"
const TOP = 20
const LEFT = (150+1594+20)

export default class CloseDeckSection {

  constructor(game) {
    this.game = game;
    this.location = 'closedeck';
    this.deck = []
    this.initEvents();
  }

  popCard() {
    return this.deck.length ? this.deck.pop() : null;
  }

  async moveCard(card) {
    const x = LEFT
    const y = TOP
    await card.moveTo(x, y, false)
  }

  setCards() {
    const cards = this.game.context.closeDeck;
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
    this.deck.at(-1).setInteractive() //set top card as interactive, and not anything else
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
    const game = this.game
    const { context, socket } = game

    const canDoAction = () => {
      if(game.isGameOver()) return false;
      if(!context.myTurn) return false;
      if(context.actionCount == 0) return true;
      if(context.actionCount >= 2 ) return false;
      if(context.prevCard == 'rainbow') return false;
      return context.actionName == "move-open-card-to-player" || 
        context.actionName == "move-close-card-to-player";
    }

    const cardMouseOver = (e)=>{
      const card = e.detail
      if(canDoAction() && card && card.location == this.location) {
        card.image.addClass("highlight-box")
      }
    }

    const cardMouseOut = (e)=>{
      const card = e.detail
      if(card && card.location == this.location) {
        card.image.removeClass("highlight-box")
      }
    }

    let inProgress = false;

    const doMoveAction = async (newContext) => {
      const topCard = this.popCard()
      console.log("tc ", topCard.image._node)
      if(context.myTurn) {
        const movedCard = newContext.me.cards.at(-1)
        if(movedCard != topCard.color) {
          throw new Error(`Mismatch in color ${movedCard} ${topCard.color}`)
        }
        await game.playerTrainSection.moveCard(topCard)
      }
      else {
        await game.playersSection.moveCard(topCard, context.currentPlayerIndex)
      }
      game.setContext(newContext)
      inProgress = false;
    }

    const sendAction = () => {
      inProgress = true;
      game.do("move-close-card-to-player")
    }

    const cardClick = async (e)=>{
      if(inProgress) return false;
      const card = e.detail
      if(canDoAction() && card && card.location == this.location) {
        card.image.removeClass("highlight-box")
        sendAction()
      }
    }

    document.addEventListener("card-mouseover", cardMouseOver)
    document.addEventListener("card-mouseout", cardMouseOut)
    document.addEventListener("card-click", cardClick)
    socket.on("move-close-card-to-player", doMoveAction);

  }
}
