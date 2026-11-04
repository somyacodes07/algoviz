import { BAR_VALUES, FIB_TRACE } from './trace';

// One field of hard square pixels, five shapes: confetti, fib(6) call tree, sort bars, BFS graph, pulse.
// Raw WebGL2, no blending, and a frame is drawn only when something changed.

const BAR_COUNT = BAR_VALUES.length;

export interface SceneState {
  morph: number;
  step: number;
  current: number;
  graphStep: number;
  lang: number;
  fade: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotY: number;
  barX: Float32Array;
  barMoving: number;
}

const VERT = `#version 300 es
precision highp float;
in vec3 aFrom;
in vec3 aTo;
in vec3 aMeta;  // rand, edge flags (tree + 2 * graph), bar index
in vec3 aFlow;  // tree enter, tree exit, graph order
uniform float uF, uAspect, uStep, uCurrent, uGraphStep, uLang, uFade, uPixel, uScale, uRotY, uTurb, uBarMoving, uShadowPass;
uniform int uFromId, uToId;
uniform vec2 uOffset, uMouse, uShadow;
uniform vec3 uCard, uLine, uInk;
uniform float uBarX[${BAR_COUNT}];
out vec3 vColor;

const vec3 SAFFRON = vec3(0.976, 0.451, 0.086);
const vec3 AZURE = vec3(0.231, 0.510, 0.965);
const vec3 YELLOW = vec3(0.980, 0.800, 0.082);

vec3 place(vec3 p, int id) {
  if (id == 2) p.x += uBarX[int(aMeta.z)];
  return p;
}

// xyz = colour, w = size in css px
vec4 look(int id, vec3 accent, vec3 second) {
  float r = aMeta.x;
  float treeEdge = mod(aMeta.y, 2.0);
  float graphEdge = floor(aMeta.y / 2.0);
  if (id == 0) {
    vec3 c = r < 0.3 ? YELLOW : r < 0.55 ? accent : r < 0.8 ? second : uCard;
    return vec4(c, 7.0);
  }
  if (id == 1) {
    float entered = step(aFlow.x, uStep);
    float left = step(aFlow.y, uStep);
    float current = (1.0 - treeEdge) * (1.0 - step(0.0005, abs(aFlow.x - uCurrent))) * (1.0 - left);
    vec3 c = mix(mix(uCard, uLine, treeEdge), accent, entered);
    c = mix(c, second, left);
    c = mix(c, YELLOW, current);
    return vec4(c, treeEdge > 0.5 ? 3.5 : 6.5);
  }
  if (id == 2) {
    float t = aMeta.z / ${(BAR_COUNT - 1).toFixed(1)};
    vec3 c = mix(YELLOW, accent, t);
    float hot = 1.0 - step(0.5, abs(aMeta.z - uBarMoving));
    return vec4(mix(c, second, hot), 6.0);
  }
  if (id == 3) {
    float seen = step(aFlow.z, uGraphStep);
    float front = (1.0 - step(0.09, abs(uGraphStep - aFlow.z)));
    vec3 c = mix(mix(uCard, uLine, graphEdge), accent, seen);
    return vec4(mix(c, YELLOW, front * (1.0 - graphEdge)), graphEdge > 0.5 ? 3.5 : 6.5);
  }
  return vec4(accent, 5.0);
}

void main() {
  vec3 accent = mix(SAFFRON, AZURE, uLang);
  vec3 second = mix(AZURE, SAFFRON, uLang);

  // Each particle travels on its own fixed arc, so a morph never shimmers.
  float r = aMeta.x;
  float e = clamp((uF - r * 0.3) / 0.7, 0.0, 1.0);
  float f = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
  vec3 p = mix(place(aFrom, uFromId), place(aTo, uToId), f);
  float arc = sin(3.14159 * f) * uTurb;
  float a = r * 6.2831 * 7.0;
  p += arc * vec3(cos(a) * 0.32, sin(a) * 0.26, cos(a * 1.7) * 0.25);

  float c = cos(uRotY), s = sin(uRotY);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  p.xy = p.xy * uScale + uOffset;

  vec2 away = p.xy - uMouse;
  float dist = length(away);
  if (dist > 0.0001) p.xy += away / dist * exp(-dist * dist / 0.03) * 0.09;

  float w = 3.0 / max(3.0 - p.z, 0.4);
  gl_Position = vec4(p.x * w / uAspect, p.y * w, 0.0, 1.0);
  if (uShadowPass > 0.5) gl_Position.xy += uShadow;

  vec4 m = mix(look(uFromId, accent, second), look(uToId, accent, second), f);
  vColor = uShadowPass > 0.5 ? uInk : m.xyz;
  gl_PointSize = max(1.0, m.w * uPixel * uFade);
}`;

