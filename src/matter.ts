import Matter from "matter-js";

function initializeMatter() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const wallDepth = 50;

  const engine = Matter.Engine.create();
  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);
  const render = Matter.Render.create({
    element: document.body,
    engine,
    options: {
      width: windowWidth,
      height: windowHeight,
      showAngleIndicator: true,
    },
  });
  Matter.Render.run(render);

  addMouseControl(engine, render);
  addWalls(engine, windowWidth, windowHeight, wallDepth);
  addBodies(engine);
}

function addMouseControl(engine: Matter.Engine, render: Matter.Render) {
  render.mouse = Matter.Mouse.create(render.canvas);
  Matter.Composite.add(engine.world, Matter.MouseConstraint.create(engine));
}

function addWalls(
  engine: Matter.Engine,
  width: number,
  height: number,
  depth: number
) {
  const wallProps: [number, number, number, number][] = [
    [0, height / 2, depth, height],
    [width, height / 2, depth, height],
    [width / 2, 0, width, depth],
    [width / 2, height, width, depth],
  ];
  const walls: Matter.Body[] = wallProps.map((props) =>
    Matter.Bodies.rectangle(...props, { isStatic: true })
  );
  Matter.Composite.add(engine.world, walls);
}

function addBodies(engine: Matter.Engine) {
  function addBody(x: number, y: number): Matter.Body {
    const sides = Math.round(Matter.Common.random(1, 8));
    const chamfer: Matter.IChamfer | undefined =
      sides > 2 && Matter.Common.random() > 0.7 ? { radius: 10 } : undefined;
    return Math.round(Matter.Common.random(0, 1)) === 0
      ? Matter.Bodies.rectangle(
          x,
          y,
          Matter.Common.random() < 0.8
            ? Matter.Common.random(25, 50)
            : Matter.Common.random(80, 120),
          Matter.Common.random(25, 50),
          { chamfer }
        )
      : Matter.Bodies.polygon(x, y, sides, Matter.Common.random(25, 50), {
          chamfer,
        });
  }
  const stack = Matter.Composites.stack(20, 20, 10, 5, 0, 0, addBody);
  Matter.Composite.add(engine.world, stack);
}

export default initializeMatter;
