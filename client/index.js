import BoardSection from './objects/BoardSection';
import "./css/main.css";
import TrainCard from './objects/TrainCard';
import CloseDeckSection from './objects/CloseDeckSection';
import OpenDeckSection from './objects/OpenDeckSection';
import * as SVGWrapper from './objects/SVGWrapper';

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
    this.render()
  }

  render() {
    this.cardDefs = TrainCard.drawCards(this.rootSVG)
    this.boardSection = new BoardSection(this)
    this.boardSection.render()
    this.closeDeckSection = new CloseDeckSection(this)
    this.closeDeckSection.setCards();
    this.openDeckSection = new OpenDeckSection(this)
    this.openDeckSection.setCards();
  }

}

new Game(GAME_CONFIG);

