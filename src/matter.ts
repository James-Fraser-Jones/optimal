import Matter from "matter-js";
import * as Lambda from "./lambda";

const yGap: number = 70;

const abstractionRadius = 40;
const abstractionSides = 4;

const applicationRadius = 50;
const applicationSides = 3;

const variableRadius = 30;
const variableSides = 6;

const wallDepth = 50;

function initializeMatter() {
  const [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];

  const engine = Matter.Engine.create();
  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);
  const render = Matter.Render.create({
    element: document.body,
    engine,
    options: {
      width: windowWidth,
      height: windowHeight,
      showAngleIndicator: false,
    },
  });
  Matter.Render.run(render);

  addMouseControl(engine, render);
  //addWalls(engine.world);
  addExpressionExample(engine, Lambda.S);
}

function addMouseControl(engine: Matter.Engine, render: Matter.Render) {
  render.mouse = Matter.Mouse.create(render.canvas);
  Matter.Composite.add(engine.world, Matter.MouseConstraint.create(engine));
}

function addWalls(world: Matter.World) {
  const [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];
  const wallProps: [number, number, number, number][] = [
    [0, windowHeight / 2, wallDepth, windowHeight],
    [windowWidth, windowHeight / 2, wallDepth, windowHeight],
    [windowWidth / 2, 0, windowWidth, wallDepth],
    [windowWidth / 2, windowHeight, windowWidth, wallDepth],
  ];
  const walls: Matter.Body[] = wallProps.map((props) =>
    Matter.Bodies.rectangle(...props, { isStatic: true })
  );
  Matter.Composite.add(world, walls);
}

