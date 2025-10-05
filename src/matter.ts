import Matter from "matter-js";

function initializeMatter() {
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const Runner = Matter.Runner;
  const Composites = Matter.Composites;
  const Common = Matter.Common;
  const MouseConstraint = Matter.MouseConstraint;
  const Mouse = Matter.Mouse;
  const Composite = Matter.Composite;
  const Bodies = Matter.Bodies;

  // create engine
  const engine = Engine.create();
  const world = engine.world;

  // create renderer
  const render = Render.create({
    element: document.body,
    engine,
    options: {
      width: 800,
      height: 600,
      showAngleIndicator: true,
    }
  });
  Render.run(render);

  // create runner
  const runner = Runner.create();
  Runner.run(runner, engine);

  // add bodies
  const stack = Composites.stack(20, 20, 10, 5, 0, 0, function (x: number, y: number) {
    const sides = Math.round(Common.random(1, 8));

    // round the edges of some bodies
    let chamfer = null;
    if (sides > 2 && Common.random() > 0.7) {
      chamfer = {
        radius: 10
      };
    }

    switch (Math.round(Common.random(0, 1))) {
      case 0:
        if (Common.random() < 0.8) {
          return Bodies.rectangle(x, y, Common.random(25, 50), Common.random(25, 50), { chamfer: chamfer ?? undefined });
        } else {
          return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(25, 30), { chamfer: chamfer ?? undefined });
        }
      case 1:
        return Bodies.polygon(x, y, sides, Common.random(25, 50), { chamfer: chamfer ?? undefined });
    }
  });
  Composite.add(world, stack);

  // add walls
  Composite.add(world, [
    Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
    Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
    Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
    Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
  ]);

  // add mouse control
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;

  // fit the render viewport to the scene
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: 800, y: 600 }
  });
}

export default initializeMatter;

