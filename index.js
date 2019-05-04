const { router, get } = require('micro-fork')
const { getSenadores, getSenador } = require('./routes/senadores')

module.exports = router()(
  get('/senadores', getSenadores),
  get('/senadores/:id', getSenador)
)
