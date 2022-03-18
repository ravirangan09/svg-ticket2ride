import { clamp, toast } from "../helpers/game_helper";
import RouteTicket from "./RouteTicket"
import * as SVGWrapper from "./SVGWrapper";

const TOP = 940
const LEFT = (1920/2+20)

const SECTION_HEIGHT = 110
const GUTTER = 5;
const VISIBLE_TICKETS = 6
const SCROLL_OFFSET = 40;

const SECTION_WIDTH = (VISIBLE_TICKETS*RouteTicket.boxWidth + VISIBLE_TICKETS*GUTTER + GUTTER)

export default class PlayerRouteSection {

  constructor(game) {
    this.game = game;
    this.location = 'playerroute';
    this.deck = []
    this.initScroll()
    this.initEvents();
  }

  initScroll() {
    const { rootSVG } = this.game
    const defsObject = rootSVG.data('defs')
    new SVGWrapper.SVGRectClipPath(SECTION_WIDTH, SECTION_HEIGHT, LEFT-GUTTER, TOP-GUTTER)
                            .id("ticket-clip")
                            .attachTo(defsObject) 
                            .attr("clipPathUnits", "userSpaceOnUse")

    const parentGroup = new SVGWrapper.SVGGroup()
                            .attachTo(rootSVG)
                            .attr("clip-path", "url(#ticket-clip)")

    this.ticketGroup = new SVGWrapper.SVGGroup()
                            .attachTo(parentGroup)

                            
    let x = LEFT + SECTION_WIDTH - 25
    let y = TOP + SECTION_HEIGHT  
    this.rightArrow = new SVGWrapper.SVGPolygon([[x,y], [x, y+20], [x+20,y+10]])
                            .fill("#0ff")
                            .addClass("scroll-arrow")
                            .hide()
                            .attachTo(rootSVG)
                            .addListener("click", ()=>this.scrollContainer(-SCROLL_OFFSET))

    x = LEFT
    y = TOP + SECTION_HEIGHT  
  
    this.leftArrow = new SVGWrapper.SVGPolygon([[x,y+10], [x+20, y], [x+20,y+20]])
                            .fill("#0ff")
                            .addClass("scroll-arrow")
                            .hide()
                            .attachTo(rootSVG)
                            .addListener("click", ()=>this.scrollContainer(SCROLL_OFFSET))
  }

  async setTickets() {
    const tickets = this.game.context.me.tickets;
    const oldLength = this.deck.length;
    const newLength = tickets.length;

    const count = Math.max(newLength, oldLength)
    for(let i=0;i<count;i++) {
      if(i >= newLength) {
        //remove it from deck
        this.deck[i].destroy();
        this.deck[i] = null;
        continue;
      }
      const ticket = tickets[i]
      if(i < oldLength) {
        if(this.deck[i].isSame(ticket) && this.deck[i].hasImage()) {
          this.deck[i].setDiscard(ticket.age == 'new')
          this.deck[i].setCompleted(ticket.isCompleted)
          continue; //same ticket, keep it
        }
        this.deck[i].destroy()  //diff color destroy
      }
      const newTicket = new RouteTicket(this.game, ticket.source, ticket.target, 
                                        ticket.score, true)
                            .attachTo(this.ticketGroup)
                            .setInteractive()
      newTicket.setDiscard(ticket.age == 'new')
      newTicket.setCompleted(ticket.isCompleted)
      if(i < oldLength)
        this.deck[i] = newTicket;  //new card
      else
        this.deck.push(newTicket)
    }
    this.deck.length = newLength; //removes nulls
    this.render()
  }

  scrollContainer(offset) {
    const bbox = this.ticketGroup.bbox();
    const min = bbox.width > SECTION_WIDTH ? SECTION_WIDTH-(bbox.width+2*GUTTER): 0 
    const max = 0
    this.ticketGroup.x(clamp(this.ticketGroup.x() + offset, min, max))
    this.rightArrow.setVisible(this.ticketGroup.x() > min)
    this.leftArrow.setVisible(this.ticketGroup.x() < max)
  }  

  async moveTicket(ticket) {
    const x = LEFT + (ticket.width+GUTTER)*this.deck.length
    const y = TOP
    await ticket.moveTo(x, y, true)
    ticket.destroy()  
  }

  render() {
    const y = TOP
    for(let i=0;i<this.deck.length;i++) {
      const ticket = this.deck[i]
      const x = LEFT + i*(ticket.width+GUTTER)
      ticket.setPosition(x, y, true)
      ticket.setLocation(this.location)
    }
    this.scrollContainer(0)
  }

  initEvents() {
    const game = this.game
    const { context, socket } = game;

    const isFullyVisible = (ticket)=>{
      return true;
    }

    const ticketMouseOver = (e)=>{
      const ticket = e.detail
      if(ticket && ticket.location == this.location ) {
        ticket.image.addClass("highlight-box")
      }
    }

    const ticketMouseOut = (e)=>{
      const ticket = e.detail
      if(ticket && ticket.location == this.location) {
        ticket.image.removeClass("highlight-box")
      }
    }

    const canDiscard = () => {
      if(context.me.discardCount >= 2) {
        toast(game, 'Not more than two tickets can be discarded!')
        return false;
      }
      return true;
    }

    const discardTicket = (ticket) => {
      const pos = this.deck.indexOf(ticket)
      ticket.destroy();
      this.deck.splice(pos, 1)
      context.me.discardCount++;
      this.render()
      return socket.emit("discard-ticket", context.myIndex, ticket.toJSON())
    }

    let inProgress = false;
    const ticketClick = async (e)=>{
      if(inProgress) return false;
      let ticket = e.detail
      if(ticket && ticket.location == this.location && isFullyVisible(ticket)) {
        inProgress = true
        game.boardSection.highlightLocation(ticket.source)
        await game.boardSection.highlightLocation(ticket.target)
        inProgress = false
        return true;
      }
    }

    const discardClick = async (e)=>{
      let ticket = e.detail
      if(ticket && ticket.location == this.location && canDiscard()) {
        discardTicket(ticket)
      }
    }

    document.addEventListener("ticket-mouseover", ticketMouseOver)
    document.addEventListener("ticket-mouseout", ticketMouseOut)
    document.addEventListener("ticket-click", ticketClick)
    document.addEventListener("discard-click", discardClick)
  }

}
