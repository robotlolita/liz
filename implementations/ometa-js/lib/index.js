var fs       = require('fs')
var utils    = require('util')
var resolve  = require('path').resolve
var ometa    = require('ometajs')
var Parser   = require('./grammar').LizParser
var Compiler = require('./compiler').LizCompiler

function withPrelude(data) {
  return 'var world = ' + read(resolve(__dirname, '..', 'runtime', 'core.js'))
       + ';\n' + data }

function parse(data) {
  return Parser.matchAll(data, 'program') }

function compileAst(ast) {
  return Compiler.match(ast, 'cc') }

function read(name) {
  return fs.readFileSync(name, 'utf-8') }

function compile(data) {
  return withPrelude(compileAst(parse(data))) }