'use strict'
const jsDom = require('jsdom')

module.exports = D3Node

module.exports.jsDom = jsDom

function fixXmlCase (text) {
  // Fix a jsdom issue where all SVG tagNames are lowercased:
  // https://github.com/tmpvar/jsdom/issues/620
  var tagNames = ['linearGradient', 'radialGradient', 'clipPath', 'textPath']
  for (var i = 0, l = tagNames.length; i < l; i++) {
    var tagName = tagNames[i]
    text = text.replace(
            new RegExp('(<|</)' + tagName.toLowerCase() + '\\b', 'g'),
            function (all, start) {
              return start + tagName
            })
  }
  return text
}

const defaults = {
  d3Module: require('d3'), // to allow use of d3.v4
  selector: '',  // selects base D3 Element
  container: '', // markup inserted in body
  styles: ''  // embedded svg stylesheets
}

function D3Node (opts) {
  const options = Object.assign({}, defaults, opts)

  // deprecates props
  if (opts && opts.svgStyles) { // deprecated svgStyles option
    console.warn('WARNING: svgStyles is deprecated, please use styles instead !!')
    options.styles = opts.svgStyles
  }

  // auto-new instance, so we always have 'this'
  if (!(this instanceof D3Node)) {
    return new D3Node(options)
  }

  // setup DOM
  let document = jsDom.jsdom()
  if (options.container) {
    document = jsDom.jsdom(options.container)
  }

  // setup d3 selection
  let d3Element = options.d3Module.select(document.body)
  if (options.selector) {
    d3Element = d3Element.select(options.selector)
  }

  this.options = options
  this.document = document
  this.window = document.defaultView
  this.d3Element = d3Element
  this.d3 = options.d3Module
}

D3Node.prototype.createSVG = function () {
  const svg = this.d3Element.append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  if (this.options.styles) {
    svg.append('defs')
      .append('style')
      .attr('type', 'text/css')
      .text(`<![CDATA[ ${this.options.styles} ]]>`)
  }
  return svg
}

// experimental method for creating 2d canvas
D3Node.prototype.createCanvas = function () {
  if (!this.document.createElement('canvas').getContext('2d')) {
    throw new Error('Install node-canvas for HTMLCanvasElement support.')
  }

  if (!this.document.querySelector('canvas')) {
    return this.document.createElement('canvas')
  } else {
    return this.document.querySelector('canvas')
  }
}

D3Node.prototype.svgString = function () {
  if (this.d3Element.select('svg').node()) {
    // temp until: https://github.com/tmpvar/jsdom/issues/1368
    return fixXmlCase(this.d3Element.select('svg').node().outerHTML)
  }
  return ''
}

D3Node.prototype.html = function () {
  return jsDom.serializeDocument(this.document)
}

D3Node.prototype.chartHTML = function () {
  return this.document.querySelector(this.options.selector).outerHTML
}
