import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../experiments/narrative-tree/public/index.html', import.meta.url), 'utf8');
const program = html.match(/<script id="tree-program">([\s\S]*?)<\/script>/)[1];

// Exercise the page's real controller with a deterministic frame clock. DOM
// rendering uses small attribute sinks; no duplicate motion implementation.
function scene({ width = 1200, zoom = 1, reducedMotion = false, viewportHeight = 800, toolbarHeight = 80 } = {}) {
  let now = 0, id = 0;
  const frames = new Map();
  const viewport = {
    innerHeight: viewportHeight, scrollY: 0,
    matchMedia: () => ({ matches: reducedMotion }),
    scrollTo({ top }) { this.scrollY = Math.max(0, top); },
  };
  const context = vm.createContext({
    document: { documentElement: { outerHTML: '' } },
    window: viewport,
    performance: { now: () => now },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: key => frames.delete(key),
  });
  const controller = program.slice(0, program.indexOf("    document.querySelectorAll('[data-tree]')")) + 'return TreeView; })();';
  const TreeView = vm.runInContext(controller, context);
  const element = () => ({
    style: {}, dataset: {}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector() { return this; }, focus() {}, setPointerCapture() {},
    classList: { add() {}, remove() {} },
  });
  const view = Object.assign(Object.create(TreeView.prototype), {
    section: element(), stage: element(), crown: element(), routeGeometry: element(),
    orientation: element(), ordinal: '第一棵树', markers: [], toolbar: element(), hint: element(),
    phases: [{ geometry: element(), size: 1254 }, { geometry: element(), size: 1254 }],
    buttons: { flip: element(), 'zoom-in': element(), 'zoom-out': element(), pan: element() },
    angle: 0, zoom, minZoom: .6, width, height: width, pan: { x: 0, y: 0 },
    selected: -1, drag: null, animation: 0, blockClickUntil: 0, panMode: false,
  });
  view.stage.getBoundingClientRect = () => ({ width, height: width, top: 2000 - viewport.scrollY, bottom: 2000 + width - viewport.scrollY });
  view.section.getBoundingClientRect = () => ({ top: 2000 - toolbarHeight - viewport.scrollY });
  view.toolbar.getBoundingClientRect = () => ({ height: toolbarHeight });
  view.render();
  const advance = ms => {
    now += ms;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(now));
  };
  const event = (x = 0, y = 0, type = 'mouse') => ({
    button: 0, isPrimary: true, pointerId: 1, clientX: x, clientY: y,
    pointerType: type, target: { closest: () => null },
  });
  const drag = (x, { cancel = false, type = 'mouse', y = 0 } = {}) => {
    view.pointerDown(event(0, 0, type));
    view.pointerMove(event(x, y, type));
    view.pointerEnd(event(x, y, type), cancel);
    advance(2000);
  };
  return { view, advance, event, drag, frames, viewport };
}

test('a button turn maintains scale and has a gentle, continuous start and finish', () => {
  const { view, advance } = scene({ zoom: 8 });
  view.flip();
  const angles = [view.angle];
  for (let i = 0; i < 100; i++) {
    advance(16);
    angles.push(view.angle);
    for (const phase of view.phases) assert.match(phase.geometry.attributes.transform, /scale\(8\)/);
    assert.match(view.routeGeometry.attributes.transform, /scale\(8\)/);
  }
  assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
  assert.ok(angles.every((angle, i) => i === 0 || angle >= angles[i - 1]));
  const steps = angles.slice(1).map((angle, i) => angle - angles[i]);
  assert.ok(steps[0] < steps[49] / 100, 'starts from rest');
  assert.ok(steps.at(-1) < steps[49] / 100, 'settles into rest');
  assert.ok(Math.abs(steps[49] - steps[50]) < .001, 'no midpoint velocity discontinuity');
  assert.equal(view.animation, 0);
  assert.equal(view.buttons.flip.disabled, false);
});

