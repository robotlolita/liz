// :: String -> String
exports.sanitise =
function sanitise(a) {
  return a.replace(/([^\w_])/g, function(x) {
    return '$' + (SymbolTable[x] || x.charCodeAt(0)) })}

// :: a, b -> Cons a b
exports.makeCons =
function makeCons(a, b){
  return 'new $cons(' + a + ', ' + b + ')' }

// :: [a] -> String
exports.makeVector =
function makeVector(as) {
  return as.reduceRight(function(a, b) {
                          return makeCons(b, a) }, 'nil')}

// :: string, [a] -> string
exports.makeCall =
function makeCall(n, as) {
  return '(' + n + ')(' + as.join(', ') + ')' }

// :: [String], [String] -> String
exports.makeLambda =
function makeLambda(as, b) {
  var last = b.pop()
  var init = b.join(';\n')
  last && (last = 'return ' + last)
  init && (init += ';')
  return '(function(' + as.join(', ') + '){\n' + init + last + '\n})' }

// :: string, string, string -> number
exports.ToNumber =
function ToNumber(sign, integral, decimal) {
  sign    = sign || '+'
  decimal = decimal || '0'

  return Number(sign + integral + '.' + decimal) }

// :: string -> ['char', string]
exports.ToChar =
function ToChar(c){
  return ['char', c] }

// :: a, [a] -> bool
exports.has =
function has(a, bs) {
  return bs.indexOf(a) != -1 }