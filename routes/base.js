const utils = require('../utils')
const { JSDOM } = require('jsdom')
const http = require('http')

/**
 * Agrega filtros de busqueda a una llamada a servidor
 *
 * @function
 * @param {LoDashExplicitAsyncWrapper<any>} chain coleccion de datos que filtrar
 * @param {IncomingMessage} req request nativo de Node.js
 * @param {ServerResponse} res response nativo de Node.js
 * @returns {Array} arreglo con los valores filtrados
 */
exports.addFilters = function (chain, req, res) {
  let q = req.query.q
  let _start = req.query._start
  let _end = req.query._end
  let _page = req.query._page
  let _sort = req.query._sort
  let _order = req.query._order
  let _limit = req.query._limit
  delete req.query.q
  delete req.query._start
  delete req.query._end
  delete req.query._page
  delete req.query._sort
  delete req.query._order
  delete req.query._limit

  // Automatically delete query parameters that can't be found
  // in the database
  Object.keys(req.query).forEach(query => {
    const arr = chain.value()
    for (let i in arr) {
      if (
        utils.get(arr[i], query) ||
        query === 'callback' ||
        query === '_' ||
        /_lte$/.test(query) ||
        /_gte$/.test(query) ||
        /_ne$/.test(query) ||
        /_like$/.test(query)
      ) {
        return
      }
    }
    delete req.query[query]
  })

  if (q) {
    // Full-text search
    if (Array.isArray(q)) {
      q = q[0]
    }

    q = q.toLowerCase()

    chain = chain.filter(obj => {
      for (let key in obj) {
        const value = obj[key]
        if (utils.deepQuery(value, q)) {
          return true
        }
      }
    })
  }

  // query by fields
  // operators _gte & _lte & _ne & _like
  Object.keys(req.query).forEach(key => {
    // Don't take into account JSONP query parameters
    // jQuery adds a '_' query parameter too
    if (key !== 'callback' && key !== '_') {
      // Always use an array, in case req.query is an array
      const arr = [].concat(req.query[key])

      chain = chain.filter(element => {
        return arr
          .map(function (value) {
            const isDifferent = /_ne$/.test(key)
            const isRange = /_lte$/.test(key) || /_gte$/.test(key)
            const isLike = /_like$/.test(key)
            const path = key.replace(/(_lte|_gte|_ne|_like)$/, '')
            // get item value based on path
            // i.e post.title -> 'foo'
            const elementValue = utils.get(element, path)

            // Prevent toString() failing on undefined or null values
            if (elementValue === undefined || elementValue === null) {
              return
            }

            if (isRange) {
              const isLowerThan = /_gte$/.test(key)

              return isLowerThan
                ? value <= elementValue
                : value >= elementValue
            } else if (isDifferent) {
              return value !== elementValue.toString()
            } else if (isLike) {
              return new RegExp(value, 'i').test(elementValue.toString())
            } else {
              return value === elementValue.toString()
            }
          })
          .reduce((a, b) => a || b)
      })
    }
  })

  // Sort
  if (_sort) {
    const _sortSet = _sort.split(',')
    const _orderSet = (_order || '').split(',').map(s => s.toLowerCase())
    chain = chain.orderBy(_sortSet, _orderSet)
  }

  // support _page & _limit
  if (_page) {
    _page = parseInt(_page, 10)
    _page = _page >= 1 ? _page : 1
    _limit = parseInt(_limit, 10) || 10
    const values = chain.value()

    const page = utils.getPage(values, _page, _limit)
    const links = {}
    const fullURL = utils.getFullURL(req)

    if (page.first) {
      links.first = fullURL.replace(
        `page=${page.current}`,
        `page=${page.first}`
      )
    }

    if (page.prev) {
      links.prev = fullURL.replace(
        `page=${page.current}`,
        `page=${page.prev}`
      )
    }

    if (page.next) {
      links.next = fullURL.replace(
        `page=${page.current}`,
        `page=${page.next}`
      )
    }

    if (page.last) {
      links.last = fullURL.replace(
        `page=${page.current}`,
        `page=${page.last}`
      )
    }
    res.setHeader('Links', utils.makeLinks(res, links))
    return page.items
  } else if (_end) {
    _start = parseInt(_start, 10) || 0
    _end = parseInt(_end, 10)
    chain = chain.slice(_start, _end)
  } else if (_limit) {
    _start = parseInt(_start, 10) || 0
    _limit = parseInt(_limit, 10)
    chain = chain.slice(_start, _start + _limit)
  }
  return chain.value()
}

/**
 * Web scraping sobre sitios estaticos
 *
 * @function
 * @param {String} address url para hacer scrapping
 * @param {Function} cb callback que se ejecuta cuando esta listo para hacer scrapping, recibe un objeto window
 * @returns {void}
 */
exports.scrape = function (address, cb) {
  http.get(address, res => {
    if (res.statusCode === 200) {
      res.setEncoding('utf8')
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        const { window } = new JSDOM(rawData)
        cb(window)
      })
    } else {
      res.resume()
      cb(null)
    }
  }).on('error', e => {
    console.error(e)
    process.exit(1)
  })
}
