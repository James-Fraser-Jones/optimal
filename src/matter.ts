import Matter from "matter-js";
import * as Lambda from "./lambda";

const unit = 60;

function addConstraint(
  world: Matter.World,
  options: Matter.IConstraintDefinition
) {
  Matter.Composite.add(
    world,
    Matter.Constraint.create({
      ...options,
      render: {
        strokeStyle: "#ffffffff",
        lineWidth: 2,
      },
    })
  );
}

function addLabel(body: Matter.Body, text: string) {
  const label = document.createElement("div");
  label.className = "label";
  label.id = body.id.toString();
  label.innerText = text;
  document.body.appendChild(label);
}

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
      wireframes: false,
      background: "#b5b5b5ff",
      hasBounds: true,
    },
  });
  Matter.Render.run(render);
  addMouseControl(engine, render);
  addZoomPanControl(render);
  addLabelUpdate(engine, render);
  addExpressionExample(engine, Lambda.S);
}

function addMouseControl(engine: Matter.Engine, render: Matter.Render) {
  render.mouse = Matter.Mouse.create(render.canvas);
  Matter.Composite.add(
    engine.world,
    Matter.MouseConstraint.create(engine, { mouse: render.mouse })
  );
}

function getOffset(render: Matter.Render): Matter.Vector {
  return render.bounds.min;
}
function getScale(render: Matter.Render): Matter.Vector {
  const scale = {
    x: (render.bounds.max.x - render.bounds.min.x) / render.options.width!,
    y: (render.bounds.max.y - render.bounds.min.y) / render.options.height!,
  };
  console.log("scale", scale);
  return scale;
}
function getDisplayPosition(position: Matter.Vector, render: Matter.Render) {
  const offset = getOffset(render);
  const scale = getScale(render);
  return {
    x: (position.x - offset.x) / scale.x,
    y: (position.y - offset.y) / scale.y,
  };
}

function updateMouse(render: Matter.Render) {
  Matter.Mouse.setScale(render.mouse, getScale(render));
  Matter.Mouse.setOffset(render.mouse, render.bounds.min);
}

function addZoomPanControl(render: Matter.Render) {
  let isPanning = false;
  let lastMousePosition: Matter.Vector;
  const zoomScaleFactor = 0.9;
  render.canvas.addEventListener(
    "wheel",
    function (event) {
      event.preventDefault();
      const zoomScale =
        event.deltaY > 0 ? 1 / zoomScaleFactor : zoomScaleFactor;
      const currentWorldWidth = render.bounds.max.x - render.bounds.min.x;
      const newWorldWidth = currentWorldWidth * zoomScale;
      const newWorldHeight =
        (newWorldWidth * render.options.height!) / render.options.width!;
      const worldScaleFactor =
        (currentWorldWidth / render.options.width!) * (1 - zoomScale);
      render.bounds.min.x += event.offsetX * worldScaleFactor;
      render.bounds.min.y += event.offsetY * worldScaleFactor;
      render.bounds.max.x = render.bounds.min.x + newWorldWidth;
      render.bounds.max.y = render.bounds.min.y + newWorldHeight;
    },
    { passive: false }
  );
  render.canvas.addEventListener("mousedown", function (event) {
    if (event.button === 2) {
      isPanning = true;
      lastMousePosition = { x: event.clientX, y: event.clientY };
    }
  });
  render.canvas.addEventListener("mouseup", function (event) {
    if (event.button === 2) {
      isPanning = false;
    }
  });
  render.canvas.addEventListener("mousemove", function (event) {
    if (!isPanning) return;
    const client: Matter.Vector = { x: event.clientX, y: event.clientY };
    const delta = Matter.Vector.sub(client, lastMousePosition);
    const scale = getScale(render);
    const scaledDelta: Matter.Vector = {
      x: delta.x * scale.x,
      y: delta.y * scale.y,
    };
    render.bounds.min = Matter.Vector.sub(render.bounds.min, scaledDelta);
    render.bounds.max = Matter.Vector.sub(render.bounds.max, scaledDelta);
    lastMousePosition = client;
    updateMouse(render);
  });
}

function addWalls(world: Matter.World) {
  const wallDepth = 50;
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

  let height = unit + unit;
  const body = Matter.Bodies.polygon(windowWidth / 2, height, 4, unit, {
    angle: (1 * Math.PI) / 4,
    render: {
      fillStyle: "#bc5353ff",
    },
  });
  addConstraint(engine.world, {
    pointA: { x: windowWidth / 2, y: 0 },
    bodyB: body,
    pointB: {
      x: 0,
      y: -unit,
    },
  });
  height += unit + unit;

  height += unit;
  const body2 = Matter.Bodies.polygon(windowWidth / 2, height, 3, unit, {
    angle: (3 * Math.PI) / 6,
    render: {
      fillStyle: "#6ed360ff",
    },
  });
  addConstraint(engine.world, {
    bodyA: body,
    pointA: {
      x: 0,
      y: unit,
    },
    bodyB: body2,
    pointB: {
      x: 0,
      y: -unit,
    },
  });
  height += unit * Math.sin((5 * Math.PI) / 6) + unit;

  height += unit / 2;
  const body3 = Matter.Bodies.circle(
    windowWidth / 2 + unit * Math.cos((1 * Math.PI) / 6),
    height,
    unit / 2,
    {
      render: {
        fillStyle: "#555ad6ff",
      },
    }
  );
  addConstraint(engine.world, {
    bodyA: body2,
    pointA: {
      x: unit * Math.cos((1 * Math.PI) / 6),
      y: unit * Math.sin((5 * Math.PI) / 6),
    },
    bodyB: body3,
    pointB: { x: 0, y: -unit / 2 },
  });

  const body4 = Matter.Bodies.circle(
    windowWidth / 2 - unit * Math.cos((1 * Math.PI) / 6),
    height,
    unit / 2,
    {
      render: {
        fillStyle: "#555ad6ff",
      },
    }
  );

  addConstraint(engine.world, {
    bodyA: body2,
    pointA: {
      x: unit * Math.cos((5 * Math.PI) / 6),
      y: unit * Math.sin((5 * Math.PI) / 6),
    },
    bodyB: body4,
    pointB: { x: 0, y: -unit / 2 },
  });

  Matter.Composite.add(engine.world, [body, body2, body3, body4]);

  // setTimeout(() => {
  //   const constraint = Matter.Constraint.create({
  //     bodyA: body3,
  //     pointA: {
  //       x: 0,
  //       y: +unit / 2,
  //     },
  //     bodyB: body4,
  //     pointB: { x: 0, y: +unit / 2 },
  //   });
  //   Matter.Composite.add(engine.world, [constraint]);
  //   Matter.Composite.remove(engine.world, constraint4);
  // }, 5000);

  addLabel(body, "λx");
  addLabel(body2, "@");
  addLabel(body3, "x");
  addLabel(body4, "x");
}

function addLabelUpdate(engine: Matter.Engine, render: Matter.Render) {
  Matter.Events.on(engine, "afterUpdate", function () {
    document.querySelectorAll<HTMLElement>(".label").forEach((label) => {
      const id = Number(label.id);
      const body = Matter.Composite.get(
        engine.world,
        id,
        "body"
      ) as Matter.Body;
      if (body) {
        const position = body.position;
        const displayPosition = getDisplayPosition(position, render);
        const scale = getScale(render);
        label.style.left = `${displayPosition.x}px`;
        label.style.top = `${displayPosition.y}px`;
        label.style.fontSize = `${16 / Math.max(scale.x, scale.y)}px`;
        //labelElement.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      } else {
        label.remove();
      }
    });
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
