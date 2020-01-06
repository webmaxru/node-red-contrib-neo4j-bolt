const neo4j = require('neo4j-driver');

module.exports = function(RED) {
  function RemoteServerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    let url = n.url

    this.driver = neo4j.driver(url, neo4j.auth.basic(n.user, n.pass));

    node.on('close', function () {
        this.driver.close();
    });
  }
  RED.nodes.registerType('neo4j-bolt-server',RemoteServerNode);
}
