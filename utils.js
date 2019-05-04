const url = require('url')

module.exports = {
  getPage,
  getFullURL,
  get,
  makeLinks,
  deepQuery
}
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
function get (obj, path, defaultValue = null) {
  return String.prototype.split.call(path, /[,[\].]+?/)
    .filter(Boolean)
    .reduce((a, c) => (Object.hasOwnProperty.call(a, c) ? a[c] : defaultValue), obj)
}
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
function getFullURL (req) {
  const root = url.format({
    protocol: getProtocol(req),
    host: req.headers['Host'] || req.headers['host']
  })

  return `${root}${req.url}`
}
// mimic express links
function makeLinks (res, links) {
  let link = res.getHeader('Link') || ''
  if (link) link += ', '
  return link + Object.keys(links).map(rel => `<${links[rel]}>; rel="${rel}"`).join(', ')
}
function isObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
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
