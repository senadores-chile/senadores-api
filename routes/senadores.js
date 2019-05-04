const { send } = require('micro')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const adapter = new FileAsync('db/senadores.json')
const { addFilters } = require('./base')

exports.getSenadores = (req, res) => {
  low(adapter)
    .then(db => {
      init(db, { senadores: [] })
      let chain = db.get('senadores')

      let values = addFilters(chain, req, res)
      return send(res, 200, values)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

exports.getSenador = (req, res) => {
  low(adapter)
    .then(db => {
      init(db, { senadores: [] })
      const senador = db.get('senadores')
        .find({ id: req.params.id })
        .value()
      return send(res, 200, senador)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

function init (db, def) {
  db.defaults(def)
    .write()
}
