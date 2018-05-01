<a name="2.0.0"></a>
## [2.0.0](https://github.com/angular/angular/compare/1.0.0...2.0.0) (2018-05-01)

### Code Refactoring

* **compiler:** Drop support for the deprecated `<template>`. Use `<ng-template>` instead ([#22783](https://github.com/angular/angular/issues/22783)) ([0ebd577](https://github.com/angular/angular/commit/0ebd577))


### Features

* **record:** Support for Node, Relationship, Path, Integer types of returned Record added  ([79867e9c13becddd87b7e4d950138e2d60a61fbc](https://github.com/webmaxru/node-red-contrib-neo4j-bolt/commit/79867e9c13becddd87b7e4d950138e2d60a61fbc))


### BREAKING CHANGES

* **record:** Instead of returning just `properties` the full Record data returned now. To get the properties use `payload.properties` instead of just `payload` 

<a name="1.0.0"></a>
## [1.0.0] (2018-04-30)