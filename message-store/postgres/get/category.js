const { assertTruthy } = require('../../../errors')
const { createGet } = require('./get')
const { StreamName } = require('../../stream-name')

exports.createGetCategory = (options) => {
  const { batchSize } = options

  const assert = (category) => {
    assertTruthy(StreamName.isCategory(category), get,
      `stream category required, not a specific stream (${category})`)
  }

  const getValues = (streamName, options) => [
    streamName,
    options.position,
    batchSize,
    options.correlation,
    options.consumerGroupMember,
    options.consumerGroupSize
  ]

  const parameters = '$1::varchar, $2::bigint, $3::bigint, $4::varchar, $5::bigint, $6::bigint'
  const sql = `SELECT * FROM get_category_messages(${parameters});`

  const get = createGet({ ...options, assert, getValues, sql })

  return get
}
