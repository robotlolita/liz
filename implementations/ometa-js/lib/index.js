var fs       = require('fs')
var utils    = require('util')
var resolve  = require('path').resolve
var ometa    = require('ometajs')
var Parser   = require('./grammar').LizParser
var Compiler = require('./compiler').LizCompiler

function withPrelude(data) {
  var runtime = resolve(__dirname, '..', 'runtime')
  return 'var __runtime       = require(' + JSON.stringify(runtime) + ');\n'
       + 'var world           = __runtime.world;\n'
       + 'var evaluate        = __runtime.evaluate;\n'
       + 'var makeEnvironment = __runtime.makeEnvironment;\n'
       + 'var operative       = __runtime.operative;\n'
       + 'var lookup          = __runtime.lookup;\n'
       + 'var nil             = __runtime.nil;\n'
       + data }

function parse(data) {
  return Parser.matchAll(data, 'program') }

function compileAst(ast) {
  return Compiler.match(ast, 'cc') }

function read(name) {
  return fs.readFileSync(name, 'utf-8') }

function compile(data) {
  return withPrelude(compileAst(parse(data))) }


module.exports = { parse      : parse
                 , compileAst : compileAst
                 , read       : read
                 , compile    : compile }