import RouteTicket from "./RouteTicket"

const TOP = 940
const LEFT = (1920/2+20)

const SECTION_HEIGHT = 110
const GUTTER = 5;
const VISIBLE_TICKETS = 6
const SCROLL_OFFSET = 50;

const SECTION_WIDTH = (VISIBLE_TICKETS*RouteTicket.boxWidth + (VISIBLE_TICKETS-1)*GUTTER)

export default class PlayerRouteSection {

  constructor(game) {
    this.game = game;
    this.location = 'playerroute';
    this.deck = []
    this.initEvents();
  }

  cleanup() {
    this.deck.forEach(c=>c.hasImage() && c.destroy())
    delete this.deck
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
          // this.deck[i].setDiscard(ticket.age == 'new')
          this.deck[i].setCompleted(ticket.isCompleted)
          continue; //same ticket, keep it
        }
        this.deck[i].destroy()  //diff color destroy
      }
      const newTicket = new RouteTicket(this.game, ticket.source, ticket.target, 
                                        ticket.score, true)
                            .setInteractive()
      // newTicket.setDiscard(ticket.age == 'new')
      newTicket.setCompleted(ticket.isCompleted)
      if(i < oldLength)
        this.deck[i] = newTicket;  //new card
      else
        this.deck.push(newTicket)
    }
    this.deck.length = newLength; //removes nulls
    this.render()
  }

  async moveTicket(ticket) {
    const x = LEFT + ticket.width/2 + (ticket.width/2+GUTTER)*this.deck.length
    const y = TOP + ticket.height/2
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
        toast(scene, 'Not more than two tickets can be discarded!')
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
      // ticket = gameObject.getData("discard");
      // if(ticket && ticket.location == this.location && canDiscard()) {
      //   discardTicket(ticket)
      // }
    }

    document.addEventListener("ticket-mouseover", ticketMouseOver)
    document.addEventListener("ticket-mouseout", ticketMouseOut)
    document.addEventListener("ticket-click", ticketClick)
  }

}
