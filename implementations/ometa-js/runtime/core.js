// # Module core
//
// Core runtime for PoLiz

// -- Dependencies -----------------------------------------------------
var flaw = require('flaw')
var boo  = require('boo')


// -- Aliases ----------------------------------------------------------
var raise   = flaw.raise
var clone   = boo.derive
var extend  = boo.extend
var Base    = boo.Base
var foldr   = Function.call.bind([].reduceRight)
var slice   = Function.call.bind([].slice)
var classOf = Function.call.bind({}.toString)


// -- Exception helpers ------------------------------------------------
function expectType(predicate, name, actual) {
  if (!predicate(actual)) {
    var a = JSON.stringify(actual)
    throw flaw('TypeError', 'expected a ' + name + ', got ' + a) }}


// -- Internal helpers -------------------------------------------------
var _nil = _cons(null, null)


function _cons(a, b) {
  return { head: a, tail: b }}


function _toList(as) {
  return foldr(as, function(a, b) { return _cons(b, a) }, _nil)}


function _evaluateIn(environment){ return function(expression) {
  return evaluate(expression, environment) }}


function _fold(list, initial, f) {
  if (list === _nil)  return initial

  var result = initial
  while (list !== _nil) {
    result = f(result, list.head)
    list   = list.tail }

  return result }


function _toArray(list) {
  return _fold(list, [], function(as, a) {
                           as.push(a)
                           return as })}


// -- Constructing primitives ------------------------------------------
var Primitive = Base.derive({
  init:
  function _init(expression) {
    this.underlying = expression }

, call:
  function _call(expression, environment) {
    var args = [environment].concat(_toArray(expression))
    return this.underlying.apply(null, args) }
})


var Applicative = Base.derive({
  init:
  function _init(expression) {
    this.underlying = expression }

, call:
  function _call(expression, environment) {
    var args = slice(arguments, 1).map(_evaluateIn(environment))
    return this.underlying.apply(null, args) }
})


function primitive(expression) {
  return Primitive.make(expression) }


function applicative(expression) {
  return Applicative.make(expression) }


function operative(args, rest, bodyList, lexical) {
  var body = _toArray(bodyList)
  var last = body.pop()

  return function() {
           var world = clone(lexical)
           args.forEach(defineIn(world, arguments))
           if (rest)  world[rest] = _toList(slice(arguments, args.length))

           body.forEach(_evaluateIn(world))
           return evaluate(last, world) }

  function defineIn(environment, as) { return function(name, index) {
    environment[name] = as[index] }}}


function wrap(expression) {
  return applicative(expression) }


function unwrap(expression) {
  expectType(isApplicative, 'applicative', expression)
  return expression.underlying }


// -- Environment primitives -------------------------------------------
function makeEnvironment(parent) {
  var env
  return env = clone( parent
                    , { 'current-world': function(){ return env }})}


function lookup(symbol, environment) {
  return !environment?           raise(flaw('NoEnvironment'
                                           , 'No environment provided to '
                                           + 'look-up for "' + symbol + '"'))
  :      symbol in environment?  environment[symbol]
  :      /* otherwise */         raise(flaw('ReferenceError'
                                           ,'Undefined variable "' + symbol + '"')) }


var world = makeEnvironment(null)


// -- Predicates -------------------------------------------------------
function isSymbol(expression) {
  return classOf(expression) === '[object String]' }


function isCons(expression) {
  return Object(expression) === expression
      && 'head' in expression }


function isApplicable(expression) {
  return isCons(expression)
      && expression !== _nil }


function isFunction(expression) {
  return typeof expression === 'function' }


function isCallable(expression) {
  return Object(expression) === expression
      && 'call' in expression }


function isApplicative(expression) {
  return Object(expression) === expression
      && Applicative.isPrototypeOf(expression) }


// -- Evaluation primitives --------------------------------------------
function apply(operator, operands, env) {
  return isFunction(operator)?  operator.apply(null, [env].concat(_toArray(operands)))
  :      isCallable(operator)?  operator.call(operands, env)
  :      /* otherwise */        raise(flaw('InvocationError'
                                          ,'Attempting to call a non-callable "'
                                          + JSON.stringify(operator) + '"')) }


function evaluate(exp, environment) {
  return isApplicable(exp)?  apply( evaluate(exp.head, environment)
                                  , exp.tail
                                  , environment)
  :      isSymbol(exp)?      lookup(exp, environment)
  :      exp?                exp
  :      /* otherwise */     _nil }



// -- Core primitives --------------------------------------------------
world['eval']   = evaluate
world['wrap']   = wrap
world['unwrap'] = unwrap

world['$define!'] = primitive(function $define(env, name, exp) {
  expectType(isSymbol, 'symbol', name)

  var value = evaluate(exp, env)
  env[name] = value
  return value })


world['$vau'] = primitive(function $vau(env, formals) {
  var body = _toList(slice(arguments, 2))
  var args = _toArray(formals.head)
  var rest = formals.tail == _nil?  null : formals.tail

  return operative(args, rest, body, makeEnvironment(env)) })


// -- Core predicates --------------------------------------------------
world['list?']        = isCons
world['operative?']   = isFunction
world['applicative?'] = isApplicative
world['number?']      = function(a){ return classOf(a) === '[object Number]' }
world['symbol?']      = isSymbol


// -- List primitives --------------------------------------------------
world['nil']  = _nil
world['head'] = function(as){ return as.head }
world['tail'] = function(as){ return as.tail }


// -- Logic operations -------------------------------------------------
world['#f'] = function(a, b){ return b }
world['#t'] = function(a, b){ return a }

world['='] = function(a, b) {
  return a === b?  world['#t']
  :                world['#f'] }

world['<'] = function(a, b) {
  return a < b?  world['#t']
  :              world['#f'] }