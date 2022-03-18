const BOARD_WIDTH = 1594
const BOARD_HEIGHT = 920
const LEFT = 150
const TOP = 0
import clone from 'rfdc/default';
import textLocations from '../data/textlocations.json';
import routes from "../data/routes.json";
import mapBackground from "../assets/watercolor-europe-t2r.jpg"
import * as SVGWrapper from './SVGWrapper';
import { clamp } from '../helpers/game_helper';

const pinObjects = {} 
const dist = (x1, y1, x2, y2)=>Math.sqrt((x2-x1)**2 + (y2-y1)**2)
const rad2deg = r=>r*180.0/Math.PI

const COLOR_MAP = { black: '#3A535D', gray: '#A8A8A8', white: '#E5E6EA', 
                    green: '#86C247', purple: '#BD7394', orange: '#E5913A',
                    blue: '#00ADED', yellow: '#FFE650', red: '#CB2926' }


class BoardSection {
  constructor(game) {
    this.game = game
    this.routes = clone(routes)
    this.initEvents()
  }

  getRoute(routeIndex) {
    return this.routes[routeIndex]
  }

  renderClaimedSegments() {
    const context = this.game.context;
    context.claimedSegments.forEach(s=>this.renderCoin(s.coinColor, s.routeIndex, s.index))
  }

  async renderCoinWithAnimation(coinColor, routeIndex, index) {
    const coin = this.renderCoin(coinColor, routeIndex, index)
    await coin.animateScale(3, 1000)
  }

  renderCoin(coinColor, routeIndex, index) {
    const COIN_DIM = 16
    const segment = this.routes[routeIndex][index];
    segment.coinColor = coinColor
    const { x1, y1, x2, y2} = segment;
    const x = LEFT + (x1+x2)/2
    const y = TOP + (y1+y2)/2

    return new SVGWrapper.SVGRect(COIN_DIM, COIN_DIM)
          .move(x-COIN_DIM/2, y-COIN_DIM/2)
          .fill(coinColor)
          .stroke("black")
          .attachTo(this.boardGroup)
          .rotate(rad2deg(segment.theta), x, y)
  }
  
  async highlightLocation(place) {
    const pin = pinObjects[place];
    pin.bringToFront().fill("#0f0")
    await pin.animateScale(3, 2000)
    pin.fill("black")
  }

  render() {

    const { rootSVG } = this.game
    const defsObject = rootSVG.data('defs')
    new SVGWrapper.SVGRectClipPath(BOARD_WIDTH, BOARD_HEIGHT, LEFT, TOP)
                            .id("board-clip")
                            .attachTo(defsObject) 
                            .attr("clipPathUnits", "userSpaceOnUse")

    const parentGroup = new SVGWrapper.SVGGroup()
                            .attachTo(rootSVG)
                            .attr("clip-path", "url(#board-clip)")
    this.boardGroup =  new SVGWrapper.SVGGroup()
                            .attachTo(parentGroup)
              
    this.renderBackground()
    this.renderLocations()
    this.renderRoutes()
  }

  renderBackground() {
    new SVGWrapper.SVGImage(mapBackground)
                          .size(BOARD_WIDTH, BOARD_HEIGHT)
                          .attachTo(this.boardGroup)
                          .move(LEFT, TOP)

  }

  renderSegment(lineSegment, routeIndex) {
    const { x1, y1, x2, y2, color, index } = lineSegment;

    const width = dist(x1, y1, x2, y2)
    const height = 16;
    const theta = Math.atan((y2-y1)/(x2-x1))
    const x = LEFT + (x2 > x1 ? x1: x2);
    const y = TOP + (x2 > x1 ? y1 : y2) - height/2;

    const rect = new SVGWrapper.SVGRect(width, height)
                      .attachTo(this.boardGroup)
                      .fill(COLOR_MAP[color])
                      .stroke("black")
                      .cornerRadius(4)
                      .move(x, y)
                      .rotate(rad2deg(theta), x, y+height/2)

    const clickEvent = new CustomEvent('segment-click', { detail: rect })
    rect.addListener("click", ()=>document.dispatchEvent(clickEvent))
                  
    rect.data({ routeIndex, index, color })
    this.routes[routeIndex][index].theta = theta
    this.routes[routeIndex][index].coinColor = null
  }

  renderRoutes() {
    for(const routeIndex in routes) {
      const route = routes[routeIndex]
      route.forEach(s=>this.renderSegment(s, parseInt(routeIndex)));
    }
  }

  renderPin(place) {
    const pinBounds = textLocations[place].pinBounds
    const x = LEFT + (pinBounds.left + pinBounds.right)/2;
    const y = TOP + (pinBounds.top + pinBounds.bottom)/2;
    //outer circle
    new SVGWrapper.SVGCircle(pinBounds.width/2)
          .fill("#fff")
          .stroke("#000")
          .move(x,y)
          .attachTo(this.boardGroup)
    pinObjects[place] = new SVGWrapper.SVGCircle(pinBounds.width/2-4)
          .fill("#000")
          .stroke("black")
          .move(x,y)
          .scale(1, x, y) //needed for highlight-location transform-origin
          .attachTo(this.boardGroup)
  }

  renderLocations() {
    for(const place in textLocations) {
      const { left, top } = textLocations[place].labelBounds;
      const x = left + LEFT;
      const y = top + TOP;
      new SVGWrapper.SVGText(place)
                  .attachTo(this.boardGroup)
                  .attr("dominant-baseline", "hanging")
                  .attr("font-size", "18px")
                  .move(x, y)

      this.renderPin(place)
    }
  }

  initEvents() {
    let isZoomed = false
    const SCALE_FACTOR = 1.5
    let offsetX = 0
    let offsetY = 0

    const setZoom = () => {
      if(isZoomed) {
        isZoomed = false;
        return this.boardGroup.resetTransform()
                              .scale(1, LEFT, TOP)
      }
      isZoomed = true;
      offsetX = -(BOARD_WIDTH*SCALE_FACTOR - BOARD_WIDTH)/2;
      offsetY = -(BOARD_HEIGHT*SCALE_FACTOR - BOARD_HEIGHT)/2;
      this.boardGroup.resetTransform()
                            .translate(offsetX, offsetY)
                            .scale(SCALE_FACTOR, LEFT, TOP)
    }

    const pan = (panX, panY) => {
      if(!isZoomed) return false;

      offsetX = clamp(offsetX+panX, -(BOARD_WIDTH*SCALE_FACTOR - BOARD_WIDTH), 0)
      offsetY = clamp(offsetY+panY, -(BOARD_HEIGHT*SCALE_FACTOR - BOARD_HEIGHT), 0)

      this.boardGroup.resetTransform()
                            .translate(offsetX, offsetY)
                            .scale(SCALE_FACTOR, LEFT, TOP)
    }

    const keyDownHandler = (e)=> {  
      e.preventDefault()
      switch(e.key) {
      case 'z':
      case 'Z':
        setZoom();
        break;
      case 'ArrowUp':
        pan(0, 10)
        break;
      case 'ArrowDown':
        pan(0, -10)
        break;
      case 'ArrowLeft':
        pan(10, 0)
        break;
      case 'ArrowRight':
        pan(-10, 0)
        break;
      }
    }
    document.addEventListener("keydown", keyDownHandler)
  }
}

export default BoardSection
