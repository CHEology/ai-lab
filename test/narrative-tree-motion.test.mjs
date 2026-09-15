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
    buttons: { flip: element(), 'zoom-in': element(), 'zoom-out': element() },
    angle: 0, zoom, minZoom: .6, width, height: width, pan: { x: 0, y: 0 },
    selected: -1, drag: null, animation: 0, blockClickUntil: 0, framed: false, paint: 0, wheelAt: -Infinity, wheelIntent: null, gesture: null,
  });
  view.stage.getBoundingClientRect = () => ({ left: 0, width, height: width, top: 2000 - viewport.scrollY, bottom: 2000 + width - viewport.scrollY });
  view.section.getBoundingClientRect = () => ({ top: 2000 - toolbarHeight - viewport.scrollY });
  view.toolbar.getBoundingClientRect = () => ({ height: toolbarHeight, bottom: toolbarHeight });
  view.render();
  const advance = ms => {
    now += ms;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(now));
  };
  const event = (x = 0, y = 0, type = 'mouse', alt = false) => ({
    button: 0, isPrimary: true, pointerId: 1, clientX: x, clientY: y,
    pointerType: type, altKey: alt, target: { closest: () => null }, preventDefault() {},
  });
  const drag = (x, { cancel = false, type = 'mouse', y = 0, alt = false } = {}) => {
    view.pointerDown(event(0, 0, type, alt));
    view.pointerMove(event(x, y, type, alt));
    view.pointerEnd(event(x, y, type, alt), cancel);
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

test('short Alt-drags return home; deliberate Alt-drags flip at desktop and narrow widths, including high zoom', () => {
  for (const zoom of [1, 12]) {
    for (const [width, short, deliberate] of [[1200, 80, 300], [366, 60, 150]]) {
      const { view, drag } = scene({ width, zoom });
      drag(short, { alt: true });
      assert.equal(view.angle, 0, 'small movement does not flip');
      drag(deliberate, { alt: true });
      assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
      drag(-deliberate, { alt: true });
      assert.equal(view.angle, 0, 'reverse gesture returns to crown');
    }
  }
});

test('one turn completes before repeated buttons or incidental pointer presses can interrupt it', () => {
  const { view, advance, event, frames } = scene();
  view.flip(); advance(500);
  const angle = view.angle, animation = view.animation;
  view.flip(); view.flip(-1); view.pointerDown(event(0, 0, 'mouse', true));
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
  drag(300, { cancel: true, alt: true }); assert.equal(view.angle, 0);
  drag(30, { type: 'touch', y: 300 }); assert.equal(view.angle, 0);
  drag(3000, { alt: true }); assert.ok(Math.abs(view.angle - Math.PI) < 1e-10);
});

test('panning does not flip and reduced-motion turns finish without queued animation', () => {
  const { view, drag } = scene({ zoom: 3 });
  drag(160, { y: 40 });
  assert.equal(view.pan.x, 160); assert.equal(view.pan.y, 40); assert.equal(view.angle, 0);
  const reduced = scene({ reducedMotion: true });
  reduced.view.flip();
  assert.ok(Math.abs(reduced.view.angle - Math.PI) < 1e-10);
  assert.equal(reduced.frames.size, 0); assert.equal(reduced.view.buttons.flip.disabled, false);
});

test('minimum zoom frames the whole rotating artwork below the toolbar across viewport sizes', () => {
  for (const [width, viewportHeight, toolbarHeight] of [[1200, 650, 80], [714, 774, 80], [366, 844, 96], [1200, 320, 80]]) {
    const { view, viewport, advance } = scene({ width, viewportHeight, toolbarHeight });
    view.resize();
    view.pan = { x: 180, y: -120 };
    view.setZoom(0);
    assert.equal(view.buttons['zoom-out'].disabled, true);
    assert.equal(view.framed, true);
    assert.equal(view.pan.x, 0); assert.equal(view.pan.y, 0);
    const center = view.stage.getBoundingClientRect().top + width / 2;
    const halfDiagonal = width * view.zoom * Math.SQRT2 / 2;
    assert.ok(center - halfDiagonal >= toolbarHeight + 23.9);
    assert.ok(center + halfDiagonal <= viewport.innerHeight - 23.9);
    view.setZoom(view.zoom * 1.35); advance(16);
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

test('ordinary dragging follows the pointer at every zoom, including minimum, without snapping back', () => {
  for (const zoom of [.6, 1, 8]) {
    const { view, drag, advance } = scene({ zoom });
    view.framed = true;
    drag(480, { y: -300 });
    assert.equal(view.pan.x, 480); assert.equal(view.pan.y, -300);
    assert.equal(view.angle, 0); assert.equal(view.animation, 0);
    assert.equal(view.framed, false);
    assert.equal(view.buttons['zoom-out'].disabled, false, 'minus can still restore an overview');
    advance(2000);
    assert.equal(view.pan.x, 480, 'release never springs back');
  }
  assert.doesNotMatch(html, /data-action="pan"|setPanMode|clampPan/);
});

test('cursor-anchored zoom keeps the same artwork point in place without scrolling the document', () => {
  const { view, viewport } = scene({ zoom: 2 });
  view.angle = Math.PI / 3; view.pan = { x: 130, y: -240 };
  const point = { x: 240, y: 400 };
  const before = { x: (point.x - view.width / 2 - view.pan.x) / view.zoom, y: (point.y - view.height / 2 - view.pan.y) / view.zoom };
  view.zoomAt(5, point);
  assert.ok(Math.abs(view.width / 2 + view.pan.x + before.x * view.zoom - point.x) < 1e-9);
  assert.ok(Math.abs(view.height / 2 + view.pan.y + before.y * view.zoom - point.y) < 1e-9);
  view.zoomAt(0, point);
  assert.equal(view.zoom, view.minZoom);
  assert.equal(view.framed, false, 'a gesture reaching minimum does not force a camera reset');
  assert.equal(viewport.scrollY, 0);
});

function wheelEvent(overrides = {}) {
  return { deltaX: 0, deltaY: 0, deltaMode: 0, clientX: 420, clientY: 2420,
    cancelable: true, ctrlKey: false, shiftKey: false, metaKey: false,
    preventDefault() { this.prevented = true; }, ...overrides };
}

test('wheel steps and pinch zoom, while continuous trackpad packets keep panning through acceleration', () => {
  const mouse = scene();
  const step = wheelEvent({ deltaY: -100 }); mouse.view.wheel(step);
  assert.equal(step.prevented, true); assert.ok(mouse.view.zoom > 1);
  const trackpad = scene();
  trackpad.view.wheel(wheelEvent({ deltaX: 12.5, deltaY: 8.25 }));
  trackpad.view.wheel(wheelEvent({ deltaY: 120 }));
  assert.equal(trackpad.view.zoom, 1);
  assert.equal(trackpad.view.pan.x, -12.5); assert.equal(trackpad.view.pan.y, -128.25);
  const oldZoom = trackpad.view.zoom;
  trackpad.view.wheel(wheelEvent({ deltaY: -9, ctrlKey: true }));
  assert.ok(trackpad.view.zoom > oldZoom, 'pinch zoom takes precedence over the pan stream');
  const forcedPan = scene();
  forcedPan.view.wheel(wheelEvent({ deltaY: 3, deltaMode: 1, shiftKey: true }));
  assert.equal(forcedPan.view.pan.y, -48); assert.equal(forcedPan.view.zoom, 1);
  const ignored = wheelEvent({ deltaY: 100, cancelable: false });
  forcedPan.view.wheel(ignored); assert.equal(ignored.prevented, undefined);
});

test('dense gesture events coalesce painting, and Safari scale gestures do not double apply wheel input', () => {
  const { view, frames, advance } = scene();
  for (let i = 0; i < 30; i++) view.wheel(wheelEvent({ deltaX: 1, deltaY: 2 }));
  assert.equal(frames.size, 1); assert.equal(view.pan.x, -30); assert.equal(view.pan.y, -60);
  advance(16); assert.equal(frames.size, 0);
  view.gestureStart(wheelEvent({ scale: 1 }));
  view.gestureChange(wheelEvent({ scale: 1.4 }));
  assert.ok(Math.abs(view.zoom - 1.4) < 1e-9);
  view.wheel(wheelEvent({ ctrlKey: true, deltaY: -20 }));
  assert.ok(Math.abs(view.zoom - 1.4) < 1e-9);
  view.gestureChange(wheelEvent({ scale: 1.7 }));
  assert.ok(Math.abs(view.zoom - 1.7) < 1e-9);
});

test('a normal drag remains available while a button flip is playing', () => {
  const { view, event, advance } = scene();
  view.flip(); advance(400);
  view.pointerDown(event(100, 100));
  view.pointerMove(event(150, 130));
  view.pointerEnd(event(150, 130), false);
  advance(1200);
  assert.equal(view.pan.x, 50); assert.equal(view.pan.y, 30);
  assert.ok(Math.abs(view.angle - Math.PI) < 1e-9);
});
