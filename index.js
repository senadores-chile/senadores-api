const { router, get, put } = require('micro-fork')
const { getSenadores, getSenador, updateSenadores } = require('./routes/senadores')

module.exports = router()(
  get('/senadores', getSenadores),
  get('/senadores/:id', getSenador),
  put('/senadores', updateSenadores)
)
