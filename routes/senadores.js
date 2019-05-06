const { send } = require('micro')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const adapter = new FileAsync('db/senadores.json')
const { addFilters, scrape } = require('./base')
const infoRut = require('info-rut')

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

exports.updateSenadores = (req, res) => {
  const SENADORES_URL = 'http://senado.cl/appsenado/index.php?mo=senadores&ac=listado'
  scrape(SENADORES_URL, window => {
    const listaSenadores = Array.from(window.document.querySelectorAll('.auxi-art .clase_tabla > tbody > tr[align="left"]:not(:first-child)'))
    const senadores = listaSenadores.map(async senador => {
      const data = senador.querySelector('.clase_tabla td:last-child').textContent.trim()
      /* eslint-disable no-unused-vars */
      let [_, region, circunscripcion] = /Región: (.*)\s*?\| Circunscripción: (\d*)/.exec(data)
      let [__, telefono, mail] = /Teléfono: (.*)\s*?\| Email:(.*)/.exec(data)
      const nombre = data.split('\n').shift()
      const { rut } = await infoRut(nombre)[0]
      return {
        id: parseInt(senador.querySelector('td.td_foto > img').src.split('=').pop(), 10),
        nombre,
        rut,
        region,
        circunscripcion: parseInt(circunscripcion, 10),
        telefono,
        mail,
        partido: /Partido: (.*)$/.exec(senador.children[1].textContent)[1]
      }
    })
    low(adapter)
      .then(db => {
        db.set('senadores', senadores)
          .write()
          .then(() => send(res, 200, senadores))
          .catch(err => {
            console.error(err)
            process.exit(1)
          })
      })
      .catch(err => {
        console.error(err)
        process.exit(1)
      })
  })
}

function init (db, def) {
  db.defaults(def)
    .write()
}
