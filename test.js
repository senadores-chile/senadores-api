const test = require('tape')
const micro = require('micro')
const axios = require('axios')
const app = require('.')

let server
axios.defaults.baseURL = 'http://0.0.0.0:8080'
test('setup', t => {
  server = micro(app)
  server.listen(8080)
  t.end()
})

test('GET /senadores', async t => {
  t.plan(1)
  try {
    const response = await axios.get('/senadores')
    t.equal(response.data.length, 43)
  } catch (error) {
    t.fail(error)
  }
})

test('GET /senadores filters', async t => {
  try {
    // ?_page
    // ?_page & _limit
    // ?_start & _end
    // ?_end
    // ?_limit
    // ?_start & _limit
    // ?_sort
    // ?_sort & _order
    // ?_ne
    // ?_gte || _lte
    // ?_like
    // ?q
    // query by fields
  } catch (error) {
    t.fail(error)
  }
})

test('GET /senadores/:id', async t => {
  t.plan(1)
  try {
    const response = await axios.get('/senadores/905')
    t.deepEqual(response.data, {
      id: 905,
      nombre: 'Allamand Zavala, Andrés',
      rut: '',
      region: 'Región Metropolitana de Santiago ',
      circunscripcion: 7,
      telefono: '(56-32) 2504701 ',
      mail: 'allamand@senado.cl',
      partido: 'R.N.'
    })
  } catch (error) {
    t.fail(error)
  }
})

test.onFinish(() => server.close())
