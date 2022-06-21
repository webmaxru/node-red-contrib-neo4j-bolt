# Neo4j Bolt with shareable driver

A <a href="http://nodered.org" target="_new">Node-RED</a> node with the shareable server configuration that lets you run generic cypher queries on a Neo4j graph database and receive all types of Neo4j records.

## Install

Run the following command in the root directory of your Node-RED install or home directory (usually ~/.node-red) and will also install needed libraries.

```
npm install node-red-contrib-neo4j-bolt
```

## Usage

First, you define the Neo4j bolt URL and the basic authentication username and password in the configuration node. This node creates a driver which will be shared across all Neo4j-Bolt nodes. Each node creates its own driver session.

You can specify the database to use as `msg.database`. If not specified, the driver will use the dfault.

You can specify a cypher query in the node configuration or pass to the node as `msg.query`. The parameters for the query (if needed) are read from `msg.params`.

* Example of hard coded query in the configuration of the node.
```
MATCH (m:Movie {title: "Forrest Gump"}) return m
```

* Example of a parameterized query.
Query in the configuration:
```
MATCH (m:Movie {title: $moviename}) return m
```

msg.params:
```
{"moviename": "Forrest Gump"}
```

* Example of both query and params being passed in `msg`

msg.query:
```
MATCH (m:Movie {title: $moviename}) return m
```

msg.params:
```
{"moviename": "Forrest Gump"}
```

The node has two outputs. If the query returns only 1 record, the requested properties of the node are sent to output #1. If the query returns multiple records, an array of requested properties of the nodes are sent to output #2.

This node uses the [neo4j-driver](https://www.npmjs.com/package/neo4j-driver) package to communicate with Neo4j.

### Runtime information
This node was tested to Node.js v7.4.0 and NPM 5.6.0 on Node-Red v0.18.4

### Credits

This node is based on <a href="https://github.com/nullibrew/node-red-contrib-nulli-neo4j" target="_new">node-red-contrib-nulli-neo4j</a> by <a href="http://nulli.com">Nulli</a>.
