import "@testing-library/jest-dom";

/* jsdom ships none of these, and framer-motion / recharts / TrackMap reach for
   them the moment a component mounts. Defined once here so every test file
   gets them (guarded, so a file may still install its own). */

window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }));

window.IntersectionObserver =
  window.IntersectionObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

window.ResizeObserver =
  window.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// No SVG geometry engine in jsdom; TrackMap samples the circuit path with these.
if (globalThis.SVGElement && !SVGElement.prototype.getTotalLength) {
  SVGElement.prototype.getTotalLength = () => 1000;
  SVGElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 });
}
