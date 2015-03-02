'use strict';

var EventEmitter = require('events').EventEmitter;

function Node(name) {
  this.name = name;
  this.parent = undefined;
  this.children = [];
  this.value = undefined;
  this.emitter = new EventEmitter();
}

Node.prototype.on = function(event, listener) {
  this.emitter.on(event, listener);
  return this;
};

Node.prototype.setValue = function(value) {
  if (this.hasChildren()) {
    throw 'Value can be set only in leaves.';
  }
  var path = this.path();
  this.value = value;
  this.visitAncestors(function(node) {
    node.emitter.emit('value', {path: path, value: value});
  });
};

Node.prototype.visitAncestors = function(callback) {
  if (this.isRoot()) {
    return;
  }
  callback(this);
  this.parent.visitAncestors(callback);
};

Node.prototype.visitDescendants = function(callback) {
  callback(this);
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    child.visitDescendants(callback);
  };
};

Node.prototype.visitLeaves = function(callback) {
  this.visitDescendants(function(node) {
    if (!node.hasChildren()) {
      callback(node);
    }
  });
};

Node.prototype.isRoot = function() {
  return !this.parent;
};

Node.prototype.hasChildren = function() {
  return this.children.length > 0;
};

Node.prototype.addChild = function(child) {
  this.children.push(child);
  child.parent = this;
  return child;
};

Node.prototype.path = function() {
  return this._path([]).reverse().join('/');
};

Node.prototype._path = function(names) {
  if (this.isRoot()) {
    return names;
  }
  names.push(this.name);
  return this.parent._path(names);
};

Node.prototype.get = function(path, opt_add) {
  return this._get(path.split('/'), opt_add);
};

Node.prototype._get = function(names, opt_add) {
  if (names.length == 0) {
    return this;
  }
  var child = this.getChild(names[0]);
  if (!child) {
    if (opt_add) {
      child = this.addChild(new Node(names[0]));
    } else {
      return null;
    }
  }
  return child._get(names.slice(1, names.length), opt_add);
};

Node.prototype.getChild = function(name) {
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i];
    if (child.name == name) {
      return child;
    }
  }
  return null;
};

module.exports.Node = Node;