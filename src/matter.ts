import Matter from "matter-js";
import * as Lambda from "./lambda";

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
      showAngleIndicator: true,
      wireframes: false,
      background: "#b5b5b5ff",
      hasBounds: true,
    },
  });
  Matter.Render.run(render);
  addMouseControl(engine, render);
  addZoomPanControl(render);
  addLabelUpdate(engine, render);
  addExpression(engine, Lambda.S);
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
    Matter.MouseConstraint.create(engine, { mouse: render.mouse })
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
        label.style.fontSize = `${16 / Math.max(scale.x, scale.y)}px`;
        //labelElement.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      } else {
        label.remove();
      }
    });
  });
}

//primitives
function addExpression(engine: Matter.Engine, expression: Lambda.Expression) {
  const unit = 60;
  let height = 0;

  height += 2 * unit;
  const body = Matter.Bodies.polygon(0, height, 4, unit, {
    angle: (1 * Math.PI) / 4,
    render: {
      fillStyle: "#bc5353ff",
    },
  });
  Matter.Composite.add(engine.world, body);
  addLabel(body, "λx");
  addConstraint(engine.world, {
    pointA: { x: 0, y: 0 },
    bodyB: body,
    pointB: {
      x: 0,
      y: -unit,
    },
  });
  height += 2 * unit;

  height += unit;
  const body2 = Matter.Bodies.polygon(0, height, 3, unit, {
    angle: (3 * Math.PI) / 6,
    render: {
      fillStyle: "#6ed360ff",
    },
  });
  Matter.Composite.add(engine.world, body2);
  addLabel(body2, "@");
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
  height += (1 + Math.sin((5 * Math.PI) / 6)) * unit;

  height += unit / 2;
  const body3 = Matter.Bodies.circle(
    0 + unit * Math.cos((1 * Math.PI) / 6),
    height,
    unit / 2,
    {
      render: {
        fillStyle: "#555ad6ff",
      },
    }
  );
  Matter.Composite.add(engine.world, body3);
  addLabel(body3, "x");
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
    0 - unit * Math.cos((1 * Math.PI) / 6),
    height,
    unit / 2,
    {
      render: {
        fillStyle: "#555ad6ff",
      },
    }
  );
  Matter.Composite.add(engine.world, body4);
  addLabel(body4, "x");
  addConstraint(engine.world, {
    bodyA: body2,
    pointA: {
      x: unit * Math.cos((5 * Math.PI) / 6),
      y: unit * Math.sin((5 * Math.PI) / 6),
    },
    bodyB: body4,
    pointB: { x: 0, y: -unit / 2 },
  });
}
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

export default initializeMatter;
