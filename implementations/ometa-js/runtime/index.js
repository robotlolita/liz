// # Module core
//
// Core runtime for PoLiz

// -- Dependencies -----------------------------------------------------
var flaw     = require('flaw')
var boo      = require('boo')
var grammar  = require('../lib/grammar').LizParser
var compiler = require('../lib/compiler').LizCompiler


// -- Aliases ----------------------------------------------------------
var raise   = flaw.raise
var clone   = boo.derive
var extend  = boo.extend
var Base    = boo.Base
var foldr   = Function.call.bind([].reduceRight)
var slice   = Function.call.bind([].slice)
var classOf = Function.call.bind({}.toString)


// -- Inspecting -------------------------------------------------------
function inspect(e) {
  var parent = Object.getPrototypeOf(e)
  return parent == null?  e
  :                       boo.merge(parent, e) }

// -- Exception helpers ------------------------------------------------
function expectType(predicate, name, actual) {
  if (!predicate(actual)) {
    var a = JSON.stringify(actual)
    throw flaw('TypeError', 'expected a ' + name + ', got ' + a) }}


// -- Internal helpers -------------------------------------------------
var _nil = _cons(null, null)


function _cons(a, b) {
  return { head: a, tail: b }}


function _toList(as, a) {
  return foldr(as, function(a, b) { return _cons(b, a) }, a || _nil)}


function _evaluateIn(environment){ return function(expression) {
  return evaluate(expression, environment) }}


function _fold(list, initial, f) {
  if (list === _nil)  return initial

  var result = initial
  while (list !== _nil) {
    result = f(list.head, result)
    list   = list.tail }

  return result }


function _toArray(list) {
  return _fold(list, [], function(a, as) {
                           as.push(a)
                           return as })}


function _head(as) {
  expectType(isList, 'list', as)
  return isString(as)?    as.charCodeAt(0)
  :      /* otherwise */  as.head }

function _tail(as) {
  expectType(isList, 'list', as)
  return isString(as)?     as.slice(1)
  :      /* othewrise */   as.tail }


function bool(f) { return function() {
  var result = f.apply(null, arguments)
  return result === true?  world['#t']
  :                        world['#f'] }}


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
    var args = _toArray(expression).map(_evaluateIn(environment))
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
           var world = makeEnvironment(lexical)
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


function isString(expression) {
  return Object(expression) === expression
      && expression.tag === 'string' }


function isList(expression) {
  return isCons(expression)
      || isString(expression) }


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


function isNumber(expression) {
  return classOf(expression) === '[object Number]' }


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
  :      isString(exp)?      exp.value
  :      /* otherwise */     exp }



// -- Core primitives --------------------------------------------------
world['eval']   = wrap(evaluate)
world['wrap']   = wrap(function(f) { return wrap(f) })
world['unwrap'] = wrap(function(f) { return unwrap(f) })

world['inspect'] = wrap(function(v) {
  if (typeof v == 'function')     console.log('>>>', v.toString())
  else if (Object(v) === v)       console.log('>>>', inspect(v))
  else                            console.log('>>>', JSON.stringify(v))

  return v
})

world['$define!'] = primitive(function $define(env, name, exp) {
  expectType(isSymbol, 'symbol', name)

  var value = evaluate(exp, env)
  env[name] = value
  return value })


world['$vau'] = primitive(function $vau(env, formals, body) {
  var args = _toArray(formals.head)
  var rest = formals.tail == _nil?  null : formals.tail

  return operative(args, rest, body, makeEnvironment(env)) })


world['read'] = wrap(function read(data) {
  var ast = grammar.matchAll(data, 'value')
  return compiler.match(ast, 'eval')

  function toChar(a){ return String.fromCharCode(a) }})


// -- Core predicates --------------------------------------------------
world['list?']        = wrap(bool(isList))
world['operative?']   = wrap(bool(isFunction))
world['applicative?'] = wrap(bool(isApplicative))
world['number?']      = wrap(bool(isNumber))
world['symbol?']      = wrap(bool(isSymbol))


// -- List primitives --------------------------------------------------
world['nil']   = _nil
world['head']  = wrap(_head)
world['tail']  = wrap(_tail)
world['cons']  = wrap(_cons)
world['list*'] = wrap(function() {
                        var initial = slice(arguments, 0, -1)
                        var rest    = slice(arguments, -1)[0]
                        if (Array.isArray(rest))  rest = _toList(rest)
                        return initial.length? _toList(initial, rest)
                        :                      _toList(arguments) })


// -- Logic operations -------------------------------------------------
world['#f'] = function False(e, a, b){ return evaluate(b, e) }
world['#t'] = function True(e, a, b){ return evaluate(a, e) }

world['='] = wrap(bool(function isEqual(a, b) { return a === b }))
world['<'] = wrap(bool(function isLessThan(a, b) { return a < b }))

world['+'] = wrap(function add(a, b) {
  return a + b })

world['-'] = wrap(function sub(a, b) {
  return a - b })

// -- Exports ----------------------------------------------------------
module.exports = { world           : world
                 , evaluate        : evaluate
                 , makeEnvironment : makeEnvironment
                 , operative       : operative
                 , lookup          : lookup
                 , nil             : _nil
                 }