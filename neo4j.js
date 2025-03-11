const neo4j = require('neo4j-driver')
module.exports = function (RED) {
  function Neo4jBolt (config) {
    RED.nodes.createNode(this, config)
    var node = this

    var sessions = []
    var readySessionList = []

    node.server = RED.nodes.getNode(config.server)

    const driver = node.server.driver

    // set up a list of sessions for later use, to avoid session allocation error later on
    for( i=0; i<config.sessions; i++){
      try {
        sessions.push(driver.session({ database: config.database || 'neo4j' }));
        readySessionList.push(i)
      } catch (err) {
        console.log(err)
        break
      }
    }

    if (readySessionList.length > 0) {
      node.status({
        fill: 'green',
        shape: 'dot',
        text: `connected: ${readySessionList.length} sesions`
      })
      node.on('input', function (msg) {
        var query = config.query || msg.query

        if( readySessionList.length > 0 ){
          // remove and use a session
          var readySession = readySessionList.shift()
          var boltSession = driver.session({
            database: msg.database || config.database || 'neo4j'
          });
          
          let params = null
          if (typeof (msg.params) === 'string') {
            params = JSON.parse(msg.params)
          } else {
            params = msg.params
          }

          function processInteger (integer) {
            if (integer === null) return null;
            
            if (integer.constructor.name === 'Integer') {
              return integer.toNumber()
            }
            return integer
          }

          function processRecord (record) {
            if (record === null) return null;

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
              node.send([null, msg, null])
            } else if (result.records.length == 1) {
              let itm = {};
              result.records[0].forEach(function (item, index, array) {
                itm[index] = processRecord(item)
              })
              msg.payload = itm
              node.send([msg, null, null])
            } else {
              node.send([null, null, null])
            }
          })
          .catch(err => {
            node.error(err, msg);
          }).finally(() => {
            readySessionList.push(readySession) 
          })
        } else {
          // no sessions available, send the message out on the third  port for further processing bty caller
          node.send([null, null, msg])
        }
      })
    } else {
      node.status({
        fill: 'red',
        shape: 'dot',
        text: 'node-red:common.status.disconnected'
      })
    }

    node.on('close', function () {
      sessions.map(s => s.close())
      driver.close()
    })
  }
  RED.nodes.registerType('neo4j-bolt', Neo4jBolt)
}
