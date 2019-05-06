const url = require('url')

module.exports = {
  getPage,
  getFullURL,
  get,
  makeLinks,
  deepQuery
}

/**
 * Obtiene el protocolo de un objeto IncomingMessage (basado en código de express.js)
 *
 * @private
 * @param {IncomingMessage} req request nativo de Node.js
 * @returns {String} string indicando el protocolo
 */
function getProtocol (req) {
  const proto = req.connection.encrypted
    ? 'https'
    : 'http'

  // Note: X-Forwarded-Proto is normally only ever a
  //       single value, but this is to be safe.
  const header = req.headers['X-Forwarded-Proto'] || proto
  const index = header.indexOf(',')

  return index !== -1
    ? header.substring(0, index).trim()
    : header.trim()
}

/**
 * Encuentra un valor en un objeto basado en un path (basado en código de lodash.js)
 *
 * @param {Object} obj objeto en el que se va a buscar
 * @param {String} path ruta que buscar en el objeto
 * @param {*} [defaultValue] valor para retornar en caso de no encontrar la propiedad
 * @returns {*} el valor encontrado
 */
function get (obj, path, defaultValue = null) {
  return String.prototype.split.call(path, /[,[\].]+?/)
    .filter(Boolean)
    .reduce((a, c) => (Object.hasOwnProperty.call(a, c) ? a[c] : defaultValue), obj)
}

/**
 * Interfaz de páginas
 *
 * @typedef {Object} Page
 * @property {Array} items
 * @property {Number} prev
 * @property {Number} next
 * @property {Number} current
 * @property {Number} first
 * @property {Number} last
 */

/**
 * Divide en páginas los valores de un arreglo
 *
 * @param {Array} array lista de objetos para paginar
 * @param {Number} page número de página
 * @param {Number} perPage elementos por página
 * @returns {Page} returna un objeto de página
 */
function getPage (array, page, perPage) {
  var obj = {}
  var start = (page - 1) * perPage
  var end = page * perPage

  obj.items = array.slice(start, end)
  if (obj.items.length === 0) {
    return obj
  }

  if (page > 1) {
    obj.prev = page - 1
  }

  if (end < array.length) {
    obj.next = page + 1
  }

  if (obj.items.length !== array.length) {
    obj.current = page
    obj.first = 1
    obj.last = Math.ceil(array.length / perPage)
  }

  return obj
}

/**
 * Obtiene la url completa de un request
 *
 * @param {IncomingMessage} req request nativo de Node.js
 * @returns {String} string con la url completa del request
 */
function getFullURL (req) {
  const root = url.format({
    protocol: getProtocol(req),
    host: req.headers['Host'] || req.headers['host']
  })

  return `${root}${req.url}`
}

/**
 * @typedef {Object} Links
 * @property {String} first
 * @property {String} next
 * @property {String} prev
 * @property {String} last
 */

/**
 * Genera el header de links para paginación
 *
 * @param {ServerResponse} res response nativo de Node.js
 * @param {Links} links objeto de links
 * @returns {String} contenido del header Links
 */
function makeLinks (res, links) {
  let link = res.getHeader('Link') || ''
  if (link) link += ', '
  return link + Object.keys(links).map(rel => `<${links[rel]}>; rel="${rel}"`).join(', ')
}

/**
 * Determina si una variable es un objeto
 *
 * @private
 * @param {*} obj el valor a evaluar
 * @returns {Boolean} true si es un objeto, false en cualquier otro caso
 */
function isObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * Determina si el path existe en el objeto
 *
 * @param {Object|Array} value valor sobre el que hacer la busqueda
 * @param {String} q path de busqueda
 * @returns {Boolean} true si se encontro un valor
 */
function deepQuery (value, q) {
  if (value && q) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (deepQuery(value[i], q)) {
          return true
        }
      }
    } else if (isObject(value)) {
      for (let k in value) {
        if (deepQuery(value[k], q)) {
          return true
        }
      }
    } else if (
      value
        .toString()
        .toLowerCase()
        .indexOf(q) !== -1
    ) {
      return true
    }
  }
}
