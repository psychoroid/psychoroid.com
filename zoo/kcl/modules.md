kcl →
modules
KCL allows splitting code up into multiple files. Each file is somewhat isolated from other files as a separate module.

When you define a function, you can use export before it to make it available to other modules.


// util.kcl
export fn increment(x) {
  return x + 1
}
Other files in the project can now import functions that have been exported. This makes them available to use in another file.


// main.kcl
import increment from "util.kcl"

answer = increment(41)
Imported files must be in the same project so that units are uniform across modules. This means that it must be in the same directory.

Import statements must be at the top-level of a file. It is not allowed to have an import statement inside a function or in the body of an if-else.

Multiple functions can be exported in a file.


// util.kcl
export fn increment(x) {
  return x + 1
}

export fn decrement(x) {
  return x - 1
}
When importing, you can import multiple functions at once.


import increment, decrement from "util.kcl"
Imported symbols can be renamed for convenience or to avoid name collisions.


import increment as inc, decrement as dec from "util.kcl"