const FRAG = `#version 300 es
precision lowp float;
in vec3 vColor;
out vec4 outColor;
void main() {
  outColor = vec4(vColor, 1.0);
}`;

export const TREE_W = 1;
export const TREE_H = 0.66;
const NARROW_ASPECT = 0.95;

// Tree position of a call, in the units the shape is built in.
export function treeNodePoint(id: number) {
  const { nodes, leaves } = FIB_TRACE;
  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  const node = nodes[id];
  return {
    x: (node.x / (leaves - 1) - 0.5) * 2 * TREE_W,
    y: TREE_H - (node.depth / maxDepth) * TREE_H * 2,
  };
}

function buildShapes(count: number, aspect: number) {
  const shapes = Array.from({ length: 5 }, () => new Float32Array(count * 3));
  const meta = new Float32Array(count * 3);
  const flow = new Float32Array(count * 3);
  const set = (shape: number, i: number, x: number, y: number, z: number) => {
    shapes[shape][i * 3] = x;
    shapes[shape][i * 3 + 1] = y;
    shapes[shape][i * 3 + 2] = z;
  };

  const { nodes, steps } = FIB_TRACE;
  const total = steps.length;
  const treePos = nodes.map((n) => treeNodePoint(n.id));

  // Graph: nodes on a sphere, each joined to its nearest neighbours, numbered by real BFS.
  const graphCount = 18;
  const radius = Math.min(aspect * 0.8, 0.86);
  const graph = Array.from({ length: graphCount }, (_, i) => {
    const y = 1 - (i / (graphCount - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    return { x: Math.cos(a) * ring * radius, y: y * radius, z: Math.sin(a) * ring * radius };
  });
  const adj: number[][] = graph.map(() => []);
  const edges: [number, number][] = [];
  graph.forEach((a, i) => {
    graph
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ j }) => {
        if (!adj[i].includes(j)) {
          adj[i].push(j);
          adj[j].push(i);
          edges.push([i, j]);
        }
      });
  });
  const visitOrder = new Array(graphCount).fill(-1);
  const queue = [0];
  visitOrder[0] = 0;
  let visited = 1;
  while (queue.length) {
    const at = queue.shift() as number;
    adj[at].forEach((next) => {
      if (visitOrder[next] < 0) {
        visitOrder[next] = visited++;
        queue.push(next);
      }
    });
  }
  const graphOrder = (i: number) => Math.max(visitOrder[i], 0) / graphCount;

  // Bars: particles per bar follow bar height so the print density stays even.
  const barW = Math.min(aspect * 1.7, 2.3) / BAR_COUNT;
  const barCum: number[] = [];
  let barSum = 0;
  for (let i = 0; i < BAR_COUNT; i++) {
    barSum += i + 2;
    barCum.push(barSum);
  }

  const NODE = 0.036;
  // Phones draw the tree small, so its nodes grow to stay readable with a number inside.
  const TREE_NODE = aspect < NARROW_ASPECT ? 0.06 : NODE;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const bar = barCum.findIndex((v) => Math.random() * barSum <= v);
    const barIdx = bar < 0 ? BAR_COUNT - 1 : bar;
    let edgeFlags = 0;

    // Confetti
    set(0, i, (Math.random() * 2 - 1) * aspect * 1.05, Math.random() * 2.1 - 1.05, Math.random() * 0.6 - 0.3);

    // Call tree: solid square nodes joined by dotted lines
    const nodeIdx = Math.floor(Math.random() * nodes.length);
    const node = nodes[nodeIdx];
    const pos = treePos[nodeIdx];
    if (Math.random() < 0.62 || node.parent < 0) {
      set(1, i, pos.x + (Math.random() * 2 - 1) * TREE_NODE, pos.y + (Math.random() * 2 - 1) * TREE_NODE, 0);
    } else {
      const from = treePos[node.parent];
      const t = Math.random();
      set(1, i, from.x + (pos.x - from.x) * t, from.y + (pos.y - from.y) * t, 0);
      edgeFlags += 1;
    }
    flow[i * 3] = node.enter / total;
    flow[i * 3 + 1] = node.exit / total;

    // Bars: x is local, the shader adds the bar's current slot
    const barH = ((barIdx + 2) / (BAR_COUNT + 1)) * 0.86;
    set(2, i, (Math.random() - 0.5) * barW * 0.78, -0.96 + Math.random() * barH, 0);

    // Graph
    if (Math.random() < 0.55) {
      const n = Math.floor(Math.random() * graphCount);
      const g = graph[n];
      set(3, i, g.x + (Math.random() * 2 - 1) * NODE, g.y + (Math.random() * 2 - 1) * NODE, g.z);
      flow[i * 3 + 2] = graphOrder(n);
    } else {
      const [a, b] = edges[Math.floor(Math.random() * edges.length)];
      const t = Math.random();
      const ga = graph[a];
      const gb = graph[b];
      set(3, i, ga.x + (gb.x - ga.x) * t, ga.y + (gb.y - ga.y) * t, ga.z + (gb.z - ga.z) * t);
      flow[i * 3 + 2] = Math.max(graphOrder(a), graphOrder(b));
      edgeFlags += 2;
    }

    // Pulse: the logo's heartbeat stretched across the screen
    const px = (r * 2 - 1) * (aspect + 0.1);
    const u = (((px / Math.max(aspect, 0.8)) * 1.5 + 1000) % 1 + 1) % 1;
    let py = 0;
    if (u > 0.38 && u < 0.46) py = ((u - 0.38) / 0.08) * 0.42;
    else if (u >= 0.46 && u < 0.56) py = 0.42 - ((u - 0.46) / 0.1) * 0.72;
    else if (u >= 0.56 && u < 0.62) py = -0.3 + ((u - 0.56) / 0.06) * 0.3;
    set(4, i, px, py + (Math.random() - 0.5) * 0.014, 0);

    meta[i * 3] = r;
    meta[i * 3 + 1] = edgeFlags;
    meta[i * 3 + 2] = barIdx;
  }

  return { shapes, meta, flow };
}

