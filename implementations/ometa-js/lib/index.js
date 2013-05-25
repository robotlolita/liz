var fs       = require('fs')
var utils    = require('util')
var ometa    = require('ometajs')
var Parser   = require('./grammar').LizParser
var Compiler = require('./compiler').LizCompiler

function parse(data) {
  return Parser.matchAll(data, 'program') }

function compileAst(ast) {
  return Compiler.match(ast, 'cc') }

function read(name) {
  return fs.readFileSync(name, 'utf-8') }

function compile(data) {
  return compileAst(parse(data)) }
