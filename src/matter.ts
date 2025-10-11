import Matter from "matter-js";
import * as Lambda from "./lambda";

const bgColor = "#032B43";
const absColor = "#D00000";
const appColor = "#136F63";
const varColor = "#FFBA08";
const constraintColor = "#FFFFFF";

//main
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
      background: bgColor,
      hasBounds: true,
    },
  });
  Matter.Render.run(render);
  addMouseControl(engine, render);
  addZoomPanControl(render);
  addLabelUpdate(engine, render);

  const s = Lambda.Y;
  const sizedS = Lambda.sizeExpression(s);
  const matteredS = matterExpression(sizedS);
  addMatteredExpression(engine, matteredS);
}

//utils
function getScale(render: Matter.Render): Matter.Vector {
  return {
    x: (render.bounds.max.x - render.bounds.min.x) / render.options.width!,
    y: (render.bounds.max.y - render.bounds.min.y) / render.options.height!,
  };
}
function getDisplayPosition(
  position: Matter.Vector,
  render: Matter.Render
): Matter.Vector {
  const offset = render.bounds.min;
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

//modules
function addMouseControl(engine: Matter.Engine, render: Matter.Render) {
  render.mouse = Matter.Mouse.create(render.canvas);
  Matter.Composite.add(
    engine.world,
    Matter.MouseConstraint.create(engine, {
      mouse: render.mouse,
      constraint: {
        render: {
          strokeStyle: constraintColor,
          lineWidth: 2,
        },
      },
    })
  );
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
        label.style.fontSize = `${radius / Math.max(scale.x, scale.y)}px`;
        //labelElement.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      } else {
        label.remove();
      }
    });
  });
}

function getCircleVector(angle: number, radius: number): Matter.Vector {
  return {
    x: Math.cos(angle * 2 * Math.PI) * radius,
    y: Math.sin(angle * 2 * Math.PI) * radius,
  };
}

type PositionStyle = "body" | "func" | "arg";
function positionStyleToAngle(style: PositionStyle): number {
  switch (style) {
    case "body":
      return 1.5;
    case "func":
      return 2.5;
    case "arg":
      return 0.5;
  }
}

//mattered expressions
interface MatterMetadata extends Lambda.SizeMetadata {
  body: Matter.Body;
  constraint: Matter.Constraint;
  label: HTMLElement;
}
type MatteredExpression = Lambda.Expression<MatterMetadata>;
const radius = 40;
function matterExpression(
  expr: Lambda.SizedExpression,
  topLeft: Matter.Vector = { x: 0, y: radius * 2 },
  parent: MatteredExpression | null = null,
  position: "body" | "func" | "arg" | undefined = undefined
): MatteredExpression {
  const mattered = expr as unknown as MatteredExpression;
  Lambda.match(
    expr,
    (abs) => {
      mattered.metadata.body = Matter.Bodies.circle(
        topLeft.x + expr.metadata.root * radius * 2,
        topLeft.y,
        radius,
        {
          // angle: Math.PI / 4,
          render: {
            fillStyle: absColor,
          },
        }
      );
      mattered.metadata.constraint = createConstraint({
        bodyA: parent?.metadata?.body,
        pointA: parent
          ? getCircleVector(positionStyleToAngle(position!) / 6, radius)
          : {
              x: topLeft.x + expr.metadata.root * radius * 2,
              y: 0,
            },
        bodyB: mattered.metadata.body,
        pointB: {
          x: 0,
          y: -radius,
        },
      });
      mattered.metadata.label = createLabel(
        mattered.metadata.body,
        `λ${abs.binder}`
      );
      matterExpression(
        abs.body,
        { x: topLeft.x, y: topLeft.y + radius * 3 },
        mattered,
        "body"
      );
    },
    (app) => {
      mattered.metadata.body = Matter.Bodies.circle(
        topLeft.x + expr.metadata.root * radius * 2,
        topLeft.y,
        radius,
        {
          render: {
            fillStyle: appColor,
          },
        }
      );
      mattered.metadata.constraint = createConstraint({
        bodyA: parent?.metadata?.body,
        pointA: parent
          ? getCircleVector(positionStyleToAngle(position!) / 6, radius)
          : {
              x: topLeft.x + expr.metadata.root * radius * 2,
              y: 0,
            },
        bodyB: mattered.metadata.body,
        pointB: {
          x: 0,
          y: -radius,
        },
      });
      mattered.metadata.label = createLabel(mattered.metadata.body, "@");
      matterExpression(
        app.func,
        { x: topLeft.x, y: topLeft.y + radius * 3 },
        mattered,
        "func"
      );
      matterExpression(
        app.arg,
        {
          x: topLeft.x + app.func.metadata.width * radius * 2,
          y: topLeft.y + radius * 3,
        },
        mattered,
        "arg"
      );
    },
    (v) => {
      mattered.metadata.body = Matter.Bodies.circle(
        topLeft.x + expr.metadata.root * radius * 2,
        topLeft.y,
        radius,
        {
          render: {
            fillStyle: varColor,
          },
        }
      );
      mattered.metadata.constraint = createConstraint({
        bodyA: parent?.metadata?.body,
        pointA: parent
          ? getCircleVector(positionStyleToAngle(position!) / 6, radius)
          : {
              x: topLeft.x + expr.metadata.root * radius * 2,
              y: 0,
            },
        bodyB: mattered.metadata.body,
        pointB: {
          x: 0,
          y: -radius,
        },
      });
      mattered.metadata.label = createLabel(
        mattered.metadata.body,
        `${v.name}`
      );
    }
  );
  return mattered;
}

//add primitives
function addMatteredExpression(
  engine: Matter.Engine,
  expr: MatteredExpression
) {
  Matter.Composite.add(engine.world, [
    expr.metadata.body,
    expr.metadata.constraint,
  ]);
  document.body.appendChild(expr.metadata.label);
  Lambda.match(
    expr,
    (abs) => {
      addMatteredExpression(engine, abs.body);
    },
    (app) => {
      addMatteredExpression(engine, app.func);
      addMatteredExpression(engine, app.arg);
    },
    (_) => {}
  );
}

//create primitives
function createConstraint(
  options: Matter.IConstraintDefinition
): Matter.Constraint {
  return Matter.Constraint.create({
    ...options,
    render: {
      strokeStyle: constraintColor,
      lineWidth: 2,
    },
  });
}
function createLabel(body: Matter.Body, text: string): HTMLElement {
  const label = document.createElement("div");
  label.className = "label";
  label.id = body.id.toString();
  label.innerText = text;
  return label;
}

export default initializeMatter;
