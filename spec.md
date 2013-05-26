# PoLiz

PoLiz is a minimal Lisp-1 (Scheme-inspired) dialect. And when I say *minimal*,
I **really** mean it.


## Overview

PoLiz is a minimal Lisp-1 dialect, supporting functional idioms with
first-class macros and proper closures.

There are four types in PoLiz:

- Number;
- Symbol;
- Cons;
- Lambda;

All other types are derived from these.


## Semantics

PoLiz is a language with first-class, lexically scoped macros. This means that
all functions are macros — they decide which arguments should be evaluated.

The language has 2 basic types (Number, Symbol), a container type (Cons) and a
lexical code type (Lambda). Lambdas are defined in terms of the most basic
types, lists are defined in term of cons cells, and strings are defined as
lists of chars, which in turn are defined as integers.

Numbers are double-precision floating points.

Symbols are unique tagged values (`struct { tag: 'symbol', value: 'foo' }`).
Symbols comparisons are case-insensitive, which means that `:foo` is the same
as `:FOO`.

Chars are just integers, and strings are lists of chars. The language provides
a minimal supporting syntax for both.

Lists are a series of Cons cells (`(head . tail)`), where the last item is
automatically `nil`, which is a special List value. The syntax `(a b c)` is
sugar for `(a . (b . (c . nil)))`.

Lambdas are lexical, closured macros. Variadic macros are supported, by way of
the `| a . bs |` parameter definition syntax. Evaluation must be explicitly
performed by way of the evaluation special form (`~`).

A macro's body is a list of expressions, and the last expression is returned
from the macro's evaluation. Which means that: `{ a b c }` would return the
result of evaluating `c`.

A program is composed of many top-level expressions. Expressions at the
top-level are evaluated by default, which means that `(a b)` at the top level
means apply `b` to the macro `a`.


## Standard library

PoLiz defines a minimal standard library:

### Logic

```clj
(<= a b)                ;; less or equal than
(< a b)                 ;; less than
(>= a b)                ;; greater or equal than
(> a b)                 ;; greater than
(= a b)                 ;; equal to
(not a)                 ;; logical NOT
(and . as)              ;; logical AND
(or . as)               ;; logical OR
```

### Numbers

```clj
(+ a b)                 ;; Addition
(- a b)                 ;; Subtraction
(* a b)                 ;; Multiplication
(/ a b)                 ;; Division
(modulo a b)            ;; Modulus
```

### Lists

```clj
(head as)               ;; The first item of a cons
(tail as)               ;; The second item of a cons
```

### Lambda

```clj
(apply f as)            ;; Applies a function to a list
```

### I/O

```clj
(print a)               ;; Prints a value to output
(read a)                ;; Reads a as a PoLiz program
```



## Syntax

```hs
comment :: ";" (anything but EOL)

digit  :: "0" .. "9"
sign   :: "-" | "+"
digits :: digit+
number :: sign? digits ("." digits)

char         :: "\\" anything
stringEscape :: "\\\""
stringChar   :: (not stringEscape | "\"") anything
string       :: "\"" stringChar* "\""
symbol       :: ":" (not whitespace)+

brackets  :: "(" | ")" | "{" | "}"
symbols   :: '!' | '@' | '#' | '$' | '%' | '&' | '*' | '-' | '_' | '='
           | '+' | '^' | '~' | '?' | '/' | '>' | '<'
letter    :: "a" .. "z" | "A" .. "Z"           
nameStart :: symbols | letter
nameRest  :: symbols | letter | digit
name      :: nameStart nameRest*

cons :: "(" expr "." expr ")"
list :: "(" expr* ")"

lambda :: "{" args? expr* "}"
args   :: name "|" name* ("." name)? "|"

eval    :: "~" value

values  :: number | char | name | symbol | string | cons | list | lambda
expr    :: eval | value
program :: expr*
```

