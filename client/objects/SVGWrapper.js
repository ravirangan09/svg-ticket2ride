const xmlns = "http://www.w3.org/2000/svg";

class SVGElement {

  constructor() {
    this._node = null
    this._data = {}
  }

  data(key, value) {
    if(value === undefined) return this._data[key];
    this._data[key] = value;
  }

  width(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("width"));
    this._node.setAttribute("width", value)
    return this;
  }

  height(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("height"));
    this._node.setAttribute("height", value)
    return this;
  }

  size(w, h) {
    return this.width(w).height(h);
  }

  move(x, y) {
    return this.x(x).y(y);
  }

  x(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("x"));
    this._node.setAttribute("x", value)
    return this;
  }

  y(value) {
    if(value === undefined) return parseFloat(this._node.getAttribute("y"));
    this._node.setAttribute("y", value)
    return this;
  }

  add(child) {
    this._node.appendChild(child._node)
    return this;
  }

  id(value) {
    if(value === undefined) return this._node.getAttribute('id');
    this._node.setAttribute('id', value)
    return this;
  }

  fill(value) {
    this._node.setAttribute("fill", value)
    return this;
  }

  stroke(value) {
    this._node.setAttribute("stroke", value)
    return this;
  }

  attr(key, value) {
    if(value === undefined) return this._node.getAttribute(key)
    this._node.setAttribute(key, value)
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

  rotate(angle, x, y) {
    return this.attr('transform', `rotate(${angle} ${x} ${y})`)
  }

  remove() {
    this._node.remove()
    this._node = null;
  }

  bringToFront() {
    const parent = this._node.parentNode;
    this._node.remove()
    parent.appendChild(this._node)
  }

}

export class SVGRoot extends SVGElement {
  constructor() {
    super()
    this._node = document.createElementNS(xmlns, "svg")
  }

  viewBox(left, top, width, height) {
    this._node.setAttribute('viewBox', `${left} ${top} ${width} ${height}`)
    return this;
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
    const labelNode = document.createTextNode(label)
    this._node.appendChild(labelNode)  
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

export class SVGUse extends SVGElement {
  constructor(defElement) {
    super()
    this._node = document.createElementNS(xmlns, "use")
    const refId = '#'+defElement.id(); 
    this.attr('href', refId)       
  }

}
