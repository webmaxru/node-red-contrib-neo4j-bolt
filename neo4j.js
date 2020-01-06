const neo4j = require('neo4j-driver')
module.exports = function (RED) {
  function Neo4jBolt (config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.server = RED.nodes.getNode(config.server)

    const driver = node.server.driver
    const session = driver.session()

    if (session) {
      node.status({
        fill: 'green',
        shape: 'dot',
        text: 'node-red:common.status.connected'
      })
      node.on('input', function (msg) {
        var query = config.query || msg.query
        let params = null
        if (typeof (msg.params) === 'string') {
          params = JSON.parse(msg.params)
        } else {
          params = msg.params
        }

        const resultPromise = session.run(query, params)

        function processInteger (integer) {
          if (integer.constructor.name === 'Integer') {
            return integer.toNumber()
          }
          return integer
        }

        function processRecord (record) {
          if (record.constructor.name === 'Integer') {
            return record.toNumber()
          }

          if (record.constructor.name === 'Path') {
            record.start.identity = processInteger(record.start.identity)
            record.end.identity = processInteger(record.end.identity)
            record.segments = record.segments.map(segment => {

              segment.start.identity = processInteger(segment.start.identity)
              segment.end.identity = processInteger(segment.end.identity)

              segment.relationship.identity = processInteger(segment.relationship.identity)
              segment.relationship.start = processInteger(segment.relationship.start)
              segment.relationship.end = processInteger(segment.relationship.end)

              return segment
            })
            return record
          }

          if (record.constructor.name === 'Relationship') {
            record.identity = processInteger(record.identity)
            record.start = processInteger(record.start)
            record.end = processInteger(record.end)
            return record
          }

          if (record.constructor.name === 'Node') {
            record.identity = processInteger(record.identity)
            return record
          }

          return record
        }
        resultPromise.then(result => {
          session.close()
          if (result.records.length > 1) {
            msg.payload = [];
            result.records.forEach(function (record, index, array) {
              let itm = {};
              record.forEach(function (item, index, array) {
                itm[index] = processRecord(item)
              })
              msg.payload.push(itm)
            })
            node.send([null, msg])
          } else if (result.records.length == 1) {
            let itm = {};
            result.records[0].forEach(function (item, index, array) {
              itm[index] = processRecord(item)
            })
            msg.payload = itm
            node.send([msg, null])
          } else {
            msg.payload = null
            node.send([msg, null])
          }
        })
        .catch(err => {
            node.error(err, msg);
        })
      })
    } else {
      node.status({
        fill: 'red',
        shape: 'dot',
        text: 'node-red:common.status.disconnected'
      })
    }

    node.on('close', function () {
      driver.close()
    })
  }
  RED.nodes.registerType('neo4j-bolt', Neo4jBolt)
}
