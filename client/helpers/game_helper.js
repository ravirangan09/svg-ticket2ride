import * as SVGWrapper from "../objects/SVGWrapper";
export const renderHighlightRect = (width, height, parent) => {
  return new SVGWrapper.SVGRect(width, height)
  .stroke("#00FF00", 6)
  .fill("none")
  .attachTo(parent)
  .hide()
  .attr("pointer-events", "none") //IMPORTANT - as no mouse action should work

}

export const toast = (game, msg) => {
  const { toastText, toastRect, gameConfig } = game
  toastRect.visible().bringToFront()
  toastText.text(msg).visible().bringToFront()
  const bbox = toastText.bbox()
  toastRect.width(bbox.width+20)
  let x = (gameConfig.width - toastRect.width())/2
  toastRect.x(x)
  x = toastRect.x()+(toastRect.width()-bbox.width)/2
  toastText.x(x)
  setTimeout(()=>{
    toastText.hide()
    toastRect.hide()
  }, 3000)
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
                        .attachTo(game.rootSVG)
                        .hide()
  const bbox = text.bbox()
  text.y(y+(BOX_HEIGHT-bbox.height)/2)
  text.x(x+(BOX_WIDTH-bbox.width)/2)
  game.toastText = text
  return true
}