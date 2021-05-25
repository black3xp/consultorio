
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {function(): Promise<SvelteComponent>} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {Object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {Object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {Object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.29.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix) {
    				if (typeof prefix == "string" && path.startsWith(prefix)) {
    					path = path.substr(prefix.length) || "/";
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Layout\Header.svelte generated by Svelte v3.29.0 */

    const file = "src\\Layout\\Header.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let a0;
    	let t0;
    	let nav0;
    	let ul0;
    	let li0;
    	let a1;
    	let i0;
    	let t1;
    	let nav1;
    	let ul1;
    	let li1;
    	let div10;
    	let a2;
    	let i1;
    	let t2;
    	let span0;
    	let t3;
    	let div9;
    	let div0;
    	let a3;
    	let t4;
    	let span1;
    	let t6;
    	let a4;
    	let t7;
    	let div8;
    	let div1;
    	let t9;
    	let a5;
    	let div3;
    	let div2;
    	let i2;
    	let t10;
    	let t11;
    	let a6;
    	let div5;
    	let div4;
    	let i3;
    	let t12;
    	let t13;
    	let a7;
    	let div7;
    	let div6;
    	let i4;
    	let t14;
    	let t15;
    	let li2;
    	let a8;
    	let div11;
    	let span2;
    	let t17;
    	let div13;
    	let a9;
    	let t19;
    	let a10;
    	let t21;
    	let a11;
    	let t23;
    	let div12;
    	let t24;
    	let a12;

    	const block = {
    		c: function create() {
    			header = element("header");
    			a0 = element("a");
    			t0 = space();
    			nav0 = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			i0 = element("i");
    			t1 = space();
    			nav1 = element("nav");
    			ul1 = element("ul");
    			li1 = element("li");
    			div10 = element("div");
    			a2 = element("a");
    			i1 = element("i");
    			t2 = space();
    			span0 = element("span");
    			t3 = space();
    			div9 = element("div");
    			div0 = element("div");
    			a3 = element("a");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Notifications";
    			t6 = space();
    			a4 = element("a");
    			t7 = space();
    			div8 = element("div");
    			div1 = element("div");
    			div1.textContent = "today";
    			t9 = space();
    			a5 = element("a");
    			div3 = element("div");
    			div2 = element("div");
    			i2 = element("i");
    			t10 = text("\r\n                      All systems operational.");
    			t11 = space();
    			a6 = element("a");
    			div5 = element("div");
    			div4 = element("div");
    			i3 = element("i");
    			t12 = text("\r\n                      File upload successful.");
    			t13 = space();
    			a7 = element("a");
    			div7 = element("div");
    			div6 = element("div");
    			i4 = element("i");
    			t14 = text("\r\n                      Your holiday has been denied");
    			t15 = space();
    			li2 = element("li");
    			a8 = element("a");
    			div11 = element("div");
    			span2 = element("span");
    			span2.textContent = "V";
    			t17 = space();
    			div13 = element("div");
    			a9 = element("a");
    			a9.textContent = "Add Account";
    			t19 = space();
    			a10 = element("a");
    			a10.textContent = "Reset Password";
    			t21 = space();
    			a11 = element("a");
    			a11.textContent = "Help";
    			t23 = space();
    			div12 = element("div");
    			t24 = space();
    			a12 = element("a");
    			a12.textContent = "Logout";
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "sidebar-toggle");
    			attr_dev(a0, "data-toggleclass", "sidebar-open");
    			attr_dev(a0, "data-target", "body");
    			add_location(a0, file, 1, 4, 35);
    			attr_dev(i0, "class", " mdi mdi-magnify mdi-24px align-middle");
    			add_location(i0, file, 18, 12, 456);
    			attr_dev(a1, "class", "nav-link ");
    			attr_dev(a1, "data-target", "#!siteSearchModal");
    			attr_dev(a1, "data-toggle", "modal");
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file, 13, 10, 307);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 12, 8, 274);
    			attr_dev(ul0, "class", "nav align-items-center");
    			add_location(ul0, file, 10, 6, 225);
    			attr_dev(nav0, "class", " mr-auto my-auto");
    			add_location(nav0, file, 9, 4, 187);
    			attr_dev(i1, "class", "mdi mdi-24px mdi-bell-outline");
    			add_location(i1, file, 34, 14, 905);
    			attr_dev(span0, "class", "notification-counter");
    			add_location(span0, file, 35, 14, 964);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "data-toggle", "dropdown");
    			attr_dev(a2, "aria-haspopup", "true");
    			attr_dev(a2, "aria-expanded", "false");
    			add_location(a2, file, 28, 12, 718);
    			attr_dev(a3, "href", "#!");
    			attr_dev(a3, "class", "mdi mdi-18px mdi-settings text-muted");
    			add_location(a3, file, 42, 16, 1252);
    			attr_dev(span1, "class", "h5 m-0");
    			add_location(span1, file, 45, 16, 1378);
    			attr_dev(a4, "href", "#!");
    			attr_dev(a4, "class", "mdi mdi-18px mdi-notification-clear-all text-muted");
    			add_location(a4, file, 46, 16, 1437);
    			attr_dev(div0, "class", "d-flex p-all-15 bg-white justify-content-between\r\n                border-bottom ");
    			add_location(div0, file, 39, 14, 1123);
    			attr_dev(div1, "class", "text-overline m-b-5");
    			add_location(div1, file, 53, 16, 1701);
    			attr_dev(i2, "class", "mdi mdi-circle text-success");
    			add_location(i2, file, 57, 22, 1906);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file, 56, 20, 1859);
    			attr_dev(div3, "class", "card");
    			add_location(div3, file, 55, 18, 1819);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "d-block m-b-10");
    			add_location(a5, file, 54, 16, 1763);
    			attr_dev(i3, "class", "mdi mdi-upload-multiple ");
    			add_location(i3, file, 65, 22, 2232);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file, 64, 20, 2185);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file, 63, 18, 2145);
    			attr_dev(a6, "href", "#!");
    			attr_dev(a6, "class", "d-block m-b-10");
    			add_location(a6, file, 62, 16, 2089);
    			attr_dev(i4, "class", "mdi mdi-cancel text-danger");
    			add_location(i4, file, 73, 22, 2554);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file, 72, 20, 2507);
    			attr_dev(div7, "class", "card");
    			add_location(div7, file, 71, 18, 2467);
    			attr_dev(a7, "href", "#!");
    			attr_dev(a7, "class", "d-block m-b-10");
    			add_location(a7, file, 70, 16, 2411);
    			attr_dev(div8, "class", "notification-events bg-gray-300");
    			add_location(div8, file, 52, 14, 1638);
    			attr_dev(div9, "class", "dropdown-menu notification-container dropdown-menu-right");
    			add_location(div9, file, 38, 12, 1037);
    			attr_dev(div10, "class", "dropdown");
    			add_location(div10, file, 27, 10, 682);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 26, 8, 649);
    			attr_dev(span2, "class", "avatar-title rounded-circle bg-dark");
    			add_location(span2, file, 93, 14, 3136);
    			attr_dev(div11, "class", "avatar avatar-sm avatar-online");
    			add_location(div11, file, 92, 12, 3076);
    			attr_dev(a8, "class", "nav-link dropdown-toggle");
    			attr_dev(a8, "href", "#!");
    			attr_dev(a8, "role", "button");
    			attr_dev(a8, "data-toggle", "dropdown");
    			attr_dev(a8, "aria-haspopup", "true");
    			attr_dev(a8, "aria-expanded", "false");
    			add_location(a8, file, 85, 10, 2858);
    			attr_dev(a9, "class", "dropdown-item");
    			attr_dev(a9, "href", "#!");
    			add_location(a9, file, 98, 12, 3307);
    			attr_dev(a10, "class", "dropdown-item");
    			attr_dev(a10, "href", "#!");
    			add_location(a10, file, 99, 12, 3371);
    			attr_dev(a11, "class", "dropdown-item");
    			attr_dev(a11, "href", "#!");
    			add_location(a11, file, 100, 12, 3438);
    			attr_dev(div12, "class", "dropdown-divider");
    			add_location(div12, file, 101, 12, 3495);
    			attr_dev(a12, "class", "dropdown-item");
    			attr_dev(a12, "href", "#!");
    			add_location(a12, file, 102, 12, 3541);
    			attr_dev(div13, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div13, file, 97, 10, 3246);
    			attr_dev(li2, "class", "nav-item dropdown ");
    			add_location(li2, file, 84, 8, 2815);
    			attr_dev(ul1, "class", "nav align-items-center");
    			add_location(ul1, file, 24, 6, 600);
    			attr_dev(nav1, "class", " ml-auto");
    			add_location(nav1, file, 23, 4, 570);
    			attr_dev(header, "class", "admin-header");
    			add_location(header, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, a0);
    			append_dev(header, t0);
    			append_dev(header, nav0);
    			append_dev(nav0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i0);
    			append_dev(header, t1);
    			append_dev(header, nav1);
    			append_dev(nav1, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div10);
    			append_dev(div10, a2);
    			append_dev(a2, i1);
    			append_dev(a2, t2);
    			append_dev(a2, span0);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, div0);
    			append_dev(div0, a3);
    			append_dev(div0, t4);
    			append_dev(div0, span1);
    			append_dev(div0, t6);
    			append_dev(div0, a4);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			append_dev(div8, t9);
    			append_dev(div8, a5);
    			append_dev(a5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, i2);
    			append_dev(div2, t10);
    			append_dev(div8, t11);
    			append_dev(div8, a6);
    			append_dev(a6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, i3);
    			append_dev(div4, t12);
    			append_dev(div8, t13);
    			append_dev(div8, a7);
    			append_dev(a7, div7);
    			append_dev(div7, div6);
    			append_dev(div6, i4);
    			append_dev(div6, t14);
    			append_dev(ul1, t15);
    			append_dev(ul1, li2);
    			append_dev(li2, a8);
    			append_dev(a8, div11);
    			append_dev(div11, span2);
    			append_dev(li2, t17);
    			append_dev(li2, div13);
    			append_dev(div13, a9);
    			append_dev(div13, t19);
    			append_dev(div13, a10);
    			append_dev(div13, t21);
    			append_dev(div13, a11);
    			append_dev(div13, t23);
    			append_dev(div13, div12);
    			append_dev(div13, t24);
    			append_dev(div13, a12);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location$1;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        // Repeat this for each class
        (el.className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the active class firsts
            el.node.classList.remove(cls);

            // If the pattern matches, then set the active class
            if (el.pattern.test(location$1)) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location$1 = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active$1(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            regexparam(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src\Layout\Aside.svelte generated by Svelte v3.29.0 */
    const file$1 = "src\\Layout\\Aside.svelte";

    function create_fragment$2(ctx) {
    	let aside;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let a0;
    	let link_action;
    	let t2;
    	let div0;
    	let a1;
    	let t3;
    	let a2;
    	let t4;
    	let div2;
    	let ul1;
    	let li0;
    	let a3;
    	let span2;
    	let span1;
    	let t6;
    	let span4;
    	let span3;
    	let t8;
    	let i0;
    	let link_action_1;
    	let active_action;
    	let t9;
    	let li1;
    	let a4;
    	let span6;
    	let span5;
    	let t11;
    	let span7;
    	let i1;
    	let link_action_2;
    	let active_action_1;
    	let t12;
    	let li4;
    	let a5;
    	let span11;
    	let span9;
    	let t13;
    	let span8;
    	let t14;
    	let span10;
    	let t16;
    	let span12;
    	let i2;
    	let t17;
    	let ul0;
    	let li2;
    	let a6;
    	let span14;
    	let span13;
    	let t19;
    	let span15;
    	let i3;
    	let link_action_3;
    	let t21;
    	let li3;
    	let a7;
    	let span17;
    	let span16;
    	let t23;
    	let span18;
    	let i4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			a0 = element("a");
    			a0.textContent = "atmos";
    			t2 = space();
    			div0 = element("div");
    			a1 = element("a");
    			t3 = space();
    			a2 = element("a");
    			t4 = space();
    			div2 = element("div");
    			ul1 = element("ul");
    			li0 = element("li");
    			a3 = element("a");
    			span2 = element("span");
    			span1 = element("span");
    			span1.textContent = "Escritorio";
    			t6 = space();
    			span4 = element("span");
    			span3 = element("span");
    			span3.textContent = "1";
    			t8 = space();
    			i0 = element("i");
    			t9 = space();
    			li1 = element("li");
    			a4 = element("a");
    			span6 = element("span");
    			span5 = element("span");
    			span5.textContent = "Pacientes";
    			t11 = space();
    			span7 = element("span");
    			i1 = element("i");
    			t12 = space();
    			li4 = element("li");
    			a5 = element("a");
    			span11 = element("span");
    			span9 = element("span");
    			t13 = text("Mantenimiento\r\n                ");
    			span8 = element("span");
    			t14 = space();
    			span10 = element("span");
    			span10.textContent = "Ajustes consultorio";
    			t16 = space();
    			span12 = element("span");
    			i2 = element("i");
    			t17 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a6 = element("a");
    			span14 = element("span");
    			span13 = element("span");
    			span13.textContent = "Usuarios";
    			t19 = space();
    			span15 = element("span");
    			i3 = element("i");
    			i3.textContent = "U";
    			t21 = space();
    			li3 = element("li");
    			a7 = element("a");
    			span17 = element("span");
    			span16 = element("span");
    			span16.textContent = "Empresa";
    			t23 = space();
    			span18 = element("span");
    			i4 = element("i");
    			i4.textContent = "E";
    			attr_dev(img, "class", "admin-brand-logo");
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "40");
    			attr_dev(img, "alt", "atmos Logo");
    			add_location(img, file$1, 8, 6, 242);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$1, 14, 8, 416);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file$1, 13, 6, 372);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned");
    			add_location(a1, file$1, 19, 8, 565);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file$1, 23, 8, 738);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file$1, 17, 6, 505);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file$1, 6, 4, 163);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$1, 35, 14, 1168);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file$1, 34, 12, 1127);
    			attr_dev(span3, "class", "icon-badge badge-success badge badge-pill");
    			add_location(span3, file$1, 38, 14, 1284);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i0, file$1, 40, 14, 1368);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$1, 37, 12, 1244);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file$1, 33, 10, 1074);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$1, 32, 8, 994);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$1, 50, 14, 1742);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$1, 49, 12, 1701);
    			attr_dev(i1, "class", "icon-placeholder mdi mdi-account-circle-outline");
    			add_location(i1, file$1, 54, 14, 1946);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$1, 52, 12, 1817);
    			attr_dev(a4, "href", "/pacientes");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file$1, 48, 10, 1639);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$1, 47, 8, 1550);
    			attr_dev(span8, "class", "menu-arrow");
    			add_location(span8, file$1, 65, 16, 2343);
    			attr_dev(span9, "class", "menu-name");
    			add_location(span9, file$1, 63, 14, 2270);
    			attr_dev(span10, "class", "menu-info");
    			add_location(span10, file$1, 67, 14, 2409);
    			attr_dev(span11, "class", "menu-label");
    			add_location(span11, file$1, 62, 12, 2229);
    			attr_dev(i2, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i2, file$1, 70, 14, 2534);
    			attr_dev(span12, "class", "menu-icon");
    			add_location(span12, file$1, 69, 12, 2494);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "open-dropdown menu-link");
    			add_location(a5, file$1, 61, 10, 2170);
    			attr_dev(span13, "class", "menu-name");
    			add_location(span13, file$1, 78, 18, 2850);
    			attr_dev(span14, "class", "menu-label");
    			add_location(span14, file$1, 77, 16, 2805);
    			attr_dev(i3, "class", "icon-placeholder ");
    			add_location(i3, file$1, 81, 18, 2976);
    			attr_dev(span15, "class", "menu-icon");
    			add_location(span15, file$1, 80, 16, 2932);
    			attr_dev(a6, "href", "/Usuario/Index");
    			attr_dev(a6, "class", " menu-link");
    			add_location(a6, file$1, 76, 14, 2734);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$1, 75, 12, 2696);
    			attr_dev(span16, "class", "menu-name");
    			add_location(span16, file$1, 89, 18, 3225);
    			attr_dev(span17, "class", "menu-label");
    			add_location(span17, file$1, 88, 16, 3180);
    			attr_dev(i4, "class", "icon-placeholder ");
    			add_location(i4, file$1, 92, 18, 3350);
    			attr_dev(span18, "class", "menu-icon");
    			add_location(span18, file$1, 91, 16, 3306);
    			attr_dev(a7, "href", "#!");
    			attr_dev(a7, "class", " menu-link");
    			add_location(a7, file$1, 87, 14, 3130);
    			attr_dev(li3, "class", "menu-item");
    			add_location(li3, file$1, 86, 12, 3092);
    			attr_dev(ul0, "class", "sub-menu");
    			add_location(ul0, file$1, 74, 10, 2661);
    			attr_dev(li4, "class", "menu-item ");
    			add_location(li4, file$1, 60, 8, 2135);
    			attr_dev(ul1, "class", "menu");
    			add_location(ul1, file$1, 30, 6, 934);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file$1, 28, 4, 846);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file$1, 5, 2, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, span0);
    			append_dev(span0, a0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, a1);
    			append_dev(div0, t3);
    			append_dev(div0, a2);
    			append_dev(aside, t4);
    			append_dev(aside, div2);
    			append_dev(div2, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a3);
    			append_dev(a3, span2);
    			append_dev(span2, span1);
    			append_dev(a3, t6);
    			append_dev(a3, span4);
    			append_dev(span4, span3);
    			append_dev(span4, t8);
    			append_dev(span4, i0);
    			append_dev(ul1, t9);
    			append_dev(ul1, li1);
    			append_dev(li1, a4);
    			append_dev(a4, span6);
    			append_dev(span6, span5);
    			append_dev(a4, t11);
    			append_dev(a4, span7);
    			append_dev(span7, i1);
    			append_dev(ul1, t12);
    			append_dev(ul1, li4);
    			append_dev(li4, a5);
    			append_dev(a5, span11);
    			append_dev(span11, span9);
    			append_dev(span9, t13);
    			append_dev(span9, span8);
    			append_dev(span11, t14);
    			append_dev(span11, span10);
    			append_dev(a5, t16);
    			append_dev(a5, span12);
    			append_dev(span12, i2);
    			append_dev(li4, t17);
    			append_dev(li4, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a6);
    			append_dev(a6, span14);
    			append_dev(span14, span13);
    			append_dev(a6, t19);
    			append_dev(a6, span15);
    			append_dev(span15, i3);
    			append_dev(ul0, t21);
    			append_dev(ul0, li3);
    			append_dev(li3, a7);
    			append_dev(a7, span17);
    			append_dev(span17, span16);
    			append_dev(a7, t23);
    			append_dev(a7, span18);
    			append_dev(span18, i4);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active$1.call(null, li0, { path: "/", className: "active" })),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active$1.call(null, li1, { path: "/pacientes", className: "active" })),
    					action_destroyer(link_action_3 = link.call(null, a6))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Aside", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Aside> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, active: active$1 });
    	return [];
    }

    class Aside extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Aside",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Pages\Home\Index.svelte generated by Svelte v3.29.0 */
    const file$2 = "src\\Pages\\Home\\Index.svelte";

    function create_fragment$3(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let section;
    	let div1;
    	let div0;
    	let t2;
    	let h1;
    	let t4;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "Página principal";
    			t4 = text("\r\n      Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis, ipsa. Ab\r\n      recusandae consectetur vel eum unde voluptate quis consequuntur\r\n      reprehenderit omnis, facilis accusamus? Numquam quaerat nihil id amet\r\n      labore dolor laboriosam quidem distinctio architecto natus ipsam quod vel\r\n      illum, iusto libero facere magni at laudantium? Aliquid molestiae\r\n      exercitationem eveniet eos!");
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$2, 11, 6, 247);
    			add_location(h1, file$2, 12, 6, 274);
    			attr_dev(div1, "class", "p-2");
    			add_location(div1, file$2, 10, 4, 222);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$2, 9, 2, 185);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$2, 7, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			append_dev(div1, h1);
    			append_dev(div1, t4);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Aside });
    	return [];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    var bind$1 = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind$1(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind$1(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    const url = 'https://xmconsulta.cthrics.com/api';

    /* src\Pages\Pacientes\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\Pages\\Pacientes\\Index.svelte";

    function create_fragment$4(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let section;
    	let div4;
    	let div0;
    	let t2;
    	let div3;
    	let h5;
    	let t3;
    	let a0;
    	let i0;
    	let t4;
    	let link_action;
    	let t5;
    	let div2;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let th5;
    	let t16;
    	let th6;
    	let t17;
    	let tbody;
    	let tr1;
    	let td0;
    	let div1;
    	let img;
    	let img_src_value;
    	let t18;
    	let td1;
    	let t20;
    	let td2;
    	let t22;
    	let td3;
    	let t24;
    	let td4;
    	let t26;
    	let td5;
    	let t28;
    	let td6;
    	let a1;
    	let i1;
    	let link_action_1;
    	let t29;
    	let a2;
    	let i2;
    	let link_action_2;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section = element("section");
    			div4 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div3 = element("div");
    			h5 = element("h5");
    			t3 = text("Pacientes ");
    			a0 = element("a");
    			i0 = element("i");
    			t4 = text(" CREAR");
    			t5 = space();
    			div2 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Edad";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Sexo";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "Celular";
    			t14 = space();
    			th5 = element("th");
    			th5.textContent = "Cedula";
    			t16 = space();
    			th6 = element("th");
    			t17 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			div1 = element("div");
    			img = element("img");
    			t18 = space();
    			td1 = element("td");
    			td1.textContent = "Victor Brito";
    			t20 = space();
    			td2 = element("td");
    			td2.textContent = "28";
    			t22 = space();
    			td3 = element("td");
    			td3.textContent = "Femenina";
    			t24 = space();
    			td4 = element("td");
    			td4.textContent = "8098478903";
    			t26 = space();
    			td5 = element("td");
    			td5.textContent = "4023994823929";
    			t28 = space();
    			td6 = element("td");
    			a1 = element("a");
    			i1 = element("i");
    			t29 = space();
    			a2 = element("a");
    			i2 = element("i");
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$3, 36, 6, 817);
    			attr_dev(i0, "class", "mdi mdi-plus");
    			add_location(i0, file$3, 38, 89, 970);
    			attr_dev(a0, "href", "/pacientes/crear");
    			attr_dev(a0, "class", "btn btn-primary btn-sm");
    			add_location(a0, file$3, 38, 22, 903);
    			add_location(h5, file$3, 38, 8, 889);
    			add_location(th0, file$3, 43, 20, 1184);
    			add_location(th1, file$3, 44, 20, 1215);
    			add_location(th2, file$3, 45, 20, 1252);
    			add_location(th3, file$3, 46, 20, 1287);
    			add_location(th4, file$3, 47, 20, 1322);
    			add_location(th5, file$3, 48, 20, 1360);
    			add_location(th6, file$3, 49, 20, 1397);
    			add_location(tr0, file$3, 42, 16, 1158);
    			add_location(thead, file$3, 41, 16, 1133);
    			if (img.src !== (img_src_value = "assets/img/users/user-1.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "avatar-img avatar-sm rounded-circle");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 55, 55, 1585);
    			attr_dev(div1, "class", "avatar avatar-sm ");
    			add_location(div1, file$3, 55, 24, 1554);
    			add_location(td0, file$3, 54, 20, 1524);
    			add_location(td1, file$3, 57, 20, 1730);
    			add_location(td2, file$3, 58, 20, 1773);
    			add_location(td3, file$3, 59, 20, 1806);
    			add_location(td4, file$3, 60, 20, 1845);
    			add_location(td5, file$3, 61, 20, 1886);
    			attr_dev(i1, "class", "mdi mdi-close");
    			add_location(i1, file$3, 69, 28, 2237);
    			attr_dev(a1, "href", "/pacientes/perfil/1");
    			attr_dev(a1, "class", "btn btn-danger");
    			attr_dev(a1, "data-tooltip", "Eliminar");
    			add_location(a1, file$3, 63, 24, 1979);
    			attr_dev(i2, "class", "mdi mdi-send");
    			add_location(i2, file$3, 77, 28, 2579);
    			attr_dev(a2, "href", "/pacientes/perfil/1");
    			attr_dev(a2, "class", "btn btn-primary");
    			attr_dev(a2, "data-tooltip", "Perfil");
    			add_location(a2, file$3, 71, 24, 2322);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$3, 62, 20, 1930);
    			add_location(tr1, file$3, 53, 16, 1498);
    			add_location(tbody, file$3, 52, 16, 1473);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$3, 40, 12, 1067);
    			attr_dev(div2, "class", "table-responsive");
    			add_location(div2, file$3, 39, 8, 1023);
    			attr_dev(div3, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div3, file$3, 37, 6, 844);
    			attr_dev(div4, "class", "p-2");
    			add_location(div4, file$3, 35, 4, 792);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$3, 34, 2, 755);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$3, 32, 0, 712);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, h5);
    			append_dev(h5, t3);
    			append_dev(h5, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t6);
    			append_dev(tr0, th1);
    			append_dev(tr0, t8);
    			append_dev(tr0, th2);
    			append_dev(tr0, t10);
    			append_dev(tr0, th3);
    			append_dev(tr0, t12);
    			append_dev(tr0, th4);
    			append_dev(tr0, t14);
    			append_dev(tr0, th5);
    			append_dev(tr0, t16);
    			append_dev(tr0, th6);
    			append_dev(table, t17);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, div1);
    			append_dev(div1, img);
    			append_dev(tr1, t18);
    			append_dev(tr1, td1);
    			append_dev(tr1, t20);
    			append_dev(tr1, td2);
    			append_dev(tr1, t22);
    			append_dev(tr1, td3);
    			append_dev(tr1, t24);
    			append_dev(tr1, td4);
    			append_dev(tr1, t26);
    			append_dev(tr1, td5);
    			append_dev(tr1, t28);
    			append_dev(tr1, td6);
    			append_dev(td6, a1);
    			append_dev(a1, i1);
    			append_dev(td6, t29);
    			append_dev(td6, a2);
    			append_dev(a2, i2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a1)),
    					action_destroyer(link_action_2 = link.call(null, a2))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let pacientes = [];

    	function cargarPacientes() {
    		const config = { method: "get", url: `${url}/pacientes` };

    		axios$1(config).then(res => {
    			let { data } = res;
    			console.log(data);
    		}).catch(err => {
    			console.error(err);
    		});
    	}

    	onMount(() => {
    		cargarPacientes();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		link,
    		Header,
    		Aside,
    		axios: axios$1,
    		onMount,
    		url,
    		pacientes,
    		cargarPacientes
    	});

    	$$self.$inject_state = $$props => {
    		if ("pacientes" in $$props) pacientes = $$props.pacientes;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\componentes\Evoluciones.svelte generated by Svelte v3.29.0 */

    const file$4 = "src\\componentes\\Evoluciones.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h6;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let small0;
    	let t6;
    	let p0;
    	let t7;
    	let t8;
    	let small1;
    	let t10;
    	let p1;
    	let t11;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			span0 = element("span");
    			span0.textContent = "Mariela Camilo";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "4/5/2020 1:31:00 p. m.";
    			t4 = space();
    			small0 = element("small");
    			small0.textContent = "Motivo de Consulta";
    			t6 = space();
    			p0 = element("p");
    			t7 = text(/*motivo*/ ctx[0]);
    			t8 = space();
    			small1 = element("small");
    			small1.textContent = "Historia de la Enfermedad";
    			t10 = space();
    			p1 = element("p");
    			t11 = text(/*historia*/ ctx[1]);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "assets/img/placeholder.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "imagen paciente");
    			add_location(img, file$4, 7, 12, 193);
    			attr_dev(div0, "class", "avatar mr-3  avatar-sm");
    			add_location(div0, file$4, 6, 8, 143);
    			attr_dev(span0, "data-bind", "text: atencionMedica.nombreMedico");
    			add_location(span0, file$4, 10, 35, 374);
    			attr_dev(span1, "class", "text-muted ml-3 small");
    			attr_dev(span1, "data-bind", "text: new Date(atencionMedica.fechaIngreso()).toLocaleString('es-DO')");
    			add_location(span1, file$4, 11, 16, 465);
    			attr_dev(h6, "class", "mt-0 mb-1");
    			add_location(h6, file$4, 10, 12, 351);
    			attr_dev(small0, "class", "mt-4 mb-4 text-primary");
    			add_location(small0, file$4, 13, 12, 650);
    			attr_dev(p0, "data-bind", "text: atencionMedica.motivoConsulta");
    			add_location(p0, file$4, 14, 12, 728);
    			attr_dev(small1, "class", "mt-4 mb-4 text-primary");
    			add_location(small1, file$4, 15, 12, 805);
    			attr_dev(p1, "data-bind", "text: atencionMedica.historiaEnfermedad");
    			add_location(p1, file$4, 16, 12, 890);
    			attr_dev(div1, "class", "media-body");
    			add_location(div1, file$4, 9, 8, 313);
    			attr_dev(div2, "class", "media");
    			add_location(div2, file$4, 5, 4, 114);
    			attr_dev(div3, "class", "list-unstyled");
    			add_location(div3, file$4, 4, 0, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, span0);
    			append_dev(h6, t2);
    			append_dev(h6, span1);
    			append_dev(div1, t4);
    			append_dev(div1, small0);
    			append_dev(div1, t6);
    			append_dev(div1, p0);
    			append_dev(p0, t7);
    			append_dev(div1, t8);
    			append_dev(div1, small1);
    			append_dev(div1, t10);
    			append_dev(div1, p1);
    			append_dev(p1, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*motivo*/ 1) set_data_dev(t7, /*motivo*/ ctx[0]);
    			if (dirty & /*historia*/ 2) set_data_dev(t11, /*historia*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Evoluciones", slots, []);
    	let { motivo = "" } = $$props;
    	let { historia = "" } = $$props;
    	const writable_props = ["motivo", "historia"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Evoluciones> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    	};

    	$$self.$capture_state = () => ({ motivo, historia });

    	$$self.$inject_state = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [motivo, historia];
    }

    class Evoluciones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { motivo: 0, historia: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Evoluciones",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get motivo() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set motivo(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get historia() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set historia(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\UltimosVitales.svelte generated by Svelte v3.29.0 */

    const file$5 = "src\\componentes\\UltimosVitales.svelte";

    function create_fragment$6(ctx) {
    	let div23;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let t1;
    	let div5;
    	let div4;
    	let a;
    	let i1;
    	let t2;
    	let div3;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let div22;
    	let div21;
    	let div8;
    	let div6;
    	let i2;
    	let t9;
    	let t10;
    	let div7;
    	let p0;
    	let t11;
    	let t12;
    	let t13;
    	let div11;
    	let div9;
    	let i3;
    	let t14;
    	let t15;
    	let div10;
    	let p1;
    	let t16;
    	let t17;
    	let t18;
    	let div14;
    	let div12;
    	let i4;
    	let t19;
    	let t20;
    	let div13;
    	let p2;
    	let t21;
    	let t22;
    	let div17;
    	let div15;
    	let i5;
    	let t23;
    	let t24;
    	let div16;
    	let p3;
    	let t25;
    	let t26;
    	let div20;
    	let div18;
    	let i6;
    	let t27;
    	let t28;
    	let div19;
    	let p4;
    	let t29;

    	const block = {
    		c: function create() {
    			div23 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = text("\r\n      Ultimos Signo Vitales");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			a = element("a");
    			i1 = element("i");
    			t2 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Action";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Another action";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "Something else here";
    			t8 = space();
    			div22 = element("div");
    			div21 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			i2 = element("i");
    			t9 = text(" Peso");
    			t10 = space();
    			div7 = element("div");
    			p0 = element("p");
    			t11 = text(/*peso*/ ctx[0]);
    			t12 = text(" Lb");
    			t13 = space();
    			div11 = element("div");
    			div9 = element("div");
    			i3 = element("i");
    			t14 = text(" Temperatura");
    			t15 = space();
    			div10 = element("div");
    			p1 = element("p");
    			t16 = text(/*temperatura*/ ctx[1]);
    			t17 = text(" °C");
    			t18 = space();
    			div14 = element("div");
    			div12 = element("div");
    			i4 = element("i");
    			t19 = text(" Frecuencia Respiratoria");
    			t20 = space();
    			div13 = element("div");
    			p2 = element("p");
    			t21 = text(/*frecuenciaRespiratoria*/ ctx[2]);
    			t22 = space();
    			div17 = element("div");
    			div15 = element("div");
    			i5 = element("i");
    			t23 = text(" Frecuencia Cardiaca");
    			t24 = space();
    			div16 = element("div");
    			p3 = element("p");
    			t25 = text(/*frecuenciaCardiaca*/ ctx[3]);
    			t26 = space();
    			div20 = element("div");
    			div18 = element("div");
    			i6 = element("i");
    			t27 = text(" Presion Alterial (mmHg)");
    			t28 = space();
    			div19 = element("div");
    			p4 = element("p");
    			t29 = text(/*presionAlterial*/ ctx[4]);
    			attr_dev(i0, "class", "mdi mdi-account-heart mdi-18px");
    			add_location(i0, file$5, 11, 10, 376);
    			attr_dev(div0, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div0, file$5, 10, 8, 315);
    			attr_dev(div1, "class", "avatar mr-2 avatar-xs");
    			add_location(div1, file$5, 9, 6, 270);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$5, 8, 4, 237);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$5, 18, 87, 645);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$5, 18, 8, 566);
    			attr_dev(button0, "class", "dropdown-item");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$5, 22, 10, 777);
    			attr_dev(button1, "class", "dropdown-item");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$5, 23, 10, 848);
    			attr_dev(button2, "class", "dropdown-item");
    			attr_dev(button2, "type", "button");
    			add_location(button2, file$5, 24, 10, 927);
    			attr_dev(div3, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div3, file$5, 21, 8, 718);
    			attr_dev(div4, "class", "dropdown");
    			add_location(div4, file$5, 17, 6, 534);
    			attr_dev(div5, "class", "card-controls");
    			add_location(div5, file$5, 16, 4, 499);
    			attr_dev(i2, "class", "mdi mdi-speedometer mdi-18px");
    			add_location(i2, file$5, 34, 12, 1261);
    			attr_dev(div6, "class", "col-lg-9 col-sm-10");
    			add_location(div6, file$5, 33, 10, 1215);
    			add_location(p0, file$5, 37, 12, 1385);
    			attr_dev(div7, "class", "col-lg-3 col-sm-2");
    			add_location(div7, file$5, 36, 10, 1340);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$5, 32, 8, 1186);
    			attr_dev(i3, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i3, file$5, 43, 12, 1522);
    			attr_dev(div9, "class", "col-lg-9 col-sm-10");
    			add_location(div9, file$5, 42, 10, 1476);
    			add_location(p1, file$5, 46, 12, 1653);
    			attr_dev(div10, "class", "col-lg-3 col-sm-2");
    			add_location(div10, file$5, 45, 10, 1608);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$5, 41, 8, 1447);
    			attr_dev(i4, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i4, file$5, 51, 12, 1795);
    			attr_dev(div12, "class", "col-lg-9 col-sm-10");
    			add_location(div12, file$5, 50, 10, 1749);
    			attr_dev(p2, "data-bind", "text: frecuenciaRespiratoria");
    			add_location(p2, file$5, 54, 12, 1937);
    			attr_dev(div13, "class", "col-lg-3 col-sm-2");
    			add_location(div13, file$5, 53, 10, 1892);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$5, 49, 8, 1720);
    			attr_dev(i5, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i5, file$5, 59, 12, 2128);
    			attr_dev(div15, "class", "col-lg-9 col-sm-10");
    			add_location(div15, file$5, 58, 10, 2082);
    			attr_dev(p3, "data-bind", "text: frecuenciaCardiaca");
    			add_location(p3, file$5, 62, 12, 2267);
    			attr_dev(div16, "class", "col-lg-3 col-sm-2");
    			add_location(div16, file$5, 61, 10, 2222);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$5, 57, 8, 2053);
    			attr_dev(i6, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i6, file$5, 67, 12, 2450);
    			attr_dev(div18, "class", "col-lg-9 col-sm-10");
    			add_location(div18, file$5, 66, 10, 2404);
    			attr_dev(p4, "data-bind", "text: tensionArterialSistolica +'/' + tensionArterialDiastolica");
    			add_location(p4, file$5, 70, 12, 2593);
    			attr_dev(div19, "class", "col-lg-3 col-sm-2");
    			add_location(div19, file$5, 69, 10, 2548);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$5, 65, 8, 2375);
    			attr_dev(div21, "class", "list-group-item ");
    			add_location(div21, file$5, 30, 6, 1144);
    			attr_dev(div22, "class", "list-group list  list-group-flush");
    			attr_dev(div22, "data-bind", "using: ultimosSignosVitales");
    			add_location(div22, file$5, 28, 4, 1047);
    			attr_dev(div23, "class", "card m-b-30");
    			add_location(div23, file$5, 7, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div23, anchor);
    			append_dev(div23, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div2, t0);
    			append_dev(div23, t1);
    			append_dev(div23, div5);
    			append_dev(div5, div4);
    			append_dev(div4, a);
    			append_dev(a, i1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t4);
    			append_dev(div3, button1);
    			append_dev(div3, t6);
    			append_dev(div3, button2);
    			append_dev(div23, t8);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div8);
    			append_dev(div8, div6);
    			append_dev(div6, i2);
    			append_dev(div6, t9);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			append_dev(div7, p0);
    			append_dev(p0, t11);
    			append_dev(p0, t12);
    			append_dev(div21, t13);
    			append_dev(div21, div11);
    			append_dev(div11, div9);
    			append_dev(div9, i3);
    			append_dev(div9, t14);
    			append_dev(div11, t15);
    			append_dev(div11, div10);
    			append_dev(div10, p1);
    			append_dev(p1, t16);
    			append_dev(p1, t17);
    			append_dev(div21, t18);
    			append_dev(div21, div14);
    			append_dev(div14, div12);
    			append_dev(div12, i4);
    			append_dev(div12, t19);
    			append_dev(div14, t20);
    			append_dev(div14, div13);
    			append_dev(div13, p2);
    			append_dev(p2, t21);
    			append_dev(div21, t22);
    			append_dev(div21, div17);
    			append_dev(div17, div15);
    			append_dev(div15, i5);
    			append_dev(div15, t23);
    			append_dev(div17, t24);
    			append_dev(div17, div16);
    			append_dev(div16, p3);
    			append_dev(p3, t25);
    			append_dev(div21, t26);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, i6);
    			append_dev(div18, t27);
    			append_dev(div20, t28);
    			append_dev(div20, div19);
    			append_dev(div19, p4);
    			append_dev(p4, t29);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*peso*/ 1) set_data_dev(t11, /*peso*/ ctx[0]);
    			if (dirty & /*temperatura*/ 2) set_data_dev(t16, /*temperatura*/ ctx[1]);
    			if (dirty & /*frecuenciaRespiratoria*/ 4) set_data_dev(t21, /*frecuenciaRespiratoria*/ ctx[2]);
    			if (dirty & /*frecuenciaCardiaca*/ 8) set_data_dev(t25, /*frecuenciaCardiaca*/ ctx[3]);
    			if (dirty & /*presionAlterial*/ 16) set_data_dev(t29, /*presionAlterial*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div23);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UltimosVitales", slots, []);
    	let { peso = "" } = $$props;
    	let { temperatura = "" } = $$props;
    	let { frecuenciaRespiratoria = "" } = $$props;
    	let { frecuenciaCardiaca = "" } = $$props;
    	let { presionAlterial = "" } = $$props;

    	const writable_props = [
    		"peso",
    		"temperatura",
    		"frecuenciaRespiratoria",
    		"frecuenciaCardiaca",
    		"presionAlterial"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UltimosVitales> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("peso" in $$props) $$invalidate(0, peso = $$props.peso);
    		if ("temperatura" in $$props) $$invalidate(1, temperatura = $$props.temperatura);
    		if ("frecuenciaRespiratoria" in $$props) $$invalidate(2, frecuenciaRespiratoria = $$props.frecuenciaRespiratoria);
    		if ("frecuenciaCardiaca" in $$props) $$invalidate(3, frecuenciaCardiaca = $$props.frecuenciaCardiaca);
    		if ("presionAlterial" in $$props) $$invalidate(4, presionAlterial = $$props.presionAlterial);
    	};

    	$$self.$capture_state = () => ({
    		peso,
    		temperatura,
    		frecuenciaRespiratoria,
    		frecuenciaCardiaca,
    		presionAlterial
    	});

    	$$self.$inject_state = $$props => {
    		if ("peso" in $$props) $$invalidate(0, peso = $$props.peso);
    		if ("temperatura" in $$props) $$invalidate(1, temperatura = $$props.temperatura);
    		if ("frecuenciaRespiratoria" in $$props) $$invalidate(2, frecuenciaRespiratoria = $$props.frecuenciaRespiratoria);
    		if ("frecuenciaCardiaca" in $$props) $$invalidate(3, frecuenciaCardiaca = $$props.frecuenciaCardiaca);
    		if ("presionAlterial" in $$props) $$invalidate(4, presionAlterial = $$props.presionAlterial);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [peso, temperatura, frecuenciaRespiratoria, frecuenciaCardiaca, presionAlterial];
    }

    class UltimosVitales extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			peso: 0,
    			temperatura: 1,
    			frecuenciaRespiratoria: 2,
    			frecuenciaCardiaca: 3,
    			presionAlterial: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UltimosVitales",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get peso() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set peso(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get temperatura() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set temperatura(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frecuenciaRespiratoria() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frecuenciaRespiratoria(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frecuenciaCardiaca() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frecuenciaCardiaca(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get presionAlterial() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set presionAlterial(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\Antecedente.svelte generated by Svelte v3.29.0 */

    const file$6 = "src\\componentes\\Antecedente.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let strong;
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let small;
    	let t3;
    	let t4;
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			strong = element("strong");
    			t0 = text(/*tipoAntecedente*/ ctx[0]);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			small = element("small");
    			t3 = text(/*descripcionAntecedente*/ ctx[1]);
    			t4 = space();
    			a = element("a");
    			i = element("i");
    			attr_dev(strong, "data-bind", "text: new Date(fechaIngreso).toLocaleDateString('es-DO')");
    			add_location(strong, file$6, 7, 8, 250);
    			add_location(br, file$6, 8, 8, 363);
    			add_location(small, file$6, 9, 8, 377);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$6, 6, 6, 219);
    			attr_dev(div1, "class", "d-flex");
    			add_location(div1, file$6, 5, 4, 191);
    			attr_dev(i, "class", "mdi mdi-open-in-new");
    			add_location(i, file$6, 15, 6, 602);
    			attr_dev(a, "class", "close");
    			attr_dev(a, "data-toggle", "tooltip");
    			attr_dev(a, "data-placement", "top");
    			attr_dev(a, "data-original-title", "Ir");
    			attr_dev(a, "href", "/AtencionMedica/Trabajar/1#resumen-page");
    			add_location(a, file$6, 12, 4, 448);
    			attr_dev(div2, "class", "alert alert-border-danger  alert-dismissible fade show");
    			attr_dev(div2, "role", "alert");
    			add_location(div2, file$6, 4, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, strong);
    			append_dev(strong, t0);
    			append_dev(div0, t1);
    			append_dev(div0, br);
    			append_dev(div0, t2);
    			append_dev(div0, small);
    			append_dev(small, t3);
    			append_dev(div2, t4);
    			append_dev(div2, a);
    			append_dev(a, i);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tipoAntecedente*/ 1) set_data_dev(t0, /*tipoAntecedente*/ ctx[0]);
    			if (dirty & /*descripcionAntecedente*/ 2) set_data_dev(t3, /*descripcionAntecedente*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Antecedente", slots, []);
    	let { tipoAntecedente = "" } = $$props;
    	let { descripcionAntecedente = "" } = $$props;
    	const writable_props = ["tipoAntecedente", "descripcionAntecedente"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Antecedente> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tipoAntecedente" in $$props) $$invalidate(0, tipoAntecedente = $$props.tipoAntecedente);
    		if ("descripcionAntecedente" in $$props) $$invalidate(1, descripcionAntecedente = $$props.descripcionAntecedente);
    	};

    	$$self.$capture_state = () => ({ tipoAntecedente, descripcionAntecedente });

    	$$self.$inject_state = $$props => {
    		if ("tipoAntecedente" in $$props) $$invalidate(0, tipoAntecedente = $$props.tipoAntecedente);
    		if ("descripcionAntecedente" in $$props) $$invalidate(1, descripcionAntecedente = $$props.descripcionAntecedente);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tipoAntecedente, descripcionAntecedente];
    }

    class Antecedente extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			tipoAntecedente: 0,
    			descripcionAntecedente: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Antecedente",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get tipoAntecedente() {
    		throw new Error("<Antecedente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tipoAntecedente(value) {
    		throw new Error("<Antecedente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get descripcionAntecedente() {
    		throw new Error("<Antecedente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set descripcionAntecedente(value) {
    		throw new Error("<Antecedente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\CabeceraPerfil.svelte generated by Svelte v3.29.0 */

    const file$7 = "src\\componentes\\CabeceraPerfil.svelte";

    function create_fragment$8(ctx) {
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div4;
    	let div3;
    	let div0;
    	let span0;
    	let t1;
    	let div2;
    	let h5;
    	let span1;
    	let t3;
    	let a0;
    	let i0;
    	let t4;
    	let t5;
    	let div1;
    	let span2;
    	let t7;
    	let span3;
    	let t9;
    	let div6;
    	let div5;
    	let a1;
    	let i1;
    	let t10;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "HL";
    			t1 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			span1 = element("span");
    			span1.textContent = "Fiordaliza De Jesus\r\n                    Herrera";
    			t3 = space();
    			a0 = element("a");
    			i0 = element("i");
    			t4 = text(" Ver datos personales");
    			t5 = space();
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "49 años";
    			t7 = text(" | ");
    			span3 = element("span");
    			span3.textContent = "05600180675";
    			t9 = space();
    			div6 = element("div");
    			div5 = element("div");
    			a1 = element("a");
    			i1 = element("i");
    			t10 = text("\r\n                Iniciar nueva atención");
    			attr_dev(span0, "class", "avatar-title rounded-circle");
    			add_location(span0, file$7, 7, 16, 275);
    			attr_dev(div0, "class", "avatar mr-3  avatar-xl");
    			add_location(div0, file$7, 6, 14, 221);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$7, 11, 18, 451);
    			attr_dev(i0, "class", "mdi mdi-comment-eye");
    			add_location(i0, file$7, 15, 20, 727);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "btn ml-2 btn-primary btn-sm");
    			attr_dev(a0, "data-toggle", "modal");
    			attr_dev(a0, "data-target", "#modalDatosPersonales");
    			add_location(a0, file$7, 13, 18, 580);
    			attr_dev(h5, "class", "mt-0");
    			add_location(h5, file$7, 10, 16, 413);
    			attr_dev(span2, "data-bind", "text: paciente().edad");
    			add_location(span2, file$7, 18, 40, 872);
    			attr_dev(span3, "data-bind", "text: paciente().cedula");
    			add_location(span3, file$7, 18, 97, 929);
    			attr_dev(div1, "class", "opacity-75");
    			add_location(div1, file$7, 18, 16, 848);
    			attr_dev(div2, "class", "media-body m-auto");
    			add_location(div2, file$7, 9, 14, 364);
    			attr_dev(div3, "class", "media");
    			add_location(div3, file$7, 5, 12, 186);
    			attr_dev(div4, "class", "col-md-6 text-white p-b-30");
    			add_location(div4, file$7, 4, 10, 132);
    			attr_dev(i1, "class", "mdi mdi-progress-check");
    			add_location(i1, file$7, 28, 50, 1347);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "type", "button");
    			attr_dev(a1, "class", "btn text-white m-b-30 ml-2 mr-2 ml-3 btn-primary");
    			attr_dev(a1, "data-toggle", "modal");
    			attr_dev(a1, "data-target", "#modalNuevaAtencion");
    			add_location(a1, file$7, 27, 14, 1193);
    			attr_dev(div5, "class", "dropdown");
    			add_location(div5, file$7, 26, 12, 1155);
    			attr_dev(div6, "class", "col-md-6");
    			set_style(div6, "text-align", "right");
    			add_location(div6, file$7, 25, 10, 1093);
    			attr_dev(div7, "class", "row p-b-60 p-t-60");
    			add_location(div7, file$7, 3, 8, 89);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$7, 2, 6, 56);
    			attr_dev(div9, "class", "");
    			add_location(div9, file$7, 1, 4, 34);
    			attr_dev(div10, "class", "bg-dark m-b-30");
    			add_location(div10, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, span0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, span1);
    			append_dev(h5, t3);
    			append_dev(h5, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(div1, t7);
    			append_dev(div1, span3);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t10);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CabeceraPerfil", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CabeceraPerfil> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CabeceraPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CabeceraPerfil",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Pages\Pacientes\PacientePerfil.svelte generated by Svelte v3.29.0 */
    const file$8 = "src\\Pages\\Pacientes\\PacientePerfil.svelte";

    function create_fragment$9(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let section1;
    	let section0;
    	let cabeceraperfil;
    	let t2;
    	let div55;
    	let div54;
    	let div53;
    	let div31;
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t3;
    	let t4;
    	let div3;
    	let textarea;
    	let t5;
    	let ultimosvitales;
    	let t6;
    	let div30;
    	let div5;
    	let h50;
    	let t8;
    	let p0;
    	let t10;
    	let div29;
    	let form0;
    	let div7;
    	let h1;
    	let i1;
    	let t11;
    	let br0;
    	let t12;
    	let div6;
    	let a0;
    	let t14;
    	let br1;
    	let t15;
    	let div28;
    	let div17;
    	let div10;
    	let div9;
    	let div8;
    	let i2;
    	let t16;
    	let div13;
    	let div11;
    	let t18;
    	let div12;
    	let t20;
    	let div16;
    	let div15;
    	let a1;
    	let i3;
    	let t21;
    	let div14;
    	let button0;
    	let t23;
    	let button1;
    	let t25;
    	let button2;
    	let t27;
    	let div27;
    	let div20;
    	let div19;
    	let div18;
    	let i4;
    	let t28;
    	let div23;
    	let div21;
    	let t30;
    	let div22;
    	let t32;
    	let div26;
    	let div25;
    	let a2;
    	let i5;
    	let t33;
    	let div24;
    	let button3;
    	let t35;
    	let button4;
    	let t37;
    	let button5;
    	let t39;
    	let div37;
    	let div36;
    	let div34;
    	let div33;
    	let div32;
    	let i6;
    	let t40;
    	let t41;
    	let div35;
    	let evoluciones;
    	let t42;
    	let div52;
    	let div41;
    	let div40;
    	let div39;
    	let div38;
    	let i7;
    	let t43;
    	let t44;
    	let div43;
    	let div42;
    	let antecedente;
    	let t45;
    	let a3;
    	let t47;
    	let div51;
    	let div46;
    	let div45;
    	let div44;
    	let i8;
    	let t48;
    	let t49;
    	let div50;
    	let div48;
    	let input;
    	let t50;
    	let ul;
    	let div47;
    	let li0;
    	let a4;
    	let t52;
    	let li1;
    	let a5;
    	let t54;
    	let li2;
    	let a6;
    	let i9;
    	let t55;
    	let t56;
    	let div49;
    	let t57;
    	let button6;
    	let span0;
    	let t59;
    	let form1;
    	let datos_paciente;
    	let div107;
    	let div106;
    	let div105;
    	let div56;
    	let h51;
    	let t61;
    	let button7;
    	let span1;
    	let t63;
    	let div98;
    	let div61;
    	let div58;
    	let div57;
    	let img;
    	let img_src_value;
    	let t64;
    	let h30;
    	let a7;
    	let t66;
    	let div59;
    	let t68;
    	let div60;
    	let span3;
    	let t69;
    	let span2;
    	let t71;
    	let hr0;
    	let t72;
    	let div88;
    	let div63;
    	let div62;
    	let sapn;
    	let t74;
    	let strong0;
    	let t76;
    	let div65;
    	let div64;
    	let span4;
    	let t78;
    	let strong1;
    	let t80;
    	let div67;
    	let div66;
    	let span5;
    	let t82;
    	let strong2;
    	let t84;
    	let div69;
    	let div68;
    	let span6;
    	let t86;
    	let strong3;
    	let t88;
    	let div71;
    	let div70;
    	let span7;
    	let t90;
    	let strong4;
    	let t92;
    	let div73;
    	let div72;
    	let span8;
    	let t94;
    	let strong5;
    	let t96;
    	let div75;
    	let div74;
    	let span9;
    	let t98;
    	let strong6;
    	let t100;
    	let div77;
    	let div76;
    	let span10;
    	let t102;
    	let strong7;
    	let t104;
    	let div79;
    	let div78;
    	let span11;
    	let t106;
    	let strong8;
    	let t108;
    	let div81;
    	let div80;
    	let span12;
    	let t110;
    	let strong9;
    	let t112;
    	let div83;
    	let div82;
    	let span13;
    	let t114;
    	let strong10;
    	let t116;
    	let div85;
    	let div84;
    	let span14;
    	let t118;
    	let strong11;
    	let t120;
    	let div87;
    	let div86;
    	let span15;
    	let t122;
    	let strong12;
    	let t124;
    	let p1;
    	let b;
    	let t126;
    	let hr1;
    	let t127;
    	let div97;
    	let div90;
    	let div89;
    	let span16;
    	let t129;
    	let strong13;
    	let t131;
    	let div92;
    	let div91;
    	let span17;
    	let t133;
    	let strong14;
    	let t135;
    	let div94;
    	let div93;
    	let span18;
    	let t137;
    	let strong15;
    	let t139;
    	let div96;
    	let div95;
    	let span19;
    	let t141;
    	let strong16;
    	let t143;
    	let div104;
    	let div103;
    	let div100;
    	let a8;
    	let h31;
    	let t144;
    	let div99;
    	let t146;
    	let div102;
    	let a9;
    	let h32;
    	let t147;
    	let div101;
    	let main_intro;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	cabeceraperfil = new CabeceraPerfil({ $$inline: true });

    	ultimosvitales = new UltimosVitales({
    			props: {
    				peso: "80",
    				temperatura: "38",
    				frecuenciaRespiratoria: "30",
    				frecuenciaCardiaca: "80",
    				presionAlterial: "80/120"
    			},
    			$$inline: true
    		});

    	evoluciones = new Evoluciones({
    			props: {
    				motivo: "Conducta desorganizada - Alteracion del patron del sueño - Pobre respuesta al tx",
    				historia: "Refiere el informante (esposo) que el cuadro actual inicia hace alrededor de 4 dias, luego de conflicto por supuesta infidelidad, caracterizado por alteracion en el patron del sueño, a lo cual se fue agregando ideacion delirante de perjuicio y pobre respuesta al tx a base de Escitalopram y Olanzapina que utilizaba desde hace varios meses, por lo anterior es traida a este centro, donde previa evaluacion se decide su ingreso."
    			},
    			$$inline: true
    		});

    	antecedente = new Antecedente({
    			props: {
    				descripcionAntecedente: "Ibuprofeno y otros medicamentos que contengan este mismo componente",
    				tipoAntecedente: "Alergia"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section1 = element("section");
    			section0 = element("section");
    			create_component(cabeceraperfil.$$.fragment);
    			t2 = space();
    			div55 = element("div");
    			div54 = element("div");
    			div53 = element("div");
    			div31 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t3 = text("\r\n                  Comentario");
    			t4 = space();
    			div3 = element("div");
    			textarea = element("textarea");
    			t5 = space();
    			create_component(ultimosvitales.$$.fragment);
    			t6 = space();
    			div30 = element("div");
    			div5 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Archivos o Documentos";
    			t8 = space();
    			p0 = element("p");
    			p0.textContent = "Puede subir documentos del paciente, como fotos de laboratorios, recetas entre otros.";
    			t10 = space();
    			div29 = element("div");
    			form0 = element("form");
    			div7 = element("div");
    			h1 = element("h1");
    			i1 = element("i");
    			t11 = text("\r\n                            Puede arrastrar el documento a esta zona.");
    			br0 = element("br");
    			t12 = space();
    			div6 = element("div");
    			a0 = element("a");
    			a0.textContent = "Subir Archivo";
    			t14 = space();
    			br1 = element("br");
    			t15 = space();
    			div28 = element("div");
    			div17 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			i2 = element("i");
    			t16 = space();
    			div13 = element("div");
    			div11 = element("div");
    			div11.textContent = "SRS Document";
    			t18 = space();
    			div12 = element("div");
    			div12.textContent = "25.5 Mb";
    			t20 = space();
    			div16 = element("div");
    			div15 = element("div");
    			a1 = element("a");
    			i3 = element("i");
    			t21 = space();
    			div14 = element("div");
    			button0 = element("button");
    			button0.textContent = "Action";
    			t23 = space();
    			button1 = element("button");
    			button1.textContent = "Another action";
    			t25 = space();
    			button2 = element("button");
    			button2.textContent = "Something else here";
    			t27 = space();
    			div27 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			i4 = element("i");
    			t28 = space();
    			div23 = element("div");
    			div21 = element("div");
    			div21.textContent = "Design Guide.pdf";
    			t30 = space();
    			div22 = element("div");
    			div22.textContent = "9 Mb";
    			t32 = space();
    			div26 = element("div");
    			div25 = element("div");
    			a2 = element("a");
    			i5 = element("i");
    			t33 = space();
    			div24 = element("div");
    			button3 = element("button");
    			button3.textContent = "Action";
    			t35 = space();
    			button4 = element("button");
    			button4.textContent = "Another action";
    			t37 = space();
    			button5 = element("button");
    			button5.textContent = "Something else here";
    			t39 = space();
    			div37 = element("div");
    			div36 = element("div");
    			div34 = element("div");
    			div33 = element("div");
    			div32 = element("div");
    			i6 = element("i");
    			t40 = text("\r\n                  Historial atenciones");
    			t41 = space();
    			div35 = element("div");
    			create_component(evoluciones.$$.fragment);
    			t42 = space();
    			div52 = element("div");
    			div41 = element("div");
    			div40 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			i7 = element("i");
    			t43 = text("\r\n                  Antecedentes");
    			t44 = space();
    			div43 = element("div");
    			div42 = element("div");
    			create_component(antecedente.$$.fragment);
    			t45 = space();
    			a3 = element("a");
    			a3.textContent = "ver todos los antecedentes";
    			t47 = space();
    			div51 = element("div");
    			div46 = element("div");
    			div45 = element("div");
    			div44 = element("div");
    			i8 = element("i");
    			t48 = text("\r\n                  Medicamentos en uso");
    			t49 = space();
    			div50 = element("div");
    			div48 = element("div");
    			input = element("input");
    			t50 = space();
    			ul = element("ul");
    			div47 = element("div");
    			li0 = element("li");
    			a4 = element("a");
    			a4.textContent = "Metrocaps";
    			t52 = space();
    			li1 = element("li");
    			a5 = element("a");
    			a5.textContent = "Albendazol";
    			t54 = space();
    			li2 = element("li");
    			a6 = element("a");
    			i9 = element("i");
    			t55 = text(" Agregar manualmente");
    			t56 = space();
    			div49 = element("div");
    			t57 = text("AirPlus\r\n                    ");
    			button6 = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t59 = space();
    			form1 = element("form");
    			datos_paciente = element("datos-paciente");
    			div107 = element("div");
    			div106 = element("div");
    			div105 = element("div");
    			div56 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Datos de paciente";
    			t61 = space();
    			button7 = element("button");
    			span1 = element("span");
    			span1.textContent = "×";
    			t63 = space();
    			div98 = element("div");
    			div61 = element("div");
    			div58 = element("div");
    			div57 = element("div");
    			img = element("img");
    			t64 = space();
    			h30 = element("h3");
    			a7 = element("a");
    			a7.textContent = "Fiordaliza De Jesus Herrera";
    			t66 = space();
    			div59 = element("div");
    			div59.textContent = "fiordaliza@gmail.com";
    			t68 = space();
    			div60 = element("div");
    			span3 = element("span");
    			t69 = text("Ultima vez modificado ");
    			span2 = element("span");
    			span2.textContent = "18/5/2020 4:24:46 p. m.";
    			t71 = space();
    			hr0 = element("hr");
    			t72 = space();
    			div88 = element("div");
    			div63 = element("div");
    			div62 = element("div");
    			sapn = element("sapn");
    			sapn.textContent = "Cedula / pasaporte";
    			t74 = space();
    			strong0 = element("strong");
    			strong0.textContent = "05600180675";
    			t76 = space();
    			div65 = element("div");
    			div64 = element("div");
    			span4 = element("span");
    			span4.textContent = "Nombres";
    			t78 = space();
    			strong1 = element("strong");
    			strong1.textContent = "Fiordaliza";
    			t80 = space();
    			div67 = element("div");
    			div66 = element("div");
    			span5 = element("span");
    			span5.textContent = "Primer Apellido";
    			t82 = space();
    			strong2 = element("strong");
    			strong2.textContent = "De Jesus";
    			t84 = space();
    			div69 = element("div");
    			div68 = element("div");
    			span6 = element("span");
    			span6.textContent = "Segundo Apellido";
    			t86 = space();
    			strong3 = element("strong");
    			strong3.textContent = "Herrera";
    			t88 = space();
    			div71 = element("div");
    			div70 = element("div");
    			span7 = element("span");
    			span7.textContent = "Sexo";
    			t90 = space();
    			strong4 = element("strong");
    			strong4.textContent = "Femenino";
    			t92 = space();
    			div73 = element("div");
    			div72 = element("div");
    			span8 = element("span");
    			span8.textContent = "Edad";
    			t94 = space();
    			strong5 = element("strong");
    			strong5.textContent = "49 años";
    			t96 = space();
    			div75 = element("div");
    			div74 = element("div");
    			span9 = element("span");
    			span9.textContent = "Estado Civil";
    			t98 = space();
    			strong6 = element("strong");
    			strong6.textContent = "Casado";
    			t100 = space();
    			div77 = element("div");
    			div76 = element("div");
    			span10 = element("span");
    			span10.textContent = "Fecha Nacimiento";
    			t102 = space();
    			strong7 = element("strong");
    			strong7.textContent = "1971-07-30T00:00:00";
    			t104 = space();
    			div79 = element("div");
    			div78 = element("div");
    			span11 = element("span");
    			span11.textContent = "Telefono";
    			t106 = space();
    			strong8 = element("strong");
    			strong8.textContent = "(809) 588-2020";
    			t108 = space();
    			div81 = element("div");
    			div80 = element("div");
    			span12 = element("span");
    			span12.textContent = "Celular";
    			t110 = space();
    			strong9 = element("strong");
    			strong9.textContent = "(809) 224-1582";
    			t112 = space();
    			div83 = element("div");
    			div82 = element("div");
    			span13 = element("span");
    			span13.textContent = "Seguro Medico";
    			t114 = space();
    			strong10 = element("strong");
    			strong10.textContent = "SENASA";
    			t116 = space();
    			div85 = element("div");
    			div84 = element("div");
    			span14 = element("span");
    			span14.textContent = "Poliza";
    			t118 = space();
    			strong11 = element("strong");
    			strong11.textContent = "079183927";
    			t120 = space();
    			div87 = element("div");
    			div86 = element("div");
    			span15 = element("span");
    			span15.textContent = "NSS";
    			t122 = space();
    			strong12 = element("strong");
    			strong12.textContent = "--";
    			t124 = space();
    			p1 = element("p");
    			b = element("b");
    			b.textContent = "Datos demográficos";
    			t126 = space();
    			hr1 = element("hr");
    			t127 = space();
    			div97 = element("div");
    			div90 = element("div");
    			div89 = element("div");
    			span16 = element("span");
    			span16.textContent = "Dirección";
    			t129 = space();
    			strong13 = element("strong");
    			strong13.textContent = "Pimentel";
    			t131 = space();
    			div92 = element("div");
    			div91 = element("div");
    			span17 = element("span");
    			span17.textContent = "Ciudad";
    			t133 = space();
    			strong14 = element("strong");
    			strong14.textContent = "SFM";
    			t135 = space();
    			div94 = element("div");
    			div93 = element("div");
    			span18 = element("span");
    			span18.textContent = "Pais";
    			t137 = space();
    			strong15 = element("strong");
    			strong15.textContent = "República Dominicana";
    			t139 = space();
    			div96 = element("div");
    			div95 = element("div");
    			span19 = element("span");
    			span19.textContent = "Provincia";
    			t141 = space();
    			strong16 = element("strong");
    			strong16.textContent = "Duarte";
    			t143 = space();
    			div104 = element("div");
    			div103 = element("div");
    			div100 = element("div");
    			a8 = element("a");
    			h31 = element("h3");
    			t144 = space();
    			div99 = element("div");
    			div99.textContent = "Cerrar";
    			t146 = space();
    			div102 = element("div");
    			a9 = element("a");
    			h32 = element("h3");
    			t147 = space();
    			div101 = element("div");
    			div101.textContent = "Editar";
    			attr_dev(i0, "class", "mdi mdi-comment-account-outline mdi-18px");
    			add_location(i0, file$8, 42, 22, 1320);
    			attr_dev(div0, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div0, file$8, 41, 20, 1247);
    			attr_dev(div1, "class", "avatar mr-2 avatar-xs");
    			add_location(div1, file$8, 40, 18, 1190);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$8, 39, 16, 1145);
    			attr_dev(textarea, "class", "form-control mt-2");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			textarea.readOnly = "";
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "data-bind", "value: paciente().comentario");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$8, 48, 18, 1556);
    			attr_dev(div3, "class", "form-group col-lg-12");
    			add_location(div3, file$8, 47, 16, 1502);
    			attr_dev(div4, "class", "card m-b-30");
    			add_location(div4, file$8, 38, 14, 1102);
    			attr_dev(h50, "class", "m-b-0");
    			add_location(h50, file$8, 63, 20, 2219);
    			attr_dev(p0, "class", "m-b-0 mt-2 text-muted");
    			add_location(p0, file$8, 66, 20, 2333);
    			attr_dev(div5, "class", "card-header");
    			add_location(div5, file$8, 62, 16, 2172);
    			attr_dev(i1, "class", " mdi mdi-progress-upload");
    			add_location(i1, file$8, 76, 32, 2777);
    			attr_dev(h1, "class", "display-4");
    			add_location(h1, file$8, 75, 28, 2721);
    			add_location(br0, file$8, 78, 69, 2923);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "btn btn-lg btn-primary");
    			add_location(a0, file$8, 80, 32, 3010);
    			attr_dev(div6, "class", "p-t-5");
    			add_location(div6, file$8, 79, 28, 2957);
    			attr_dev(div7, "class", "dz-message");
    			add_location(div7, file$8, 74, 24, 2667);
    			attr_dev(form0, "class", "dropzone dz-clickable");
    			attr_dev(form0, "action", "/");
    			add_location(form0, file$8, 73, 20, 2594);
    			add_location(br1, file$8, 84, 27, 3169);
    			attr_dev(i2, "class", "mdi mdi-24px mdi-file-pdf");
    			add_location(i2, file$8, 91, 78, 3518);
    			attr_dev(div8, "class", "avatar-title bg-dark rounded");
    			add_location(div8, file$8, 91, 36, 3476);
    			attr_dev(div9, "class", "avatar avatar-sm ");
    			add_location(div9, file$8, 90, 32, 3407);
    			attr_dev(div10, "class", "m-r-20");
    			add_location(div10, file$8, 89, 28, 3353);
    			add_location(div11, file$8, 96, 32, 3764);
    			attr_dev(div12, "class", "text-muted");
    			add_location(div12, file$8, 97, 32, 3821);
    			attr_dev(div13, "class", "");
    			add_location(div13, file$8, 95, 28, 3716);
    			attr_dev(i3, "class", "mdi  mdi-dots-vertical mdi-18px");
    			add_location(i3, file$8, 103, 63, 4161);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "data-toggle", "dropdown");
    			attr_dev(a1, "aria-haspopup", "true");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file$8, 102, 36, 4041);
    			attr_dev(button0, "class", "dropdown-item");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$8, 107, 40, 4379);
    			attr_dev(button1, "class", "dropdown-item");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$8, 108, 40, 4480);
    			attr_dev(button2, "class", "dropdown-item");
    			attr_dev(button2, "type", "button");
    			add_location(button2, file$8, 109, 40, 4589);
    			attr_dev(div14, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div14, file$8, 106, 36, 4290);
    			attr_dev(div15, "class", "dropdown");
    			add_location(div15, file$8, 101, 32, 3981);
    			attr_dev(div16, "class", "ml-auto");
    			add_location(div16, file$8, 100, 28, 3926);
    			attr_dev(div17, "class", "list-group-item d-flex  align-items-center");
    			add_location(div17, file$8, 88, 24, 3267);
    			attr_dev(i4, "class", "mdi mdi-24px mdi-file-document-box");
    			add_location(i4, file$8, 118, 78, 5092);
    			attr_dev(div18, "class", "avatar-title bg-dark rounded");
    			add_location(div18, file$8, 118, 36, 5050);
    			attr_dev(div19, "class", "avatar avatar-sm ");
    			add_location(div19, file$8, 117, 32, 4981);
    			attr_dev(div20, "class", "m-r-20");
    			add_location(div20, file$8, 116, 28, 4927);
    			add_location(div21, file$8, 123, 32, 5347);
    			attr_dev(div22, "class", "text-muted");
    			add_location(div22, file$8, 124, 32, 5408);
    			attr_dev(div23, "class", "");
    			add_location(div23, file$8, 122, 28, 5299);
    			attr_dev(i5, "class", "mdi  mdi-dots-vertical mdi-18px");
    			add_location(i5, file$8, 130, 63, 5745);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "data-toggle", "dropdown");
    			attr_dev(a2, "aria-haspopup", "true");
    			attr_dev(a2, "aria-expanded", "false");
    			add_location(a2, file$8, 129, 36, 5625);
    			attr_dev(button3, "class", "dropdown-item");
    			attr_dev(button3, "type", "button");
    			add_location(button3, file$8, 134, 40, 5963);
    			attr_dev(button4, "class", "dropdown-item");
    			attr_dev(button4, "type", "button");
    			add_location(button4, file$8, 135, 40, 6064);
    			attr_dev(button5, "class", "dropdown-item");
    			attr_dev(button5, "type", "button");
    			add_location(button5, file$8, 136, 40, 6173);
    			attr_dev(div24, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div24, file$8, 133, 36, 5874);
    			attr_dev(div25, "class", "dropdown");
    			add_location(div25, file$8, 128, 32, 5565);
    			attr_dev(div26, "class", "ml-auto");
    			add_location(div26, file$8, 127, 28, 5510);
    			attr_dev(div27, "class", "list-group-item d-flex  align-items-center");
    			add_location(div27, file$8, 115, 24, 4841);
    			attr_dev(div28, "class", "list-group list-group-flush ");
    			add_location(div28, file$8, 86, 20, 3197);
    			attr_dev(div29, "class", "card-body");
    			add_location(div29, file$8, 70, 16, 2545);
    			attr_dev(div30, "class", "card m-b-30");
    			add_location(div30, file$8, 61, 14, 2129);
    			attr_dev(div31, "class", "col-lg-3");
    			add_location(div31, file$8, 37, 12, 1064);
    			attr_dev(i6, "class", "mdi mdi-progress-check mdi-18px");
    			add_location(i6, file$8, 153, 22, 6765);
    			attr_dev(div32, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div32, file$8, 152, 20, 6692);
    			attr_dev(div33, "class", "avatar mr-2 avatar-xs");
    			add_location(div33, file$8, 151, 18, 6635);
    			attr_dev(div34, "class", "card-header");
    			add_location(div34, file$8, 150, 16, 6590);
    			attr_dev(div35, "class", "card-body");
    			add_location(div35, file$8, 158, 16, 6948);
    			attr_dev(div36, "class", "card m-b-30");
    			add_location(div36, file$8, 149, 14, 6547);
    			attr_dev(div37, "class", "col-md-5");
    			add_location(div37, file$8, 148, 12, 6509);
    			attr_dev(i7, "class", "mdi mdi-history mdi-18px");
    			add_location(i7, file$8, 174, 22, 7983);
    			attr_dev(div38, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div38, file$8, 173, 20, 7910);
    			attr_dev(div39, "class", "avatar mr-2 avatar-xs");
    			add_location(div39, file$8, 172, 18, 7853);
    			attr_dev(div40, "class", "card-header");
    			add_location(div40, file$8, 171, 16, 7808);
    			attr_dev(div41, "class", "card m-b-30");
    			add_location(div41, file$8, 170, 14, 7765);
    			add_location(div42, file$8, 182, 16, 8219);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "btn mb-3 btn-primary btn-sm btn-block");
    			add_location(a3, file$8, 188, 16, 8485);
    			attr_dev(div43, "class", "atenciones-vnc");
    			add_location(div43, file$8, 181, 14, 8173);
    			attr_dev(i8, "class", "mdi mdi-comment-account-outline mdi-18px");
    			add_location(i8, file$8, 194, 22, 8830);
    			attr_dev(div44, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div44, file$8, 193, 20, 8757);
    			attr_dev(div45, "class", "avatar mr-2 avatar-xs");
    			add_location(div45, file$8, 192, 18, 8700);
    			attr_dev(div46, "class", " card-header");
    			add_location(div46, file$8, 191, 16, 8654);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "name", "");
    			attr_dev(input, "id", "");
    			attr_dev(input, "data-toggle", "dropdown");
    			attr_dev(input, "aria-haspopup", "true");
    			attr_dev(input, "aria-expanded", "false");
    			add_location(input, file$8, 202, 20, 9128);
    			attr_dev(a4, "href", "#");
    			add_location(a4, file$8, 207, 26, 9458);
    			add_location(li0, file$8, 206, 24, 9426);
    			attr_dev(a5, "href", "#");
    			add_location(a5, file$8, 210, 26, 9572);
    			add_location(li1, file$8, 209, 24, 9540);
    			attr_dev(div47, "class", "contenidoLista");
    			add_location(div47, file$8, 205, 22, 9372);
    			attr_dev(i9, "class", "mdi mdi-plus");
    			add_location(i9, file$8, 214, 36, 9741);
    			attr_dev(a6, "href", "#");
    			add_location(a6, file$8, 214, 24, 9729);
    			attr_dev(li2, "class", "defecto");
    			add_location(li2, file$8, 213, 22, 9683);
    			attr_dev(ul, "class", "lista-buscador dropdown-menu svelte-156wd2o");
    			attr_dev(ul, "id", "buscador");
    			add_location(ul, file$8, 204, 20, 9293);
    			attr_dev(div48, "class", "form-group buscardor dropdown");
    			add_location(div48, file$8, 201, 18, 9063);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$8, 221, 22, 10122);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "close");
    			attr_dev(button6, "data-dismiss", "alert");
    			attr_dev(button6, "aria-label", "Close");
    			add_location(button6, file$8, 220, 20, 10022);
    			attr_dev(div49, "class", "alert alert-secondary alert-dismissible fade show");
    			attr_dev(div49, "role", "alert");
    			add_location(div49, file$8, 218, 18, 9895);
    			attr_dev(div50, "class", "col-12");
    			add_location(div50, file$8, 200, 16, 9023);
    			attr_dev(div51, "class", "card m-b-30");
    			add_location(div51, file$8, 190, 14, 8611);
    			attr_dev(div52, "class", "col-md-4");
    			add_location(div52, file$8, 169, 12, 7727);
    			attr_dev(div53, "class", "row");
    			add_location(div53, file$8, 36, 10, 1033);
    			attr_dev(div54, "class", "col-md-12");
    			add_location(div54, file$8, 35, 8, 998);
    			attr_dev(div55, "class", "pull-up");
    			add_location(div55, file$8, 34, 6, 967);
    			attr_dev(section0, "class", "admin-content");
    			add_location(section0, file$8, 32, 4, 902);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "modalDatosPersonales");
    			add_location(h51, file$8, 242, 14, 10857);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$8, 244, 16, 11039);
    			attr_dev(button7, "type", "button");
    			attr_dev(button7, "class", "close");
    			attr_dev(button7, "data-dismiss", "modal");
    			attr_dev(button7, "aria-label", "Close");
    			add_location(button7, file$8, 243, 14, 10945);
    			attr_dev(div56, "class", "modal-header");
    			add_location(div56, file$8, 241, 12, 10815);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "assets/img/placeholder.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "imagen paciente");
    			add_location(img, file$8, 252, 20, 11293);
    			attr_dev(div57, "class", "avatar avatar-xl");
    			add_location(div57, file$8, 251, 18, 11241);
    			add_location(div58, file$8, 250, 16, 11216);
    			attr_dev(a7, "href", "/Expediente/Perfil/1");
    			add_location(a7, file$8, 257, 18, 11531);
    			attr_dev(h30, "class", "p-t-10 searchBy-name");
    			add_location(h30, file$8, 256, 16, 11478);
    			attr_dev(div59, "class", "text-muted text-center m-b-10");
    			attr_dev(div59, "data-bind", "text: paciente().correo");
    			add_location(div59, file$8, 260, 16, 11655);
    			attr_dev(span2, "data-bind", "text: paciente().ultimaModificacion");
    			add_location(span2, file$8, 262, 74, 11874);
    			attr_dev(span3, "class", "badge badge-primary");
    			add_location(span3, file$8, 262, 18, 11818);
    			attr_dev(div60, "class", "m-auto");
    			add_location(div60, file$8, 261, 16, 11778);
    			attr_dev(div61, "class", "text-center");
    			add_location(div61, file$8, 249, 14, 11173);
    			add_location(hr0, file$8, 266, 14, 12055);
    			attr_dev(sapn, "class", "text-primary");
    			add_location(sapn, file$8, 270, 22, 12238);
    			attr_dev(strong0, "class", "d-block");
    			attr_dev(strong0, "data-bind", "text: paciente().cedula");
    			add_location(strong0, file$8, 271, 22, 12314);
    			attr_dev(div62, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div62, file$8, 269, 20, 12174);
    			attr_dev(div63, "class", "form-group col-md-6");
    			add_location(div63, file$8, 268, 18, 12119);
    			attr_dev(span4, "class", "text-primary");
    			add_location(span4, file$8, 278, 22, 12768);
    			attr_dev(strong1, "class", "d-block");
    			attr_dev(strong1, "data-bind", "text: paciente().nombres");
    			add_location(strong1, file$8, 279, 22, 12833);
    			attr_dev(div64, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div64, file$8, 277, 20, 12703);
    			attr_dev(div65, "class", "form-group col-md-12");
    			add_location(div65, file$8, 276, 18, 12647);
    			attr_dev(span5, "class", "text-primary");
    			add_location(span5, file$8, 285, 22, 13226);
    			attr_dev(strong2, "class", "d-block");
    			attr_dev(strong2, "data-bind", "text: paciente().primerApellido");
    			add_location(strong2, file$8, 286, 22, 13299);
    			attr_dev(div66, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div66, file$8, 284, 20, 13162);
    			attr_dev(div67, "class", "form-group col-md-6");
    			add_location(div67, file$8, 283, 18, 13107);
    			attr_dev(span6, "class", "text-primary");
    			add_location(span6, file$8, 293, 22, 13773);
    			attr_dev(strong3, "class", "d-block");
    			attr_dev(strong3, "data-bind", "text: paciente().segundoApellido");
    			add_location(strong3, file$8, 294, 22, 13847);
    			attr_dev(div68, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div68, file$8, 292, 20, 13709);
    			attr_dev(div69, "class", "form-group col-md-6 ");
    			add_location(div69, file$8, 291, 18, 13653);
    			attr_dev(span7, "class", "text-primary");
    			add_location(span7, file$8, 301, 22, 14322);
    			attr_dev(strong4, "class", "d-block");
    			attr_dev(strong4, "data-bind", "text: paciente().sexo");
    			add_location(strong4, file$8, 302, 22, 14384);
    			attr_dev(div70, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div70, file$8, 300, 20, 14258);
    			attr_dev(div71, "class", "form-group col-md-6");
    			add_location(div71, file$8, 299, 18, 14203);
    			attr_dev(span8, "class", "text-primary");
    			add_location(span8, file$8, 308, 22, 14782);
    			attr_dev(strong5, "class", "d-block");
    			attr_dev(strong5, "data-bind", "text: paciente().edad");
    			add_location(strong5, file$8, 309, 22, 14844);
    			attr_dev(div72, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div72, file$8, 307, 20, 14718);
    			attr_dev(div73, "class", "form-group col-md-6");
    			add_location(div73, file$8, 306, 18, 14663);
    			attr_dev(span9, "class", "text-primary");
    			add_location(span9, file$8, 315, 22, 15241);
    			attr_dev(strong6, "class", "d-block");
    			attr_dev(strong6, "data-bind", "text: paciente().estadoCivil");
    			add_location(strong6, file$8, 316, 22, 15311);
    			attr_dev(div74, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div74, file$8, 314, 20, 15177);
    			attr_dev(div75, "class", "form-group col-md-6");
    			add_location(div75, file$8, 313, 18, 15122);
    			attr_dev(span10, "class", "text-primary");
    			add_location(span10, file$8, 324, 22, 15756);
    			attr_dev(strong7, "class", "d-block");
    			attr_dev(strong7, "data-bind", "text: paciente().fechaNacimiento");
    			add_location(strong7, file$8, 325, 22, 15830);
    			attr_dev(div76, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div76, file$8, 323, 20, 15692);
    			attr_dev(div77, "class", "form-group col-md-6");
    			add_location(div77, file$8, 322, 18, 15637);
    			attr_dev(span11, "class", "text-primary");
    			add_location(span11, file$8, 332, 22, 16295);
    			attr_dev(strong8, "class", "d-block");
    			attr_dev(strong8, "data-bind", "text: paciente().telefono");
    			add_location(strong8, file$8, 333, 22, 16361);
    			attr_dev(div78, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div78, file$8, 331, 20, 16230);
    			attr_dev(div79, "class", "form-group col-md-6");
    			add_location(div79, file$8, 330, 18, 16175);
    			attr_dev(span12, "class", "text-primary");
    			add_location(span12, file$8, 340, 22, 16822);
    			attr_dev(strong9, "class", "d-block");
    			attr_dev(strong9, "data-bind", "text: paciente().celular");
    			add_location(strong9, file$8, 341, 22, 16887);
    			attr_dev(div80, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div80, file$8, 339, 20, 16758);
    			attr_dev(div81, "class", "form-group col-md-6");
    			add_location(div81, file$8, 338, 18, 16703);
    			attr_dev(span13, "class", "text-primary");
    			add_location(span13, file$8, 348, 22, 17350);
    			attr_dev(strong10, "class", "d-block");
    			attr_dev(strong10, "data-bind", "text: paciente().nombreAseguradora");
    			add_location(strong10, file$8, 349, 22, 17421);
    			attr_dev(div82, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div82, file$8, 347, 20, 17286);
    			attr_dev(div83, "class", "form-group col-md-6 ");
    			add_location(div83, file$8, 346, 18, 17230);
    			attr_dev(span14, "class", "text-primary");
    			add_location(span14, file$8, 356, 22, 17912);
    			attr_dev(strong11, "class", "d-block");
    			attr_dev(strong11, "data-bind", "text: paciente().poliza");
    			add_location(strong11, file$8, 357, 22, 17976);
    			attr_dev(div84, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div84, file$8, 355, 20, 17848);
    			attr_dev(div85, "class", "form-group col-md-6 ");
    			add_location(div85, file$8, 354, 18, 17792);
    			attr_dev(span15, "class", "text-primary");
    			add_location(span15, file$8, 364, 22, 18413);
    			attr_dev(strong12, "class", "d-block");
    			attr_dev(strong12, "data-bind", "text: paciente().nss");
    			add_location(strong12, file$8, 365, 22, 18474);
    			attr_dev(div86, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div86, file$8, 363, 20, 18349);
    			attr_dev(div87, "class", "form-group col-md-6 ");
    			add_location(div87, file$8, 362, 18, 18293);
    			attr_dev(div88, "class", "form-row");
    			add_location(div88, file$8, 267, 16, 12077);
    			add_location(b, file$8, 371, 32, 18819);
    			attr_dev(p1, "class", "mt-3");
    			add_location(p1, file$8, 371, 16, 18803);
    			add_location(hr1, file$8, 372, 16, 18866);
    			attr_dev(span16, "for", "inpDireccion");
    			attr_dev(span16, "class", "text-primary");
    			add_location(span16, file$8, 376, 22, 19051);
    			attr_dev(strong13, "class", "d-block");
    			attr_dev(strong13, "data-bind", "text: paciente().direccion");
    			add_location(strong13, file$8, 377, 22, 19137);
    			attr_dev(div89, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div89, file$8, 375, 20, 18987);
    			attr_dev(div90, "class", "form-group col-md-12 ");
    			add_location(div90, file$8, 374, 18, 18930);
    			attr_dev(span17, "class", "text-primary");
    			add_location(span17, file$8, 384, 22, 19579);
    			attr_dev(strong14, "class", "d-block");
    			attr_dev(strong14, "data-bind", "text: paciente().ciudad");
    			add_location(strong14, file$8, 385, 22, 19643);
    			attr_dev(div91, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div91, file$8, 383, 20, 19515);
    			attr_dev(div92, "class", "form-group col-md-6 ");
    			add_location(div92, file$8, 382, 18, 19459);
    			attr_dev(span18, "for", "inpPais");
    			attr_dev(span18, "class", "text-primary");
    			add_location(span18, file$8, 391, 22, 20028);
    			attr_dev(strong15, "class", "d-block");
    			attr_dev(strong15, "data-bind", "text: paciente().pais");
    			add_location(strong15, file$8, 392, 22, 20104);
    			attr_dev(div93, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div93, file$8, 390, 20, 19964);
    			attr_dev(div94, "class", "form-group col-md-6 ");
    			add_location(div94, file$8, 389, 18, 19908);
    			attr_dev(span19, "class", "text-primary");
    			add_location(span19, file$8, 399, 22, 20565);
    			attr_dev(strong16, "class", "d-block");
    			attr_dev(strong16, "data-bind", "text: paciente().provincia");
    			add_location(strong16, file$8, 400, 22, 20632);
    			attr_dev(div95, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div95, file$8, 398, 20, 20501);
    			attr_dev(div96, "class", "form-group col-md-6 ");
    			add_location(div96, file$8, 397, 18, 20445);
    			attr_dev(div97, "class", "form-row");
    			add_location(div97, file$8, 373, 16, 18888);
    			attr_dev(div98, "class", "modal-body");
    			add_location(div98, file$8, 247, 12, 11131);
    			attr_dev(h31, "class", "mdi mdi-close-outline");
    			add_location(h31, file$8, 413, 22, 21230);
    			attr_dev(div99, "class", "text-overline");
    			add_location(div99, file$8, 414, 22, 21293);
    			attr_dev(a8, "href", "#!");
    			attr_dev(a8, "class", "text-danger");
    			attr_dev(a8, "data-dismiss", "modal");
    			add_location(a8, file$8, 412, 20, 21152);
    			attr_dev(div100, "class", "col");
    			add_location(div100, file$8, 411, 18, 21113);
    			attr_dev(h32, "class", "mdi mdi-account-edit");
    			add_location(h32, file$8, 420, 20, 21515);
    			attr_dev(div101, "class", "text-overline");
    			add_location(div101, file$8, 421, 20, 21575);
    			attr_dev(a9, "href", "/Contacto/Editar/1");
    			add_location(a9, file$8, 418, 20, 21443);
    			attr_dev(div102, "class", "col");
    			add_location(div102, file$8, 417, 18, 21404);
    			attr_dev(div103, "class", "row text-center p-b-10");
    			add_location(div103, file$8, 410, 16, 21057);
    			attr_dev(div104, "class", "modal-footer");
    			add_location(div104, file$8, 409, 14, 21013);
    			attr_dev(div105, "class", "modal-content");
    			add_location(div105, file$8, 240, 10, 10774);
    			attr_dev(div106, "class", "modal-dialog");
    			attr_dev(div106, "role", "document");
    			add_location(div106, file$8, 239, 8, 10720);
    			attr_dev(div107, "class", "modal fade modal-slide-right");
    			attr_dev(div107, "id", "modalDatosPersonales");
    			attr_dev(div107, "tabindex", "-1");
    			attr_dev(div107, "role", "dialog");
    			attr_dev(div107, "aria-labelledby", "modalDatosPersonales");
    			set_style(div107, "display", "none");
    			set_style(div107, "padding-right", "16px");
    			attr_dev(div107, "aria-modal", "true");
    			add_location(div107, file$8, 237, 6, 10504);
    			set_custom_element_data(datos_paciente, "params", "data: paciente");
    			add_location(datos_paciente, file$8, 236, 4, 10456);
    			attr_dev(form1, "class", "form-group floating-label");
    			add_location(form1, file$8, 235, 4, 10410);
    			attr_dev(section1, "class", "admin-content");
    			add_location(section1, file$8, 31, 2, 865);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$8, 29, 0, 794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section1);
    			append_dev(section1, section0);
    			mount_component(cabeceraperfil, section0, null);
    			append_dev(section0, t2);
    			append_dev(section0, div55);
    			append_dev(div55, div54);
    			append_dev(div54, div53);
    			append_dev(div53, div31);
    			append_dev(div31, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, textarea);
    			append_dev(div31, t5);
    			mount_component(ultimosvitales, div31, null);
    			append_dev(div31, t6);
    			append_dev(div31, div30);
    			append_dev(div30, div5);
    			append_dev(div5, h50);
    			append_dev(div5, t8);
    			append_dev(div5, p0);
    			append_dev(div30, t10);
    			append_dev(div30, div29);
    			append_dev(div29, form0);
    			append_dev(form0, div7);
    			append_dev(div7, h1);
    			append_dev(h1, i1);
    			append_dev(div7, t11);
    			append_dev(div7, br0);
    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, a0);
    			append_dev(form0, t14);
    			append_dev(div29, br1);
    			append_dev(div29, t15);
    			append_dev(div29, div28);
    			append_dev(div28, div17);
    			append_dev(div17, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, i2);
    			append_dev(div17, t16);
    			append_dev(div17, div13);
    			append_dev(div13, div11);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div17, t20);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, a1);
    			append_dev(a1, i3);
    			append_dev(div15, t21);
    			append_dev(div15, div14);
    			append_dev(div14, button0);
    			append_dev(div14, t23);
    			append_dev(div14, button1);
    			append_dev(div14, t25);
    			append_dev(div14, button2);
    			append_dev(div28, t27);
    			append_dev(div28, div27);
    			append_dev(div27, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, i4);
    			append_dev(div27, t28);
    			append_dev(div27, div23);
    			append_dev(div23, div21);
    			append_dev(div23, t30);
    			append_dev(div23, div22);
    			append_dev(div27, t32);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, a2);
    			append_dev(a2, i5);
    			append_dev(div25, t33);
    			append_dev(div25, div24);
    			append_dev(div24, button3);
    			append_dev(div24, t35);
    			append_dev(div24, button4);
    			append_dev(div24, t37);
    			append_dev(div24, button5);
    			append_dev(div53, t39);
    			append_dev(div53, div37);
    			append_dev(div37, div36);
    			append_dev(div36, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div32);
    			append_dev(div32, i6);
    			append_dev(div34, t40);
    			append_dev(div36, t41);
    			append_dev(div36, div35);
    			mount_component(evoluciones, div35, null);
    			append_dev(div53, t42);
    			append_dev(div53, div52);
    			append_dev(div52, div41);
    			append_dev(div41, div40);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, i7);
    			append_dev(div40, t43);
    			append_dev(div52, t44);
    			append_dev(div52, div43);
    			append_dev(div43, div42);
    			mount_component(antecedente, div42, null);
    			append_dev(div43, t45);
    			append_dev(div43, a3);
    			append_dev(div52, t47);
    			append_dev(div52, div51);
    			append_dev(div51, div46);
    			append_dev(div46, div45);
    			append_dev(div45, div44);
    			append_dev(div44, i8);
    			append_dev(div46, t48);
    			append_dev(div51, t49);
    			append_dev(div51, div50);
    			append_dev(div50, div48);
    			append_dev(div48, input);
    			append_dev(div48, t50);
    			append_dev(div48, ul);
    			append_dev(ul, div47);
    			append_dev(div47, li0);
    			append_dev(li0, a4);
    			append_dev(div47, t52);
    			append_dev(div47, li1);
    			append_dev(li1, a5);
    			append_dev(ul, t54);
    			append_dev(ul, li2);
    			append_dev(li2, a6);
    			append_dev(a6, i9);
    			append_dev(a6, t55);
    			append_dev(div50, t56);
    			append_dev(div50, div49);
    			append_dev(div49, t57);
    			append_dev(div49, button6);
    			append_dev(button6, span0);
    			append_dev(section1, t59);
    			append_dev(section1, form1);
    			append_dev(form1, datos_paciente);
    			append_dev(datos_paciente, div107);
    			append_dev(div107, div106);
    			append_dev(div106, div105);
    			append_dev(div105, div56);
    			append_dev(div56, h51);
    			append_dev(div56, t61);
    			append_dev(div56, button7);
    			append_dev(button7, span1);
    			append_dev(div105, t63);
    			append_dev(div105, div98);
    			append_dev(div98, div61);
    			append_dev(div61, div58);
    			append_dev(div58, div57);
    			append_dev(div57, img);
    			append_dev(div61, t64);
    			append_dev(div61, h30);
    			append_dev(h30, a7);
    			append_dev(div61, t66);
    			append_dev(div61, div59);
    			append_dev(div61, t68);
    			append_dev(div61, div60);
    			append_dev(div60, span3);
    			append_dev(span3, t69);
    			append_dev(span3, span2);
    			append_dev(div98, t71);
    			append_dev(div98, hr0);
    			append_dev(div98, t72);
    			append_dev(div98, div88);
    			append_dev(div88, div63);
    			append_dev(div63, div62);
    			append_dev(div62, sapn);
    			append_dev(div62, t74);
    			append_dev(div62, strong0);
    			append_dev(div88, t76);
    			append_dev(div88, div65);
    			append_dev(div65, div64);
    			append_dev(div64, span4);
    			append_dev(div64, t78);
    			append_dev(div64, strong1);
    			append_dev(div88, t80);
    			append_dev(div88, div67);
    			append_dev(div67, div66);
    			append_dev(div66, span5);
    			append_dev(div66, t82);
    			append_dev(div66, strong2);
    			append_dev(div88, t84);
    			append_dev(div88, div69);
    			append_dev(div69, div68);
    			append_dev(div68, span6);
    			append_dev(div68, t86);
    			append_dev(div68, strong3);
    			append_dev(div88, t88);
    			append_dev(div88, div71);
    			append_dev(div71, div70);
    			append_dev(div70, span7);
    			append_dev(div70, t90);
    			append_dev(div70, strong4);
    			append_dev(div88, t92);
    			append_dev(div88, div73);
    			append_dev(div73, div72);
    			append_dev(div72, span8);
    			append_dev(div72, t94);
    			append_dev(div72, strong5);
    			append_dev(div88, t96);
    			append_dev(div88, div75);
    			append_dev(div75, div74);
    			append_dev(div74, span9);
    			append_dev(div74, t98);
    			append_dev(div74, strong6);
    			append_dev(div88, t100);
    			append_dev(div88, div77);
    			append_dev(div77, div76);
    			append_dev(div76, span10);
    			append_dev(div76, t102);
    			append_dev(div76, strong7);
    			append_dev(div88, t104);
    			append_dev(div88, div79);
    			append_dev(div79, div78);
    			append_dev(div78, span11);
    			append_dev(div78, t106);
    			append_dev(div78, strong8);
    			append_dev(div88, t108);
    			append_dev(div88, div81);
    			append_dev(div81, div80);
    			append_dev(div80, span12);
    			append_dev(div80, t110);
    			append_dev(div80, strong9);
    			append_dev(div88, t112);
    			append_dev(div88, div83);
    			append_dev(div83, div82);
    			append_dev(div82, span13);
    			append_dev(div82, t114);
    			append_dev(div82, strong10);
    			append_dev(div88, t116);
    			append_dev(div88, div85);
    			append_dev(div85, div84);
    			append_dev(div84, span14);
    			append_dev(div84, t118);
    			append_dev(div84, strong11);
    			append_dev(div88, t120);
    			append_dev(div88, div87);
    			append_dev(div87, div86);
    			append_dev(div86, span15);
    			append_dev(div86, t122);
    			append_dev(div86, strong12);
    			append_dev(div98, t124);
    			append_dev(div98, p1);
    			append_dev(p1, b);
    			append_dev(div98, t126);
    			append_dev(div98, hr1);
    			append_dev(div98, t127);
    			append_dev(div98, div97);
    			append_dev(div97, div90);
    			append_dev(div90, div89);
    			append_dev(div89, span16);
    			append_dev(div89, t129);
    			append_dev(div89, strong13);
    			append_dev(div97, t131);
    			append_dev(div97, div92);
    			append_dev(div92, div91);
    			append_dev(div91, span17);
    			append_dev(div91, t133);
    			append_dev(div91, strong14);
    			append_dev(div97, t135);
    			append_dev(div97, div94);
    			append_dev(div94, div93);
    			append_dev(div93, span18);
    			append_dev(div93, t137);
    			append_dev(div93, strong15);
    			append_dev(div97, t139);
    			append_dev(div97, div96);
    			append_dev(div96, div95);
    			append_dev(div95, span19);
    			append_dev(div95, t141);
    			append_dev(div95, strong16);
    			append_dev(div105, t143);
    			append_dev(div105, div104);
    			append_dev(div104, div103);
    			append_dev(div103, div100);
    			append_dev(div100, a8);
    			append_dev(a8, h31);
    			append_dev(a8, t144);
    			append_dev(a8, div99);
    			append_dev(div103, t146);
    			append_dev(div103, div102);
    			append_dev(div102, a9);
    			append_dev(a9, h32);
    			append_dev(a9, t147);
    			append_dev(a9, div101);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(cabeceraperfil.$$.fragment, local);
    			transition_in(ultimosvitales.$$.fragment, local);
    			transition_in(evoluciones.$$.fragment, local);
    			transition_in(antecedente.$$.fragment, local);

    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, { duration: 300 });
    					main_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(cabeceraperfil.$$.fragment, local);
    			transition_out(ultimosvitales.$$.fragment, local);
    			transition_out(evoluciones.$$.fragment, local);
    			transition_out(antecedente.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(cabeceraperfil);
    			destroy_component(ultimosvitales);
    			destroy_component(evoluciones);
    			destroy_component(antecedente);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PacientePerfil", slots, []);
    	let { params = "" } = $$props;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PacientePerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		Header,
    		Aside,
    		Evoluciones,
    		UltimosVitales,
    		Antecedente,
    		CabeceraPerfil,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params];
    }

    class PacientePerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacientePerfil",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get params() {
    		throw new Error("<PacientePerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<PacientePerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\Select2.svelte generated by Svelte v3.29.0 */
    const file$9 = "src\\componentes\\Select2.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (23:4) {#each datos as item}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*item*/ ctx[5].nombre + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*item*/ ctx[5].id;
    			option.value = option.__value;
    			add_location(option, file$9, 23, 8, 533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*datos*/ 2 && t_value !== (t_value = /*item*/ ctx[5].nombre + "")) set_data_dev(t, t_value);

    			if (dirty & /*datos*/ 2 && option_value_value !== (option_value_value = /*item*/ ctx[5].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(23:4) {#each datos as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let label_1;
    	let t0;
    	let t1;
    	let select;
    	let option;
    	let t2;
    	let t3;
    	let select_class_value;
    	let each_value = /*datos*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[3]);
    			t1 = space();
    			select = element("select");
    			option = element("option");
    			t2 = text(/*placeholder*/ ctx[2]);
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(label_1, "for", /*id*/ ctx[0]);
    			add_location(label_1, file$9, 15, 0, 334);
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$9, 21, 4, 455);
    			attr_dev(select, "class", select_class_value = `form-control ${/*id*/ ctx[0]}`);
    			set_style(select, "width", "100%");
    			attr_dev(select, "id", /*id*/ ctx[0]);
    			add_location(select, file$9, 16, 0, 367);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select, anchor);
    			append_dev(select, option);
    			append_dev(option, t2);
    			append_dev(option, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 8) set_data_dev(t0, /*label*/ ctx[3]);

    			if (dirty & /*id*/ 1) {
    				attr_dev(label_1, "for", /*id*/ ctx[0]);
    			}

    			if (dirty & /*placeholder*/ 4) set_data_dev(t2, /*placeholder*/ ctx[2]);

    			if (dirty & /*datos*/ 2) {
    				each_value = /*datos*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*id*/ 1 && select_class_value !== (select_class_value = `form-control ${/*id*/ ctx[0]}`)) {
    				attr_dev(select, "class", select_class_value);
    			}

    			if (dirty & /*id*/ 1) {
    				attr_dev(select, "id", /*id*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Select2", slots, []);
    	let { id } = $$props;
    	let { datos } = $$props;
    	let { valor } = $$props;
    	let { placeholder } = $$props;
    	let { label } = $$props;

    	onMount(() => {
    		jQuery(`#${id}`).select2({ placeholder: `${placeholder}` });

    		jQuery(`#${id}`).on("select2:select", e => {
    			$$invalidate(4, valor = e.params.data.id);
    		});
    	});

    	const writable_props = ["id", "datos", "valor", "placeholder", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Select2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("datos" in $$props) $$invalidate(1, datos = $$props.datos);
    		if ("valor" in $$props) $$invalidate(4, valor = $$props.valor);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		id,
    		datos,
    		valor,
    		placeholder,
    		label
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("datos" in $$props) $$invalidate(1, datos = $$props.datos);
    		if ("valor" in $$props) $$invalidate(4, valor = $$props.valor);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, datos, placeholder, label, valor];
    }

    class Select2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			id: 0,
    			datos: 1,
    			valor: 4,
    			placeholder: 2,
    			label: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select2",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<Select2> was created without expected prop 'id'");
    		}

    		if (/*datos*/ ctx[1] === undefined && !("datos" in props)) {
    			console.warn("<Select2> was created without expected prop 'datos'");
    		}

    		if (/*valor*/ ctx[4] === undefined && !("valor" in props)) {
    			console.warn("<Select2> was created without expected prop 'valor'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Select2> was created without expected prop 'placeholder'");
    		}

    		if (/*label*/ ctx[3] === undefined && !("label" in props)) {
    			console.warn("<Select2> was created without expected prop 'label'");
    		}
    	}

    	get id() {
    		throw new Error("<Select2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Select2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get datos() {
    		throw new Error("<Select2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set datos(value) {
    		throw new Error("<Select2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valor() {
    		throw new Error("<Select2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valor(value) {
    		throw new Error("<Select2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Select2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Select2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Pacientes\PacienteCrear.svelte generated by Svelte v3.29.0 */

    const { console: console_1$2 } = globals;
    const file$a = "src\\Pages\\Pacientes\\PacienteCrear.svelte";

    function create_fragment$b(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let section1;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t2;
    	let h3;
    	let t4;
    	let form;
    	let section0;
    	let div41;
    	let div40;
    	let div39;
    	let div38;
    	let div37;
    	let h50;
    	let t6;
    	let div9;
    	let div7;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div8;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let div12;
    	let div10;
    	let label2;
    	let t14;
    	let input2;
    	let t15;
    	let div11;
    	let label3;
    	let t17;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t21;
    	let div15;
    	let div13;
    	let label4;
    	let t23;
    	let input3;
    	let t24;
    	let div14;
    	let label5;
    	let t26;
    	let select1;
    	let option3;
    	let option4;
    	let option5;
    	let t30;
    	let div18;
    	let div16;
    	let label6;
    	let t32;
    	let input4;
    	let t33;
    	let div17;
    	let label7;
    	let t35;
    	let input5;
    	let t36;
    	let div21;
    	let div19;
    	let label8;
    	let t38;
    	let input6;
    	let t39;
    	let div20;
    	let label9;
    	let t41;
    	let input7;
    	let t42;
    	let div23;
    	let div22;
    	let label10;
    	let input8;
    	let t43;
    	let span0;
    	let t44;
    	let span1;
    	let t46;
    	let div27;
    	let h51;
    	let t48;
    	let hr0;
    	let t49;
    	let t50;
    	let t51;
    	let div26;
    	let div24;
    	let select2;
    	let updating_valor;
    	let t52;
    	let div25;
    	let label11;
    	let t54;
    	let input9;
    	let div27_class_value;
    	let t55;
    	let h52;
    	let t57;
    	let hr1;
    	let t58;
    	let div30;
    	let div28;
    	let label12;
    	let t60;
    	let select2_1;
    	let option6;
    	let t62;
    	let div29;
    	let label13;
    	let t64;
    	let select3;
    	let option7;
    	let t66;
    	let div33;
    	let div31;
    	let label14;
    	let t68;
    	let select4;
    	let option8;
    	let t70;
    	let div32;
    	let label15;
    	let t72;
    	let select5;
    	let option9;
    	let t74;
    	let div35;
    	let div34;
    	let label16;
    	let t76;
    	let input10;
    	let t77;
    	let div36;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

    	function select2_valor_binding(value) {
    		/*select2_valor_binding*/ ctx[4].call(null, value);
    	}

    	let select2_props = {
    		id: "sltAseguradoras",
    		datos: /*aseguradoras*/ ctx[1],
    		placeholder: " - seleccionar aseguradora - ",
    		label: "Aseguradora"
    	};

    	if (/*aseguradora*/ ctx[2] !== void 0) {
    		select2_props.valor = /*aseguradora*/ ctx[2];
    	}

    	select2 = new Select2({ props: select2_props, $$inline: true });
    	binding_callbacks.push(() => bind(select2, "valor", select2_valor_binding));

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			section1 = element("section");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Nuevo paciente";
    			t4 = space();
    			form = element("form");
    			section0 = element("section");
    			div41 = element("div");
    			div40 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			div37 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Datos personales";
    			t6 = space();
    			div9 = element("div");
    			div7 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nombre";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div8 = element("div");
    			label1 = element("label");
    			label1.textContent = "Apellidos";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div12 = element("div");
    			div10 = element("div");
    			label2 = element("label");
    			label2.textContent = "Apodo";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			div11 = element("div");
    			label3 = element("label");
    			label3.textContent = "Sexo";
    			t17 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "- seleccionar sexo - ";
    			option1 = element("option");
    			option1.textContent = "Masculino";
    			option2 = element("option");
    			option2.textContent = "Femenino";
    			t21 = space();
    			div15 = element("div");
    			div13 = element("div");
    			label4 = element("label");
    			label4.textContent = "Fecha de nacimiento";
    			t23 = space();
    			input3 = element("input");
    			t24 = space();
    			div14 = element("div");
    			label5 = element("label");
    			label5.textContent = "Tipo de documento";
    			t26 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "- seleccionar tipo - ";
    			option4 = element("option");
    			option4.textContent = "Cedula";
    			option5 = element("option");
    			option5.textContent = "Pasaporte";
    			t30 = space();
    			div18 = element("div");
    			div16 = element("div");
    			label6 = element("label");
    			label6.textContent = "No. Cedula / Pasaporte";
    			t32 = space();
    			input4 = element("input");
    			t33 = space();
    			div17 = element("div");
    			label7 = element("label");
    			label7.textContent = "Telefono";
    			t35 = space();
    			input5 = element("input");
    			t36 = space();
    			div21 = element("div");
    			div19 = element("div");
    			label8 = element("label");
    			label8.textContent = "Celular";
    			t38 = space();
    			input6 = element("input");
    			t39 = space();
    			div20 = element("div");
    			label9 = element("label");
    			label9.textContent = "Correo electronico";
    			t41 = space();
    			input7 = element("input");
    			t42 = space();
    			div23 = element("div");
    			div22 = element("div");
    			label10 = element("label");
    			input8 = element("input");
    			t43 = space();
    			span0 = element("span");
    			t44 = space();
    			span1 = element("span");
    			span1.textContent = "El paciente es asegurado";
    			t46 = space();
    			div27 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Informacion de seguro";
    			t48 = space();
    			hr0 = element("hr");
    			t49 = space();
    			t50 = text(/*aseguradora*/ ctx[2]);
    			t51 = space();
    			div26 = element("div");
    			div24 = element("div");
    			create_component(select2.$$.fragment);
    			t52 = space();
    			div25 = element("div");
    			label11 = element("label");
    			label11.textContent = "No. Afiliado";
    			t54 = space();
    			input9 = element("input");
    			t55 = space();
    			h52 = element("h5");
    			h52.textContent = "Direccion";
    			t57 = space();
    			hr1 = element("hr");
    			t58 = space();
    			div30 = element("div");
    			div28 = element("div");
    			label12 = element("label");
    			label12.textContent = "Ciudad";
    			t60 = space();
    			select2_1 = element("select");
    			option6 = element("option");
    			option6.textContent = "- seleccionar ciudad -";
    			t62 = space();
    			div29 = element("div");
    			label13 = element("label");
    			label13.textContent = "Provincia";
    			t64 = space();
    			select3 = element("select");
    			option7 = element("option");
    			option7.textContent = "- seleccionar provincia -";
    			t66 = space();
    			div33 = element("div");
    			div31 = element("div");
    			label14 = element("label");
    			label14.textContent = "Municipio";
    			t68 = space();
    			select4 = element("select");
    			option8 = element("option");
    			option8.textContent = "- seleccionar municipio -";
    			t70 = space();
    			div32 = element("div");
    			label15 = element("label");
    			label15.textContent = "Nacionalidad";
    			t72 = space();
    			select5 = element("select");
    			option9 = element("option");
    			option9.textContent = "- seleccionar nacionalidad -";
    			t74 = space();
    			div35 = element("div");
    			div34 = element("div");
    			label16 = element("label");
    			label16.textContent = "Direccion";
    			t76 = space();
    			input10 = element("input");
    			t77 = space();
    			div36 = element("div");
    			button = element("button");
    			button.textContent = "Guardar";
    			attr_dev(div0, "class", "avatar-title bg-info rounded-circle mdi mdi-account-circle-outline");
    			add_location(div0, file$a, 78, 28, 2513);
    			attr_dev(div1, "class", "avatar avatar-lg ");
    			add_location(div1, file$a, 77, 24, 2452);
    			attr_dev(div2, "class", "m-b-10");
    			add_location(div2, file$a, 76, 20, 2406);
    			add_location(h3, file$a, 81, 20, 2681);
    			attr_dev(div3, "class", "col-lg-8 text-center mx-auto text-white p-b-30");
    			add_location(div3, file$a, 75, 16, 2324);
    			attr_dev(div4, "class", "row p-b-60 p-t-60");
    			add_location(div4, file$a, 74, 12, 2275);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$a, 73, 8, 2238);
    			attr_dev(div6, "class", "bg-dark bg-dots m-b-30");
    			add_location(div6, file$a, 72, 4, 2192);
    			attr_dev(h50, "class", "");
    			add_location(h50, file$a, 93, 32, 3140);
    			attr_dev(label0, "for", "inpNombre");
    			add_location(label0, file$a, 96, 40, 3343);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "inpNombre");
    			attr_dev(input0, "placeholder", "John");
    			input0.required = true;
    			add_location(input0, file$a, 97, 40, 3422);
    			attr_dev(div7, "class", "form-group col-md-6");
    			add_location(div7, file$a, 95, 36, 3268);
    			attr_dev(label1, "for", "inpApellido");
    			add_location(label1, file$a, 106, 40, 3930);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "inpApellido");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Doe");
    			input1.required = true;
    			add_location(input1, file$a, 107, 40, 4014);
    			attr_dev(div8, "class", "form-group col-md-6");
    			add_location(div8, file$a, 105, 36, 3855);
    			attr_dev(div9, "class", "form-row");
    			add_location(div9, file$a, 94, 32, 3208);
    			attr_dev(label2, "for", "inpApodo");
    			add_location(label2, file$a, 118, 40, 4619);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "inpApodo");
    			input2.required = true;
    			add_location(input2, file$a, 119, 40, 4696);
    			attr_dev(div10, "class", "form-group col-md-6");
    			add_location(div10, file$a, 117, 36, 4544);
    			attr_dev(label3, "for", "sltSexo");
    			add_location(label3, file$a, 127, 40, 5139);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			option0.disabled = true;
    			add_location(option0, file$a, 133, 44, 5488);
    			option1.__value = "M";
    			option1.value = option1.__value;
    			add_location(option1, file$a, 134, 44, 5600);
    			option2.__value = "F";
    			option2.value = option2.__value;
    			add_location(option2, file$a, 135, 44, 5682);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltSexo");
    			select0.required = true;
    			add_location(select0, file$a, 128, 40, 5214);
    			attr_dev(div11, "class", "form-group col-md-6");
    			add_location(div11, file$a, 126, 36, 5064);
    			attr_dev(div12, "class", "form-row");
    			add_location(div12, file$a, 116, 32, 4484);
    			attr_dev(label4, "for", "inpFechaNacimiento");
    			add_location(label4, file$a, 141, 40, 6021);
    			attr_dev(input3, "type", "date");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "inpFechaNacimiento");
    			input3.required = true;
    			add_location(input3, file$a, 142, 40, 6122);
    			attr_dev(div13, "class", "form-group col-md-6");
    			add_location(div13, file$a, 140, 36, 5946);
    			attr_dev(label5, "for", "sltTipoDocumento");
    			add_location(label5, file$a, 150, 40, 6574);
    			option3.__value = "";
    			option3.value = option3.__value;
    			option3.selected = true;
    			option3.disabled = true;
    			add_location(option3, file$a, 156, 44, 6954);
    			option4.__value = "C";
    			option4.value = option4.__value;
    			add_location(option4, file$a, 157, 44, 7066);
    			option5.__value = "P";
    			option5.value = option5.__value;
    			add_location(option5, file$a, 158, 44, 7145);
    			attr_dev(select1, "class", "form-control");
    			attr_dev(select1, "id", "sltTipoDocumento");
    			select1.required = true;
    			add_location(select1, file$a, 151, 40, 6671);
    			attr_dev(div14, "class", "form-group col-md-6");
    			add_location(div14, file$a, 149, 36, 6499);
    			attr_dev(div15, "class", "form-row");
    			add_location(div15, file$a, 139, 32, 5886);
    			attr_dev(label6, "for", "inpNumeroDocumento");
    			add_location(label6, file$a, 164, 40, 7485);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "inpNumeroDocumento");
    			input4.required = true;
    			add_location(input4, file$a, 165, 40, 7589);
    			attr_dev(div16, "class", "form-group col-md-6");
    			add_location(div16, file$a, 163, 36, 7410);
    			attr_dev(label7, "for", "inpTelefono");
    			add_location(label7, file$a, 173, 40, 8045);
    			attr_dev(input5, "type", "tel");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "id", "inpTelefono");
    			add_location(input5, file$a, 174, 40, 8128);
    			attr_dev(div17, "class", "form-group col-md-6");
    			add_location(div17, file$a, 172, 36, 7970);
    			attr_dev(div18, "class", "form-row");
    			add_location(div18, file$a, 162, 32, 7350);
    			attr_dev(label8, "for", "inpCelular");
    			add_location(label8, file$a, 183, 40, 8615);
    			attr_dev(input6, "type", "tel");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "id", "inpCelular");
    			add_location(input6, file$a, 184, 40, 8696);
    			attr_dev(div19, "class", "form-group col-md-6");
    			add_location(div19, file$a, 182, 36, 8540);
    			attr_dev(label9, "for", "inpCorreo");
    			add_location(label9, file$a, 191, 40, 9086);
    			attr_dev(input7, "type", "email");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "id", "inpCorreo");
    			add_location(input7, file$a, 192, 40, 9177);
    			attr_dev(div20, "class", "form-group col-md-6");
    			add_location(div20, file$a, 190, 36, 9011);
    			attr_dev(div21, "class", "form-row");
    			add_location(div21, file$a, 181, 32, 8480);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "name", "option");
    			input8.__value = "1";
    			input8.value = input8.__value;
    			attr_dev(input8, "class", "cstm-switch-input");
    			add_location(input8, file$a, 202, 44, 9727);
    			attr_dev(span0, "class", "cstm-switch-indicator bg-success ");
    			add_location(span0, file$a, 203, 44, 9871);
    			attr_dev(span1, "class", "cstm-switch-description");
    			add_location(span1, file$a, 204, 44, 9972);
    			attr_dev(label10, "class", "cstm-switch");
    			add_location(label10, file$a, 201, 40, 9654);
    			attr_dev(div22, "class", " m-b-10");
    			add_location(div22, file$a, 200, 36, 9591);
    			attr_dev(div23, "class", "form-group");
    			add_location(div23, file$a, 199, 32, 9529);
    			add_location(h51, file$a, 209, 40, 10385);
    			add_location(hr0, file$a, 210, 40, 10457);
    			attr_dev(div24, "class", "form-group col-md-6");
    			add_location(div24, file$a, 213, 44, 10626);
    			attr_dev(label11, "for", "inpNoAfiliado");
    			add_location(label11, file$a, 223, 48, 11324);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "form-control");
    			attr_dev(input9, "id", "inpNoAfiliado");
    			add_location(input9, file$a, 224, 48, 11421);
    			attr_dev(div25, "class", "form-group col-md-6");
    			add_location(div25, file$a, 222, 44, 11241);
    			attr_dev(div26, "class", "form-row");
    			add_location(div26, file$a, 212, 40, 10558);

    			attr_dev(div27, "class", div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn");

    			add_location(div27, file$a, 208, 36, 10213);
    			attr_dev(h52, "class", "mt-3");
    			add_location(h52, file$a, 232, 32, 11870);
    			add_location(hr1, file$a, 233, 32, 11935);
    			attr_dev(label12, "for", "sltCiudad");
    			add_location(label12, file$a, 236, 40, 12108);
    			option6.__value = "";
    			option6.value = option6.__value;
    			option6.selected = true;
    			option6.disabled = true;
    			add_location(option6, file$a, 241, 44, 12409);
    			attr_dev(select2_1, "class", "form-control");
    			attr_dev(select2_1, "id", "sltCiudad");
    			add_location(select2_1, file$a, 237, 40, 12187);
    			attr_dev(div28, "class", "form-group col-md-6");
    			add_location(div28, file$a, 235, 36, 12033);
    			attr_dev(label13, "for", "sltProvincia");
    			add_location(label13, file$a, 245, 40, 12685);
    			option7.__value = "";
    			option7.value = option7.__value;
    			option7.selected = true;
    			option7.disabled = true;
    			add_location(option7, file$a, 250, 44, 12995);
    			attr_dev(select3, "class", "form-control");
    			attr_dev(select3, "id", "sltProvincia");
    			add_location(select3, file$a, 246, 40, 12770);
    			attr_dev(div29, "class", "form-group col-md-6");
    			add_location(div29, file$a, 244, 36, 12610);
    			attr_dev(div30, "class", "form-row");
    			add_location(div30, file$a, 234, 32, 11973);
    			attr_dev(label14, "for", "sltMunicipio");
    			add_location(label14, file$a, 256, 40, 13370);
    			option8.__value = "";
    			option8.value = option8.__value;
    			option8.selected = true;
    			option8.disabled = true;
    			add_location(option8, file$a, 261, 44, 13680);
    			attr_dev(select4, "class", "form-control");
    			attr_dev(select4, "id", "sltMunicipio");
    			add_location(select4, file$a, 257, 40, 13455);
    			attr_dev(div31, "class", "form-group col-md-6");
    			add_location(div31, file$a, 255, 36, 13295);
    			attr_dev(label15, "for", "sltNacionalidad");
    			add_location(label15, file$a, 265, 40, 13959);
    			option9.__value = "";
    			option9.value = option9.__value;
    			option9.selected = true;
    			option9.disabled = true;
    			add_location(option9, file$a, 270, 44, 14278);
    			attr_dev(select5, "class", "form-control");
    			attr_dev(select5, "id", "sltNacionalidad");
    			add_location(select5, file$a, 266, 40, 14050);
    			attr_dev(div32, "class", "form-group col-md-6");
    			add_location(div32, file$a, 264, 36, 13884);
    			attr_dev(div33, "class", "form-row");
    			add_location(div33, file$a, 254, 32, 13235);
    			attr_dev(label16, "for", "inpDireccion");
    			add_location(label16, file$a, 276, 40, 14657);
    			attr_dev(input10, "type", "text");
    			attr_dev(input10, "class", "form-control");
    			attr_dev(input10, "id", "inpDireccion");
    			add_location(input10, file$a, 277, 40, 14742);
    			attr_dev(div34, "class", "form-group col-md-12");
    			add_location(div34, file$a, 275, 36, 14581);
    			attr_dev(div35, "class", "form-row");
    			add_location(div35, file$a, 274, 32, 14521);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-success btn-cta");
    			add_location(button, file$a, 285, 36, 15158);
    			attr_dev(div36, "class", "text-right");
    			add_location(div36, file$a, 284, 32, 15096);
    			attr_dev(div37, "class", "card-body");
    			add_location(div37, file$a, 92, 27, 3083);
    			attr_dev(div38, "class", "card py-3 m-b-30");
    			add_location(div38, file$a, 91, 23, 3024);
    			attr_dev(div39, "class", "col-lg-8 mx-auto  mt-2");
    			add_location(div39, file$a, 90, 20, 2963);
    			attr_dev(div40, "class", "row ");
    			add_location(div40, file$a, 89, 16, 2923);
    			attr_dev(div41, "class", "container");
    			add_location(div41, file$a, 88, 12, 2882);
    			attr_dev(section0, "class", "pull-up");
    			add_location(section0, file$a, 87, 8, 2843);
    			add_location(form, file$a, 86, 4, 2782);
    			attr_dev(section1, "class", "admin-content ");
    			add_location(section1, file$a, 71, 2, 2154);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$a, 69, 0, 2111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, section1);
    			append_dev(section1, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, h3);
    			append_dev(section1, t4);
    			append_dev(section1, form);
    			append_dev(form, section0);
    			append_dev(section0, div41);
    			append_dev(div41, div40);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, div37);
    			append_dev(div37, h50);
    			append_dev(div37, t6);
    			append_dev(div37, div9);
    			append_dev(div9, div7);
    			append_dev(div7, label0);
    			append_dev(div7, t8);
    			append_dev(div7, input0);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, label1);
    			append_dev(div8, t11);
    			append_dev(div8, input1);
    			append_dev(div37, t12);
    			append_dev(div37, div12);
    			append_dev(div12, div10);
    			append_dev(div10, label2);
    			append_dev(div10, t14);
    			append_dev(div10, input2);
    			append_dev(div12, t15);
    			append_dev(div12, div11);
    			append_dev(div11, label3);
    			append_dev(div11, t17);
    			append_dev(div11, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(div37, t21);
    			append_dev(div37, div15);
    			append_dev(div15, div13);
    			append_dev(div13, label4);
    			append_dev(div13, t23);
    			append_dev(div13, input3);
    			append_dev(div15, t24);
    			append_dev(div15, div14);
    			append_dev(div14, label5);
    			append_dev(div14, t26);
    			append_dev(div14, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(div37, t30);
    			append_dev(div37, div18);
    			append_dev(div18, div16);
    			append_dev(div16, label6);
    			append_dev(div16, t32);
    			append_dev(div16, input4);
    			append_dev(div18, t33);
    			append_dev(div18, div17);
    			append_dev(div17, label7);
    			append_dev(div17, t35);
    			append_dev(div17, input5);
    			append_dev(div37, t36);
    			append_dev(div37, div21);
    			append_dev(div21, div19);
    			append_dev(div19, label8);
    			append_dev(div19, t38);
    			append_dev(div19, input6);
    			append_dev(div21, t39);
    			append_dev(div21, div20);
    			append_dev(div20, label9);
    			append_dev(div20, t41);
    			append_dev(div20, input7);
    			append_dev(div37, t42);
    			append_dev(div37, div23);
    			append_dev(div23, div22);
    			append_dev(div22, label10);
    			append_dev(label10, input8);
    			input8.checked = /*asegurado*/ ctx[0];
    			append_dev(label10, t43);
    			append_dev(label10, span0);
    			append_dev(label10, t44);
    			append_dev(label10, span1);
    			append_dev(div37, t46);
    			append_dev(div37, div27);
    			append_dev(div27, h51);
    			append_dev(div27, t48);
    			append_dev(div27, hr0);
    			append_dev(div27, t49);
    			append_dev(div27, t50);
    			append_dev(div27, t51);
    			append_dev(div27, div26);
    			append_dev(div26, div24);
    			mount_component(select2, div24, null);
    			append_dev(div26, t52);
    			append_dev(div26, div25);
    			append_dev(div25, label11);
    			append_dev(div25, t54);
    			append_dev(div25, input9);
    			append_dev(div37, t55);
    			append_dev(div37, h52);
    			append_dev(div37, t57);
    			append_dev(div37, hr1);
    			append_dev(div37, t58);
    			append_dev(div37, div30);
    			append_dev(div30, div28);
    			append_dev(div28, label12);
    			append_dev(div28, t60);
    			append_dev(div28, select2_1);
    			append_dev(select2_1, option6);
    			append_dev(div30, t62);
    			append_dev(div30, div29);
    			append_dev(div29, label13);
    			append_dev(div29, t64);
    			append_dev(div29, select3);
    			append_dev(select3, option7);
    			append_dev(div37, t66);
    			append_dev(div37, div33);
    			append_dev(div33, div31);
    			append_dev(div31, label14);
    			append_dev(div31, t68);
    			append_dev(div31, select4);
    			append_dev(select4, option8);
    			append_dev(div33, t70);
    			append_dev(div33, div32);
    			append_dev(div32, label15);
    			append_dev(div32, t72);
    			append_dev(div32, select5);
    			append_dev(select5, option9);
    			append_dev(div37, t74);
    			append_dev(div37, div35);
    			append_dev(div35, div34);
    			append_dev(div34, label16);
    			append_dev(div34, t76);
    			append_dev(div34, input10);
    			append_dev(div37, t77);
    			append_dev(div37, div36);
    			append_dev(div36, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[3]),
    					listen_dev(form, "submit", prevent_default(registrarPaciente), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*asegurado*/ 1) {
    				input8.checked = /*asegurado*/ ctx[0];
    			}

    			if (!current || dirty & /*aseguradora*/ 4) set_data_dev(t50, /*aseguradora*/ ctx[2]);
    			const select2_changes = {};
    			if (dirty & /*aseguradoras*/ 2) select2_changes.datos = /*aseguradoras*/ ctx[1];

    			if (!updating_valor && dirty & /*aseguradora*/ 4) {
    				updating_valor = true;
    				select2_changes.valor = /*aseguradora*/ ctx[2];
    				add_flush_callback(() => updating_valor = false);
    			}

    			select2.$set(select2_changes);

    			if (!current || dirty & /*asegurado*/ 1 && div27_class_value !== (div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn")) {
    				attr_dev(div27, "class", div27_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(select2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(select2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(select2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function registrarPaciente() {

    	console.log("Registrando paciente");
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PacienteCrear", slots, []);
    	let asegurado = false;
    	let aseguradoras = [];
    	let aseguradora = "";

    	function cargarAseguradoras() {
    		console.log("cargando aseguradoras");

    		const config = {
    			method: "get",
    			url: `${url}/Aseguradoras`
    		};

    		axios$1(config).then(res => {
    			$$invalidate(1, aseguradoras = res.data);
    			console.log(aseguradoras);
    		}).catch(err => {
    			console.error(err);
    		});
    	}

    	onMount(() => {
    		jQuery(".select-aseguradoras").select2({
    			placeholder: " - seleccionar aseguradora - "
    		});

    		jQuery(".select-aseguradoras").on("select2:select", e => {
    			console.log(e.params.data.id);
    		});

    		console.log("hola");
    		cargarAseguradoras();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<PacienteCrear> was created with unknown prop '${key}'`);
    	});

    	function input8_change_handler() {
    		asegurado = this.checked;
    		$$invalidate(0, asegurado);
    	}

    	function select2_valor_binding(value) {
    		aseguradora = value;
    		$$invalidate(2, aseguradora);
    	}

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		Header,
    		Aside,
    		Select2,
    		onMount,
    		url,
    		asegurado,
    		aseguradoras,
    		aseguradora,
    		registrarPaciente,
    		cargarAseguradoras
    	});

    	$$self.$inject_state = $$props => {
    		if ("asegurado" in $$props) $$invalidate(0, asegurado = $$props.asegurado);
    		if ("aseguradoras" in $$props) $$invalidate(1, aseguradoras = $$props.aseguradoras);
    		if ("aseguradora" in $$props) $$invalidate(2, aseguradora = $$props.aseguradora);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		asegurado,
    		aseguradoras,
    		aseguradora,
    		input8_change_handler,
    		select2_valor_binding
    	];
    }

    class PacienteCrear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacienteCrear",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const isAdmin = () => {
        const roles = ['admin', 'patient', 'assitent'];
        if(roles.includes('admin')){
            return true
        }else {
            return false
        }
    };

    const routes = {
        "/": wrap({
            component: Index,
            conditions: [
                async (detail) => {
                    if(isAdmin()){
                        return true
                    }else {
                        return push('/pacientes/crear')
                    }
                }
            ]
        }),
        "/pacientes": Index$1,
        "/pacientes/perfil/:id": PacientePerfil,
        "/pacientes/crear": PacienteCrear,
    };

    /* src\App.svelte generated by Svelte v3.29.0 */

    function create_fragment$c(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.getElementById("app"),
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
