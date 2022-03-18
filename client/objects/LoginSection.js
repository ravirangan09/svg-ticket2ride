import userList from "../data/userlist.json";
import { button } from "../helpers/game_helper";
import * as SVGWrapper from "../objects/SVGWrapper";
const LEFT = 30
const TOP = 60

export class LoginSection {
  constructor(game) {
    this.game = game
    this._buttons = []
    this.initEvents()
  }

  render() {
    const { rootSVG } = this.game;
    let y = TOP

    this._status = new SVGWrapper.SVGText("Welcome to Ticket to Ride")
                      .move(LEFT, y)
                      .attr("font-size", "24px")
                      .attr("dominant-baseline", "middle")
                      .fill("lightblue")
                      .attachTo(rootSVG)

    y += 30
    for(let userName of userList) {
      const b = button(rootSVG, userName, 100, { action: 'login', data: userName });
      b.move(LEFT, y)
      y += 50
      this._buttons.push(b)
    }

  }

  destroy() {
    this._buttons.forEach(b=>b.remove());
    this._status.remove()
  }

  initEvents() {
    const { socket } = this.game;

    const doLogin = (username) => {
      socket.emit("login", username, userList.length, res=>{
        if(res.status == "ok") {
          this._status.text(`${username} logged in successfully. Waiting for other users to join...`)
          this._buttons.forEach(b=>b.hide())
        }
        else {
          //failure; show reason
          this._status.text(res.reason);
        }
      })
    }

    const buttonClick = (e)=>{
      const { action, data } = e.detail
      if(action == "login") {
        doLogin(data)
      }
    } 
    document.addEventListener("button-click", buttonClick)
  } //end initEvents
}
