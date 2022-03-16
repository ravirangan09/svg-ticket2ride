import * as SVGWrapper from "../objects/SVGWrapper";

const TOAST_TIMEOUT = 3000

export const clamp = (value, min, max) => value < min ? min : ( value > max ? max : value);

export const asyncSleep = async (time) => {
  return await (new Promise(resolve => setTimeout(resolve, time)));
}

export const button = (parent, label, width, actionData) => {
  const clickEvent = new CustomEvent('button-click', { detail: actionData })
  const group = new SVGWrapper.SVGGroup()
                      .addClass("game-button")
                      .attachTo(parent)
                      .addListener("click", ()=>document.dispatchEvent(clickEvent))
                      
  const buttonBox = new SVGWrapper.SVGRect(width,1)
                .move(0,0)
                .fill("#C0C0C0")
                .cornerRadius(4)
                .attachTo(group)

  const textObject = new SVGWrapper.SVGText(label)
                          .attr("dominant-baseline", "middle")
                          .attr("font-size", "16px")
                          .move(5, 5)
                          .attachTo(group)
  const bbox = textObject.bbox()
  buttonBox.size(width, 10+bbox.height)
  textObject.move((width-bbox.width)/2, 7 + bbox.height/2)
  return group
}

export const toast = (game, msg) => {
  const { toastText, toastRect, gameConfig } = game
  toastRect.visible().bringToFront()
  toastText.text(msg).visible().bringToFront()
  const bbox = toastText.bbox()
  toastRect.width(bbox.width+30)
  let x = (gameConfig.width - toastRect.width())/2
  toastRect.x(x)
  x = toastRect.x()+(toastRect.width()-bbox.width)/2
  toastText.x(x)
  setTimeout(()=>{
    toastText.hide()
    toastRect.hide()
  }, TOAST_TIMEOUT)
}

export const initToast = (game) => {
  const BOX_HEIGHT = 50
  const BOX_WIDTH = 100

  const x = game.gameConfig.width/2
  const y = game.gameConfig.height - BOX_HEIGHT*2

  game.toastRect = new SVGWrapper.SVGRect(BOX_WIDTH, BOX_HEIGHT)
                    .fill("#707070")
                    .cornerRadius(8)
                    .move(x, y)
                    .attachTo(game.rootSVG)
                    .hide()
  const text = new SVGWrapper.SVGText("Hello")
                        .move(x,y)
                        .fill("white")
                        .attr("dominant-baseline", "hanging")
                        .attr("font-size", "24px")
                        .attachTo(game.rootSVG)
                        .hide()
  const bbox = text.bbox()
  text.incY((BOX_HEIGHT-bbox.height)/2)
  text.x(x+(BOX_WIDTH-bbox.width)/2)
  game.toastText = text
  return true
}