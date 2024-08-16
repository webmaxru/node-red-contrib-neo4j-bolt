const neo4j = require('neo4j-driver')
module.exports = function (RED) {
  function Neo4jBolt (config) {
    RED.nodes.createNode(this, config)
    var node = this

    var sessions = []

    node.server = RED.nodes.getNode(config.server)

    const driver = node.server.driver

    for( i=0; i<config.sessions; i++){
      try {
        sessions.push( {
          ready: true,
          session: driver.session({database: config.database})
        })  
      } catch (err) {
        console.log(err)
        break
      }
    }

    if (sessions.length > 0) {
      node.status({
        fill: 'green',
        shape: 'dot',
        text: 'node-red:common.status.connected'
      })
      node.on('input', function (msg) {
        var query = config.query || msg.query

        var session
        while (null === session.find(s => s.ready === true)) {
          
        }
        session.ready = false
        boltSession = session.session
        let params = null
        if (typeof (msg.params) === 'string') {
          params = JSON.parse(msg.params)
        } else {
          params = msg.params
        }

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
        
        boltSession.run(query, params).then(result => {
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
          session.ready = true
        })
        .catch(err => {
            session.ready = true
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
      sessions.map(s => s.session.close())
      driver.close()
    })
  }
  RED.nodes.registerType('neo4j-bolt', Neo4jBolt)
}
