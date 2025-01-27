kcl →
acos
Compute the arccosine of a number (in radians).


acos(num: number) -> number
Tags
math
Arguments
Name	Type	Description	Required
num	number		Yes
Returns
number

Examples

sketch001 = startSketchOn('XZ')
  |> startProfileAt([0, 0], %)
  |> angledLine({
       angle = toDegrees(acos(0.5)),
       length = 10
     }, %)
  |> line([5, 0], %)
  |> lineTo([12, 0], %)
  |> close(%)

extrude001 = extrude(5, sketch001)