function addExpressionExample(
  engine: Matter.Engine,
  expression: Lambda.Expression
) {
  const [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];

  let height = abstractionRadius + yGap;
  const body = Matter.Bodies.polygon(
    windowWidth / 2,
    height,
    4,
    abstractionRadius,
    {
      angle: (1 * Math.PI) / 4,
    }
  );
  const constraint = Matter.Constraint.create({
    pointA: { x: windowWidth / 2, y: 0 },
    bodyB: body,
    pointB: {
      x: 0,
      y: -abstractionRadius,
    },
  });
  height += abstractionRadius + yGap;

  height += applicationRadius;
  const body2 = Matter.Bodies.polygon(
    windowWidth / 2,
    height,
    3,
    applicationRadius,
    {
      angle: (3 * Math.PI) / 6,
    }
  );
  const constraint2 = Matter.Constraint.create({
    bodyA: body,
    pointA: {
      x: 0,
      y: abstractionRadius,
    },
    bodyB: body2,
    pointB: {
      x: 0,
      y: -applicationRadius,
    },
  });
  height += applicationRadius * Math.sin((5 * Math.PI) / 6) + yGap;

  height += variableRadius;
  const body3 = Matter.Bodies.circle(
    windowWidth / 2 + applicationRadius * Math.cos((1 * Math.PI) / 6),
    height,
    variableRadius
  );
  const constraint3 = Matter.Constraint.create({
    bodyA: body2,
    pointA: {
      x: applicationRadius * Math.cos((1 * Math.PI) / 6),
      y: applicationRadius * Math.sin((5 * Math.PI) / 6),
    },
    bodyB: body3,
    pointB: { x: 0, y: -variableRadius },
  });
  const body4 = Matter.Bodies.circle(
    windowWidth / 2 - applicationRadius * Math.cos((1 * Math.PI) / 6),
    height,
    variableRadius
  );
  const constraint4 = Matter.Constraint.create({
    bodyA: body2,
    pointA: {
      x: applicationRadius * Math.cos((5 * Math.PI) / 6),
      y: applicationRadius * Math.sin((5 * Math.PI) / 6),
    },
    bodyB: body4,
    pointB: { x: 0, y: -variableRadius },
  });

  Matter.Composite.add(engine.world, [
    body,
    constraint,
    body2,
    constraint2,
    body3,
    constraint3,
    body4,
    constraint4,
  ]);

  setTimeout(() => {
    const constraint = Matter.Constraint.create({
      bodyA: body3,
      pointA: {
        x: 0,
        y: +variableRadius,
      },
      bodyB: body4,
      pointB: { x: 0, y: +variableRadius },
    });
    Matter.Composite.add(engine.world, [constraint]);
    Matter.Composite.remove(engine.world, constraint4);
  }, 5000);

  const labels: Record<number, HTMLElement> = {};
  labels[body.id] = document.getElementById("label-A")!;
  labels[body2.id] = document.getElementById("label-B")!;
  labels[body3.id] = document.getElementById("label-C")!;
  labels[body4.id] = document.getElementById("label-D")!;
  Matter.Events.on(engine, "beforeUpdate", function () {
    for (const bodyId in labels) {
      const body = Matter.Composite.get(
        engine.world,
        parseInt(bodyId),
        "body"
      ) as Matter.Body;
      const labelElement = labels[bodyId];
      if (body && labelElement) {
        const x = body.position.x;
        const y = body.position.y;
        labelElement.style.left = `${x}px`;
        labelElement.style.top = `${y}px`;
        //labelElement.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      }
    }
  });
}

function addConstraintsExample(engine: Matter.Engine) {
  const body1 = Matter.Bodies.polygon(150, 200, 5, 30);
  const constraint1 = Matter.Constraint.create({
    pointA: { x: 150, y: 100 },
    bodyB: body1,
    pointB: { x: -10, y: -10 },
  });
  Matter.Composite.add(engine.world, [body1, constraint1]);

  const body2 = Matter.Bodies.polygon(280, 100, 3, 30);
  const constraint2 = Matter.Constraint.create({
    pointA: { x: 280, y: 120 },
    bodyB: body2,
    pointB: { x: -10, y: -7 },
    stiffness: 0.001,
  });
  Matter.Composite.add(engine.world, [body2, constraint2]);

  const body3 = Matter.Bodies.polygon(400, 100, 4, 30);
  const constraint3 = Matter.Constraint.create({
    pointA: { x: 400, y: 120 },
    bodyB: body3,
    pointB: { x: -10, y: -10 },
    stiffness: 0.001,
    damping: 0.05,
  });
  Matter.Composite.add(engine.world, [body3, constraint3]);

  const body4 = Matter.Bodies.rectangle(600, 200, 200, 20);
  const ball = Matter.Bodies.circle(550, 150, 20);
  const constraint4 = Matter.Constraint.create({
    pointA: { x: 600, y: 200 },
    bodyB: body4,
    length: 0,
  });
  Matter.Composite.add(engine.world, [body4, ball, constraint4]);

  const body5 = Matter.Bodies.rectangle(500, 400, 100, 20, {
    collisionFilter: { group: -1 },
  });
  const ball2 = Matter.Bodies.circle(600, 400, 20, {
    collisionFilter: { group: -1 },
  });
  const constraint5 = Matter.Constraint.create({
    bodyA: body5,
    bodyB: ball2,
  });
  Matter.Composite.add(engine.world, [body5, ball2, constraint5]);

  const bodyA = Matter.Bodies.polygon(100, 400, 6, 20);
  const bodyB = Matter.Bodies.polygon(200, 400, 1, 50);
  const constraint6 = Matter.Constraint.create({
    bodyA: bodyA,
    pointA: { x: -10, y: -10 },
    bodyB: bodyB,
    pointB: { x: -10, y: -10 },
  });
  Matter.Composite.add(engine.world, [bodyA, bodyB, constraint6]);

  const bodyA2 = Matter.Bodies.polygon(300, 400, 4, 20);
  const bodyB2 = Matter.Bodies.polygon(400, 400, 3, 30);
  const constraint7 = Matter.Constraint.create({
    bodyA: bodyA2,
    pointA: { x: -10, y: -10 },
    bodyB: bodyB2,
    pointB: { x: -10, y: -7 },
    stiffness: 0.001,
  });
  Matter.Composite.add(engine.world, [bodyA2, bodyB2, constraint7]);

  const bodyA3 = Matter.Bodies.polygon(500, 400, 6, 30);
  const bodyB3 = Matter.Bodies.polygon(600, 400, 7, 60);
  const constraint8 = Matter.Constraint.create({
    bodyA: bodyA3,
    pointA: { x: -10, y: -10 },
    bodyB: bodyB3,
    pointB: { x: -10, y: -10 },
    stiffness: 0.001,
    damping: 0.1,
  });
  Matter.Composite.add(engine.world, [bodyA3, bodyB3, constraint8]);
}

function addBodiesExample(engine: Matter.Engine) {
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
