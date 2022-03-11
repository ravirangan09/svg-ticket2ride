const BOARD_WIDTH = 1594
const BOARD_HEIGHT = 920
const LEFT = 150
const TOP = 0
import clone from 'rfdc/default';
import textLocations from '../data/textlocations.json';
import routes from "../data/routes.json";
import mapBackground from "../assets/watercolor-europe-t2r.jpg"
import * as SVGWrapper from './SVGWrapper';


const dist = (x1, y1, x2, y2)=>Math.sqrt((x2-x1)**2 + (y2-y1)**2)
const rad2deg = r=>r*180.0/Math.PI
const deg2rad = d=>d*Math.PI/180.0

const COLOR_MAP = { black: '#3A535D', gray: '#A8A8A8', white: '#E5E6EA', 
                    green: '#86C247', purple: '#BD7394', orange: '#E5913A',
                    blue: '#00ADED', yellow: '#FFE650', red: '#CB2926' }


class BoardSection {
  constructor(game) {
    this.game = game
    this.routes = clone(routes)
  }

  render() {
    this.renderBackground()
    this.renderLocations()
    this.renderRoutes()
  }

  renderBackground() {
    const { rootSVG } = this.game
    new SVGWrapper.SVGImage(mapBackground)
                          .size(BOARD_WIDTH, BOARD_HEIGHT)
                          .attachTo(rootSVG)
                          .move(LEFT, TOP)

  }

  renderSegment(lineSegment, routeIndex) {
    const { rootSVG } = this.game
    const { x1, y1, x2, y2, color, index } = lineSegment;

    const width = dist(x1, y1, x2, y2)
    const height = 16;
    const theta = Math.atan((y2-y1)/(x2-x1))
    const x = LEFT + (x2 > x1 ? x1: x2);
    const y = TOP + (x2 > x1 ? y1 : y2) - height/2;

    const rect = new SVGWrapper.SVGRect(width, height)
                      .attachTo(rootSVG)
                      .fill(COLOR_MAP[color])
                      .stroke("black")
                      .cornerRadius(4)
                      .move(x, y)
                      .rotate(rad2deg(theta), x, y+height/2)

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
    const { rootSVG } = this.game
    const pinBounds = textLocations[place].pinBounds
    const x = LEFT + (pinBounds.left + pinBounds.right)/2;
    const y = TOP + (pinBounds.top + pinBounds.bottom)/2;
    //outer circle
    new SVGWrapper.SVGCircle(pinBounds.width/2).fill("#fff").stroke("#000").move(x,y).attachTo(rootSVG)
    new SVGWrapper.SVGCircle(pinBounds.width/2-4).fill("#000").move(x,y).attachTo(rootSVG)
  }

  renderLocations() {
    const { rootSVG } = this.game
    for(const place in textLocations) {
      const { left, top } = textLocations[place].labelBounds;
      const x = left + LEFT;
      const y = top + TOP;
      new SVGWrapper.SVGText(place)
                  .attachTo(rootSVG)
                  .attr("dominant-baseline", "hanging")
                  .attr("font-size", "18px")
                  .move(x, y)

      this.renderPin(place)
    }
  }
}

export default BoardSection
