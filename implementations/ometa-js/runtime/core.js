// # Module core
//
// Core runtime for PoLiz
(function() {
  var clone = Object.create

  function extend(a, b) {
    Object.keys(b).forEach(function(k) {
                             a[k] = b[k]
                           })
    return a }

  // :: A, B -> (A, B)
  function cons(_, a, b) {
    return { head: a
           , tail: b }}

  // :: environment -> environment
  function makeEnvironment(_, parent) {
    if (!parent || parent == nil)  parent = null
    return clone(parent) }

  // :: string, environment A -> A
  function evaluate(_, name, environment) {
    return environment[name] }

  // :: environment A, string, A -> ()
  function define(environment, name, value) {
    environment[name] = value
    return nil }

  // :: (A, B) -> A
  function head(_, as) {
    return as.head }

  // :: (A, B) -> B
  function tail(_, as) {
    return as.tail }

  // :: ()
  var nil = cons(null, null)

  // :: environment A
  var world = extend(clone(null), { nil                : nil
                                  , cons               : cons
                                  , head               : head
                                  , tail               : tail
                                  , define             : define
                                  , evaluate           : evaluate
                                  , 'make-environment' : makeEnvironment
                                  })

  return world
})()