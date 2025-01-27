angledLineOfXLength
Create a line segment from the current 2-dimensional sketch origin

along some angle (in degrees) for some relative length in the 'x' dimension.


angledLineOfXLength(data: AngledLineData, sketch: Sketch, tag?: TagDeclarator) -> Sketch
Arguments
Name	Type	Description	Required
data	AngledLineData	Data to draw an angled line.	Yes
sketch	Sketch	A sketch is a collection of paths.	Yes
tag	TagDeclarator		No
Returns
Sketch - A sketch is a collection of paths.

Examples

sketch001 = startSketchOn('XZ')
  |> startProfileAt([0, 0], %)
  |> angledLineOfXLength({ angle = 45, length = 10 }, %, $edge1)
  |> angledLineOfXLength({ angle = -15, length = 20 }, %, $edge2)
  |> line([0, -5], %)
  |> close(%, $edge3)

extrusion = extrude(10, sketch001)