test('short drags return home; deliberate drags flip at desktop and narrow widths, including high zoom', () => {
  for (const zoom of [1, 12]) {
    for (const [width, short, deliberate] of [[1200, 80, 300], [366, 60, 150]]) {
      const { view, drag } = scene({ width, zoom });
      drag(short);
      assert.equal(view.angle, 0, 'small movement does not flip');
      drag(deliberate);
      assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
      drag(-deliberate);
      assert.equal(view.angle, 0, 'reverse gesture returns to crown');
    }
  }
});

test('one turn completes before repeated buttons or incidental pointer presses can interrupt it', () => {
  const { view, advance, event, frames } = scene();
  view.flip(); advance(500);
  const angle = view.angle, animation = view.animation;
  view.flip(); view.flip(-1); view.pointerDown(event());
  assert.equal(view.angle, angle);
  assert.equal(view.animation, animation);
  assert.equal(view.drag, null);
  assert.equal(frames.size, 1);
  assert.equal(view.buttons.flip.disabled, true);
  advance(1100);
  assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
  view.flip(); advance(1600);
  assert.equal(view.angle, 0);
});

test('cancelled gestures return home, long drags turn once, and vertical touch remains scrollable', () => {
  const { view, drag } = scene();
  drag(300, { cancel: true }); assert.equal(view.angle, 0);
  drag(30, { type: 'touch', y: 300 }); assert.equal(view.angle, 0);
  drag(3000); assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
});

test('panning does not flip and reduced-motion turns finish without queued animation', () => {
  const { view, drag } = scene({ zoom: 3 });
  view.panMode = true; drag(160, { y: 40 });
  assert.equal(view.pan.x, 160); assert.equal(view.pan.y, 40); assert.equal(view.angle, 0);
  const reduced = scene({ reducedMotion: true });
  reduced.view.flip();
  assert.ok(Math.abs(reduced.view.angle - Math.PI) < 1e-10);
  assert.equal(reduced.frames.size, 0); assert.equal(reduced.view.buttons.flip.disabled, false);
});

test('minimum zoom frames the whole rotating artwork below the toolbar across viewport sizes', () => {
  for (const [width, viewportHeight, toolbarHeight] of [[1200, 650, 80], [714, 774, 80], [366, 844, 96], [1200, 320, 80]]) {
    const { view, viewport } = scene({ width, viewportHeight, toolbarHeight });
    view.resize();
    view.pan = { x: 180, y: -120 }; view.panMode = true;
    view.setZoom(0);
    assert.equal(view.buttons['zoom-out'].disabled, true);
    assert.equal(view.buttons.pan.disabled, true);
    assert.equal(view.panMode, false);
    assert.equal(view.pan.x, 0); assert.equal(view.pan.y, 0);
    const center = view.stage.getBoundingClientRect().top + width / 2;
    const halfDiagonal = width * view.zoom * Math.SQRT2 / 2;
    assert.ok(center - halfDiagonal >= toolbarHeight + 23.9);
    assert.ok(center + halfDiagonal <= viewport.innerHeight - 23.9);
    view.setZoom(view.zoom * 1.35);
    assert.equal(view.buttons['zoom-out'].disabled, false);
  }
  assert.doesNotMatch(html, /data-action="reset"|this\.buttons\.reset/);
});

test('the active minimized tree stays visible when a window resize also reflows the page', () => {
  const { view, viewport } = scene();
  view.resize(); view.setZoom(0);
  const oldZoom = view.zoom;
  viewport.innerHeight = 420;
  view.stage.getBoundingClientRect = () => ({ width: 714, height: 714, top: 3200 - viewport.scrollY, bottom: 3914 - viewport.scrollY });
  view.section.getBoundingClientRect = () => ({ top: 3120 - viewport.scrollY });
  view.resize();
  assert.ok(view.zoom < oldZoom);
  const center = view.stage.getBoundingClientRect().top + view.height / 2;
  const halfDiagonal = view.width * view.zoom * Math.SQRT2 / 2;
  assert.ok(center - halfDiagonal >= 103.9);
  assert.ok(center + halfDiagonal <= 396.1);
});
