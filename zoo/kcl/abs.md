kcl →
abs
Compute the absolute value of a number.


abs(num: number) -> number
Tags
math
Arguments
Name	Type	Description	Required
num	number		Yes
Returns
number

Examples

myAngle = -120

sketch001 = startSketchOn('XZ')
  |> startProfileAt([0, 0], %)
  |> line([8, 0], %)
  |> angledLine({ angle = abs(myAngle), length = 5 }, %)
  |> line([-5, 0], %)
  |> angledLine({ angle = myAngle, length = 5 }, %)
  |> close(%)

baseExtrusion = extrude(5, sketch001)