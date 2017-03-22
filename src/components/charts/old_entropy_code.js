
  makeEntropyNtBar(x, y, e, i) {
    return (
      <rect
        key={i}
        x={x(e.x)}
        y={y(e.y)}
        width="2" height={y(0) - y(e.y)}
        cursor={"pointer"}
        onClick={() => {this.setColorByGenotype("gt-nuc_" + (e.x + 1));}}
        fill={"#CCC"}
      />
    );
  }

  makeEntropyAABar(x, y, e, i) {
    return (
      <rect
        key={i}
        x={x(e.x)}
        y={y(e.y)}
        width="2.5" height={y(0) - y(e.y)}
        cursor={"pointer"}
        onClick={() => {this.setColorByGenotype("gt-" + e.prot + "_" + (e.codon + 1));}}
        fill={e.fill}
      />
    );
  }


  const makeXAxis = (chartGeom, domain) => (
    <VictoryAxis
      padding={{
        top: 0,
        bottom: 0,
        left: chartGeom.padLeft, // cosmetic, 1px overhang, add +1 if persists
        right: chartGeom.padRight // this is confusing, but ok
      }}
      domain={domain}
      offsetY={chartGeom.padBottom}
      width={chartGeom.width}
      standalone={false}
      label={"Position"}
      tickCount={5}
      style={{
        axis: {stroke: "black", padding: 0},
        axisLabel: {fontSize: 14, padding: 30, fill: darkGrey, fontFamily: dataFont},
        tickLabels: {fontSize: 12, padding: 0, fill: darkGrey, fontFamily: dataFont},
        ticks: {stroke: "black", size: 5, padding: 5}
      }}
    />
  );

  const makeYAxis = (chartGeom, domain) => (
    <VictoryAxis
      dependentAxis
      padding={{
        top: 0,
        bottom: chartGeom.padBottom,
        left: chartGeom.padLeft, // cosmetic, 1px overhang, add +1 if persists
        right: chartGeom.padRight / 2 // bug? why is that / 2 necessary...
      }}
      domain={domain}
      offsetY={chartGeom.padBottom}
      standalone={false}
      style={{
        axis: {stroke: "black", padding: 0},
        axisLabel: {fontSize: 14, padding: 30, fill: darkGrey, fontFamily: dataFont},
        tickLabels: {fontSize: 12, padding: 0, fill: darkGrey, fontFamily: dataFont},
        ticks: {stroke: "black", size: 5, padding: 5}
      }}
    />
  );

  const makeAnnotation = (x, y, yMax, e, i) => (
    <g key={i}>
      <rect
        x={x(e.start)}
        y={y(-0.025 * yMax * e.readingFrame)}
        width={x(e.end) - x(e.start)}
        height={12}
        fill={e.fill}
        stroke={e.fill}
      />
      <text
        x={0.5 * (x(e.start) + x(e.end)) }
        y={y(-0.025 * yMax * e.readingFrame) + 10}
        textAnchor={"middle"}
        fontSize={10}
        fill={"#444"}
      >
        {e.prot}
      </text>
    </g>
  );


  /* d3 scales */
  const x = d3.scale.linear()
    .domain([0, entropyNt.length]) // original array, since the x values are still mapped to that
    .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
  const yMax = Math.max(_.maxBy(entropyNtWithoutZeros, "y").y,
                        _.maxBy(aminoAcidEntropyWithoutZeros, "y").y);
  const y = d3.scale.linear()
    .domain([-0.11 * yMax, 1.2 * yMax]) // x values are mapped to orig array
    .range([chartGeom.height - chartGeom.padBottom, 0]);

  return (
    <Card title={"Diversity"}>
      {this.aaNtSwitch(styles)}
      <svg width={chartGeom.width} height={chartGeom.height}>
        {annotations.map(makeAnnotation.bind(this, x, y, yMax))}
        {this.state.aa ?
          aminoAcidEntropyWithoutZeros.map(this.makeEntropyAABar.bind(this, x, y)) :
          entropyNtWithoutZeros.map(this.makeEntropyNtBar.bind(this, x, y))
        }
        {makeXAxis(chartGeom, x.domain())}
        {makeYAxis(chartGeom, y.domain())}
      </svg>
    </Card>
  );
