kcl →
angledLine
Draw a line segment relative to the current origin using the polar

measure of some angle and distance.


angledLine(data: AngledLineData, sketch: Sketch, tag?: TagDeclarator) -> Sketch
Arguments
Name	Type	Description	Required
data	AngledLineData	Data to draw an angled line.	Yes
sketch	Sketch	A sketch is a collection of paths.	Yes
tag	TagDeclarator		No
Returns
Sketch - A sketch is a collection of paths.

Examples

exampleSketch = startSketchOn('XZ')
  |> startProfileAt([0, 0], %)
  |> yLineTo(15, %)
  |> angledLine({ angle = 30, length = 15 }, %)
  |> line([8, -10], %)
  |> yLineTo(0, %)
  |> close(%)

example = extrude(10, exampleSketch)
