const TWEEN_DURATION = 1000

const CARD_WIDTH = 150
const CARD_HEIGHT = 100
import cardBlack from "../assets/card-black.jpg";
import cardBlue from "../assets/card-blue.jpg";
import cardGreen from "../assets/card-green.jpg";
import cardOrange from "../assets/card-orange.jpg";
import cardPurple from "../assets/card-purple.jpg";
import cardRainbow from "../assets/card-rainbow.jpg";
import cardRed from "../assets/card-red.jpg";
import cardWhite from "../assets/card-white.jpg";
import cardYellow from "../assets/card-yellow.jpg";
import cardClosed from "../assets/card-closed.svg";
import * as SVGWrapper from "./SVGWrapper";

const COLOR_CARDS = {
  black: cardBlack,
  blue: cardBlue,
  green: cardGreen,
  orange: cardOrange,
  purple: cardPurple,
  rainbow: cardRainbow,
  red: cardRed,
  white: cardWhite,
  yellow: cardYellow,
  closed: cardClosed
}

export default class TrainCard {
  constructor(game, color, open ) {
    this.game = game;
    this.color = color == 'dummy' ? 'closed' : color;
    this.location = null;
    this.open = open
    this.isInteractive = false;
    this.init()
  }

  static drawCards(rootSVG) {
    const cards = {}
    const rootDef = rootSVG.data('defs')
    Object.keys(COLOR_CARDS).forEach(color=>{
      const c = new SVGWrapper.SVGImage(COLOR_CARDS[color])
                  .attachTo(rootDef)
                  .size(CARD_WIDTH, CARD_HEIGHT)
                  .id('card-'+color)
      cards[color] = c
    })
    return cards;
  }

  init() {
    const { rootSVG, cardDefs } = this.game

    this.openCard = cardDefs[this.color]
    this.closeCard = cardDefs.closed
    this.image = new SVGWrapper.SVGUse(this.open ? this.openCard : this.closeCard)
                  .attachTo(rootSVG)
                  .move(0,0)
  }

  setLocation(location) {
    this.location = location;
  }

  static get width() {
    return CARD_WIDTH;
  }

  static get height() {
    return CARD_HEIGHT
  }  

  get width() {
    return CARD_WIDTH;
  }

  get height() {
    return CARD_HEIGHT;
  }

  setPosition(x, y, open) {
    this.show(open)
    this.image.move(x,y)
  }

  get x() {
    return this.image.x();
  }

  get y() {
    return this.image.y();
  }
  
  hide() {
    this.image.hide();
    return this;
  }
 
  visible() {
    this.image.visible();
    return this;
  }

  destroy() {
    if(this.image) {
      this.removeInteractive()
      this.image.remove()
      this.image = null;
    }
  }

  hasImage() {
    return this.image != null;
  }

  show(open) {
    const { rootSVG } = this.game
    if((open && !this.open) || (!open && this.open)) {
      const hasInteraction = this.isInteractive;  //as destroy kills it
      this.destroy()
      this.image = new SVGWrapper.SVGUse(open ? this.openCard : this.closeCard)
                                  .attachTo(rootSVG)
      if(hasInteraction) this.setInteractive()
    }
    this.image.bringToFront()
    this.open = open
  }

  setInteractive() {
    if(this.isInteractive) return this; //nothing to do
    this.isInteractive = true;
    const clickEvent = new CustomEvent('card-click', { detail: this })
    this.image.addListener("click", ()=>document.dispatchEvent(clickEvent))
    const mouseOverEvent = new CustomEvent('card-mouseover', { detail: this })
    this.image.addListener("mouseover", ()=>document.dispatchEvent(mouseOverEvent))
    const mouseOutEvent = new CustomEvent('card-mouseout', { detail: this })
    this.image.addListener("mouseout", ()=>document.dispatchEvent(mouseOutEvent))
    return this;
  }
  
  removeInteractive() {
    this.image.removeListener("click")
    this.image.removeListener("mouseenter")
    this.image.removeListener("mouseout")
    this.isInteractive = false
  }

  async moveTo(x, y, open) {
    this.show(open);
    if(this.scene.gamePaused) {
      //tweens will not work on browser minimize, as requestAnimationFrame is paused
      return this.image.setPosition(x,y)
    }
    this.image.disableInteractive()
    return new Promise(resolve=>this.scene.tweens.add({
                              targets: this.image,
                              duration: TWEEN_DURATION,
                              x,
                              y,
                              onComplete: ()=>{
                                if(this.image){
                                  this.image.setInteractive()
                                }
                                resolve(true)
                              }
                            })
    );
  }

}
