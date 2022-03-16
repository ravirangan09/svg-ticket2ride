import { asyncSleep } from "../helpers/game_helper";
import { isTypeObject } from "../helpers/type_helper";

const xmlns = "http://www.w3.org/2000/svg";

class SVGElement {

  constructor() {
    this._node = null
    this._data = {}
    this._listeners = {}
    this._transform = []
    this._transformOriginX = null
    this._transformOriginY = null
  }

  data(key, value) {
    if(isTypeObject(key) && value === undefined) {
      Object.assign(this._data, key)
      return this;
    }
    if(key === undefined) return this._data;
    if(value === undefined) return this._data[key];
    this._data[key] = value;
    return this;
  }

  width(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("width"));
    return this.attr("width", value)
  }

  height(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("height"));
    return this.attr("height", value)
  }

  hide() {
    return this.attr("visibility", "hidden")
  }

  visible() {
    return this.attr("visibility", "visible")
  }

  setVisible(isVisible) {
    return isVisible ? this.visible() : this.hide();
  }

  size(w, h) {
    return this.width(w).height(h);
  }

  addClass(name) {
    this._node.classList.add(name)
    return this;
  }

  removeClass(name) {
    this._node.classList.remove(name)
    return this;
  }

  move(x, y) {
    return this.x(x).y(y);
  }

  x(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("x"));
    return this.attr("x", value)
  }

  y(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("y"));
    return this.attr("y", value)
  }

  incX(value) {
    return this.attr("x", this.x()+value)
  }

  incY(value) {
    return this.attr("y", this.y()+value)
  }

  bbox() {
    return this._node.getBBox();
  }

  add(child) {
    this._node.appendChild(child._node)
    return this;
  }

  id(value) {
    if(value === undefined) return this._node.getAttribute('id');
    return this.attr('id', value)
  }

  fill(value) {
    return this.attr("fill", value)
  }

  stroke(value, strokeWidth=null) {
    if(strokeWidth) {
      this.attr("stroke-width", strokeWidth)
    }
    return this.attr("stroke", value)
  }

  attr(key, value) {
    if(value === undefined) return this._node.getAttribute(key)
    this._node.setAttribute(key, value)
    return this;
  }

  addListener(name, listener) {
    this._node.addEventListener(name, listener)
    this._listeners[name] = listener
    return this;
  }

  removeListener(name) {
    this._node.removeEventListener(name, this._listeners[name])
    return this;
  }

  attachTo(selectorOrObject) {
    if(selectorOrObject instanceof SVGElement) {
      selectorOrObject.add(this)
    }
    else {
      const parent = document.querySelector(selectorOrObject);
      if(!parent) throw new Error(`Unable to attch. Invalid selector ${selectorOrObject}`);
      parent.appendChild(this._node)
    }
    return this;
  }

  transform(key, value) {
    if(key === undefined) return this._transform.join(' ');
    if(this._transformOriginX !== null) {
      this._node.style["transform-origin"] = `${this._transformOriginX}px ${this._transformOriginY}px`;
    }
    this._transform.push(`${key}(${value})`)
    this._node.style.transform = this._transform.join(' ');
    return this;
  }

  resetTransform() {
    this._transform.length = 0
    this._transformOriginX = null;
    this._transformOriginY = null;
    this._node.style["transform-origin"] = null;
    this._node.style.transform = null;
    return this;
  }

  translate(x, y) {
    return this.transform('translate', `${x}px, ${y}px`)
  }

  rotate(angle, x, y) {
    this._transformOriginX = x;
    this._transformOriginY = y;
    return this.transform('rotate', `${angle}deg`)
  }

  scale(factor, x, y) {
    this._transformOriginX = x;
    this._transformOriginY = y;
    return this.transform('scale', factor)
  }

  remove() {
    this._node.remove()
    this._node = null;
  }

  bringToFront() {
    if(this._node.nextSibling) {
      const parent = this._node.parentNode;
      parent.appendChild(this._node)
    }
    return this;
  }

  async animateMove(tx, ty, duration) {
    const styleElement  = document.createElement("style")

    const keyFrameName = 'kf-'+Math.random().toString(36).slice(2,7)
    const clName = 'cl-'+Math.random().toString(36).slice(2,7)
    const styleContent = `@keyframes ${keyFrameName} {
      from {
        x: ${this.x()}px;
        y: ${this.y()}px;
      }
        
      to {
        x: ${tx}px;
        y: ${ty}px;
      }
    }

    .${clName} {
      animation-name: ${keyFrameName};
      animation-duration: ${duration}ms;
    }`
    styleElement.innerText = styleContent
    document.head.appendChild(styleElement)
    this.addClass(clName)
    await asyncSleep(duration)
    this.removeClass(clName)
    styleElement.innerText = ''
    styleElement.remove()
  }

  async animateScale(factor, duration) {
    const styleElement  = document.createElement("style")
    const keyFrameName = 'kf-'+Math.random().toString(36).slice(2,7)
    const clName = 'cl-'+Math.random().toString(36).slice(2,7)
    const currentTransform = this.transform()

    const styleContent = `@keyframes ${keyFrameName} {
      from {
        transform: ${currentTransform} scale(1);
      }
      
      50% {
        transform: ${currentTransform} scale(${factor});
      }
    
      to {
        transform: ${currentTransform} scale(1);
      }
    }

    .${clName} {
      animation-name: ${keyFrameName};
      animation-duration: ${duration}ms;
    }`
    styleElement.innerText = styleContent
    document.head.appendChild(styleElement)
    this.addClass(clName)
    await asyncSleep(duration)
    this.removeClass(clName)
    styleElement.innerText = ''
    styleElement.remove()
  }
}

