{
  input_shake: `
    let offset = function() {
      let seed = Math.random() / 100;
      let xIntensity = seed * (effect_a * 10);
      let yIntensity = seed * (effect_b * 10);

      return [xIntensity, yIntensity]; 
    }

    let pnts = [
      offset(),
      offset(),
      offset(),
      offset()
    ]

    setInputPoints(0, function(vertex, points) {
      for (let i=0; i<points.length; i++){
        points[i][0] = points[i][0] + pnts[vertex][0];
        points[i][1] = points[i][1] + pnts[vertex][1];
      } 
    })
  `;

  breath_output: `
    let getCenter = function(idx) {
      let shape = state.shapes[idx];
      let xSum = 0;
      let xLen = 0;

      let ySum = 0;
      let yLen = 0; 
      for (let i=0; i<shape.tris.length; i++) {
        let tri = shape.tris[i];

        for (let j=0; j<tri.output.length; j++) {
          xSum += tri.output[j][0];
          ySum += tri.output[j][1];

          xLen++;
          yLen++;
        }
      }
      
      let avgX = xSum / xLen;
      let avgY = ySum / yLen;

      return [avgX, avgY]
    } 

    let shapeIdx = 0;
    let seed = (lfo(0, 1, effect_a * 10).sin()) / 100;
    let growth = seed * (effect_b * 10);
    let center = getCenter(shapeIdx);


    setOutputPoints(shapeIdx, function(vertex, points) {
      for (let i=0; i<points.length; i++){
        let run = points[i][0] - center[0];
        let rise = points[i][1] - center[1];
        let hypo = Math.sqrt(Math.pow(run, 2) + Math.pow(rise, 2));

        points[i][0] = points[i][0] + (run/hypo * growth);
        points[i][1] = points[i][1] + (rise/hypo * growth);
      }
    })

    setInputPoints(shapeIdx, function(vertex, points) {
      for (let i=0; i<points.length; i++){
        let run = points[i][0] - center[0];
        let rise = points[i][1] - center[1];
        let hypo = Math.sqrt(Math.pow(run, 2) + Math.pow(rise, 2));

        points[i][0] = points[i][0] - (run/hypo * growth);
        points[i][1] = points[i][1] - (rise/hypo * growth);
      }
    })
  `;
}
