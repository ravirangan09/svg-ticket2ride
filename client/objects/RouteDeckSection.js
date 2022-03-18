const TOP = 820
const LEFT = (150+1594+20)

import { asyncSleep, toast } from "../helpers/game_helper";
// const SECTTON_HEIGHT = 120
// const SECTION_WIDTH = 170

import RouteTicket from "./RouteTicket"

export default class RouteDeckSection  {

  constructor(game) {
    this.game = game;
    this.location = 'routedeck';
    this.deck = []
    this.initEvents()
  }

  popTicket() {
    return this.deck.pop()
  }
    
  setTickets() {
    const tickets = this.game.context.shortTicketDeck;
    const oldLength = this.deck.length;
    const newLength = tickets.length;
    const count = Math.max(newLength, oldLength) 
    for(let i=0;i<count;i++) { //do in reverse as splice will remove entries
      if(i >= newLength) {
        //remove it from deck
        this.deck[i].destroy();
        this.deck[i] = null;
        continue;
      }
      const ticket = tickets[i]
      if(i < oldLength) {
        if(this.deck[i].isSame(ticket) && this.deck[i].hasImage()) continue; //same ticket, keep it
        this.deck[i].destroy()  //diff color destroy
      }
      const newTicket = new RouteTicket(this.game, ticket.source, ticket.target, ticket.score, false)

      if(i < oldLength)
        this.deck[i] = newTicket;  //new card
      else
        this.deck.push(newTicket)
    }
    this.deck.length = newLength;
    this.deck.at(-1).setInteractive()
    this.render()
  }

  render() {
    for(const d of this.deck) {
      d.setPosition(LEFT, TOP, false)
      d.setLocation(this.location)
    }
  }

  initEvents() {
    const game = this.game
    const { context, socket } = game;

    const canDoAction = () => {
      if(game.isGameOver()) return false;
      if(!context.myTurn) return false;
      return context.actionCount == 0;
    }

    const ticketMouseOver = (e)=>{
      const ticket = e.detail
      if(canDoAction() && ticket && ticket.location == this.location ) {
        ticket.image.addClass("highlight-box")
      }
    }

    const ticketMouseOut = (e)=>{
      const ticket = e.detail
      if(ticket && ticket.location == this.location) {
        ticket.image.removeClass("highlight-box")
      }
    }

    let inProgress = false;
    const doMoveAction = async (newContext)=>{
      for(let i=0;i<3;i++) {
        const ticket = this.popTicket();
        if(context.myTurn) {
          game.playerRouteSection.moveTicket(ticket)
        }
        else {
          game.playersSection.moveTicket(ticket, context.currentPlayerIndex)
        }
        await asyncSleep(100) //show slight delay in three cards
      }
      inProgress = false;
      game.setContext(newContext)
    }

    const sendAction = () => {
      inProgress = true;
      game.do("move-tickets-to-player")
    }

    const hasEnoughRoutes = () => {
      if(context.me.coins > 35) {
        toast(game, "Not enough routes claimed to add tickets. You may have clicked it by mistake!")
        return false;
      }
      return true;
    } 

    const ticketClick = async (e)=>{
      if(inProgress) return false;
      const ticket = e.detail
      if(canDoAction() && ticket && 
          ticket.location == this.location &&
           hasEnoughRoutes()) {
        ticket.image.removeClass("highlight-box")
        sendAction()
      }
    }

    document.addEventListener("ticket-mouseover", ticketMouseOver)
    document.addEventListener("ticket-mouseout", ticketMouseOut)
    document.addEventListener("ticket-click", ticketClick)
    socket.on("move-tickets-to-player", doMoveAction)
  }

}