export function barSlotX(aspect: number, slot: number) {
  const width = Math.min(aspect * 1.7, 2.3);
  return (slot / (BAR_COUNT - 1) - 0.5) * width * (1 - 1 / BAR_COUNT);
}

const hex = (value: string) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number];
const PALETTE = {
  light: { card: hex('#ffffff'), line: hex('#64748b'), ink: hex('#0f172a') },
  dark: { card: hex('#475569'), line: hex('#94a3b8'), ink: hex('#000000') },
};

export function createScene(canvas: HTMLCanvasElement, opts: { reduced: boolean }) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed');
    }
    return shader;
  };
  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
  }
  gl.useProgram(program);

  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program, name));
    return uniforms.get(name) ?? null;
  };

  const attr = {
    from: gl.getAttribLocation(program, 'aFrom'),
    to: gl.getAttribLocation(program, 'aTo'),
    meta: gl.getAttribLocation(program, 'aMeta'),
    flow: gl.getAttribLocation(program, 'aFlow'),
  };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const shapeBuffers = Array.from({ length: 5 }, () => gl.createBuffer());
  const metaBuffer = gl.createBuffer();
  const flowBuffer = gl.createBuffer();

  const fullCount = window.innerWidth < 768 ? 5000 : 12000;
  let drawCount = fullCount;
  let dprCap = window.innerWidth < 768 ? 1.25 : 1.5;
  let builtAspect = 0;
  let boundFrom = -1;
  let boundTo = -1;
  let aspect = 1;
  let dirty = true;
  let hidden = false;
  const last = new Float32Array(32);
  const mouse = { x: 10, y: 10, tx: 10, ty: 10 };

  const upload = () => {
    const data = buildShapes(fullCount, aspect);
    data.shapes.forEach((shape, i) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, metaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.meta, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attr.meta);
    gl.vertexAttribPointer(attr.meta, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, flowBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.flow, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attr.flow);
    gl.vertexAttribPointer(attr.flow, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attr.from);
    gl.enableVertexAttribArray(attr.to);
    boundFrom = -1;
    boundTo = -1;
    builtAspect = aspect;
  };

  const bindShapes = (from: number, to: number) => {
    if (from !== boundFrom) {
      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffers[from]);
      gl.vertexAttribPointer(attr.from, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1i(u('uFromId'), from);
      boundFrom = from;
    }
    if (to !== boundTo) {
      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffers[to]);
      gl.vertexAttribPointer(attr.to, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1i(u('uToId'), to);
      boundTo = to;
    }
  };

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = width / height;
    const pixel = dpr * Math.max(0.75, Math.min(height / 900, 1.15));
    gl.uniform1f(u('uAspect'), aspect);
    gl.uniform1f(u('uPixel'), pixel);
    const shadow = (width < 768 ? 1.75 : 4) * pixel;
    gl.uniform2f(u('uShadow'), (shadow * 2) / canvas.width, -(shadow * 2) / canvas.height);
    // Mobile toolbars nudge the height; only rebuild for a real layout change.
    if (!builtAspect || Math.abs(aspect - builtAspect) / builtAspect > 0.15) upload();
    dirty = true;
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    mouse.tx = ((e.clientX / window.innerWidth) * 2 - 1) * aspect;
    mouse.ty = 1 - (e.clientY / window.innerHeight) * 2;
  };
  if (!opts.reduced) window.addEventListener('pointermove', onPointer, { passive: true });

  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.uniform1f(u('uTurb'), opts.reduced ? 0 : 1);
  resize();

  // True when the frame was actually drawn.
  const render = (state: SceneState) => {
    mouse.x += (mouse.tx - mouse.x) * 0.1;
    mouse.y += (mouse.ty - mouse.y) * 0.1;

    const values = [state.morph, state.step, state.current, state.graphStep, state.lang, state.fade, state.offsetX, state.offsetY, state.scale, state.rotY, state.barMoving, mouse.x, mouse.y];
    let changed = dirty;
    for (let i = 0; i < values.length; i++) {
      if (Math.abs(values[i] - last[i]) > 0.0002) changed = true;
      last[i] = values[i];
    }
    for (let i = 0; i < state.barX.length; i++) {
      if (Math.abs(state.barX[i] - last[13 + i]) > 0.0002) changed = true;
      last[13 + i] = state.barX[i];
    }
    if (!changed) return false;
    dirty = false;

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (state.fade < 0.02) {
      if (!hidden) {
        hidden = true;
        canvas.style.visibility = 'hidden';
      }
      return true;
    }
    if (hidden) {
      hidden = false;
      canvas.style.visibility = '';
    }

    const seg = Math.min(Math.floor(state.morph), 3);
    bindShapes(seg, seg + 1);
    gl.uniform1f(u('uF'), state.morph - seg);
    gl.uniform1f(u('uStep'), state.step);
    gl.uniform1f(u('uCurrent'), state.current);
    gl.uniform1f(u('uGraphStep'), state.graphStep);
    gl.uniform1f(u('uLang'), state.lang);
    gl.uniform1f(u('uFade'), state.fade);
    gl.uniform1f(u('uScale'), state.scale);
    gl.uniform1f(u('uRotY'), state.rotY);
    gl.uniform1f(u('uBarMoving'), state.barMoving);
    gl.uniform2f(u('uOffset'), state.offsetX, state.offsetY);
    gl.uniform2f(u('uMouse'), mouse.x, mouse.y);
    gl.uniform1fv(u('uBarX'), state.barX);

    gl.uniform1f(u('uShadowPass'), 1);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    gl.uniform1f(u('uShadowPass'), 0);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    return true;
  };

  return {
    render,
    resize,
    getAspect: () => aspect,
    getSize: () => ({ width: canvas.clientWidth || window.innerWidth, height: canvas.clientHeight || window.innerHeight }),
    // Slow machine: draw fewer, coarser pixels. Particles are shuffled, so a prefix still fills every shape.
    degrade: () => {
      dprCap = 1;
      drawCount = Math.round(drawCount * 0.65);
      resize();
    },
    setDark: (isDark: boolean) => {
      const colors = isDark ? PALETTE.dark : PALETTE.light;
      gl.uniform3fv(u('uCard'), colors.card);
      gl.uniform3fv(u('uLine'), colors.line);
      gl.uniform3fv(u('uInk'), colors.ink);
      dirty = true;
    },
    destroy: () => {
      window.removeEventListener('pointermove', onPointer);
      shapeBuffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteBuffer(metaBuffer);
      gl.deleteBuffer(flowBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}

export type ParticleScene = NonNullable<ReturnType<typeof createScene>>;