export class SVGRoot extends SVGElement {
  constructor() {
    super()
    this._node = document.createElementNS(xmlns, "svg")
  }

  viewBox(left, top, width, height) {
    return this.attr('viewBox', `${left} ${top} ${width} ${height}`)
  }

}

export class SVGDefs extends SVGElement {
  constructor() {
    super()
    this._node = document.createElementNS(xmlns, "defs")
  }


}

export class SVGImage extends SVGElement {
  constructor(href) {
    super()
    this._node = document.createElementNS(xmlns, "image")
    this._href = href
    this.attr('href', href)
  }

}

export class SVGCircle extends SVGElement {
  constructor(radius) {
    super()
    this._node = document.createElementNS(xmlns, "circle")
    this.radius = radius
    this.attr('r', radius)
  }

  move(x, y) {
    return this.attr('cx', x).attr('cy', y)
  }
}

export class SVGGroup extends SVGElement {
  constructor() {
    super()
    this._node = document.createElementNS(xmlns, "g")
  }

  move(x, y) {
    return this.attr('transform', `translate(${x} ${y})`)
  }

}

export class SVGText extends SVGElement {
  constructor(label) {
    super()
    this._node = document.createElementNS(xmlns, "text")
    this.text(label)
  }

  text(label) {
    this._node.textContent = label
    return this;
  }

  size(width, height) {
    //for text nodes, scale it
    const bbox = this._node.getBBox();
    const sx = width/bbox.width
    const sy = height/bbox.height
    return this.attr('transform', `scale(${sx} ${sy})`)
  }
}

export class SVGRect extends SVGElement {
  constructor(width, height) {
    super()
    this._node = document.createElementNS(xmlns, "rect")
    this.size(width, height)        
  }

  cornerRadius(r) {
    return this.attr('rx', r)
  }
 }

 export class SVGRectClipPath extends SVGElement {
  constructor(width, height, x, y) {
    super()
    this._node = document.createElementNS(xmlns, "clipPath")
    const rect = new SVGRect(width, height).x(x).y(y)
    this.add(rect)     
  }
 }

export class SVGUse extends SVGElement {
  constructor(defElement) {
    super()
    this._node = document.createElementNS(xmlns, "use")
    const refId = '#'+defElement.id(); 
    this.attr('href', refId)       
  }

}

export class SVGPolygon extends SVGElement {
  constructor(points) {
    super()
    this._node = document.createElementNS(xmlns, "polygon")
    this.attr('points', points.map(p=>p.join(",")).join(" "))       
  }

}
