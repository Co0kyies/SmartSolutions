
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update$1(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*
     * anime.js v3.2.1
     * (c) 2020 Julian Garnier
     * Released under the MIT license
     * animejs.com
     */

    // Defaults

    var defaultInstanceSettings = {
      update: null,
      begin: null,
      loopBegin: null,
      changeBegin: null,
      change: null,
      changeComplete: null,
      loopComplete: null,
      complete: null,
      loop: 1,
      direction: 'normal',
      autoplay: true,
      timelineOffset: 0
    };

    var defaultTweenSettings = {
      duration: 1000,
      delay: 0,
      endDelay: 0,
      easing: 'easeOutElastic(1, .5)',
      round: 0
    };

    var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

    // Caching

    var cache = {
      CSS: {},
      springs: {}
    };

    // Utils

    function minMax(val, min, max) {
      return Math.min(Math.max(val, min), max);
    }

    function stringContains(str, text) {
      return str.indexOf(text) > -1;
    }

    function applyArguments(func, args) {
      return func.apply(null, args);
    }

    var is = {
      arr: function (a) { return Array.isArray(a); },
      obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
      pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
      svg: function (a) { return a instanceof SVGElement; },
      inp: function (a) { return a instanceof HTMLInputElement; },
      dom: function (a) { return a.nodeType || is.svg(a); },
      str: function (a) { return typeof a === 'string'; },
      fnc: function (a) { return typeof a === 'function'; },
      und: function (a) { return typeof a === 'undefined'; },
      nil: function (a) { return is.und(a) || a === null; },
      hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
      rgb: function (a) { return /^rgb/.test(a); },
      hsl: function (a) { return /^hsl/.test(a); },
      col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
      key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
    };

    // Easings

    function parseEasingParameters(string) {
      var match = /\(([^)]+)\)/.exec(string);
      return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
    }

    // Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

    function spring(string, duration) {

      var params = parseEasingParameters(string);
      var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
      var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
      var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
      var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
      var w0 = Math.sqrt(stiffness / mass);
      var zeta = damping / (2 * Math.sqrt(stiffness * mass));
      var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
      var a = 1;
      var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

      function solver(t) {
        var progress = duration ? (duration * t) / 1000 : t;
        if (zeta < 1) {
          progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
        } else {
          progress = (a + b * progress) * Math.exp(-progress * w0);
        }
        if (t === 0 || t === 1) { return t; }
        return 1 - progress;
      }

      function getDuration() {
        var cached = cache.springs[string];
        if (cached) { return cached; }
        var frame = 1/6;
        var elapsed = 0;
        var rest = 0;
        while(true) {
          elapsed += frame;
          if (solver(elapsed) === 1) {
            rest++;
            if (rest >= 16) { break; }
          } else {
            rest = 0;
          }
        }
        var duration = elapsed * frame * 1000;
        cache.springs[string] = duration;
        return duration;
      }

      return duration ? solver : getDuration;

    }

    // Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

    function steps(steps) {
      if ( steps === void 0 ) steps = 10;

      return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
    }

    // BezierEasing https://github.com/gre/bezier-easing

    var bezier = (function () {

      var kSplineTableSize = 11;
      var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

      function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
      function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
      function C(aA1)      { return 3.0 * aA1 }

      function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
      function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

      function binarySubdivide(aX, aA, aB, mX1, mX2) {
        var currentX, currentT, i = 0;
        do {
          currentT = aA + (aB - aA) / 2.0;
          currentX = calcBezier(currentT, mX1, mX2) - aX;
          if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
        } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
        return currentT;
      }

      function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
        for (var i = 0; i < 4; ++i) {
          var currentSlope = getSlope(aGuessT, mX1, mX2);
          if (currentSlope === 0.0) { return aGuessT; }
          var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
          aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
      }

      function bezier(mX1, mY1, mX2, mY2) {

        if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
        var sampleValues = new Float32Array(kSplineTableSize);

        if (mX1 !== mY1 || mX2 !== mY2) {
          for (var i = 0; i < kSplineTableSize; ++i) {
            sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
          }
        }

        function getTForX(aX) {

          var intervalStart = 0;
          var currentSample = 1;
          var lastSample = kSplineTableSize - 1;

          for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
          }

          --currentSample;

          var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
          var guessForT = intervalStart + dist * kSampleStepSize;
          var initialSlope = getSlope(guessForT, mX1, mX2);

          if (initialSlope >= 0.001) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
          } else if (initialSlope === 0.0) {
            return guessForT;
          } else {
            return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
          }

        }

        return function (x) {
          if (mX1 === mY1 && mX2 === mY2) { return x; }
          if (x === 0 || x === 1) { return x; }
          return calcBezier(getTForX(x), mY1, mY2);
        }

      }

      return bezier;

    })();

    var penner = (function () {

      // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

      var eases = { linear: function () { return function (t) { return t; }; } };

      var functionEasings = {
        Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
        Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
        Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
        Bounce: function () { return function (t) {
          var pow2, b = 4;
          while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
          return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
        }; },
        Elastic: function (amplitude, period) {
          if ( amplitude === void 0 ) amplitude = 1;
          if ( period === void 0 ) period = .5;

          var a = minMax(amplitude, 1, 10);
          var p = minMax(period, .1, 2);
          return function (t) {
            return (t === 0 || t === 1) ? t : 
              -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
          }
        }
      };

      var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

      baseEasings.forEach(function (name, i) {
        functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
      });

      Object.keys(functionEasings).forEach(function (name) {
        var easeIn = functionEasings[name];
        eases['easeIn' + name] = easeIn;
        eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
        eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
          1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
        eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
          (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
      });

      return eases;

    })();

    function parseEasings(easing, duration) {
      if (is.fnc(easing)) { return easing; }
      var name = easing.split('(')[0];
      var ease = penner[name];
      var args = parseEasingParameters(easing);
      switch (name) {
        case 'spring' : return spring(easing, duration);
        case 'cubicBezier' : return applyArguments(bezier, args);
        case 'steps' : return applyArguments(steps, args);
        default : return applyArguments(ease, args);
      }
    }

    // Strings

    function selectString(str) {
      try {
        var nodes = document.querySelectorAll(str);
        return nodes;
      } catch(e) {
        return;
      }
    }

    // Arrays

    function filterArray(arr, callback) {
      var len = arr.length;
      var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
      var result = [];
      for (var i = 0; i < len; i++) {
        if (i in arr) {
          var val = arr[i];
          if (callback.call(thisArg, val, i, arr)) {
            result.push(val);
          }
        }
      }
      return result;
    }

    function flattenArray(arr) {
      return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
    }

    function toArray(o) {
      if (is.arr(o)) { return o; }
      if (is.str(o)) { o = selectString(o) || o; }
      if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
      return [o];
    }

    function arrayContains(arr, val) {
      return arr.some(function (a) { return a === val; });
    }

    // Objects

    function cloneObject(o) {
      var clone = {};
      for (var p in o) { clone[p] = o[p]; }
      return clone;
    }

    function replaceObjectProps(o1, o2) {
      var o = cloneObject(o1);
      for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
      return o;
    }

    function mergeObjects(o1, o2) {
      var o = cloneObject(o1);
      for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
      return o;
    }

    // Colors

    function rgbToRgba(rgbValue) {
      var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
      return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
    }

    function hexToRgba(hexValue) {
      var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
      var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      var r = parseInt(rgb[1], 16);
      var g = parseInt(rgb[2], 16);
      var b = parseInt(rgb[3], 16);
      return ("rgba(" + r + "," + g + "," + b + ",1)");
    }

    function hslToRgba(hslValue) {
      var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
      var h = parseInt(hsl[1], 10) / 360;
      var s = parseInt(hsl[2], 10) / 100;
      var l = parseInt(hsl[3], 10) / 100;
      var a = hsl[4] || 1;
      function hue2rgb(p, q, t) {
        if (t < 0) { t += 1; }
        if (t > 1) { t -= 1; }
        if (t < 1/6) { return p + (q - p) * 6 * t; }
        if (t < 1/2) { return q; }
        if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
        return p;
      }
      var r, g, b;
      if (s == 0) {
        r = g = b = l;
      } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
    }

    function colorToRgb(val) {
      if (is.rgb(val)) { return rgbToRgba(val); }
      if (is.hex(val)) { return hexToRgba(val); }
      if (is.hsl(val)) { return hslToRgba(val); }
    }

    // Units

    function getUnit(val) {
      var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
      if (split) { return split[1]; }
    }

    function getTransformUnit(propName) {
      if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
      if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
    }

    // Values

    function getFunctionValue(val, animatable) {
      if (!is.fnc(val)) { return val; }
      return val(animatable.target, animatable.id, animatable.total);
    }

    function getAttribute(el, prop) {
      return el.getAttribute(prop);
    }

    function convertPxToUnit(el, value, unit) {
      var valueUnit = getUnit(value);
      if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
      var cached = cache.CSS[value + unit];
      if (!is.und(cached)) { return cached; }
      var baseline = 100;
      var tempEl = document.createElement(el.tagName);
      var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
      parentEl.appendChild(tempEl);
      tempEl.style.position = 'absolute';
      tempEl.style.width = baseline + unit;
      var factor = baseline / tempEl.offsetWidth;
      parentEl.removeChild(tempEl);
      var convertedUnit = factor * parseFloat(value);
      cache.CSS[value + unit] = convertedUnit;
      return convertedUnit;
    }

    function getCSSValue(el, prop, unit) {
      if (prop in el.style) {
        var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
        return unit ? convertPxToUnit(el, value, unit) : value;
      }
    }

    function getAnimationType(el, prop) {
      if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
      if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
      if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
      if (el[prop] != null) { return 'object'; }
    }

    function getElementTransforms(el) {
      if (!is.dom(el)) { return; }
      var str = el.style.transform || '';
      var reg  = /(\w+)\(([^)]*)\)/g;
      var transforms = new Map();
      var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
      return transforms;
    }

    function getTransformValue(el, propName, animatable, unit) {
      var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
      var value = getElementTransforms(el).get(propName) || defaultVal;
      if (animatable) {
        animatable.transforms.list.set(propName, value);
        animatable.transforms['last'] = propName;
      }
      return unit ? convertPxToUnit(el, value, unit) : value;
    }

    function getOriginalTargetValue(target, propName, unit, animatable) {
      switch (getAnimationType(target, propName)) {
        case 'transform': return getTransformValue(target, propName, animatable, unit);
        case 'css': return getCSSValue(target, propName, unit);
        case 'attribute': return getAttribute(target, propName);
        default: return target[propName] || 0;
      }
    }

    function getRelativeValue(to, from) {
      var operator = /^(\*=|\+=|-=)/.exec(to);
      if (!operator) { return to; }
      var u = getUnit(to) || 0;
      var x = parseFloat(from);
      var y = parseFloat(to.replace(operator[0], ''));
      switch (operator[0][0]) {
        case '+': return x + y + u;
        case '-': return x - y + u;
        case '*': return x * y + u;
      }
    }

    function validateValue(val, unit) {
      if (is.col(val)) { return colorToRgb(val); }
      if (/\s/g.test(val)) { return val; }
      var originalUnit = getUnit(val);
      var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
      if (unit) { return unitLess + unit; }
      return unitLess;
    }

    // getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
    // adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

    function getDistance(p1, p2) {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function getCircleLength(el) {
      return Math.PI * 2 * getAttribute(el, 'r');
    }

    function getRectLength(el) {
      return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
    }

    function getLineLength(el) {
      return getDistance(
        {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
        {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
      );
    }

    function getPolylineLength(el) {
      var points = el.points;
      var totalLength = 0;
      var previousPos;
      for (var i = 0 ; i < points.numberOfItems; i++) {
        var currentPos = points.getItem(i);
        if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
        previousPos = currentPos;
      }
      return totalLength;
    }

    function getPolygonLength(el) {
      var points = el.points;
      return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
    }

    // Path animation

    function getTotalLength(el) {
      if (el.getTotalLength) { return el.getTotalLength(); }
      switch(el.tagName.toLowerCase()) {
        case 'circle': return getCircleLength(el);
        case 'rect': return getRectLength(el);
        case 'line': return getLineLength(el);
        case 'polyline': return getPolylineLength(el);
        case 'polygon': return getPolygonLength(el);
      }
    }

    function setDashoffset(el) {
      var pathLength = getTotalLength(el);
      el.setAttribute('stroke-dasharray', pathLength);
      return pathLength;
    }

    // Motion path

    function getParentSvgEl(el) {
      var parentEl = el.parentNode;
      while (is.svg(parentEl)) {
        if (!is.svg(parentEl.parentNode)) { break; }
        parentEl = parentEl.parentNode;
      }
      return parentEl;
    }

    function getParentSvg(pathEl, svgData) {
      var svg = svgData || {};
      var parentSvgEl = svg.el || getParentSvgEl(pathEl);
      var rect = parentSvgEl.getBoundingClientRect();
      var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
      var width = rect.width;
      var height = rect.height;
      var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
      return {
        el: parentSvgEl,
        viewBox: viewBox,
        x: viewBox[0] / 1,
        y: viewBox[1] / 1,
        w: width,
        h: height,
        vW: viewBox[2],
        vH: viewBox[3]
      }
    }

    function getPath(path, percent) {
      var pathEl = is.str(path) ? selectString(path)[0] : path;
      var p = percent || 100;
      return function(property) {
        return {
          property: property,
          el: pathEl,
          svg: getParentSvg(pathEl),
          totalLength: getTotalLength(pathEl) * (p / 100)
        }
      }
    }

    function getPathProgress(path, progress, isPathTargetInsideSVG) {
      function point(offset) {
        if ( offset === void 0 ) offset = 0;

        var l = progress + offset >= 1 ? progress + offset : 0;
        return path.el.getPointAtLength(l);
      }
      var svg = getParentSvg(path.el, path.svg);
      var p = point();
      var p0 = point(-1);
      var p1 = point(+1);
      var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
      var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
      switch (path.property) {
        case 'x': return (p.x - svg.x) * scaleX;
        case 'y': return (p.y - svg.y) * scaleY;
        case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
      }
    }

    // Decompose value

    function decomposeValue(val, unit) {
      // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
      // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
      var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
      var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
      return {
        original: value,
        numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
        strings: (is.str(val) || unit) ? value.split(rgx) : []
      }
    }

    // Animatables

    function parseTargets(targets) {
      var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
      return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
    }

    function getAnimatables(targets) {
      var parsed = parseTargets(targets);
      return parsed.map(function (t, i) {
        return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
      });
    }

    // Properties

    function normalizePropertyTweens(prop, tweenSettings) {
      var settings = cloneObject(tweenSettings);
      // Override duration if easing is a spring
      if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
      if (is.arr(prop)) {
        var l = prop.length;
        var isFromTo = (l === 2 && !is.obj(prop[0]));
        if (!isFromTo) {
          // Duration divided by the number of tweens
          if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
        } else {
          // Transform [from, to] values shorthand to a valid tween value
          prop = {value: prop};
        }
      }
      var propArray = is.arr(prop) ? prop : [prop];
      return propArray.map(function (v, i) {
        var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
        // Default delay value should only be applied to the first tween
        if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
        // Default endDelay value should only be applied to the last tween
        if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
        return obj;
      }).map(function (k) { return mergeObjects(k, settings); });
    }


    function flattenKeyframes(keyframes) {
      var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
      .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
      var properties = {};
      var loop = function ( i ) {
        var propName = propertyNames[i];
        properties[propName] = keyframes.map(function (key) {
          var newKey = {};
          for (var p in key) {
            if (is.key(p)) {
              if (p == propName) { newKey.value = key[p]; }
            } else {
              newKey[p] = key[p];
            }
          }
          return newKey;
        });
      };

      for (var i = 0; i < propertyNames.length; i++) loop( i );
      return properties;
    }

    function getProperties(tweenSettings, params) {
      var properties = [];
      var keyframes = params.keyframes;
      if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
      for (var p in params) {
        if (is.key(p)) {
          properties.push({
            name: p,
            tweens: normalizePropertyTweens(params[p], tweenSettings)
          });
        }
      }
      return properties;
    }

    // Tweens

    function normalizeTweenValues(tween, animatable) {
      var t = {};
      for (var p in tween) {
        var value = getFunctionValue(tween[p], animatable);
        if (is.arr(value)) {
          value = value.map(function (v) { return getFunctionValue(v, animatable); });
          if (value.length === 1) { value = value[0]; }
        }
        t[p] = value;
      }
      t.duration = parseFloat(t.duration);
      t.delay = parseFloat(t.delay);
      return t;
    }

    function normalizeTweens(prop, animatable) {
      var previousTween;
      return prop.tweens.map(function (t) {
        var tween = normalizeTweenValues(t, animatable);
        var tweenValue = tween.value;
        var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
        var toUnit = getUnit(to);
        var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
        var previousValue = previousTween ? previousTween.to.original : originalValue;
        var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
        var fromUnit = getUnit(from) || getUnit(originalValue);
        var unit = toUnit || fromUnit;
        if (is.und(to)) { to = previousValue; }
        tween.from = decomposeValue(from, unit);
        tween.to = decomposeValue(getRelativeValue(to, from), unit);
        tween.start = previousTween ? previousTween.end : 0;
        tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
        tween.easing = parseEasings(tween.easing, tween.duration);
        tween.isPath = is.pth(tweenValue);
        tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
        tween.isColor = is.col(tween.from.original);
        if (tween.isColor) { tween.round = 1; }
        previousTween = tween;
        return tween;
      });
    }

    // Tween progress

    var setProgressValue = {
      css: function (t, p, v) { return t.style[p] = v; },
      attribute: function (t, p, v) { return t.setAttribute(p, v); },
      object: function (t, p, v) { return t[p] = v; },
      transform: function (t, p, v, transforms, manual) {
        transforms.list.set(p, v);
        if (p === transforms.last || manual) {
          var str = '';
          transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
          t.style.transform = str;
        }
      }
    };

    // Set Value helper

    function setTargetsValue(targets, properties) {
      var animatables = getAnimatables(targets);
      animatables.forEach(function (animatable) {
        for (var property in properties) {
          var value = getFunctionValue(properties[property], animatable);
          var target = animatable.target;
          var valueUnit = getUnit(value);
          var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
          var unit = valueUnit || getUnit(originalValue);
          var to = getRelativeValue(validateValue(value, unit), originalValue);
          var animType = getAnimationType(target, property);
          setProgressValue[animType](target, property, to, animatable.transforms, true);
        }
      });
    }

    // Animations

    function createAnimation(animatable, prop) {
      var animType = getAnimationType(animatable.target, prop.name);
      if (animType) {
        var tweens = normalizeTweens(prop, animatable);
        var lastTween = tweens[tweens.length - 1];
        return {
          type: animType,
          property: prop.name,
          animatable: animatable,
          tweens: tweens,
          duration: lastTween.end,
          delay: tweens[0].delay,
          endDelay: lastTween.endDelay
        }
      }
    }

    function getAnimations(animatables, properties) {
      return filterArray(flattenArray(animatables.map(function (animatable) {
        return properties.map(function (prop) {
          return createAnimation(animatable, prop);
        });
      })), function (a) { return !is.und(a); });
    }

    // Create Instance

    function getInstanceTimings(animations, tweenSettings) {
      var animLength = animations.length;
      var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
      var timings = {};
      timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
      timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
      timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
      return timings;
    }

    var instanceID = 0;

    function createNewInstance(params) {
      var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
      var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
      var properties = getProperties(tweenSettings, params);
      var animatables = getAnimatables(params.targets);
      var animations = getAnimations(animatables, properties);
      var timings = getInstanceTimings(animations, tweenSettings);
      var id = instanceID;
      instanceID++;
      return mergeObjects(instanceSettings, {
        id: id,
        children: [],
        animatables: animatables,
        animations: animations,
        duration: timings.duration,
        delay: timings.delay,
        endDelay: timings.endDelay
      });
    }

    // Core

    var activeInstances = [];

    var engine = (function () {
      var raf;

      function play() {
        if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
          raf = requestAnimationFrame(step);
        }
      }
      function step(t) {
        // memo on algorithm issue:
        // dangerous iteration over mutable `activeInstances`
        // (that collection may be updated from within callbacks of `tick`-ed animation instances)
        var activeInstancesLength = activeInstances.length;
        var i = 0;
        while (i < activeInstancesLength) {
          var activeInstance = activeInstances[i];
          if (!activeInstance.paused) {
            activeInstance.tick(t);
            i++;
          } else {
            activeInstances.splice(i, 1);
            activeInstancesLength--;
          }
        }
        raf = i > 0 ? requestAnimationFrame(step) : undefined;
      }

      function handleVisibilityChange() {
        if (!anime.suspendWhenDocumentHidden) { return; }

        if (isDocumentHidden()) {
          // suspend ticks
          raf = cancelAnimationFrame(raf);
        } else { // is back to active tab
          // first adjust animations to consider the time that ticks were suspended
          activeInstances.forEach(
            function (instance) { return instance ._onDocumentVisibility(); }
          );
          engine();
        }
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      return play;
    })();

    function isDocumentHidden() {
      return !!document && document.hidden;
    }

    // Public Instance

    function anime(params) {
      if ( params === void 0 ) params = {};


      var startTime = 0, lastTime = 0, now = 0;
      var children, childrenLength = 0;
      var resolve = null;

      function makePromise(instance) {
        var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
        instance.finished = promise;
        return promise;
      }

      var instance = createNewInstance(params);
      makePromise(instance);

      function toggleInstanceDirection() {
        var direction = instance.direction;
        if (direction !== 'alternate') {
          instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
        }
        instance.reversed = !instance.reversed;
        children.forEach(function (child) { return child.reversed = instance.reversed; });
      }

      function adjustTime(time) {
        return instance.reversed ? instance.duration - time : time;
      }

      function resetTime() {
        startTime = 0;
        lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
      }

      function seekChild(time, child) {
        if (child) { child.seek(time - child.timelineOffset); }
      }

      function syncInstanceChildren(time) {
        if (!instance.reversePlayback) {
          for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
        } else {
          for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
        }
      }

      function setAnimationsProgress(insTime) {
        var i = 0;
        var animations = instance.animations;
        var animationsLength = animations.length;
        while (i < animationsLength) {
          var anim = animations[i];
          var animatable = anim.animatable;
          var tweens = anim.tweens;
          var tweenLength = tweens.length - 1;
          var tween = tweens[tweenLength];
          // Only check for keyframes if there is more than one tween
          if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
          var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
          var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
          var strings = tween.to.strings;
          var round = tween.round;
          var numbers = [];
          var toNumbersLength = tween.to.numbers.length;
          var progress = (void 0);
          for (var n = 0; n < toNumbersLength; n++) {
            var value = (void 0);
            var toNumber = tween.to.numbers[n];
            var fromNumber = tween.from.numbers[n] || 0;
            if (!tween.isPath) {
              value = fromNumber + (eased * (toNumber - fromNumber));
            } else {
              value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
            }
            if (round) {
              if (!(tween.isColor && n > 2)) {
                value = Math.round(value * round) / round;
              }
            }
            numbers.push(value);
          }
          // Manual Array.reduce for better performances
          var stringsLength = strings.length;
          if (!stringsLength) {
            progress = numbers[0];
          } else {
            progress = strings[0];
            for (var s = 0; s < stringsLength; s++) {
              strings[s];
              var b = strings[s + 1];
              var n$1 = numbers[s];
              if (!isNaN(n$1)) {
                if (!b) {
                  progress += n$1 + ' ';
                } else {
                  progress += n$1 + b;
                }
              }
            }
          }
          setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
          anim.currentValue = progress;
          i++;
        }
      }

      function setCallback(cb) {
        if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
      }

      function countIteration() {
        if (instance.remaining && instance.remaining !== true) {
          instance.remaining--;
        }
      }

      function setInstanceProgress(engineTime) {
        var insDuration = instance.duration;
        var insDelay = instance.delay;
        var insEndDelay = insDuration - instance.endDelay;
        var insTime = adjustTime(engineTime);
        instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
        instance.reversePlayback = insTime < instance.currentTime;
        if (children) { syncInstanceChildren(insTime); }
        if (!instance.began && instance.currentTime > 0) {
          instance.began = true;
          setCallback('begin');
        }
        if (!instance.loopBegan && instance.currentTime > 0) {
          instance.loopBegan = true;
          setCallback('loopBegin');
        }
        if (insTime <= insDelay && instance.currentTime !== 0) {
          setAnimationsProgress(0);
        }
        if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
          setAnimationsProgress(insDuration);
        }
        if (insTime > insDelay && insTime < insEndDelay) {
          if (!instance.changeBegan) {
            instance.changeBegan = true;
            instance.changeCompleted = false;
            setCallback('changeBegin');
          }
          setCallback('change');
          setAnimationsProgress(insTime);
        } else {
          if (instance.changeBegan) {
            instance.changeCompleted = true;
            instance.changeBegan = false;
            setCallback('changeComplete');
          }
        }
        instance.currentTime = minMax(insTime, 0, insDuration);
        if (instance.began) { setCallback('update'); }
        if (engineTime >= insDuration) {
          lastTime = 0;
          countIteration();
          if (!instance.remaining) {
            instance.paused = true;
            if (!instance.completed) {
              instance.completed = true;
              setCallback('loopComplete');
              setCallback('complete');
              if (!instance.passThrough && 'Promise' in window) {
                resolve();
                makePromise(instance);
              }
            }
          } else {
            startTime = now;
            setCallback('loopComplete');
            instance.loopBegan = false;
            if (instance.direction === 'alternate') {
              toggleInstanceDirection();
            }
          }
        }
      }

      instance.reset = function() {
        var direction = instance.direction;
        instance.passThrough = false;
        instance.currentTime = 0;
        instance.progress = 0;
        instance.paused = true;
        instance.began = false;
        instance.loopBegan = false;
        instance.changeBegan = false;
        instance.completed = false;
        instance.changeCompleted = false;
        instance.reversePlayback = false;
        instance.reversed = direction === 'reverse';
        instance.remaining = instance.loop;
        children = instance.children;
        childrenLength = children.length;
        for (var i = childrenLength; i--;) { instance.children[i].reset(); }
        if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
        setAnimationsProgress(instance.reversed ? instance.duration : 0);
      };

      // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
      instance._onDocumentVisibility = resetTime;

      // Set Value helper

      instance.set = function(targets, properties) {
        setTargetsValue(targets, properties);
        return instance;
      };

      instance.tick = function(t) {
        now = t;
        if (!startTime) { startTime = now; }
        setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
      };

      instance.seek = function(time) {
        setInstanceProgress(adjustTime(time));
      };

      instance.pause = function() {
        instance.paused = true;
        resetTime();
      };

      instance.play = function() {
        if (!instance.paused) { return; }
        if (instance.completed) { instance.reset(); }
        instance.paused = false;
        activeInstances.push(instance);
        resetTime();
        engine();
      };

      instance.reverse = function() {
        toggleInstanceDirection();
        instance.completed = instance.reversed ? false : true;
        resetTime();
      };

      instance.restart = function() {
        instance.reset();
        instance.play();
      };

      instance.remove = function(targets) {
        var targetsArray = parseTargets(targets);
        removeTargetsFromInstance(targetsArray, instance);
      };

      instance.reset();

      if (instance.autoplay) { instance.play(); }

      return instance;

    }

    // Remove targets from animation

    function removeTargetsFromAnimations(targetsArray, animations) {
      for (var a = animations.length; a--;) {
        if (arrayContains(targetsArray, animations[a].animatable.target)) {
          animations.splice(a, 1);
        }
      }
    }

    function removeTargetsFromInstance(targetsArray, instance) {
      var animations = instance.animations;
      var children = instance.children;
      removeTargetsFromAnimations(targetsArray, animations);
      for (var c = children.length; c--;) {
        var child = children[c];
        var childAnimations = child.animations;
        removeTargetsFromAnimations(targetsArray, childAnimations);
        if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
      }
      if (!animations.length && !children.length) { instance.pause(); }
    }

    function removeTargetsFromActiveInstances(targets) {
      var targetsArray = parseTargets(targets);
      for (var i = activeInstances.length; i--;) {
        var instance = activeInstances[i];
        removeTargetsFromInstance(targetsArray, instance);
      }
    }

    // Stagger helpers

    function stagger(val, params) {
      if ( params === void 0 ) params = {};

      var direction = params.direction || 'normal';
      var easing = params.easing ? parseEasings(params.easing) : null;
      var grid = params.grid;
      var axis = params.axis;
      var fromIndex = params.from || 0;
      var fromFirst = fromIndex === 'first';
      var fromCenter = fromIndex === 'center';
      var fromLast = fromIndex === 'last';
      var isRange = is.arr(val);
      var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
      var val2 = isRange ? parseFloat(val[1]) : 0;
      var unit = getUnit(isRange ? val[1] : val) || 0;
      var start = params.start || 0 + (isRange ? val1 : 0);
      var values = [];
      var maxValue = 0;
      return function (el, i, t) {
        if (fromFirst) { fromIndex = 0; }
        if (fromCenter) { fromIndex = (t - 1) / 2; }
        if (fromLast) { fromIndex = t - 1; }
        if (!values.length) {
          for (var index = 0; index < t; index++) {
            if (!grid) {
              values.push(Math.abs(fromIndex - index));
            } else {
              var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
              var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
              var toX = index%grid[0];
              var toY = Math.floor(index/grid[0]);
              var distanceX = fromX - toX;
              var distanceY = fromY - toY;
              var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
              if (axis === 'x') { value = -distanceX; }
              if (axis === 'y') { value = -distanceY; }
              values.push(value);
            }
            maxValue = Math.max.apply(Math, values);
          }
          if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
          if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
        }
        var spacing = isRange ? (val2 - val1) / maxValue : val1;
        return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
      }
    }

    // Timeline

    function timeline(params) {
      if ( params === void 0 ) params = {};

      var tl = anime(params);
      tl.duration = 0;
      tl.add = function(instanceParams, timelineOffset) {
        var tlIndex = activeInstances.indexOf(tl);
        var children = tl.children;
        if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
        function passThrough(ins) { ins.passThrough = true; }
        for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
        var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
        insParams.targets = insParams.targets || params.targets;
        var tlDuration = tl.duration;
        insParams.autoplay = false;
        insParams.direction = tl.direction;
        insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
        passThrough(tl);
        tl.seek(insParams.timelineOffset);
        var ins = anime(insParams);
        passThrough(ins);
        children.push(ins);
        var timings = getInstanceTimings(children, params);
        tl.delay = timings.delay;
        tl.endDelay = timings.endDelay;
        tl.duration = timings.duration;
        tl.seek(0);
        tl.reset();
        if (tl.autoplay) { tl.play(); }
        return tl;
      };
      return tl;
    }

    anime.version = '3.2.1';
    anime.speed = 1;
    // TODO:#review: naming, documentation
    anime.suspendWhenDocumentHidden = true;
    anime.running = activeInstances;
    anime.remove = removeTargetsFromActiveInstances;
    anime.get = getOriginalTargetValue;
    anime.set = setTargetsValue;
    anime.convertPx = convertPxToUnit;
    anime.path = getPath;
    anime.setDashoffset = setDashoffset;
    anime.stagger = stagger;
    anime.timeline = timeline;
    anime.easing = parseEasings;
    anime.penner = penner;
    anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @fileoverview Firebase constants.  Some of these (@defines) can be overridden at compile-time.
     */
    const CONSTANTS = {
        /**
         * @define {boolean} Whether this is the client Node.js SDK.
         */
        NODE_CLIENT: false,
        /**
         * @define {boolean} Whether this is the Admin Node.js SDK.
         */
        NODE_ADMIN: false,
        /**
         * Firebase SDK Version
         */
        SDK_VERSION: '${JSCORE_VERSION}'
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Throws an error if the provided assertion is falsy
     */
    const assert = function (assertion, message) {
        if (!assertion) {
            throw assertionError(message);
        }
    };
    /**
     * Returns an Error object suitable for throwing.
     */
    const assertionError = function (message) {
        return new Error('Firebase Database (' +
            CONSTANTS.SDK_VERSION +
            ') INTERNAL ASSERT FAILED: ' +
            message);
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const stringToByteArray$1 = function (str) {
        // TODO(user): Use native implementations if/when available
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 128) {
                out[p++] = c;
            }
            else if (c < 2048) {
                out[p++] = (c >> 6) | 192;
                out[p++] = (c & 63) | 128;
            }
            else if ((c & 0xfc00) === 0xd800 &&
                i + 1 < str.length &&
                (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
                // Surrogate Pair
                c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                out[p++] = (c >> 18) | 240;
                out[p++] = ((c >> 12) & 63) | 128;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
            else {
                out[p++] = (c >> 12) | 224;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
        }
        return out;
    };
    /**
     * Turns an array of numbers into the string given by the concatenation of the
     * characters to which the numbers correspond.
     * @param bytes Array of numbers representing characters.
     * @return Stringification of the array.
     */
    const byteArrayToString = function (bytes) {
        // TODO(user): Use native implementations if/when available
        const out = [];
        let pos = 0, c = 0;
        while (pos < bytes.length) {
            const c1 = bytes[pos++];
            if (c1 < 128) {
                out[c++] = String.fromCharCode(c1);
            }
            else if (c1 > 191 && c1 < 224) {
                const c2 = bytes[pos++];
                out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
            }
            else if (c1 > 239 && c1 < 365) {
                // Surrogate Pair
                const c2 = bytes[pos++];
                const c3 = bytes[pos++];
                const c4 = bytes[pos++];
                const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
                    0x10000;
                out[c++] = String.fromCharCode(0xd800 + (u >> 10));
                out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
            }
            else {
                const c2 = bytes[pos++];
                const c3 = bytes[pos++];
                out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            }
        }
        return out.join('');
    };
    // We define it as an object literal instead of a class because a class compiled down to es5 can't
    // be treeshaked. https://github.com/rollup/rollup/issues/1691
    // Static lookup maps, lazily populated by init_()
    const base64 = {
        /**
         * Maps bytes to characters.
         */
        byteToCharMap_: null,
        /**
         * Maps characters to bytes.
         */
        charToByteMap_: null,
        /**
         * Maps bytes to websafe characters.
         * @private
         */
        byteToCharMapWebSafe_: null,
        /**
         * Maps websafe characters to bytes.
         * @private
         */
        charToByteMapWebSafe_: null,
        /**
         * Our default alphabet, shared between
         * ENCODED_VALS and ENCODED_VALS_WEBSAFE
         */
        ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
        /**
         * Our default alphabet. Value 64 (=) is special; it means "nothing."
         */
        get ENCODED_VALS() {
            return this.ENCODED_VALS_BASE + '+/=';
        },
        /**
         * Our websafe alphabet.
         */
        get ENCODED_VALS_WEBSAFE() {
            return this.ENCODED_VALS_BASE + '-_.';
        },
        /**
         * Whether this browser supports the atob and btoa functions. This extension
         * started at Mozilla but is now implemented by many browsers. We use the
         * ASSUME_* variables to avoid pulling in the full useragent detection library
         * but still allowing the standard per-browser compilations.
         *
         */
        HAS_NATIVE_SUPPORT: typeof atob === 'function',
        /**
         * Base64-encode an array of bytes.
         *
         * @param input An array of bytes (numbers with
         *     value in [0, 255]) to encode.
         * @param webSafe Boolean indicating we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeByteArray(input, webSafe) {
            if (!Array.isArray(input)) {
                throw Error('encodeByteArray takes an array as a parameter');
            }
            this.init_();
            const byteToCharMap = webSafe
                ? this.byteToCharMapWebSafe_
                : this.byteToCharMap_;
            const output = [];
            for (let i = 0; i < input.length; i += 3) {
                const byte1 = input[i];
                const haveByte2 = i + 1 < input.length;
                const byte2 = haveByte2 ? input[i + 1] : 0;
                const haveByte3 = i + 2 < input.length;
                const byte3 = haveByte3 ? input[i + 2] : 0;
                const outByte1 = byte1 >> 2;
                const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
                let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
                let outByte4 = byte3 & 0x3f;
                if (!haveByte3) {
                    outByte4 = 64;
                    if (!haveByte2) {
                        outByte3 = 64;
                    }
                }
                output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
            }
            return output.join('');
        },
        /**
         * Base64-encode a string.
         *
         * @param input A string to encode.
         * @param webSafe If true, we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeString(input, webSafe) {
            // Shortcut for Mozilla browsers that implement
            // a native base64 encoder in the form of "btoa/atob"
            if (this.HAS_NATIVE_SUPPORT && !webSafe) {
                return btoa(input);
            }
            return this.encodeByteArray(stringToByteArray$1(input), webSafe);
        },
        /**
         * Base64-decode a string.
         *
         * @param input to decode.
         * @param webSafe True if we should use the
         *     alternative alphabet.
         * @return string representing the decoded value.
         */
        decodeString(input, webSafe) {
            // Shortcut for Mozilla browsers that implement
            // a native base64 encoder in the form of "btoa/atob"
            if (this.HAS_NATIVE_SUPPORT && !webSafe) {
                return atob(input);
            }
            return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
        },
        /**
         * Base64-decode a string.
         *
         * In base-64 decoding, groups of four characters are converted into three
         * bytes.  If the encoder did not apply padding, the input length may not
         * be a multiple of 4.
         *
         * In this case, the last group will have fewer than 4 characters, and
         * padding will be inferred.  If the group has one or two characters, it decodes
         * to one byte.  If the group has three characters, it decodes to two bytes.
         *
         * @param input Input to decode.
         * @param webSafe True if we should use the web-safe alphabet.
         * @return bytes representing the decoded value.
         */
        decodeStringToByteArray(input, webSafe) {
            this.init_();
            const charToByteMap = webSafe
                ? this.charToByteMapWebSafe_
                : this.charToByteMap_;
            const output = [];
            for (let i = 0; i < input.length;) {
                const byte1 = charToByteMap[input.charAt(i++)];
                const haveByte2 = i < input.length;
                const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
                ++i;
                const haveByte3 = i < input.length;
                const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
                ++i;
                const haveByte4 = i < input.length;
                const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
                ++i;
                if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
                    throw Error();
                }
                const outByte1 = (byte1 << 2) | (byte2 >> 4);
                output.push(outByte1);
                if (byte3 !== 64) {
                    const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
                    output.push(outByte2);
                    if (byte4 !== 64) {
                        const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
                        output.push(outByte3);
                    }
                }
            }
            return output;
        },
        /**
         * Lazy static initialization function. Called before
         * accessing any of the static map variables.
         * @private
         */
        init_() {
            if (!this.byteToCharMap_) {
                this.byteToCharMap_ = {};
                this.charToByteMap_ = {};
                this.byteToCharMapWebSafe_ = {};
                this.charToByteMapWebSafe_ = {};
                // We want quick mappings back and forth, so we precompute two maps.
                for (let i = 0; i < this.ENCODED_VALS.length; i++) {
                    this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
                    this.charToByteMap_[this.byteToCharMap_[i]] = i;
                    this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
                    this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
                    // Be forgiving when decoding and correctly decode both encodings.
                    if (i >= this.ENCODED_VALS_BASE.length) {
                        this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                        this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
                    }
                }
            }
        }
    };
    /**
     * URL-safe base64 encoding
     */
    const base64Encode = function (str) {
        const utf8Bytes = stringToByteArray$1(str);
        return base64.encodeByteArray(utf8Bytes, true);
    };
    /**
     * URL-safe base64 decoding
     *
     * NOTE: DO NOT use the global atob() function - it does NOT support the
     * base64Url variant encoding.
     *
     * @param str To be decoded
     * @return Decoded result, if possible
     */
    const base64Decode = function (str) {
        try {
            return base64.decodeString(str, true);
        }
        catch (e) {
            console.error('base64Decode failed: ', e);
        }
        return null;
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Do a deep-copy of basic JavaScript Objects or Arrays.
     */
    function deepCopy(value) {
        return deepExtend(undefined, value);
    }
    /**
     * Copy properties from source to target (recursively allows extension
     * of Objects and Arrays).  Scalar values in the target are over-written.
     * If target is undefined, an object of the appropriate type will be created
     * (and returned).
     *
     * We recursively copy all child properties of plain Objects in the source- so
     * that namespace- like dictionaries are merged.
     *
     * Note that the target can be a function, in which case the properties in
     * the source Object are copied onto it as static properties of the Function.
     *
     * Note: we don't merge __proto__ to prevent prototype pollution
     */
    function deepExtend(target, source) {
        if (!(source instanceof Object)) {
            return source;
        }
        switch (source.constructor) {
            case Date:
                // Treat Dates like scalars; if the target date object had any child
                // properties - they will be lost!
                const dateValue = source;
                return new Date(dateValue.getTime());
            case Object:
                if (target === undefined) {
                    target = {};
                }
                break;
            case Array:
                // Always copy the array source and overwrite the target.
                target = [];
                break;
            default:
                // Not a plain Object - treat it as a scalar.
                return source;
        }
        for (const prop in source) {
            // use isValidKey to guard against prototype pollution. See https://snyk.io/vuln/SNYK-JS-LODASH-450202
            if (!source.hasOwnProperty(prop) || !isValidKey$1(prop)) {
                continue;
            }
            target[prop] = deepExtend(target[prop], source[prop]);
        }
        return target;
    }
    function isValidKey$1(key) {
        return key !== '__proto__';
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Deferred {
        constructor() {
            this.reject = () => { };
            this.resolve = () => { };
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
        /**
         * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
         * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
         * and returns a node-style callback which will resolve or reject the Deferred's promise.
         */
        wrapCallback(callback) {
            return (error, value) => {
                if (error) {
                    this.reject(error);
                }
                else {
                    this.resolve(value);
                }
                if (typeof callback === 'function') {
                    // Attaching noop handler just in case developer wasn't expecting
                    // promises
                    this.promise.catch(() => { });
                    // Some of our callbacks don't expect a value and our own tests
                    // assert that the parameter length is 1
                    if (callback.length === 1) {
                        callback(error);
                    }
                    else {
                        callback(error, value);
                    }
                }
            };
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns navigator.userAgent string or '' if it's not defined.
     * @return user agent string
     */
    function getUA() {
        if (typeof navigator !== 'undefined' &&
            typeof navigator['userAgent'] === 'string') {
            return navigator['userAgent'];
        }
        else {
            return '';
        }
    }
    /**
     * Detect Cordova / PhoneGap / Ionic frameworks on a mobile device.
     *
     * Deliberately does not rely on checking `file://` URLs (as this fails PhoneGap
     * in the Ripple emulator) nor Cordova `onDeviceReady`, which would normally
     * wait for a callback.
     */
    function isMobileCordova() {
        return (typeof window !== 'undefined' &&
            // @ts-ignore Setting up an broadly applicable index signature for Window
            // just to deal with this case would probably be a bad idea.
            !!(window['cordova'] || window['phonegap'] || window['PhoneGap']) &&
            /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA()));
    }
    function isBrowserExtension() {
        const runtime = typeof chrome === 'object'
            ? chrome.runtime
            : typeof browser === 'object'
                ? browser.runtime
                : undefined;
        return typeof runtime === 'object' && runtime.id !== undefined;
    }
    /**
     * Detect React Native.
     *
     * @return true if ReactNative environment is detected.
     */
    function isReactNative() {
        return (typeof navigator === 'object' && navigator['product'] === 'ReactNative');
    }
    /**
     * Detect whether the current SDK build is the Node version.
     *
     * @return true if it's the Node SDK build.
     */
    function isNodeSdk() {
        return CONSTANTS.NODE_ADMIN === true;
    }
    /**
     * This method checks if indexedDB is supported by current browser/service worker context
     * @return true if indexedDB is supported by current browser/service worker context
     */
    function isIndexedDBAvailable() {
        return typeof indexedDB === 'object';
    }
    /**
     * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
     * if errors occur during the database open operation.
     *
     * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
     * private browsing)
     */
    function validateIndexedDBOpenable() {
        return new Promise((resolve, reject) => {
            try {
                let preExist = true;
                const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
                const request = self.indexedDB.open(DB_CHECK_NAME);
                request.onsuccess = () => {
                    request.result.close();
                    // delete database only when it doesn't pre-exist
                    if (!preExist) {
                        self.indexedDB.deleteDatabase(DB_CHECK_NAME);
                    }
                    resolve(true);
                };
                request.onupgradeneeded = () => {
                    preExist = false;
                };
                request.onerror = () => {
                    var _a;
                    reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || '');
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     *
     * This method checks whether cookie is enabled within current browser
     * @return true if cookie is enabled within current browser
     */
    function areCookiesEnabled() {
        if (typeof navigator === 'undefined' || !navigator.cookieEnabled) {
            return false;
        }
        return true;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @fileoverview Standardized Firebase Error.
     *
     * Usage:
     *
     *   // Typescript string literals for type-safe codes
     *   type Err =
     *     'unknown' |
     *     'object-not-found'
     *     ;
     *
     *   // Closure enum for type-safe error codes
     *   // at-enum {string}
     *   var Err = {
     *     UNKNOWN: 'unknown',
     *     OBJECT_NOT_FOUND: 'object-not-found',
     *   }
     *
     *   let errors: Map<Err, string> = {
     *     'generic-error': "Unknown error",
     *     'file-not-found': "Could not find file: {$file}",
     *   };
     *
     *   // Type-safe function - must pass a valid error code as param.
     *   let error = new ErrorFactory<Err>('service', 'Service', errors);
     *
     *   ...
     *   throw error.create(Err.GENERIC);
     *   ...
     *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
     *   ...
     *   // Service: Could not file file: foo.txt (service/file-not-found).
     *
     *   catch (e) {
     *     assert(e.message === "Could not find file: foo.txt.");
     *     if (e.code === 'service/file-not-found') {
     *       console.log("Could not read file: " + e['file']);
     *     }
     *   }
     */
    const ERROR_NAME = 'FirebaseError';
    // Based on code from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
    class FirebaseError extends Error {
        constructor(
        /** The error code for this error. */
        code, message, 
        /** Custom data for this error. */
        customData) {
            super(message);
            this.code = code;
            this.customData = customData;
            /** The custom name for all FirebaseErrors. */
            this.name = ERROR_NAME;
            // Fix For ES5
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, FirebaseError.prototype);
            // Maintains proper stack trace for where our error was thrown.
            // Only available on V8.
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, ErrorFactory.prototype.create);
            }
        }
    }
    class ErrorFactory {
        constructor(service, serviceName, errors) {
            this.service = service;
            this.serviceName = serviceName;
            this.errors = errors;
        }
        create(code, ...data) {
            const customData = data[0] || {};
            const fullCode = `${this.service}/${code}`;
            const template = this.errors[code];
            const message = template ? replaceTemplate(template, customData) : 'Error';
            // Service Name: Error message (service/code).
            const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
            const error = new FirebaseError(fullCode, fullMessage, customData);
            return error;
        }
    }
    function replaceTemplate(template, data) {
        return template.replace(PATTERN, (_, key) => {
            const value = data[key];
            return value != null ? String(value) : `<${key}?>`;
        });
    }
    const PATTERN = /\{\$([^}]+)}/g;

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Evaluates a JSON string into a javascript object.
     *
     * @param {string} str A string containing JSON.
     * @return {*} The javascript object representing the specified JSON.
     */
    function jsonEval(str) {
        return JSON.parse(str);
    }
    /**
     * Returns JSON representing a javascript object.
     * @param {*} data Javascript object to be stringified.
     * @return {string} The JSON contents of the object.
     */
    function stringify(data) {
        return JSON.stringify(data);
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Decodes a Firebase auth. token into constituent parts.
     *
     * Notes:
     * - May return with invalid / incomplete claims if there's no native base64 decoding support.
     * - Doesn't check if the token is actually valid.
     */
    const decode = function (token) {
        let header = {}, claims = {}, data = {}, signature = '';
        try {
            const parts = token.split('.');
            header = jsonEval(base64Decode(parts[0]) || '');
            claims = jsonEval(base64Decode(parts[1]) || '');
            signature = parts[2];
            data = claims['d'] || {};
            delete claims['d'];
        }
        catch (e) { }
        return {
            header,
            claims,
            data,
            signature
        };
    };
    /**
     * Decodes a Firebase auth. token and checks the validity of its format. Expects a valid issued-at time.
     *
     * Notes:
     * - May return a false negative if there's no native base64 decoding support.
     * - Doesn't check if the token is actually valid.
     */
    const isValidFormat = function (token) {
        const decoded = decode(token), claims = decoded.claims;
        return !!claims && typeof claims === 'object' && claims.hasOwnProperty('iat');
    };
    /**
     * Attempts to peer into an auth token and determine if it's an admin auth token by looking at the claims portion.
     *
     * Notes:
     * - May return a false negative if there's no native base64 decoding support.
     * - Doesn't check if the token is actually valid.
     */
    const isAdmin = function (token) {
        const claims = decode(token).claims;
        return typeof claims === 'object' && claims['admin'] === true;
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function contains(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }
    function safeGet(obj, key) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return obj[key];
        }
        else {
            return undefined;
        }
    }
    function isEmpty(obj) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
    function map(obj, fn, contextObj) {
        const res = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res[key] = fn.call(contextObj, obj[key], key, obj);
            }
        }
        return res;
    }
    /**
     * Deep equal two objects. Support Arrays and Objects.
     */
    function deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        for (const k of aKeys) {
            if (!bKeys.includes(k)) {
                return false;
            }
            const aProp = a[k];
            const bProp = b[k];
            if (isObject(aProp) && isObject(bProp)) {
                if (!deepEqual(aProp, bProp)) {
                    return false;
                }
            }
            else if (aProp !== bProp) {
                return false;
            }
        }
        for (const k of bKeys) {
            if (!aKeys.includes(k)) {
                return false;
            }
        }
        return true;
    }
    function isObject(thing) {
        return thing !== null && typeof thing === 'object';
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns a querystring-formatted string (e.g. &arg=val&arg2=val2) from a
     * params object (e.g. {arg: 'val', arg2: 'val2'})
     * Note: You must prepend it with ? when adding it to a URL.
     */
    function querystring(querystringParams) {
        const params = [];
        for (const [key, value] of Object.entries(querystringParams)) {
            if (Array.isArray(value)) {
                value.forEach(arrayVal => {
                    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(arrayVal));
                });
            }
            else {
                params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        }
        return params.length ? '&' + params.join('&') : '';
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @fileoverview SHA-1 cryptographic hash.
     * Variable names follow the notation in FIPS PUB 180-3:
     * http://csrc.nist.gov/publications/fips/fips180-3/fips180-3_final.pdf.
     *
     * Usage:
     *   var sha1 = new sha1();
     *   sha1.update(bytes);
     *   var hash = sha1.digest();
     *
     * Performance:
     *   Chrome 23:   ~400 Mbit/s
     *   Firefox 16:  ~250 Mbit/s
     *
     */
    /**
     * SHA-1 cryptographic hash constructor.
     *
     * The properties declared here are discussed in the above algorithm document.
     * @constructor
     * @final
     * @struct
     */
    class Sha1 {
        constructor() {
            /**
             * Holds the previous values of accumulated variables a-e in the compress_
             * function.
             * @private
             */
            this.chain_ = [];
            /**
             * A buffer holding the partially computed hash result.
             * @private
             */
            this.buf_ = [];
            /**
             * An array of 80 bytes, each a part of the message to be hashed.  Referred to
             * as the message schedule in the docs.
             * @private
             */
            this.W_ = [];
            /**
             * Contains data needed to pad messages less than 64 bytes.
             * @private
             */
            this.pad_ = [];
            /**
             * @private {number}
             */
            this.inbuf_ = 0;
            /**
             * @private {number}
             */
            this.total_ = 0;
            this.blockSize = 512 / 8;
            this.pad_[0] = 128;
            for (let i = 1; i < this.blockSize; ++i) {
                this.pad_[i] = 0;
            }
            this.reset();
        }
        reset() {
            this.chain_[0] = 0x67452301;
            this.chain_[1] = 0xefcdab89;
            this.chain_[2] = 0x98badcfe;
            this.chain_[3] = 0x10325476;
            this.chain_[4] = 0xc3d2e1f0;
            this.inbuf_ = 0;
            this.total_ = 0;
        }
        /**
         * Internal compress helper function.
         * @param buf Block to compress.
         * @param offset Offset of the block in the buffer.
         * @private
         */
        compress_(buf, offset) {
            if (!offset) {
                offset = 0;
            }
            const W = this.W_;
            // get 16 big endian words
            if (typeof buf === 'string') {
                for (let i = 0; i < 16; i++) {
                    // TODO(user): [bug 8140122] Recent versions of Safari for Mac OS and iOS
                    // have a bug that turns the post-increment ++ operator into pre-increment
                    // during JIT compilation.  We have code that depends heavily on SHA-1 for
                    // correctness and which is affected by this bug, so I've removed all uses
                    // of post-increment ++ in which the result value is used.  We can revert
                    // this change once the Safari bug
                    // (https://bugs.webkit.org/show_bug.cgi?id=109036) has been fixed and
                    // most clients have been updated.
                    W[i] =
                        (buf.charCodeAt(offset) << 24) |
                            (buf.charCodeAt(offset + 1) << 16) |
                            (buf.charCodeAt(offset + 2) << 8) |
                            buf.charCodeAt(offset + 3);
                    offset += 4;
                }
            }
            else {
                for (let i = 0; i < 16; i++) {
                    W[i] =
                        (buf[offset] << 24) |
                            (buf[offset + 1] << 16) |
                            (buf[offset + 2] << 8) |
                            buf[offset + 3];
                    offset += 4;
                }
            }
            // expand to 80 words
            for (let i = 16; i < 80; i++) {
                const t = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                W[i] = ((t << 1) | (t >>> 31)) & 0xffffffff;
            }
            let a = this.chain_[0];
            let b = this.chain_[1];
            let c = this.chain_[2];
            let d = this.chain_[3];
            let e = this.chain_[4];
            let f, k;
            // TODO(user): Try to unroll this loop to speed up the computation.
            for (let i = 0; i < 80; i++) {
                if (i < 40) {
                    if (i < 20) {
                        f = d ^ (b & (c ^ d));
                        k = 0x5a827999;
                    }
                    else {
                        f = b ^ c ^ d;
                        k = 0x6ed9eba1;
                    }
                }
                else {
                    if (i < 60) {
                        f = (b & c) | (d & (b | c));
                        k = 0x8f1bbcdc;
                    }
                    else {
                        f = b ^ c ^ d;
                        k = 0xca62c1d6;
                    }
                }
                const t = (((a << 5) | (a >>> 27)) + f + e + k + W[i]) & 0xffffffff;
                e = d;
                d = c;
                c = ((b << 30) | (b >>> 2)) & 0xffffffff;
                b = a;
                a = t;
            }
            this.chain_[0] = (this.chain_[0] + a) & 0xffffffff;
            this.chain_[1] = (this.chain_[1] + b) & 0xffffffff;
            this.chain_[2] = (this.chain_[2] + c) & 0xffffffff;
            this.chain_[3] = (this.chain_[3] + d) & 0xffffffff;
            this.chain_[4] = (this.chain_[4] + e) & 0xffffffff;
        }
        update(bytes, length) {
            // TODO(johnlenz): tighten the function signature and remove this check
            if (bytes == null) {
                return;
            }
            if (length === undefined) {
                length = bytes.length;
            }
            const lengthMinusBlock = length - this.blockSize;
            let n = 0;
            // Using local instead of member variables gives ~5% speedup on Firefox 16.
            const buf = this.buf_;
            let inbuf = this.inbuf_;
            // The outer while loop should execute at most twice.
            while (n < length) {
                // When we have no data in the block to top up, we can directly process the
                // input buffer (assuming it contains sufficient data). This gives ~25%
                // speedup on Chrome 23 and ~15% speedup on Firefox 16, but requires that
                // the data is provided in large chunks (or in multiples of 64 bytes).
                if (inbuf === 0) {
                    while (n <= lengthMinusBlock) {
                        this.compress_(bytes, n);
                        n += this.blockSize;
                    }
                }
                if (typeof bytes === 'string') {
                    while (n < length) {
                        buf[inbuf] = bytes.charCodeAt(n);
                        ++inbuf;
                        ++n;
                        if (inbuf === this.blockSize) {
                            this.compress_(buf);
                            inbuf = 0;
                            // Jump to the outer loop so we use the full-block optimization.
                            break;
                        }
                    }
                }
                else {
                    while (n < length) {
                        buf[inbuf] = bytes[n];
                        ++inbuf;
                        ++n;
                        if (inbuf === this.blockSize) {
                            this.compress_(buf);
                            inbuf = 0;
                            // Jump to the outer loop so we use the full-block optimization.
                            break;
                        }
                    }
                }
            }
            this.inbuf_ = inbuf;
            this.total_ += length;
        }
        /** @override */
        digest() {
            const digest = [];
            let totalBits = this.total_ * 8;
            // Add pad 0x80 0x00*.
            if (this.inbuf_ < 56) {
                this.update(this.pad_, 56 - this.inbuf_);
            }
            else {
                this.update(this.pad_, this.blockSize - (this.inbuf_ - 56));
            }
            // Add # bits.
            for (let i = this.blockSize - 1; i >= 56; i--) {
                this.buf_[i] = totalBits & 255;
                totalBits /= 256; // Don't use bit-shifting here!
            }
            this.compress_(this.buf_);
            let n = 0;
            for (let i = 0; i < 5; i++) {
                for (let j = 24; j >= 0; j -= 8) {
                    digest[n] = (this.chain_[i] >> j) & 255;
                    ++n;
                }
            }
            return digest;
        }
    }
    /**
     * Generates a string to prefix an error message about failed argument validation
     *
     * @param fnName The function name
     * @param argName The name of the argument
     * @return The prefix to add to the error thrown for validation.
     */
    function errorPrefix(fnName, argName) {
        return `${fnName} failed: ${argName} argument `;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // Code originally came from goog.crypt.stringToUtf8ByteArray, but for some reason they
    // automatically replaced '\r\n' with '\n', and they didn't handle surrogate pairs,
    // so it's been modified.
    // Note that not all Unicode characters appear as single characters in JavaScript strings.
    // fromCharCode returns the UTF-16 encoding of a character - so some Unicode characters
    // use 2 characters in Javascript.  All 4-byte UTF-8 characters begin with a first
    // character in the range 0xD800 - 0xDBFF (the first character of a so-called surrogate
    // pair).
    // See http://www.ecma-international.org/ecma-262/5.1/#sec-15.1.3
    /**
     * @param {string} str
     * @return {Array}
     */
    const stringToByteArray = function (str) {
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            // Is this the lead surrogate in a surrogate pair?
            if (c >= 0xd800 && c <= 0xdbff) {
                const high = c - 0xd800; // the high 10 bits.
                i++;
                assert(i < str.length, 'Surrogate pair missing trail surrogate.');
                const low = str.charCodeAt(i) - 0xdc00; // the low 10 bits.
                c = 0x10000 + (high << 10) + low;
            }
            if (c < 128) {
                out[p++] = c;
            }
            else if (c < 2048) {
                out[p++] = (c >> 6) | 192;
                out[p++] = (c & 63) | 128;
            }
            else if (c < 65536) {
                out[p++] = (c >> 12) | 224;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
            else {
                out[p++] = (c >> 18) | 240;
                out[p++] = ((c >> 12) & 63) | 128;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
        }
        return out;
    };
    /**
     * Calculate length without actually converting; useful for doing cheaper validation.
     * @param {string} str
     * @return {number}
     */
    const stringLength = function (str) {
        let p = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 128) {
                p++;
            }
            else if (c < 2048) {
                p += 2;
            }
            else if (c >= 0xd800 && c <= 0xdbff) {
                // Lead surrogate of a surrogate pair.  The pair together will take 4 bytes to represent.
                p += 4;
                i++; // skip trail surrogate.
            }
            else {
                p += 3;
            }
        }
        return p;
    };

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The amount of milliseconds to exponentially increase.
     */
    const DEFAULT_INTERVAL_MILLIS = 1000;
    /**
     * The factor to backoff by.
     * Should be a number greater than 1.
     */
    const DEFAULT_BACKOFF_FACTOR = 2;
    /**
     * The maximum milliseconds to increase to.
     *
     * <p>Visible for testing
     */
    const MAX_VALUE_MILLIS = 4 * 60 * 60 * 1000; // Four hours, like iOS and Android.
    /**
     * The percentage of backoff time to randomize by.
     * See
     * http://go/safe-client-behavior#step-1-determine-the-appropriate-retry-interval-to-handle-spike-traffic
     * for context.
     *
     * <p>Visible for testing
     */
    const RANDOM_FACTOR = 0.5;
    /**
     * Based on the backoff method from
     * https://github.com/google/closure-library/blob/master/closure/goog/math/exponentialbackoff.js.
     * Extracted here so we don't need to pass metadata and a stateful ExponentialBackoff object around.
     */
    function calculateBackoffMillis(backoffCount, intervalMillis = DEFAULT_INTERVAL_MILLIS, backoffFactor = DEFAULT_BACKOFF_FACTOR) {
        // Calculates an exponentially increasing value.
        // Deviation: calculates value from count and a constant interval, so we only need to save value
        // and count to restore state.
        const currBaseValue = intervalMillis * Math.pow(backoffFactor, backoffCount);
        // A random "fuzz" to avoid waves of retries.
        // Deviation: randomFactor is required.
        const randomWait = Math.round(
        // A fraction of the backoff value to add/subtract.
        // Deviation: changes multiplication order to improve readability.
        RANDOM_FACTOR *
            currBaseValue *
            // A random float (rounded to int by Math.round above) in the range [-1, 1]. Determines
            // if we add or subtract.
            (Math.random() - 0.5) *
            2);
        // Limits backoff to max to avoid effectively permanent backoff.
        return Math.min(MAX_VALUE_MILLIS, currBaseValue + randomWait);
    }

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function getModularInstance(service) {
        if (service && service._delegate) {
            return service._delegate;
        }
        else {
            return service;
        }
    }

    /**
     * Component for service name T, e.g. `auth`, `auth-internal`
     */
    class Component {
        /**
         *
         * @param name The public service name, e.g. app, auth, firestore, database
         * @param instanceFactory Service factory responsible for creating the public interface
         * @param type whether the service provided by the component is public or private
         */
        constructor(name, instanceFactory, type) {
            this.name = name;
            this.instanceFactory = instanceFactory;
            this.type = type;
            this.multipleInstances = false;
            /**
             * Properties to be added to the service namespace
             */
            this.serviceProps = {};
            this.instantiationMode = "LAZY" /* LAZY */;
            this.onInstanceCreated = null;
        }
        setInstantiationMode(mode) {
            this.instantiationMode = mode;
            return this;
        }
        setMultipleInstances(multipleInstances) {
            this.multipleInstances = multipleInstances;
            return this;
        }
        setServiceProps(props) {
            this.serviceProps = props;
            return this;
        }
        setInstanceCreatedCallback(callback) {
            this.onInstanceCreated = callback;
            return this;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
     * NameServiceMapping[T] is an alias for the type of the instance
     */
    class Provider {
        constructor(name, container) {
            this.name = name;
            this.container = container;
            this.component = null;
            this.instances = new Map();
            this.instancesDeferred = new Map();
            this.instancesOptions = new Map();
            this.onInitCallbacks = new Map();
        }
        /**
         * @param identifier A provider can provide mulitple instances of a service
         * if this.component.multipleInstances is true.
         */
        get(identifier) {
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            if (!this.instancesDeferred.has(normalizedIdentifier)) {
                const deferred = new Deferred();
                this.instancesDeferred.set(normalizedIdentifier, deferred);
                if (this.isInitialized(normalizedIdentifier) ||
                    this.shouldAutoInitialize()) {
                    // initialize the service if it can be auto-initialized
                    try {
                        const instance = this.getOrInitializeService({
                            instanceIdentifier: normalizedIdentifier
                        });
                        if (instance) {
                            deferred.resolve(instance);
                        }
                    }
                    catch (e) {
                        // when the instance factory throws an exception during get(), it should not cause
                        // a fatal error. We just return the unresolved promise in this case.
                    }
                }
            }
            return this.instancesDeferred.get(normalizedIdentifier).promise;
        }
        getImmediate(options) {
            var _a;
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
            const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                try {
                    return this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                }
                catch (e) {
                    if (optional) {
                        return null;
                    }
                    else {
                        throw e;
                    }
                }
            }
            else {
                // In case a component is not initialized and should/can not be auto-initialized at the moment, return null if the optional flag is set, or throw
                if (optional) {
                    return null;
                }
                else {
                    throw Error(`Service ${this.name} is not available`);
                }
            }
        }
        getComponent() {
            return this.component;
        }
        setComponent(component) {
            if (component.name !== this.name) {
                throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
            }
            if (this.component) {
                throw Error(`Component for ${this.name} has already been provided`);
            }
            this.component = component;
            // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
            if (!this.shouldAutoInitialize()) {
                return;
            }
            // if the service is eager, initialize the default instance
            if (isComponentEager(component)) {
                try {
                    this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
                }
                catch (e) {
                    // when the instance factory for an eager Component throws an exception during the eager
                    // initialization, it should not cause a fatal error.
                    // TODO: Investigate if we need to make it configurable, because some component may want to cause
                    // a fatal error in this case?
                }
            }
            // Create service instances for the pending promises and resolve them
            // NOTE: if this.multipleInstances is false, only the default instance will be created
            // and all promises with resolve with it regardless of the identifier.
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                try {
                    // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    instanceDeferred.resolve(instance);
                }
                catch (e) {
                    // when the instance factory throws an exception, it should not cause
                    // a fatal error. We just leave the promise unresolved.
                }
            }
        }
        clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
            this.instancesDeferred.delete(identifier);
            this.instancesOptions.delete(identifier);
            this.instances.delete(identifier);
        }
        // app.delete() will call this method on every provider to delete the services
        // TODO: should we mark the provider as deleted?
        async delete() {
            const services = Array.from(this.instances.values());
            await Promise.all([
                ...services
                    .filter(service => 'INTERNAL' in service) // legacy services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service.INTERNAL.delete()),
                ...services
                    .filter(service => '_delete' in service) // modularized services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service._delete())
            ]);
        }
        isComponentSet() {
            return this.component != null;
        }
        isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instances.has(identifier);
        }
        getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instancesOptions.get(identifier) || {};
        }
        initialize(opts = {}) {
            const { options = {} } = opts;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
            if (this.isInitialized(normalizedIdentifier)) {
                throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
            }
            if (!this.isComponentSet()) {
                throw Error(`Component ${this.name} has not been registered yet`);
            }
            const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier,
                options
            });
            // resolve any pending promise waiting for the service instance
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                if (normalizedIdentifier === normalizedDeferredIdentifier) {
                    instanceDeferred.resolve(instance);
                }
            }
            return instance;
        }
        /**
         *
         * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
         * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
         *
         * @param identifier An optional instance identifier
         * @returns a function to unregister the callback
         */
        onInit(callback, identifier) {
            var _a;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
            existingCallbacks.add(callback);
            this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
            const existingInstance = this.instances.get(normalizedIdentifier);
            if (existingInstance) {
                callback(existingInstance, normalizedIdentifier);
            }
            return () => {
                existingCallbacks.delete(callback);
            };
        }
        /**
         * Invoke onInit callbacks synchronously
         * @param instance the service instance`
         */
        invokeOnInitCallbacks(instance, identifier) {
            const callbacks = this.onInitCallbacks.get(identifier);
            if (!callbacks) {
                return;
            }
            for (const callback of callbacks) {
                try {
                    callback(instance, identifier);
                }
                catch (_a) {
                    // ignore errors in the onInit callback
                }
            }
        }
        getOrInitializeService({ instanceIdentifier, options = {} }) {
            let instance = this.instances.get(instanceIdentifier);
            if (!instance && this.component) {
                instance = this.component.instanceFactory(this.container, {
                    instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                    options
                });
                this.instances.set(instanceIdentifier, instance);
                this.instancesOptions.set(instanceIdentifier, options);
                /**
                 * Invoke onInit listeners.
                 * Note this.component.onInstanceCreated is different, which is used by the component creator,
                 * while onInit listeners are registered by consumers of the provider.
                 */
                this.invokeOnInitCallbacks(instance, instanceIdentifier);
                /**
                 * Order is important
                 * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
                 * makes `isInitialized()` return true.
                 */
                if (this.component.onInstanceCreated) {
                    try {
                        this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                    }
                    catch (_a) {
                        // ignore errors in the onInstanceCreatedCallback
                    }
                }
            }
            return instance || null;
        }
        normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
            if (this.component) {
                return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
            }
            else {
                return identifier; // assume multiple instances are supported before the component is provided.
            }
        }
        shouldAutoInitialize() {
            return (!!this.component &&
                this.component.instantiationMode !== "EXPLICIT" /* EXPLICIT */);
        }
    }
    // undefined should be passed to the service factory for the default instance
    function normalizeIdentifierForFactory(identifier) {
        return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
    }
    function isComponentEager(component) {
        return component.instantiationMode === "EAGER" /* EAGER */;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
     */
    class ComponentContainer {
        constructor(name) {
            this.name = name;
            this.providers = new Map();
        }
        /**
         *
         * @param component Component being added
         * @param overwrite When a component with the same name has already been registered,
         * if overwrite is true: overwrite the existing component with the new component and create a new
         * provider with the new component. It can be useful in tests where you want to use different mocks
         * for different tests.
         * if overwrite is false: throw an exception
         */
        addComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
            }
            provider.setComponent(component);
        }
        addOrOverwriteComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                // delete the existing provider from the container, so we can register the new component
                this.providers.delete(component.name);
            }
            this.addComponent(component);
        }
        /**
         * getProvider provides a type safe interface where it can only be called with a field name
         * present in NameServiceMapping interface.
         *
         * Firebase SDKs providing services should extend NameServiceMapping interface to register
         * themselves.
         */
        getProvider(name) {
            if (this.providers.has(name)) {
                return this.providers.get(name);
            }
            // create a Provider for a service that hasn't registered with Firebase
            const provider = new Provider(name, this);
            this.providers.set(name, provider);
            return provider;
        }
        getProviders() {
            return Array.from(this.providers.values());
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The JS SDK supports 5 log levels and also allows a user the ability to
     * silence the logs altogether.
     *
     * The order is a follows:
     * DEBUG < VERBOSE < INFO < WARN < ERROR
     *
     * All of the log types above the current log level will be captured (i.e. if
     * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
     * `VERBOSE` logs will not)
     */
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
        LogLevel[LogLevel["INFO"] = 2] = "INFO";
        LogLevel[LogLevel["WARN"] = 3] = "WARN";
        LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
        LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
    })(LogLevel || (LogLevel = {}));
    const levelStringToEnum = {
        'debug': LogLevel.DEBUG,
        'verbose': LogLevel.VERBOSE,
        'info': LogLevel.INFO,
        'warn': LogLevel.WARN,
        'error': LogLevel.ERROR,
        'silent': LogLevel.SILENT
    };
    /**
     * The default log level
     */
    const defaultLogLevel = LogLevel.INFO;
    /**
     * By default, `console.debug` is not displayed in the developer console (in
     * chrome). To avoid forcing users to have to opt-in to these logs twice
     * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
     * logs to the `console.log` function.
     */
    const ConsoleMethod = {
        [LogLevel.DEBUG]: 'log',
        [LogLevel.VERBOSE]: 'log',
        [LogLevel.INFO]: 'info',
        [LogLevel.WARN]: 'warn',
        [LogLevel.ERROR]: 'error'
    };
    /**
     * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
     * messages on to their corresponding console counterparts (if the log method
     * is supported by the current log level)
     */
    const defaultLogHandler = (instance, logType, ...args) => {
        if (logType < instance.logLevel) {
            return;
        }
        const now = new Date().toISOString();
        const method = ConsoleMethod[logType];
        if (method) {
            console[method](`[${now}]  ${instance.name}:`, ...args);
        }
        else {
            throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
        }
    };
    class Logger {
        /**
         * Gives you an instance of a Logger to capture messages according to
         * Firebase's logging scheme.
         *
         * @param name The name that the logs will be associated with
         */
        constructor(name) {
            this.name = name;
            /**
             * The log level of the given Logger instance.
             */
            this._logLevel = defaultLogLevel;
            /**
             * The main (internal) log handler for the Logger instance.
             * Can be set to a new function in internal package code but not by user.
             */
            this._logHandler = defaultLogHandler;
            /**
             * The optional, additional, user-defined log handler for the Logger instance.
             */
            this._userLogHandler = null;
        }
        get logLevel() {
            return this._logLevel;
        }
        set logLevel(val) {
            if (!(val in LogLevel)) {
                throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
            }
            this._logLevel = val;
        }
        // Workaround for setter/getter having to be the same type.
        setLogLevel(val) {
            this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
        }
        get logHandler() {
            return this._logHandler;
        }
        set logHandler(val) {
            if (typeof val !== 'function') {
                throw new TypeError('Value assigned to `logHandler` must be a function');
            }
            this._logHandler = val;
        }
        get userLogHandler() {
            return this._userLogHandler;
        }
        set userLogHandler(val) {
            this._userLogHandler = val;
        }
        /**
         * The functions below are all based on the `console` interface
         */
        debug(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
            this._logHandler(this, LogLevel.DEBUG, ...args);
        }
        log(...args) {
            this._userLogHandler &&
                this._userLogHandler(this, LogLevel.VERBOSE, ...args);
            this._logHandler(this, LogLevel.VERBOSE, ...args);
        }
        info(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
            this._logHandler(this, LogLevel.INFO, ...args);
        }
        warn(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
            this._logHandler(this, LogLevel.WARN, ...args);
        }
        error(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
            this._logHandler(this, LogLevel.ERROR, ...args);
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class PlatformLoggerServiceImpl {
        constructor(container) {
            this.container = container;
        }
        // In initial implementation, this will be called by installations on
        // auth token refresh, and installations will send this string.
        getPlatformInfoString() {
            const providers = this.container.getProviders();
            // Loop through providers and get library/version pairs from any that are
            // version components.
            return providers
                .map(provider => {
                if (isVersionServiceProvider(provider)) {
                    const service = provider.getImmediate();
                    return `${service.library}/${service.version}`;
                }
                else {
                    return null;
                }
            })
                .filter(logString => logString)
                .join(' ');
        }
    }
    /**
     *
     * @param provider check if this provider provides a VersionService
     *
     * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
     * provides VersionService. The provider is not necessarily a 'app-version'
     * provider.
     */
    function isVersionServiceProvider(provider) {
        const component = provider.getComponent();
        return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* VERSION */;
    }

    const name$o = "@firebase/app";
    const version$1$1 = "0.7.16";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logger$2 = new Logger('@firebase/app');

    const name$n = "@firebase/app-compat";

    const name$m = "@firebase/analytics-compat";

    const name$l = "@firebase/analytics";

    const name$k = "@firebase/app-check-compat";

    const name$j = "@firebase/app-check";

    const name$i = "@firebase/auth";

    const name$h = "@firebase/auth-compat";

    const name$g = "@firebase/database";

    const name$f = "@firebase/database-compat";

    const name$e = "@firebase/functions";

    const name$d = "@firebase/functions-compat";

    const name$c = "@firebase/installations";

    const name$b = "@firebase/installations-compat";

    const name$a = "@firebase/messaging";

    const name$9 = "@firebase/messaging-compat";

    const name$8 = "@firebase/performance";

    const name$7 = "@firebase/performance-compat";

    const name$6 = "@firebase/remote-config";

    const name$5 = "@firebase/remote-config-compat";

    const name$4 = "@firebase/storage";

    const name$3$1 = "@firebase/storage-compat";

    const name$2$1 = "@firebase/firestore";

    const name$1$1 = "@firebase/firestore-compat";

    const name$p = "firebase";
    const version$4 = "9.6.6";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The default app name
     *
     * @internal
     */
    const DEFAULT_ENTRY_NAME = '[DEFAULT]';
    const PLATFORM_LOG_STRING = {
        [name$o]: 'fire-core',
        [name$n]: 'fire-core-compat',
        [name$l]: 'fire-analytics',
        [name$m]: 'fire-analytics-compat',
        [name$j]: 'fire-app-check',
        [name$k]: 'fire-app-check-compat',
        [name$i]: 'fire-auth',
        [name$h]: 'fire-auth-compat',
        [name$g]: 'fire-rtdb',
        [name$f]: 'fire-rtdb-compat',
        [name$e]: 'fire-fn',
        [name$d]: 'fire-fn-compat',
        [name$c]: 'fire-iid',
        [name$b]: 'fire-iid-compat',
        [name$a]: 'fire-fcm',
        [name$9]: 'fire-fcm-compat',
        [name$8]: 'fire-perf',
        [name$7]: 'fire-perf-compat',
        [name$6]: 'fire-rc',
        [name$5]: 'fire-rc-compat',
        [name$4]: 'fire-gcs',
        [name$3$1]: 'fire-gcs-compat',
        [name$2$1]: 'fire-fst',
        [name$1$1]: 'fire-fst-compat',
        'fire-js': 'fire-js',
        [name$p]: 'fire-js-all'
    };

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @internal
     */
    const _apps = new Map();
    /**
     * Registered components.
     *
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _components = new Map();
    /**
     * @param component - the component being added to this app's container
     *
     * @internal
     */
    function _addComponent(app, component) {
        try {
            app.container.addComponent(component);
        }
        catch (e) {
            logger$2.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
        }
    }
    /**
     *
     * @param component - the component to register
     * @returns whether or not the component is registered successfully
     *
     * @internal
     */
    function _registerComponent(component) {
        const componentName = component.name;
        if (_components.has(componentName)) {
            logger$2.debug(`There were multiple attempts to register component ${componentName}.`);
            return false;
        }
        _components.set(componentName, component);
        // add the component to existing app instances
        for (const app of _apps.values()) {
            _addComponent(app, component);
        }
        return true;
    }
    /**
     *
     * @param app - FirebaseApp instance
     * @param name - service name
     *
     * @returns the provider for the service with the matching name
     *
     * @internal
     */
    function _getProvider(app, name) {
        return app.container.getProvider(name);
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERRORS$1 = {
        ["no-app" /* NO_APP */]: "No Firebase App '{$appName}' has been created - " +
            'call Firebase App.initializeApp()',
        ["bad-app-name" /* BAD_APP_NAME */]: "Illegal App name: '{$appName}",
        ["duplicate-app" /* DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
        ["app-deleted" /* APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
        ["invalid-app-argument" /* INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
            'Firebase App instance.',
        ["invalid-log-argument" /* INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.'
    };
    const ERROR_FACTORY$2 = new ErrorFactory('app', 'Firebase', ERRORS$1);

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class FirebaseAppImpl {
        constructor(options, config, container) {
            this._isDeleted = false;
            this._options = Object.assign({}, options);
            this._config = Object.assign({}, config);
            this._name = config.name;
            this._automaticDataCollectionEnabled =
                config.automaticDataCollectionEnabled;
            this._container = container;
            this.container.addComponent(new Component('app', () => this, "PUBLIC" /* PUBLIC */));
        }
        get automaticDataCollectionEnabled() {
            this.checkDestroyed();
            return this._automaticDataCollectionEnabled;
        }
        set automaticDataCollectionEnabled(val) {
            this.checkDestroyed();
            this._automaticDataCollectionEnabled = val;
        }
        get name() {
            this.checkDestroyed();
            return this._name;
        }
        get options() {
            this.checkDestroyed();
            return this._options;
        }
        get config() {
            this.checkDestroyed();
            return this._config;
        }
        get container() {
            return this._container;
        }
        get isDeleted() {
            return this._isDeleted;
        }
        set isDeleted(val) {
            this._isDeleted = val;
        }
        /**
         * This function will throw an Error if the App has already been deleted -
         * use before performing API actions on the App.
         */
        checkDestroyed() {
            if (this.isDeleted) {
                throw ERROR_FACTORY$2.create("app-deleted" /* APP_DELETED */, { appName: this._name });
            }
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The current SDK version.
     *
     * @public
     */
    const SDK_VERSION$1 = version$4;
    function initializeApp(options, rawConfig = {}) {
        if (typeof rawConfig !== 'object') {
            const name = rawConfig;
            rawConfig = { name };
        }
        const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
        const name = config.name;
        if (typeof name !== 'string' || !name) {
            throw ERROR_FACTORY$2.create("bad-app-name" /* BAD_APP_NAME */, {
                appName: String(name)
            });
        }
        const existingApp = _apps.get(name);
        if (existingApp) {
            // return the existing app if options and config deep equal the ones in the existing app.
            if (deepEqual(options, existingApp.options) &&
                deepEqual(config, existingApp.config)) {
                return existingApp;
            }
            else {
                throw ERROR_FACTORY$2.create("duplicate-app" /* DUPLICATE_APP */, { appName: name });
            }
        }
        const container = new ComponentContainer(name);
        for (const component of _components.values()) {
            container.addComponent(component);
        }
        const newApp = new FirebaseAppImpl(options, config, container);
        _apps.set(name, newApp);
        return newApp;
    }
    /**
     * Retrieves a {@link @firebase/app#FirebaseApp} instance.
     *
     * When called with no arguments, the default app is returned. When an app name
     * is provided, the app corresponding to that name is returned.
     *
     * An exception is thrown if the app being retrieved has not yet been
     * initialized.
     *
     * @example
     * ```javascript
     * // Return the default app
     * const app = getApp();
     * ```
     *
     * @example
     * ```javascript
     * // Return a named app
     * const otherApp = getApp("otherApp");
     * ```
     *
     * @param name - Optional name of the app to return. If no name is
     *   provided, the default is `"[DEFAULT]"`.
     *
     * @returns The app corresponding to the provided app name.
     *   If no app name is provided, the default app is returned.
     *
     * @public
     */
    function getApp(name = DEFAULT_ENTRY_NAME) {
        const app = _apps.get(name);
        if (!app) {
            throw ERROR_FACTORY$2.create("no-app" /* NO_APP */, { appName: name });
        }
        return app;
    }
    /**
     * Registers a library's name and version for platform logging purposes.
     * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
     * @param version - Current version of that library.
     * @param variant - Bundle variant, e.g., node, rn, etc.
     *
     * @public
     */
    function registerVersion(libraryKeyOrName, version, variant) {
        var _a;
        // TODO: We can use this check to whitelist strings when/if we set up
        // a good whitelist system.
        let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
        if (variant) {
            library += `-${variant}`;
        }
        const libraryMismatch = library.match(/\s|\//);
        const versionMismatch = version.match(/\s|\//);
        if (libraryMismatch || versionMismatch) {
            const warning = [
                `Unable to register library "${library}" with version "${version}":`
            ];
            if (libraryMismatch) {
                warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
            }
            if (libraryMismatch && versionMismatch) {
                warning.push('and');
            }
            if (versionMismatch) {
                warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
            }
            logger$2.warn(warning.join(' '));
            return;
        }
        _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* VERSION */));
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function registerCoreComponents(variant) {
        _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* PRIVATE */));
        // Register `app` package.
        registerVersion(name$o, version$1$1, variant);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name$o, version$1$1, 'esm2017');
        // Register platform SDK identifier (no version).
        registerVersion('fire-js', '');
    }

    /**
     * Firebase App
     *
     * @remarks This package coordinates the communication between the different Firebase components
     * @packageDocumentation
     */
    registerCoreComponents('');

    var name$3 = "firebase";
    var version$3 = "9.6.6";

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    registerVersion(name$3, version$3, 'app');

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var idb = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      factory(exports) ;
    }(commonjsGlobal, function (exports) {
      function toArray(arr) {
        return Array.prototype.slice.call(arr);
      }

      function promisifyRequest(request) {
        return new Promise(function(resolve, reject) {
          request.onsuccess = function() {
            resolve(request.result);
          };

          request.onerror = function() {
            reject(request.error);
          };
        });
      }

      function promisifyRequestCall(obj, method, args) {
        var request;
        var p = new Promise(function(resolve, reject) {
          request = obj[method].apply(obj, args);
          promisifyRequest(request).then(resolve, reject);
        });

        p.request = request;
        return p;
      }

      function promisifyCursorRequestCall(obj, method, args) {
        var p = promisifyRequestCall(obj, method, args);
        return p.then(function(value) {
          if (!value) return;
          return new Cursor(value, p.request);
        });
      }

      function proxyProperties(ProxyClass, targetProp, properties) {
        properties.forEach(function(prop) {
          Object.defineProperty(ProxyClass.prototype, prop, {
            get: function() {
              return this[targetProp][prop];
            },
            set: function(val) {
              this[targetProp][prop] = val;
            }
          });
        });
      }

      function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function() {
            return promisifyRequestCall(this[targetProp], prop, arguments);
          };
        });
      }

      function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function() {
            return this[targetProp][prop].apply(this[targetProp], arguments);
          };
        });
      }

      function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function() {
            return promisifyCursorRequestCall(this[targetProp], prop, arguments);
          };
        });
      }

      function Index(index) {
        this._index = index;
      }

      proxyProperties(Index, '_index', [
        'name',
        'keyPath',
        'multiEntry',
        'unique'
      ]);

      proxyRequestMethods(Index, '_index', IDBIndex, [
        'get',
        'getKey',
        'getAll',
        'getAllKeys',
        'count'
      ]);

      proxyCursorRequestMethods(Index, '_index', IDBIndex, [
        'openCursor',
        'openKeyCursor'
      ]);

      function Cursor(cursor, request) {
        this._cursor = cursor;
        this._request = request;
      }

      proxyProperties(Cursor, '_cursor', [
        'direction',
        'key',
        'primaryKey',
        'value'
      ]);

      proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
        'update',
        'delete'
      ]);

      // proxy 'next' methods
      ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
        if (!(methodName in IDBCursor.prototype)) return;
        Cursor.prototype[methodName] = function() {
          var cursor = this;
          var args = arguments;
          return Promise.resolve().then(function() {
            cursor._cursor[methodName].apply(cursor._cursor, args);
            return promisifyRequest(cursor._request).then(function(value) {
              if (!value) return;
              return new Cursor(value, cursor._request);
            });
          });
        };
      });

      function ObjectStore(store) {
        this._store = store;
      }

      ObjectStore.prototype.createIndex = function() {
        return new Index(this._store.createIndex.apply(this._store, arguments));
      };

      ObjectStore.prototype.index = function() {
        return new Index(this._store.index.apply(this._store, arguments));
      };

      proxyProperties(ObjectStore, '_store', [
        'name',
        'keyPath',
        'indexNames',
        'autoIncrement'
      ]);

      proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'put',
        'add',
        'delete',
        'clear',
        'get',
        'getAll',
        'getKey',
        'getAllKeys',
        'count'
      ]);

      proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
        'openCursor',
        'openKeyCursor'
      ]);

      proxyMethods(ObjectStore, '_store', IDBObjectStore, [
        'deleteIndex'
      ]);

      function Transaction(idbTransaction) {
        this._tx = idbTransaction;
        this.complete = new Promise(function(resolve, reject) {
          idbTransaction.oncomplete = function() {
            resolve();
          };
          idbTransaction.onerror = function() {
            reject(idbTransaction.error);
          };
          idbTransaction.onabort = function() {
            reject(idbTransaction.error);
          };
        });
      }

      Transaction.prototype.objectStore = function() {
        return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
      };

      proxyProperties(Transaction, '_tx', [
        'objectStoreNames',
        'mode'
      ]);

      proxyMethods(Transaction, '_tx', IDBTransaction, [
        'abort'
      ]);

      function UpgradeDB(db, oldVersion, transaction) {
        this._db = db;
        this.oldVersion = oldVersion;
        this.transaction = new Transaction(transaction);
      }

      UpgradeDB.prototype.createObjectStore = function() {
        return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
      };

      proxyProperties(UpgradeDB, '_db', [
        'name',
        'version',
        'objectStoreNames'
      ]);

      proxyMethods(UpgradeDB, '_db', IDBDatabase, [
        'deleteObjectStore',
        'close'
      ]);

      function DB(db) {
        this._db = db;
      }

      DB.prototype.transaction = function() {
        return new Transaction(this._db.transaction.apply(this._db, arguments));
      };

      proxyProperties(DB, '_db', [
        'name',
        'version',
        'objectStoreNames'
      ]);

      proxyMethods(DB, '_db', IDBDatabase, [
        'close'
      ]);

      // Add cursor iterators
      // TODO: remove this once browsers do the right thing with promises
      ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
        [ObjectStore, Index].forEach(function(Constructor) {
          // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
          if (!(funcName in Constructor.prototype)) return;

          Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
            var args = toArray(arguments);
            var callback = args[args.length - 1];
            var nativeObject = this._store || this._index;
            var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
            request.onsuccess = function() {
              callback(request.result);
            };
          };
        });
      });

      // polyfill getAll
      [Index, ObjectStore].forEach(function(Constructor) {
        if (Constructor.prototype.getAll) return;
        Constructor.prototype.getAll = function(query, count) {
          var instance = this;
          var items = [];

          return new Promise(function(resolve) {
            instance.iterateCursor(query, function(cursor) {
              if (!cursor) {
                resolve(items);
                return;
              }
              items.push(cursor.value);

              if (count !== undefined && items.length == count) {
                resolve(items);
                return;
              }
              cursor.continue();
            });
          });
        };
      });

      function openDb(name, version, upgradeCallback) {
        var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
        var request = p.request;

        if (request) {
          request.onupgradeneeded = function(event) {
            if (upgradeCallback) {
              upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
            }
          };
        }

        return p.then(function(db) {
          return new DB(db);
        });
      }

      function deleteDb(name) {
        return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
      }

      exports.openDb = openDb;
      exports.deleteDb = deleteDb;

      Object.defineProperty(exports, '__esModule', { value: true });

    }));
    });

    const name$2 = "@firebase/installations";
    const version$2 = "0.5.5";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const PENDING_TIMEOUT_MS = 10000;
    const PACKAGE_VERSION = `w:${version$2}`;
    const INTERNAL_AUTH_VERSION = 'FIS_v2';
    const INSTALLATIONS_API_URL = 'https://firebaseinstallations.googleapis.com/v1';
    const TOKEN_EXPIRATION_BUFFER = 60 * 60 * 1000; // One hour
    const SERVICE = 'installations';
    const SERVICE_NAME = 'Installations';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERROR_DESCRIPTION_MAP = {
        ["missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */]: 'Missing App configuration value: "{$valueName}"',
        ["not-registered" /* NOT_REGISTERED */]: 'Firebase Installation is not registered.',
        ["installation-not-found" /* INSTALLATION_NOT_FOUND */]: 'Firebase Installation not found.',
        ["request-failed" /* REQUEST_FAILED */]: '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
        ["app-offline" /* APP_OFFLINE */]: 'Could not process request. Application offline.',
        ["delete-pending-registration" /* DELETE_PENDING_REGISTRATION */]: "Can't delete installation while there is a pending registration request."
    };
    const ERROR_FACTORY$1 = new ErrorFactory(SERVICE, SERVICE_NAME, ERROR_DESCRIPTION_MAP);
    /** Returns true if error is a FirebaseError that is based on an error from the server. */
    function isServerError(error) {
        return (error instanceof FirebaseError &&
            error.code.includes("request-failed" /* REQUEST_FAILED */));
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function getInstallationsEndpoint({ projectId }) {
        return `${INSTALLATIONS_API_URL}/projects/${projectId}/installations`;
    }
    function extractAuthTokenInfoFromResponse(response) {
        return {
            token: response.token,
            requestStatus: 2 /* COMPLETED */,
            expiresIn: getExpiresInFromResponseExpiresIn(response.expiresIn),
            creationTime: Date.now()
        };
    }
    async function getErrorFromResponse(requestName, response) {
        const responseJson = await response.json();
        const errorData = responseJson.error;
        return ERROR_FACTORY$1.create("request-failed" /* REQUEST_FAILED */, {
            requestName,
            serverCode: errorData.code,
            serverMessage: errorData.message,
            serverStatus: errorData.status
        });
    }
    function getHeaders$1({ apiKey }) {
        return new Headers({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-goog-api-key': apiKey
        });
    }
    function getHeadersWithAuth(appConfig, { refreshToken }) {
        const headers = getHeaders$1(appConfig);
        headers.append('Authorization', getAuthorizationHeader(refreshToken));
        return headers;
    }
    /**
     * Calls the passed in fetch wrapper and returns the response.
     * If the returned response has a status of 5xx, re-runs the function once and
     * returns the response.
     */
    async function retryIfServerError(fn) {
        const result = await fn();
        if (result.status >= 500 && result.status < 600) {
            // Internal Server Error. Retry request.
            return fn();
        }
        return result;
    }
    function getExpiresInFromResponseExpiresIn(responseExpiresIn) {
        // This works because the server will never respond with fractions of a second.
        return Number(responseExpiresIn.replace('s', '000'));
    }
    function getAuthorizationHeader(refreshToken) {
        return `${INTERNAL_AUTH_VERSION} ${refreshToken}`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function createInstallationRequest(appConfig, { fid }) {
        const endpoint = getInstallationsEndpoint(appConfig);
        const headers = getHeaders$1(appConfig);
        const body = {
            fid,
            authVersion: INTERNAL_AUTH_VERSION,
            appId: appConfig.appId,
            sdkVersion: PACKAGE_VERSION
        };
        const request = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await retryIfServerError(() => fetch(endpoint, request));
        if (response.ok) {
            const responseValue = await response.json();
            const registeredInstallationEntry = {
                fid: responseValue.fid || fid,
                registrationStatus: 2 /* COMPLETED */,
                refreshToken: responseValue.refreshToken,
                authToken: extractAuthTokenInfoFromResponse(responseValue.authToken)
            };
            return registeredInstallationEntry;
        }
        else {
            throw await getErrorFromResponse('Create Installation', response);
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** Returns a promise that resolves after given time passes. */
    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function bufferToBase64UrlSafe(array) {
        const b64 = btoa(String.fromCharCode(...array));
        return b64.replace(/\+/g, '-').replace(/\//g, '_');
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const VALID_FID_PATTERN = /^[cdef][\w-]{21}$/;
    const INVALID_FID = '';
    /**
     * Generates a new FID using random values from Web Crypto API.
     * Returns an empty string if FID generation fails for any reason.
     */
    function generateFid() {
        try {
            // A valid FID has exactly 22 base64 characters, which is 132 bits, or 16.5
            // bytes. our implementation generates a 17 byte array instead.
            const fidByteArray = new Uint8Array(17);
            const crypto = self.crypto || self.msCrypto;
            crypto.getRandomValues(fidByteArray);
            // Replace the first 4 random bits with the constant FID header of 0b0111.
            fidByteArray[0] = 0b01110000 + (fidByteArray[0] % 0b00010000);
            const fid = encode(fidByteArray);
            return VALID_FID_PATTERN.test(fid) ? fid : INVALID_FID;
        }
        catch (_a) {
            // FID generation errored
            return INVALID_FID;
        }
    }
    /** Converts a FID Uint8Array to a base64 string representation. */
    function encode(fidByteArray) {
        const b64String = bufferToBase64UrlSafe(fidByteArray);
        // Remove the 23rd character that was added because of the extra 4 bits at the
        // end of our 17 byte array, and the '=' padding.
        return b64String.substr(0, 22);
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** Returns a string key that can be used to identify the app. */
    function getKey(appConfig) {
        return `${appConfig.appName}!${appConfig.appId}`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const fidChangeCallbacks = new Map();
    /**
     * Calls the onIdChange callbacks with the new FID value, and broadcasts the
     * change to other tabs.
     */
    function fidChanged(appConfig, fid) {
        const key = getKey(appConfig);
        callFidChangeCallbacks(key, fid);
        broadcastFidChange(key, fid);
    }
    function callFidChangeCallbacks(key, fid) {
        const callbacks = fidChangeCallbacks.get(key);
        if (!callbacks) {
            return;
        }
        for (const callback of callbacks) {
            callback(fid);
        }
    }
    function broadcastFidChange(key, fid) {
        const channel = getBroadcastChannel();
        if (channel) {
            channel.postMessage({ key, fid });
        }
        closeBroadcastChannel();
    }
    let broadcastChannel = null;
    /** Opens and returns a BroadcastChannel if it is supported by the browser. */
    function getBroadcastChannel() {
        if (!broadcastChannel && 'BroadcastChannel' in self) {
            broadcastChannel = new BroadcastChannel('[Firebase] FID Change');
            broadcastChannel.onmessage = e => {
                callFidChangeCallbacks(e.data.key, e.data.fid);
            };
        }
        return broadcastChannel;
    }
    function closeBroadcastChannel() {
        if (fidChangeCallbacks.size === 0 && broadcastChannel) {
            broadcastChannel.close();
            broadcastChannel = null;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DATABASE_NAME = 'firebase-installations-database';
    const DATABASE_VERSION = 1;
    const OBJECT_STORE_NAME = 'firebase-installations-store';
    let dbPromise = null;
    function getDbPromise() {
        if (!dbPromise) {
            dbPromise = idb.openDb(DATABASE_NAME, DATABASE_VERSION, upgradeDB => {
                // We don't use 'break' in this switch statement, the fall-through
                // behavior is what we want, because if there are multiple versions between
                // the old version and the current version, we want ALL the migrations
                // that correspond to those versions to run, not only the last one.
                // eslint-disable-next-line default-case
                switch (upgradeDB.oldVersion) {
                    case 0:
                        upgradeDB.createObjectStore(OBJECT_STORE_NAME);
                }
            });
        }
        return dbPromise;
    }
    /** Assigns or overwrites the record for the given key with the given value. */
    async function set(appConfig, value) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(OBJECT_STORE_NAME);
        const oldValue = await objectStore.get(key);
        await objectStore.put(value, key);
        await tx.complete;
        if (!oldValue || oldValue.fid !== value.fid) {
            fidChanged(appConfig, value.fid);
        }
        return value;
    }
    /** Removes record(s) from the objectStore that match the given key. */
    async function remove(appConfig) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        await tx.objectStore(OBJECT_STORE_NAME).delete(key);
        await tx.complete;
    }
    /**
     * Atomically updates a record with the result of updateFn, which gets
     * called with the current value. If newValue is undefined, the record is
     * deleted instead.
     * @return Updated value
     */
    async function update(appConfig, updateFn) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const store = tx.objectStore(OBJECT_STORE_NAME);
        const oldValue = await store.get(key);
        const newValue = updateFn(oldValue);
        if (newValue === undefined) {
            await store.delete(key);
        }
        else {
            await store.put(newValue, key);
        }
        await tx.complete;
        if (newValue && (!oldValue || oldValue.fid !== newValue.fid)) {
            fidChanged(appConfig, newValue.fid);
        }
        return newValue;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Updates and returns the InstallationEntry from the database.
     * Also triggers a registration request if it is necessary and possible.
     */
    async function getInstallationEntry(appConfig) {
        let registrationPromise;
        const installationEntry = await update(appConfig, oldEntry => {
            const installationEntry = updateOrCreateInstallationEntry(oldEntry);
            const entryWithPromise = triggerRegistrationIfNecessary(appConfig, installationEntry);
            registrationPromise = entryWithPromise.registrationPromise;
            return entryWithPromise.installationEntry;
        });
        if (installationEntry.fid === INVALID_FID) {
            // FID generation failed. Waiting for the FID from the server.
            return { installationEntry: await registrationPromise };
        }
        return {
            installationEntry,
            registrationPromise
        };
    }
    /**
     * Creates a new Installation Entry if one does not exist.
     * Also clears timed out pending requests.
     */
    function updateOrCreateInstallationEntry(oldEntry) {
        const entry = oldEntry || {
            fid: generateFid(),
            registrationStatus: 0 /* NOT_STARTED */
        };
        return clearTimedOutRequest(entry);
    }
    /**
     * If the Firebase Installation is not registered yet, this will trigger the
     * registration and return an InProgressInstallationEntry.
     *
     * If registrationPromise does not exist, the installationEntry is guaranteed
     * to be registered.
     */
    function triggerRegistrationIfNecessary(appConfig, installationEntry) {
        if (installationEntry.registrationStatus === 0 /* NOT_STARTED */) {
            if (!navigator.onLine) {
                // Registration required but app is offline.
                const registrationPromiseWithError = Promise.reject(ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */));
                return {
                    installationEntry,
                    registrationPromise: registrationPromiseWithError
                };
            }
            // Try registering. Change status to IN_PROGRESS.
            const inProgressEntry = {
                fid: installationEntry.fid,
                registrationStatus: 1 /* IN_PROGRESS */,
                registrationTime: Date.now()
            };
            const registrationPromise = registerInstallation(appConfig, inProgressEntry);
            return { installationEntry: inProgressEntry, registrationPromise };
        }
        else if (installationEntry.registrationStatus === 1 /* IN_PROGRESS */) {
            return {
                installationEntry,
                registrationPromise: waitUntilFidRegistration(appConfig)
            };
        }
        else {
            return { installationEntry };
        }
    }
    /** This will be executed only once for each new Firebase Installation. */
    async function registerInstallation(appConfig, installationEntry) {
        try {
            const registeredInstallationEntry = await createInstallationRequest(appConfig, installationEntry);
            return set(appConfig, registeredInstallationEntry);
        }
        catch (e) {
            if (isServerError(e) && e.customData.serverCode === 409) {
                // Server returned a "FID can not be used" error.
                // Generate a new ID next time.
                await remove(appConfig);
            }
            else {
                // Registration failed. Set FID as not registered.
                await set(appConfig, {
                    fid: installationEntry.fid,
                    registrationStatus: 0 /* NOT_STARTED */
                });
            }
            throw e;
        }
    }
    /** Call if FID registration is pending in another request. */
    async function waitUntilFidRegistration(appConfig) {
        // Unfortunately, there is no way of reliably observing when a value in
        // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
        // so we need to poll.
        let entry = await updateInstallationRequest(appConfig);
        while (entry.registrationStatus === 1 /* IN_PROGRESS */) {
            // createInstallation request still in progress.
            await sleep(100);
            entry = await updateInstallationRequest(appConfig);
        }
        if (entry.registrationStatus === 0 /* NOT_STARTED */) {
            // The request timed out or failed in a different call. Try again.
            const { installationEntry, registrationPromise } = await getInstallationEntry(appConfig);
            if (registrationPromise) {
                return registrationPromise;
            }
            else {
                // if there is no registrationPromise, entry is registered.
                return installationEntry;
            }
        }
        return entry;
    }
    /**
     * Called only if there is a CreateInstallation request in progress.
     *
     * Updates the InstallationEntry in the DB based on the status of the
     * CreateInstallation request.
     *
     * Returns the updated InstallationEntry.
     */
    function updateInstallationRequest(appConfig) {
        return update(appConfig, oldEntry => {
            if (!oldEntry) {
                throw ERROR_FACTORY$1.create("installation-not-found" /* INSTALLATION_NOT_FOUND */);
            }
            return clearTimedOutRequest(oldEntry);
        });
    }
    function clearTimedOutRequest(entry) {
        if (hasInstallationRequestTimedOut(entry)) {
            return {
                fid: entry.fid,
                registrationStatus: 0 /* NOT_STARTED */
            };
        }
        return entry;
    }
    function hasInstallationRequestTimedOut(installationEntry) {
        return (installationEntry.registrationStatus === 1 /* IN_PROGRESS */ &&
            installationEntry.registrationTime + PENDING_TIMEOUT_MS < Date.now());
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function generateAuthTokenRequest({ appConfig, platformLoggerProvider }, installationEntry) {
        const endpoint = getGenerateAuthTokenEndpoint(appConfig, installationEntry);
        const headers = getHeadersWithAuth(appConfig, installationEntry);
        // If platform logger exists, add the platform info string to the header.
        const platformLogger = platformLoggerProvider.getImmediate({
            optional: true
        });
        if (platformLogger) {
            headers.append('x-firebase-client', platformLogger.getPlatformInfoString());
        }
        const body = {
            installation: {
                sdkVersion: PACKAGE_VERSION
            }
        };
        const request = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await retryIfServerError(() => fetch(endpoint, request));
        if (response.ok) {
            const responseValue = await response.json();
            const completedAuthToken = extractAuthTokenInfoFromResponse(responseValue);
            return completedAuthToken;
        }
        else {
            throw await getErrorFromResponse('Generate Auth Token', response);
        }
    }
    function getGenerateAuthTokenEndpoint(appConfig, { fid }) {
        return `${getInstallationsEndpoint(appConfig)}/${fid}/authTokens:generate`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns a valid authentication token for the installation. Generates a new
     * token if one doesn't exist, is expired or about to expire.
     *
     * Should only be called if the Firebase Installation is registered.
     */
    async function refreshAuthToken(installations, forceRefresh = false) {
        let tokenPromise;
        const entry = await update(installations.appConfig, oldEntry => {
            if (!isEntryRegistered(oldEntry)) {
                throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
            }
            const oldAuthToken = oldEntry.authToken;
            if (!forceRefresh && isAuthTokenValid(oldAuthToken)) {
                // There is a valid token in the DB.
                return oldEntry;
            }
            else if (oldAuthToken.requestStatus === 1 /* IN_PROGRESS */) {
                // There already is a token request in progress.
                tokenPromise = waitUntilAuthTokenRequest(installations, forceRefresh);
                return oldEntry;
            }
            else {
                // No token or token expired.
                if (!navigator.onLine) {
                    throw ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */);
                }
                const inProgressEntry = makeAuthTokenRequestInProgressEntry(oldEntry);
                tokenPromise = fetchAuthTokenFromServer(installations, inProgressEntry);
                return inProgressEntry;
            }
        });
        const authToken = tokenPromise
            ? await tokenPromise
            : entry.authToken;
        return authToken;
    }
    /**
     * Call only if FID is registered and Auth Token request is in progress.
     *
     * Waits until the current pending request finishes. If the request times out,
     * tries once in this thread as well.
     */
    async function waitUntilAuthTokenRequest(installations, forceRefresh) {
        // Unfortunately, there is no way of reliably observing when a value in
        // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
        // so we need to poll.
        let entry = await updateAuthTokenRequest(installations.appConfig);
        while (entry.authToken.requestStatus === 1 /* IN_PROGRESS */) {
            // generateAuthToken still in progress.
            await sleep(100);
            entry = await updateAuthTokenRequest(installations.appConfig);
        }
        const authToken = entry.authToken;
        if (authToken.requestStatus === 0 /* NOT_STARTED */) {
            // The request timed out or failed in a different call. Try again.
            return refreshAuthToken(installations, forceRefresh);
        }
        else {
            return authToken;
        }
    }
    /**
     * Called only if there is a GenerateAuthToken request in progress.
     *
     * Updates the InstallationEntry in the DB based on the status of the
     * GenerateAuthToken request.
     *
     * Returns the updated InstallationEntry.
     */
    function updateAuthTokenRequest(appConfig) {
        return update(appConfig, oldEntry => {
            if (!isEntryRegistered(oldEntry)) {
                throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
            }
            const oldAuthToken = oldEntry.authToken;
            if (hasAuthTokenRequestTimedOut(oldAuthToken)) {
                return Object.assign(Object.assign({}, oldEntry), { authToken: { requestStatus: 0 /* NOT_STARTED */ } });
            }
            return oldEntry;
        });
    }
    async function fetchAuthTokenFromServer(installations, installationEntry) {
        try {
            const authToken = await generateAuthTokenRequest(installations, installationEntry);
            const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken });
            await set(installations.appConfig, updatedInstallationEntry);
            return authToken;
        }
        catch (e) {
            if (isServerError(e) &&
                (e.customData.serverCode === 401 || e.customData.serverCode === 404)) {
                // Server returned a "FID not found" or a "Invalid authentication" error.
                // Generate a new ID next time.
                await remove(installations.appConfig);
            }
            else {
                const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken: { requestStatus: 0 /* NOT_STARTED */ } });
                await set(installations.appConfig, updatedInstallationEntry);
            }
            throw e;
        }
    }
    function isEntryRegistered(installationEntry) {
        return (installationEntry !== undefined &&
            installationEntry.registrationStatus === 2 /* COMPLETED */);
    }
    function isAuthTokenValid(authToken) {
        return (authToken.requestStatus === 2 /* COMPLETED */ &&
            !isAuthTokenExpired(authToken));
    }
    function isAuthTokenExpired(authToken) {
        const now = Date.now();
        return (now < authToken.creationTime ||
            authToken.creationTime + authToken.expiresIn < now + TOKEN_EXPIRATION_BUFFER);
    }
    /** Returns an updated InstallationEntry with an InProgressAuthToken. */
    function makeAuthTokenRequestInProgressEntry(oldEntry) {
        const inProgressAuthToken = {
            requestStatus: 1 /* IN_PROGRESS */,
            requestTime: Date.now()
        };
        return Object.assign(Object.assign({}, oldEntry), { authToken: inProgressAuthToken });
    }
    function hasAuthTokenRequestTimedOut(authToken) {
        return (authToken.requestStatus === 1 /* IN_PROGRESS */ &&
            authToken.requestTime + PENDING_TIMEOUT_MS < Date.now());
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Creates a Firebase Installation if there isn't one for the app and
     * returns the Installation ID.
     * @param installations - The `Installations` instance.
     *
     * @public
     */
    async function getId(installations) {
        const installationsImpl = installations;
        const { installationEntry, registrationPromise } = await getInstallationEntry(installationsImpl.appConfig);
        if (registrationPromise) {
            registrationPromise.catch(console.error);
        }
        else {
            // If the installation is already registered, update the authentication
            // token if needed.
            refreshAuthToken(installationsImpl).catch(console.error);
        }
        return installationEntry.fid;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns a Firebase Installations auth token, identifying the current
     * Firebase Installation.
     * @param installations - The `Installations` instance.
     * @param forceRefresh - Force refresh regardless of token expiration.
     *
     * @public
     */
    async function getToken(installations, forceRefresh = false) {
        const installationsImpl = installations;
        await completeInstallationRegistration(installationsImpl.appConfig);
        // At this point we either have a Registered Installation in the DB, or we've
        // already thrown an error.
        const authToken = await refreshAuthToken(installationsImpl, forceRefresh);
        return authToken.token;
    }
    async function completeInstallationRegistration(appConfig) {
        const { registrationPromise } = await getInstallationEntry(appConfig);
        if (registrationPromise) {
            // A createInstallation request is in progress. Wait until it finishes.
            await registrationPromise;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function extractAppConfig(app) {
        if (!app || !app.options) {
            throw getMissingValueError('App Configuration');
        }
        if (!app.name) {
            throw getMissingValueError('App Name');
        }
        // Required app config keys
        const configKeys = [
            'projectId',
            'apiKey',
            'appId'
        ];
        for (const keyName of configKeys) {
            if (!app.options[keyName]) {
                throw getMissingValueError(keyName);
            }
        }
        return {
            appName: app.name,
            projectId: app.options.projectId,
            apiKey: app.options.apiKey,
            appId: app.options.appId
        };
    }
    function getMissingValueError(valueName) {
        return ERROR_FACTORY$1.create("missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */, {
            valueName
        });
    }

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const INSTALLATIONS_NAME = 'installations';
    const INSTALLATIONS_NAME_INTERNAL = 'installations-internal';
    const publicFactory = (container) => {
        const app = container.getProvider('app').getImmediate();
        // Throws if app isn't configured properly.
        const appConfig = extractAppConfig(app);
        const platformLoggerProvider = _getProvider(app, 'platform-logger');
        const installationsImpl = {
            app,
            appConfig,
            platformLoggerProvider,
            _delete: () => Promise.resolve()
        };
        return installationsImpl;
    };
    const internalFactory = (container) => {
        const app = container.getProvider('app').getImmediate();
        // Internal FIS instance relies on public FIS instance.
        const installations = _getProvider(app, INSTALLATIONS_NAME).getImmediate();
        const installationsInternal = {
            getId: () => getId(installations),
            getToken: (forceRefresh) => getToken(installations, forceRefresh)
        };
        return installationsInternal;
    };
    function registerInstallations() {
        _registerComponent(new Component(INSTALLATIONS_NAME, publicFactory, "PUBLIC" /* PUBLIC */));
        _registerComponent(new Component(INSTALLATIONS_NAME_INTERNAL, internalFactory, "PRIVATE" /* PRIVATE */));
    }

    /**
     * Firebase Installations
     *
     * @packageDocumentation
     */
    registerInstallations();
    registerVersion(name$2, version$2);
    // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
    registerVersion(name$2, version$2, 'esm2017');

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Type constant for Firebase Analytics.
     */
    const ANALYTICS_TYPE = 'analytics';
    // Key to attach FID to in gtag params.
    const GA_FID_KEY = 'firebase_id';
    const ORIGIN_KEY = 'origin';
    const FETCH_TIMEOUT_MILLIS = 60 * 1000;
    const DYNAMIC_CONFIG_URL = 'https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig';
    const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logger$1 = new Logger('@firebase/analytics');

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Makeshift polyfill for Promise.allSettled(). Resolves when all promises
     * have either resolved or rejected.
     *
     * @param promises Array of promises to wait for.
     */
    function promiseAllSettled(promises) {
        return Promise.all(promises.map(promise => promise.catch(e => e)));
    }
    /**
     * Inserts gtag script tag into the page to asynchronously download gtag.
     * @param dataLayerName Name of datalayer (most often the default, "_dataLayer").
     */
    function insertScriptTag(dataLayerName, measurementId) {
        const script = document.createElement('script');
        // We are not providing an analyticsId in the URL because it would trigger a `page_view`
        // without fid. We will initialize ga-id using gtag (config) command together with fid.
        script.src = `${GTAG_URL}?l=${dataLayerName}&id=${measurementId}`;
        script.async = true;
        document.head.appendChild(script);
    }
    /**
     * Get reference to, or create, global datalayer.
     * @param dataLayerName Name of datalayer (most often the default, "_dataLayer").
     */
    function getOrCreateDataLayer(dataLayerName) {
        // Check for existing dataLayer and create if needed.
        let dataLayer = [];
        if (Array.isArray(window[dataLayerName])) {
            dataLayer = window[dataLayerName];
        }
        else {
            window[dataLayerName] = dataLayer;
        }
        return dataLayer;
    }
    /**
     * Wrapped gtag logic when gtag is called with 'config' command.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     * @param measurementId GA Measurement ID to set config for.
     * @param gtagParams Gtag config params to set.
     */
    async function gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, measurementId, gtagParams) {
        // If config is already fetched, we know the appId and can use it to look up what FID promise we
        /// are waiting for, and wait only on that one.
        const correspondingAppId = measurementIdToAppId[measurementId];
        try {
            if (correspondingAppId) {
                await initializationPromisesMap[correspondingAppId];
            }
            else {
                // If config is not fetched yet, wait for all configs (we don't know which one we need) and
                // find the appId (if any) corresponding to this measurementId. If there is one, wait on
                // that appId's initialization promise. If there is none, promise resolves and gtag
                // call goes through.
                const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
                const foundConfig = dynamicConfigResults.find(config => config.measurementId === measurementId);
                if (foundConfig) {
                    await initializationPromisesMap[foundConfig.appId];
                }
            }
        }
        catch (e) {
            logger$1.error(e);
        }
        gtagCore("config" /* CONFIG */, measurementId, gtagParams);
    }
    /**
     * Wrapped gtag logic when gtag is called with 'event' command.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementId GA Measurement ID to log event to.
     * @param gtagParams Params to log with this event.
     */
    async function gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementId, gtagParams) {
        try {
            let initializationPromisesToWaitFor = [];
            // If there's a 'send_to' param, check if any ID specified matches
            // an initializeIds() promise we are waiting for.
            if (gtagParams && gtagParams['send_to']) {
                let gaSendToList = gtagParams['send_to'];
                // Make it an array if is isn't, so it can be dealt with the same way.
                if (!Array.isArray(gaSendToList)) {
                    gaSendToList = [gaSendToList];
                }
                // Checking 'send_to' fields requires having all measurement ID results back from
                // the dynamic config fetch.
                const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
                for (const sendToId of gaSendToList) {
                    // Any fetched dynamic measurement ID that matches this 'send_to' ID
                    const foundConfig = dynamicConfigResults.find(config => config.measurementId === sendToId);
                    const initializationPromise = foundConfig && initializationPromisesMap[foundConfig.appId];
                    if (initializationPromise) {
                        initializationPromisesToWaitFor.push(initializationPromise);
                    }
                    else {
                        // Found an item in 'send_to' that is not associated
                        // directly with an FID, possibly a group.  Empty this array,
                        // exit the loop early, and let it get populated below.
                        initializationPromisesToWaitFor = [];
                        break;
                    }
                }
            }
            // This will be unpopulated if there was no 'send_to' field , or
            // if not all entries in the 'send_to' field could be mapped to
            // a FID. In these cases, wait on all pending initialization promises.
            if (initializationPromisesToWaitFor.length === 0) {
                initializationPromisesToWaitFor = Object.values(initializationPromisesMap);
            }
            // Run core gtag function with args after all relevant initialization
            // promises have been resolved.
            await Promise.all(initializationPromisesToWaitFor);
            // Workaround for http://b/141370449 - third argument cannot be undefined.
            gtagCore("event" /* EVENT */, measurementId, gtagParams || {});
        }
        catch (e) {
            logger$1.error(e);
        }
    }
    /**
     * Wraps a standard gtag function with extra code to wait for completion of
     * relevant initialization promises before sending requests.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     */
    function wrapGtag(gtagCore, 
    /**
     * Allows wrapped gtag calls to wait on whichever intialization promises are required,
     * depending on the contents of the gtag params' `send_to` field, if any.
     */
    initializationPromisesMap, 
    /**
     * Wrapped gtag calls sometimes require all dynamic config fetches to have returned
     * before determining what initialization promises (which include FIDs) to wait for.
     */
    dynamicConfigPromisesList, 
    /**
     * Wrapped gtag config calls can narrow down which initialization promise (with FID)
     * to wait for if the measurementId is already fetched, by getting the corresponding appId,
     * which is the key for the initialization promises map.
     */
    measurementIdToAppId) {
        /**
         * Wrapper around gtag that ensures FID is sent with gtag calls.
         * @param command Gtag command type.
         * @param idOrNameOrParams Measurement ID if command is EVENT/CONFIG, params if command is SET.
         * @param gtagParams Params if event is EVENT/CONFIG.
         */
        async function gtagWrapper(command, idOrNameOrParams, gtagParams) {
            try {
                // If event, check that relevant initialization promises have completed.
                if (command === "event" /* EVENT */) {
                    // If EVENT, second arg must be measurementId.
                    await gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, idOrNameOrParams, gtagParams);
                }
                else if (command === "config" /* CONFIG */) {
                    // If CONFIG, second arg must be measurementId.
                    await gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, idOrNameOrParams, gtagParams);
                }
                else {
                    // If SET, second arg must be params.
                    gtagCore("set" /* SET */, idOrNameOrParams);
                }
            }
            catch (e) {
                logger$1.error(e);
            }
        }
        return gtagWrapper;
    }
    /**
     * Creates global gtag function or wraps existing one if found.
     * This wrapped function attaches Firebase instance ID (FID) to gtag 'config' and
     * 'event' calls that belong to the GAID associated with this Firebase instance.
     *
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     * @param dataLayerName Name of global GA datalayer array.
     * @param gtagFunctionName Name of global gtag function ("gtag" if not user-specified).
     */
    function wrapOrCreateGtag(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagFunctionName) {
        // Create a basic core gtag function
        let gtagCore = function (..._args) {
            // Must push IArguments object, not an array.
            window[dataLayerName].push(arguments);
        };
        // Replace it with existing one if found
        if (window[gtagFunctionName] &&
            typeof window[gtagFunctionName] === 'function') {
            // @ts-ignore
            gtagCore = window[gtagFunctionName];
        }
        window[gtagFunctionName] = wrapGtag(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId);
        return {
            gtagCore,
            wrappedGtag: window[gtagFunctionName]
        };
    }
    /**
     * Returns first script tag in DOM matching our gtag url pattern.
     */
    function findGtagScriptOnPage() {
        const scriptTags = window.document.getElementsByTagName('script');
        for (const tag of Object.values(scriptTags)) {
            if (tag.src && tag.src.includes(GTAG_URL)) {
                return tag;
            }
        }
        return null;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERRORS = {
        ["already-exists" /* ALREADY_EXISTS */]: 'A Firebase Analytics instance with the appId {$id} ' +
            ' already exists. ' +
            'Only one Firebase Analytics instance can be created for each appId.',
        ["already-initialized" /* ALREADY_INITIALIZED */]: 'initializeAnalytics() cannot be called again with different options than those ' +
            'it was initially called with. It can be called again with the same options to ' +
            'return the existing instance, or getAnalytics() can be used ' +
            'to get a reference to the already-intialized instance.',
        ["already-initialized-settings" /* ALREADY_INITIALIZED_SETTINGS */]: 'Firebase Analytics has already been initialized.' +
            'settings() must be called before initializing any Analytics instance' +
            'or it will have no effect.',
        ["interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */]: 'Firebase Analytics Interop Component failed to instantiate: {$reason}',
        ["invalid-analytics-context" /* INVALID_ANALYTICS_CONTEXT */]: 'Firebase Analytics is not supported in this environment. ' +
            'Wrap initialization of analytics in analytics.isSupported() ' +
            'to prevent initialization in unsupported environments. Details: {$errorInfo}',
        ["indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */]: 'IndexedDB unavailable or restricted in this environment. ' +
            'Wrap initialization of analytics in analytics.isSupported() ' +
            'to prevent initialization in unsupported environments. Details: {$errorInfo}',
        ["fetch-throttle" /* FETCH_THROTTLE */]: 'The config fetch request timed out while in an exponential backoff state.' +
            ' Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.',
        ["config-fetch-failed" /* CONFIG_FETCH_FAILED */]: 'Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}',
        ["no-api-key" /* NO_API_KEY */]: 'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field to' +
            'contain a valid API key.',
        ["no-app-id" /* NO_APP_ID */]: 'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field to' +
            'contain a valid app ID.'
    };
    const ERROR_FACTORY = new ErrorFactory('analytics', 'Analytics', ERRORS);

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Backoff factor for 503 errors, which we want to be conservative about
     * to avoid overloading servers. Each retry interval will be
     * BASE_INTERVAL_MILLIS * LONG_RETRY_FACTOR ^ retryCount, so the second one
     * will be ~30 seconds (with fuzzing).
     */
    const LONG_RETRY_FACTOR = 30;
    /**
     * Base wait interval to multiplied by backoffFactor^backoffCount.
     */
    const BASE_INTERVAL_MILLIS = 1000;
    /**
     * Stubbable retry data storage class.
     */
    class RetryData {
        constructor(throttleMetadata = {}, intervalMillis = BASE_INTERVAL_MILLIS) {
            this.throttleMetadata = throttleMetadata;
            this.intervalMillis = intervalMillis;
        }
        getThrottleMetadata(appId) {
            return this.throttleMetadata[appId];
        }
        setThrottleMetadata(appId, metadata) {
            this.throttleMetadata[appId] = metadata;
        }
        deleteThrottleMetadata(appId) {
            delete this.throttleMetadata[appId];
        }
    }
    const defaultRetryData = new RetryData();
    /**
     * Set GET request headers.
     * @param apiKey App API key.
     */
    function getHeaders(apiKey) {
        return new Headers({
            Accept: 'application/json',
            'x-goog-api-key': apiKey
        });
    }
    /**
     * Fetches dynamic config from backend.
     * @param app Firebase app to fetch config for.
     */
    async function fetchDynamicConfig(appFields) {
        var _a;
        const { appId, apiKey } = appFields;
        const request = {
            method: 'GET',
            headers: getHeaders(apiKey)
        };
        const appUrl = DYNAMIC_CONFIG_URL.replace('{app-id}', appId);
        const response = await fetch(appUrl, request);
        if (response.status !== 200 && response.status !== 304) {
            let errorMessage = '';
            try {
                // Try to get any error message text from server response.
                const jsonResponse = (await response.json());
                if ((_a = jsonResponse.error) === null || _a === void 0 ? void 0 : _a.message) {
                    errorMessage = jsonResponse.error.message;
                }
            }
            catch (_ignored) { }
            throw ERROR_FACTORY.create("config-fetch-failed" /* CONFIG_FETCH_FAILED */, {
                httpStatus: response.status,
                responseMessage: errorMessage
            });
        }
        return response.json();
    }
    /**
     * Fetches dynamic config from backend, retrying if failed.
     * @param app Firebase app to fetch config for.
     */
    async function fetchDynamicConfigWithRetry(app, 
    // retryData and timeoutMillis are parameterized to allow passing a different value for testing.
    retryData = defaultRetryData, timeoutMillis) {
        const { appId, apiKey, measurementId } = app.options;
        if (!appId) {
            throw ERROR_FACTORY.create("no-app-id" /* NO_APP_ID */);
        }
        if (!apiKey) {
            if (measurementId) {
                return {
                    measurementId,
                    appId
                };
            }
            throw ERROR_FACTORY.create("no-api-key" /* NO_API_KEY */);
        }
        const throttleMetadata = retryData.getThrottleMetadata(appId) || {
            backoffCount: 0,
            throttleEndTimeMillis: Date.now()
        };
        const signal = new AnalyticsAbortSignal();
        setTimeout(async () => {
            // Note a very low delay, eg < 10ms, can elapse before listeners are initialized.
            signal.abort();
        }, timeoutMillis !== undefined ? timeoutMillis : FETCH_TIMEOUT_MILLIS);
        return attemptFetchDynamicConfigWithRetry({ appId, apiKey, measurementId }, throttleMetadata, signal, retryData);
    }
    /**
     * Runs one retry attempt.
     * @param appFields Necessary app config fields.
     * @param throttleMetadata Ongoing metadata to determine throttling times.
     * @param signal Abort signal.
     */
    async function attemptFetchDynamicConfigWithRetry(appFields, { throttleEndTimeMillis, backoffCount }, signal, retryData = defaultRetryData // for testing
    ) {
        const { appId, measurementId } = appFields;
        // Starts with a (potentially zero) timeout to support resumption from stored state.
        // Ensures the throttle end time is honored if the last attempt timed out.
        // Note the SDK will never make a request if the fetch timeout expires at this point.
        try {
            await setAbortableTimeout(signal, throttleEndTimeMillis);
        }
        catch (e) {
            if (measurementId) {
                logger$1.warn(`Timed out fetching this Firebase app's measurement ID from the server.` +
                    ` Falling back to the measurement ID ${measurementId}` +
                    ` provided in the "measurementId" field in the local Firebase config. [${e.message}]`);
                return { appId, measurementId };
            }
            throw e;
        }
        try {
            const response = await fetchDynamicConfig(appFields);
            // Note the SDK only clears throttle state if response is success or non-retriable.
            retryData.deleteThrottleMetadata(appId);
            return response;
        }
        catch (e) {
            if (!isRetriableError(e)) {
                retryData.deleteThrottleMetadata(appId);
                if (measurementId) {
                    logger$1.warn(`Failed to fetch this Firebase app's measurement ID from the server.` +
                        ` Falling back to the measurement ID ${measurementId}` +
                        ` provided in the "measurementId" field in the local Firebase config. [${e.message}]`);
                    return { appId, measurementId };
                }
                else {
                    throw e;
                }
            }
            const backoffMillis = Number(e.customData.httpStatus) === 503
                ? calculateBackoffMillis(backoffCount, retryData.intervalMillis, LONG_RETRY_FACTOR)
                : calculateBackoffMillis(backoffCount, retryData.intervalMillis);
            // Increments backoff state.
            const throttleMetadata = {
                throttleEndTimeMillis: Date.now() + backoffMillis,
                backoffCount: backoffCount + 1
            };
            // Persists state.
            retryData.setThrottleMetadata(appId, throttleMetadata);
            logger$1.debug(`Calling attemptFetch again in ${backoffMillis} millis`);
            return attemptFetchDynamicConfigWithRetry(appFields, throttleMetadata, signal, retryData);
        }
    }
    /**
     * Supports waiting on a backoff by:
     *
     * <ul>
     *   <li>Promisifying setTimeout, so we can set a timeout in our Promise chain</li>
     *   <li>Listening on a signal bus for abort events, just like the Fetch API</li>
     *   <li>Failing in the same way the Fetch API fails, so timing out a live request and a throttled
     *       request appear the same.</li>
     * </ul>
     *
     * <p>Visible for testing.
     */
    function setAbortableTimeout(signal, throttleEndTimeMillis) {
        return new Promise((resolve, reject) => {
            // Derives backoff from given end time, normalizing negative numbers to zero.
            const backoffMillis = Math.max(throttleEndTimeMillis - Date.now(), 0);
            const timeout = setTimeout(resolve, backoffMillis);
            // Adds listener, rather than sets onabort, because signal is a shared object.
            signal.addEventListener(() => {
                clearTimeout(timeout);
                // If the request completes before this timeout, the rejection has no effect.
                reject(ERROR_FACTORY.create("fetch-throttle" /* FETCH_THROTTLE */, {
                    throttleEndTimeMillis
                }));
            });
        });
    }
    /**
     * Returns true if the {@link Error} indicates a fetch request may succeed later.
     */
    function isRetriableError(e) {
        if (!(e instanceof FirebaseError) || !e.customData) {
            return false;
        }
        // Uses string index defined by ErrorData, which FirebaseError implements.
        const httpStatus = Number(e.customData['httpStatus']);
        return (httpStatus === 429 ||
            httpStatus === 500 ||
            httpStatus === 503 ||
            httpStatus === 504);
    }
    /**
     * Shims a minimal AbortSignal (copied from Remote Config).
     *
     * <p>AbortController's AbortSignal conveniently decouples fetch timeout logic from other aspects
     * of networking, such as retries. Firebase doesn't use AbortController enough to justify a
     * polyfill recommendation, like we do with the Fetch API, but this minimal shim can easily be
     * swapped out if/when we do.
     */
    class AnalyticsAbortSignal {
        constructor() {
            this.listeners = [];
        }
        addEventListener(listener) {
            this.listeners.push(listener);
        }
        abort() {
            this.listeners.forEach(listener => listener());
        }
    }

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function validateIndexedDB() {
        if (!isIndexedDBAvailable()) {
            logger$1.warn(ERROR_FACTORY.create("indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */, {
                errorInfo: 'IndexedDB is not available in this environment.'
            }).message);
            return false;
        }
        else {
            try {
                await validateIndexedDBOpenable();
            }
            catch (e) {
                logger$1.warn(ERROR_FACTORY.create("indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */, {
                    errorInfo: e
                }).message);
                return false;
            }
        }
        return true;
    }
    /**
     * Initialize the analytics instance in gtag.js by calling config command with fid.
     *
     * NOTE: We combine analytics initialization and setting fid together because we want fid to be
     * part of the `page_view` event that's sent during the initialization
     * @param app Firebase app
     * @param gtagCore The gtag function that's not wrapped.
     * @param dynamicConfigPromisesList Array of all dynamic config promises.
     * @param measurementIdToAppId Maps measurementID to appID.
     * @param installations _FirebaseInstallationsInternal instance.
     *
     * @returns Measurement ID.
     */
    async function _initializeAnalytics(app, dynamicConfigPromisesList, measurementIdToAppId, installations, gtagCore, dataLayerName, options) {
        var _a;
        const dynamicConfigPromise = fetchDynamicConfigWithRetry(app);
        // Once fetched, map measurementIds to appId, for ease of lookup in wrapped gtag function.
        dynamicConfigPromise
            .then(config => {
            measurementIdToAppId[config.measurementId] = config.appId;
            if (app.options.measurementId &&
                config.measurementId !== app.options.measurementId) {
                logger$1.warn(`The measurement ID in the local Firebase config (${app.options.measurementId})` +
                    ` does not match the measurement ID fetched from the server (${config.measurementId}).` +
                    ` To ensure analytics events are always sent to the correct Analytics property,` +
                    ` update the` +
                    ` measurement ID field in the local config or remove it from the local config.`);
            }
        })
            .catch(e => logger$1.error(e));
        // Add to list to track state of all dynamic config promises.
        dynamicConfigPromisesList.push(dynamicConfigPromise);
        const fidPromise = validateIndexedDB().then(envIsValid => {
            if (envIsValid) {
                return installations.getId();
            }
            else {
                return undefined;
            }
        });
        const [dynamicConfig, fid] = await Promise.all([
            dynamicConfigPromise,
            fidPromise
        ]);
        // Detect if user has already put the gtag <script> tag on this page.
        if (!findGtagScriptOnPage()) {
            insertScriptTag(dataLayerName, dynamicConfig.measurementId);
        }
        // This command initializes gtag.js and only needs to be called once for the entire web app,
        // but since it is idempotent, we can call it multiple times.
        // We keep it together with other initialization logic for better code structure.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtagCore('js', new Date());
        // User config added first. We don't want users to accidentally overwrite
        // base Firebase config properties.
        const configProperties = (_a = options === null || options === void 0 ? void 0 : options.config) !== null && _a !== void 0 ? _a : {};
        // guard against developers accidentally setting properties with prefix `firebase_`
        configProperties[ORIGIN_KEY] = 'firebase';
        configProperties.update = true;
        if (fid != null) {
            configProperties[GA_FID_KEY] = fid;
        }
        // It should be the first config command called on this GA-ID
        // Initialize this GA-ID and set FID on it using the gtag config API.
        // Note: This will trigger a page_view event unless 'send_page_view' is set to false in
        // `configProperties`.
        gtagCore("config" /* CONFIG */, dynamicConfig.measurementId, configProperties);
        return dynamicConfig.measurementId;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Analytics Service class.
     */
    class AnalyticsService {
        constructor(app) {
            this.app = app;
        }
        _delete() {
            delete initializationPromisesMap[this.app.options.appId];
            return Promise.resolve();
        }
    }
    /**
     * Maps appId to full initialization promise. Wrapped gtag calls must wait on
     * all or some of these, depending on the call's `send_to` param and the status
     * of the dynamic config fetches (see below).
     */
    let initializationPromisesMap = {};
    /**
     * List of dynamic config fetch promises. In certain cases, wrapped gtag calls
     * wait on all these to be complete in order to determine if it can selectively
     * wait for only certain initialization (FID) promises or if it must wait for all.
     */
    let dynamicConfigPromisesList = [];
    /**
     * Maps fetched measurementIds to appId. Populated when the app's dynamic config
     * fetch completes. If already populated, gtag config calls can use this to
     * selectively wait for only this app's initialization promise (FID) instead of all
     * initialization promises.
     */
    const measurementIdToAppId = {};
    /**
     * Name for window global data layer array used by GA: defaults to 'dataLayer'.
     */
    let dataLayerName = 'dataLayer';
    /**
     * Name for window global gtag function used by GA: defaults to 'gtag'.
     */
    let gtagName = 'gtag';
    /**
     * Reproduction of standard gtag function or reference to existing
     * gtag function on window object.
     */
    let gtagCoreFunction;
    /**
     * Wrapper around gtag function that ensures FID is sent with all
     * relevant event and config calls.
     */
    let wrappedGtagFunction;
    /**
     * Flag to ensure page initialization steps (creation or wrapping of
     * dataLayer and gtag script) are only run once per page load.
     */
    let globalInitDone = false;
    /**
     * Returns true if no environment mismatch is found.
     * If environment mismatches are found, throws an INVALID_ANALYTICS_CONTEXT
     * error that also lists details for each mismatch found.
     */
    function warnOnBrowserContextMismatch() {
        const mismatchedEnvMessages = [];
        if (isBrowserExtension()) {
            mismatchedEnvMessages.push('This is a browser extension environment.');
        }
        if (!areCookiesEnabled()) {
            mismatchedEnvMessages.push('Cookies are not available.');
        }
        if (mismatchedEnvMessages.length > 0) {
            const details = mismatchedEnvMessages
                .map((message, index) => `(${index + 1}) ${message}`)
                .join(' ');
            const err = ERROR_FACTORY.create("invalid-analytics-context" /* INVALID_ANALYTICS_CONTEXT */, {
                errorInfo: details
            });
            logger$1.warn(err.message);
        }
    }
    /**
     * Analytics instance factory.
     * @internal
     */
    function factory(app, installations, options) {
        warnOnBrowserContextMismatch();
        const appId = app.options.appId;
        if (!appId) {
            throw ERROR_FACTORY.create("no-app-id" /* NO_APP_ID */);
        }
        if (!app.options.apiKey) {
            if (app.options.measurementId) {
                logger$1.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest` +
                    ` measurement ID for this Firebase app. Falling back to the measurement ID ${app.options.measurementId}` +
                    ` provided in the "measurementId" field in the local Firebase config.`);
            }
            else {
                throw ERROR_FACTORY.create("no-api-key" /* NO_API_KEY */);
            }
        }
        if (initializationPromisesMap[appId] != null) {
            throw ERROR_FACTORY.create("already-exists" /* ALREADY_EXISTS */, {
                id: appId
            });
        }
        if (!globalInitDone) {
            // Steps here should only be done once per page: creation or wrapping
            // of dataLayer and global gtag function.
            getOrCreateDataLayer(dataLayerName);
            const { wrappedGtag, gtagCore } = wrapOrCreateGtag(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagName);
            wrappedGtagFunction = wrappedGtag;
            gtagCoreFunction = gtagCore;
            globalInitDone = true;
        }
        // Async but non-blocking.
        // This map reflects the completion state of all promises for each appId.
        initializationPromisesMap[appId] = _initializeAnalytics(app, dynamicConfigPromisesList, measurementIdToAppId, installations, gtagCoreFunction, dataLayerName, options);
        const analyticsInstance = new AnalyticsService(app);
        return analyticsInstance;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Logs an analytics event through the Firebase SDK.
     *
     * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
     * @param eventName Google Analytics event name, choose from standard list or use a custom string.
     * @param eventParams Analytics event parameters.
     */
    async function logEvent$1(gtagFunction, initializationPromise, eventName, eventParams, options) {
        if (options && options.global) {
            gtagFunction("event" /* EVENT */, eventName, eventParams);
            return;
        }
        else {
            const measurementId = await initializationPromise;
            const params = Object.assign(Object.assign({}, eventParams), { 'send_to': measurementId });
            gtagFunction("event" /* EVENT */, eventName, params);
        }
    }
    /**
     * Sends a Google Analytics event with given `eventParams`. This method
     * automatically associates this logged event with this Firebase web
     * app instance on this device.
     * List of official event parameters can be found in the gtag.js
     * reference documentation:
     * {@link https://developers.google.com/gtagjs/reference/ga4-events
     * | the GA4 reference documentation}.
     *
     * @public
     */
    function logEvent(analyticsInstance, eventName, eventParams, options) {
        analyticsInstance = getModularInstance(analyticsInstance);
        logEvent$1(wrappedGtagFunction, initializationPromisesMap[analyticsInstance.app.options.appId], eventName, eventParams, options).catch(e => logger$1.error(e));
    }

    const name$1 = "@firebase/analytics";
    const version$1 = "0.7.5";

    /**
     * Firebase Analytics
     *
     * @packageDocumentation
     */
    function registerAnalytics() {
        _registerComponent(new Component(ANALYTICS_TYPE, (container, { options: analyticsOptions }) => {
            // getImmediate for FirebaseApp will always succeed
            const app = container.getProvider('app').getImmediate();
            const installations = container
                .getProvider('installations-internal')
                .getImmediate();
            return factory(app, installations, analyticsOptions);
        }, "PUBLIC" /* PUBLIC */));
        _registerComponent(new Component('analytics-internal', internalFactory, "PRIVATE" /* PRIVATE */));
        registerVersion(name$1, version$1);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name$1, version$1, 'esm2017');
        function internalFactory(container) {
            try {
                const analytics = container.getProvider(ANALYTICS_TYPE).getImmediate();
                return {
                    logEvent: (eventName, eventParams, options) => logEvent(analytics, eventName, eventParams, options)
                };
            }
            catch (e) {
                throw ERROR_FACTORY.create("interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */, {
                    reason: e
                });
            }
        }
    }
    registerAnalytics();

    // Import the functions you need from the SDKs you need

    // TODO: Add SDKs for Firebase products that you want to use

    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration

    // For Firebase JS SDK v7.20.0 and later, measurementId is optional

    const firebaseConfig = {
      apiKey: "AIzaSyBLM0jRrQr7dgRGfmj-czXsUgKq_HEDmeg",

      authDomain: "smartsolutions-f3f1d.firebaseapp.com",

      databaseURL: "https://smartsolutions-f3f1d-default-rtdb.firebaseio.com",

      projectId: "smartsolutions-f3f1d",

      storageBucket: "smartsolutions-f3f1d.appspot.com",

      messagingSenderId: "577346773409",

      appId: "1:577346773409:web:f0354e0e04282989446be0",

      measurementId: "G-R309HXRD90",
    };

    // Initialize Firebase

    const app$1 = initializeApp(firebaseConfig);

    const name = "@firebase/database";
    const version = "0.12.5";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** The semver (www.semver.org) version of the SDK. */
    let SDK_VERSION = '';
    /**
     * SDK_VERSION should be set before any database instance is created
     * @internal
     */
    function setSDKVersion(version) {
        SDK_VERSION = version;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Wraps a DOM Storage object and:
     * - automatically encode objects as JSON strings before storing them to allow us to store arbitrary types.
     * - prefixes names with "firebase:" to avoid collisions with app data.
     *
     * We automatically (see storage.js) create two such wrappers, one for sessionStorage,
     * and one for localStorage.
     *
     */
    class DOMStorageWrapper {
        /**
         * @param domStorage_ - The underlying storage object (e.g. localStorage or sessionStorage)
         */
        constructor(domStorage_) {
            this.domStorage_ = domStorage_;
            // Use a prefix to avoid collisions with other stuff saved by the app.
            this.prefix_ = 'firebase:';
        }
        /**
         * @param key - The key to save the value under
         * @param value - The value being stored, or null to remove the key.
         */
        set(key, value) {
            if (value == null) {
                this.domStorage_.removeItem(this.prefixedName_(key));
            }
            else {
                this.domStorage_.setItem(this.prefixedName_(key), stringify(value));
            }
        }
        /**
         * @returns The value that was stored under this key, or null
         */
        get(key) {
            const storedVal = this.domStorage_.getItem(this.prefixedName_(key));
            if (storedVal == null) {
                return null;
            }
            else {
                return jsonEval(storedVal);
            }
        }
        remove(key) {
            this.domStorage_.removeItem(this.prefixedName_(key));
        }
        prefixedName_(name) {
            return this.prefix_ + name;
        }
        toString() {
            return this.domStorage_.toString();
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * An in-memory storage implementation that matches the API of DOMStorageWrapper
     * (TODO: create interface for both to implement).
     */
    class MemoryStorage {
        constructor() {
            this.cache_ = {};
            this.isInMemoryStorage = true;
        }
        set(key, value) {
            if (value == null) {
                delete this.cache_[key];
            }
            else {
                this.cache_[key] = value;
            }
        }
        get(key) {
            if (contains(this.cache_, key)) {
                return this.cache_[key];
            }
            return null;
        }
        remove(key) {
            delete this.cache_[key];
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Helper to create a DOMStorageWrapper or else fall back to MemoryStorage.
     * TODO: Once MemoryStorage and DOMStorageWrapper have a shared interface this method annotation should change
     * to reflect this type
     *
     * @param domStorageName - Name of the underlying storage object
     *   (e.g. 'localStorage' or 'sessionStorage').
     * @returns Turning off type information until a common interface is defined.
     */
    const createStoragefor = function (domStorageName) {
        try {
            // NOTE: just accessing "localStorage" or "window['localStorage']" may throw a security exception,
            // so it must be inside the try/catch.
            if (typeof window !== 'undefined' &&
                typeof window[domStorageName] !== 'undefined') {
                // Need to test cache. Just because it's here doesn't mean it works
                const domStorage = window[domStorageName];
                domStorage.setItem('firebase:sentinel', 'cache');
                domStorage.removeItem('firebase:sentinel');
                return new DOMStorageWrapper(domStorage);
            }
        }
        catch (e) { }
        // Failed to create wrapper.  Just return in-memory storage.
        // TODO: log?
        return new MemoryStorage();
    };
    /** A storage object that lasts across sessions */
    const PersistentStorage = createStoragefor('localStorage');
    /** A storage object that only lasts one session */
    const SessionStorage = createStoragefor('sessionStorage');

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logClient = new Logger('@firebase/database');
    /**
     * Returns a locally-unique ID (generated by just incrementing up from 0 each time its called).
     */
    const LUIDGenerator = (function () {
        let id = 1;
        return function () {
            return id++;
        };
    })();
    /**
     * Sha1 hash of the input string
     * @param str - The string to hash
     * @returns {!string} The resulting hash
     */
    const sha1 = function (str) {
        const utf8Bytes = stringToByteArray(str);
        const sha1 = new Sha1();
        sha1.update(utf8Bytes);
        const sha1Bytes = sha1.digest();
        return base64.encodeByteArray(sha1Bytes);
    };
    const buildLogMessage_ = function (...varArgs) {
        let message = '';
        for (let i = 0; i < varArgs.length; i++) {
            const arg = varArgs[i];
            if (Array.isArray(arg) ||
                (arg &&
                    typeof arg === 'object' &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    typeof arg.length === 'number')) {
                message += buildLogMessage_.apply(null, arg);
            }
            else if (typeof arg === 'object') {
                message += stringify(arg);
            }
            else {
                message += arg;
            }
            message += ' ';
        }
        return message;
    };
    /**
     * Use this for all debug messages in Firebase.
     */
    let logger = null;
    /**
     * Flag to check for log availability on first log message
     */
    let firstLog_ = true;
    /**
     * The implementation of Firebase.enableLogging (defined here to break dependencies)
     * @param logger_ - A flag to turn on logging, or a custom logger
     * @param persistent - Whether or not to persist logging settings across refreshes
     */
    const enableLogging$1 = function (logger_, persistent) {
        assert(!persistent || logger_ === true || logger_ === false, "Can't turn on custom loggers persistently.");
        if (logger_ === true) {
            logClient.logLevel = LogLevel.VERBOSE;
            logger = logClient.log.bind(logClient);
            if (persistent) {
                SessionStorage.set('logging_enabled', true);
            }
        }
        else if (typeof logger_ === 'function') {
            logger = logger_;
        }
        else {
            logger = null;
            SessionStorage.remove('logging_enabled');
        }
    };
    const log = function (...varArgs) {
        if (firstLog_ === true) {
            firstLog_ = false;
            if (logger === null && SessionStorage.get('logging_enabled') === true) {
                enableLogging$1(true);
            }
        }
        if (logger) {
            const message = buildLogMessage_.apply(null, varArgs);
            logger(message);
        }
    };
    const logWrapper = function (prefix) {
        return function (...varArgs) {
            log(prefix, ...varArgs);
        };
    };
    const error = function (...varArgs) {
        const message = 'FIREBASE INTERNAL ERROR: ' + buildLogMessage_(...varArgs);
        logClient.error(message);
    };
    const fatal = function (...varArgs) {
        const message = `FIREBASE FATAL ERROR: ${buildLogMessage_(...varArgs)}`;
        logClient.error(message);
        throw new Error(message);
    };
    const warn = function (...varArgs) {
        const message = 'FIREBASE WARNING: ' + buildLogMessage_(...varArgs);
        logClient.warn(message);
    };
    /**
     * Logs a warning if the containing page uses https. Called when a call to new Firebase
     * does not use https.
     */
    const warnIfPageIsSecure = function () {
        // Be very careful accessing browser globals. Who knows what may or may not exist.
        if (typeof window !== 'undefined' &&
            window.location &&
            window.location.protocol &&
            window.location.protocol.indexOf('https:') !== -1) {
            warn('Insecure Firebase access from a secure page. ' +
                'Please use https in calls to new Firebase().');
        }
    };
    /**
     * Returns true if data is NaN, or +/- Infinity.
     */
    const isInvalidJSONNumber = function (data) {
        return (typeof data === 'number' &&
            (data !== data || // NaN
                data === Number.POSITIVE_INFINITY ||
                data === Number.NEGATIVE_INFINITY));
    };
    const executeWhenDOMReady = function (fn) {
        if (document.readyState === 'complete') {
            fn();
        }
        else {
            // Modeled after jQuery. Try DOMContentLoaded and onreadystatechange (which
            // fire before onload), but fall back to onload.
            let called = false;
            const wrappedFn = function () {
                if (!document.body) {
                    setTimeout(wrappedFn, Math.floor(10));
                    return;
                }
                if (!called) {
                    called = true;
                    fn();
                }
            };
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', wrappedFn, false);
                // fallback to onload.
                window.addEventListener('load', wrappedFn, false);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            else if (document.attachEvent) {
                // IE.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                document.attachEvent('onreadystatechange', () => {
                    if (document.readyState === 'complete') {
                        wrappedFn();
                    }
                });
                // fallback to onload.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                window.attachEvent('onload', wrappedFn);
                // jQuery has an extra hack for IE that we could employ (based on
                // http://javascript.nwbox.com/IEContentLoaded/) But it looks really old.
                // I'm hoping we don't need it.
            }
        }
    };
    /**
     * Minimum key name. Invalid for actual data, used as a marker to sort before any valid names
     */
    const MIN_NAME = '[MIN_NAME]';
    /**
     * Maximum key name. Invalid for actual data, used as a marker to sort above any valid names
     */
    const MAX_NAME = '[MAX_NAME]';
    /**
     * Compares valid Firebase key names, plus min and max name
     */
    const nameCompare = function (a, b) {
        if (a === b) {
            return 0;
        }
        else if (a === MIN_NAME || b === MAX_NAME) {
            return -1;
        }
        else if (b === MIN_NAME || a === MAX_NAME) {
            return 1;
        }
        else {
            const aAsInt = tryParseInt(a), bAsInt = tryParseInt(b);
            if (aAsInt !== null) {
                if (bAsInt !== null) {
                    return aAsInt - bAsInt === 0 ? a.length - b.length : aAsInt - bAsInt;
                }
                else {
                    return -1;
                }
            }
            else if (bAsInt !== null) {
                return 1;
            }
            else {
                return a < b ? -1 : 1;
            }
        }
    };
    /**
     * @returns {!number} comparison result.
     */
    const stringCompare = function (a, b) {
        if (a === b) {
            return 0;
        }
        else if (a < b) {
            return -1;
        }
        else {
            return 1;
        }
    };
    const requireKey = function (key, obj) {
        if (obj && key in obj) {
            return obj[key];
        }
        else {
            throw new Error('Missing required key (' + key + ') in object: ' + stringify(obj));
        }
    };
    const ObjectToUniqueKey = function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            return stringify(obj);
        }
        const keys = [];
        // eslint-disable-next-line guard-for-in
        for (const k in obj) {
            keys.push(k);
        }
        // Export as json, but with the keys sorted.
        keys.sort();
        let key = '{';
        for (let i = 0; i < keys.length; i++) {
            if (i !== 0) {
                key += ',';
            }
            key += stringify(keys[i]);
            key += ':';
            key += ObjectToUniqueKey(obj[keys[i]]);
        }
        key += '}';
        return key;
    };
    /**
     * Splits a string into a number of smaller segments of maximum size
     * @param str - The string
     * @param segsize - The maximum number of chars in the string.
     * @returns The string, split into appropriately-sized chunks
     */
    const splitStringBySize = function (str, segsize) {
        const len = str.length;
        if (len <= segsize) {
            return [str];
        }
        const dataSegs = [];
        for (let c = 0; c < len; c += segsize) {
            if (c + segsize > len) {
                dataSegs.push(str.substring(c, len));
            }
            else {
                dataSegs.push(str.substring(c, c + segsize));
            }
        }
        return dataSegs;
    };
    /**
     * Apply a function to each (key, value) pair in an object or
     * apply a function to each (index, value) pair in an array
     * @param obj - The object or array to iterate over
     * @param fn - The function to apply
     */
    function each(obj, fn) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                fn(key, obj[key]);
            }
        }
    }
    /**
     * Borrowed from http://hg.secondlife.com/llsd/src/tip/js/typedarray.js (MIT License)
     * I made one modification at the end and removed the NaN / Infinity
     * handling (since it seemed broken [caused an overflow] and we don't need it).  See MJL comments.
     * @param v - A double
     *
     */
    const doubleToIEEE754String = function (v) {
        assert(!isInvalidJSONNumber(v), 'Invalid JSON number'); // MJL
        const ebits = 11, fbits = 52;
        const bias = (1 << (ebits - 1)) - 1;
        let s, e, f, ln, i;
        // Compute sign, exponent, fraction
        // Skip NaN / Infinity handling --MJL.
        if (v === 0) {
            e = 0;
            f = 0;
            s = 1 / v === -Infinity ? 1 : 0;
        }
        else {
            s = v < 0;
            v = Math.abs(v);
            if (v >= Math.pow(2, 1 - bias)) {
                // Normalized
                ln = Math.min(Math.floor(Math.log(v) / Math.LN2), bias);
                e = ln + bias;
                f = Math.round(v * Math.pow(2, fbits - ln) - Math.pow(2, fbits));
            }
            else {
                // Denormalized
                e = 0;
                f = Math.round(v / Math.pow(2, 1 - bias - fbits));
            }
        }
        // Pack sign, exponent, fraction
        const bits = [];
        for (i = fbits; i; i -= 1) {
            bits.push(f % 2 ? 1 : 0);
            f = Math.floor(f / 2);
        }
        for (i = ebits; i; i -= 1) {
            bits.push(e % 2 ? 1 : 0);
            e = Math.floor(e / 2);
        }
        bits.push(s ? 1 : 0);
        bits.reverse();
        const str = bits.join('');
        // Return the data as a hex string. --MJL
        let hexByteString = '';
        for (i = 0; i < 64; i += 8) {
            let hexByte = parseInt(str.substr(i, 8), 2).toString(16);
            if (hexByte.length === 1) {
                hexByte = '0' + hexByte;
            }
            hexByteString = hexByteString + hexByte;
        }
        return hexByteString.toLowerCase();
    };
    /**
     * Used to detect if we're in a Chrome content script (which executes in an
     * isolated environment where long-polling doesn't work).
     */
    const isChromeExtensionContentScript = function () {
        return !!(typeof window === 'object' &&
            window['chrome'] &&
            window['chrome']['extension'] &&
            !/^chrome/.test(window.location.href));
    };
    /**
     * Used to detect if we're in a Windows 8 Store app.
     */
    const isWindowsStoreApp = function () {
        // Check for the presence of a couple WinRT globals
        return typeof Windows === 'object' && typeof Windows.UI === 'object';
    };
    /**
     * Used to test for integer-looking strings
     */
    const INTEGER_REGEXP_ = new RegExp('^-?(0*)\\d{1,10}$');
    /**
     * For use in keys, the minimum possible 32-bit integer.
     */
    const INTEGER_32_MIN = -2147483648;
    /**
     * For use in kyes, the maximum possible 32-bit integer.
     */
    const INTEGER_32_MAX = 2147483647;
    /**
     * If the string contains a 32-bit integer, return it.  Else return null.
     */
    const tryParseInt = function (str) {
        if (INTEGER_REGEXP_.test(str)) {
            const intVal = Number(str);
            if (intVal >= INTEGER_32_MIN && intVal <= INTEGER_32_MAX) {
                return intVal;
            }
        }
        return null;
    };
    /**
     * Helper to run some code but catch any exceptions and re-throw them later.
     * Useful for preventing user callbacks from breaking internal code.
     *
     * Re-throwing the exception from a setTimeout is a little evil, but it's very
     * convenient (we don't have to try to figure out when is a safe point to
     * re-throw it), and the behavior seems reasonable:
     *
     * * If you aren't pausing on exceptions, you get an error in the console with
     *   the correct stack trace.
     * * If you're pausing on all exceptions, the debugger will pause on your
     *   exception and then again when we rethrow it.
     * * If you're only pausing on uncaught exceptions, the debugger will only pause
     *   on us re-throwing it.
     *
     * @param fn - The code to guard.
     */
    const exceptionGuard = function (fn) {
        try {
            fn();
        }
        catch (e) {
            // Re-throw exception when it's safe.
            setTimeout(() => {
                // It used to be that "throw e" would result in a good console error with
                // relevant context, but as of Chrome 39, you just get the firebase.js
                // file/line number where we re-throw it, which is useless. So we log
                // e.stack explicitly.
                const stack = e.stack || '';
                warn('Exception was thrown by user callback.', stack);
                throw e;
            }, Math.floor(0));
        }
    };
    /**
     * @returns {boolean} true if we think we're currently being crawled.
     */
    const beingCrawled = function () {
        const userAgent = (typeof window === 'object' &&
            window['navigator'] &&
            window['navigator']['userAgent']) ||
            '';
        // For now we whitelist the most popular crawlers.  We should refine this to be the set of crawlers we
        // believe to support JavaScript/AJAX rendering.
        // NOTE: Google Webmaster Tools doesn't really belong, but their "This is how a visitor to your website
        // would have seen the page" is flaky if we don't treat it as a crawler.
        return (userAgent.search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) >= 0);
    };
    /**
     * Same as setTimeout() except on Node.JS it will /not/ prevent the process from exiting.
     *
     * It is removed with clearTimeout() as normal.
     *
     * @param fn - Function to run.
     * @param time - Milliseconds to wait before running.
     * @returns The setTimeout() return value.
     */
    const setTimeoutNonBlocking = function (fn, time) {
        const timeout = setTimeout(fn, time);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof timeout === 'object' && timeout['unref']) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timeout['unref']();
        }
        return timeout;
    };

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Abstraction around AppCheck's token fetching capabilities.
     */
    class AppCheckTokenProvider {
        constructor(appName_, appCheckProvider) {
            this.appName_ = appName_;
            this.appCheckProvider = appCheckProvider;
            this.appCheck = appCheckProvider === null || appCheckProvider === void 0 ? void 0 : appCheckProvider.getImmediate({ optional: true });
            if (!this.appCheck) {
                appCheckProvider === null || appCheckProvider === void 0 ? void 0 : appCheckProvider.get().then(appCheck => (this.appCheck = appCheck));
            }
        }
        getToken(forceRefresh) {
            if (!this.appCheck) {
                return new Promise((resolve, reject) => {
                    // Support delayed initialization of FirebaseAppCheck. This allows our
                    // customers to initialize the RTDB SDK before initializing Firebase
                    // AppCheck and ensures that all requests are authenticated if a token
                    // becomes available before the timoeout below expires.
                    setTimeout(() => {
                        if (this.appCheck) {
                            this.getToken(forceRefresh).then(resolve, reject);
                        }
                        else {
                            resolve(null);
                        }
                    }, 0);
                });
            }
            return this.appCheck.getToken(forceRefresh);
        }
        addTokenChangeListener(listener) {
            var _a;
            (_a = this.appCheckProvider) === null || _a === void 0 ? void 0 : _a.get().then(appCheck => appCheck.addTokenListener(listener));
        }
        notifyForInvalidToken() {
            warn(`Provided AppCheck credentials for the app named "${this.appName_}" ` +
                'are invalid. This usually indicates your app was not initialized correctly.');
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Abstraction around FirebaseApp's token fetching capabilities.
     */
    class FirebaseAuthTokenProvider {
        constructor(appName_, firebaseOptions_, authProvider_) {
            this.appName_ = appName_;
            this.firebaseOptions_ = firebaseOptions_;
            this.authProvider_ = authProvider_;
            this.auth_ = null;
            this.auth_ = authProvider_.getImmediate({ optional: true });
            if (!this.auth_) {
                authProvider_.onInit(auth => (this.auth_ = auth));
            }
        }
        getToken(forceRefresh) {
            if (!this.auth_) {
                return new Promise((resolve, reject) => {
                    // Support delayed initialization of FirebaseAuth. This allows our
                    // customers to initialize the RTDB SDK before initializing Firebase
                    // Auth and ensures that all requests are authenticated if a token
                    // becomes available before the timoeout below expires.
                    setTimeout(() => {
                        if (this.auth_) {
                            this.getToken(forceRefresh).then(resolve, reject);
                        }
                        else {
                            resolve(null);
                        }
                    }, 0);
                });
            }
            return this.auth_.getToken(forceRefresh).catch(error => {
                // TODO: Need to figure out all the cases this is raised and whether
                // this makes sense.
                if (error && error.code === 'auth/token-not-initialized') {
                    log('Got auth/token-not-initialized error.  Treating as null token.');
                    return null;
                }
                else {
                    return Promise.reject(error);
                }
            });
        }
        addTokenChangeListener(listener) {
            // TODO: We might want to wrap the listener and call it with no args to
            // avoid a leaky abstraction, but that makes removing the listener harder.
            if (this.auth_) {
                this.auth_.addAuthTokenListener(listener);
            }
            else {
                this.authProvider_
                    .get()
                    .then(auth => auth.addAuthTokenListener(listener));
            }
        }
        removeTokenChangeListener(listener) {
            this.authProvider_
                .get()
                .then(auth => auth.removeAuthTokenListener(listener));
        }
        notifyForInvalidToken() {
            let errorMessage = 'Provided authentication credentials for the app named "' +
                this.appName_ +
                '" are invalid. This usually indicates your app was not ' +
                'initialized correctly. ';
            if ('credential' in this.firebaseOptions_) {
                errorMessage +=
                    'Make sure the "credential" property provided to initializeApp() ' +
                        'is authorized to access the specified "databaseURL" and is from the correct ' +
                        'project.';
            }
            else if ('serviceAccount' in this.firebaseOptions_) {
                errorMessage +=
                    'Make sure the "serviceAccount" property provided to initializeApp() ' +
                        'is authorized to access the specified "databaseURL" and is from the correct ' +
                        'project.';
            }
            else {
                errorMessage +=
                    'Make sure the "apiKey" and "databaseURL" properties provided to ' +
                        'initializeApp() match the values provided for your app at ' +
                        'https://console.firebase.google.com/.';
            }
            warn(errorMessage);
        }
    }
    /* AuthTokenProvider that supplies a constant token. Used by Admin SDK or mockUserToken with emulators. */
    class EmulatorTokenProvider {
        constructor(accessToken) {
            this.accessToken = accessToken;
        }
        getToken(forceRefresh) {
            return Promise.resolve({
                accessToken: this.accessToken
            });
        }
        addTokenChangeListener(listener) {
            // Invoke the listener immediately to match the behavior in Firebase Auth
            // (see packages/auth/src/auth.js#L1807)
            listener(this.accessToken);
        }
        removeTokenChangeListener(listener) { }
        notifyForInvalidToken() { }
    }
    /** A string that is treated as an admin access token by the RTDB emulator. Used by Admin SDK. */
    EmulatorTokenProvider.OWNER = 'owner';

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const PROTOCOL_VERSION = '5';
    const VERSION_PARAM = 'v';
    const TRANSPORT_SESSION_PARAM = 's';
    const REFERER_PARAM = 'r';
    const FORGE_REF = 'f';
    // Matches console.firebase.google.com, firebase-console-*.corp.google.com and
    // firebase.corp.google.com
    const FORGE_DOMAIN_RE = /(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/;
    const LAST_SESSION_PARAM = 'ls';
    const APPLICATION_ID_PARAM = 'p';
    const APP_CHECK_TOKEN_PARAM = 'ac';
    const WEBSOCKET = 'websocket';
    const LONG_POLLING = 'long_polling';

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * A class that holds metadata about a Repo object
     */
    class RepoInfo {
        /**
         * @param host - Hostname portion of the url for the repo
         * @param secure - Whether or not this repo is accessed over ssl
         * @param namespace - The namespace represented by the repo
         * @param webSocketOnly - Whether to prefer websockets over all other transports (used by Nest).
         * @param nodeAdmin - Whether this instance uses Admin SDK credentials
         * @param persistenceKey - Override the default session persistence storage key
         */
        constructor(host, secure, namespace, webSocketOnly, nodeAdmin = false, persistenceKey = '', includeNamespaceInQueryParams = false) {
            this.secure = secure;
            this.namespace = namespace;
            this.webSocketOnly = webSocketOnly;
            this.nodeAdmin = nodeAdmin;
            this.persistenceKey = persistenceKey;
            this.includeNamespaceInQueryParams = includeNamespaceInQueryParams;
            this._host = host.toLowerCase();
            this._domain = this._host.substr(this._host.indexOf('.') + 1);
            this.internalHost =
                PersistentStorage.get('host:' + host) || this._host;
        }
        isCacheableHost() {
            return this.internalHost.substr(0, 2) === 's-';
        }
        isCustomHost() {
            return (this._domain !== 'firebaseio.com' &&
                this._domain !== 'firebaseio-demo.com');
        }
        get host() {
            return this._host;
        }
        set host(newHost) {
            if (newHost !== this.internalHost) {
                this.internalHost = newHost;
                if (this.isCacheableHost()) {
                    PersistentStorage.set('host:' + this._host, this.internalHost);
                }
            }
        }
        toString() {
            let str = this.toURLString();
            if (this.persistenceKey) {
                str += '<' + this.persistenceKey + '>';
            }
            return str;
        }
        toURLString() {
            const protocol = this.secure ? 'https://' : 'http://';
            const query = this.includeNamespaceInQueryParams
                ? `?ns=${this.namespace}`
                : '';
            return `${protocol}${this.host}/${query}`;
        }
    }
    function repoInfoNeedsQueryParam(repoInfo) {
        return (repoInfo.host !== repoInfo.internalHost ||
            repoInfo.isCustomHost() ||
            repoInfo.includeNamespaceInQueryParams);
    }
    /**
     * Returns the websocket URL for this repo
     * @param repoInfo - RepoInfo object
     * @param type - of connection
     * @param params - list
     * @returns The URL for this repo
     */
    function repoInfoConnectionURL(repoInfo, type, params) {
        assert(typeof type === 'string', 'typeof type must == string');
        assert(typeof params === 'object', 'typeof params must == object');
        let connURL;
        if (type === WEBSOCKET) {
            connURL =
                (repoInfo.secure ? 'wss://' : 'ws://') + repoInfo.internalHost + '/.ws?';
        }
        else if (type === LONG_POLLING) {
            connURL =
                (repoInfo.secure ? 'https://' : 'http://') +
                    repoInfo.internalHost +
                    '/.lp?';
        }
        else {
            throw new Error('Unknown connection type: ' + type);
        }
        if (repoInfoNeedsQueryParam(repoInfo)) {
            params['ns'] = repoInfo.namespace;
        }
        const pairs = [];
        each(params, (key, value) => {
            pairs.push(key + '=' + value);
        });
        return connURL + pairs.join('&');
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Tracks a collection of stats.
     */
    class StatsCollection {
        constructor() {
            this.counters_ = {};
        }
        incrementCounter(name, amount = 1) {
            if (!contains(this.counters_, name)) {
                this.counters_[name] = 0;
            }
            this.counters_[name] += amount;
        }
        get() {
            return deepCopy(this.counters_);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const collections = {};
    const reporters = {};
    function statsManagerGetCollection(repoInfo) {
        const hashString = repoInfo.toString();
        if (!collections[hashString]) {
            collections[hashString] = new StatsCollection();
        }
        return collections[hashString];
    }
    function statsManagerGetOrCreateReporter(repoInfo, creatorFunction) {
        const hashString = repoInfo.toString();
        if (!reporters[hashString]) {
            reporters[hashString] = creatorFunction();
        }
        return reporters[hashString];
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * This class ensures the packets from the server arrive in order
     * This class takes data from the server and ensures it gets passed into the callbacks in order.
     */
    class PacketReceiver {
        /**
         * @param onMessage_
         */
        constructor(onMessage_) {
            this.onMessage_ = onMessage_;
            this.pendingResponses = [];
            this.currentResponseNum = 0;
            this.closeAfterResponse = -1;
            this.onClose = null;
        }
        closeAfter(responseNum, callback) {
            this.closeAfterResponse = responseNum;
            this.onClose = callback;
            if (this.closeAfterResponse < this.currentResponseNum) {
                this.onClose();
                this.onClose = null;
            }
        }
        /**
         * Each message from the server comes with a response number, and an array of data. The responseNumber
         * allows us to ensure that we process them in the right order, since we can't be guaranteed that all
         * browsers will respond in the same order as the requests we sent
         */
        handleResponse(requestNum, data) {
            this.pendingResponses[requestNum] = data;
            while (this.pendingResponses[this.currentResponseNum]) {
                const toProcess = this.pendingResponses[this.currentResponseNum];
                delete this.pendingResponses[this.currentResponseNum];
                for (let i = 0; i < toProcess.length; ++i) {
                    if (toProcess[i]) {
                        exceptionGuard(() => {
                            this.onMessage_(toProcess[i]);
                        });
                    }
                }
                if (this.currentResponseNum === this.closeAfterResponse) {
                    if (this.onClose) {
                        this.onClose();
                        this.onClose = null;
                    }
                    break;
                }
                this.currentResponseNum++;
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // URL query parameters associated with longpolling
    const FIREBASE_LONGPOLL_START_PARAM = 'start';
    const FIREBASE_LONGPOLL_CLOSE_COMMAND = 'close';
    const FIREBASE_LONGPOLL_COMMAND_CB_NAME = 'pLPCommand';
    const FIREBASE_LONGPOLL_DATA_CB_NAME = 'pRTLPCB';
    const FIREBASE_LONGPOLL_ID_PARAM = 'id';
    const FIREBASE_LONGPOLL_PW_PARAM = 'pw';
    const FIREBASE_LONGPOLL_SERIAL_PARAM = 'ser';
    const FIREBASE_LONGPOLL_CALLBACK_ID_PARAM = 'cb';
    const FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM = 'seg';
    const FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET = 'ts';
    const FIREBASE_LONGPOLL_DATA_PARAM = 'd';
    const FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM = 'dframe';
    //Data size constants.
    //TODO: Perf: the maximum length actually differs from browser to browser.
    // We should check what browser we're on and set accordingly.
    const MAX_URL_DATA_SIZE = 1870;
    const SEG_HEADER_SIZE = 30; //ie: &seg=8299234&ts=982389123&d=
    const MAX_PAYLOAD_SIZE = MAX_URL_DATA_SIZE - SEG_HEADER_SIZE;
    /**
     * Keepalive period
     * send a fresh request at minimum every 25 seconds. Opera has a maximum request
     * length of 30 seconds that we can't exceed.
     */
    const KEEPALIVE_REQUEST_INTERVAL = 25000;
    /**
     * How long to wait before aborting a long-polling connection attempt.
     */
    const LP_CONNECT_TIMEOUT = 30000;
    /**
     * This class manages a single long-polling connection.
     */
    class BrowserPollConnection {
        /**
         * @param connId An identifier for this connection, used for logging
         * @param repoInfo The info for the endpoint to send data to.
         * @param applicationId The Firebase App ID for this project.
         * @param appCheckToken The AppCheck token for this client.
         * @param authToken The AuthToken to use for this connection.
         * @param transportSessionId Optional transportSessionid if we are
         * reconnecting for an existing transport session
         * @param lastSessionId Optional lastSessionId if the PersistentConnection has
         * already created a connection previously
         */
        constructor(connId, repoInfo, applicationId, appCheckToken, authToken, transportSessionId, lastSessionId) {
            this.connId = connId;
            this.repoInfo = repoInfo;
            this.applicationId = applicationId;
            this.appCheckToken = appCheckToken;
            this.authToken = authToken;
            this.transportSessionId = transportSessionId;
            this.lastSessionId = lastSessionId;
            this.bytesSent = 0;
            this.bytesReceived = 0;
            this.everConnected_ = false;
            this.log_ = logWrapper(connId);
            this.stats_ = statsManagerGetCollection(repoInfo);
            this.urlFn = (params) => {
                // Always add the token if we have one.
                if (this.appCheckToken) {
                    params[APP_CHECK_TOKEN_PARAM] = this.appCheckToken;
                }
                return repoInfoConnectionURL(repoInfo, LONG_POLLING, params);
            };
        }
        /**
         * @param onMessage - Callback when messages arrive
         * @param onDisconnect - Callback with connection lost.
         */
        open(onMessage, onDisconnect) {
            this.curSegmentNum = 0;
            this.onDisconnect_ = onDisconnect;
            this.myPacketOrderer = new PacketReceiver(onMessage);
            this.isClosed_ = false;
            this.connectTimeoutTimer_ = setTimeout(() => {
                this.log_('Timed out trying to connect.');
                // Make sure we clear the host cache
                this.onClosed_();
                this.connectTimeoutTimer_ = null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }, Math.floor(LP_CONNECT_TIMEOUT));
            // Ensure we delay the creation of the iframe until the DOM is loaded.
            executeWhenDOMReady(() => {
                if (this.isClosed_) {
                    return;
                }
                //Set up a callback that gets triggered once a connection is set up.
                this.scriptTagHolder = new FirebaseIFrameScriptHolder((...args) => {
                    const [command, arg1, arg2, arg3, arg4] = args;
                    this.incrementIncomingBytes_(args);
                    if (!this.scriptTagHolder) {
                        return; // we closed the connection.
                    }
                    if (this.connectTimeoutTimer_) {
                        clearTimeout(this.connectTimeoutTimer_);
                        this.connectTimeoutTimer_ = null;
                    }
                    this.everConnected_ = true;
                    if (command === FIREBASE_LONGPOLL_START_PARAM) {
                        this.id = arg1;
                        this.password = arg2;
                    }
                    else if (command === FIREBASE_LONGPOLL_CLOSE_COMMAND) {
                        // Don't clear the host cache. We got a response from the server, so we know it's reachable
                        if (arg1) {
                            // We aren't expecting any more data (other than what the server's already in the process of sending us
                            // through our already open polls), so don't send any more.
                            this.scriptTagHolder.sendNewPolls = false;
                            // arg1 in this case is the last response number sent by the server. We should try to receive
                            // all of the responses up to this one before closing
                            this.myPacketOrderer.closeAfter(arg1, () => {
                                this.onClosed_();
                            });
                        }
                        else {
                            this.onClosed_();
                        }
                    }
                    else {
                        throw new Error('Unrecognized command received: ' + command);
                    }
                }, (...args) => {
                    const [pN, data] = args;
                    this.incrementIncomingBytes_(args);
                    this.myPacketOrderer.handleResponse(pN, data);
                }, () => {
                    this.onClosed_();
                }, this.urlFn);
                //Send the initial request to connect. The serial number is simply to keep the browser from pulling previous results
                //from cache.
                const urlParams = {};
                urlParams[FIREBASE_LONGPOLL_START_PARAM] = 't';
                urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = Math.floor(Math.random() * 100000000);
                if (this.scriptTagHolder.uniqueCallbackIdentifier) {
                    urlParams[FIREBASE_LONGPOLL_CALLBACK_ID_PARAM] =
                        this.scriptTagHolder.uniqueCallbackIdentifier;
                }
                urlParams[VERSION_PARAM] = PROTOCOL_VERSION;
                if (this.transportSessionId) {
                    urlParams[TRANSPORT_SESSION_PARAM] = this.transportSessionId;
                }
                if (this.lastSessionId) {
                    urlParams[LAST_SESSION_PARAM] = this.lastSessionId;
                }
                if (this.applicationId) {
                    urlParams[APPLICATION_ID_PARAM] = this.applicationId;
                }
                if (this.appCheckToken) {
                    urlParams[APP_CHECK_TOKEN_PARAM] = this.appCheckToken;
                }
                if (typeof location !== 'undefined' &&
                    location.hostname &&
                    FORGE_DOMAIN_RE.test(location.hostname)) {
                    urlParams[REFERER_PARAM] = FORGE_REF;
                }
                const connectURL = this.urlFn(urlParams);
                this.log_('Connecting via long-poll to ' + connectURL);
                this.scriptTagHolder.addTag(connectURL, () => {
                    /* do nothing */
                });
            });
        }
        /**
         * Call this when a handshake has completed successfully and we want to consider the connection established
         */
        start() {
            this.scriptTagHolder.startLongPoll(this.id, this.password);
            this.addDisconnectPingFrame(this.id, this.password);
        }
        /**
         * Forces long polling to be considered as a potential transport
         */
        static forceAllow() {
            BrowserPollConnection.forceAllow_ = true;
        }
        /**
         * Forces longpolling to not be considered as a potential transport
         */
        static forceDisallow() {
            BrowserPollConnection.forceDisallow_ = true;
        }
        // Static method, use string literal so it can be accessed in a generic way
        static isAvailable() {
            if (BrowserPollConnection.forceAllow_) {
                return true;
            }
            else {
                // NOTE: In React-Native there's normally no 'document', but if you debug a React-Native app in
                // the Chrome debugger, 'document' is defined, but document.createElement is null (2015/06/08).
                return (!BrowserPollConnection.forceDisallow_ &&
                    typeof document !== 'undefined' &&
                    document.createElement != null &&
                    !isChromeExtensionContentScript() &&
                    !isWindowsStoreApp());
            }
        }
        /**
         * No-op for polling
         */
        markConnectionHealthy() { }
        /**
         * Stops polling and cleans up the iframe
         */
        shutdown_() {
            this.isClosed_ = true;
            if (this.scriptTagHolder) {
                this.scriptTagHolder.close();
                this.scriptTagHolder = null;
            }
            //remove the disconnect frame, which will trigger an XHR call to the server to tell it we're leaving.
            if (this.myDisconnFrame) {
                document.body.removeChild(this.myDisconnFrame);
                this.myDisconnFrame = null;
            }
            if (this.connectTimeoutTimer_) {
                clearTimeout(this.connectTimeoutTimer_);
                this.connectTimeoutTimer_ = null;
            }
        }
        /**
         * Triggered when this transport is closed
         */
        onClosed_() {
            if (!this.isClosed_) {
                this.log_('Longpoll is closing itself');
                this.shutdown_();
                if (this.onDisconnect_) {
                    this.onDisconnect_(this.everConnected_);
                    this.onDisconnect_ = null;
                }
            }
        }
        /**
         * External-facing close handler. RealTime has requested we shut down. Kill our connection and tell the server
         * that we've left.
         */
        close() {
            if (!this.isClosed_) {
                this.log_('Longpoll is being closed.');
                this.shutdown_();
            }
        }
        /**
         * Send the JSON object down to the server. It will need to be stringified, base64 encoded, and then
         * broken into chunks (since URLs have a small maximum length).
         * @param data - The JSON data to transmit.
         */
        send(data) {
            const dataStr = stringify(data);
            this.bytesSent += dataStr.length;
            this.stats_.incrementCounter('bytes_sent', dataStr.length);
            //first, lets get the base64-encoded data
            const base64data = base64Encode(dataStr);
            //We can only fit a certain amount in each URL, so we need to split this request
            //up into multiple pieces if it doesn't fit in one request.
            const dataSegs = splitStringBySize(base64data, MAX_PAYLOAD_SIZE);
            //Enqueue each segment for transmission. We assign each chunk a sequential ID and a total number
            //of segments so that we can reassemble the packet on the server.
            for (let i = 0; i < dataSegs.length; i++) {
                this.scriptTagHolder.enqueueSegment(this.curSegmentNum, dataSegs.length, dataSegs[i]);
                this.curSegmentNum++;
            }
        }
        /**
         * This is how we notify the server that we're leaving.
         * We aren't able to send requests with DHTML on a window close event, but we can
         * trigger XHR requests in some browsers (everything but Opera basically).
         */
        addDisconnectPingFrame(id, pw) {
            this.myDisconnFrame = document.createElement('iframe');
            const urlParams = {};
            urlParams[FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM] = 't';
            urlParams[FIREBASE_LONGPOLL_ID_PARAM] = id;
            urlParams[FIREBASE_LONGPOLL_PW_PARAM] = pw;
            this.myDisconnFrame.src = this.urlFn(urlParams);
            this.myDisconnFrame.style.display = 'none';
            document.body.appendChild(this.myDisconnFrame);
        }
        /**
         * Used to track the bytes received by this client
         */
        incrementIncomingBytes_(args) {
            // TODO: This is an annoying perf hit just to track the number of incoming bytes.  Maybe it should be opt-in.
            const bytesReceived = stringify(args).length;
            this.bytesReceived += bytesReceived;
            this.stats_.incrementCounter('bytes_received', bytesReceived);
        }
    }
    /*********************************************************************************************
     * A wrapper around an iframe that is used as a long-polling script holder.
     *********************************************************************************************/
    class FirebaseIFrameScriptHolder {
        /**
         * @param commandCB - The callback to be called when control commands are recevied from the server.
         * @param onMessageCB - The callback to be triggered when responses arrive from the server.
         * @param onDisconnect - The callback to be triggered when this tag holder is closed
         * @param urlFn - A function that provides the URL of the endpoint to send data to.
         */
        constructor(commandCB, onMessageCB, onDisconnect, urlFn) {
            this.onDisconnect = onDisconnect;
            this.urlFn = urlFn;
            //We maintain a count of all of the outstanding requests, because if we have too many active at once it can cause
            //problems in some browsers.
            this.outstandingRequests = new Set();
            //A queue of the pending segments waiting for transmission to the server.
            this.pendingSegs = [];
            //A serial number. We use this for two things:
            // 1) A way to ensure the browser doesn't cache responses to polls
            // 2) A way to make the server aware when long-polls arrive in a different order than we started them. The
            //    server needs to release both polls in this case or it will cause problems in Opera since Opera can only execute
            //    JSONP code in the order it was added to the iframe.
            this.currentSerial = Math.floor(Math.random() * 100000000);
            // This gets set to false when we're "closing down" the connection (e.g. we're switching transports but there's still
            // incoming data from the server that we're waiting for).
            this.sendNewPolls = true;
            {
                //Each script holder registers a couple of uniquely named callbacks with the window. These are called from the
                //iframes where we put the long-polling script tags. We have two callbacks:
                //   1) Command Callback - Triggered for control issues, like starting a connection.
                //   2) Message Callback - Triggered when new data arrives.
                this.uniqueCallbackIdentifier = LUIDGenerator();
                window[FIREBASE_LONGPOLL_COMMAND_CB_NAME + this.uniqueCallbackIdentifier] = commandCB;
                window[FIREBASE_LONGPOLL_DATA_CB_NAME + this.uniqueCallbackIdentifier] =
                    onMessageCB;
                //Create an iframe for us to add script tags to.
                this.myIFrame = FirebaseIFrameScriptHolder.createIFrame_();
                // Set the iframe's contents.
                let script = '';
                // if we set a javascript url, it's IE and we need to set the document domain. The javascript url is sufficient
                // for ie9, but ie8 needs to do it again in the document itself.
                if (this.myIFrame.src &&
                    this.myIFrame.src.substr(0, 'javascript:'.length) === 'javascript:') {
                    const currentDomain = document.domain;
                    script = '<script>document.domain="' + currentDomain + '";</script>';
                }
                const iframeContents = '<html><body>' + script + '</body></html>';
                try {
                    this.myIFrame.doc.open();
                    this.myIFrame.doc.write(iframeContents);
                    this.myIFrame.doc.close();
                }
                catch (e) {
                    log('frame writing exception');
                    if (e.stack) {
                        log(e.stack);
                    }
                    log(e);
                }
            }
        }
        /**
         * Each browser has its own funny way to handle iframes. Here we mush them all together into one object that I can
         * actually use.
         */
        static createIFrame_() {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            // This is necessary in order to initialize the document inside the iframe
            if (document.body) {
                document.body.appendChild(iframe);
                try {
                    // If document.domain has been modified in IE, this will throw an error, and we need to set the
                    // domain of the iframe's document manually. We can do this via a javascript: url as the src attribute
                    // Also note that we must do this *after* the iframe has been appended to the page. Otherwise it doesn't work.
                    const a = iframe.contentWindow.document;
                    if (!a) {
                        // Apologies for the log-spam, I need to do something to keep closure from optimizing out the assignment above.
                        log('No IE domain setting required');
                    }
                }
                catch (e) {
                    const domain = document.domain;
                    iframe.src =
                        "javascript:void((function(){document.open();document.domain='" +
                            domain +
                            "';document.close();})())";
                }
            }
            else {
                // LongPollConnection attempts to delay initialization until the document is ready, so hopefully this
                // never gets hit.
                throw 'Document body has not initialized. Wait to initialize Firebase until after the document is ready.';
            }
            // Get the document of the iframe in a browser-specific way.
            if (iframe.contentDocument) {
                iframe.doc = iframe.contentDocument; // Firefox, Opera, Safari
            }
            else if (iframe.contentWindow) {
                iframe.doc = iframe.contentWindow.document; // Internet Explorer
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            else if (iframe.document) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                iframe.doc = iframe.document; //others?
            }
            return iframe;
        }
        /**
         * Cancel all outstanding queries and remove the frame.
         */
        close() {
            //Mark this iframe as dead, so no new requests are sent.
            this.alive = false;
            if (this.myIFrame) {
                //We have to actually remove all of the html inside this iframe before removing it from the
                //window, or IE will continue loading and executing the script tags we've already added, which
                //can lead to some errors being thrown. Setting innerHTML seems to be the easiest way to do this.
                this.myIFrame.doc.body.innerHTML = '';
                setTimeout(() => {
                    if (this.myIFrame !== null) {
                        document.body.removeChild(this.myIFrame);
                        this.myIFrame = null;
                    }
                }, Math.floor(0));
            }
            // Protect from being called recursively.
            const onDisconnect = this.onDisconnect;
            if (onDisconnect) {
                this.onDisconnect = null;
                onDisconnect();
            }
        }
        /**
         * Actually start the long-polling session by adding the first script tag(s) to the iframe.
         * @param id - The ID of this connection
         * @param pw - The password for this connection
         */
        startLongPoll(id, pw) {
            this.myID = id;
            this.myPW = pw;
            this.alive = true;
            //send the initial request. If there are requests queued, make sure that we transmit as many as we are currently able to.
            while (this.newRequest_()) { }
        }
        /**
         * This is called any time someone might want a script tag to be added. It adds a script tag when there aren't
         * too many outstanding requests and we are still alive.
         *
         * If there are outstanding packet segments to send, it sends one. If there aren't, it sends a long-poll anyways if
         * needed.
         */
        newRequest_() {
            // We keep one outstanding request open all the time to receive data, but if we need to send data
            // (pendingSegs.length > 0) then we create a new request to send the data.  The server will automatically
            // close the old request.
            if (this.alive &&
                this.sendNewPolls &&
                this.outstandingRequests.size < (this.pendingSegs.length > 0 ? 2 : 1)) {
                //construct our url
                this.currentSerial++;
                const urlParams = {};
                urlParams[FIREBASE_LONGPOLL_ID_PARAM] = this.myID;
                urlParams[FIREBASE_LONGPOLL_PW_PARAM] = this.myPW;
                urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = this.currentSerial;
                let theURL = this.urlFn(urlParams);
                //Now add as much data as we can.
                let curDataString = '';
                let i = 0;
                while (this.pendingSegs.length > 0) {
                    //first, lets see if the next segment will fit.
                    const nextSeg = this.pendingSegs[0];
                    if (nextSeg.d.length +
                        SEG_HEADER_SIZE +
                        curDataString.length <=
                        MAX_URL_DATA_SIZE) {
                        //great, the segment will fit. Lets append it.
                        const theSeg = this.pendingSegs.shift();
                        curDataString =
                            curDataString +
                                '&' +
                                FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM +
                                i +
                                '=' +
                                theSeg.seg +
                                '&' +
                                FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET +
                                i +
                                '=' +
                                theSeg.ts +
                                '&' +
                                FIREBASE_LONGPOLL_DATA_PARAM +
                                i +
                                '=' +
                                theSeg.d;
                        i++;
                    }
                    else {
                        break;
                    }
                }
                theURL = theURL + curDataString;
                this.addLongPollTag_(theURL, this.currentSerial);
                return true;
            }
            else {
                return false;
            }
        }
        /**
         * Queue a packet for transmission to the server.
         * @param segnum - A sequential id for this packet segment used for reassembly
         * @param totalsegs - The total number of segments in this packet
         * @param data - The data for this segment.
         */
        enqueueSegment(segnum, totalsegs, data) {
            //add this to the queue of segments to send.
            this.pendingSegs.push({ seg: segnum, ts: totalsegs, d: data });
            //send the data immediately if there isn't already data being transmitted, unless
            //startLongPoll hasn't been called yet.
            if (this.alive) {
                this.newRequest_();
            }
        }
        /**
         * Add a script tag for a regular long-poll request.
         * @param url - The URL of the script tag.
         * @param serial - The serial number of the request.
         */
        addLongPollTag_(url, serial) {
            //remember that we sent this request.
            this.outstandingRequests.add(serial);
            const doNewRequest = () => {
                this.outstandingRequests.delete(serial);
                this.newRequest_();
            };
            // If this request doesn't return on its own accord (by the server sending us some data), we'll
            // create a new one after the KEEPALIVE interval to make sure we always keep a fresh request open.
            const keepaliveTimeout = setTimeout(doNewRequest, Math.floor(KEEPALIVE_REQUEST_INTERVAL));
            const readyStateCB = () => {
                // Request completed.  Cancel the keepalive.
                clearTimeout(keepaliveTimeout);
                // Trigger a new request so we can continue receiving data.
                doNewRequest();
            };
            this.addTag(url, readyStateCB);
        }
        /**
         * Add an arbitrary script tag to the iframe.
         * @param url - The URL for the script tag source.
         * @param loadCB - A callback to be triggered once the script has loaded.
         */
        addTag(url, loadCB) {
            {
                setTimeout(() => {
                    try {
                        // if we're already closed, don't add this poll
                        if (!this.sendNewPolls) {
                            return;
                        }
                        const newScript = this.myIFrame.doc.createElement('script');
                        newScript.type = 'text/javascript';
                        newScript.async = true;
                        newScript.src = url;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        newScript.onload = newScript.onreadystatechange =
                            function () {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const rstate = newScript.readyState;
                                if (!rstate || rstate === 'loaded' || rstate === 'complete') {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    newScript.onload = newScript.onreadystatechange = null;
                                    if (newScript.parentNode) {
                                        newScript.parentNode.removeChild(newScript);
                                    }
                                    loadCB();
                                }
                            };
                        newScript.onerror = () => {
                            log('Long-poll script failed to load: ' + url);
                            this.sendNewPolls = false;
                            this.close();
                        };
                        this.myIFrame.doc.body.appendChild(newScript);
                    }
                    catch (e) {
                        // TODO: we should make this error visible somehow
                    }
                }, Math.floor(1));
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const WEBSOCKET_MAX_FRAME_SIZE = 16384;
    const WEBSOCKET_KEEPALIVE_INTERVAL = 45000;
    let WebSocketImpl = null;
    if (typeof MozWebSocket !== 'undefined') {
        WebSocketImpl = MozWebSocket;
    }
    else if (typeof WebSocket !== 'undefined') {
        WebSocketImpl = WebSocket;
    }
    /**
     * Create a new websocket connection with the given callbacks.
     */
    class WebSocketConnection {
        /**
         * @param connId identifier for this transport
         * @param repoInfo The info for the websocket endpoint.
         * @param applicationId The Firebase App ID for this project.
         * @param appCheckToken The App Check Token for this client.
         * @param authToken The Auth Token for this client.
         * @param transportSessionId Optional transportSessionId if this is connecting
         * to an existing transport session
         * @param lastSessionId Optional lastSessionId if there was a previous
         * connection
         */
        constructor(connId, repoInfo, applicationId, appCheckToken, authToken, transportSessionId, lastSessionId) {
            this.connId = connId;
            this.applicationId = applicationId;
            this.appCheckToken = appCheckToken;
            this.authToken = authToken;
            this.keepaliveTimer = null;
            this.frames = null;
            this.totalFrames = 0;
            this.bytesSent = 0;
            this.bytesReceived = 0;
            this.log_ = logWrapper(this.connId);
            this.stats_ = statsManagerGetCollection(repoInfo);
            this.connURL = WebSocketConnection.connectionURL_(repoInfo, transportSessionId, lastSessionId, appCheckToken);
            this.nodeAdmin = repoInfo.nodeAdmin;
        }
        /**
         * @param repoInfo - The info for the websocket endpoint.
         * @param transportSessionId - Optional transportSessionId if this is connecting to an existing transport
         *                                         session
         * @param lastSessionId - Optional lastSessionId if there was a previous connection
         * @returns connection url
         */
        static connectionURL_(repoInfo, transportSessionId, lastSessionId, appCheckToken) {
            const urlParams = {};
            urlParams[VERSION_PARAM] = PROTOCOL_VERSION;
            if (typeof location !== 'undefined' &&
                location.hostname &&
                FORGE_DOMAIN_RE.test(location.hostname)) {
                urlParams[REFERER_PARAM] = FORGE_REF;
            }
            if (transportSessionId) {
                urlParams[TRANSPORT_SESSION_PARAM] = transportSessionId;
            }
            if (lastSessionId) {
                urlParams[LAST_SESSION_PARAM] = lastSessionId;
            }
            if (appCheckToken) {
                urlParams[APP_CHECK_TOKEN_PARAM] = appCheckToken;
            }
            return repoInfoConnectionURL(repoInfo, WEBSOCKET, urlParams);
        }
        /**
         * @param onMessage - Callback when messages arrive
         * @param onDisconnect - Callback with connection lost.
         */
        open(onMessage, onDisconnect) {
            this.onDisconnect = onDisconnect;
            this.onMessage = onMessage;
            this.log_('Websocket connecting to ' + this.connURL);
            this.everConnected_ = false;
            // Assume failure until proven otherwise.
            PersistentStorage.set('previous_websocket_failure', true);
            try {
                if (isNodeSdk()) ;
                else {
                    const options = {
                        headers: {
                            'X-Firebase-GMPID': this.applicationId || '',
                            'X-Firebase-AppCheck': this.appCheckToken || ''
                        }
                    };
                    this.mySock = new WebSocketImpl(this.connURL, [], options);
                }
            }
            catch (e) {
                this.log_('Error instantiating WebSocket.');
                const error = e.message || e.data;
                if (error) {
                    this.log_(error);
                }
                this.onClosed_();
                return;
            }
            this.mySock.onopen = () => {
                this.log_('Websocket connected.');
                this.everConnected_ = true;
            };
            this.mySock.onclose = () => {
                this.log_('Websocket connection was disconnected.');
                this.mySock = null;
                this.onClosed_();
            };
            this.mySock.onmessage = m => {
                this.handleIncomingFrame(m);
            };
            this.mySock.onerror = e => {
                this.log_('WebSocket error.  Closing connection.');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const error = e.message || e.data;
                if (error) {
                    this.log_(error);
                }
                this.onClosed_();
            };
        }
        /**
         * No-op for websockets, we don't need to do anything once the connection is confirmed as open
         */
        start() { }
        static forceDisallow() {
            WebSocketConnection.forceDisallow_ = true;
        }
        static isAvailable() {
            let isOldAndroid = false;
            if (typeof navigator !== 'undefined' && navigator.userAgent) {
                const oldAndroidRegex = /Android ([0-9]{0,}\.[0-9]{0,})/;
                const oldAndroidMatch = navigator.userAgent.match(oldAndroidRegex);
                if (oldAndroidMatch && oldAndroidMatch.length > 1) {
                    if (parseFloat(oldAndroidMatch[1]) < 4.4) {
                        isOldAndroid = true;
                    }
                }
            }
            return (!isOldAndroid &&
                WebSocketImpl !== null &&
                !WebSocketConnection.forceDisallow_);
        }
        /**
         * Returns true if we previously failed to connect with this transport.
         */
        static previouslyFailed() {
            // If our persistent storage is actually only in-memory storage,
            // we default to assuming that it previously failed to be safe.
            return (PersistentStorage.isInMemoryStorage ||
                PersistentStorage.get('previous_websocket_failure') === true);
        }
        markConnectionHealthy() {
            PersistentStorage.remove('previous_websocket_failure');
        }
        appendFrame_(data) {
            this.frames.push(data);
            if (this.frames.length === this.totalFrames) {
                const fullMess = this.frames.join('');
                this.frames = null;
                const jsonMess = jsonEval(fullMess);
                //handle the message
                this.onMessage(jsonMess);
            }
        }
        /**
         * @param frameCount - The number of frames we are expecting from the server
         */
        handleNewFrameCount_(frameCount) {
            this.totalFrames = frameCount;
            this.frames = [];
        }
        /**
         * Attempts to parse a frame count out of some text. If it can't, assumes a value of 1
         * @returns Any remaining data to be process, or null if there is none
         */
        extractFrameCount_(data) {
            assert(this.frames === null, 'We already have a frame buffer');
            // TODO: The server is only supposed to send up to 9999 frames (i.e. length <= 4), but that isn't being enforced
            // currently.  So allowing larger frame counts (length <= 6).  See https://app.asana.com/0/search/8688598998380/8237608042508
            if (data.length <= 6) {
                const frameCount = Number(data);
                if (!isNaN(frameCount)) {
                    this.handleNewFrameCount_(frameCount);
                    return null;
                }
            }
            this.handleNewFrameCount_(1);
            return data;
        }
        /**
         * Process a websocket frame that has arrived from the server.
         * @param mess - The frame data
         */
        handleIncomingFrame(mess) {
            if (this.mySock === null) {
                return; // Chrome apparently delivers incoming packets even after we .close() the connection sometimes.
            }
            const data = mess['data'];
            this.bytesReceived += data.length;
            this.stats_.incrementCounter('bytes_received', data.length);
            this.resetKeepAlive();
            if (this.frames !== null) {
                // we're buffering
                this.appendFrame_(data);
            }
            else {
                // try to parse out a frame count, otherwise, assume 1 and process it
                const remainingData = this.extractFrameCount_(data);
                if (remainingData !== null) {
                    this.appendFrame_(remainingData);
                }
            }
        }
        /**
         * Send a message to the server
         * @param data - The JSON object to transmit
         */
        send(data) {
            this.resetKeepAlive();
            const dataStr = stringify(data);
            this.bytesSent += dataStr.length;
            this.stats_.incrementCounter('bytes_sent', dataStr.length);
            //We can only fit a certain amount in each websocket frame, so we need to split this request
            //up into multiple pieces if it doesn't fit in one request.
            const dataSegs = splitStringBySize(dataStr, WEBSOCKET_MAX_FRAME_SIZE);
            //Send the length header
            if (dataSegs.length > 1) {
                this.sendString_(String(dataSegs.length));
            }
            //Send the actual data in segments.
            for (let i = 0; i < dataSegs.length; i++) {
                this.sendString_(dataSegs[i]);
            }
        }
        shutdown_() {
            this.isClosed_ = true;
            if (this.keepaliveTimer) {
                clearInterval(this.keepaliveTimer);
                this.keepaliveTimer = null;
            }
            if (this.mySock) {
                this.mySock.close();
                this.mySock = null;
            }
        }
        onClosed_() {
            if (!this.isClosed_) {
                this.log_('WebSocket is closing itself');
                this.shutdown_();
                // since this is an internal close, trigger the close listener
                if (this.onDisconnect) {
                    this.onDisconnect(this.everConnected_);
                    this.onDisconnect = null;
                }
            }
        }
        /**
         * External-facing close handler.
         * Close the websocket and kill the connection.
         */
        close() {
            if (!this.isClosed_) {
                this.log_('WebSocket is being closed');
                this.shutdown_();
            }
        }
        /**
         * Kill the current keepalive timer and start a new one, to ensure that it always fires N seconds after
         * the last activity.
         */
        resetKeepAlive() {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = setInterval(() => {
                //If there has been no websocket activity for a while, send a no-op
                if (this.mySock) {
                    this.sendString_('0');
                }
                this.resetKeepAlive();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }, Math.floor(WEBSOCKET_KEEPALIVE_INTERVAL));
        }
        /**
         * Send a string over the websocket.
         *
         * @param str - String to send.
         */
        sendString_(str) {
            // Firefox seems to sometimes throw exceptions (NS_ERROR_UNEXPECTED) from websocket .send()
            // calls for some unknown reason.  We treat these as an error and disconnect.
            // See https://app.asana.com/0/58926111402292/68021340250410
            try {
                this.mySock.send(str);
            }
            catch (e) {
                this.log_('Exception thrown from WebSocket.send():', e.message || e.data, 'Closing connection.');
                setTimeout(this.onClosed_.bind(this), 0);
            }
        }
    }
    /**
     * Number of response before we consider the connection "healthy."
     */
    WebSocketConnection.responsesRequiredToBeHealthy = 2;
    /**
     * Time to wait for the connection te become healthy before giving up.
     */
    WebSocketConnection.healthyTimeout = 30000;

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Currently simplistic, this class manages what transport a Connection should use at various stages of its
     * lifecycle.
     *
     * It starts with longpolling in a browser, and httppolling on node. It then upgrades to websockets if
     * they are available.
     */
    class TransportManager {
        /**
         * @param repoInfo - Metadata around the namespace we're connecting to
         */
        constructor(repoInfo) {
            this.initTransports_(repoInfo);
        }
        static get ALL_TRANSPORTS() {
            return [BrowserPollConnection, WebSocketConnection];
        }
        initTransports_(repoInfo) {
            const isWebSocketsAvailable = WebSocketConnection && WebSocketConnection['isAvailable']();
            let isSkipPollConnection = isWebSocketsAvailable && !WebSocketConnection.previouslyFailed();
            if (repoInfo.webSocketOnly) {
                if (!isWebSocketsAvailable) {
                    warn("wss:// URL used, but browser isn't known to support websockets.  Trying anyway.");
                }
                isSkipPollConnection = true;
            }
            if (isSkipPollConnection) {
                this.transports_ = [WebSocketConnection];
            }
            else {
                const transports = (this.transports_ = []);
                for (const transport of TransportManager.ALL_TRANSPORTS) {
                    if (transport && transport['isAvailable']()) {
                        transports.push(transport);
                    }
                }
            }
        }
        /**
         * @returns The constructor for the initial transport to use
         */
        initialTransport() {
            if (this.transports_.length > 0) {
                return this.transports_[0];
            }
            else {
                throw new Error('No transports available');
            }
        }
        /**
         * @returns The constructor for the next transport, or null
         */
        upgradeTransport() {
            if (this.transports_.length > 1) {
                return this.transports_[1];
            }
            else {
                return null;
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // Abort upgrade attempt if it takes longer than 60s.
    const UPGRADE_TIMEOUT = 60000;
    // For some transports (WebSockets), we need to "validate" the transport by exchanging a few requests and responses.
    // If we haven't sent enough requests within 5s, we'll start sending noop ping requests.
    const DELAY_BEFORE_SENDING_EXTRA_REQUESTS = 5000;
    // If the initial data sent triggers a lot of bandwidth (i.e. it's a large put or a listen for a large amount of data)
    // then we may not be able to exchange our ping/pong requests within the healthy timeout.  So if we reach the timeout
    // but we've sent/received enough bytes, we don't cancel the connection.
    const BYTES_SENT_HEALTHY_OVERRIDE = 10 * 1024;
    const BYTES_RECEIVED_HEALTHY_OVERRIDE = 100 * 1024;
    const MESSAGE_TYPE = 't';
    const MESSAGE_DATA = 'd';
    const CONTROL_SHUTDOWN = 's';
    const CONTROL_RESET = 'r';
    const CONTROL_ERROR = 'e';
    const CONTROL_PONG = 'o';
    const SWITCH_ACK = 'a';
    const END_TRANSMISSION = 'n';
    const PING = 'p';
    const SERVER_HELLO = 'h';
    /**
     * Creates a new real-time connection to the server using whichever method works
     * best in the current browser.
     */
    class Connection {
        /**
         * @param id - an id for this connection
         * @param repoInfo_ - the info for the endpoint to connect to
         * @param applicationId_ - the Firebase App ID for this project
         * @param appCheckToken_ - The App Check Token for this device.
         * @param authToken_ - The auth token for this session.
         * @param onMessage_ - the callback to be triggered when a server-push message arrives
         * @param onReady_ - the callback to be triggered when this connection is ready to send messages.
         * @param onDisconnect_ - the callback to be triggered when a connection was lost
         * @param onKill_ - the callback to be triggered when this connection has permanently shut down.
         * @param lastSessionId - last session id in persistent connection. is used to clean up old session in real-time server
         */
        constructor(id, repoInfo_, applicationId_, appCheckToken_, authToken_, onMessage_, onReady_, onDisconnect_, onKill_, lastSessionId) {
            this.id = id;
            this.repoInfo_ = repoInfo_;
            this.applicationId_ = applicationId_;
            this.appCheckToken_ = appCheckToken_;
            this.authToken_ = authToken_;
            this.onMessage_ = onMessage_;
            this.onReady_ = onReady_;
            this.onDisconnect_ = onDisconnect_;
            this.onKill_ = onKill_;
            this.lastSessionId = lastSessionId;
            this.connectionCount = 0;
            this.pendingDataMessages = [];
            this.state_ = 0 /* CONNECTING */;
            this.log_ = logWrapper('c:' + this.id + ':');
            this.transportManager_ = new TransportManager(repoInfo_);
            this.log_('Connection created');
            this.start_();
        }
        /**
         * Starts a connection attempt
         */
        start_() {
            const conn = this.transportManager_.initialTransport();
            this.conn_ = new conn(this.nextTransportId_(), this.repoInfo_, this.applicationId_, this.appCheckToken_, this.authToken_, null, this.lastSessionId);
            // For certain transports (WebSockets), we need to send and receive several messages back and forth before we
            // can consider the transport healthy.
            this.primaryResponsesRequired_ = conn['responsesRequiredToBeHealthy'] || 0;
            const onMessageReceived = this.connReceiver_(this.conn_);
            const onConnectionLost = this.disconnReceiver_(this.conn_);
            this.tx_ = this.conn_;
            this.rx_ = this.conn_;
            this.secondaryConn_ = null;
            this.isHealthy_ = false;
            /*
             * Firefox doesn't like when code from one iframe tries to create another iframe by way of the parent frame.
             * This can occur in the case of a redirect, i.e. we guessed wrong on what server to connect to and received a reset.
             * Somehow, setTimeout seems to make this ok. That doesn't make sense from a security perspective, since you should
             * still have the context of your originating frame.
             */
            setTimeout(() => {
                // this.conn_ gets set to null in some of the tests. Check to make sure it still exists before using it
                this.conn_ && this.conn_.open(onMessageReceived, onConnectionLost);
            }, Math.floor(0));
            const healthyTimeoutMS = conn['healthyTimeout'] || 0;
            if (healthyTimeoutMS > 0) {
                this.healthyTimeout_ = setTimeoutNonBlocking(() => {
                    this.healthyTimeout_ = null;
                    if (!this.isHealthy_) {
                        if (this.conn_ &&
                            this.conn_.bytesReceived > BYTES_RECEIVED_HEALTHY_OVERRIDE) {
                            this.log_('Connection exceeded healthy timeout but has received ' +
                                this.conn_.bytesReceived +
                                ' bytes.  Marking connection healthy.');
                            this.isHealthy_ = true;
                            this.conn_.markConnectionHealthy();
                        }
                        else if (this.conn_ &&
                            this.conn_.bytesSent > BYTES_SENT_HEALTHY_OVERRIDE) {
                            this.log_('Connection exceeded healthy timeout but has sent ' +
                                this.conn_.bytesSent +
                                ' bytes.  Leaving connection alive.');
                            // NOTE: We don't want to mark it healthy, since we have no guarantee that the bytes have made it to
                            // the server.
                        }
                        else {
                            this.log_('Closing unhealthy connection after timeout.');
                            this.close();
                        }
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }, Math.floor(healthyTimeoutMS));
            }
        }
        nextTransportId_() {
            return 'c:' + this.id + ':' + this.connectionCount++;
        }
        disconnReceiver_(conn) {
            return everConnected => {
                if (conn === this.conn_) {
                    this.onConnectionLost_(everConnected);
                }
                else if (conn === this.secondaryConn_) {
                    this.log_('Secondary connection lost.');
                    this.onSecondaryConnectionLost_();
                }
                else {
                    this.log_('closing an old connection');
                }
            };
        }
        connReceiver_(conn) {
            return (message) => {
                if (this.state_ !== 2 /* DISCONNECTED */) {
                    if (conn === this.rx_) {
                        this.onPrimaryMessageReceived_(message);
                    }
                    else if (conn === this.secondaryConn_) {
                        this.onSecondaryMessageReceived_(message);
                    }
                    else {
                        this.log_('message on old connection');
                    }
                }
            };
        }
        /**
         * @param dataMsg - An arbitrary data message to be sent to the server
         */
        sendRequest(dataMsg) {
            // wrap in a data message envelope and send it on
            const msg = { t: 'd', d: dataMsg };
            this.sendData_(msg);
        }
        tryCleanupConnection() {
            if (this.tx_ === this.secondaryConn_ && this.rx_ === this.secondaryConn_) {
                this.log_('cleaning up and promoting a connection: ' + this.secondaryConn_.connId);
                this.conn_ = this.secondaryConn_;
                this.secondaryConn_ = null;
                // the server will shutdown the old connection
            }
        }
        onSecondaryControl_(controlData) {
            if (MESSAGE_TYPE in controlData) {
                const cmd = controlData[MESSAGE_TYPE];
                if (cmd === SWITCH_ACK) {
                    this.upgradeIfSecondaryHealthy_();
                }
                else if (cmd === CONTROL_RESET) {
                    // Most likely the session wasn't valid. Abandon the switch attempt
                    this.log_('Got a reset on secondary, closing it');
                    this.secondaryConn_.close();
                    // If we were already using this connection for something, than we need to fully close
                    if (this.tx_ === this.secondaryConn_ ||
                        this.rx_ === this.secondaryConn_) {
                        this.close();
                    }
                }
                else if (cmd === CONTROL_PONG) {
                    this.log_('got pong on secondary.');
                    this.secondaryResponsesRequired_--;
                    this.upgradeIfSecondaryHealthy_();
                }
            }
        }
        onSecondaryMessageReceived_(parsedData) {
            const layer = requireKey('t', parsedData);
            const data = requireKey('d', parsedData);
            if (layer === 'c') {
                this.onSecondaryControl_(data);
            }
            else if (layer === 'd') {
                // got a data message, but we're still second connection. Need to buffer it up
                this.pendingDataMessages.push(data);
            }
            else {
                throw new Error('Unknown protocol layer: ' + layer);
            }
        }
        upgradeIfSecondaryHealthy_() {
            if (this.secondaryResponsesRequired_ <= 0) {
                this.log_('Secondary connection is healthy.');
                this.isHealthy_ = true;
                this.secondaryConn_.markConnectionHealthy();
                this.proceedWithUpgrade_();
            }
            else {
                // Send a ping to make sure the connection is healthy.
                this.log_('sending ping on secondary.');
                this.secondaryConn_.send({ t: 'c', d: { t: PING, d: {} } });
            }
        }
        proceedWithUpgrade_() {
            // tell this connection to consider itself open
            this.secondaryConn_.start();
            // send ack
            this.log_('sending client ack on secondary');
            this.secondaryConn_.send({ t: 'c', d: { t: SWITCH_ACK, d: {} } });
            // send end packet on primary transport, switch to sending on this one
            // can receive on this one, buffer responses until end received on primary transport
            this.log_('Ending transmission on primary');
            this.conn_.send({ t: 'c', d: { t: END_TRANSMISSION, d: {} } });
            this.tx_ = this.secondaryConn_;
            this.tryCleanupConnection();
        }
        onPrimaryMessageReceived_(parsedData) {
            // Must refer to parsedData properties in quotes, so closure doesn't touch them.
            const layer = requireKey('t', parsedData);
            const data = requireKey('d', parsedData);
            if (layer === 'c') {
                this.onControl_(data);
            }
            else if (layer === 'd') {
                this.onDataMessage_(data);
            }
        }
        onDataMessage_(message) {
            this.onPrimaryResponse_();
            // We don't do anything with data messages, just kick them up a level
            this.onMessage_(message);
        }
        onPrimaryResponse_() {
            if (!this.isHealthy_) {
                this.primaryResponsesRequired_--;
                if (this.primaryResponsesRequired_ <= 0) {
                    this.log_('Primary connection is healthy.');
                    this.isHealthy_ = true;
                    this.conn_.markConnectionHealthy();
                }
            }
        }
        onControl_(controlData) {
            const cmd = requireKey(MESSAGE_TYPE, controlData);
            if (MESSAGE_DATA in controlData) {
                const payload = controlData[MESSAGE_DATA];
                if (cmd === SERVER_HELLO) {
                    this.onHandshake_(payload);
                }
                else if (cmd === END_TRANSMISSION) {
                    this.log_('recvd end transmission on primary');
                    this.rx_ = this.secondaryConn_;
                    for (let i = 0; i < this.pendingDataMessages.length; ++i) {
                        this.onDataMessage_(this.pendingDataMessages[i]);
                    }
                    this.pendingDataMessages = [];
                    this.tryCleanupConnection();
                }
                else if (cmd === CONTROL_SHUTDOWN) {
                    // This was previously the 'onKill' callback passed to the lower-level connection
                    // payload in this case is the reason for the shutdown. Generally a human-readable error
                    this.onConnectionShutdown_(payload);
                }
                else if (cmd === CONTROL_RESET) {
                    // payload in this case is the host we should contact
                    this.onReset_(payload);
                }
                else if (cmd === CONTROL_ERROR) {
                    error('Server Error: ' + payload);
                }
                else if (cmd === CONTROL_PONG) {
                    this.log_('got pong on primary.');
                    this.onPrimaryResponse_();
                    this.sendPingOnPrimaryIfNecessary_();
                }
                else {
                    error('Unknown control packet command: ' + cmd);
                }
            }
        }
        /**
         * @param handshake - The handshake data returned from the server
         */
        onHandshake_(handshake) {
            const timestamp = handshake.ts;
            const version = handshake.v;
            const host = handshake.h;
            this.sessionId = handshake.s;
            this.repoInfo_.host = host;
            // if we've already closed the connection, then don't bother trying to progress further
            if (this.state_ === 0 /* CONNECTING */) {
                this.conn_.start();
                this.onConnectionEstablished_(this.conn_, timestamp);
                if (PROTOCOL_VERSION !== version) {
                    warn('Protocol version mismatch detected');
                }
                // TODO: do we want to upgrade? when? maybe a delay?
                this.tryStartUpgrade_();
            }
        }
        tryStartUpgrade_() {
            const conn = this.transportManager_.upgradeTransport();
            if (conn) {
                this.startUpgrade_(conn);
            }
        }
        startUpgrade_(conn) {
            this.secondaryConn_ = new conn(this.nextTransportId_(), this.repoInfo_, this.applicationId_, this.appCheckToken_, this.authToken_, this.sessionId);
            // For certain transports (WebSockets), we need to send and receive several messages back and forth before we
            // can consider the transport healthy.
            this.secondaryResponsesRequired_ =
                conn['responsesRequiredToBeHealthy'] || 0;
            const onMessage = this.connReceiver_(this.secondaryConn_);
            const onDisconnect = this.disconnReceiver_(this.secondaryConn_);
            this.secondaryConn_.open(onMessage, onDisconnect);
            // If we haven't successfully upgraded after UPGRADE_TIMEOUT, give up and kill the secondary.
            setTimeoutNonBlocking(() => {
                if (this.secondaryConn_) {
                    this.log_('Timed out trying to upgrade.');
                    this.secondaryConn_.close();
                }
            }, Math.floor(UPGRADE_TIMEOUT));
        }
        onReset_(host) {
            this.log_('Reset packet received.  New host: ' + host);
            this.repoInfo_.host = host;
            // TODO: if we're already "connected", we need to trigger a disconnect at the next layer up.
            // We don't currently support resets after the connection has already been established
            if (this.state_ === 1 /* CONNECTED */) {
                this.close();
            }
            else {
                // Close whatever connections we have open and start again.
                this.closeConnections_();
                this.start_();
            }
        }
        onConnectionEstablished_(conn, timestamp) {
            this.log_('Realtime connection established.');
            this.conn_ = conn;
            this.state_ = 1 /* CONNECTED */;
            if (this.onReady_) {
                this.onReady_(timestamp, this.sessionId);
                this.onReady_ = null;
            }
            // If after 5 seconds we haven't sent enough requests to the server to get the connection healthy,
            // send some pings.
            if (this.primaryResponsesRequired_ === 0) {
                this.log_('Primary connection is healthy.');
                this.isHealthy_ = true;
            }
            else {
                setTimeoutNonBlocking(() => {
                    this.sendPingOnPrimaryIfNecessary_();
                }, Math.floor(DELAY_BEFORE_SENDING_EXTRA_REQUESTS));
            }
        }
        sendPingOnPrimaryIfNecessary_() {
            // If the connection isn't considered healthy yet, we'll send a noop ping packet request.
            if (!this.isHealthy_ && this.state_ === 1 /* CONNECTED */) {
                this.log_('sending ping on primary.');
                this.sendData_({ t: 'c', d: { t: PING, d: {} } });
            }
        }
        onSecondaryConnectionLost_() {
            const conn = this.secondaryConn_;
            this.secondaryConn_ = null;
            if (this.tx_ === conn || this.rx_ === conn) {
                // we are relying on this connection already in some capacity. Therefore, a failure is real
                this.close();
            }
        }
        /**
         * @param everConnected - Whether or not the connection ever reached a server. Used to determine if
         * we should flush the host cache
         */
        onConnectionLost_(everConnected) {
            this.conn_ = null;
            // NOTE: IF you're seeing a Firefox error for this line, I think it might be because it's getting
            // called on window close and RealtimeState.CONNECTING is no longer defined.  Just a guess.
            if (!everConnected && this.state_ === 0 /* CONNECTING */) {
                this.log_('Realtime connection failed.');
                // Since we failed to connect at all, clear any cached entry for this namespace in case the machine went away
                if (this.repoInfo_.isCacheableHost()) {
                    PersistentStorage.remove('host:' + this.repoInfo_.host);
                    // reset the internal host to what we would show the user, i.e. <ns>.firebaseio.com
                    this.repoInfo_.internalHost = this.repoInfo_.host;
                }
            }
            else if (this.state_ === 1 /* CONNECTED */) {
                this.log_('Realtime connection lost.');
            }
            this.close();
        }
        onConnectionShutdown_(reason) {
            this.log_('Connection shutdown command received. Shutting down...');
            if (this.onKill_) {
                this.onKill_(reason);
                this.onKill_ = null;
            }
            // We intentionally don't want to fire onDisconnect (kill is a different case),
            // so clear the callback.
            this.onDisconnect_ = null;
            this.close();
        }
        sendData_(data) {
            if (this.state_ !== 1 /* CONNECTED */) {
                throw 'Connection is not connected';
            }
            else {
                this.tx_.send(data);
            }
        }
        /**
         * Cleans up this connection, calling the appropriate callbacks
         */
        close() {
            if (this.state_ !== 2 /* DISCONNECTED */) {
                this.log_('Closing realtime connection.');
                this.state_ = 2 /* DISCONNECTED */;
                this.closeConnections_();
                if (this.onDisconnect_) {
                    this.onDisconnect_();
                    this.onDisconnect_ = null;
                }
            }
        }
        closeConnections_() {
            this.log_('Shutting down all connections');
            if (this.conn_) {
                this.conn_.close();
                this.conn_ = null;
            }
            if (this.secondaryConn_) {
                this.secondaryConn_.close();
                this.secondaryConn_ = null;
            }
            if (this.healthyTimeout_) {
                clearTimeout(this.healthyTimeout_);
                this.healthyTimeout_ = null;
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Interface defining the set of actions that can be performed against the Firebase server
     * (basically corresponds to our wire protocol).
     *
     * @interface
     */
    class ServerActions {
        put(pathString, data, onComplete, hash) { }
        merge(pathString, data, onComplete, hash) { }
        /**
         * Refreshes the auth token for the current connection.
         * @param token - The authentication token
         */
        refreshAuthToken(token) { }
        /**
         * Refreshes the app check token for the current connection.
         * @param token The app check token
         */
        refreshAppCheckToken(token) { }
        onDisconnectPut(pathString, data, onComplete) { }
        onDisconnectMerge(pathString, data, onComplete) { }
        onDisconnectCancel(pathString, onComplete) { }
        reportStats(stats) { }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Base class to be used if you want to emit events. Call the constructor with
     * the set of allowed event names.
     */
    class EventEmitter {
        constructor(allowedEvents_) {
            this.allowedEvents_ = allowedEvents_;
            this.listeners_ = {};
            assert(Array.isArray(allowedEvents_) && allowedEvents_.length > 0, 'Requires a non-empty array');
        }
        /**
         * To be called by derived classes to trigger events.
         */
        trigger(eventType, ...varArgs) {
            if (Array.isArray(this.listeners_[eventType])) {
                // Clone the list, since callbacks could add/remove listeners.
                const listeners = [...this.listeners_[eventType]];
                for (let i = 0; i < listeners.length; i++) {
                    listeners[i].callback.apply(listeners[i].context, varArgs);
                }
            }
        }
        on(eventType, callback, context) {
            this.validateEventType_(eventType);
            this.listeners_[eventType] = this.listeners_[eventType] || [];
            this.listeners_[eventType].push({ callback, context });
            const eventData = this.getInitialEvent(eventType);
            if (eventData) {
                callback.apply(context, eventData);
            }
        }
        off(eventType, callback, context) {
            this.validateEventType_(eventType);
            const listeners = this.listeners_[eventType] || [];
            for (let i = 0; i < listeners.length; i++) {
                if (listeners[i].callback === callback &&
                    (!context || context === listeners[i].context)) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        }
        validateEventType_(eventType) {
            assert(this.allowedEvents_.find(et => {
                return et === eventType;
            }), 'Unknown event: ' + eventType);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Monitors online state (as reported by window.online/offline events).
     *
     * The expectation is that this could have many false positives (thinks we are online
     * when we're not), but no false negatives.  So we can safely use it to determine when
     * we definitely cannot reach the internet.
     */
    class OnlineMonitor extends EventEmitter {
        constructor() {
            super(['online']);
            this.online_ = true;
            // We've had repeated complaints that Cordova apps can get stuck "offline", e.g.
            // https://forum.ionicframework.com/t/firebase-connection-is-lost-and-never-come-back/43810
            // It would seem that the 'online' event does not always fire consistently. So we disable it
            // for Cordova.
            if (typeof window !== 'undefined' &&
                typeof window.addEventListener !== 'undefined' &&
                !isMobileCordova()) {
                window.addEventListener('online', () => {
                    if (!this.online_) {
                        this.online_ = true;
                        this.trigger('online', true);
                    }
                }, false);
                window.addEventListener('offline', () => {
                    if (this.online_) {
                        this.online_ = false;
                        this.trigger('online', false);
                    }
                }, false);
            }
        }
        static getInstance() {
            return new OnlineMonitor();
        }
        getInitialEvent(eventType) {
            assert(eventType === 'online', 'Unknown event type: ' + eventType);
            return [this.online_];
        }
        currentlyOnline() {
            return this.online_;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** Maximum key depth. */
    const MAX_PATH_DEPTH = 32;
    /** Maximum number of (UTF8) bytes in a Firebase path. */
    const MAX_PATH_LENGTH_BYTES = 768;
    /**
     * An immutable object representing a parsed path.  It's immutable so that you
     * can pass them around to other functions without worrying about them changing
     * it.
     */
    class Path {
        /**
         * @param pathOrString - Path string to parse, or another path, or the raw
         * tokens array
         */
        constructor(pathOrString, pieceNum) {
            if (pieceNum === void 0) {
                this.pieces_ = pathOrString.split('/');
                // Remove empty pieces.
                let copyTo = 0;
                for (let i = 0; i < this.pieces_.length; i++) {
                    if (this.pieces_[i].length > 0) {
                        this.pieces_[copyTo] = this.pieces_[i];
                        copyTo++;
                    }
                }
                this.pieces_.length = copyTo;
                this.pieceNum_ = 0;
            }
            else {
                this.pieces_ = pathOrString;
                this.pieceNum_ = pieceNum;
            }
        }
        toString() {
            let pathString = '';
            for (let i = this.pieceNum_; i < this.pieces_.length; i++) {
                if (this.pieces_[i] !== '') {
                    pathString += '/' + this.pieces_[i];
                }
            }
            return pathString || '/';
        }
    }
    function newEmptyPath() {
        return new Path('');
    }
    function pathGetFront(path) {
        if (path.pieceNum_ >= path.pieces_.length) {
            return null;
        }
        return path.pieces_[path.pieceNum_];
    }
    /**
     * @returns The number of segments in this path
     */
    function pathGetLength(path) {
        return path.pieces_.length - path.pieceNum_;
    }
    function pathPopFront(path) {
        let pieceNum = path.pieceNum_;
        if (pieceNum < path.pieces_.length) {
            pieceNum++;
        }
        return new Path(path.pieces_, pieceNum);
    }
    function pathGetBack(path) {
        if (path.pieceNum_ < path.pieces_.length) {
            return path.pieces_[path.pieces_.length - 1];
        }
        return null;
    }
    function pathToUrlEncodedString(path) {
        let pathString = '';
        for (let i = path.pieceNum_; i < path.pieces_.length; i++) {
            if (path.pieces_[i] !== '') {
                pathString += '/' + encodeURIComponent(String(path.pieces_[i]));
            }
        }
        return pathString || '/';
    }
    /**
     * Shallow copy of the parts of the path.
     *
     */
    function pathSlice(path, begin = 0) {
        return path.pieces_.slice(path.pieceNum_ + begin);
    }
    function pathParent(path) {
        if (path.pieceNum_ >= path.pieces_.length) {
            return null;
        }
        const pieces = [];
        for (let i = path.pieceNum_; i < path.pieces_.length - 1; i++) {
            pieces.push(path.pieces_[i]);
        }
        return new Path(pieces, 0);
    }
    function pathChild(path, childPathObj) {
        const pieces = [];
        for (let i = path.pieceNum_; i < path.pieces_.length; i++) {
            pieces.push(path.pieces_[i]);
        }
        if (childPathObj instanceof Path) {
            for (let i = childPathObj.pieceNum_; i < childPathObj.pieces_.length; i++) {
                pieces.push(childPathObj.pieces_[i]);
            }
        }
        else {
            const childPieces = childPathObj.split('/');
            for (let i = 0; i < childPieces.length; i++) {
                if (childPieces[i].length > 0) {
                    pieces.push(childPieces[i]);
                }
            }
        }
        return new Path(pieces, 0);
    }
    /**
     * @returns True if there are no segments in this path
     */
    function pathIsEmpty(path) {
        return path.pieceNum_ >= path.pieces_.length;
    }
    /**
     * @returns The path from outerPath to innerPath
     */
    function newRelativePath(outerPath, innerPath) {
        const outer = pathGetFront(outerPath), inner = pathGetFront(innerPath);
        if (outer === null) {
            return innerPath;
        }
        else if (outer === inner) {
            return newRelativePath(pathPopFront(outerPath), pathPopFront(innerPath));
        }
        else {
            throw new Error('INTERNAL ERROR: innerPath (' +
                innerPath +
                ') is not within ' +
                'outerPath (' +
                outerPath +
                ')');
        }
    }
    /**
     * @returns true if paths are the same.
     */
    function pathEquals(path, other) {
        if (pathGetLength(path) !== pathGetLength(other)) {
            return false;
        }
        for (let i = path.pieceNum_, j = other.pieceNum_; i <= path.pieces_.length; i++, j++) {
            if (path.pieces_[i] !== other.pieces_[j]) {
                return false;
            }
        }
        return true;
    }
    /**
     * @returns True if this path is a parent (or the same as) other
     */
    function pathContains(path, other) {
        let i = path.pieceNum_;
        let j = other.pieceNum_;
        if (pathGetLength(path) > pathGetLength(other)) {
            return false;
        }
        while (i < path.pieces_.length) {
            if (path.pieces_[i] !== other.pieces_[j]) {
                return false;
            }
            ++i;
            ++j;
        }
        return true;
    }
    /**
     * Dynamic (mutable) path used to count path lengths.
     *
     * This class is used to efficiently check paths for valid
     * length (in UTF8 bytes) and depth (used in path validation).
     *
     * Throws Error exception if path is ever invalid.
     *
     * The definition of a path always begins with '/'.
     */
    class ValidationPath {
        /**
         * @param path - Initial Path.
         * @param errorPrefix_ - Prefix for any error messages.
         */
        constructor(path, errorPrefix_) {
            this.errorPrefix_ = errorPrefix_;
            this.parts_ = pathSlice(path, 0);
            /** Initialize to number of '/' chars needed in path. */
            this.byteLength_ = Math.max(1, this.parts_.length);
            for (let i = 0; i < this.parts_.length; i++) {
                this.byteLength_ += stringLength(this.parts_[i]);
            }
            validationPathCheckValid(this);
        }
    }
    function validationPathPush(validationPath, child) {
        // Count the needed '/'
        if (validationPath.parts_.length > 0) {
            validationPath.byteLength_ += 1;
        }
        validationPath.parts_.push(child);
        validationPath.byteLength_ += stringLength(child);
        validationPathCheckValid(validationPath);
    }
    function validationPathPop(validationPath) {
        const last = validationPath.parts_.pop();
        validationPath.byteLength_ -= stringLength(last);
        // Un-count the previous '/'
        if (validationPath.parts_.length > 0) {
            validationPath.byteLength_ -= 1;
        }
    }
    function validationPathCheckValid(validationPath) {
        if (validationPath.byteLength_ > MAX_PATH_LENGTH_BYTES) {
            throw new Error(validationPath.errorPrefix_ +
                'has a key path longer than ' +
                MAX_PATH_LENGTH_BYTES +
                ' bytes (' +
                validationPath.byteLength_ +
                ').');
        }
        if (validationPath.parts_.length > MAX_PATH_DEPTH) {
            throw new Error(validationPath.errorPrefix_ +
                'path specified exceeds the maximum depth that can be written (' +
                MAX_PATH_DEPTH +
                ') or object contains a cycle ' +
                validationPathToErrorString(validationPath));
        }
    }
    /**
     * String for use in error messages - uses '.' notation for path.
     */
    function validationPathToErrorString(validationPath) {
        if (validationPath.parts_.length === 0) {
            return '';
        }
        return "in property '" + validationPath.parts_.join('.') + "'";
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class VisibilityMonitor extends EventEmitter {
        constructor() {
            super(['visible']);
            let hidden;
            let visibilityChange;
            if (typeof document !== 'undefined' &&
                typeof document.addEventListener !== 'undefined') {
                if (typeof document['hidden'] !== 'undefined') {
                    // Opera 12.10 and Firefox 18 and later support
                    visibilityChange = 'visibilitychange';
                    hidden = 'hidden';
                }
                else if (typeof document['mozHidden'] !== 'undefined') {
                    visibilityChange = 'mozvisibilitychange';
                    hidden = 'mozHidden';
                }
                else if (typeof document['msHidden'] !== 'undefined') {
                    visibilityChange = 'msvisibilitychange';
                    hidden = 'msHidden';
                }
                else if (typeof document['webkitHidden'] !== 'undefined') {
                    visibilityChange = 'webkitvisibilitychange';
                    hidden = 'webkitHidden';
                }
            }
            // Initially, we always assume we are visible. This ensures that in browsers
            // without page visibility support or in cases where we are never visible
            // (e.g. chrome extension), we act as if we are visible, i.e. don't delay
            // reconnects
            this.visible_ = true;
            if (visibilityChange) {
                document.addEventListener(visibilityChange, () => {
                    const visible = !document[hidden];
                    if (visible !== this.visible_) {
                        this.visible_ = visible;
                        this.trigger('visible', visible);
                    }
                }, false);
            }
        }
        static getInstance() {
            return new VisibilityMonitor();
        }
        getInitialEvent(eventType) {
            assert(eventType === 'visible', 'Unknown event type: ' + eventType);
            return [this.visible_];
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const RECONNECT_MIN_DELAY = 1000;
    const RECONNECT_MAX_DELAY_DEFAULT = 60 * 5 * 1000; // 5 minutes in milliseconds (Case: 1858)
    const GET_CONNECT_TIMEOUT = 3 * 1000;
    const RECONNECT_MAX_DELAY_FOR_ADMINS = 30 * 1000; // 30 seconds for admin clients (likely to be a backend server)
    const RECONNECT_DELAY_MULTIPLIER = 1.3;
    const RECONNECT_DELAY_RESET_TIMEOUT = 30000; // Reset delay back to MIN_DELAY after being connected for 30sec.
    const SERVER_KILL_INTERRUPT_REASON = 'server_kill';
    // If auth fails repeatedly, we'll assume something is wrong and log a warning / back off.
    const INVALID_TOKEN_THRESHOLD = 3;
    /**
     * Firebase connection.  Abstracts wire protocol and handles reconnecting.
     *
     * NOTE: All JSON objects sent to the realtime connection must have property names enclosed
     * in quotes to make sure the closure compiler does not minify them.
     */
    class PersistentConnection extends ServerActions {
        /**
         * @param repoInfo_ - Data about the namespace we are connecting to
         * @param applicationId_ - The Firebase App ID for this project
         * @param onDataUpdate_ - A callback for new data from the server
         */
        constructor(repoInfo_, applicationId_, onDataUpdate_, onConnectStatus_, onServerInfoUpdate_, authTokenProvider_, appCheckTokenProvider_, authOverride_) {
            super();
            this.repoInfo_ = repoInfo_;
            this.applicationId_ = applicationId_;
            this.onDataUpdate_ = onDataUpdate_;
            this.onConnectStatus_ = onConnectStatus_;
            this.onServerInfoUpdate_ = onServerInfoUpdate_;
            this.authTokenProvider_ = authTokenProvider_;
            this.appCheckTokenProvider_ = appCheckTokenProvider_;
            this.authOverride_ = authOverride_;
            // Used for diagnostic logging.
            this.id = PersistentConnection.nextPersistentConnectionId_++;
            this.log_ = logWrapper('p:' + this.id + ':');
            this.interruptReasons_ = {};
            this.listens = new Map();
            this.outstandingPuts_ = [];
            this.outstandingGets_ = [];
            this.outstandingPutCount_ = 0;
            this.outstandingGetCount_ = 0;
            this.onDisconnectRequestQueue_ = [];
            this.connected_ = false;
            this.reconnectDelay_ = RECONNECT_MIN_DELAY;
            this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_DEFAULT;
            this.securityDebugCallback_ = null;
            this.lastSessionId = null;
            this.establishConnectionTimer_ = null;
            this.visible_ = false;
            // Before we get connected, we keep a queue of pending messages to send.
            this.requestCBHash_ = {};
            this.requestNumber_ = 0;
            this.realtime_ = null;
            this.authToken_ = null;
            this.appCheckToken_ = null;
            this.forceTokenRefresh_ = false;
            this.invalidAuthTokenCount_ = 0;
            this.invalidAppCheckTokenCount_ = 0;
            this.firstConnection_ = true;
            this.lastConnectionAttemptTime_ = null;
            this.lastConnectionEstablishedTime_ = null;
            if (authOverride_ && !isNodeSdk()) {
                throw new Error('Auth override specified in options, but not supported on non Node.js platforms');
            }
            VisibilityMonitor.getInstance().on('visible', this.onVisible_, this);
            if (repoInfo_.host.indexOf('fblocal') === -1) {
                OnlineMonitor.getInstance().on('online', this.onOnline_, this);
            }
        }
        sendRequest(action, body, onResponse) {
            const curReqNum = ++this.requestNumber_;
            const msg = { r: curReqNum, a: action, b: body };
            this.log_(stringify(msg));
            assert(this.connected_, "sendRequest call when we're not connected not allowed.");
            this.realtime_.sendRequest(msg);
            if (onResponse) {
                this.requestCBHash_[curReqNum] = onResponse;
            }
        }
        get(query) {
            this.initConnection_();
            const deferred = new Deferred();
            const request = {
                p: query._path.toString(),
                q: query._queryObject
            };
            const outstandingGet = {
                action: 'g',
                request,
                onComplete: (message) => {
                    const payload = message['d'];
                    if (message['s'] === 'ok') {
                        this.onDataUpdate_(request['p'], payload, 
                        /*isMerge*/ false, 
                        /*tag*/ null);
                        deferred.resolve(payload);
                    }
                    else {
                        deferred.reject(payload);
                    }
                }
            };
            this.outstandingGets_.push(outstandingGet);
            this.outstandingGetCount_++;
            const index = this.outstandingGets_.length - 1;
            if (!this.connected_) {
                setTimeout(() => {
                    const get = this.outstandingGets_[index];
                    if (get === undefined || outstandingGet !== get) {
                        return;
                    }
                    delete this.outstandingGets_[index];
                    this.outstandingGetCount_--;
                    if (this.outstandingGetCount_ === 0) {
                        this.outstandingGets_ = [];
                    }
                    this.log_('get ' + index + ' timed out on connection');
                    deferred.reject(new Error('Client is offline.'));
                }, GET_CONNECT_TIMEOUT);
            }
            if (this.connected_) {
                this.sendGet_(index);
            }
            return deferred.promise;
        }
        listen(query, currentHashFn, tag, onComplete) {
            this.initConnection_();
            const queryId = query._queryIdentifier;
            const pathString = query._path.toString();
            this.log_('Listen called for ' + pathString + ' ' + queryId);
            if (!this.listens.has(pathString)) {
                this.listens.set(pathString, new Map());
            }
            assert(query._queryParams.isDefault() || !query._queryParams.loadsAllData(), 'listen() called for non-default but complete query');
            assert(!this.listens.get(pathString).has(queryId), 'listen() called twice for same path/queryId.');
            const listenSpec = {
                onComplete,
                hashFn: currentHashFn,
                query,
                tag
            };
            this.listens.get(pathString).set(queryId, listenSpec);
            if (this.connected_) {
                this.sendListen_(listenSpec);
            }
        }
        sendGet_(index) {
            const get = this.outstandingGets_[index];
            this.sendRequest('g', get.request, (message) => {
                delete this.outstandingGets_[index];
                this.outstandingGetCount_--;
                if (this.outstandingGetCount_ === 0) {
                    this.outstandingGets_ = [];
                }
                if (get.onComplete) {
                    get.onComplete(message);
                }
            });
        }
        sendListen_(listenSpec) {
            const query = listenSpec.query;
            const pathString = query._path.toString();
            const queryId = query._queryIdentifier;
            this.log_('Listen on ' + pathString + ' for ' + queryId);
            const req = { /*path*/ p: pathString };
            const action = 'q';
            // Only bother to send query if it's non-default.
            if (listenSpec.tag) {
                req['q'] = query._queryObject;
                req['t'] = listenSpec.tag;
            }
            req[ /*hash*/'h'] = listenSpec.hashFn();
            this.sendRequest(action, req, (message) => {
                const payload = message[ /*data*/'d'];
                const status = message[ /*status*/'s'];
                // print warnings in any case...
                PersistentConnection.warnOnListenWarnings_(payload, query);
                const currentListenSpec = this.listens.get(pathString) &&
                    this.listens.get(pathString).get(queryId);
                // only trigger actions if the listen hasn't been removed and readded
                if (currentListenSpec === listenSpec) {
                    this.log_('listen response', message);
                    if (status !== 'ok') {
                        this.removeListen_(pathString, queryId);
                    }
                    if (listenSpec.onComplete) {
                        listenSpec.onComplete(status, payload);
                    }
                }
            });
        }
        static warnOnListenWarnings_(payload, query) {
            if (payload && typeof payload === 'object' && contains(payload, 'w')) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const warnings = safeGet(payload, 'w');
                if (Array.isArray(warnings) && ~warnings.indexOf('no_index')) {
                    const indexSpec = '".indexOn": "' + query._queryParams.getIndex().toString() + '"';
                    const indexPath = query._path.toString();
                    warn(`Using an unspecified index. Your data will be downloaded and ` +
                        `filtered on the client. Consider adding ${indexSpec} at ` +
                        `${indexPath} to your security rules for better performance.`);
                }
            }
        }
        refreshAuthToken(token) {
            this.authToken_ = token;
            this.log_('Auth token refreshed');
            if (this.authToken_) {
                this.tryAuth();
            }
            else {
                //If we're connected we want to let the server know to unauthenticate us. If we're not connected, simply delete
                //the credential so we dont become authenticated next time we connect.
                if (this.connected_) {
                    this.sendRequest('unauth', {}, () => { });
                }
            }
            this.reduceReconnectDelayIfAdminCredential_(token);
        }
        reduceReconnectDelayIfAdminCredential_(credential) {
            // NOTE: This isn't intended to be bulletproof (a malicious developer can always just modify the client).
            // Additionally, we don't bother resetting the max delay back to the default if auth fails / expires.
            const isFirebaseSecret = credential && credential.length === 40;
            if (isFirebaseSecret || isAdmin(credential)) {
                this.log_('Admin auth credential detected.  Reducing max reconnect time.');
                this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_FOR_ADMINS;
            }
        }
        refreshAppCheckToken(token) {
            this.appCheckToken_ = token;
            this.log_('App check token refreshed');
            if (this.appCheckToken_) {
                this.tryAppCheck();
            }
            else {
                //If we're connected we want to let the server know to unauthenticate us.
                //If we're not connected, simply delete the credential so we dont become
                // authenticated next time we connect.
                if (this.connected_) {
                    this.sendRequest('unappeck', {}, () => { });
                }
            }
        }
        /**
         * Attempts to authenticate with the given credentials. If the authentication attempt fails, it's triggered like
         * a auth revoked (the connection is closed).
         */
        tryAuth() {
            if (this.connected_ && this.authToken_) {
                const token = this.authToken_;
                const authMethod = isValidFormat(token) ? 'auth' : 'gauth';
                const requestData = { cred: token };
                if (this.authOverride_ === null) {
                    requestData['noauth'] = true;
                }
                else if (typeof this.authOverride_ === 'object') {
                    requestData['authvar'] = this.authOverride_;
                }
                this.sendRequest(authMethod, requestData, (res) => {
                    const status = res[ /*status*/'s'];
                    const data = res[ /*data*/'d'] || 'error';
                    if (this.authToken_ === token) {
                        if (status === 'ok') {
                            this.invalidAuthTokenCount_ = 0;
                        }
                        else {
                            // Triggers reconnect and force refresh for auth token
                            this.onAuthRevoked_(status, data);
                        }
                    }
                });
            }
        }
        /**
         * Attempts to authenticate with the given token. If the authentication
         * attempt fails, it's triggered like the token was revoked (the connection is
         * closed).
         */
        tryAppCheck() {
            if (this.connected_ && this.appCheckToken_) {
                this.sendRequest('appcheck', { 'token': this.appCheckToken_ }, (res) => {
                    const status = res[ /*status*/'s'];
                    const data = res[ /*data*/'d'] || 'error';
                    if (status === 'ok') {
                        this.invalidAppCheckTokenCount_ = 0;
                    }
                    else {
                        this.onAppCheckRevoked_(status, data);
                    }
                });
            }
        }
        /**
         * @inheritDoc
         */
        unlisten(query, tag) {
            const pathString = query._path.toString();
            const queryId = query._queryIdentifier;
            this.log_('Unlisten called for ' + pathString + ' ' + queryId);
            assert(query._queryParams.isDefault() || !query._queryParams.loadsAllData(), 'unlisten() called for non-default but complete query');
            const listen = this.removeListen_(pathString, queryId);
            if (listen && this.connected_) {
                this.sendUnlisten_(pathString, queryId, query._queryObject, tag);
            }
        }
        sendUnlisten_(pathString, queryId, queryObj, tag) {
            this.log_('Unlisten on ' + pathString + ' for ' + queryId);
            const req = { /*path*/ p: pathString };
            const action = 'n';
            // Only bother sending queryId if it's non-default.
            if (tag) {
                req['q'] = queryObj;
                req['t'] = tag;
            }
            this.sendRequest(action, req);
        }
        onDisconnectPut(pathString, data, onComplete) {
            this.initConnection_();
            if (this.connected_) {
                this.sendOnDisconnect_('o', pathString, data, onComplete);
            }
            else {
                this.onDisconnectRequestQueue_.push({
                    pathString,
                    action: 'o',
                    data,
                    onComplete
                });
            }
        }
        onDisconnectMerge(pathString, data, onComplete) {
            this.initConnection_();
            if (this.connected_) {
                this.sendOnDisconnect_('om', pathString, data, onComplete);
            }
            else {
                this.onDisconnectRequestQueue_.push({
                    pathString,
                    action: 'om',
                    data,
                    onComplete
                });
            }
        }
        onDisconnectCancel(pathString, onComplete) {
            this.initConnection_();
            if (this.connected_) {
                this.sendOnDisconnect_('oc', pathString, null, onComplete);
            }
            else {
                this.onDisconnectRequestQueue_.push({
                    pathString,
                    action: 'oc',
                    data: null,
                    onComplete
                });
            }
        }
        sendOnDisconnect_(action, pathString, data, onComplete) {
            const request = { /*path*/ p: pathString, /*data*/ d: data };
            this.log_('onDisconnect ' + action, request);
            this.sendRequest(action, request, (response) => {
                if (onComplete) {
                    setTimeout(() => {
                        onComplete(response[ /*status*/'s'], response[ /* data */'d']);
                    }, Math.floor(0));
                }
            });
        }
        put(pathString, data, onComplete, hash) {
            this.putInternal('p', pathString, data, onComplete, hash);
        }
        merge(pathString, data, onComplete, hash) {
            this.putInternal('m', pathString, data, onComplete, hash);
        }
        putInternal(action, pathString, data, onComplete, hash) {
            this.initConnection_();
            const request = {
                /*path*/ p: pathString,
                /*data*/ d: data
            };
            if (hash !== undefined) {
                request[ /*hash*/'h'] = hash;
            }
            // TODO: Only keep track of the most recent put for a given path?
            this.outstandingPuts_.push({
                action,
                request,
                onComplete
            });
            this.outstandingPutCount_++;
            const index = this.outstandingPuts_.length - 1;
            if (this.connected_) {
                this.sendPut_(index);
            }
            else {
                this.log_('Buffering put: ' + pathString);
            }
        }
        sendPut_(index) {
            const action = this.outstandingPuts_[index].action;
            const request = this.outstandingPuts_[index].request;
            const onComplete = this.outstandingPuts_[index].onComplete;
            this.outstandingPuts_[index].queued = this.connected_;
            this.sendRequest(action, request, (message) => {
                this.log_(action + ' response', message);
                delete this.outstandingPuts_[index];
                this.outstandingPutCount_--;
                // Clean up array occasionally.
                if (this.outstandingPutCount_ === 0) {
                    this.outstandingPuts_ = [];
                }
                if (onComplete) {
                    onComplete(message[ /*status*/'s'], message[ /* data */'d']);
                }
            });
        }
        reportStats(stats) {
            // If we're not connected, we just drop the stats.
            if (this.connected_) {
                const request = { /*counters*/ c: stats };
                this.log_('reportStats', request);
                this.sendRequest(/*stats*/ 's', request, result => {
                    const status = result[ /*status*/'s'];
                    if (status !== 'ok') {
                        const errorReason = result[ /* data */'d'];
                        this.log_('reportStats', 'Error sending stats: ' + errorReason);
                    }
                });
            }
        }
        onDataMessage_(message) {
            if ('r' in message) {
                // this is a response
                this.log_('from server: ' + stringify(message));
                const reqNum = message['r'];
                const onResponse = this.requestCBHash_[reqNum];
                if (onResponse) {
                    delete this.requestCBHash_[reqNum];
                    onResponse(message[ /*body*/'b']);
                }
            }
            else if ('error' in message) {
                throw 'A server-side error has occurred: ' + message['error'];
            }
            else if ('a' in message) {
                // a and b are action and body, respectively
                this.onDataPush_(message['a'], message['b']);
            }
        }
        onDataPush_(action, body) {
            this.log_('handleServerMessage', action, body);
            if (action === 'd') {
                this.onDataUpdate_(body[ /*path*/'p'], body[ /*data*/'d'], 
                /*isMerge*/ false, body['t']);
            }
            else if (action === 'm') {
                this.onDataUpdate_(body[ /*path*/'p'], body[ /*data*/'d'], 
                /*isMerge=*/ true, body['t']);
            }
            else if (action === 'c') {
                this.onListenRevoked_(body[ /*path*/'p'], body[ /*query*/'q']);
            }
            else if (action === 'ac') {
                this.onAuthRevoked_(body[ /*status code*/'s'], body[ /* explanation */'d']);
            }
            else if (action === 'apc') {
                this.onAppCheckRevoked_(body[ /*status code*/'s'], body[ /* explanation */'d']);
            }
            else if (action === 'sd') {
                this.onSecurityDebugPacket_(body);
            }
            else {
                error('Unrecognized action received from server: ' +
                    stringify(action) +
                    '\nAre you using the latest client?');
            }
        }
        onReady_(timestamp, sessionId) {
            this.log_('connection ready');
            this.connected_ = true;
            this.lastConnectionEstablishedTime_ = new Date().getTime();
            this.handleTimestamp_(timestamp);
            this.lastSessionId = sessionId;
            if (this.firstConnection_) {
                this.sendConnectStats_();
            }
            this.restoreState_();
            this.firstConnection_ = false;
            this.onConnectStatus_(true);
        }
        scheduleConnect_(timeout) {
            assert(!this.realtime_, "Scheduling a connect when we're already connected/ing?");
            if (this.establishConnectionTimer_) {
                clearTimeout(this.establishConnectionTimer_);
            }
            // NOTE: Even when timeout is 0, it's important to do a setTimeout to work around an infuriating "Security Error" in
            // Firefox when trying to write to our long-polling iframe in some scenarios (e.g. Forge or our unit tests).
            this.establishConnectionTimer_ = setTimeout(() => {
                this.establishConnectionTimer_ = null;
                this.establishConnection_();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }, Math.floor(timeout));
        }
        initConnection_() {
            if (!this.realtime_ && this.firstConnection_) {
                this.scheduleConnect_(0);
            }
        }
        onVisible_(visible) {
            // NOTE: Tabbing away and back to a window will defeat our reconnect backoff, but I think that's fine.
            if (visible &&
                !this.visible_ &&
                this.reconnectDelay_ === this.maxReconnectDelay_) {
                this.log_('Window became visible.  Reducing delay.');
                this.reconnectDelay_ = RECONNECT_MIN_DELAY;
                if (!this.realtime_) {
                    this.scheduleConnect_(0);
                }
            }
            this.visible_ = visible;
        }
        onOnline_(online) {
            if (online) {
                this.log_('Browser went online.');
                this.reconnectDelay_ = RECONNECT_MIN_DELAY;
                if (!this.realtime_) {
                    this.scheduleConnect_(0);
                }
            }
            else {
                this.log_('Browser went offline.  Killing connection.');
                if (this.realtime_) {
                    this.realtime_.close();
                }
            }
        }
        onRealtimeDisconnect_() {
            this.log_('data client disconnected');
            this.connected_ = false;
            this.realtime_ = null;
            // Since we don't know if our sent transactions succeeded or not, we need to cancel them.
            this.cancelSentTransactions_();
            // Clear out the pending requests.
            this.requestCBHash_ = {};
            if (this.shouldReconnect_()) {
                if (!this.visible_) {
                    this.log_("Window isn't visible.  Delaying reconnect.");
                    this.reconnectDelay_ = this.maxReconnectDelay_;
                    this.lastConnectionAttemptTime_ = new Date().getTime();
                }
                else if (this.lastConnectionEstablishedTime_) {
                    // If we've been connected long enough, reset reconnect delay to minimum.
                    const timeSinceLastConnectSucceeded = new Date().getTime() - this.lastConnectionEstablishedTime_;
                    if (timeSinceLastConnectSucceeded > RECONNECT_DELAY_RESET_TIMEOUT) {
                        this.reconnectDelay_ = RECONNECT_MIN_DELAY;
                    }
                    this.lastConnectionEstablishedTime_ = null;
                }
                const timeSinceLastConnectAttempt = new Date().getTime() - this.lastConnectionAttemptTime_;
                let reconnectDelay = Math.max(0, this.reconnectDelay_ - timeSinceLastConnectAttempt);
                reconnectDelay = Math.random() * reconnectDelay;
                this.log_('Trying to reconnect in ' + reconnectDelay + 'ms');
                this.scheduleConnect_(reconnectDelay);
                // Adjust reconnect delay for next time.
                this.reconnectDelay_ = Math.min(this.maxReconnectDelay_, this.reconnectDelay_ * RECONNECT_DELAY_MULTIPLIER);
            }
            this.onConnectStatus_(false);
        }
        async establishConnection_() {
            if (this.shouldReconnect_()) {
                this.log_('Making a connection attempt');
                this.lastConnectionAttemptTime_ = new Date().getTime();
                this.lastConnectionEstablishedTime_ = null;
                const onDataMessage = this.onDataMessage_.bind(this);
                const onReady = this.onReady_.bind(this);
                const onDisconnect = this.onRealtimeDisconnect_.bind(this);
                const connId = this.id + ':' + PersistentConnection.nextConnectionId_++;
                const lastSessionId = this.lastSessionId;
                let canceled = false;
                let connection = null;
                const closeFn = function () {
                    if (connection) {
                        connection.close();
                    }
                    else {
                        canceled = true;
                        onDisconnect();
                    }
                };
                const sendRequestFn = function (msg) {
                    assert(connection, "sendRequest call when we're not connected not allowed.");
                    connection.sendRequest(msg);
                };
                this.realtime_ = {
                    close: closeFn,
                    sendRequest: sendRequestFn
                };
                const forceRefresh = this.forceTokenRefresh_;
                this.forceTokenRefresh_ = false;
                try {
                    // First fetch auth and app check token, and establish connection after
                    // fetching the token was successful
                    const [authToken, appCheckToken] = await Promise.all([
                        this.authTokenProvider_.getToken(forceRefresh),
                        this.appCheckTokenProvider_.getToken(forceRefresh)
                    ]);
                    if (!canceled) {
                        log('getToken() completed. Creating connection.');
                        this.authToken_ = authToken && authToken.accessToken;
                        this.appCheckToken_ = appCheckToken && appCheckToken.token;
                        connection = new Connection(connId, this.repoInfo_, this.applicationId_, this.appCheckToken_, this.authToken_, onDataMessage, onReady, onDisconnect, 
                        /* onKill= */ reason => {
                            warn(reason + ' (' + this.repoInfo_.toString() + ')');
                            this.interrupt(SERVER_KILL_INTERRUPT_REASON);
                        }, lastSessionId);
                    }
                    else {
                        log('getToken() completed but was canceled');
                    }
                }
                catch (error) {
                    this.log_('Failed to get token: ' + error);
                    if (!canceled) {
                        if (this.repoInfo_.nodeAdmin) {
                            // This may be a critical error for the Admin Node.js SDK, so log a warning.
                            // But getToken() may also just have temporarily failed, so we still want to
                            // continue retrying.
                            warn(error);
                        }
                        closeFn();
                    }
                }
            }
        }
        interrupt(reason) {
            log('Interrupting connection for reason: ' + reason);
            this.interruptReasons_[reason] = true;
            if (this.realtime_) {
                this.realtime_.close();
            }
            else {
                if (this.establishConnectionTimer_) {
                    clearTimeout(this.establishConnectionTimer_);
                    this.establishConnectionTimer_ = null;
                }
                if (this.connected_) {
                    this.onRealtimeDisconnect_();
                }
            }
        }
        resume(reason) {
            log('Resuming connection for reason: ' + reason);
            delete this.interruptReasons_[reason];
            if (isEmpty(this.interruptReasons_)) {
                this.reconnectDelay_ = RECONNECT_MIN_DELAY;
                if (!this.realtime_) {
                    this.scheduleConnect_(0);
                }
            }
        }
        handleTimestamp_(timestamp) {
            const delta = timestamp - new Date().getTime();
            this.onServerInfoUpdate_({ serverTimeOffset: delta });
        }
        cancelSentTransactions_() {
            for (let i = 0; i < this.outstandingPuts_.length; i++) {
                const put = this.outstandingPuts_[i];
                if (put && /*hash*/ 'h' in put.request && put.queued) {
                    if (put.onComplete) {
                        put.onComplete('disconnect');
                    }
                    delete this.outstandingPuts_[i];
                    this.outstandingPutCount_--;
                }
            }
            // Clean up array occasionally.
            if (this.outstandingPutCount_ === 0) {
                this.outstandingPuts_ = [];
            }
        }
        onListenRevoked_(pathString, query) {
            // Remove the listen and manufacture a "permission_denied" error for the failed listen.
            let queryId;
            if (!query) {
                queryId = 'default';
            }
            else {
                queryId = query.map(q => ObjectToUniqueKey(q)).join('$');
            }
            const listen = this.removeListen_(pathString, queryId);
            if (listen && listen.onComplete) {
                listen.onComplete('permission_denied');
            }
        }
        removeListen_(pathString, queryId) {
            const normalizedPathString = new Path(pathString).toString(); // normalize path.
            let listen;
            if (this.listens.has(normalizedPathString)) {
                const map = this.listens.get(normalizedPathString);
                listen = map.get(queryId);
                map.delete(queryId);
                if (map.size === 0) {
                    this.listens.delete(normalizedPathString);
                }
            }
            else {
                // all listens for this path has already been removed
                listen = undefined;
            }
            return listen;
        }
        onAuthRevoked_(statusCode, explanation) {
            log('Auth token revoked: ' + statusCode + '/' + explanation);
            this.authToken_ = null;
            this.forceTokenRefresh_ = true;
            this.realtime_.close();
            if (statusCode === 'invalid_token' || statusCode === 'permission_denied') {
                // We'll wait a couple times before logging the warning / increasing the
                // retry period since oauth tokens will report as "invalid" if they're
                // just expired. Plus there may be transient issues that resolve themselves.
                this.invalidAuthTokenCount_++;
                if (this.invalidAuthTokenCount_ >= INVALID_TOKEN_THRESHOLD) {
                    // Set a long reconnect delay because recovery is unlikely
                    this.reconnectDelay_ = RECONNECT_MAX_DELAY_FOR_ADMINS;
                    // Notify the auth token provider that the token is invalid, which will log
                    // a warning
                    this.authTokenProvider_.notifyForInvalidToken();
                }
            }
        }
        onAppCheckRevoked_(statusCode, explanation) {
            log('App check token revoked: ' + statusCode + '/' + explanation);
            this.appCheckToken_ = null;
            this.forceTokenRefresh_ = true;
            // Note: We don't close the connection as the developer may not have
            // enforcement enabled. The backend closes connections with enforcements.
            if (statusCode === 'invalid_token' || statusCode === 'permission_denied') {
                // We'll wait a couple times before logging the warning / increasing the
                // retry period since oauth tokens will report as "invalid" if they're
                // just expired. Plus there may be transient issues that resolve themselves.
                this.invalidAppCheckTokenCount_++;
                if (this.invalidAppCheckTokenCount_ >= INVALID_TOKEN_THRESHOLD) {
                    this.appCheckTokenProvider_.notifyForInvalidToken();
                }
            }
        }
        onSecurityDebugPacket_(body) {
            if (this.securityDebugCallback_) {
                this.securityDebugCallback_(body);
            }
            else {
                if ('msg' in body) {
                    console.log('FIREBASE: ' + body['msg'].replace('\n', '\nFIREBASE: '));
                }
            }
        }
        restoreState_() {
            //Re-authenticate ourselves if we have a credential stored.
            this.tryAuth();
            this.tryAppCheck();
            // Puts depend on having received the corresponding data update from the server before they complete, so we must
            // make sure to send listens before puts.
            for (const queries of this.listens.values()) {
                for (const listenSpec of queries.values()) {
                    this.sendListen_(listenSpec);
                }
            }
            for (let i = 0; i < this.outstandingPuts_.length; i++) {
                if (this.outstandingPuts_[i]) {
                    this.sendPut_(i);
                }
            }
            while (this.onDisconnectRequestQueue_.length) {
                const request = this.onDisconnectRequestQueue_.shift();
                this.sendOnDisconnect_(request.action, request.pathString, request.data, request.onComplete);
            }
            for (let i = 0; i < this.outstandingGets_.length; i++) {
                if (this.outstandingGets_[i]) {
                    this.sendGet_(i);
                }
            }
        }
        /**
         * Sends client stats for first connection
         */
        sendConnectStats_() {
            const stats = {};
            let clientName = 'js';
            stats['sdk.' + clientName + '.' + SDK_VERSION.replace(/\./g, '-')] = 1;
            if (isMobileCordova()) {
                stats['framework.cordova'] = 1;
            }
            else if (isReactNative()) {
                stats['framework.reactnative'] = 1;
            }
            this.reportStats(stats);
        }
        shouldReconnect_() {
            const online = OnlineMonitor.getInstance().currentlyOnline();
            return isEmpty(this.interruptReasons_) && online;
        }
    }
    PersistentConnection.nextPersistentConnectionId_ = 0;
    /**
     * Counter for number of connections created. Mainly used for tagging in the logs
     */
    PersistentConnection.nextConnectionId_ = 0;

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class NamedNode {
        constructor(name, node) {
            this.name = name;
            this.node = node;
        }
        static Wrap(name, node) {
            return new NamedNode(name, node);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Index {
        /**
         * @returns A standalone comparison function for
         * this index
         */
        getCompare() {
            return this.compare.bind(this);
        }
        /**
         * Given a before and after value for a node, determine if the indexed value has changed. Even if they are different,
         * it's possible that the changes are isolated to parts of the snapshot that are not indexed.
         *
         *
         * @returns True if the portion of the snapshot being indexed changed between oldNode and newNode
         */
        indexedValueChanged(oldNode, newNode) {
            const oldWrapped = new NamedNode(MIN_NAME, oldNode);
            const newWrapped = new NamedNode(MIN_NAME, newNode);
            return this.compare(oldWrapped, newWrapped) !== 0;
        }
        /**
         * @returns a node wrapper that will sort equal to or less than
         * any other node wrapper, using this index
         */
        minPost() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NamedNode.MIN;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let __EMPTY_NODE;
    class KeyIndex extends Index {
        static get __EMPTY_NODE() {
            return __EMPTY_NODE;
        }
        static set __EMPTY_NODE(val) {
            __EMPTY_NODE = val;
        }
        compare(a, b) {
            return nameCompare(a.name, b.name);
        }
        isDefinedOn(node) {
            // We could probably return true here (since every node has a key), but it's never called
            // so just leaving unimplemented for now.
            throw assertionError('KeyIndex.isDefinedOn not expected to be called.');
        }
        indexedValueChanged(oldNode, newNode) {
            return false; // The key for a node never changes.
        }
        minPost() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NamedNode.MIN;
        }
        maxPost() {
            // TODO: This should really be created once and cached in a static property, but
            // NamedNode isn't defined yet, so I can't use it in a static.  Bleh.
            return new NamedNode(MAX_NAME, __EMPTY_NODE);
        }
        makePost(indexValue, name) {
            assert(typeof indexValue === 'string', 'KeyIndex indexValue must always be a string.');
            // We just use empty node, but it'll never be compared, since our comparator only looks at name.
            return new NamedNode(indexValue, __EMPTY_NODE);
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
            return '.key';
        }
    }
    const KEY_INDEX = new KeyIndex();

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * An iterator over an LLRBNode.
     */
    class SortedMapIterator {
        /**
         * @param node - Node to iterate.
         * @param isReverse_ - Whether or not to iterate in reverse
         */
        constructor(node, startKey, comparator, isReverse_, resultGenerator_ = null) {
            this.isReverse_ = isReverse_;
            this.resultGenerator_ = resultGenerator_;
            this.nodeStack_ = [];
            let cmp = 1;
            while (!node.isEmpty()) {
                node = node;
                cmp = startKey ? comparator(node.key, startKey) : 1;
                // flip the comparison if we're going in reverse
                if (isReverse_) {
                    cmp *= -1;
                }
                if (cmp < 0) {
                    // This node is less than our start key. ignore it
                    if (this.isReverse_) {
                        node = node.left;
                    }
                    else {
                        node = node.right;
                    }
                }
                else if (cmp === 0) {
                    // This node is exactly equal to our start key. Push it on the stack, but stop iterating;
                    this.nodeStack_.push(node);
                    break;
                }
                else {
                    // This node is greater than our start key, add it to the stack and move to the next one
                    this.nodeStack_.push(node);
                    if (this.isReverse_) {
                        node = node.right;
                    }
                    else {
                        node = node.left;
                    }
                }
            }
        }
        getNext() {
            if (this.nodeStack_.length === 0) {
                return null;
            }
            let node = this.nodeStack_.pop();
            let result;
            if (this.resultGenerator_) {
                result = this.resultGenerator_(node.key, node.value);
            }
            else {
                result = { key: node.key, value: node.value };
            }
            if (this.isReverse_) {
                node = node.left;
                while (!node.isEmpty()) {
                    this.nodeStack_.push(node);
                    node = node.right;
                }
            }
            else {
                node = node.right;
                while (!node.isEmpty()) {
                    this.nodeStack_.push(node);
                    node = node.left;
                }
            }
            return result;
        }
        hasNext() {
            return this.nodeStack_.length > 0;
        }
        peek() {
            if (this.nodeStack_.length === 0) {
                return null;
            }
            const node = this.nodeStack_[this.nodeStack_.length - 1];
            if (this.resultGenerator_) {
                return this.resultGenerator_(node.key, node.value);
            }
            else {
                return { key: node.key, value: node.value };
            }
        }
    }
    /**
     * Represents a node in a Left-leaning Red-Black tree.
     */
    class LLRBNode {
        /**
         * @param key - Key associated with this node.
         * @param value - Value associated with this node.
         * @param color - Whether this node is red.
         * @param left - Left child.
         * @param right - Right child.
         */
        constructor(key, value, color, left, right) {
            this.key = key;
            this.value = value;
            this.color = color != null ? color : LLRBNode.RED;
            this.left =
                left != null ? left : SortedMap.EMPTY_NODE;
            this.right =
                right != null ? right : SortedMap.EMPTY_NODE;
        }
        /**
         * Returns a copy of the current node, optionally replacing pieces of it.
         *
         * @param key - New key for the node, or null.
         * @param value - New value for the node, or null.
         * @param color - New color for the node, or null.
         * @param left - New left child for the node, or null.
         * @param right - New right child for the node, or null.
         * @returns The node copy.
         */
        copy(key, value, color, left, right) {
            return new LLRBNode(key != null ? key : this.key, value != null ? value : this.value, color != null ? color : this.color, left != null ? left : this.left, right != null ? right : this.right);
        }
        /**
         * @returns The total number of nodes in the tree.
         */
        count() {
            return this.left.count() + 1 + this.right.count();
        }
        /**
         * @returns True if the tree is empty.
         */
        isEmpty() {
            return false;
        }
        /**
         * Traverses the tree in key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         *   node.  If it returns true, traversal is aborted.
         * @returns The first truthy value returned by action, or the last falsey
         *   value returned by action
         */
        inorderTraversal(action) {
            return (this.left.inorderTraversal(action) ||
                !!action(this.key, this.value) ||
                this.right.inorderTraversal(action));
        }
        /**
         * Traverses the tree in reverse key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        reverseTraversal(action) {
            return (this.right.reverseTraversal(action) ||
                action(this.key, this.value) ||
                this.left.reverseTraversal(action));
        }
        /**
         * @returns The minimum node in the tree.
         */
        min_() {
            if (this.left.isEmpty()) {
                return this;
            }
            else {
                return this.left.min_();
            }
        }
        /**
         * @returns The maximum key in the tree.
         */
        minKey() {
            return this.min_().key;
        }
        /**
         * @returns The maximum key in the tree.
         */
        maxKey() {
            if (this.right.isEmpty()) {
                return this.key;
            }
            else {
                return this.right.maxKey();
            }
        }
        /**
         * @param key - Key to insert.
         * @param value - Value to insert.
         * @param comparator - Comparator.
         * @returns New tree, with the key/value added.
         */
        insert(key, value, comparator) {
            let n = this;
            const cmp = comparator(key, n.key);
            if (cmp < 0) {
                n = n.copy(null, null, null, n.left.insert(key, value, comparator), null);
            }
            else if (cmp === 0) {
                n = n.copy(null, value, null, null, null);
            }
            else {
                n = n.copy(null, null, null, null, n.right.insert(key, value, comparator));
            }
            return n.fixUp_();
        }
        /**
         * @returns New tree, with the minimum key removed.
         */
        removeMin_() {
            if (this.left.isEmpty()) {
                return SortedMap.EMPTY_NODE;
            }
            let n = this;
            if (!n.left.isRed_() && !n.left.left.isRed_()) {
                n = n.moveRedLeft_();
            }
            n = n.copy(null, null, null, n.left.removeMin_(), null);
            return n.fixUp_();
        }
        /**
         * @param key - The key of the item to remove.
         * @param comparator - Comparator.
         * @returns New tree, with the specified item removed.
         */
        remove(key, comparator) {
            let n, smallest;
            n = this;
            if (comparator(key, n.key) < 0) {
                if (!n.left.isEmpty() && !n.left.isRed_() && !n.left.left.isRed_()) {
                    n = n.moveRedLeft_();
                }
                n = n.copy(null, null, null, n.left.remove(key, comparator), null);
            }
            else {
                if (n.left.isRed_()) {
                    n = n.rotateRight_();
                }
                if (!n.right.isEmpty() && !n.right.isRed_() && !n.right.left.isRed_()) {
                    n = n.moveRedRight_();
                }
                if (comparator(key, n.key) === 0) {
                    if (n.right.isEmpty()) {
                        return SortedMap.EMPTY_NODE;
                    }
                    else {
                        smallest = n.right.min_();
                        n = n.copy(smallest.key, smallest.value, null, null, n.right.removeMin_());
                    }
                }
                n = n.copy(null, null, null, null, n.right.remove(key, comparator));
            }
            return n.fixUp_();
        }
        /**
         * @returns Whether this is a RED node.
         */
        isRed_() {
            return this.color;
        }
        /**
         * @returns New tree after performing any needed rotations.
         */
        fixUp_() {
            let n = this;
            if (n.right.isRed_() && !n.left.isRed_()) {
                n = n.rotateLeft_();
            }
            if (n.left.isRed_() && n.left.left.isRed_()) {
                n = n.rotateRight_();
            }
            if (n.left.isRed_() && n.right.isRed_()) {
                n = n.colorFlip_();
            }
            return n;
        }
        /**
         * @returns New tree, after moveRedLeft.
         */
        moveRedLeft_() {
            let n = this.colorFlip_();
            if (n.right.left.isRed_()) {
                n = n.copy(null, null, null, null, n.right.rotateRight_());
                n = n.rotateLeft_();
                n = n.colorFlip_();
            }
            return n;
        }
        /**
         * @returns New tree, after moveRedRight.
         */
        moveRedRight_() {
            let n = this.colorFlip_();
            if (n.left.left.isRed_()) {
                n = n.rotateRight_();
                n = n.colorFlip_();
            }
            return n;
        }
        /**
         * @returns New tree, after rotateLeft.
         */
        rotateLeft_() {
            const nl = this.copy(null, null, LLRBNode.RED, null, this.right.left);
            return this.right.copy(null, null, this.color, nl, null);
        }
        /**
         * @returns New tree, after rotateRight.
         */
        rotateRight_() {
            const nr = this.copy(null, null, LLRBNode.RED, this.left.right, null);
            return this.left.copy(null, null, this.color, null, nr);
        }
        /**
         * @returns Newt ree, after colorFlip.
         */
        colorFlip_() {
            const left = this.left.copy(null, null, !this.left.color, null, null);
            const right = this.right.copy(null, null, !this.right.color, null, null);
            return this.copy(null, null, !this.color, left, right);
        }
        /**
         * For testing.
         *
         * @returns True if all is well.
         */
        checkMaxDepth_() {
            const blackDepth = this.check_();
            return Math.pow(2.0, blackDepth) <= this.count() + 1;
        }
        check_() {
            if (this.isRed_() && this.left.isRed_()) {
                throw new Error('Red node has red child(' + this.key + ',' + this.value + ')');
            }
            if (this.right.isRed_()) {
                throw new Error('Right child of (' + this.key + ',' + this.value + ') is red');
            }
            const blackDepth = this.left.check_();
            if (blackDepth !== this.right.check_()) {
                throw new Error('Black depths differ');
            }
            else {
                return blackDepth + (this.isRed_() ? 0 : 1);
            }
        }
    }
    LLRBNode.RED = true;
    LLRBNode.BLACK = false;
    /**
     * Represents an empty node (a leaf node in the Red-Black Tree).
     */
    class LLRBEmptyNode {
        /**
         * Returns a copy of the current node.
         *
         * @returns The node copy.
         */
        copy(key, value, color, left, right) {
            return this;
        }
        /**
         * Returns a copy of the tree, with the specified key/value added.
         *
         * @param key - Key to be added.
         * @param value - Value to be added.
         * @param comparator - Comparator.
         * @returns New tree, with item added.
         */
        insert(key, value, comparator) {
            return new LLRBNode(key, value, null);
        }
        /**
         * Returns a copy of the tree, with the specified key removed.
         *
         * @param key - The key to remove.
         * @param comparator - Comparator.
         * @returns New tree, with item removed.
         */
        remove(key, comparator) {
            return this;
        }
        /**
         * @returns The total number of nodes in the tree.
         */
        count() {
            return 0;
        }
        /**
         * @returns True if the tree is empty.
         */
        isEmpty() {
            return true;
        }
        /**
         * Traverses the tree in key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        inorderTraversal(action) {
            return false;
        }
        /**
         * Traverses the tree in reverse key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        reverseTraversal(action) {
            return false;
        }
        minKey() {
            return null;
        }
        maxKey() {
            return null;
        }
        check_() {
            return 0;
        }
        /**
         * @returns Whether this node is red.
         */
        isRed_() {
            return false;
        }
    }
    /**
     * An immutable sorted map implementation, based on a Left-leaning Red-Black
     * tree.
     */
    class SortedMap {
        /**
         * @param comparator_ - Key comparator.
         * @param root_ - Optional root node for the map.
         */
        constructor(comparator_, root_ = SortedMap.EMPTY_NODE) {
            this.comparator_ = comparator_;
            this.root_ = root_;
        }
        /**
         * Returns a copy of the map, with the specified key/value added or replaced.
         * (TODO: We should perhaps rename this method to 'put')
         *
         * @param key - Key to be added.
         * @param value - Value to be added.
         * @returns New map, with item added.
         */
        insert(key, value) {
            return new SortedMap(this.comparator_, this.root_
                .insert(key, value, this.comparator_)
                .copy(null, null, LLRBNode.BLACK, null, null));
        }
        /**
         * Returns a copy of the map, with the specified key removed.
         *
         * @param key - The key to remove.
         * @returns New map, with item removed.
         */
        remove(key) {
            return new SortedMap(this.comparator_, this.root_
                .remove(key, this.comparator_)
                .copy(null, null, LLRBNode.BLACK, null, null));
        }
        /**
         * Returns the value of the node with the given key, or null.
         *
         * @param key - The key to look up.
         * @returns The value of the node with the given key, or null if the
         * key doesn't exist.
         */
        get(key) {
            let cmp;
            let node = this.root_;
            while (!node.isEmpty()) {
                cmp = this.comparator_(key, node.key);
                if (cmp === 0) {
                    return node.value;
                }
                else if (cmp < 0) {
                    node = node.left;
                }
                else if (cmp > 0) {
                    node = node.right;
                }
            }
            return null;
        }
        /**
         * Returns the key of the item *before* the specified key, or null if key is the first item.
         * @param key - The key to find the predecessor of
         * @returns The predecessor key.
         */
        getPredecessorKey(key) {
            let cmp, node = this.root_, rightParent = null;
            while (!node.isEmpty()) {
                cmp = this.comparator_(key, node.key);
                if (cmp === 0) {
                    if (!node.left.isEmpty()) {
                        node = node.left;
                        while (!node.right.isEmpty()) {
                            node = node.right;
                        }
                        return node.key;
                    }
                    else if (rightParent) {
                        return rightParent.key;
                    }
                    else {
                        return null; // first item.
                    }
                }
                else if (cmp < 0) {
                    node = node.left;
                }
                else if (cmp > 0) {
                    rightParent = node;
                    node = node.right;
                }
            }
            throw new Error('Attempted to find predecessor key for a nonexistent key.  What gives?');
        }
        /**
         * @returns True if the map is empty.
         */
        isEmpty() {
            return this.root_.isEmpty();
        }
        /**
         * @returns The total number of nodes in the map.
         */
        count() {
            return this.root_.count();
        }
        /**
         * @returns The minimum key in the map.
         */
        minKey() {
            return this.root_.minKey();
        }
        /**
         * @returns The maximum key in the map.
         */
        maxKey() {
            return this.root_.maxKey();
        }
        /**
         * Traverses the map in key order and calls the specified action function
         * for each key/value pair.
         *
         * @param action - Callback function to be called
         * for each key/value pair.  If action returns true, traversal is aborted.
         * @returns The first truthy value returned by action, or the last falsey
         *   value returned by action
         */
        inorderTraversal(action) {
            return this.root_.inorderTraversal(action);
        }
        /**
         * Traverses the map in reverse key order and calls the specified action function
         * for each key/value pair.
         *
         * @param action - Callback function to be called
         * for each key/value pair.  If action returns true, traversal is aborted.
         * @returns True if the traversal was aborted.
         */
        reverseTraversal(action) {
            return this.root_.reverseTraversal(action);
        }
        /**
         * Returns an iterator over the SortedMap.
         * @returns The iterator.
         */
        getIterator(resultGenerator) {
            return new SortedMapIterator(this.root_, null, this.comparator_, false, resultGenerator);
        }
        getIteratorFrom(key, resultGenerator) {
            return new SortedMapIterator(this.root_, key, this.comparator_, false, resultGenerator);
        }
        getReverseIteratorFrom(key, resultGenerator) {
            return new SortedMapIterator(this.root_, key, this.comparator_, true, resultGenerator);
        }
        getReverseIterator(resultGenerator) {
            return new SortedMapIterator(this.root_, null, this.comparator_, true, resultGenerator);
        }
    }
    /**
     * Always use the same empty node, to reduce memory.
     */
    SortedMap.EMPTY_NODE = new LLRBEmptyNode();

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function NAME_ONLY_COMPARATOR(left, right) {
        return nameCompare(left.name, right.name);
    }
    function NAME_COMPARATOR(left, right) {
        return nameCompare(left, right);
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let MAX_NODE$2;
    function setMaxNode$1(val) {
        MAX_NODE$2 = val;
    }
    const priorityHashText = function (priority) {
        if (typeof priority === 'number') {
            return 'number:' + doubleToIEEE754String(priority);
        }
        else {
            return 'string:' + priority;
        }
    };
    /**
     * Validates that a priority snapshot Node is valid.
     */
    const validatePriorityNode = function (priorityNode) {
        if (priorityNode.isLeafNode()) {
            const val = priorityNode.val();
            assert(typeof val === 'string' ||
                typeof val === 'number' ||
                (typeof val === 'object' && contains(val, '.sv')), 'Priority must be a string or number.');
        }
        else {
            assert(priorityNode === MAX_NODE$2 || priorityNode.isEmpty(), 'priority of unexpected type.');
        }
        // Don't call getPriority() on MAX_NODE to avoid hitting assertion.
        assert(priorityNode === MAX_NODE$2 || priorityNode.getPriority().isEmpty(), "Priority nodes can't have a priority of their own.");
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let __childrenNodeConstructor;
    /**
     * LeafNode is a class for storing leaf nodes in a DataSnapshot.  It
     * implements Node and stores the value of the node (a string,
     * number, or boolean) accessible via getValue().
     */
    class LeafNode {
        /**
         * @param value_ - The value to store in this leaf node. The object type is
         * possible in the event of a deferred value
         * @param priorityNode_ - The priority of this node.
         */
        constructor(value_, priorityNode_ = LeafNode.__childrenNodeConstructor.EMPTY_NODE) {
            this.value_ = value_;
            this.priorityNode_ = priorityNode_;
            this.lazyHash_ = null;
            assert(this.value_ !== undefined && this.value_ !== null, "LeafNode shouldn't be created with null/undefined value.");
            validatePriorityNode(this.priorityNode_);
        }
        static set __childrenNodeConstructor(val) {
            __childrenNodeConstructor = val;
        }
        static get __childrenNodeConstructor() {
            return __childrenNodeConstructor;
        }
        /** @inheritDoc */
        isLeafNode() {
            return true;
        }
        /** @inheritDoc */
        getPriority() {
            return this.priorityNode_;
        }
        /** @inheritDoc */
        updatePriority(newPriorityNode) {
            return new LeafNode(this.value_, newPriorityNode);
        }
        /** @inheritDoc */
        getImmediateChild(childName) {
            // Hack to treat priority as a regular child
            if (childName === '.priority') {
                return this.priorityNode_;
            }
            else {
                return LeafNode.__childrenNodeConstructor.EMPTY_NODE;
            }
        }
        /** @inheritDoc */
        getChild(path) {
            if (pathIsEmpty(path)) {
                return this;
            }
            else if (pathGetFront(path) === '.priority') {
                return this.priorityNode_;
            }
            else {
                return LeafNode.__childrenNodeConstructor.EMPTY_NODE;
            }
        }
        hasChild() {
            return false;
        }
        /** @inheritDoc */
        getPredecessorChildName(childName, childNode) {
            return null;
        }
        /** @inheritDoc */
        updateImmediateChild(childName, newChildNode) {
            if (childName === '.priority') {
                return this.updatePriority(newChildNode);
            }
            else if (newChildNode.isEmpty() && childName !== '.priority') {
                return this;
            }
            else {
                return LeafNode.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(childName, newChildNode).updatePriority(this.priorityNode_);
            }
        }
        /** @inheritDoc */
        updateChild(path, newChildNode) {
            const front = pathGetFront(path);
            if (front === null) {
                return newChildNode;
            }
            else if (newChildNode.isEmpty() && front !== '.priority') {
                return this;
            }
            else {
                assert(front !== '.priority' || pathGetLength(path) === 1, '.priority must be the last token in a path');
                return this.updateImmediateChild(front, LeafNode.__childrenNodeConstructor.EMPTY_NODE.updateChild(pathPopFront(path), newChildNode));
            }
        }
        /** @inheritDoc */
        isEmpty() {
            return false;
        }
        /** @inheritDoc */
        numChildren() {
            return 0;
        }
        /** @inheritDoc */
        forEachChild(index, action) {
            return false;
        }
        val(exportFormat) {
            if (exportFormat && !this.getPriority().isEmpty()) {
                return {
                    '.value': this.getValue(),
                    '.priority': this.getPriority().val()
                };
            }
            else {
                return this.getValue();
            }
        }
        /** @inheritDoc */
        hash() {
            if (this.lazyHash_ === null) {
                let toHash = '';
                if (!this.priorityNode_.isEmpty()) {
                    toHash +=
                        'priority:' +
                            priorityHashText(this.priorityNode_.val()) +
                            ':';
                }
                const type = typeof this.value_;
                toHash += type + ':';
                if (type === 'number') {
                    toHash += doubleToIEEE754String(this.value_);
                }
                else {
                    toHash += this.value_;
                }
                this.lazyHash_ = sha1(toHash);
            }
            return this.lazyHash_;
        }
        /**
         * Returns the value of the leaf node.
         * @returns The value of the node.
         */
        getValue() {
            return this.value_;
        }
        compareTo(other) {
            if (other === LeafNode.__childrenNodeConstructor.EMPTY_NODE) {
                return 1;
            }
            else if (other instanceof LeafNode.__childrenNodeConstructor) {
                return -1;
            }
            else {
                assert(other.isLeafNode(), 'Unknown node type');
                return this.compareToLeafNode_(other);
            }
        }
        /**
         * Comparison specifically for two leaf nodes
         */
        compareToLeafNode_(otherLeaf) {
            const otherLeafType = typeof otherLeaf.value_;
            const thisLeafType = typeof this.value_;
            const otherIndex = LeafNode.VALUE_TYPE_ORDER.indexOf(otherLeafType);
            const thisIndex = LeafNode.VALUE_TYPE_ORDER.indexOf(thisLeafType);
            assert(otherIndex >= 0, 'Unknown leaf type: ' + otherLeafType);
            assert(thisIndex >= 0, 'Unknown leaf type: ' + thisLeafType);
            if (otherIndex === thisIndex) {
                // Same type, compare values
                if (thisLeafType === 'object') {
                    // Deferred value nodes are all equal, but we should also never get to this point...
                    return 0;
                }
                else {
                    // Note that this works because true > false, all others are number or string comparisons
                    if (this.value_ < otherLeaf.value_) {
                        return -1;
                    }
                    else if (this.value_ === otherLeaf.value_) {
                        return 0;
                    }
                    else {
                        return 1;
                    }
                }
            }
            else {
                return thisIndex - otherIndex;
            }
        }
        withIndex() {
            return this;
        }
        isIndexed() {
            return true;
        }
        equals(other) {
            if (other === this) {
                return true;
            }
            else if (other.isLeafNode()) {
                const otherLeaf = other;
                return (this.value_ === otherLeaf.value_ &&
                    this.priorityNode_.equals(otherLeaf.priorityNode_));
            }
            else {
                return false;
            }
        }
    }
    /**
     * The sort order for comparing leaf nodes of different types. If two leaf nodes have
     * the same type, the comparison falls back to their value
     */
    LeafNode.VALUE_TYPE_ORDER = ['object', 'boolean', 'number', 'string'];

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let nodeFromJSON$1;
    let MAX_NODE$1;
    function setNodeFromJSON(val) {
        nodeFromJSON$1 = val;
    }
    function setMaxNode(val) {
        MAX_NODE$1 = val;
    }
    class PriorityIndex extends Index {
        compare(a, b) {
            const aPriority = a.node.getPriority();
            const bPriority = b.node.getPriority();
            const indexCmp = aPriority.compareTo(bPriority);
            if (indexCmp === 0) {
                return nameCompare(a.name, b.name);
            }
            else {
                return indexCmp;
            }
        }
        isDefinedOn(node) {
            return !node.getPriority().isEmpty();
        }
        indexedValueChanged(oldNode, newNode) {
            return !oldNode.getPriority().equals(newNode.getPriority());
        }
        minPost() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NamedNode.MIN;
        }
        maxPost() {
            return new NamedNode(MAX_NAME, new LeafNode('[PRIORITY-POST]', MAX_NODE$1));
        }
        makePost(indexValue, name) {
            const priorityNode = nodeFromJSON$1(indexValue);
            return new NamedNode(name, new LeafNode('[PRIORITY-POST]', priorityNode));
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
            return '.priority';
        }
    }
    const PRIORITY_INDEX = new PriorityIndex();

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const LOG_2 = Math.log(2);
    class Base12Num {
        constructor(length) {
            const logBase2 = (num) => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parseInt((Math.log(num) / LOG_2), 10);
            const bitMask = (bits) => parseInt(Array(bits + 1).join('1'), 2);
            this.count = logBase2(length + 1);
            this.current_ = this.count - 1;
            const mask = bitMask(this.count);
            this.bits_ = (length + 1) & mask;
        }
        nextBitIsOne() {
            //noinspection JSBitwiseOperatorUsage
            const result = !(this.bits_ & (0x1 << this.current_));
            this.current_--;
            return result;
        }
    }
    /**
     * Takes a list of child nodes and constructs a SortedSet using the given comparison
     * function
     *
     * Uses the algorithm described in the paper linked here:
     * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.46.1458
     *
     * @param childList - Unsorted list of children
     * @param cmp - The comparison method to be used
     * @param keyFn - An optional function to extract K from a node wrapper, if K's
     * type is not NamedNode
     * @param mapSortFn - An optional override for comparator used by the generated sorted map
     */
    const buildChildSet = function (childList, cmp, keyFn, mapSortFn) {
        childList.sort(cmp);
        const buildBalancedTree = function (low, high) {
            const length = high - low;
            let namedNode;
            let key;
            if (length === 0) {
                return null;
            }
            else if (length === 1) {
                namedNode = childList[low];
                key = keyFn ? keyFn(namedNode) : namedNode;
                return new LLRBNode(key, namedNode.node, LLRBNode.BLACK, null, null);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const middle = parseInt((length / 2), 10) + low;
                const left = buildBalancedTree(low, middle);
                const right = buildBalancedTree(middle + 1, high);
                namedNode = childList[middle];
                key = keyFn ? keyFn(namedNode) : namedNode;
                return new LLRBNode(key, namedNode.node, LLRBNode.BLACK, left, right);
            }
        };
        const buildFrom12Array = function (base12) {
            let node = null;
            let root = null;
            let index = childList.length;
            const buildPennant = function (chunkSize, color) {
                const low = index - chunkSize;
                const high = index;
                index -= chunkSize;
                const childTree = buildBalancedTree(low + 1, high);
                const namedNode = childList[low];
                const key = keyFn ? keyFn(namedNode) : namedNode;
                attachPennant(new LLRBNode(key, namedNode.node, color, null, childTree));
            };
            const attachPennant = function (pennant) {
                if (node) {
                    node.left = pennant;
                    node = pennant;
                }
                else {
                    root = pennant;
                    node = pennant;
                }
            };
            for (let i = 0; i < base12.count; ++i) {
                const isOne = base12.nextBitIsOne();
                // The number of nodes taken in each slice is 2^(arr.length - (i + 1))
                const chunkSize = Math.pow(2, base12.count - (i + 1));
                if (isOne) {
                    buildPennant(chunkSize, LLRBNode.BLACK);
                }
                else {
                    // current == 2
                    buildPennant(chunkSize, LLRBNode.BLACK);
                    buildPennant(chunkSize, LLRBNode.RED);
                }
            }
            return root;
        };
        const base12 = new Base12Num(childList.length);
        const root = buildFrom12Array(base12);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new SortedMap(mapSortFn || cmp, root);
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let _defaultIndexMap;
    const fallbackObject = {};
    class IndexMap {
        constructor(indexes_, indexSet_) {
            this.indexes_ = indexes_;
            this.indexSet_ = indexSet_;
        }
        /**
         * The default IndexMap for nodes without a priority
         */
        static get Default() {
            assert(fallbackObject && PRIORITY_INDEX, 'ChildrenNode.ts has not been loaded');
            _defaultIndexMap =
                _defaultIndexMap ||
                    new IndexMap({ '.priority': fallbackObject }, { '.priority': PRIORITY_INDEX });
            return _defaultIndexMap;
        }
        get(indexKey) {
            const sortedMap = safeGet(this.indexes_, indexKey);
            if (!sortedMap) {
                throw new Error('No index defined for ' + indexKey);
            }
            if (sortedMap instanceof SortedMap) {
                return sortedMap;
            }
            else {
                // The index exists, but it falls back to just name comparison. Return null so that the calling code uses the
                // regular child map
                return null;
            }
        }
        hasIndex(indexDefinition) {
            return contains(this.indexSet_, indexDefinition.toString());
        }
        addIndex(indexDefinition, existingChildren) {
            assert(indexDefinition !== KEY_INDEX, "KeyIndex always exists and isn't meant to be added to the IndexMap.");
            const childList = [];
            let sawIndexedValue = false;
            const iter = existingChildren.getIterator(NamedNode.Wrap);
            let next = iter.getNext();
            while (next) {
                sawIndexedValue =
                    sawIndexedValue || indexDefinition.isDefinedOn(next.node);
                childList.push(next);
                next = iter.getNext();
            }
            let newIndex;
            if (sawIndexedValue) {
                newIndex = buildChildSet(childList, indexDefinition.getCompare());
            }
            else {
                newIndex = fallbackObject;
            }
            const indexName = indexDefinition.toString();
            const newIndexSet = Object.assign({}, this.indexSet_);
            newIndexSet[indexName] = indexDefinition;
            const newIndexes = Object.assign({}, this.indexes_);
            newIndexes[indexName] = newIndex;
            return new IndexMap(newIndexes, newIndexSet);
        }
        /**
         * Ensure that this node is properly tracked in any indexes that we're maintaining
         */
        addToIndexes(namedNode, existingChildren) {
            const newIndexes = map(this.indexes_, (indexedChildren, indexName) => {
                const index = safeGet(this.indexSet_, indexName);
                assert(index, 'Missing index implementation for ' + indexName);
                if (indexedChildren === fallbackObject) {
                    // Check to see if we need to index everything
                    if (index.isDefinedOn(namedNode.node)) {
                        // We need to build this index
                        const childList = [];
                        const iter = existingChildren.getIterator(NamedNode.Wrap);
                        let next = iter.getNext();
                        while (next) {
                            if (next.name !== namedNode.name) {
                                childList.push(next);
                            }
                            next = iter.getNext();
                        }
                        childList.push(namedNode);
                        return buildChildSet(childList, index.getCompare());
                    }
                    else {
                        // No change, this remains a fallback
                        return fallbackObject;
                    }
                }
                else {
                    const existingSnap = existingChildren.get(namedNode.name);
                    let newChildren = indexedChildren;
                    if (existingSnap) {
                        newChildren = newChildren.remove(new NamedNode(namedNode.name, existingSnap));
                    }
                    return newChildren.insert(namedNode, namedNode.node);
                }
            });
            return new IndexMap(newIndexes, this.indexSet_);
        }
        /**
         * Create a new IndexMap instance with the given value removed
         */
        removeFromIndexes(namedNode, existingChildren) {
            const newIndexes = map(this.indexes_, (indexedChildren) => {
                if (indexedChildren === fallbackObject) {
                    // This is the fallback. Just return it, nothing to do in this case
                    return indexedChildren;
                }
                else {
                    const existingSnap = existingChildren.get(namedNode.name);
                    if (existingSnap) {
                        return indexedChildren.remove(new NamedNode(namedNode.name, existingSnap));
                    }
                    else {
                        // No record of this child
                        return indexedChildren;
                    }
                }
            });
            return new IndexMap(newIndexes, this.indexSet_);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // TODO: For memory savings, don't store priorityNode_ if it's empty.
    let EMPTY_NODE;
    /**
     * ChildrenNode is a class for storing internal nodes in a DataSnapshot
     * (i.e. nodes with children).  It implements Node and stores the
     * list of children in the children property, sorted by child name.
     */
    class ChildrenNode {
        /**
         * @param children_ - List of children of this node..
         * @param priorityNode_ - The priority of this node (as a snapshot node).
         */
        constructor(children_, priorityNode_, indexMap_) {
            this.children_ = children_;
            this.priorityNode_ = priorityNode_;
            this.indexMap_ = indexMap_;
            this.lazyHash_ = null;
            /**
             * Note: The only reason we allow null priority is for EMPTY_NODE, since we can't use
             * EMPTY_NODE as the priority of EMPTY_NODE.  We might want to consider making EMPTY_NODE its own
             * class instead of an empty ChildrenNode.
             */
            if (this.priorityNode_) {
                validatePriorityNode(this.priorityNode_);
            }
            if (this.children_.isEmpty()) {
                assert(!this.priorityNode_ || this.priorityNode_.isEmpty(), 'An empty node cannot have a priority');
            }
        }
        static get EMPTY_NODE() {
            return (EMPTY_NODE ||
                (EMPTY_NODE = new ChildrenNode(new SortedMap(NAME_COMPARATOR), null, IndexMap.Default)));
        }
        /** @inheritDoc */
        isLeafNode() {
            return false;
        }
        /** @inheritDoc */
        getPriority() {
            return this.priorityNode_ || EMPTY_NODE;
        }
        /** @inheritDoc */
        updatePriority(newPriorityNode) {
            if (this.children_.isEmpty()) {
                // Don't allow priorities on empty nodes
                return this;
            }
            else {
                return new ChildrenNode(this.children_, newPriorityNode, this.indexMap_);
            }
        }
        /** @inheritDoc */
        getImmediateChild(childName) {
            // Hack to treat priority as a regular child
            if (childName === '.priority') {
                return this.getPriority();
            }
            else {
                const child = this.children_.get(childName);
                return child === null ? EMPTY_NODE : child;
            }
        }
        /** @inheritDoc */
        getChild(path) {
            const front = pathGetFront(path);
            if (front === null) {
                return this;
            }
            return this.getImmediateChild(front).getChild(pathPopFront(path));
        }
        /** @inheritDoc */
        hasChild(childName) {
            return this.children_.get(childName) !== null;
        }
        /** @inheritDoc */
        updateImmediateChild(childName, newChildNode) {
            assert(newChildNode, 'We should always be passing snapshot nodes');
            if (childName === '.priority') {
                return this.updatePriority(newChildNode);
            }
            else {
                const namedNode = new NamedNode(childName, newChildNode);
                let newChildren, newIndexMap;
                if (newChildNode.isEmpty()) {
                    newChildren = this.children_.remove(childName);
                    newIndexMap = this.indexMap_.removeFromIndexes(namedNode, this.children_);
                }
                else {
                    newChildren = this.children_.insert(childName, newChildNode);
                    newIndexMap = this.indexMap_.addToIndexes(namedNode, this.children_);
                }
                const newPriority = newChildren.isEmpty()
                    ? EMPTY_NODE
                    : this.priorityNode_;
                return new ChildrenNode(newChildren, newPriority, newIndexMap);
            }
        }
        /** @inheritDoc */
        updateChild(path, newChildNode) {
            const front = pathGetFront(path);
            if (front === null) {
                return newChildNode;
            }
            else {
                assert(pathGetFront(path) !== '.priority' || pathGetLength(path) === 1, '.priority must be the last token in a path');
                const newImmediateChild = this.getImmediateChild(front).updateChild(pathPopFront(path), newChildNode);
                return this.updateImmediateChild(front, newImmediateChild);
            }
        }
        /** @inheritDoc */
        isEmpty() {
            return this.children_.isEmpty();
        }
        /** @inheritDoc */
        numChildren() {
            return this.children_.count();
        }
        /** @inheritDoc */
        val(exportFormat) {
            if (this.isEmpty()) {
                return null;
            }
            const obj = {};
            let numKeys = 0, maxKey = 0, allIntegerKeys = true;
            this.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                obj[key] = childNode.val(exportFormat);
                numKeys++;
                if (allIntegerKeys && ChildrenNode.INTEGER_REGEXP_.test(key)) {
                    maxKey = Math.max(maxKey, Number(key));
                }
                else {
                    allIntegerKeys = false;
                }
            });
            if (!exportFormat && allIntegerKeys && maxKey < 2 * numKeys) {
                // convert to array.
                const array = [];
                // eslint-disable-next-line guard-for-in
                for (const key in obj) {
                    array[key] = obj[key];
                }
                return array;
            }
            else {
                if (exportFormat && !this.getPriority().isEmpty()) {
                    obj['.priority'] = this.getPriority().val();
                }
                return obj;
            }
        }
        /** @inheritDoc */
        hash() {
            if (this.lazyHash_ === null) {
                let toHash = '';
                if (!this.getPriority().isEmpty()) {
                    toHash +=
                        'priority:' +
                            priorityHashText(this.getPriority().val()) +
                            ':';
                }
                this.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                    const childHash = childNode.hash();
                    if (childHash !== '') {
                        toHash += ':' + key + ':' + childHash;
                    }
                });
                this.lazyHash_ = toHash === '' ? '' : sha1(toHash);
            }
            return this.lazyHash_;
        }
        /** @inheritDoc */
        getPredecessorChildName(childName, childNode, index) {
            const idx = this.resolveIndex_(index);
            if (idx) {
                const predecessor = idx.getPredecessorKey(new NamedNode(childName, childNode));
                return predecessor ? predecessor.name : null;
            }
            else {
                return this.children_.getPredecessorKey(childName);
            }
        }
        getFirstChildName(indexDefinition) {
            const idx = this.resolveIndex_(indexDefinition);
            if (idx) {
                const minKey = idx.minKey();
                return minKey && minKey.name;
            }
            else {
                return this.children_.minKey();
            }
        }
        getFirstChild(indexDefinition) {
            const minKey = this.getFirstChildName(indexDefinition);
            if (minKey) {
                return new NamedNode(minKey, this.children_.get(minKey));
            }
            else {
                return null;
            }
        }
        /**
         * Given an index, return the key name of the largest value we have, according to that index
         */
        getLastChildName(indexDefinition) {
            const idx = this.resolveIndex_(indexDefinition);
            if (idx) {
                const maxKey = idx.maxKey();
                return maxKey && maxKey.name;
            }
            else {
                return this.children_.maxKey();
            }
        }
        getLastChild(indexDefinition) {
            const maxKey = this.getLastChildName(indexDefinition);
            if (maxKey) {
                return new NamedNode(maxKey, this.children_.get(maxKey));
            }
            else {
                return null;
            }
        }
        forEachChild(index, action) {
            const idx = this.resolveIndex_(index);
            if (idx) {
                return idx.inorderTraversal(wrappedNode => {
                    return action(wrappedNode.name, wrappedNode.node);
                });
            }
            else {
                return this.children_.inorderTraversal(action);
            }
        }
        getIterator(indexDefinition) {
            return this.getIteratorFrom(indexDefinition.minPost(), indexDefinition);
        }
        getIteratorFrom(startPost, indexDefinition) {
            const idx = this.resolveIndex_(indexDefinition);
            if (idx) {
                return idx.getIteratorFrom(startPost, key => key);
            }
            else {
                const iterator = this.children_.getIteratorFrom(startPost.name, NamedNode.Wrap);
                let next = iterator.peek();
                while (next != null && indexDefinition.compare(next, startPost) < 0) {
                    iterator.getNext();
                    next = iterator.peek();
                }
                return iterator;
            }
        }
        getReverseIterator(indexDefinition) {
            return this.getReverseIteratorFrom(indexDefinition.maxPost(), indexDefinition);
        }
        getReverseIteratorFrom(endPost, indexDefinition) {
            const idx = this.resolveIndex_(indexDefinition);
            if (idx) {
                return idx.getReverseIteratorFrom(endPost, key => {
                    return key;
                });
            }
            else {
                const iterator = this.children_.getReverseIteratorFrom(endPost.name, NamedNode.Wrap);
                let next = iterator.peek();
                while (next != null && indexDefinition.compare(next, endPost) > 0) {
                    iterator.getNext();
                    next = iterator.peek();
                }
                return iterator;
            }
        }
        compareTo(other) {
            if (this.isEmpty()) {
                if (other.isEmpty()) {
                    return 0;
                }
                else {
                    return -1;
                }
            }
            else if (other.isLeafNode() || other.isEmpty()) {
                return 1;
            }
            else if (other === MAX_NODE) {
                return -1;
            }
            else {
                // Must be another node with children.
                return 0;
            }
        }
        withIndex(indexDefinition) {
            if (indexDefinition === KEY_INDEX ||
                this.indexMap_.hasIndex(indexDefinition)) {
                return this;
            }
            else {
                const newIndexMap = this.indexMap_.addIndex(indexDefinition, this.children_);
                return new ChildrenNode(this.children_, this.priorityNode_, newIndexMap);
            }
        }
        isIndexed(index) {
            return index === KEY_INDEX || this.indexMap_.hasIndex(index);
        }
        equals(other) {
            if (other === this) {
                return true;
            }
            else if (other.isLeafNode()) {
                return false;
            }
            else {
                const otherChildrenNode = other;
                if (!this.getPriority().equals(otherChildrenNode.getPriority())) {
                    return false;
                }
                else if (this.children_.count() === otherChildrenNode.children_.count()) {
                    const thisIter = this.getIterator(PRIORITY_INDEX);
                    const otherIter = otherChildrenNode.getIterator(PRIORITY_INDEX);
                    let thisCurrent = thisIter.getNext();
                    let otherCurrent = otherIter.getNext();
                    while (thisCurrent && otherCurrent) {
                        if (thisCurrent.name !== otherCurrent.name ||
                            !thisCurrent.node.equals(otherCurrent.node)) {
                            return false;
                        }
                        thisCurrent = thisIter.getNext();
                        otherCurrent = otherIter.getNext();
                    }
                    return thisCurrent === null && otherCurrent === null;
                }
                else {
                    return false;
                }
            }
        }
        /**
         * Returns a SortedMap ordered by index, or null if the default (by-key) ordering can be used
         * instead.
         *
         */
        resolveIndex_(indexDefinition) {
            if (indexDefinition === KEY_INDEX) {
                return null;
            }
            else {
                return this.indexMap_.get(indexDefinition.toString());
            }
        }
    }
    ChildrenNode.INTEGER_REGEXP_ = /^(0|[1-9]\d*)$/;
    class MaxNode extends ChildrenNode {
        constructor() {
            super(new SortedMap(NAME_COMPARATOR), ChildrenNode.EMPTY_NODE, IndexMap.Default);
        }
        compareTo(other) {
            if (other === this) {
                return 0;
            }
            else {
                return 1;
            }
        }
        equals(other) {
            // Not that we every compare it, but MAX_NODE is only ever equal to itself
            return other === this;
        }
        getPriority() {
            return this;
        }
        getImmediateChild(childName) {
            return ChildrenNode.EMPTY_NODE;
        }
        isEmpty() {
            return false;
        }
    }
    /**
     * Marker that will sort higher than any other snapshot.
     */
    const MAX_NODE = new MaxNode();
    Object.defineProperties(NamedNode, {
        MIN: {
            value: new NamedNode(MIN_NAME, ChildrenNode.EMPTY_NODE)
        },
        MAX: {
            value: new NamedNode(MAX_NAME, MAX_NODE)
        }
    });
    /**
     * Reference Extensions
     */
    KeyIndex.__EMPTY_NODE = ChildrenNode.EMPTY_NODE;
    LeafNode.__childrenNodeConstructor = ChildrenNode;
    setMaxNode$1(MAX_NODE);
    setMaxNode(MAX_NODE);

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const USE_HINZE = true;
    /**
     * Constructs a snapshot node representing the passed JSON and returns it.
     * @param json - JSON to create a node for.
     * @param priority - Optional priority to use.  This will be ignored if the
     * passed JSON contains a .priority property.
     */
    function nodeFromJSON(json, priority = null) {
        if (json === null) {
            return ChildrenNode.EMPTY_NODE;
        }
        if (typeof json === 'object' && '.priority' in json) {
            priority = json['.priority'];
        }
        assert(priority === null ||
            typeof priority === 'string' ||
            typeof priority === 'number' ||
            (typeof priority === 'object' && '.sv' in priority), 'Invalid priority type found: ' + typeof priority);
        if (typeof json === 'object' && '.value' in json && json['.value'] !== null) {
            json = json['.value'];
        }
        // Valid leaf nodes include non-objects or server-value wrapper objects
        if (typeof json !== 'object' || '.sv' in json) {
            const jsonLeaf = json;
            return new LeafNode(jsonLeaf, nodeFromJSON(priority));
        }
        if (!(json instanceof Array) && USE_HINZE) {
            const children = [];
            let childrenHavePriority = false;
            const hinzeJsonObj = json;
            each(hinzeJsonObj, (key, child) => {
                if (key.substring(0, 1) !== '.') {
                    // Ignore metadata nodes
                    const childNode = nodeFromJSON(child);
                    if (!childNode.isEmpty()) {
                        childrenHavePriority =
                            childrenHavePriority || !childNode.getPriority().isEmpty();
                        children.push(new NamedNode(key, childNode));
                    }
                }
            });
            if (children.length === 0) {
                return ChildrenNode.EMPTY_NODE;
            }
            const childSet = buildChildSet(children, NAME_ONLY_COMPARATOR, namedNode => namedNode.name, NAME_COMPARATOR);
            if (childrenHavePriority) {
                const sortedChildSet = buildChildSet(children, PRIORITY_INDEX.getCompare());
                return new ChildrenNode(childSet, nodeFromJSON(priority), new IndexMap({ '.priority': sortedChildSet }, { '.priority': PRIORITY_INDEX }));
            }
            else {
                return new ChildrenNode(childSet, nodeFromJSON(priority), IndexMap.Default);
            }
        }
        else {
            let node = ChildrenNode.EMPTY_NODE;
            each(json, (key, childData) => {
                if (contains(json, key)) {
                    if (key.substring(0, 1) !== '.') {
                        // ignore metadata nodes.
                        const childNode = nodeFromJSON(childData);
                        if (childNode.isLeafNode() || !childNode.isEmpty()) {
                            node = node.updateImmediateChild(key, childNode);
                        }
                    }
                }
            });
            return node.updatePriority(nodeFromJSON(priority));
        }
    }
    setNodeFromJSON(nodeFromJSON);

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class PathIndex extends Index {
        constructor(indexPath_) {
            super();
            this.indexPath_ = indexPath_;
            assert(!pathIsEmpty(indexPath_) && pathGetFront(indexPath_) !== '.priority', "Can't create PathIndex with empty path or .priority key");
        }
        extractChild(snap) {
            return snap.getChild(this.indexPath_);
        }
        isDefinedOn(node) {
            return !node.getChild(this.indexPath_).isEmpty();
        }
        compare(a, b) {
            const aChild = this.extractChild(a.node);
            const bChild = this.extractChild(b.node);
            const indexCmp = aChild.compareTo(bChild);
            if (indexCmp === 0) {
                return nameCompare(a.name, b.name);
            }
            else {
                return indexCmp;
            }
        }
        makePost(indexValue, name) {
            const valueNode = nodeFromJSON(indexValue);
            const node = ChildrenNode.EMPTY_NODE.updateChild(this.indexPath_, valueNode);
            return new NamedNode(name, node);
        }
        maxPost() {
            const node = ChildrenNode.EMPTY_NODE.updateChild(this.indexPath_, MAX_NODE);
            return new NamedNode(MAX_NAME, node);
        }
        toString() {
            return pathSlice(this.indexPath_, 0).join('/');
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class ValueIndex extends Index {
        compare(a, b) {
            const indexCmp = a.node.compareTo(b.node);
            if (indexCmp === 0) {
                return nameCompare(a.name, b.name);
            }
            else {
                return indexCmp;
            }
        }
        isDefinedOn(node) {
            return true;
        }
        indexedValueChanged(oldNode, newNode) {
            return !oldNode.equals(newNode);
        }
        minPost() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NamedNode.MIN;
        }
        maxPost() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NamedNode.MAX;
        }
        makePost(indexValue, name) {
            const valueNode = nodeFromJSON(indexValue);
            return new NamedNode(name, valueNode);
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
            return '.value';
        }
    }
    const VALUE_INDEX = new ValueIndex();

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function changeValue(snapshotNode) {
        return { type: "value" /* VALUE */, snapshotNode };
    }
    function changeChildAdded(childName, snapshotNode) {
        return { type: "child_added" /* CHILD_ADDED */, snapshotNode, childName };
    }
    function changeChildRemoved(childName, snapshotNode) {
        return { type: "child_removed" /* CHILD_REMOVED */, snapshotNode, childName };
    }
    function changeChildChanged(childName, snapshotNode, oldSnap) {
        return {
            type: "child_changed" /* CHILD_CHANGED */,
            snapshotNode,
            childName,
            oldSnap
        };
    }
    function changeChildMoved(childName, snapshotNode) {
        return { type: "child_moved" /* CHILD_MOVED */, snapshotNode, childName };
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Doesn't really filter nodes but applies an index to the node and keeps track of any changes
     */
    class IndexedFilter {
        constructor(index_) {
            this.index_ = index_;
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
            assert(snap.isIndexed(this.index_), 'A node must be indexed if only a child is updated');
            const oldChild = snap.getImmediateChild(key);
            // Check if anything actually changed.
            if (oldChild.getChild(affectedPath).equals(newChild.getChild(affectedPath))) {
                // There's an edge case where a child can enter or leave the view because affectedPath was set to null.
                // In this case, affectedPath will appear null in both the old and new snapshots.  So we need
                // to avoid treating these cases as "nothing changed."
                if (oldChild.isEmpty() === newChild.isEmpty()) {
                    // Nothing changed.
                    // This assert should be valid, but it's expensive (can dominate perf testing) so don't actually do it.
                    //assert(oldChild.equals(newChild), 'Old and new snapshots should be equal.');
                    return snap;
                }
            }
            if (optChangeAccumulator != null) {
                if (newChild.isEmpty()) {
                    if (snap.hasChild(key)) {
                        optChangeAccumulator.trackChildChange(changeChildRemoved(key, oldChild));
                    }
                    else {
                        assert(snap.isLeafNode(), 'A child remove without an old child only makes sense on a leaf node');
                    }
                }
                else if (oldChild.isEmpty()) {
                    optChangeAccumulator.trackChildChange(changeChildAdded(key, newChild));
                }
                else {
                    optChangeAccumulator.trackChildChange(changeChildChanged(key, newChild, oldChild));
                }
            }
            if (snap.isLeafNode() && newChild.isEmpty()) {
                return snap;
            }
            else {
                // Make sure the node is indexed
                return snap.updateImmediateChild(key, newChild).withIndex(this.index_);
            }
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
            if (optChangeAccumulator != null) {
                if (!oldSnap.isLeafNode()) {
                    oldSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                        if (!newSnap.hasChild(key)) {
                            optChangeAccumulator.trackChildChange(changeChildRemoved(key, childNode));
                        }
                    });
                }
                if (!newSnap.isLeafNode()) {
                    newSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                        if (oldSnap.hasChild(key)) {
                            const oldChild = oldSnap.getImmediateChild(key);
                            if (!oldChild.equals(childNode)) {
                                optChangeAccumulator.trackChildChange(changeChildChanged(key, childNode, oldChild));
                            }
                        }
                        else {
                            optChangeAccumulator.trackChildChange(changeChildAdded(key, childNode));
                        }
                    });
                }
            }
            return newSnap.withIndex(this.index_);
        }
        updatePriority(oldSnap, newPriority) {
            if (oldSnap.isEmpty()) {
                return ChildrenNode.EMPTY_NODE;
            }
            else {
                return oldSnap.updatePriority(newPriority);
            }
        }
        filtersNodes() {
            return false;
        }
        getIndexedFilter() {
            return this;
        }
        getIndex() {
            return this.index_;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Filters nodes by range and uses an IndexFilter to track any changes after filtering the node
     */
    class RangedFilter {
        constructor(params) {
            this.indexedFilter_ = new IndexedFilter(params.getIndex());
            this.index_ = params.getIndex();
            this.startPost_ = RangedFilter.getStartPost_(params);
            this.endPost_ = RangedFilter.getEndPost_(params);
        }
        getStartPost() {
            return this.startPost_;
        }
        getEndPost() {
            return this.endPost_;
        }
        matches(node) {
            return (this.index_.compare(this.getStartPost(), node) <= 0 &&
                this.index_.compare(node, this.getEndPost()) <= 0);
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
            if (!this.matches(new NamedNode(key, newChild))) {
                newChild = ChildrenNode.EMPTY_NODE;
            }
            return this.indexedFilter_.updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
            if (newSnap.isLeafNode()) {
                // Make sure we have a children node with the correct index, not a leaf node;
                newSnap = ChildrenNode.EMPTY_NODE;
            }
            let filtered = newSnap.withIndex(this.index_);
            // Don't support priorities on queries
            filtered = filtered.updatePriority(ChildrenNode.EMPTY_NODE);
            const self = this;
            newSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                if (!self.matches(new NamedNode(key, childNode))) {
                    filtered = filtered.updateImmediateChild(key, ChildrenNode.EMPTY_NODE);
                }
            });
            return this.indexedFilter_.updateFullNode(oldSnap, filtered, optChangeAccumulator);
        }
        updatePriority(oldSnap, newPriority) {
            // Don't support priorities on queries
            return oldSnap;
        }
        filtersNodes() {
            return true;
        }
        getIndexedFilter() {
            return this.indexedFilter_;
        }
        getIndex() {
            return this.index_;
        }
        static getStartPost_(params) {
            if (params.hasStart()) {
                const startName = params.getIndexStartName();
                return params.getIndex().makePost(params.getIndexStartValue(), startName);
            }
            else {
                return params.getIndex().minPost();
            }
        }
        static getEndPost_(params) {
            if (params.hasEnd()) {
                const endName = params.getIndexEndName();
                return params.getIndex().makePost(params.getIndexEndValue(), endName);
            }
            else {
                return params.getIndex().maxPost();
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Applies a limit and a range to a node and uses RangedFilter to do the heavy lifting where possible
     */
    class LimitedFilter {
        constructor(params) {
            this.rangedFilter_ = new RangedFilter(params);
            this.index_ = params.getIndex();
            this.limit_ = params.getLimit();
            this.reverse_ = !params.isViewFromLeft();
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
            if (!this.rangedFilter_.matches(new NamedNode(key, newChild))) {
                newChild = ChildrenNode.EMPTY_NODE;
            }
            if (snap.getImmediateChild(key).equals(newChild)) {
                // No change
                return snap;
            }
            else if (snap.numChildren() < this.limit_) {
                return this.rangedFilter_
                    .getIndexedFilter()
                    .updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
            }
            else {
                return this.fullLimitUpdateChild_(snap, key, newChild, source, optChangeAccumulator);
            }
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
            let filtered;
            if (newSnap.isLeafNode() || newSnap.isEmpty()) {
                // Make sure we have a children node with the correct index, not a leaf node;
                filtered = ChildrenNode.EMPTY_NODE.withIndex(this.index_);
            }
            else {
                if (this.limit_ * 2 < newSnap.numChildren() &&
                    newSnap.isIndexed(this.index_)) {
                    // Easier to build up a snapshot, since what we're given has more than twice the elements we want
                    filtered = ChildrenNode.EMPTY_NODE.withIndex(this.index_);
                    // anchor to the startPost, endPost, or last element as appropriate
                    let iterator;
                    if (this.reverse_) {
                        iterator = newSnap.getReverseIteratorFrom(this.rangedFilter_.getEndPost(), this.index_);
                    }
                    else {
                        iterator = newSnap.getIteratorFrom(this.rangedFilter_.getStartPost(), this.index_);
                    }
                    let count = 0;
                    while (iterator.hasNext() && count < this.limit_) {
                        const next = iterator.getNext();
                        let inRange;
                        if (this.reverse_) {
                            inRange =
                                this.index_.compare(this.rangedFilter_.getStartPost(), next) <= 0;
                        }
                        else {
                            inRange =
                                this.index_.compare(next, this.rangedFilter_.getEndPost()) <= 0;
                        }
                        if (inRange) {
                            filtered = filtered.updateImmediateChild(next.name, next.node);
                            count++;
                        }
                        else {
                            // if we have reached the end post, we cannot keep adding elemments
                            break;
                        }
                    }
                }
                else {
                    // The snap contains less than twice the limit. Faster to delete from the snap than build up a new one
                    filtered = newSnap.withIndex(this.index_);
                    // Don't support priorities on queries
                    filtered = filtered.updatePriority(ChildrenNode.EMPTY_NODE);
                    let startPost;
                    let endPost;
                    let cmp;
                    let iterator;
                    if (this.reverse_) {
                        iterator = filtered.getReverseIterator(this.index_);
                        startPost = this.rangedFilter_.getEndPost();
                        endPost = this.rangedFilter_.getStartPost();
                        const indexCompare = this.index_.getCompare();
                        cmp = (a, b) => indexCompare(b, a);
                    }
                    else {
                        iterator = filtered.getIterator(this.index_);
                        startPost = this.rangedFilter_.getStartPost();
                        endPost = this.rangedFilter_.getEndPost();
                        cmp = this.index_.getCompare();
                    }
                    let count = 0;
                    let foundStartPost = false;
                    while (iterator.hasNext()) {
                        const next = iterator.getNext();
                        if (!foundStartPost && cmp(startPost, next) <= 0) {
                            // start adding
                            foundStartPost = true;
                        }
                        const inRange = foundStartPost && count < this.limit_ && cmp(next, endPost) <= 0;
                        if (inRange) {
                            count++;
                        }
                        else {
                            filtered = filtered.updateImmediateChild(next.name, ChildrenNode.EMPTY_NODE);
                        }
                    }
                }
            }
            return this.rangedFilter_
                .getIndexedFilter()
                .updateFullNode(oldSnap, filtered, optChangeAccumulator);
        }
        updatePriority(oldSnap, newPriority) {
            // Don't support priorities on queries
            return oldSnap;
        }
        filtersNodes() {
            return true;
        }
        getIndexedFilter() {
            return this.rangedFilter_.getIndexedFilter();
        }
        getIndex() {
            return this.index_;
        }
        fullLimitUpdateChild_(snap, childKey, childSnap, source, changeAccumulator) {
            // TODO: rename all cache stuff etc to general snap terminology
            let cmp;
            if (this.reverse_) {
                const indexCmp = this.index_.getCompare();
                cmp = (a, b) => indexCmp(b, a);
            }
            else {
                cmp = this.index_.getCompare();
            }
            const oldEventCache = snap;
            assert(oldEventCache.numChildren() === this.limit_, '');
            const newChildNamedNode = new NamedNode(childKey, childSnap);
            const windowBoundary = this.reverse_
                ? oldEventCache.getFirstChild(this.index_)
                : oldEventCache.getLastChild(this.index_);
            const inRange = this.rangedFilter_.matches(newChildNamedNode);
            if (oldEventCache.hasChild(childKey)) {
                const oldChildSnap = oldEventCache.getImmediateChild(childKey);
                let nextChild = source.getChildAfterChild(this.index_, windowBoundary, this.reverse_);
                while (nextChild != null &&
                    (nextChild.name === childKey || oldEventCache.hasChild(nextChild.name))) {
                    // There is a weird edge case where a node is updated as part of a merge in the write tree, but hasn't
                    // been applied to the limited filter yet. Ignore this next child which will be updated later in
                    // the limited filter...
                    nextChild = source.getChildAfterChild(this.index_, nextChild, this.reverse_);
                }
                const compareNext = nextChild == null ? 1 : cmp(nextChild, newChildNamedNode);
                const remainsInWindow = inRange && !childSnap.isEmpty() && compareNext >= 0;
                if (remainsInWindow) {
                    if (changeAccumulator != null) {
                        changeAccumulator.trackChildChange(changeChildChanged(childKey, childSnap, oldChildSnap));
                    }
                    return oldEventCache.updateImmediateChild(childKey, childSnap);
                }
                else {
                    if (changeAccumulator != null) {
                        changeAccumulator.trackChildChange(changeChildRemoved(childKey, oldChildSnap));
                    }
                    const newEventCache = oldEventCache.updateImmediateChild(childKey, ChildrenNode.EMPTY_NODE);
                    const nextChildInRange = nextChild != null && this.rangedFilter_.matches(nextChild);
                    if (nextChildInRange) {
                        if (changeAccumulator != null) {
                            changeAccumulator.trackChildChange(changeChildAdded(nextChild.name, nextChild.node));
                        }
                        return newEventCache.updateImmediateChild(nextChild.name, nextChild.node);
                    }
                    else {
                        return newEventCache;
                    }
                }
            }
            else if (childSnap.isEmpty()) {
                // we're deleting a node, but it was not in the window, so ignore it
                return snap;
            }
            else if (inRange) {
                if (cmp(windowBoundary, newChildNamedNode) >= 0) {
                    if (changeAccumulator != null) {
                        changeAccumulator.trackChildChange(changeChildRemoved(windowBoundary.name, windowBoundary.node));
                        changeAccumulator.trackChildChange(changeChildAdded(childKey, childSnap));
                    }
                    return oldEventCache
                        .updateImmediateChild(childKey, childSnap)
                        .updateImmediateChild(windowBoundary.name, ChildrenNode.EMPTY_NODE);
                }
                else {
                    return snap;
                }
            }
            else {
                return snap;
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * This class is an immutable-from-the-public-api struct containing a set of query parameters defining a
     * range to be returned for a particular location. It is assumed that validation of parameters is done at the
     * user-facing API level, so it is not done here.
     *
     * @internal
     */
    class QueryParams {
        constructor() {
            this.limitSet_ = false;
            this.startSet_ = false;
            this.startNameSet_ = false;
            this.startAfterSet_ = false;
            this.endSet_ = false;
            this.endNameSet_ = false;
            this.endBeforeSet_ = false;
            this.limit_ = 0;
            this.viewFrom_ = '';
            this.indexStartValue_ = null;
            this.indexStartName_ = '';
            this.indexEndValue_ = null;
            this.indexEndName_ = '';
            this.index_ = PRIORITY_INDEX;
        }
        hasStart() {
            return this.startSet_;
        }
        hasStartAfter() {
            return this.startAfterSet_;
        }
        hasEndBefore() {
            return this.endBeforeSet_;
        }
        /**
         * @returns True if it would return from left.
         */
        isViewFromLeft() {
            if (this.viewFrom_ === '') {
                // limit(), rather than limitToFirst or limitToLast was called.
                // This means that only one of startSet_ and endSet_ is true. Use them
                // to calculate which side of the view to anchor to. If neither is set,
                // anchor to the end.
                return this.startSet_;
            }
            else {
                return this.viewFrom_ === "l" /* VIEW_FROM_LEFT */;
            }
        }
        /**
         * Only valid to call if hasStart() returns true
         */
        getIndexStartValue() {
            assert(this.startSet_, 'Only valid if start has been set');
            return this.indexStartValue_;
        }
        /**
         * Only valid to call if hasStart() returns true.
         * Returns the starting key name for the range defined by these query parameters
         */
        getIndexStartName() {
            assert(this.startSet_, 'Only valid if start has been set');
            if (this.startNameSet_) {
                return this.indexStartName_;
            }
            else {
                return MIN_NAME;
            }
        }
        hasEnd() {
            return this.endSet_;
        }
        /**
         * Only valid to call if hasEnd() returns true.
         */
        getIndexEndValue() {
            assert(this.endSet_, 'Only valid if end has been set');
            return this.indexEndValue_;
        }
        /**
         * Only valid to call if hasEnd() returns true.
         * Returns the end key name for the range defined by these query parameters
         */
        getIndexEndName() {
            assert(this.endSet_, 'Only valid if end has been set');
            if (this.endNameSet_) {
                return this.indexEndName_;
            }
            else {
                return MAX_NAME;
            }
        }
        hasLimit() {
            return this.limitSet_;
        }
        /**
         * @returns True if a limit has been set and it has been explicitly anchored
         */
        hasAnchoredLimit() {
            return this.limitSet_ && this.viewFrom_ !== '';
        }
        /**
         * Only valid to call if hasLimit() returns true
         */
        getLimit() {
            assert(this.limitSet_, 'Only valid if limit has been set');
            return this.limit_;
        }
        getIndex() {
            return this.index_;
        }
        loadsAllData() {
            return !(this.startSet_ || this.endSet_ || this.limitSet_);
        }
        isDefault() {
            return this.loadsAllData() && this.index_ === PRIORITY_INDEX;
        }
        copy() {
            const copy = new QueryParams();
            copy.limitSet_ = this.limitSet_;
            copy.limit_ = this.limit_;
            copy.startSet_ = this.startSet_;
            copy.indexStartValue_ = this.indexStartValue_;
            copy.startNameSet_ = this.startNameSet_;
            copy.indexStartName_ = this.indexStartName_;
            copy.endSet_ = this.endSet_;
            copy.indexEndValue_ = this.indexEndValue_;
            copy.endNameSet_ = this.endNameSet_;
            copy.indexEndName_ = this.indexEndName_;
            copy.index_ = this.index_;
            copy.viewFrom_ = this.viewFrom_;
            return copy;
        }
    }
    function queryParamsGetNodeFilter(queryParams) {
        if (queryParams.loadsAllData()) {
            return new IndexedFilter(queryParams.getIndex());
        }
        else if (queryParams.hasLimit()) {
            return new LimitedFilter(queryParams);
        }
        else {
            return new RangedFilter(queryParams);
        }
    }
    /**
     * Returns a set of REST query string parameters representing this query.
     *
     * @returns query string parameters
     */
    function queryParamsToRestQueryStringParameters(queryParams) {
        const qs = {};
        if (queryParams.isDefault()) {
            return qs;
        }
        let orderBy;
        if (queryParams.index_ === PRIORITY_INDEX) {
            orderBy = "$priority" /* PRIORITY_INDEX */;
        }
        else if (queryParams.index_ === VALUE_INDEX) {
            orderBy = "$value" /* VALUE_INDEX */;
        }
        else if (queryParams.index_ === KEY_INDEX) {
            orderBy = "$key" /* KEY_INDEX */;
        }
        else {
            assert(queryParams.index_ instanceof PathIndex, 'Unrecognized index type!');
            orderBy = queryParams.index_.toString();
        }
        qs["orderBy" /* ORDER_BY */] = stringify(orderBy);
        if (queryParams.startSet_) {
            qs["startAt" /* START_AT */] = stringify(queryParams.indexStartValue_);
            if (queryParams.startNameSet_) {
                qs["startAt" /* START_AT */] +=
                    ',' + stringify(queryParams.indexStartName_);
            }
        }
        if (queryParams.endSet_) {
            qs["endAt" /* END_AT */] = stringify(queryParams.indexEndValue_);
            if (queryParams.endNameSet_) {
                qs["endAt" /* END_AT */] +=
                    ',' + stringify(queryParams.indexEndName_);
            }
        }
        if (queryParams.limitSet_) {
            if (queryParams.isViewFromLeft()) {
                qs["limitToFirst" /* LIMIT_TO_FIRST */] = queryParams.limit_;
            }
            else {
                qs["limitToLast" /* LIMIT_TO_LAST */] = queryParams.limit_;
            }
        }
        return qs;
    }
    function queryParamsGetQueryObject(queryParams) {
        const obj = {};
        if (queryParams.startSet_) {
            obj["sp" /* INDEX_START_VALUE */] =
                queryParams.indexStartValue_;
            if (queryParams.startNameSet_) {
                obj["sn" /* INDEX_START_NAME */] =
                    queryParams.indexStartName_;
            }
        }
        if (queryParams.endSet_) {
            obj["ep" /* INDEX_END_VALUE */] = queryParams.indexEndValue_;
            if (queryParams.endNameSet_) {
                obj["en" /* INDEX_END_NAME */] = queryParams.indexEndName_;
            }
        }
        if (queryParams.limitSet_) {
            obj["l" /* LIMIT */] = queryParams.limit_;
            let viewFrom = queryParams.viewFrom_;
            if (viewFrom === '') {
                if (queryParams.isViewFromLeft()) {
                    viewFrom = "l" /* VIEW_FROM_LEFT */;
                }
                else {
                    viewFrom = "r" /* VIEW_FROM_RIGHT */;
                }
            }
            obj["vf" /* VIEW_FROM */] = viewFrom;
        }
        // For now, priority index is the default, so we only specify if it's some other index
        if (queryParams.index_ !== PRIORITY_INDEX) {
            obj["i" /* INDEX */] = queryParams.index_.toString();
        }
        return obj;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * An implementation of ServerActions that communicates with the server via REST requests.
     * This is mostly useful for compatibility with crawlers, where we don't want to spin up a full
     * persistent connection (using WebSockets or long-polling)
     */
    class ReadonlyRestClient extends ServerActions {
        /**
         * @param repoInfo_ - Data about the namespace we are connecting to
         * @param onDataUpdate_ - A callback for new data from the server
         */
        constructor(repoInfo_, onDataUpdate_, authTokenProvider_, appCheckTokenProvider_) {
            super();
            this.repoInfo_ = repoInfo_;
            this.onDataUpdate_ = onDataUpdate_;
            this.authTokenProvider_ = authTokenProvider_;
            this.appCheckTokenProvider_ = appCheckTokenProvider_;
            /** @private {function(...[*])} */
            this.log_ = logWrapper('p:rest:');
            /**
             * We don't actually need to track listens, except to prevent us calling an onComplete for a listen
             * that's been removed. :-/
             */
            this.listens_ = {};
        }
        reportStats(stats) {
            throw new Error('Method not implemented.');
        }
        static getListenId_(query, tag) {
            if (tag !== undefined) {
                return 'tag$' + tag;
            }
            else {
                assert(query._queryParams.isDefault(), "should have a tag if it's not a default query.");
                return query._path.toString();
            }
        }
        /** @inheritDoc */
        listen(query, currentHashFn, tag, onComplete) {
            const pathString = query._path.toString();
            this.log_('Listen called for ' + pathString + ' ' + query._queryIdentifier);
            // Mark this listener so we can tell if it's removed.
            const listenId = ReadonlyRestClient.getListenId_(query, tag);
            const thisListen = {};
            this.listens_[listenId] = thisListen;
            const queryStringParameters = queryParamsToRestQueryStringParameters(query._queryParams);
            this.restRequest_(pathString + '.json', queryStringParameters, (error, result) => {
                let data = result;
                if (error === 404) {
                    data = null;
                    error = null;
                }
                if (error === null) {
                    this.onDataUpdate_(pathString, data, /*isMerge=*/ false, tag);
                }
                if (safeGet(this.listens_, listenId) === thisListen) {
                    let status;
                    if (!error) {
                        status = 'ok';
                    }
                    else if (error === 401) {
                        status = 'permission_denied';
                    }
                    else {
                        status = 'rest_error:' + error;
                    }
                    onComplete(status, null);
                }
            });
        }
        /** @inheritDoc */
        unlisten(query, tag) {
            const listenId = ReadonlyRestClient.getListenId_(query, tag);
            delete this.listens_[listenId];
        }
        get(query) {
            const queryStringParameters = queryParamsToRestQueryStringParameters(query._queryParams);
            const pathString = query._path.toString();
            const deferred = new Deferred();
            this.restRequest_(pathString + '.json', queryStringParameters, (error, result) => {
                let data = result;
                if (error === 404) {
                    data = null;
                    error = null;
                }
                if (error === null) {
                    this.onDataUpdate_(pathString, data, 
                    /*isMerge=*/ false, 
                    /*tag=*/ null);
                    deferred.resolve(data);
                }
                else {
                    deferred.reject(new Error(data));
                }
            });
            return deferred.promise;
        }
        /** @inheritDoc */
        refreshAuthToken(token) {
            // no-op since we just always call getToken.
        }
        /**
         * Performs a REST request to the given path, with the provided query string parameters,
         * and any auth credentials we have.
         */
        restRequest_(pathString, queryStringParameters = {}, callback) {
            queryStringParameters['format'] = 'export';
            return Promise.all([
                this.authTokenProvider_.getToken(/*forceRefresh=*/ false),
                this.appCheckTokenProvider_.getToken(/*forceRefresh=*/ false)
            ]).then(([authToken, appCheckToken]) => {
                if (authToken && authToken.accessToken) {
                    queryStringParameters['auth'] = authToken.accessToken;
                }
                if (appCheckToken && appCheckToken.token) {
                    queryStringParameters['ac'] = appCheckToken.token;
                }
                const url = (this.repoInfo_.secure ? 'https://' : 'http://') +
                    this.repoInfo_.host +
                    pathString +
                    '?' +
                    'ns=' +
                    this.repoInfo_.namespace +
                    querystring(queryStringParameters);
                this.log_('Sending REST request for ' + url);
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                    if (callback && xhr.readyState === 4) {
                        this.log_('REST Response for ' + url + ' received. status:', xhr.status, 'response:', xhr.responseText);
                        let res = null;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                res = jsonEval(xhr.responseText);
                            }
                            catch (e) {
                                warn('Failed to parse JSON response for ' +
                                    url +
                                    ': ' +
                                    xhr.responseText);
                            }
                            callback(null, res);
                        }
                        else {
                            // 401 and 404 are expected.
                            if (xhr.status !== 401 && xhr.status !== 404) {
                                warn('Got unsuccessful REST response for ' +
                                    url +
                                    ' Status: ' +
                                    xhr.status);
                            }
                            callback(xhr.status);
                        }
                        callback = null;
                    }
                };
                xhr.open('GET', url, /*asynchronous=*/ true);
                xhr.send();
            });
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Mutable object which basically just stores a reference to the "latest" immutable snapshot.
     */
    class SnapshotHolder {
        constructor() {
            this.rootNode_ = ChildrenNode.EMPTY_NODE;
        }
        getNode(path) {
            return this.rootNode_.getChild(path);
        }
        updateSnapshot(path, newSnapshotNode) {
            this.rootNode_ = this.rootNode_.updateChild(path, newSnapshotNode);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function newSparseSnapshotTree() {
        return {
            value: null,
            children: new Map()
        };
    }
    /**
     * Stores the given node at the specified path. If there is already a node
     * at a shallower path, it merges the new data into that snapshot node.
     *
     * @param path - Path to look up snapshot for.
     * @param data - The new data, or null.
     */
    function sparseSnapshotTreeRemember(sparseSnapshotTree, path, data) {
        if (pathIsEmpty(path)) {
            sparseSnapshotTree.value = data;
            sparseSnapshotTree.children.clear();
        }
        else if (sparseSnapshotTree.value !== null) {
            sparseSnapshotTree.value = sparseSnapshotTree.value.updateChild(path, data);
        }
        else {
            const childKey = pathGetFront(path);
            if (!sparseSnapshotTree.children.has(childKey)) {
                sparseSnapshotTree.children.set(childKey, newSparseSnapshotTree());
            }
            const child = sparseSnapshotTree.children.get(childKey);
            path = pathPopFront(path);
            sparseSnapshotTreeRemember(child, path, data);
        }
    }
    /**
     * Recursively iterates through all of the stored tree and calls the
     * callback on each one.
     *
     * @param prefixPath - Path to look up node for.
     * @param func - The function to invoke for each tree.
     */
    function sparseSnapshotTreeForEachTree(sparseSnapshotTree, prefixPath, func) {
        if (sparseSnapshotTree.value !== null) {
            func(prefixPath, sparseSnapshotTree.value);
        }
        else {
            sparseSnapshotTreeForEachChild(sparseSnapshotTree, (key, tree) => {
                const path = new Path(prefixPath.toString() + '/' + key);
                sparseSnapshotTreeForEachTree(tree, path, func);
            });
        }
    }
    /**
     * Iterates through each immediate child and triggers the callback.
     * Only seems to be used in tests.
     *
     * @param func - The function to invoke for each child.
     */
    function sparseSnapshotTreeForEachChild(sparseSnapshotTree, func) {
        sparseSnapshotTree.children.forEach((tree, key) => {
            func(key, tree);
        });
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns the delta from the previous call to get stats.
     *
     * @param collection_ - The collection to "listen" to.
     */
    class StatsListener {
        constructor(collection_) {
            this.collection_ = collection_;
            this.last_ = null;
        }
        get() {
            const newStats = this.collection_.get();
            const delta = Object.assign({}, newStats);
            if (this.last_) {
                each(this.last_, (stat, value) => {
                    delta[stat] = delta[stat] - value;
                });
            }
            this.last_ = newStats;
            return delta;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    // Assuming some apps may have a short amount of time on page, and a bulk of firebase operations probably
    // happen on page load, we try to report our first set of stats pretty quickly, but we wait at least 10
    // seconds to try to ensure the Firebase connection is established / settled.
    const FIRST_STATS_MIN_TIME = 10 * 1000;
    const FIRST_STATS_MAX_TIME = 30 * 1000;
    // We'll continue to report stats on average every 5 minutes.
    const REPORT_STATS_INTERVAL = 5 * 60 * 1000;
    class StatsReporter {
        constructor(collection, server_) {
            this.server_ = server_;
            this.statsToReport_ = {};
            this.statsListener_ = new StatsListener(collection);
            const timeout = FIRST_STATS_MIN_TIME +
                (FIRST_STATS_MAX_TIME - FIRST_STATS_MIN_TIME) * Math.random();
            setTimeoutNonBlocking(this.reportStats_.bind(this), Math.floor(timeout));
        }
        reportStats_() {
            const stats = this.statsListener_.get();
            const reportedStats = {};
            let haveStatsToReport = false;
            each(stats, (stat, value) => {
                if (value > 0 && contains(this.statsToReport_, stat)) {
                    reportedStats[stat] = value;
                    haveStatsToReport = true;
                }
            });
            if (haveStatsToReport) {
                this.server_.reportStats(reportedStats);
            }
            // queue our next run.
            setTimeoutNonBlocking(this.reportStats_.bind(this), Math.floor(Math.random() * 2 * REPORT_STATS_INTERVAL));
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     *
     * @enum
     */
    var OperationType;
    (function (OperationType) {
        OperationType[OperationType["OVERWRITE"] = 0] = "OVERWRITE";
        OperationType[OperationType["MERGE"] = 1] = "MERGE";
        OperationType[OperationType["ACK_USER_WRITE"] = 2] = "ACK_USER_WRITE";
        OperationType[OperationType["LISTEN_COMPLETE"] = 3] = "LISTEN_COMPLETE";
    })(OperationType || (OperationType = {}));
    function newOperationSourceUser() {
        return {
            fromUser: true,
            fromServer: false,
            queryId: null,
            tagged: false
        };
    }
    function newOperationSourceServer() {
        return {
            fromUser: false,
            fromServer: true,
            queryId: null,
            tagged: false
        };
    }
    function newOperationSourceServerTaggedQuery(queryId) {
        return {
            fromUser: false,
            fromServer: true,
            queryId,
            tagged: true
        };
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class AckUserWrite {
        /**
         * @param affectedTree - A tree containing true for each affected path. Affected paths can't overlap.
         */
        constructor(
        /** @inheritDoc */ path, 
        /** @inheritDoc */ affectedTree, 
        /** @inheritDoc */ revert) {
            this.path = path;
            this.affectedTree = affectedTree;
            this.revert = revert;
            /** @inheritDoc */
            this.type = OperationType.ACK_USER_WRITE;
            /** @inheritDoc */
            this.source = newOperationSourceUser();
        }
        operationForChild(childName) {
            if (!pathIsEmpty(this.path)) {
                assert(pathGetFront(this.path) === childName, 'operationForChild called for unrelated child.');
                return new AckUserWrite(pathPopFront(this.path), this.affectedTree, this.revert);
            }
            else if (this.affectedTree.value != null) {
                assert(this.affectedTree.children.isEmpty(), 'affectedTree should not have overlapping affected paths.');
                // All child locations are affected as well; just return same operation.
                return this;
            }
            else {
                const childTree = this.affectedTree.subtree(new Path(childName));
                return new AckUserWrite(newEmptyPath(), childTree, this.revert);
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Overwrite {
        constructor(source, path, snap) {
            this.source = source;
            this.path = path;
            this.snap = snap;
            /** @inheritDoc */
            this.type = OperationType.OVERWRITE;
        }
        operationForChild(childName) {
            if (pathIsEmpty(this.path)) {
                return new Overwrite(this.source, newEmptyPath(), this.snap.getImmediateChild(childName));
            }
            else {
                return new Overwrite(this.source, pathPopFront(this.path), this.snap);
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Merge {
        constructor(
        /** @inheritDoc */ source, 
        /** @inheritDoc */ path, 
        /** @inheritDoc */ children) {
            this.source = source;
            this.path = path;
            this.children = children;
            /** @inheritDoc */
            this.type = OperationType.MERGE;
        }
        operationForChild(childName) {
            if (pathIsEmpty(this.path)) {
                const childTree = this.children.subtree(new Path(childName));
                if (childTree.isEmpty()) {
                    // This child is unaffected
                    return null;
                }
                else if (childTree.value) {
                    // We have a snapshot for the child in question.  This becomes an overwrite of the child.
                    return new Overwrite(this.source, newEmptyPath(), childTree.value);
                }
                else {
                    // This is a merge at a deeper level
                    return new Merge(this.source, newEmptyPath(), childTree);
                }
            }
            else {
                assert(pathGetFront(this.path) === childName, "Can't get a merge for a child not on the path of the operation");
                return new Merge(this.source, pathPopFront(this.path), this.children);
            }
        }
        toString() {
            return ('Operation(' +
                this.path +
                ': ' +
                this.source.toString() +
                ' merge: ' +
                this.children.toString() +
                ')');
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * A cache node only stores complete children. Additionally it holds a flag whether the node can be considered fully
     * initialized in the sense that we know at one point in time this represented a valid state of the world, e.g.
     * initialized with data from the server, or a complete overwrite by the client. The filtered flag also tracks
     * whether a node potentially had children removed due to a filter.
     */
    class CacheNode {
        constructor(node_, fullyInitialized_, filtered_) {
            this.node_ = node_;
            this.fullyInitialized_ = fullyInitialized_;
            this.filtered_ = filtered_;
        }
        /**
         * Returns whether this node was fully initialized with either server data or a complete overwrite by the client
         */
        isFullyInitialized() {
            return this.fullyInitialized_;
        }
        /**
         * Returns whether this node is potentially missing children due to a filter applied to the node
         */
        isFiltered() {
            return this.filtered_;
        }
        isCompleteForPath(path) {
            if (pathIsEmpty(path)) {
                return this.isFullyInitialized() && !this.filtered_;
            }
            const childKey = pathGetFront(path);
            return this.isCompleteForChild(childKey);
        }
        isCompleteForChild(key) {
            return ((this.isFullyInitialized() && !this.filtered_) || this.node_.hasChild(key));
        }
        getNode() {
            return this.node_;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * An EventGenerator is used to convert "raw" changes (Change) as computed by the
     * CacheDiffer into actual events (Event) that can be raised.  See generateEventsForChanges()
     * for details.
     *
     */
    class EventGenerator {
        constructor(query_) {
            this.query_ = query_;
            this.index_ = this.query_._queryParams.getIndex();
        }
    }
    /**
     * Given a set of raw changes (no moved events and prevName not specified yet), and a set of
     * EventRegistrations that should be notified of these changes, generate the actual events to be raised.
     *
     * Notes:
     *  - child_moved events will be synthesized at this time for any child_changed events that affect
     *    our index.
     *  - prevName will be calculated based on the index ordering.
     */
    function eventGeneratorGenerateEventsForChanges(eventGenerator, changes, eventCache, eventRegistrations) {
        const events = [];
        const moves = [];
        changes.forEach(change => {
            if (change.type === "child_changed" /* CHILD_CHANGED */ &&
                eventGenerator.index_.indexedValueChanged(change.oldSnap, change.snapshotNode)) {
                moves.push(changeChildMoved(change.childName, change.snapshotNode));
            }
        });
        eventGeneratorGenerateEventsForType(eventGenerator, events, "child_removed" /* CHILD_REMOVED */, changes, eventRegistrations, eventCache);
        eventGeneratorGenerateEventsForType(eventGenerator, events, "child_added" /* CHILD_ADDED */, changes, eventRegistrations, eventCache);
        eventGeneratorGenerateEventsForType(eventGenerator, events, "child_moved" /* CHILD_MOVED */, moves, eventRegistrations, eventCache);
        eventGeneratorGenerateEventsForType(eventGenerator, events, "child_changed" /* CHILD_CHANGED */, changes, eventRegistrations, eventCache);
        eventGeneratorGenerateEventsForType(eventGenerator, events, "value" /* VALUE */, changes, eventRegistrations, eventCache);
        return events;
    }
    /**
     * Given changes of a single change type, generate the corresponding events.
     */
    function eventGeneratorGenerateEventsForType(eventGenerator, events, eventType, changes, registrations, eventCache) {
        const filteredChanges = changes.filter(change => change.type === eventType);
        filteredChanges.sort((a, b) => eventGeneratorCompareChanges(eventGenerator, a, b));
        filteredChanges.forEach(change => {
            const materializedChange = eventGeneratorMaterializeSingleChange(eventGenerator, change, eventCache);
            registrations.forEach(registration => {
                if (registration.respondsTo(change.type)) {
                    events.push(registration.createEvent(materializedChange, eventGenerator.query_));
                }
            });
        });
    }
    function eventGeneratorMaterializeSingleChange(eventGenerator, change, eventCache) {
        if (change.type === 'value' || change.type === 'child_removed') {
            return change;
        }
        else {
            change.prevName = eventCache.getPredecessorChildName(change.childName, change.snapshotNode, eventGenerator.index_);
            return change;
        }
    }
    function eventGeneratorCompareChanges(eventGenerator, a, b) {
        if (a.childName == null || b.childName == null) {
            throw assertionError('Should only compare child_ events.');
        }
        const aWrapped = new NamedNode(a.childName, a.snapshotNode);
        const bWrapped = new NamedNode(b.childName, b.snapshotNode);
        return eventGenerator.index_.compare(aWrapped, bWrapped);
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function newViewCache(eventCache, serverCache) {
        return { eventCache, serverCache };
    }
    function viewCacheUpdateEventSnap(viewCache, eventSnap, complete, filtered) {
        return newViewCache(new CacheNode(eventSnap, complete, filtered), viewCache.serverCache);
    }
    function viewCacheUpdateServerSnap(viewCache, serverSnap, complete, filtered) {
        return newViewCache(viewCache.eventCache, new CacheNode(serverSnap, complete, filtered));
    }
    function viewCacheGetCompleteEventSnap(viewCache) {
        return viewCache.eventCache.isFullyInitialized()
            ? viewCache.eventCache.getNode()
            : null;
    }
    function viewCacheGetCompleteServerSnap(viewCache) {
        return viewCache.serverCache.isFullyInitialized()
            ? viewCache.serverCache.getNode()
            : null;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let emptyChildrenSingleton;
    /**
     * Singleton empty children collection.
     *
     */
    const EmptyChildren = () => {
        if (!emptyChildrenSingleton) {
            emptyChildrenSingleton = new SortedMap(stringCompare);
        }
        return emptyChildrenSingleton;
    };
    /**
     * A tree with immutable elements.
     */
    class ImmutableTree {
        constructor(value, children = EmptyChildren()) {
            this.value = value;
            this.children = children;
        }
        static fromObject(obj) {
            let tree = new ImmutableTree(null);
            each(obj, (childPath, childSnap) => {
                tree = tree.set(new Path(childPath), childSnap);
            });
            return tree;
        }
        /**
         * True if the value is empty and there are no children
         */
        isEmpty() {
            return this.value === null && this.children.isEmpty();
        }
        /**
         * Given a path and predicate, return the first node and the path to that node
         * where the predicate returns true.
         *
         * TODO Do a perf test -- If we're creating a bunch of `{path: value:}`
         * objects on the way back out, it may be better to pass down a pathSoFar obj.
         *
         * @param relativePath - The remainder of the path
         * @param predicate - The predicate to satisfy to return a node
         */
        findRootMostMatchingPathAndValue(relativePath, predicate) {
            if (this.value != null && predicate(this.value)) {
                return { path: newEmptyPath(), value: this.value };
            }
            else {
                if (pathIsEmpty(relativePath)) {
                    return null;
                }
                else {
                    const front = pathGetFront(relativePath);
                    const child = this.children.get(front);
                    if (child !== null) {
                        const childExistingPathAndValue = child.findRootMostMatchingPathAndValue(pathPopFront(relativePath), predicate);
                        if (childExistingPathAndValue != null) {
                            const fullPath = pathChild(new Path(front), childExistingPathAndValue.path);
                            return { path: fullPath, value: childExistingPathAndValue.value };
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
        }
        /**
         * Find, if it exists, the shortest subpath of the given path that points a defined
         * value in the tree
         */
        findRootMostValueAndPath(relativePath) {
            return this.findRootMostMatchingPathAndValue(relativePath, () => true);
        }
        /**
         * @returns The subtree at the given path
         */
        subtree(relativePath) {
            if (pathIsEmpty(relativePath)) {
                return this;
            }
            else {
                const front = pathGetFront(relativePath);
                const childTree = this.children.get(front);
                if (childTree !== null) {
                    return childTree.subtree(pathPopFront(relativePath));
                }
                else {
                    return new ImmutableTree(null);
                }
            }
        }
        /**
         * Sets a value at the specified path.
         *
         * @param relativePath - Path to set value at.
         * @param toSet - Value to set.
         * @returns Resulting tree.
         */
        set(relativePath, toSet) {
            if (pathIsEmpty(relativePath)) {
                return new ImmutableTree(toSet, this.children);
            }
            else {
                const front = pathGetFront(relativePath);
                const child = this.children.get(front) || new ImmutableTree(null);
                const newChild = child.set(pathPopFront(relativePath), toSet);
                const newChildren = this.children.insert(front, newChild);
                return new ImmutableTree(this.value, newChildren);
            }
        }
        /**
         * Removes the value at the specified path.
         *
         * @param relativePath - Path to value to remove.
         * @returns Resulting tree.
         */
        remove(relativePath) {
            if (pathIsEmpty(relativePath)) {
                if (this.children.isEmpty()) {
                    return new ImmutableTree(null);
                }
                else {
                    return new ImmutableTree(null, this.children);
                }
            }
            else {
                const front = pathGetFront(relativePath);
                const child = this.children.get(front);
                if (child) {
                    const newChild = child.remove(pathPopFront(relativePath));
                    let newChildren;
                    if (newChild.isEmpty()) {
                        newChildren = this.children.remove(front);
                    }
                    else {
                        newChildren = this.children.insert(front, newChild);
                    }
                    if (this.value === null && newChildren.isEmpty()) {
                        return new ImmutableTree(null);
                    }
                    else {
                        return new ImmutableTree(this.value, newChildren);
                    }
                }
                else {
                    return this;
                }
            }
        }
        /**
         * Gets a value from the tree.
         *
         * @param relativePath - Path to get value for.
         * @returns Value at path, or null.
         */
        get(relativePath) {
            if (pathIsEmpty(relativePath)) {
                return this.value;
            }
            else {
                const front = pathGetFront(relativePath);
                const child = this.children.get(front);
                if (child) {
                    return child.get(pathPopFront(relativePath));
                }
                else {
                    return null;
                }
            }
        }
        /**
         * Replace the subtree at the specified path with the given new tree.
         *
         * @param relativePath - Path to replace subtree for.
         * @param newTree - New tree.
         * @returns Resulting tree.
         */
        setTree(relativePath, newTree) {
            if (pathIsEmpty(relativePath)) {
                return newTree;
            }
            else {
                const front = pathGetFront(relativePath);
                const child = this.children.get(front) || new ImmutableTree(null);
                const newChild = child.setTree(pathPopFront(relativePath), newTree);
                let newChildren;
                if (newChild.isEmpty()) {
                    newChildren = this.children.remove(front);
                }
                else {
                    newChildren = this.children.insert(front, newChild);
                }
                return new ImmutableTree(this.value, newChildren);
            }
        }
        /**
         * Performs a depth first fold on this tree. Transforms a tree into a single
         * value, given a function that operates on the path to a node, an optional
         * current value, and a map of child names to folded subtrees
         */
        fold(fn) {
            return this.fold_(newEmptyPath(), fn);
        }
        /**
         * Recursive helper for public-facing fold() method
         */
        fold_(pathSoFar, fn) {
            const accum = {};
            this.children.inorderTraversal((childKey, childTree) => {
                accum[childKey] = childTree.fold_(pathChild(pathSoFar, childKey), fn);
            });
            return fn(pathSoFar, this.value, accum);
        }
        /**
         * Find the first matching value on the given path. Return the result of applying f to it.
         */
        findOnPath(path, f) {
            return this.findOnPath_(path, newEmptyPath(), f);
        }
        findOnPath_(pathToFollow, pathSoFar, f) {
            const result = this.value ? f(pathSoFar, this.value) : false;
            if (result) {
                return result;
            }
            else {
                if (pathIsEmpty(pathToFollow)) {
                    return null;
                }
                else {
                    const front = pathGetFront(pathToFollow);
                    const nextChild = this.children.get(front);
                    if (nextChild) {
                        return nextChild.findOnPath_(pathPopFront(pathToFollow), pathChild(pathSoFar, front), f);
                    }
                    else {
                        return null;
                    }
                }
            }
        }
        foreachOnPath(path, f) {
            return this.foreachOnPath_(path, newEmptyPath(), f);
        }
        foreachOnPath_(pathToFollow, currentRelativePath, f) {
            if (pathIsEmpty(pathToFollow)) {
                return this;
            }
            else {
                if (this.value) {
                    f(currentRelativePath, this.value);
                }
                const front = pathGetFront(pathToFollow);
                const nextChild = this.children.get(front);
                if (nextChild) {
                    return nextChild.foreachOnPath_(pathPopFront(pathToFollow), pathChild(currentRelativePath, front), f);
                }
                else {
                    return new ImmutableTree(null);
                }
            }
        }
        /**
         * Calls the given function for each node in the tree that has a value.
         *
         * @param f - A function to be called with the path from the root of the tree to
         * a node, and the value at that node. Called in depth-first order.
         */
        foreach(f) {
            this.foreach_(newEmptyPath(), f);
        }
        foreach_(currentRelativePath, f) {
            this.children.inorderTraversal((childName, childTree) => {
                childTree.foreach_(pathChild(currentRelativePath, childName), f);
            });
            if (this.value) {
                f(currentRelativePath, this.value);
            }
        }
        foreachChild(f) {
            this.children.inorderTraversal((childName, childTree) => {
                if (childTree.value) {
                    f(childName, childTree.value);
                }
            });
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * This class holds a collection of writes that can be applied to nodes in unison. It abstracts away the logic with
     * dealing with priority writes and multiple nested writes. At any given path there is only allowed to be one write
     * modifying that path. Any write to an existing path or shadowing an existing path will modify that existing write
     * to reflect the write added.
     */
    class CompoundWrite {
        constructor(writeTree_) {
            this.writeTree_ = writeTree_;
        }
        static empty() {
            return new CompoundWrite(new ImmutableTree(null));
        }
    }
    function compoundWriteAddWrite(compoundWrite, path, node) {
        if (pathIsEmpty(path)) {
            return new CompoundWrite(new ImmutableTree(node));
        }
        else {
            const rootmost = compoundWrite.writeTree_.findRootMostValueAndPath(path);
            if (rootmost != null) {
                const rootMostPath = rootmost.path;
                let value = rootmost.value;
                const relativePath = newRelativePath(rootMostPath, path);
                value = value.updateChild(relativePath, node);
                return new CompoundWrite(compoundWrite.writeTree_.set(rootMostPath, value));
            }
            else {
                const subtree = new ImmutableTree(node);
                const newWriteTree = compoundWrite.writeTree_.setTree(path, subtree);
                return new CompoundWrite(newWriteTree);
            }
        }
    }
    function compoundWriteAddWrites(compoundWrite, path, updates) {
        let newWrite = compoundWrite;
        each(updates, (childKey, node) => {
            newWrite = compoundWriteAddWrite(newWrite, pathChild(path, childKey), node);
        });
        return newWrite;
    }
    /**
     * Will remove a write at the given path and deeper paths. This will <em>not</em> modify a write at a higher
     * location, which must be removed by calling this method with that path.
     *
     * @param compoundWrite - The CompoundWrite to remove.
     * @param path - The path at which a write and all deeper writes should be removed
     * @returns The new CompoundWrite with the removed path
     */
    function compoundWriteRemoveWrite(compoundWrite, path) {
        if (pathIsEmpty(path)) {
            return CompoundWrite.empty();
        }
        else {
            const newWriteTree = compoundWrite.writeTree_.setTree(path, new ImmutableTree(null));
            return new CompoundWrite(newWriteTree);
        }
    }
    /**
     * Returns whether this CompoundWrite will fully overwrite a node at a given location and can therefore be
     * considered "complete".
     *
     * @param compoundWrite - The CompoundWrite to check.
     * @param path - The path to check for
     * @returns Whether there is a complete write at that path
     */
    function compoundWriteHasCompleteWrite(compoundWrite, path) {
        return compoundWriteGetCompleteNode(compoundWrite, path) != null;
    }
    /**
     * Returns a node for a path if and only if the node is a "complete" overwrite at that path. This will not aggregate
     * writes from deeper paths, but will return child nodes from a more shallow path.
     *
     * @param compoundWrite - The CompoundWrite to get the node from.
     * @param path - The path to get a complete write
     * @returns The node if complete at that path, or null otherwise.
     */
    function compoundWriteGetCompleteNode(compoundWrite, path) {
        const rootmost = compoundWrite.writeTree_.findRootMostValueAndPath(path);
        if (rootmost != null) {
            return compoundWrite.writeTree_
                .get(rootmost.path)
                .getChild(newRelativePath(rootmost.path, path));
        }
        else {
            return null;
        }
    }
    /**
     * Returns all children that are guaranteed to be a complete overwrite.
     *
     * @param compoundWrite - The CompoundWrite to get children from.
     * @returns A list of all complete children.
     */
    function compoundWriteGetCompleteChildren(compoundWrite) {
        const children = [];
        const node = compoundWrite.writeTree_.value;
        if (node != null) {
            // If it's a leaf node, it has no children; so nothing to do.
            if (!node.isLeafNode()) {
                node.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
                    children.push(new NamedNode(childName, childNode));
                });
            }
        }
        else {
            compoundWrite.writeTree_.children.inorderTraversal((childName, childTree) => {
                if (childTree.value != null) {
                    children.push(new NamedNode(childName, childTree.value));
                }
            });
        }
        return children;
    }
    function compoundWriteChildCompoundWrite(compoundWrite, path) {
        if (pathIsEmpty(path)) {
            return compoundWrite;
        }
        else {
            const shadowingNode = compoundWriteGetCompleteNode(compoundWrite, path);
            if (shadowingNode != null) {
                return new CompoundWrite(new ImmutableTree(shadowingNode));
            }
            else {
                return new CompoundWrite(compoundWrite.writeTree_.subtree(path));
            }
        }
    }
    /**
     * Returns true if this CompoundWrite is empty and therefore does not modify any nodes.
     * @returns Whether this CompoundWrite is empty
     */
    function compoundWriteIsEmpty(compoundWrite) {
        return compoundWrite.writeTree_.isEmpty();
    }
    /**
     * Applies this CompoundWrite to a node. The node is returned with all writes from this CompoundWrite applied to the
     * node
     * @param node - The node to apply this CompoundWrite to
     * @returns The node with all writes applied
     */
    function compoundWriteApply(compoundWrite, node) {
        return applySubtreeWrite(newEmptyPath(), compoundWrite.writeTree_, node);
    }
    function applySubtreeWrite(relativePath, writeTree, node) {
        if (writeTree.value != null) {
            // Since there a write is always a leaf, we're done here
            return node.updateChild(relativePath, writeTree.value);
        }
        else {
            let priorityWrite = null;
            writeTree.children.inorderTraversal((childKey, childTree) => {
                if (childKey === '.priority') {
                    // Apply priorities at the end so we don't update priorities for either empty nodes or forget
                    // to apply priorities to empty nodes that are later filled
                    assert(childTree.value !== null, 'Priority writes must always be leaf nodes');
                    priorityWrite = childTree.value;
                }
                else {
                    node = applySubtreeWrite(pathChild(relativePath, childKey), childTree, node);
                }
            });
            // If there was a priority write, we only apply it if the node is not empty
            if (!node.getChild(relativePath).isEmpty() && priorityWrite !== null) {
                node = node.updateChild(pathChild(relativePath, '.priority'), priorityWrite);
            }
            return node;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Create a new WriteTreeRef for the given path. For use with a new sync point at the given path.
     *
     */
    function writeTreeChildWrites(writeTree, path) {
        return newWriteTreeRef(path, writeTree);
    }
    /**
     * Record a new overwrite from user code.
     *
     * @param visible - This is set to false by some transactions. It should be excluded from event caches
     */
    function writeTreeAddOverwrite(writeTree, path, snap, writeId, visible) {
        assert(writeId > writeTree.lastWriteId, 'Stacking an older write on top of newer ones');
        if (visible === undefined) {
            visible = true;
        }
        writeTree.allWrites.push({
            path,
            snap,
            writeId,
            visible
        });
        if (visible) {
            writeTree.visibleWrites = compoundWriteAddWrite(writeTree.visibleWrites, path, snap);
        }
        writeTree.lastWriteId = writeId;
    }
    function writeTreeGetWrite(writeTree, writeId) {
        for (let i = 0; i < writeTree.allWrites.length; i++) {
            const record = writeTree.allWrites[i];
            if (record.writeId === writeId) {
                return record;
            }
        }
        return null;
    }
    /**
     * Remove a write (either an overwrite or merge) that has been successfully acknowledge by the server. Recalculates
     * the tree if necessary.  We return true if it may have been visible, meaning views need to reevaluate.
     *
     * @returns true if the write may have been visible (meaning we'll need to reevaluate / raise
     * events as a result).
     */
    function writeTreeRemoveWrite(writeTree, writeId) {
        // Note: disabling this check. It could be a transaction that preempted another transaction, and thus was applied
        // out of order.
        //const validClear = revert || this.allWrites_.length === 0 || writeId <= this.allWrites_[0].writeId;
        //assert(validClear, "Either we don't have this write, or it's the first one in the queue");
        const idx = writeTree.allWrites.findIndex(s => {
            return s.writeId === writeId;
        });
        assert(idx >= 0, 'removeWrite called with nonexistent writeId.');
        const writeToRemove = writeTree.allWrites[idx];
        writeTree.allWrites.splice(idx, 1);
        let removedWriteWasVisible = writeToRemove.visible;
        let removedWriteOverlapsWithOtherWrites = false;
        let i = writeTree.allWrites.length - 1;
        while (removedWriteWasVisible && i >= 0) {
            const currentWrite = writeTree.allWrites[i];
            if (currentWrite.visible) {
                if (i >= idx &&
                    writeTreeRecordContainsPath_(currentWrite, writeToRemove.path)) {
                    // The removed write was completely shadowed by a subsequent write.
                    removedWriteWasVisible = false;
                }
                else if (pathContains(writeToRemove.path, currentWrite.path)) {
                    // Either we're covering some writes or they're covering part of us (depending on which came first).
                    removedWriteOverlapsWithOtherWrites = true;
                }
            }
            i--;
        }
        if (!removedWriteWasVisible) {
            return false;
        }
        else if (removedWriteOverlapsWithOtherWrites) {
            // There's some shadowing going on. Just rebuild the visible writes from scratch.
            writeTreeResetTree_(writeTree);
            return true;
        }
        else {
            // There's no shadowing.  We can safely just remove the write(s) from visibleWrites.
            if (writeToRemove.snap) {
                writeTree.visibleWrites = compoundWriteRemoveWrite(writeTree.visibleWrites, writeToRemove.path);
            }
            else {
                const children = writeToRemove.children;
                each(children, (childName) => {
                    writeTree.visibleWrites = compoundWriteRemoveWrite(writeTree.visibleWrites, pathChild(writeToRemove.path, childName));
                });
            }
            return true;
        }
    }
    function writeTreeRecordContainsPath_(writeRecord, path) {
        if (writeRecord.snap) {
            return pathContains(writeRecord.path, path);
        }
        else {
            for (const childName in writeRecord.children) {
                if (writeRecord.children.hasOwnProperty(childName) &&
                    pathContains(pathChild(writeRecord.path, childName), path)) {
                    return true;
                }
            }
            return false;
        }
    }
    /**
     * Re-layer the writes and merges into a tree so we can efficiently calculate event snapshots
     */
    function writeTreeResetTree_(writeTree) {
        writeTree.visibleWrites = writeTreeLayerTree_(writeTree.allWrites, writeTreeDefaultFilter_, newEmptyPath());
        if (writeTree.allWrites.length > 0) {
            writeTree.lastWriteId =
                writeTree.allWrites[writeTree.allWrites.length - 1].writeId;
        }
        else {
            writeTree.lastWriteId = -1;
        }
    }
    /**
     * The default filter used when constructing the tree. Keep everything that's visible.
     */
    function writeTreeDefaultFilter_(write) {
        return write.visible;
    }
    /**
     * Static method. Given an array of WriteRecords, a filter for which ones to include, and a path, construct the tree of
     * event data at that path.
     */
    function writeTreeLayerTree_(writes, filter, treeRoot) {
        let compoundWrite = CompoundWrite.empty();
        for (let i = 0; i < writes.length; ++i) {
            const write = writes[i];
            // Theory, a later set will either:
            // a) abort a relevant transaction, so no need to worry about excluding it from calculating that transaction
            // b) not be relevant to a transaction (separate branch), so again will not affect the data for that transaction
            if (filter(write)) {
                const writePath = write.path;
                let relativePath;
                if (write.snap) {
                    if (pathContains(treeRoot, writePath)) {
                        relativePath = newRelativePath(treeRoot, writePath);
                        compoundWrite = compoundWriteAddWrite(compoundWrite, relativePath, write.snap);
                    }
                    else if (pathContains(writePath, treeRoot)) {
                        relativePath = newRelativePath(writePath, treeRoot);
                        compoundWrite = compoundWriteAddWrite(compoundWrite, newEmptyPath(), write.snap.getChild(relativePath));
                    }
                    else ;
                }
                else if (write.children) {
                    if (pathContains(treeRoot, writePath)) {
                        relativePath = newRelativePath(treeRoot, writePath);
                        compoundWrite = compoundWriteAddWrites(compoundWrite, relativePath, write.children);
                    }
                    else if (pathContains(writePath, treeRoot)) {
                        relativePath = newRelativePath(writePath, treeRoot);
                        if (pathIsEmpty(relativePath)) {
                            compoundWrite = compoundWriteAddWrites(compoundWrite, newEmptyPath(), write.children);
                        }
                        else {
                            const child = safeGet(write.children, pathGetFront(relativePath));
                            if (child) {
                                // There exists a child in this node that matches the root path
                                const deepNode = child.getChild(pathPopFront(relativePath));
                                compoundWrite = compoundWriteAddWrite(compoundWrite, newEmptyPath(), deepNode);
                            }
                        }
                    }
                    else ;
                }
                else {
                    throw assertionError('WriteRecord should have .snap or .children');
                }
            }
        }
        return compoundWrite;
    }
    /**
     * Given optional, underlying server data, and an optional set of constraints (exclude some sets, include hidden
     * writes), attempt to calculate a complete snapshot for the given path
     *
     * @param writeIdsToExclude - An optional set to be excluded
     * @param includeHiddenWrites - Defaults to false, whether or not to layer on writes with visible set to false
     */
    function writeTreeCalcCompleteEventCache(writeTree, treePath, completeServerCache, writeIdsToExclude, includeHiddenWrites) {
        if (!writeIdsToExclude && !includeHiddenWrites) {
            const shadowingNode = compoundWriteGetCompleteNode(writeTree.visibleWrites, treePath);
            if (shadowingNode != null) {
                return shadowingNode;
            }
            else {
                const subMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
                if (compoundWriteIsEmpty(subMerge)) {
                    return completeServerCache;
                }
                else if (completeServerCache == null &&
                    !compoundWriteHasCompleteWrite(subMerge, newEmptyPath())) {
                    // We wouldn't have a complete snapshot, since there's no underlying data and no complete shadow
                    return null;
                }
                else {
                    const layeredCache = completeServerCache || ChildrenNode.EMPTY_NODE;
                    return compoundWriteApply(subMerge, layeredCache);
                }
            }
        }
        else {
            const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
            if (!includeHiddenWrites && compoundWriteIsEmpty(merge)) {
                return completeServerCache;
            }
            else {
                // If the server cache is null, and we don't have a complete cache, we need to return null
                if (!includeHiddenWrites &&
                    completeServerCache == null &&
                    !compoundWriteHasCompleteWrite(merge, newEmptyPath())) {
                    return null;
                }
                else {
                    const filter = function (write) {
                        return ((write.visible || includeHiddenWrites) &&
                            (!writeIdsToExclude ||
                                !~writeIdsToExclude.indexOf(write.writeId)) &&
                            (pathContains(write.path, treePath) ||
                                pathContains(treePath, write.path)));
                    };
                    const mergeAtPath = writeTreeLayerTree_(writeTree.allWrites, filter, treePath);
                    const layeredCache = completeServerCache || ChildrenNode.EMPTY_NODE;
                    return compoundWriteApply(mergeAtPath, layeredCache);
                }
            }
        }
    }
    /**
     * With optional, underlying server data, attempt to return a children node of children that we have complete data for.
     * Used when creating new views, to pre-fill their complete event children snapshot.
     */
    function writeTreeCalcCompleteEventChildren(writeTree, treePath, completeServerChildren) {
        let completeChildren = ChildrenNode.EMPTY_NODE;
        const topLevelSet = compoundWriteGetCompleteNode(writeTree.visibleWrites, treePath);
        if (topLevelSet) {
            if (!topLevelSet.isLeafNode()) {
                // we're shadowing everything. Return the children.
                topLevelSet.forEachChild(PRIORITY_INDEX, (childName, childSnap) => {
                    completeChildren = completeChildren.updateImmediateChild(childName, childSnap);
                });
            }
            return completeChildren;
        }
        else if (completeServerChildren) {
            // Layer any children we have on top of this
            // We know we don't have a top-level set, so just enumerate existing children
            const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
            completeServerChildren.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
                const node = compoundWriteApply(compoundWriteChildCompoundWrite(merge, new Path(childName)), childNode);
                completeChildren = completeChildren.updateImmediateChild(childName, node);
            });
            // Add any complete children we have from the set
            compoundWriteGetCompleteChildren(merge).forEach(namedNode => {
                completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
            });
            return completeChildren;
        }
        else {
            // We don't have anything to layer on top of. Layer on any children we have
            // Note that we can return an empty snap if we have a defined delete
            const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
            compoundWriteGetCompleteChildren(merge).forEach(namedNode => {
                completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
            });
            return completeChildren;
        }
    }
    /**
     * Given that the underlying server data has updated, determine what, if anything, needs to be
     * applied to the event cache.
     *
     * Possibilities:
     *
     * 1. No writes are shadowing. Events should be raised, the snap to be applied comes from the server data
     *
     * 2. Some write is completely shadowing. No events to be raised
     *
     * 3. Is partially shadowed. Events
     *
     * Either existingEventSnap or existingServerSnap must exist
     */
    function writeTreeCalcEventCacheAfterServerOverwrite(writeTree, treePath, childPath, existingEventSnap, existingServerSnap) {
        assert(existingEventSnap || existingServerSnap, 'Either existingEventSnap or existingServerSnap must exist');
        const path = pathChild(treePath, childPath);
        if (compoundWriteHasCompleteWrite(writeTree.visibleWrites, path)) {
            // At this point we can probably guarantee that we're in case 2, meaning no events
            // May need to check visibility while doing the findRootMostValueAndPath call
            return null;
        }
        else {
            // No complete shadowing. We're either partially shadowing or not shadowing at all.
            const childMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, path);
            if (compoundWriteIsEmpty(childMerge)) {
                // We're not shadowing at all. Case 1
                return existingServerSnap.getChild(childPath);
            }
            else {
                // This could be more efficient if the serverNode + updates doesn't change the eventSnap
                // However this is tricky to find out, since user updates don't necessary change the server
                // snap, e.g. priority updates on empty nodes, or deep deletes. Another special case is if the server
                // adds nodes, but doesn't change any existing writes. It is therefore not enough to
                // only check if the updates change the serverNode.
                // Maybe check if the merge tree contains these special cases and only do a full overwrite in that case?
                return compoundWriteApply(childMerge, existingServerSnap.getChild(childPath));
            }
        }
    }
    /**
     * Returns a complete child for a given server snap after applying all user writes or null if there is no
     * complete child for this ChildKey.
     */
    function writeTreeCalcCompleteChild(writeTree, treePath, childKey, existingServerSnap) {
        const path = pathChild(treePath, childKey);
        const shadowingNode = compoundWriteGetCompleteNode(writeTree.visibleWrites, path);
        if (shadowingNode != null) {
            return shadowingNode;
        }
        else {
            if (existingServerSnap.isCompleteForChild(childKey)) {
                const childMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, path);
                return compoundWriteApply(childMerge, existingServerSnap.getNode().getImmediateChild(childKey));
            }
            else {
                return null;
            }
        }
    }
    /**
     * Returns a node if there is a complete overwrite for this path. More specifically, if there is a write at
     * a higher path, this will return the child of that write relative to the write and this path.
     * Returns null if there is no write at this path.
     */
    function writeTreeShadowingWrite(writeTree, path) {
        return compoundWriteGetCompleteNode(writeTree.visibleWrites, path);
    }
    /**
     * This method is used when processing child remove events on a query. If we can, we pull in children that were outside
     * the window, but may now be in the window.
     */
    function writeTreeCalcIndexedSlice(writeTree, treePath, completeServerData, startPost, count, reverse, index) {
        let toIterate;
        const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
        const shadowingNode = compoundWriteGetCompleteNode(merge, newEmptyPath());
        if (shadowingNode != null) {
            toIterate = shadowingNode;
        }
        else if (completeServerData != null) {
            toIterate = compoundWriteApply(merge, completeServerData);
        }
        else {
            // no children to iterate on
            return [];
        }
        toIterate = toIterate.withIndex(index);
        if (!toIterate.isEmpty() && !toIterate.isLeafNode()) {
            const nodes = [];
            const cmp = index.getCompare();
            const iter = reverse
                ? toIterate.getReverseIteratorFrom(startPost, index)
                : toIterate.getIteratorFrom(startPost, index);
            let next = iter.getNext();
            while (next && nodes.length < count) {
                if (cmp(next, startPost) !== 0) {
                    nodes.push(next);
                }
                next = iter.getNext();
            }
            return nodes;
        }
        else {
            return [];
        }
    }
    function newWriteTree() {
        return {
            visibleWrites: CompoundWrite.empty(),
            allWrites: [],
            lastWriteId: -1
        };
    }
    /**
     * If possible, returns a complete event cache, using the underlying server data if possible. In addition, can be used
     * to get a cache that includes hidden writes, and excludes arbitrary writes. Note that customizing the returned node
     * can lead to a more expensive calculation.
     *
     * @param writeIdsToExclude - Optional writes to exclude.
     * @param includeHiddenWrites - Defaults to false, whether or not to layer on writes with visible set to false
     */
    function writeTreeRefCalcCompleteEventCache(writeTreeRef, completeServerCache, writeIdsToExclude, includeHiddenWrites) {
        return writeTreeCalcCompleteEventCache(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerCache, writeIdsToExclude, includeHiddenWrites);
    }
    /**
     * If possible, returns a children node containing all of the complete children we have data for. The returned data is a
     * mix of the given server data and write data.
     *
     */
    function writeTreeRefCalcCompleteEventChildren(writeTreeRef, completeServerChildren) {
        return writeTreeCalcCompleteEventChildren(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerChildren);
    }
    /**
     * Given that either the underlying server data has updated or the outstanding writes have updated, determine what,
     * if anything, needs to be applied to the event cache.
     *
     * Possibilities:
     *
     * 1. No writes are shadowing. Events should be raised, the snap to be applied comes from the server data
     *
     * 2. Some write is completely shadowing. No events to be raised
     *
     * 3. Is partially shadowed. Events should be raised
     *
     * Either existingEventSnap or existingServerSnap must exist, this is validated via an assert
     *
     *
     */
    function writeTreeRefCalcEventCacheAfterServerOverwrite(writeTreeRef, path, existingEventSnap, existingServerSnap) {
        return writeTreeCalcEventCacheAfterServerOverwrite(writeTreeRef.writeTree, writeTreeRef.treePath, path, existingEventSnap, existingServerSnap);
    }
    /**
     * Returns a node if there is a complete overwrite for this path. More specifically, if there is a write at
     * a higher path, this will return the child of that write relative to the write and this path.
     * Returns null if there is no write at this path.
     *
     */
    function writeTreeRefShadowingWrite(writeTreeRef, path) {
        return writeTreeShadowingWrite(writeTreeRef.writeTree, pathChild(writeTreeRef.treePath, path));
    }
    /**
     * This method is used when processing child remove events on a query. If we can, we pull in children that were outside
     * the window, but may now be in the window
     */
    function writeTreeRefCalcIndexedSlice(writeTreeRef, completeServerData, startPost, count, reverse, index) {
        return writeTreeCalcIndexedSlice(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerData, startPost, count, reverse, index);
    }
    /**
     * Returns a complete child for a given server snap after applying all user writes or null if there is no
     * complete child for this ChildKey.
     */
    function writeTreeRefCalcCompleteChild(writeTreeRef, childKey, existingServerCache) {
        return writeTreeCalcCompleteChild(writeTreeRef.writeTree, writeTreeRef.treePath, childKey, existingServerCache);
    }
    /**
     * Return a WriteTreeRef for a child.
     */
    function writeTreeRefChild(writeTreeRef, childName) {
        return newWriteTreeRef(pathChild(writeTreeRef.treePath, childName), writeTreeRef.writeTree);
    }
    function newWriteTreeRef(path, writeTree) {
        return {
            treePath: path,
            writeTree
        };
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class ChildChangeAccumulator {
        constructor() {
            this.changeMap = new Map();
        }
        trackChildChange(change) {
            const type = change.type;
            const childKey = change.childName;
            assert(type === "child_added" /* CHILD_ADDED */ ||
                type === "child_changed" /* CHILD_CHANGED */ ||
                type === "child_removed" /* CHILD_REMOVED */, 'Only child changes supported for tracking');
            assert(childKey !== '.priority', 'Only non-priority child changes can be tracked.');
            const oldChange = this.changeMap.get(childKey);
            if (oldChange) {
                const oldType = oldChange.type;
                if (type === "child_added" /* CHILD_ADDED */ &&
                    oldType === "child_removed" /* CHILD_REMOVED */) {
                    this.changeMap.set(childKey, changeChildChanged(childKey, change.snapshotNode, oldChange.snapshotNode));
                }
                else if (type === "child_removed" /* CHILD_REMOVED */ &&
                    oldType === "child_added" /* CHILD_ADDED */) {
                    this.changeMap.delete(childKey);
                }
                else if (type === "child_removed" /* CHILD_REMOVED */ &&
                    oldType === "child_changed" /* CHILD_CHANGED */) {
                    this.changeMap.set(childKey, changeChildRemoved(childKey, oldChange.oldSnap));
                }
                else if (type === "child_changed" /* CHILD_CHANGED */ &&
                    oldType === "child_added" /* CHILD_ADDED */) {
                    this.changeMap.set(childKey, changeChildAdded(childKey, change.snapshotNode));
                }
                else if (type === "child_changed" /* CHILD_CHANGED */ &&
                    oldType === "child_changed" /* CHILD_CHANGED */) {
                    this.changeMap.set(childKey, changeChildChanged(childKey, change.snapshotNode, oldChange.oldSnap));
                }
                else {
                    throw assertionError('Illegal combination of changes: ' +
                        change +
                        ' occurred after ' +
                        oldChange);
                }
            }
            else {
                this.changeMap.set(childKey, change);
            }
        }
        getChanges() {
            return Array.from(this.changeMap.values());
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * An implementation of CompleteChildSource that never returns any additional children
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    class NoCompleteChildSource_ {
        getCompleteChild(childKey) {
            return null;
        }
        getChildAfterChild(index, child, reverse) {
            return null;
        }
    }
    /**
     * Singleton instance.
     */
    const NO_COMPLETE_CHILD_SOURCE = new NoCompleteChildSource_();
    /**
     * An implementation of CompleteChildSource that uses a WriteTree in addition to any other server data or
     * old event caches available to calculate complete children.
     */
    class WriteTreeCompleteChildSource {
        constructor(writes_, viewCache_, optCompleteServerCache_ = null) {
            this.writes_ = writes_;
            this.viewCache_ = viewCache_;
            this.optCompleteServerCache_ = optCompleteServerCache_;
        }
        getCompleteChild(childKey) {
            const node = this.viewCache_.eventCache;
            if (node.isCompleteForChild(childKey)) {
                return node.getNode().getImmediateChild(childKey);
            }
            else {
                const serverNode = this.optCompleteServerCache_ != null
                    ? new CacheNode(this.optCompleteServerCache_, true, false)
                    : this.viewCache_.serverCache;
                return writeTreeRefCalcCompleteChild(this.writes_, childKey, serverNode);
            }
        }
        getChildAfterChild(index, child, reverse) {
            const completeServerData = this.optCompleteServerCache_ != null
                ? this.optCompleteServerCache_
                : viewCacheGetCompleteServerSnap(this.viewCache_);
            const nodes = writeTreeRefCalcIndexedSlice(this.writes_, completeServerData, child, 1, reverse, index);
            if (nodes.length === 0) {
                return null;
            }
            else {
                return nodes[0];
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function newViewProcessor(filter) {
        return { filter };
    }
    function viewProcessorAssertIndexed(viewProcessor, viewCache) {
        assert(viewCache.eventCache.getNode().isIndexed(viewProcessor.filter.getIndex()), 'Event snap not indexed');
        assert(viewCache.serverCache.getNode().isIndexed(viewProcessor.filter.getIndex()), 'Server snap not indexed');
    }
    function viewProcessorApplyOperation(viewProcessor, oldViewCache, operation, writesCache, completeCache) {
        const accumulator = new ChildChangeAccumulator();
        let newViewCache, filterServerNode;
        if (operation.type === OperationType.OVERWRITE) {
            const overwrite = operation;
            if (overwrite.source.fromUser) {
                newViewCache = viewProcessorApplyUserOverwrite(viewProcessor, oldViewCache, overwrite.path, overwrite.snap, writesCache, completeCache, accumulator);
            }
            else {
                assert(overwrite.source.fromServer, 'Unknown source.');
                // We filter the node if it's a tagged update or the node has been previously filtered  and the
                // update is not at the root in which case it is ok (and necessary) to mark the node unfiltered
                // again
                filterServerNode =
                    overwrite.source.tagged ||
                        (oldViewCache.serverCache.isFiltered() && !pathIsEmpty(overwrite.path));
                newViewCache = viewProcessorApplyServerOverwrite(viewProcessor, oldViewCache, overwrite.path, overwrite.snap, writesCache, completeCache, filterServerNode, accumulator);
            }
        }
        else if (operation.type === OperationType.MERGE) {
            const merge = operation;
            if (merge.source.fromUser) {
                newViewCache = viewProcessorApplyUserMerge(viewProcessor, oldViewCache, merge.path, merge.children, writesCache, completeCache, accumulator);
            }
            else {
                assert(merge.source.fromServer, 'Unknown source.');
                // We filter the node if it's a tagged update or the node has been previously filtered
                filterServerNode =
                    merge.source.tagged || oldViewCache.serverCache.isFiltered();
                newViewCache = viewProcessorApplyServerMerge(viewProcessor, oldViewCache, merge.path, merge.children, writesCache, completeCache, filterServerNode, accumulator);
            }
        }
        else if (operation.type === OperationType.ACK_USER_WRITE) {
            const ackUserWrite = operation;
            if (!ackUserWrite.revert) {
                newViewCache = viewProcessorAckUserWrite(viewProcessor, oldViewCache, ackUserWrite.path, ackUserWrite.affectedTree, writesCache, completeCache, accumulator);
            }
            else {
                newViewCache = viewProcessorRevertUserWrite(viewProcessor, oldViewCache, ackUserWrite.path, writesCache, completeCache, accumulator);
            }
        }
        else if (operation.type === OperationType.LISTEN_COMPLETE) {
            newViewCache = viewProcessorListenComplete(viewProcessor, oldViewCache, operation.path, writesCache, accumulator);
        }
        else {
            throw assertionError('Unknown operation type: ' + operation.type);
        }
        const changes = accumulator.getChanges();
        viewProcessorMaybeAddValueEvent(oldViewCache, newViewCache, changes);
        return { viewCache: newViewCache, changes };
    }
    function viewProcessorMaybeAddValueEvent(oldViewCache, newViewCache, accumulator) {
        const eventSnap = newViewCache.eventCache;
        if (eventSnap.isFullyInitialized()) {
            const isLeafOrEmpty = eventSnap.getNode().isLeafNode() || eventSnap.getNode().isEmpty();
            const oldCompleteSnap = viewCacheGetCompleteEventSnap(oldViewCache);
            if (accumulator.length > 0 ||
                !oldViewCache.eventCache.isFullyInitialized() ||
                (isLeafOrEmpty && !eventSnap.getNode().equals(oldCompleteSnap)) ||
                !eventSnap.getNode().getPriority().equals(oldCompleteSnap.getPriority())) {
                accumulator.push(changeValue(viewCacheGetCompleteEventSnap(newViewCache)));
            }
        }
    }
    function viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, viewCache, changePath, writesCache, source, accumulator) {
        const oldEventSnap = viewCache.eventCache;
        if (writeTreeRefShadowingWrite(writesCache, changePath) != null) {
            // we have a shadowing write, ignore changes
            return viewCache;
        }
        else {
            let newEventCache, serverNode;
            if (pathIsEmpty(changePath)) {
                // TODO: figure out how this plays with "sliding ack windows"
                assert(viewCache.serverCache.isFullyInitialized(), 'If change path is empty, we must have complete server data');
                if (viewCache.serverCache.isFiltered()) {
                    // We need to special case this, because we need to only apply writes to complete children, or
                    // we might end up raising events for incomplete children. If the server data is filtered deep
                    // writes cannot be guaranteed to be complete
                    const serverCache = viewCacheGetCompleteServerSnap(viewCache);
                    const completeChildren = serverCache instanceof ChildrenNode
                        ? serverCache
                        : ChildrenNode.EMPTY_NODE;
                    const completeEventChildren = writeTreeRefCalcCompleteEventChildren(writesCache, completeChildren);
                    newEventCache = viewProcessor.filter.updateFullNode(viewCache.eventCache.getNode(), completeEventChildren, accumulator);
                }
                else {
                    const completeNode = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
                    newEventCache = viewProcessor.filter.updateFullNode(viewCache.eventCache.getNode(), completeNode, accumulator);
                }
            }
            else {
                const childKey = pathGetFront(changePath);
                if (childKey === '.priority') {
                    assert(pathGetLength(changePath) === 1, "Can't have a priority with additional path components");
                    const oldEventNode = oldEventSnap.getNode();
                    serverNode = viewCache.serverCache.getNode();
                    // we might have overwrites for this priority
                    const updatedPriority = writeTreeRefCalcEventCacheAfterServerOverwrite(writesCache, changePath, oldEventNode, serverNode);
                    if (updatedPriority != null) {
                        newEventCache = viewProcessor.filter.updatePriority(oldEventNode, updatedPriority);
                    }
                    else {
                        // priority didn't change, keep old node
                        newEventCache = oldEventSnap.getNode();
                    }
                }
                else {
                    const childChangePath = pathPopFront(changePath);
                    // update child
                    let newEventChild;
                    if (oldEventSnap.isCompleteForChild(childKey)) {
                        serverNode = viewCache.serverCache.getNode();
                        const eventChildUpdate = writeTreeRefCalcEventCacheAfterServerOverwrite(writesCache, changePath, oldEventSnap.getNode(), serverNode);
                        if (eventChildUpdate != null) {
                            newEventChild = oldEventSnap
                                .getNode()
                                .getImmediateChild(childKey)
                                .updateChild(childChangePath, eventChildUpdate);
                        }
                        else {
                            // Nothing changed, just keep the old child
                            newEventChild = oldEventSnap.getNode().getImmediateChild(childKey);
                        }
                    }
                    else {
                        newEventChild = writeTreeRefCalcCompleteChild(writesCache, childKey, viewCache.serverCache);
                    }
                    if (newEventChild != null) {
                        newEventCache = viewProcessor.filter.updateChild(oldEventSnap.getNode(), childKey, newEventChild, childChangePath, source, accumulator);
                    }
                    else {
                        // no complete child available or no change
                        newEventCache = oldEventSnap.getNode();
                    }
                }
            }
            return viewCacheUpdateEventSnap(viewCache, newEventCache, oldEventSnap.isFullyInitialized() || pathIsEmpty(changePath), viewProcessor.filter.filtersNodes());
        }
    }
    function viewProcessorApplyServerOverwrite(viewProcessor, oldViewCache, changePath, changedSnap, writesCache, completeCache, filterServerNode, accumulator) {
        const oldServerSnap = oldViewCache.serverCache;
        let newServerCache;
        const serverFilter = filterServerNode
            ? viewProcessor.filter
            : viewProcessor.filter.getIndexedFilter();
        if (pathIsEmpty(changePath)) {
            newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), changedSnap, null);
        }
        else if (serverFilter.filtersNodes() && !oldServerSnap.isFiltered()) {
            // we want to filter the server node, but we didn't filter the server node yet, so simulate a full update
            const newServerNode = oldServerSnap
                .getNode()
                .updateChild(changePath, changedSnap);
            newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), newServerNode, null);
        }
        else {
            const childKey = pathGetFront(changePath);
            if (!oldServerSnap.isCompleteForPath(changePath) &&
                pathGetLength(changePath) > 1) {
                // We don't update incomplete nodes with updates intended for other listeners
                return oldViewCache;
            }
            const childChangePath = pathPopFront(changePath);
            const childNode = oldServerSnap.getNode().getImmediateChild(childKey);
            const newChildNode = childNode.updateChild(childChangePath, changedSnap);
            if (childKey === '.priority') {
                newServerCache = serverFilter.updatePriority(oldServerSnap.getNode(), newChildNode);
            }
            else {
                newServerCache = serverFilter.updateChild(oldServerSnap.getNode(), childKey, newChildNode, childChangePath, NO_COMPLETE_CHILD_SOURCE, null);
            }
        }
        const newViewCache = viewCacheUpdateServerSnap(oldViewCache, newServerCache, oldServerSnap.isFullyInitialized() || pathIsEmpty(changePath), serverFilter.filtersNodes());
        const source = new WriteTreeCompleteChildSource(writesCache, newViewCache, completeCache);
        return viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, newViewCache, changePath, writesCache, source, accumulator);
    }
    function viewProcessorApplyUserOverwrite(viewProcessor, oldViewCache, changePath, changedSnap, writesCache, completeCache, accumulator) {
        const oldEventSnap = oldViewCache.eventCache;
        let newViewCache, newEventCache;
        const source = new WriteTreeCompleteChildSource(writesCache, oldViewCache, completeCache);
        if (pathIsEmpty(changePath)) {
            newEventCache = viewProcessor.filter.updateFullNode(oldViewCache.eventCache.getNode(), changedSnap, accumulator);
            newViewCache = viewCacheUpdateEventSnap(oldViewCache, newEventCache, true, viewProcessor.filter.filtersNodes());
        }
        else {
            const childKey = pathGetFront(changePath);
            if (childKey === '.priority') {
                newEventCache = viewProcessor.filter.updatePriority(oldViewCache.eventCache.getNode(), changedSnap);
                newViewCache = viewCacheUpdateEventSnap(oldViewCache, newEventCache, oldEventSnap.isFullyInitialized(), oldEventSnap.isFiltered());
            }
            else {
                const childChangePath = pathPopFront(changePath);
                const oldChild = oldEventSnap.getNode().getImmediateChild(childKey);
                let newChild;
                if (pathIsEmpty(childChangePath)) {
                    // Child overwrite, we can replace the child
                    newChild = changedSnap;
                }
                else {
                    const childNode = source.getCompleteChild(childKey);
                    if (childNode != null) {
                        if (pathGetBack(childChangePath) === '.priority' &&
                            childNode.getChild(pathParent(childChangePath)).isEmpty()) {
                            // This is a priority update on an empty node. If this node exists on the server, the
                            // server will send down the priority in the update, so ignore for now
                            newChild = childNode;
                        }
                        else {
                            newChild = childNode.updateChild(childChangePath, changedSnap);
                        }
                    }
                    else {
                        // There is no complete child node available
                        newChild = ChildrenNode.EMPTY_NODE;
                    }
                }
                if (!oldChild.equals(newChild)) {
                    const newEventSnap = viewProcessor.filter.updateChild(oldEventSnap.getNode(), childKey, newChild, childChangePath, source, accumulator);
                    newViewCache = viewCacheUpdateEventSnap(oldViewCache, newEventSnap, oldEventSnap.isFullyInitialized(), viewProcessor.filter.filtersNodes());
                }
                else {
                    newViewCache = oldViewCache;
                }
            }
        }
        return newViewCache;
    }
    function viewProcessorCacheHasChild(viewCache, childKey) {
        return viewCache.eventCache.isCompleteForChild(childKey);
    }
    function viewProcessorApplyUserMerge(viewProcessor, viewCache, path, changedChildren, writesCache, serverCache, accumulator) {
        // HACK: In the case of a limit query, there may be some changes that bump things out of the
        // window leaving room for new items.  It's important we process these changes first, so we
        // iterate the changes twice, first processing any that affect items currently in view.
        // TODO: I consider an item "in view" if cacheHasChild is true, which checks both the server
        // and event snap.  I'm not sure if this will result in edge cases when a child is in one but
        // not the other.
        let curViewCache = viewCache;
        changedChildren.foreach((relativePath, childNode) => {
            const writePath = pathChild(path, relativePath);
            if (viewProcessorCacheHasChild(viewCache, pathGetFront(writePath))) {
                curViewCache = viewProcessorApplyUserOverwrite(viewProcessor, curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
            }
        });
        changedChildren.foreach((relativePath, childNode) => {
            const writePath = pathChild(path, relativePath);
            if (!viewProcessorCacheHasChild(viewCache, pathGetFront(writePath))) {
                curViewCache = viewProcessorApplyUserOverwrite(viewProcessor, curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
            }
        });
        return curViewCache;
    }
    function viewProcessorApplyMerge(viewProcessor, node, merge) {
        merge.foreach((relativePath, childNode) => {
            node = node.updateChild(relativePath, childNode);
        });
        return node;
    }
    function viewProcessorApplyServerMerge(viewProcessor, viewCache, path, changedChildren, writesCache, serverCache, filterServerNode, accumulator) {
        // If we don't have a cache yet, this merge was intended for a previously listen in the same location. Ignore it and
        // wait for the complete data update coming soon.
        if (viewCache.serverCache.getNode().isEmpty() &&
            !viewCache.serverCache.isFullyInitialized()) {
            return viewCache;
        }
        // HACK: In the case of a limit query, there may be some changes that bump things out of the
        // window leaving room for new items.  It's important we process these changes first, so we
        // iterate the changes twice, first processing any that affect items currently in view.
        // TODO: I consider an item "in view" if cacheHasChild is true, which checks both the server
        // and event snap.  I'm not sure if this will result in edge cases when a child is in one but
        // not the other.
        let curViewCache = viewCache;
        let viewMergeTree;
        if (pathIsEmpty(path)) {
            viewMergeTree = changedChildren;
        }
        else {
            viewMergeTree = new ImmutableTree(null).setTree(path, changedChildren);
        }
        const serverNode = viewCache.serverCache.getNode();
        viewMergeTree.children.inorderTraversal((childKey, childTree) => {
            if (serverNode.hasChild(childKey)) {
                const serverChild = viewCache.serverCache
                    .getNode()
                    .getImmediateChild(childKey);
                const newChild = viewProcessorApplyMerge(viewProcessor, serverChild, childTree);
                curViewCache = viewProcessorApplyServerOverwrite(viewProcessor, curViewCache, new Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
            }
        });
        viewMergeTree.children.inorderTraversal((childKey, childMergeTree) => {
            const isUnknownDeepMerge = !viewCache.serverCache.isCompleteForChild(childKey) &&
                childMergeTree.value === undefined;
            if (!serverNode.hasChild(childKey) && !isUnknownDeepMerge) {
                const serverChild = viewCache.serverCache
                    .getNode()
                    .getImmediateChild(childKey);
                const newChild = viewProcessorApplyMerge(viewProcessor, serverChild, childMergeTree);
                curViewCache = viewProcessorApplyServerOverwrite(viewProcessor, curViewCache, new Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
            }
        });
        return curViewCache;
    }
    function viewProcessorAckUserWrite(viewProcessor, viewCache, ackPath, affectedTree, writesCache, completeCache, accumulator) {
        if (writeTreeRefShadowingWrite(writesCache, ackPath) != null) {
            return viewCache;
        }
        // Only filter server node if it is currently filtered
        const filterServerNode = viewCache.serverCache.isFiltered();
        // Essentially we'll just get our existing server cache for the affected paths and re-apply it as a server update
        // now that it won't be shadowed.
        const serverCache = viewCache.serverCache;
        if (affectedTree.value != null) {
            // This is an overwrite.
            if ((pathIsEmpty(ackPath) && serverCache.isFullyInitialized()) ||
                serverCache.isCompleteForPath(ackPath)) {
                return viewProcessorApplyServerOverwrite(viewProcessor, viewCache, ackPath, serverCache.getNode().getChild(ackPath), writesCache, completeCache, filterServerNode, accumulator);
            }
            else if (pathIsEmpty(ackPath)) {
                // This is a goofy edge case where we are acking data at this location but don't have full data.  We
                // should just re-apply whatever we have in our cache as a merge.
                let changedChildren = new ImmutableTree(null);
                serverCache.getNode().forEachChild(KEY_INDEX, (name, node) => {
                    changedChildren = changedChildren.set(new Path(name), node);
                });
                return viewProcessorApplyServerMerge(viewProcessor, viewCache, ackPath, changedChildren, writesCache, completeCache, filterServerNode, accumulator);
            }
            else {
                return viewCache;
            }
        }
        else {
            // This is a merge.
            let changedChildren = new ImmutableTree(null);
            affectedTree.foreach((mergePath, value) => {
                const serverCachePath = pathChild(ackPath, mergePath);
                if (serverCache.isCompleteForPath(serverCachePath)) {
                    changedChildren = changedChildren.set(mergePath, serverCache.getNode().getChild(serverCachePath));
                }
            });
            return viewProcessorApplyServerMerge(viewProcessor, viewCache, ackPath, changedChildren, writesCache, completeCache, filterServerNode, accumulator);
        }
    }
    function viewProcessorListenComplete(viewProcessor, viewCache, path, writesCache, accumulator) {
        const oldServerNode = viewCache.serverCache;
        const newViewCache = viewCacheUpdateServerSnap(viewCache, oldServerNode.getNode(), oldServerNode.isFullyInitialized() || pathIsEmpty(path), oldServerNode.isFiltered());
        return viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, newViewCache, path, writesCache, NO_COMPLETE_CHILD_SOURCE, accumulator);
    }
    function viewProcessorRevertUserWrite(viewProcessor, viewCache, path, writesCache, completeServerCache, accumulator) {
        let complete;
        if (writeTreeRefShadowingWrite(writesCache, path) != null) {
            return viewCache;
        }
        else {
            const source = new WriteTreeCompleteChildSource(writesCache, viewCache, completeServerCache);
            const oldEventCache = viewCache.eventCache.getNode();
            let newEventCache;
            if (pathIsEmpty(path) || pathGetFront(path) === '.priority') {
                let newNode;
                if (viewCache.serverCache.isFullyInitialized()) {
                    newNode = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
                }
                else {
                    const serverChildren = viewCache.serverCache.getNode();
                    assert(serverChildren instanceof ChildrenNode, 'serverChildren would be complete if leaf node');
                    newNode = writeTreeRefCalcCompleteEventChildren(writesCache, serverChildren);
                }
                newNode = newNode;
                newEventCache = viewProcessor.filter.updateFullNode(oldEventCache, newNode, accumulator);
            }
            else {
                const childKey = pathGetFront(path);
                let newChild = writeTreeRefCalcCompleteChild(writesCache, childKey, viewCache.serverCache);
                if (newChild == null &&
                    viewCache.serverCache.isCompleteForChild(childKey)) {
                    newChild = oldEventCache.getImmediateChild(childKey);
                }
                if (newChild != null) {
                    newEventCache = viewProcessor.filter.updateChild(oldEventCache, childKey, newChild, pathPopFront(path), source, accumulator);
                }
                else if (viewCache.eventCache.getNode().hasChild(childKey)) {
                    // No complete child available, delete the existing one, if any
                    newEventCache = viewProcessor.filter.updateChild(oldEventCache, childKey, ChildrenNode.EMPTY_NODE, pathPopFront(path), source, accumulator);
                }
                else {
                    newEventCache = oldEventCache;
                }
                if (newEventCache.isEmpty() &&
                    viewCache.serverCache.isFullyInitialized()) {
                    // We might have reverted all child writes. Maybe the old event was a leaf node
                    complete = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
                    if (complete.isLeafNode()) {
                        newEventCache = viewProcessor.filter.updateFullNode(newEventCache, complete, accumulator);
                    }
                }
            }
            complete =
                viewCache.serverCache.isFullyInitialized() ||
                    writeTreeRefShadowingWrite(writesCache, newEmptyPath()) != null;
            return viewCacheUpdateEventSnap(viewCache, newEventCache, complete, viewProcessor.filter.filtersNodes());
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * A view represents a specific location and query that has 1 or more event registrations.
     *
     * It does several things:
     *  - Maintains the list of event registrations for this location/query.
     *  - Maintains a cache of the data visible for this location/query.
     *  - Applies new operations (via applyOperation), updates the cache, and based on the event
     *    registrations returns the set of events to be raised.
     */
    class View {
        constructor(query_, initialViewCache) {
            this.query_ = query_;
            this.eventRegistrations_ = [];
            const params = this.query_._queryParams;
            const indexFilter = new IndexedFilter(params.getIndex());
            const filter = queryParamsGetNodeFilter(params);
            this.processor_ = newViewProcessor(filter);
            const initialServerCache = initialViewCache.serverCache;
            const initialEventCache = initialViewCache.eventCache;
            // Don't filter server node with other filter than index, wait for tagged listen
            const serverSnap = indexFilter.updateFullNode(ChildrenNode.EMPTY_NODE, initialServerCache.getNode(), null);
            const eventSnap = filter.updateFullNode(ChildrenNode.EMPTY_NODE, initialEventCache.getNode(), null);
            const newServerCache = new CacheNode(serverSnap, initialServerCache.isFullyInitialized(), indexFilter.filtersNodes());
            const newEventCache = new CacheNode(eventSnap, initialEventCache.isFullyInitialized(), filter.filtersNodes());
            this.viewCache_ = newViewCache(newEventCache, newServerCache);
            this.eventGenerator_ = new EventGenerator(this.query_);
        }
        get query() {
            return this.query_;
        }
    }
    function viewGetCompleteNode(view) {
        return viewCacheGetCompleteEventSnap(view.viewCache_);
    }
    function viewGetCompleteServerCache(view, path) {
        const cache = viewCacheGetCompleteServerSnap(view.viewCache_);
        if (cache) {
            // If this isn't a "loadsAllData" view, then cache isn't actually a complete cache and
            // we need to see if it contains the child we're interested in.
            if (view.query._queryParams.loadsAllData() ||
                (!pathIsEmpty(path) &&
                    !cache.getImmediateChild(pathGetFront(path)).isEmpty())) {
                return cache.getChild(path);
            }
        }
        return null;
    }
    /**
     * Applies the given Operation, updates our cache, and returns the appropriate events.
     */
    function viewApplyOperation(view, operation, writesCache, completeServerCache) {
        if (operation.type === OperationType.MERGE &&
            operation.source.queryId !== null) {
            assert(viewCacheGetCompleteServerSnap(view.viewCache_), 'We should always have a full cache before handling merges');
            assert(viewCacheGetCompleteEventSnap(view.viewCache_), 'Missing event cache, even though we have a server cache');
        }
        const oldViewCache = view.viewCache_;
        const result = viewProcessorApplyOperation(view.processor_, oldViewCache, operation, writesCache, completeServerCache);
        viewProcessorAssertIndexed(view.processor_, result.viewCache);
        assert(result.viewCache.serverCache.isFullyInitialized() ||
            !oldViewCache.serverCache.isFullyInitialized(), 'Once a server snap is complete, it should never go back');
        view.viewCache_ = result.viewCache;
        return viewGenerateEventsForChanges_(view, result.changes, result.viewCache.eventCache.getNode(), null);
    }
    function viewGenerateEventsForChanges_(view, changes, eventCache, eventRegistration) {
        const registrations = eventRegistration
            ? [eventRegistration]
            : view.eventRegistrations_;
        return eventGeneratorGenerateEventsForChanges(view.eventGenerator_, changes, eventCache, registrations);
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let referenceConstructor$1;
    /**
     * SyncPoint represents a single location in a SyncTree with 1 or more event registrations, meaning we need to
     * maintain 1 or more Views at this location to cache server data and raise appropriate events for server changes
     * and user writes (set, transaction, update).
     *
     * It's responsible for:
     *  - Maintaining the set of 1 or more views necessary at this location (a SyncPoint with 0 views should be removed).
     *  - Proxying user / server operations to the views as appropriate (i.e. applyServerOverwrite,
     *    applyUserOverwrite, etc.)
     */
    class SyncPoint {
        constructor() {
            /**
             * The Views being tracked at this location in the tree, stored as a map where the key is a
             * queryId and the value is the View for that query.
             *
             * NOTE: This list will be quite small (usually 1, but perhaps 2 or 3; any more is an odd use case).
             */
            this.views = new Map();
        }
    }
    function syncPointSetReferenceConstructor(val) {
        assert(!referenceConstructor$1, '__referenceConstructor has already been defined');
        referenceConstructor$1 = val;
    }
    function syncPointApplyOperation(syncPoint, operation, writesCache, optCompleteServerCache) {
        const queryId = operation.source.queryId;
        if (queryId !== null) {
            const view = syncPoint.views.get(queryId);
            assert(view != null, 'SyncTree gave us an op for an invalid query.');
            return viewApplyOperation(view, operation, writesCache, optCompleteServerCache);
        }
        else {
            let events = [];
            for (const view of syncPoint.views.values()) {
                events = events.concat(viewApplyOperation(view, operation, writesCache, optCompleteServerCache));
            }
            return events;
        }
    }
    /**
     * Get a view for the specified query.
     *
     * @param query - The query to return a view for
     * @param writesCache
     * @param serverCache
     * @param serverCacheComplete
     * @returns Events to raise.
     */
    function syncPointGetView(syncPoint, query, writesCache, serverCache, serverCacheComplete) {
        const queryId = query._queryIdentifier;
        const view = syncPoint.views.get(queryId);
        if (!view) {
            // TODO: make writesCache take flag for complete server node
            let eventCache = writeTreeRefCalcCompleteEventCache(writesCache, serverCacheComplete ? serverCache : null);
            let eventCacheComplete = false;
            if (eventCache) {
                eventCacheComplete = true;
            }
            else if (serverCache instanceof ChildrenNode) {
                eventCache = writeTreeRefCalcCompleteEventChildren(writesCache, serverCache);
                eventCacheComplete = false;
            }
            else {
                eventCache = ChildrenNode.EMPTY_NODE;
                eventCacheComplete = false;
            }
            const viewCache = newViewCache(new CacheNode(eventCache, eventCacheComplete, false), new CacheNode(serverCache, serverCacheComplete, false));
            return new View(query, viewCache);
        }
        return view;
    }
    /**
     * @param path - The path to the desired complete snapshot
     * @returns A complete cache, if it exists
     */
    function syncPointGetCompleteServerCache(syncPoint, path) {
        let serverCache = null;
        for (const view of syncPoint.views.values()) {
            serverCache = serverCache || viewGetCompleteServerCache(view, path);
        }
        return serverCache;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let referenceConstructor;
    function syncTreeSetReferenceConstructor(val) {
        assert(!referenceConstructor, '__referenceConstructor has already been defined');
        referenceConstructor = val;
    }
    /**
     * SyncTree is the central class for managing event callback registration, data caching, views
     * (query processing), and event generation.  There are typically two SyncTree instances for
     * each Repo, one for the normal Firebase data, and one for the .info data.
     *
     * It has a number of responsibilities, including:
     *  - Tracking all user event callbacks (registered via addEventRegistration() and removeEventRegistration()).
     *  - Applying and caching data changes for user set(), transaction(), and update() calls
     *    (applyUserOverwrite(), applyUserMerge()).
     *  - Applying and caching data changes for server data changes (applyServerOverwrite(),
     *    applyServerMerge()).
     *  - Generating user-facing events for server and user changes (all of the apply* methods
     *    return the set of events that need to be raised as a result).
     *  - Maintaining the appropriate set of server listens to ensure we are always subscribed
     *    to the correct set of paths and queries to satisfy the current set of user event
     *    callbacks (listens are started/stopped using the provided listenProvider).
     *
     * NOTE: Although SyncTree tracks event callbacks and calculates events to raise, the actual
     * events are returned to the caller rather than raised synchronously.
     *
     */
    class SyncTree {
        /**
         * @param listenProvider_ - Used by SyncTree to start / stop listening
         *   to server data.
         */
        constructor(listenProvider_) {
            this.listenProvider_ = listenProvider_;
            /**
             * Tree of SyncPoints.  There's a SyncPoint at any location that has 1 or more views.
             */
            this.syncPointTree_ = new ImmutableTree(null);
            /**
             * A tree of all pending user writes (user-initiated set()'s, transaction()'s, update()'s, etc.).
             */
            this.pendingWriteTree_ = newWriteTree();
            this.tagToQueryMap = new Map();
            this.queryToTagMap = new Map();
        }
    }
    /**
     * Apply the data changes for a user-generated set() or transaction() call.
     *
     * @returns Events to raise.
     */
    function syncTreeApplyUserOverwrite(syncTree, path, newData, writeId, visible) {
        // Record pending write.
        writeTreeAddOverwrite(syncTree.pendingWriteTree_, path, newData, writeId, visible);
        if (!visible) {
            return [];
        }
        else {
            return syncTreeApplyOperationToSyncPoints_(syncTree, new Overwrite(newOperationSourceUser(), path, newData));
        }
    }
    /**
     * Acknowledge a pending user write that was previously registered with applyUserOverwrite() or applyUserMerge().
     *
     * @param revert - True if the given write failed and needs to be reverted
     * @returns Events to raise.
     */
    function syncTreeAckUserWrite(syncTree, writeId, revert = false) {
        const write = writeTreeGetWrite(syncTree.pendingWriteTree_, writeId);
        const needToReevaluate = writeTreeRemoveWrite(syncTree.pendingWriteTree_, writeId);
        if (!needToReevaluate) {
            return [];
        }
        else {
            let affectedTree = new ImmutableTree(null);
            if (write.snap != null) {
                // overwrite
                affectedTree = affectedTree.set(newEmptyPath(), true);
            }
            else {
                each(write.children, (pathString) => {
                    affectedTree = affectedTree.set(new Path(pathString), true);
                });
            }
            return syncTreeApplyOperationToSyncPoints_(syncTree, new AckUserWrite(write.path, affectedTree, revert));
        }
    }
    /**
     * Apply new server data for the specified path..
     *
     * @returns Events to raise.
     */
    function syncTreeApplyServerOverwrite(syncTree, path, newData) {
        return syncTreeApplyOperationToSyncPoints_(syncTree, new Overwrite(newOperationSourceServer(), path, newData));
    }
    /**
     * Apply new server data to be merged in at the specified path.
     *
     * @returns Events to raise.
     */
    function syncTreeApplyServerMerge(syncTree, path, changedChildren) {
        const changeTree = ImmutableTree.fromObject(changedChildren);
        return syncTreeApplyOperationToSyncPoints_(syncTree, new Merge(newOperationSourceServer(), path, changeTree));
    }
    /**
     * Apply new server data for the specified tagged query.
     *
     * @returns Events to raise.
     */
    function syncTreeApplyTaggedQueryOverwrite(syncTree, path, snap, tag) {
        const queryKey = syncTreeQueryKeyForTag_(syncTree, tag);
        if (queryKey != null) {
            const r = syncTreeParseQueryKey_(queryKey);
            const queryPath = r.path, queryId = r.queryId;
            const relativePath = newRelativePath(queryPath, path);
            const op = new Overwrite(newOperationSourceServerTaggedQuery(queryId), relativePath, snap);
            return syncTreeApplyTaggedOperation_(syncTree, queryPath, op);
        }
        else {
            // Query must have been removed already
            return [];
        }
    }
    /**
     * Apply server data to be merged in for the specified tagged query.
     *
     * @returns Events to raise.
     */
    function syncTreeApplyTaggedQueryMerge(syncTree, path, changedChildren, tag) {
        const queryKey = syncTreeQueryKeyForTag_(syncTree, tag);
        if (queryKey) {
            const r = syncTreeParseQueryKey_(queryKey);
            const queryPath = r.path, queryId = r.queryId;
            const relativePath = newRelativePath(queryPath, path);
            const changeTree = ImmutableTree.fromObject(changedChildren);
            const op = new Merge(newOperationSourceServerTaggedQuery(queryId), relativePath, changeTree);
            return syncTreeApplyTaggedOperation_(syncTree, queryPath, op);
        }
        else {
            // We've already removed the query. No big deal, ignore the update
            return [];
        }
    }
    /**
     * Returns a complete cache, if we have one, of the data at a particular path. If the location does not have a
     * listener above it, we will get a false "null". This shouldn't be a problem because transactions will always
     * have a listener above, and atomic operations would correctly show a jitter of <increment value> ->
     *     <incremented total> as the write is applied locally and then acknowledged at the server.
     *
     * Note: this method will *include* hidden writes from transaction with applyLocally set to false.
     *
     * @param path - The path to the data we want
     * @param writeIdsToExclude - A specific set to be excluded
     */
    function syncTreeCalcCompleteEventCache(syncTree, path, writeIdsToExclude) {
        const includeHiddenSets = true;
        const writeTree = syncTree.pendingWriteTree_;
        const serverCache = syncTree.syncPointTree_.findOnPath(path, (pathSoFar, syncPoint) => {
            const relativePath = newRelativePath(pathSoFar, path);
            const serverCache = syncPointGetCompleteServerCache(syncPoint, relativePath);
            if (serverCache) {
                return serverCache;
            }
        });
        return writeTreeCalcCompleteEventCache(writeTree, path, serverCache, writeIdsToExclude, includeHiddenSets);
    }
    function syncTreeGetServerValue(syncTree, query) {
        const path = query._path;
        let serverCache = null;
        // Any covering writes will necessarily be at the root, so really all we need to find is the server cache.
        // Consider optimizing this once there's a better understanding of what actual behavior will be.
        syncTree.syncPointTree_.foreachOnPath(path, (pathToSyncPoint, sp) => {
            const relativePath = newRelativePath(pathToSyncPoint, path);
            serverCache =
                serverCache || syncPointGetCompleteServerCache(sp, relativePath);
        });
        let syncPoint = syncTree.syncPointTree_.get(path);
        if (!syncPoint) {
            syncPoint = new SyncPoint();
            syncTree.syncPointTree_ = syncTree.syncPointTree_.set(path, syncPoint);
        }
        else {
            serverCache =
                serverCache || syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
        }
        const serverCacheComplete = serverCache != null;
        const serverCacheNode = serverCacheComplete
            ? new CacheNode(serverCache, true, false)
            : null;
        const writesCache = writeTreeChildWrites(syncTree.pendingWriteTree_, query._path);
        const view = syncPointGetView(syncPoint, query, writesCache, serverCacheComplete ? serverCacheNode.getNode() : ChildrenNode.EMPTY_NODE, serverCacheComplete);
        return viewGetCompleteNode(view);
    }
    /**
     * A helper method that visits all descendant and ancestor SyncPoints, applying the operation.
     *
     * NOTES:
     * - Descendant SyncPoints will be visited first (since we raise events depth-first).
     *
     * - We call applyOperation() on each SyncPoint passing three things:
     *   1. A version of the Operation that has been made relative to the SyncPoint location.
     *   2. A WriteTreeRef of any writes we have cached at the SyncPoint location.
     *   3. A snapshot Node with cached server data, if we have it.
     *
     * - We concatenate all of the events returned by each SyncPoint and return the result.
     */
    function syncTreeApplyOperationToSyncPoints_(syncTree, operation) {
        return syncTreeApplyOperationHelper_(operation, syncTree.syncPointTree_, 
        /*serverCache=*/ null, writeTreeChildWrites(syncTree.pendingWriteTree_, newEmptyPath()));
    }
    /**
     * Recursive helper for applyOperationToSyncPoints_
     */
    function syncTreeApplyOperationHelper_(operation, syncPointTree, serverCache, writesCache) {
        if (pathIsEmpty(operation.path)) {
            return syncTreeApplyOperationDescendantsHelper_(operation, syncPointTree, serverCache, writesCache);
        }
        else {
            const syncPoint = syncPointTree.get(newEmptyPath());
            // If we don't have cached server data, see if we can get it from this SyncPoint.
            if (serverCache == null && syncPoint != null) {
                serverCache = syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
            }
            let events = [];
            const childName = pathGetFront(operation.path);
            const childOperation = operation.operationForChild(childName);
            const childTree = syncPointTree.children.get(childName);
            if (childTree && childOperation) {
                const childServerCache = serverCache
                    ? serverCache.getImmediateChild(childName)
                    : null;
                const childWritesCache = writeTreeRefChild(writesCache, childName);
                events = events.concat(syncTreeApplyOperationHelper_(childOperation, childTree, childServerCache, childWritesCache));
            }
            if (syncPoint) {
                events = events.concat(syncPointApplyOperation(syncPoint, operation, writesCache, serverCache));
            }
            return events;
        }
    }
    /**
     * Recursive helper for applyOperationToSyncPoints_
     */
    function syncTreeApplyOperationDescendantsHelper_(operation, syncPointTree, serverCache, writesCache) {
        const syncPoint = syncPointTree.get(newEmptyPath());
        // If we don't have cached server data, see if we can get it from this SyncPoint.
        if (serverCache == null && syncPoint != null) {
            serverCache = syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
        }
        let events = [];
        syncPointTree.children.inorderTraversal((childName, childTree) => {
            const childServerCache = serverCache
                ? serverCache.getImmediateChild(childName)
                : null;
            const childWritesCache = writeTreeRefChild(writesCache, childName);
            const childOperation = operation.operationForChild(childName);
            if (childOperation) {
                events = events.concat(syncTreeApplyOperationDescendantsHelper_(childOperation, childTree, childServerCache, childWritesCache));
            }
        });
        if (syncPoint) {
            events = events.concat(syncPointApplyOperation(syncPoint, operation, writesCache, serverCache));
        }
        return events;
    }
    /**
     * Return the query associated with the given tag, if we have one
     */
    function syncTreeQueryKeyForTag_(syncTree, tag) {
        return syncTree.tagToQueryMap.get(tag);
    }
    /**
     * Given a queryKey (created by makeQueryKey), parse it back into a path and queryId.
     */
    function syncTreeParseQueryKey_(queryKey) {
        const splitIndex = queryKey.indexOf('$');
        assert(splitIndex !== -1 && splitIndex < queryKey.length - 1, 'Bad queryKey.');
        return {
            queryId: queryKey.substr(splitIndex + 1),
            path: new Path(queryKey.substr(0, splitIndex))
        };
    }
    /**
     * A helper method to apply tagged operations
     */
    function syncTreeApplyTaggedOperation_(syncTree, queryPath, operation) {
        const syncPoint = syncTree.syncPointTree_.get(queryPath);
        assert(syncPoint, "Missing sync point for query tag that we're tracking");
        const writesCache = writeTreeChildWrites(syncTree.pendingWriteTree_, queryPath);
        return syncPointApplyOperation(syncPoint, operation, writesCache, null);
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class ExistingValueProvider {
        constructor(node_) {
            this.node_ = node_;
        }
        getImmediateChild(childName) {
            const child = this.node_.getImmediateChild(childName);
            return new ExistingValueProvider(child);
        }
        node() {
            return this.node_;
        }
    }
    class DeferredValueProvider {
        constructor(syncTree, path) {
            this.syncTree_ = syncTree;
            this.path_ = path;
        }
        getImmediateChild(childName) {
            const childPath = pathChild(this.path_, childName);
            return new DeferredValueProvider(this.syncTree_, childPath);
        }
        node() {
            return syncTreeCalcCompleteEventCache(this.syncTree_, this.path_);
        }
    }
    /**
     * Generate placeholders for deferred values.
     */
    const generateWithValues = function (values) {
        values = values || {};
        values['timestamp'] = values['timestamp'] || new Date().getTime();
        return values;
    };
    /**
     * Value to use when firing local events. When writing server values, fire
     * local events with an approximate value, otherwise return value as-is.
     */
    const resolveDeferredLeafValue = function (value, existingVal, serverValues) {
        if (!value || typeof value !== 'object') {
            return value;
        }
        assert('.sv' in value, 'Unexpected leaf node or priority contents');
        if (typeof value['.sv'] === 'string') {
            return resolveScalarDeferredValue(value['.sv'], existingVal, serverValues);
        }
        else if (typeof value['.sv'] === 'object') {
            return resolveComplexDeferredValue(value['.sv'], existingVal);
        }
        else {
            assert(false, 'Unexpected server value: ' + JSON.stringify(value, null, 2));
        }
    };
    const resolveScalarDeferredValue = function (op, existing, serverValues) {
        switch (op) {
            case 'timestamp':
                return serverValues['timestamp'];
            default:
                assert(false, 'Unexpected server value: ' + op);
        }
    };
    const resolveComplexDeferredValue = function (op, existing, unused) {
        if (!op.hasOwnProperty('increment')) {
            assert(false, 'Unexpected server value: ' + JSON.stringify(op, null, 2));
        }
        const delta = op['increment'];
        if (typeof delta !== 'number') {
            assert(false, 'Unexpected increment value: ' + delta);
        }
        const existingNode = existing.node();
        assert(existingNode !== null && typeof existingNode !== 'undefined', 'Expected ChildrenNode.EMPTY_NODE for nulls');
        // Incrementing a non-number sets the value to the incremented amount
        if (!existingNode.isLeafNode()) {
            return delta;
        }
        const leaf = existingNode;
        const existingVal = leaf.getValue();
        if (typeof existingVal !== 'number') {
            return delta;
        }
        // No need to do over/underflow arithmetic here because JS only handles floats under the covers
        return existingVal + delta;
    };
    /**
     * Recursively replace all deferred values and priorities in the tree with the
     * specified generated replacement values.
     * @param path - path to which write is relative
     * @param node - new data written at path
     * @param syncTree - current data
     */
    const resolveDeferredValueTree = function (path, node, syncTree, serverValues) {
        return resolveDeferredValue(node, new DeferredValueProvider(syncTree, path), serverValues);
    };
    /**
     * Recursively replace all deferred values and priorities in the node with the
     * specified generated replacement values.  If there are no server values in the node,
     * it'll be returned as-is.
     */
    const resolveDeferredValueSnapshot = function (node, existing, serverValues) {
        return resolveDeferredValue(node, new ExistingValueProvider(existing), serverValues);
    };
    function resolveDeferredValue(node, existingVal, serverValues) {
        const rawPri = node.getPriority().val();
        const priority = resolveDeferredLeafValue(rawPri, existingVal.getImmediateChild('.priority'), serverValues);
        let newNode;
        if (node.isLeafNode()) {
            const leafNode = node;
            const value = resolveDeferredLeafValue(leafNode.getValue(), existingVal, serverValues);
            if (value !== leafNode.getValue() ||
                priority !== leafNode.getPriority().val()) {
                return new LeafNode(value, nodeFromJSON(priority));
            }
            else {
                return node;
            }
        }
        else {
            const childrenNode = node;
            newNode = childrenNode;
            if (priority !== childrenNode.getPriority().val()) {
                newNode = newNode.updatePriority(new LeafNode(priority));
            }
            childrenNode.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
                const newChildNode = resolveDeferredValue(childNode, existingVal.getImmediateChild(childName), serverValues);
                if (newChildNode !== childNode) {
                    newNode = newNode.updateImmediateChild(childName, newChildNode);
                }
            });
            return newNode;
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * A light-weight tree, traversable by path.  Nodes can have both values and children.
     * Nodes are not enumerated (by forEachChild) unless they have a value or non-empty
     * children.
     */
    class Tree {
        /**
         * @param name - Optional name of the node.
         * @param parent - Optional parent node.
         * @param node - Optional node to wrap.
         */
        constructor(name = '', parent = null, node = { children: {}, childCount: 0 }) {
            this.name = name;
            this.parent = parent;
            this.node = node;
        }
    }
    /**
     * Returns a sub-Tree for the given path.
     *
     * @param pathObj - Path to look up.
     * @returns Tree for path.
     */
    function treeSubTree(tree, pathObj) {
        // TODO: Require pathObj to be Path?
        let path = pathObj instanceof Path ? pathObj : new Path(pathObj);
        let child = tree, next = pathGetFront(path);
        while (next !== null) {
            const childNode = safeGet(child.node.children, next) || {
                children: {},
                childCount: 0
            };
            child = new Tree(next, child, childNode);
            path = pathPopFront(path);
            next = pathGetFront(path);
        }
        return child;
    }
    /**
     * Returns the data associated with this tree node.
     *
     * @returns The data or null if no data exists.
     */
    function treeGetValue(tree) {
        return tree.node.value;
    }
    /**
     * Sets data to this tree node.
     *
     * @param value - Value to set.
     */
    function treeSetValue(tree, value) {
        tree.node.value = value;
        treeUpdateParents(tree);
    }
    /**
     * @returns Whether the tree has any children.
     */
    function treeHasChildren(tree) {
        return tree.node.childCount > 0;
    }
    /**
     * @returns Whethe rthe tree is empty (no value or children).
     */
    function treeIsEmpty(tree) {
        return treeGetValue(tree) === undefined && !treeHasChildren(tree);
    }
    /**
     * Calls action for each child of this tree node.
     *
     * @param action - Action to be called for each child.
     */
    function treeForEachChild(tree, action) {
        each(tree.node.children, (child, childTree) => {
            action(new Tree(child, tree, childTree));
        });
    }
    /**
     * Does a depth-first traversal of this node's descendants, calling action for each one.
     *
     * @param action - Action to be called for each child.
     * @param includeSelf - Whether to call action on this node as well. Defaults to
     *   false.
     * @param childrenFirst - Whether to call action on children before calling it on
     *   parent.
     */
    function treeForEachDescendant(tree, action, includeSelf, childrenFirst) {
        if (includeSelf && !childrenFirst) {
            action(tree);
        }
        treeForEachChild(tree, child => {
            treeForEachDescendant(child, action, true, childrenFirst);
        });
        if (includeSelf && childrenFirst) {
            action(tree);
        }
    }
    /**
     * Calls action on each ancestor node.
     *
     * @param action - Action to be called on each parent; return
     *   true to abort.
     * @param includeSelf - Whether to call action on this node as well.
     * @returns true if the action callback returned true.
     */
    function treeForEachAncestor(tree, action, includeSelf) {
        let node = includeSelf ? tree : tree.parent;
        while (node !== null) {
            if (action(node)) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }
    /**
     * @returns The path of this tree node, as a Path.
     */
    function treeGetPath(tree) {
        return new Path(tree.parent === null
            ? tree.name
            : treeGetPath(tree.parent) + '/' + tree.name);
    }
    /**
     * Adds or removes this child from its parent based on whether it's empty or not.
     */
    function treeUpdateParents(tree) {
        if (tree.parent !== null) {
            treeUpdateChild(tree.parent, tree.name, tree);
        }
    }
    /**
     * Adds or removes the passed child to this tree node, depending on whether it's empty.
     *
     * @param childName - The name of the child to update.
     * @param child - The child to update.
     */
    function treeUpdateChild(tree, childName, child) {
        const childEmpty = treeIsEmpty(child);
        const childExists = contains(tree.node.children, childName);
        if (childEmpty && childExists) {
            delete tree.node.children[childName];
            tree.node.childCount--;
            treeUpdateParents(tree);
        }
        else if (!childEmpty && !childExists) {
            tree.node.children[childName] = child.node;
            tree.node.childCount++;
            treeUpdateParents(tree);
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * True for invalid Firebase keys
     */
    const INVALID_KEY_REGEX_ = /[\[\].#$\/\u0000-\u001F\u007F]/;
    /**
     * True for invalid Firebase paths.
     * Allows '/' in paths.
     */
    const INVALID_PATH_REGEX_ = /[\[\].#$\u0000-\u001F\u007F]/;
    /**
     * Maximum number of characters to allow in leaf value
     */
    const MAX_LEAF_SIZE_ = 10 * 1024 * 1024;
    const isValidKey = function (key) {
        return (typeof key === 'string' && key.length !== 0 && !INVALID_KEY_REGEX_.test(key));
    };
    const isValidPathString = function (pathString) {
        return (typeof pathString === 'string' &&
            pathString.length !== 0 &&
            !INVALID_PATH_REGEX_.test(pathString));
    };
    const isValidRootPathString = function (pathString) {
        if (pathString) {
            // Allow '/.info/' at the beginning.
            pathString = pathString.replace(/^\/*\.info(\/|$)/, '/');
        }
        return isValidPathString(pathString);
    };
    /**
     * Validate a data object client-side before sending to server.
     */
    const validateFirebaseData = function (errorPrefix, data, path_) {
        const path = path_ instanceof Path ? new ValidationPath(path_, errorPrefix) : path_;
        if (data === undefined) {
            throw new Error(errorPrefix + 'contains undefined ' + validationPathToErrorString(path));
        }
        if (typeof data === 'function') {
            throw new Error(errorPrefix +
                'contains a function ' +
                validationPathToErrorString(path) +
                ' with contents = ' +
                data.toString());
        }
        if (isInvalidJSONNumber(data)) {
            throw new Error(errorPrefix +
                'contains ' +
                data.toString() +
                ' ' +
                validationPathToErrorString(path));
        }
        // Check max leaf size, but try to avoid the utf8 conversion if we can.
        if (typeof data === 'string' &&
            data.length > MAX_LEAF_SIZE_ / 3 &&
            stringLength(data) > MAX_LEAF_SIZE_) {
            throw new Error(errorPrefix +
                'contains a string greater than ' +
                MAX_LEAF_SIZE_ +
                ' utf8 bytes ' +
                validationPathToErrorString(path) +
                " ('" +
                data.substring(0, 50) +
                "...')");
        }
        // TODO = Perf = Consider combining the recursive validation of keys into NodeFromJSON
        // to save extra walking of large objects.
        if (data && typeof data === 'object') {
            let hasDotValue = false;
            let hasActualChild = false;
            each(data, (key, value) => {
                if (key === '.value') {
                    hasDotValue = true;
                }
                else if (key !== '.priority' && key !== '.sv') {
                    hasActualChild = true;
                    if (!isValidKey(key)) {
                        throw new Error(errorPrefix +
                            ' contains an invalid key (' +
                            key +
                            ') ' +
                            validationPathToErrorString(path) +
                            '.  Keys must be non-empty strings ' +
                            'and can\'t contain ".", "#", "$", "/", "[", or "]"');
                    }
                }
                validationPathPush(path, key);
                validateFirebaseData(errorPrefix, value, path);
                validationPathPop(path);
            });
            if (hasDotValue && hasActualChild) {
                throw new Error(errorPrefix +
                    ' contains ".value" child ' +
                    validationPathToErrorString(path) +
                    ' in addition to actual children.');
            }
        }
    };
    /**
     * @internal
     */
    const validatePathString = function (fnName, argumentName, pathString, optional) {
        if (optional && pathString === undefined) {
            return;
        }
        if (!isValidPathString(pathString)) {
            throw new Error(errorPrefix(fnName, argumentName) +
                'was an invalid path = "' +
                pathString +
                '". Paths must be non-empty strings and ' +
                'can\'t contain ".", "#", "$", "[", or "]"');
        }
    };
    const validateRootPathString = function (fnName, argumentName, pathString, optional) {
        if (pathString) {
            // Allow '/.info/' at the beginning.
            pathString = pathString.replace(/^\/*\.info(\/|$)/, '/');
        }
        validatePathString(fnName, argumentName, pathString, optional);
    };
    const validateUrl = function (fnName, parsedUrl) {
        // TODO = Validate server better.
        const pathString = parsedUrl.path.toString();
        if (!(typeof parsedUrl.repoInfo.host === 'string') ||
            parsedUrl.repoInfo.host.length === 0 ||
            (!isValidKey(parsedUrl.repoInfo.namespace) &&
                parsedUrl.repoInfo.host.split(':')[0] !== 'localhost') ||
            (pathString.length !== 0 && !isValidRootPathString(pathString))) {
            throw new Error(errorPrefix(fnName, 'url') +
                'must be a valid firebase URL and ' +
                'the path can\'t contain ".", "#", "$", "[", or "]".');
        }
    };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The event queue serves a few purposes:
     * 1. It ensures we maintain event order in the face of event callbacks doing operations that result in more
     *    events being queued.
     * 2. raiseQueuedEvents() handles being called reentrantly nicely.  That is, if in the course of raising events,
     *    raiseQueuedEvents() is called again, the "inner" call will pick up raising events where the "outer" call
     *    left off, ensuring that the events are still raised synchronously and in order.
     * 3. You can use raiseEventsAtPath and raiseEventsForChangedPath to ensure only relevant previously-queued
     *    events are raised synchronously.
     *
     * NOTE: This can all go away if/when we move to async events.
     *
     */
    class EventQueue {
        constructor() {
            this.eventLists_ = [];
            /**
             * Tracks recursion depth of raiseQueuedEvents_, for debugging purposes.
             */
            this.recursionDepth_ = 0;
        }
    }
    /**
     * @param eventDataList - The new events to queue.
     */
    function eventQueueQueueEvents(eventQueue, eventDataList) {
        // We group events by path, storing them in a single EventList, to make it easier to skip over them quickly.
        let currList = null;
        for (let i = 0; i < eventDataList.length; i++) {
            const data = eventDataList[i];
            const path = data.getPath();
            if (currList !== null && !pathEquals(path, currList.path)) {
                eventQueue.eventLists_.push(currList);
                currList = null;
            }
            if (currList === null) {
                currList = { events: [], path };
            }
            currList.events.push(data);
        }
        if (currList) {
            eventQueue.eventLists_.push(currList);
        }
    }
    /**
     * Queues the specified events and synchronously raises all events (including previously queued ones)
     * for the specified path.
     *
     * It is assumed that the new events are all for the specified path.
     *
     * @param path - The path to raise events for.
     * @param eventDataList - The new events to raise.
     */
    function eventQueueRaiseEventsAtPath(eventQueue, path, eventDataList) {
        eventQueueQueueEvents(eventQueue, eventDataList);
        eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, eventPath => pathEquals(eventPath, path));
    }
    /**
     * Queues the specified events and synchronously raises all events (including previously queued ones) for
     * locations related to the specified change path (i.e. all ancestors and descendants).
     *
     * It is assumed that the new events are all related (ancestor or descendant) to the specified path.
     *
     * @param changedPath - The path to raise events for.
     * @param eventDataList - The events to raise
     */
    function eventQueueRaiseEventsForChangedPath(eventQueue, changedPath, eventDataList) {
        eventQueueQueueEvents(eventQueue, eventDataList);
        eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, eventPath => pathContains(eventPath, changedPath) ||
            pathContains(changedPath, eventPath));
    }
    function eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, predicate) {
        eventQueue.recursionDepth_++;
        let sentAll = true;
        for (let i = 0; i < eventQueue.eventLists_.length; i++) {
            const eventList = eventQueue.eventLists_[i];
            if (eventList) {
                const eventPath = eventList.path;
                if (predicate(eventPath)) {
                    eventListRaise(eventQueue.eventLists_[i]);
                    eventQueue.eventLists_[i] = null;
                }
                else {
                    sentAll = false;
                }
            }
        }
        if (sentAll) {
            eventQueue.eventLists_ = [];
        }
        eventQueue.recursionDepth_--;
    }
    /**
     * Iterates through the list and raises each event
     */
    function eventListRaise(eventList) {
        for (let i = 0; i < eventList.events.length; i++) {
            const eventData = eventList.events[i];
            if (eventData !== null) {
                eventList.events[i] = null;
                const eventFn = eventData.getEventRunner();
                if (logger) {
                    log('event: ' + eventData.toString());
                }
                exceptionGuard(eventFn);
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const INTERRUPT_REASON = 'repo_interrupt';
    /**
     * If a transaction does not succeed after 25 retries, we abort it. Among other
     * things this ensure that if there's ever a bug causing a mismatch between
     * client / server hashes for some data, we won't retry indefinitely.
     */
    const MAX_TRANSACTION_RETRIES = 25;
    /**
     * A connection to a single data repository.
     */
    class Repo {
        constructor(repoInfo_, forceRestClient_, authTokenProvider_, appCheckProvider_) {
            this.repoInfo_ = repoInfo_;
            this.forceRestClient_ = forceRestClient_;
            this.authTokenProvider_ = authTokenProvider_;
            this.appCheckProvider_ = appCheckProvider_;
            this.dataUpdateCount = 0;
            this.statsListener_ = null;
            this.eventQueue_ = new EventQueue();
            this.nextWriteId_ = 1;
            this.interceptServerDataCallback_ = null;
            /** A list of data pieces and paths to be set when this client disconnects. */
            this.onDisconnect_ = newSparseSnapshotTree();
            /** Stores queues of outstanding transactions for Firebase locations. */
            this.transactionQueueTree_ = new Tree();
            // TODO: This should be @private but it's used by test_access.js and internal.js
            this.persistentConnection_ = null;
            // This key is intentionally not updated if RepoInfo is later changed or replaced
            this.key = this.repoInfo_.toURLString();
        }
        /**
         * @returns The URL corresponding to the root of this Firebase.
         */
        toString() {
            return ((this.repoInfo_.secure ? 'https://' : 'http://') + this.repoInfo_.host);
        }
    }
    function repoStart(repo, appId, authOverride) {
        repo.stats_ = statsManagerGetCollection(repo.repoInfo_);
        if (repo.forceRestClient_ || beingCrawled()) {
            repo.server_ = new ReadonlyRestClient(repo.repoInfo_, (pathString, data, isMerge, tag) => {
                repoOnDataUpdate(repo, pathString, data, isMerge, tag);
            }, repo.authTokenProvider_, repo.appCheckProvider_);
            // Minor hack: Fire onConnect immediately, since there's no actual connection.
            setTimeout(() => repoOnConnectStatus(repo, /* connectStatus= */ true), 0);
        }
        else {
            // Validate authOverride
            if (typeof authOverride !== 'undefined' && authOverride !== null) {
                if (typeof authOverride !== 'object') {
                    throw new Error('Only objects are supported for option databaseAuthVariableOverride');
                }
                try {
                    stringify(authOverride);
                }
                catch (e) {
                    throw new Error('Invalid authOverride provided: ' + e);
                }
            }
            repo.persistentConnection_ = new PersistentConnection(repo.repoInfo_, appId, (pathString, data, isMerge, tag) => {
                repoOnDataUpdate(repo, pathString, data, isMerge, tag);
            }, (connectStatus) => {
                repoOnConnectStatus(repo, connectStatus);
            }, (updates) => {
                repoOnServerInfoUpdate(repo, updates);
            }, repo.authTokenProvider_, repo.appCheckProvider_, authOverride);
            repo.server_ = repo.persistentConnection_;
        }
        repo.authTokenProvider_.addTokenChangeListener(token => {
            repo.server_.refreshAuthToken(token);
        });
        repo.appCheckProvider_.addTokenChangeListener(result => {
            repo.server_.refreshAppCheckToken(result.token);
        });
        // In the case of multiple Repos for the same repoInfo (i.e. there are multiple Firebase.Contexts being used),
        // we only want to create one StatsReporter.  As such, we'll report stats over the first Repo created.
        repo.statsReporter_ = statsManagerGetOrCreateReporter(repo.repoInfo_, () => new StatsReporter(repo.stats_, repo.server_));
        // Used for .info.
        repo.infoData_ = new SnapshotHolder();
        repo.infoSyncTree_ = new SyncTree({
            startListening: (query, tag, currentHashFn, onComplete) => {
                let infoEvents = [];
                const node = repo.infoData_.getNode(query._path);
                // This is possibly a hack, but we have different semantics for .info endpoints. We don't raise null events
                // on initial data...
                if (!node.isEmpty()) {
                    infoEvents = syncTreeApplyServerOverwrite(repo.infoSyncTree_, query._path, node);
                    setTimeout(() => {
                        onComplete('ok');
                    }, 0);
                }
                return infoEvents;
            },
            stopListening: () => { }
        });
        repoUpdateInfo(repo, 'connected', false);
        repo.serverSyncTree_ = new SyncTree({
            startListening: (query, tag, currentHashFn, onComplete) => {
                repo.server_.listen(query, currentHashFn, tag, (status, data) => {
                    const events = onComplete(status, data);
                    eventQueueRaiseEventsForChangedPath(repo.eventQueue_, query._path, events);
                });
                // No synchronous events for network-backed sync trees
                return [];
            },
            stopListening: (query, tag) => {
                repo.server_.unlisten(query, tag);
            }
        });
    }
    /**
     * @returns The time in milliseconds, taking the server offset into account if we have one.
     */
    function repoServerTime(repo) {
        const offsetNode = repo.infoData_.getNode(new Path('.info/serverTimeOffset'));
        const offset = offsetNode.val() || 0;
        return new Date().getTime() + offset;
    }
    /**
     * Generate ServerValues using some variables from the repo object.
     */
    function repoGenerateServerValues(repo) {
        return generateWithValues({
            timestamp: repoServerTime(repo)
        });
    }
    /**
     * Called by realtime when we get new messages from the server.
     */
    function repoOnDataUpdate(repo, pathString, data, isMerge, tag) {
        // For testing.
        repo.dataUpdateCount++;
        const path = new Path(pathString);
        data = repo.interceptServerDataCallback_
            ? repo.interceptServerDataCallback_(pathString, data)
            : data;
        let events = [];
        if (tag) {
            if (isMerge) {
                const taggedChildren = map(data, (raw) => nodeFromJSON(raw));
                events = syncTreeApplyTaggedQueryMerge(repo.serverSyncTree_, path, taggedChildren, tag);
            }
            else {
                const taggedSnap = nodeFromJSON(data);
                events = syncTreeApplyTaggedQueryOverwrite(repo.serverSyncTree_, path, taggedSnap, tag);
            }
        }
        else if (isMerge) {
            const changedChildren = map(data, (raw) => nodeFromJSON(raw));
            events = syncTreeApplyServerMerge(repo.serverSyncTree_, path, changedChildren);
        }
        else {
            const snap = nodeFromJSON(data);
            events = syncTreeApplyServerOverwrite(repo.serverSyncTree_, path, snap);
        }
        let affectedPath = path;
        if (events.length > 0) {
            // Since we have a listener outstanding for each transaction, receiving any events
            // is a proxy for some change having occurred.
            affectedPath = repoRerunTransactions(repo, path);
        }
        eventQueueRaiseEventsForChangedPath(repo.eventQueue_, affectedPath, events);
    }
    function repoOnConnectStatus(repo, connectStatus) {
        repoUpdateInfo(repo, 'connected', connectStatus);
        if (connectStatus === false) {
            repoRunOnDisconnectEvents(repo);
        }
    }
    function repoOnServerInfoUpdate(repo, updates) {
        each(updates, (key, value) => {
            repoUpdateInfo(repo, key, value);
        });
    }
    function repoUpdateInfo(repo, pathString, value) {
        const path = new Path('/.info/' + pathString);
        const newNode = nodeFromJSON(value);
        repo.infoData_.updateSnapshot(path, newNode);
        const events = syncTreeApplyServerOverwrite(repo.infoSyncTree_, path, newNode);
        eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
    }
    function repoGetNextWriteId(repo) {
        return repo.nextWriteId_++;
    }
    /**
     * The purpose of `getValue` is to return the latest known value
     * satisfying `query`.
     *
     * This method will first check for in-memory cached values
     * belonging to active listeners. If they are found, such values
     * are considered to be the most up-to-date.
     *
     * If the client is not connected, this method will try to
     * establish a connection and request the value for `query`. If
     * the client is not able to retrieve the query result, it reports
     * an error.
     *
     * @param query - The query to surface a value for.
     */
    function repoGetValue(repo, query) {
        // Only active queries are cached. There is no persisted cache.
        const cached = syncTreeGetServerValue(repo.serverSyncTree_, query);
        if (cached != null) {
            return Promise.resolve(cached);
        }
        return repo.server_.get(query).then(payload => {
            const node = nodeFromJSON(payload).withIndex(query._queryParams.getIndex());
            const events = syncTreeApplyServerOverwrite(repo.serverSyncTree_, query._path, node);
            eventQueueRaiseEventsAtPath(repo.eventQueue_, query._path, events);
            return Promise.resolve(node);
        }, err => {
            repoLog(repo, 'get for query ' + stringify(query) + ' failed: ' + err);
            return Promise.reject(new Error(err));
        });
    }
    /**
     * Applies all of the changes stored up in the onDisconnect_ tree.
     */
    function repoRunOnDisconnectEvents(repo) {
        repoLog(repo, 'onDisconnectEvents');
        const serverValues = repoGenerateServerValues(repo);
        const resolvedOnDisconnectTree = newSparseSnapshotTree();
        sparseSnapshotTreeForEachTree(repo.onDisconnect_, newEmptyPath(), (path, node) => {
            const resolved = resolveDeferredValueTree(path, node, repo.serverSyncTree_, serverValues);
            sparseSnapshotTreeRemember(resolvedOnDisconnectTree, path, resolved);
        });
        let events = [];
        sparseSnapshotTreeForEachTree(resolvedOnDisconnectTree, newEmptyPath(), (path, snap) => {
            events = events.concat(syncTreeApplyServerOverwrite(repo.serverSyncTree_, path, snap));
            const affectedPath = repoAbortTransactions(repo, path);
            repoRerunTransactions(repo, affectedPath);
        });
        repo.onDisconnect_ = newSparseSnapshotTree();
        eventQueueRaiseEventsForChangedPath(repo.eventQueue_, newEmptyPath(), events);
    }
    function repoInterrupt(repo) {
        if (repo.persistentConnection_) {
            repo.persistentConnection_.interrupt(INTERRUPT_REASON);
        }
    }
    function repoLog(repo, ...varArgs) {
        let prefix = '';
        if (repo.persistentConnection_) {
            prefix = repo.persistentConnection_.id + ':';
        }
        log(prefix, ...varArgs);
    }
    /**
     * @param excludeSets - A specific set to exclude
     */
    function repoGetLatestState(repo, path, excludeSets) {
        return (syncTreeCalcCompleteEventCache(repo.serverSyncTree_, path, excludeSets) ||
            ChildrenNode.EMPTY_NODE);
    }
    /**
     * Sends any already-run transactions that aren't waiting for outstanding
     * transactions to complete.
     *
     * Externally it's called with no arguments, but it calls itself recursively
     * with a particular transactionQueueTree node to recurse through the tree.
     *
     * @param node - transactionQueueTree node to start at.
     */
    function repoSendReadyTransactions(repo, node = repo.transactionQueueTree_) {
        // Before recursing, make sure any completed transactions are removed.
        if (!node) {
            repoPruneCompletedTransactionsBelowNode(repo, node);
        }
        if (treeGetValue(node)) {
            const queue = repoBuildTransactionQueue(repo, node);
            assert(queue.length > 0, 'Sending zero length transaction queue');
            const allRun = queue.every((transaction) => transaction.status === 0 /* RUN */);
            // If they're all run (and not sent), we can send them.  Else, we must wait.
            if (allRun) {
                repoSendTransactionQueue(repo, treeGetPath(node), queue);
            }
        }
        else if (treeHasChildren(node)) {
            treeForEachChild(node, childNode => {
                repoSendReadyTransactions(repo, childNode);
            });
        }
    }
    /**
     * Given a list of run transactions, send them to the server and then handle
     * the result (success or failure).
     *
     * @param path - The location of the queue.
     * @param queue - Queue of transactions under the specified location.
     */
    function repoSendTransactionQueue(repo, path, queue) {
        // Mark transactions as sent and increment retry count!
        const setsToIgnore = queue.map(txn => {
            return txn.currentWriteId;
        });
        const latestState = repoGetLatestState(repo, path, setsToIgnore);
        let snapToSend = latestState;
        const latestHash = latestState.hash();
        for (let i = 0; i < queue.length; i++) {
            const txn = queue[i];
            assert(txn.status === 0 /* RUN */, 'tryToSendTransactionQueue_: items in queue should all be run.');
            txn.status = 1 /* SENT */;
            txn.retryCount++;
            const relativePath = newRelativePath(path, txn.path);
            // If we've gotten to this point, the output snapshot must be defined.
            snapToSend = snapToSend.updateChild(relativePath /** @type {!Node} */, txn.currentOutputSnapshotRaw);
        }
        const dataToSend = snapToSend.val(true);
        const pathToSend = path;
        // Send the put.
        repo.server_.put(pathToSend.toString(), dataToSend, (status) => {
            repoLog(repo, 'transaction put response', {
                path: pathToSend.toString(),
                status
            });
            let events = [];
            if (status === 'ok') {
                // Queue up the callbacks and fire them after cleaning up all of our
                // transaction state, since the callback could trigger more
                // transactions or sets.
                const callbacks = [];
                for (let i = 0; i < queue.length; i++) {
                    queue[i].status = 2 /* COMPLETED */;
                    events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, queue[i].currentWriteId));
                    if (queue[i].onComplete) {
                        // We never unset the output snapshot, and given that this
                        // transaction is complete, it should be set
                        callbacks.push(() => queue[i].onComplete(null, true, queue[i].currentOutputSnapshotResolved));
                    }
                    queue[i].unwatcher();
                }
                // Now remove the completed transactions.
                repoPruneCompletedTransactionsBelowNode(repo, treeSubTree(repo.transactionQueueTree_, path));
                // There may be pending transactions that we can now send.
                repoSendReadyTransactions(repo, repo.transactionQueueTree_);
                eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
                // Finally, trigger onComplete callbacks.
                for (let i = 0; i < callbacks.length; i++) {
                    exceptionGuard(callbacks[i]);
                }
            }
            else {
                // transactions are no longer sent.  Update their status appropriately.
                if (status === 'datastale') {
                    for (let i = 0; i < queue.length; i++) {
                        if (queue[i].status === 3 /* SENT_NEEDS_ABORT */) {
                            queue[i].status = 4 /* NEEDS_ABORT */;
                        }
                        else {
                            queue[i].status = 0 /* RUN */;
                        }
                    }
                }
                else {
                    warn('transaction at ' + pathToSend.toString() + ' failed: ' + status);
                    for (let i = 0; i < queue.length; i++) {
                        queue[i].status = 4 /* NEEDS_ABORT */;
                        queue[i].abortReason = status;
                    }
                }
                repoRerunTransactions(repo, path);
            }
        }, latestHash);
    }
    /**
     * Finds all transactions dependent on the data at changedPath and reruns them.
     *
     * Should be called any time cached data changes.
     *
     * Return the highest path that was affected by rerunning transactions. This
     * is the path at which events need to be raised for.
     *
     * @param changedPath - The path in mergedData that changed.
     * @returns The rootmost path that was affected by rerunning transactions.
     */
    function repoRerunTransactions(repo, changedPath) {
        const rootMostTransactionNode = repoGetAncestorTransactionNode(repo, changedPath);
        const path = treeGetPath(rootMostTransactionNode);
        const queue = repoBuildTransactionQueue(repo, rootMostTransactionNode);
        repoRerunTransactionQueue(repo, queue, path);
        return path;
    }
    /**
     * Does all the work of rerunning transactions (as well as cleans up aborted
     * transactions and whatnot).
     *
     * @param queue - The queue of transactions to run.
     * @param path - The path the queue is for.
     */
    function repoRerunTransactionQueue(repo, queue, path) {
        if (queue.length === 0) {
            return; // Nothing to do!
        }
        // Queue up the callbacks and fire them after cleaning up all of our
        // transaction state, since the callback could trigger more transactions or
        // sets.
        const callbacks = [];
        let events = [];
        // Ignore all of the sets we're going to re-run.
        const txnsToRerun = queue.filter(q => {
            return q.status === 0 /* RUN */;
        });
        const setsToIgnore = txnsToRerun.map(q => {
            return q.currentWriteId;
        });
        for (let i = 0; i < queue.length; i++) {
            const transaction = queue[i];
            const relativePath = newRelativePath(path, transaction.path);
            let abortTransaction = false, abortReason;
            assert(relativePath !== null, 'rerunTransactionsUnderNode_: relativePath should not be null.');
            if (transaction.status === 4 /* NEEDS_ABORT */) {
                abortTransaction = true;
                abortReason = transaction.abortReason;
                events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
            }
            else if (transaction.status === 0 /* RUN */) {
                if (transaction.retryCount >= MAX_TRANSACTION_RETRIES) {
                    abortTransaction = true;
                    abortReason = 'maxretry';
                    events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
                }
                else {
                    // This code reruns a transaction
                    const currentNode = repoGetLatestState(repo, transaction.path, setsToIgnore);
                    transaction.currentInputSnapshot = currentNode;
                    const newData = queue[i].update(currentNode.val());
                    if (newData !== undefined) {
                        validateFirebaseData('transaction failed: Data returned ', newData, transaction.path);
                        let newDataNode = nodeFromJSON(newData);
                        const hasExplicitPriority = typeof newData === 'object' &&
                            newData != null &&
                            contains(newData, '.priority');
                        if (!hasExplicitPriority) {
                            // Keep the old priority if there wasn't a priority explicitly specified.
                            newDataNode = newDataNode.updatePriority(currentNode.getPriority());
                        }
                        const oldWriteId = transaction.currentWriteId;
                        const serverValues = repoGenerateServerValues(repo);
                        const newNodeResolved = resolveDeferredValueSnapshot(newDataNode, currentNode, serverValues);
                        transaction.currentOutputSnapshotRaw = newDataNode;
                        transaction.currentOutputSnapshotResolved = newNodeResolved;
                        transaction.currentWriteId = repoGetNextWriteId(repo);
                        // Mutates setsToIgnore in place
                        setsToIgnore.splice(setsToIgnore.indexOf(oldWriteId), 1);
                        events = events.concat(syncTreeApplyUserOverwrite(repo.serverSyncTree_, transaction.path, newNodeResolved, transaction.currentWriteId, transaction.applyLocally));
                        events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, oldWriteId, true));
                    }
                    else {
                        abortTransaction = true;
                        abortReason = 'nodata';
                        events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
                    }
                }
            }
            eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
            events = [];
            if (abortTransaction) {
                // Abort.
                queue[i].status = 2 /* COMPLETED */;
                // Removing a listener can trigger pruning which can muck with
                // mergedData/visibleData (as it prunes data). So defer the unwatcher
                // until we're done.
                (function (unwatcher) {
                    setTimeout(unwatcher, Math.floor(0));
                })(queue[i].unwatcher);
                if (queue[i].onComplete) {
                    if (abortReason === 'nodata') {
                        callbacks.push(() => queue[i].onComplete(null, false, queue[i].currentInputSnapshot));
                    }
                    else {
                        callbacks.push(() => queue[i].onComplete(new Error(abortReason), false, null));
                    }
                }
            }
        }
        // Clean up completed transactions.
        repoPruneCompletedTransactionsBelowNode(repo, repo.transactionQueueTree_);
        // Now fire callbacks, now that we're in a good, known state.
        for (let i = 0; i < callbacks.length; i++) {
            exceptionGuard(callbacks[i]);
        }
        // Try to send the transaction result to the server.
        repoSendReadyTransactions(repo, repo.transactionQueueTree_);
    }
    /**
     * Returns the rootmost ancestor node of the specified path that has a pending
     * transaction on it, or just returns the node for the given path if there are
     * no pending transactions on any ancestor.
     *
     * @param path - The location to start at.
     * @returns The rootmost node with a transaction.
     */
    function repoGetAncestorTransactionNode(repo, path) {
        let front;
        // Start at the root and walk deeper into the tree towards path until we
        // find a node with pending transactions.
        let transactionNode = repo.transactionQueueTree_;
        front = pathGetFront(path);
        while (front !== null && treeGetValue(transactionNode) === undefined) {
            transactionNode = treeSubTree(transactionNode, front);
            path = pathPopFront(path);
            front = pathGetFront(path);
        }
        return transactionNode;
    }
    /**
     * Builds the queue of all transactions at or below the specified
     * transactionNode.
     *
     * @param transactionNode
     * @returns The generated queue.
     */
    function repoBuildTransactionQueue(repo, transactionNode) {
        // Walk any child transaction queues and aggregate them into a single queue.
        const transactionQueue = [];
        repoAggregateTransactionQueuesForNode(repo, transactionNode, transactionQueue);
        // Sort them by the order the transactions were created.
        transactionQueue.sort((a, b) => a.order - b.order);
        return transactionQueue;
    }
    function repoAggregateTransactionQueuesForNode(repo, node, queue) {
        const nodeQueue = treeGetValue(node);
        if (nodeQueue) {
            for (let i = 0; i < nodeQueue.length; i++) {
                queue.push(nodeQueue[i]);
            }
        }
        treeForEachChild(node, child => {
            repoAggregateTransactionQueuesForNode(repo, child, queue);
        });
    }
    /**
     * Remove COMPLETED transactions at or below this node in the transactionQueueTree_.
     */
    function repoPruneCompletedTransactionsBelowNode(repo, node) {
        const queue = treeGetValue(node);
        if (queue) {
            let to = 0;
            for (let from = 0; from < queue.length; from++) {
                if (queue[from].status !== 2 /* COMPLETED */) {
                    queue[to] = queue[from];
                    to++;
                }
            }
            queue.length = to;
            treeSetValue(node, queue.length > 0 ? queue : undefined);
        }
        treeForEachChild(node, childNode => {
            repoPruneCompletedTransactionsBelowNode(repo, childNode);
        });
    }
    /**
     * Aborts all transactions on ancestors or descendants of the specified path.
     * Called when doing a set() or update() since we consider them incompatible
     * with transactions.
     *
     * @param path - Path for which we want to abort related transactions.
     */
    function repoAbortTransactions(repo, path) {
        const affectedPath = treeGetPath(repoGetAncestorTransactionNode(repo, path));
        const transactionNode = treeSubTree(repo.transactionQueueTree_, path);
        treeForEachAncestor(transactionNode, (node) => {
            repoAbortTransactionsOnNode(repo, node);
        });
        repoAbortTransactionsOnNode(repo, transactionNode);
        treeForEachDescendant(transactionNode, (node) => {
            repoAbortTransactionsOnNode(repo, node);
        });
        return affectedPath;
    }
    /**
     * Abort transactions stored in this transaction queue node.
     *
     * @param node - Node to abort transactions for.
     */
    function repoAbortTransactionsOnNode(repo, node) {
        const queue = treeGetValue(node);
        if (queue) {
            // Queue up the callbacks and fire them after cleaning up all of our
            // transaction state, since the callback could trigger more transactions
            // or sets.
            const callbacks = [];
            // Go through queue.  Any already-sent transactions must be marked for
            // abort, while the unsent ones can be immediately aborted and removed.
            let events = [];
            let lastSent = -1;
            for (let i = 0; i < queue.length; i++) {
                if (queue[i].status === 3 /* SENT_NEEDS_ABORT */) ;
                else if (queue[i].status === 1 /* SENT */) {
                    assert(lastSent === i - 1, 'All SENT items should be at beginning of queue.');
                    lastSent = i;
                    // Mark transaction for abort when it comes back.
                    queue[i].status = 3 /* SENT_NEEDS_ABORT */;
                    queue[i].abortReason = 'set';
                }
                else {
                    assert(queue[i].status === 0 /* RUN */, 'Unexpected transaction status in abort');
                    // We can abort it immediately.
                    queue[i].unwatcher();
                    events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, queue[i].currentWriteId, true));
                    if (queue[i].onComplete) {
                        callbacks.push(queue[i].onComplete.bind(null, new Error('set'), false, null));
                    }
                }
            }
            if (lastSent === -1) {
                // We're not waiting for any sent transactions.  We can clear the queue.
                treeSetValue(node, undefined);
            }
            else {
                // Remove the transactions we aborted.
                queue.length = lastSent + 1;
            }
            // Now fire the callbacks.
            eventQueueRaiseEventsForChangedPath(repo.eventQueue_, treeGetPath(node), events);
            for (let i = 0; i < callbacks.length; i++) {
                exceptionGuard(callbacks[i]);
            }
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function decodePath(pathString) {
        let pathStringDecoded = '';
        const pieces = pathString.split('/');
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].length > 0) {
                let piece = pieces[i];
                try {
                    piece = decodeURIComponent(piece.replace(/\+/g, ' '));
                }
                catch (e) { }
                pathStringDecoded += '/' + piece;
            }
        }
        return pathStringDecoded;
    }
    /**
     * @returns key value hash
     */
    function decodeQuery(queryString) {
        const results = {};
        if (queryString.charAt(0) === '?') {
            queryString = queryString.substring(1);
        }
        for (const segment of queryString.split('&')) {
            if (segment.length === 0) {
                continue;
            }
            const kv = segment.split('=');
            if (kv.length === 2) {
                results[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
            }
            else {
                warn(`Invalid query segment '${segment}' in query '${queryString}'`);
            }
        }
        return results;
    }
    const parseRepoInfo = function (dataURL, nodeAdmin) {
        const parsedUrl = parseDatabaseURL(dataURL), namespace = parsedUrl.namespace;
        if (parsedUrl.domain === 'firebase.com') {
            fatal(parsedUrl.host +
                ' is no longer supported. ' +
                'Please use <YOUR FIREBASE>.firebaseio.com instead');
        }
        // Catch common error of uninitialized namespace value.
        if ((!namespace || namespace === 'undefined') &&
            parsedUrl.domain !== 'localhost') {
            fatal('Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com');
        }
        if (!parsedUrl.secure) {
            warnIfPageIsSecure();
        }
        const webSocketOnly = parsedUrl.scheme === 'ws' || parsedUrl.scheme === 'wss';
        return {
            repoInfo: new RepoInfo(parsedUrl.host, parsedUrl.secure, namespace, nodeAdmin, webSocketOnly, 
            /*persistenceKey=*/ '', 
            /*includeNamespaceInQueryParams=*/ namespace !== parsedUrl.subdomain),
            path: new Path(parsedUrl.pathString)
        };
    };
    const parseDatabaseURL = function (dataURL) {
        // Default to empty strings in the event of a malformed string.
        let host = '', domain = '', subdomain = '', pathString = '', namespace = '';
        // Always default to SSL, unless otherwise specified.
        let secure = true, scheme = 'https', port = 443;
        // Don't do any validation here. The caller is responsible for validating the result of parsing.
        if (typeof dataURL === 'string') {
            // Parse scheme.
            let colonInd = dataURL.indexOf('//');
            if (colonInd >= 0) {
                scheme = dataURL.substring(0, colonInd - 1);
                dataURL = dataURL.substring(colonInd + 2);
            }
            // Parse host, path, and query string.
            let slashInd = dataURL.indexOf('/');
            if (slashInd === -1) {
                slashInd = dataURL.length;
            }
            let questionMarkInd = dataURL.indexOf('?');
            if (questionMarkInd === -1) {
                questionMarkInd = dataURL.length;
            }
            host = dataURL.substring(0, Math.min(slashInd, questionMarkInd));
            if (slashInd < questionMarkInd) {
                // For pathString, questionMarkInd will always come after slashInd
                pathString = decodePath(dataURL.substring(slashInd, questionMarkInd));
            }
            const queryParams = decodeQuery(dataURL.substring(Math.min(dataURL.length, questionMarkInd)));
            // If we have a port, use scheme for determining if it's secure.
            colonInd = host.indexOf(':');
            if (colonInd >= 0) {
                secure = scheme === 'https' || scheme === 'wss';
                port = parseInt(host.substring(colonInd + 1), 10);
            }
            else {
                colonInd = host.length;
            }
            const hostWithoutPort = host.slice(0, colonInd);
            if (hostWithoutPort.toLowerCase() === 'localhost') {
                domain = 'localhost';
            }
            else if (hostWithoutPort.split('.').length <= 2) {
                domain = hostWithoutPort;
            }
            else {
                // Interpret the subdomain of a 3 or more component URL as the namespace name.
                const dotInd = host.indexOf('.');
                subdomain = host.substring(0, dotInd).toLowerCase();
                domain = host.substring(dotInd + 1);
                // Normalize namespaces to lowercase to share storage / connection.
                namespace = subdomain;
            }
            // Always treat the value of the `ns` as the namespace name if it is present.
            if ('ns' in queryParams) {
                namespace = queryParams['ns'];
            }
        }
        return {
            host,
            port,
            domain,
            subdomain,
            secure,
            scheme,
            pathString,
            namespace
        };
    };

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @internal
     */
    class QueryImpl {
        /**
         * @hideconstructor
         */
        constructor(_repo, _path, _queryParams, _orderByCalled) {
            this._repo = _repo;
            this._path = _path;
            this._queryParams = _queryParams;
            this._orderByCalled = _orderByCalled;
        }
        get key() {
            if (pathIsEmpty(this._path)) {
                return null;
            }
            else {
                return pathGetBack(this._path);
            }
        }
        get ref() {
            return new ReferenceImpl(this._repo, this._path);
        }
        get _queryIdentifier() {
            const obj = queryParamsGetQueryObject(this._queryParams);
            const id = ObjectToUniqueKey(obj);
            return id === '{}' ? 'default' : id;
        }
        /**
         * An object representation of the query parameters used by this Query.
         */
        get _queryObject() {
            return queryParamsGetQueryObject(this._queryParams);
        }
        isEqual(other) {
            other = getModularInstance(other);
            if (!(other instanceof QueryImpl)) {
                return false;
            }
            const sameRepo = this._repo === other._repo;
            const samePath = pathEquals(this._path, other._path);
            const sameQueryIdentifier = this._queryIdentifier === other._queryIdentifier;
            return sameRepo && samePath && sameQueryIdentifier;
        }
        toJSON() {
            return this.toString();
        }
        toString() {
            return this._repo.toString() + pathToUrlEncodedString(this._path);
        }
    }
    /**
     * @internal
     */
    class ReferenceImpl extends QueryImpl {
        /** @hideconstructor */
        constructor(repo, path) {
            super(repo, path, new QueryParams(), false);
        }
        get parent() {
            const parentPath = pathParent(this._path);
            return parentPath === null
                ? null
                : new ReferenceImpl(this._repo, parentPath);
        }
        get root() {
            let ref = this;
            while (ref.parent !== null) {
                ref = ref.parent;
            }
            return ref;
        }
    }
    /**
     * A `DataSnapshot` contains data from a Database location.
     *
     * Any time you read data from the Database, you receive the data as a
     * `DataSnapshot`. A `DataSnapshot` is passed to the event callbacks you attach
     * with `on()` or `once()`. You can extract the contents of the snapshot as a
     * JavaScript object by calling the `val()` method. Alternatively, you can
     * traverse into the snapshot by calling `child()` to return child snapshots
     * (which you could then call `val()` on).
     *
     * A `DataSnapshot` is an efficiently generated, immutable copy of the data at
     * a Database location. It cannot be modified and will never change (to modify
     * data, you always call the `set()` method on a `Reference` directly).
     */
    class DataSnapshot {
        /**
         * @param _node - A SnapshotNode to wrap.
         * @param ref - The location this snapshot came from.
         * @param _index - The iteration order for this snapshot
         * @hideconstructor
         */
        constructor(_node, 
        /**
         * The location of this DataSnapshot.
         */
        ref, _index) {
            this._node = _node;
            this.ref = ref;
            this._index = _index;
        }
        /**
         * Gets the priority value of the data in this `DataSnapshot`.
         *
         * Applications need not use priority but can order collections by
         * ordinary properties (see
         * {@link https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data |Sorting and filtering data}
         * ).
         */
        get priority() {
            // typecast here because we never return deferred values or internal priorities (MAX_PRIORITY)
            return this._node.getPriority().val();
        }
        /**
         * The key (last part of the path) of the location of this `DataSnapshot`.
         *
         * The last token in a Database location is considered its key. For example,
         * "ada" is the key for the /users/ada/ node. Accessing the key on any
         * `DataSnapshot` will return the key for the location that generated it.
         * However, accessing the key on the root URL of a Database will return
         * `null`.
         */
        get key() {
            return this.ref.key;
        }
        /** Returns the number of child properties of this `DataSnapshot`. */
        get size() {
            return this._node.numChildren();
        }
        /**
         * Gets another `DataSnapshot` for the location at the specified relative path.
         *
         * Passing a relative path to the `child()` method of a DataSnapshot returns
         * another `DataSnapshot` for the location at the specified relative path. The
         * relative path can either be a simple child name (for example, "ada") or a
         * deeper, slash-separated path (for example, "ada/name/first"). If the child
         * location has no data, an empty `DataSnapshot` (that is, a `DataSnapshot`
         * whose value is `null`) is returned.
         *
         * @param path - A relative path to the location of child data.
         */
        child(path) {
            const childPath = new Path(path);
            const childRef = child(this.ref, path);
            return new DataSnapshot(this._node.getChild(childPath), childRef, PRIORITY_INDEX);
        }
        /**
         * Returns true if this `DataSnapshot` contains any data. It is slightly more
         * efficient than using `snapshot.val() !== null`.
         */
        exists() {
            return !this._node.isEmpty();
        }
        /**
         * Exports the entire contents of the DataSnapshot as a JavaScript object.
         *
         * The `exportVal()` method is similar to `val()`, except priority information
         * is included (if available), making it suitable for backing up your data.
         *
         * @returns The DataSnapshot's contents as a JavaScript value (Object,
         *   Array, string, number, boolean, or `null`).
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exportVal() {
            return this._node.val(true);
        }
        /**
         * Enumerates the top-level children in the `DataSnapshot`.
         *
         * Because of the way JavaScript objects work, the ordering of data in the
         * JavaScript object returned by `val()` is not guaranteed to match the
         * ordering on the server nor the ordering of `onChildAdded()` events. That is
         * where `forEach()` comes in handy. It guarantees the children of a
         * `DataSnapshot` will be iterated in their query order.
         *
         * If no explicit `orderBy*()` method is used, results are returned
         * ordered by key (unless priorities are used, in which case, results are
         * returned by priority).
         *
         * @param action - A function that will be called for each child DataSnapshot.
         * The callback can return true to cancel further enumeration.
         * @returns true if enumeration was canceled due to your callback returning
         * true.
         */
        forEach(action) {
            if (this._node.isLeafNode()) {
                return false;
            }
            const childrenNode = this._node;
            // Sanitize the return value to a boolean. ChildrenNode.forEachChild has a weird return type...
            return !!childrenNode.forEachChild(this._index, (key, node) => {
                return action(new DataSnapshot(node, child(this.ref, key), PRIORITY_INDEX));
            });
        }
        /**
         * Returns true if the specified child path has (non-null) data.
         *
         * @param path - A relative path to the location of a potential child.
         * @returns `true` if data exists at the specified child path; else
         *  `false`.
         */
        hasChild(path) {
            const childPath = new Path(path);
            return !this._node.getChild(childPath).isEmpty();
        }
        /**
         * Returns whether or not the `DataSnapshot` has any non-`null` child
         * properties.
         *
         * You can use `hasChildren()` to determine if a `DataSnapshot` has any
         * children. If it does, you can enumerate them using `forEach()`. If it
         * doesn't, then either this snapshot contains a primitive value (which can be
         * retrieved with `val()`) or it is empty (in which case, `val()` will return
         * `null`).
         *
         * @returns true if this snapshot has any children; else false.
         */
        hasChildren() {
            if (this._node.isLeafNode()) {
                return false;
            }
            else {
                return !this._node.isEmpty();
            }
        }
        /**
         * Returns a JSON-serializable representation of this object.
         */
        toJSON() {
            return this.exportVal();
        }
        /**
         * Extracts a JavaScript value from a `DataSnapshot`.
         *
         * Depending on the data in a `DataSnapshot`, the `val()` method may return a
         * scalar type (string, number, or boolean), an array, or an object. It may
         * also return null, indicating that the `DataSnapshot` is empty (contains no
         * data).
         *
         * @returns The DataSnapshot's contents as a JavaScript value (Object,
         *   Array, string, number, boolean, or `null`).
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val() {
            return this._node.val();
        }
    }
    /**
     *
     * Returns a `Reference` representing the location in the Database
     * corresponding to the provided path. If no path is provided, the `Reference`
     * will point to the root of the Database.
     *
     * @param db - The database instance to obtain a reference for.
     * @param path - Optional path representing the location the returned
     *   `Reference` will point. If not provided, the returned `Reference` will
     *   point to the root of the Database.
     * @returns If a path is provided, a `Reference`
     *   pointing to the provided path. Otherwise, a `Reference` pointing to the
     *   root of the Database.
     */
    function ref(db, path) {
        db = getModularInstance(db);
        db._checkNotDeleted('ref');
        return path !== undefined ? child(db._root, path) : db._root;
    }
    /**
     * Gets a `Reference` for the location at the specified relative path.
     *
     * The relative path can either be a simple child name (for example, "ada") or
     * a deeper slash-separated path (for example, "ada/name/first").
     *
     * @param parent - The parent location.
     * @param path - A relative path from this location to the desired child
     *   location.
     * @returns The specified child location.
     */
    function child(parent, path) {
        parent = getModularInstance(parent);
        if (pathGetFront(parent._path) === null) {
            validateRootPathString('child', 'path', path, false);
        }
        else {
            validatePathString('child', 'path', path, false);
        }
        return new ReferenceImpl(parent._repo, pathChild(parent._path, path));
    }
    /**
     * Gets the most up-to-date result for this query.
     *
     * @param query - The query to run.
     * @returns A `Promise` which resolves to the resulting DataSnapshot if a value is
     * available, or rejects if the client is unable to return a value (e.g., if the
     * server is unreachable and there is nothing cached).
     */
    function get(query) {
        query = getModularInstance(query);
        return repoGetValue(query._repo, query).then(node => {
            return new DataSnapshot(node, new ReferenceImpl(query._repo, query._path), query._queryParams.getIndex());
        });
    }
    /**
     * Define reference constructor in various modules
     *
     * We are doing this here to avoid several circular
     * dependency issues
     */
    syncPointSetReferenceConstructor(ReferenceImpl);
    syncTreeSetReferenceConstructor(ReferenceImpl);

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * This variable is also defined in the firebase Node.js Admin SDK. Before
     * modifying this definition, consult the definition in:
     *
     * https://github.com/firebase/firebase-admin-node
     *
     * and make sure the two are consistent.
     */
    const FIREBASE_DATABASE_EMULATOR_HOST_VAR = 'FIREBASE_DATABASE_EMULATOR_HOST';
    /**
     * Creates and caches `Repo` instances.
     */
    const repos = {};
    /**
     * If true, any new `Repo` will be created to use `ReadonlyRestClient` (for testing purposes).
     */
    let useRestClient = false;
    /**
     * This function should only ever be called to CREATE a new database instance.
     * @internal
     */
    function repoManagerDatabaseFromApp(app, authProvider, appCheckProvider, url, nodeAdmin) {
        let dbUrl = url || app.options.databaseURL;
        if (dbUrl === undefined) {
            if (!app.options.projectId) {
                fatal("Can't determine Firebase Database URL. Be sure to include " +
                    ' a Project ID when calling firebase.initializeApp().');
            }
            log('Using default host for project ', app.options.projectId);
            dbUrl = `${app.options.projectId}-default-rtdb.firebaseio.com`;
        }
        let parsedUrl = parseRepoInfo(dbUrl, nodeAdmin);
        let repoInfo = parsedUrl.repoInfo;
        let isEmulator;
        let dbEmulatorHost = undefined;
        if (typeof process !== 'undefined') {
            dbEmulatorHost = process.env[FIREBASE_DATABASE_EMULATOR_HOST_VAR];
        }
        if (dbEmulatorHost) {
            isEmulator = true;
            dbUrl = `http://${dbEmulatorHost}?ns=${repoInfo.namespace}`;
            parsedUrl = parseRepoInfo(dbUrl, nodeAdmin);
            repoInfo = parsedUrl.repoInfo;
        }
        else {
            isEmulator = !parsedUrl.repoInfo.secure;
        }
        const authTokenProvider = nodeAdmin && isEmulator
            ? new EmulatorTokenProvider(EmulatorTokenProvider.OWNER)
            : new FirebaseAuthTokenProvider(app.name, app.options, authProvider);
        validateUrl('Invalid Firebase Database URL', parsedUrl);
        if (!pathIsEmpty(parsedUrl.path)) {
            fatal('Database URL must point to the root of a Firebase Database ' +
                '(not including a child path).');
        }
        const repo = repoManagerCreateRepo(repoInfo, app, authTokenProvider, new AppCheckTokenProvider(app.name, appCheckProvider));
        return new Database(repo, app);
    }
    /**
     * Remove the repo and make sure it is disconnected.
     *
     */
    function repoManagerDeleteRepo(repo, appName) {
        const appRepos = repos[appName];
        // This should never happen...
        if (!appRepos || appRepos[repo.key] !== repo) {
            fatal(`Database ${appName}(${repo.repoInfo_}) has already been deleted.`);
        }
        repoInterrupt(repo);
        delete appRepos[repo.key];
    }
    /**
     * Ensures a repo doesn't already exist and then creates one using the
     * provided app.
     *
     * @param repoInfo - The metadata about the Repo
     * @returns The Repo object for the specified server / repoName.
     */
    function repoManagerCreateRepo(repoInfo, app, authTokenProvider, appCheckProvider) {
        let appRepos = repos[app.name];
        if (!appRepos) {
            appRepos = {};
            repos[app.name] = appRepos;
        }
        let repo = appRepos[repoInfo.toURLString()];
        if (repo) {
            fatal('Database initialized multiple times. Please make sure the format of the database URL matches with each database() call.');
        }
        repo = new Repo(repoInfo, useRestClient, authTokenProvider, appCheckProvider);
        appRepos[repoInfo.toURLString()] = repo;
        return repo;
    }
    /**
     * Class representing a Firebase Realtime Database.
     */
    class Database {
        /** @hideconstructor */
        constructor(_repoInternal, 
        /** The {@link @firebase/app#FirebaseApp} associated with this Realtime Database instance. */
        app) {
            this._repoInternal = _repoInternal;
            this.app = app;
            /** Represents a `Database` instance. */
            this['type'] = 'database';
            /** Track if the instance has been used (root or repo accessed) */
            this._instanceStarted = false;
        }
        get _repo() {
            if (!this._instanceStarted) {
                repoStart(this._repoInternal, this.app.options.appId, this.app.options['databaseAuthVariableOverride']);
                this._instanceStarted = true;
            }
            return this._repoInternal;
        }
        get _root() {
            if (!this._rootInternal) {
                this._rootInternal = new ReferenceImpl(this._repo, newEmptyPath());
            }
            return this._rootInternal;
        }
        _delete() {
            if (this._rootInternal !== null) {
                repoManagerDeleteRepo(this._repo, this.app.name);
                this._repoInternal = null;
                this._rootInternal = null;
            }
            return Promise.resolve();
        }
        _checkNotDeleted(apiName) {
            if (this._rootInternal === null) {
                fatal('Cannot call ' + apiName + ' on a deleted database.');
            }
        }
    }
    /**
     * Returns the instance of the Realtime Database SDK that is associated
     * with the provided {@link @firebase/app#FirebaseApp}. Initializes a new instance with
     * with default settings if no instance exists or if the existing instance uses
     * a custom database URL.
     *
     * @param app - The {@link @firebase/app#FirebaseApp} instance that the returned Realtime
     * Database instance is associated with.
     * @param url - The URL of the Realtime Database instance to connect to. If not
     * provided, the SDK connects to the default instance of the Firebase App.
     * @returns The `Database` instance of the provided app.
     */
    function getDatabase(app = getApp(), url) {
        return _getProvider(app, 'database').getImmediate({
            identifier: url
        });
    }

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function registerDatabase(variant) {
        setSDKVersion(SDK_VERSION$1);
        _registerComponent(new Component('database', (container, { instanceIdentifier: url }) => {
            const app = container.getProvider('app').getImmediate();
            const authProvider = container.getProvider('auth-internal');
            const appCheckProvider = container.getProvider('app-check-internal');
            return repoManagerDatabaseFromApp(app, authProvider, appCheckProvider, url);
        }, "PUBLIC" /* PUBLIC */).setMultipleInstances(true));
        registerVersion(name, version, variant);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name, version, 'esm2017');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PersistentConnection.prototype.simpleListen = function (pathString, onComplete) {
        this.sendRequest('q', { p: pathString }, onComplete);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PersistentConnection.prototype.echo = function (data, onEcho) {
        this.sendRequest('echo', { d: data }, onEcho);
    };

    /**
     * Firebase Realtime Database
     *
     * @packageDocumentation
     */
    registerDatabase();

    /* src/App.svelte generated by Svelte v3.46.3 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let a;
    	let t6;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			p = element("p");
    			t4 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t6 = text(" to learn\n    how to build Svelte apps.");
    			attr_dev(h1, "class", "svelte-1e9puaw");
    			add_location(h1, file, 24, 2, 580);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file, 26, 14, 623);
    			add_location(p, file, 25, 2, 605);
    			attr_dev(main, "class", "svelte-1e9puaw");
    			add_location(main, file, 23, 0, 571);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, t4);
    			append_dev(p, a);
    			append_dev(p, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;

    	onMount(() => {
    		const dbRef = ref(getDatabase(app$1));

    		get(child(dbRef, `website`)).then(snapshot => {
    			if (snapshot.exists()) {
    				console.log(snapshot.val());
    			} else {
    				console.log("No data available");
    			}
    		}).catch(error => {
    			console.error(error);
    		});
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		onMount,
    		anime,
    		app: app$1,
    		getDatabase,
    		ref,
    		get,
    		child
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
