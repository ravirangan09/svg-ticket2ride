const BOX_WIDTH = 150
const BOX_HEIGHT = 100
const BG_COLOR = "#F2E58F"
const TWEEN_DURATION = 250
import * as SVGWrapper from "./SVGWrapper";

export default class RouteTicket {
  constructor(game, source, target, value, open) {
    this.game = game;
    this.source = source;
    this.target = target;
    this.value = value;
    this.open = open
    this.init()
  }

  static get boxWidth() {
    return BOX_WIDTH;
  }

  init() {
    const { rootSVG } = this.game;

    const group = new SVGWrapper.SVGGroup()
                        .attachTo(rootSVG)

    new SVGWrapper.SVGRect(BOX_WIDTH, BOX_HEIGHT)
                                    .move(0, 0)
                                    .fill("white")
                                    .attachTo(group)

    new SVGWrapper.SVGRect(BOX_WIDTH-10, BOX_HEIGHT-10)
                                    .move(5, 5)
                                    .fill(BG_COLOR)
                                    .attachTo(group)

    const color = this.value < 20 ? "#a52a2a" : "#4682b4";
    new SVGWrapper.SVGText(this.source+' \u2193')
                                  .attr("dominant-baseline", "hanging")
                                  .attr("font-size", "15px")
                                  .fill(color)
                                  .move(10, 15)
                                  .attachTo(group)

    const targetText = new SVGWrapper.SVGText('\u2191 '+this.target)
                                  .attr("dominant-baseline", "hanging")
                                  .attr("font-size", "15px")
                                  .fill(color)
                                  .move(10, BOX_HEIGHT-10)
                                  .attachTo(group)
    
    const bbox = targetText.bbox()
    targetText.x(BOX_WIDTH - 10 - bbox.width)
              .y(BOX_HEIGHT - 40 - bbox.height)

    const str = ` ${this.value} `;

    const bgRect = new SVGWrapper.SVGRect(10, 10)
                          .move(10, 10)
                          .fill(color)
                          .attachTo(group)

    const valueText = new SVGWrapper.SVGText(str)
                                  .attr("dominant-baseline", "hanging")
                                  .attr("font-size", "20px")
                                  .fill("white")
                                  .move(15, 15)
                                  .attachTo(group)
    const valueBBox = valueText.bbox()
    valueText.move(15, BOX_HEIGHT - 3 - valueBBox.height)
    bgRect.size(10+valueBBox.width, valueBBox.height+5)
          .move(10, BOX_HEIGHT - valueBBox.height - 10)

    // const discardImage = this.scene.add.image(BOX_WIDTH/2-20, BOX_HEIGHT/2-20, 'cancel')
    //                         .setVisible(false)
    //                         .setInteractive()
    //                         .setData('discard', this)

    this.openObject = group
    // this.closeObject = this.scene.add.image(0, 0, 'route-closed')
    //                           .setDisplaySize(BOX_WIDTH, BOX_HEIGHT)
    //                           .setVisible(false)
    //                           .setData('ticket', this)
    //                           .setInteractive()
  }

  get width() {
    return BOX_WIDTH;
  }

  get height() {
    return BOX_HEIGHT;
  }

  get x() {
    if(this.open)
      return this.openObject.x()
    else
      return this.closeObject.x();
  }

  get y() {
    if(this.open)
      return this.openObject.y()
    else
      return this.closeObject.y();
  }

  isSame(ticket) {
    return this.source == ticket.source && this.target == ticket.target;
  }

  setLocation(location) {
    this.location = location;
  }

  hasImage() {
    return this.openObject != null;
  }
  
  get image() {
    return this.open ? this.openObject : this.closeObject;
  }

  setDiscard(isVisible) {
    this.openObject.children[5].setVisible(isVisible)
  }

  setCompleted(isCompleted) {
    this.openObject.children[2].fill(isCompleted ? "green" : "#a52a2a")
    this.openObject.children[3].fill(isCompleted ? "green" : "#a52a2a")
  }

  toJSON() {
    return {
      source: this.source,
      target: this.target,
      score: this.value
    }
  }

  destroy() {
    if(this.openObject) {
      this.removeInteractive()
      this.closeObject.remove()
      this.openObject.remove()
      this.openObject = null;
      this.closeObject = null;
    }
  }

  setInteractive() {
    if(this.isInteractive) return this; //nothing to do
    this.isInteractive = true;
    const clickEvent = new CustomEvent('ticket-click', { detail: this })
    this.image.addListener("click", ()=>document.dispatchEvent(clickEvent))
    const mouseOverEvent = new CustomEvent('ticket-mouseover', { detail: this })
    this.image.addListener("mouseover", ()=>document.dispatchEvent(mouseOverEvent))
    const mouseOutEvent = new CustomEvent('ticket-mouseout', { detail: this })
    this.image.addListener("mouseout", ()=>document.dispatchEvent(mouseOutEvent))
    return this;
  }
  
  removeInteractive() {
    if(!this.isInteractive) return this;  //noting to do
    this.image.removeListener("click")
    this.image.removeListener("mouseover")
    this.image.removeListener("mouseout")
    this.isInteractive = false
  }

  async setPosition(x, y, open=true) {
    this.show(open)
    this.openObject.move(x, y)
    // this.closeObject.move(x, y)
  }

  hide() {
    // this.closeObject.hide()
    this.openObject.hide()
  }

  show(open) {
    if((open && !this.open) || (!open && this.open)) {
      if(open) {
        this.openObject.visible().bringToFront()
        // this.closeObject.hide()
      }
      else {
        // this.closeObject.visible().bringToFront()
        this.openObject.hide()
      }
    }
    this.open = open
  }

  async moveTo(x, y, open) {
    this.show(open);
    const o = open ? this.openObject : this.closeObject;
    const no = open ? this.closeObject : this.openObject;
    o.disableInteractive()
    if(this.scene.gamePaused) {
      //tweens will not work on browser minimize, as requestAnimationFrame is paused
      return o.setPosition(x,y)
    }

    return new Promise(resolve=>this.scene.tweens.add({
                              targets: o,
                              duration: TWEEN_DURATION,
                              x,
                              y,
                              onComplete: ()=>{
                                o.setInteractive()
                                no.setPosition(x, y)
                                resolve(true)
                              }
                            })
    );
  }

}
