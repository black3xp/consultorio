
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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

    const location$1 = derived(loc, $loc => $loc.location);
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
    		location: location$1,
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

    function e(e){this.message=e;}e.prototype=new Error,e.prototype.name="InvalidCharacterError";var r="undefined"!=typeof window&&window.atob&&window.atob.bind(window)||function(r){var t=String(r).replace(/=+$/,"");if(t.length%4==1)throw new e("'atob' failed: The string to be decoded is not correctly encoded.");for(var n,o,a=0,i=0,c="";o=t.charAt(i++);~o&&(n=a%4?64*n+o:o,a++%4)?c+=String.fromCharCode(255&n>>(-2*a&6)):0)o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(o);return c};function t(e){var t=e.replace(/-/g,"+").replace(/_/g,"/");switch(t.length%4){case 0:break;case 2:t+="==";break;case 3:t+="=";break;default:throw "Illegal base64url string!"}try{return function(e){return decodeURIComponent(r(e).replace(/(.)/g,(function(e,r){var t=r.charCodeAt(0).toString(16).toUpperCase();return t.length<2&&(t="0"+t),"%"+t})))}(t)}catch(e){return r(t)}}function n(e){this.message=e;}function o(e,r){if("string"!=typeof e)throw new n("Invalid token specified");var o=!0===(r=r||{}).header?0:1;try{return JSON.parse(t(e.split(".")[o]))}catch(e){throw new n("Invalid token specified: "+e.message)}}n.prototype=new Error,n.prototype.name="InvalidTokenError";

    // const url = 'https://xmconsulta.cthrics.com/api'
    // const url = 'http://localhost:3000/api'
    const url = 'http://localhost:1337/api';
    const isLogin = () => {
        if(localStorage.getItem('auth')){
            return true
        }
        else
        {
            return false
        }
    };

    const logout = () => { 
        localStorage.removeItem('auth');
        return push('/login')
    };

    const user = () => {
        const decoded = o(localStorage.getItem('auth'));
        return decoded;
    };

    const calcularEdad = (fecha) => {
        let hoy = new Date();
        let cumpleanos = new Date(fecha);
        let edad = hoy.getFullYear() - cumpleanos.getFullYear();
        let m = hoy.getMonth() - cumpleanos.getMonth();

        if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
          edad--;
        }

        return edad;
      };

      let ciudades = [
        {id: 'Distrito Nacional', nombre: 'Distrito Nacional'},
        {id: 'Santiago de los Caballeros', nombre: 'Santiago de los Caballeros'},
        {id: 'Santo Domingo Este', nombre: 'Santo Domingo Este'},
        {id: 'Santo Domingo Norte', nombre: 'Santo Domingo Norte'},
        {id: 'Santo Domingo Oeste', nombre: 'Santo Domingo Oeste'},
        {id: 'San Felipe de Puerto Plata', nombre: 'San Felipe de Puerto Plata'},
        {id: 'Higüey', nombre: 'Higüey'},
        {id: 'San Francisco de Macorís', nombre: 'San Francisco de Macorís'},
        {id: 'San Cristóbal', nombre: 'San Cristóbal'},
        {id: 'San Pedro de Macoris', nombre: 'San Pedro de Macoris'},
        {id: 'Los Alcarrizos', nombre: 'Los Alcarrizos'},
        {id: 'La Vega', nombre: 'La Vega'},
        {id: 'La Romana', nombre: 'La Romana'},
        {id: 'Moca', nombre: 'Moca'},
        {id: 'Villa Altagracia', nombre: 'Villa Altagracia'},
        {id: 'San Juan de La Maguana', nombre: 'San Juan de La Maguana'},
        {id: 'Haina', nombre: 'Haina'},
        {id: 'Bonao', nombre: 'Bonao'},
        {id: 'Cotuí', nombre: 'Cotuí'},
        {id: 'Baní', nombre: 'Baní'},
        {id: 'Santa Cruz de Barahona', nombre: 'Santa Cruz de Barahona'},
        {id: 'Azua de Compostela', nombre: 'Azua de Compostela'},
        {id: 'Boca Chica', nombre: 'Boca Chica'},
        {id: 'Villa hermosa', nombre: 'Villa hermosa'},
        {id: 'Mao', nombre: 'Mao'},
        {id: 'Pedro Brand', nombre: 'Pedro Brand'},
        {id: 'San Antonio de Guerra', nombre: 'San Antonio de Guerra'},
        {id: 'San Ignacio de Sabaneta', nombre: 'San Ignacio de Sabaneta'},
        {id: 'Santa Cruz del Seibo', nombre: 'Santa Cruz del Seibo'},
        {id: 'Tamboril', nombre: 'Tamboril'},
        {id: 'Nagua', nombre: 'Nagua'},
        {id: 'Puñal', nombre: 'Puñal'},
        {id: 'Hato', nombre: 'Hato'},
        {id: 'Esperanza', nombre: 'Esperanza'},
        {id: 'Sosúa', nombre: 'Sosúa'},
        {id: 'Jarabacoa', nombre: 'Jarabacoa'},
        {id: 'San José de las Matas', nombre: 'San José de las Matas'},
        {id: 'Yamasá', nombre: 'Yamasá'},
        {id: 'Monte Plata', nombre: 'Monte Plata'},
        {id: 'Villa González', nombre: 'Villa González'},
    ];

    let provincias = [
        {id: 'Santiago', nombre: 'Santiago'},
        {id: 'Puerto Plata', nombre: 'Puerto Plata'},
        {id: 'La Altagracia', nombre: 'La Altagracia'},
        {id: 'Duarte', nombre: 'Duarte'},
        {id: 'San Cristóbal', nombre: 'San Cristóbal'},
        {id: 'San pedro de Macoris', nombre: 'San pedro de Macoris'},
        {id: 'La vega', nombre: 'La vega'},
        {id: 'La Romana', nombre: 'La Romana'},
        {id: 'Espaillat', nombre: 'Espaillat'},
        {id: 'San Cristóbal', nombre: 'San Cristóbal'},
        {id: 'San Juan de La Maguana', nombre: 'San Juan de La Maguana'},
        {id: 'San Cristóbal', nombre: 'San Cristóbal'},
        {id: 'Monseñor Nouel', nombre: 'Monseñor Nouel'},
        {id: 'Sánchez Ramírez', nombre: 'Sánchez Ramírez'},
        {id: 'Peravia	', nombre: 'Peravia	'},
        {id: 'Barahona', nombre: 'Barahona'},
        {id: 'Azua', nombre: 'Azua'},
        {id: 'La Romana', nombre: 'La Romana'},
        {id: 'Valverde', nombre: 'Valverde'},
        {id: 'Santo Domingo', nombre: 'Santo Domingo'},
        {id: 'Santiago Rodríguez', nombre: 'Santiago Rodríguez'},
        {id: 'El Seibo', nombre: 'El Seibo'},
        {id: 'Santiago', nombre: 'Santiago'},
        {id: 'Maria Trinidad Sanchez', nombre: 'Maria Trinidad Sanchez'},
        {id: 'Santiago', nombre: 'Santiago'},
        {id: 'Mayor del Rey	Hato Mayor', nombre: 'Mayor del Rey	Hato Mayor'},
        {id: 'Valverde Mao', nombre: 'Valverde Mao'},
        {id: 'Puerto Plata', nombre: 'Puerto Plata'},
        {id: 'La vega', nombre: 'La vega'},
        {id: 'Santiago', nombre: 'Santiago'},
        {id: 'Monte plata	', nombre: 'Monte plata	'},
        {id: 'Monte Plata', nombre: 'Monte Plata'},
        {id: 'Santiago', nombre: 'Santiago'},
    ];
    let nacionalidades = [
        {id: 'afgano', nombre: 'afgano'},
        {id: 'alemán', nombre: 'alemán'},
        {id: 'árabe', nombre: 'árabe'},
        {id: 'argentino', nombre: 'argentino'},
        {id: 'australiano', nombre: 'australiano'},
        {id: 'belga', nombre: 'belga'},
        {id: 'boliviano', nombre: 'boliviano'},
        {id: 'brasileño', nombre: 'brasileño'},
        {id: 'camboyano', nombre: 'camboyano'},
        {id: 'canadiense', nombre: 'canadiense'},
        {id: 'chileno', nombre: 'chileno'},
        {id: 'chino', nombre: 'chino'},
        {id: 'colombiano', nombre: 'colombiano'},
        {id: 'coreano', nombre: 'coreano'},
        {id: 'costarricense', nombre: 'costarricense'},
        {id: 'cubano', nombre: 'cubano'},
        {id: 'danés', nombre: 'danés'},
        {id: 'ecuatoriano', nombre: 'ecuatoriano'},
        {id: 'egipcio', nombre: 'egipcio'},
        {id: 'salvadoreño', nombre: 'salvadoreño'},
        {id: 'escocés', nombre: 'escocés'},
        {id: 'español', nombre: 'español'},
        {id: 'estadounidense', nombre: 'estadounidense'},
        {id: 'estonio', nombre: 'estonio'},
        {id: 'etiope', nombre: 'etiope'},
        {id: 'filipino', nombre: 'filipino'},
        {id: 'finlandés', nombre: 'finlandés'},
        {id: 'francés', nombre: 'francés'},
        {id: 'galés', nombre: 'galés'},
        {id: 'griego', nombre: 'griego'},
        {id: 'guatemalteco', nombre: 'guatemalteco'},
        {id: 'haitiano', nombre: 'haitiano'},
        {id: 'holandés', nombre: 'holandés'},
        {id: 'hondureño', nombre: 'hondureño'},
        {id: 'indonés', nombre: 'indonés'},
        {id: 'inglés', nombre: 'inglés'},
        {id: 'iraquí', nombre: 'iraquí'},
        {id: 'iraní', nombre: 'iraní'},
        {id: 'irlandés', nombre: 'irlandés'},
        {id: 'israelí', nombre: 'israelí'},
        {id: 'italiano', nombre: 'italiano'},
        {id: 'japonés', nombre: 'japonés'},
        {id: 'jordano', nombre: 'jordano'},
        {id: 'laosiano', nombre: 'laosiano'},
        {id: 'letón', nombre: 'letón'},
        {id: 'letonés', nombre: 'letonés'},
        {id: 'malayo', nombre: 'malayo'},
        {id: 'marroquí', nombre: 'marroquí'},
        {id: 'mexicano', nombre: 'mexicano'},
        {id: 'nicaragüense', nombre: 'nicaragüense'},
        {id: 'noruego', nombre: 'noruego'},
        {id: 'neozelandés', nombre: 'neozelandés'},
        {id: 'panameño', nombre: 'panameño'},
        {id: 'paraguayo', nombre: 'paraguayo'},
        {id: 'peruano', nombre: 'peruano'},
        {id: 'polaco', nombre: 'polaco'},
        {id: 'portugués', nombre: 'portugués'},
        {id: 'puertorriqueño', nombre: 'puertorriqueño'},
        {id: 'dominicano', nombre: 'dominicano'},
        {id: 'rumano', nombre: 'rumano'},
        {id: 'ruso', nombre: 'ruso'},
        {id: 'sueco', nombre: 'sueco'},
        {id: 'suizo', nombre: 'suizo'},
        {id: 'tailandés', nombre: 'tailandés'},
        {id: 'taiwanes', nombre: 'taiwanes'},
        {id: 'turco', nombre: 'turco'},
        {id: 'ucraniano', nombre: 'ucraniano'},
        {id: 'uruguayo', nombre: 'uruguayo'},
        {id: 'venezolano', nombre: 'venezolano'},
        {id: 'vietnamita', nombre: 'vietnamita'},
    ];

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
    	let div12;
    	let t20;
    	let a10;
    	let i5;
    	let t21;
    	let mounted;
    	let dispose;

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
    			span2.textContent = `${user().name[0]}`;
    			t17 = space();
    			div13 = element("div");
    			a9 = element("a");
    			a9.textContent = "Reset Password";
    			t19 = space();
    			div12 = element("div");
    			t20 = space();
    			a10 = element("a");
    			i5 = element("i");
    			t21 = text(" Salir");
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "sidebar-toggle");
    			attr_dev(a0, "data-toggleclass", "sidebar-open");
    			attr_dev(a0, "data-target", "body");
    			add_location(a0, file, 4, 4, 105);
    			attr_dev(i0, "class", " mdi mdi-magnify mdi-24px align-middle");
    			add_location(i0, file, 21, 12, 526);
    			attr_dev(a1, "class", "nav-link ");
    			attr_dev(a1, "data-target", "#!siteSearchModal");
    			attr_dev(a1, "data-toggle", "modal");
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file, 16, 10, 377);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 15, 8, 344);
    			attr_dev(ul0, "class", "nav align-items-center");
    			add_location(ul0, file, 13, 6, 295);
    			attr_dev(nav0, "class", " mr-auto my-auto");
    			add_location(nav0, file, 12, 4, 257);
    			attr_dev(i1, "class", "mdi mdi-24px mdi-bell-outline");
    			add_location(i1, file, 37, 14, 975);
    			attr_dev(span0, "class", "notification-counter");
    			add_location(span0, file, 38, 14, 1034);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "data-toggle", "dropdown");
    			attr_dev(a2, "aria-haspopup", "true");
    			attr_dev(a2, "aria-expanded", "false");
    			add_location(a2, file, 31, 12, 788);
    			attr_dev(a3, "href", "#!");
    			attr_dev(a3, "class", "mdi mdi-18px mdi-settings text-muted");
    			add_location(a3, file, 45, 16, 1322);
    			attr_dev(span1, "class", "h5 m-0");
    			add_location(span1, file, 48, 16, 1448);
    			attr_dev(a4, "href", "#!");
    			attr_dev(a4, "class", "mdi mdi-18px mdi-notification-clear-all text-muted");
    			add_location(a4, file, 49, 16, 1507);
    			attr_dev(div0, "class", "d-flex p-all-15 bg-white justify-content-between\r\n                border-bottom ");
    			add_location(div0, file, 42, 14, 1193);
    			attr_dev(div1, "class", "text-overline m-b-5");
    			add_location(div1, file, 56, 16, 1771);
    			attr_dev(i2, "class", "mdi mdi-circle text-success");
    			add_location(i2, file, 60, 22, 1976);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file, 59, 20, 1929);
    			attr_dev(div3, "class", "card");
    			add_location(div3, file, 58, 18, 1889);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "d-block m-b-10");
    			add_location(a5, file, 57, 16, 1833);
    			attr_dev(i3, "class", "mdi mdi-upload-multiple ");
    			add_location(i3, file, 68, 22, 2302);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file, 67, 20, 2255);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file, 66, 18, 2215);
    			attr_dev(a6, "href", "#!");
    			attr_dev(a6, "class", "d-block m-b-10");
    			add_location(a6, file, 65, 16, 2159);
    			attr_dev(i4, "class", "mdi mdi-cancel text-danger");
    			add_location(i4, file, 76, 22, 2624);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file, 75, 20, 2577);
    			attr_dev(div7, "class", "card");
    			add_location(div7, file, 74, 18, 2537);
    			attr_dev(a7, "href", "#!");
    			attr_dev(a7, "class", "d-block m-b-10");
    			add_location(a7, file, 73, 16, 2481);
    			attr_dev(div8, "class", "notification-events bg-gray-300");
    			add_location(div8, file, 55, 14, 1708);
    			attr_dev(div9, "class", "dropdown-menu notification-container dropdown-menu-right");
    			add_location(div9, file, 41, 12, 1107);
    			attr_dev(div10, "class", "dropdown");
    			add_location(div10, file, 30, 10, 752);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 29, 8, 719);
    			attr_dev(span2, "class", "avatar-title rounded-circle bg-dark");
    			add_location(span2, file, 96, 14, 3206);
    			attr_dev(div11, "class", "avatar avatar-sm avatar-online");
    			add_location(div11, file, 95, 12, 3146);
    			attr_dev(a8, "class", "nav-link dropdown-toggle");
    			attr_dev(a8, "href", "#!");
    			attr_dev(a8, "role", "button");
    			attr_dev(a8, "data-toggle", "dropdown");
    			attr_dev(a8, "aria-haspopup", "true");
    			attr_dev(a8, "aria-expanded", "false");
    			add_location(a8, file, 88, 10, 2928);
    			attr_dev(a9, "class", "dropdown-item");
    			attr_dev(a9, "href", "#!");
    			add_location(a9, file, 101, 12, 3392);
    			attr_dev(div12, "class", "dropdown-divider");
    			add_location(div12, file, 102, 12, 3459);
    			attr_dev(i5, "class", "mdi mdi-power");
    			add_location(i5, file, 103, 92, 3585);
    			attr_dev(a10, "class", "dropdown-item text-danger");
    			attr_dev(a10, "href", "#!");
    			add_location(a10, file, 103, 12, 3505);
    			attr_dev(div13, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div13, file, 100, 10, 3331);
    			attr_dev(li2, "class", "nav-item dropdown ");
    			add_location(li2, file, 87, 8, 2885);
    			attr_dev(ul1, "class", "nav align-items-center");
    			add_location(ul1, file, 27, 6, 670);
    			attr_dev(nav1, "class", " ml-auto");
    			add_location(nav1, file, 26, 4, 640);
    			attr_dev(header, "class", "admin-header");
    			add_location(header, file, 3, 0, 70);
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
    			append_dev(div13, div12);
    			append_dev(div13, t20);
    			append_dev(div13, a10);
    			append_dev(a10, i5);
    			append_dev(a10, t21);

    			if (!mounted) {
    				dispose = listen_dev(a10, "click", prevent_default(logout), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ logout, user });
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
    let location$2;

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
            if (el.pattern.test(location$2)) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location$2 = value.location + (value.querystring ? '?' + value.querystring : '');

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

    // (72:8) {#if user().roles.includes('admin')}
    function create_if_block$1(ctx) {
    	let li2;
    	let a0;
    	let span3;
    	let span1;
    	let t0;
    	let span0;
    	let t1;
    	let span2;
    	let t3;
    	let span4;
    	let i0;
    	let t4;
    	let ul;
    	let li0;
    	let a1;
    	let span6;
    	let span5;
    	let t6;
    	let span7;
    	let i1;
    	let link_action;
    	let t8;
    	let li1;
    	let a2;
    	let span9;
    	let span8;
    	let t10;
    	let span10;
    	let i2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			a0 = element("a");
    			span3 = element("span");
    			span1 = element("span");
    			t0 = text("Mantenimiento\r\n                ");
    			span0 = element("span");
    			t1 = space();
    			span2 = element("span");
    			span2.textContent = "Ajustes consultorio";
    			t3 = space();
    			span4 = element("span");
    			i0 = element("i");
    			t4 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			span6 = element("span");
    			span5 = element("span");
    			span5.textContent = "Usuarios";
    			t6 = space();
    			span7 = element("span");
    			i1 = element("i");
    			i1.textContent = "U";
    			t8 = space();
    			li1 = element("li");
    			a2 = element("a");
    			span9 = element("span");
    			span8 = element("span");
    			span8.textContent = "Empresa";
    			t10 = space();
    			span10 = element("span");
    			i2 = element("i");
    			i2.textContent = "E";
    			attr_dev(span0, "class", "menu-arrow");
    			add_location(span0, file$1, 77, 16, 2902);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$1, 75, 14, 2829);
    			attr_dev(span2, "class", "menu-info");
    			add_location(span2, file$1, 79, 14, 2968);
    			attr_dev(span3, "class", "menu-label");
    			add_location(span3, file$1, 74, 12, 2788);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i0, file$1, 82, 14, 3093);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$1, 81, 12, 3053);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "open-dropdown menu-link");
    			add_location(a0, file$1, 73, 10, 2729);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$1, 90, 18, 3404);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$1, 89, 16, 3359);
    			attr_dev(i1, "class", "icon-placeholder ");
    			add_location(i1, file$1, 93, 18, 3530);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$1, 92, 16, 3486);
    			attr_dev(a1, "href", "/usuarios");
    			attr_dev(a1, "class", " menu-link");
    			add_location(a1, file$1, 88, 14, 3293);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$1, 87, 12, 3255);
    			attr_dev(span8, "class", "menu-name");
    			add_location(span8, file$1, 101, 18, 3779);
    			attr_dev(span9, "class", "menu-label");
    			add_location(span9, file$1, 100, 16, 3734);
    			attr_dev(i2, "class", "icon-placeholder ");
    			add_location(i2, file$1, 104, 18, 3904);
    			attr_dev(span10, "class", "menu-icon");
    			add_location(span10, file$1, 103, 16, 3860);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", " menu-link");
    			add_location(a2, file$1, 99, 14, 3684);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$1, 98, 12, 3646);
    			attr_dev(ul, "class", "sub-menu");
    			add_location(ul, file$1, 86, 10, 3220);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$1, 72, 8, 2695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li2, anchor);
    			append_dev(li2, a0);
    			append_dev(a0, span3);
    			append_dev(span3, span1);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span3, t1);
    			append_dev(span3, span2);
    			append_dev(a0, t3);
    			append_dev(a0, span4);
    			append_dev(span4, i0);
    			append_dev(li2, t4);
    			append_dev(li2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(a1, span6);
    			append_dev(span6, span5);
    			append_dev(a1, t6);
    			append_dev(a1, span7);
    			append_dev(span7, i1);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(a2, span9);
    			append_dev(span9, span8);
    			append_dev(a2, t10);
    			append_dev(a2, span10);
    			append_dev(span10, i2);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a1));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(72:8) {#if user().roles.includes('admin')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let aside;
    	let div1;
    	let span0;
    	let a0;
    	let link_action;
    	let t1;
    	let div0;
    	let a1;
    	let t2;
    	let a2;
    	let t3;
    	let div2;
    	let ul;
    	let li0;
    	let a3;
    	let span2;
    	let span1;
    	let t5;
    	let span4;
    	let span3;
    	let t7;
    	let i0;
    	let link_action_1;
    	let active_action;
    	let t8;
    	let li1;
    	let a4;
    	let span6;
    	let span5;
    	let t10;
    	let span7;
    	let i1;
    	let link_action_2;
    	let active_action_1;
    	let t11;
    	let li2;
    	let a5;
    	let span9;
    	let span8;
    	let t13;
    	let span10;
    	let i2;
    	let link_action_3;
    	let active_action_2;
    	let t14;
    	let show_if = user().roles.includes("admin");
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div1 = element("div");
    			span0 = element("span");
    			a0 = element("a");
    			a0.textContent = "xmedical pro";
    			t1 = space();
    			div0 = element("div");
    			a1 = element("a");
    			t2 = space();
    			a2 = element("a");
    			t3 = space();
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a3 = element("a");
    			span2 = element("span");
    			span1 = element("span");
    			span1.textContent = "Escritorio";
    			t5 = space();
    			span4 = element("span");
    			span3 = element("span");
    			span3.textContent = "1";
    			t7 = space();
    			i0 = element("i");
    			t8 = space();
    			li1 = element("li");
    			a4 = element("a");
    			span6 = element("span");
    			span5 = element("span");
    			span5.textContent = "Pacientes";
    			t10 = space();
    			span7 = element("span");
    			i1 = element("i");
    			t11 = space();
    			li2 = element("li");
    			a5 = element("a");
    			span9 = element("span");
    			span8 = element("span");
    			span8.textContent = "Consultas médicas";
    			t13 = space();
    			span10 = element("span");
    			i2 = element("i");
    			t14 = space();
    			if (if_block) if_block.c();
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$1, 12, 8, 333);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file$1, 11, 6, 289);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned");
    			add_location(a1, file$1, 17, 8, 489);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file$1, 21, 8, 662);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file$1, 15, 6, 429);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file$1, 9, 4, 210);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$1, 33, 14, 1092);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file$1, 32, 12, 1051);
    			attr_dev(span3, "class", "icon-badge badge-success badge badge-pill");
    			add_location(span3, file$1, 36, 14, 1208);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i0, file$1, 38, 14, 1292);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$1, 35, 12, 1168);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file$1, 31, 10, 998);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$1, 30, 8, 918);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$1, 48, 14, 1666);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$1, 47, 12, 1625);
    			attr_dev(i1, "class", "icon-placeholder mdi mdi-account-circle-outline");
    			add_location(i1, file$1, 52, 14, 1870);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$1, 50, 12, 1741);
    			attr_dev(a4, "href", "/pacientes");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file$1, 46, 10, 1563);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$1, 45, 8, 1474);
    			attr_dev(span8, "class", "menu-name");
    			add_location(span8, file$1, 61, 14, 2251);
    			attr_dev(span9, "class", "menu-label");
    			add_location(span9, file$1, 60, 12, 2210);
    			attr_dev(i2, "class", "icon-placeholder mdi mdi-square-edit-outline");
    			add_location(i2, file$1, 65, 14, 2463);
    			attr_dev(span10, "class", "menu-icon");
    			add_location(span10, file$1, 63, 12, 2334);
    			attr_dev(a5, "href", "/historias");
    			attr_dev(a5, "class", "menu-link");
    			add_location(a5, file$1, 59, 10, 2148);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$1, 58, 8, 2059);
    			attr_dev(ul, "class", "menu");
    			add_location(ul, file$1, 28, 6, 858);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file$1, 26, 4, 770);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file$1, 8, 2, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div1);
    			append_dev(div1, span0);
    			append_dev(span0, a0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, a1);
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			append_dev(aside, t3);
    			append_dev(aside, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a3);
    			append_dev(a3, span2);
    			append_dev(span2, span1);
    			append_dev(a3, t5);
    			append_dev(a3, span4);
    			append_dev(span4, span3);
    			append_dev(span4, t7);
    			append_dev(span4, i0);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(li1, a4);
    			append_dev(a4, span6);
    			append_dev(span6, span5);
    			append_dev(a4, t10);
    			append_dev(a4, span7);
    			append_dev(span7, i1);
    			append_dev(ul, t11);
    			append_dev(ul, li2);
    			append_dev(li2, a5);
    			append_dev(a5, span9);
    			append_dev(span9, span8);
    			append_dev(a5, t13);
    			append_dev(a5, span10);
    			append_dev(span10, i2);
    			append_dev(ul, t14);
    			if (if_block) if_block.m(ul, null);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active$1.call(null, li0, { path: "/", className: "active" })),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active$1.call(null, li1, { path: "/pacientes", className: "active" })),
    					action_destroyer(link_action_3 = link.call(null, a5)),
    					action_destroyer(active_action_2 = active$1.call(null, li2, { path: "/historias", className: "active" }))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			if (if_block) if_block.d();
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

    	$$self.$capture_state = () => ({ link, active: active$1, user });
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

    /* src\componentes\ErrorConexion.svelte generated by Svelte v3.29.0 */

    const file$2 = "src\\componentes\\ErrorConexion.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let button;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*msgError*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$2, 11, 12, 333);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "alert");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$2, 5, 19, 181);
    			attr_dev(div0, "class", "alert alert-danger alert-dismissible fade show");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$2, 4, 4, 87);
    			attr_dev(div1, "class", "alert-container");
    			add_location(div1, file$2, 3, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*msgError*/ 1) set_data_dev(t0, /*msgError*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	validate_slots("ErrorConexion", slots, []);
    	let { msgError = "" } = $$props;
    	const writable_props = ["msgError"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ErrorConexion> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("msgError" in $$props) $$invalidate(0, msgError = $$props.msgError);
    	};

    	$$self.$capture_state = () => ({ msgError });

    	$$self.$inject_state = $$props => {
    		if ("msgError" in $$props) $$invalidate(0, msgError = $$props.msgError);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [msgError];
    }

    class ErrorConexion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { msgError: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ErrorConexion",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get msgError() {
    		throw new Error("<ErrorConexion>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msgError(value) {
    		throw new Error("<ErrorConexion>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Home\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\Pages\\Home\\Index.svelte";

    // (69:2) {#if errorServer}
    function create_if_block_2(ctx) {
    	let errorconexion;
    	let updating_msgError;
    	let current;

    	function errorconexion_msgError_binding(value) {
    		/*errorconexion_msgError_binding*/ ctx[5].call(null, value);
    	}

    	let errorconexion_props = {};

    	if (/*msgError*/ ctx[4] !== void 0) {
    		errorconexion_props.msgError = /*msgError*/ ctx[4];
    	}

    	errorconexion = new ErrorConexion({
    			props: errorconexion_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(errorconexion, "msgError", errorconexion_msgError_binding));

    	const block = {
    		c: function create() {
    			create_component(errorconexion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errorconexion, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const errorconexion_changes = {};

    			if (!updating_msgError && dirty & /*msgError*/ 16) {
    				updating_msgError = true;
    				errorconexion_changes.msgError = /*msgError*/ ctx[4];
    				add_flush_callback(() => updating_msgError = false);
    			}

    			errorconexion.$set(errorconexion_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errorconexion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errorconexion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errorconexion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(69:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (80:10) {#if !cargandoResumen}
    function create_if_block_1(ctx) {
    	let div6;
    	let div5;
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div3;
    	let p0;
    	let t2;
    	let h10;
    	let t3;
    	let t4;
    	let div13;
    	let div12;
    	let div11;
    	let div9;
    	let div8;
    	let div7;
    	let i1;
    	let t5;
    	let div10;
    	let p1;
    	let t7;
    	let h11;
    	let t8;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "pacientes";
    			t2 = space();
    			h10 = element("h1");
    			t3 = text(/*numeroPacientes*/ ctx[0]);
    			t4 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			i1 = element("i");
    			t5 = space();
    			div10 = element("div");
    			p1 = element("p");
    			p1.textContent = "historias";
    			t7 = space();
    			h11 = element("h1");
    			t8 = text(/*numeroHistorias*/ ctx[1]);
    			attr_dev(i0, "class", "mdi mdi-account");
    			add_location(i0, file$3, 86, 25, 2457);
    			attr_dev(div0, "class", "avatar-title bg-soft-primary rounded-circle");
    			add_location(div0, file$3, 85, 23, 2373);
    			attr_dev(div1, "class", "avatar avatar-lg");
    			add_location(div1, file$3, 84, 21, 2318);
    			attr_dev(div2, "class", "pb-2");
    			add_location(div2, file$3, 83, 19, 2277);
    			attr_dev(p0, "class", "text-muted text-overline m-0");
    			add_location(p0, file$3, 91, 21, 2622);
    			attr_dev(h10, "class", "fw-400");
    			add_location(h10, file$3, 92, 21, 2698);
    			add_location(div3, file$3, 90, 19, 2594);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$3, 82, 17, 2233);
    			attr_dev(div5, "class", "card m-b-30");
    			add_location(div5, file$3, 81, 15, 2189);
    			attr_dev(div6, "class", "col-lg-3 col-md-6");
    			add_location(div6, file$3, 80, 13, 2141);
    			attr_dev(i1, "class", "mdi mdi-format-list-checks");
    			add_location(i1, file$3, 103, 25, 3166);
    			attr_dev(div7, "class", "avatar-title bg-soft-primary rounded-circle");
    			add_location(div7, file$3, 102, 23, 3082);
    			attr_dev(div8, "class", "avatar avatar-lg");
    			add_location(div8, file$3, 101, 21, 3027);
    			attr_dev(div9, "class", "pb-2");
    			add_location(div9, file$3, 100, 19, 2986);
    			attr_dev(p1, "class", "text-muted text-overline m-0");
    			add_location(p1, file$3, 108, 21, 3344);
    			attr_dev(h11, "class", "fw-400");
    			add_location(h11, file$3, 109, 21, 3420);
    			add_location(div10, file$3, 107, 19, 3316);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$3, 99, 17, 2942);
    			attr_dev(div12, "class", "card m-b-30");
    			add_location(div12, file$3, 98, 15, 2898);
    			attr_dev(div13, "class", "col-lg-3 col-md-6");
    			add_location(div13, file$3, 97, 13, 2850);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t2);
    			append_dev(div3, h10);
    			append_dev(h10, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, i1);
    			append_dev(div11, t5);
    			append_dev(div11, div10);
    			append_dev(div10, p1);
    			append_dev(div10, t7);
    			append_dev(div10, h11);
    			append_dev(h11, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numeroPacientes*/ 1) set_data_dev(t3, /*numeroPacientes*/ ctx[0]);
    			if (dirty & /*numeroHistorias*/ 2) set_data_dev(t8, /*numeroHistorias*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(80:10) {#if !cargandoResumen}",
    		ctx
    	});

    	return block;
    }

    // (118:10) {#if cargandoResumen}
    function create_if_block$2(ctx) {
    	let div6;
    	let div5;
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div3;
    	let p0;
    	let t2;
    	let h10;
    	let t3;
    	let t4;
    	let div13;
    	let div12;
    	let div11;
    	let div9;
    	let div8;
    	let div7;
    	let i1;
    	let t5;
    	let div10;
    	let p1;
    	let t7;
    	let h11;
    	let t8;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "pacientes";
    			t2 = space();
    			h10 = element("h1");
    			t3 = text(/*numeroPacientes*/ ctx[0]);
    			t4 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			i1 = element("i");
    			t5 = space();
    			div10 = element("div");
    			p1 = element("p");
    			p1.textContent = "pacientes";
    			t7 = space();
    			h11 = element("h1");
    			t8 = text(/*numeroPacientes*/ ctx[0]);
    			attr_dev(i0, "class", "mdi mdi-account");
    			add_location(i0, file$3, 124, 25, 3942);
    			attr_dev(div0, "class", "avatar-title bg-soft-primary rounded-circle");
    			add_location(div0, file$3, 123, 23, 3858);
    			attr_dev(div1, "class", "avatar avatar-lg");
    			add_location(div1, file$3, 122, 21, 3803);
    			attr_dev(div2, "class", "pb-2");
    			add_location(div2, file$3, 121, 19, 3762);
    			attr_dev(p0, "class", "text-muted text-overline m-0 font-flow");
    			add_location(p0, file$3, 129, 21, 4107);
    			attr_dev(h10, "class", "fw-400 font-flow");
    			add_location(h10, file$3, 130, 21, 4193);
    			add_location(div3, file$3, 128, 19, 4079);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$3, 120, 17, 3718);
    			attr_dev(div5, "class", "card m-b-30");
    			add_location(div5, file$3, 119, 15, 3674);
    			attr_dev(div6, "class", "col-lg-3 col-md-6");
    			add_location(div6, file$3, 118, 13, 3626);
    			attr_dev(i1, "class", "mdi mdi-format-list-checks");
    			add_location(i1, file$3, 141, 24, 4670);
    			attr_dev(div7, "class", "avatar-title bg-soft-primary rounded-circle");
    			add_location(div7, file$3, 140, 23, 4587);
    			attr_dev(div8, "class", "avatar avatar-lg");
    			add_location(div8, file$3, 139, 21, 4532);
    			attr_dev(div9, "class", "pb-2");
    			add_location(div9, file$3, 138, 19, 4491);
    			attr_dev(p1, "class", "text-muted text-overline m-0 font-flow");
    			add_location(p1, file$3, 146, 21, 4848);
    			attr_dev(h11, "class", "fw-400 font-flow");
    			add_location(h11, file$3, 147, 21, 4934);
    			add_location(div10, file$3, 145, 19, 4820);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$3, 137, 17, 4447);
    			attr_dev(div12, "class", "card m-b-30");
    			add_location(div12, file$3, 136, 15, 4403);
    			attr_dev(div13, "class", "col-lg-3 col-md-6");
    			add_location(div13, file$3, 135, 13, 4355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t2);
    			append_dev(div3, h10);
    			append_dev(h10, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, i1);
    			append_dev(div11, t5);
    			append_dev(div11, div10);
    			append_dev(div10, p1);
    			append_dev(div10, t7);
    			append_dev(div10, h11);
    			append_dev(h11, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numeroPacientes*/ 1) set_data_dev(t3, /*numeroPacientes*/ ctx[0]);
    			if (dirty & /*numeroPacientes*/ 1) set_data_dev(t8, /*numeroPacientes*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(118:10) {#if cargandoResumen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let div3;
    	let div2;
    	let h3;
    	let t6;
    	let div1;
    	let div0;
    	let h5;
    	let i;
    	let t7;
    	let t8;
    	let t9;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = !/*cargandoResumen*/ ctx[3] && create_if_block_1(ctx);
    	let if_block2 = /*cargandoResumen*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			h3 = element("h3");
    			h3.textContent = `Hola, ${user().name}!`;
    			t6 = space();
    			div1 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t7 = text(" Resumen");
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h3, "class", "mt-2 text-secondary");
    			add_location(h3, file$3, 74, 8, 1886);
    			attr_dev(i, "class", "mdi mdi-table");
    			add_location(i, file$3, 77, 16, 2034);
    			add_location(h5, file$3, 77, 12, 2030);
    			attr_dev(div0, "class", "col-12 m-b-20 m-t-20");
    			add_location(div0, file$3, 76, 10, 1982);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$3, 75, 8, 1953);
    			attr_dev(div2, "class", "col-12");
    			add_location(div2, file$3, 73, 6, 1856);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$3, 72, 4, 1831);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$3, 71, 2, 1794);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$3, 66, 0, 1674);
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
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h3);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h5);
    			append_dev(h5, i);
    			append_dev(h5, t7);
    			append_dev(div1, t8);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorServer*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*errorServer*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*cargandoResumen*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*cargandoResumen*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	let numeroPacientes = 0;
    	let numeroHistorias = 0;
    	let errorServer = false;
    	let cargandoResumen = false;
    	let msgError = "";

    	const contarPacientes = () => {
    		$$invalidate(3, cargandoResumen = true);

    		const confing = {
    			method: "get",
    			url: `${url}/pacientes`,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(confing).then(res => {
    			$$invalidate(3, cargandoResumen = false);
    			$$invalidate(0, numeroPacientes = res.data.length);
    		}).catch(error => {
    			$$invalidate(3, cargandoResumen = false);
    			$$invalidate(2, errorServer = true);
    			$$invalidate(4, msgError = "Ocurrió un error al conectarse con el servidor. Intente de nuevo o contacte al administrador!");
    			console.error(error);
    		});
    	};

    	const contarHistorias = () => {
    		$$invalidate(3, cargandoResumen = true);

    		const confing = {
    			method: "get",
    			url: `${url}/historias`,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(confing).then(res => {
    			$$invalidate(3, cargandoResumen = false);
    			$$invalidate(1, numeroHistorias = res.data.length);
    		}).catch(error => {
    			$$invalidate(3, cargandoResumen = false);
    			$$invalidate(2, errorServer = true);
    			console.error(error);
    		});
    	};

    	onMount(() => {
    		contarPacientes();
    		contarHistorias();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function errorconexion_msgError_binding(value) {
    		msgError = value;
    		$$invalidate(4, msgError);
    	}

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		onMount,
    		url,
    		user,
    		Header,
    		Aside,
    		ErrorConexion,
    		numeroPacientes,
    		numeroHistorias,
    		errorServer,
    		cargandoResumen,
    		msgError,
    		contarPacientes,
    		contarHistorias
    	});

    	$$self.$inject_state = $$props => {
    		if ("numeroPacientes" in $$props) $$invalidate(0, numeroPacientes = $$props.numeroPacientes);
    		if ("numeroHistorias" in $$props) $$invalidate(1, numeroHistorias = $$props.numeroHistorias);
    		if ("errorServer" in $$props) $$invalidate(2, errorServer = $$props.errorServer);
    		if ("cargandoResumen" in $$props) $$invalidate(3, cargandoResumen = $$props.cargandoResumen);
    		if ("msgError" in $$props) $$invalidate(4, msgError = $$props.msgError);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		numeroPacientes,
    		numeroHistorias,
    		errorServer,
    		cargandoResumen,
    		msgError,
    		errorconexion_msgError_binding
    	];
    }

    class Index extends SvelteComponentDev {
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

    /* src\Pages\Pacientes\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$2 } = globals;
    const file$4 = "src\\Pages\\Pacientes\\Index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (101:2) {#if errorServer}
    function create_if_block_1$1(ctx) {
    	let errorserver;
    	let current;

    	errorserver = new ErrorConexion({
    			props: {
    				msgError: "Ocurrio un error al contactar al servidor, vuelva a intentar o contacte al administrador"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(errorserver.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errorserver, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errorserver.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errorserver.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errorserver, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(101:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (140:20) {#if paciente.activo}
    function create_if_block$3(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let span;
    	let t0_value = /*paciente*/ ctx[9].nombres[0] + "";
    	let t0;
    	let t1_value = /*paciente*/ ctx[9].apellidos[0] + "";
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*paciente*/ ctx[9].nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*paciente*/ ctx[9].apellidos + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = calcularEdad(/*paciente*/ ctx[9].fechaNacimiento) + "";
    	let t7;
    	let t8;
    	let t9;
    	let td3;
    	let t10_value = /*paciente*/ ctx[9].sexo + "";
    	let t10;
    	let t11;
    	let td4;
    	let t12_value = /*paciente*/ ctx[9].celular + "";
    	let t12;
    	let t13;
    	let td5;
    	let t14_value = /*paciente*/ ctx[9].cedula + "";
    	let t14;
    	let t15;
    	let td6;
    	let a0;
    	let i0;
    	let t16;
    	let a1;
    	let i1;
    	let a1_href_value;
    	let link_action;
    	let t17;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*paciente*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			td2 = element("td");
    			t7 = text(t7_value);
    			t8 = text(" años");
    			t9 = space();
    			td3 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td4 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td5 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td6 = element("td");
    			a0 = element("a");
    			i0 = element("i");
    			t16 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t17 = space();
    			attr_dev(span, "class", "avatar-title rounded-circle ");
    			add_location(span, file$4, 143, 32, 4761);
    			attr_dev(div, "class", "avatar avatar-sm");
    			add_location(div, file$4, 142, 28, 4697);
    			add_location(td0, file$4, 141, 24, 4663);
    			add_location(td1, file$4, 146, 24, 4948);
    			add_location(td2, file$4, 147, 24, 5022);
    			add_location(td3, file$4, 148, 24, 5102);
    			add_location(td4, file$4, 149, 24, 5152);
    			add_location(td5, file$4, 150, 24, 5205);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$4, 159, 32, 5711);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$4, 153, 28, 5385);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$4, 167, 32, 6108);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[9].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Perfil");
    			add_location(a1, file$4, 161, 28, 5804);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$4, 151, 24, 5257);
    			add_location(tr, file$4, 140, 20, 4633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			append_dev(td1, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(td2, t7);
    			append_dev(td2, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td3);
    			append_dev(td3, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td4);
    			append_dev(td4, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td5);
    			append_dev(td5, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td6);
    			append_dev(td6, a0);
    			append_dev(a0, i0);
    			append_dev(td6, t16);
    			append_dev(td6, a1);
    			append_dev(a1, i1);
    			append_dev(tr, t17);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(click_handler), false, true, false),
    					action_destroyer(link_action = link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pacientes*/ 1 && t0_value !== (t0_value = /*paciente*/ ctx[9].nombres[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pacientes*/ 1 && t1_value !== (t1_value = /*paciente*/ ctx[9].apellidos[0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*pacientes*/ 1 && t3_value !== (t3_value = /*paciente*/ ctx[9].nombres + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*pacientes*/ 1 && t5_value !== (t5_value = /*paciente*/ ctx[9].apellidos + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*pacientes*/ 1 && t7_value !== (t7_value = calcularEdad(/*paciente*/ ctx[9].fechaNacimiento) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*pacientes*/ 1 && t10_value !== (t10_value = /*paciente*/ ctx[9].sexo + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*pacientes*/ 1 && t12_value !== (t12_value = /*paciente*/ ctx[9].celular + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*pacientes*/ 1 && t14_value !== (t14_value = /*paciente*/ ctx[9].cedula + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*pacientes*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[9].id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(140:20) {#if paciente.activo}",
    		ctx
    	});

    	return block;
    }

    // (139:16) {#each pacientes as paciente}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*paciente*/ ctx[9].activo && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*paciente*/ ctx[9].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(139:16) {#each pacientes as paciente}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let div9;
    	let div0;
    	let t3;
    	let div8;
    	let h5;
    	let t4;
    	let a;
    	let i;
    	let t5;
    	let link_action;
    	let t6;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let label;
    	let t8;
    	let input;
    	let t9;
    	let div7;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t10;
    	let th1;
    	let t12;
    	let th2;
    	let t14;
    	let th3;
    	let t16;
    	let th4;
    	let t18;
    	let th5;
    	let t20;
    	let th6;
    	let t21;
    	let tbody;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block = /*errorServer*/ ctx[1] && create_if_block_1$1(ctx);
    	let each_value = /*pacientes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			section = element("section");
    			div9 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div8 = element("div");
    			h5 = element("h5");
    			t4 = text("Pacientes ");
    			a = element("a");
    			i = element("i");
    			t5 = text(" CREAR");
    			t6 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Buscar pacientes";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div7 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t10 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre";
    			t12 = space();
    			th2 = element("th");
    			th2.textContent = "Edad";
    			t14 = space();
    			th3 = element("th");
    			th3.textContent = "Sexo";
    			t16 = space();
    			th4 = element("th");
    			th4.textContent = "Celular";
    			t18 = space();
    			th5 = element("th");
    			th5.textContent = "Cedula";
    			t20 = space();
    			th6 = element("th");
    			t21 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			add_location(div0, file$4, 107, 6, 3140);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$4, 109, 89, 3293);
    			attr_dev(a, "href", "/pacientes/crear");
    			attr_dev(a, "class", "btn btn-primary btn-sm");
    			add_location(a, file$4, 109, 22, 3226);
    			add_location(h5, file$4, 109, 8, 3212);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$4, 116, 36, 3658);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$4, 117, 36, 3740);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$4, 115, 32, 3596);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$4, 114, 28, 3540);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$4, 113, 24, 3493);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$4, 112, 20, 3447);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$4, 111, 12, 3408);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$4, 110, 8, 3346);
    			add_location(th0, file$4, 128, 20, 4225);
    			add_location(th1, file$4, 129, 20, 4256);
    			add_location(th2, file$4, 130, 20, 4293);
    			add_location(th3, file$4, 131, 20, 4328);
    			add_location(th4, file$4, 132, 20, 4363);
    			add_location(th5, file$4, 133, 20, 4401);
    			add_location(th6, file$4, 134, 20, 4438);
    			add_location(tr, file$4, 127, 16, 4199);
    			add_location(thead, file$4, 126, 16, 4174);
    			add_location(tbody, file$4, 137, 16, 4514);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$4, 125, 12, 4108);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$4, 124, 8, 4064);
    			attr_dev(div8, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div8, file$4, 108, 6, 3167);
    			attr_dev(div9, "class", "p-2");
    			add_location(div9, file$4, 106, 4, 3115);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$4, 105, 2, 3078);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$4, 98, 0, 2870);
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
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, section);
    			append_dev(section, div9);
    			append_dev(div9, div0);
    			append_dev(div9, t3);
    			append_dev(div9, div8);
    			append_dev(div8, h5);
    			append_dev(h5, t4);
    			append_dev(h5, a);
    			append_dev(a, i);
    			append_dev(a, t5);
    			append_dev(div8, t6);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t8);
    			append_dev(div1, input);
    			set_input_value(input, /*sltBuscarPacientes*/ ctx[2]);
    			append_dev(div8, t9);
    			append_dev(div8, div7);
    			append_dev(div7, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t10);
    			append_dev(tr, th1);
    			append_dev(tr, t12);
    			append_dev(tr, th2);
    			append_dev(tr, t14);
    			append_dev(tr, th3);
    			append_dev(tr, t16);
    			append_dev(tr, th4);
    			append_dev(tr, t18);
    			append_dev(tr, th5);
    			append_dev(tr, t20);
    			append_dev(tr, th6);
    			append_dev(table, t21);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a)),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*searchPacientes*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorServer*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*errorServer*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*sltBuscarPacientes*/ 4) {
    				set_input_value(input, /*sltBuscarPacientes*/ ctx[2]);
    			}

    			if (dirty & /*pacientes, eliminarPaciente, calcularEdad*/ 17) {
    				each_value = /*pacientes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Index", slots, []);
    	let pacientes = [];
    	let errorServer = false;
    	let sltBuscarPacientes = "";
    	let timeout = null;

    	const searchPacientes = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarPacientes();
    			},
    			300
    		);
    	};

    	const eliminarPaciente = id => {
    		Swal.fire({
    			title: "¿Esta seguro?",
    			text: "Eliminar al paciente es quitarlo de su lista, sin embargo la información no se perderá!",
    			icon: "warning",
    			showCancelButton: true,
    			confirmButtonColor: "#3085d6",
    			cancelButtonColor: "#d33",
    			confirmButtonText: "Si, Eliminar!",
    			cancelButtonText: "Cancelar"
    		}).then(result => {
    			if (result.isConfirmed) {
    				const config = {
    					method: "put",
    					url: `${url}/pacientes/eliminar/${id}`,
    					headers: {
    						"Authorization": `${localStorage.getItem("auth")}`
    					}
    				};

    				axios$1(config).then(res => {
    					console.log(res.data);
    					cargarPacientes();
    					Swal.fire("Eliminado!", "El paciente se ha eliminado correctamente.", "success");
    				}).catch(error => {
    					console.error(error);
    				});
    			}
    		});
    	};

    	function cargarPacientes() {
    		const config = {
    			method: "get",
    			url: `${url}/pacientes?b=${sltBuscarPacientes}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			axios$1(config).then(res => {
    				if (res.status === 200) {
    					let { data } = res;
    					$$invalidate(0, pacientes = data);
    				}

    				if (res.status === 500) {
    					$$invalidate(1, errorServer = true);
    				}
    			}).catch(err => {
    				console.error(err);

    				if (err) {
    					$$invalidate(1, errorServer = true);
    				}
    			});
    		} catch(error) {
    			if (error) {
    				$$invalidate(1, errorServer = true);
    			}
    		}
    	}

    	onMount(() => {
    		cargarPacientes();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		sltBuscarPacientes = this.value;
    		$$invalidate(2, sltBuscarPacientes);
    	}

    	const click_handler = paciente => eliminarPaciente(paciente.id);

    	$$self.$capture_state = () => ({
    		link,
    		onMount,
    		url,
    		calcularEdad,
    		axios: axios$1,
    		Header,
    		Aside,
    		ErrorServer: ErrorConexion,
    		pacientes,
    		errorServer,
    		sltBuscarPacientes,
    		timeout,
    		searchPacientes,
    		eliminarPaciente,
    		cargarPacientes
    	});

    	$$self.$inject_state = $$props => {
    		if ("pacientes" in $$props) $$invalidate(0, pacientes = $$props.pacientes);
    		if ("errorServer" in $$props) $$invalidate(1, errorServer = $$props.errorServer);
    		if ("sltBuscarPacientes" in $$props) $$invalidate(2, sltBuscarPacientes = $$props.sltBuscarPacientes);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pacientes,
    		errorServer,
    		sltBuscarPacientes,
    		searchPacientes,
    		eliminarPaciente,
    		input_input_handler,
    		click_handler
    	];
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$5.name
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
    const file$5 = "src\\componentes\\Evoluciones.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let span0;
    	let t0_value = /*nombre*/ ctx[4][0] + "";
    	let t0;
    	let t1_value = /*apellido*/ ctx[5][0] + "";
    	let t1;
    	let t2;
    	let div1;
    	let h6;
    	let span1;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let span2;
    	let t7;
    	let t8;
    	let a;
    	let i;
    	let t9;
    	let a_href_value;
    	let link_action;
    	let t10;
    	let small0;
    	let t12;
    	let p0;
    	let t13;
    	let t14;
    	let small1;
    	let t16;
    	let p1;
    	let t17;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			h6 = element("h6");
    			span1 = element("span");
    			t3 = text(/*nombre*/ ctx[4]);
    			t4 = space();
    			t5 = text(/*apellido*/ ctx[5]);
    			t6 = space();
    			span2 = element("span");
    			t7 = text(/*fechaHora*/ ctx[6]);
    			t8 = space();
    			a = element("a");
    			i = element("i");
    			t9 = text(" editar");
    			t10 = space();
    			small0 = element("small");
    			small0.textContent = "Motivo de Consulta";
    			t12 = space();
    			p0 = element("p");
    			t13 = text(/*motivo*/ ctx[0]);
    			t14 = space();
    			small1 = element("small");
    			small1.textContent = "Historia de la Enfermedad";
    			t16 = space();
    			p1 = element("p");
    			t17 = text(/*historia*/ ctx[1]);
    			attr_dev(span0, "class", "avatar-title rounded-circle");
    			add_location(span0, file$5, 25, 12, 637);
    			attr_dev(div0, "class", "avatar mr-3  avatar-sm");
    			add_location(div0, file$5, 24, 8, 587);
    			add_location(span1, file$5, 28, 35, 799);
    			attr_dev(i, "class", "fab fa-share-square");
    			add_location(i, file$5, 30, 164, 1063);
    			attr_dev(a, "href", a_href_value = `/pacientes/${/*idPaciente*/ ctx[3]}/historias/${/*id*/ ctx[2]}`);
    			attr_dev(a, "class", "btn btn-primary btn-sm text-white");
    			set_style(a, "position", "absolute");
    			set_style(a, "right", "20px");
    			add_location(a, file$5, 30, 20, 919);
    			attr_dev(span2, "class", "text-muted ml-3 small");
    			add_location(span2, file$5, 29, 16, 849);
    			attr_dev(h6, "class", "mt-0 mb-1");
    			add_location(h6, file$5, 28, 12, 776);
    			attr_dev(small0, "class", "mt-4 mb-4 text-primary");
    			add_location(small0, file$5, 33, 12, 1167);
    			attr_dev(p0, "data-bind", "text: atencionMedica.motivoConsulta");
    			add_location(p0, file$5, 34, 12, 1245);
    			attr_dev(small1, "class", "mt-4 mb-4 text-primary");
    			add_location(small1, file$5, 35, 12, 1322);
    			attr_dev(p1, "data-bind", "text: atencionMedica.historiaEnfermedad");
    			add_location(p1, file$5, 36, 12, 1407);
    			attr_dev(div1, "class", "media-body");
    			add_location(div1, file$5, 27, 8, 738);
    			attr_dev(div2, "class", "media");
    			add_location(div2, file$5, 23, 4, 558);
    			attr_dev(div3, "class", "list-unstyled");
    			add_location(div3, file$5, 22, 0, 525);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h6);
    			append_dev(h6, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(h6, t6);
    			append_dev(h6, span2);
    			append_dev(span2, t7);
    			append_dev(span2, t8);
    			append_dev(span2, a);
    			append_dev(a, i);
    			append_dev(a, t9);
    			append_dev(div1, t10);
    			append_dev(div1, small0);
    			append_dev(div1, t12);
    			append_dev(div1, p0);
    			append_dev(p0, t13);
    			append_dev(div1, t14);
    			append_dev(div1, small1);
    			append_dev(div1, t16);
    			append_dev(div1, p1);
    			append_dev(p1, t17);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nombre*/ 16 && t0_value !== (t0_value = /*nombre*/ ctx[4][0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*apellido*/ 32 && t1_value !== (t1_value = /*apellido*/ ctx[5][0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*nombre*/ 16) set_data_dev(t3, /*nombre*/ ctx[4]);
    			if (dirty & /*apellido*/ 32) set_data_dev(t5, /*apellido*/ ctx[5]);
    			if (dirty & /*fechaHora*/ 64) set_data_dev(t7, /*fechaHora*/ ctx[6]);

    			if (dirty & /*idPaciente, id*/ 12 && a_href_value !== (a_href_value = `/pacientes/${/*idPaciente*/ ctx[3]}/historias/${/*id*/ ctx[2]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*motivo*/ 1) set_data_dev(t13, /*motivo*/ ctx[0]);
    			if (dirty & /*historia*/ 2) set_data_dev(t17, /*historia*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
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
    	validate_slots("Evoluciones", slots, []);
    	let { motivo = "" } = $$props;
    	let { historia = "" } = $$props;
    	let { fecha = "" } = $$props;
    	let { id = "" } = $$props;
    	let { idPaciente = "" } = $$props;
    	let { usuario } = $$props;

    	onMount(() => {
    		
    	});

    	const writable_props = ["motivo", "historia", "fecha", "id", "idPaciente", "usuario"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Evoluciones> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("fecha" in $$props) $$invalidate(7, fecha = $$props.fecha);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("idPaciente" in $$props) $$invalidate(3, idPaciente = $$props.idPaciente);
    		if ("usuario" in $$props) $$invalidate(8, usuario = $$props.usuario);
    	};

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		onMount,
    		link,
    		user,
    		url,
    		motivo,
    		historia,
    		fecha,
    		id,
    		idPaciente,
    		usuario,
    		nombre,
    		apellido,
    		fechaHora
    	});

    	$$self.$inject_state = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("fecha" in $$props) $$invalidate(7, fecha = $$props.fecha);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("idPaciente" in $$props) $$invalidate(3, idPaciente = $$props.idPaciente);
    		if ("usuario" in $$props) $$invalidate(8, usuario = $$props.usuario);
    		if ("nombre" in $$props) $$invalidate(4, nombre = $$props.nombre);
    		if ("apellido" in $$props) $$invalidate(5, apellido = $$props.apellido);
    		if ("fechaHora" in $$props) $$invalidate(6, fechaHora = $$props.fechaHora);
    	};

    	let nombre;
    	let apellido;
    	let fechaHora;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*usuario*/ 256) {
    			 $$invalidate(4, nombre = usuario.nombre);
    		}

    		if ($$self.$$.dirty & /*usuario*/ 256) {
    			 $$invalidate(5, apellido = usuario.apellido);
    		}

    		if ($$self.$$.dirty & /*fecha*/ 128) {
    			 $$invalidate(6, fechaHora = new Date(fecha).toLocaleString("es-DO"));
    		}
    	};

    	return [motivo, historia, id, idPaciente, nombre, apellido, fechaHora, fecha, usuario];
    }

    class Evoluciones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			motivo: 0,
    			historia: 1,
    			fecha: 7,
    			id: 2,
    			idPaciente: 3,
    			usuario: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Evoluciones",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*usuario*/ ctx[8] === undefined && !("usuario" in props)) {
    			console.warn("<Evoluciones> was created without expected prop 'usuario'");
    		}
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

    	get fecha() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fecha(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get idPaciente() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idPaciente(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get usuario() {
    		throw new Error("<Evoluciones>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set usuario(value) {
    		throw new Error("<Evoluciones>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\UltimosVitales.svelte generated by Svelte v3.29.0 */

    const file$6 = "src\\componentes\\UltimosVitales.svelte";

    function create_fragment$7(ctx) {
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
    	let t14;
    	let div11;
    	let div9;
    	let i3;
    	let t15;
    	let t16;
    	let div10;
    	let p1;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let div14;
    	let div12;
    	let i4;
    	let t21;
    	let t22;
    	let div13;
    	let p2;
    	let t23;
    	let t24;
    	let div17;
    	let div15;
    	let i5;
    	let t25;
    	let t26;
    	let div16;
    	let p3;
    	let t27;
    	let t28;
    	let div20;
    	let div18;
    	let i6;
    	let t29;
    	let t30;
    	let div19;
    	let p4;
    	let t31;

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
    			t12 = space();
    			t13 = text(/*tipoPeso*/ ctx[5]);
    			t14 = space();
    			div11 = element("div");
    			div9 = element("div");
    			i3 = element("i");
    			t15 = text(" Temperatura");
    			t16 = space();
    			div10 = element("div");
    			p1 = element("p");
    			t17 = text(/*temperatura*/ ctx[1]);
    			t18 = text(" °");
    			t19 = text(/*tipoTemperatura*/ ctx[6]);
    			t20 = space();
    			div14 = element("div");
    			div12 = element("div");
    			i4 = element("i");
    			t21 = text(" Frecuencia Respiratoria");
    			t22 = space();
    			div13 = element("div");
    			p2 = element("p");
    			t23 = text(/*frecuenciaRespiratoria*/ ctx[2]);
    			t24 = space();
    			div17 = element("div");
    			div15 = element("div");
    			i5 = element("i");
    			t25 = text(" Frecuencia Cardiaca");
    			t26 = space();
    			div16 = element("div");
    			p3 = element("p");
    			t27 = text(/*frecuenciaCardiaca*/ ctx[3]);
    			t28 = space();
    			div20 = element("div");
    			div18 = element("div");
    			i6 = element("i");
    			t29 = text(" Presion Alterial (mmHg)");
    			t30 = space();
    			div19 = element("div");
    			p4 = element("p");
    			t31 = text(/*presionAlterial*/ ctx[4]);
    			attr_dev(i0, "class", "mdi mdi-account-heart mdi-18px");
    			add_location(i0, file$6, 13, 10, 445);
    			attr_dev(div0, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div0, file$6, 12, 8, 384);
    			attr_dev(div1, "class", "avatar mr-2 avatar-xs");
    			add_location(div1, file$6, 11, 6, 339);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$6, 10, 4, 306);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$6, 20, 87, 714);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$6, 20, 8, 635);
    			attr_dev(button0, "class", "dropdown-item");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$6, 24, 10, 846);
    			attr_dev(button1, "class", "dropdown-item");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$6, 25, 10, 917);
    			attr_dev(button2, "class", "dropdown-item");
    			attr_dev(button2, "type", "button");
    			add_location(button2, file$6, 26, 10, 996);
    			attr_dev(div3, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div3, file$6, 23, 8, 787);
    			attr_dev(div4, "class", "dropdown");
    			add_location(div4, file$6, 19, 6, 603);
    			attr_dev(div5, "class", "card-controls");
    			add_location(div5, file$6, 18, 4, 568);
    			attr_dev(i2, "class", "mdi mdi-speedometer mdi-18px");
    			add_location(i2, file$6, 36, 12, 1330);
    			attr_dev(div6, "class", "col-lg-9 col-sm-10");
    			add_location(div6, file$6, 35, 10, 1284);
    			add_location(p0, file$6, 39, 12, 1454);
    			attr_dev(div7, "class", "col-lg-3 col-sm-2");
    			add_location(div7, file$6, 38, 10, 1409);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$6, 34, 8, 1255);
    			attr_dev(i3, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i3, file$6, 45, 12, 1599);
    			attr_dev(div9, "class", "col-lg-9 col-sm-10");
    			add_location(div9, file$6, 44, 10, 1553);
    			add_location(p1, file$6, 48, 12, 1730);
    			attr_dev(div10, "class", "col-lg-3 col-sm-2");
    			add_location(div10, file$6, 47, 10, 1685);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$6, 43, 8, 1524);
    			attr_dev(i4, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i4, file$6, 53, 12, 1888);
    			attr_dev(div12, "class", "col-lg-9 col-sm-10");
    			add_location(div12, file$6, 52, 10, 1842);
    			attr_dev(p2, "data-bind", "text: frecuenciaRespiratoria");
    			add_location(p2, file$6, 56, 12, 2030);
    			attr_dev(div13, "class", "col-lg-3 col-sm-2");
    			add_location(div13, file$6, 55, 10, 1985);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$6, 51, 8, 1813);
    			attr_dev(i5, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i5, file$6, 61, 12, 2221);
    			attr_dev(div15, "class", "col-lg-9 col-sm-10");
    			add_location(div15, file$6, 60, 10, 2175);
    			attr_dev(p3, "data-bind", "text: frecuenciaCardiaca");
    			add_location(p3, file$6, 64, 12, 2360);
    			attr_dev(div16, "class", "col-lg-3 col-sm-2");
    			add_location(div16, file$6, 63, 10, 2315);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$6, 59, 8, 2146);
    			attr_dev(i6, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i6, file$6, 69, 12, 2543);
    			attr_dev(div18, "class", "col-lg-9 col-sm-10");
    			add_location(div18, file$6, 68, 10, 2497);
    			attr_dev(p4, "data-bind", "text: tensionArterialSistolica +'/' + tensionArterialDiastolica");
    			add_location(p4, file$6, 72, 12, 2686);
    			attr_dev(div19, "class", "col-lg-3 col-sm-2");
    			add_location(div19, file$6, 71, 10, 2641);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$6, 67, 8, 2468);
    			attr_dev(div21, "class", "list-group-item ");
    			add_location(div21, file$6, 32, 6, 1213);
    			attr_dev(div22, "class", "list-group list  list-group-flush");
    			attr_dev(div22, "data-bind", "using: ultimosSignosVitales");
    			add_location(div22, file$6, 30, 4, 1116);
    			attr_dev(div23, "class", "card m-b-30");
    			add_location(div23, file$6, 9, 0, 275);
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
    			append_dev(p0, t13);
    			append_dev(div21, t14);
    			append_dev(div21, div11);
    			append_dev(div11, div9);
    			append_dev(div9, i3);
    			append_dev(div9, t15);
    			append_dev(div11, t16);
    			append_dev(div11, div10);
    			append_dev(div10, p1);
    			append_dev(p1, t17);
    			append_dev(p1, t18);
    			append_dev(p1, t19);
    			append_dev(div21, t20);
    			append_dev(div21, div14);
    			append_dev(div14, div12);
    			append_dev(div12, i4);
    			append_dev(div12, t21);
    			append_dev(div14, t22);
    			append_dev(div14, div13);
    			append_dev(div13, p2);
    			append_dev(p2, t23);
    			append_dev(div21, t24);
    			append_dev(div21, div17);
    			append_dev(div17, div15);
    			append_dev(div15, i5);
    			append_dev(div15, t25);
    			append_dev(div17, t26);
    			append_dev(div17, div16);
    			append_dev(div16, p3);
    			append_dev(p3, t27);
    			append_dev(div21, t28);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, i6);
    			append_dev(div18, t29);
    			append_dev(div20, t30);
    			append_dev(div20, div19);
    			append_dev(div19, p4);
    			append_dev(p4, t31);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*peso*/ 1) set_data_dev(t11, /*peso*/ ctx[0]);
    			if (dirty & /*tipoPeso*/ 32) set_data_dev(t13, /*tipoPeso*/ ctx[5]);
    			if (dirty & /*temperatura*/ 2) set_data_dev(t17, /*temperatura*/ ctx[1]);
    			if (dirty & /*tipoTemperatura*/ 64) set_data_dev(t19, /*tipoTemperatura*/ ctx[6]);
    			if (dirty & /*frecuenciaRespiratoria*/ 4) set_data_dev(t23, /*frecuenciaRespiratoria*/ ctx[2]);
    			if (dirty & /*frecuenciaCardiaca*/ 8) set_data_dev(t27, /*frecuenciaCardiaca*/ ctx[3]);
    			if (dirty & /*presionAlterial*/ 16) set_data_dev(t31, /*presionAlterial*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div23);
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
    	validate_slots("UltimosVitales", slots, []);
    	let { peso = "" } = $$props;
    	let { temperatura = "" } = $$props;
    	let { frecuenciaRespiratoria = "" } = $$props;
    	let { frecuenciaCardiaca = "" } = $$props;
    	let { presionAlterial = "" } = $$props;
    	let { tipoPeso = "" } = $$props;
    	let { tipoTemperatura = "" } = $$props;

    	const writable_props = [
    		"peso",
    		"temperatura",
    		"frecuenciaRespiratoria",
    		"frecuenciaCardiaca",
    		"presionAlterial",
    		"tipoPeso",
    		"tipoTemperatura"
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
    		if ("tipoPeso" in $$props) $$invalidate(5, tipoPeso = $$props.tipoPeso);
    		if ("tipoTemperatura" in $$props) $$invalidate(6, tipoTemperatura = $$props.tipoTemperatura);
    	};

    	$$self.$capture_state = () => ({
    		peso,
    		temperatura,
    		frecuenciaRespiratoria,
    		frecuenciaCardiaca,
    		presionAlterial,
    		tipoPeso,
    		tipoTemperatura
    	});

    	$$self.$inject_state = $$props => {
    		if ("peso" in $$props) $$invalidate(0, peso = $$props.peso);
    		if ("temperatura" in $$props) $$invalidate(1, temperatura = $$props.temperatura);
    		if ("frecuenciaRespiratoria" in $$props) $$invalidate(2, frecuenciaRespiratoria = $$props.frecuenciaRespiratoria);
    		if ("frecuenciaCardiaca" in $$props) $$invalidate(3, frecuenciaCardiaca = $$props.frecuenciaCardiaca);
    		if ("presionAlterial" in $$props) $$invalidate(4, presionAlterial = $$props.presionAlterial);
    		if ("tipoPeso" in $$props) $$invalidate(5, tipoPeso = $$props.tipoPeso);
    		if ("tipoTemperatura" in $$props) $$invalidate(6, tipoTemperatura = $$props.tipoTemperatura);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		peso,
    		temperatura,
    		frecuenciaRespiratoria,
    		frecuenciaCardiaca,
    		presionAlterial,
    		tipoPeso,
    		tipoTemperatura
    	];
    }

    class UltimosVitales extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			peso: 0,
    			temperatura: 1,
    			frecuenciaRespiratoria: 2,
    			frecuenciaCardiaca: 3,
    			presionAlterial: 4,
    			tipoPeso: 5,
    			tipoTemperatura: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UltimosVitales",
    			options,
    			id: create_fragment$7.name
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

    	get tipoPeso() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tipoPeso(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tipoTemperatura() {
    		throw new Error("<UltimosVitales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tipoTemperatura(value) {
    		throw new Error("<UltimosVitales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\Loading.svelte generated by Svelte v3.29.0 */

    const file$7 = "src\\componentes\\Loading.svelte";

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "svelte-44tycx");
    			add_location(div0, file$7, 1, 4, 30);
    			attr_dev(div1, "class", "svelte-44tycx");
    			add_location(div1, file$7, 2, 4, 43);
    			attr_dev(div2, "class", "lds-ripple svelte-44tycx");
    			add_location(div2, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots("Loading", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\componentes\CabeceraPerfil.svelte generated by Svelte v3.29.0 */

    const { console: console_1$3 } = globals;
    const file$8 = "src\\componentes\\CabeceraPerfil.svelte";

    function create_fragment$9(ctx) {
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div4;
    	let div3;
    	let div0;
    	let span0;
    	let t0_value = `${/*nombres*/ ctx[0][0]}${/*apellidos*/ ctx[1][0]}` + "";
    	let t0;
    	let t1;
    	let div2;
    	let h5;
    	let span1;
    	let t2_value = `${/*nombres*/ ctx[0]} ${/*apellidos*/ ctx[1]}` + "";
    	let t2;
    	let t3;
    	let a;
    	let i0;
    	let t4;
    	let t5;
    	let div1;
    	let span2;
    	let t6;
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10;
    	let t11;
    	let div6;
    	let div5;
    	let button;
    	let i1;
    	let t12;
    	let mounted;
    	let dispose;

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
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			a = element("a");
    			i0 = element("i");
    			t4 = text(" Ver datos personales");
    			t5 = space();
    			div1 = element("div");
    			span2 = element("span");
    			t6 = text(/*edad*/ ctx[3]);
    			t7 = text(" años");
    			t8 = text(" | ");
    			span3 = element("span");
    			t9 = text("No. Cedula: ");
    			t10 = text(/*cedula*/ ctx[2]);
    			t11 = space();
    			div6 = element("div");
    			div5 = element("div");
    			button = element("button");
    			i1 = element("i");
    			t12 = text("\r\n                Iniciar nueva atención");
    			attr_dev(span0, "class", "avatar-title rounded-circle");
    			add_location(span0, file$8, 52, 16, 1483);
    			attr_dev(div0, "class", "avatar mr-3  avatar-xl");
    			add_location(div0, file$8, 51, 14, 1429);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$8, 56, 18, 1689);
    			attr_dev(i0, "class", "mdi mdi-comment-eye");
    			add_location(i0, file$8, 59, 20, 1944);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "btn ml-2 btn-primary btn-sm");
    			attr_dev(a, "data-toggle", "modal");
    			attr_dev(a, "data-target", "#modalDatosPersonales");
    			add_location(a, file$8, 57, 18, 1797);
    			attr_dev(h5, "class", "mt-0");
    			add_location(h5, file$8, 55, 16, 1651);
    			attr_dev(span2, "data-bind", "text: paciente().edad");
    			add_location(span2, file$8, 62, 40, 2089);
    			attr_dev(span3, "data-bind", "text: paciente().cedula");
    			add_location(span3, file$8, 62, 101, 2150);
    			attr_dev(div1, "class", "opacity-75");
    			add_location(div1, file$8, 62, 16, 2065);
    			attr_dev(div2, "class", "media-body m-auto");
    			add_location(div2, file$8, 54, 14, 1602);
    			attr_dev(div3, "class", "media");
    			add_location(div3, file$8, 50, 12, 1394);
    			attr_dev(div4, "class", "col-md-6 text-white p-b-30");
    			add_location(div4, file$8, 49, 10, 1340);
    			attr_dev(i1, "class", "mdi mdi-progress-check");
    			add_location(i1, file$8, 75, 15, 2600);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn text-white m-b-30 ml-2 mr-2 ml-3 btn-primary");
    			add_location(button, file$8, 71, 14, 2423);
    			attr_dev(div5, "class", "dropdown");
    			add_location(div5, file$8, 70, 12, 2385);
    			attr_dev(div6, "class", "col-md-6");
    			set_style(div6, "text-align", "right");
    			add_location(div6, file$8, 69, 10, 2323);
    			attr_dev(div7, "class", "row p-b-60 p-t-60");
    			add_location(div7, file$8, 48, 8, 1297);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$8, 47, 6, 1264);
    			attr_dev(div9, "class", "");
    			add_location(div9, file$8, 46, 4, 1242);
    			attr_dev(div10, "class", "bg-dark m-b-30");
    			add_location(div10, file$8, 45, 0, 1208);
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
    			append_dev(span0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, span1);
    			append_dev(span1, t2);
    			append_dev(h5, t3);
    			append_dev(h5, a);
    			append_dev(a, i0);
    			append_dev(a, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(div1, t8);
    			append_dev(div1, span3);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, button);
    			append_dev(button, i1);
    			append_dev(button, t12);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*crearNuevaHistoria*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nombres, apellidos*/ 3 && t0_value !== (t0_value = `${/*nombres*/ ctx[0][0]}${/*apellidos*/ ctx[1][0]}` + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*nombres, apellidos*/ 3 && t2_value !== (t2_value = `${/*nombres*/ ctx[0]} ${/*apellidos*/ ctx[1]}` + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*edad*/ 8) set_data_dev(t6, /*edad*/ ctx[3]);
    			if (dirty & /*cedula*/ 4) set_data_dev(t10, /*cedula*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			dispose();
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
    	validate_slots("CabeceraPerfil", slots, []);
    	let { nombres = "" } = $$props;
    	let { apellidos = "" } = $$props;
    	let { cedula = "" } = $$props;
    	let { edad } = $$props;
    	let { id = "" } = $$props;
    	let { paciente } = $$props;
    	let { cargando } = $$props;

    	function crearNuevaHistoria() {
    		const config = {
    			method: "post",
    			url: `${url}/historias`,
    			data: paciente,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		Swal.fire({
    			text: "¿Quieres crear una nueva consulta para este paciente?",
    			icon: "warning",
    			showCancelButton: true,
    			confirmButtonColor: "#3085d6",
    			cancelButtonColor: "#d33",
    			confirmButtonText: "Si, crear!",
    			cancelButtonText: "Cancelar"
    		}).then(result => {
    			if (result.isConfirmed) {
    				$$invalidate(5, cargando = true);

    				axios$1(config).then(res => {
    					console.log(res.data);
    					push(`/pacientes/${id}/historias/${res.data.id}`);
    					$$invalidate(5, cargando = false);
    				}).catch(error => {
    					$$invalidate(5, cargando = false);
    					console.error(error);
    				});
    			}
    		});
    	}

    	const writable_props = ["nombres", "apellidos", "cedula", "edad", "id", "paciente", "cargando"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<CabeceraPerfil> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("nombres" in $$props) $$invalidate(0, nombres = $$props.nombres);
    		if ("apellidos" in $$props) $$invalidate(1, apellidos = $$props.apellidos);
    		if ("cedula" in $$props) $$invalidate(2, cedula = $$props.cedula);
    		if ("edad" in $$props) $$invalidate(3, edad = $$props.edad);
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("paciente" in $$props) $$invalidate(7, paciente = $$props.paciente);
    		if ("cargando" in $$props) $$invalidate(5, cargando = $$props.cargando);
    	};

    	$$self.$capture_state = () => ({
    		url,
    		axios: axios$1,
    		push,
    		nombres,
    		apellidos,
    		cedula,
    		edad,
    		id,
    		paciente,
    		cargando,
    		crearNuevaHistoria
    	});

    	$$self.$inject_state = $$props => {
    		if ("nombres" in $$props) $$invalidate(0, nombres = $$props.nombres);
    		if ("apellidos" in $$props) $$invalidate(1, apellidos = $$props.apellidos);
    		if ("cedula" in $$props) $$invalidate(2, cedula = $$props.cedula);
    		if ("edad" in $$props) $$invalidate(3, edad = $$props.edad);
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("paciente" in $$props) $$invalidate(7, paciente = $$props.paciente);
    		if ("cargando" in $$props) $$invalidate(5, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nombres, apellidos, cedula, edad, crearNuevaHistoria, cargando, id, paciente];
    }

    class CabeceraPerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			nombres: 0,
    			apellidos: 1,
    			cedula: 2,
    			edad: 3,
    			id: 6,
    			paciente: 7,
    			cargando: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CabeceraPerfil",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*edad*/ ctx[3] === undefined && !("edad" in props)) {
    			console_1$3.warn("<CabeceraPerfil> was created without expected prop 'edad'");
    		}

    		if (/*paciente*/ ctx[7] === undefined && !("paciente" in props)) {
    			console_1$3.warn("<CabeceraPerfil> was created without expected prop 'paciente'");
    		}

    		if (/*cargando*/ ctx[5] === undefined && !("cargando" in props)) {
    			console_1$3.warn("<CabeceraPerfil> was created without expected prop 'cargando'");
    		}
    	}

    	get nombres() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nombres(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apellidos() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apellidos(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cedula() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cedula(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edad() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edad(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paciente() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paciente(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cargando() {
    		throw new Error("<CabeceraPerfil>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cargando(value) {
    		throw new Error("<CabeceraPerfil>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function requiredArgs(required, args) {
      if (args.length < required) {
        throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
      }
    }

    /**
     * @name toDate
     * @category Common Helpers
     * @summary Convert the given argument to an instance of Date.
     *
     * @description
     * Convert the given argument to an instance of Date.
     *
     * If the argument is an instance of Date, the function returns its clone.
     *
     * If the argument is a number, it is treated as a timestamp.
     *
     * If the argument is none of the above, the function returns Invalid Date.
     *
     * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
     *
     * @param {Date|Number} argument - the value to convert
     * @returns {Date} the parsed date in the local time zone
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // Clone the date:
     * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
     * //=> Tue Feb 11 2014 11:30:30
     *
     * @example
     * // Convert the timestamp to date:
     * const result = toDate(1392098430000)
     * //=> Tue Feb 11 2014 11:30:30
     */

    function toDate(argument) {
      requiredArgs(1, arguments);
      var argStr = Object.prototype.toString.call(argument); // Clone the date

      if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
        // Prevent the date to lose the milliseconds when passed to new Date() in IE10
        return new Date(argument.getTime());
      } else if (typeof argument === 'number' || argStr === '[object Number]') {
        return new Date(argument);
      } else {
        if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"); // eslint-disable-next-line no-console

          console.warn(new Error().stack);
        }

        return new Date(NaN);
      }
    }

    /**
     * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
     * They usually appear for dates that denote time before the timezones were introduced
     * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
     * and GMT+01:00:00 after that date)
     *
     * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
     * which would lead to incorrect calculations.
     *
     * This function returns the timezone offset in milliseconds that takes seconds in account.
     */
    function getTimezoneOffsetInMilliseconds(date) {
      var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
      utcDate.setUTCFullYear(date.getFullYear());
      return date.getTime() - utcDate.getTime();
    }

    /**
     * @name startOfDay
     * @category Day Helpers
     * @summary Return the start of a day for the given date.
     *
     * @description
     * Return the start of a day for the given date.
     * The result will be in the local timezone.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the original date
     * @returns {Date} the start of a day
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // The start of a day for 2 September 2014 11:55:00:
     * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
     * //=> Tue Sep 02 2014 00:00:00
     */

    function startOfDay(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    var MILLISECONDS_IN_DAY = 86400000;
    /**
     * @name differenceInCalendarDays
     * @category Day Helpers
     * @summary Get the number of calendar days between the given dates.
     *
     * @description
     * Get the number of calendar days between the given dates. This means that the times are removed
     * from the dates and then the difference in days is calculated.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of calendar days
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many calendar days are between
     * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
     * const result = differenceInCalendarDays(
     *   new Date(2012, 6, 2, 0, 0),
     *   new Date(2011, 6, 2, 23, 0)
     * )
     * //=> 366
     * // How many calendar days are between
     * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
     * const result = differenceInCalendarDays(
     *   new Date(2011, 6, 3, 0, 1),
     *   new Date(2011, 6, 2, 23, 59)
     * )
     * //=> 1
     */

    function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var startOfDayLeft = startOfDay(dirtyDateLeft);
      var startOfDayRight = startOfDay(dirtyDateRight);
      var timestampLeft = startOfDayLeft.getTime() - getTimezoneOffsetInMilliseconds(startOfDayLeft);
      var timestampRight = startOfDayRight.getTime() - getTimezoneOffsetInMilliseconds(startOfDayRight); // Round the number of days to the nearest integer
      // because the number of milliseconds in a day is not constant
      // (e.g. it's different in the day of the daylight saving time clock shift)

      return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
    }

    // for accurate equality comparisons of UTC timestamps that end up
    // having the same representation in local time, e.g. one hour before
    // DST ends vs. the instant that DST ends.

    function compareLocalAsc(dateLeft, dateRight) {
      var diff = dateLeft.getFullYear() - dateRight.getFullYear() || dateLeft.getMonth() - dateRight.getMonth() || dateLeft.getDate() - dateRight.getDate() || dateLeft.getHours() - dateRight.getHours() || dateLeft.getMinutes() - dateRight.getMinutes() || dateLeft.getSeconds() - dateRight.getSeconds() || dateLeft.getMilliseconds() - dateRight.getMilliseconds();

      if (diff < 0) {
        return -1;
      } else if (diff > 0) {
        return 1; // Return 0 if diff is 0; return NaN if diff is NaN
      } else {
        return diff;
      }
    }
    /**
     * @name differenceInDays
     * @category Day Helpers
     * @summary Get the number of full days between the given dates.
     *
     * @description
     * Get the number of full day periods between two dates. Fractional days are
     * truncated towards zero.
     *
     * One "full day" is the distance between a local time in one day to the same
     * local time on the next or previous day. A full day can sometimes be less than
     * or more than 24 hours if a daylight savings change happens between two dates.
     *
     * To ignore DST and only measure exact 24-hour periods, use this instead:
     * `Math.floor(differenceInHours(dateLeft, dateRight)/24)|0`.
     *
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of full days according to the local timezone
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many full days are between
     * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
     * const result = differenceInDays(
     *   new Date(2012, 6, 2, 0, 0),
     *   new Date(2011, 6, 2, 23, 0)
     * )
     * //=> 365
     * // How many full days are between
     * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
     * const result = differenceInDays(
     *   new Date(2011, 6, 3, 0, 1),
     *   new Date(2011, 6, 2, 23, 59)
     * )
     * //=> 0
     * // How many full days are between
     * // 1 March 2020 0:00 and 1 June 2020 0:00 ?
     * // Note: because local time is used, the
     * // result will always be 92 days, even in
     * // time zones where DST starts and the
     * // period has only 92*24-1 hours.
     * const result = differenceInDays(
     *   new Date(2020, 5, 1),
     *   new Date(2020, 2, 1)
     * )
    //=> 92
     */


    function differenceInDays(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var sign = compareLocalAsc(dateLeft, dateRight);
      var difference = Math.abs(differenceInCalendarDays(dateLeft, dateRight));
      dateLeft.setDate(dateLeft.getDate() - sign * difference); // Math.abs(diff in full days - diff in calendar days) === 1 if last calendar day is not full
      // If so, result must be decreased by 1 in absolute value

      var isLastDayNotFull = Number(compareLocalAsc(dateLeft, dateRight) === -sign);
      var result = sign * (difference - isLastDayNotFull); // Prevent negative zero

      return result === 0 ? 0 : result;
    }

    /* src\componentes\Modals\ModalDatosPaciente.svelte generated by Svelte v3.29.0 */
    const file$9 = "src\\componentes\\Modals\\ModalDatosPaciente.svelte";

    // (45:24) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let span1;
    	let i;
    	let t0;
    	let span0;
    	let t1_value = new Date(/*paciente*/ ctx[0].updatedAt).toLocaleString() + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			i = element("i");
    			t0 = text(" Ultima vez modificado\r\n                                ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			attr_dev(i, "class", "mdi mdi-calendar-alert");
    			add_location(i, file$9, 46, 61, 2192);
    			add_location(span0, file$9, 47, 32, 2286);
    			attr_dev(span1, "class", "badge badge-danger");
    			add_location(span1, file$9, 46, 28, 2159);
    			attr_dev(div, "class", "m-auto");
    			add_location(div, file$9, 45, 24, 2109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, i);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*paciente*/ 1 && t1_value !== (t1_value = new Date(/*paciente*/ ctx[0].updatedAt).toLocaleString() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(45:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:24) {#if differenceInDays(Date.now(), paciente.updatedAt)  < 90 }
    function create_if_block$4(ctx) {
    	let div;
    	let span1;
    	let t0;
    	let span0;
    	let t1_value = new Date(/*paciente*/ ctx[0].updatedAt).toLocaleString() + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			t0 = text("Ultima vez modificado\r\n                                ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			add_location(span0, file$9, 42, 32, 1951);
    			attr_dev(span1, "class", "badge badge-primary");
    			add_location(span1, file$9, 41, 28, 1862);
    			attr_dev(div, "class", "m-auto");
    			add_location(div, file$9, 40, 24, 1812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*paciente*/ 1 && t1_value !== (t1_value = new Date(/*paciente*/ ctx[0].updatedAt).toLocaleString() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(40:24) {#if differenceInDays(Date.now(), paciente.updatedAt)  < 90 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div44;
    	let div43;
    	let div42;
    	let div0;
    	let h5;
    	let t1;
    	let button;
    	let span0;
    	let t3;
    	let div35;
    	let div4;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t4;
    	let h30;
    	let a0;
    	let t5_value = /*paciente*/ ctx[0].nombres + "";
    	let t5;
    	let t6;
    	let t7_value = /*paciente*/ ctx[0].apellidos + "";
    	let t7;
    	let t8;
    	let div3;
    	let t9_value = (/*paciente*/ ctx[0].email || "N/A") + "";
    	let t9;
    	let t10;
    	let show_if;
    	let t11;
    	let hr0;
    	let t12;
    	let form;
    	let div25;
    	let div6;
    	let div5;
    	let sapn;
    	let t14;
    	let strong0;
    	let t15_value = (/*paciente*/ ctx[0].cedula || "N/A") + "";
    	let t15;
    	let t16;
    	let div8;
    	let div7;
    	let span1;
    	let t18;
    	let strong1;
    	let t19_value = (/*paciente*/ ctx[0].nombres || "N/A") + "";
    	let t19;
    	let t20;
    	let div10;
    	let div9;
    	let span2;
    	let t22;
    	let strong2;
    	let t23_value = (/*paciente*/ ctx[0].apellidos || "N/A") + "";
    	let t23;
    	let t24;
    	let div12;
    	let div11;
    	let span3;
    	let t26;
    	let strong3;
    	let t27_value = (/*paciente*/ ctx[0].sexo || "N/A") + "";
    	let t27;
    	let t28;
    	let div14;
    	let div13;
    	let span4;
    	let t30;
    	let strong4;
    	let t31_value = (/*edad*/ ctx[1] || "N/A") + "";
    	let t31;
    	let t32;
    	let t33;
    	let div16;
    	let div15;
    	let span5;
    	let t35;
    	let strong5;
    	let t36_value = (new Date(/*paciente*/ ctx[0].fechaNacimiento).toLocaleDateString("es-DO") || "N/A") + "";
    	let t36;
    	let t37;
    	let div18;
    	let div17;
    	let span6;
    	let t39;
    	let strong6;
    	let t40_value = (/*paciente*/ ctx[0].telefono || "N/A") + "";
    	let t40;
    	let t41;
    	let div20;
    	let div19;
    	let span7;
    	let t43;
    	let strong7;
    	let t44_value = (/*paciente*/ ctx[0].celular || "N/A") + "";
    	let t44;
    	let t45;
    	let div22;
    	let div21;
    	let span8;
    	let t47;
    	let strong8;
    	let t48_value = (/*seguro*/ ctx[2] || "N/A") + "";
    	let t48;
    	let t49;
    	let div24;
    	let div23;
    	let span9;
    	let t51;
    	let strong9;
    	let t52_value = (/*paciente*/ ctx[0].numeroSeguro || "N/A") + "";
    	let t52;
    	let t53;
    	let p;
    	let span10;
    	let t55;
    	let hr1;
    	let t56;
    	let div34;
    	let div27;
    	let div26;
    	let span11;
    	let t58;
    	let strong10;
    	let t59_value = (/*paciente*/ ctx[0].direccion || "N/A") + "";
    	let t59;
    	let t60;
    	let div29;
    	let div28;
    	let span12;
    	let t62;
    	let strong11;
    	let t63_value = (/*paciente*/ ctx[0].provincia || "N/A") + "";
    	let t63;
    	let t64;
    	let div31;
    	let div30;
    	let span13;
    	let t66;
    	let strong12;
    	let t67_value = (/*paciente*/ ctx[0].ciudad || "N/A") + "";
    	let t67;
    	let t68;
    	let div33;
    	let div32;
    	let span14;
    	let t70;
    	let strong13;
    	let t71_value = (/*paciente*/ ctx[0].nacionalidad || "N/A") + "";
    	let t71;
    	let t72;
    	let div41;
    	let div40;
    	let div37;
    	let a1;
    	let h31;
    	let t73;
    	let div36;
    	let t75;
    	let div39;
    	let a2;
    	let h32;
    	let t76;
    	let div38;
    	let a2_href_value;
    	let link_action;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*paciente*/ 1) show_if = !!(differenceInDays(Date.now(), /*paciente*/ ctx[0].updatedAt) < 90);
    		if (show_if) return create_if_block$4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div44 = element("div");
    			div43 = element("div");
    			div42 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Datos de paciente";
    			t1 = space();
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t3 = space();
    			div35 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t4 = space();
    			h30 = element("h3");
    			a0 = element("a");
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			t9 = text(t9_value);
    			t10 = space();
    			if_block.c();
    			t11 = space();
    			hr0 = element("hr");
    			t12 = space();
    			form = element("form");
    			div25 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			sapn = element("sapn");
    			sapn.textContent = "Cedula / pasaporte";
    			t14 = space();
    			strong0 = element("strong");
    			t15 = text(t15_value);
    			t16 = space();
    			div8 = element("div");
    			div7 = element("div");
    			span1 = element("span");
    			span1.textContent = "Nombres";
    			t18 = space();
    			strong1 = element("strong");
    			t19 = text(t19_value);
    			t20 = space();
    			div10 = element("div");
    			div9 = element("div");
    			span2 = element("span");
    			span2.textContent = "Apellidos";
    			t22 = space();
    			strong2 = element("strong");
    			t23 = text(t23_value);
    			t24 = space();
    			div12 = element("div");
    			div11 = element("div");
    			span3 = element("span");
    			span3.textContent = "Sexo";
    			t26 = space();
    			strong3 = element("strong");
    			t27 = text(t27_value);
    			t28 = space();
    			div14 = element("div");
    			div13 = element("div");
    			span4 = element("span");
    			span4.textContent = "Edad";
    			t30 = space();
    			strong4 = element("strong");
    			t31 = text(t31_value);
    			t32 = text(" años");
    			t33 = space();
    			div16 = element("div");
    			div15 = element("div");
    			span5 = element("span");
    			span5.textContent = "Fecha Nacimiento";
    			t35 = space();
    			strong5 = element("strong");
    			t36 = text(t36_value);
    			t37 = space();
    			div18 = element("div");
    			div17 = element("div");
    			span6 = element("span");
    			span6.textContent = "Telefono";
    			t39 = space();
    			strong6 = element("strong");
    			t40 = text(t40_value);
    			t41 = space();
    			div20 = element("div");
    			div19 = element("div");
    			span7 = element("span");
    			span7.textContent = "Celular";
    			t43 = space();
    			strong7 = element("strong");
    			t44 = text(t44_value);
    			t45 = space();
    			div22 = element("div");
    			div21 = element("div");
    			span8 = element("span");
    			span8.textContent = "Seguro Medico";
    			t47 = space();
    			strong8 = element("strong");
    			t48 = text(t48_value);
    			t49 = space();
    			div24 = element("div");
    			div23 = element("div");
    			span9 = element("span");
    			span9.textContent = "No. Seguro";
    			t51 = space();
    			strong9 = element("strong");
    			t52 = text(t52_value);
    			t53 = space();
    			p = element("p");
    			span10 = element("span");
    			span10.textContent = "Datos demográficos";
    			t55 = space();
    			hr1 = element("hr");
    			t56 = space();
    			div34 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			span11 = element("span");
    			span11.textContent = "Dirección";
    			t58 = space();
    			strong10 = element("strong");
    			t59 = text(t59_value);
    			t60 = space();
    			div29 = element("div");
    			div28 = element("div");
    			span12 = element("span");
    			span12.textContent = "Provincia";
    			t62 = space();
    			strong11 = element("strong");
    			t63 = text(t63_value);
    			t64 = space();
    			div31 = element("div");
    			div30 = element("div");
    			span13 = element("span");
    			span13.textContent = "Ciudad";
    			t66 = space();
    			strong12 = element("strong");
    			t67 = text(t67_value);
    			t68 = space();
    			div33 = element("div");
    			div32 = element("div");
    			span14 = element("span");
    			span14.textContent = "Nacionalidad";
    			t70 = space();
    			strong13 = element("strong");
    			t71 = text(t71_value);
    			t72 = space();
    			div41 = element("div");
    			div40 = element("div");
    			div37 = element("div");
    			a1 = element("a");
    			h31 = element("h3");
    			t73 = space();
    			div36 = element("div");
    			div36.textContent = "Cerrar";
    			t75 = space();
    			div39 = element("div");
    			a2 = element("a");
    			h32 = element("h3");
    			t76 = space();
    			div38 = element("div");
    			div38.textContent = "Perfil";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalDatosPersonales");
    			add_location(h5, file$9, 18, 20, 643);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$9, 20, 24, 839);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$9, 19, 20, 737);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$9, 17, 16, 595);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "https://picsum.photos/200/300")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "imagen paciente");
    			add_location(img, file$9, 28, 32, 1143);
    			attr_dev(div1, "class", "avatar avatar-xl");
    			add_location(div1, file$9, 27, 28, 1079);
    			add_location(div2, file$9, 26, 24, 1044);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$9, 32, 28, 1397);
    			attr_dev(h30, "class", "p-t-10 searchBy-name");
    			add_location(h30, file$9, 31, 24, 1334);
    			attr_dev(div3, "class", "text-muted text-center m-b-10");
    			add_location(div3, file$9, 36, 24, 1569);
    			attr_dev(div4, "class", "text-center");
    			add_location(div4, file$9, 25, 20, 993);
    			add_location(hr0, file$9, 51, 20, 2466);
    			attr_dev(sapn, "class", "text-primary");
    			add_location(sapn, file$9, 56, 36, 2755);
    			attr_dev(strong0, "class", "d-block");
    			add_location(strong0, file$9, 57, 36, 2845);
    			attr_dev(div5, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div5, file$9, 55, 32, 2677);
    			attr_dev(div6, "class", "form-group col-md-6");
    			add_location(div6, file$9, 54, 28, 2610);
    			attr_dev(span1, "class", "text-primary");
    			add_location(span1, file$9, 62, 36, 3157);
    			attr_dev(strong1, "class", "d-block");
    			add_location(strong1, file$9, 63, 36, 3236);
    			attr_dev(div7, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div7, file$9, 61, 32, 3078);
    			attr_dev(div8, "class", "form-group col-md-6");
    			add_location(div8, file$9, 60, 28, 3011);
    			attr_dev(span2, "class", "text-primary");
    			add_location(span2, file$9, 68, 36, 3549);
    			attr_dev(strong2, "class", "d-block");
    			add_location(strong2, file$9, 69, 36, 3630);
    			attr_dev(div9, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div9, file$9, 67, 32, 3471);
    			attr_dev(div10, "class", "form-group col-md-6");
    			add_location(div10, file$9, 66, 28, 3404);
    			attr_dev(span3, "class", "text-primary");
    			add_location(span3, file$9, 74, 36, 3945);
    			attr_dev(strong3, "class", "d-block");
    			add_location(strong3, file$9, 75, 36, 4021);
    			attr_dev(div11, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div11, file$9, 73, 32, 3867);
    			attr_dev(div12, "class", "form-group col-md-6");
    			add_location(div12, file$9, 72, 28, 3800);
    			attr_dev(span4, "class", "text-primary");
    			add_location(span4, file$9, 80, 36, 4331);
    			attr_dev(strong4, "class", "d-block");
    			add_location(strong4, file$9, 81, 36, 4407);
    			attr_dev(div13, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div13, file$9, 79, 32, 4253);
    			attr_dev(div14, "class", "form-group col-md-6");
    			add_location(div14, file$9, 78, 28, 4186);
    			attr_dev(span5, "class", "text-primary");
    			add_location(span5, file$9, 86, 36, 4713);
    			attr_dev(strong5, "class", "d-block");
    			add_location(strong5, file$9, 87, 36, 4801);
    			attr_dev(div15, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div15, file$9, 85, 32, 4635);
    			attr_dev(div16, "class", "form-group col-md-6");
    			add_location(div16, file$9, 84, 28, 4568);
    			attr_dev(span6, "class", "text-primary");
    			add_location(span6, file$9, 92, 36, 5161);
    			attr_dev(strong6, "class", "d-block");
    			add_location(strong6, file$9, 93, 36, 5241);
    			attr_dev(div17, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div17, file$9, 91, 32, 5082);
    			attr_dev(div18, "class", "form-group col-md-6");
    			add_location(div18, file$9, 90, 28, 5015);
    			attr_dev(span7, "class", "text-primary");
    			add_location(span7, file$9, 98, 36, 5555);
    			attr_dev(strong7, "class", "d-block");
    			add_location(strong7, file$9, 99, 36, 5634);
    			attr_dev(div19, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div19, file$9, 97, 32, 5477);
    			attr_dev(div20, "class", "form-group col-md-6");
    			add_location(div20, file$9, 96, 28, 5410);
    			attr_dev(span8, "class", "text-primary");
    			add_location(span8, file$9, 104, 36, 5948);
    			attr_dev(strong8, "class", "d-block");
    			add_location(strong8, file$9, 105, 36, 6033);
    			attr_dev(div21, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div21, file$9, 103, 32, 5870);
    			attr_dev(div22, "class", "form-group col-md-6 ");
    			add_location(div22, file$9, 102, 28, 5802);
    			attr_dev(span9, "class", "text-primary");
    			add_location(span9, file$9, 110, 36, 6337);
    			attr_dev(strong9, "class", "d-block");
    			add_location(strong9, file$9, 111, 36, 6419);
    			attr_dev(div23, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div23, file$9, 109, 32, 6259);
    			attr_dev(div24, "class", "form-group col-md-6 ");
    			add_location(div24, file$9, 108, 28, 6191);
    			attr_dev(div25, "class", "form-row");
    			add_location(div25, file$9, 53, 24, 2558);
    			attr_dev(span10, "class", "badge badge-primary");
    			add_location(span10, file$9, 115, 64, 6660);
    			attr_dev(p, "class", "mt-3");
    			set_style(p, "font-size", "18px");
    			add_location(p, file$9, 115, 24, 6620);
    			add_location(hr1, file$9, 116, 24, 6749);
    			attr_dev(span11, "for", "inpDireccion");
    			attr_dev(span11, "class", "text-primary");
    			add_location(span11, file$9, 120, 36, 6978);
    			attr_dev(strong10, "class", "d-block");
    			add_location(strong10, file$9, 121, 36, 7085);
    			attr_dev(div26, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div26, file$9, 119, 32, 6900);
    			attr_dev(div27, "class", "form-group col-md-12 ");
    			add_location(div27, file$9, 118, 28, 6831);
    			attr_dev(span12, "class", "text-primary");
    			add_location(span12, file$9, 126, 36, 7401);
    			attr_dev(strong11, "class", "d-block");
    			add_location(strong11, file$9, 127, 36, 7482);
    			attr_dev(div28, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div28, file$9, 125, 32, 7323);
    			attr_dev(div29, "class", "form-group col-md-6 ");
    			add_location(div29, file$9, 124, 28, 7255);
    			attr_dev(span13, "class", "text-primary");
    			add_location(span13, file$9, 132, 36, 7798);
    			attr_dev(strong12, "class", "d-block");
    			add_location(strong12, file$9, 133, 36, 7876);
    			attr_dev(div30, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div30, file$9, 131, 32, 7720);
    			attr_dev(div31, "class", "form-group col-md-6 ");
    			add_location(div31, file$9, 130, 28, 7652);
    			attr_dev(span14, "for", "inpPais");
    			attr_dev(span14, "class", "text-primary");
    			add_location(span14, file$9, 138, 36, 8189);
    			attr_dev(strong13, "class", "d-block");
    			add_location(strong13, file$9, 139, 36, 8287);
    			attr_dev(div32, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div32, file$9, 137, 32, 8111);
    			attr_dev(div33, "class", "form-group col-md-6 ");
    			add_location(div33, file$9, 136, 28, 8043);
    			attr_dev(div34, "class", "form-row");
    			add_location(div34, file$9, 117, 24, 6779);
    			attr_dev(form, "class", "form-group floating-label");
    			add_location(form, file$9, 52, 20, 2492);
    			attr_dev(div35, "class", "modal-body");
    			add_location(div35, file$9, 23, 16, 945);
    			attr_dev(h31, "class", "mdi mdi-close-outline");
    			add_location(h31, file$9, 153, 32, 8889);
    			attr_dev(div36, "class", "text-overline");
    			add_location(div36, file$9, 154, 32, 8962);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "text-danger");
    			attr_dev(a1, "data-dismiss", "modal");
    			add_location(a1, file$9, 151, 28, 8724);
    			attr_dev(div37, "class", "col");
    			add_location(div37, file$9, 150, 24, 8677);
    			attr_dev(h32, "class", "mdi mdi-folder-account-outline");
    			add_location(h32, file$9, 167, 32, 9817);
    			attr_dev(div38, "class", "text-overline");
    			add_location(div38, file$9, 168, 32, 9899);
    			attr_dev(a2, "href", a2_href_value = `/pacientes/perfil/${/*paciente*/ ctx[0].id}`);
    			attr_dev(a2, "class", "text-info");
    			add_location(a2, file$9, 165, 28, 9571);
    			attr_dev(div39, "class", "col");
    			add_location(div39, file$9, 163, 24, 9452);
    			attr_dev(div40, "class", "row text-center p-b-10");
    			add_location(div40, file$9, 149, 20, 8615);
    			attr_dev(div41, "class", "modal-footer");
    			add_location(div41, file$9, 148, 16, 8567);
    			attr_dev(div42, "class", "modal-content");
    			add_location(div42, file$9, 16, 12, 550);
    			attr_dev(div43, "class", "modal-dialog");
    			attr_dev(div43, "role", "document");
    			add_location(div43, file$9, 15, 8, 494);
    			attr_dev(div44, "class", "modal fade modal-slide-right");
    			attr_dev(div44, "id", "modalDatosPersonales");
    			attr_dev(div44, "tabindex", "-1");
    			attr_dev(div44, "role", "dialog");
    			attr_dev(div44, "aria-labelledby", "modalDatosPersonales");
    			set_style(div44, "display", "none");
    			set_style(div44, "padding-right", "16px");
    			attr_dev(div44, "aria-modal", "true");
    			add_location(div44, file$9, 13, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div44, anchor);
    			append_dev(div44, div43);
    			append_dev(div43, div42);
    			append_dev(div42, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span0);
    			append_dev(div42, t3);
    			append_dev(div42, div35);
    			append_dev(div35, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div4, t4);
    			append_dev(div4, h30);
    			append_dev(h30, a0);
    			append_dev(a0, t5);
    			append_dev(a0, t6);
    			append_dev(a0, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, t9);
    			append_dev(div4, t10);
    			if_block.m(div4, null);
    			append_dev(div35, t11);
    			append_dev(div35, hr0);
    			append_dev(div35, t12);
    			append_dev(div35, form);
    			append_dev(form, div25);
    			append_dev(div25, div6);
    			append_dev(div6, div5);
    			append_dev(div5, sapn);
    			append_dev(div5, t14);
    			append_dev(div5, strong0);
    			append_dev(strong0, t15);
    			append_dev(div25, t16);
    			append_dev(div25, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span1);
    			append_dev(div7, t18);
    			append_dev(div7, strong1);
    			append_dev(strong1, t19);
    			append_dev(div25, t20);
    			append_dev(div25, div10);
    			append_dev(div10, div9);
    			append_dev(div9, span2);
    			append_dev(div9, t22);
    			append_dev(div9, strong2);
    			append_dev(strong2, t23);
    			append_dev(div25, t24);
    			append_dev(div25, div12);
    			append_dev(div12, div11);
    			append_dev(div11, span3);
    			append_dev(div11, t26);
    			append_dev(div11, strong3);
    			append_dev(strong3, t27);
    			append_dev(div25, t28);
    			append_dev(div25, div14);
    			append_dev(div14, div13);
    			append_dev(div13, span4);
    			append_dev(div13, t30);
    			append_dev(div13, strong4);
    			append_dev(strong4, t31);
    			append_dev(strong4, t32);
    			append_dev(div25, t33);
    			append_dev(div25, div16);
    			append_dev(div16, div15);
    			append_dev(div15, span5);
    			append_dev(div15, t35);
    			append_dev(div15, strong5);
    			append_dev(strong5, t36);
    			append_dev(div25, t37);
    			append_dev(div25, div18);
    			append_dev(div18, div17);
    			append_dev(div17, span6);
    			append_dev(div17, t39);
    			append_dev(div17, strong6);
    			append_dev(strong6, t40);
    			append_dev(div25, t41);
    			append_dev(div25, div20);
    			append_dev(div20, div19);
    			append_dev(div19, span7);
    			append_dev(div19, t43);
    			append_dev(div19, strong7);
    			append_dev(strong7, t44);
    			append_dev(div25, t45);
    			append_dev(div25, div22);
    			append_dev(div22, div21);
    			append_dev(div21, span8);
    			append_dev(div21, t47);
    			append_dev(div21, strong8);
    			append_dev(strong8, t48);
    			append_dev(div25, t49);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, span9);
    			append_dev(div23, t51);
    			append_dev(div23, strong9);
    			append_dev(strong9, t52);
    			append_dev(form, t53);
    			append_dev(form, p);
    			append_dev(p, span10);
    			append_dev(form, t55);
    			append_dev(form, hr1);
    			append_dev(form, t56);
    			append_dev(form, div34);
    			append_dev(div34, div27);
    			append_dev(div27, div26);
    			append_dev(div26, span11);
    			append_dev(div26, t58);
    			append_dev(div26, strong10);
    			append_dev(strong10, t59);
    			append_dev(div34, t60);
    			append_dev(div34, div29);
    			append_dev(div29, div28);
    			append_dev(div28, span12);
    			append_dev(div28, t62);
    			append_dev(div28, strong11);
    			append_dev(strong11, t63);
    			append_dev(div34, t64);
    			append_dev(div34, div31);
    			append_dev(div31, div30);
    			append_dev(div30, span13);
    			append_dev(div30, t66);
    			append_dev(div30, strong12);
    			append_dev(strong12, t67);
    			append_dev(div34, t68);
    			append_dev(div34, div33);
    			append_dev(div33, div32);
    			append_dev(div32, span14);
    			append_dev(div32, t70);
    			append_dev(div32, strong13);
    			append_dev(strong13, t71);
    			append_dev(div42, t72);
    			append_dev(div42, div41);
    			append_dev(div41, div40);
    			append_dev(div40, div37);
    			append_dev(div37, a1);
    			append_dev(a1, h31);
    			append_dev(a1, t73);
    			append_dev(a1, div36);
    			append_dev(div40, t75);
    			append_dev(div40, div39);
    			append_dev(div39, a2);
    			append_dev(a2, h32);
    			append_dev(a2, t76);
    			append_dev(a2, div38);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a2)),
    					listen_dev(a2, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*paciente*/ 1 && t5_value !== (t5_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*paciente*/ 1 && t7_value !== (t7_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*paciente*/ 1 && t9_value !== (t9_value = (/*paciente*/ ctx[0].email || "N/A") + "")) set_data_dev(t9, t9_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			}

    			if (dirty & /*paciente*/ 1 && t15_value !== (t15_value = (/*paciente*/ ctx[0].cedula || "N/A") + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*paciente*/ 1 && t19_value !== (t19_value = (/*paciente*/ ctx[0].nombres || "N/A") + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*paciente*/ 1 && t23_value !== (t23_value = (/*paciente*/ ctx[0].apellidos || "N/A") + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*paciente*/ 1 && t27_value !== (t27_value = (/*paciente*/ ctx[0].sexo || "N/A") + "")) set_data_dev(t27, t27_value);
    			if (dirty & /*edad*/ 2 && t31_value !== (t31_value = (/*edad*/ ctx[1] || "N/A") + "")) set_data_dev(t31, t31_value);
    			if (dirty & /*paciente*/ 1 && t36_value !== (t36_value = (new Date(/*paciente*/ ctx[0].fechaNacimiento).toLocaleDateString("es-DO") || "N/A") + "")) set_data_dev(t36, t36_value);
    			if (dirty & /*paciente*/ 1 && t40_value !== (t40_value = (/*paciente*/ ctx[0].telefono || "N/A") + "")) set_data_dev(t40, t40_value);
    			if (dirty & /*paciente*/ 1 && t44_value !== (t44_value = (/*paciente*/ ctx[0].celular || "N/A") + "")) set_data_dev(t44, t44_value);
    			if (dirty & /*seguro*/ 4 && t48_value !== (t48_value = (/*seguro*/ ctx[2] || "N/A") + "")) set_data_dev(t48, t48_value);
    			if (dirty & /*paciente*/ 1 && t52_value !== (t52_value = (/*paciente*/ ctx[0].numeroSeguro || "N/A") + "")) set_data_dev(t52, t52_value);
    			if (dirty & /*paciente*/ 1 && t59_value !== (t59_value = (/*paciente*/ ctx[0].direccion || "N/A") + "")) set_data_dev(t59, t59_value);
    			if (dirty & /*paciente*/ 1 && t63_value !== (t63_value = (/*paciente*/ ctx[0].provincia || "N/A") + "")) set_data_dev(t63, t63_value);
    			if (dirty & /*paciente*/ 1 && t67_value !== (t67_value = (/*paciente*/ ctx[0].ciudad || "N/A") + "")) set_data_dev(t67, t67_value);
    			if (dirty & /*paciente*/ 1 && t71_value !== (t71_value = (/*paciente*/ ctx[0].nacionalidad || "N/A") + "")) set_data_dev(t71, t71_value);

    			if (dirty & /*paciente*/ 1 && a2_href_value !== (a2_href_value = `/pacientes/perfil/${/*paciente*/ ctx[0].id}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div44);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("ModalDatosPaciente", slots, []);
    	let { paciente = {} } = $$props;
    	let { edad = "" } = $$props;
    	let { seguro = "" } = $$props;

    	onMount(() => {
    		
    	});

    	const writable_props = ["paciente", "edad", "seguro"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalDatosPaciente> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => jQuery("#modalDatosPersonales").modal("hide");

    	$$self.$$set = $$props => {
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("edad" in $$props) $$invalidate(1, edad = $$props.edad);
    		if ("seguro" in $$props) $$invalidate(2, seguro = $$props.seguro);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		link,
    		differenceInDays,
    		paciente,
    		edad,
    		seguro
    	});

    	$$self.$inject_state = $$props => {
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("edad" in $$props) $$invalidate(1, edad = $$props.edad);
    		if ("seguro" in $$props) $$invalidate(2, seguro = $$props.seguro);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paciente, edad, seguro, click_handler];
    }

    class ModalDatosPaciente extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { paciente: 0, edad: 1, seguro: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalDatosPaciente",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get paciente() {
    		throw new Error("<ModalDatosPaciente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paciente(value) {
    		throw new Error("<ModalDatosPaciente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edad() {
    		throw new Error("<ModalDatosPaciente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edad(value) {
    		throw new Error("<ModalDatosPaciente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get seguro() {
    		throw new Error("<ModalDatosPaciente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set seguro(value) {
    		throw new Error("<ModalDatosPaciente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\TarjetaAntecedentes.svelte generated by Svelte v3.29.0 */
    const file$a = "src\\componentes\\TarjetaAntecedentes.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (15:8) {#if antecedente.categoria.id === id}
    function create_if_block$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[3].activo && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[3].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(15:8) {#if antecedente.categoria.id === id}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#if antecedente.activo}
    function create_if_block_1$2(ctx) {
    	let div;
    	let h5;
    	let t0_value = /*antecedente*/ ctx[3].nombre + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*antecedente*/ ctx[3].descripcion + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(h5, "class", "alert-heading");
    			set_style(h5, "margin-bottom", "0px");
    			set_style(h5, "font-size", "12px");
    			set_style(h5, "text-transform", "uppercase");
    			set_style(h5, "font-weight", "bold");
    			add_location(h5, file$a, 17, 20, 456);
    			set_style(p, "padding", "0");
    			set_style(p, "margin", "0");
    			add_location(p, file$a, 18, 20, 616);
    			attr_dev(div, "class", "alert alert-secondary");
    			set_style(div, "padding", "10px");
    			attr_dev(div, "role", "alert");
    			add_location(div, file$a, 16, 16, 363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			append_dev(h5, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*antecedentes*/ 4 && t0_value !== (t0_value = /*antecedente*/ ctx[3].nombre + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*antecedentes*/ 4 && t2_value !== (t2_value = /*antecedente*/ ctx[3].descripcion + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(16:12) {#if antecedente.activo}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#each antecedentes as antecedente}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[3].categoria.id === /*id*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[3].categoria.id === /*id*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(14:4) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let h6;
    	let t0;
    	let t1;
    	let hr;
    	let t2;
    	let each_value = /*antecedentes*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h6 = element("h6");
    			t0 = text(/*nombre*/ ctx[1]);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h6, file$a, 11, 4, 192);
    			add_location(hr, file$a, 12, 4, 215);
    			add_location(div, file$a, 10, 0, 181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h6);
    			append_dev(h6, t0);
    			append_dev(div, t1);
    			append_dev(div, hr);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nombre*/ 2) set_data_dev(t0, /*nombre*/ ctx[1]);

    			if (dirty & /*antecedentes, id*/ 5) {
    				each_value = /*antecedentes*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TarjetaAntecedentes", slots, []);
    	let { id = "" } = $$props;
    	let { nombre = "" } = $$props;
    	let { antecedentes = [] } = $$props;

    	onMount(() => {
    		
    	});

    	const writable_props = ["id", "nombre", "antecedentes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TarjetaAntecedentes> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("nombre" in $$props) $$invalidate(1, nombre = $$props.nombre);
    		if ("antecedentes" in $$props) $$invalidate(2, antecedentes = $$props.antecedentes);
    	};

    	$$self.$capture_state = () => ({ onMount, id, nombre, antecedentes });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("nombre" in $$props) $$invalidate(1, nombre = $$props.nombre);
    		if ("antecedentes" in $$props) $$invalidate(2, antecedentes = $$props.antecedentes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, nombre, antecedentes];
    }

    class TarjetaAntecedentes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { id: 0, nombre: 1, antecedentes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TarjetaAntecedentes",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get id() {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nombre() {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nombre(value) {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get antecedentes() {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set antecedentes(value) {
    		throw new Error("<TarjetaAntecedentes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Pacientes\PacientePerfil.svelte generated by Svelte v3.29.0 */

    const { console: console_1$4 } = globals;
    const file$b = "src\\Pages\\Pacientes\\PacientePerfil.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	child_ctx[39] = list;
    	child_ctx[40] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[43] = list;
    	child_ctx[44] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[45] = list[i];
    	return child_ctx;
    }

    // (181:2) {#if cargando}
    function create_if_block_4(ctx) {
    	let div;
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loading.$$.fragment);
    			attr_dev(div, "class", "cargando svelte-3oo6xw");
    			add_location(div, file$b, 181, 4, 5377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loading, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loading);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(181:2) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    // (328:18) {#each historiasPaciente as historia}
    function create_each_block_4(ctx) {
    	let evoluciones;
    	let current;

    	evoluciones = new Evoluciones({
    			props: {
    				usuario: /*historia*/ ctx[45].usuario,
    				idPaciente: /*paciente*/ ctx[1].id,
    				id: /*historia*/ ctx[45].id,
    				fecha: /*historia*/ ctx[45].fechaHora,
    				motivo: /*historia*/ ctx[45].motivoConsulta,
    				historia: /*historia*/ ctx[45].historiaEnfermedad
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(evoluciones.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(evoluciones, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const evoluciones_changes = {};
    			if (dirty[0] & /*historiasPaciente*/ 64) evoluciones_changes.usuario = /*historia*/ ctx[45].usuario;
    			if (dirty[0] & /*paciente*/ 2) evoluciones_changes.idPaciente = /*paciente*/ ctx[1].id;
    			if (dirty[0] & /*historiasPaciente*/ 64) evoluciones_changes.id = /*historia*/ ctx[45].id;
    			if (dirty[0] & /*historiasPaciente*/ 64) evoluciones_changes.fecha = /*historia*/ ctx[45].fechaHora;
    			if (dirty[0] & /*historiasPaciente*/ 64) evoluciones_changes.motivo = /*historia*/ ctx[45].motivoConsulta;
    			if (dirty[0] & /*historiasPaciente*/ 64) evoluciones_changes.historia = /*historia*/ ctx[45].historiaEnfermedad;
    			evoluciones.$set(evoluciones_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(evoluciones.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(evoluciones.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(evoluciones, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(328:18) {#each historiasPaciente as historia}",
    		ctx
    	});

    	return block;
    }

    // (363:20) {#each categoriasAntecedentes as categoria}
    function create_each_block_3(ctx) {
    	let tarjetaantecedentes;
    	let updating_id;
    	let updating_nombre;
    	let updating_antecedentes;
    	let current;

    	function tarjetaantecedentes_id_binding(value) {
    		/*tarjetaantecedentes_id_binding*/ ctx[25].call(null, value, /*categoria*/ ctx[35]);
    	}

    	function tarjetaantecedentes_nombre_binding(value) {
    		/*tarjetaantecedentes_nombre_binding*/ ctx[26].call(null, value, /*categoria*/ ctx[35]);
    	}

    	function tarjetaantecedentes_antecedentes_binding(value) {
    		/*tarjetaantecedentes_antecedentes_binding*/ ctx[27].call(null, value);
    	}

    	let tarjetaantecedentes_props = {};

    	if (/*categoria*/ ctx[35].id !== void 0) {
    		tarjetaantecedentes_props.id = /*categoria*/ ctx[35].id;
    	}

    	if (/*categoria*/ ctx[35].nombre !== void 0) {
    		tarjetaantecedentes_props.nombre = /*categoria*/ ctx[35].nombre;
    	}

    	if (/*paciente*/ ctx[1].antecedentes !== void 0) {
    		tarjetaantecedentes_props.antecedentes = /*paciente*/ ctx[1].antecedentes;
    	}

    	tarjetaantecedentes = new TarjetaAntecedentes({
    			props: tarjetaantecedentes_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(tarjetaantecedentes, "id", tarjetaantecedentes_id_binding));
    	binding_callbacks.push(() => bind(tarjetaantecedentes, "nombre", tarjetaantecedentes_nombre_binding));
    	binding_callbacks.push(() => bind(tarjetaantecedentes, "antecedentes", tarjetaantecedentes_antecedentes_binding));

    	const block = {
    		c: function create() {
    			create_component(tarjetaantecedentes.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tarjetaantecedentes, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tarjetaantecedentes_changes = {};

    			if (!updating_id && dirty[0] & /*categoriasAntecedentes*/ 16) {
    				updating_id = true;
    				tarjetaantecedentes_changes.id = /*categoria*/ ctx[35].id;
    				add_flush_callback(() => updating_id = false);
    			}

    			if (!updating_nombre && dirty[0] & /*categoriasAntecedentes*/ 16) {
    				updating_nombre = true;
    				tarjetaantecedentes_changes.nombre = /*categoria*/ ctx[35].nombre;
    				add_flush_callback(() => updating_nombre = false);
    			}

    			if (!updating_antecedentes && dirty[0] & /*paciente*/ 2) {
    				updating_antecedentes = true;
    				tarjetaantecedentes_changes.antecedentes = /*paciente*/ ctx[1].antecedentes;
    				add_flush_callback(() => updating_antecedentes = false);
    			}

    			tarjetaantecedentes.$set(tarjetaantecedentes_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tarjetaantecedentes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tarjetaantecedentes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tarjetaantecedentes, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(363:20) {#each categoriasAntecedentes as categoria}",
    		ctx
    	});

    	return block;
    }

    // (490:26) {#if antecedente.categoria.id === categoria.id}
    function create_if_block_2$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].activo === false && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[38].activo === false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(490:26) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (491:28) {#if antecedente.activo === false}
    function create_if_block_3(ctx) {
    	let button;
    	let i;
    	let t0;
    	let span;
    	let t1_value = /*antecedente*/ ctx[38].nombre + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[28](/*antecedente*/ ctx[38], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$b, 498, 33, 18194);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$b, 499, 32, 18254);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button, "box-shadow", "none");
    			add_location(button, file$b, 492, 30, 17838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*antecedentes*/ 32 && t1_value !== (t1_value = /*antecedente*/ ctx[38].nombre + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(491:28) {#if antecedente.activo === false}",
    		ctx
    	});

    	return block;
    }

    // (489:24) {#each antecedentes as antecedente}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(489:24) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (516:32) {#if antecedente.categoria.id === categoria.id}
    function create_if_block$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].activo === true && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[38].activo === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(516:32) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (517:34) {#if antecedente.activo === true}
    function create_if_block_1$3(ctx) {
    	let div6;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let span;
    	let t1_value = /*antecedente*/ ctx[38].nombre + "";
    	let t1;
    	let t2;
    	let div4;
    	let div3;
    	let a;
    	let i1;
    	let t3;
    	let div2;
    	let button;
    	let i2;
    	let t4;
    	let t5;
    	let div5;
    	let textarea;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[29](/*antecedente*/ ctx[38], ...args);
    	}

    	function textarea_input_handler() {
    		/*textarea_input_handler*/ ctx[30].call(textarea, /*each_value_1*/ ctx[39], /*antecedente_index*/ ctx[40]);
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			a = element("a");
    			i1 = element("i");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			i2 = element("i");
    			t4 = text("\r\n                                              Eliminar");
    			t5 = space();
    			div5 = element("div");
    			textarea = element("textarea");
    			t6 = space();
    			attr_dev(i0, "class", "mdi mdi-history mdi-18px");
    			add_location(i0, file$b, 524, 42, 19559);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$b, 525, 42, 19641);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$b, 523, 40, 19491);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$b, 522, 38, 19424);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$b, 538, 44, 20406);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$b, 532, 42, 20058);
    			attr_dev(i2, "class", "mdi mdi-trash-can-outline");
    			add_location(i2, file$b, 552, 47, 21262);
    			attr_dev(button, "class", "dropdown-item text-danger");
    			attr_dev(button, "type", "button");
    			add_location(button, file$b, 545, 44, 20813);
    			attr_dev(div2, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div2, file$b, 542, 42, 20631);
    			attr_dev(div3, "class", "dropdown");
    			add_location(div3, file$b, 531, 40, 19992);
    			attr_dev(div4, "class", "card-controls");
    			add_location(div4, file$b, 530, 38, 19923);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			set_style(textarea, "height", "100px");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$b, 561, 40, 21757);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$b, 560, 38, 21692);
    			attr_dev(div6, "class", "card m-b-20 mt-3");
    			set_style(div6, "box-shadow", "none");
    			set_style(div6, "border", "1px grey solid");
    			add_location(div6, file$b, 518, 36, 19188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, span);
    			append_dev(span, t1);
    			append_dev(div6, t2);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, a);
    			append_dev(a, i1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(button, i2);
    			append_dev(button, t4);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div5, textarea);
    			set_input_value(textarea, /*antecedente*/ ctx[38].descripcion);
    			append_dev(div6, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler_1, false, false, false),
    					listen_dev(textarea, "input", textarea_input_handler),
    					listen_dev(textarea, "blur", /*actualizarAntecedentesPaciente*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*antecedentes*/ 32 && t1_value !== (t1_value = /*antecedente*/ ctx[38].nombre + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*antecedentes*/ 32) {
    				set_input_value(textarea, /*antecedente*/ ctx[38].descripcion);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(517:34) {#if antecedente.activo === true}",
    		ctx
    	});

    	return block;
    }

    // (515:30) {#each antecedentes as antecedente}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(515:30) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (474:16) {#each categoriasAntecedentes as categoria}
    function create_each_block$2(ctx) {
    	let div8;
    	let div1;
    	let div0;
    	let t0_value = /*categoria*/ ctx[35].nombre + "";
    	let t0;
    	let t1;
    	let div7;
    	let div2;
    	let t2;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let t3;
    	let each_value_2 = /*antecedentes*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*antecedentes*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div7 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			attr_dev(div0, "class", "card-title");
    			attr_dev(div0, "data-bind", "text: nombre");
    			add_location(div0, file$b, 479, 22, 17177);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$b, 478, 20, 17128);
    			attr_dev(div2, "class", "botones-antecedentes");
    			attr_dev(div2, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div2, file$b, 484, 22, 17397);
    			attr_dev(div3, "class", "col-lg-12");
    			attr_dev(div3, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div3, file$b, 510, 28, 18716);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$b, 509, 26, 18669);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$b, 508, 24, 18621);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$b, 507, 22, 18578);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$b, 483, 20, 17350);
    			attr_dev(div8, "class", "card  m-b-30");
    			set_style(div8, "box-shadow", "none");
    			set_style(div8, "border", "#32325d solid 1px");
    			add_location(div8, file$b, 474, 18, 16965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div7, t2);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div8, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categoriasAntecedentes*/ 16 && t0_value !== (t0_value = /*categoria*/ ctx[35].nombre + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*cambiarEstadoAntecedente, antecedentes, categoriasAntecedentes*/ 131120) {
    				each_value_2 = /*antecedentes*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*antecedentes, actualizarAntecedentesPaciente, eliminarAntecedente, categoriasAntecedentes*/ 81968) {
    				each_value_1 = /*antecedentes*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(474:16) {#each categoriasAntecedentes as categoria}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let t1;
    	let header;
    	let t2;
    	let section1;
    	let section0;
    	let cabeceraperfil;
    	let updating_cargando;
    	let updating_edad;
    	let updating_nombres;
    	let updating_apellidos;
    	let updating_cedula;
    	let updating_id;
    	let t3;
    	let div16;
    	let div15;
    	let div14;
    	let div0;
    	let ultimosvitales;
    	let t4;
    	let div6;
    	let div5;
    	let div3;
    	let div2;
    	let div1;
    	let i0;
    	let t5;
    	let t6;
    	let div4;
    	let t7;
    	let div13;
    	let div12;
    	let div9;
    	let div8;
    	let div7;
    	let i1;
    	let t8;
    	let span0;
    	let button0;
    	let i2;
    	let t10;
    	let t11;
    	let div11;
    	let div10;
    	let t12;
    	let modaldatospaciente;
    	let t13;
    	let div26;
    	let div25;
    	let div24;
    	let div20;
    	let h5;
    	let t15;
    	let button1;
    	let span1;
    	let t17;
    	let div19;
    	let div18;
    	let div17;
    	let i3;
    	let t18;
    	let i4;
    	let t20;
    	let div23;
    	let div22;
    	let div21;
    	let main_intro;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	let if_block = /*cargando*/ ctx[0] && create_if_block_4(ctx);
    	header = new Header({ $$inline: true });

    	function cabeceraperfil_cargando_binding(value) {
    		/*cabeceraperfil_cargando_binding*/ ctx[19].call(null, value);
    	}

    	function cabeceraperfil_edad_binding(value) {
    		/*cabeceraperfil_edad_binding*/ ctx[20].call(null, value);
    	}

    	function cabeceraperfil_nombres_binding(value) {
    		/*cabeceraperfil_nombres_binding*/ ctx[21].call(null, value);
    	}

    	function cabeceraperfil_apellidos_binding(value) {
    		/*cabeceraperfil_apellidos_binding*/ ctx[22].call(null, value);
    	}

    	function cabeceraperfil_cedula_binding(value) {
    		/*cabeceraperfil_cedula_binding*/ ctx[23].call(null, value);
    	}

    	function cabeceraperfil_id_binding(value) {
    		/*cabeceraperfil_id_binding*/ ctx[24].call(null, value);
    	}

    	let cabeceraperfil_props = { paciente: /*paciente*/ ctx[1] };

    	if (/*cargando*/ ctx[0] !== void 0) {
    		cabeceraperfil_props.cargando = /*cargando*/ ctx[0];
    	}

    	if (/*edad*/ ctx[2] !== void 0) {
    		cabeceraperfil_props.edad = /*edad*/ ctx[2];
    	}

    	if (/*paciente*/ ctx[1].nombres !== void 0) {
    		cabeceraperfil_props.nombres = /*paciente*/ ctx[1].nombres;
    	}

    	if (/*paciente*/ ctx[1].apellidos !== void 0) {
    		cabeceraperfil_props.apellidos = /*paciente*/ ctx[1].apellidos;
    	}

    	if (/*paciente*/ ctx[1].cedula !== void 0) {
    		cabeceraperfil_props.cedula = /*paciente*/ ctx[1].cedula;
    	}

    	if (/*paciente*/ ctx[1].id !== void 0) {
    		cabeceraperfil_props.id = /*paciente*/ ctx[1].id;
    	}

    	cabeceraperfil = new CabeceraPerfil({
    			props: cabeceraperfil_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(cabeceraperfil, "cargando", cabeceraperfil_cargando_binding));
    	binding_callbacks.push(() => bind(cabeceraperfil, "edad", cabeceraperfil_edad_binding));
    	binding_callbacks.push(() => bind(cabeceraperfil, "nombres", cabeceraperfil_nombres_binding));
    	binding_callbacks.push(() => bind(cabeceraperfil, "apellidos", cabeceraperfil_apellidos_binding));
    	binding_callbacks.push(() => bind(cabeceraperfil, "cedula", cabeceraperfil_cedula_binding));
    	binding_callbacks.push(() => bind(cabeceraperfil, "id", cabeceraperfil_id_binding));

    	ultimosvitales = new UltimosVitales({
    			props: {
    				peso: /*peso*/ ctx[7],
    				tipoPeso: /*tipoPeso*/ ctx[8],
    				temperatura: /*temperatura*/ ctx[9],
    				tipoTemperatura: /*tipoTemperatura*/ ctx[10],
    				frecuenciaRespiratoria: /*frecuenciaRespiratoria*/ ctx[11],
    				frecuenciaCardiaca: /*frecuenciaCardiaca*/ ctx[12],
    				presionAlterial: /*presionAlterial*/ ctx[13]
    			},
    			$$inline: true
    		});

    	let each_value_4 = /*historiasPaciente*/ ctx[6];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_3 = /*categoriasAntecedentes*/ ctx[4];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	modaldatospaciente = new ModalDatosPaciente({
    			props: {
    				paciente: /*paciente*/ ctx[1],
    				edad: /*edad*/ ctx[2],
    				seguro: /*seguro*/ ctx[3]
    			},
    			$$inline: true
    		});

    	let each_value = /*categoriasAntecedentes*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(header.$$.fragment);
    			t2 = space();
    			section1 = element("section");
    			section0 = element("section");
    			create_component(cabeceraperfil.$$.fragment);
    			t3 = space();
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div0 = element("div");
    			create_component(ultimosvitales.$$.fragment);
    			t4 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t5 = text("\r\n                  Historial atenciones");
    			t6 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t7 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			i1 = element("i");
    			t8 = space();
    			span0 = element("span");
    			span0.textContent = "Antecedentes  ";
    			button0 = element("button");
    			i2 = element("i");
    			t10 = text(" CAMBIAR  ");
    			t11 = space();
    			div11 = element("div");
    			div10 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t12 = space();
    			create_component(modaldatospaciente.$$.fragment);
    			t13 = space();
    			div26 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div20 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Antecedentes";
    			t15 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "×";
    			t17 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			i3 = element("i");
    			t18 = space();
    			i4 = element("i");
    			i4.textContent = "listo y guardado";
    			t20 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "col-lg-3 order-lg-1 order-sm-3");
    			add_location(div0, file$b, 200, 12, 5891);
    			attr_dev(i0, "class", "mdi mdi-progress-check mdi-18px");
    			add_location(i0, file$b, 321, 22, 11227);
    			attr_dev(div1, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div1, file$b, 320, 20, 11154);
    			attr_dev(div2, "class", "avatar mr-2 avatar-xs");
    			add_location(div2, file$b, 319, 18, 11097);
    			attr_dev(div3, "class", "card-header");
    			add_location(div3, file$b, 318, 16, 11052);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$b, 326, 16, 11408);
    			attr_dev(div5, "class", "card m-b-30");
    			add_location(div5, file$b, 317, 14, 11009);
    			attr_dev(div6, "class", "col-md-5 order-2 order-sm-1");
    			add_location(div6, file$b, 316, 12, 10952);
    			attr_dev(i1, "class", "mdi mdi-history mdi-18px");
    			add_location(i1, file$b, 347, 22, 12282);
    			attr_dev(div7, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div7, file$b, 346, 20, 12209);
    			attr_dev(div8, "class", "avatar mr-2 avatar-xs");
    			add_location(div8, file$b, 345, 18, 12152);
    			add_location(span0, file$b, 353, 18, 12499);
    			attr_dev(i2, "class", "mdi mdi-plus");
    			add_location(i2, file$b, 357, 21, 12716);
    			attr_dev(button0, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalAntecedentes");
    			add_location(button0, file$b, 353, 50, 12531);
    			attr_dev(div9, "class", "card-header");
    			add_location(div9, file$b, 344, 16, 12107);
    			attr_dev(div10, "class", "atenciones-vnc mb-3");
    			add_location(div10, file$b, 361, 18, 12871);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$b, 360, 16, 12828);
    			attr_dev(div12, "class", "card m-b-30");
    			add_location(div12, file$b, 343, 14, 12064);
    			attr_dev(div13, "class", "col-md-4 order-lg-12 order-sm-2");
    			add_location(div13, file$b, 342, 12, 12003);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$b, 199, 10, 5860);
    			attr_dev(div15, "class", "col-md-12");
    			add_location(div15, file$b, 198, 8, 5825);
    			attr_dev(div16, "class", "pull-up");
    			add_location(div16, file$b, 197, 6, 5794);
    			attr_dev(section0, "class", "admin-content");
    			add_location(section0, file$b, 187, 4, 5493);
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalAntecedentes");
    			add_location(h5, file$b, 450, 12, 16023);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$b, 457, 14, 16267);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$b, 451, 12, 16101);
    			attr_dev(i3, "class", "mdi mdi-check-all");
    			add_location(i3, file$b, 465, 18, 16599);
    			add_location(i4, file$b, 465, 50, 16631);
    			attr_dev(div17, "class", "guardando mr-2 text-success");
    			attr_dev(div17, "data-bind", "html: content, class: contentClass");
    			add_location(div17, file$b, 461, 16, 16435);
    			attr_dev(div18, "class", "guardar-documento");
    			add_location(div18, file$b, 460, 14, 16386);
    			set_style(div19, "margin-right", "40px");
    			add_location(div19, file$b, 459, 12, 16337);
    			attr_dev(div20, "class", "modal-header");
    			add_location(div20, file$b, 449, 10, 15983);
    			attr_dev(div21, "class", "col-lg-12");
    			attr_dev(div21, "data-bind", "foreach: gruposAntecedentes");
    			add_location(div21, file$b, 472, 14, 16821);
    			attr_dev(div22, "class", "row");
    			add_location(div22, file$b, 471, 12, 16788);
    			attr_dev(div23, "class", "modal-body");
    			add_location(div23, file$b, 470, 10, 16750);
    			attr_dev(div24, "class", "modal-content");
    			add_location(div24, file$b, 448, 8, 15944);
    			attr_dev(div25, "class", "modal-dialog");
    			attr_dev(div25, "role", "document");
    			add_location(div25, file$b, 447, 6, 15892);
    			attr_dev(div26, "class", "modal fade modal-slide-right");
    			attr_dev(div26, "id", "modalAntecedentes");
    			attr_dev(div26, "tabindex", "-1");
    			attr_dev(div26, "role", "dialog");
    			attr_dev(div26, "aria-labelledby", "modalAntecedentes");
    			set_style(div26, "display", "none");
    			attr_dev(div26, "aria-hidden", "true");
    			add_location(div26, file$b, 438, 4, 15658);
    			attr_dev(section1, "class", "admin-content");
    			add_location(section1, file$b, 186, 2, 5456);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$b, 179, 0, 5300);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(aside, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t1);
    			mount_component(header, main, null);
    			append_dev(main, t2);
    			append_dev(main, section1);
    			append_dev(section1, section0);
    			mount_component(cabeceraperfil, section0, null);
    			append_dev(section0, t3);
    			append_dev(section0, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div0);
    			mount_component(ultimosvitales, div0, null);
    			append_dev(div14, t4);
    			append_dev(div14, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, i0);
    			append_dev(div3, t5);
    			append_dev(div5, t6);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div4, null);
    			}

    			append_dev(div14, t7);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, i1);
    			append_dev(div9, t8);
    			append_dev(div9, span0);
    			append_dev(div9, button0);
    			append_dev(button0, i2);
    			append_dev(button0, t10);
    			append_dev(div12, t11);
    			append_dev(div12, div11);
    			append_dev(div11, div10);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div10, null);
    			}

    			append_dev(section1, t12);
    			mount_component(modaldatospaciente, section1, null);
    			append_dev(section1, t13);
    			append_dev(section1, div26);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div20);
    			append_dev(div20, h5);
    			append_dev(div20, t15);
    			append_dev(div20, button1);
    			append_dev(button1, span1);
    			append_dev(div20, t17);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, i3);
    			append_dev(div17, t18);
    			append_dev(div17, i4);
    			append_dev(div24, t20);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div21);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div21, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i1, "click", /*combinarAntecedentes*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*cargando*/ ctx[0]) {
    				if (if_block) {
    					if (dirty[0] & /*cargando*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const cabeceraperfil_changes = {};
    			if (dirty[0] & /*paciente*/ 2) cabeceraperfil_changes.paciente = /*paciente*/ ctx[1];

    			if (!updating_cargando && dirty[0] & /*cargando*/ 1) {
    				updating_cargando = true;
    				cabeceraperfil_changes.cargando = /*cargando*/ ctx[0];
    				add_flush_callback(() => updating_cargando = false);
    			}

    			if (!updating_edad && dirty[0] & /*edad*/ 4) {
    				updating_edad = true;
    				cabeceraperfil_changes.edad = /*edad*/ ctx[2];
    				add_flush_callback(() => updating_edad = false);
    			}

    			if (!updating_nombres && dirty[0] & /*paciente*/ 2) {
    				updating_nombres = true;
    				cabeceraperfil_changes.nombres = /*paciente*/ ctx[1].nombres;
    				add_flush_callback(() => updating_nombres = false);
    			}

    			if (!updating_apellidos && dirty[0] & /*paciente*/ 2) {
    				updating_apellidos = true;
    				cabeceraperfil_changes.apellidos = /*paciente*/ ctx[1].apellidos;
    				add_flush_callback(() => updating_apellidos = false);
    			}

    			if (!updating_cedula && dirty[0] & /*paciente*/ 2) {
    				updating_cedula = true;
    				cabeceraperfil_changes.cedula = /*paciente*/ ctx[1].cedula;
    				add_flush_callback(() => updating_cedula = false);
    			}

    			if (!updating_id && dirty[0] & /*paciente*/ 2) {
    				updating_id = true;
    				cabeceraperfil_changes.id = /*paciente*/ ctx[1].id;
    				add_flush_callback(() => updating_id = false);
    			}

    			cabeceraperfil.$set(cabeceraperfil_changes);
    			const ultimosvitales_changes = {};
    			if (dirty[0] & /*peso*/ 128) ultimosvitales_changes.peso = /*peso*/ ctx[7];
    			if (dirty[0] & /*tipoPeso*/ 256) ultimosvitales_changes.tipoPeso = /*tipoPeso*/ ctx[8];
    			if (dirty[0] & /*temperatura*/ 512) ultimosvitales_changes.temperatura = /*temperatura*/ ctx[9];
    			if (dirty[0] & /*tipoTemperatura*/ 1024) ultimosvitales_changes.tipoTemperatura = /*tipoTemperatura*/ ctx[10];
    			if (dirty[0] & /*frecuenciaRespiratoria*/ 2048) ultimosvitales_changes.frecuenciaRespiratoria = /*frecuenciaRespiratoria*/ ctx[11];
    			if (dirty[0] & /*frecuenciaCardiaca*/ 4096) ultimosvitales_changes.frecuenciaCardiaca = /*frecuenciaCardiaca*/ ctx[12];
    			if (dirty[0] & /*presionAlterial*/ 8192) ultimosvitales_changes.presionAlterial = /*presionAlterial*/ ctx[13];
    			ultimosvitales.$set(ultimosvitales_changes);

    			if (dirty[0] & /*historiasPaciente, paciente*/ 66) {
    				each_value_4 = /*historiasPaciente*/ ctx[6];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(div4, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_4.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*categoriasAntecedentes, paciente*/ 18) {
    				each_value_3 = /*categoriasAntecedentes*/ ctx[4];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div10, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks_1.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			const modaldatospaciente_changes = {};
    			if (dirty[0] & /*paciente*/ 2) modaldatospaciente_changes.paciente = /*paciente*/ ctx[1];
    			if (dirty[0] & /*edad*/ 4) modaldatospaciente_changes.edad = /*edad*/ ctx[2];
    			if (dirty[0] & /*seguro*/ 8) modaldatospaciente_changes.seguro = /*seguro*/ ctx[3];
    			modaldatospaciente.$set(modaldatospaciente_changes);

    			if (dirty[0] & /*antecedentes, actualizarAntecedentesPaciente, eliminarAntecedente, categoriasAntecedentes, cambiarEstadoAntecedente*/ 213040) {
    				each_value = /*categoriasAntecedentes*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div21, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(header.$$.fragment, local);
    			transition_in(cabeceraperfil.$$.fragment, local);
    			transition_in(ultimosvitales.$$.fragment, local);

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(modaldatospaciente.$$.fragment, local);

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
    			transition_out(if_block);
    			transition_out(header.$$.fragment, local);
    			transition_out(cabeceraperfil.$$.fragment, local);
    			transition_out(ultimosvitales.$$.fragment, local);
    			each_blocks_2 = each_blocks_2.filter(Boolean);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(modaldatospaciente.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(header);
    			destroy_component(cabeceraperfil);
    			destroy_component(ultimosvitales);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(modaldatospaciente);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function calcularEdad$1(fecha) {
    	var hoy = new Date();
    	var cumpleanos = new Date(fecha);
    	var edad = hoy.getFullYear() - cumpleanos.getFullYear();
    	var m = hoy.getMonth() - cumpleanos.getMonth();

    	if (m < 0 || m === 0 && hoy.getDate() < cumpleanos.getDate()) {
    		edad--;
    	}

    	return edad;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PacientePerfil", slots, []);
    	let { params = "" } = $$props;
    	let cargando = false;
    	let paciente = {};
    	let edad = "";
    	let seguro = "";
    	let categoriasAntecedentes = [];
    	let antecedentes = [];
    	let historiasPaciente = [];
    	let peso = "";
    	let tipoPeso = "";
    	let temperatura = "";
    	let tipoTemperatura = "";
    	let frecuenciaRespiratoria = "";
    	let frecuenciaCardiaca = "";
    	let presionAlterial = "";

    	const cargarHistoriasPaciente = async () => {
    		try {
    			const config = {
    				method: "get",
    				url: `${url}/historias/paciente/${params.id}`,
    				headers: {
    					"Authorization": `${localStorage.getItem("auth")}`
    				}
    			};

    			let promesa = await axios$1(config);
    			$$invalidate(6, historiasPaciente = promesa.data);
    			$$invalidate(7, peso = promesa.data[0].peso.valor);
    			$$invalidate(8, tipoPeso = promesa.data[0].peso.tipo);
    			$$invalidate(9, temperatura = promesa.data[0].temperatura.valor);
    			$$invalidate(10, tipoTemperatura = promesa.data[0].temperatura.tipo);
    			$$invalidate(11, frecuenciaRespiratoria = promesa.data[0].frecuenciaRespiratoria);
    			$$invalidate(12, frecuenciaCardiaca = promesa.data[0].frecuenciaCardiaca);
    			$$invalidate(13, presionAlterial = `${promesa.data[0].presionAlterial.mm}/${promesa.data[0].presionAlterial.Hg}`);
    		} catch(error) {
    			console.log(error);
    		}
    	};

    	function actualizarAntecedentesPaciente() {
    		$$invalidate(1, paciente.antecedentes = antecedentes, paciente);

    		const config = {
    			method: "put",
    			url: `${url}/pacientes/${paciente.id}`,
    			data: paciente,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			console.log(res.data);
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	const combinarAntecedentes = () => {
    		for (const ant of paciente.antecedentes) {
    			if (ant.activo == true) {
    				const index = antecedentes.findIndex(x => x.id === ant.id);
    				$$invalidate(5, antecedentes[index].activo = ant.activo, antecedentes);
    				$$invalidate(5, antecedentes[index].descripcion = ant.descripcion, antecedentes);
    			}
    		}
    	};

    	function eliminarAntecedente(idAntecedente) {
    		const index = antecedentes.findIndex(x => x.id === idAntecedente);
    		$$invalidate(5, antecedentes[index].activo = false, antecedentes);
    		actualizarAntecedentesPaciente();
    	}

    	function cambiarEstadoAntecedente(idAntecedente) {
    		const index = antecedentes.findIndex(x => x.id === idAntecedente);
    		$$invalidate(5, antecedentes[index].activo = true, antecedentes);
    		actualizarAntecedentesPaciente();
    	}

    	async function cargarAntecedentes() {
    		const config = {
    			method: "get",
    			url: `${url}/antecedentes`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		let promesa = await axios$1(config);

    		if (promesa.status == 200) {
    			$$invalidate(5, antecedentes = promesa.data);
    		} else {
    			console.error(promesa.statusText);
    		}
    	}

    	function cargarCategoriasAntecedentes() {
    		const config = {
    			method: "get",
    			url: `${url}/categorias/antecedentes`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, categoriasAntecedentes = res.data);
    		});
    	}

    	async function cargarPaciente() {
    		$$invalidate(0, cargando = true);

    		const config = {
    			method: "get",
    			url: `${url}/pacientes/${params.id}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			let promesa = await axios$1(config);

    			if (promesa.status == 200) {
    				$$invalidate(0, cargando = false);
    				$$invalidate(1, paciente = promesa.data);
    				$$invalidate(2, edad = calcularEdad$1(paciente.fechaNacimiento));

    				if (paciente.seguroMedico.length !== 0) {
    					$$invalidate(3, seguro = paciente.seguroMedico[0].nombre);
    				} else {
    					$$invalidate(3, seguro = "N/A");
    				}
    			}
    		} catch(error) {
    			$$invalidate(0, cargando = false);
    			console.error(error);
    		}
    	}

    	onMount(async () => {
    		jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    		await cargarPaciente();
    		await cargarAntecedentes();
    		await cargarHistoriasPaciente();
    		cargarCategoriasAntecedentes();
    		combinarAntecedentes();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<PacientePerfil> was created with unknown prop '${key}'`);
    	});

    	function cabeceraperfil_cargando_binding(value) {
    		cargando = value;
    		$$invalidate(0, cargando);
    	}

    	function cabeceraperfil_edad_binding(value) {
    		edad = value;
    		$$invalidate(2, edad);
    	}

    	function cabeceraperfil_nombres_binding(value) {
    		paciente.nombres = value;
    		$$invalidate(1, paciente);
    	}

    	function cabeceraperfil_apellidos_binding(value) {
    		paciente.apellidos = value;
    		$$invalidate(1, paciente);
    	}

    	function cabeceraperfil_cedula_binding(value) {
    		paciente.cedula = value;
    		$$invalidate(1, paciente);
    	}

    	function cabeceraperfil_id_binding(value) {
    		paciente.id = value;
    		$$invalidate(1, paciente);
    	}

    	function tarjetaantecedentes_id_binding(value, categoria) {
    		categoria.id = value;
    		$$invalidate(4, categoriasAntecedentes);
    	}

    	function tarjetaantecedentes_nombre_binding(value, categoria) {
    		categoria.nombre = value;
    		$$invalidate(4, categoriasAntecedentes);
    	}

    	function tarjetaantecedentes_antecedentes_binding(value) {
    		paciente.antecedentes = value;
    		$$invalidate(1, paciente);
    	}

    	const click_handler = antecedente => cambiarEstadoAntecedente(antecedente.id);
    	const click_handler_1 = antecedente => eliminarAntecedente(antecedente.id);

    	function textarea_input_handler(each_value_1, antecedente_index) {
    		each_value_1[antecedente_index].descripcion = this.value;
    		$$invalidate(5, antecedentes);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(18, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		push,
    		axios: axios$1,
    		onMount,
    		tick,
    		url,
    		Header,
    		Aside,
    		Evoluciones,
    		UltimosVitales,
    		Loading,
    		CabeceraPerfil,
    		ModalDatosPaciente,
    		TarjetaAntecedentes,
    		params,
    		cargando,
    		paciente,
    		edad,
    		seguro,
    		categoriasAntecedentes,
    		antecedentes,
    		historiasPaciente,
    		peso,
    		tipoPeso,
    		temperatura,
    		tipoTemperatura,
    		frecuenciaRespiratoria,
    		frecuenciaCardiaca,
    		presionAlterial,
    		cargarHistoriasPaciente,
    		actualizarAntecedentesPaciente,
    		combinarAntecedentes,
    		eliminarAntecedente,
    		cambiarEstadoAntecedente,
    		cargarAntecedentes,
    		cargarCategoriasAntecedentes,
    		cargarPaciente,
    		calcularEdad: calcularEdad$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(18, params = $$props.params);
    		if ("cargando" in $$props) $$invalidate(0, cargando = $$props.cargando);
    		if ("paciente" in $$props) $$invalidate(1, paciente = $$props.paciente);
    		if ("edad" in $$props) $$invalidate(2, edad = $$props.edad);
    		if ("seguro" in $$props) $$invalidate(3, seguro = $$props.seguro);
    		if ("categoriasAntecedentes" in $$props) $$invalidate(4, categoriasAntecedentes = $$props.categoriasAntecedentes);
    		if ("antecedentes" in $$props) $$invalidate(5, antecedentes = $$props.antecedentes);
    		if ("historiasPaciente" in $$props) $$invalidate(6, historiasPaciente = $$props.historiasPaciente);
    		if ("peso" in $$props) $$invalidate(7, peso = $$props.peso);
    		if ("tipoPeso" in $$props) $$invalidate(8, tipoPeso = $$props.tipoPeso);
    		if ("temperatura" in $$props) $$invalidate(9, temperatura = $$props.temperatura);
    		if ("tipoTemperatura" in $$props) $$invalidate(10, tipoTemperatura = $$props.tipoTemperatura);
    		if ("frecuenciaRespiratoria" in $$props) $$invalidate(11, frecuenciaRespiratoria = $$props.frecuenciaRespiratoria);
    		if ("frecuenciaCardiaca" in $$props) $$invalidate(12, frecuenciaCardiaca = $$props.frecuenciaCardiaca);
    		if ("presionAlterial" in $$props) $$invalidate(13, presionAlterial = $$props.presionAlterial);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cargando,
    		paciente,
    		edad,
    		seguro,
    		categoriasAntecedentes,
    		antecedentes,
    		historiasPaciente,
    		peso,
    		tipoPeso,
    		temperatura,
    		tipoTemperatura,
    		frecuenciaRespiratoria,
    		frecuenciaCardiaca,
    		presionAlterial,
    		actualizarAntecedentesPaciente,
    		combinarAntecedentes,
    		eliminarAntecedente,
    		cambiarEstadoAntecedente,
    		params,
    		cabeceraperfil_cargando_binding,
    		cabeceraperfil_edad_binding,
    		cabeceraperfil_nombres_binding,
    		cabeceraperfil_apellidos_binding,
    		cabeceraperfil_cedula_binding,
    		cabeceraperfil_id_binding,
    		tarjetaantecedentes_id_binding,
    		tarjetaantecedentes_nombre_binding,
    		tarjetaantecedentes_antecedentes_binding,
    		click_handler,
    		click_handler_1,
    		textarea_input_handler
    	];
    }

    class PacientePerfil extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { params: 18 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacientePerfil",
    			options,
    			id: create_fragment$c.name
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
    const file$c = "src\\componentes\\Select2.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (23:4) {#each datos as item}
    function create_each_block$3(ctx) {
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
    			add_location(option, file$c, 23, 8, 533);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(23:4) {#each datos as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
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
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    			add_location(label_1, file$c, 15, 0, 334);
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$c, 21, 4, 455);
    			attr_dev(select, "class", select_class_value = `form-control ${/*id*/ ctx[0]}`);
    			set_style(select, "width", "100%");
    			attr_dev(select, "id", /*id*/ ctx[0]);
    			add_location(select, file$c, 16, 0, 367);
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
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
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
    			id: create_fragment$d.name
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

    const { console: console_1$5 } = globals;
    const file$d = "src\\Pages\\Pacientes\\PacienteCrear.svelte";

    function create_fragment$e(ctx) {
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
    	let div40;
    	let div39;
    	let div38;
    	let div37;
    	let div36;
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
    	let div26;
    	let div24;
    	let select20;
    	let updating_valor;
    	let t50;
    	let div25;
    	let label11;
    	let t52;
    	let input9;
    	let div27_class_value;
    	let t53;
    	let h52;
    	let t55;
    	let hr1;
    	let t56;
    	let div30;
    	let div28;
    	let select21;
    	let updating_valor_1;
    	let t57;
    	let div29;
    	let select22;
    	let updating_valor_2;
    	let t58;
    	let div32;
    	let div31;
    	let select23;
    	let updating_valor_3;
    	let t59;
    	let div34;
    	let div33;
    	let label12;
    	let t61;
    	let input10;
    	let t62;
    	let div35;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

    	function select20_valor_binding(value) {
    		/*select20_valor_binding*/ ctx[30].call(null, value);
    	}

    	let select20_props = {
    		id: "sltAseguradoras",
    		datos: /*aseguradoras*/ ctx[1],
    		placeholder: " - seleccionar aseguradora - ",
    		label: "Aseguradora"
    	};

    	if (/*aseguradora*/ ctx[2] !== void 0) {
    		select20_props.valor = /*aseguradora*/ ctx[2];
    	}

    	select20 = new Select2({ props: select20_props, $$inline: true });
    	binding_callbacks.push(() => bind(select20, "valor", select20_valor_binding));

    	function select21_valor_binding(value) {
    		/*select21_valor_binding*/ ctx[32].call(null, value);
    	}

    	let select21_props = {
    		id: "sltCiudad",
    		datos: ciudades,
    		placeholder: " - seleccionar ciudad - ",
    		label: "Ciudad"
    	};

    	if (/*ciudad*/ ctx[14] !== void 0) {
    		select21_props.valor = /*ciudad*/ ctx[14];
    	}

    	select21 = new Select2({ props: select21_props, $$inline: true });
    	binding_callbacks.push(() => bind(select21, "valor", select21_valor_binding));

    	function select22_valor_binding(value) {
    		/*select22_valor_binding*/ ctx[33].call(null, value);
    	}

    	let select22_props = {
    		id: "sltProvincia",
    		datos: provincias,
    		placeholder: " - seleccionar provincia - ",
    		label: "Provincia"
    	};

    	if (/*provincia*/ ctx[15] !== void 0) {
    		select22_props.valor = /*provincia*/ ctx[15];
    	}

    	select22 = new Select2({ props: select22_props, $$inline: true });
    	binding_callbacks.push(() => bind(select22, "valor", select22_valor_binding));

    	function select23_valor_binding(value) {
    		/*select23_valor_binding*/ ctx[34].call(null, value);
    	}

    	let select23_props = {
    		id: "sltNacionalidad",
    		datos: nacionalidades,
    		placeholder: " - seleccionar nacionalidad - ",
    		label: "Nacionalidad"
    	};

    	if (/*nacionalidad*/ ctx[8] !== void 0) {
    		select23_props.valor = /*nacionalidad*/ ctx[8];
    	}

    	select23 = new Select2({ props: select23_props, $$inline: true });
    	binding_callbacks.push(() => bind(select23, "valor", select23_valor_binding));

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
    			div40 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			div37 = element("div");
    			div36 = element("div");
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
    			div26 = element("div");
    			div24 = element("div");
    			create_component(select20.$$.fragment);
    			t50 = space();
    			div25 = element("div");
    			label11 = element("label");
    			label11.textContent = "No. Afiliado";
    			t52 = space();
    			input9 = element("input");
    			t53 = space();
    			h52 = element("h5");
    			h52.textContent = "Direccion";
    			t55 = space();
    			hr1 = element("hr");
    			t56 = space();
    			div30 = element("div");
    			div28 = element("div");
    			create_component(select21.$$.fragment);
    			t57 = space();
    			div29 = element("div");
    			create_component(select22.$$.fragment);
    			t58 = space();
    			div32 = element("div");
    			div31 = element("div");
    			create_component(select23.$$.fragment);
    			t59 = space();
    			div34 = element("div");
    			div33 = element("div");
    			label12 = element("label");
    			label12.textContent = "Direccion";
    			t61 = space();
    			input10 = element("input");
    			t62 = space();
    			div35 = element("div");
    			button = element("button");
    			button.textContent = "Guardar";
    			attr_dev(div0, "class", "avatar-title bg-info rounded-circle mdi mdi-account-circle-outline");
    			add_location(div0, file$d, 177, 28, 5804);
    			attr_dev(div1, "class", "avatar avatar-lg ");
    			add_location(div1, file$d, 176, 24, 5743);
    			attr_dev(div2, "class", "m-b-10");
    			add_location(div2, file$d, 175, 20, 5697);
    			add_location(h3, file$d, 180, 20, 5972);
    			attr_dev(div3, "class", "col-lg-8 text-center mx-auto text-white p-b-30");
    			add_location(div3, file$d, 174, 16, 5615);
    			attr_dev(div4, "class", "row p-b-60 p-t-60");
    			add_location(div4, file$d, 173, 12, 5566);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$d, 172, 8, 5529);
    			attr_dev(div6, "class", "bg-dark bg-dots m-b-30");
    			add_location(div6, file$d, 171, 4, 5483);
    			attr_dev(h50, "class", "");
    			add_location(h50, file$d, 192, 32, 6431);
    			attr_dev(label0, "for", "inpNombre");
    			add_location(label0, file$d, 195, 40, 6634);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "inpNombre");
    			attr_dev(input0, "placeholder", "John");
    			input0.required = true;
    			add_location(input0, file$d, 196, 40, 6713);
    			attr_dev(div7, "class", "form-group col-md-6");
    			add_location(div7, file$d, 194, 36, 6559);
    			attr_dev(label1, "for", "inpApellido");
    			add_location(label1, file$d, 206, 40, 7287);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "inpApellido");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Doe");
    			input1.required = true;
    			add_location(input1, file$d, 207, 40, 7371);
    			attr_dev(div8, "class", "form-group col-md-6");
    			add_location(div8, file$d, 205, 36, 7212);
    			attr_dev(div9, "class", "form-row");
    			add_location(div9, file$d, 193, 32, 6499);
    			attr_dev(label2, "for", "inpApodo");
    			add_location(label2, file$d, 219, 40, 8044);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "inpApodo");
    			add_location(input2, file$d, 220, 40, 8121);
    			attr_dev(div10, "class", "form-group col-md-6");
    			add_location(div10, file$d, 218, 36, 7969);
    			attr_dev(label3, "for", "sltSexo");
    			add_location(label3, file$d, 228, 40, 8574);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			option0.disabled = true;
    			add_location(option0, file$d, 235, 44, 8986);
    			option1.__value = "Masculino";
    			option1.value = option1.__value;
    			add_location(option1, file$d, 236, 44, 9098);
    			option2.__value = "Femenino";
    			option2.value = option2.__value;
    			add_location(option2, file$d, 237, 44, 9188);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltSexo");
    			select0.required = true;
    			if (/*sexo*/ ctx[6] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[22].call(select0));
    			add_location(select0, file$d, 229, 40, 8649);
    			attr_dev(div11, "class", "form-group col-md-6");
    			add_location(div11, file$d, 227, 36, 8499);
    			attr_dev(div12, "class", "form-row");
    			add_location(div12, file$d, 217, 32, 7909);
    			attr_dev(label4, "for", "inpFechaNacimiento");
    			add_location(label4, file$d, 243, 40, 9534);
    			attr_dev(input3, "type", "date");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "inpFechaNacimiento");
    			input3.required = true;
    			add_location(input3, file$d, 244, 40, 9635);
    			attr_dev(div13, "class", "form-group col-md-6");
    			add_location(div13, file$d, 242, 36, 9459);
    			attr_dev(label5, "for", "sltTipoDocumento");
    			add_location(label5, file$d, 253, 40, 10161);
    			option3.__value = "";
    			option3.value = option3.__value;
    			option3.selected = true;
    			option3.disabled = true;
    			add_location(option3, file$d, 260, 44, 10613);
    			option4.__value = "C";
    			option4.value = option4.__value;
    			add_location(option4, file$d, 261, 44, 10725);
    			option5.__value = "P";
    			option5.value = option5.__value;
    			add_location(option5, file$d, 262, 44, 10804);
    			attr_dev(select1, "class", "form-control");
    			attr_dev(select1, "id", "sltTipoDocumento");
    			select1.required = true;
    			if (/*tipoDocumento*/ ctx[12] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[24].call(select1));
    			add_location(select1, file$d, 254, 40, 10258);
    			attr_dev(div14, "class", "form-group col-md-6");
    			add_location(div14, file$d, 252, 36, 10086);
    			attr_dev(div15, "class", "form-row");
    			add_location(div15, file$d, 241, 32, 9399);
    			attr_dev(label6, "for", "inpNumeroDocumento");
    			add_location(label6, file$d, 268, 40, 11144);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "inpNumeroDocumento");
    			add_location(input4, file$d, 269, 40, 11248);
    			attr_dev(div16, "class", "form-group col-md-6");
    			add_location(div16, file$d, 267, 36, 11069);
    			attr_dev(label7, "for", "inpTelefono");
    			add_location(label7, file$d, 277, 40, 11715);
    			attr_dev(input5, "type", "tel");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "id", "inpTelefono");
    			add_location(input5, file$d, 278, 40, 11798);
    			attr_dev(div17, "class", "form-group col-md-6");
    			add_location(div17, file$d, 276, 36, 11640);
    			attr_dev(div18, "class", "form-row");
    			add_location(div18, file$d, 266, 32, 11009);
    			attr_dev(label8, "for", "inpCelular");
    			add_location(label8, file$d, 288, 40, 12352);
    			attr_dev(input6, "type", "tel");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "id", "inpCelular");
    			add_location(input6, file$d, 289, 40, 12433);
    			attr_dev(div19, "class", "form-group col-md-6");
    			add_location(div19, file$d, 287, 36, 12277);
    			attr_dev(label9, "for", "inpCorreo");
    			add_location(label9, file$d, 297, 40, 12889);
    			attr_dev(input7, "type", "email");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "id", "inpCorreo");
    			add_location(input7, file$d, 298, 40, 12980);
    			attr_dev(div20, "class", "form-group col-md-6");
    			add_location(div20, file$d, 296, 36, 12814);
    			attr_dev(div21, "class", "form-row");
    			add_location(div21, file$d, 286, 32, 12217);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "name", "option");
    			input8.__value = "1";
    			input8.value = input8.__value;
    			attr_dev(input8, "class", "cstm-switch-input");
    			add_location(input8, file$d, 309, 44, 13594);
    			attr_dev(span0, "class", "cstm-switch-indicator bg-success ");
    			add_location(span0, file$d, 310, 44, 13738);
    			attr_dev(span1, "class", "cstm-switch-description");
    			add_location(span1, file$d, 311, 44, 13839);
    			attr_dev(label10, "class", "cstm-switch");
    			add_location(label10, file$d, 308, 40, 13521);
    			attr_dev(div22, "class", " m-b-10");
    			add_location(div22, file$d, 307, 36, 13458);
    			attr_dev(div23, "class", "form-group");
    			add_location(div23, file$d, 306, 32, 13396);
    			add_location(h51, file$d, 316, 40, 14252);
    			add_location(hr0, file$d, 317, 40, 14324);
    			attr_dev(div24, "class", "form-group col-md-6");
    			add_location(div24, file$d, 319, 44, 14438);
    			attr_dev(label11, "for", "inpNoAfiliado");
    			add_location(label11, file$d, 329, 48, 15136);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "form-control");
    			attr_dev(input9, "id", "inpNoAfiliado");
    			add_location(input9, file$d, 330, 48, 15233);
    			attr_dev(div25, "class", "form-group col-md-6");
    			add_location(div25, file$d, 328, 44, 15053);
    			attr_dev(div26, "class", "form-row");
    			add_location(div26, file$d, 318, 40, 14370);

    			attr_dev(div27, "class", div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn");

    			add_location(div27, file$d, 315, 36, 14080);
    			attr_dev(h52, "class", "mt-3");
    			add_location(h52, file$d, 339, 32, 15761);
    			add_location(hr1, file$d, 340, 32, 15826);
    			attr_dev(div28, "class", "form-group col-md-6");
    			add_location(div28, file$d, 342, 36, 15924);
    			attr_dev(div29, "class", "form-group col-md-6");
    			add_location(div29, file$d, 351, 36, 16494);
    			attr_dev(div30, "class", "form-row");
    			add_location(div30, file$d, 341, 32, 15864);
    			attr_dev(div31, "class", "form-group col-md-6");
    			add_location(div31, file$d, 371, 36, 17748);
    			attr_dev(div32, "class", "form-row");
    			add_location(div32, file$d, 361, 32, 17090);
    			attr_dev(label12, "for", "inpDireccion");
    			add_location(label12, file$d, 383, 40, 18496);
    			attr_dev(input10, "type", "text");
    			attr_dev(input10, "class", "form-control");
    			attr_dev(input10, "id", "inpDireccion");
    			add_location(input10, file$d, 384, 40, 18581);
    			attr_dev(div33, "class", "form-group col-md-12");
    			add_location(div33, file$d, 382, 36, 18420);
    			attr_dev(div34, "class", "form-row");
    			add_location(div34, file$d, 381, 32, 18360);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-success btn-cta");
    			add_location(button, file$d, 393, 36, 19065);
    			attr_dev(div35, "class", "text-right");
    			add_location(div35, file$d, 392, 32, 19003);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$d, 191, 27, 6374);
    			attr_dev(div37, "class", "card py-3 m-b-30");
    			add_location(div37, file$d, 190, 23, 6315);
    			attr_dev(div38, "class", "col-lg-8 mx-auto  mt-2");
    			add_location(div38, file$d, 189, 20, 6254);
    			attr_dev(div39, "class", "row ");
    			add_location(div39, file$d, 188, 16, 6214);
    			attr_dev(div40, "class", "container");
    			add_location(div40, file$d, 187, 12, 6173);
    			attr_dev(section0, "class", "pull-up");
    			add_location(section0, file$d, 186, 8, 6134);
    			add_location(form, file$d, 185, 4, 6073);
    			attr_dev(section1, "class", "admin-content ");
    			add_location(section1, file$d, 170, 2, 5445);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$d, 168, 0, 5402);
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
    			append_dev(section0, div40);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, div37);
    			append_dev(div37, div36);
    			append_dev(div36, h50);
    			append_dev(div36, t6);
    			append_dev(div36, div9);
    			append_dev(div9, div7);
    			append_dev(div7, label0);
    			append_dev(div7, t8);
    			append_dev(div7, input0);
    			set_input_value(input0, /*nombres*/ ctx[3]);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, label1);
    			append_dev(div8, t11);
    			append_dev(div8, input1);
    			set_input_value(input1, /*apellidos*/ ctx[4]);
    			append_dev(div36, t12);
    			append_dev(div36, div12);
    			append_dev(div12, div10);
    			append_dev(div10, label2);
    			append_dev(div10, t14);
    			append_dev(div10, input2);
    			set_input_value(input2, /*apodo*/ ctx[5]);
    			append_dev(div12, t15);
    			append_dev(div12, div11);
    			append_dev(div11, label3);
    			append_dev(div11, t17);
    			append_dev(div11, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*sexo*/ ctx[6]);
    			append_dev(div36, t21);
    			append_dev(div36, div15);
    			append_dev(div15, div13);
    			append_dev(div13, label4);
    			append_dev(div13, t23);
    			append_dev(div13, input3);
    			set_input_value(input3, /*fechaNacimiento*/ ctx[7]);
    			append_dev(div15, t24);
    			append_dev(div15, div14);
    			append_dev(div14, label5);
    			append_dev(div14, t26);
    			append_dev(div14, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			select_option(select1, /*tipoDocumento*/ ctx[12]);
    			append_dev(div36, t30);
    			append_dev(div36, div18);
    			append_dev(div18, div16);
    			append_dev(div16, label6);
    			append_dev(div16, t32);
    			append_dev(div16, input4);
    			set_input_value(input4, /*cedula*/ ctx[11]);
    			append_dev(div18, t33);
    			append_dev(div18, div17);
    			append_dev(div17, label7);
    			append_dev(div17, t35);
    			append_dev(div17, input5);
    			set_input_value(input5, /*telefono*/ ctx[9]);
    			append_dev(div36, t36);
    			append_dev(div36, div21);
    			append_dev(div21, div19);
    			append_dev(div19, label8);
    			append_dev(div19, t38);
    			append_dev(div19, input6);
    			set_input_value(input6, /*celular*/ ctx[10]);
    			append_dev(div21, t39);
    			append_dev(div21, div20);
    			append_dev(div20, label9);
    			append_dev(div20, t41);
    			append_dev(div20, input7);
    			set_input_value(input7, /*email*/ ctx[17]);
    			append_dev(div36, t42);
    			append_dev(div36, div23);
    			append_dev(div23, div22);
    			append_dev(div22, label10);
    			append_dev(label10, input8);
    			input8.checked = /*asegurado*/ ctx[0];
    			append_dev(label10, t43);
    			append_dev(label10, span0);
    			append_dev(label10, t44);
    			append_dev(label10, span1);
    			append_dev(div36, t46);
    			append_dev(div36, div27);
    			append_dev(div27, h51);
    			append_dev(div27, t48);
    			append_dev(div27, hr0);
    			append_dev(div27, t49);
    			append_dev(div27, div26);
    			append_dev(div26, div24);
    			mount_component(select20, div24, null);
    			append_dev(div26, t50);
    			append_dev(div26, div25);
    			append_dev(div25, label11);
    			append_dev(div25, t52);
    			append_dev(div25, input9);
    			set_input_value(input9, /*numeroSeguro*/ ctx[13]);
    			append_dev(div36, t53);
    			append_dev(div36, h52);
    			append_dev(div36, t55);
    			append_dev(div36, hr1);
    			append_dev(div36, t56);
    			append_dev(div36, div30);
    			append_dev(div30, div28);
    			mount_component(select21, div28, null);
    			append_dev(div30, t57);
    			append_dev(div30, div29);
    			mount_component(select22, div29, null);
    			append_dev(div36, t58);
    			append_dev(div36, div32);
    			append_dev(div32, div31);
    			mount_component(select23, div31, null);
    			append_dev(div36, t59);
    			append_dev(div36, div34);
    			append_dev(div34, div33);
    			append_dev(div33, label12);
    			append_dev(div33, t61);
    			append_dev(div33, input10);
    			set_input_value(input10, /*direccion*/ ctx[16]);
    			append_dev(div36, t62);
    			append_dev(div36, div35);
    			append_dev(div35, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[19]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[21]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[22]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[23]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[24]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[25]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[26]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[27]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[28]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[29]),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[31]),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[35]),
    					listen_dev(form, "submit", prevent_default(/*registrarPaciente*/ ctx[18]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*nombres*/ 8 && input0.value !== /*nombres*/ ctx[3]) {
    				set_input_value(input0, /*nombres*/ ctx[3]);
    			}

    			if (dirty[0] & /*apellidos*/ 16 && input1.value !== /*apellidos*/ ctx[4]) {
    				set_input_value(input1, /*apellidos*/ ctx[4]);
    			}

    			if (dirty[0] & /*apodo*/ 32 && input2.value !== /*apodo*/ ctx[5]) {
    				set_input_value(input2, /*apodo*/ ctx[5]);
    			}

    			if (dirty[0] & /*sexo*/ 64) {
    				select_option(select0, /*sexo*/ ctx[6]);
    			}

    			if (dirty[0] & /*fechaNacimiento*/ 128) {
    				set_input_value(input3, /*fechaNacimiento*/ ctx[7]);
    			}

    			if (dirty[0] & /*tipoDocumento*/ 4096) {
    				select_option(select1, /*tipoDocumento*/ ctx[12]);
    			}

    			if (dirty[0] & /*cedula*/ 2048 && to_number(input4.value) !== /*cedula*/ ctx[11]) {
    				set_input_value(input4, /*cedula*/ ctx[11]);
    			}

    			if (dirty[0] & /*telefono*/ 512) {
    				set_input_value(input5, /*telefono*/ ctx[9]);
    			}

    			if (dirty[0] & /*celular*/ 1024) {
    				set_input_value(input6, /*celular*/ ctx[10]);
    			}

    			if (dirty[0] & /*email*/ 131072 && input7.value !== /*email*/ ctx[17]) {
    				set_input_value(input7, /*email*/ ctx[17]);
    			}

    			if (dirty[0] & /*asegurado*/ 1) {
    				input8.checked = /*asegurado*/ ctx[0];
    			}

    			const select20_changes = {};
    			if (dirty[0] & /*aseguradoras*/ 2) select20_changes.datos = /*aseguradoras*/ ctx[1];

    			if (!updating_valor && dirty[0] & /*aseguradora*/ 4) {
    				updating_valor = true;
    				select20_changes.valor = /*aseguradora*/ ctx[2];
    				add_flush_callback(() => updating_valor = false);
    			}

    			select20.$set(select20_changes);

    			if (dirty[0] & /*numeroSeguro*/ 8192 && to_number(input9.value) !== /*numeroSeguro*/ ctx[13]) {
    				set_input_value(input9, /*numeroSeguro*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*asegurado*/ 1 && div27_class_value !== (div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn")) {
    				attr_dev(div27, "class", div27_class_value);
    			}

    			const select21_changes = {};

    			if (!updating_valor_1 && dirty[0] & /*ciudad*/ 16384) {
    				updating_valor_1 = true;
    				select21_changes.valor = /*ciudad*/ ctx[14];
    				add_flush_callback(() => updating_valor_1 = false);
    			}

    			select21.$set(select21_changes);
    			const select22_changes = {};

    			if (!updating_valor_2 && dirty[0] & /*provincia*/ 32768) {
    				updating_valor_2 = true;
    				select22_changes.valor = /*provincia*/ ctx[15];
    				add_flush_callback(() => updating_valor_2 = false);
    			}

    			select22.$set(select22_changes);
    			const select23_changes = {};

    			if (!updating_valor_3 && dirty[0] & /*nacionalidad*/ 256) {
    				updating_valor_3 = true;
    				select23_changes.valor = /*nacionalidad*/ ctx[8];
    				add_flush_callback(() => updating_valor_3 = false);
    			}

    			select23.$set(select23_changes);

    			if (dirty[0] & /*direccion*/ 65536 && input10.value !== /*direccion*/ ctx[16]) {
    				set_input_value(input10, /*direccion*/ ctx[16]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(select20.$$.fragment, local);
    			transition_in(select21.$$.fragment, local);
    			transition_in(select22.$$.fragment, local);
    			transition_in(select23.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(select20.$$.fragment, local);
    			transition_out(select21.$$.fragment, local);
    			transition_out(select22.$$.fragment, local);
    			transition_out(select23.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(select20);
    			destroy_component(select21);
    			destroy_component(select22);
    			destroy_component(select23);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PacienteCrear", slots, []);
    	let asegurado = false;
    	let aseguradoras = [];
    	let aseguradora = "";
    	let nombres = "";
    	let apellidos = "";
    	let apodo = "";
    	let sexo = "";
    	let fechaNacimiento = "";
    	let nacionalidad = "";
    	let estadoCivil = "";
    	let telefono = "";
    	let celular = "";
    	let cedula = "";
    	let tipoDocumento = "";
    	let religion = "";
    	let ocupacion = "";
    	let numeroSeguro = "";
    	let ciudad = "";
    	let provincia = "";
    	let direccion = "";
    	let email = "";
    	let empresa = {};
    	let responsables = [];
    	let usuario = {};

    	const registrarPaciente = () => {
    		const paciente = {
    			nombres,
    			apellidos,
    			apodo,
    			sexo,
    			fechaNacimiento: new Date(fechaNacimiento),
    			nacionalidad,
    			estadoCivil,
    			telefono,
    			celular,
    			cedula,
    			tipoDocumento,
    			religion,
    			ocupacion,
    			seguroMedico: aseguradoras.filter(x => x.id === aseguradora),
    			numeroSeguro,
    			ciudad,
    			provincia,
    			direccion,
    			email,
    			empresa: empresa.id,
    			responsables,
    			usuario: usuario.id,
    			antecedentes: []
    		};

    		const config = {
    			method: "post",
    			url: `${url}/pacientes`,
    			data: paciente,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			if (res.status === 200) {
    				console.log(res);
    				push(`/pacientes/perfil/${res.data.id}`);
    			}

    			if (res.status === 201) {
    				Swal.fire({
    					title: "El paciente ya existe",
    					text: "¿Deseas cargar su perfil?",
    					icon: "warning",
    					showCancelButton: true,
    					confirmButtonColor: "#3085d6",
    					cancelButtonColor: "#d33",
    					confirmButtonText: "Si, cargar perfil!",
    					cancelButtonText: "Cancelar"
    				}).then(result => {
    					if (result.isConfirmed) {
    						push(`/pacientes/perfil/${res.data}`);
    					}
    				});
    			}
    		}).catch(error => {
    			if (error.response.status === 400) {
    				Swal.fire({
    					title: "El paciente ya existe",
    					text: "¿Deseas cargar su perfil?",
    					icon: "warning",
    					showCancelButton: true,
    					confirmButtonColor: "#3085d6",
    					cancelButtonColor: "#d33",
    					confirmButtonText: "Si, cargar perfil!",
    					cancelButtonText: "Cancelar"
    				}).then(result => {
    					if (result.isConfirmed) {
    						Swal.fire("Deleted!", "Your file has been deleted.", "success");
    					}
    				});
    			}

    			console.log(error);
    		});

    		console.log(paciente);
    	};

    	function cargarAseguradoras() {
    		console.log("cargando aseguradoras");

    		const config = {
    			method: "get",
    			url: `${url}/Aseguradoras`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(1, aseguradoras = res.data);
    			console.log(aseguradoras);
    		}).catch(err => {
    			console.error(err);
    		});
    	}

    	const cargarUsuario = () => {
    		const config = {
    			method: "get",
    			url: `${url}/usuarios/${user().id}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			usuario = res.data;
    			empresa = res.data.empresa;
    			console.log(usuario);
    			console.log(empresa);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	onMount(() => {
    		jQuery(".select-aseguradoras").select2({
    			placeholder: " - seleccionar aseguradora - "
    		});

    		jQuery(".select-aseguradoras").on("select2:select", e => {
    			console.log(e.params.data.id);
    		});

    		cargarAseguradoras();
    		cargarUsuario();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<PacienteCrear> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		nombres = this.value;
    		$$invalidate(3, nombres);
    	}

    	function input1_input_handler() {
    		apellidos = this.value;
    		$$invalidate(4, apellidos);
    	}

    	function input2_input_handler() {
    		apodo = this.value;
    		$$invalidate(5, apodo);
    	}

    	function select0_change_handler() {
    		sexo = select_value(this);
    		$$invalidate(6, sexo);
    	}

    	function input3_input_handler() {
    		fechaNacimiento = this.value;
    		$$invalidate(7, fechaNacimiento);
    	}

    	function select1_change_handler() {
    		tipoDocumento = select_value(this);
    		$$invalidate(12, tipoDocumento);
    	}

    	function input4_input_handler() {
    		cedula = to_number(this.value);
    		$$invalidate(11, cedula);
    	}

    	function input5_input_handler() {
    		telefono = this.value;
    		$$invalidate(9, telefono);
    	}

    	function input6_input_handler() {
    		celular = this.value;
    		$$invalidate(10, celular);
    	}

    	function input7_input_handler() {
    		email = this.value;
    		$$invalidate(17, email);
    	}

    	function input8_change_handler() {
    		asegurado = this.checked;
    		$$invalidate(0, asegurado);
    	}

    	function select20_valor_binding(value) {
    		aseguradora = value;
    		$$invalidate(2, aseguradora);
    	}

    	function input9_input_handler() {
    		numeroSeguro = to_number(this.value);
    		$$invalidate(13, numeroSeguro);
    	}

    	function select21_valor_binding(value) {
    		ciudad = value;
    		$$invalidate(14, ciudad);
    	}

    	function select22_valor_binding(value) {
    		provincia = value;
    		$$invalidate(15, provincia);
    	}

    	function select23_valor_binding(value) {
    		nacionalidad = value;
    		$$invalidate(8, nacionalidad);
    	}

    	function input10_input_handler() {
    		direccion = this.value;
    		$$invalidate(16, direccion);
    	}

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		Header,
    		Aside,
    		Select2,
    		push,
    		onMount,
    		url,
    		user,
    		ciudades,
    		provincias,
    		nacionalidades,
    		asegurado,
    		aseguradoras,
    		aseguradora,
    		nombres,
    		apellidos,
    		apodo,
    		sexo,
    		fechaNacimiento,
    		nacionalidad,
    		estadoCivil,
    		telefono,
    		celular,
    		cedula,
    		tipoDocumento,
    		religion,
    		ocupacion,
    		numeroSeguro,
    		ciudad,
    		provincia,
    		direccion,
    		email,
    		empresa,
    		responsables,
    		usuario,
    		registrarPaciente,
    		cargarAseguradoras,
    		cargarUsuario
    	});

    	$$self.$inject_state = $$props => {
    		if ("asegurado" in $$props) $$invalidate(0, asegurado = $$props.asegurado);
    		if ("aseguradoras" in $$props) $$invalidate(1, aseguradoras = $$props.aseguradoras);
    		if ("aseguradora" in $$props) $$invalidate(2, aseguradora = $$props.aseguradora);
    		if ("nombres" in $$props) $$invalidate(3, nombres = $$props.nombres);
    		if ("apellidos" in $$props) $$invalidate(4, apellidos = $$props.apellidos);
    		if ("apodo" in $$props) $$invalidate(5, apodo = $$props.apodo);
    		if ("sexo" in $$props) $$invalidate(6, sexo = $$props.sexo);
    		if ("fechaNacimiento" in $$props) $$invalidate(7, fechaNacimiento = $$props.fechaNacimiento);
    		if ("nacionalidad" in $$props) $$invalidate(8, nacionalidad = $$props.nacionalidad);
    		if ("estadoCivil" in $$props) estadoCivil = $$props.estadoCivil;
    		if ("telefono" in $$props) $$invalidate(9, telefono = $$props.telefono);
    		if ("celular" in $$props) $$invalidate(10, celular = $$props.celular);
    		if ("cedula" in $$props) $$invalidate(11, cedula = $$props.cedula);
    		if ("tipoDocumento" in $$props) $$invalidate(12, tipoDocumento = $$props.tipoDocumento);
    		if ("religion" in $$props) religion = $$props.religion;
    		if ("ocupacion" in $$props) ocupacion = $$props.ocupacion;
    		if ("numeroSeguro" in $$props) $$invalidate(13, numeroSeguro = $$props.numeroSeguro);
    		if ("ciudad" in $$props) $$invalidate(14, ciudad = $$props.ciudad);
    		if ("provincia" in $$props) $$invalidate(15, provincia = $$props.provincia);
    		if ("direccion" in $$props) $$invalidate(16, direccion = $$props.direccion);
    		if ("email" in $$props) $$invalidate(17, email = $$props.email);
    		if ("empresa" in $$props) empresa = $$props.empresa;
    		if ("responsables" in $$props) responsables = $$props.responsables;
    		if ("usuario" in $$props) usuario = $$props.usuario;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		asegurado,
    		aseguradoras,
    		aseguradora,
    		nombres,
    		apellidos,
    		apodo,
    		sexo,
    		fechaNacimiento,
    		nacionalidad,
    		telefono,
    		celular,
    		cedula,
    		tipoDocumento,
    		numeroSeguro,
    		ciudad,
    		provincia,
    		direccion,
    		email,
    		registrarPaciente,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select0_change_handler,
    		input3_input_handler,
    		select1_change_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_change_handler,
    		select20_valor_binding,
    		input9_input_handler,
    		select21_valor_binding,
    		select22_valor_binding,
    		select23_valor_binding,
    		input10_input_handler
    	];
    }

    class PacienteCrear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacienteCrear",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    var getRandomValues;
    var rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
        // find the complete implementation of crypto (msCrypto) on IE11.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    function v4(options, buf, offset) {
      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (var i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return stringify(rnds);
    }

    /* src\Layout\AsideAtencion.svelte generated by Svelte v3.29.0 */
    const file$e = "src\\Layout\\AsideAtencion.svelte";

    function create_fragment$f(ctx) {
    	let aside;
    	let div1;
    	let span0;
    	let a0;
    	let link_action;
    	let t1;
    	let div0;
    	let a1;
    	let t2;
    	let a2;
    	let t3;
    	let div2;
    	let ul;
    	let li0;
    	let a3;
    	let span2;
    	let span1;
    	let t5;
    	let span4;
    	let span3;
    	let t7;
    	let i0;
    	let link_action_1;
    	let active_action;
    	let t8;
    	let li1;
    	let a4;
    	let span6;
    	let span5;
    	let t10;
    	let span7;
    	let i1;
    	let link_action_2;
    	let active_action_1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div1 = element("div");
    			span0 = element("span");
    			a0 = element("a");
    			a0.textContent = "xmedical";
    			t1 = space();
    			div0 = element("div");
    			a1 = element("a");
    			t2 = space();
    			a2 = element("a");
    			t3 = space();
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a3 = element("a");
    			span2 = element("span");
    			span1 = element("span");
    			span1.textContent = "IR A INICIO";
    			t5 = space();
    			span4 = element("span");
    			span3 = element("span");
    			span3.textContent = "1";
    			t7 = space();
    			i0 = element("i");
    			t8 = space();
    			li1 = element("li");
    			a4 = element("a");
    			span6 = element("span");
    			span5 = element("span");
    			span5.textContent = "Historia Clinica";
    			t10 = space();
    			span7 = element("span");
    			i1 = element("i");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$e, 9, 8, 286);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file$e, 8, 6, 242);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned");
    			add_location(a1, file$e, 14, 8, 438);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file$e, 18, 8, 611);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file$e, 12, 6, 378);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file$e, 6, 4, 163);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$e, 30, 14, 1041);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file$e, 29, 12, 1000);
    			attr_dev(span3, "class", "icon-badge badge-success badge badge-pill");
    			add_location(span3, file$e, 33, 14, 1158);
    			attr_dev(i0, "class", "icon-placeholder mdi-24px mdi mdi-home");
    			add_location(i0, file$e, 34, 14, 1238);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$e, 32, 12, 1118);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file$e, 28, 10, 947);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$e, 27, 8, 867);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$e, 44, 16, 1684);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$e, 43, 12, 1641);
    			attr_dev(i1, "class", "icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type");
    			add_location(i1, file$e, 47, 16, 1808);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$e, 46, 12, 1766);
    			attr_dev(a4, "href", "/pacientes/:idPaciente/historias/:idHistoria");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file$e, 42, 12, 1545);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$e, 41, 8, 1420);
    			attr_dev(ul, "class", "menu");
    			add_location(ul, file$e, 25, 6, 807);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file$e, 23, 4, 719);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file$e, 5, 2, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div1);
    			append_dev(div1, span0);
    			append_dev(span0, a0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, a1);
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			append_dev(aside, t3);
    			append_dev(aside, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a3);
    			append_dev(a3, span2);
    			append_dev(span2, span1);
    			append_dev(a3, t5);
    			append_dev(a3, span4);
    			append_dev(span4, span3);
    			append_dev(span4, t7);
    			append_dev(span4, i0);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(li1, a4);
    			append_dev(a4, span6);
    			append_dev(span6, span5);
    			append_dev(a4, t10);
    			append_dev(a4, span7);
    			append_dev(span7, i1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active$1.call(null, li0, { path: "/", className: "active" })),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active$1.call(null, li1, {
    						path: "/pacientes/:idPaciente/historias/:idHistoria",
    						className: "active"
    					}))
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AsideAtencion", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AsideAtencion> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, active: active$1 });
    	return [];
    }

    class AsideAtencion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AsideAtencion",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalTratamientos.svelte generated by Svelte v3.29.0 */

    const file$f = "src\\componentes\\Modals\\ModalTratamientos.svelte";

    function create_fragment$g(ctx) {
    	let div30;
    	let div29;
    	let div28;
    	let div0;
    	let h5;
    	let t1;
    	let button0;
    	let span0;
    	let t3;
    	let form;
    	let div26;
    	let div3;
    	let div2;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let ul;
    	let div1;
    	let li0;
    	let a0;
    	let t7;
    	let li1;
    	let a1;
    	let i;
    	let t8;
    	let t9;
    	let div9;
    	let div8;
    	let div5;
    	let div4;
    	let input2;
    	let t10;
    	let div7;
    	let div6;
    	let select0;
    	let option0;
    	let t12;
    	let div15;
    	let div14;
    	let div11;
    	let div10;
    	let select1;
    	let option1;
    	let t14;
    	let div13;
    	let div12;
    	let label0;
    	let input3;
    	let t15;
    	let span1;
    	let t16;
    	let span2;
    	let t18;
    	let div21;
    	let div20;
    	let div17;
    	let div16;
    	let input4;
    	let t19;
    	let div19;
    	let div18;
    	let label1;
    	let input5;
    	let t20;
    	let span3;
    	let t21;
    	let span4;
    	let t23;
    	let label2;
    	let input6;
    	let t24;
    	let span5;
    	let t25;
    	let span6;
    	let t27;
    	let div23;
    	let div22;
    	let select2;
    	let option2;
    	let t29;
    	let div25;
    	let div24;
    	let textarea;
    	let t30;
    	let div27;
    	let button1;
    	let t32;
    	let button2;

    	const block = {
    		c: function create() {
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Agregue el tratamiento";
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t3 = space();
    			form = element("form");
    			div26 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			ul = element("ul");
    			div1 = element("div");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Acetaminofen";
    			t7 = space();
    			li1 = element("li");
    			a1 = element("a");
    			i = element("i");
    			t8 = text(" Agregar nuevo medicamento");
    			t9 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			input2 = element("input");
    			t10 = space();
    			div7 = element("div");
    			div6 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "- Unidad de dosis -";
    			t12 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "Via";
    			t14 = space();
    			div13 = element("div");
    			div12 = element("div");
    			label0 = element("label");
    			input3 = element("input");
    			t15 = space();
    			span1 = element("span");
    			t16 = space();
    			span2 = element("span");
    			span2.textContent = "Monodosis";
    			t18 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			input4 = element("input");
    			t19 = space();
    			div19 = element("div");
    			div18 = element("div");
    			label1 = element("label");
    			input5 = element("input");
    			t20 = space();
    			span3 = element("span");
    			t21 = space();
    			span4 = element("span");
    			span4.textContent = "Horas";
    			t23 = space();
    			label2 = element("label");
    			input6 = element("input");
    			t24 = space();
    			span5 = element("span");
    			t25 = space();
    			span6 = element("span");
    			span6.textContent = "Minutos";
    			t27 = space();
    			div23 = element("div");
    			div22 = element("div");
    			select2 = element("select");
    			option2 = element("option");
    			option2.textContent = "Diagnostico para el tratamiento";
    			t29 = space();
    			div25 = element("div");
    			div24 = element("div");
    			textarea = element("textarea");
    			t30 = space();
    			div27 = element("div");
    			button1 = element("button");
    			button1.textContent = "Cerrar";
    			t32 = space();
    			button2 = element("button");
    			button2.textContent = "Agregar";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "exampleModalLongTitle");
    			add_location(h5, file$f, 4, 16, 236);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$f, 6, 20, 430);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$f, 5, 16, 332);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$f, 3, 12, 192);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Medicamento");
    			attr_dev(input0, "data-toggle", "dropdown");
    			add_location(input0, file$f, 13, 28, 787);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control readonly");
    			input1.readOnly = true;
    			attr_dev(input1, "data-bind", "click: limpiarMedicamentoSeleccionado, \r\n                            class: (idMedicamentoSeleccionado() == '')? 'd-none': '',\r\n                            value: nombreMedicamentoSeleccionado");
    			add_location(input1, file$f, 16, 28, 941);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "data-bind", "text: descripcion, click: $parent.seleccionarMedicamento ");
    			add_location(a0, file$f, 23, 40, 1650);
    			add_location(li0, file$f, 22, 36, 1604);
    			attr_dev(div1, "class", "contenidoLista");
    			attr_dev(div1, "data-bind", "foreach: medicamentos");
    			add_location(div1, file$f, 21, 32, 1504);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$f, 28, 49, 1982);
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file$f, 28, 36, 1969);
    			attr_dev(li1, "class", "defecto");
    			add_location(li1, file$f, 27, 32, 1911);
    			attr_dev(ul, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul, "x-placement", "bottom-start");
    			set_style(ul, "position", "absolute");
    			set_style(ul, "will-change", "transform");
    			set_style(ul, "border-radius", "5px");
    			set_style(ul, "top", "0px");
    			set_style(ul, "left", "0px");
    			set_style(ul, "transform", "translate3d(0px, 36px, 0px)");
    			add_location(ul, file$f, 19, 28, 1236);
    			attr_dev(div2, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div2, file$f, 12, 24, 701);
    			attr_dev(div3, "class", "col-12");
    			add_location(div3, file$f, 11, 20, 655);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "data-bind", "value: dosis");
    			input2.required = true;
    			attr_dev(input2, "placeholder", "Cantidad dosis");
    			attr_dev(input2, "name", "");
    			add_location(input2, file$f, 39, 36, 2427);
    			attr_dev(div4, "class", "form-group buscardor dropdown");
    			add_location(div4, file$f, 38, 32, 2346);
    			attr_dev(div5, "class", "col-6");
    			add_location(div5, file$f, 37, 28, 2293);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$f, 51, 40, 3173);
    			select0.required = true;
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "data-bind", "options: unidades, \r\n                                    optionsCaption: '- Unidad de dosis -',\r\n                                    optionsValue: 'id',\r\n                                    optionsText: 'nombre',\r\n                                    value: unidadSeleccionada");
    			add_location(select0, file$f, 46, 36, 2805);
    			attr_dev(div6, "class", "form-group ");
    			add_location(div6, file$f, 45, 32, 2742);
    			attr_dev(div7, "class", "col-6");
    			add_location(div7, file$f, 44, 28, 2689);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$f, 36, 24, 2246);
    			attr_dev(div9, "class", "col-12");
    			add_location(div9, file$f, 35, 20, 2200);
    			option1.__value = "";
    			option1.value = option1.__value;
    			add_location(option1, file$f, 64, 40, 3828);
    			attr_dev(select1, "class", "form-control");
    			select1.required = true;
    			attr_dev(select1, "data-bind", "options: vias, value: viaSeleccionada, optionsCaption: 'Vía'");
    			add_location(select1, file$f, 62, 36, 3634);
    			attr_dev(div10, "class", "form-group ");
    			add_location(div10, file$f, 61, 32, 3571);
    			attr_dev(div11, "class", "col-6");
    			add_location(div11, file$f, 60, 28, 3518);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "name", "option");
    			attr_dev(input3, "data-bind", "checked: monodosis");
    			input3.value = "1";
    			attr_dev(input3, "class", "cstm-switch-input");
    			add_location(input3, file$f, 71, 40, 4196);
    			attr_dev(span1, "class", "cstm-switch-indicator bg-success ");
    			add_location(span1, file$f, 73, 40, 4387);
    			attr_dev(span2, "class", "cstm-switch-description");
    			add_location(span2, file$f, 74, 40, 4484);
    			attr_dev(label0, "class", "cstm-switch mt-2");
    			add_location(label0, file$f, 70, 36, 4122);
    			attr_dev(div12, "class", " m-b-10");
    			add_location(div12, file$f, 69, 32, 4063);
    			attr_dev(div13, "class", "col-6");
    			add_location(div13, file$f, 68, 28, 4010);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$f, 59, 24, 3471);
    			attr_dev(div15, "class", "col-12");
    			add_location(div15, file$f, 58, 20, 3425);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			input4.required = true;
    			attr_dev(input4, "placeholder", "Intervalo (Tiempo)");
    			attr_dev(input4, "max", "100000");
    			attr_dev(input4, "name", "");
    			add_location(input4, file$f, 85, 36, 4971);
    			attr_dev(div16, "class", "form-group buscardor dropdown");
    			add_location(div16, file$f, 84, 32, 4890);
    			attr_dev(div17, "class", "col-6");
    			add_location(div17, file$f, 83, 28, 4837);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", "Tiempo");
    			input5.value = "H";
    			attr_dev(input5, "class", "cstm-switch-input");
    			input5.checked = "checked";
    			add_location(input5, file$f, 92, 40, 5409);
    			attr_dev(span3, "class", "cstm-switch-indicator ");
    			add_location(span3, file$f, 94, 40, 5584);
    			attr_dev(span4, "class", "cstm-switch-description");
    			add_location(span4, file$f, 95, 40, 5670);
    			attr_dev(label1, "class", "cstm-switch mt-2");
    			add_location(label1, file$f, 91, 36, 5335);
    			attr_dev(input6, "type", "radio");
    			input6.value = "M";
    			attr_dev(input6, "class", "cstm-switch-input");
    			add_location(input6, file$f, 98, 40, 5879);
    			attr_dev(span5, "class", "cstm-switch-indicator ");
    			add_location(span5, file$f, 100, 40, 6022);
    			attr_dev(span6, "class", "cstm-switch-description");
    			add_location(span6, file$f, 101, 40, 6108);
    			attr_dev(label2, "class", "cstm-switch mt-2");
    			add_location(label2, file$f, 97, 36, 5805);
    			attr_dev(div18, "class", "m-b-10");
    			add_location(div18, file$f, 90, 32, 5277);
    			attr_dev(div19, "class", "col-6");
    			add_location(div19, file$f, 89, 28, 5224);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$f, 82, 24, 4790);
    			attr_dev(div21, "class", "col-12");
    			add_location(div21, file$f, 81, 20, 4744);
    			option2.selected = true;
    			option2.disabled = true;
    			option2.__value = "Diagnostico para el tratamiento";
    			option2.value = option2.__value;
    			add_location(option2, file$f, 114, 32, 6783);
    			select2.required = true;
    			attr_dev(select2, "class", "form-control");
    			attr_dev(select2, "data-bind", "options: parent.diagnosticos, \r\n                                optionsCaption: 'Diagnostico para el tratamiento',\r\n                                optionsText: 'problemaMedico',\r\n                                value: diagnostico");
    			add_location(select2, file$f, 110, 28, 6468);
    			attr_dev(div22, "class", "form-group ");
    			add_location(div22, file$f, 109, 24, 6413);
    			attr_dev(div23, "class", "col-12");
    			add_location(div23, file$f, 108, 20, 6367);
    			attr_dev(textarea, "class", "form-control mt-2");
    			attr_dev(textarea, "data-bind", "value: comentario");
    			attr_dev(textarea, "placeholder", "Comentarios");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$f, 121, 28, 7072);
    			attr_dev(div24, "class", "form-group");
    			add_location(div24, file$f, 120, 24, 7018);
    			attr_dev(div25, "class", "col-12");
    			add_location(div25, file$f, 119, 20, 6972);
    			attr_dev(div26, "class", "modal-body");
    			add_location(div26, file$f, 10, 16, 609);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-secondary");
    			attr_dev(button1, "data-dismiss", "modal");
    			add_location(button1, file$f, 129, 20, 7457);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-primary");
    			add_location(button2, file$f, 132, 20, 7611);
    			attr_dev(div27, "class", "modal-footer");
    			add_location(div27, file$f, 128, 16, 7409);
    			attr_dev(form, "data-bind", "submit: agregar");
    			attr_dev(form, "id", "formularioTratamiento");
    			add_location(form, file$f, 9, 12, 530);
    			attr_dev(div28, "class", "modal-content");
    			add_location(div28, file$f, 2, 8, 151);
    			attr_dev(div29, "class", "modal-dialog");
    			attr_dev(div29, "role", "document");
    			add_location(div29, file$f, 1, 4, 99);
    			attr_dev(div30, "class", "modal fade");
    			attr_dev(div30, "id", "modalTratamiento");
    			attr_dev(div30, "tabindex", "-1");
    			attr_dev(div30, "role", "dialog");
    			attr_dev(div30, "aria-hidden", "true");
    			add_location(div30, file$f, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div30, anchor);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span0);
    			append_dev(div28, t3);
    			append_dev(div28, form);
    			append_dev(form, div26);
    			append_dev(div26, div3);
    			append_dev(div3, div2);
    			append_dev(div2, input0);
    			append_dev(div2, t4);
    			append_dev(div2, input1);
    			append_dev(div2, t5);
    			append_dev(div2, ul);
    			append_dev(ul, div1);
    			append_dev(div1, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t7);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, i);
    			append_dev(a1, t8);
    			append_dev(div26, t9);
    			append_dev(div26, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			append_dev(div5, div4);
    			append_dev(div4, input2);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, select0);
    			append_dev(select0, option0);
    			append_dev(div26, t12);
    			append_dev(div26, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div11);
    			append_dev(div11, div10);
    			append_dev(div10, select1);
    			append_dev(select1, option1);
    			append_dev(div14, t14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, label0);
    			append_dev(label0, input3);
    			append_dev(label0, t15);
    			append_dev(label0, span1);
    			append_dev(label0, t16);
    			append_dev(label0, span2);
    			append_dev(div26, t18);
    			append_dev(div26, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div17);
    			append_dev(div17, div16);
    			append_dev(div16, input4);
    			append_dev(div20, t19);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, label1);
    			append_dev(label1, input5);
    			append_dev(label1, t20);
    			append_dev(label1, span3);
    			append_dev(label1, t21);
    			append_dev(label1, span4);
    			append_dev(div18, t23);
    			append_dev(div18, label2);
    			append_dev(label2, input6);
    			append_dev(label2, t24);
    			append_dev(label2, span5);
    			append_dev(label2, t25);
    			append_dev(label2, span6);
    			append_dev(div26, t27);
    			append_dev(div26, div23);
    			append_dev(div23, div22);
    			append_dev(div22, select2);
    			append_dev(select2, option2);
    			append_dev(div26, t29);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, textarea);
    			append_dev(form, t30);
    			append_dev(form, div27);
    			append_dev(div27, button1);
    			append_dev(div27, t32);
    			append_dev(div27, button2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div30);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalTratamientos", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalTratamientos> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalTratamientos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalTratamientos",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalInterconsulta.svelte generated by Svelte v3.29.0 */

    const file$g = "src\\componentes\\Modals\\ModalInterconsulta.svelte";

    function create_fragment$h(ctx) {
    	let div15;
    	let div14;
    	let div13;
    	let div0;
    	let h5;
    	let t1;
    	let button;
    	let span;
    	let t3;
    	let div6;
    	let form;
    	let div5;
    	let div1;
    	let label0;
    	let t5;
    	let textarea0;
    	let t6;
    	let div2;
    	let label1;
    	let t8;
    	let textarea1;
    	let t9;
    	let div3;
    	let select0;
    	let option0;
    	let t11;
    	let div4;
    	let select1;
    	let option1;
    	let t13;
    	let div12;
    	let div11;
    	let div8;
    	let a0;
    	let h30;
    	let t14;
    	let div7;
    	let t16;
    	let div10;
    	let a1;
    	let h31;
    	let t17;
    	let div9;

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Nueva interconsulta";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div6 = element("div");
    			form = element("form");
    			div5 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Resumen";
    			t5 = space();
    			textarea0 = element("textarea");
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Manejo / Recomendaciones";
    			t8 = space();
    			textarea1 = element("textarea");
    			t9 = space();
    			div3 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "- Departamento -";
    			t11 = space();
    			div4 = element("div");
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "- Especialista sugerido -";
    			t13 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div8 = element("div");
    			a0 = element("a");
    			h30 = element("h3");
    			t14 = space();
    			div7 = element("div");
    			div7.textContent = "Cerrar";
    			t16 = space();
    			div10 = element("div");
    			a1 = element("a");
    			h31 = element("h3");
    			t17 = space();
    			div9 = element("div");
    			div9.textContent = "Solicitar";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalInterconsulta");
    			add_location(h5, file$g, 5, 20, 361);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$g, 7, 24, 557);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$g, 6, 20, 455);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$g, 4, 16, 313);
    			attr_dev(label0, "for", "");
    			attr_dev(label0, "class", "text-primary");
    			add_location(label0, file$g, 14, 32, 905);
    			attr_dev(textarea0, "class", "form-control");
    			attr_dev(textarea0, "data-bind", "value: resumen");
    			set_style(textarea0, "width", "100%");
    			set_style(textarea0, "display", "block");
    			set_style(textarea0, "height", "150px");
    			attr_dev(textarea0, "name", "Comentario");
    			add_location(textarea0, file$g, 15, 32, 989);
    			attr_dev(div1, "class", "form-group col-md-12");
    			add_location(div1, file$g, 13, 28, 837);
    			attr_dev(label1, "for", "");
    			attr_dev(label1, "class", "text-primary");
    			add_location(label1, file$g, 19, 32, 1299);
    			attr_dev(textarea1, "class", "form-control");
    			attr_dev(textarea1, "data-bind", "value: recomendaciones");
    			set_style(textarea1, "width", "100%");
    			set_style(textarea1, "display", "block");
    			set_style(textarea1, "height", "150px");
    			attr_dev(textarea1, "name", "Comentario");
    			add_location(textarea1, file$g, 20, 32, 1400);
    			attr_dev(div2, "class", "form-group col-md-12");
    			add_location(div2, file$g, 18, 28, 1231);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$g, 26, 36, 1839);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltDepartamentos");
    			set_style(select0, "width", "100%");
    			select0.required = true;
    			add_location(select0, file$g, 25, 32, 1720);
    			attr_dev(div3, "class", "form-group col-lg-12");
    			add_location(div3, file$g, 24, 28, 1652);
    			option1.__value = "";
    			option1.value = option1.__value;
    			add_location(option1, file$g, 31, 36, 2189);
    			attr_dev(select1, "class", "form-control");
    			attr_dev(select1, "id", "sltEspecialistasDepartamento");
    			set_style(select1, "width", "100%");
    			select1.required = true;
    			add_location(select1, file$g, 30, 32, 2058);
    			attr_dev(div4, "class", "form-group col-lg-12");
    			add_location(div4, file$g, 29, 28, 1990);
    			attr_dev(div5, "class", "form-row");
    			add_location(div5, file$g, 12, 24, 785);
    			attr_dev(form, "class", "floating-label col-md-12 show-label");
    			add_location(form, file$g, 11, 20, 709);
    			attr_dev(div6, "class", "modal-body");
    			add_location(div6, file$g, 10, 16, 663);
    			attr_dev(h30, "class", "mdi mdi-close-outline");
    			add_location(h30, file$g, 43, 32, 2670);
    			attr_dev(div7, "class", "text-overline");
    			add_location(div7, file$g, 44, 32, 2743);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "text-danger");
    			attr_dev(a0, "data-dismiss", "modal");
    			add_location(a0, file$g, 42, 28, 2583);
    			attr_dev(div8, "class", "col");
    			add_location(div8, file$g, 41, 24, 2536);
    			attr_dev(h31, "class", "mdi mdi-send");
    			add_location(h31, file$g, 49, 32, 3014);
    			attr_dev(div9, "class", "text-overline");
    			add_location(div9, file$g, 50, 32, 3078);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "data-bind", "click: crear");
    			attr_dev(a1, "class", "text-success");
    			add_location(a1, file$g, 48, 28, 2921);
    			attr_dev(div10, "class", "col");
    			add_location(div10, file$g, 47, 24, 2874);
    			attr_dev(div11, "class", "row text-center p-b-10");
    			add_location(div11, file$g, 40, 20, 2474);
    			attr_dev(div12, "class", "modal-footer");
    			add_location(div12, file$g, 39, 16, 2426);
    			attr_dev(div13, "class", "modal-content");
    			add_location(div13, file$g, 3, 12, 268);
    			attr_dev(div14, "class", "modal-dialog");
    			attr_dev(div14, "role", "document");
    			add_location(div14, file$g, 2, 8, 212);
    			attr_dev(div15, "class", "modal fade modal-slide-right");
    			attr_dev(div15, "id", "modalInterconsulta");
    			attr_dev(div15, "tabindex", "-1");
    			attr_dev(div15, "role", "dialog");
    			attr_dev(div15, "aria-labelledby", "modalInterconsulta");
    			set_style(div15, "display", "none");
    			set_style(div15, "padding-right", "16px");
    			attr_dev(div15, "aria-modal", "true");
    			add_location(div15, file$g, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span);
    			append_dev(div13, t3);
    			append_dev(div13, div6);
    			append_dev(div6, form);
    			append_dev(form, div5);
    			append_dev(div5, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, textarea0);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t8);
    			append_dev(div2, textarea1);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, select0);
    			append_dev(select0, option0);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, select1);
    			append_dev(select1, option1);
    			append_dev(div13, t13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div8);
    			append_dev(div8, a0);
    			append_dev(a0, h30);
    			append_dev(a0, t14);
    			append_dev(a0, div7);
    			append_dev(div11, t16);
    			append_dev(div11, div10);
    			append_dev(div10, a1);
    			append_dev(a1, h31);
    			append_dev(a1, t17);
    			append_dev(a1, div9);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalInterconsulta", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalInterconsulta> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalInterconsulta extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalInterconsulta",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalAntecedentes.svelte generated by Svelte v3.29.0 */

    const file$h = "src\\componentes\\Modals\\ModalAntecedentes.svelte";

    function create_fragment$i(ctx) {
    	let div43;
    	let div42;
    	let div41;
    	let div3;
    	let h5;
    	let t1;
    	let button0;
    	let span0;
    	let t3;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t4;
    	let i1;
    	let t6;
    	let div40;
    	let div39;
    	let div38;
    	let div12;
    	let div5;
    	let div4;
    	let t8;
    	let div11;
    	let div6;
    	let button1;
    	let i2;
    	let t9;
    	let span1;
    	let t11;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let t12;
    	let div21;
    	let div14;
    	let div13;
    	let t14;
    	let div20;
    	let div15;
    	let button2;
    	let i3;
    	let t15;
    	let span2;
    	let t17;
    	let div19;
    	let div18;
    	let div17;
    	let div16;
    	let t18;
    	let div37;
    	let div23;
    	let div22;
    	let t20;
    	let div36;
    	let div24;
    	let button3;
    	let i4;
    	let t21;
    	let span3;
    	let t23;
    	let div35;
    	let div34;
    	let div33;
    	let div32;
    	let div31;
    	let div26;
    	let div25;
    	let i5;
    	let t24;
    	let span4;
    	let t26;
    	let div29;
    	let div28;
    	let a;
    	let i6;
    	let t27;
    	let div27;
    	let button4;
    	let i7;
    	let t28;
    	let t29;
    	let div30;
    	let textarea;

    	const block = {
    		c: function create() {
    			div43 = element("div");
    			div42 = element("div");
    			div41 = element("div");
    			div3 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Antecedentes";
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t4 = space();
    			i1 = element("i");
    			i1.textContent = "listo y guardado";
    			t6 = space();
    			div40 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			div12 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div4.textContent = "Antecedentes Patologicos";
    			t8 = space();
    			div11 = element("div");
    			div6 = element("div");
    			button1 = element("button");
    			i2 = element("i");
    			t9 = space();
    			span1 = element("span");
    			span1.textContent = "Enfermedades Tiroideas";
    			t11 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			t12 = space();
    			div21 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div13.textContent = "Antecedentes no Patologicos";
    			t14 = space();
    			div20 = element("div");
    			div15 = element("div");
    			button2 = element("button");
    			i3 = element("i");
    			t15 = space();
    			span2 = element("span");
    			span2.textContent = "Actividad Fisica";
    			t17 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			t18 = space();
    			div37 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			div22.textContent = "Antecedentes Psiquiátricos";
    			t20 = space();
    			div36 = element("div");
    			div24 = element("div");
    			button3 = element("button");
    			i4 = element("i");
    			t21 = space();
    			span3 = element("span");
    			span3.textContent = "Historia Familiar";
    			t23 = space();
    			div35 = element("div");
    			div34 = element("div");
    			div33 = element("div");
    			div32 = element("div");
    			div31 = element("div");
    			div26 = element("div");
    			div25 = element("div");
    			i5 = element("i");
    			t24 = space();
    			span4 = element("span");
    			span4.textContent = "Historia Familiar";
    			t26 = space();
    			div29 = element("div");
    			div28 = element("div");
    			a = element("a");
    			i6 = element("i");
    			t27 = space();
    			div27 = element("div");
    			button4 = element("button");
    			i7 = element("i");
    			t28 = text("\r\n                                                                    Eliminar");
    			t29 = space();
    			div30 = element("div");
    			textarea = element("textarea");
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalAntecedentes");
    			add_location(h5, file$h, 5, 16, 319);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$h, 7, 20, 499);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$h, 6, 16, 401);
    			attr_dev(i0, "class", "mdi mdi-check-all");
    			add_location(i0, file$h, 11, 112, 777);
    			add_location(i1, file$h, 12, 63, 844);
    			attr_dev(div0, "class", "guardando mr-2 text-success");
    			attr_dev(div0, "data-bind", "html: content, class: contentClass");
    			add_location(div0, file$h, 11, 24, 689);
    			attr_dev(div1, "class", "guardar-documento");
    			add_location(div1, file$h, 10, 20, 632);
    			set_style(div2, "margin-right", "40px");
    			add_location(div2, file$h, 9, 16, 577);
    			attr_dev(div3, "class", "modal-header");
    			add_location(div3, file$h, 4, 12, 275);
    			attr_dev(div4, "class", "card-title");
    			attr_dev(div4, "data-bind", "text: nombre");
    			add_location(div4, file$h, 22, 32, 1299);
    			attr_dev(div5, "class", "card-header");
    			add_location(div5, file$h, 21, 28, 1240);
    			attr_dev(i2, "class", "mdi mdi-plus");
    			add_location(i2, file$h, 27, 101, 1794);
    			attr_dev(span1, "data-bind", "text: nombre");
    			add_location(span1, file$h, 29, 40, 1909);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button1, "box-shadow", "none");
    			attr_dev(button1, "data-bind", "click: $parent.agregar");
    			add_location(button1, file$h, 26, 36, 1621);
    			attr_dev(div6, "class", "botones-antecedentes");
    			attr_dev(div6, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div6, file$h, 25, 32, 1501);
    			attr_dev(div7, "class", "col-lg-12");
    			attr_dev(div7, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div7, file$h, 36, 44, 2272);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$h, 35, 40, 2209);
    			attr_dev(div9, "class", "col-12");
    			add_location(div9, file$h, 34, 36, 2147);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$h, 33, 32, 2092);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$h, 24, 28, 1444);
    			attr_dev(div12, "class", "card  m-b-30");
    			set_style(div12, "box-shadow", "none");
    			set_style(div12, "border", "#32325d solid 1px");
    			add_location(div12, file$h, 20, 24, 1131);
    			attr_dev(div13, "class", "card-title");
    			attr_dev(div13, "data-bind", "text: nombre");
    			add_location(div13, file$h, 45, 32, 2740);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file$h, 44, 28, 2681);
    			attr_dev(i3, "class", "mdi mdi-plus");
    			add_location(i3, file$h, 50, 101, 3238);
    			attr_dev(span2, "data-bind", "text: nombre");
    			add_location(span2, file$h, 52, 40, 3353);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button2, "box-shadow", "none");
    			attr_dev(button2, "data-bind", "click: $parent.agregar");
    			add_location(button2, file$h, 49, 36, 3065);
    			attr_dev(div15, "class", "botones-antecedentes");
    			attr_dev(div15, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div15, file$h, 48, 32, 2945);
    			attr_dev(div16, "class", "col-lg-12");
    			attr_dev(div16, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div16, file$h, 59, 44, 3710);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$h, 58, 40, 3647);
    			attr_dev(div18, "class", "col-12");
    			add_location(div18, file$h, 57, 36, 3585);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$h, 56, 32, 3530);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$h, 47, 28, 2888);
    			attr_dev(div21, "class", "card  m-b-30");
    			set_style(div21, "box-shadow", "none");
    			set_style(div21, "border", "#32325d solid 1px");
    			add_location(div21, file$h, 43, 24, 2572);
    			attr_dev(div22, "class", "card-title");
    			attr_dev(div22, "data-bind", "text: nombre");
    			add_location(div22, file$h, 69, 32, 4180);
    			attr_dev(div23, "class", "card-header");
    			add_location(div23, file$h, 68, 28, 4121);
    			attr_dev(i4, "class", "mdi mdi-plus");
    			add_location(i4, file$h, 74, 101, 4677);
    			attr_dev(span3, "data-bind", "text: nombre");
    			add_location(span3, file$h, 76, 40, 4792);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button3, "box-shadow", "none");
    			attr_dev(button3, "data-bind", "click: $parent.agregar");
    			add_location(button3, file$h, 73, 36, 4504);
    			attr_dev(div24, "class", "botones-antecedentes");
    			attr_dev(div24, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div24, file$h, 72, 32, 4384);
    			attr_dev(i5, "class", "mdi mdi-history mdi-18px");
    			add_location(i5, file$h, 86, 80, 5507);
    			attr_dev(span4, "data-bind", "text: nombre");
    			add_location(span4, file$h, 86, 121, 5548);
    			attr_dev(div25, "class", "card-title");
    			add_location(div25, file$h, 86, 56, 5483);
    			attr_dev(div26, "class", "card-header");
    			add_location(div26, file$h, 85, 52, 5400);
    			attr_dev(i6, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i6, file$h, 92, 64, 6094);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$h, 91, 60, 5950);
    			attr_dev(i7, "class", "mdi mdi-trash-can-outline");
    			add_location(i7, file$h, 95, 148, 6462);
    			attr_dev(button4, "class", "dropdown-item text-danger");
    			attr_dev(button4, "data-bind", "click: eliminar");
    			attr_dev(button4, "type", "button");
    			add_location(button4, file$h, 95, 64, 6378);
    			attr_dev(div27, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div27, file$h, 94, 60, 6265);
    			attr_dev(div28, "class", "dropdown");
    			add_location(div28, file$h, 90, 56, 5866);
    			attr_dev(div29, "class", "card-controls");
    			add_location(div29, file$h, 89, 52, 5781);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "data-bind", "value: descripcion");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			set_style(textarea, "height", "100px");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$h, 101, 56, 6917);
    			attr_dev(div30, "class", "card-body");
    			add_location(div30, file$h, 100, 52, 6836);
    			attr_dev(div31, "class", "card m-b-20 mt-3");
    			set_style(div31, "box-shadow", "none");
    			set_style(div31, "border", "1px grey solid");
    			add_location(div31, file$h, 84, 48, 5266);
    			attr_dev(div32, "class", "col-lg-12");
    			attr_dev(div32, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div32, file$h, 83, 44, 5150);
    			attr_dev(div33, "class", "row");
    			add_location(div33, file$h, 82, 40, 5087);
    			attr_dev(div34, "class", "col-12");
    			add_location(div34, file$h, 81, 36, 5025);
    			attr_dev(div35, "class", "row");
    			add_location(div35, file$h, 80, 32, 4970);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$h, 71, 28, 4327);
    			attr_dev(div37, "class", "card  m-b-30");
    			set_style(div37, "box-shadow", "none");
    			set_style(div37, "border", "#32325d solid 1px");
    			add_location(div37, file$h, 67, 24, 4012);
    			attr_dev(div38, "class", "col-lg-12");
    			attr_dev(div38, "data-bind", "foreach: gruposAntecedentes");
    			add_location(div38, file$h, 18, 20, 1040);
    			attr_dev(div39, "class", "row");
    			add_location(div39, file$h, 17, 16, 1001);
    			attr_dev(div40, "class", "modal-body");
    			add_location(div40, file$h, 16, 12, 959);
    			attr_dev(div41, "class", "modal-content");
    			add_location(div41, file$h, 3, 8, 234);
    			attr_dev(div42, "class", "modal-dialog");
    			attr_dev(div42, "role", "document");
    			add_location(div42, file$h, 2, 4, 182);
    			attr_dev(div43, "class", "modal fade modal-slide-right");
    			attr_dev(div43, "id", "modalAntecedentes");
    			attr_dev(div43, "tabindex", "-1");
    			attr_dev(div43, "role", "dialog");
    			attr_dev(div43, "aria-labelledby", "modalAntecedentes");
    			set_style(div43, "display", "none");
    			attr_dev(div43, "aria-hidden", "true");
    			add_location(div43, file$h, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div43, anchor);
    			append_dev(div43, div42);
    			append_dev(div42, div41);
    			append_dev(div41, div3);
    			append_dev(div3, h5);
    			append_dev(div3, t1);
    			append_dev(div3, button0);
    			append_dev(button0, span0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t4);
    			append_dev(div0, i1);
    			append_dev(div41, t6);
    			append_dev(div41, div40);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, div12);
    			append_dev(div12, div5);
    			append_dev(div5, div4);
    			append_dev(div12, t8);
    			append_dev(div12, div11);
    			append_dev(div11, div6);
    			append_dev(div6, button1);
    			append_dev(button1, i2);
    			append_dev(button1, t9);
    			append_dev(button1, span1);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div38, t12);
    			append_dev(div38, div21);
    			append_dev(div21, div14);
    			append_dev(div14, div13);
    			append_dev(div21, t14);
    			append_dev(div21, div20);
    			append_dev(div20, div15);
    			append_dev(div15, button2);
    			append_dev(button2, i3);
    			append_dev(button2, t15);
    			append_dev(button2, span2);
    			append_dev(div20, t17);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div38, t18);
    			append_dev(div38, div37);
    			append_dev(div37, div23);
    			append_dev(div23, div22);
    			append_dev(div37, t20);
    			append_dev(div37, div36);
    			append_dev(div36, div24);
    			append_dev(div24, button3);
    			append_dev(button3, i4);
    			append_dev(button3, t21);
    			append_dev(button3, span3);
    			append_dev(div36, t23);
    			append_dev(div36, div35);
    			append_dev(div35, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, div26);
    			append_dev(div26, div25);
    			append_dev(div25, i5);
    			append_dev(div25, t24);
    			append_dev(div25, span4);
    			append_dev(div31, t26);
    			append_dev(div31, div29);
    			append_dev(div29, div28);
    			append_dev(div28, a);
    			append_dev(a, i6);
    			append_dev(div28, t27);
    			append_dev(div28, div27);
    			append_dev(div27, button4);
    			append_dev(button4, i7);
    			append_dev(button4, t28);
    			append_dev(div31, t29);
    			append_dev(div31, div30);
    			append_dev(div30, textarea);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div43);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalAntecedentes", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalAntecedentes> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalAntecedentes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalAntecedentes",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\componentes\OrdenesMedicas.svelte generated by Svelte v3.29.0 */
    const file$i = "src\\componentes\\OrdenesMedicas.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[34] = list;
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    // (56:40) {#each medicamentos as medicamento}
    function create_each_block_3$1(ctx) {
    	let li;
    	let div;
    	let t0_value = /*medicamento*/ ctx[35].descripcion + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*medicamento*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "p-2");
    			set_style(div, "cursor", "pointer");
    			add_location(div, file$i, 57, 48, 2592);
    			add_location(li, file$i, 56, 44, 2538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*medicamentos*/ 16 && t0_value !== (t0_value = /*medicamento*/ ctx[35].descripcion + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(56:40) {#each medicamentos as medicamento}",
    		ctx
    	});

    	return block;
    }

    // (150:33) {:else}
    function create_else_block_2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let ul;
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "No tienes medicamentos agregados";
    			t1 = space();
    			ul = element("ul");
    			t2 = space();
    			attr_dev(p, "class", "alert-body text-center mt-3");
    			add_location(p, file$i, 153, 44, 8859);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$i, 152, 40, 8762);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$i, 157, 40, 9120);
    			attr_dev(div1, "class", "col-md-12 mt-3");
    			add_location(div1, file$i, 151, 36, 8692);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$i, 150, 33, 8637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div1, t1);
    			append_dev(div1, ul);
    			append_dev(div2, t2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(150:33) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:28) {#each medicamentosSeleccionados as med, i}
    function create_each_block_2$1(ctx) {
    	let div9;
    	let div7;
    	let div0;
    	let p;
    	let t0_value = /*med*/ ctx[33].nombre + "";
    	let t0;
    	let t1;
    	let div2;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div4;
    	let div3;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div6;
    	let div5;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let div8;
    	let i_1;
    	let t11;
    	let mounted;
    	let dispose;

    	function input0_input_handler_1() {
    		/*input0_input_handler_1*/ ctx[15].call(input0, /*each_value_2*/ ctx[34], /*i*/ ctx[29]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[17].call(input1, /*each_value_2*/ ctx[34], /*i*/ ctx[29]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[19].call(input2, /*each_value_2*/ ctx[34], /*i*/ ctx[29]);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[20](/*i*/ ctx[29], ...args);
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Concentración";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Cantidad";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div6 = element("div");
    			div5 = element("div");
    			label2 = element("label");
    			label2.textContent = "Frecuencia";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div8 = element("div");
    			i_1 = element("i");
    			t11 = space();
    			attr_dev(p, "class", "text-primary");
    			set_style(p, "margin", "0");
    			add_location(p, file$i, 89, 45, 4527);
    			attr_dev(div0, "class", "col p-3");
    			set_style(div0, "display", "flex");
    			set_style(div0, "align-items", "center");
    			set_style(div0, "justify-content", "left");
    			add_location(div0, file$i, 85, 41, 4257);
    			set_style(label0, "margin", "0");
    			attr_dev(label0, "class", "form-label text-primary");
    			add_location(label0, file$i, 99, 49, 5168);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$i, 104, 49, 5519);
    			attr_dev(div1, "class", "mb-2");
    			add_location(div1, file$i, 97, 45, 4992);
    			attr_dev(div2, "class", "col mt-2");
    			add_location(div2, file$i, 96, 41, 4923);
    			set_style(label1, "margin", "0");
    			attr_dev(label1, "class", "form-label text-primary");
    			add_location(label1, file$i, 115, 49, 6287);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$i, 120, 49, 6626);
    			attr_dev(div3, "class", "mb-2");
    			add_location(div3, file$i, 113, 45, 6111);
    			attr_dev(div4, "class", "col mt-2");
    			add_location(div4, file$i, 112, 41, 6042);
    			set_style(label2, "margin", "0");
    			attr_dev(label2, "class", "form-label text-primary");
    			add_location(label2, file$i, 131, 49, 7389);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$i, 136, 49, 7730);
    			attr_dev(div5, "class", "mb-2");
    			add_location(div5, file$i, 129, 45, 7213);
    			attr_dev(div6, "class", "col mt-2");
    			add_location(div6, file$i, 128, 41, 7144);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$i, 84, 37, 4197);
    			attr_dev(i_1, "class", "mdi mdi-close text-red svelte-g4z6qg");
    			add_location(i_1, file$i, 146, 44, 8382);
    			attr_dev(div8, "class", "icon-borrar svelte-g4z6qg");
    			attr_dev(div8, "data-tooltip", "Eliminar");
    			add_location(div8, file$i, 145, 40, 8287);
    			attr_dev(div9, "class", "col-lg-12 border border-primary rounded mt-3");
    			add_location(div9, file$i, 81, 33, 4027);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div7);
    			append_dev(div7, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*med*/ ctx[33].concentracion);
    			append_dev(div7, t4);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t6);
    			append_dev(div3, input1);
    			set_input_value(input1, /*med*/ ctx[33].cantidad);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label2);
    			append_dev(div5, t9);
    			append_dev(div5, input2);
    			set_input_value(input2, /*med*/ ctx[33].frecuencia);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			append_dev(div8, i_1);
    			append_dev(div9, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "blur", /*blur_handler*/ ctx[14], false, false, false),
    					listen_dev(input0, "input", input0_input_handler_1),
    					listen_dev(input1, "blur", /*blur_handler_1*/ ctx[16], false, false, false),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input2, "blur", /*blur_handler_2*/ ctx[18], false, false, false),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(i_1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*medicamentosSeleccionados*/ 8 && t0_value !== (t0_value = /*med*/ ctx[33].nombre + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*medicamentosSeleccionados*/ 8 && input0.value !== /*med*/ ctx[33].concentracion) {
    				set_input_value(input0, /*med*/ ctx[33].concentracion);
    			}

    			if (dirty[0] & /*medicamentosSeleccionados*/ 8 && input1.value !== /*med*/ ctx[33].cantidad) {
    				set_input_value(input1, /*med*/ ctx[33].cantidad);
    			}

    			if (dirty[0] & /*medicamentosSeleccionados*/ 8 && input2.value !== /*med*/ ctx[33].frecuencia) {
    				set_input_value(input2, /*med*/ ctx[33].frecuencia);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(80:28) {#each medicamentosSeleccionados as med, i}",
    		ctx
    	});

    	return block;
    }

    // (236:48) {:else}
    function create_else_block_1(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-image");
    			add_location(i, file$i, 237, 52, 13020);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 236, 48, 12932);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(236:48) {:else}",
    		ctx
    	});

    	return block;
    }

    // (232:44) {#if estudio.tipo === 'LAB'}
    function create_if_block_2$2(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-microscope");
    			add_location(i, file$i, 233, 52, 12734);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 232, 48, 12646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(232:44) {#if estudio.tipo === 'LAB'}",
    		ctx
    	});

    	return block;
    }

    // (225:36) {#each estudios as estudio}
    function create_each_block_1$1(ctx) {
    	let li;
    	let div;
    	let t0;
    	let t1_value = /*estudio*/ ctx[30].descripcion + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*estudio*/ ctx[30].tipo === "LAB") return create_if_block_2$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[23](/*estudio*/ ctx[30], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(div, "class", "p-2");
    			set_style(div, "cursor", "pointer");
    			add_location(div, file$i, 227, 44, 12336);
    			add_location(li, file$i, 225, 40, 12125);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}

    			if (dirty[0] & /*estudios*/ 32 && t1_value !== (t1_value = /*estudio*/ ctx[30].descripcion + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(225:36) {#each estudios as estudio}",
    		ctx
    	});

    	return block;
    }

    // (266:37) {:else}
    function create_else_block$2(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-image");
    			add_location(i, file$i, 267, 42, 14577);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 266, 37, 14500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(266:37) {:else}",
    		ctx
    	});

    	return block;
    }

    // (262:32) {#if item.tipo === 'LAB'}
    function create_if_block_1$4(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-microscope");
    			add_location(i, file$i, 263, 45, 14332);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 262, 40, 14252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(262:32) {#if item.tipo === 'LAB'}",
    		ctx
    	});

    	return block;
    }

    // (260:24) {#each estudiosSeleccionados as item, i}
    function create_each_block$4(ctx) {
    	let li;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[27].descripcion + "";
    	let t1;
    	let t2;
    	let div;
    	let a;
    	let i_1;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[27].tipo === "LAB") return create_if_block_1$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[24](/*i*/ ctx[29], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t0 = text("\r\n                                 ");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			div = element("div");
    			a = element("a");
    			i_1 = element("i");
    			add_location(span, file$i, 270, 38, 14731);
    			attr_dev(i_1, "class", "mdi-18px mdi mdi-trash-can-outline");
    			add_location(i_1, file$i, 289, 41, 15950);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-danger");
    			attr_dev(a, "data-toggle", "tooltip");
    			attr_dev(a, "data-placement", "top");
    			attr_dev(a, "data-original-title", "Eliminar diagnostico");
    			add_location(a, file$i, 282, 36, 15480);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", "0");
    			set_style(div, "right", "0");
    			set_style(div, "padding", "10px");
    			set_style(div, "background-color", "white");
    			set_style(div, "border-bottom-left-radius", "5px");
    			add_location(div, file$i, 271, 32, 14796);
    			add_location(li, file$i, 260, 28, 14147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if_block.m(li, null);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, div);
    			append_dev(div, a);
    			append_dev(a, i_1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler_4), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li, t0);
    				}
    			}

    			if (dirty[0] & /*estudiosSeleccionados*/ 64 && t1_value !== (t1_value = /*item*/ ctx[27].descripcion + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(260:24) {#each estudiosSeleccionados as item, i}",
    		ctx
    	});

    	return block;
    }

    // (297:24) {#if estudiosSeleccionados.length === 0}
    function create_if_block$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let ul;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "No tienes agregado ningún\r\n                                            estudio";
    			t1 = space();
    			ul = element("ul");
    			attr_dev(p, "class", "alert-body text-center mt-3");
    			add_location(p, file$i, 303, 40, 16655);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$i, 299, 36, 16442);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$i, 310, 36, 17033);
    			attr_dev(div1, "class", "col-md-12");
    			add_location(div1, file$i, 298, 32, 16381);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$i, 297, 28, 16330);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div1, t1);
    			append_dev(div1, ul);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(297:24) {#if estudiosSeleccionados.length === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div31;
    	let h4;
    	let t1;
    	let div11;
    	let div2;
    	let div0;
    	let t3;
    	let div1;
    	let a0;
    	let i0;
    	let a0_href_value;
    	let link_action;
    	let t4;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div5;
    	let div4;
    	let input0;
    	let t5;
    	let ul0;
    	let div3;
    	let t6;
    	let li0;
    	let a1;
    	let i1;
    	let t7;
    	let t8;
    	let div6;
    	let t9;
    	let div24;
    	let div13;
    	let div12;
    	let t11;
    	let div16;
    	let div15;
    	let a2;
    	let i2;
    	let t12;
    	let div14;
    	let button0;
    	let i3;
    	let t13;
    	let t14;
    	let button1;
    	let i4;
    	let t15;
    	let t16;
    	let div23;
    	let div22;
    	let div20;
    	let div19;
    	let div18;
    	let input1;
    	let t17;
    	let ul1;
    	let div17;
    	let t18;
    	let li1;
    	let a3;
    	let i5;
    	let t19;
    	let t20;
    	let div21;
    	let ul2;
    	let t21;
    	let t22;
    	let div30;
    	let div26;
    	let div25;
    	let t24;
    	let div29;
    	let div28;
    	let div27;
    	let textarea;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*medicamentos*/ ctx[4];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*medicamentosSeleccionados*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each1_else = null;

    	if (!each_value_2.length) {
    		each1_else = create_else_block_2(ctx);
    	}

    	let each_value_1 = /*estudios*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*estudiosSeleccionados*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let if_block = /*estudiosSeleccionados*/ ctx[6].length === 0 && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div31 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Receta";
    			t1 = space();
    			div11 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Medicamentos";
    			t3 = space();
    			div1 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t4 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			input0 = element("input");
    			t5 = space();
    			ul0 = element("ul");
    			div3 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t6 = space();
    			li0 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			t7 = text("Agregar manualmente");
    			t8 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			if (each1_else) {
    				each1_else.c();
    			}

    			t9 = space();
    			div24 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div12.textContent = "Estudios";
    			t11 = space();
    			div16 = element("div");
    			div15 = element("div");
    			a2 = element("a");
    			i2 = element("i");
    			t12 = space();
    			div14 = element("div");
    			button0 = element("button");
    			i3 = element("i");
    			t13 = text("\r\n                        Imprimir estudios");
    			t14 = space();
    			button1 = element("button");
    			i4 = element("i");
    			t15 = text("\r\n                        Agregar nuevo estudio");
    			t16 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			input1 = element("input");
    			t17 = space();
    			ul1 = element("ul");
    			div17 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t18 = space();
    			li1 = element("li");
    			a3 = element("a");
    			i5 = element("i");
    			t19 = text(" Agregar manualmente");
    			t20 = space();
    			div21 = element("div");
    			ul2 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t21 = space();
    			if (if_block) if_block.c();
    			t22 = space();
    			div30 = element("div");
    			div26 = element("div");
    			div25 = element("div");
    			div25.textContent = "Instrucciones";
    			t24 = space();
    			div29 = element("div");
    			div28 = element("div");
    			div27 = element("div");
    			textarea = element("textarea");
    			attr_dev(h4, "class", "alert-heading");
    			add_location(h4, file$i, 18, 4, 525);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$i, 21, 12, 647);
    			attr_dev(i0, "class", "mdi mdi-printer");
    			add_location(i0, file$i, 28, 20, 994);
    			attr_dev(a0, "href", a0_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}`);
    			attr_dev(a0, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(a0, "data-tooltip", "Imprimir");
    			add_location(a0, file$i, 23, 16, 748);
    			attr_dev(div1, "class", "card-controls");
    			add_location(div1, file$i, 22, 12, 703);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$i, 20, 8, 608);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "data-toggle", "dropdown");
    			attr_dev(input0, "aria-haspopup", "true");
    			attr_dev(input0, "aria-expanded", "true");
    			attr_dev(input0, "placeholder", "Buscar medicamentos");
    			add_location(input0, file$i, 38, 32, 1366);
    			attr_dev(div3, "class", "contenidoLista");
    			add_location(div3, file$i, 54, 36, 2387);
    			attr_dev(i1, "class", "mdi mdi-plus");
    			add_location(i1, file$i, 70, 45, 3479);
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file$i, 68, 40, 3294);
    			attr_dev(li0, "class", "defecto");
    			add_location(li0, file$i, 67, 36, 3232);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$i, 48, 32, 1953);
    			attr_dev(div4, "class", "dropdown");
    			add_location(div4, file$i, 37, 28, 1310);
    			attr_dev(div5, "class", "col-lg-6");
    			add_location(div5, file$i, 36, 24, 1258);
    			attr_dev(div6, "class", "col-lg-12");
    			add_location(div6, file$i, 78, 24, 3840);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$i, 35, 20, 1215);
    			attr_dev(div8, "class", "col-md-12 mb-2");
    			add_location(div8, file$i, 34, 16, 1165);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$i, 33, 12, 1130);
    			attr_dev(div10, "class", "card-body");
    			add_location(div10, file$i, 32, 8, 1093);
    			attr_dev(div11, "class", "card m-b-20 mt-3");
    			add_location(div11, file$i, 19, 4, 568);
    			attr_dev(div12, "class", "card-title");
    			add_location(div12, file$i, 172, 12, 9514);
    			attr_dev(div13, "class", "card-header");
    			add_location(div13, file$i, 171, 8, 9475);
    			attr_dev(i2, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i2, file$i, 182, 20, 9874);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "data-toggle", "dropdown");
    			attr_dev(a2, "aria-haspopup", "true");
    			attr_dev(a2, "aria-expanded", "false");
    			add_location(a2, file$i, 176, 16, 9672);
    			attr_dev(i3, "class", "mdi mdi-printer");
    			add_location(i3, file$i, 186, 25, 10107);
    			attr_dev(button0, "class", "dropdown-item text-primary");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$i, 185, 20, 10024);
    			attr_dev(i4, "class", "mdi mdi-plus");
    			add_location(i4, file$i, 190, 25, 10315);
    			attr_dev(button1, "class", "dropdown-item text-success");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$i, 189, 20, 10232);
    			attr_dev(div14, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div14, file$i, 184, 16, 9955);
    			attr_dev(div15, "class", "dropdown dropdown-vnc");
    			add_location(div15, file$i, 175, 12, 9619);
    			attr_dev(div16, "class", "card-controls");
    			add_location(div16, file$i, 174, 8, 9578);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "data-toggle", "dropdown");
    			attr_dev(input1, "aria-haspopup", "true");
    			attr_dev(input1, "aria-expanded", "false");
    			attr_dev(input1, "placeholder", "Buscar estudios");
    			add_location(input1, file$i, 204, 32, 10828);
    			attr_dev(div17, "class", "contenidoLista");
    			attr_dev(div17, "data-bind", "foreach: listado");
    			add_location(div17, file$i, 220, 36, 11841);
    			attr_dev(i5, "class", "mdi mdi-plus");
    			add_location(i5, file$i, 249, 45, 13701);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "data-bind", "click: agregarManualmente");
    			add_location(a3, file$i, 246, 40, 13515);
    			attr_dev(li1, "class", "defecto");
    			add_location(li1, file$i, 245, 36, 13453);
    			attr_dev(ul1, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul1, "id", "buscador");
    			attr_dev(ul1, "x-placement", "bottom-start");
    			set_style(ul1, "position", "absolute");
    			set_style(ul1, "will-change", "transform");
    			set_style(ul1, "border-radius", "5px");
    			set_style(ul1, "top", "0px");
    			set_style(ul1, "left", "0px");
    			set_style(ul1, "transform", "translate3d(0px, 36px, 0px)");
    			add_location(ul1, file$i, 214, 32, 11406);
    			attr_dev(div18, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div18, file$i, 201, 28, 10675);
    			attr_dev(div19, "class", "col-lg-6 col-md-12");
    			add_location(div19, file$i, 200, 24, 10613);
    			attr_dev(div20, "class", "col-12 row");
    			add_location(div20, file$i, 199, 16, 10563);
    			attr_dev(ul2, "class", "list-info");
    			add_location(ul2, file$i, 258, 20, 14029);
    			attr_dev(div21, "class", "col-12");
    			add_location(div21, file$i, 257, 16, 13987);
    			attr_dev(div22, "class", "row");
    			add_location(div22, file$i, 198, 12, 10528);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file$i, 197, 8, 10491);
    			attr_dev(div24, "class", "card m-b-20");
    			add_location(div24, file$i, 170, 4, 9440);
    			attr_dev(div25, "class", "card-title");
    			add_location(div25, file$i, 326, 12, 17496);
    			attr_dev(div26, "class", "card-header");
    			add_location(div26, file$i, 325, 8, 17457);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$i, 331, 20, 17679);
    			attr_dev(div27, "class", "col-12");
    			add_location(div27, file$i, 330, 16, 17637);
    			attr_dev(div28, "class", "row");
    			add_location(div28, file$i, 329, 12, 17602);
    			attr_dev(div29, "class", "card-body");
    			add_location(div29, file$i, 328, 8, 17565);
    			attr_dev(div30, "class", "card m-b-20");
    			add_location(div30, file$i, 324, 4, 17422);
    			attr_dev(div31, "class", "alert alert-secondary");
    			attr_dev(div31, "role", "alert");
    			add_location(div31, file$i, 17, 0, 471);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div31, anchor);
    			append_dev(div31, h4);
    			append_dev(div31, t1);
    			append_dev(div31, div11);
    			append_dev(div11, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(a0, i0);
    			append_dev(div11, t4);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, div4);
    			append_dev(div4, input0);
    			set_input_value(input0, /*sltBuscarMedicamentos*/ ctx[1]);
    			append_dev(div4, t5);
    			append_dev(div4, ul0);
    			append_dev(ul0, div3);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div3, null);
    			}

    			append_dev(ul0, t6);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t7);
    			append_dev(div7, t8);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div6, null);
    			}

    			if (each1_else) {
    				each1_else.m(div6, null);
    			}

    			append_dev(div31, t9);
    			append_dev(div31, div24);
    			append_dev(div24, div13);
    			append_dev(div13, div12);
    			append_dev(div24, t11);
    			append_dev(div24, div16);
    			append_dev(div16, div15);
    			append_dev(div15, a2);
    			append_dev(a2, i2);
    			append_dev(div15, t12);
    			append_dev(div15, div14);
    			append_dev(div14, button0);
    			append_dev(button0, i3);
    			append_dev(button0, t13);
    			append_dev(div14, t14);
    			append_dev(div14, button1);
    			append_dev(button1, i4);
    			append_dev(button1, t15);
    			append_dev(div24, t16);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, input1);
    			set_input_value(input1, /*sltBuscarEstudios*/ ctx[2]);
    			append_dev(div18, t17);
    			append_dev(div18, ul1);
    			append_dev(ul1, div17);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div17, null);
    			}

    			append_dev(ul1, t18);
    			append_dev(ul1, li1);
    			append_dev(li1, a3);
    			append_dev(a3, i5);
    			append_dev(a3, t19);
    			append_dev(div22, t20);
    			append_dev(div22, div21);
    			append_dev(div21, ul2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul2, null);
    			}

    			append_dev(ul2, t21);
    			if (if_block) if_block.m(ul2, null);
    			append_dev(div31, t22);
    			append_dev(div31, div30);
    			append_dev(div30, div26);
    			append_dev(div26, div25);
    			append_dev(div30, t24);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, textarea);
    			set_input_value(textarea, /*instrucciones*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input0, "input", /*input_handler*/ ctx[11], false, false, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[13]), false, true, false),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[21]),
    					listen_dev(input1, "input", /*input_handler_1*/ ctx[22], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[25]),
    					listen_dev(textarea, "blur", /*blur_handler_3*/ ctx[26], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*idPaciente, idHistoria*/ 384 && a0_href_value !== (a0_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty[0] & /*sltBuscarMedicamentos*/ 2 && input0.value !== /*sltBuscarMedicamentos*/ ctx[1]) {
    				set_input_value(input0, /*sltBuscarMedicamentos*/ ctx[1]);
    			}

    			if (dirty[0] & /*dispatch, medicamentos*/ 528) {
    				each_value_3 = /*medicamentos*/ ctx[4];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3$1(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*dispatch, medicamentosSeleccionados*/ 520) {
    				each_value_2 = /*medicamentosSeleccionados*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;

    				if (each_value_2.length) {
    					if (each1_else) {
    						each1_else.d(1);
    						each1_else = null;
    					}
    				} else if (!each1_else) {
    					each1_else = create_else_block_2(ctx);
    					each1_else.c();
    					each1_else.m(div6, null);
    				}
    			}

    			if (dirty[0] & /*sltBuscarEstudios*/ 4 && input1.value !== /*sltBuscarEstudios*/ ctx[2]) {
    				set_input_value(input1, /*sltBuscarEstudios*/ ctx[2]);
    			}

    			if (dirty[0] & /*dispatch, estudios*/ 544) {
    				each_value_1 = /*estudios*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div17, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*dispatch, estudiosSeleccionados*/ 576) {
    				each_value = /*estudiosSeleccionados*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul2, t21);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*estudiosSeleccionados*/ ctx[6].length === 0) {
    				if (if_block) ; else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(ul2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*instrucciones*/ 1) {
    				set_input_value(textarea, /*instrucciones*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div31);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			if (each1_else) each1_else.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OrdenesMedicas", slots, []);
    	let dispatch = createEventDispatcher();
    	let { instrucciones } = $$props;
    	let { medicamentos } = $$props;
    	let { sltBuscarMedicamentos } = $$props;
    	let { sltBuscarEstudios } = $$props;
    	let { medicamentosSeleccionados } = $$props;
    	let { estudios } = $$props;
    	let { estudiosSeleccionados } = $$props;
    	let { idHistoria } = $$props;
    	let { idPaciente } = $$props;

    	const writable_props = [
    		"instrucciones",
    		"medicamentos",
    		"sltBuscarMedicamentos",
    		"sltBuscarEstudios",
    		"medicamentosSeleccionados",
    		"estudios",
    		"estudiosSeleccionados",
    		"idHistoria",
    		"idPaciente"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OrdenesMedicas> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		sltBuscarMedicamentos = this.value;
    		$$invalidate(1, sltBuscarMedicamentos);
    	}

    	const input_handler = () => dispatch("buscarMedicamentos");
    	const click_handler = medicamento => dispatch("agregarMedicamento", medicamento.descripcion);
    	const click_handler_1 = () => dispatch("agregarMedicamento", sltBuscarMedicamentos);
    	const blur_handler = () => dispatch("modificado");

    	function input0_input_handler_1(each_value_2, i) {
    		each_value_2[i].concentracion = this.value;
    		$$invalidate(3, medicamentosSeleccionados);
    	}

    	const blur_handler_1 = () => dispatch("modificado");

    	function input1_input_handler(each_value_2, i) {
    		each_value_2[i].cantidad = this.value;
    		$$invalidate(3, medicamentosSeleccionados);
    	}

    	const blur_handler_2 = () => dispatch("modificado");

    	function input2_input_handler(each_value_2, i) {
    		each_value_2[i].frecuencia = this.value;
    		$$invalidate(3, medicamentosSeleccionados);
    	}

    	const click_handler_2 = i => dispatch("eliminarMedicamento", i);

    	function input1_input_handler_1() {
    		sltBuscarEstudios = this.value;
    		$$invalidate(2, sltBuscarEstudios);
    	}

    	const input_handler_1 = () => dispatch("buscandoEstudios");

    	const click_handler_3 = estudio => dispatch("agregarEstudio", {
    		id: estudio.id,
    		descripcion: estudio.descripcion,
    		tipo: estudio.tipo
    	});

    	const click_handler_4 = i => dispatch("eliminarEstudio", i);

    	function textarea_input_handler() {
    		instrucciones = this.value;
    		$$invalidate(0, instrucciones);
    	}

    	const blur_handler_3 = () => dispatch("modificado");

    	$$self.$$set = $$props => {
    		if ("instrucciones" in $$props) $$invalidate(0, instrucciones = $$props.instrucciones);
    		if ("medicamentos" in $$props) $$invalidate(4, medicamentos = $$props.medicamentos);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(1, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("sltBuscarEstudios" in $$props) $$invalidate(2, sltBuscarEstudios = $$props.sltBuscarEstudios);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(3, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    		if ("estudios" in $$props) $$invalidate(5, estudios = $$props.estudios);
    		if ("estudiosSeleccionados" in $$props) $$invalidate(6, estudiosSeleccionados = $$props.estudiosSeleccionados);
    		if ("idHistoria" in $$props) $$invalidate(7, idHistoria = $$props.idHistoria);
    		if ("idPaciente" in $$props) $$invalidate(8, idPaciente = $$props.idPaciente);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		link,
    		dispatch,
    		instrucciones,
    		medicamentos,
    		sltBuscarMedicamentos,
    		sltBuscarEstudios,
    		medicamentosSeleccionados,
    		estudios,
    		estudiosSeleccionados,
    		idHistoria,
    		idPaciente
    	});

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) $$invalidate(9, dispatch = $$props.dispatch);
    		if ("instrucciones" in $$props) $$invalidate(0, instrucciones = $$props.instrucciones);
    		if ("medicamentos" in $$props) $$invalidate(4, medicamentos = $$props.medicamentos);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(1, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("sltBuscarEstudios" in $$props) $$invalidate(2, sltBuscarEstudios = $$props.sltBuscarEstudios);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(3, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    		if ("estudios" in $$props) $$invalidate(5, estudios = $$props.estudios);
    		if ("estudiosSeleccionados" in $$props) $$invalidate(6, estudiosSeleccionados = $$props.estudiosSeleccionados);
    		if ("idHistoria" in $$props) $$invalidate(7, idHistoria = $$props.idHistoria);
    		if ("idPaciente" in $$props) $$invalidate(8, idPaciente = $$props.idPaciente);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		instrucciones,
    		sltBuscarMedicamentos,
    		sltBuscarEstudios,
    		medicamentosSeleccionados,
    		medicamentos,
    		estudios,
    		estudiosSeleccionados,
    		idHistoria,
    		idPaciente,
    		dispatch,
    		input0_input_handler,
    		input_handler,
    		click_handler,
    		click_handler_1,
    		blur_handler,
    		input0_input_handler_1,
    		blur_handler_1,
    		input1_input_handler,
    		blur_handler_2,
    		input2_input_handler,
    		click_handler_2,
    		input1_input_handler_1,
    		input_handler_1,
    		click_handler_3,
    		click_handler_4,
    		textarea_input_handler,
    		blur_handler_3
    	];
    }

    class OrdenesMedicas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$j,
    			create_fragment$j,
    			safe_not_equal,
    			{
    				instrucciones: 0,
    				medicamentos: 4,
    				sltBuscarMedicamentos: 1,
    				sltBuscarEstudios: 2,
    				medicamentosSeleccionados: 3,
    				estudios: 5,
    				estudiosSeleccionados: 6,
    				idHistoria: 7,
    				idPaciente: 8
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OrdenesMedicas",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*instrucciones*/ ctx[0] === undefined && !("instrucciones" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'instrucciones'");
    		}

    		if (/*medicamentos*/ ctx[4] === undefined && !("medicamentos" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'medicamentos'");
    		}

    		if (/*sltBuscarMedicamentos*/ ctx[1] === undefined && !("sltBuscarMedicamentos" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'sltBuscarMedicamentos'");
    		}

    		if (/*sltBuscarEstudios*/ ctx[2] === undefined && !("sltBuscarEstudios" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'sltBuscarEstudios'");
    		}

    		if (/*medicamentosSeleccionados*/ ctx[3] === undefined && !("medicamentosSeleccionados" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'medicamentosSeleccionados'");
    		}

    		if (/*estudios*/ ctx[5] === undefined && !("estudios" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'estudios'");
    		}

    		if (/*estudiosSeleccionados*/ ctx[6] === undefined && !("estudiosSeleccionados" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'estudiosSeleccionados'");
    		}

    		if (/*idHistoria*/ ctx[7] === undefined && !("idHistoria" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'idHistoria'");
    		}

    		if (/*idPaciente*/ ctx[8] === undefined && !("idPaciente" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'idPaciente'");
    		}
    	}

    	get instrucciones() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set instrucciones(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get medicamentos() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set medicamentos(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sltBuscarMedicamentos() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sltBuscarMedicamentos(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sltBuscarEstudios() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sltBuscarEstudios(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get medicamentosSeleccionados() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set medicamentosSeleccionados(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get estudios() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set estudios(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get estudiosSeleccionados() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set estudiosSeleccionados(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get idHistoria() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idHistoria(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get idPaciente() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idPaciente(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\SignosVitales.svelte generated by Svelte v3.29.0 */

    function create_fragment$k(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SignosVitales", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SignosVitales> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class SignosVitales extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SignosVitales",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\Pages\AtencionMedica\HistoriaClinica.svelte generated by Svelte v3.29.0 */

    const { console: console_1$6 } = globals;
    const file$j = "src\\Pages\\AtencionMedica\\HistoriaClinica.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[100] = list[i];
    	child_ctx[101] = list;
    	child_ctx[102] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[103] = list[i];
    	return child_ctx;
    }

    // (378:4) {#if errorServer}
    function create_if_block_5(ctx) {
    	let errorserver;
    	let current;

    	errorserver = new ErrorConexion({
    			props: {
    				msgError: "Ocurrio un error en la conexion con el servidor, vuelva a intentarlo o llame al administrador"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(errorserver.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errorserver, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errorserver.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errorserver.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errorserver, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(378:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (394:16) {#if !cargando && !errorServer}
    function create_if_block_4$1(ctx) {
    	let div;
    	let i0;
    	let t0;
    	let i1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			i1 = element("i");
    			i1.textContent = "listo y guardado";
    			attr_dev(i0, "class", "mdi mdi-check-all");
    			add_location(i0, file$j, 397, 24, 13267);
    			add_location(i1, file$j, 397, 56, 13299);
    			attr_dev(div, "class", "guardando mr-2 text-success");
    			add_location(div, file$j, 394, 20, 13153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i0);
    			append_dev(div, t0);
    			append_dev(div, i1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(394:16) {#if !cargando && !errorServer}",
    		ctx
    	});

    	return block;
    }

    // (401:16) {#if errorServer}
    function create_if_block_3$1(ctx) {
    	let div;
    	let i0;
    	let t0;
    	let i1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			i1 = element("i");
    			i1.textContent = "error al guardar";
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$j, 404, 20, 13539);
    			add_location(i1, file$j, 404, 50, 13569);
    			attr_dev(div, "class", "guardando mr-2 text-danger");
    			add_location(div, file$j, 401, 20, 13430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i0);
    			append_dev(div, t0);
    			append_dev(div, i1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(401:16) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (408:16) {#if cargando && !errorServer}
    function create_if_block_2$3(ctx) {
    	let div;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t = text(" Guardando");
    			attr_dev(i, "class", "mdi mdi-cached mdi-spin");
    			add_location(i, file$j, 411, 24, 13829);
    			attr_dev(div, "class", "guardando mr-2 text-secondary");
    			add_location(div, file$j, 408, 20, 13713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(408:16) {#if cargando && !errorServer}",
    		ctx
    	});

    	return block;
    }

    // (1010:40) {#each filtroDiagnostico as diagnostico}
    function create_each_block_1$2(ctx) {
    	let li;
    	let div;
    	let span;
    	let t0_value = /*diagnostico*/ ctx[103].c + "";
    	let t0;
    	let t1;
    	let t2_value = /*diagnostico*/ ctx[103].d + "";
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[74](/*diagnostico*/ ctx[103], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$j, 1018, 52, 48412);
    			attr_dev(div, "class", "p-2");
    			add_location(div, file$j, 1011, 48, 47953);
    			add_location(li, file$j, 1010, 44, 47899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*filtroDiagnostico*/ 2097152 && t0_value !== (t0_value = /*diagnostico*/ ctx[103].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*filtroDiagnostico*/ 2097152 && t2_value !== (t2_value = /*diagnostico*/ ctx[103].d + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(1010:40) {#each filtroDiagnostico as diagnostico}",
    		ctx
    	});

    	return block;
    }

    // (1068:40) {#if item.comentario !== undefined}
    function create_if_block_1$5(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[78].call(input, /*each_value*/ ctx[101], /*i*/ ctx[102]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control border-primary");
    			attr_dev(input, "placeholder", "Comentario");
    			add_location(input, file$j, 1070, 52, 51725);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$j, 1069, 48, 51654);
    			attr_dev(div1, "class", "row mt-3");
    			add_location(div1, file$j, 1068, 44, 51582);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*item*/ ctx[100].comentario);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input, "input", input_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && input.value !== /*item*/ ctx[100].comentario) {
    				set_input_value(input, /*item*/ ctx[100].comentario);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(1068:40) {#if item.comentario !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (1041:32) {#each diagnosticosSeleccionados as item, i}
    function create_each_block$5(ctx) {
    	let li;
    	let span0;
    	let t0_value = /*item*/ ctx[100].c + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*item*/ ctx[100].d + "";
    	let t2;
    	let t3;
    	let div;
    	let a0;
    	let i0;
    	let t4;
    	let a1;
    	let i1;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[76](/*i*/ ctx[102], ...args);
    	}

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[77](/*i*/ ctx[102], ...args);
    	}

    	let if_block = /*item*/ ctx[100].comentario !== undefined && create_if_block_1$5(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(" ");
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t4 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "badge badge-primary");
    			add_location(span0, file$j, 1042, 40, 49775);
    			add_location(span1, file$j, 1044, 47, 49918);
    			attr_dev(i0, "class", "mdi-18px mdi mdi-comment-plus-outline");
    			add_location(i0, file$j, 1053, 49, 50604);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "text-primary");
    			attr_dev(a0, "data-tooltip", "Comentar");
    			add_location(a0, file$j, 1048, 44, 50236);
    			attr_dev(i1, "class", "mdi-18px mdi mdi-trash-can-outline");
    			add_location(i1, file$j, 1062, 49, 51211);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "text-danger");
    			attr_dev(a1, "data-tooltip", "Eliminar");
    			add_location(a1, file$j, 1057, 44, 50853);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", "0");
    			set_style(div, "right", "0");
    			set_style(div, "padding", "10px");
    			set_style(div, "background-color", "white");
    			set_style(div, "border-bottom-left-radius", "5px");
    			add_location(div, file$j, 1045, 40, 49981);
    			add_location(li, file$j, 1041, 36, 49729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(span0, t0);
    			append_dev(li, t1);
    			append_dev(li, span1);
    			append_dev(span1, t2);
    			append_dev(li, t3);
    			append_dev(li, div);
    			append_dev(div, a0);
    			append_dev(a0, i0);
    			append_dev(div, t4);
    			append_dev(div, a1);
    			append_dev(a1, i1);
    			append_dev(li, t5);
    			if (if_block) if_block.m(li, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(click_handler_2), false, true, false),
    					listen_dev(a1, "click", prevent_default(click_handler_3), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && t0_value !== (t0_value = /*item*/ ctx[100].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && t2_value !== (t2_value = /*item*/ ctx[100].d + "")) set_data_dev(t2, t2_value);

    			if (/*item*/ ctx[100].comentario !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$5(ctx);
    					if_block.c();
    					if_block.m(li, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(1041:32) {#each diagnosticosSeleccionados as item, i}",
    		ctx
    	});

    	return block;
    }

    // (1077:32) {#if diagnosticosSeleccionados.length === 0}
    function create_if_block$8(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let ul;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "No tienes agregado ningún\r\n                                                    diagnostico";
    			t1 = space();
    			ul = element("ul");
    			attr_dev(p, "class", "alert-body text-center mt-3");
    			add_location(p, file$j, 1083, 48, 52588);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$j, 1079, 44, 52343);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$j, 1090, 44, 53026);
    			attr_dev(div1, "class", "col-md-12");
    			add_location(div1, file$j, 1078, 40, 52274);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$j, 1077, 36, 52215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div1, t1);
    			append_dev(div1, ul);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(1077:32) {#if diagnosticosSeleccionados.length === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let asideatencion;
    	let t0;
    	let div6;
    	let t1;
    	let div5;
    	let div0;
    	let h50;
    	let span0;
    	let t3;
    	let span1;
    	let t4_value = /*paciente*/ ctx[1].nombres + "";
    	let t4;
    	let t5;
    	let t6_value = /*paciente*/ ctx[1].apellidos + "";
    	let t6;
    	let t7;
    	let div2;
    	let div1;
    	let t8;
    	let t9;
    	let t10;
    	let button0;
    	let i0;
    	let t11;
    	let div4;
    	let div3;
    	let button1;
    	let i1;
    	let t12;
    	let sapn0;
    	let t14;
    	let button2;
    	let i2;
    	let t15;
    	let sapn1;
    	let t17;
    	let button3;
    	let i3;
    	let t18;
    	let sapn2;
    	let t20;
    	let button4;
    	let i4;
    	let t21;
    	let sapn3;
    	let t23;
    	let header;
    	let t24;
    	let main;
    	let div136;
    	let div135;
    	let div10;
    	let div8;
    	let div7;
    	let t26;
    	let div9;
    	let textarea0;
    	let t27;
    	let div14;
    	let div12;
    	let div11;
    	let t29;
    	let div13;
    	let textarea1;
    	let t30;
    	let div52;
    	let div16;
    	let div15;
    	let t32;
    	let div51;
    	let div33;
    	let div18;
    	let div17;
    	let label0;
    	let t34;
    	let input0;
    	let t35;
    	let div20;
    	let div19;
    	let label1;
    	let t37;
    	let input1;
    	let t38;
    	let div22;
    	let div21;
    	let label2;
    	let t40;
    	let input2;
    	let t41;
    	let div24;
    	let div23;
    	let label3;
    	let t43;
    	let input3;
    	let t44;
    	let div26;
    	let div25;
    	let label4;
    	let t46;
    	let input4;
    	let t47;
    	let div28;
    	let div27;
    	let label5;
    	let t49;
    	let input5;
    	let t50;
    	let div30;
    	let div29;
    	let label6;
    	let t52;
    	let input6;
    	let t53;
    	let div32;
    	let div31;
    	let label7;
    	let t55;
    	let input7;
    	let t56;
    	let hr0;
    	let t57;
    	let div48;
    	let div35;
    	let div34;
    	let label8;
    	let t59;
    	let input8;
    	let t60;
    	let div37;
    	let div36;
    	let label9;
    	let t62;
    	let input9;
    	let t63;
    	let div39;
    	let div38;
    	let label10;
    	let t65;
    	let input10;
    	let t66;
    	let div41;
    	let div40;
    	let label11;
    	let t68;
    	let input11;
    	let t69;
    	let div43;
    	let div42;
    	let label12;
    	let t71;
    	let input12;
    	let t72;
    	let div45;
    	let div44;
    	let label13;
    	let t74;
    	let input13;
    	let t75;
    	let div47;
    	let div46;
    	let label14;
    	let t77;
    	let input14;
    	let t78;
    	let h51;
    	let t80;
    	let hr1;
    	let t81;
    	let div50;
    	let div49;
    	let label15;
    	let input15;
    	let t82;
    	let span2;
    	let t83;
    	let span3;
    	let t85;
    	let label16;
    	let input16;
    	let t86;
    	let span4;
    	let t87;
    	let span5;
    	let t89;
    	let label17;
    	let input17;
    	let t90;
    	let span6;
    	let t91;
    	let span7;
    	let t93;
    	let label18;
    	let input18;
    	let t94;
    	let span8;
    	let t95;
    	let span9;
    	let t97;
    	let label19;
    	let input19;
    	let t98;
    	let span10;
    	let t99;
    	let span11;
    	let t101;
    	let label20;
    	let input20;
    	let t102;
    	let span12;
    	let t103;
    	let span13;
    	let t105;
    	let label21;
    	let input21;
    	let t106;
    	let span14;
    	let t107;
    	let span15;
    	let t109;
    	let label22;
    	let input22;
    	let t110;
    	let span16;
    	let t111;
    	let span17;
    	let t113;
    	let label23;
    	let input23;
    	let t114;
    	let span18;
    	let t115;
    	let span19;
    	let t117;
    	let div102;
    	let div54;
    	let div53;
    	let t119;
    	let div101;
    	let div100;
    	let div59;
    	let div58;
    	let label24;
    	let i5;
    	let t120;
    	let t121;
    	let div57;
    	let div55;
    	let input24;
    	let t122;
    	let div56;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t126;
    	let div63;
    	let div62;
    	let label25;
    	let i6;
    	let t127;
    	let t128;
    	let div61;
    	let div60;
    	let input25;
    	let t129;
    	let div67;
    	let div66;
    	let label26;
    	let i7;
    	let t130;
    	let t131;
    	let div65;
    	let div64;
    	let input26;
    	let t132;
    	let div72;
    	let div71;
    	let label27;
    	let i8;
    	let t133;
    	let t134;
    	let div70;
    	let div68;
    	let input27;
    	let t135;
    	let div69;
    	let input28;
    	let t136;
    	let div99;
    	let h52;
    	let t138;
    	let hr2;
    	let t139;
    	let div98;
    	let div77;
    	let div76;
    	let label28;
    	let i9;
    	let t140;
    	let t141;
    	let div75;
    	let div73;
    	let input29;
    	let t142;
    	let div74;
    	let select1;
    	let option3;
    	let option4;
    	let t145;
    	let div83;
    	let div82;
    	let label29;
    	let i10;
    	let t146;
    	let t147;
    	let div81;
    	let div80;
    	let div79;
    	let input30;
    	let t148;
    	let div78;
    	let span20;
    	let t150;
    	let div89;
    	let div88;
    	let label30;
    	let i11;
    	let t151;
    	let t152;
    	let div87;
    	let div86;
    	let div85;
    	let input31;
    	let t153;
    	let div84;
    	let span21;
    	let t155;
    	let div93;
    	let div92;
    	let label31;
    	let i12;
    	let t156;
    	let t157;
    	let div91;
    	let div90;
    	let input32;
    	let t158;
    	let div97;
    	let div96;
    	let label32;
    	let t160;
    	let div95;
    	let div94;
    	let input33;
    	let t161;
    	let div109;
    	let div104;
    	let div103;
    	let t163;
    	let div107;
    	let div106;
    	let a0;
    	let i13;
    	let t164;
    	let div105;
    	let button5;
    	let t166;
    	let button6;
    	let t168;
    	let button7;
    	let t170;
    	let div108;
    	let textarea2;
    	let t171;
    	let div121;
    	let div111;
    	let div110;
    	let t173;
    	let div114;
    	let div113;
    	let a1;
    	let i14;
    	let t174;
    	let div112;
    	let button8;
    	let i15;
    	let t175;
    	let t176;
    	let div120;
    	let div119;
    	let div117;
    	let div116;
    	let input34;
    	let t177;
    	let ul0;
    	let div115;
    	let t178;
    	let li;
    	let a2;
    	let i16;
    	let t179;
    	let t180;
    	let div118;
    	let ul1;
    	let t181;
    	let t182;
    	let ordenesmedicas;
    	let updating_idHistoria;
    	let updating_idPaciente;
    	let updating_estudiosSeleccionados;
    	let updating_medicamentosSeleccionados;
    	let updating_sltBuscarMedicamentos;
    	let updating_sltBuscarEstudios;
    	let updating_medicamentos;
    	let updating_instrucciones;
    	let updating_estudios;
    	let t183;
    	let div125;
    	let div123;
    	let div122;
    	let t185;
    	let div124;
    	let textarea3;
    	let t186;
    	let div134;
    	let div133;
    	let div132;
    	let div127;
    	let div126;
    	let t188;
    	let div131;
    	let div130;
    	let div128;
    	let label33;
    	let t190;
    	let input35;
    	let t191;
    	let div129;
    	let label34;
    	let t193;
    	let input36;
    	let t194;
    	let modaldatospaciente;
    	let t195;
    	let modaltratamientos;
    	let t196;
    	let modalinterconsulta;
    	let t197;
    	let modalantecedentes;
    	let current;
    	let mounted;
    	let dispose;
    	asideatencion = new AsideAtencion({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[20] && create_if_block_5(ctx);
    	let if_block1 = !/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20] && create_if_block_4$1(ctx);
    	let if_block2 = /*errorServer*/ ctx[20] && create_if_block_3$1(ctx);
    	let if_block3 = /*cargando*/ ctx[13] && !/*errorServer*/ ctx[20] && create_if_block_2$3(ctx);
    	header = new Header({ $$inline: true });
    	let each_value_1 = /*filtroDiagnostico*/ ctx[21];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*diagnosticosSeleccionados*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	let if_block4 = /*diagnosticosSeleccionados*/ ctx[5].length === 0 && create_if_block$8(ctx);

    	function ordenesmedicas_idHistoria_binding(value) {
    		/*ordenesmedicas_idHistoria_binding*/ ctx[79].call(null, value);
    	}

    	function ordenesmedicas_idPaciente_binding(value) {
    		/*ordenesmedicas_idPaciente_binding*/ ctx[80].call(null, value);
    	}

    	function ordenesmedicas_estudiosSeleccionados_binding(value) {
    		/*ordenesmedicas_estudiosSeleccionados_binding*/ ctx[81].call(null, value);
    	}

    	function ordenesmedicas_medicamentosSeleccionados_binding(value) {
    		/*ordenesmedicas_medicamentosSeleccionados_binding*/ ctx[82].call(null, value);
    	}

    	function ordenesmedicas_sltBuscarMedicamentos_binding(value) {
    		/*ordenesmedicas_sltBuscarMedicamentos_binding*/ ctx[83].call(null, value);
    	}

    	function ordenesmedicas_sltBuscarEstudios_binding(value) {
    		/*ordenesmedicas_sltBuscarEstudios_binding*/ ctx[84].call(null, value);
    	}

    	function ordenesmedicas_medicamentos_binding(value) {
    		/*ordenesmedicas_medicamentos_binding*/ ctx[85].call(null, value);
    	}

    	function ordenesmedicas_instrucciones_binding(value) {
    		/*ordenesmedicas_instrucciones_binding*/ ctx[86].call(null, value);
    	}

    	function ordenesmedicas_estudios_binding(value) {
    		/*ordenesmedicas_estudios_binding*/ ctx[87].call(null, value);
    	}

    	let ordenesmedicas_props = {};

    	if (/*params*/ ctx[0].idHistoria !== void 0) {
    		ordenesmedicas_props.idHistoria = /*params*/ ctx[0].idHistoria;
    	}

    	if (/*params*/ ctx[0].idPaciente !== void 0) {
    		ordenesmedicas_props.idPaciente = /*params*/ ctx[0].idPaciente;
    	}

    	if (/*estudiosSeleccionados*/ ctx[18] !== void 0) {
    		ordenesmedicas_props.estudiosSeleccionados = /*estudiosSeleccionados*/ ctx[18];
    	}

    	if (/*medicamentosSeleccionados*/ ctx[15] !== void 0) {
    		ordenesmedicas_props.medicamentosSeleccionados = /*medicamentosSeleccionados*/ ctx[15];
    	}

    	if (/*sltBuscarMedicamentos*/ ctx[14] !== void 0) {
    		ordenesmedicas_props.sltBuscarMedicamentos = /*sltBuscarMedicamentos*/ ctx[14];
    	}

    	if (/*sltBuscarEstudios*/ ctx[16] !== void 0) {
    		ordenesmedicas_props.sltBuscarEstudios = /*sltBuscarEstudios*/ ctx[16];
    	}

    	if (/*medicamentos*/ ctx[6] !== void 0) {
    		ordenesmedicas_props.medicamentos = /*medicamentos*/ ctx[6];
    	}

    	if (/*historia*/ ctx[7].instrucciones !== void 0) {
    		ordenesmedicas_props.instrucciones = /*historia*/ ctx[7].instrucciones;
    	}

    	if (/*estudios*/ ctx[17] !== void 0) {
    		ordenesmedicas_props.estudios = /*estudios*/ ctx[17];
    	}

    	ordenesmedicas = new OrdenesMedicas({
    			props: ordenesmedicas_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(ordenesmedicas, "idHistoria", ordenesmedicas_idHistoria_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "idPaciente", ordenesmedicas_idPaciente_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "estudiosSeleccionados", ordenesmedicas_estudiosSeleccionados_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "medicamentosSeleccionados", ordenesmedicas_medicamentosSeleccionados_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "sltBuscarMedicamentos", ordenesmedicas_sltBuscarMedicamentos_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "sltBuscarEstudios", ordenesmedicas_sltBuscarEstudios_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "medicamentos", ordenesmedicas_medicamentos_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "instrucciones", ordenesmedicas_instrucciones_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "estudios", ordenesmedicas_estudios_binding));
    	ordenesmedicas.$on("eliminarEstudio", /*eliminarEstudios*/ ctx[30]);
    	ordenesmedicas.$on("agregarEstudio", /*agregarEstudio*/ ctx[25]);
    	ordenesmedicas.$on("buscandoEstudios", /*searchEstudios*/ ctx[24]);
    	ordenesmedicas.$on("modificado", /*guardarHistoria*/ ctx[32]);
    	ordenesmedicas.$on("buscarMedicamentos", /*searchMedicamentos*/ ctx[22]);
    	ordenesmedicas.$on("agregarMedicamento", /*agregarMedicamento*/ ctx[31]);
    	ordenesmedicas.$on("eliminarMedicamento", /*eliminarMedicamento*/ ctx[28]);

    	modaldatospaciente = new ModalDatosPaciente({
    			props: {
    				paciente: /*paciente*/ ctx[1],
    				edad: /*edad*/ ctx[2],
    				seguro: /*seguro*/ ctx[3]
    			},
    			$$inline: true
    		});

    	modaltratamientos = new ModalTratamientos({ $$inline: true });
    	modalinterconsulta = new ModalInterconsulta({ $$inline: true });
    	modalantecedentes = new ModalAntecedentes({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(asideatencion.$$.fragment);
    			t0 = space();
    			div6 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div5 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			span0 = element("span");
    			span0.textContent = "Historia Clinica";
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			if (if_block3) if_block3.c();
    			t10 = space();
    			button0 = element("button");
    			i0 = element("i");
    			t11 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			t12 = space();
    			sapn0 = element("sapn");
    			sapn0.textContent = "Datos del Paciente";
    			t14 = space();
    			button2 = element("button");
    			i2 = element("i");
    			t15 = space();
    			sapn1 = element("sapn");
    			sapn1.textContent = "Agregar Campo";
    			t17 = space();
    			button3 = element("button");
    			i3 = element("i");
    			t18 = space();
    			sapn2 = element("sapn");
    			sapn2.textContent = "Imprimir";
    			t20 = space();
    			button4 = element("button");
    			i4 = element("i");
    			t21 = space();
    			sapn3 = element("sapn");
    			sapn3.textContent = "Anular";
    			t23 = space();
    			create_component(header.$$.fragment);
    			t24 = space();
    			main = element("main");
    			div136 = element("div");
    			div135 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = "Motivo de consulta";
    			t26 = space();
    			div9 = element("div");
    			textarea0 = element("textarea");
    			t27 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Historia de la enfermedad";
    			t29 = space();
    			div13 = element("div");
    			textarea1 = element("textarea");
    			t30 = space();
    			div52 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div15.textContent = "Historia Ginecologica";
    			t32 = space();
    			div51 = element("div");
    			div33 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			label0 = element("label");
    			label0.textContent = "Fecha ultima menstruación";
    			t34 = space();
    			input0 = element("input");
    			t35 = space();
    			div20 = element("div");
    			div19 = element("div");
    			label1 = element("label");
    			label1.textContent = "Fecha ultimo pap";
    			t37 = space();
    			input1 = element("input");
    			t38 = space();
    			div22 = element("div");
    			div21 = element("div");
    			label2 = element("label");
    			label2.textContent = "Fecha ultimo parto";
    			t40 = space();
    			input2 = element("input");
    			t41 = space();
    			div24 = element("div");
    			div23 = element("div");
    			label3 = element("label");
    			label3.textContent = "Fecha ultimo aborto";
    			t43 = space();
    			input3 = element("input");
    			t44 = space();
    			div26 = element("div");
    			div25 = element("div");
    			label4 = element("label");
    			label4.textContent = "Fecha ultima cesárea";
    			t46 = space();
    			input4 = element("input");
    			t47 = space();
    			div28 = element("div");
    			div27 = element("div");
    			label5 = element("label");
    			label5.textContent = "Intervalo flujo menstrual";
    			t49 = space();
    			input5 = element("input");
    			t50 = space();
    			div30 = element("div");
    			div29 = element("div");
    			label6 = element("label");
    			label6.textContent = "Cantidad flujo menstrual";
    			t52 = space();
    			input6 = element("input");
    			t53 = space();
    			div32 = element("div");
    			div31 = element("div");
    			label7 = element("label");
    			label7.textContent = "Duracion flujo menstrual";
    			t55 = space();
    			input7 = element("input");
    			t56 = space();
    			hr0 = element("hr");
    			t57 = space();
    			div48 = element("div");
    			div35 = element("div");
    			div34 = element("div");
    			label8 = element("label");
    			label8.textContent = "Gesta";
    			t59 = space();
    			input8 = element("input");
    			t60 = space();
    			div37 = element("div");
    			div36 = element("div");
    			label9 = element("label");
    			label9.textContent = "Para";
    			t62 = space();
    			input9 = element("input");
    			t63 = space();
    			div39 = element("div");
    			div38 = element("div");
    			label10 = element("label");
    			label10.textContent = "Abortos";
    			t65 = space();
    			input10 = element("input");
    			t66 = space();
    			div41 = element("div");
    			div40 = element("div");
    			label11 = element("label");
    			label11.textContent = "Cesáreas";
    			t68 = space();
    			input11 = element("input");
    			t69 = space();
    			div43 = element("div");
    			div42 = element("div");
    			label12 = element("label");
    			label12.textContent = "Espontáneos";
    			t71 = space();
    			input12 = element("input");
    			t72 = space();
    			div45 = element("div");
    			div44 = element("div");
    			label13 = element("label");
    			label13.textContent = "Provocados";
    			t74 = space();
    			input13 = element("input");
    			t75 = space();
    			div47 = element("div");
    			div46 = element("div");
    			label14 = element("label");
    			label14.textContent = "Legrados";
    			t77 = space();
    			input14 = element("input");
    			t78 = space();
    			h51 = element("h5");
    			h51.textContent = "Planificación";
    			t80 = space();
    			hr1 = element("hr");
    			t81 = space();
    			div50 = element("div");
    			div49 = element("div");
    			label15 = element("label");
    			input15 = element("input");
    			t82 = space();
    			span2 = element("span");
    			t83 = space();
    			span3 = element("span");
    			span3.textContent = "Sangrado Vaginal";
    			t85 = space();
    			label16 = element("label");
    			input16 = element("input");
    			t86 = space();
    			span4 = element("span");
    			t87 = space();
    			span5 = element("span");
    			span5.textContent = "Vida Sexual Activa";
    			t89 = space();
    			label17 = element("label");
    			input17 = element("input");
    			t90 = space();
    			span6 = element("span");
    			t91 = space();
    			span7 = element("span");
    			span7.textContent = "Anticonceptivos Orales";
    			t93 = space();
    			label18 = element("label");
    			input18 = element("input");
    			t94 = space();
    			span8 = element("span");
    			t95 = space();
    			span9 = element("span");
    			span9.textContent = "DIU";
    			t97 = space();
    			label19 = element("label");
    			input19 = element("input");
    			t98 = space();
    			span10 = element("span");
    			t99 = space();
    			span11 = element("span");
    			span11.textContent = "AQV";
    			t101 = space();
    			label20 = element("label");
    			input20 = element("input");
    			t102 = space();
    			span12 = element("span");
    			t103 = space();
    			span13 = element("span");
    			span13.textContent = "Condón";
    			t105 = space();
    			label21 = element("label");
    			input21 = element("input");
    			t106 = space();
    			span14 = element("span");
    			t107 = space();
    			span15 = element("span");
    			span15.textContent = "Norplant";
    			t109 = space();
    			label22 = element("label");
    			input22 = element("input");
    			t110 = space();
    			span16 = element("span");
    			t111 = space();
    			span17 = element("span");
    			span17.textContent = "Ritmo";
    			t113 = space();
    			label23 = element("label");
    			input23 = element("input");
    			t114 = space();
    			span18 = element("span");
    			t115 = space();
    			span19 = element("span");
    			span19.textContent = "Coito Interruptus";
    			t117 = space();
    			div102 = element("div");
    			div54 = element("div");
    			div53 = element("div");
    			div53.textContent = "Signos vitales";
    			t119 = space();
    			div101 = element("div");
    			div100 = element("div");
    			div59 = element("div");
    			div58 = element("div");
    			label24 = element("label");
    			i5 = element("i");
    			t120 = text(" Temperatura");
    			t121 = space();
    			div57 = element("div");
    			div55 = element("div");
    			input24 = element("input");
    			t122 = space();
    			div56 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "°C";
    			option1 = element("option");
    			option1.textContent = "°K";
    			option2 = element("option");
    			option2.textContent = "°F";
    			t126 = space();
    			div63 = element("div");
    			div62 = element("div");
    			label25 = element("label");
    			i6 = element("i");
    			t127 = text(" Frecuencia\r\n                                    respiratoria");
    			t128 = space();
    			div61 = element("div");
    			div60 = element("div");
    			input25 = element("input");
    			t129 = space();
    			div67 = element("div");
    			div66 = element("div");
    			label26 = element("label");
    			i7 = element("i");
    			t130 = text(" Frecuencia\r\n                                    cardiaca");
    			t131 = space();
    			div65 = element("div");
    			div64 = element("div");
    			input26 = element("input");
    			t132 = space();
    			div72 = element("div");
    			div71 = element("div");
    			label27 = element("label");
    			i8 = element("i");
    			t133 = text(" Presion\r\n                                    alterial (mmHg)");
    			t134 = space();
    			div70 = element("div");
    			div68 = element("div");
    			input27 = element("input");
    			t135 = space();
    			div69 = element("div");
    			input28 = element("input");
    			t136 = space();
    			div99 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Otros parametros";
    			t138 = space();
    			hr2 = element("hr");
    			t139 = space();
    			div98 = element("div");
    			div77 = element("div");
    			div76 = element("div");
    			label28 = element("label");
    			i9 = element("i");
    			t140 = text(" Peso");
    			t141 = space();
    			div75 = element("div");
    			div73 = element("div");
    			input29 = element("input");
    			t142 = space();
    			div74 = element("div");
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Lb";
    			option4 = element("option");
    			option4.textContent = "Kg";
    			t145 = space();
    			div83 = element("div");
    			div82 = element("div");
    			label29 = element("label");
    			i10 = element("i");
    			t146 = text(" Escala de\r\n                                            glasgow");
    			t147 = space();
    			div81 = element("div");
    			div80 = element("div");
    			div79 = element("div");
    			input30 = element("input");
    			t148 = space();
    			div78 = element("div");
    			span20 = element("span");
    			span20.textContent = "/ 15";
    			t150 = space();
    			div89 = element("div");
    			div88 = element("div");
    			label30 = element("label");
    			i11 = element("i");
    			t151 = text(" Escala de dolor");
    			t152 = space();
    			div87 = element("div");
    			div86 = element("div");
    			div85 = element("div");
    			input31 = element("input");
    			t153 = space();
    			div84 = element("div");
    			span21 = element("span");
    			span21.textContent = "/ 10";
    			t155 = space();
    			div93 = element("div");
    			div92 = element("div");
    			label31 = element("label");
    			i12 = element("i");
    			t156 = text(" Saturación\r\n                                            de oxigeno");
    			t157 = space();
    			div91 = element("div");
    			div90 = element("div");
    			input32 = element("input");
    			t158 = space();
    			div97 = element("div");
    			div96 = element("div");
    			label32 = element("label");
    			label32.textContent = "Otros";
    			t160 = space();
    			div95 = element("div");
    			div94 = element("div");
    			input33 = element("input");
    			t161 = space();
    			div109 = element("div");
    			div104 = element("div");
    			div103 = element("div");
    			div103.textContent = "Examen Fisico";
    			t163 = space();
    			div107 = element("div");
    			div106 = element("div");
    			a0 = element("a");
    			i13 = element("i");
    			t164 = space();
    			div105 = element("div");
    			button5 = element("button");
    			button5.textContent = "Action";
    			t166 = space();
    			button6 = element("button");
    			button6.textContent = "Another action";
    			t168 = space();
    			button7 = element("button");
    			button7.textContent = "Something else here";
    			t170 = space();
    			div108 = element("div");
    			textarea2 = element("textarea");
    			t171 = space();
    			div121 = element("div");
    			div111 = element("div");
    			div110 = element("div");
    			div110.textContent = "Diagnosticos";
    			t173 = space();
    			div114 = element("div");
    			div113 = element("div");
    			a1 = element("a");
    			i14 = element("i");
    			t174 = space();
    			div112 = element("div");
    			button8 = element("button");
    			i15 = element("i");
    			t175 = text("\r\n                                Agregar nuevo diagnostico");
    			t176 = space();
    			div120 = element("div");
    			div119 = element("div");
    			div117 = element("div");
    			div116 = element("div");
    			input34 = element("input");
    			t177 = space();
    			ul0 = element("ul");
    			div115 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t178 = space();
    			li = element("li");
    			a2 = element("a");
    			i16 = element("i");
    			t179 = text("Agregar\r\n                                                manualmente");
    			t180 = space();
    			div118 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t181 = space();
    			if (if_block4) if_block4.c();
    			t182 = space();
    			create_component(ordenesmedicas.$$.fragment);
    			t183 = space();
    			div125 = element("div");
    			div123 = element("div");
    			div122 = element("div");
    			div122.textContent = "Observaciones";
    			t185 = space();
    			div124 = element("div");
    			textarea3 = element("textarea");
    			t186 = space();
    			div134 = element("div");
    			div133 = element("div");
    			div132 = element("div");
    			div127 = element("div");
    			div126 = element("div");
    			div126.textContent = "Fecha y hora";
    			t188 = space();
    			div131 = element("div");
    			div130 = element("div");
    			div128 = element("div");
    			label33 = element("label");
    			label33.textContent = "Fecha";
    			t190 = space();
    			input35 = element("input");
    			t191 = space();
    			div129 = element("div");
    			label34 = element("label");
    			label34.textContent = "Hora";
    			t193 = space();
    			input36 = element("input");
    			t194 = space();
    			create_component(modaldatospaciente.$$.fragment);
    			t195 = space();
    			create_component(modaltratamientos.$$.fragment);
    			t196 = space();
    			create_component(modalinterconsulta.$$.fragment);
    			t197 = space();
    			create_component(modalantecedentes.$$.fragment);
    			attr_dev(span0, "class", "badge badge-primary");
    			attr_dev(span0, "data-bind", "text: titulo");
    			add_location(span0, file$j, 383, 16, 12664);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$j, 386, 16, 12804);
    			add_location(h50, file$j, 382, 12, 12642);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$j, 381, 8, 12606);
    			attr_dev(div1, "class", "guardar-documento");
    			add_location(div1, file$j, 392, 12, 13051);
    			attr_dev(div2, "class", "col-md-6");
    			set_style(div2, "text-align", "right");
    			add_location(div2, file$j, 391, 8, 12988);
    			attr_dev(i0, "class", "mdi mdi-content-save-outline");
    			add_location(i0, file$j, 422, 12, 14199);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success flotante svelte-14y2n0i");
    			attr_dev(button0, "data-tooltip", "Guardar");
    			add_location(button0, file$j, 416, 8, 13975);
    			attr_dev(i1, "data-bind", "class: icon");
    			attr_dev(i1, "class", "mdi mdi-comment-eye");
    			add_location(i1, file$j, 432, 20, 14638);
    			attr_dev(sapn0, "data-bind", "text: text");
    			add_location(sapn0, file$j, 433, 20, 14717);
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", "#modalDatosPersonales");
    			set_style(button1, "box-shadow", "none");
    			attr_dev(button1, "class", "btn btn-outline-secondary btn-sm");
    			add_location(button1, file$j, 426, 16, 14384);
    			attr_dev(i2, "data-bind", "class: icon");
    			attr_dev(i2, "class", "mdi mdi-text");
    			add_location(i2, file$j, 441, 20, 15038);
    			attr_dev(sapn1, "data-bind", "text: text");
    			add_location(sapn1, file$j, 442, 20, 15110);
    			attr_dev(button2, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button2, "box-shadow", "none");
    			attr_dev(button2, "class", "btn btn-outline-dark btn-sm");
    			add_location(button2, file$j, 436, 16, 14818);
    			attr_dev(i3, "data-bind", "class: icon");
    			attr_dev(i3, "class", "mdi mdi-printer");
    			add_location(i3, file$j, 460, 20, 15878);
    			attr_dev(sapn2, "data-bind", "text: text");
    			add_location(sapn2, file$j, 461, 20, 15953);
    			attr_dev(button3, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button3, "box-shadow", "none");
    			attr_dev(button3, "class", "btn btn-outline-dark btn-sm btn-hover-white");
    			add_location(button3, file$j, 455, 16, 15642);
    			attr_dev(i4, "data-bind", "class: icon");
    			attr_dev(i4, "class", "mdi mdi-delete");
    			add_location(i4, file$j, 479, 20, 16697);
    			attr_dev(sapn3, "data-bind", "text: text");
    			add_location(sapn3, file$j, 480, 20, 16771);
    			attr_dev(button4, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button4, "box-shadow", "none");
    			attr_dev(button4, "class", "btn btn-outline-danger btn-sm");
    			add_location(button4, file$j, 474, 16, 16475);
    			attr_dev(div3, "class", "dropdown");
    			attr_dev(div3, "data-bind", "foreach: actionButtons");
    			add_location(div3, file$j, 425, 12, 14309);
    			attr_dev(div4, "class", "col-lg-12");
    			add_location(div4, file$j, 424, 8, 14272);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$j, 380, 4, 12579);
    			attr_dev(div6, "class", "contenedor-datos");
    			attr_dev(div6, "id", "divHeaderBar");
    			add_location(div6, file$j, 376, 0, 12360);
    			attr_dev(div7, "class", "card-title");
    			add_location(div7, file$j, 496, 20, 17238);
    			attr_dev(div8, "class", "card-header");
    			add_location(div8, file$j, 495, 16, 17191);
    			attr_dev(textarea0, "class", "form-control");
    			set_style(textarea0, "width", "100%");
    			set_style(textarea0, "display", "block");
    			set_style(textarea0, "height", "150px");
    			attr_dev(textarea0, "rows", "3");
    			attr_dev(textarea0, "name", "Comentario");
    			attr_dev(textarea0, "data-bind", "value: atencionMedica.motivoConsulta");
    			add_location(textarea0, file$j, 499, 20, 17373);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$j, 498, 16, 17328);
    			attr_dev(div10, "data-bind", "if: perfil().motivoConsulta");
    			attr_dev(div10, "class", "card m-b-20 margen-mobile");
    			add_location(div10, file$j, 491, 12, 17046);
    			attr_dev(div11, "class", "card-title");
    			add_location(div11, file$j, 514, 20, 17981);
    			attr_dev(div12, "class", "card-header");
    			add_location(div12, file$j, 513, 16, 17934);
    			attr_dev(textarea1, "class", "form-control");
    			attr_dev(textarea1, "data-bind", "value: atencionMedica.historiaEnfermedad");
    			set_style(textarea1, "width", "100%");
    			set_style(textarea1, "display", "block");
    			set_style(textarea1, "height", "150px");
    			attr_dev(textarea1, "rows", "3");
    			attr_dev(textarea1, "name", "Comentario");
    			add_location(textarea1, file$j, 517, 20, 18123);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$j, 516, 16, 18078);
    			attr_dev(div14, "class", "card m-b-20 autosave");
    			add_location(div14, file$j, 510, 12, 17851);
    			attr_dev(div15, "class", "card-title");
    			add_location(div15, file$j, 531, 20, 18743);
    			attr_dev(div16, "class", "card-header");
    			add_location(div16, file$j, 530, 16, 18696);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$j, 539, 32, 19082);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$j, 540, 32, 19170);
    			attr_dev(div17, "class", "form-group");
    			add_location(div17, file$j, 538, 28, 19024);
    			attr_dev(div18, "class", "col-lg-3");
    			add_location(div18, file$j, 537, 24, 18972);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$j, 545, 32, 19498);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$j, 546, 32, 19570);
    			attr_dev(div19, "class", "form-group");
    			add_location(div19, file$j, 544, 28, 19440);
    			attr_dev(div20, "class", "col-lg-3");
    			add_location(div20, file$j, 543, 24, 19388);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$j, 551, 32, 19889);
    			attr_dev(input2, "type", "date");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$j, 552, 32, 19963);
    			attr_dev(div21, "class", "form-group");
    			add_location(div21, file$j, 550, 28, 19831);
    			attr_dev(div22, "class", "col-lg-3");
    			add_location(div22, file$j, 549, 24, 19779);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$j, 557, 32, 20284);
    			attr_dev(input3, "type", "date");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$j, 558, 32, 20359);
    			attr_dev(div23, "class", "form-group");
    			add_location(div23, file$j, 556, 28, 20226);
    			attr_dev(div24, "class", "col-lg-3");
    			add_location(div24, file$j, 555, 24, 20174);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$j, 563, 32, 20681);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$j, 564, 32, 20764);
    			attr_dev(div25, "class", "form-group");
    			add_location(div25, file$j, 562, 28, 20623);
    			attr_dev(div26, "class", "col-lg-3");
    			add_location(div26, file$j, 561, 24, 20571);
    			attr_dev(label5, "for", "");
    			add_location(label5, file$j, 569, 32, 21087);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "placeholder", "Dias");
    			add_location(input5, file$j, 570, 32, 21168);
    			attr_dev(div27, "class", "form-group");
    			add_location(div27, file$j, 568, 28, 21029);
    			attr_dev(div28, "class", "col-lg-3");
    			add_location(div28, file$j, 567, 24, 20977);
    			attr_dev(label6, "for", "");
    			add_location(label6, file$j, 575, 32, 21517);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "placeholder", "Dias");
    			add_location(input6, file$j, 576, 32, 21597);
    			attr_dev(div29, "class", "form-group");
    			add_location(div29, file$j, 574, 28, 21459);
    			attr_dev(div30, "class", "col-lg-3");
    			add_location(div30, file$j, 573, 24, 21407);
    			attr_dev(label7, "for", "");
    			add_location(label7, file$j, 581, 32, 21945);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "placeholder", "Dias");
    			add_location(input7, file$j, 582, 32, 22025);
    			attr_dev(div31, "class", "form-group");
    			add_location(div31, file$j, 580, 28, 21887);
    			attr_dev(div32, "class", "col-lg-3");
    			add_location(div32, file$j, 579, 24, 21835);
    			attr_dev(div33, "class", "row");
    			add_location(div33, file$j, 536, 20, 18929);
    			add_location(hr0, file$j, 586, 20, 22287);
    			attr_dev(label8, "for", "");
    			add_location(label8, file$j, 590, 32, 22461);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "class", "form-control");
    			add_location(input8, file$j, 591, 32, 22522);
    			attr_dev(div34, "class", "form-group");
    			add_location(div34, file$j, 589, 28, 22403);
    			attr_dev(div35, "class", "col");
    			add_location(div35, file$j, 588, 24, 22356);
    			attr_dev(label9, "for", "");
    			add_location(label9, file$j, 596, 32, 22829);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "form-control");
    			add_location(input9, file$j, 597, 32, 22889);
    			attr_dev(div36, "class", "form-group");
    			add_location(div36, file$j, 595, 28, 22771);
    			attr_dev(div37, "class", "col");
    			add_location(div37, file$j, 594, 24, 22724);
    			attr_dev(label10, "for", "");
    			add_location(label10, file$j, 602, 32, 23195);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control");
    			add_location(input10, file$j, 603, 32, 23258);
    			attr_dev(div38, "class", "form-group");
    			add_location(div38, file$j, 601, 28, 23137);
    			attr_dev(div39, "class", "col");
    			add_location(div39, file$j, 600, 24, 23090);
    			attr_dev(label11, "for", "");
    			add_location(label11, file$j, 608, 32, 23567);
    			attr_dev(input11, "type", "number");
    			attr_dev(input11, "class", "form-control");
    			add_location(input11, file$j, 609, 32, 23638);
    			attr_dev(div40, "class", "form-group");
    			add_location(div40, file$j, 607, 28, 23509);
    			attr_dev(div41, "class", "col");
    			add_location(div41, file$j, 606, 24, 23462);
    			attr_dev(label12, "for", "");
    			add_location(label12, file$j, 614, 32, 23948);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control");
    			add_location(input12, file$j, 615, 32, 24022);
    			attr_dev(div42, "class", "form-group");
    			add_location(div42, file$j, 613, 28, 23890);
    			attr_dev(div43, "class", "col");
    			add_location(div43, file$j, 612, 24, 23843);
    			attr_dev(label13, "for", "");
    			add_location(label13, file$j, 620, 32, 24335);
    			attr_dev(input13, "type", "number");
    			attr_dev(input13, "class", "form-control");
    			add_location(input13, file$j, 621, 32, 24401);
    			attr_dev(div44, "class", "form-group");
    			add_location(div44, file$j, 619, 28, 24277);
    			attr_dev(div45, "class", "col");
    			add_location(div45, file$j, 618, 24, 24230);
    			attr_dev(label14, "for", "");
    			add_location(label14, file$j, 626, 32, 24713);
    			attr_dev(input14, "type", "number");
    			attr_dev(input14, "class", "form-control");
    			add_location(input14, file$j, 627, 32, 24777);
    			attr_dev(div46, "class", "form-group");
    			add_location(div46, file$j, 625, 28, 24655);
    			attr_dev(div47, "class", "col");
    			add_location(div47, file$j, 624, 24, 24608);
    			attr_dev(div48, "class", "row");
    			add_location(div48, file$j, 587, 20, 22313);
    			attr_dev(h51, "class", "mt-3");
    			add_location(h51, file$j, 631, 20, 25006);
    			add_location(hr1, file$j, 632, 20, 25070);
    			attr_dev(input15, "type", "checkbox");
    			attr_dev(input15, "name", "option");
    			input15.__value = "1";
    			input15.value = input15.__value;
    			attr_dev(input15, "class", "cstm-switch-input");
    			add_location(input15, file$j, 636, 32, 25263);
    			attr_dev(span2, "class", "cstm-switch-indicator bg-success ");
    			add_location(span2, file$j, 637, 32, 25450);
    			attr_dev(span3, "class", "cstm-switch-description");
    			add_location(span3, file$j, 638, 32, 25539);
    			attr_dev(label15, "class", "cstm-switch mr-4 mb-4");
    			add_location(label15, file$j, 635, 28, 25192);
    			attr_dev(input16, "type", "checkbox");
    			attr_dev(input16, "name", "option");
    			input16.__value = "1";
    			input16.value = input16.__value;
    			attr_dev(input16, "class", "cstm-switch-input");
    			add_location(input16, file$j, 641, 32, 25739);
    			attr_dev(span4, "class", "cstm-switch-indicator bg-success ");
    			add_location(span4, file$j, 642, 32, 25927);
    			attr_dev(span5, "class", "cstm-switch-description");
    			add_location(span5, file$j, 643, 32, 26016);
    			attr_dev(label16, "class", "cstm-switch mr-4 mb-4");
    			add_location(label16, file$j, 640, 28, 25668);
    			attr_dev(input17, "type", "checkbox");
    			attr_dev(input17, "name", "option");
    			input17.__value = "1";
    			input17.value = input17.__value;
    			attr_dev(input17, "class", "cstm-switch-input");
    			add_location(input17, file$j, 646, 32, 26218);
    			attr_dev(span6, "class", "cstm-switch-indicator bg-success ");
    			add_location(span6, file$j, 647, 32, 26411);
    			attr_dev(span7, "class", "cstm-switch-description");
    			add_location(span7, file$j, 648, 32, 26500);
    			attr_dev(label17, "class", "cstm-switch mr-4 mb-4");
    			add_location(label17, file$j, 645, 28, 26147);
    			attr_dev(input18, "type", "checkbox");
    			attr_dev(input18, "name", "option");
    			input18.__value = "1";
    			input18.value = input18.__value;
    			attr_dev(input18, "class", "cstm-switch-input");
    			add_location(input18, file$j, 651, 32, 26706);
    			attr_dev(span8, "class", "cstm-switch-indicator bg-success ");
    			add_location(span8, file$j, 652, 32, 26881);
    			attr_dev(span9, "class", "cstm-switch-description");
    			add_location(span9, file$j, 653, 32, 26970);
    			attr_dev(label18, "class", "cstm-switch mr-4 mb-4");
    			add_location(label18, file$j, 650, 28, 26635);
    			attr_dev(input19, "type", "checkbox");
    			attr_dev(input19, "name", "option");
    			input19.__value = "1";
    			input19.value = input19.__value;
    			attr_dev(input19, "class", "cstm-switch-input");
    			add_location(input19, file$j, 656, 32, 27157);
    			attr_dev(span10, "class", "cstm-switch-indicator bg-success ");
    			add_location(span10, file$j, 657, 32, 27332);
    			attr_dev(span11, "class", "cstm-switch-description");
    			add_location(span11, file$j, 658, 32, 27421);
    			attr_dev(label19, "class", "cstm-switch mr-4 mb-4");
    			add_location(label19, file$j, 655, 28, 27086);
    			attr_dev(input20, "type", "checkbox");
    			attr_dev(input20, "name", "option");
    			input20.__value = "1";
    			input20.value = input20.__value;
    			attr_dev(input20, "class", "cstm-switch-input");
    			add_location(input20, file$j, 661, 32, 27608);
    			attr_dev(span12, "class", "cstm-switch-indicator bg-success ");
    			add_location(span12, file$j, 662, 32, 27786);
    			attr_dev(span13, "class", "cstm-switch-description");
    			add_location(span13, file$j, 663, 32, 27875);
    			attr_dev(label20, "class", "cstm-switch mr-4 mb-4");
    			add_location(label20, file$j, 660, 28, 27537);
    			attr_dev(input21, "type", "checkbox");
    			attr_dev(input21, "name", "option");
    			input21.__value = "1";
    			input21.value = input21.__value;
    			attr_dev(input21, "class", "cstm-switch-input");
    			add_location(input21, file$j, 666, 32, 28072);
    			attr_dev(span14, "class", "cstm-switch-indicator bg-success ");
    			add_location(span14, file$j, 667, 32, 28252);
    			attr_dev(span15, "class", "cstm-switch-description");
    			add_location(span15, file$j, 668, 32, 28341);
    			attr_dev(label21, "class", "cstm-switch mr-4 mb-4");
    			add_location(label21, file$j, 665, 28, 28001);
    			attr_dev(input22, "type", "checkbox");
    			attr_dev(input22, "name", "option");
    			input22.__value = "1";
    			input22.value = input22.__value;
    			attr_dev(input22, "class", "cstm-switch-input");
    			add_location(input22, file$j, 671, 32, 28533);
    			attr_dev(span16, "class", "cstm-switch-indicator bg-success ");
    			add_location(span16, file$j, 672, 32, 28710);
    			attr_dev(span17, "class", "cstm-switch-description");
    			add_location(span17, file$j, 673, 32, 28799);
    			attr_dev(label22, "class", "cstm-switch mr-4 mb-4");
    			add_location(label22, file$j, 670, 28, 28462);
    			attr_dev(input23, "type", "checkbox");
    			attr_dev(input23, "name", "option");
    			input23.__value = "1";
    			input23.value = input23.__value;
    			attr_dev(input23, "class", "cstm-switch-input");
    			add_location(input23, file$j, 676, 32, 28988);
    			attr_dev(span18, "class", "cstm-switch-indicator bg-success ");
    			add_location(span18, file$j, 677, 32, 29176);
    			attr_dev(span19, "class", "cstm-switch-description");
    			add_location(span19, file$j, 678, 32, 29265);
    			attr_dev(label23, "class", "cstm-switch mr-4 mb-4");
    			add_location(label23, file$j, 675, 28, 28917);
    			attr_dev(div49, "class", "col-lg-12");
    			add_location(div49, file$j, 634, 24, 25139);
    			attr_dev(div50, "class", "row");
    			add_location(div50, file$j, 633, 20, 25096);
    			attr_dev(div51, "class", "card-body");
    			add_location(div51, file$j, 535, 16, 18884);
    			attr_dev(div52, "class", "card m-b-20");
    			add_location(div52, file$j, 529, 12, 18653);
    			attr_dev(div53, "class", "card-title");
    			add_location(div53, file$j, 687, 20, 29641);
    			attr_dev(div54, "class", "card-header");
    			add_location(div54, file$j, 686, 16, 29594);
    			attr_dev(i5, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i5, file$j, 694, 37, 29977);
    			attr_dev(label24, "for", "");
    			add_location(label24, file$j, 693, 32, 29925);
    			attr_dev(input24, "type", "number");
    			attr_dev(input24, "class", "form-control");
    			add_location(input24, file$j, 698, 40, 30226);
    			attr_dev(div55, "class", "col-lg-7");
    			add_location(div55, file$j, 697, 36, 30162);
    			option0.__value = "C";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$j, 708, 44, 30908);
    			option1.__value = "K";
    			option1.value = option1.__value;
    			add_location(option1, file$j, 709, 44, 30992);
    			option2.__value = "F";
    			option2.value = option2.__value;
    			add_location(option2, file$j, 710, 44, 31067);
    			attr_dev(select0, "class", "form-control");
    			if (/*temperatura*/ ctx[8].tipo === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[61].call(select0));
    			add_location(select0, file$j, 707, 40, 30775);
    			attr_dev(div56, "class", "col-lg-5");
    			add_location(div56, file$j, 705, 36, 30630);
    			attr_dev(div57, "class", "row");
    			add_location(div57, file$j, 696, 32, 30107);
    			attr_dev(div58, "class", "form-group");
    			add_location(div58, file$j, 692, 28, 29867);
    			attr_dev(div59, "class", "col-lg-3");
    			add_location(div59, file$j, 691, 24, 29815);
    			attr_dev(i6, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i6, file$j, 719, 37, 31487);
    			attr_dev(label25, "for", "");
    			add_location(label25, file$j, 718, 32, 31435);
    			attr_dev(input25, "type", "number");
    			attr_dev(input25, "class", "form-control");
    			add_location(input25, file$j, 724, 40, 31785);
    			attr_dev(div60, "class", "col-lg-12");
    			add_location(div60, file$j, 723, 36, 31720);
    			attr_dev(div61, "class", "row");
    			add_location(div61, file$j, 722, 32, 31665);
    			attr_dev(div62, "class", "form-group");
    			add_location(div62, file$j, 717, 28, 31377);
    			attr_dev(div63, "class", "col-lg-3");
    			add_location(div63, file$j, 716, 24, 31325);
    			attr_dev(i7, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i7, file$j, 737, 37, 32461);
    			attr_dev(label26, "for", "");
    			add_location(label26, file$j, 736, 32, 32409);
    			attr_dev(input26, "type", "number");
    			attr_dev(input26, "class", "form-control");
    			add_location(input26, file$j, 742, 40, 32756);
    			attr_dev(div64, "class", "col-lg-12");
    			add_location(div64, file$j, 741, 36, 32691);
    			attr_dev(div65, "class", "row");
    			add_location(div65, file$j, 740, 32, 32636);
    			attr_dev(div66, "class", "form-group");
    			add_location(div66, file$j, 735, 28, 32351);
    			attr_dev(div67, "class", "col-lg-3");
    			add_location(div67, file$j, 734, 24, 32299);
    			attr_dev(i8, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i8, file$j, 755, 37, 33428);
    			attr_dev(label27, "for", "");
    			add_location(label27, file$j, 754, 32, 33376);
    			attr_dev(input27, "type", "number");
    			attr_dev(input27, "class", "form-control");
    			add_location(input27, file$j, 760, 40, 33726);
    			attr_dev(div68, "class", "col-lg-6");
    			add_location(div68, file$j, 759, 36, 33662);
    			attr_dev(input28, "type", "number");
    			attr_dev(input28, "class", "form-control");
    			add_location(input28, file$j, 768, 40, 34195);
    			attr_dev(div69, "class", "col-lg-6");
    			add_location(div69, file$j, 767, 36, 34131);
    			attr_dev(div70, "class", "row");
    			add_location(div70, file$j, 758, 32, 33607);
    			attr_dev(div71, "class", "form-group");
    			add_location(div71, file$j, 753, 28, 33318);
    			attr_dev(div72, "class", "col-lg-3");
    			add_location(div72, file$j, 752, 24, 33266);
    			add_location(h52, file$j, 779, 28, 34751);
    			add_location(hr2, file$j, 780, 28, 34806);
    			attr_dev(i9, "class", "mdi mdi-weight-pound");
    			add_location(i9, file$j, 785, 45, 35079);
    			attr_dev(label28, "for", "");
    			add_location(label28, file$j, 784, 40, 35019);
    			attr_dev(input29, "type", "number");
    			attr_dev(input29, "class", "form-control");
    			add_location(input29, file$j, 789, 48, 35345);
    			attr_dev(div73, "class", "col-lg-7");
    			add_location(div73, file$j, 788, 44, 35273);
    			option3.__value = "Lb";
    			option3.value = option3.__value;
    			add_location(option3, file$j, 802, 52, 36249);
    			option4.__value = "Kg";
    			option4.value = option4.__value;
    			add_location(option4, file$j, 803, 52, 36333);
    			attr_dev(select1, "class", "form-control");
    			if (/*peso*/ ctx[10].tipo === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[67].call(select1));
    			add_location(select1, file$j, 798, 48, 35959);
    			attr_dev(div74, "class", "col-lg-5");
    			add_location(div74, file$j, 796, 44, 35798);
    			attr_dev(div75, "class", "row");
    			add_location(div75, file$j, 787, 40, 35210);
    			attr_dev(div76, "class", "form-group");
    			add_location(div76, file$j, 783, 36, 34953);
    			attr_dev(div77, "class", "col-lg-3");
    			add_location(div77, file$j, 782, 32, 34893);
    			attr_dev(i10, "class", "mdi mdi-human");
    			add_location(i10, file$j, 812, 45, 36826);
    			attr_dev(label29, "for", "");
    			add_location(label29, file$j, 811, 40, 36766);
    			attr_dev(input30, "type", "number");
    			attr_dev(input30, "class", "form-control");
    			attr_dev(input30, "max", "15");
    			attr_dev(input30, "maxlength", "2");
    			attr_dev(input30, "aria-label", "Recipient's username");
    			attr_dev(input30, "aria-describedby", "basic-addon2");
    			add_location(input30, file$j, 821, 52, 37425);
    			attr_dev(span20, "class", "input-group-text");
    			attr_dev(span20, "id", "basic-addon2");
    			add_location(span20, file$j, 834, 56, 38384);
    			attr_dev(div78, "class", "input-group-append");
    			add_location(div78, file$j, 831, 52, 38183);
    			attr_dev(div79, "class", "input-group");
    			set_style(div79, "width", "100%", 1);
    			set_style(div79, "float", "right");
    			add_location(div79, file$j, 817, 48, 37144);
    			attr_dev(div80, "class", "col-lg-12");
    			add_location(div80, file$j, 816, 44, 37071);
    			attr_dev(div81, "class", "row");
    			add_location(div81, file$j, 815, 40, 37008);
    			attr_dev(div82, "class", "form-group");
    			add_location(div82, file$j, 810, 36, 36700);
    			attr_dev(div83, "class", "col-lg-3");
    			add_location(div83, file$j, 809, 32, 36640);
    			attr_dev(i11, "class", "mdi mdi-emoticon-happy");
    			add_location(i11, file$j, 848, 45, 39206);
    			attr_dev(label30, "for", "");
    			add_location(label30, file$j, 847, 40, 39146);
    			attr_dev(input31, "type", "number");
    			attr_dev(input31, "class", "form-control");
    			attr_dev(input31, "max", "10");
    			attr_dev(input31, "maxlength", "2");
    			attr_dev(input31, "aria-label", "Recipient's username");
    			attr_dev(input31, "aria-describedby", "basic-addon2");
    			add_location(input31, file$j, 858, 52, 39861);
    			attr_dev(span21, "class", "input-group-text");
    			attr_dev(span21, "id", "basic-addon2");
    			add_location(span21, file$j, 871, 56, 40818);
    			attr_dev(div84, "class", "input-group-append");
    			add_location(div84, file$j, 868, 52, 40617);
    			attr_dev(div85, "class", "input-group");
    			set_style(div85, "width", "100%", 1);
    			set_style(div85, "float", "right");
    			add_location(div85, file$j, 854, 48, 39580);
    			attr_dev(div86, "class", "col-lg-12");
    			add_location(div86, file$j, 853, 44, 39507);
    			attr_dev(div87, "class", "row");
    			add_location(div87, file$j, 852, 40, 39444);
    			attr_dev(div88, "class", "form-group");
    			add_location(div88, file$j, 846, 36, 39080);
    			attr_dev(div89, "class", "col-lg-3");
    			add_location(div89, file$j, 845, 32, 39020);
    			attr_dev(i12, "class", "mdi mdi-opacity");
    			add_location(i12, file$j, 885, 45, 41640);
    			attr_dev(label31, "for", "");
    			add_location(label31, file$j, 884, 40, 41580);
    			attr_dev(input32, "type", "number");
    			attr_dev(input32, "class", "form-control");
    			add_location(input32, file$j, 890, 48, 41971);
    			attr_dev(div90, "class", "col-lg-12");
    			add_location(div90, file$j, 889, 44, 41898);
    			attr_dev(div91, "class", "row");
    			add_location(div91, file$j, 888, 40, 41835);
    			attr_dev(div92, "class", "form-group");
    			add_location(div92, file$j, 883, 36, 41514);
    			attr_dev(div93, "class", "col-lg-3");
    			add_location(div93, file$j, 882, 32, 41454);
    			attr_dev(label32, "for", "");
    			add_location(label32, file$j, 902, 40, 42687);
    			attr_dev(input33, "type", "text");
    			attr_dev(input33, "class", "form-control");
    			add_location(input33, file$j, 905, 48, 42892);
    			attr_dev(div94, "class", "col-lg-12");
    			add_location(div94, file$j, 904, 44, 42819);
    			attr_dev(div95, "class", "row");
    			add_location(div95, file$j, 903, 40, 42756);
    			attr_dev(div96, "class", "form-group");
    			add_location(div96, file$j, 901, 36, 42621);
    			attr_dev(div97, "class", "col-lg-12");
    			add_location(div97, file$j, 900, 32, 42560);
    			attr_dev(div98, "class", "row");
    			add_location(div98, file$j, 781, 28, 34842);
    			attr_dev(div99, "class", "col-12 mt-4");
    			add_location(div99, file$j, 778, 24, 34696);
    			attr_dev(div100, "class", "row");
    			add_location(div100, file$j, 690, 20, 29772);
    			attr_dev(div101, "class", "card-body");
    			add_location(div101, file$j, 689, 16, 29727);
    			attr_dev(div102, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div102, file$j, 685, 12, 29528);
    			attr_dev(div103, "class", "card-title");
    			add_location(div103, file$j, 925, 20, 43729);
    			attr_dev(div104, "class", "card-header");
    			add_location(div104, file$j, 924, 16, 43682);
    			attr_dev(i13, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i13, file$j, 935, 28, 44161);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "data-toggle", "dropdown");
    			attr_dev(a0, "aria-haspopup", "true");
    			attr_dev(a0, "aria-expanded", "false");
    			add_location(a0, file$j, 929, 24, 43911);
    			attr_dev(button5, "class", "dropdown-item");
    			attr_dev(button5, "type", "button");
    			add_location(button5, file$j, 938, 28, 44335);
    			attr_dev(button6, "class", "dropdown-item");
    			attr_dev(button6, "type", "button");
    			add_location(button6, file$j, 941, 28, 44488);
    			attr_dev(button7, "class", "dropdown-item");
    			attr_dev(button7, "type", "button");
    			add_location(button7, file$j, 944, 28, 44649);
    			attr_dev(div105, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div105, file$j, 937, 24, 44258);
    			attr_dev(div106, "class", "dropdown");
    			add_location(div106, file$j, 928, 20, 43863);
    			attr_dev(div107, "class", "card-controls");
    			add_location(div107, file$j, 927, 16, 43814);
    			attr_dev(textarea2, "class", "form-control");
    			set_style(textarea2, "width", "100%");
    			set_style(textarea2, "display", "block");
    			attr_dev(textarea2, "rows", "5");
    			attr_dev(textarea2, "name", "Comentario");
    			add_location(textarea2, file$j, 951, 20, 44932);
    			attr_dev(div108, "class", "card-body");
    			add_location(div108, file$j, 950, 16, 44887);
    			attr_dev(div109, "class", "card m-b-20 autosave");
    			add_location(div109, file$j, 921, 12, 43599);
    			attr_dev(div110, "class", "card-title");
    			add_location(div110, file$j, 963, 20, 45409);
    			attr_dev(div111, "class", "card-header");
    			add_location(div111, file$j, 962, 16, 45362);
    			attr_dev(i14, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i14, file$j, 973, 28, 45840);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "data-toggle", "dropdown");
    			attr_dev(a1, "aria-haspopup", "true");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file$j, 967, 24, 45590);
    			attr_dev(i15, "class", "mdi mdi-plus");
    			add_location(i15, file$j, 979, 33, 46171);
    			attr_dev(button8, "class", "dropdown-item text-success");
    			attr_dev(button8, "type", "button");
    			add_location(button8, file$j, 976, 28, 46014);
    			attr_dev(div112, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div112, file$j, 975, 24, 45937);
    			attr_dev(div113, "class", "dropdown");
    			add_location(div113, file$j, 966, 20, 45542);
    			attr_dev(div114, "class", "card-controls");
    			add_location(div114, file$j, 965, 16, 45493);
    			attr_dev(input34, "type", "text");
    			attr_dev(input34, "class", "form-control");
    			attr_dev(input34, "id", "txtBusquedaProblemaMedico");
    			attr_dev(input34, "data-toggle", "dropdown");
    			attr_dev(input34, "aria-haspopup", "true");
    			attr_dev(input34, "aria-expanded", "true");
    			attr_dev(input34, "autocomplete", "off");
    			add_location(input34, file$j, 991, 32, 46688);
    			attr_dev(i16, "class", "mdi mdi-plus");
    			add_location(i16, file$j, 1029, 49, 49168);
    			attr_dev(a2, "href", "#!");
    			add_location(a2, file$j, 1027, 44, 48970);
    			attr_dev(li, "class", "defecto");
    			add_location(li, file$j, 1026, 40, 48904);
    			attr_dev(div115, "class", "contenidoLista");
    			add_location(div115, file$j, 1008, 36, 47743);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$j, 1002, 32, 47309);
    			attr_dev(div116, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div116, file$j, 988, 28, 46535);
    			attr_dev(div117, "class", "col-12");
    			add_location(div117, file$j, 987, 24, 46485);
    			attr_dev(ul1, "class", "list-info");
    			add_location(ul1, file$j, 1039, 28, 49591);
    			attr_dev(div118, "class", "col-md-12");
    			add_location(div118, file$j, 1038, 24, 49538);
    			attr_dev(div119, "class", "row");
    			add_location(div119, file$j, 986, 20, 46442);
    			attr_dev(div120, "class", "card-body");
    			add_location(div120, file$j, 985, 16, 46397);
    			attr_dev(div121, "class", "card m-b-20");
    			add_location(div121, file$j, 961, 12, 45319);
    			attr_dev(div122, "class", "card-title");
    			add_location(div122, file$j, 1124, 20, 54592);
    			attr_dev(div123, "class", "card-header");
    			add_location(div123, file$j, 1123, 16, 54545);
    			attr_dev(textarea3, "class", "form-control");
    			set_style(textarea3, "width", "100%");
    			set_style(textarea3, "display", "block");
    			set_style(textarea3, "height", "150px");
    			attr_dev(textarea3, "rows", "3");
    			add_location(textarea3, file$j, 1127, 20, 54722);
    			attr_dev(div124, "class", "card-body");
    			add_location(div124, file$j, 1126, 16, 54677);
    			attr_dev(div125, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div125, file$j, 1122, 12, 54479);
    			attr_dev(div126, "class", "card-title");
    			add_location(div126, file$j, 1141, 28, 55269);
    			attr_dev(div127, "class", "card-header");
    			add_location(div127, file$j, 1140, 24, 55214);
    			attr_dev(label33, "for", "");
    			add_location(label33, file$j, 1148, 36, 55646);
    			attr_dev(input35, "type", "date");
    			attr_dev(input35, "class", "form-control");
    			attr_dev(input35, "placeholder", "Fecha");
    			input35.disabled = true;
    			add_location(input35, file$j, 1149, 36, 55711);
    			attr_dev(div128, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div128, file$j, 1145, 32, 55478);
    			attr_dev(label34, "for", "");
    			add_location(label34, file$j, 1160, 36, 56285);
    			attr_dev(input36, "type", "time");
    			attr_dev(input36, "placeholder", "Hora");
    			attr_dev(input36, "class", "form-control");
    			input36.disabled = true;
    			add_location(input36, file$j, 1161, 36, 56349);
    			attr_dev(div129, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div129, file$j, 1157, 32, 56117);
    			attr_dev(div130, "class", "form-row");
    			add_location(div130, file$j, 1144, 28, 55422);
    			attr_dev(div131, "class", "card-body");
    			add_location(div131, file$j, 1143, 24, 55369);
    			attr_dev(div132, "class", "card m-b-20");
    			add_location(div132, file$j, 1139, 20, 55163);
    			attr_dev(div133, "class", "col-lg-6");
    			add_location(div133, file$j, 1138, 16, 55119);
    			attr_dev(div134, "class", "row");
    			add_location(div134, file$j, 1137, 12, 55084);
    			attr_dev(div135, "class", "col-lg-12");
    			set_style(div135, "margin-top", "150px");
    			add_location(div135, file$j, 490, 8, 16983);
    			attr_dev(div136, "class", "container m-b-30");
    			add_location(div136, file$j, 489, 4, 16943);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$j, 488, 0, 16912);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(asideatencion, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div6, anchor);
    			if (if_block0) if_block0.m(div6, null);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h50);
    			append_dev(h50, span0);
    			append_dev(h50, t3);
    			append_dev(h50, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t8);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div5, t10);
    			append_dev(div5, button0);
    			append_dev(button0, i0);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t12);
    			append_dev(button1, sapn0);
    			append_dev(div3, t14);
    			append_dev(div3, button2);
    			append_dev(button2, i2);
    			append_dev(button2, t15);
    			append_dev(button2, sapn1);
    			append_dev(div3, t17);
    			append_dev(div3, button3);
    			append_dev(button3, i3);
    			append_dev(button3, t18);
    			append_dev(button3, sapn2);
    			append_dev(div3, t20);
    			append_dev(div3, button4);
    			append_dev(button4, i4);
    			append_dev(button4, t21);
    			append_dev(button4, sapn3);
    			insert_dev(target, t23, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div136);
    			append_dev(div136, div135);
    			append_dev(div135, div10);
    			append_dev(div10, div8);
    			append_dev(div8, div7);
    			append_dev(div10, t26);
    			append_dev(div10, div9);
    			append_dev(div9, textarea0);
    			set_input_value(textarea0, /*historia*/ ctx[7].motivoConsulta);
    			append_dev(div135, t27);
    			append_dev(div135, div14);
    			append_dev(div14, div12);
    			append_dev(div12, div11);
    			append_dev(div14, t29);
    			append_dev(div14, div13);
    			append_dev(div13, textarea1);
    			set_input_value(textarea1, /*historia*/ ctx[7].historiaEnfermedad);
    			append_dev(div135, t30);
    			append_dev(div135, div52);
    			append_dev(div52, div16);
    			append_dev(div16, div15);
    			append_dev(div52, t32);
    			append_dev(div52, div51);
    			append_dev(div51, div33);
    			append_dev(div33, div18);
    			append_dev(div18, div17);
    			append_dev(div17, label0);
    			append_dev(div17, t34);
    			append_dev(div17, input0);
    			set_input_value(input0, /*historiaGinecologica*/ ctx[19].fechaUltimaMenstruacion);
    			append_dev(div33, t35);
    			append_dev(div33, div20);
    			append_dev(div20, div19);
    			append_dev(div19, label1);
    			append_dev(div19, t37);
    			append_dev(div19, input1);
    			set_input_value(input1, /*historiaGinecologica*/ ctx[19].fechaUltimoPap);
    			append_dev(div33, t38);
    			append_dev(div33, div22);
    			append_dev(div22, div21);
    			append_dev(div21, label2);
    			append_dev(div21, t40);
    			append_dev(div21, input2);
    			set_input_value(input2, /*historiaGinecologica*/ ctx[19].fechaUltimoParto);
    			append_dev(div33, t41);
    			append_dev(div33, div24);
    			append_dev(div24, div23);
    			append_dev(div23, label3);
    			append_dev(div23, t43);
    			append_dev(div23, input3);
    			set_input_value(input3, /*historiaGinecologica*/ ctx[19].fechaUltimoAborto);
    			append_dev(div33, t44);
    			append_dev(div33, div26);
    			append_dev(div26, div25);
    			append_dev(div25, label4);
    			append_dev(div25, t46);
    			append_dev(div25, input4);
    			set_input_value(input4, /*historiaGinecologica*/ ctx[19].fechaUltimoCesarea);
    			append_dev(div33, t47);
    			append_dev(div33, div28);
    			append_dev(div28, div27);
    			append_dev(div27, label5);
    			append_dev(div27, t49);
    			append_dev(div27, input5);
    			set_input_value(input5, /*historiaGinecologica*/ ctx[19].intervaloFlujoMenstrual);
    			append_dev(div33, t50);
    			append_dev(div33, div30);
    			append_dev(div30, div29);
    			append_dev(div29, label6);
    			append_dev(div29, t52);
    			append_dev(div29, input6);
    			set_input_value(input6, /*historiaGinecologica*/ ctx[19].cantidadFlujoMenstrual);
    			append_dev(div33, t53);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, label7);
    			append_dev(div31, t55);
    			append_dev(div31, input7);
    			set_input_value(input7, /*historiaGinecologica*/ ctx[19].duracionFlujoMenstrual);
    			append_dev(div51, t56);
    			append_dev(div51, hr0);
    			append_dev(div51, t57);
    			append_dev(div51, div48);
    			append_dev(div48, div35);
    			append_dev(div35, div34);
    			append_dev(div34, label8);
    			append_dev(div34, t59);
    			append_dev(div34, input8);
    			set_input_value(input8, /*historiaGinecologica*/ ctx[19].gesta);
    			append_dev(div48, t60);
    			append_dev(div48, div37);
    			append_dev(div37, div36);
    			append_dev(div36, label9);
    			append_dev(div36, t62);
    			append_dev(div36, input9);
    			set_input_value(input9, /*historiaGinecologica*/ ctx[19].para);
    			append_dev(div48, t63);
    			append_dev(div48, div39);
    			append_dev(div39, div38);
    			append_dev(div38, label10);
    			append_dev(div38, t65);
    			append_dev(div38, input10);
    			set_input_value(input10, /*historiaGinecologica*/ ctx[19].abortos);
    			append_dev(div48, t66);
    			append_dev(div48, div41);
    			append_dev(div41, div40);
    			append_dev(div40, label11);
    			append_dev(div40, t68);
    			append_dev(div40, input11);
    			set_input_value(input11, /*historiaGinecologica*/ ctx[19].cesareas);
    			append_dev(div48, t69);
    			append_dev(div48, div43);
    			append_dev(div43, div42);
    			append_dev(div42, label12);
    			append_dev(div42, t71);
    			append_dev(div42, input12);
    			set_input_value(input12, /*historiaGinecologica*/ ctx[19].espontaneos);
    			append_dev(div48, t72);
    			append_dev(div48, div45);
    			append_dev(div45, div44);
    			append_dev(div44, label13);
    			append_dev(div44, t74);
    			append_dev(div44, input13);
    			set_input_value(input13, /*historiaGinecologica*/ ctx[19].provocados);
    			append_dev(div48, t75);
    			append_dev(div48, div47);
    			append_dev(div47, div46);
    			append_dev(div46, label14);
    			append_dev(div46, t77);
    			append_dev(div46, input14);
    			set_input_value(input14, /*historiaGinecologica*/ ctx[19].legrados);
    			append_dev(div51, t78);
    			append_dev(div51, h51);
    			append_dev(div51, t80);
    			append_dev(div51, hr1);
    			append_dev(div51, t81);
    			append_dev(div51, div50);
    			append_dev(div50, div49);
    			append_dev(div49, label15);
    			append_dev(label15, input15);
    			input15.checked = /*historiaGinecologica*/ ctx[19].sangradoVaginal;
    			append_dev(label15, t82);
    			append_dev(label15, span2);
    			append_dev(label15, t83);
    			append_dev(label15, span3);
    			append_dev(div49, t85);
    			append_dev(div49, label16);
    			append_dev(label16, input16);
    			input16.checked = /*historiaGinecologica*/ ctx[19].vidaSexualActiva;
    			append_dev(label16, t86);
    			append_dev(label16, span4);
    			append_dev(label16, t87);
    			append_dev(label16, span5);
    			append_dev(div49, t89);
    			append_dev(div49, label17);
    			append_dev(label17, input17);
    			input17.checked = /*historiaGinecologica*/ ctx[19].anticonceptivosOrales;
    			append_dev(label17, t90);
    			append_dev(label17, span6);
    			append_dev(label17, t91);
    			append_dev(label17, span7);
    			append_dev(div49, t93);
    			append_dev(div49, label18);
    			append_dev(label18, input18);
    			input18.checked = /*historiaGinecologica*/ ctx[19].diu;
    			append_dev(label18, t94);
    			append_dev(label18, span8);
    			append_dev(label18, t95);
    			append_dev(label18, span9);
    			append_dev(div49, t97);
    			append_dev(div49, label19);
    			append_dev(label19, input19);
    			input19.checked = /*historiaGinecologica*/ ctx[19].aqv;
    			append_dev(label19, t98);
    			append_dev(label19, span10);
    			append_dev(label19, t99);
    			append_dev(label19, span11);
    			append_dev(div49, t101);
    			append_dev(div49, label20);
    			append_dev(label20, input20);
    			input20.checked = /*historiaGinecologica*/ ctx[19].condon;
    			append_dev(label20, t102);
    			append_dev(label20, span12);
    			append_dev(label20, t103);
    			append_dev(label20, span13);
    			append_dev(div49, t105);
    			append_dev(div49, label21);
    			append_dev(label21, input21);
    			input21.checked = /*historiaGinecologica*/ ctx[19].norplant;
    			append_dev(label21, t106);
    			append_dev(label21, span14);
    			append_dev(label21, t107);
    			append_dev(label21, span15);
    			append_dev(div49, t109);
    			append_dev(div49, label22);
    			append_dev(label22, input22);
    			input22.checked = /*historiaGinecologica*/ ctx[19].ritmo;
    			append_dev(label22, t110);
    			append_dev(label22, span16);
    			append_dev(label22, t111);
    			append_dev(label22, span17);
    			append_dev(div49, t113);
    			append_dev(div49, label23);
    			append_dev(label23, input23);
    			input23.checked = /*historiaGinecologica*/ ctx[19].coitoInterruptus;
    			append_dev(label23, t114);
    			append_dev(label23, span18);
    			append_dev(label23, t115);
    			append_dev(label23, span19);
    			append_dev(div135, t117);
    			append_dev(div135, div102);
    			append_dev(div102, div54);
    			append_dev(div54, div53);
    			append_dev(div102, t119);
    			append_dev(div102, div101);
    			append_dev(div101, div100);
    			append_dev(div100, div59);
    			append_dev(div59, div58);
    			append_dev(div58, label24);
    			append_dev(label24, i5);
    			append_dev(label24, t120);
    			append_dev(div58, t121);
    			append_dev(div58, div57);
    			append_dev(div57, div55);
    			append_dev(div55, input24);
    			set_input_value(input24, /*temperatura*/ ctx[8].valor);
    			append_dev(div57, t122);
    			append_dev(div57, div56);
    			append_dev(div56, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*temperatura*/ ctx[8].tipo);
    			append_dev(div100, t126);
    			append_dev(div100, div63);
    			append_dev(div63, div62);
    			append_dev(div62, label25);
    			append_dev(label25, i6);
    			append_dev(label25, t127);
    			append_dev(div62, t128);
    			append_dev(div62, div61);
    			append_dev(div61, div60);
    			append_dev(div60, input25);
    			set_input_value(input25, /*historia*/ ctx[7].frecuenciaRespiratoria);
    			append_dev(div100, t129);
    			append_dev(div100, div67);
    			append_dev(div67, div66);
    			append_dev(div66, label26);
    			append_dev(label26, i7);
    			append_dev(label26, t130);
    			append_dev(div66, t131);
    			append_dev(div66, div65);
    			append_dev(div65, div64);
    			append_dev(div64, input26);
    			set_input_value(input26, /*historia*/ ctx[7].frecuenciaCardiaca);
    			append_dev(div100, t132);
    			append_dev(div100, div72);
    			append_dev(div72, div71);
    			append_dev(div71, label27);
    			append_dev(label27, i8);
    			append_dev(label27, t133);
    			append_dev(div71, t134);
    			append_dev(div71, div70);
    			append_dev(div70, div68);
    			append_dev(div68, input27);
    			set_input_value(input27, /*presionAlterial*/ ctx[9].mm);
    			append_dev(div70, t135);
    			append_dev(div70, div69);
    			append_dev(div69, input28);
    			set_input_value(input28, /*presionAlterial*/ ctx[9].Hg);
    			append_dev(div100, t136);
    			append_dev(div100, div99);
    			append_dev(div99, h52);
    			append_dev(div99, t138);
    			append_dev(div99, hr2);
    			append_dev(div99, t139);
    			append_dev(div99, div98);
    			append_dev(div98, div77);
    			append_dev(div77, div76);
    			append_dev(div76, label28);
    			append_dev(label28, i9);
    			append_dev(label28, t140);
    			append_dev(div76, t141);
    			append_dev(div76, div75);
    			append_dev(div75, div73);
    			append_dev(div73, input29);
    			set_input_value(input29, /*peso*/ ctx[10].valor);
    			append_dev(div75, t142);
    			append_dev(div75, div74);
    			append_dev(div74, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*peso*/ ctx[10].tipo);
    			append_dev(div98, t145);
    			append_dev(div98, div83);
    			append_dev(div83, div82);
    			append_dev(div82, label29);
    			append_dev(label29, i10);
    			append_dev(label29, t146);
    			append_dev(div82, t147);
    			append_dev(div82, div81);
    			append_dev(div81, div80);
    			append_dev(div80, div79);
    			append_dev(div79, input30);
    			set_input_value(input30, /*historia*/ ctx[7].escalaGalsgow);
    			append_dev(div79, t148);
    			append_dev(div79, div78);
    			append_dev(div78, span20);
    			append_dev(div98, t150);
    			append_dev(div98, div89);
    			append_dev(div89, div88);
    			append_dev(div88, label30);
    			append_dev(label30, i11);
    			append_dev(label30, t151);
    			append_dev(div88, t152);
    			append_dev(div88, div87);
    			append_dev(div87, div86);
    			append_dev(div86, div85);
    			append_dev(div85, input31);
    			set_input_value(input31, /*historia*/ ctx[7].escalaDolor);
    			append_dev(div85, t153);
    			append_dev(div85, div84);
    			append_dev(div84, span21);
    			append_dev(div98, t155);
    			append_dev(div98, div93);
    			append_dev(div93, div92);
    			append_dev(div92, label31);
    			append_dev(label31, i12);
    			append_dev(label31, t156);
    			append_dev(div92, t157);
    			append_dev(div92, div91);
    			append_dev(div91, div90);
    			append_dev(div90, input32);
    			set_input_value(input32, /*historia*/ ctx[7].saturacionOxigeno);
    			append_dev(div98, t158);
    			append_dev(div98, div97);
    			append_dev(div97, div96);
    			append_dev(div96, label32);
    			append_dev(div96, t160);
    			append_dev(div96, div95);
    			append_dev(div95, div94);
    			append_dev(div94, input33);
    			set_input_value(input33, /*historia*/ ctx[7].otrosParametros);
    			append_dev(div135, t161);
    			append_dev(div135, div109);
    			append_dev(div109, div104);
    			append_dev(div104, div103);
    			append_dev(div109, t163);
    			append_dev(div109, div107);
    			append_dev(div107, div106);
    			append_dev(div106, a0);
    			append_dev(a0, i13);
    			append_dev(div106, t164);
    			append_dev(div106, div105);
    			append_dev(div105, button5);
    			append_dev(div105, t166);
    			append_dev(div105, button6);
    			append_dev(div105, t168);
    			append_dev(div105, button7);
    			append_dev(div109, t170);
    			append_dev(div109, div108);
    			append_dev(div108, textarea2);
    			set_input_value(textarea2, /*historia*/ ctx[7].examenFisico);
    			append_dev(div135, t171);
    			append_dev(div135, div121);
    			append_dev(div121, div111);
    			append_dev(div111, div110);
    			append_dev(div121, t173);
    			append_dev(div121, div114);
    			append_dev(div114, div113);
    			append_dev(div113, a1);
    			append_dev(a1, i14);
    			append_dev(div113, t174);
    			append_dev(div113, div112);
    			append_dev(div112, button8);
    			append_dev(button8, i15);
    			append_dev(button8, t175);
    			append_dev(div121, t176);
    			append_dev(div121, div120);
    			append_dev(div120, div119);
    			append_dev(div119, div117);
    			append_dev(div117, div116);
    			append_dev(div116, input34);
    			set_input_value(input34, /*inpBuscarDiagnostico*/ ctx[4]);
    			append_dev(div116, t177);
    			append_dev(div116, ul0);
    			append_dev(ul0, div115);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div115, null);
    			}

    			append_dev(div115, t178);
    			append_dev(div115, li);
    			append_dev(li, a2);
    			append_dev(a2, i16);
    			append_dev(a2, t179);
    			append_dev(div119, t180);
    			append_dev(div119, div118);
    			append_dev(div118, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			append_dev(ul1, t181);
    			if (if_block4) if_block4.m(ul1, null);
    			append_dev(div135, t182);
    			mount_component(ordenesmedicas, div135, null);
    			append_dev(div135, t183);
    			append_dev(div135, div125);
    			append_dev(div125, div123);
    			append_dev(div123, div122);
    			append_dev(div125, t185);
    			append_dev(div125, div124);
    			append_dev(div124, textarea3);
    			set_input_value(textarea3, /*historia*/ ctx[7].observaciones);
    			append_dev(div135, t186);
    			append_dev(div135, div134);
    			append_dev(div134, div133);
    			append_dev(div133, div132);
    			append_dev(div132, div127);
    			append_dev(div127, div126);
    			append_dev(div132, t188);
    			append_dev(div132, div131);
    			append_dev(div131, div130);
    			append_dev(div130, div128);
    			append_dev(div128, label33);
    			append_dev(div128, t190);
    			append_dev(div128, input35);
    			set_input_value(input35, /*fecha*/ ctx[11]);
    			append_dev(div130, t191);
    			append_dev(div130, div129);
    			append_dev(div129, label34);
    			append_dev(div129, t193);
    			append_dev(div129, input36);
    			set_input_value(input36, /*hora*/ ctx[12]);
    			insert_dev(target, t194, anchor);
    			mount_component(modaldatospaciente, target, anchor);
    			insert_dev(target, t195, anchor);
    			mount_component(modaltratamientos, target, anchor);
    			insert_dev(target, t196, anchor);
    			mount_component(modalinterconsulta, target, anchor);
    			insert_dev(target, t197, anchor);
    			mount_component(modalantecedentes, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(textarea0, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[34]),
    					listen_dev(textarea1, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[35]),
    					listen_dev(input0, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[36]),
    					listen_dev(input1, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[37]),
    					listen_dev(input2, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[38]),
    					listen_dev(input3, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[39]),
    					listen_dev(input4, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[40]),
    					listen_dev(input5, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[41]),
    					listen_dev(input6, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[42]),
    					listen_dev(input7, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[43]),
    					listen_dev(input8, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[44]),
    					listen_dev(input9, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[45]),
    					listen_dev(input10, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[46]),
    					listen_dev(input11, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input11, "input", /*input11_input_handler*/ ctx[47]),
    					listen_dev(input12, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[48]),
    					listen_dev(input13, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input13, "input", /*input13_input_handler*/ ctx[49]),
    					listen_dev(input14, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input14, "input", /*input14_input_handler*/ ctx[50]),
    					listen_dev(input15, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input15, "change", /*input15_change_handler*/ ctx[51]),
    					listen_dev(input16, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input16, "change", /*input16_change_handler*/ ctx[52]),
    					listen_dev(input17, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input17, "change", /*input17_change_handler*/ ctx[53]),
    					listen_dev(input18, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input18, "change", /*input18_change_handler*/ ctx[54]),
    					listen_dev(input19, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input19, "change", /*input19_change_handler*/ ctx[55]),
    					listen_dev(input20, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input20, "change", /*input20_change_handler*/ ctx[56]),
    					listen_dev(input21, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input21, "change", /*input21_change_handler*/ ctx[57]),
    					listen_dev(input22, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input22, "change", /*input22_change_handler*/ ctx[58]),
    					listen_dev(input23, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input23, "change", /*input23_change_handler*/ ctx[59]),
    					listen_dev(input24, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input24, "input", /*input24_input_handler*/ ctx[60]),
    					listen_dev(select0, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[61]),
    					listen_dev(input25, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input25, "input", /*input25_input_handler*/ ctx[62]),
    					listen_dev(input26, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input26, "input", /*input26_input_handler*/ ctx[63]),
    					listen_dev(input27, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input27, "input", /*input27_input_handler*/ ctx[64]),
    					listen_dev(input28, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input28, "input", /*input28_input_handler*/ ctx[65]),
    					listen_dev(input29, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input29, "input", /*input29_input_handler*/ ctx[66]),
    					listen_dev(select1, "change", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[67]),
    					listen_dev(input30, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input30, "input", /*input30_input_handler*/ ctx[68]),
    					listen_dev(input31, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input31, "input", /*input31_input_handler*/ ctx[69]),
    					listen_dev(input32, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input32, "input", /*input32_input_handler*/ ctx[70]),
    					listen_dev(input33, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(input33, "input", /*input33_input_handler*/ ctx[71]),
    					listen_dev(textarea2, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[72]),
    					listen_dev(input34, "keyup", /*searchDiagnosticos*/ ctx[23], false, false, false),
    					listen_dev(input34, "input", /*input34_input_handler*/ ctx[73]),
    					listen_dev(a2, "click", prevent_default(/*click_handler_1*/ ctx[75]), false, true, false),
    					listen_dev(textarea3, "blur", /*guardarHistoria*/ ctx[32], false, false, false),
    					listen_dev(textarea3, "input", /*textarea3_input_handler*/ ctx[88]),
    					listen_dev(input35, "input", /*input35_input_handler*/ ctx[89]),
    					listen_dev(input36, "blur", /*blur_handler*/ ctx[90], false, false, false),
    					listen_dev(input36, "input", /*input36_input_handler*/ ctx[91])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*errorServer*/ ctx[20]) {
    				if (if_block0) {
    					if (dirty[0] & /*errorServer*/ 1048576) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div6, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[0] & /*paciente*/ 2) && t4_value !== (t4_value = /*paciente*/ ctx[1].nombres + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*paciente*/ 2) && t6_value !== (t6_value = /*paciente*/ ctx[1].apellidos + "")) set_data_dev(t6, t6_value);

    			if (!/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_4$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*errorServer*/ ctx[20]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_3$1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_2$3(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea0, /*historia*/ ctx[7].motivoConsulta);
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea1, /*historia*/ ctx[7].historiaEnfermedad);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				set_input_value(input0, /*historiaGinecologica*/ ctx[19].fechaUltimaMenstruacion);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				set_input_value(input1, /*historiaGinecologica*/ ctx[19].fechaUltimoPap);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				set_input_value(input2, /*historiaGinecologica*/ ctx[19].fechaUltimoParto);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				set_input_value(input3, /*historiaGinecologica*/ ctx[19].fechaUltimoAborto);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				set_input_value(input4, /*historiaGinecologica*/ ctx[19].fechaUltimoCesarea);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input5.value) !== /*historiaGinecologica*/ ctx[19].intervaloFlujoMenstrual) {
    				set_input_value(input5, /*historiaGinecologica*/ ctx[19].intervaloFlujoMenstrual);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input6.value) !== /*historiaGinecologica*/ ctx[19].cantidadFlujoMenstrual) {
    				set_input_value(input6, /*historiaGinecologica*/ ctx[19].cantidadFlujoMenstrual);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input7.value) !== /*historiaGinecologica*/ ctx[19].duracionFlujoMenstrual) {
    				set_input_value(input7, /*historiaGinecologica*/ ctx[19].duracionFlujoMenstrual);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input8.value) !== /*historiaGinecologica*/ ctx[19].gesta) {
    				set_input_value(input8, /*historiaGinecologica*/ ctx[19].gesta);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input9.value) !== /*historiaGinecologica*/ ctx[19].para) {
    				set_input_value(input9, /*historiaGinecologica*/ ctx[19].para);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input10.value) !== /*historiaGinecologica*/ ctx[19].abortos) {
    				set_input_value(input10, /*historiaGinecologica*/ ctx[19].abortos);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input11.value) !== /*historiaGinecologica*/ ctx[19].cesareas) {
    				set_input_value(input11, /*historiaGinecologica*/ ctx[19].cesareas);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input12.value) !== /*historiaGinecologica*/ ctx[19].espontaneos) {
    				set_input_value(input12, /*historiaGinecologica*/ ctx[19].espontaneos);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input13.value) !== /*historiaGinecologica*/ ctx[19].provocados) {
    				set_input_value(input13, /*historiaGinecologica*/ ctx[19].provocados);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288 && to_number(input14.value) !== /*historiaGinecologica*/ ctx[19].legrados) {
    				set_input_value(input14, /*historiaGinecologica*/ ctx[19].legrados);
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input15.checked = /*historiaGinecologica*/ ctx[19].sangradoVaginal;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input16.checked = /*historiaGinecologica*/ ctx[19].vidaSexualActiva;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input17.checked = /*historiaGinecologica*/ ctx[19].anticonceptivosOrales;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input18.checked = /*historiaGinecologica*/ ctx[19].diu;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input19.checked = /*historiaGinecologica*/ ctx[19].aqv;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input20.checked = /*historiaGinecologica*/ ctx[19].condon;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input21.checked = /*historiaGinecologica*/ ctx[19].norplant;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input22.checked = /*historiaGinecologica*/ ctx[19].ritmo;
    			}

    			if (dirty[0] & /*historiaGinecologica*/ 524288) {
    				input23.checked = /*historiaGinecologica*/ ctx[19].coitoInterruptus;
    			}

    			if (dirty[0] & /*temperatura*/ 256 && to_number(input24.value) !== /*temperatura*/ ctx[8].valor) {
    				set_input_value(input24, /*temperatura*/ ctx[8].valor);
    			}

    			if (dirty[0] & /*temperatura*/ 256) {
    				select_option(select0, /*temperatura*/ ctx[8].tipo);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input25.value) !== /*historia*/ ctx[7].frecuenciaRespiratoria) {
    				set_input_value(input25, /*historia*/ ctx[7].frecuenciaRespiratoria);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input26.value) !== /*historia*/ ctx[7].frecuenciaCardiaca) {
    				set_input_value(input26, /*historia*/ ctx[7].frecuenciaCardiaca);
    			}

    			if (dirty[0] & /*presionAlterial*/ 512 && to_number(input27.value) !== /*presionAlterial*/ ctx[9].mm) {
    				set_input_value(input27, /*presionAlterial*/ ctx[9].mm);
    			}

    			if (dirty[0] & /*presionAlterial*/ 512 && to_number(input28.value) !== /*presionAlterial*/ ctx[9].Hg) {
    				set_input_value(input28, /*presionAlterial*/ ctx[9].Hg);
    			}

    			if (dirty[0] & /*peso*/ 1024 && to_number(input29.value) !== /*peso*/ ctx[10].valor) {
    				set_input_value(input29, /*peso*/ ctx[10].valor);
    			}

    			if (dirty[0] & /*peso*/ 1024) {
    				select_option(select1, /*peso*/ ctx[10].tipo);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input30.value) !== /*historia*/ ctx[7].escalaGalsgow) {
    				set_input_value(input30, /*historia*/ ctx[7].escalaGalsgow);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input31.value) !== /*historia*/ ctx[7].escalaDolor) {
    				set_input_value(input31, /*historia*/ ctx[7].escalaDolor);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input32.value) !== /*historia*/ ctx[7].saturacionOxigeno) {
    				set_input_value(input32, /*historia*/ ctx[7].saturacionOxigeno);
    			}

    			if (dirty[0] & /*historia*/ 128 && input33.value !== /*historia*/ ctx[7].otrosParametros) {
    				set_input_value(input33, /*historia*/ ctx[7].otrosParametros);
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea2, /*historia*/ ctx[7].examenFisico);
    			}

    			if (dirty[0] & /*inpBuscarDiagnostico*/ 16 && input34.value !== /*inpBuscarDiagnostico*/ ctx[4]) {
    				set_input_value(input34, /*inpBuscarDiagnostico*/ ctx[4]);
    			}

    			if (dirty[0] & /*filtroDiagnostico*/ 2097152 | dirty[1] & /*seleccionarDiagnostico*/ 4) {
    				each_value_1 = /*filtroDiagnostico*/ ctx[21];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div115, t178);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*diagnosticosSeleccionados, eliminarDiagnostico, agregarComentarioDiagnostico*/ 671088672 | dirty[1] & /*guardarHistoria*/ 2) {
    				each_value = /*diagnosticosSeleccionados*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, t181);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*diagnosticosSeleccionados*/ ctx[5].length === 0) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block$8(ctx);
    					if_block4.c();
    					if_block4.m(ul1, null);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			const ordenesmedicas_changes = {};

    			if (!updating_idHistoria && dirty[0] & /*params*/ 1) {
    				updating_idHistoria = true;
    				ordenesmedicas_changes.idHistoria = /*params*/ ctx[0].idHistoria;
    				add_flush_callback(() => updating_idHistoria = false);
    			}

    			if (!updating_idPaciente && dirty[0] & /*params*/ 1) {
    				updating_idPaciente = true;
    				ordenesmedicas_changes.idPaciente = /*params*/ ctx[0].idPaciente;
    				add_flush_callback(() => updating_idPaciente = false);
    			}

    			if (!updating_estudiosSeleccionados && dirty[0] & /*estudiosSeleccionados*/ 262144) {
    				updating_estudiosSeleccionados = true;
    				ordenesmedicas_changes.estudiosSeleccionados = /*estudiosSeleccionados*/ ctx[18];
    				add_flush_callback(() => updating_estudiosSeleccionados = false);
    			}

    			if (!updating_medicamentosSeleccionados && dirty[0] & /*medicamentosSeleccionados*/ 32768) {
    				updating_medicamentosSeleccionados = true;
    				ordenesmedicas_changes.medicamentosSeleccionados = /*medicamentosSeleccionados*/ ctx[15];
    				add_flush_callback(() => updating_medicamentosSeleccionados = false);
    			}

    			if (!updating_sltBuscarMedicamentos && dirty[0] & /*sltBuscarMedicamentos*/ 16384) {
    				updating_sltBuscarMedicamentos = true;
    				ordenesmedicas_changes.sltBuscarMedicamentos = /*sltBuscarMedicamentos*/ ctx[14];
    				add_flush_callback(() => updating_sltBuscarMedicamentos = false);
    			}

    			if (!updating_sltBuscarEstudios && dirty[0] & /*sltBuscarEstudios*/ 65536) {
    				updating_sltBuscarEstudios = true;
    				ordenesmedicas_changes.sltBuscarEstudios = /*sltBuscarEstudios*/ ctx[16];
    				add_flush_callback(() => updating_sltBuscarEstudios = false);
    			}

    			if (!updating_medicamentos && dirty[0] & /*medicamentos*/ 64) {
    				updating_medicamentos = true;
    				ordenesmedicas_changes.medicamentos = /*medicamentos*/ ctx[6];
    				add_flush_callback(() => updating_medicamentos = false);
    			}

    			if (!updating_instrucciones && dirty[0] & /*historia*/ 128) {
    				updating_instrucciones = true;
    				ordenesmedicas_changes.instrucciones = /*historia*/ ctx[7].instrucciones;
    				add_flush_callback(() => updating_instrucciones = false);
    			}

    			if (!updating_estudios && dirty[0] & /*estudios*/ 131072) {
    				updating_estudios = true;
    				ordenesmedicas_changes.estudios = /*estudios*/ ctx[17];
    				add_flush_callback(() => updating_estudios = false);
    			}

    			ordenesmedicas.$set(ordenesmedicas_changes);

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea3, /*historia*/ ctx[7].observaciones);
    			}

    			if (dirty[0] & /*fecha*/ 2048) {
    				set_input_value(input35, /*fecha*/ ctx[11]);
    			}

    			if (dirty[0] & /*hora*/ 4096) {
    				set_input_value(input36, /*hora*/ ctx[12]);
    			}

    			const modaldatospaciente_changes = {};
    			if (dirty[0] & /*paciente*/ 2) modaldatospaciente_changes.paciente = /*paciente*/ ctx[1];
    			if (dirty[0] & /*edad*/ 4) modaldatospaciente_changes.edad = /*edad*/ ctx[2];
    			if (dirty[0] & /*seguro*/ 8) modaldatospaciente_changes.seguro = /*seguro*/ ctx[3];
    			modaldatospaciente.$set(modaldatospaciente_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(asideatencion.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(header.$$.fragment, local);
    			transition_in(ordenesmedicas.$$.fragment, local);
    			transition_in(modaldatospaciente.$$.fragment, local);
    			transition_in(modaltratamientos.$$.fragment, local);
    			transition_in(modalinterconsulta.$$.fragment, local);
    			transition_in(modalantecedentes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(asideatencion.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(header.$$.fragment, local);
    			transition_out(ordenesmedicas.$$.fragment, local);
    			transition_out(modaldatospaciente.$$.fragment, local);
    			transition_out(modaltratamientos.$$.fragment, local);
    			transition_out(modalinterconsulta.$$.fragment, local);
    			transition_out(modalantecedentes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(asideatencion, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t23);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block4) if_block4.d();
    			destroy_component(ordenesmedicas);
    			if (detaching) detach_dev(t194);
    			destroy_component(modaldatospaciente, detaching);
    			if (detaching) detach_dev(t195);
    			destroy_component(modaltratamientos, detaching);
    			if (detaching) detach_dev(t196);
    			destroy_component(modalinterconsulta, detaching);
    			if (detaching) detach_dev(t197);
    			destroy_component(modalantecedentes, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function calcularEdad$2(fecha) {
    	var hoy = new Date();
    	var cumpleanos = new Date(fecha);
    	var edad = hoy.getFullYear() - cumpleanos.getFullYear();
    	var m = hoy.getMonth() - cumpleanos.getMonth();

    	if (m < 0 || m === 0 && hoy.getDate() < cumpleanos.getDate()) {
    		edad--;
    	}

    	return edad;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HistoriaClinica", slots, []);

    	const Toast = Swal.mixin({
    		toast: true,
    		position: "top-end",
    		showConfirmButton: false,
    		timer: 3000,
    		timerProgressBar: true,
    		didOpen: toast => {
    			toast.addEventListener("mouseenter", Swal.stopTimer);
    			toast.addEventListener("mouseleave", Swal.resumeTimer);
    		}
    	});

    	let { params = "" } = $$props;
    	let paciente = {};
    	let edad = "";
    	let seguro = "";
    	let diagnosticos = [];
    	let inpBuscarDiagnostico = "";
    	let diagnosticosSeleccionados = [];
    	let medicamentos = [];
    	let historia = {};
    	let temperatura = {};
    	let presionAlterial = {};
    	let peso = {};
    	let timeout = null;
    	let fecha = "";
    	let hora = "";
    	let cargando = false;
    	let sltBuscarMedicamentos = "";
    	let medicamentosSeleccionados = [];
    	let sltBuscarEstudios = "";
    	let estudios = [];
    	let estudiosSeleccionados = [];
    	let historiaGinecologica = {};
    	let errorServer = false;

    	const searchMedicamentos = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarMedicamentos();
    			},
    			300
    		);
    	};

    	function searchDiagnosticos() {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarDiagnosticos();
    			},
    			300
    		);
    	}

    	const searchEstudios = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarEstudios();
    			},
    			300
    		);
    	};

    	const agregarEstudio = obj => {
    		$$invalidate(18, estudiosSeleccionados = [...estudiosSeleccionados, obj.detail]);
    		$$invalidate(7, historia.estudios = estudiosSeleccionados, historia);
    		guardarHistoria();
    		$$invalidate(16, sltBuscarEstudios = "");
    		console.log(obj.detail);
    	};

    	const agregarDiagnosticoPersonalizado = nombre => {
    		const diagnostico = { d: nombre, c: "PERS", id: v4() };
    		$$invalidate(5, diagnosticosSeleccionados = [...diagnosticosSeleccionados, diagnostico]);
    		guardarHistoria();
    		console.log(diagnosticosSeleccionados);
    	};

    	const agregarComentarioDiagnostico = position => {
    		if (diagnosticosSeleccionados[position].comentario === undefined) {
    			$$invalidate(5, diagnosticosSeleccionados[position].comentario = "", diagnosticosSeleccionados);
    			$$invalidate(7, historia.diagnosticos = diagnosticosSeleccionados, historia);
    			guardarHistoria();
    		} else {
    			delete diagnosticosSeleccionados[position].comentario;
    			$$invalidate(5, diagnosticosSeleccionados);
    			$$invalidate(7, historia.diagnosticos = diagnosticosSeleccionados, historia);
    			guardarHistoria();
    		}
    	};

    	const eliminarMedicamento = event => {
    		console.log(event.detail);

    		if (confirm("Desea eliminar el medicamento?")) {
    			medicamentosSeleccionados.splice(event.detail, 1);
    			$$invalidate(15, medicamentosSeleccionados);
    			$$invalidate(7, historia.medicamentos = medicamentosSeleccionados, historia);
    			guardarHistoria();
    		}
    	};

    	const eliminarDiagnostico = position => {
    		Swal.fire({
    			title: "¿Esta seguro?",
    			text: "Esta acción eliminara el diagnostico de la consulta, pero puede agregarlo nuevamente luego.!",
    			icon: "warning",
    			showCancelButton: true,
    			confirmButtonColor: "#3085d6",
    			cancelButtonColor: "#d33",
    			confirmButtonText: "Si, Eliminar!",
    			cancelButtonText: "Cancelar"
    		}).then(result => {
    			if (result.isConfirmed) {
    				diagnosticosSeleccionados.splice(position, 1);
    				$$invalidate(5, diagnosticosSeleccionados);
    				$$invalidate(7, historia.diagnosticos = diagnosticosSeleccionados, historia);
    				guardarHistoria();

    				Toast.fire({
    					icon: "success",
    					title: "Se ha eliminado correctamente"
    				});
    			}
    		});
    	};

    	const eliminarEstudios = event => {
    		Swal.fire({
    			title: "¿Está seguro?",
    			text: "Se eliminará este estudio de la lista, pero puede volver a agregarlo luego!",
    			icon: "warning",
    			showCancelButton: true,
    			confirmButtonColor: "#3085d6",
    			cancelButtonColor: "#d33",
    			confirmButtonText: "Si, Eliminarlo!",
    			cancelButtonText: "Cancelar"
    		}).then(result => {
    			if (result.isConfirmed) {
    				estudiosSeleccionados.splice(event.detail, 1);
    				$$invalidate(18, estudiosSeleccionados);
    				$$invalidate(7, historia.estudios = estudiosSeleccionados, historia);
    				guardarHistoria();

    				Toast.fire({
    					icon: "success",
    					title: "Se ha eliminado correctamente"
    				});
    			}
    		});
    	};

    	const agregarMedicamento = event => {
    		if (!event.detail) {
    			return false;
    		}

    		const medicamento = {
    			nombre: event.detail,
    			concentracion: "",
    			cantidad: "",
    			frecuencia: ""
    		};

    		$$invalidate(15, medicamentosSeleccionados = [...medicamentosSeleccionados, medicamento]);
    		$$invalidate(7, historia.medicamentos = medicamentosSeleccionados, historia);
    		$$invalidate(14, sltBuscarMedicamentos = "");
    		guardarHistoria();
    		console.log(historia);
    	};

    	const cargarEstudios = () => {
    		const config = {
    			method: "get",
    			url: `${url}/estudios?b=${sltBuscarEstudios}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(17, estudios = res.data);
    			console.log(estudios);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const cargarMedicamentos = () => {
    		const config = {
    			method: "get",
    			url: `${url}/medicamentos?b=${sltBuscarMedicamentos}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(6, medicamentos = res.data);
    		}).catch(error => {
    			console.error(error);
    		});
    	};

    	const guardarHistoria = () => {
    		$$invalidate(20, errorServer = false);
    		$$invalidate(13, cargando = true);
    		$$invalidate(7, historia.diagnosticos = diagnosticosSeleccionados, historia);
    		delete historia.id;

    		const config = {
    			method: "put",
    			url: `${url}/historias/${params.idHistoria}`,
    			data: historia,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			axios$1(config).then(res => {
    				$$invalidate(13, cargando = false);
    				console.log(res.data);

    				if (res.status !== 200) {
    					$$invalidate(20, errorServer = true);
    				}
    			}).catch(error => {
    				if (error) {
    					$$invalidate(20, errorServer = true);
    					$$invalidate(13, cargando = false);
    				}

    				$$invalidate(13, cargando = false);
    				console.error(error);
    			});
    		} catch(error) {
    			$$invalidate(20, errorServer = true);
    			$$invalidate(13, cargando = false);
    		}
    	};

    	async function cargarPaciente() {
    		const config = {
    			method: "get",
    			url: `${url}/pacientes/${params.idPaciente}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		let promesa = await axios$1(config);

    		if (promesa.status == 200) {
    			$$invalidate(1, paciente = await promesa.data);
    			$$invalidate(2, edad = calcularEdad$2(paciente.fechaNacimiento));

    			if (paciente.seguroMedico.length !== 0) {
    				$$invalidate(3, seguro = paciente.seguroMedico[0].nombre);
    			} else {
    				$$invalidate(3, seguro = "N/A");
    			}

    			console.log(promesa.data);
    		} else {
    			console.error(promesa.statusText);
    		}
    	}

    	const cargarHistoria = async () => {
    		const config = {
    			method: "get",
    			url: `${url}/historias/${params.idHistoria}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		let promesa = await axios$1(config);

    		if (promesa.status == 200) {
    			$$invalidate(7, historia = promesa.data);
    			$$invalidate(8, temperatura = promesa.data.temperatura);
    			$$invalidate(9, presionAlterial = promesa.data.presionAlterial);
    			$$invalidate(10, peso = promesa.data.peso);
    			$$invalidate(5, diagnosticosSeleccionados = promesa.data.diagnosticos);
    			$$invalidate(11, fecha = promesa.data.fechaHora.split("T")[0]);
    			$$invalidate(15, medicamentosSeleccionados = promesa.data.medicamentos);
    			$$invalidate(18, estudiosSeleccionados = promesa.data.estudios);
    			$$invalidate(19, historiaGinecologica = promesa.data.historiaGinecologica);
    			let obtenerHora = promesa.data.fechaHora.split("T")[1].split("Z")[0].split(".")[0].split(":");
    			$$invalidate(12, hora = obtenerHora[0] + ":" + obtenerHora[1]);
    			console.log(historia);
    			console.log(hora);
    		} else {
    			console.error(error);
    		}
    	};

    	function cargarDiagnosticos() {
    		const config = {
    			method: "get",
    			url: `${url}/diagnosticos?b=${inpBuscarDiagnostico}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		setTimeout(
    			() => {
    				axios$1(config).then(res => {
    					$$invalidate(92, diagnosticos = res.data);
    				}).catch(error => {
    					console.log(error);
    				});
    			},
    			1000
    		);
    	}

    	function seleccionarDiagnostico(id) {
    		const config = {
    			method: "get",
    			url: `${url}/diagnosticos/${id}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(5, diagnosticosSeleccionados = [...diagnosticosSeleccionados, res.data]);
    			guardarHistoria();
    			console.log(diagnosticosSeleccionados);
    		});

    		$$invalidate(4, inpBuscarDiagnostico = "");
    	}

    	onMount(async () => {
    		jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    		await cargarPaciente();
    		await cargarHistoria();
    		cargarDiagnosticos();
    		cargarMedicamentos();
    		cargarEstudios();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<HistoriaClinica> was created with unknown prop '${key}'`);
    	});

    	function textarea0_input_handler() {
    		historia.motivoConsulta = this.value;
    		$$invalidate(7, historia);
    	}

    	function textarea1_input_handler() {
    		historia.historiaEnfermedad = this.value;
    		$$invalidate(7, historia);
    	}

    	function input0_input_handler() {
    		historiaGinecologica.fechaUltimaMenstruacion = this.value;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input1_input_handler() {
    		historiaGinecologica.fechaUltimoPap = this.value;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input2_input_handler() {
    		historiaGinecologica.fechaUltimoParto = this.value;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input3_input_handler() {
    		historiaGinecologica.fechaUltimoAborto = this.value;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input4_input_handler() {
    		historiaGinecologica.fechaUltimoCesarea = this.value;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input5_input_handler() {
    		historiaGinecologica.intervaloFlujoMenstrual = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input6_input_handler() {
    		historiaGinecologica.cantidadFlujoMenstrual = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input7_input_handler() {
    		historiaGinecologica.duracionFlujoMenstrual = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input8_input_handler() {
    		historiaGinecologica.gesta = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input9_input_handler() {
    		historiaGinecologica.para = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input10_input_handler() {
    		historiaGinecologica.abortos = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input11_input_handler() {
    		historiaGinecologica.cesareas = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input12_input_handler() {
    		historiaGinecologica.espontaneos = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input13_input_handler() {
    		historiaGinecologica.provocados = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input14_input_handler() {
    		historiaGinecologica.legrados = to_number(this.value);
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input15_change_handler() {
    		historiaGinecologica.sangradoVaginal = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input16_change_handler() {
    		historiaGinecologica.vidaSexualActiva = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input17_change_handler() {
    		historiaGinecologica.anticonceptivosOrales = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input18_change_handler() {
    		historiaGinecologica.diu = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input19_change_handler() {
    		historiaGinecologica.aqv = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input20_change_handler() {
    		historiaGinecologica.condon = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input21_change_handler() {
    		historiaGinecologica.norplant = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input22_change_handler() {
    		historiaGinecologica.ritmo = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input23_change_handler() {
    		historiaGinecologica.coitoInterruptus = this.checked;
    		$$invalidate(19, historiaGinecologica);
    	}

    	function input24_input_handler() {
    		temperatura.valor = to_number(this.value);
    		$$invalidate(8, temperatura);
    	}

    	function select0_change_handler() {
    		temperatura.tipo = select_value(this);
    		$$invalidate(8, temperatura);
    	}

    	function input25_input_handler() {
    		historia.frecuenciaRespiratoria = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input26_input_handler() {
    		historia.frecuenciaCardiaca = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input27_input_handler() {
    		presionAlterial.mm = to_number(this.value);
    		$$invalidate(9, presionAlterial);
    	}

    	function input28_input_handler() {
    		presionAlterial.Hg = to_number(this.value);
    		$$invalidate(9, presionAlterial);
    	}

    	function input29_input_handler() {
    		peso.valor = to_number(this.value);
    		$$invalidate(10, peso);
    	}

    	function select1_change_handler() {
    		peso.tipo = select_value(this);
    		$$invalidate(10, peso);
    	}

    	function input30_input_handler() {
    		historia.escalaGalsgow = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input31_input_handler() {
    		historia.escalaDolor = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input32_input_handler() {
    		historia.saturacionOxigeno = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input33_input_handler() {
    		historia.otrosParametros = this.value;
    		$$invalidate(7, historia);
    	}

    	function textarea2_input_handler() {
    		historia.examenFisico = this.value;
    		$$invalidate(7, historia);
    	}

    	function input34_input_handler() {
    		inpBuscarDiagnostico = this.value;
    		$$invalidate(4, inpBuscarDiagnostico);
    	}

    	const click_handler = diagnostico => seleccionarDiagnostico(diagnostico.c);
    	const click_handler_1 = () => agregarDiagnosticoPersonalizado(inpBuscarDiagnostico);
    	const click_handler_2 = i => agregarComentarioDiagnostico(i);
    	const click_handler_3 = i => eliminarDiagnostico(i);

    	function input_input_handler(each_value, i) {
    		each_value[i].comentario = this.value;
    		$$invalidate(5, diagnosticosSeleccionados);
    	}

    	function ordenesmedicas_idHistoria_binding(value) {
    		params.idHistoria = value;
    		$$invalidate(0, params);
    	}

    	function ordenesmedicas_idPaciente_binding(value) {
    		params.idPaciente = value;
    		$$invalidate(0, params);
    	}

    	function ordenesmedicas_estudiosSeleccionados_binding(value) {
    		estudiosSeleccionados = value;
    		$$invalidate(18, estudiosSeleccionados);
    	}

    	function ordenesmedicas_medicamentosSeleccionados_binding(value) {
    		medicamentosSeleccionados = value;
    		$$invalidate(15, medicamentosSeleccionados);
    	}

    	function ordenesmedicas_sltBuscarMedicamentos_binding(value) {
    		sltBuscarMedicamentos = value;
    		$$invalidate(14, sltBuscarMedicamentos);
    	}

    	function ordenesmedicas_sltBuscarEstudios_binding(value) {
    		sltBuscarEstudios = value;
    		$$invalidate(16, sltBuscarEstudios);
    	}

    	function ordenesmedicas_medicamentos_binding(value) {
    		medicamentos = value;
    		$$invalidate(6, medicamentos);
    	}

    	function ordenesmedicas_instrucciones_binding(value) {
    		historia.instrucciones = value;
    		$$invalidate(7, historia);
    	}

    	function ordenesmedicas_estudios_binding(value) {
    		estudios = value;
    		$$invalidate(17, estudios);
    	}

    	function textarea3_input_handler() {
    		historia.observaciones = this.value;
    		$$invalidate(7, historia);
    	}

    	function input35_input_handler() {
    		fecha = this.value;
    		$$invalidate(11, fecha);
    	}

    	const blur_handler = () => console.log(hora);

    	function input36_input_handler() {
    		hora = this.value;
    		$$invalidate(12, hora);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		axios: axios$1,
    		onMount,
    		url,
    		uuid: v4,
    		Header,
    		AsideAtencion,
    		ModalDatosPaciente,
    		ModalTratamientos,
    		ModalInterconsulta,
    		ModalAntecedentes,
    		OrdenesMedicas,
    		SignosVitales,
    		ErrorServer: ErrorConexion,
    		Toast,
    		params,
    		paciente,
    		edad,
    		seguro,
    		diagnosticos,
    		inpBuscarDiagnostico,
    		diagnosticosSeleccionados,
    		medicamentos,
    		historia,
    		temperatura,
    		presionAlterial,
    		peso,
    		timeout,
    		fecha,
    		hora,
    		cargando,
    		sltBuscarMedicamentos,
    		medicamentosSeleccionados,
    		sltBuscarEstudios,
    		estudios,
    		estudiosSeleccionados,
    		historiaGinecologica,
    		errorServer,
    		searchMedicamentos,
    		searchDiagnosticos,
    		searchEstudios,
    		agregarEstudio,
    		agregarDiagnosticoPersonalizado,
    		agregarComentarioDiagnostico,
    		eliminarMedicamento,
    		eliminarDiagnostico,
    		eliminarEstudios,
    		agregarMedicamento,
    		cargarEstudios,
    		cargarMedicamentos,
    		guardarHistoria,
    		cargarPaciente,
    		cargarHistoria,
    		cargarDiagnosticos,
    		seleccionarDiagnostico,
    		calcularEdad: calcularEdad$2,
    		filtroDiagnostico
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("paciente" in $$props) $$invalidate(1, paciente = $$props.paciente);
    		if ("edad" in $$props) $$invalidate(2, edad = $$props.edad);
    		if ("seguro" in $$props) $$invalidate(3, seguro = $$props.seguro);
    		if ("diagnosticos" in $$props) $$invalidate(92, diagnosticos = $$props.diagnosticos);
    		if ("inpBuscarDiagnostico" in $$props) $$invalidate(4, inpBuscarDiagnostico = $$props.inpBuscarDiagnostico);
    		if ("diagnosticosSeleccionados" in $$props) $$invalidate(5, diagnosticosSeleccionados = $$props.diagnosticosSeleccionados);
    		if ("medicamentos" in $$props) $$invalidate(6, medicamentos = $$props.medicamentos);
    		if ("historia" in $$props) $$invalidate(7, historia = $$props.historia);
    		if ("temperatura" in $$props) $$invalidate(8, temperatura = $$props.temperatura);
    		if ("presionAlterial" in $$props) $$invalidate(9, presionAlterial = $$props.presionAlterial);
    		if ("peso" in $$props) $$invalidate(10, peso = $$props.peso);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("fecha" in $$props) $$invalidate(11, fecha = $$props.fecha);
    		if ("hora" in $$props) $$invalidate(12, hora = $$props.hora);
    		if ("cargando" in $$props) $$invalidate(13, cargando = $$props.cargando);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(14, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(15, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    		if ("sltBuscarEstudios" in $$props) $$invalidate(16, sltBuscarEstudios = $$props.sltBuscarEstudios);
    		if ("estudios" in $$props) $$invalidate(17, estudios = $$props.estudios);
    		if ("estudiosSeleccionados" in $$props) $$invalidate(18, estudiosSeleccionados = $$props.estudiosSeleccionados);
    		if ("historiaGinecologica" in $$props) $$invalidate(19, historiaGinecologica = $$props.historiaGinecologica);
    		if ("errorServer" in $$props) $$invalidate(20, errorServer = $$props.errorServer);
    		if ("filtroDiagnostico" in $$props) $$invalidate(21, filtroDiagnostico = $$props.filtroDiagnostico);
    	};

    	let filtroDiagnostico;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[2] & /*diagnosticos*/ 1073741824) {
    			 $$invalidate(21, filtroDiagnostico = diagnosticos);
    		}
    	};

    	return [
    		params,
    		paciente,
    		edad,
    		seguro,
    		inpBuscarDiagnostico,
    		diagnosticosSeleccionados,
    		medicamentos,
    		historia,
    		temperatura,
    		presionAlterial,
    		peso,
    		fecha,
    		hora,
    		cargando,
    		sltBuscarMedicamentos,
    		medicamentosSeleccionados,
    		sltBuscarEstudios,
    		estudios,
    		estudiosSeleccionados,
    		historiaGinecologica,
    		errorServer,
    		filtroDiagnostico,
    		searchMedicamentos,
    		searchDiagnosticos,
    		searchEstudios,
    		agregarEstudio,
    		agregarDiagnosticoPersonalizado,
    		agregarComentarioDiagnostico,
    		eliminarMedicamento,
    		eliminarDiagnostico,
    		eliminarEstudios,
    		agregarMedicamento,
    		guardarHistoria,
    		seleccionarDiagnostico,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler,
    		input10_input_handler,
    		input11_input_handler,
    		input12_input_handler,
    		input13_input_handler,
    		input14_input_handler,
    		input15_change_handler,
    		input16_change_handler,
    		input17_change_handler,
    		input18_change_handler,
    		input19_change_handler,
    		input20_change_handler,
    		input21_change_handler,
    		input22_change_handler,
    		input23_change_handler,
    		input24_input_handler,
    		select0_change_handler,
    		input25_input_handler,
    		input26_input_handler,
    		input27_input_handler,
    		input28_input_handler,
    		input29_input_handler,
    		select1_change_handler,
    		input30_input_handler,
    		input31_input_handler,
    		input32_input_handler,
    		input33_input_handler,
    		textarea2_input_handler,
    		input34_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input_input_handler,
    		ordenesmedicas_idHistoria_binding,
    		ordenesmedicas_idPaciente_binding,
    		ordenesmedicas_estudiosSeleccionados_binding,
    		ordenesmedicas_medicamentosSeleccionados_binding,
    		ordenesmedicas_sltBuscarMedicamentos_binding,
    		ordenesmedicas_sltBuscarEstudios_binding,
    		ordenesmedicas_medicamentos_binding,
    		ordenesmedicas_instrucciones_binding,
    		ordenesmedicas_estudios_binding,
    		textarea3_input_handler,
    		input35_input_handler,
    		blur_handler,
    		input36_input_handler
    	];
    }

    class HistoriaClinica extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { params: 0 }, [-1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoriaClinica",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get params() {
    		throw new Error("<HistoriaClinica>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<HistoriaClinica>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Home\Login.svelte generated by Svelte v3.29.0 */

    const { console: console_1$7 } = globals;
    const file$k = "src\\Pages\\Home\\Login.svelte";

    // (58:12) {#if cargando}
    function create_if_block$9(ctx) {
    	let div;
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loading.$$.fragment);
    			attr_dev(div, "class", "cargando");
    			add_location(div, file$k, 58, 16, 1844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loading, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loading);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(58:12) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let div9;
    	let div8;
    	let div6;
    	let t0;
    	let div5;
    	let div4;
    	let div0;
    	let p0;
    	let img;
    	let img_src_value;
    	let t1;
    	let p1;
    	let t3;
    	let form;
    	let div3;
    	let div1;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div2;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let button;
    	let t11;
    	let p2;
    	let a;
    	let t13;
    	let div7;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*cargando*/ ctx[2] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			img = element("img");
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "xmedical pro";
    			t3 = space();
    			form = element("form");
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Correo";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Contraseña";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			button = element("button");
    			button.textContent = "Entrar";
    			t11 = space();
    			p2 = element("p");
    			a = element("a");
    			a.textContent = "Olvide mi contraseña?";
    			t13 = space();
    			div7 = element("div");
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "80");
    			attr_dev(img, "alt", "");
    			add_location(img, file$k, 66, 28, 2160);
    			add_location(p0, file$k, 65, 24, 2127);
    			attr_dev(p1, "class", "admin-brand-content");
    			add_location(p1, file$k, 69, 24, 2267);
    			attr_dev(div0, "class", "p-b-20 text-center");
    			add_location(div0, file$k, 64, 20, 2069);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$k, 76, 32, 2646);
    			attr_dev(input0, "type", "email");
    			input0.required = "true";
    			attr_dev(input0, "autocomplete", "username");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Correo");
    			add_location(input0, file$k, 77, 32, 2708);
    			attr_dev(div1, "class", "form-group floating-label col-md-12");
    			add_location(div1, file$k, 75, 28, 2563);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$k, 80, 32, 2982);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "autocomplete", "current-password");
    			attr_dev(input1, "placeholder", "Contraseña");
    			input1.required = "true";
    			attr_dev(input1, "class", "form-control ");
    			add_location(input1, file$k, 81, 32, 3055);
    			attr_dev(div2, "class", "form-group floating-label col-md-12");
    			add_location(div2, file$k, 79, 28, 2899);
    			attr_dev(div3, "class", "form-row");
    			add_location(div3, file$k, 74, 24, 2511);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary btn-block btn-lg");
    			add_location(button, file$k, 85, 24, 3301);
    			attr_dev(form, "class", "needs-validation");
    			add_location(form, file$k, 73, 20, 2420);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-underline");
    			add_location(a, file$k, 89, 24, 3487);
    			attr_dev(p2, "class", "text-right p-t-10");
    			add_location(p2, file$k, 88, 20, 3432);
    			attr_dev(div4, "class", "mx-auto col-md-8");
    			add_location(div4, file$k, 63, 16, 2017);
    			attr_dev(div5, "class", "row align-items-center m-h-100");
    			add_location(div5, file$k, 62, 12, 1955);
    			attr_dev(div6, "class", "col-lg-4  bg-white");
    			add_location(div6, file$k, 56, 8, 1766);
    			attr_dev(div7, "class", "col-lg-8 d-none d-md-block bg-cover");
    			set_style(div7, "background-image", "url('assets/img/login.svg')");
    			add_location(div7, file$k, 95, 8, 3653);
    			attr_dev(div8, "class", "row ");
    			add_location(div8, file$k, 55, 4, 1738);
    			attr_dev(div9, "class", "container-fluid");
    			add_location(div9, file$k, 54, 0, 1703);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			if (if_block) if_block.m(div6, null);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(p0, img);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(div4, t3);
    			append_dev(div4, form);
    			append_dev(form, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			set_input_value(input0, /*inpCorreo*/ ctx[0]);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t8);
    			append_dev(div2, input1);
    			set_input_value(input1, /*inpPassword*/ ctx[1]);
    			append_dev(form, t9);
    			append_dev(form, button);
    			append_dev(div4, t11);
    			append_dev(div4, p2);
    			append_dev(p2, a);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(form, "submit", prevent_default(/*login*/ ctx[3]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*cargando*/ ctx[2]) {
    				if (if_block) {
    					if (dirty & /*cargando*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div6, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*inpCorreo*/ 1 && input0.value !== /*inpCorreo*/ ctx[0]) {
    				set_input_value(input0, /*inpCorreo*/ ctx[0]);
    			}

    			if (dirty & /*inpPassword*/ 2 && input1.value !== /*inpPassword*/ ctx[1]) {
    				set_input_value(input1, /*inpPassword*/ ctx[1]);
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
    			if (detaching) detach_dev(div9);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let inpCorreo = "";
    	let inpPassword = "";
    	let cargando = false;

    	const login = () => {
    		$$invalidate(2, cargando = true);
    		const data = { correo: inpCorreo, password: inpPassword };

    		const config = {
    			method: "post",
    			url: `${url}/login`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			},
    			data
    		};

    		axios$1(config).then(res => {
    			$$invalidate(2, cargando = false);
    			localStorage.setItem("auth", res.data);
    			console.log(res.data);

    			if (res.status === 403) {
    				Swal.fire({
    					icon: "error",
    					title: "Oops...",
    					text: "Usuario o contrase&ntilde;a incorrectos!",
    					footer: "<a href=\"\">Why do I have this issue?</a>"
    				});
    			}

    			if (isLogin()) {
    				return push("/");
    			}
    		}).catch(err => {
    			$$invalidate(2, cargando = false);

    			if (err.response.status === 403) {
    				Swal.fire({
    					icon: "error",
    					title: "Oops...",
    					text: "Usuario o contraseña incorrectos, intenta de nuevo!"
    				});
    			}
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		inpCorreo = this.value;
    		$$invalidate(0, inpCorreo);
    	}

    	function input1_input_handler() {
    		inpPassword = this.value;
    		$$invalidate(1, inpPassword);
    	}

    	$$self.$capture_state = () => ({
    		url,
    		isLogin,
    		axios: axios$1,
    		push,
    		Loading,
    		inpCorreo,
    		inpPassword,
    		cargando,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ("inpCorreo" in $$props) $$invalidate(0, inpCorreo = $$props.inpCorreo);
    		if ("inpPassword" in $$props) $$invalidate(1, inpPassword = $$props.inpPassword);
    		if ("cargando" in $$props) $$invalidate(2, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inpCorreo,
    		inpPassword,
    		cargando,
    		login,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalCrearUsuarios.svelte generated by Svelte v3.29.0 */

    const file$l = "src\\componentes\\Modals\\ModalCrearUsuarios.svelte";

    function create_fragment$n(ctx) {
    	let form;
    	let div20;
    	let div19;
    	let div18;
    	let div0;
    	let h5;
    	let t1;
    	let button0;
    	let span;
    	let t3;
    	let div11;
    	let div2;
    	let div1;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div4;
    	let div3;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let div6;
    	let div5;
    	let label2;
    	let t11;
    	let input2;
    	let t12;
    	let div8;
    	let div7;
    	let label3;
    	let t14;
    	let input3;
    	let t15;
    	let div10;
    	let div9;
    	let label4;
    	let t17;
    	let input4;
    	let t18;
    	let div17;
    	let div16;
    	let div13;
    	let button1;
    	let h30;
    	let t19;
    	let div12;
    	let t21;
    	let div15;
    	let button2;
    	let h31;
    	let t22;
    	let div14;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div20 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Usuario";
    			t1 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "×";
    			t3 = space();
    			div11 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nombre";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div4 = element("div");
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Apellido";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div6 = element("div");
    			div5 = element("div");
    			label2 = element("label");
    			label2.textContent = "Email";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			div8 = element("div");
    			div7 = element("div");
    			label3 = element("label");
    			label3.textContent = "Contraseña";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			div10 = element("div");
    			div9 = element("div");
    			label4 = element("label");
    			label4.textContent = "Repetir contraseña";
    			t17 = space();
    			input4 = element("input");
    			t18 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div13 = element("div");
    			button1 = element("button");
    			h30 = element("h3");
    			t19 = space();
    			div12 = element("div");
    			div12.textContent = "Cerrar";
    			t21 = space();
    			div15 = element("div");
    			button2 = element("button");
    			h31 = element("h3");
    			t22 = space();
    			div14 = element("div");
    			div14.textContent = "Guardar";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalUsuarioLabel");
    			add_location(h5, file$l, 6, 16, 358);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$l, 9, 20, 586);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-bind", "click: nuevoUsuario");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$l, 7, 16, 435);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$l, 5, 12, 314);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$l, 15, 28, 838);
    			attr_dev(input0, "type", "name");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "John");
    			attr_dev(input0, "name", "Name");
    			attr_dev(input0, "maxlength", "200");
    			input0.required = true;
    			add_location(input0, file$l, 16, 28, 896);
    			attr_dev(div1, "class", "form-group col-md-12");
    			add_location(div1, file$l, 14, 24, 774);
    			attr_dev(div2, "class", "form-row");
    			add_location(div2, file$l, 13, 20, 726);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$l, 28, 28, 1415);
    			attr_dev(input1, "type", "name");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Doe");
    			attr_dev(input1, "name", "Name");
    			attr_dev(input1, "maxlength", "200");
    			input1.required = true;
    			add_location(input1, file$l, 29, 28, 1475);
    			attr_dev(div3, "class", "form-group col-md-12");
    			add_location(div3, file$l, 27, 24, 1351);
    			attr_dev(div4, "class", "form-row");
    			add_location(div4, file$l, 26, 20, 1303);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$l, 41, 28, 1993);
    			attr_dev(input2, "type", "email");
    			input2.required = true;
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "placeholder", "usuario@correo.com");
    			attr_dev(input2, "autocomplete", "off");
    			attr_dev(input2, "name", "Email");
    			attr_dev(input2, "id", "txtCorreo");
    			attr_dev(input2, "maxlength", "100");
    			add_location(input2, file$l, 42, 28, 2050);
    			attr_dev(div5, "class", "form-group col-md-12");
    			add_location(div5, file$l, 40, 24, 1929);
    			attr_dev(div6, "class", "form-row");
    			add_location(div6, file$l, 39, 20, 1881);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$l, 56, 28, 2685);
    			attr_dev(input3, "type", "password");
    			attr_dev(input3, "class", "form-control");
    			input3.required = true;
    			attr_dev(input3, "name", "PasswordHash");
    			attr_dev(input3, "maxlength", "50");
    			add_location(input3, file$l, 57, 28, 2754);
    			attr_dev(div7, "class", "form-group col-md-12");
    			add_location(div7, file$l, 55, 24, 2621);
    			attr_dev(div8, "class", "form-row");
    			add_location(div8, file$l, 54, 20, 2573);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$l, 68, 28, 3232);
    			attr_dev(input4, "type", "password");
    			attr_dev(input4, "class", "form-control");
    			input4.required = true;
    			attr_dev(input4, "name", "PasswordHash");
    			attr_dev(input4, "maxlength", "50");
    			add_location(input4, file$l, 69, 28, 3309);
    			attr_dev(div9, "class", "form-group col-md-12");
    			add_location(div9, file$l, 67, 24, 3168);
    			attr_dev(div10, "class", "form-row");
    			add_location(div10, file$l, 66, 20, 3120);
    			attr_dev(div11, "class", "modal-body");
    			add_location(div11, file$l, 12, 12, 680);
    			attr_dev(h30, "class", "mdi mdi-close-outline");
    			add_location(h30, file$l, 84, 32, 4028);
    			attr_dev(div12, "class", "text-overline");
    			add_location(div12, file$l, 85, 32, 4101);
    			attr_dev(button1, "class", "btn btn-default text-danger");
    			attr_dev(button1, "data-dismiss", "modal");
    			add_location(button1, file$l, 82, 28, 3852);
    			attr_dev(div13, "class", "col");
    			add_location(div13, file$l, 81, 24, 3805);
    			attr_dev(h31, "class", "mdi mdi-content-save-outline");
    			add_location(h31, file$l, 92, 36, 4514);
    			attr_dev(div14, "class", "text-overline");
    			add_location(div14, file$l, 93, 36, 4598);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-default text-info");
    			add_location(button2, file$l, 90, 32, 4339);
    			attr_dev(div15, "class", "col");
    			add_location(div15, file$l, 89, 28, 4288);
    			attr_dev(div16, "class", "row text-center p-b-10");
    			add_location(div16, file$l, 80, 20, 3743);
    			attr_dev(div17, "class", "modal-footer");
    			add_location(div17, file$l, 79, 16, 3695);
    			attr_dev(div18, "class", "modal-content");
    			add_location(div18, file$l, 4, 8, 273);
    			attr_dev(div19, "class", "modal-dialog");
    			attr_dev(div19, "role", "document");
    			add_location(div19, file$l, 3, 4, 221);
    			attr_dev(div20, "class", "modal fade modal-slide-right");
    			attr_dev(div20, "id", "modalUsuario");
    			attr_dev(div20, "tabindex", "-1");
    			attr_dev(div20, "role", "dialog");
    			attr_dev(div20, "aria-labelledby", "modalUsuarioLabel");
    			set_style(div20, "display", "none");
    			set_style(div20, "padding-right", "16px");
    			attr_dev(div20, "aria-modal", "true");
    			add_location(div20, file$l, 1, 0, 24);
    			attr_dev(form, "id", "frmUsuario");
    			add_location(form, file$l, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span);
    			append_dev(div18, t3);
    			append_dev(div18, div11);
    			append_dev(div11, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			append_dev(div11, t6);
    			append_dev(div11, div4);
    			append_dev(div4, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t8);
    			append_dev(div3, input1);
    			append_dev(div11, t9);
    			append_dev(div11, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label2);
    			append_dev(div5, t11);
    			append_dev(div5, input2);
    			append_dev(div11, t12);
    			append_dev(div11, div8);
    			append_dev(div8, div7);
    			append_dev(div7, label3);
    			append_dev(div7, t14);
    			append_dev(div7, input3);
    			append_dev(div11, t15);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, label4);
    			append_dev(div9, t17);
    			append_dev(div9, input4);
    			append_dev(div18, t18);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div13);
    			append_dev(div13, button1);
    			append_dev(button1, h30);
    			append_dev(button1, t19);
    			append_dev(button1, div12);
    			append_dev(div16, t21);
    			append_dev(div16, div15);
    			append_dev(div15, button2);
    			append_dev(button2, h31);
    			append_dev(button2, t22);
    			append_dev(button2, div14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalCrearUsuarios", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalCrearUsuarios> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalCrearUsuarios extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalCrearUsuarios",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalRolesUsuario.svelte generated by Svelte v3.29.0 */

    const file$m = "src\\componentes\\Modals\\ModalRolesUsuario.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[5] = list;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (35:28) {#each rolesMapeado as role}
    function create_each_block$6(ctx) {
    	let div;
    	let label;
    	let span0;
    	let t0_value = /*role*/ ctx[4].displayName + "";
    	let t0;
    	let t1;
    	let a;
    	let i;
    	let t2;
    	let input;
    	let t3;
    	let span1;
    	let t4;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[3].call(input, /*each_value*/ ctx[5], /*role_index*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			a = element("a");
    			i = element("i");
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			span1 = element("span");
    			t4 = space();
    			attr_dev(i, "class", "mdi-18px mdi mdi-information-outline");
    			add_location(i, file$m, 42, 70, 2368);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "data-toggle", "popover");
    			attr_dev(a, "title", "Informacion Administrador");
    			attr_dev(a, "data-trigger", "focus");
    			attr_dev(a, "data-placement", "bottom");
    			attr_dev(a, "data-content", "And here's some amazing content. It's very engaging. Right?");
    			attr_dev(a, "class", "icon-rol");
    			add_location(a, file$m, 38, 69, 1946);
    			attr_dev(span0, "class", "cstm-switch-description mr-auto bd-highlight");
    			add_location(span0, file$m, 37, 45, 1817);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "cstm-switch-input");
    			add_location(input, file$m, 44, 45, 2536);
    			attr_dev(span1, "class", "cstm-switch-indicator bg-success bd-highlight");
    			add_location(span1, file$m, 47, 45, 2759);
    			attr_dev(label, "class", "cstm-switch d-flex bd-highlight");
    			add_location(label, file$m, 36, 41, 1723);
    			attr_dev(div, "class", "lista-rol m-b-10");
    			add_location(div, file$m, 35, 37, 1650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(span0, a);
    			append_dev(a, i);
    			append_dev(label, t2);
    			append_dev(label, input);
    			input.checked = /*role*/ ctx[4].active;
    			append_dev(label, t3);
    			append_dev(label, span1);
    			append_dev(div, t4);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*rolesMapeado*/ 2 && t0_value !== (t0_value = /*role*/ ctx[4].displayName + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*rolesMapeado*/ 2) {
    				input.checked = /*role*/ ctx[4].active;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(35:28) {#each rolesMapeado as role}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h5;
    	let t0_value = /*usuario*/ ctx[0].nombre + "";
    	let t0;
    	let t1;
    	let t2_value = /*usuario*/ ctx[0].apellido + "";
    	let t2;
    	let t3;
    	let button;
    	let span0;
    	let t5;
    	let div3;
    	let form;
    	let input0;
    	let t6;
    	let p;
    	let span1;
    	let t7_value = /*usuario*/ ctx[0].correo + "";
    	let t7;
    	let t8;
    	let div1;
    	let label;
    	let t10;
    	let input1;
    	let t11;
    	let div2;
    	let each_value = /*rolesMapeado*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t5 = space();
    			div3 = element("div");
    			form = element("form");
    			input0 = element("input");
    			t6 = space();
    			p = element("p");
    			span1 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Buscar";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalRolesLabel");
    			add_location(h5, file$m, 18, 20, 661);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$m, 20, 24, 870);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$m, 19, 20, 768);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$m, 17, 16, 613);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "idPaciente");
    			input0.value = "";
    			add_location(input0, file$m, 26, 24, 1062);
    			attr_dev(span1, "class", "badge badge-soft-primary");
    			set_style(span1, "font-size", "17px");
    			add_location(span1, file$m, 27, 27, 1139);
    			add_location(p, file$m, 27, 24, 1136);
    			attr_dev(label, "for", "");
    			add_location(label, file$m, 30, 28, 1351);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Buscar roles");
    			add_location(input1, file$m, 31, 28, 1409);
    			attr_dev(div1, "class", "form-group floating-label");
    			add_location(div1, file$m, 29, 24, 1282);
    			attr_dev(div2, "class", "roles");
    			add_location(div2, file$m, 33, 24, 1534);
    			attr_dev(form, "id", "");
    			add_location(form, file$m, 25, 20, 1024);
    			attr_dev(div3, "class", "modal-body");
    			add_location(div3, file$m, 23, 16, 976);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$m, 16, 12, 568);
    			attr_dev(div5, "class", "modal-dialog");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$m, 15, 8, 512);
    			attr_dev(div6, "class", "modal fade modal-slide-right");
    			attr_dev(div6, "id", "modalRoles");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			attr_dev(div6, "aria-labelledby", "modalRolesLabel");
    			set_style(div6, "display", "none");
    			set_style(div6, "padding-right", "16px");
    			attr_dev(div6, "aria-modal", "true");
    			add_location(div6, file$m, 13, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h5);
    			append_dev(h5, t0);
    			append_dev(h5, t1);
    			append_dev(h5, t2);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			append_dev(button, span0);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, input0);
    			append_dev(form, t6);
    			append_dev(form, p);
    			append_dev(p, span1);
    			append_dev(span1, t7);
    			append_dev(form, t8);
    			append_dev(form, div1);
    			append_dev(div1, label);
    			append_dev(div1, t10);
    			append_dev(div1, input1);
    			append_dev(form, t11);
    			append_dev(form, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*usuario*/ 1 && t0_value !== (t0_value = /*usuario*/ ctx[0].nombre + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*usuario*/ 1 && t2_value !== (t2_value = /*usuario*/ ctx[0].apellido + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*usuario*/ 1 && t7_value !== (t7_value = /*usuario*/ ctx[0].correo + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*rolesMapeado*/ 2) {
    				each_value = /*rolesMapeado*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalRolesUsuario", slots, []);
    	let { usuario = {} } = $$props;
    	let { roles = [] } = $$props;
    	const writable_props = ["usuario", "roles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalRolesUsuario> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(each_value, role_index) {
    		each_value[role_index].active = this.checked;
    		(($$invalidate(1, rolesMapeado), $$invalidate(2, roles)), $$invalidate(0, usuario));
    	}

    	$$self.$$set = $$props => {
    		if ("usuario" in $$props) $$invalidate(0, usuario = $$props.usuario);
    		if ("roles" in $$props) $$invalidate(2, roles = $$props.roles);
    	};

    	$$self.$capture_state = () => ({ usuario, roles, rolesMapeado });

    	$$self.$inject_state = $$props => {
    		if ("usuario" in $$props) $$invalidate(0, usuario = $$props.usuario);
    		if ("roles" in $$props) $$invalidate(2, roles = $$props.roles);
    		if ("rolesMapeado" in $$props) $$invalidate(1, rolesMapeado = $$props.rolesMapeado);
    	};

    	let rolesMapeado;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*roles, usuario*/ 5) {
    			 $$invalidate(1, rolesMapeado = roles.map(x => {
    				return {
    					id: x.id,
    					name: x.name,
    					displayName: x.displayName,
    					active: usuario.roles.some(y => x.name === y)
    				};
    			}));
    		}
    	};

    	return [usuario, rolesMapeado, roles, input_change_handler];
    }

    class ModalRolesUsuario extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { usuario: 0, roles: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalRolesUsuario",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get usuario() {
    		throw new Error("<ModalRolesUsuario>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set usuario(value) {
    		throw new Error("<ModalRolesUsuario>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get roles() {
    		throw new Error("<ModalRolesUsuario>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set roles(value) {
    		throw new Error("<ModalRolesUsuario>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Usuarios\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$8 } = globals;
    const file$n = "src\\Pages\\Usuarios\\Index.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (112:16) {#each usuarios as usuario}
    function create_each_block$7(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let td1;
    	let t1_value = /*usuario*/ ctx[9].nombre + "";
    	let t1;
    	let t2;
    	let t3_value = /*usuario*/ ctx[9].apellido + "";
    	let t3;
    	let t4;
    	let td2;
    	let t5_value = /*usuario*/ ctx[9].correo + "";
    	let t5;
    	let t6;
    	let td3;
    	let button;
    	let i0;
    	let t7;
    	let a0;
    	let i1;
    	let t8;
    	let a1;
    	let i2;
    	let a1_href_value;
    	let link_action;
    	let t9;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*usuario*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			td1 = element("td");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td3 = element("td");
    			button = element("button");
    			i0 = element("i");
    			t7 = space();
    			a0 = element("a");
    			i1 = element("i");
    			t8 = space();
    			a1 = element("a");
    			i2 = element("i");
    			t9 = space();
    			if (img.src !== (img_src_value = "assets/img/users/user-1.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "avatar-img avatar-sm rounded-circle");
    			attr_dev(img, "alt", "");
    			add_location(img, file$n, 114, 59, 3141);
    			attr_dev(div, "class", "avatar avatar-sm ");
    			add_location(div, file$n, 114, 28, 3110);
    			add_location(td0, file$n, 113, 24, 3076);
    			add_location(td1, file$n, 116, 24, 3294);
    			add_location(td2, file$n, 117, 24, 3364);
    			attr_dev(i0, "class", "mdi mdi-security");
    			add_location(i0, file$n, 128, 32, 3979);
    			attr_dev(button, "href", "#!");
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			attr_dev(button, "data-tooltip", "Roles");
    			attr_dev(button, "data-toggle", "modal");
    			attr_dev(button, "data-target", "#modalRoles");
    			add_location(button, file$n, 120, 28, 3543);
    			attr_dev(i1, "class", "mdi mdi-trash-can-outline");
    			add_location(i1, file$n, 135, 28, 4307);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$n, 130, 28, 4080);
    			attr_dev(i2, "class", "mdi mdi-send");
    			add_location(i2, file$n, 143, 32, 4715);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/perfil/${/*usuario*/ ctx[9].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Perfil");
    			add_location(a1, file$n, 137, 28, 4412);
    			attr_dev(td3, "class", "text-right");
    			add_location(td3, file$n, 118, 24, 3415);
    			add_location(tr, file$n, 112, 20, 3046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div);
    			append_dev(div, img);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, t1);
    			append_dev(td1, t2);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td2);
    			append_dev(td2, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, button);
    			append_dev(button, i0);
    			append_dev(td3, t7);
    			append_dev(td3, a0);
    			append_dev(a0, i1);
    			append_dev(td3, t8);
    			append_dev(td3, a1);
    			append_dev(a1, i2);
    			append_dev(tr, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler, false, false, false),
    					action_destroyer(link_action = link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*usuarios*/ 1 && t1_value !== (t1_value = /*usuario*/ ctx[9].nombre + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*usuarios*/ 1 && t3_value !== (t3_value = /*usuario*/ ctx[9].apellido + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*usuarios*/ 1 && t5_value !== (t5_value = /*usuario*/ ctx[9].correo + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*usuarios*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/perfil/${/*usuario*/ ctx[9].id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(112:16) {#each usuarios as usuario}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let modalcrearusuario;
    	let t2;
    	let modalrolesusuario;
    	let updating_usuario;
    	let updating_roles;
    	let t3;
    	let section;
    	let div3;
    	let div0;
    	let t4;
    	let div2;
    	let h5;
    	let t5;
    	let button;
    	let i;
    	let t6;
    	let t7;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t8;
    	let th1;
    	let t10;
    	let th2;
    	let t12;
    	let th3;
    	let t13;
    	let tbody;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	modalcrearusuario = new ModalCrearUsuarios({ $$inline: true });

    	function modalrolesusuario_usuario_binding(value) {
    		/*modalrolesusuario_usuario_binding*/ ctx[4].call(null, value);
    	}

    	function modalrolesusuario_roles_binding(value) {
    		/*modalrolesusuario_roles_binding*/ ctx[5].call(null, value);
    	}

    	let modalrolesusuario_props = {};

    	if (/*usuarioModal*/ ctx[1] !== void 0) {
    		modalrolesusuario_props.usuario = /*usuarioModal*/ ctx[1];
    	}

    	if (/*roles*/ ctx[2] !== void 0) {
    		modalrolesusuario_props.roles = /*roles*/ ctx[2];
    	}

    	modalrolesusuario = new ModalRolesUsuario({
    			props: modalrolesusuario_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(modalrolesusuario, "usuario", modalrolesusuario_usuario_binding));
    	binding_callbacks.push(() => bind(modalrolesusuario, "roles", modalrolesusuario_roles_binding));
    	let each_value = /*usuarios*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(modalcrearusuario.$$.fragment);
    			t2 = space();
    			create_component(modalrolesusuario.$$.fragment);
    			t3 = space();
    			section = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			t4 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			t5 = text("Usuarios \r\n            ");
    			button = element("button");
    			i = element("i");
    			t6 = text(" CREAR");
    			t7 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t8 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre";
    			t10 = space();
    			th2 = element("th");
    			th2.textContent = "Usuario";
    			t12 = space();
    			th3 = element("th");
    			t13 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			add_location(div0, file$n, 89, 6, 2290);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$n, 96, 17, 2545);
    			attr_dev(button, "class", "btn btn-primary btn-sm");
    			attr_dev(button, "data-toggle", "modal");
    			attr_dev(button, "data-target", "#modalUsuario");
    			add_location(button, file$n, 92, 12, 2389);
    			add_location(h5, file$n, 91, 8, 2362);
    			add_location(th0, file$n, 103, 20, 2788);
    			add_location(th1, file$n, 104, 20, 2819);
    			add_location(th2, file$n, 105, 20, 2856);
    			add_location(th3, file$n, 107, 20, 2896);
    			add_location(tr, file$n, 102, 16, 2762);
    			add_location(thead, file$n, 101, 16, 2737);
    			add_location(tbody, file$n, 110, 16, 2972);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$n, 100, 12, 2671);
    			attr_dev(div1, "class", "table-responsive");
    			add_location(div1, file$n, 99, 8, 2627);
    			attr_dev(div2, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div2, file$n, 90, 6, 2317);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$n, 88, 4, 2265);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$n, 87, 2, 2228);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$n, 80, 0, 2076);
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
    			mount_component(modalcrearusuario, main, null);
    			append_dev(main, t2);
    			mount_component(modalrolesusuario, main, null);
    			append_dev(main, t3);
    			append_dev(main, section);
    			append_dev(section, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, t5);
    			append_dev(h5, button);
    			append_dev(button, i);
    			append_dev(button, t6);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t8);
    			append_dev(tr, th1);
    			append_dev(tr, t10);
    			append_dev(tr, th2);
    			append_dev(tr, t12);
    			append_dev(tr, th3);
    			append_dev(table, t13);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modalrolesusuario_changes = {};

    			if (!updating_usuario && dirty & /*usuarioModal*/ 2) {
    				updating_usuario = true;
    				modalrolesusuario_changes.usuario = /*usuarioModal*/ ctx[1];
    				add_flush_callback(() => updating_usuario = false);
    			}

    			if (!updating_roles && dirty & /*roles*/ 4) {
    				updating_roles = true;
    				modalrolesusuario_changes.roles = /*roles*/ ctx[2];
    				add_flush_callback(() => updating_roles = false);
    			}

    			modalrolesusuario.$set(modalrolesusuario_changes);

    			if (dirty & /*usuarios, cargarUsuarioSeleccionado*/ 9) {
    				each_value = /*usuarios*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(modalcrearusuario.$$.fragment, local);
    			transition_in(modalrolesusuario.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(modalcrearusuario.$$.fragment, local);
    			transition_out(modalrolesusuario.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(modalcrearusuario);
    			destroy_component(modalrolesusuario);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let usuarios = [];
    	let usuarioModal = { roles: [] };
    	let roles = [];

    	const cargarRoles = () => {
    		const config = {
    			method: "get",
    			url: `${url}/roles`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(2, roles = res.data);
    			console.log(roles);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const cargarUsuarioSeleccionado = id => {
    		const config = {
    			method: "get",
    			url: `${url}/usuarios/${id}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(1, usuarioModal = res.data);
    			console.log(usuarioModal);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	function cargarPacientes() {
    		const config = {
    			method: "get",
    			url: `${url}/usuarios`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			let { data } = res;
    			$$invalidate(0, usuarios = data);
    		}).catch(err => {
    			console.error(err);
    		});
    	}

    	onMount(() => {
    		cargarPacientes();
    		cargarRoles();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function modalrolesusuario_usuario_binding(value) {
    		usuarioModal = value;
    		$$invalidate(1, usuarioModal);
    	}

    	function modalrolesusuario_roles_binding(value) {
    		roles = value;
    		$$invalidate(2, roles);
    	}

    	const click_handler = usuario => cargarUsuarioSeleccionado(usuario.id);

    	$$self.$capture_state = () => ({
    		link,
    		onMount,
    		url,
    		axios: axios$1,
    		Header,
    		Aside,
    		ModalCrearUsuario: ModalCrearUsuarios,
    		ModalRolesUsuario,
    		usuarios,
    		usuarioModal,
    		roles,
    		cargarRoles,
    		cargarUsuarioSeleccionado,
    		cargarPacientes
    	});

    	$$self.$inject_state = $$props => {
    		if ("usuarios" in $$props) $$invalidate(0, usuarios = $$props.usuarios);
    		if ("usuarioModal" in $$props) $$invalidate(1, usuarioModal = $$props.usuarioModal);
    		if ("roles" in $$props) $$invalidate(2, roles = $$props.roles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		usuarios,
    		usuarioModal,
    		roles,
    		cargarUsuarioSeleccionado,
    		modalrolesusuario_usuario_binding,
    		modalrolesusuario_roles_binding,
    		click_handler
    	];
    }

    class Index$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\Pages\AtencionMedica\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$9 } = globals;
    const file$o = "src\\Pages\\AtencionMedica\\Index.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (66:2) {#if errorServer}
    function create_if_block_1$6(ctx) {
    	let errorserver;
    	let current;

    	errorserver = new ErrorConexion({
    			props: {
    				msgError: "Ocurrio un error al conectar con el servidor, vuelva a intentar o contacte al administrador"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(errorserver.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errorserver, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errorserver.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errorserver.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errorserver, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(66:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (105:20) {#if historia.activo}
    function create_if_block$a(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let span;
    	let t0_value = /*historia*/ ctx[7].paciente.nombres[0] + "";
    	let t0;
    	let t1_value = /*historia*/ ctx[7].paciente.apellidos[0] + "";
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*historia*/ ctx[7].paciente.nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*historia*/ ctx[7].paciente.apellidos + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = /*historia*/ ctx[7].paciente.cedula + "";
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = calcularEdad(/*historia*/ ctx[7].paciente.fechaNacimiento) + "";
    	let t9;
    	let t10;
    	let t11;
    	let td4;
    	let t12_value = /*historia*/ ctx[7].paciente.sexo + "";
    	let t12;
    	let t13;
    	let td5;
    	let t14_value = new Date(/*historia*/ ctx[7].fechaHora).toLocaleDateString("es-DO") + "";
    	let t14;
    	let t15;
    	let td6;
    	let a0;
    	let i0;
    	let t16;
    	let a1;
    	let i1;
    	let a1_href_value;
    	let link_action;
    	let t17;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			td2 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			td3 = element("td");
    			t9 = text(t9_value);
    			t10 = text(" años");
    			t11 = space();
    			td4 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td5 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td6 = element("td");
    			a0 = element("a");
    			i0 = element("i");
    			t16 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t17 = space();
    			attr_dev(span, "class", "avatar-title rounded-circle ");
    			add_location(span, file$o, 108, 32, 3404);
    			attr_dev(div, "class", "avatar avatar-sm");
    			add_location(div, file$o, 107, 28, 3340);
    			add_location(td0, file$o, 106, 24, 3306);
    			add_location(td1, file$o, 111, 24, 3609);
    			add_location(td2, file$o, 112, 24, 3701);
    			add_location(td3, file$o, 113, 24, 3762);
    			add_location(td4, file$o, 114, 24, 3851);
    			add_location(td5, file$o, 115, 24, 3910);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$o, 123, 32, 4362);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$o, 118, 28, 4131);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$o, 131, 32, 4783);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/${/*historia*/ ctx[7].paciente.id}/historias/${/*historia*/ ctx[7].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Ver");
    			add_location(a1, file$o, 125, 28, 4455);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$o, 116, 24, 4003);
    			add_location(tr, file$o, 105, 20, 3276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			append_dev(td1, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(td2, t7);
    			append_dev(tr, t8);
    			append_dev(tr, td3);
    			append_dev(td3, t9);
    			append_dev(td3, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td4);
    			append_dev(td4, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td5);
    			append_dev(td5, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td6);
    			append_dev(td6, a0);
    			append_dev(a0, i0);
    			append_dev(td6, t16);
    			append_dev(td6, a1);
    			append_dev(a1, i1);
    			append_dev(tr, t17);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*historias*/ 1 && t0_value !== (t0_value = /*historia*/ ctx[7].paciente.nombres[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*historias*/ 1 && t1_value !== (t1_value = /*historia*/ ctx[7].paciente.apellidos[0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*historias*/ 1 && t3_value !== (t3_value = /*historia*/ ctx[7].paciente.nombres + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*historias*/ 1 && t5_value !== (t5_value = /*historia*/ ctx[7].paciente.apellidos + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*historias*/ 1 && t7_value !== (t7_value = /*historia*/ ctx[7].paciente.cedula + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*historias*/ 1 && t9_value !== (t9_value = calcularEdad(/*historia*/ ctx[7].paciente.fechaNacimiento) + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*historias*/ 1 && t12_value !== (t12_value = /*historia*/ ctx[7].paciente.sexo + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*historias*/ 1 && t14_value !== (t14_value = new Date(/*historia*/ ctx[7].fechaHora).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*historias*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/${/*historia*/ ctx[7].paciente.id}/historias/${/*historia*/ ctx[7].id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(105:20) {#if historia.activo}",
    		ctx
    	});

    	return block;
    }

    // (104:16) {#each historias as historia}
    function create_each_block$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*historia*/ ctx[7].activo && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*historia*/ ctx[7].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(104:16) {#each historias as historia}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let div9;
    	let div0;
    	let t3;
    	let div8;
    	let h5;
    	let t5;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let label;
    	let t7;
    	let input;
    	let t8;
    	let div7;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t9;
    	let th1;
    	let t11;
    	let th2;
    	let t13;
    	let th3;
    	let t15;
    	let th4;
    	let t17;
    	let th5;
    	let t19;
    	let th6;
    	let t20;
    	let tbody;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block = /*errorServer*/ ctx[1] && create_if_block_1$6(ctx);
    	let each_value = /*historias*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			section = element("section");
    			div9 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div8 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Consultas médicas";
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Buscar historias";
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			div7 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre";
    			t11 = space();
    			th2 = element("th");
    			th2.textContent = "Cedula";
    			t13 = space();
    			th3 = element("th");
    			th3.textContent = "Edad";
    			t15 = space();
    			th4 = element("th");
    			th4.textContent = "Sexo";
    			t17 = space();
    			th5 = element("th");
    			th5.textContent = "Fecha";
    			t19 = space();
    			th6 = element("th");
    			t20 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			add_location(div0, file$o, 72, 6, 1935);
    			add_location(h5, file$o, 74, 8, 2007);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$o, 81, 32, 2331);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$o, 82, 32, 2409);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$o, 80, 28, 2273);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$o, 79, 24, 2221);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$o, 78, 20, 2178);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$o, 77, 16, 2136);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$o, 76, 8, 2101);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$o, 75, 8, 2043);
    			add_location(th0, file$o, 93, 20, 2870);
    			add_location(th1, file$o, 94, 20, 2901);
    			add_location(th2, file$o, 95, 20, 2938);
    			add_location(th3, file$o, 96, 20, 2975);
    			add_location(th4, file$o, 97, 20, 3010);
    			add_location(th5, file$o, 98, 20, 3045);
    			add_location(th6, file$o, 99, 20, 3081);
    			add_location(tr, file$o, 92, 16, 2844);
    			add_location(thead, file$o, 91, 16, 2819);
    			add_location(tbody, file$o, 102, 16, 3157);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$o, 90, 12, 2753);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$o, 89, 8, 2709);
    			attr_dev(div8, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div8, file$o, 73, 6, 1962);
    			attr_dev(div9, "class", "p-2");
    			add_location(div9, file$o, 71, 4, 1910);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$o, 70, 2, 1873);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$o, 63, 0, 1651);
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
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, section);
    			append_dev(section, div9);
    			append_dev(div9, div0);
    			append_dev(div9, t3);
    			append_dev(div9, div8);
    			append_dev(div8, h5);
    			append_dev(div8, t5);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t7);
    			append_dev(div1, input);
    			set_input_value(input, /*sltBuscarHistorias*/ ctx[2]);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t9);
    			append_dev(tr, th1);
    			append_dev(tr, t11);
    			append_dev(tr, th2);
    			append_dev(tr, t13);
    			append_dev(tr, th3);
    			append_dev(tr, t15);
    			append_dev(tr, th4);
    			append_dev(tr, t17);
    			append_dev(tr, th5);
    			append_dev(tr, t19);
    			append_dev(tr, th6);
    			append_dev(table, t20);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(input, "input", /*searchHistorias*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorServer*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*errorServer*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*sltBuscarHistorias*/ 4) {
    				set_input_value(input, /*sltBuscarHistorias*/ ctx[2]);
    			}

    			if (dirty & /*historias, Date, calcularEdad*/ 1) {
    				each_value = /*historias*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let historias = [];
    	let errorServer = false;
    	let sltBuscarHistorias = "";
    	let timeout = null;

    	const searchHistorias = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarHistorias();
    			},
    			300
    		);
    	};

    	function cargarHistorias() {
    		const config = {
    			method: "get",
    			url: `${url}/historias?b=${sltBuscarHistorias}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			axios$1(config).then(res => {
    				if (res.status === 200) {
    					let { data } = res;
    					$$invalidate(0, historias = data);
    					console.log(historias);
    				}

    				if (res.status === 500) {
    					$$invalidate(1, errorServer = true);
    				}
    			}).catch(err => {
    				if (err) {
    					$$invalidate(1, errorServer = true);
    				}

    				console.error(err);
    			});
    		} catch(error) {
    			if (error) {
    				$$invalidate(1, errorServer = true);
    			}
    		}
    	}

    	onMount(() => {
    		cargarHistorias();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$9.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		sltBuscarHistorias = this.value;
    		$$invalidate(2, sltBuscarHistorias);
    	}

    	$$self.$capture_state = () => ({
    		link,
    		onMount,
    		axios: axios$1,
    		url,
    		calcularEdad,
    		Header,
    		Aside,
    		ErrorServer: ErrorConexion,
    		historias,
    		errorServer,
    		sltBuscarHistorias,
    		timeout,
    		searchHistorias,
    		cargarHistorias
    	});

    	$$self.$inject_state = $$props => {
    		if ("historias" in $$props) $$invalidate(0, historias = $$props.historias);
    		if ("errorServer" in $$props) $$invalidate(1, errorServer = $$props.errorServer);
    		if ("sltBuscarHistorias" in $$props) $$invalidate(2, sltBuscarHistorias = $$props.sltBuscarHistorias);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		historias,
    		errorServer,
    		sltBuscarHistorias,
    		searchHistorias,
    		input_input_handler
    	];
    }

    class Index$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\Pages\Recetas\Medicamentos.svelte generated by Svelte v3.29.0 */

    const { console: console_1$a } = globals;
    const file$p = "src\\Pages\\Recetas\\Medicamentos.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (79:4) {#if errorServer}
    function create_if_block_1$7(ctx) {
    	let errorconexion;
    	let current;

    	errorconexion = new ErrorConexion({
    			props: { msgError: "msgError" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(errorconexion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errorconexion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errorconexion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errorconexion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errorconexion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(79:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (160:40) {#each medicamentos as medicamento}
    function create_each_block$9(ctx) {
    	let tr;
    	let td0;
    	let p0;
    	let t0_value = /*medicamento*/ ctx[9].nombre + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3_value = /*medicamento*/ ctx[9].concentracion + "";
    	let t3;
    	let t4;
    	let td1;
    	let t5_value = /*medicamento*/ ctx[9].cantidad + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = /*medicamento*/ ctx[9].frecuencia + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text("De ");
    			t3 = text(t3_value);
    			t4 = space();
    			td1 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td2 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			attr_dev(p0, "class", "text-black m-0");
    			add_location(p0, file$p, 162, 52, 6489);
    			attr_dev(p1, "class", "text-muted");
    			add_location(p1, file$p, 163, 52, 6593);
    			attr_dev(td0, "class", "");
    			add_location(td0, file$p, 161, 48, 6422);
    			attr_dev(td1, "class", "text-center");
    			add_location(td1, file$p, 167, 48, 6866);
    			attr_dev(td2, "class", "text-center");
    			add_location(td2, file$p, 168, 48, 6967);
    			add_location(tr, file$p, 160, 44, 6368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, p0);
    			append_dev(p0, t0);
    			append_dev(td0, t1);
    			append_dev(td0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td1);
    			append_dev(td1, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(td2, t7);
    			append_dev(tr, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*medicamentos*/ 8 && t0_value !== (t0_value = /*medicamento*/ ctx[9].nombre + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*medicamentos*/ 8 && t3_value !== (t3_value = /*medicamento*/ ctx[9].concentracion + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*medicamentos*/ 8 && t5_value !== (t5_value = /*medicamento*/ ctx[9].cantidad + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*medicamentos*/ 8 && t7_value !== (t7_value = /*medicamento*/ ctx[9].frecuencia + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(160:40) {#each medicamentos as medicamento}",
    		ctx
    	});

    	return block;
    }

    // (173:40) {#if historia.instrucciones}
    function create_if_block$b(ctx) {
    	let tfoot;
    	let tr;
    	let td;
    	let strong;
    	let t1;
    	let t2_value = /*historia*/ ctx[1].instrucciones + "";
    	let t2;

    	const block = {
    		c: function create() {
    			tfoot = element("tfoot");
    			tr = element("tr");
    			td = element("td");
    			strong = element("strong");
    			strong.textContent = "Observaciones:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$p, 175, 69, 7437);
    			attr_dev(td, "colspan", "3");
    			add_location(td, file$p, 175, 53, 7421);
    			add_location(tr, file$p, 174, 49, 7362);
    			attr_dev(tfoot, "class", "bg-light svelte-1qeyu3b");
    			add_location(tfoot, file$p, 173, 45, 7287);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tfoot, anchor);
    			append_dev(tfoot, tr);
    			append_dev(tr, td);
    			append_dev(td, strong);
    			append_dev(td, t1);
    			append_dev(td, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*historia*/ 2 && t2_value !== (t2_value = /*historia*/ ctx[1].instrucciones + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tfoot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(173:40) {#if historia.instrucciones}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let div8;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let t3;
    	let div3;
    	let div2;
    	let t5;
    	let h4;
    	let t6_value = /*paciente*/ ctx[0].nombres + "";
    	let t6;
    	let t7;
    	let t8_value = /*paciente*/ ctx[0].apellidos + "";
    	let t8;
    	let t9;
    	let p0;
    	let t10;
    	let t11_value = /*historia*/ ctx[1].id + "";
    	let t11;
    	let t12;
    	let br0;
    	let t13;
    	let t14_value = new Date(/*historia*/ ctx[1].createdAt).toLocaleDateString("es-DO") + "";
    	let t14;
    	let t15;
    	let button;
    	let i;
    	let t16;
    	let t17;
    	let div25;
    	let div24;
    	let div23;
    	let div22;
    	let div21;
    	let div20;
    	let div10;
    	let div9;
    	let img;
    	let img_src_value;
    	let t18;
    	let address;
    	let span;
    	let t19_value = /*empresa*/ ctx[2].nombre + "";
    	let t19;
    	let t20;
    	let t21;
    	let br1;
    	let t22;
    	let t23_value = /*empresa*/ ctx[2].direccion + "";
    	let t23;
    	let t24;
    	let br2;
    	let t25;
    	let t26_value = /*empresa*/ ctx[2].telefono + "";
    	let t26;
    	let t27;
    	let br3;
    	let t28;
    	let t29_value = /*empresa*/ ctx[2].correo + "";
    	let t29;
    	let t30;
    	let br4;
    	let t31;
    	let div11;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t33;
    	let th1;
    	let t35;
    	let th2;
    	let t37;
    	let tbody;
    	let t38;
    	let t39;
    	let div16;
    	let div12;
    	let t40;
    	let div15;
    	let h5;
    	let t41_value = /*paciente*/ ctx[0].nombres + "";
    	let t41;
    	let t42;
    	let t43_value = /*paciente*/ ctx[0].apellidos + "";
    	let t43;
    	let t44;
    	let div13;
    	let t45;
    	let t46_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "";
    	let t46;
    	let t47;
    	let t48;
    	let div14;
    	let t51;
    	let div17;
    	let hr0;
    	let t52;
    	let p1;
    	let t54;
    	let div19;
    	let hr1;
    	let t55;
    	let div18;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[4] && create_if_block_1$7(ctx);
    	let each_value = /*medicamentos*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	let if_block1 = /*historia*/ ctx[1].instrucciones && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			create_component(aside.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			section = element("section");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "Para:";
    			t5 = space();
    			h4 = element("h4");
    			t6 = text(t6_value);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			p0 = element("p");
    			t10 = text("ID Consulta #");
    			t11 = text(t11_value);
    			t12 = space();
    			br0 = element("br");
    			t13 = text("\r\n                                    Fecha Consulta : ");
    			t14 = text(t14_value);
    			t15 = space();
    			button = element("button");
    			i = element("i");
    			t16 = text("\r\n                                    Imprimir");
    			t17 = space();
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			img = element("img");
    			t18 = space();
    			address = element("address");
    			span = element("span");
    			t19 = text(t19_value);
    			t20 = text(",");
    			t21 = space();
    			br1 = element("br");
    			t22 = space();
    			t23 = text(t23_value);
    			t24 = space();
    			br2 = element("br");
    			t25 = text("\r\n                                            Tel.: ");
    			t26 = text(t26_value);
    			t27 = space();
    			br3 = element("br");
    			t28 = space();
    			t29 = text(t29_value);
    			t30 = space();
    			br4 = element("br");
    			t31 = space();
    			div11 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Medicamento";
    			t33 = space();
    			th1 = element("th");
    			th1.textContent = "Cantidad";
    			t35 = space();
    			th2 = element("th");
    			th2.textContent = "Frecuencia";
    			t37 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t38 = space();
    			if (if_block1) if_block1.c();
    			t39 = space();
    			div16 = element("div");
    			div12 = element("div");
    			t40 = space();
    			div15 = element("div");
    			h5 = element("h5");
    			t41 = text(t41_value);
    			t42 = space();
    			t43 = text(t43_value);
    			t44 = space();
    			div13 = element("div");
    			t45 = text("Edad: ");
    			t46 = text(t46_value);
    			t47 = text(" años");
    			t48 = space();
    			div14 = element("div");
    			div14.textContent = `Fecha: ${new Date().toLocaleDateString("es-DO")}`;
    			t51 = space();
    			div17 = element("div");
    			hr0 = element("hr");
    			t52 = space();
    			p1 = element("p");
    			p1.textContent = "Firma del especialista";
    			t54 = space();
    			div19 = element("div");
    			hr1 = element("hr");
    			t55 = space();
    			div18 = element("div");
    			div18.textContent = `© nextcom ${new Date().getFullYear()}`;
    			attr_dev(div0, "class", "avatar-title bg-success rounded-circle mdi mdi-receipt  ");
    			add_location(div0, file$p, 89, 32, 2581);
    			attr_dev(div1, "class", "avatar avatar mr-3");
    			add_location(div1, file$p, 88, 28, 2515);
    			attr_dev(div2, "class", "opacity-75");
    			add_location(div2, file$p, 94, 32, 2817);
    			attr_dev(h4, "class", "m-b-0");
    			add_location(h4, file$p, 95, 32, 2886);
    			add_location(br0, file$p, 97, 63, 3070);
    			attr_dev(p0, "class", "opacity-75");
    			add_location(p0, file$p, 96, 32, 2983);
    			attr_dev(i, "class", "mdi\r\n                                mdi-printer");
    			add_location(i, file$p, 100, 89, 3316);
    			attr_dev(button, "class", "btn btn-white-translucent");
    			attr_dev(button, "id", "printDiv");
    			add_location(button, file$p, 100, 32, 3259);
    			attr_dev(div3, "class", "media-body");
    			add_location(div3, file$p, 93, 28, 2759);
    			attr_dev(div4, "class", "media");
    			add_location(div4, file$p, 87, 24, 2466);
    			attr_dev(div5, "class", "col-md-6 text-white p-b-30");
    			add_location(div5, file$p, 86, 20, 2400);
    			attr_dev(div6, "class", "row p-b-60 p-t-60");
    			add_location(div6, file$p, 84, 16, 2345);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$p, 83, 12, 2304);
    			attr_dev(div8, "class", "bg-dark m-b-30");
    			add_location(div8, file$p, 82, 8, 2262);
    			if (img.src !== (img_src_value = "assets/img/logos/nytimes.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "60");
    			attr_dev(img, "class", "rounded-circle");
    			attr_dev(img, "alt", "");
    			add_location(img, file$p, 137, 40, 5023);
    			attr_dev(span, "class", "h4 font-primary");
    			add_location(span, file$p, 139, 44, 5216);
    			add_location(br1, file$p, 139, 100, 5272);
    			add_location(br2, file$p, 140, 64, 5342);
    			add_location(br3, file$p, 141, 69, 5417);
    			add_location(br4, file$p, 142, 61, 5484);
    			attr_dev(address, "class", "m-t-10");
    			add_location(address, file$p, 138, 40, 5146);
    			attr_dev(div9, "class", "col-md-6");
    			add_location(div9, file$p, 136, 36, 4959);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$p, 135, 32, 4904);
    			attr_dev(th0, "class", "");
    			add_location(th0, file$p, 153, 44, 5902);
    			attr_dev(th1, "class", "text-center");
    			add_location(th1, file$p, 154, 44, 5977);
    			attr_dev(th2, "class", "text-center");
    			add_location(th2, file$p, 155, 44, 6060);
    			add_location(tr, file$p, 152, 40, 5852);
    			add_location(thead, file$p, 151, 40, 5803);
    			add_location(tbody, file$p, 158, 40, 6238);
    			attr_dev(table, "class", "table m-t-50");
    			add_location(table, file$p, 150, 36, 5733);
    			attr_dev(div11, "class", "table-responsive ");
    			add_location(div11, file$p, 149, 32, 5664);
    			attr_dev(div12, "class", "col-md-6");
    			add_location(div12, file$p, 182, 36, 7831);
    			attr_dev(h5, "class", "font-primary");
    			add_location(h5, file$p, 186, 40, 8020);
    			attr_dev(div13, "class", "");
    			add_location(div13, file$p, 187, 40, 8131);
    			attr_dev(div14, "class", "");
    			add_location(div14, file$p, 188, 40, 8244);
    			attr_dev(div15, "class", "col-md-6 text-right my-auto");
    			add_location(div15, file$p, 185, 36, 7937);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$p, 181, 32, 7776);
    			add_location(hr0, file$p, 192, 36, 8486);
    			add_location(p1, file$p, 193, 36, 8528);
    			attr_dev(div17, "class", "firma svelte-1qeyu3b");
    			add_location(div17, file$p, 191, 32, 8429);
    			add_location(hr1, file$p, 197, 36, 8698);
    			attr_dev(div18, "class", "text-center opacity-75");
    			add_location(div18, file$p, 198, 36, 8740);
    			attr_dev(div19, "class", "p-t-10 p-b-20");
    			add_location(div19, file$p, 195, 32, 8631);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$p, 134, 28, 4847);
    			attr_dev(div21, "class", "card");
    			add_location(div21, file$p, 133, 24, 4799);
    			attr_dev(div22, "class", "col-md-12 m-b-40");
    			add_location(div22, file$p, 132, 20, 4743);
    			attr_dev(div23, "class", "row");
    			add_location(div23, file$p, 131, 16, 4704);
    			attr_dev(div24, "class", "container");
    			attr_dev(div24, "id", "printableArea");
    			add_location(div24, file$p, 130, 12, 4644);
    			attr_dev(div25, "class", "pull-up");
    			add_location(div25, file$p, 129, 8, 4609);
    			attr_dev(section, "class", "admin-content ");
    			add_location(section, file$p, 81, 4, 2220);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$p, 76, 2, 2093);
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
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, section);
    			append_dev(section, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t5);
    			append_dev(div3, h4);
    			append_dev(h4, t6);
    			append_dev(h4, t7);
    			append_dev(h4, t8);
    			append_dev(div3, t9);
    			append_dev(div3, p0);
    			append_dev(p0, t10);
    			append_dev(p0, t11);
    			append_dev(p0, t12);
    			append_dev(p0, br0);
    			append_dev(p0, t13);
    			append_dev(p0, t14);
    			append_dev(div3, t15);
    			append_dev(div3, button);
    			append_dev(button, i);
    			append_dev(button, t16);
    			append_dev(section, t17);
    			append_dev(section, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div10);
    			append_dev(div10, div9);
    			append_dev(div9, img);
    			append_dev(div9, t18);
    			append_dev(div9, address);
    			append_dev(address, span);
    			append_dev(span, t19);
    			append_dev(span, t20);
    			append_dev(address, t21);
    			append_dev(address, br1);
    			append_dev(address, t22);
    			append_dev(address, t23);
    			append_dev(address, t24);
    			append_dev(address, br2);
    			append_dev(address, t25);
    			append_dev(address, t26);
    			append_dev(address, t27);
    			append_dev(address, br3);
    			append_dev(address, t28);
    			append_dev(address, t29);
    			append_dev(address, t30);
    			append_dev(address, br4);
    			append_dev(div20, t31);
    			append_dev(div20, div11);
    			append_dev(div11, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t33);
    			append_dev(tr, th1);
    			append_dev(tr, t35);
    			append_dev(tr, th2);
    			append_dev(table, t37);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(table, t38);
    			if (if_block1) if_block1.m(table, null);
    			append_dev(div20, t39);
    			append_dev(div20, div16);
    			append_dev(div16, div12);
    			append_dev(div16, t40);
    			append_dev(div16, div15);
    			append_dev(div15, h5);
    			append_dev(h5, t41);
    			append_dev(h5, t42);
    			append_dev(h5, t43);
    			append_dev(div15, t44);
    			append_dev(div15, div13);
    			append_dev(div13, t45);
    			append_dev(div13, t46);
    			append_dev(div13, t47);
    			append_dev(div15, t48);
    			append_dev(div15, div14);
    			append_dev(div20, t51);
    			append_dev(div20, div17);
    			append_dev(div17, hr0);
    			append_dev(div17, t52);
    			append_dev(div17, p1);
    			append_dev(div20, t54);
    			append_dev(div20, div19);
    			append_dev(div19, hr1);
    			append_dev(div19, t55);
    			append_dev(div19, div18);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*paciente*/ 1) && t6_value !== (t6_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*paciente*/ 1) && t8_value !== (t8_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*historia*/ 2) && t11_value !== (t11_value = /*historia*/ ctx[1].id + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*historia*/ 2) && t14_value !== (t14_value = new Date(/*historia*/ ctx[1].createdAt).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty & /*empresa*/ 4) && t19_value !== (t19_value = /*empresa*/ ctx[2].nombre + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty & /*empresa*/ 4) && t23_value !== (t23_value = /*empresa*/ ctx[2].direccion + "")) set_data_dev(t23, t23_value);
    			if ((!current || dirty & /*empresa*/ 4) && t26_value !== (t26_value = /*empresa*/ ctx[2].telefono + "")) set_data_dev(t26, t26_value);
    			if ((!current || dirty & /*empresa*/ 4) && t29_value !== (t29_value = /*empresa*/ ctx[2].correo + "")) set_data_dev(t29, t29_value);

    			if (dirty & /*medicamentos*/ 8) {
    				each_value = /*medicamentos*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*historia*/ ctx[1].instrucciones) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$b(ctx);
    					if_block1.c();
    					if_block1.m(table, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty & /*paciente*/ 1) && t41_value !== (t41_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t41, t41_value);
    			if ((!current || dirty & /*paciente*/ 1) && t43_value !== (t43_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t43, t43_value);
    			if ((!current || dirty & /*paciente*/ 1) && t46_value !== (t46_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "")) set_data_dev(t46, t46_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aside.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Medicamentos", slots, []);
    	let { params } = $$props;
    	let errorServer = false;
    	let paciente = {};
    	let historia = {};
    	let empresa = {};
    	let medicamentos = [];

    	const cargarPaciente = () => {
    		const config = {
    			method: "get",
    			url: `${url}/pacientes/${params.idPaciente}`,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(0, paciente = res.data);
    			console.log(paciente);
    		});
    	};

    	const cargarHistoria = () => {
    		const config = {
    			method: "get",
    			url: `${url}/historias/${params.idHistoria}`,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(1, historia = res.data);
    			$$invalidate(3, medicamentos = res.data.medicamentos);
    			console.log(historia);
    		});
    	};

    	const cargarEmpresa = () => {
    		const config = {
    			method: "get",
    			url: `${url}/empresas/${user().empresa}`,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(2, empresa = res.data);
    			console.log(empresa);
    		});
    	};

    	onMount(() => {
    		jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    		cargarPaciente();
    		cargarHistoria();
    		cargarEmpresa();

    		window.onafterprint = event => {
    			location.reload();
    		};
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<Medicamentos> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		onMount,
    		calcularEdad,
    		url,
    		user,
    		Header,
    		Aside,
    		ErrorConexion,
    		params,
    		errorServer,
    		paciente,
    		historia,
    		empresa,
    		medicamentos,
    		cargarPaciente,
    		cargarHistoria,
    		cargarEmpresa
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("errorServer" in $$props) $$invalidate(4, errorServer = $$props.errorServer);
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("empresa" in $$props) $$invalidate(2, empresa = $$props.empresa);
    		if ("medicamentos" in $$props) $$invalidate(3, medicamentos = $$props.medicamentos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paciente, historia, empresa, medicamentos, errorServer, params];
    }

    class Medicamentos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Medicamentos",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[5] === undefined && !("params" in props)) {
    			console_1$a.warn("<Medicamentos> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Medicamentos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Medicamentos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const routes = {
        "/": wrap({
            component: Index,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/login": Login,
        "/pacientes": wrap({
            component: Index$1,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/pacientes/perfil/:id": wrap({
            component: PacientePerfil,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/pacientes/crear": wrap({
            component: PacienteCrear,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/pacientes/:idPaciente/historias/:idHistoria": wrap({
            component: HistoriaClinica,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/historias": wrap({
            component: Index$3,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/usuarios": wrap({
            component: Index$2,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
        "/impresion/pacientes/:idPaciente/historias/:idHistoria": wrap({
            component: Medicamentos,
            conditions: [
                async (detail) => {
                    if(isLogin()){
                        return true
                    }else {
                        return push('/login')
                    }
                }
            ]
        }),
    };

    /* src\App.svelte generated by Svelte v3.29.0 */

    function create_fragment$s(ctx) {
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$s.name
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
