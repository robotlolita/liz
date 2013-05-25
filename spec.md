# Liz

Liz is a minimal Lisp-1 (Scheme-inspired) dialect. And when I say *minimal*, I **really** mean it.


## Overview

Liz is a minimal Lisp-1 dialect, supporting functional idioms with first-class macros and
proper closures.

There are five types in Liz:

- Number;
- Char;
- Symbol;
- List;
- Lambda;

All other types are derived from these.


## Semantics

( TODO )

## Syntax

```hs
comment :: ";" (anything but EOL)

digit :: "0" .. "9"
sign :: "-" | "+"
digits :: digit+
number :: sign? digits ("." digits)?

char :: "\\" anything
stringEscape :: "\\\""
stringChar :: (not stringEscape | "\"") anything
string :: "\"" stringChar* "\""
symbol :: ":" (not whitespace)+

brackets :: "(" | ")" | "{" | "}"
symbols :: "|" | ":"
nameStart :: not (digit | whitespace | brackets | symbols)
nameRest :: not (whitespace | brackets)
name :: nameStart nameRest*

list :: "(" value* ")"

lambda :: "{" args? value* "}"
args :: "|" name* "|"

values :: number | char | name | symbol | string | list | lambda
program :: value*
```
