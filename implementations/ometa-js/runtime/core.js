// # Module core
//
// Core runtime for PoLiz

var clone = Object.create

function extend(a, b) {
  Object.keys(b).forEach(function(k) {
                           a[k] = b[k]
                         })
  return a }

function cons(a, b) {
  return { head: a, tail: b }}

function list() {
  return [].reduceRight.call(arguments, function(a, b) {
                                          return cons(b, a)
                                        }, nil)}

function head(as) {
  return as.head }

function tail(as) {
  return as.tail }

var nil = cons(null, null)

var classOf = Function.call.bind({}.toString)
var slice   = Function.call.bind([].slice)

// :: [A], B, (A -> B) -> B
function fold(list, initial, f) {
  if (list === nil)  return initial

  var result = initial
  while (list !== nil) {
    result = f(result, head(list))
    list   = tail(list) }

  return result }

// :: [A] -> array A
function toArray(list) {
  return fold(list, [], function(as, a) {
                          as.push(a)
                          return as })}

// :: string, environment A -> maybe A
function lookup(symbol, environment) {
  return symbol in environment?  environment[symbol]
  :      /* otherwise */         nil }

// :: A, environment B -> A
function evaluate(exp, environment) {
  return isCons(exp)?     apply( evaluate(head(exp), environment)
                               , tail(exp))
  :      isSymbol(exp)?   lookup(exp, environment)
  :      /* otherwise */  nil
}

// :: A -> bool
function isCons(as) {
  return Object(as) === as
      && 'head' in as
      && as != nil }

// :: A -> bool
function isSymbol(as) {
  return classOf(as) == '[object String]' }

function apply(operator, operands) {
  return operator.apply(null, toArray(operands)) }

// :: string, A, environment A -> ()
function set(symbol, value, environment) {
  (environment || world)[symbol] = value
  return nil }

// :: [symbol . symbol], [expression] -> Vau
function vau(args, rest, bodyList) {
  var body  = toArray(bodyList)
  var last  = body.pop()

  return function(env) {
           var world = env = clone(env)
           var ps    = arguments
           args.forEach(function(n, i){ world[n] = ps[i] })
           world[rest] = list.apply(null, slice(arguments, args.length))
           body.forEach(function(as){ evaluate(as, world) })
           return evaluate(last, world) }
}

function makeEnvironment(parent) {
  var env = extend( clone(parent)
                  , { 'current-world': function(){ return env } })
  return env }

var world = makeEnvironment(clone(null))

extend(world, { '$vau'             : vau
              , '$define!'         : set
              , 'eval'             : evaluate
              , 'make-environment' : makeEnvironment
              , 'list'             : list
              , 'nil'              : nil
              })
