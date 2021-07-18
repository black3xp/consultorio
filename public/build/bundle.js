
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
    	let ul1;
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
    	let li4;
    	let a5;
    	let span11;
    	let span9;
    	let t12;
    	let span8;
    	let t13;
    	let span10;
    	let t15;
    	let span12;
    	let i2;
    	let t16;
    	let ul0;
    	let li2;
    	let a6;
    	let span14;
    	let span13;
    	let t18;
    	let span15;
    	let i3;
    	let link_action_3;
    	let t20;
    	let li3;
    	let a7;
    	let span17;
    	let span16;
    	let t22;
    	let span18;
    	let i4;
    	let mounted;
    	let dispose;

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
    			ul1 = element("ul");
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
    			li4 = element("li");
    			a5 = element("a");
    			span11 = element("span");
    			span9 = element("span");
    			t12 = text("Mantenimiento\r\n                ");
    			span8 = element("span");
    			t13 = space();
    			span10 = element("span");
    			span10.textContent = "Ajustes consultorio";
    			t15 = space();
    			span12 = element("span");
    			i2 = element("i");
    			t16 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a6 = element("a");
    			span14 = element("span");
    			span13 = element("span");
    			span13.textContent = "Usuarios";
    			t18 = space();
    			span15 = element("span");
    			i3 = element("i");
    			i3.textContent = "U";
    			t20 = space();
    			li3 = element("li");
    			a7 = element("a");
    			span17 = element("span");
    			span16 = element("span");
    			span16.textContent = "Empresa";
    			t22 = space();
    			span18 = element("span");
    			i4 = element("i");
    			i4.textContent = "E";
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$1, 9, 8, 286);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file$1, 8, 6, 242);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned");
    			add_location(a1, file$1, 14, 8, 442);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file$1, 18, 8, 615);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file$1, 12, 6, 382);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file$1, 6, 4, 163);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$1, 30, 14, 1045);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file$1, 29, 12, 1004);
    			attr_dev(span3, "class", "icon-badge badge-success badge badge-pill");
    			add_location(span3, file$1, 33, 14, 1161);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i0, file$1, 35, 14, 1245);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$1, 32, 12, 1121);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file$1, 28, 10, 951);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$1, 27, 8, 871);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$1, 45, 14, 1619);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$1, 44, 12, 1578);
    			attr_dev(i1, "class", "icon-placeholder mdi mdi-account-circle-outline");
    			add_location(i1, file$1, 49, 14, 1823);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$1, 47, 12, 1694);
    			attr_dev(a4, "href", "/pacientes");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file$1, 43, 10, 1516);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$1, 42, 8, 1427);
    			attr_dev(span8, "class", "menu-arrow");
    			add_location(span8, file$1, 60, 16, 2220);
    			attr_dev(span9, "class", "menu-name");
    			add_location(span9, file$1, 58, 14, 2147);
    			attr_dev(span10, "class", "menu-info");
    			add_location(span10, file$1, 62, 14, 2286);
    			attr_dev(span11, "class", "menu-label");
    			add_location(span11, file$1, 57, 12, 2106);
    			attr_dev(i2, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i2, file$1, 65, 14, 2411);
    			attr_dev(span12, "class", "menu-icon");
    			add_location(span12, file$1, 64, 12, 2371);
    			attr_dev(a5, "href", "#!");
    			attr_dev(a5, "class", "open-dropdown menu-link");
    			add_location(a5, file$1, 56, 10, 2047);
    			attr_dev(span13, "class", "menu-name");
    			add_location(span13, file$1, 73, 18, 2727);
    			attr_dev(span14, "class", "menu-label");
    			add_location(span14, file$1, 72, 16, 2682);
    			attr_dev(i3, "class", "icon-placeholder ");
    			add_location(i3, file$1, 76, 18, 2853);
    			attr_dev(span15, "class", "menu-icon");
    			add_location(span15, file$1, 75, 16, 2809);
    			attr_dev(a6, "href", "/Usuario/Index");
    			attr_dev(a6, "class", " menu-link");
    			add_location(a6, file$1, 71, 14, 2611);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$1, 70, 12, 2573);
    			attr_dev(span16, "class", "menu-name");
    			add_location(span16, file$1, 84, 18, 3102);
    			attr_dev(span17, "class", "menu-label");
    			add_location(span17, file$1, 83, 16, 3057);
    			attr_dev(i4, "class", "icon-placeholder ");
    			add_location(i4, file$1, 87, 18, 3227);
    			attr_dev(span18, "class", "menu-icon");
    			add_location(span18, file$1, 86, 16, 3183);
    			attr_dev(a7, "href", "#!");
    			attr_dev(a7, "class", " menu-link");
    			add_location(a7, file$1, 82, 14, 3007);
    			attr_dev(li3, "class", "menu-item");
    			add_location(li3, file$1, 81, 12, 2969);
    			attr_dev(ul0, "class", "sub-menu");
    			add_location(ul0, file$1, 69, 10, 2538);
    			attr_dev(li4, "class", "menu-item ");
    			add_location(li4, file$1, 55, 8, 2012);
    			attr_dev(ul1, "class", "menu");
    			add_location(ul1, file$1, 25, 6, 811);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file$1, 23, 4, 723);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file$1, 5, 2, 128);
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
    			append_dev(div2, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a3);
    			append_dev(a3, span2);
    			append_dev(span2, span1);
    			append_dev(a3, t5);
    			append_dev(a3, span4);
    			append_dev(span4, span3);
    			append_dev(span4, t7);
    			append_dev(span4, i0);
    			append_dev(ul1, t8);
    			append_dev(ul1, li1);
    			append_dev(li1, a4);
    			append_dev(a4, span6);
    			append_dev(span6, span5);
    			append_dev(a4, t10);
    			append_dev(a4, span7);
    			append_dev(span7, i1);
    			append_dev(ul1, t11);
    			append_dev(ul1, li4);
    			append_dev(li4, a5);
    			append_dev(a5, span11);
    			append_dev(span11, span9);
    			append_dev(span9, t12);
    			append_dev(span9, span8);
    			append_dev(span11, t13);
    			append_dev(span11, span10);
    			append_dev(a5, t15);
    			append_dev(a5, span12);
    			append_dev(span12, i2);
    			append_dev(li4, t16);
    			append_dev(li4, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a6);
    			append_dev(a6, span14);
    			append_dev(span14, span13);
    			append_dev(a6, t18);
    			append_dev(a6, span15);
    			append_dev(span15, i3);
    			append_dev(ul0, t20);
    			append_dev(ul0, li3);
    			append_dev(li3, a7);
    			append_dev(a7, span17);
    			append_dev(span17, span16);
    			append_dev(a7, t22);
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
    	let div12;
    	let div0;
    	let t2;
    	let div1;
    	let h3;
    	let t4;
    	let div11;
    	let div10;
    	let div9;
    	let div7;
    	let div3;
    	let div2;
    	let t6;
    	let div6;
    	let div5;
    	let div4;
    	let i;
    	let t7;
    	let h1;
    	let t9;
    	let div8;
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
    			div12 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Resumen";
    			t4 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "Pacientes";
    			t6 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			i = element("i");
    			t7 = space();
    			h1 = element("h1");
    			h1.textContent = "16k";
    			t9 = space();
    			div8 = element("div");
    			div8.textContent = "Todos los registrados";
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$2, 11, 6, 243);
    			add_location(h3, file$2, 13, 8, 312);
    			attr_dev(div1, "class", "col-12 m-b-30 mt-4");
    			add_location(div1, file$2, 12, 6, 270);
    			attr_dev(div2, "class", "h6 text-muted ");
    			add_location(div2, file$2, 20, 16, 532);
    			attr_dev(div3, "class", "col my-auto");
    			add_location(div3, file$2, 19, 14, 489);
    			attr_dev(i, "class", "mdi mdi-account");
    			add_location(i, file$2, 26, 20, 784);
    			attr_dev(div4, "class", "avatar-title rounded-circle badge-soft-danger");
    			add_location(div4, file$2, 25, 18, 703);
    			attr_dev(div5, "class", "avatar");
    			add_location(div5, file$2, 24, 16, 663);
    			attr_dev(div6, "class", "col-auto my-auto");
    			add_location(div6, file$2, 23, 14, 615);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$2, 18, 12, 456);
    			attr_dev(h1, "class", "display-4 fw-600");
    			add_location(h1, file$2, 31, 12, 921);
    			attr_dev(div8, "class", "h6");
    			add_location(div8, file$2, 32, 12, 972);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$2, 17, 10, 419);
    			attr_dev(div10, "class", "card m-b-30");
    			add_location(div10, file$2, 16, 8, 382);
    			attr_dev(div11, "class", "col-lg-4");
    			add_location(div11, file$2, 15, 6, 350);
    			attr_dev(div12, "class", "p-2");
    			add_location(div12, file$2, 10, 4, 218);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$2, 9, 2, 181);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$2, 7, 0, 138);
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
    			append_dev(section, div12);
    			append_dev(div12, div0);
    			append_dev(div12, t2);
    			append_dev(div12, div1);
    			append_dev(div1, h3);
    			append_dev(div12, t4);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, div3);
    			append_dev(div3, div2);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, i);
    			append_dev(div9, t7);
    			append_dev(div9, h1);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
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

    // const url = 'https://xmconsulta.cthrics.com/api'
    // const url = 'http://localhost:3000/api'
    const url = 'http://localhost:1337/api';

    /* src\Pages\Pacientes\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\Pages\\Pacientes\\Index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (55:16) {#each pacientes as paciente}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let td1;
    	let t1_value = /*paciente*/ ctx[2].nombres + "";
    	let t1;
    	let t2;
    	let td2;
    	let t3_value = /*paciente*/ ctx[2].fechaNacimiento + "";
    	let t3;
    	let t4;
    	let td3;
    	let t5_value = /*paciente*/ ctx[2].sexo + "";
    	let t5;
    	let t6;
    	let td4;
    	let t7_value = /*paciente*/ ctx[2].celular + "";
    	let t7;
    	let t8;
    	let td5;
    	let t9_value = /*paciente*/ ctx[2].cedula + "";
    	let t9;
    	let t10;
    	let td6;
    	let a0;
    	let i0;
    	let link_action;
    	let t11;
    	let a1;
    	let i1;
    	let a1_href_value;
    	let link_action_1;
    	let t12;
    	let mounted;
    	let dispose;

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
    			td2 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			td3 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td4 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			td5 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			td6 = element("td");
    			a0 = element("a");
    			i0 = element("i");
    			t11 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t12 = space();
    			if (img.src !== (img_src_value = "assets/img/users/user-1.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "avatar-img avatar-sm rounded-circle");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 57, 64, 1695);
    			attr_dev(div, "class", "avatar avatar-sm ");
    			add_location(div, file$3, 57, 33, 1664);
    			add_location(td0, file$3, 56, 29, 1625);
    			add_location(td1, file$3, 59, 29, 1858);
    			add_location(td2, file$3, 60, 29, 1916);
    			add_location(td3, file$3, 61, 29, 1982);
    			add_location(td4, file$3, 62, 29, 2037);
    			add_location(td5, file$3, 63, 29, 2095);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$3, 71, 37, 2522);
    			attr_dev(a0, "href", "/pacientes/perfil/1");
    			attr_dev(a0, "class", "btn btn-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$3, 65, 33, 2210);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$3, 79, 37, 2951);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[2].id}`);
    			attr_dev(a1, "class", "btn btn-primary");
    			attr_dev(a1, "data-tooltip", "Perfil");
    			add_location(a1, file$3, 73, 33, 2625);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$3, 64, 29, 2152);
    			add_location(tr, file$3, 55, 25, 1590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, div);
    			append_dev(div, img);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td3);
    			append_dev(td3, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td4);
    			append_dev(td4, t7);
    			append_dev(tr, t8);
    			append_dev(tr, td5);
    			append_dev(td5, t9);
    			append_dev(tr, t10);
    			append_dev(tr, td6);
    			append_dev(td6, a0);
    			append_dev(a0, i0);
    			append_dev(td6, t11);
    			append_dev(td6, a1);
    			append_dev(a1, i1);
    			append_dev(tr, t12);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pacientes*/ 1 && t1_value !== (t1_value = /*paciente*/ ctx[2].nombres + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*pacientes*/ 1 && t3_value !== (t3_value = /*paciente*/ ctx[2].fechaNacimiento + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*pacientes*/ 1 && t5_value !== (t5_value = /*paciente*/ ctx[2].sexo + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*pacientes*/ 1 && t7_value !== (t7_value = /*paciente*/ ctx[2].celular + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*pacientes*/ 1 && t9_value !== (t9_value = /*paciente*/ ctx[2].cedula + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*pacientes*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[2].id}`)) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:16) {#each pacientes as paciente}",
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
    	let section;
    	let div3;
    	let div0;
    	let t2;
    	let div2;
    	let h5;
    	let t3;
    	let a;
    	let i;
    	let t4;
    	let link_action;
    	let t5;
    	let div1;
    	let table;
    	let thead;
    	let tr;
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
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
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
    			section = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			t3 = text("Pacientes ");
    			a = element("a");
    			i = element("i");
    			t4 = text(" CREAR");
    			t5 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			add_location(div0, file$3, 37, 6, 853);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$3, 39, 89, 1006);
    			attr_dev(a, "href", "/pacientes/crear");
    			attr_dev(a, "class", "btn btn-primary btn-sm");
    			add_location(a, file$3, 39, 22, 939);
    			add_location(h5, file$3, 39, 8, 925);
    			add_location(th0, file$3, 44, 20, 1220);
    			add_location(th1, file$3, 45, 20, 1251);
    			add_location(th2, file$3, 46, 20, 1288);
    			add_location(th3, file$3, 47, 20, 1323);
    			add_location(th4, file$3, 48, 20, 1358);
    			add_location(th5, file$3, 49, 20, 1396);
    			add_location(th6, file$3, 50, 20, 1433);
    			add_location(tr, file$3, 43, 16, 1194);
    			add_location(thead, file$3, 42, 16, 1169);
    			add_location(tbody, file$3, 53, 16, 1509);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$3, 41, 12, 1103);
    			attr_dev(div1, "class", "table-responsive");
    			add_location(div1, file$3, 40, 8, 1059);
    			attr_dev(div2, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div2, file$3, 38, 6, 880);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$3, 36, 4, 828);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$3, 35, 2, 791);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$3, 33, 0, 748);
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
    			append_dev(section, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, t3);
    			append_dev(h5, a);
    			append_dev(a, i);
    			append_dev(a, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(tr, t12);
    			append_dev(tr, th4);
    			append_dev(tr, t14);
    			append_dev(tr, th5);
    			append_dev(tr, t16);
    			append_dev(tr, th6);
    			append_dev(table, t17);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pacientes*/ 1) {
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
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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
    			$$invalidate(0, pacientes = data);
    			console.log(pacientes);
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
    		if ("pacientes" in $$props) $$invalidate(0, pacientes = $$props.pacientes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pacientes];
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
    	let t3;
    	let t4;
    	let a;
    	let i;
    	let t5;
    	let a_href_value;
    	let link_action;
    	let t6;
    	let small0;
    	let t8;
    	let p0;
    	let t9;
    	let t10;
    	let small1;
    	let t12;
    	let p1;
    	let t13;
    	let mounted;
    	let dispose;

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
    			t3 = text(/*fechaHora*/ ctx[4]);
    			t4 = space();
    			a = element("a");
    			i = element("i");
    			t5 = text(" editar");
    			t6 = space();
    			small0 = element("small");
    			small0.textContent = "Motivo de Consulta";
    			t8 = space();
    			p0 = element("p");
    			t9 = text(/*motivo*/ ctx[0]);
    			t10 = space();
    			small1 = element("small");
    			small1.textContent = "Historia de la Enfermedad";
    			t12 = space();
    			p1 = element("p");
    			t13 = text(/*historia*/ ctx[1]);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "assets/img/placeholder.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "imagen paciente");
    			add_location(img, file$4, 13, 12, 388);
    			attr_dev(div0, "class", "avatar mr-3  avatar-sm");
    			add_location(div0, file$4, 12, 8, 338);
    			attr_dev(span0, "data-bind", "text: atencionMedica.nombreMedico");
    			add_location(span0, file$4, 16, 35, 569);
    			attr_dev(i, "class", "fab fa-share-square");
    			add_location(i, file$4, 18, 164, 874);
    			attr_dev(a, "href", a_href_value = `/pacientes/${/*idPaciente*/ ctx[3]}/historias/${/*id*/ ctx[2]}`);
    			attr_dev(a, "class", "btn btn-primary btn-sm text-white");
    			set_style(a, "position", "absolute");
    			set_style(a, "right", "20px");
    			add_location(a, file$4, 18, 20, 730);
    			attr_dev(span1, "class", "text-muted ml-3 small");
    			add_location(span1, file$4, 17, 16, 660);
    			attr_dev(h6, "class", "mt-0 mb-1");
    			add_location(h6, file$4, 16, 12, 546);
    			attr_dev(small0, "class", "mt-4 mb-4 text-primary");
    			add_location(small0, file$4, 21, 12, 978);
    			attr_dev(p0, "data-bind", "text: atencionMedica.motivoConsulta");
    			add_location(p0, file$4, 22, 12, 1056);
    			attr_dev(small1, "class", "mt-4 mb-4 text-primary");
    			add_location(small1, file$4, 23, 12, 1133);
    			attr_dev(p1, "data-bind", "text: atencionMedica.historiaEnfermedad");
    			add_location(p1, file$4, 24, 12, 1218);
    			attr_dev(div1, "class", "media-body");
    			add_location(div1, file$4, 15, 8, 508);
    			attr_dev(div2, "class", "media");
    			add_location(div2, file$4, 11, 4, 309);
    			attr_dev(div3, "class", "list-unstyled");
    			add_location(div3, file$4, 10, 0, 276);
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
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, a);
    			append_dev(a, i);
    			append_dev(a, t5);
    			append_dev(div1, t6);
    			append_dev(div1, small0);
    			append_dev(div1, t8);
    			append_dev(div1, p0);
    			append_dev(p0, t9);
    			append_dev(div1, t10);
    			append_dev(div1, small1);
    			append_dev(div1, t12);
    			append_dev(div1, p1);
    			append_dev(p1, t13);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fechaHora*/ 16) set_data_dev(t3, /*fechaHora*/ ctx[4]);

    			if (dirty & /*idPaciente, id*/ 12 && a_href_value !== (a_href_value = `/pacientes/${/*idPaciente*/ ctx[3]}/historias/${/*id*/ ctx[2]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*motivo*/ 1) set_data_dev(t9, /*motivo*/ ctx[0]);
    			if (dirty & /*historia*/ 2) set_data_dev(t13, /*historia*/ ctx[1]);
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
    	let { fecha = "" } = $$props;
    	let { id = "" } = $$props;
    	let { idPaciente = "" } = $$props;
    	const writable_props = ["motivo", "historia", "fecha", "id", "idPaciente"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Evoluciones> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("fecha" in $$props) $$invalidate(5, fecha = $$props.fecha);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("idPaciente" in $$props) $$invalidate(3, idPaciente = $$props.idPaciente);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		motivo,
    		historia,
    		fecha,
    		id,
    		idPaciente,
    		fechaHora
    	});

    	$$self.$inject_state = $$props => {
    		if ("motivo" in $$props) $$invalidate(0, motivo = $$props.motivo);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("fecha" in $$props) $$invalidate(5, fecha = $$props.fecha);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("idPaciente" in $$props) $$invalidate(3, idPaciente = $$props.idPaciente);
    		if ("fechaHora" in $$props) $$invalidate(4, fechaHora = $$props.fechaHora);
    	};

    	let fechaHora;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fecha*/ 32) {
    			 $$invalidate(4, fechaHora = new Date(fecha).toLocaleString("es-DO"));
    		}
    	};

    	return [motivo, historia, id, idPaciente, fechaHora, fecha];
    }

    class Evoluciones extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			motivo: 0,
    			historia: 1,
    			fecha: 5,
    			id: 2,
    			idPaciente: 3
    		});

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
    			add_location(i0, file$5, 13, 10, 445);
    			attr_dev(div0, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div0, file$5, 12, 8, 384);
    			attr_dev(div1, "class", "avatar mr-2 avatar-xs");
    			add_location(div1, file$5, 11, 6, 339);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$5, 10, 4, 306);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$5, 20, 87, 714);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$5, 20, 8, 635);
    			attr_dev(button0, "class", "dropdown-item");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$5, 24, 10, 846);
    			attr_dev(button1, "class", "dropdown-item");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$5, 25, 10, 917);
    			attr_dev(button2, "class", "dropdown-item");
    			attr_dev(button2, "type", "button");
    			add_location(button2, file$5, 26, 10, 996);
    			attr_dev(div3, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div3, file$5, 23, 8, 787);
    			attr_dev(div4, "class", "dropdown");
    			add_location(div4, file$5, 19, 6, 603);
    			attr_dev(div5, "class", "card-controls");
    			add_location(div5, file$5, 18, 4, 568);
    			attr_dev(i2, "class", "mdi mdi-speedometer mdi-18px");
    			add_location(i2, file$5, 36, 12, 1330);
    			attr_dev(div6, "class", "col-lg-9 col-sm-10");
    			add_location(div6, file$5, 35, 10, 1284);
    			add_location(p0, file$5, 39, 12, 1454);
    			attr_dev(div7, "class", "col-lg-3 col-sm-2");
    			add_location(div7, file$5, 38, 10, 1409);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$5, 34, 8, 1255);
    			attr_dev(i3, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i3, file$5, 45, 12, 1599);
    			attr_dev(div9, "class", "col-lg-9 col-sm-10");
    			add_location(div9, file$5, 44, 10, 1553);
    			add_location(p1, file$5, 48, 12, 1730);
    			attr_dev(div10, "class", "col-lg-3 col-sm-2");
    			add_location(div10, file$5, 47, 10, 1685);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$5, 43, 8, 1524);
    			attr_dev(i4, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i4, file$5, 53, 12, 1888);
    			attr_dev(div12, "class", "col-lg-9 col-sm-10");
    			add_location(div12, file$5, 52, 10, 1842);
    			attr_dev(p2, "data-bind", "text: frecuenciaRespiratoria");
    			add_location(p2, file$5, 56, 12, 2030);
    			attr_dev(div13, "class", "col-lg-3 col-sm-2");
    			add_location(div13, file$5, 55, 10, 1985);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$5, 51, 8, 1813);
    			attr_dev(i5, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i5, file$5, 61, 12, 2221);
    			attr_dev(div15, "class", "col-lg-9 col-sm-10");
    			add_location(div15, file$5, 60, 10, 2175);
    			attr_dev(p3, "data-bind", "text: frecuenciaCardiaca");
    			add_location(p3, file$5, 64, 12, 2360);
    			attr_dev(div16, "class", "col-lg-3 col-sm-2");
    			add_location(div16, file$5, 63, 10, 2315);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$5, 59, 8, 2146);
    			attr_dev(i6, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i6, file$5, 69, 12, 2543);
    			attr_dev(div18, "class", "col-lg-9 col-sm-10");
    			add_location(div18, file$5, 68, 10, 2497);
    			attr_dev(p4, "data-bind", "text: tensionArterialSistolica +'/' + tensionArterialDiastolica");
    			add_location(p4, file$5, 72, 12, 2686);
    			attr_dev(div19, "class", "col-lg-3 col-sm-2");
    			add_location(div19, file$5, 71, 10, 2641);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$5, 67, 8, 2468);
    			attr_dev(div21, "class", "list-group-item ");
    			add_location(div21, file$5, 32, 6, 1213);
    			attr_dev(div22, "class", "list-group list  list-group-flush");
    			attr_dev(div22, "data-bind", "using: ultimosSignosVitales");
    			add_location(div22, file$5, 30, 4, 1116);
    			attr_dev(div23, "class", "card m-b-30");
    			add_location(div23, file$5, 9, 0, 275);
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

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
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

    const file$6 = "src\\componentes\\Loading.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(div0, file$6, 1, 4, 30);
    			attr_dev(div1, "class", "svelte-44tycx");
    			add_location(div1, file$6, 2, 4, 43);
    			attr_dev(div2, "class", "lds-ripple svelte-44tycx");
    			add_location(div2, file$6, 0, 0, 0);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\componentes\CabeceraPerfil.svelte generated by Svelte v3.29.0 */

    const { console: console_1$2 } = globals;
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
    			span0.textContent = "HL";
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
    			add_location(span0, file$7, 37, 16, 992);
    			attr_dev(div0, "class", "avatar mr-3  avatar-xl");
    			add_location(div0, file$7, 36, 14, 938);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$7, 41, 18, 1168);
    			attr_dev(i0, "class", "mdi mdi-comment-eye");
    			add_location(i0, file$7, 44, 20, 1423);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "btn ml-2 btn-primary btn-sm");
    			attr_dev(a, "data-toggle", "modal");
    			attr_dev(a, "data-target", "#modalDatosPersonales");
    			add_location(a, file$7, 42, 18, 1276);
    			attr_dev(h5, "class", "mt-0");
    			add_location(h5, file$7, 40, 16, 1130);
    			attr_dev(span2, "data-bind", "text: paciente().edad");
    			add_location(span2, file$7, 47, 40, 1568);
    			attr_dev(span3, "data-bind", "text: paciente().cedula");
    			add_location(span3, file$7, 47, 101, 1629);
    			attr_dev(div1, "class", "opacity-75");
    			add_location(div1, file$7, 47, 16, 1544);
    			attr_dev(div2, "class", "media-body m-auto");
    			add_location(div2, file$7, 39, 14, 1081);
    			attr_dev(div3, "class", "media");
    			add_location(div3, file$7, 35, 12, 903);
    			attr_dev(div4, "class", "col-md-6 text-white p-b-30");
    			add_location(div4, file$7, 34, 10, 849);
    			attr_dev(i1, "class", "mdi mdi-progress-check");
    			add_location(i1, file$7, 60, 15, 2079);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn text-white m-b-30 ml-2 mr-2 ml-3 btn-primary");
    			add_location(button, file$7, 56, 14, 1902);
    			attr_dev(div5, "class", "dropdown");
    			add_location(div5, file$7, 55, 12, 1864);
    			attr_dev(div6, "class", "col-md-6");
    			set_style(div6, "text-align", "right");
    			add_location(div6, file$7, 54, 10, 1802);
    			attr_dev(div7, "class", "row p-b-60 p-t-60");
    			add_location(div7, file$7, 33, 8, 806);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$7, 32, 6, 773);
    			attr_dev(div9, "class", "");
    			add_location(div9, file$7, 31, 4, 751);
    			attr_dev(div10, "class", "bg-dark m-b-30");
    			add_location(div10, file$7, 30, 0, 717);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		$$invalidate(5, cargando = true);

    		const config = {
    			method: "post",
    			url: `${url}/historias`,
    			data: paciente
    		};

    		axios$1(config).then(res => {
    			console.log(res.data);
    			push(`/pacientes/${id}/historias/${res.data.id}`);
    			$$invalidate(5, cargando = false);
    		}).catch(error => {
    			$$invalidate(5, cargando = false);
    			console.error(error);
    		});
    	}

    	const writable_props = ["nombres", "apellidos", "cedula", "edad", "id", "paciente", "cargando"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<CabeceraPerfil> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
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
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*edad*/ ctx[3] === undefined && !("edad" in props)) {
    			console_1$2.warn("<CabeceraPerfil> was created without expected prop 'edad'");
    		}

    		if (/*paciente*/ ctx[7] === undefined && !("paciente" in props)) {
    			console_1$2.warn("<CabeceraPerfil> was created without expected prop 'paciente'");
    		}

    		if (/*cargando*/ ctx[5] === undefined && !("cargando" in props)) {
    			console_1$2.warn("<CabeceraPerfil> was created without expected prop 'cargando'");
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

    /* src\componentes\Modals\ModalDatosPaciente.svelte generated by Svelte v3.29.0 */
    const file$8 = "src\\componentes\\Modals\\ModalDatosPaciente.svelte";

    function create_fragment$9(ctx) {
    	let div45;
    	let div44;
    	let div43;
    	let div0;
    	let h5;
    	let t1;
    	let button;
    	let span0;
    	let t3;
    	let div36;
    	let div5;
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
    	let div4;
    	let span2;
    	let t11;
    	let span1;
    	let t13;
    	let hr0;
    	let t14;
    	let form;
    	let div26;
    	let div7;
    	let div6;
    	let sapn;
    	let t16;
    	let strong0;
    	let t17_value = (/*paciente*/ ctx[0].cedula || "N/A") + "";
    	let t17;
    	let t18;
    	let div9;
    	let div8;
    	let span3;
    	let t20;
    	let strong1;
    	let t21_value = (/*paciente*/ ctx[0].nombres || "N/A") + "";
    	let t21;
    	let t22;
    	let div11;
    	let div10;
    	let span4;
    	let t24;
    	let strong2;
    	let t25_value = (/*paciente*/ ctx[0].apellidos || "N/A") + "";
    	let t25;
    	let t26;
    	let div13;
    	let div12;
    	let span5;
    	let t28;
    	let strong3;
    	let t29_value = (/*paciente*/ ctx[0].sexo || "N/A") + "";
    	let t29;
    	let t30;
    	let div15;
    	let div14;
    	let span6;
    	let t32;
    	let strong4;
    	let t33_value = (/*edad*/ ctx[1] || "N/A") + "";
    	let t33;
    	let t34;
    	let t35;
    	let div17;
    	let div16;
    	let span7;
    	let t37;
    	let strong5;
    	let t38_value = (new Date(/*paciente*/ ctx[0].fechaNacimiento).toLocaleDateString("es-DO") || "N/A") + "";
    	let t38;
    	let t39;
    	let div19;
    	let div18;
    	let span8;
    	let t41;
    	let strong6;
    	let t42_value = (/*paciente*/ ctx[0].telefono || "N/A") + "";
    	let t42;
    	let t43;
    	let div21;
    	let div20;
    	let span9;
    	let t45;
    	let strong7;
    	let t46_value = (/*paciente*/ ctx[0].celular || "N/A") + "";
    	let t46;
    	let t47;
    	let div23;
    	let div22;
    	let span10;
    	let t49;
    	let strong8;
    	let t50_value = (/*seguro*/ ctx[2] || "N/A") + "";
    	let t50;
    	let t51;
    	let div25;
    	let div24;
    	let span11;
    	let t53;
    	let strong9;
    	let t54_value = (/*paciente*/ ctx[0].numeroSeguro || "N/A") + "";
    	let t54;
    	let t55;
    	let p;
    	let b;
    	let t57;
    	let hr1;
    	let t58;
    	let div35;
    	let div28;
    	let div27;
    	let span12;
    	let t60;
    	let strong10;
    	let t61_value = (/*paciente*/ ctx[0].direccion || "N/A") + "";
    	let t61;
    	let t62;
    	let div30;
    	let div29;
    	let span13;
    	let t64;
    	let strong11;
    	let t65_value = (/*paciente*/ ctx[0].provincia || "N/A") + "";
    	let t65;
    	let t66;
    	let div32;
    	let div31;
    	let span14;
    	let t68;
    	let strong12;
    	let t69_value = (/*paciente*/ ctx[0].ciudad || "N/A") + "";
    	let t69;
    	let t70;
    	let div34;
    	let div33;
    	let span15;
    	let t72;
    	let strong13;
    	let t73_value = (/*paciente*/ ctx[0].nacionalidad || "N/A") + "";
    	let t73;
    	let t74;
    	let div42;
    	let div41;
    	let div38;
    	let a1;
    	let h31;
    	let t75;
    	let div37;
    	let t77;
    	let div40;
    	let a2;
    	let h32;
    	let t78;
    	let div39;
    	let a2_href_value;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div45 = element("div");
    			div44 = element("div");
    			div43 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Datos de paciente";
    			t1 = space();
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "×";
    			t3 = space();
    			div36 = element("div");
    			div5 = element("div");
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
    			div4 = element("div");
    			span2 = element("span");
    			t11 = text("Ultima vez modificado\r\n                                ");
    			span1 = element("span");
    			span1.textContent = "---";
    			t13 = space();
    			hr0 = element("hr");
    			t14 = space();
    			form = element("form");
    			div26 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			sapn = element("sapn");
    			sapn.textContent = "Cedula / pasaporte";
    			t16 = space();
    			strong0 = element("strong");
    			t17 = text(t17_value);
    			t18 = space();
    			div9 = element("div");
    			div8 = element("div");
    			span3 = element("span");
    			span3.textContent = "Nombres";
    			t20 = space();
    			strong1 = element("strong");
    			t21 = text(t21_value);
    			t22 = space();
    			div11 = element("div");
    			div10 = element("div");
    			span4 = element("span");
    			span4.textContent = "Apellidos";
    			t24 = space();
    			strong2 = element("strong");
    			t25 = text(t25_value);
    			t26 = space();
    			div13 = element("div");
    			div12 = element("div");
    			span5 = element("span");
    			span5.textContent = "Sexo";
    			t28 = space();
    			strong3 = element("strong");
    			t29 = text(t29_value);
    			t30 = space();
    			div15 = element("div");
    			div14 = element("div");
    			span6 = element("span");
    			span6.textContent = "Edad";
    			t32 = space();
    			strong4 = element("strong");
    			t33 = text(t33_value);
    			t34 = text(" años");
    			t35 = space();
    			div17 = element("div");
    			div16 = element("div");
    			span7 = element("span");
    			span7.textContent = "Fecha Nacimiento";
    			t37 = space();
    			strong5 = element("strong");
    			t38 = text(t38_value);
    			t39 = space();
    			div19 = element("div");
    			div18 = element("div");
    			span8 = element("span");
    			span8.textContent = "Telefono";
    			t41 = space();
    			strong6 = element("strong");
    			t42 = text(t42_value);
    			t43 = space();
    			div21 = element("div");
    			div20 = element("div");
    			span9 = element("span");
    			span9.textContent = "Celular";
    			t45 = space();
    			strong7 = element("strong");
    			t46 = text(t46_value);
    			t47 = space();
    			div23 = element("div");
    			div22 = element("div");
    			span10 = element("span");
    			span10.textContent = "Seguro Medico";
    			t49 = space();
    			strong8 = element("strong");
    			t50 = text(t50_value);
    			t51 = space();
    			div25 = element("div");
    			div24 = element("div");
    			span11 = element("span");
    			span11.textContent = "No. Seguro";
    			t53 = space();
    			strong9 = element("strong");
    			t54 = text(t54_value);
    			t55 = space();
    			p = element("p");
    			b = element("b");
    			b.textContent = "Datos demográficos";
    			t57 = space();
    			hr1 = element("hr");
    			t58 = space();
    			div35 = element("div");
    			div28 = element("div");
    			div27 = element("div");
    			span12 = element("span");
    			span12.textContent = "Dirección";
    			t60 = space();
    			strong10 = element("strong");
    			t61 = text(t61_value);
    			t62 = space();
    			div30 = element("div");
    			div29 = element("div");
    			span13 = element("span");
    			span13.textContent = "Provincia";
    			t64 = space();
    			strong11 = element("strong");
    			t65 = text(t65_value);
    			t66 = space();
    			div32 = element("div");
    			div31 = element("div");
    			span14 = element("span");
    			span14.textContent = "Ciudad";
    			t68 = space();
    			strong12 = element("strong");
    			t69 = text(t69_value);
    			t70 = space();
    			div34 = element("div");
    			div33 = element("div");
    			span15 = element("span");
    			span15.textContent = "Nacionalidad";
    			t72 = space();
    			strong13 = element("strong");
    			t73 = text(t73_value);
    			t74 = space();
    			div42 = element("div");
    			div41 = element("div");
    			div38 = element("div");
    			a1 = element("a");
    			h31 = element("h3");
    			t75 = space();
    			div37 = element("div");
    			div37.textContent = "Cerrar";
    			t77 = space();
    			div40 = element("div");
    			a2 = element("a");
    			h32 = element("h3");
    			t78 = space();
    			div39 = element("div");
    			div39.textContent = "Perfil";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalDatosPersonales");
    			add_location(h5, file$8, 15, 20, 574);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$8, 17, 24, 770);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$8, 16, 20, 668);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$8, 14, 16, 526);
    			attr_dev(img, "class", "avatar-img rounded-circle");
    			if (img.src !== (img_src_value = "https://picsum.photos/200/300")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "imagen paciente");
    			add_location(img, file$8, 25, 32, 1074);
    			attr_dev(div1, "class", "avatar avatar-xl");
    			add_location(div1, file$8, 24, 28, 1010);
    			add_location(div2, file$8, 23, 24, 975);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$8, 29, 28, 1328);
    			attr_dev(h30, "class", "p-t-10 searchBy-name");
    			add_location(h30, file$8, 28, 24, 1265);
    			attr_dev(div3, "class", "text-muted text-center m-b-10");
    			add_location(div3, file$8, 33, 24, 1500);
    			add_location(span1, file$8, 38, 32, 1795);
    			attr_dev(span2, "class", "badge badge-primary");
    			add_location(span2, file$8, 37, 28, 1706);
    			attr_dev(div4, "class", "m-auto");
    			add_location(div4, file$8, 36, 24, 1656);
    			attr_dev(div5, "class", "text-center");
    			add_location(div5, file$8, 22, 20, 924);
    			add_location(hr0, file$8, 41, 20, 1900);
    			attr_dev(sapn, "class", "text-primary");
    			add_location(sapn, file$8, 46, 36, 2189);
    			attr_dev(strong0, "class", "d-block");
    			add_location(strong0, file$8, 47, 36, 2279);
    			attr_dev(div6, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div6, file$8, 45, 32, 2111);
    			attr_dev(div7, "class", "form-group col-md-6");
    			add_location(div7, file$8, 44, 28, 2044);
    			attr_dev(span3, "class", "text-primary");
    			add_location(span3, file$8, 52, 36, 2591);
    			attr_dev(strong1, "class", "d-block");
    			add_location(strong1, file$8, 53, 36, 2670);
    			attr_dev(div8, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div8, file$8, 51, 32, 2512);
    			attr_dev(div9, "class", "form-group col-md-6");
    			add_location(div9, file$8, 50, 28, 2445);
    			attr_dev(span4, "class", "text-primary");
    			add_location(span4, file$8, 58, 36, 2983);
    			attr_dev(strong2, "class", "d-block");
    			add_location(strong2, file$8, 59, 36, 3064);
    			attr_dev(div10, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div10, file$8, 57, 32, 2905);
    			attr_dev(div11, "class", "form-group col-md-6");
    			add_location(div11, file$8, 56, 28, 2838);
    			attr_dev(span5, "class", "text-primary");
    			add_location(span5, file$8, 64, 36, 3379);
    			attr_dev(strong3, "class", "d-block");
    			add_location(strong3, file$8, 65, 36, 3455);
    			attr_dev(div12, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div12, file$8, 63, 32, 3301);
    			attr_dev(div13, "class", "form-group col-md-6");
    			add_location(div13, file$8, 62, 28, 3234);
    			attr_dev(span6, "class", "text-primary");
    			add_location(span6, file$8, 70, 36, 3765);
    			attr_dev(strong4, "class", "d-block");
    			add_location(strong4, file$8, 71, 36, 3841);
    			attr_dev(div14, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div14, file$8, 69, 32, 3687);
    			attr_dev(div15, "class", "form-group col-md-6");
    			add_location(div15, file$8, 68, 28, 3620);
    			attr_dev(span7, "class", "text-primary");
    			add_location(span7, file$8, 76, 36, 4147);
    			attr_dev(strong5, "class", "d-block");
    			add_location(strong5, file$8, 77, 36, 4235);
    			attr_dev(div16, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div16, file$8, 75, 32, 4069);
    			attr_dev(div17, "class", "form-group col-md-6");
    			add_location(div17, file$8, 74, 28, 4002);
    			attr_dev(span8, "class", "text-primary");
    			add_location(span8, file$8, 82, 36, 4595);
    			attr_dev(strong6, "class", "d-block");
    			add_location(strong6, file$8, 83, 36, 4675);
    			attr_dev(div18, "class", " bg-gray-100 p-2 rounded-sm");
    			add_location(div18, file$8, 81, 32, 4516);
    			attr_dev(div19, "class", "form-group col-md-6");
    			add_location(div19, file$8, 80, 28, 4449);
    			attr_dev(span9, "class", "text-primary");
    			add_location(span9, file$8, 88, 36, 4989);
    			attr_dev(strong7, "class", "d-block");
    			add_location(strong7, file$8, 89, 36, 5068);
    			attr_dev(div20, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div20, file$8, 87, 32, 4911);
    			attr_dev(div21, "class", "form-group col-md-6");
    			add_location(div21, file$8, 86, 28, 4844);
    			attr_dev(span10, "class", "text-primary");
    			add_location(span10, file$8, 94, 36, 5382);
    			attr_dev(strong8, "class", "d-block");
    			add_location(strong8, file$8, 95, 36, 5467);
    			attr_dev(div22, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div22, file$8, 93, 32, 5304);
    			attr_dev(div23, "class", "form-group col-md-6 ");
    			add_location(div23, file$8, 92, 28, 5236);
    			attr_dev(span11, "class", "text-primary");
    			add_location(span11, file$8, 100, 36, 5771);
    			attr_dev(strong9, "class", "d-block");
    			add_location(strong9, file$8, 101, 36, 5853);
    			attr_dev(div24, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div24, file$8, 99, 32, 5693);
    			attr_dev(div25, "class", "form-group col-md-6 ");
    			add_location(div25, file$8, 98, 28, 5625);
    			attr_dev(div26, "class", "form-row");
    			add_location(div26, file$8, 43, 24, 1992);
    			add_location(b, file$8, 105, 40, 6070);
    			attr_dev(p, "class", "mt-3");
    			add_location(p, file$8, 105, 24, 6054);
    			add_location(hr1, file$8, 106, 24, 6125);
    			attr_dev(span12, "for", "inpDireccion");
    			attr_dev(span12, "class", "text-primary");
    			add_location(span12, file$8, 110, 36, 6354);
    			attr_dev(strong10, "class", "d-block");
    			add_location(strong10, file$8, 111, 36, 6461);
    			attr_dev(div27, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div27, file$8, 109, 32, 6276);
    			attr_dev(div28, "class", "form-group col-md-12 ");
    			add_location(div28, file$8, 108, 28, 6207);
    			attr_dev(span13, "class", "text-primary");
    			add_location(span13, file$8, 116, 36, 6777);
    			attr_dev(strong11, "class", "d-block");
    			add_location(strong11, file$8, 117, 36, 6858);
    			attr_dev(div29, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div29, file$8, 115, 32, 6699);
    			attr_dev(div30, "class", "form-group col-md-6 ");
    			add_location(div30, file$8, 114, 28, 6631);
    			attr_dev(span14, "class", "text-primary");
    			add_location(span14, file$8, 122, 36, 7174);
    			attr_dev(strong12, "class", "d-block");
    			add_location(strong12, file$8, 123, 36, 7252);
    			attr_dev(div31, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div31, file$8, 121, 32, 7096);
    			attr_dev(div32, "class", "form-group col-md-6 ");
    			add_location(div32, file$8, 120, 28, 7028);
    			attr_dev(span15, "for", "inpPais");
    			attr_dev(span15, "class", "text-primary");
    			add_location(span15, file$8, 128, 36, 7565);
    			attr_dev(strong13, "class", "d-block");
    			add_location(strong13, file$8, 129, 36, 7663);
    			attr_dev(div33, "class", "bg-gray-100 p-2 rounded-sm");
    			add_location(div33, file$8, 127, 32, 7487);
    			attr_dev(div34, "class", "form-group col-md-6 ");
    			add_location(div34, file$8, 126, 28, 7419);
    			attr_dev(div35, "class", "form-row");
    			add_location(div35, file$8, 107, 24, 6155);
    			attr_dev(form, "class", "form-group floating-label");
    			add_location(form, file$8, 42, 20, 1926);
    			attr_dev(div36, "class", "modal-body");
    			add_location(div36, file$8, 20, 16, 876);
    			attr_dev(h31, "class", "mdi mdi-close-outline");
    			add_location(h31, file$8, 143, 32, 8265);
    			attr_dev(div37, "class", "text-overline");
    			add_location(div37, file$8, 144, 32, 8338);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "text-danger");
    			attr_dev(a1, "data-dismiss", "modal");
    			add_location(a1, file$8, 141, 28, 8100);
    			attr_dev(div38, "class", "col");
    			add_location(div38, file$8, 140, 24, 8053);
    			attr_dev(h32, "class", "mdi mdi-folder-account-outline");
    			add_location(h32, file$8, 157, 32, 9193);
    			attr_dev(div39, "class", "text-overline");
    			add_location(div39, file$8, 158, 32, 9275);
    			attr_dev(a2, "href", a2_href_value = `/pacientes/perfil/${/*paciente*/ ctx[0].id}`);
    			attr_dev(a2, "class", "text-info");
    			add_location(a2, file$8, 155, 28, 8947);
    			attr_dev(div40, "class", "col");
    			add_location(div40, file$8, 153, 24, 8828);
    			attr_dev(div41, "class", "row text-center p-b-10");
    			add_location(div41, file$8, 139, 20, 7991);
    			attr_dev(div42, "class", "modal-footer");
    			add_location(div42, file$8, 138, 16, 7943);
    			attr_dev(div43, "class", "modal-content");
    			add_location(div43, file$8, 13, 12, 481);
    			attr_dev(div44, "class", "modal-dialog");
    			attr_dev(div44, "role", "document");
    			add_location(div44, file$8, 12, 8, 425);
    			attr_dev(div45, "class", "modal fade modal-slide-right");
    			attr_dev(div45, "id", "modalDatosPersonales");
    			attr_dev(div45, "tabindex", "-1");
    			attr_dev(div45, "role", "dialog");
    			attr_dev(div45, "aria-labelledby", "modalDatosPersonales");
    			set_style(div45, "display", "none");
    			set_style(div45, "padding-right", "16px");
    			attr_dev(div45, "aria-modal", "true");
    			add_location(div45, file$8, 10, 0, 209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div45, anchor);
    			append_dev(div45, div44);
    			append_dev(div44, div43);
    			append_dev(div43, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span0);
    			append_dev(div43, t3);
    			append_dev(div43, div36);
    			append_dev(div36, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div5, t4);
    			append_dev(div5, h30);
    			append_dev(h30, a0);
    			append_dev(a0, t5);
    			append_dev(a0, t6);
    			append_dev(a0, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div3);
    			append_dev(div3, t9);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, span2);
    			append_dev(span2, t11);
    			append_dev(span2, span1);
    			append_dev(div36, t13);
    			append_dev(div36, hr0);
    			append_dev(div36, t14);
    			append_dev(div36, form);
    			append_dev(form, div26);
    			append_dev(div26, div7);
    			append_dev(div7, div6);
    			append_dev(div6, sapn);
    			append_dev(div6, t16);
    			append_dev(div6, strong0);
    			append_dev(strong0, t17);
    			append_dev(div26, t18);
    			append_dev(div26, div9);
    			append_dev(div9, div8);
    			append_dev(div8, span3);
    			append_dev(div8, t20);
    			append_dev(div8, strong1);
    			append_dev(strong1, t21);
    			append_dev(div26, t22);
    			append_dev(div26, div11);
    			append_dev(div11, div10);
    			append_dev(div10, span4);
    			append_dev(div10, t24);
    			append_dev(div10, strong2);
    			append_dev(strong2, t25);
    			append_dev(div26, t26);
    			append_dev(div26, div13);
    			append_dev(div13, div12);
    			append_dev(div12, span5);
    			append_dev(div12, t28);
    			append_dev(div12, strong3);
    			append_dev(strong3, t29);
    			append_dev(div26, t30);
    			append_dev(div26, div15);
    			append_dev(div15, div14);
    			append_dev(div14, span6);
    			append_dev(div14, t32);
    			append_dev(div14, strong4);
    			append_dev(strong4, t33);
    			append_dev(strong4, t34);
    			append_dev(div26, t35);
    			append_dev(div26, div17);
    			append_dev(div17, div16);
    			append_dev(div16, span7);
    			append_dev(div16, t37);
    			append_dev(div16, strong5);
    			append_dev(strong5, t38);
    			append_dev(div26, t39);
    			append_dev(div26, div19);
    			append_dev(div19, div18);
    			append_dev(div18, span8);
    			append_dev(div18, t41);
    			append_dev(div18, strong6);
    			append_dev(strong6, t42);
    			append_dev(div26, t43);
    			append_dev(div26, div21);
    			append_dev(div21, div20);
    			append_dev(div20, span9);
    			append_dev(div20, t45);
    			append_dev(div20, strong7);
    			append_dev(strong7, t46);
    			append_dev(div26, t47);
    			append_dev(div26, div23);
    			append_dev(div23, div22);
    			append_dev(div22, span10);
    			append_dev(div22, t49);
    			append_dev(div22, strong8);
    			append_dev(strong8, t50);
    			append_dev(div26, t51);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, span11);
    			append_dev(div24, t53);
    			append_dev(div24, strong9);
    			append_dev(strong9, t54);
    			append_dev(form, t55);
    			append_dev(form, p);
    			append_dev(p, b);
    			append_dev(form, t57);
    			append_dev(form, hr1);
    			append_dev(form, t58);
    			append_dev(form, div35);
    			append_dev(div35, div28);
    			append_dev(div28, div27);
    			append_dev(div27, span12);
    			append_dev(div27, t60);
    			append_dev(div27, strong10);
    			append_dev(strong10, t61);
    			append_dev(div35, t62);
    			append_dev(div35, div30);
    			append_dev(div30, div29);
    			append_dev(div29, span13);
    			append_dev(div29, t64);
    			append_dev(div29, strong11);
    			append_dev(strong11, t65);
    			append_dev(div35, t66);
    			append_dev(div35, div32);
    			append_dev(div32, div31);
    			append_dev(div31, span14);
    			append_dev(div31, t68);
    			append_dev(div31, strong12);
    			append_dev(strong12, t69);
    			append_dev(div35, t70);
    			append_dev(div35, div34);
    			append_dev(div34, div33);
    			append_dev(div33, span15);
    			append_dev(div33, t72);
    			append_dev(div33, strong13);
    			append_dev(strong13, t73);
    			append_dev(div43, t74);
    			append_dev(div43, div42);
    			append_dev(div42, div41);
    			append_dev(div41, div38);
    			append_dev(div38, a1);
    			append_dev(a1, h31);
    			append_dev(a1, t75);
    			append_dev(a1, div37);
    			append_dev(div41, t77);
    			append_dev(div41, div40);
    			append_dev(div40, a2);
    			append_dev(a2, h32);
    			append_dev(a2, t78);
    			append_dev(a2, div39);

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
    			if (dirty & /*paciente*/ 1 && t17_value !== (t17_value = (/*paciente*/ ctx[0].cedula || "N/A") + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*paciente*/ 1 && t21_value !== (t21_value = (/*paciente*/ ctx[0].nombres || "N/A") + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*paciente*/ 1 && t25_value !== (t25_value = (/*paciente*/ ctx[0].apellidos || "N/A") + "")) set_data_dev(t25, t25_value);
    			if (dirty & /*paciente*/ 1 && t29_value !== (t29_value = (/*paciente*/ ctx[0].sexo || "N/A") + "")) set_data_dev(t29, t29_value);
    			if (dirty & /*edad*/ 2 && t33_value !== (t33_value = (/*edad*/ ctx[1] || "N/A") + "")) set_data_dev(t33, t33_value);
    			if (dirty & /*paciente*/ 1 && t38_value !== (t38_value = (new Date(/*paciente*/ ctx[0].fechaNacimiento).toLocaleDateString("es-DO") || "N/A") + "")) set_data_dev(t38, t38_value);
    			if (dirty & /*paciente*/ 1 && t42_value !== (t42_value = (/*paciente*/ ctx[0].telefono || "N/A") + "")) set_data_dev(t42, t42_value);
    			if (dirty & /*paciente*/ 1 && t46_value !== (t46_value = (/*paciente*/ ctx[0].celular || "N/A") + "")) set_data_dev(t46, t46_value);
    			if (dirty & /*seguro*/ 4 && t50_value !== (t50_value = (/*seguro*/ ctx[2] || "N/A") + "")) set_data_dev(t50, t50_value);
    			if (dirty & /*paciente*/ 1 && t54_value !== (t54_value = (/*paciente*/ ctx[0].numeroSeguro || "N/A") + "")) set_data_dev(t54, t54_value);
    			if (dirty & /*paciente*/ 1 && t61_value !== (t61_value = (/*paciente*/ ctx[0].direccion || "N/A") + "")) set_data_dev(t61, t61_value);
    			if (dirty & /*paciente*/ 1 && t65_value !== (t65_value = (/*paciente*/ ctx[0].provincia || "N/A") + "")) set_data_dev(t65, t65_value);
    			if (dirty & /*paciente*/ 1 && t69_value !== (t69_value = (/*paciente*/ ctx[0].ciudad || "N/A") + "")) set_data_dev(t69, t69_value);
    			if (dirty & /*paciente*/ 1 && t73_value !== (t73_value = (/*paciente*/ ctx[0].nacionalidad || "N/A") + "")) set_data_dev(t73, t73_value);

    			if (dirty & /*paciente*/ 1 && a2_href_value !== (a2_href_value = `/pacientes/perfil/${/*paciente*/ ctx[0].id}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div45);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("ModalDatosPaciente", slots, []);
    	let { paciente } = $$props;
    	let { edad } = $$props;
    	let { seguro } = $$props;

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

    	$$self.$capture_state = () => ({ onMount, link, paciente, edad, seguro });

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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { paciente: 0, edad: 1, seguro: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalDatosPaciente",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*paciente*/ ctx[0] === undefined && !("paciente" in props)) {
    			console.warn("<ModalDatosPaciente> was created without expected prop 'paciente'");
    		}

    		if (/*edad*/ ctx[1] === undefined && !("edad" in props)) {
    			console.warn("<ModalDatosPaciente> was created without expected prop 'edad'");
    		}

    		if (/*seguro*/ ctx[2] === undefined && !("seguro" in props)) {
    			console.warn("<ModalDatosPaciente> was created without expected prop 'seguro'");
    		}
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
    const file$9 = "src\\componentes\\TarjetaAntecedentes.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (15:8) {#if antecedente.categoria.id === id}
    function create_if_block$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[3].activo && create_if_block_1(ctx);

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
    					if_block = create_if_block_1(ctx);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:8) {#if antecedente.categoria.id === id}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#if antecedente.activo}
    function create_if_block_1(ctx) {
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
    			add_location(h5, file$9, 17, 20, 456);
    			set_style(p, "padding", "0");
    			set_style(p, "margin", "0");
    			add_location(p, file$9, 18, 20, 616);
    			attr_dev(div, "class", "alert alert-secondary");
    			set_style(div, "padding", "10px");
    			attr_dev(div, "role", "alert");
    			add_location(div, file$9, 16, 16, 363);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(16:12) {#if antecedente.activo}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#each antecedentes as antecedente}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[3].categoria.id === /*id*/ ctx[0] && create_if_block$1(ctx);

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
    					if_block = create_if_block$1(ctx);
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

    function create_fragment$a(ctx) {
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

    			add_location(h6, file$9, 11, 4, 192);
    			add_location(hr, file$9, 12, 4, 215);
    			add_location(div, file$9, 10, 0, 181);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { id: 0, nombre: 1, antecedentes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TarjetaAntecedentes",
    			options,
    			id: create_fragment$a.name
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

    const { console: console_1$3 } = globals;
    const file$a = "src\\Pages\\Pacientes\\PacientePerfil.svelte";

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

    // (159:2) {#if cargando}
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
    			add_location(div, file$a, 159, 4, 4738);
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
    		source: "(159:2) {#if cargando}",
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

    // (362:20) {#each categoriasAntecedentes as categoria}
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
    		source: "(362:20) {#each categoriasAntecedentes as categoria}",
    		ctx
    	});

    	return block;
    }

    // (489:26) {#if antecedente.categoria.id === categoria.id}
    function create_if_block_2(ctx) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(489:26) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (490:28) {#if antecedente.activo === false}
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
    			add_location(i, file$a, 497, 33, 18375);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$a, 498, 32, 18435);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button, "box-shadow", "none");
    			add_location(button, file$a, 491, 30, 18019);
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
    		source: "(490:28) {#if antecedente.activo === false}",
    		ctx
    	});

    	return block;
    }

    // (488:24) {#each antecedentes as antecedente}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id && create_if_block_2(ctx);

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
    					if_block = create_if_block_2(ctx);
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
    		source: "(488:24) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (515:32) {#if antecedente.categoria.id === categoria.id}
    function create_if_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].activo === true && create_if_block_1$1(ctx);

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
    					if_block = create_if_block_1$1(ctx);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(515:32) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (516:34) {#if antecedente.activo === true}
    function create_if_block_1$1(ctx) {
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
    			add_location(i0, file$a, 523, 42, 19740);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$a, 524, 42, 19822);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$a, 522, 40, 19672);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$a, 521, 38, 19605);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$a, 537, 44, 20587);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$a, 531, 42, 20239);
    			attr_dev(i2, "class", "mdi mdi-trash-can-outline");
    			add_location(i2, file$a, 551, 47, 21443);
    			attr_dev(button, "class", "dropdown-item text-danger");
    			attr_dev(button, "type", "button");
    			add_location(button, file$a, 544, 44, 20994);
    			attr_dev(div2, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div2, file$a, 541, 42, 20812);
    			attr_dev(div3, "class", "dropdown");
    			add_location(div3, file$a, 530, 40, 20173);
    			attr_dev(div4, "class", "card-controls");
    			add_location(div4, file$a, 529, 38, 20104);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			set_style(textarea, "height", "100px");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$a, 560, 40, 21938);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$a, 559, 38, 21873);
    			attr_dev(div6, "class", "card m-b-20 mt-3");
    			set_style(div6, "box-shadow", "none");
    			set_style(div6, "border", "1px grey solid");
    			add_location(div6, file$a, 517, 36, 19369);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(516:34) {#if antecedente.activo === true}",
    		ctx
    	});

    	return block;
    }

    // (514:30) {#each antecedentes as antecedente}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id && create_if_block$2(ctx);

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
    					if_block = create_if_block$2(ctx);
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
    		source: "(514:30) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (473:16) {#each categoriasAntecedentes as categoria}
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
    			add_location(div0, file$a, 478, 22, 17358);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$a, 477, 20, 17309);
    			attr_dev(div2, "class", "botones-antecedentes");
    			attr_dev(div2, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div2, file$a, 483, 22, 17578);
    			attr_dev(div3, "class", "col-lg-12");
    			attr_dev(div3, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div3, file$a, 509, 28, 18897);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$a, 508, 26, 18850);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$a, 507, 24, 18802);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$a, 506, 22, 18759);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$a, 482, 20, 17531);
    			attr_dev(div8, "class", "card  m-b-30");
    			set_style(div8, "box-shadow", "none");
    			set_style(div8, "border", "#32325d solid 1px");
    			add_location(div8, file$a, 473, 18, 17146);
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
    		source: "(473:16) {#each categoriasAntecedentes as categoria}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
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
    	let div21;
    	let div20;
    	let div19;
    	let div5;
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t4;
    	let t5;
    	let div3;
    	let textarea;
    	let t6;
    	let ultimosvitales;
    	let t7;
    	let div11;
    	let div10;
    	let div8;
    	let div7;
    	let div6;
    	let i1;
    	let t8;
    	let t9;
    	let div9;
    	let t10;
    	let div18;
    	let div17;
    	let div14;
    	let div13;
    	let div12;
    	let i2;
    	let t11;
    	let span0;
    	let button0;
    	let i3;
    	let t13;
    	let t14;
    	let div16;
    	let div15;
    	let t15;
    	let modaldatospaciente;
    	let t16;
    	let div31;
    	let div30;
    	let div29;
    	let div25;
    	let h5;
    	let t18;
    	let button1;
    	let span1;
    	let t20;
    	let div24;
    	let div23;
    	let div22;
    	let i4;
    	let t21;
    	let i5;
    	let t23;
    	let div28;
    	let div27;
    	let div26;
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
    			div21 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t4 = text("\r\n                  Comentario");
    			t5 = space();
    			div3 = element("div");
    			textarea = element("textarea");
    			t6 = space();
    			create_component(ultimosvitales.$$.fragment);
    			t7 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			i1 = element("i");
    			t8 = text("\r\n                  Historial atenciones");
    			t9 = space();
    			div9 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t10 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			i2 = element("i");
    			t11 = space();
    			span0 = element("span");
    			span0.textContent = "Antecedentes  ";
    			button0 = element("button");
    			i3 = element("i");
    			t13 = text(" AGREGAR  ");
    			t14 = space();
    			div16 = element("div");
    			div15 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			create_component(modaldatospaciente.$$.fragment);
    			t16 = space();
    			div31 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			div25 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Antecedentes";
    			t18 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "×";
    			t20 = space();
    			div24 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			i4 = element("i");
    			t21 = space();
    			i5 = element("i");
    			i5.textContent = "listo y guardado";
    			t23 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "class", "mdi mdi-comment-account-outline mdi-18px");
    			add_location(i0, file$a, 183, 22, 5530);
    			attr_dev(div0, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div0, file$a, 182, 20, 5457);
    			attr_dev(div1, "class", "avatar mr-2 avatar-xs");
    			add_location(div1, file$a, 181, 18, 5400);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file$a, 180, 16, 5355);
    			attr_dev(textarea, "class", "form-control mt-2");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			textarea.readOnly = "";
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "data-bind", "value: paciente().comentario");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$a, 189, 18, 5764);
    			attr_dev(div3, "class", "form-group col-lg-12");
    			add_location(div3, file$a, 188, 16, 5710);
    			attr_dev(div4, "class", "card m-b-30");
    			add_location(div4, file$a, 179, 14, 5312);
    			attr_dev(div5, "class", "col-lg-3 order-lg-1 order-sm-3");
    			add_location(div5, file$a, 178, 12, 5252);
    			attr_dev(i1, "class", "mdi mdi-progress-check mdi-18px");
    			add_location(i1, file$a, 321, 22, 11458);
    			attr_dev(div6, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div6, file$a, 320, 20, 11385);
    			attr_dev(div7, "class", "avatar mr-2 avatar-xs");
    			add_location(div7, file$a, 319, 18, 11328);
    			attr_dev(div8, "class", "card-header");
    			add_location(div8, file$a, 318, 16, 11283);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$a, 326, 16, 11639);
    			attr_dev(div10, "class", "card m-b-30");
    			add_location(div10, file$a, 317, 14, 11240);
    			attr_dev(div11, "class", "col-md-5 order-2 order-sm-1");
    			add_location(div11, file$a, 316, 12, 11183);
    			attr_dev(i2, "class", "mdi mdi-history mdi-18px");
    			add_location(i2, file$a, 346, 22, 12463);
    			attr_dev(div12, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div12, file$a, 345, 20, 12390);
    			attr_dev(div13, "class", "avatar mr-2 avatar-xs");
    			add_location(div13, file$a, 344, 18, 12333);
    			add_location(span0, file$a, 352, 18, 12680);
    			attr_dev(i3, "class", "mdi mdi-plus");
    			add_location(i3, file$a, 356, 21, 12897);
    			attr_dev(button0, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalAntecedentes");
    			add_location(button0, file$a, 352, 50, 12712);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file$a, 343, 16, 12288);
    			attr_dev(div15, "class", "atenciones-vnc mb-3");
    			add_location(div15, file$a, 360, 18, 13052);
    			attr_dev(div16, "class", "card-body");
    			add_location(div16, file$a, 359, 16, 13009);
    			attr_dev(div17, "class", "card m-b-30");
    			add_location(div17, file$a, 342, 14, 12245);
    			attr_dev(div18, "class", "col-md-4 order-lg-12 order-sm-2");
    			add_location(div18, file$a, 341, 12, 12184);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$a, 177, 10, 5221);
    			attr_dev(div20, "class", "col-md-12");
    			add_location(div20, file$a, 176, 8, 5186);
    			attr_dev(div21, "class", "pull-up");
    			add_location(div21, file$a, 175, 6, 5155);
    			attr_dev(section0, "class", "admin-content");
    			add_location(section0, file$a, 165, 4, 4854);
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalAntecedentes");
    			add_location(h5, file$a, 449, 12, 16204);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$a, 456, 14, 16448);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$a, 450, 12, 16282);
    			attr_dev(i4, "class", "mdi mdi-check-all");
    			add_location(i4, file$a, 464, 18, 16780);
    			add_location(i5, file$a, 464, 50, 16812);
    			attr_dev(div22, "class", "guardando mr-2 text-success");
    			attr_dev(div22, "data-bind", "html: content, class: contentClass");
    			add_location(div22, file$a, 460, 16, 16616);
    			attr_dev(div23, "class", "guardar-documento");
    			add_location(div23, file$a, 459, 14, 16567);
    			set_style(div24, "margin-right", "40px");
    			add_location(div24, file$a, 458, 12, 16518);
    			attr_dev(div25, "class", "modal-header");
    			add_location(div25, file$a, 448, 10, 16164);
    			attr_dev(div26, "class", "col-lg-12");
    			attr_dev(div26, "data-bind", "foreach: gruposAntecedentes");
    			add_location(div26, file$a, 471, 14, 17002);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$a, 470, 12, 16969);
    			attr_dev(div28, "class", "modal-body");
    			add_location(div28, file$a, 469, 10, 16931);
    			attr_dev(div29, "class", "modal-content");
    			add_location(div29, file$a, 447, 8, 16125);
    			attr_dev(div30, "class", "modal-dialog");
    			attr_dev(div30, "role", "document");
    			add_location(div30, file$a, 446, 6, 16073);
    			attr_dev(div31, "class", "modal fade modal-slide-right");
    			attr_dev(div31, "id", "modalAntecedentes");
    			attr_dev(div31, "tabindex", "-1");
    			attr_dev(div31, "role", "dialog");
    			attr_dev(div31, "aria-labelledby", "modalAntecedentes");
    			set_style(div31, "display", "none");
    			attr_dev(div31, "aria-hidden", "true");
    			add_location(div31, file$a, 437, 4, 15839);
    			attr_dev(section1, "class", "admin-content");
    			add_location(section1, file$a, 164, 2, 4817);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$a, 157, 0, 4661);
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
    			append_dev(section0, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div2, t4);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, textarea);
    			append_dev(div5, t6);
    			mount_component(ultimosvitales, div5, null);
    			append_dev(div19, t7);
    			append_dev(div19, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, i1);
    			append_dev(div8, t8);
    			append_dev(div10, t9);
    			append_dev(div10, div9);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div9, null);
    			}

    			append_dev(div19, t10);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, i2);
    			append_dev(div14, t11);
    			append_dev(div14, span0);
    			append_dev(div14, button0);
    			append_dev(button0, i3);
    			append_dev(button0, t13);
    			append_dev(div17, t14);
    			append_dev(div17, div16);
    			append_dev(div16, div15);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div15, null);
    			}

    			append_dev(section1, t15);
    			mount_component(modaldatospaciente, section1, null);
    			append_dev(section1, t16);
    			append_dev(section1, div31);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div25);
    			append_dev(div25, h5);
    			append_dev(div25, t18);
    			append_dev(div25, button1);
    			append_dev(button1, span1);
    			append_dev(div25, t20);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, i4);
    			append_dev(div22, t21);
    			append_dev(div22, i5);
    			append_dev(div29, t23);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div26, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i2, "click", /*combinarAntecedentes*/ ctx[15], false, false, false);
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

    			if (dirty[0] & /*paciente, historiasPaciente*/ 66) {
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
    						each_blocks_2[i].m(div9, null);
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
    						each_blocks_1[i].m(div15, null);
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
    						each_blocks[i].m(div26, null);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function calcularEdad(fecha) {
    	var hoy = new Date();
    	var cumpleanos = new Date(fecha);
    	var edad = hoy.getFullYear() - cumpleanos.getFullYear();
    	var m = hoy.getMonth() - cumpleanos.getMonth();

    	if (m < 0 || m === 0 && hoy.getDate() < cumpleanos.getDate()) {
    		edad--;
    	}

    	return edad;
    }

    function instance$b($$self, $$props, $$invalidate) {
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

    	const cargarHistoriasPaciente = () => {
    		const config = {
    			method: "get",
    			url: `${url}/historias/paciente/${params.id}`
    		};

    		axios$1(config).then(res => {
    			$$invalidate(6, historiasPaciente = res.data);
    			$$invalidate(7, peso = res.data[0].peso.valor);
    			$$invalidate(8, tipoPeso = res.data[0].peso.tipo);
    			$$invalidate(9, temperatura = res.data[0].temperatura.valor);
    			$$invalidate(10, tipoTemperatura = res.data[0].temperatura.tipo);
    			$$invalidate(11, frecuenciaRespiratoria = res.data[0].frecuenciaRespiratoria);
    			$$invalidate(12, frecuenciaCardiaca = res.data[0].frecuenciaCardiaca);
    			$$invalidate(13, presionAlterial = `${res.data[0].presionAlterial.mm}/${res.data[0].presionAlterial.Hg}`);
    			console.log(historiasPaciente);
    		}).catch(error => {
    			console.error(error);
    		});
    	};

    	function actualizarAntecedentesPaciente() {
    		$$invalidate(1, paciente.antecedentes = antecedentes, paciente);

    		const config = {
    			method: "put",
    			url: `${url}/pacientes/${paciente.id}`,
    			data: paciente
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
    			url: `${url}/antecedentes`
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
    			url: `${url}/categorias/antecedentes`
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, categoriasAntecedentes = res.data);
    		});
    	}

    	async function cargarPaciente() {
    		const config = {
    			method: "get",
    			url: `${url}/pacientes/${params.id}`
    		};

    		try {
    			let promesa = await axios$1(config);

    			if (promesa.status == 200) {
    				$$invalidate(1, paciente = promesa.data);
    				$$invalidate(2, edad = calcularEdad(paciente.fechaNacimiento));
    				$$invalidate(3, seguro = paciente.seguroMedico[0].nombre);
    			}
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	onMount(async () => {
    		jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    		await cargarPaciente();
    		await cargarAntecedentes();
    		cargarHistoriasPaciente();
    		cargarCategoriasAntecedentes();
    		combinarAntecedentes();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<PacientePerfil> was created with unknown prop '${key}'`);
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
    		calcularEdad
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { params: 18 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacientePerfil",
    			options,
    			id: create_fragment$b.name
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
    const file$b = "src\\componentes\\Select2.svelte";

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
    			add_location(option, file$b, 23, 8, 533);
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

    function create_fragment$c(ctx) {
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
    			add_location(label_1, file$b, 15, 0, 334);
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$b, 21, 4, 455);
    			attr_dev(select, "class", select_class_value = `form-control ${/*id*/ ctx[0]}`);
    			set_style(select, "width", "100%");
    			attr_dev(select, "id", /*id*/ ctx[0]);
    			add_location(select, file$b, 16, 0, 367);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
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
    			id: create_fragment$c.name
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

    const { console: console_1$4 } = globals;
    const file$c = "src\\Pages\\Pacientes\\PacienteCrear.svelte";

    function create_fragment$d(ctx) {
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
    	let select2;
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
    	let label12;
    	let t58;
    	let select2_1;
    	let option6;
    	let option7;
    	let t61;
    	let div29;
    	let label13;
    	let t63;
    	let select3;
    	let option8;
    	let option9;
    	let t66;
    	let div32;
    	let div31;
    	let label14;
    	let t68;
    	let select4;
    	let option10;
    	let option11;
    	let t71;
    	let div34;
    	let div33;
    	let label15;
    	let t73;
    	let input10;
    	let t74;
    	let div35;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

    	function select2_valor_binding(value) {
    		/*select2_valor_binding*/ ctx[30].call(null, value);
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
    			create_component(select2.$$.fragment);
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
    			label12 = element("label");
    			label12.textContent = "Ciudad";
    			t58 = space();
    			select2_1 = element("select");
    			option6 = element("option");
    			option6.textContent = "- seleccionar ciudad - ";
    			option7 = element("option");
    			option7.textContent = "San Francisco de Macoris";
    			t61 = space();
    			div29 = element("div");
    			label13 = element("label");
    			label13.textContent = "Provincia";
    			t63 = space();
    			select3 = element("select");
    			option8 = element("option");
    			option8.textContent = "- seleccionar provincia - ";
    			option9 = element("option");
    			option9.textContent = "Duarte";
    			t66 = space();
    			div32 = element("div");
    			div31 = element("div");
    			label14 = element("label");
    			label14.textContent = "Nacionalidad";
    			t68 = space();
    			select4 = element("select");
    			option10 = element("option");
    			option10.textContent = "- seleccionar nacionalidad - ";
    			option11 = element("option");
    			option11.textContent = "Dominicana";
    			t71 = space();
    			div34 = element("div");
    			div33 = element("div");
    			label15 = element("label");
    			label15.textContent = "Direccion";
    			t73 = space();
    			input10 = element("input");
    			t74 = space();
    			div35 = element("div");
    			button = element("button");
    			button.textContent = "Guardar";
    			attr_dev(div0, "class", "avatar-title bg-info rounded-circle mdi mdi-account-circle-outline");
    			add_location(div0, file$c, 109, 28, 3275);
    			attr_dev(div1, "class", "avatar avatar-lg ");
    			add_location(div1, file$c, 108, 24, 3214);
    			attr_dev(div2, "class", "m-b-10");
    			add_location(div2, file$c, 107, 20, 3168);
    			add_location(h3, file$c, 112, 20, 3443);
    			attr_dev(div3, "class", "col-lg-8 text-center mx-auto text-white p-b-30");
    			add_location(div3, file$c, 106, 16, 3086);
    			attr_dev(div4, "class", "row p-b-60 p-t-60");
    			add_location(div4, file$c, 105, 12, 3037);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$c, 104, 8, 3000);
    			attr_dev(div6, "class", "bg-dark bg-dots m-b-30");
    			add_location(div6, file$c, 103, 4, 2954);
    			attr_dev(h50, "class", "");
    			add_location(h50, file$c, 124, 32, 3902);
    			attr_dev(label0, "for", "inpNombre");
    			add_location(label0, file$c, 127, 40, 4105);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "inpNombre");
    			attr_dev(input0, "placeholder", "John");
    			input0.required = true;
    			add_location(input0, file$c, 128, 40, 4184);
    			attr_dev(div7, "class", "form-group col-md-6");
    			add_location(div7, file$c, 126, 36, 4030);
    			attr_dev(label1, "for", "inpApellido");
    			add_location(label1, file$c, 138, 40, 4758);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "inpApellido");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Doe");
    			input1.required = true;
    			add_location(input1, file$c, 139, 40, 4842);
    			attr_dev(div8, "class", "form-group col-md-6");
    			add_location(div8, file$c, 137, 36, 4683);
    			attr_dev(div9, "class", "form-row");
    			add_location(div9, file$c, 125, 32, 3970);
    			attr_dev(label2, "for", "inpApodo");
    			add_location(label2, file$c, 151, 40, 5515);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "inpApodo");
    			add_location(input2, file$c, 152, 40, 5592);
    			attr_dev(div10, "class", "form-group col-md-6");
    			add_location(div10, file$c, 150, 36, 5440);
    			attr_dev(label3, "for", "sltSexo");
    			add_location(label3, file$c, 160, 40, 6045);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			option0.disabled = true;
    			add_location(option0, file$c, 167, 44, 6457);
    			option1.__value = "Masculino";
    			option1.value = option1.__value;
    			add_location(option1, file$c, 168, 44, 6569);
    			option2.__value = "Femenino";
    			option2.value = option2.__value;
    			add_location(option2, file$c, 169, 44, 6659);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltSexo");
    			select0.required = true;
    			if (/*sexo*/ ctx[6] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[22].call(select0));
    			add_location(select0, file$c, 161, 40, 6120);
    			attr_dev(div11, "class", "form-group col-md-6");
    			add_location(div11, file$c, 159, 36, 5970);
    			attr_dev(div12, "class", "form-row");
    			add_location(div12, file$c, 149, 32, 5380);
    			attr_dev(label4, "for", "inpFechaNacimiento");
    			add_location(label4, file$c, 175, 40, 7005);
    			attr_dev(input3, "type", "date");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "inpFechaNacimiento");
    			input3.required = true;
    			add_location(input3, file$c, 176, 40, 7106);
    			attr_dev(div13, "class", "form-group col-md-6");
    			add_location(div13, file$c, 174, 36, 6930);
    			attr_dev(label5, "for", "sltTipoDocumento");
    			add_location(label5, file$c, 185, 40, 7632);
    			option3.__value = "";
    			option3.value = option3.__value;
    			option3.selected = true;
    			option3.disabled = true;
    			add_location(option3, file$c, 192, 44, 8084);
    			option4.__value = "C";
    			option4.value = option4.__value;
    			add_location(option4, file$c, 193, 44, 8196);
    			option5.__value = "P";
    			option5.value = option5.__value;
    			add_location(option5, file$c, 194, 44, 8275);
    			attr_dev(select1, "class", "form-control");
    			attr_dev(select1, "id", "sltTipoDocumento");
    			select1.required = true;
    			if (/*tipoDocumento*/ ctx[12] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[24].call(select1));
    			add_location(select1, file$c, 186, 40, 7729);
    			attr_dev(div14, "class", "form-group col-md-6");
    			add_location(div14, file$c, 184, 36, 7557);
    			attr_dev(div15, "class", "form-row");
    			add_location(div15, file$c, 173, 32, 6870);
    			attr_dev(label6, "for", "inpNumeroDocumento");
    			add_location(label6, file$c, 200, 40, 8615);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "inpNumeroDocumento");
    			add_location(input4, file$c, 201, 40, 8719);
    			attr_dev(div16, "class", "form-group col-md-6");
    			add_location(div16, file$c, 199, 36, 8540);
    			attr_dev(label7, "for", "inpTelefono");
    			add_location(label7, file$c, 209, 40, 9186);
    			attr_dev(input5, "type", "tel");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "id", "inpTelefono");
    			add_location(input5, file$c, 210, 40, 9269);
    			attr_dev(div17, "class", "form-group col-md-6");
    			add_location(div17, file$c, 208, 36, 9111);
    			attr_dev(div18, "class", "form-row");
    			add_location(div18, file$c, 198, 32, 8480);
    			attr_dev(label8, "for", "inpCelular");
    			add_location(label8, file$c, 220, 40, 9823);
    			attr_dev(input6, "type", "tel");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "id", "inpCelular");
    			add_location(input6, file$c, 221, 40, 9904);
    			attr_dev(div19, "class", "form-group col-md-6");
    			add_location(div19, file$c, 219, 36, 9748);
    			attr_dev(label9, "for", "inpCorreo");
    			add_location(label9, file$c, 229, 40, 10360);
    			attr_dev(input7, "type", "email");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "id", "inpCorreo");
    			add_location(input7, file$c, 230, 40, 10451);
    			attr_dev(div20, "class", "form-group col-md-6");
    			add_location(div20, file$c, 228, 36, 10285);
    			attr_dev(div21, "class", "form-row");
    			add_location(div21, file$c, 218, 32, 9688);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "name", "option");
    			input8.__value = "1";
    			input8.value = input8.__value;
    			attr_dev(input8, "class", "cstm-switch-input");
    			add_location(input8, file$c, 241, 44, 11065);
    			attr_dev(span0, "class", "cstm-switch-indicator bg-success ");
    			add_location(span0, file$c, 242, 44, 11209);
    			attr_dev(span1, "class", "cstm-switch-description");
    			add_location(span1, file$c, 243, 44, 11310);
    			attr_dev(label10, "class", "cstm-switch");
    			add_location(label10, file$c, 240, 40, 10992);
    			attr_dev(div22, "class", " m-b-10");
    			add_location(div22, file$c, 239, 36, 10929);
    			attr_dev(div23, "class", "form-group");
    			add_location(div23, file$c, 238, 32, 10867);
    			add_location(h51, file$c, 248, 40, 11723);
    			add_location(hr0, file$c, 249, 40, 11795);
    			attr_dev(div24, "class", "form-group col-md-6");
    			add_location(div24, file$c, 251, 44, 11909);
    			attr_dev(label11, "for", "inpNoAfiliado");
    			add_location(label11, file$c, 261, 48, 12607);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "form-control");
    			attr_dev(input9, "id", "inpNoAfiliado");
    			add_location(input9, file$c, 262, 48, 12704);
    			attr_dev(div25, "class", "form-group col-md-6");
    			add_location(div25, file$c, 260, 44, 12524);
    			attr_dev(div26, "class", "form-row");
    			add_location(div26, file$c, 250, 40, 11841);

    			attr_dev(div27, "class", div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn");

    			add_location(div27, file$c, 247, 36, 11551);
    			attr_dev(h52, "class", "mt-3");
    			add_location(h52, file$c, 271, 32, 13232);
    			add_location(hr1, file$c, 272, 32, 13297);
    			attr_dev(label12, "for", "sltCiudad");
    			add_location(label12, file$c, 275, 40, 13470);
    			option6.__value = "";
    			option6.value = option6.__value;
    			option6.selected = true;
    			option6.disabled = true;
    			add_location(option6, file$c, 281, 44, 13836);
    			option7.__value = "San Francisco de Macoris";
    			option7.value = option7.__value;
    			add_location(option7, file$c, 282, 44, 13950);
    			attr_dev(select2_1, "class", "form-control");
    			attr_dev(select2_1, "id", "sltCiudad");
    			if (/*ciudad*/ ctx[14] === void 0) add_render_callback(() => /*select2_1_change_handler*/ ctx[32].call(select2_1));
    			add_location(select2_1, file$c, 276, 40, 13549);
    			attr_dev(div28, "class", "form-group col-md-6");
    			add_location(div28, file$c, 274, 36, 13395);
    			attr_dev(label13, "for", "sltProvincia");
    			add_location(label13, file$c, 286, 40, 14232);
    			option8.__value = "";
    			option8.value = option8.__value;
    			option8.selected = true;
    			option8.disabled = true;
    			add_location(option8, file$c, 292, 44, 14610);
    			option9.__value = "Duarte";
    			option9.value = option9.__value;
    			add_location(option9, file$c, 293, 44, 14727);
    			attr_dev(select3, "class", "form-control");
    			attr_dev(select3, "id", "sltProvincia");
    			if (/*provincia*/ ctx[15] === void 0) add_render_callback(() => /*select3_change_handler*/ ctx[33].call(select3));
    			add_location(select3, file$c, 287, 40, 14317);
    			attr_dev(div29, "class", "form-group col-md-6");
    			add_location(div29, file$c, 285, 36, 14157);
    			attr_dev(div30, "class", "form-row");
    			add_location(div30, file$c, 273, 32, 13335);
    			attr_dev(label14, "for", "sltNacionalidad");
    			add_location(label14, file$c, 308, 40, 15667);
    			option10.__value = "";
    			option10.value = option10.__value;
    			option10.selected = true;
    			option10.disabled = true;
    			add_location(option10, file$c, 314, 44, 16057);
    			option11.__value = "Dominicana";
    			option11.value = option11.__value;
    			add_location(option11, file$c, 315, 44, 16177);
    			attr_dev(select4, "class", "form-control");
    			attr_dev(select4, "id", "sltNacionalidad");
    			if (/*nacionalidad*/ ctx[8] === void 0) add_render_callback(() => /*select4_change_handler*/ ctx[34].call(select4));
    			add_location(select4, file$c, 309, 40, 15758);
    			attr_dev(div31, "class", "form-group col-md-6");
    			add_location(div31, file$c, 307, 36, 15592);
    			attr_dev(div32, "class", "form-row");
    			add_location(div32, file$c, 297, 32, 14934);
    			attr_dev(label15, "for", "inpDireccion");
    			add_location(label15, file$c, 321, 40, 16528);
    			attr_dev(input10, "type", "text");
    			attr_dev(input10, "class", "form-control");
    			attr_dev(input10, "id", "inpDireccion");
    			add_location(input10, file$c, 322, 40, 16613);
    			attr_dev(div33, "class", "form-group col-md-12");
    			add_location(div33, file$c, 320, 36, 16452);
    			attr_dev(div34, "class", "form-row");
    			add_location(div34, file$c, 319, 32, 16392);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-success btn-cta");
    			add_location(button, file$c, 331, 36, 17097);
    			attr_dev(div35, "class", "text-right");
    			add_location(div35, file$c, 330, 32, 17035);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$c, 123, 27, 3845);
    			attr_dev(div37, "class", "card py-3 m-b-30");
    			add_location(div37, file$c, 122, 23, 3786);
    			attr_dev(div38, "class", "col-lg-8 mx-auto  mt-2");
    			add_location(div38, file$c, 121, 20, 3725);
    			attr_dev(div39, "class", "row ");
    			add_location(div39, file$c, 120, 16, 3685);
    			attr_dev(div40, "class", "container");
    			add_location(div40, file$c, 119, 12, 3644);
    			attr_dev(section0, "class", "pull-up");
    			add_location(section0, file$c, 118, 8, 3605);
    			add_location(form, file$c, 117, 4, 3544);
    			attr_dev(section1, "class", "admin-content ");
    			add_location(section1, file$c, 102, 2, 2916);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$c, 100, 0, 2873);
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
    			mount_component(select2, div24, null);
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
    			append_dev(div28, label12);
    			append_dev(div28, t58);
    			append_dev(div28, select2_1);
    			append_dev(select2_1, option6);
    			append_dev(select2_1, option7);
    			select_option(select2_1, /*ciudad*/ ctx[14]);
    			append_dev(div30, t61);
    			append_dev(div30, div29);
    			append_dev(div29, label13);
    			append_dev(div29, t63);
    			append_dev(div29, select3);
    			append_dev(select3, option8);
    			append_dev(select3, option9);
    			select_option(select3, /*provincia*/ ctx[15]);
    			append_dev(div36, t66);
    			append_dev(div36, div32);
    			append_dev(div32, div31);
    			append_dev(div31, label14);
    			append_dev(div31, t68);
    			append_dev(div31, select4);
    			append_dev(select4, option10);
    			append_dev(select4, option11);
    			select_option(select4, /*nacionalidad*/ ctx[8]);
    			append_dev(div36, t71);
    			append_dev(div36, div34);
    			append_dev(div34, div33);
    			append_dev(div33, label15);
    			append_dev(div33, t73);
    			append_dev(div33, input10);
    			set_input_value(input10, /*direccion*/ ctx[16]);
    			append_dev(div36, t74);
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
    					listen_dev(select2_1, "change", /*select2_1_change_handler*/ ctx[32]),
    					listen_dev(select3, "change", /*select3_change_handler*/ ctx[33]),
    					listen_dev(select4, "change", /*select4_change_handler*/ ctx[34]),
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

    			const select2_changes = {};
    			if (dirty[0] & /*aseguradoras*/ 2) select2_changes.datos = /*aseguradoras*/ ctx[1];

    			if (!updating_valor && dirty[0] & /*aseguradora*/ 4) {
    				updating_valor = true;
    				select2_changes.valor = /*aseguradora*/ ctx[2];
    				add_flush_callback(() => updating_valor = false);
    			}

    			select2.$set(select2_changes);

    			if (dirty[0] & /*numeroSeguro*/ 8192 && to_number(input9.value) !== /*numeroSeguro*/ ctx[13]) {
    				set_input_value(input9, /*numeroSeguro*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*asegurado*/ 1 && div27_class_value !== (div27_class_value = !/*asegurado*/ ctx[0]
    			? "hidden seguro animate__animated animate__bounceIn"
    			: "show seguro animate__animated animate__bounceIn")) {
    				attr_dev(div27, "class", div27_class_value);
    			}

    			if (dirty[0] & /*ciudad*/ 16384) {
    				select_option(select2_1, /*ciudad*/ ctx[14]);
    			}

    			if (dirty[0] & /*provincia*/ 32768) {
    				select_option(select3, /*provincia*/ ctx[15]);
    			}

    			if (dirty[0] & /*nacionalidad*/ 256) {
    				select_option(select4, /*nacionalidad*/ ctx[8]);
    			}

    			if (dirty[0] & /*direccion*/ 65536 && input10.value !== /*direccion*/ ctx[16]) {
    				set_input_value(input10, /*direccion*/ ctx[16]);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    	let empresa = [];
    	let responsables = [];

    	function registrarPaciente() {
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
    			empresa,
    			responsables
    		};

    		const config = {
    			method: "post",
    			url: `${url}/pacientes`,
    			data: paciente
    		};

    		axios$1(config).then(res => {
    			if (res.status === 200) {
    				console.log(res);
    				push(`/pacientes/perfil/${res.data.id}`);
    			}
    		}).catch(error => {
    			console.log(error);
    		});

    		console.log(paciente);
    	}

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

    		cargarAseguradoras();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<PacienteCrear> was created with unknown prop '${key}'`);
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

    	function select2_valor_binding(value) {
    		aseguradora = value;
    		$$invalidate(2, aseguradora);
    	}

    	function input9_input_handler() {
    		numeroSeguro = to_number(this.value);
    		$$invalidate(13, numeroSeguro);
    	}

    	function select2_1_change_handler() {
    		ciudad = select_value(this);
    		$$invalidate(14, ciudad);
    	}

    	function select3_change_handler() {
    		provincia = select_value(this);
    		$$invalidate(15, provincia);
    	}

    	function select4_change_handler() {
    		nacionalidad = select_value(this);
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
    		registrarPaciente,
    		cargarAseguradoras
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
    		select2_valor_binding,
    		input9_input_handler,
    		select2_1_change_handler,
    		select3_change_handler,
    		select4_change_handler,
    		input10_input_handler
    	];
    }

    class PacienteCrear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PacienteCrear",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Layout\AsideAtencion.svelte generated by Svelte v3.29.0 */
    const file$d = "src\\Layout\\AsideAtencion.svelte";

    function create_fragment$e(ctx) {
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
    	let li3;
    	let a6;
    	let span12;
    	let span11;
    	let t16;
    	let span13;
    	let i3;
    	let link_action_4;
    	let active_action_3;
    	let t17;
    	let li4;
    	let a7;
    	let span16;
    	let span14;
    	let t19;
    	let span15;
    	let t21;
    	let span17;
    	let i4;
    	let link_action_5;
    	let active_action_4;
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
    			span5.textContent = "Resumen";
    			t10 = space();
    			span7 = element("span");
    			i1 = element("i");
    			t11 = space();
    			li2 = element("li");
    			a5 = element("a");
    			span9 = element("span");
    			span8 = element("span");
    			span8.textContent = "Editar atencion";
    			t13 = space();
    			span10 = element("span");
    			i2 = element("i");
    			t14 = space();
    			li3 = element("li");
    			a6 = element("a");
    			span12 = element("span");
    			span11 = element("span");
    			span11.textContent = "Historia Clinica";
    			t16 = space();
    			span13 = element("span");
    			i3 = element("i");
    			t17 = space();
    			li4 = element("li");
    			a7 = element("a");
    			span16 = element("span");
    			span14 = element("span");
    			span14.textContent = "Notas médicas";
    			t19 = space();
    			span15 = element("span");
    			span15.textContent = "Ingreso y Evoluciones";
    			t21 = space();
    			span17 = element("span");
    			i4 = element("i");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$d, 9, 8, 286);
    			attr_dev(span0, "class", "admin-brand-content");
    			add_location(span0, file$d, 8, 6, 242);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned");
    			add_location(a1, file$d, 14, 8, 438);
    			attr_dev(a2, "href", "#!");
    			attr_dev(a2, "class", "admin-close-sidebar");
    			add_location(a2, file$d, 18, 8, 611);
    			attr_dev(div0, "class", "ml-auto");
    			add_location(div0, file$d, 12, 6, 378);
    			attr_dev(div1, "class", "admin-sidebar-brand");
    			add_location(div1, file$d, 6, 4, 163);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$d, 30, 14, 1041);
    			attr_dev(span2, "class", "menu-label");
    			add_location(span2, file$d, 29, 12, 1000);
    			attr_dev(span3, "class", "icon-badge badge-success badge badge-pill");
    			add_location(span3, file$d, 33, 14, 1158);
    			attr_dev(i0, "class", "icon-placeholder mdi-24px mdi mdi-home");
    			add_location(i0, file$d, 34, 14, 1238);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$d, 32, 12, 1118);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "menu-link");
    			add_location(a3, file$d, 28, 10, 947);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$d, 27, 8, 867);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$d, 44, 16, 1642);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$d, 43, 12, 1599);
    			attr_dev(i1, "class", "icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type");
    			add_location(i1, file$d, 47, 16, 1757);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$d, 46, 12, 1715);
    			attr_dev(a4, "href", "/AtencionMedica/Resumen");
    			attr_dev(a4, "class", "menu-link");
    			add_location(a4, file$d, 42, 12, 1524);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$d, 41, 8, 1420);
    			attr_dev(span8, "class", "menu-name");
    			add_location(span8, file$d, 57, 16, 2208);
    			attr_dev(span9, "class", "menu-label");
    			add_location(span9, file$d, 56, 12, 2165);
    			attr_dev(i2, "class", "icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type");
    			add_location(i2, file$d, 60, 16, 2331);
    			attr_dev(span10, "class", "menu-icon");
    			add_location(span10, file$d, 59, 12, 2289);
    			attr_dev(a5, "href", "/AtencionMedica/EditarDatosAtencion");
    			attr_dev(a5, "class", "menu-link");
    			add_location(a5, file$d, 55, 12, 2078);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$d, 54, 8, 1962);
    			attr_dev(span11, "class", "menu-name");
    			add_location(span11, file$d, 70, 16, 2782);
    			attr_dev(span12, "class", "menu-label");
    			add_location(span12, file$d, 69, 12, 2739);
    			attr_dev(i3, "class", "icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type");
    			add_location(i3, file$d, 73, 16, 2906);
    			attr_dev(span13, "class", "menu-icon");
    			add_location(span13, file$d, 72, 12, 2864);
    			attr_dev(a6, "href", "/AtencionMedica/HistoriaClinica");
    			attr_dev(a6, "class", "menu-link");
    			add_location(a6, file$d, 68, 12, 2656);
    			attr_dev(li3, "class", "menu-item");
    			add_location(li3, file$d, 67, 8, 2544);
    			attr_dev(span14, "class", "menu-name");
    			add_location(span14, file$d, 83, 16, 3343);
    			attr_dev(span15, "class", "menu-info");
    			add_location(span15, file$d, 84, 16, 3405);
    			attr_dev(span16, "class", "menu-label");
    			add_location(span16, file$d, 82, 12, 3300);
    			attr_dev(i4, "class", "icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type");
    			add_location(i4, file$d, 87, 16, 3534);
    			attr_dev(span17, "class", "menu-icon");
    			add_location(span17, file$d, 86, 12, 3492);
    			attr_dev(a7, "href", "/AtencionMedica/NotasMedicas");
    			attr_dev(a7, "class", "menu-link");
    			add_location(a7, file$d, 81, 12, 3220);
    			attr_dev(li4, "class", "menu-item");
    			add_location(li4, file$d, 80, 8, 3111);
    			attr_dev(ul, "class", "menu");
    			add_location(ul, file$d, 25, 6, 807);
    			attr_dev(div2, "class", "admin-sidebar-wrapper js-scrollbar");
    			add_location(div2, file$d, 23, 4, 719);
    			attr_dev(aside, "class", "admin-sidebar");
    			add_location(aside, file$d, 5, 2, 128);
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
    			append_dev(ul, li3);
    			append_dev(li3, a6);
    			append_dev(a6, span12);
    			append_dev(span12, span11);
    			append_dev(a6, t16);
    			append_dev(a6, span13);
    			append_dev(span13, i3);
    			append_dev(ul, t17);
    			append_dev(ul, li4);
    			append_dev(li4, a7);
    			append_dev(a7, span16);
    			append_dev(span16, span14);
    			append_dev(span16, t19);
    			append_dev(span16, span15);
    			append_dev(a7, t21);
    			append_dev(a7, span17);
    			append_dev(span17, i4);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active$1.call(null, li0, { path: "/", className: "active" })),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active$1.call(null, li1, {
    						path: "/AtencionMedica/Resumen",
    						className: "active"
    					})),
    					action_destroyer(link_action_3 = link.call(null, a5)),
    					action_destroyer(active_action_2 = active$1.call(null, li2, {
    						path: "/AtencionMedica/EditarDatosAtencion",
    						className: "active"
    					})),
    					action_destroyer(link_action_4 = link.call(null, a6)),
    					action_destroyer(active_action_3 = active$1.call(null, li3, {
    						path: "/AtencionMedica/HistoriaClinica",
    						className: "active"
    					})),
    					action_destroyer(link_action_5 = link.call(null, a7)),
    					action_destroyer(active_action_4 = active$1.call(null, li4, {
    						path: "/AtencionMedica/NotasMedicas",
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AsideAtencion",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalTratamientos.svelte generated by Svelte v3.29.0 */

    const file$e = "src\\componentes\\Modals\\ModalTratamientos.svelte";

    function create_fragment$f(ctx) {
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
    			add_location(h5, file$e, 4, 16, 236);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$e, 6, 20, 430);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$e, 5, 16, 332);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$e, 3, 12, 192);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Medicamento");
    			attr_dev(input0, "data-toggle", "dropdown");
    			add_location(input0, file$e, 13, 28, 787);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control readonly");
    			input1.readOnly = true;
    			attr_dev(input1, "data-bind", "click: limpiarMedicamentoSeleccionado, \r\n                            class: (idMedicamentoSeleccionado() == '')? 'd-none': '',\r\n                            value: nombreMedicamentoSeleccionado");
    			add_location(input1, file$e, 16, 28, 941);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "data-bind", "text: descripcion, click: $parent.seleccionarMedicamento ");
    			add_location(a0, file$e, 23, 40, 1650);
    			add_location(li0, file$e, 22, 36, 1604);
    			attr_dev(div1, "class", "contenidoLista");
    			attr_dev(div1, "data-bind", "foreach: medicamentos");
    			add_location(div1, file$e, 21, 32, 1504);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$e, 28, 49, 1982);
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file$e, 28, 36, 1969);
    			attr_dev(li1, "class", "defecto");
    			add_location(li1, file$e, 27, 32, 1911);
    			attr_dev(ul, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul, "x-placement", "bottom-start");
    			set_style(ul, "position", "absolute");
    			set_style(ul, "will-change", "transform");
    			set_style(ul, "border-radius", "5px");
    			set_style(ul, "top", "0px");
    			set_style(ul, "left", "0px");
    			set_style(ul, "transform", "translate3d(0px, 36px, 0px)");
    			add_location(ul, file$e, 19, 28, 1236);
    			attr_dev(div2, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div2, file$e, 12, 24, 701);
    			attr_dev(div3, "class", "col-12");
    			add_location(div3, file$e, 11, 20, 655);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "data-bind", "value: dosis");
    			input2.required = true;
    			attr_dev(input2, "placeholder", "Cantidad dosis");
    			attr_dev(input2, "name", "");
    			add_location(input2, file$e, 39, 36, 2427);
    			attr_dev(div4, "class", "form-group buscardor dropdown");
    			add_location(div4, file$e, 38, 32, 2346);
    			attr_dev(div5, "class", "col-6");
    			add_location(div5, file$e, 37, 28, 2293);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$e, 51, 40, 3173);
    			select0.required = true;
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "data-bind", "options: unidades, \r\n                                    optionsCaption: '- Unidad de dosis -',\r\n                                    optionsValue: 'id',\r\n                                    optionsText: 'nombre',\r\n                                    value: unidadSeleccionada");
    			add_location(select0, file$e, 46, 36, 2805);
    			attr_dev(div6, "class", "form-group ");
    			add_location(div6, file$e, 45, 32, 2742);
    			attr_dev(div7, "class", "col-6");
    			add_location(div7, file$e, 44, 28, 2689);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$e, 36, 24, 2246);
    			attr_dev(div9, "class", "col-12");
    			add_location(div9, file$e, 35, 20, 2200);
    			option1.__value = "";
    			option1.value = option1.__value;
    			add_location(option1, file$e, 64, 40, 3828);
    			attr_dev(select1, "class", "form-control");
    			select1.required = true;
    			attr_dev(select1, "data-bind", "options: vias, value: viaSeleccionada, optionsCaption: 'Vía'");
    			add_location(select1, file$e, 62, 36, 3634);
    			attr_dev(div10, "class", "form-group ");
    			add_location(div10, file$e, 61, 32, 3571);
    			attr_dev(div11, "class", "col-6");
    			add_location(div11, file$e, 60, 28, 3518);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "name", "option");
    			attr_dev(input3, "data-bind", "checked: monodosis");
    			input3.value = "1";
    			attr_dev(input3, "class", "cstm-switch-input");
    			add_location(input3, file$e, 71, 40, 4196);
    			attr_dev(span1, "class", "cstm-switch-indicator bg-success ");
    			add_location(span1, file$e, 73, 40, 4387);
    			attr_dev(span2, "class", "cstm-switch-description");
    			add_location(span2, file$e, 74, 40, 4484);
    			attr_dev(label0, "class", "cstm-switch mt-2");
    			add_location(label0, file$e, 70, 36, 4122);
    			attr_dev(div12, "class", " m-b-10");
    			add_location(div12, file$e, 69, 32, 4063);
    			attr_dev(div13, "class", "col-6");
    			add_location(div13, file$e, 68, 28, 4010);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$e, 59, 24, 3471);
    			attr_dev(div15, "class", "col-12");
    			add_location(div15, file$e, 58, 20, 3425);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			input4.required = true;
    			attr_dev(input4, "placeholder", "Intervalo (Tiempo)");
    			attr_dev(input4, "max", "100000");
    			attr_dev(input4, "name", "");
    			add_location(input4, file$e, 85, 36, 4971);
    			attr_dev(div16, "class", "form-group buscardor dropdown");
    			add_location(div16, file$e, 84, 32, 4890);
    			attr_dev(div17, "class", "col-6");
    			add_location(div17, file$e, 83, 28, 4837);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", "Tiempo");
    			input5.value = "H";
    			attr_dev(input5, "class", "cstm-switch-input");
    			input5.checked = "checked";
    			add_location(input5, file$e, 92, 40, 5409);
    			attr_dev(span3, "class", "cstm-switch-indicator ");
    			add_location(span3, file$e, 94, 40, 5584);
    			attr_dev(span4, "class", "cstm-switch-description");
    			add_location(span4, file$e, 95, 40, 5670);
    			attr_dev(label1, "class", "cstm-switch mt-2");
    			add_location(label1, file$e, 91, 36, 5335);
    			attr_dev(input6, "type", "radio");
    			input6.value = "M";
    			attr_dev(input6, "class", "cstm-switch-input");
    			add_location(input6, file$e, 98, 40, 5879);
    			attr_dev(span5, "class", "cstm-switch-indicator ");
    			add_location(span5, file$e, 100, 40, 6022);
    			attr_dev(span6, "class", "cstm-switch-description");
    			add_location(span6, file$e, 101, 40, 6108);
    			attr_dev(label2, "class", "cstm-switch mt-2");
    			add_location(label2, file$e, 97, 36, 5805);
    			attr_dev(div18, "class", "m-b-10");
    			add_location(div18, file$e, 90, 32, 5277);
    			attr_dev(div19, "class", "col-6");
    			add_location(div19, file$e, 89, 28, 5224);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$e, 82, 24, 4790);
    			attr_dev(div21, "class", "col-12");
    			add_location(div21, file$e, 81, 20, 4744);
    			option2.selected = true;
    			option2.disabled = true;
    			option2.__value = "Diagnostico para el tratamiento";
    			option2.value = option2.__value;
    			add_location(option2, file$e, 114, 32, 6783);
    			select2.required = true;
    			attr_dev(select2, "class", "form-control");
    			attr_dev(select2, "data-bind", "options: parent.diagnosticos, \r\n                                optionsCaption: 'Diagnostico para el tratamiento',\r\n                                optionsText: 'problemaMedico',\r\n                                value: diagnostico");
    			add_location(select2, file$e, 110, 28, 6468);
    			attr_dev(div22, "class", "form-group ");
    			add_location(div22, file$e, 109, 24, 6413);
    			attr_dev(div23, "class", "col-12");
    			add_location(div23, file$e, 108, 20, 6367);
    			attr_dev(textarea, "class", "form-control mt-2");
    			attr_dev(textarea, "data-bind", "value: comentario");
    			attr_dev(textarea, "placeholder", "Comentarios");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$e, 121, 28, 7072);
    			attr_dev(div24, "class", "form-group");
    			add_location(div24, file$e, 120, 24, 7018);
    			attr_dev(div25, "class", "col-12");
    			add_location(div25, file$e, 119, 20, 6972);
    			attr_dev(div26, "class", "modal-body");
    			add_location(div26, file$e, 10, 16, 609);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-secondary");
    			attr_dev(button1, "data-dismiss", "modal");
    			add_location(button1, file$e, 129, 20, 7457);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-primary");
    			add_location(button2, file$e, 132, 20, 7611);
    			attr_dev(div27, "class", "modal-footer");
    			add_location(div27, file$e, 128, 16, 7409);
    			attr_dev(form, "data-bind", "submit: agregar");
    			attr_dev(form, "id", "formularioTratamiento");
    			add_location(form, file$e, 9, 12, 530);
    			attr_dev(div28, "class", "modal-content");
    			add_location(div28, file$e, 2, 8, 151);
    			attr_dev(div29, "class", "modal-dialog");
    			attr_dev(div29, "role", "document");
    			add_location(div29, file$e, 1, 4, 99);
    			attr_dev(div30, "class", "modal fade");
    			attr_dev(div30, "id", "modalTratamiento");
    			attr_dev(div30, "tabindex", "-1");
    			attr_dev(div30, "role", "dialog");
    			attr_dev(div30, "aria-hidden", "true");
    			add_location(div30, file$e, 0, 0, 0);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalTratamientos",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalInterconsulta.svelte generated by Svelte v3.29.0 */

    const file$f = "src\\componentes\\Modals\\ModalInterconsulta.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(h5, file$f, 5, 20, 361);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$f, 7, 24, 557);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "data-dismiss", "modal");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$f, 6, 20, 455);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$f, 4, 16, 313);
    			attr_dev(label0, "for", "");
    			attr_dev(label0, "class", "text-primary");
    			add_location(label0, file$f, 14, 32, 905);
    			attr_dev(textarea0, "class", "form-control");
    			attr_dev(textarea0, "data-bind", "value: resumen");
    			set_style(textarea0, "width", "100%");
    			set_style(textarea0, "display", "block");
    			set_style(textarea0, "height", "150px");
    			attr_dev(textarea0, "name", "Comentario");
    			add_location(textarea0, file$f, 15, 32, 989);
    			attr_dev(div1, "class", "form-group col-md-12");
    			add_location(div1, file$f, 13, 28, 837);
    			attr_dev(label1, "for", "");
    			attr_dev(label1, "class", "text-primary");
    			add_location(label1, file$f, 19, 32, 1299);
    			attr_dev(textarea1, "class", "form-control");
    			attr_dev(textarea1, "data-bind", "value: recomendaciones");
    			set_style(textarea1, "width", "100%");
    			set_style(textarea1, "display", "block");
    			set_style(textarea1, "height", "150px");
    			attr_dev(textarea1, "name", "Comentario");
    			add_location(textarea1, file$f, 20, 32, 1400);
    			attr_dev(div2, "class", "form-group col-md-12");
    			add_location(div2, file$f, 18, 28, 1231);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$f, 26, 36, 1839);
    			attr_dev(select0, "class", "form-control");
    			attr_dev(select0, "id", "sltDepartamentos");
    			set_style(select0, "width", "100%");
    			select0.required = true;
    			add_location(select0, file$f, 25, 32, 1720);
    			attr_dev(div3, "class", "form-group col-lg-12");
    			add_location(div3, file$f, 24, 28, 1652);
    			option1.__value = "";
    			option1.value = option1.__value;
    			add_location(option1, file$f, 31, 36, 2189);
    			attr_dev(select1, "class", "form-control");
    			attr_dev(select1, "id", "sltEspecialistasDepartamento");
    			set_style(select1, "width", "100%");
    			select1.required = true;
    			add_location(select1, file$f, 30, 32, 2058);
    			attr_dev(div4, "class", "form-group col-lg-12");
    			add_location(div4, file$f, 29, 28, 1990);
    			attr_dev(div5, "class", "form-row");
    			add_location(div5, file$f, 12, 24, 785);
    			attr_dev(form, "class", "floating-label col-md-12 show-label");
    			add_location(form, file$f, 11, 20, 709);
    			attr_dev(div6, "class", "modal-body");
    			add_location(div6, file$f, 10, 16, 663);
    			attr_dev(h30, "class", "mdi mdi-close-outline");
    			add_location(h30, file$f, 43, 32, 2670);
    			attr_dev(div7, "class", "text-overline");
    			add_location(div7, file$f, 44, 32, 2743);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "text-danger");
    			attr_dev(a0, "data-dismiss", "modal");
    			add_location(a0, file$f, 42, 28, 2583);
    			attr_dev(div8, "class", "col");
    			add_location(div8, file$f, 41, 24, 2536);
    			attr_dev(h31, "class", "mdi mdi-send");
    			add_location(h31, file$f, 49, 32, 3014);
    			attr_dev(div9, "class", "text-overline");
    			add_location(div9, file$f, 50, 32, 3078);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "data-bind", "click: crear");
    			attr_dev(a1, "class", "text-success");
    			add_location(a1, file$f, 48, 28, 2921);
    			attr_dev(div10, "class", "col");
    			add_location(div10, file$f, 47, 24, 2874);
    			attr_dev(div11, "class", "row text-center p-b-10");
    			add_location(div11, file$f, 40, 20, 2474);
    			attr_dev(div12, "class", "modal-footer");
    			add_location(div12, file$f, 39, 16, 2426);
    			attr_dev(div13, "class", "modal-content");
    			add_location(div13, file$f, 3, 12, 268);
    			attr_dev(div14, "class", "modal-dialog");
    			attr_dev(div14, "role", "document");
    			add_location(div14, file$f, 2, 8, 212);
    			attr_dev(div15, "class", "modal fade modal-slide-right");
    			attr_dev(div15, "id", "modalInterconsulta");
    			attr_dev(div15, "tabindex", "-1");
    			attr_dev(div15, "role", "dialog");
    			attr_dev(div15, "aria-labelledby", "modalInterconsulta");
    			set_style(div15, "display", "none");
    			set_style(div15, "padding-right", "16px");
    			attr_dev(div15, "aria-modal", "true");
    			add_location(div15, file$f, 0, 0, 0);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalInterconsulta",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\componentes\Modals\ModalAntecedentes.svelte generated by Svelte v3.29.0 */

    const file$g = "src\\componentes\\Modals\\ModalAntecedentes.svelte";

    function create_fragment$h(ctx) {
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
    			add_location(h5, file$g, 5, 16, 319);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$g, 7, 20, 499);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "close");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$g, 6, 16, 401);
    			attr_dev(i0, "class", "mdi mdi-check-all");
    			add_location(i0, file$g, 11, 112, 777);
    			add_location(i1, file$g, 12, 63, 844);
    			attr_dev(div0, "class", "guardando mr-2 text-success");
    			attr_dev(div0, "data-bind", "html: content, class: contentClass");
    			add_location(div0, file$g, 11, 24, 689);
    			attr_dev(div1, "class", "guardar-documento");
    			add_location(div1, file$g, 10, 20, 632);
    			set_style(div2, "margin-right", "40px");
    			add_location(div2, file$g, 9, 16, 577);
    			attr_dev(div3, "class", "modal-header");
    			add_location(div3, file$g, 4, 12, 275);
    			attr_dev(div4, "class", "card-title");
    			attr_dev(div4, "data-bind", "text: nombre");
    			add_location(div4, file$g, 22, 32, 1299);
    			attr_dev(div5, "class", "card-header");
    			add_location(div5, file$g, 21, 28, 1240);
    			attr_dev(i2, "class", "mdi mdi-plus");
    			add_location(i2, file$g, 27, 101, 1794);
    			attr_dev(span1, "data-bind", "text: nombre");
    			add_location(span1, file$g, 29, 40, 1909);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button1, "box-shadow", "none");
    			attr_dev(button1, "data-bind", "click: $parent.agregar");
    			add_location(button1, file$g, 26, 36, 1621);
    			attr_dev(div6, "class", "botones-antecedentes");
    			attr_dev(div6, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div6, file$g, 25, 32, 1501);
    			attr_dev(div7, "class", "col-lg-12");
    			attr_dev(div7, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div7, file$g, 36, 44, 2272);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$g, 35, 40, 2209);
    			attr_dev(div9, "class", "col-12");
    			add_location(div9, file$g, 34, 36, 2147);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$g, 33, 32, 2092);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$g, 24, 28, 1444);
    			attr_dev(div12, "class", "card  m-b-30");
    			set_style(div12, "box-shadow", "none");
    			set_style(div12, "border", "#32325d solid 1px");
    			add_location(div12, file$g, 20, 24, 1131);
    			attr_dev(div13, "class", "card-title");
    			attr_dev(div13, "data-bind", "text: nombre");
    			add_location(div13, file$g, 45, 32, 2740);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file$g, 44, 28, 2681);
    			attr_dev(i3, "class", "mdi mdi-plus");
    			add_location(i3, file$g, 50, 101, 3238);
    			attr_dev(span2, "data-bind", "text: nombre");
    			add_location(span2, file$g, 52, 40, 3353);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button2, "box-shadow", "none");
    			attr_dev(button2, "data-bind", "click: $parent.agregar");
    			add_location(button2, file$g, 49, 36, 3065);
    			attr_dev(div15, "class", "botones-antecedentes");
    			attr_dev(div15, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div15, file$g, 48, 32, 2945);
    			attr_dev(div16, "class", "col-lg-12");
    			attr_dev(div16, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div16, file$g, 59, 44, 3710);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$g, 58, 40, 3647);
    			attr_dev(div18, "class", "col-12");
    			add_location(div18, file$g, 57, 36, 3585);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$g, 56, 32, 3530);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$g, 47, 28, 2888);
    			attr_dev(div21, "class", "card  m-b-30");
    			set_style(div21, "box-shadow", "none");
    			set_style(div21, "border", "#32325d solid 1px");
    			add_location(div21, file$g, 43, 24, 2572);
    			attr_dev(div22, "class", "card-title");
    			attr_dev(div22, "data-bind", "text: nombre");
    			add_location(div22, file$g, 69, 32, 4180);
    			attr_dev(div23, "class", "card-header");
    			add_location(div23, file$g, 68, 28, 4121);
    			attr_dev(i4, "class", "mdi mdi-plus");
    			add_location(i4, file$g, 74, 101, 4677);
    			attr_dev(span3, "data-bind", "text: nombre");
    			add_location(span3, file$g, 76, 40, 4792);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button3, "box-shadow", "none");
    			attr_dev(button3, "data-bind", "click: $parent.agregar");
    			add_location(button3, file$g, 73, 36, 4504);
    			attr_dev(div24, "class", "botones-antecedentes");
    			attr_dev(div24, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div24, file$g, 72, 32, 4384);
    			attr_dev(i5, "class", "mdi mdi-history mdi-18px");
    			add_location(i5, file$g, 86, 80, 5507);
    			attr_dev(span4, "data-bind", "text: nombre");
    			add_location(span4, file$g, 86, 121, 5548);
    			attr_dev(div25, "class", "card-title");
    			add_location(div25, file$g, 86, 56, 5483);
    			attr_dev(div26, "class", "card-header");
    			add_location(div26, file$g, 85, 52, 5400);
    			attr_dev(i6, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i6, file$g, 92, 64, 6094);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$g, 91, 60, 5950);
    			attr_dev(i7, "class", "mdi mdi-trash-can-outline");
    			add_location(i7, file$g, 95, 148, 6462);
    			attr_dev(button4, "class", "dropdown-item text-danger");
    			attr_dev(button4, "data-bind", "click: eliminar");
    			attr_dev(button4, "type", "button");
    			add_location(button4, file$g, 95, 64, 6378);
    			attr_dev(div27, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div27, file$g, 94, 60, 6265);
    			attr_dev(div28, "class", "dropdown");
    			add_location(div28, file$g, 90, 56, 5866);
    			attr_dev(div29, "class", "card-controls");
    			add_location(div29, file$g, 89, 52, 5781);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "data-bind", "value: descripcion");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			set_style(textarea, "height", "100px");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$g, 101, 56, 6917);
    			attr_dev(div30, "class", "card-body");
    			add_location(div30, file$g, 100, 52, 6836);
    			attr_dev(div31, "class", "card m-b-20 mt-3");
    			set_style(div31, "box-shadow", "none");
    			set_style(div31, "border", "1px grey solid");
    			add_location(div31, file$g, 84, 48, 5266);
    			attr_dev(div32, "class", "col-lg-12");
    			attr_dev(div32, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div32, file$g, 83, 44, 5150);
    			attr_dev(div33, "class", "row");
    			add_location(div33, file$g, 82, 40, 5087);
    			attr_dev(div34, "class", "col-12");
    			add_location(div34, file$g, 81, 36, 5025);
    			attr_dev(div35, "class", "row");
    			add_location(div35, file$g, 80, 32, 4970);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$g, 71, 28, 4327);
    			attr_dev(div37, "class", "card  m-b-30");
    			set_style(div37, "box-shadow", "none");
    			set_style(div37, "border", "#32325d solid 1px");
    			add_location(div37, file$g, 67, 24, 4012);
    			attr_dev(div38, "class", "col-lg-12");
    			attr_dev(div38, "data-bind", "foreach: gruposAntecedentes");
    			add_location(div38, file$g, 18, 20, 1040);
    			attr_dev(div39, "class", "row");
    			add_location(div39, file$g, 17, 16, 1001);
    			attr_dev(div40, "class", "modal-body");
    			add_location(div40, file$g, 16, 12, 959);
    			attr_dev(div41, "class", "modal-content");
    			add_location(div41, file$g, 3, 8, 234);
    			attr_dev(div42, "class", "modal-dialog");
    			attr_dev(div42, "role", "document");
    			add_location(div42, file$g, 2, 4, 182);
    			attr_dev(div43, "class", "modal fade modal-slide-right");
    			attr_dev(div43, "id", "modalAntecedentes");
    			attr_dev(div43, "tabindex", "-1");
    			attr_dev(div43, "role", "dialog");
    			attr_dev(div43, "aria-labelledby", "modalAntecedentes");
    			set_style(div43, "display", "none");
    			attr_dev(div43, "aria-hidden", "true");
    			add_location(div43, file$g, 0, 0, 0);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props) {
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalAntecedentes",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\componentes\OrdenesMedicas.svelte generated by Svelte v3.29.0 */
    const file$h = "src\\componentes\\OrdenesMedicas.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (41:40) {#each medicamentos as medicamento}
    function create_each_block_1$1(ctx) {
    	let li;
    	let div;
    	let t0_value = /*medicamento*/ ctx[21].descripcion + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*medicamento*/ ctx[21], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "p-2");
    			set_style(div, "cursor", "pointer");
    			add_location(div, file$h, 42, 48, 2020);
    			add_location(li, file$h, 41, 44, 1966);
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
    			if (dirty & /*medicamentos*/ 8 && t0_value !== (t0_value = /*medicamento*/ ctx[21].descripcion + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(41:40) {#each medicamentos as medicamento}",
    		ctx
    	});

    	return block;
    }

    // (135:33) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(p, file$h, 138, 44, 8287);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$h, 137, 40, 8190);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$h, 142, 40, 8548);
    			attr_dev(div1, "class", "col-md-12 mt-3");
    			add_location(div1, file$h, 136, 36, 8120);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$h, 135, 33, 8065);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(135:33) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:28) {#each medicamentosSeleccionados as med, i}
    function create_each_block$4(ctx) {
    	let div9;
    	let div7;
    	let div0;
    	let p;
    	let t0_value = /*med*/ ctx[18].nombre + "";
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
    		/*input0_input_handler_1*/ ctx[10].call(input0, /*each_value*/ ctx[19], /*i*/ ctx[20]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[12].call(input1, /*each_value*/ ctx[19], /*i*/ ctx[20]);
    	}

    	function input2_input_handler() {
    		/*input2_input_handler*/ ctx[14].call(input2, /*each_value*/ ctx[19], /*i*/ ctx[20]);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[15](/*i*/ ctx[20], ...args);
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
    			add_location(p, file$h, 74, 45, 3955);
    			attr_dev(div0, "class", "col p-3");
    			set_style(div0, "display", "flex");
    			set_style(div0, "align-items", "center");
    			set_style(div0, "justify-content", "left");
    			add_location(div0, file$h, 70, 41, 3685);
    			set_style(label0, "margin", "0");
    			attr_dev(label0, "class", "form-label text-primary");
    			add_location(label0, file$h, 84, 49, 4596);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$h, 89, 49, 4947);
    			attr_dev(div1, "class", "mb-2");
    			add_location(div1, file$h, 82, 45, 4420);
    			attr_dev(div2, "class", "col mt-2");
    			add_location(div2, file$h, 81, 41, 4351);
    			set_style(label1, "margin", "0");
    			attr_dev(label1, "class", "form-label text-primary");
    			add_location(label1, file$h, 100, 49, 5715);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$h, 105, 49, 6054);
    			attr_dev(div3, "class", "mb-2");
    			add_location(div3, file$h, 98, 45, 5539);
    			attr_dev(div4, "class", "col mt-2");
    			add_location(div4, file$h, 97, 41, 5470);
    			set_style(label2, "margin", "0");
    			attr_dev(label2, "class", "form-label text-primary");
    			add_location(label2, file$h, 116, 49, 6817);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$h, 121, 49, 7158);
    			attr_dev(div5, "class", "mb-2");
    			add_location(div5, file$h, 114, 45, 6641);
    			attr_dev(div6, "class", "col mt-2");
    			add_location(div6, file$h, 113, 41, 6572);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$h, 69, 37, 3625);
    			attr_dev(i_1, "class", "mdi mdi-close text-red svelte-g4z6qg");
    			add_location(i_1, file$h, 131, 44, 7810);
    			attr_dev(div8, "class", "icon-borrar svelte-g4z6qg");
    			attr_dev(div8, "data-tooltip", "Eliminar");
    			add_location(div8, file$h, 130, 40, 7715);
    			attr_dev(div9, "class", "col-lg-12 border border-primary rounded mt-3");
    			add_location(div9, file$h, 66, 33, 3455);
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
    			set_input_value(input0, /*med*/ ctx[18].concentracion);
    			append_dev(div7, t4);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t6);
    			append_dev(div3, input1);
    			set_input_value(input1, /*med*/ ctx[18].cantidad);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label2);
    			append_dev(div5, t9);
    			append_dev(div5, input2);
    			set_input_value(input2, /*med*/ ctx[18].frecuencia);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			append_dev(div8, i_1);
    			append_dev(div9, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "blur", /*blur_handler*/ ctx[9], false, false, false),
    					listen_dev(input0, "input", input0_input_handler_1),
    					listen_dev(input1, "blur", /*blur_handler_1*/ ctx[11], false, false, false),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input2, "blur", /*blur_handler_2*/ ctx[13], false, false, false),
    					listen_dev(input2, "input", input2_input_handler),
    					listen_dev(i_1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*medicamentosSeleccionados*/ 4 && t0_value !== (t0_value = /*med*/ ctx[18].nombre + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*medicamentosSeleccionados*/ 4 && input0.value !== /*med*/ ctx[18].concentracion) {
    				set_input_value(input0, /*med*/ ctx[18].concentracion);
    			}

    			if (dirty & /*medicamentosSeleccionados*/ 4 && input1.value !== /*med*/ ctx[18].cantidad) {
    				set_input_value(input1, /*med*/ ctx[18].cantidad);
    			}

    			if (dirty & /*medicamentosSeleccionados*/ 4 && input2.value !== /*med*/ ctx[18].frecuencia) {
    				set_input_value(input2, /*med*/ ctx[18].frecuencia);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(65:28) {#each medicamentosSeleccionados as med, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div32;
    	let h4;
    	let t1;
    	let div10;
    	let div1;
    	let div0;
    	let t3;
    	let div9;
    	let div8;
    	let div7;
    	let div6;
    	let div4;
    	let div3;
    	let input0;
    	let t4;
    	let ul0;
    	let div2;
    	let t5;
    	let li0;
    	let a0;
    	let i0;
    	let t6;
    	let t7;
    	let div5;
    	let t8;
    	let div25;
    	let div12;
    	let div11;
    	let t10;
    	let div15;
    	let div14;
    	let a1;
    	let i1;
    	let t11;
    	let div13;
    	let button0;
    	let i2;
    	let t12;
    	let t13;
    	let button1;
    	let i3;
    	let t14;
    	let t15;
    	let div24;
    	let div23;
    	let div20;
    	let form;
    	let div18;
    	let div17;
    	let input1;
    	let t16;
    	let input2;
    	let t17;
    	let ul1;
    	let div16;
    	let t18;
    	let li1;
    	let a2;
    	let i4;
    	let t19;
    	let t20;
    	let div19;
    	let button2;
    	let i5;
    	let t21;
    	let div22;
    	let div21;
    	let p;
    	let t23;
    	let ul2;
    	let t24;
    	let div31;
    	let div27;
    	let div26;
    	let t26;
    	let div30;
    	let div29;
    	let div28;
    	let textarea;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*medicamentos*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*medicamentosSeleccionados*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let each1_else = null;

    	if (!each_value.length) {
    		each1_else = create_else_block$1(ctx);
    	}

    	const block = {
    		c: function create() {
    			div32 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Ordenes Medicas";
    			t1 = space();
    			div10 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Medicamentos";
    			t3 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			input0 = element("input");
    			t4 = space();
    			ul0 = element("ul");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			li0 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			t6 = text("Agregar manualmente");
    			t7 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each1_else) {
    				each1_else.c();
    			}

    			t8 = space();
    			div25 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Estudios";
    			t10 = space();
    			div15 = element("div");
    			div14 = element("div");
    			a1 = element("a");
    			i1 = element("i");
    			t11 = space();
    			div13 = element("div");
    			button0 = element("button");
    			i2 = element("i");
    			t12 = text("\r\n                        Imprimir estudios");
    			t13 = space();
    			button1 = element("button");
    			i3 = element("i");
    			t14 = text("\r\n                        Agregar nuevo estudio");
    			t15 = space();
    			div24 = element("div");
    			div23 = element("div");
    			div20 = element("div");
    			form = element("form");
    			div18 = element("div");
    			div17 = element("div");
    			input1 = element("input");
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			ul1 = element("ul");
    			div16 = element("div");
    			t18 = space();
    			li1 = element("li");
    			a2 = element("a");
    			i4 = element("i");
    			t19 = text(" Agregar manualmente");
    			t20 = space();
    			div19 = element("div");
    			button2 = element("button");
    			i5 = element("i");
    			t21 = space();
    			div22 = element("div");
    			div21 = element("div");
    			p = element("p");
    			p.textContent = "No tienes agregado ningún estudio";
    			t23 = space();
    			ul2 = element("ul");
    			t24 = space();
    			div31 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			div26.textContent = "Instrucciones";
    			t26 = space();
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			textarea = element("textarea");
    			attr_dev(h4, "class", "alert-heading");
    			add_location(h4, file$h, 12, 4, 322);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$h, 15, 12, 453);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$h, 14, 8, 414);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "data-toggle", "dropdown");
    			attr_dev(input0, "aria-haspopup", "true");
    			attr_dev(input0, "aria-expanded", "true");
    			attr_dev(input0, "placeholder", "Buscar medicamentos");
    			add_location(input0, file$h, 23, 32, 794);
    			attr_dev(div2, "class", "contenidoLista");
    			add_location(div2, file$h, 39, 36, 1815);
    			attr_dev(i0, "class", "mdi mdi-plus");
    			add_location(i0, file$h, 55, 45, 2907);
    			attr_dev(a0, "href", "#!");
    			add_location(a0, file$h, 53, 40, 2722);
    			attr_dev(li0, "class", "defecto");
    			add_location(li0, file$h, 52, 36, 2660);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$h, 33, 32, 1381);
    			attr_dev(div3, "class", "dropdown");
    			add_location(div3, file$h, 22, 28, 738);
    			attr_dev(div4, "class", "col-lg-6");
    			add_location(div4, file$h, 21, 24, 686);
    			attr_dev(div5, "class", "col-lg-12");
    			add_location(div5, file$h, 63, 24, 3268);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$h, 20, 20, 643);
    			attr_dev(div7, "class", "col-md-12 mb-2");
    			add_location(div7, file$h, 19, 16, 593);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$h, 18, 12, 558);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$h, 17, 8, 521);
    			attr_dev(div10, "class", "card m-b-20 mt-3");
    			add_location(div10, file$h, 13, 4, 374);
    			attr_dev(div11, "class", "card-title");
    			add_location(div11, file$h, 157, 12, 8942);
    			attr_dev(div12, "class", "card-header");
    			add_location(div12, file$h, 156, 8, 8903);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$h, 167, 20, 9302);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "data-toggle", "dropdown");
    			attr_dev(a1, "aria-haspopup", "true");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file$h, 161, 16, 9100);
    			attr_dev(i2, "class", "mdi mdi-printer");
    			add_location(i2, file$h, 171, 25, 9535);
    			attr_dev(button0, "class", "dropdown-item text-primary");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$h, 170, 20, 9452);
    			attr_dev(i3, "class", "mdi mdi-plus");
    			add_location(i3, file$h, 175, 25, 9743);
    			attr_dev(button1, "class", "dropdown-item text-success");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$h, 174, 20, 9660);
    			attr_dev(div13, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div13, file$h, 169, 16, 9383);
    			attr_dev(div14, "class", "dropdown dropdown-vnc");
    			add_location(div14, file$h, 160, 12, 9047);
    			attr_dev(div15, "class", "card-controls");
    			add_location(div15, file$h, 159, 8, 9006);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "name", "");
    			attr_dev(input1, "data-toggle", "dropdown");
    			attr_dev(input1, "aria-haspopup", "true");
    			attr_dev(input1, "aria-expanded", "false");
    			add_location(input1, file$h, 190, 32, 10321);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control readonly d-none");
    			attr_dev(input2, "name", "");
    			input2.readOnly = "";
    			attr_dev(input2, "aria-haspopup", "true");
    			attr_dev(input2, "aria-expanded", "true");
    			add_location(input2, file$h, 198, 32, 10726);
    			attr_dev(div16, "class", "contenidoLista");
    			attr_dev(div16, "data-bind", "foreach: listado");
    			add_location(div16, file$h, 212, 36, 11570);
    			attr_dev(i4, "class", "mdi mdi-plus");
    			add_location(i4, file$h, 220, 45, 12034);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "data-bind", "click: agregarManualmente");
    			add_location(a2, file$h, 217, 40, 11848);
    			attr_dev(li1, "class", "defecto");
    			add_location(li1, file$h, 216, 36, 11786);
    			attr_dev(ul1, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul1, "id", "buscador");
    			attr_dev(ul1, "x-placement", "bottom-start");
    			set_style(ul1, "position", "absolute");
    			set_style(ul1, "will-change", "transform");
    			set_style(ul1, "border-radius", "5px");
    			set_style(ul1, "top", "0px");
    			set_style(ul1, "left", "0px");
    			set_style(ul1, "transform", "translate3d(0px, 36px, 0px)");
    			add_location(ul1, file$h, 206, 32, 11135);
    			attr_dev(div17, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div17, file$h, 187, 28, 10168);
    			attr_dev(div18, "class", "col-lg-11 col-md-12");
    			add_location(div18, file$h, 186, 24, 10105);
    			attr_dev(i5, "class", "mdi mdi-plus");
    			add_location(i5, file$h, 234, 33, 12749);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-success btn-block mb-3");
    			attr_dev(button2, "data-toggle", "tooltip");
    			attr_dev(button2, "data-placement", "right");
    			attr_dev(button2, "title", "");
    			attr_dev(button2, "data-original-title", "Agregar estudio");
    			add_location(button2, file$h, 227, 28, 12364);
    			attr_dev(div19, "class", "col-lg-1 col-md-12");
    			add_location(div19, file$h, 226, 24, 12302);
    			attr_dev(form, "class", "row");
    			attr_dev(form, "data-bind", "submit: agregar");
    			add_location(form, file$h, 185, 20, 10033);
    			attr_dev(div20, "class", "col-12");
    			add_location(div20, file$h, 184, 16, 9991);
    			attr_dev(p, "class", "alert-body text-center mt-3");
    			add_location(p, file$h, 242, 24, 13041);
    			attr_dev(div21, "class", "alert border alert-light");
    			attr_dev(div21, "role", "alert");
    			add_location(div21, file$h, 241, 20, 12964);
    			attr_dev(ul2, "class", "list-info");
    			attr_dev(ul2, "data-bind", "foreach: estudios");
    			add_location(ul2, file$h, 246, 20, 13223);
    			attr_dev(div22, "class", "col-md-12");
    			add_location(div22, file$h, 240, 16, 12919);
    			attr_dev(div23, "class", "row");
    			add_location(div23, file$h, 183, 12, 9956);
    			attr_dev(div24, "class", "card-body");
    			add_location(div24, file$h, 182, 8, 9919);
    			attr_dev(div25, "class", "card m-b-20");
    			add_location(div25, file$h, 155, 4, 8868);
    			attr_dev(div26, "class", "card-title");
    			add_location(div26, file$h, 254, 12, 13431);
    			attr_dev(div27, "class", "card-header");
    			add_location(div27, file$h, 253, 8, 13392);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$h, 259, 20, 13614);
    			attr_dev(div28, "class", "col-12");
    			add_location(div28, file$h, 258, 16, 13572);
    			attr_dev(div29, "class", "row");
    			add_location(div29, file$h, 257, 12, 13537);
    			attr_dev(div30, "class", "card-body");
    			add_location(div30, file$h, 256, 8, 13500);
    			attr_dev(div31, "class", "card m-b-20");
    			add_location(div31, file$h, 252, 4, 13357);
    			attr_dev(div32, "class", "alert alert-secondary");
    			attr_dev(div32, "role", "alert");
    			add_location(div32, file$h, 11, 0, 268);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div32, anchor);
    			append_dev(div32, h4);
    			append_dev(div32, t1);
    			append_dev(div32, div10);
    			append_dev(div10, div1);
    			append_dev(div1, div0);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, input0);
    			set_input_value(input0, /*sltBuscarMedicamentos*/ ctx[1]);
    			append_dev(div3, t4);
    			append_dev(div3, ul0);
    			append_dev(ul0, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(ul0, t5);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			if (each1_else) {
    				each1_else.m(div5, null);
    			}

    			append_dev(div32, t8);
    			append_dev(div32, div25);
    			append_dev(div25, div12);
    			append_dev(div12, div11);
    			append_dev(div25, t10);
    			append_dev(div25, div15);
    			append_dev(div15, div14);
    			append_dev(div14, a1);
    			append_dev(a1, i1);
    			append_dev(div14, t11);
    			append_dev(div14, div13);
    			append_dev(div13, button0);
    			append_dev(button0, i2);
    			append_dev(button0, t12);
    			append_dev(div13, t13);
    			append_dev(div13, button1);
    			append_dev(button1, i3);
    			append_dev(button1, t14);
    			append_dev(div25, t15);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div20);
    			append_dev(div20, form);
    			append_dev(form, div18);
    			append_dev(div18, div17);
    			append_dev(div17, input1);
    			append_dev(div17, t16);
    			append_dev(div17, input2);
    			append_dev(div17, t17);
    			append_dev(div17, ul1);
    			append_dev(ul1, div16);
    			append_dev(ul1, t18);
    			append_dev(ul1, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i4);
    			append_dev(a2, t19);
    			append_dev(form, t20);
    			append_dev(form, div19);
    			append_dev(div19, button2);
    			append_dev(button2, i5);
    			append_dev(div23, t21);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, p);
    			append_dev(div22, t23);
    			append_dev(div22, ul2);
    			append_dev(div32, t24);
    			append_dev(div32, div31);
    			append_dev(div31, div27);
    			append_dev(div27, div26);
    			append_dev(div31, t26);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, textarea);
    			set_input_value(textarea, /*instrucciones*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input0, "input", /*input_handler*/ ctx[6], false, false, false),
    					listen_dev(a0, "click", prevent_default(/*click_handler_1*/ ctx[8]), false, true, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[16]),
    					listen_dev(textarea, "blur", /*blur_handler_3*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sltBuscarMedicamentos*/ 2 && input0.value !== /*sltBuscarMedicamentos*/ ctx[1]) {
    				set_input_value(input0, /*sltBuscarMedicamentos*/ ctx[1]);
    			}

    			if (dirty & /*dispatch, medicamentos*/ 24) {
    				each_value_1 = /*medicamentos*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*dispatch, medicamentosSeleccionados*/ 20) {
    				each_value = /*medicamentosSeleccionados*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (each_value.length) {
    					if (each1_else) {
    						each1_else.d(1);
    						each1_else = null;
    					}
    				} else if (!each1_else) {
    					each1_else = create_else_block$1(ctx);
    					each1_else.c();
    					each1_else.m(div5, null);
    				}
    			}

    			if (dirty & /*instrucciones*/ 1) {
    				set_input_value(textarea, /*instrucciones*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div32);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (each1_else) each1_else.d();
    			mounted = false;
    			run_all(dispose);
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

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OrdenesMedicas", slots, []);
    	let dispatch = createEventDispatcher();
    	let { instrucciones } = $$props;
    	let { medicamentos } = $$props;
    	let { sltBuscarMedicamentos } = $$props;
    	let { medicamentosSeleccionados } = $$props;

    	const writable_props = [
    		"instrucciones",
    		"medicamentos",
    		"sltBuscarMedicamentos",
    		"medicamentosSeleccionados"
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

    	function input0_input_handler_1(each_value, i) {
    		each_value[i].concentracion = this.value;
    		$$invalidate(2, medicamentosSeleccionados);
    	}

    	const blur_handler_1 = () => dispatch("modificado");

    	function input1_input_handler(each_value, i) {
    		each_value[i].cantidad = this.value;
    		$$invalidate(2, medicamentosSeleccionados);
    	}

    	const blur_handler_2 = () => dispatch("modificado");

    	function input2_input_handler(each_value, i) {
    		each_value[i].frecuencia = this.value;
    		$$invalidate(2, medicamentosSeleccionados);
    	}

    	const click_handler_2 = i => dispatch("eliminarMedicamento", i);

    	function textarea_input_handler() {
    		instrucciones = this.value;
    		$$invalidate(0, instrucciones);
    	}

    	const blur_handler_3 = () => dispatch("modificado");

    	$$self.$$set = $$props => {
    		if ("instrucciones" in $$props) $$invalidate(0, instrucciones = $$props.instrucciones);
    		if ("medicamentos" in $$props) $$invalidate(3, medicamentos = $$props.medicamentos);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(1, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(2, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		instrucciones,
    		medicamentos,
    		sltBuscarMedicamentos,
    		medicamentosSeleccionados
    	});

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) $$invalidate(4, dispatch = $$props.dispatch);
    		if ("instrucciones" in $$props) $$invalidate(0, instrucciones = $$props.instrucciones);
    		if ("medicamentos" in $$props) $$invalidate(3, medicamentos = $$props.medicamentos);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(1, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(2, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		instrucciones,
    		sltBuscarMedicamentos,
    		medicamentosSeleccionados,
    		medicamentos,
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
    		textarea_input_handler,
    		blur_handler_3
    	];
    }

    class OrdenesMedicas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			instrucciones: 0,
    			medicamentos: 3,
    			sltBuscarMedicamentos: 1,
    			medicamentosSeleccionados: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OrdenesMedicas",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*instrucciones*/ ctx[0] === undefined && !("instrucciones" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'instrucciones'");
    		}

    		if (/*medicamentos*/ ctx[3] === undefined && !("medicamentos" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'medicamentos'");
    		}

    		if (/*sltBuscarMedicamentos*/ ctx[1] === undefined && !("sltBuscarMedicamentos" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'sltBuscarMedicamentos'");
    		}

    		if (/*medicamentosSeleccionados*/ ctx[2] === undefined && !("medicamentosSeleccionados" in props)) {
    			console.warn("<OrdenesMedicas> was created without expected prop 'medicamentosSeleccionados'");
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

    	get medicamentosSeleccionados() {
    		throw new Error("<OrdenesMedicas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set medicamentosSeleccionados(value) {
    		throw new Error("<OrdenesMedicas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\componentes\SignosVitales.svelte generated by Svelte v3.29.0 */

    function create_fragment$j(ctx) {
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SignosVitales",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\Pages\AtencionMedica\HistoriaClinica.svelte generated by Svelte v3.29.0 */

    const { console: console_1$5 } = globals;
    const file$i = "src\\Pages\\AtencionMedica\\HistoriaClinica.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[54] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[57] = list[i];
    	return child_ctx;
    }

    // (222:16) {#if !cargando}
    function create_if_block_2$1(ctx) {
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
    			add_location(i0, file$i, 225, 24, 7372);
    			add_location(i1, file$i, 225, 56, 7404);
    			attr_dev(div, "class", "guardando mr-2 text-success");
    			add_location(div, file$i, 222, 20, 7258);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(222:16) {#if !cargando}",
    		ctx
    	});

    	return block;
    }

    // (229:16) {#if cargando}
    function create_if_block_1$2(ctx) {
    	let div;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t = text(" Guardando");
    			attr_dev(i, "class", "mdi mdi-cached mdi-spin");
    			add_location(i, file$i, 232, 24, 7648);
    			attr_dev(div, "class", "guardando mr-2 text-secondary");
    			add_location(div, file$i, 229, 20, 7532);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(229:16) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    // (666:40) {#each filtroDiagnostico as diagnostico}
    function create_each_block_1$2(ctx) {
    	let li;
    	let div;
    	let span;
    	let t0_value = /*diagnostico*/ ctx[57].c + "";
    	let t0;
    	let t1;
    	let t2_value = /*diagnostico*/ ctx[57].d + "";
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[39](/*diagnostico*/ ctx[57], ...args);
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
    			add_location(span, file$i, 674, 52, 31020);
    			attr_dev(div, "class", "p-2");
    			add_location(div, file$i, 667, 48, 30561);
    			add_location(li, file$i, 666, 44, 30507);
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
    			if (dirty[0] & /*filtroDiagnostico*/ 32768 && t0_value !== (t0_value = /*diagnostico*/ ctx[57].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*filtroDiagnostico*/ 32768 && t2_value !== (t2_value = /*diagnostico*/ ctx[57].d + "")) set_data_dev(t2, t2_value);
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
    		source: "(666:40) {#each filtroDiagnostico as diagnostico}",
    		ctx
    	});

    	return block;
    }

    // (696:32) {#each diagnosticosSeleccionados as item}
    function create_each_block$5(ctx) {
    	let li;
    	let span0;
    	let t0_value = /*item*/ ctx[54].c + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*item*/ ctx[54].d + "";
    	let t2;
    	let t3;
    	let div;
    	let a0;
    	let i0;
    	let t4;
    	let a1;
    	let i1;

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
    			attr_dev(span0, "class", "badge badge-primary");
    			add_location(span0, file$i, 697, 40, 32245);
    			add_location(span1, file$i, 699, 47, 32388);
    			attr_dev(i0, "class", "mdi-18px mdi mdi-comment-plus-outline");
    			add_location(i0, file$i, 707, 49, 32965);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "text-primary");
    			attr_dev(a0, "title", "Agregar comentarios");
    			add_location(a0, file$i, 703, 44, 32706);
    			attr_dev(i1, "class", "mdi-18px mdi mdi-trash-can-outline");
    			add_location(i1, file$i, 717, 49, 33628);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "text-danger");
    			attr_dev(a1, "data-toggle", "tooltip");
    			attr_dev(a1, "data-placement", "top");
    			attr_dev(a1, "data-original-title", "Eliminar diagnostico");
    			add_location(a1, file$i, 711, 44, 33214);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", "0");
    			set_style(div, "right", "0");
    			set_style(div, "padding", "10px");
    			set_style(div, "background-color", "white");
    			set_style(div, "border-bottom-left-radius", "5px");
    			add_location(div, file$i, 700, 40, 32451);
    			add_location(li, file$i, 696, 36, 32199);
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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 16 && t0_value !== (t0_value = /*item*/ ctx[54].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 16 && t2_value !== (t2_value = /*item*/ ctx[54].d + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(696:32) {#each diagnosticosSeleccionados as item}",
    		ctx
    	});

    	return block;
    }

    // (725:32) {#if diagnosticosSeleccionados.length === 0}
    function create_if_block$3(ctx) {
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
    			add_location(p, file$i, 731, 48, 34449);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$i, 727, 44, 34204);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$i, 738, 44, 34887);
    			attr_dev(div1, "class", "col-md-12");
    			add_location(div1, file$i, 726, 40, 34135);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$i, 725, 36, 34076);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(725:32) {#if diagnosticosSeleccionados.length === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let asideatencion;
    	let t0;
    	let div6;
    	let div5;
    	let div0;
    	let h50;
    	let span0;
    	let t2;
    	let span1;
    	let t3_value = /*paciente*/ ctx[0].nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*paciente*/ ctx[0].apellidos + "";
    	let t5;
    	let t6;
    	let div2;
    	let div1;
    	let t7;
    	let t8;
    	let div4;
    	let div3;
    	let button0;
    	let i0;
    	let t9;
    	let sapn0;
    	let t11;
    	let button1;
    	let i1;
    	let t12;
    	let sapn1;
    	let t14;
    	let button2;
    	let i2;
    	let t15;
    	let sapn2;
    	let t17;
    	let button3;
    	let i3;
    	let t18;
    	let sapn3;
    	let t20;
    	let header;
    	let t21;
    	let main;
    	let div98;
    	let div97;
    	let div10;
    	let div8;
    	let div7;
    	let t23;
    	let div9;
    	let textarea0;
    	let t24;
    	let div14;
    	let div12;
    	let div11;
    	let t26;
    	let div13;
    	let textarea1;
    	let t27;
    	let div64;
    	let div16;
    	let div15;
    	let t29;
    	let div63;
    	let div62;
    	let div21;
    	let div20;
    	let label0;
    	let i4;
    	let t30;
    	let t31;
    	let div19;
    	let div17;
    	let input0;
    	let t32;
    	let div18;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t36;
    	let div25;
    	let div24;
    	let label1;
    	let i5;
    	let t37;
    	let t38;
    	let div23;
    	let div22;
    	let input1;
    	let t39;
    	let div29;
    	let div28;
    	let label2;
    	let i6;
    	let t40;
    	let t41;
    	let div27;
    	let div26;
    	let input2;
    	let t42;
    	let div34;
    	let div33;
    	let label3;
    	let i7;
    	let t43;
    	let t44;
    	let div32;
    	let div30;
    	let input3;
    	let t45;
    	let div31;
    	let input4;
    	let t46;
    	let div61;
    	let h51;
    	let t48;
    	let hr;
    	let t49;
    	let div60;
    	let div39;
    	let div38;
    	let label4;
    	let i8;
    	let t50;
    	let t51;
    	let div37;
    	let div35;
    	let input5;
    	let t52;
    	let div36;
    	let select1;
    	let option3;
    	let option4;
    	let t55;
    	let div45;
    	let div44;
    	let label5;
    	let i9;
    	let t56;
    	let t57;
    	let div43;
    	let div42;
    	let div41;
    	let input6;
    	let t58;
    	let div40;
    	let span2;
    	let t60;
    	let div51;
    	let div50;
    	let label6;
    	let i10;
    	let t61;
    	let t62;
    	let div49;
    	let div48;
    	let div47;
    	let input7;
    	let t63;
    	let div46;
    	let span3;
    	let t65;
    	let div55;
    	let div54;
    	let label7;
    	let i11;
    	let t66;
    	let t67;
    	let div53;
    	let div52;
    	let input8;
    	let t68;
    	let div59;
    	let div58;
    	let label8;
    	let t70;
    	let div57;
    	let div56;
    	let input9;
    	let t71;
    	let div71;
    	let div66;
    	let div65;
    	let t73;
    	let div69;
    	let div68;
    	let a0;
    	let i12;
    	let t74;
    	let div67;
    	let button4;
    	let t76;
    	let button5;
    	let t78;
    	let button6;
    	let t80;
    	let div70;
    	let textarea2;
    	let t81;
    	let div83;
    	let div73;
    	let div72;
    	let t83;
    	let div76;
    	let div75;
    	let a1;
    	let i13;
    	let t84;
    	let div74;
    	let button7;
    	let i14;
    	let t85;
    	let t86;
    	let div82;
    	let div81;
    	let div79;
    	let div78;
    	let input10;
    	let t87;
    	let ul0;
    	let div77;
    	let t88;
    	let li;
    	let a2;
    	let i15;
    	let t89;
    	let t90;
    	let div80;
    	let ul1;
    	let t91;
    	let t92;
    	let ordenesmedicas;
    	let updating_medicamentosSeleccionados;
    	let updating_sltBuscarMedicamentos;
    	let updating_medicamentos;
    	let updating_instrucciones;
    	let t93;
    	let div87;
    	let div85;
    	let div84;
    	let t95;
    	let div86;
    	let textarea3;
    	let t96;
    	let div96;
    	let div95;
    	let div94;
    	let div89;
    	let div88;
    	let t98;
    	let div93;
    	let div92;
    	let div90;
    	let label9;
    	let t100;
    	let input11;
    	let t101;
    	let div91;
    	let label10;
    	let t103;
    	let input12;
    	let t104;
    	let modaldatospaciente;
    	let t105;
    	let modaltratamientos;
    	let t106;
    	let modalinterconsulta;
    	let t107;
    	let modalantecedentes;
    	let current;
    	let mounted;
    	let dispose;
    	asideatencion = new AsideAtencion({ $$inline: true });
    	let if_block0 = !/*cargando*/ ctx[12] && create_if_block_2$1(ctx);
    	let if_block1 = /*cargando*/ ctx[12] && create_if_block_1$2(ctx);
    	header = new Header({ $$inline: true });
    	let each_value_1 = /*filtroDiagnostico*/ ctx[15];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*diagnosticosSeleccionados*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	let if_block2 = /*diagnosticosSeleccionados*/ ctx[4].length === 0 && create_if_block$3(ctx);

    	function ordenesmedicas_medicamentosSeleccionados_binding(value) {
    		/*ordenesmedicas_medicamentosSeleccionados_binding*/ ctx[40].call(null, value);
    	}

    	function ordenesmedicas_sltBuscarMedicamentos_binding(value) {
    		/*ordenesmedicas_sltBuscarMedicamentos_binding*/ ctx[41].call(null, value);
    	}

    	function ordenesmedicas_medicamentos_binding(value) {
    		/*ordenesmedicas_medicamentos_binding*/ ctx[42].call(null, value);
    	}

    	function ordenesmedicas_instrucciones_binding(value) {
    		/*ordenesmedicas_instrucciones_binding*/ ctx[43].call(null, value);
    	}

    	let ordenesmedicas_props = {};

    	if (/*medicamentosSeleccionados*/ ctx[14] !== void 0) {
    		ordenesmedicas_props.medicamentosSeleccionados = /*medicamentosSeleccionados*/ ctx[14];
    	}

    	if (/*sltBuscarMedicamentos*/ ctx[13] !== void 0) {
    		ordenesmedicas_props.sltBuscarMedicamentos = /*sltBuscarMedicamentos*/ ctx[13];
    	}

    	if (/*medicamentos*/ ctx[5] !== void 0) {
    		ordenesmedicas_props.medicamentos = /*medicamentos*/ ctx[5];
    	}

    	if (/*historia*/ ctx[6].instrucciones !== void 0) {
    		ordenesmedicas_props.instrucciones = /*historia*/ ctx[6].instrucciones;
    	}

    	ordenesmedicas = new OrdenesMedicas({
    			props: ordenesmedicas_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(ordenesmedicas, "medicamentosSeleccionados", ordenesmedicas_medicamentosSeleccionados_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "sltBuscarMedicamentos", ordenesmedicas_sltBuscarMedicamentos_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "medicamentos", ordenesmedicas_medicamentos_binding));
    	binding_callbacks.push(() => bind(ordenesmedicas, "instrucciones", ordenesmedicas_instrucciones_binding));
    	ordenesmedicas.$on("modificado", /*guardarHistoria*/ ctx[20]);
    	ordenesmedicas.$on("buscarMedicamentos", /*searchMedicamentos*/ ctx[16]);
    	ordenesmedicas.$on("agregarMedicamento", /*agregarMedicamento*/ ctx[19]);
    	ordenesmedicas.$on("eliminarMedicamento", /*eliminarMedicamento*/ ctx[18]);

    	modaldatospaciente = new ModalDatosPaciente({
    			props: {
    				paciente: /*paciente*/ ctx[0],
    				edad: /*edad*/ ctx[1],
    				seguro: /*seguro*/ ctx[2]
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
    			div5 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			span0 = element("span");
    			span0.textContent = "Historia Clinica";
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t9 = space();
    			sapn0 = element("sapn");
    			sapn0.textContent = "Datos del Paciente";
    			t11 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t12 = space();
    			sapn1 = element("sapn");
    			sapn1.textContent = "Agregar Campo";
    			t14 = space();
    			button2 = element("button");
    			i2 = element("i");
    			t15 = space();
    			sapn2 = element("sapn");
    			sapn2.textContent = "Imprimir";
    			t17 = space();
    			button3 = element("button");
    			i3 = element("i");
    			t18 = space();
    			sapn3 = element("sapn");
    			sapn3.textContent = "Anular";
    			t20 = space();
    			create_component(header.$$.fragment);
    			t21 = space();
    			main = element("main");
    			div98 = element("div");
    			div97 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = "Motivo de consulta";
    			t23 = space();
    			div9 = element("div");
    			textarea0 = element("textarea");
    			t24 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Historia de la enfermedad";
    			t26 = space();
    			div13 = element("div");
    			textarea1 = element("textarea");
    			t27 = space();
    			div64 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div15.textContent = "Signos vitales";
    			t29 = space();
    			div63 = element("div");
    			div62 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			label0 = element("label");
    			i4 = element("i");
    			t30 = text(" Temperatura");
    			t31 = space();
    			div19 = element("div");
    			div17 = element("div");
    			input0 = element("input");
    			t32 = space();
    			div18 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "°C";
    			option1 = element("option");
    			option1.textContent = "°K";
    			option2 = element("option");
    			option2.textContent = "°F";
    			t36 = space();
    			div25 = element("div");
    			div24 = element("div");
    			label1 = element("label");
    			i5 = element("i");
    			t37 = text(" Frecuencia\r\n                                    respiratoria");
    			t38 = space();
    			div23 = element("div");
    			div22 = element("div");
    			input1 = element("input");
    			t39 = space();
    			div29 = element("div");
    			div28 = element("div");
    			label2 = element("label");
    			i6 = element("i");
    			t40 = text(" Frecuencia\r\n                                    cardiaca");
    			t41 = space();
    			div27 = element("div");
    			div26 = element("div");
    			input2 = element("input");
    			t42 = space();
    			div34 = element("div");
    			div33 = element("div");
    			label3 = element("label");
    			i7 = element("i");
    			t43 = text(" Presion\r\n                                    alterial (mmHg)");
    			t44 = space();
    			div32 = element("div");
    			div30 = element("div");
    			input3 = element("input");
    			t45 = space();
    			div31 = element("div");
    			input4 = element("input");
    			t46 = space();
    			div61 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Otros parametros";
    			t48 = space();
    			hr = element("hr");
    			t49 = space();
    			div60 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			label4 = element("label");
    			i8 = element("i");
    			t50 = text(" Peso");
    			t51 = space();
    			div37 = element("div");
    			div35 = element("div");
    			input5 = element("input");
    			t52 = space();
    			div36 = element("div");
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Lb";
    			option4 = element("option");
    			option4.textContent = "Kg";
    			t55 = space();
    			div45 = element("div");
    			div44 = element("div");
    			label5 = element("label");
    			i9 = element("i");
    			t56 = text(" Escala de\r\n                                            glasgow");
    			t57 = space();
    			div43 = element("div");
    			div42 = element("div");
    			div41 = element("div");
    			input6 = element("input");
    			t58 = space();
    			div40 = element("div");
    			span2 = element("span");
    			span2.textContent = "/ 15";
    			t60 = space();
    			div51 = element("div");
    			div50 = element("div");
    			label6 = element("label");
    			i10 = element("i");
    			t61 = text(" Escala de dolor");
    			t62 = space();
    			div49 = element("div");
    			div48 = element("div");
    			div47 = element("div");
    			input7 = element("input");
    			t63 = space();
    			div46 = element("div");
    			span3 = element("span");
    			span3.textContent = "/ 10";
    			t65 = space();
    			div55 = element("div");
    			div54 = element("div");
    			label7 = element("label");
    			i11 = element("i");
    			t66 = text(" Saturación\r\n                                            de oxigeno");
    			t67 = space();
    			div53 = element("div");
    			div52 = element("div");
    			input8 = element("input");
    			t68 = space();
    			div59 = element("div");
    			div58 = element("div");
    			label8 = element("label");
    			label8.textContent = "Otros";
    			t70 = space();
    			div57 = element("div");
    			div56 = element("div");
    			input9 = element("input");
    			t71 = space();
    			div71 = element("div");
    			div66 = element("div");
    			div65 = element("div");
    			div65.textContent = "Examen Fisico";
    			t73 = space();
    			div69 = element("div");
    			div68 = element("div");
    			a0 = element("a");
    			i12 = element("i");
    			t74 = space();
    			div67 = element("div");
    			button4 = element("button");
    			button4.textContent = "Action";
    			t76 = space();
    			button5 = element("button");
    			button5.textContent = "Another action";
    			t78 = space();
    			button6 = element("button");
    			button6.textContent = "Something else here";
    			t80 = space();
    			div70 = element("div");
    			textarea2 = element("textarea");
    			t81 = space();
    			div83 = element("div");
    			div73 = element("div");
    			div72 = element("div");
    			div72.textContent = "Diagnosticos";
    			t83 = space();
    			div76 = element("div");
    			div75 = element("div");
    			a1 = element("a");
    			i13 = element("i");
    			t84 = space();
    			div74 = element("div");
    			button7 = element("button");
    			i14 = element("i");
    			t85 = text("\r\n                                Agregar nuevo diagnostico");
    			t86 = space();
    			div82 = element("div");
    			div81 = element("div");
    			div79 = element("div");
    			div78 = element("div");
    			input10 = element("input");
    			t87 = space();
    			ul0 = element("ul");
    			div77 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t88 = space();
    			li = element("li");
    			a2 = element("a");
    			i15 = element("i");
    			t89 = text("Agregar\r\n                                                manualmente");
    			t90 = space();
    			div80 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t91 = space();
    			if (if_block2) if_block2.c();
    			t92 = space();
    			create_component(ordenesmedicas.$$.fragment);
    			t93 = space();
    			div87 = element("div");
    			div85 = element("div");
    			div84 = element("div");
    			div84.textContent = "Observaciones";
    			t95 = space();
    			div86 = element("div");
    			textarea3 = element("textarea");
    			t96 = space();
    			div96 = element("div");
    			div95 = element("div");
    			div94 = element("div");
    			div89 = element("div");
    			div88 = element("div");
    			div88.textContent = "Fecha y hora";
    			t98 = space();
    			div93 = element("div");
    			div92 = element("div");
    			div90 = element("div");
    			label9 = element("label");
    			label9.textContent = "Fecha";
    			t100 = space();
    			input11 = element("input");
    			t101 = space();
    			div91 = element("div");
    			label10 = element("label");
    			label10.textContent = "Hora";
    			t103 = space();
    			input12 = element("input");
    			t104 = space();
    			create_component(modaldatospaciente.$$.fragment);
    			t105 = space();
    			create_component(modaltratamientos.$$.fragment);
    			t106 = space();
    			create_component(modalinterconsulta.$$.fragment);
    			t107 = space();
    			create_component(modalantecedentes.$$.fragment);
    			attr_dev(span0, "class", "badge badge-primary");
    			attr_dev(span0, "data-bind", "text: titulo");
    			add_location(span0, file$i, 211, 16, 6785);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$i, 214, 16, 6925);
    			add_location(h50, file$i, 210, 12, 6763);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$i, 209, 8, 6727);
    			attr_dev(div1, "class", "guardar-documento");
    			add_location(div1, file$i, 220, 12, 7172);
    			attr_dev(div2, "class", "col-md-6");
    			set_style(div2, "text-align", "right");
    			add_location(div2, file$i, 219, 8, 7109);
    			attr_dev(i0, "data-bind", "class: icon");
    			attr_dev(i0, "class", "mdi mdi-comment-eye");
    			add_location(i0, file$i, 245, 20, 8160);
    			attr_dev(sapn0, "data-bind", "text: text");
    			add_location(sapn0, file$i, 246, 20, 8239);
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalDatosPersonales");
    			set_style(button0, "box-shadow", "none");
    			attr_dev(button0, "class", "btn btn-outline-secondary btn-sm");
    			add_location(button0, file$i, 239, 16, 7906);
    			attr_dev(i1, "data-bind", "class: icon");
    			attr_dev(i1, "class", "mdi mdi-text");
    			add_location(i1, file$i, 254, 20, 8560);
    			attr_dev(sapn1, "data-bind", "text: text");
    			add_location(sapn1, file$i, 255, 20, 8632);
    			attr_dev(button1, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button1, "box-shadow", "none");
    			attr_dev(button1, "class", "btn btn-outline-dark btn-sm");
    			add_location(button1, file$i, 249, 16, 8340);
    			attr_dev(i2, "data-bind", "class: icon");
    			attr_dev(i2, "class", "mdi mdi-printer");
    			add_location(i2, file$i, 273, 20, 9400);
    			attr_dev(sapn2, "data-bind", "text: text");
    			add_location(sapn2, file$i, 274, 20, 9475);
    			attr_dev(button2, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button2, "box-shadow", "none");
    			attr_dev(button2, "class", "btn btn-outline-dark btn-sm btn-hover-white");
    			add_location(button2, file$i, 268, 16, 9164);
    			attr_dev(i3, "data-bind", "class: icon");
    			attr_dev(i3, "class", "mdi mdi-delete");
    			add_location(i3, file$i, 292, 20, 10219);
    			attr_dev(sapn3, "data-bind", "text: text");
    			add_location(sapn3, file$i, 293, 20, 10293);
    			attr_dev(button3, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button3, "box-shadow", "none");
    			attr_dev(button3, "class", "btn btn-outline-danger btn-sm");
    			add_location(button3, file$i, 287, 16, 9997);
    			attr_dev(div3, "class", "dropdown");
    			attr_dev(div3, "data-bind", "foreach: actionButtons");
    			add_location(div3, file$i, 238, 12, 7831);
    			attr_dev(div4, "class", "col-lg-12");
    			add_location(div4, file$i, 237, 8, 7794);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$i, 208, 4, 6700);
    			attr_dev(div6, "class", "contenedor-datos");
    			attr_dev(div6, "id", "divHeaderBar");
    			add_location(div6, file$i, 207, 0, 6646);
    			attr_dev(div7, "class", "card-title");
    			add_location(div7, file$i, 309, 20, 10760);
    			attr_dev(div8, "class", "card-header");
    			add_location(div8, file$i, 308, 16, 10713);
    			attr_dev(textarea0, "class", "form-control");
    			set_style(textarea0, "width", "100%");
    			set_style(textarea0, "display", "block");
    			set_style(textarea0, "height", "150px");
    			attr_dev(textarea0, "rows", "3");
    			attr_dev(textarea0, "name", "Comentario");
    			attr_dev(textarea0, "data-bind", "value: atencionMedica.motivoConsulta");
    			add_location(textarea0, file$i, 312, 20, 10895);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$i, 311, 16, 10850);
    			attr_dev(div10, "data-bind", "if: perfil().motivoConsulta");
    			attr_dev(div10, "class", "card m-b-20 margen-mobile");
    			add_location(div10, file$i, 304, 12, 10568);
    			attr_dev(div11, "class", "card-title");
    			add_location(div11, file$i, 328, 20, 11564);
    			attr_dev(div12, "class", "card-header");
    			add_location(div12, file$i, 327, 16, 11517);
    			attr_dev(textarea1, "class", "form-control");
    			attr_dev(textarea1, "data-bind", "value: atencionMedica.historiaEnfermedad");
    			set_style(textarea1, "width", "100%");
    			set_style(textarea1, "display", "block");
    			set_style(textarea1, "height", "150px");
    			attr_dev(textarea1, "rows", "3");
    			attr_dev(textarea1, "name", "Comentario");
    			add_location(textarea1, file$i, 331, 20, 11706);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$i, 330, 16, 11661);
    			attr_dev(div14, "data-bind", "if: perfil().historiaEnfermedad");
    			attr_dev(div14, "class", "card m-b-20 autosave");
    			add_location(div14, file$i, 323, 12, 11373);
    			attr_dev(div15, "class", "card-title");
    			add_location(div15, file$i, 344, 20, 12305);
    			attr_dev(div16, "class", "card-header");
    			add_location(div16, file$i, 343, 16, 12258);
    			attr_dev(i4, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i4, file$i, 351, 37, 12641);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$i, 350, 32, 12589);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$i, 355, 40, 12890);
    			attr_dev(div17, "class", "col-lg-7");
    			add_location(div17, file$i, 354, 36, 12826);
    			option0.__value = "C";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$i, 365, 44, 13572);
    			option1.__value = "K";
    			option1.value = option1.__value;
    			add_location(option1, file$i, 366, 44, 13656);
    			option2.__value = "F";
    			option2.value = option2.__value;
    			add_location(option2, file$i, 367, 44, 13731);
    			attr_dev(select0, "class", "form-control");
    			if (/*temperatura*/ ctx[7].tipo === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[26].call(select0));
    			add_location(select0, file$i, 364, 40, 13439);
    			attr_dev(div18, "class", "col-lg-5");
    			add_location(div18, file$i, 362, 36, 13294);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$i, 353, 32, 12771);
    			attr_dev(div20, "class", "form-group");
    			add_location(div20, file$i, 349, 28, 12531);
    			attr_dev(div21, "class", "col-lg-3");
    			add_location(div21, file$i, 348, 24, 12479);
    			attr_dev(i5, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i5, file$i, 376, 37, 14151);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$i, 375, 32, 14099);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$i, 381, 40, 14449);
    			attr_dev(div22, "class", "col-lg-12");
    			add_location(div22, file$i, 380, 36, 14384);
    			attr_dev(div23, "class", "row");
    			add_location(div23, file$i, 379, 32, 14329);
    			attr_dev(div24, "class", "form-group");
    			add_location(div24, file$i, 374, 28, 14041);
    			attr_dev(div25, "class", "col-lg-3");
    			add_location(div25, file$i, 373, 24, 13989);
    			attr_dev(i6, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i6, file$i, 394, 37, 15125);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$i, 393, 32, 15073);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$i, 399, 40, 15420);
    			attr_dev(div26, "class", "col-lg-12");
    			add_location(div26, file$i, 398, 36, 15355);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$i, 397, 32, 15300);
    			attr_dev(div28, "class", "form-group");
    			add_location(div28, file$i, 392, 28, 15015);
    			attr_dev(div29, "class", "col-lg-3");
    			add_location(div29, file$i, 391, 24, 14963);
    			attr_dev(i7, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i7, file$i, 412, 37, 16092);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$i, 411, 32, 16040);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$i, 417, 40, 16390);
    			attr_dev(div30, "class", "col-lg-6");
    			add_location(div30, file$i, 416, 36, 16326);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$i, 425, 40, 16859);
    			attr_dev(div31, "class", "col-lg-6");
    			add_location(div31, file$i, 424, 36, 16795);
    			attr_dev(div32, "class", "row");
    			add_location(div32, file$i, 415, 32, 16271);
    			attr_dev(div33, "class", "form-group");
    			add_location(div33, file$i, 410, 28, 15982);
    			attr_dev(div34, "class", "col-lg-3");
    			add_location(div34, file$i, 409, 24, 15930);
    			add_location(h51, file$i, 436, 28, 17415);
    			add_location(hr, file$i, 437, 28, 17470);
    			attr_dev(i8, "class", "mdi mdi-weight-pound");
    			add_location(i8, file$i, 442, 45, 17743);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$i, 441, 40, 17683);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "form-control");
    			add_location(input5, file$i, 446, 48, 18009);
    			attr_dev(div35, "class", "col-lg-7");
    			add_location(div35, file$i, 445, 44, 17937);
    			option3.__value = "Lb";
    			option3.value = option3.__value;
    			add_location(option3, file$i, 459, 52, 18913);
    			option4.__value = "Kg";
    			option4.value = option4.__value;
    			add_location(option4, file$i, 460, 52, 18997);
    			attr_dev(select1, "class", "form-control");
    			if (/*peso*/ ctx[9].tipo === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[32].call(select1));
    			add_location(select1, file$i, 455, 48, 18623);
    			attr_dev(div36, "class", "col-lg-5");
    			add_location(div36, file$i, 453, 44, 18462);
    			attr_dev(div37, "class", "row");
    			add_location(div37, file$i, 444, 40, 17874);
    			attr_dev(div38, "class", "form-group");
    			add_location(div38, file$i, 440, 36, 17617);
    			attr_dev(div39, "class", "col-lg-3");
    			add_location(div39, file$i, 439, 32, 17557);
    			attr_dev(i9, "class", "mdi mdi-human");
    			add_location(i9, file$i, 469, 45, 19490);
    			attr_dev(label5, "for", "");
    			add_location(label5, file$i, 468, 40, 19430);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "max", "15");
    			attr_dev(input6, "maxlength", "2");
    			attr_dev(input6, "aria-label", "Recipient's username");
    			attr_dev(input6, "aria-describedby", "basic-addon2");
    			add_location(input6, file$i, 478, 52, 20089);
    			attr_dev(span2, "class", "input-group-text");
    			attr_dev(span2, "id", "basic-addon2");
    			add_location(span2, file$i, 491, 56, 21048);
    			attr_dev(div40, "class", "input-group-append");
    			add_location(div40, file$i, 488, 52, 20847);
    			attr_dev(div41, "class", "input-group");
    			set_style(div41, "width", "100%", 1);
    			set_style(div41, "float", "right");
    			add_location(div41, file$i, 474, 48, 19808);
    			attr_dev(div42, "class", "col-lg-12");
    			add_location(div42, file$i, 473, 44, 19735);
    			attr_dev(div43, "class", "row");
    			add_location(div43, file$i, 472, 40, 19672);
    			attr_dev(div44, "class", "form-group");
    			add_location(div44, file$i, 467, 36, 19364);
    			attr_dev(div45, "class", "col-lg-3");
    			add_location(div45, file$i, 466, 32, 19304);
    			attr_dev(i10, "class", "mdi mdi-emoticon-happy");
    			add_location(i10, file$i, 505, 45, 21870);
    			attr_dev(label6, "for", "");
    			add_location(label6, file$i, 504, 40, 21810);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "max", "10");
    			attr_dev(input7, "maxlength", "2");
    			attr_dev(input7, "aria-label", "Recipient's username");
    			attr_dev(input7, "aria-describedby", "basic-addon2");
    			add_location(input7, file$i, 515, 52, 22525);
    			attr_dev(span3, "class", "input-group-text");
    			attr_dev(span3, "id", "basic-addon2");
    			add_location(span3, file$i, 528, 56, 23482);
    			attr_dev(div46, "class", "input-group-append");
    			add_location(div46, file$i, 525, 52, 23281);
    			attr_dev(div47, "class", "input-group");
    			set_style(div47, "width", "100%", 1);
    			set_style(div47, "float", "right");
    			add_location(div47, file$i, 511, 48, 22244);
    			attr_dev(div48, "class", "col-lg-12");
    			add_location(div48, file$i, 510, 44, 22171);
    			attr_dev(div49, "class", "row");
    			add_location(div49, file$i, 509, 40, 22108);
    			attr_dev(div50, "class", "form-group");
    			add_location(div50, file$i, 503, 36, 21744);
    			attr_dev(div51, "class", "col-lg-3");
    			add_location(div51, file$i, 502, 32, 21684);
    			attr_dev(i11, "class", "mdi mdi-opacity");
    			add_location(i11, file$i, 542, 45, 24304);
    			attr_dev(label7, "for", "");
    			add_location(label7, file$i, 541, 40, 24244);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "class", "form-control");
    			add_location(input8, file$i, 547, 48, 24635);
    			attr_dev(div52, "class", "col-lg-12");
    			add_location(div52, file$i, 546, 44, 24562);
    			attr_dev(div53, "class", "row");
    			add_location(div53, file$i, 545, 40, 24499);
    			attr_dev(div54, "class", "form-group");
    			add_location(div54, file$i, 540, 36, 24178);
    			attr_dev(div55, "class", "col-lg-3");
    			add_location(div55, file$i, 539, 32, 24118);
    			attr_dev(label8, "for", "");
    			add_location(label8, file$i, 559, 40, 25351);
    			attr_dev(input9, "type", "text");
    			attr_dev(input9, "class", "form-control");
    			add_location(input9, file$i, 562, 48, 25556);
    			attr_dev(div56, "class", "col-lg-12");
    			add_location(div56, file$i, 561, 44, 25483);
    			attr_dev(div57, "class", "row");
    			add_location(div57, file$i, 560, 40, 25420);
    			attr_dev(div58, "class", "form-group");
    			add_location(div58, file$i, 558, 36, 25285);
    			attr_dev(div59, "class", "col-lg-12");
    			add_location(div59, file$i, 557, 32, 25224);
    			attr_dev(div60, "class", "row");
    			add_location(div60, file$i, 438, 28, 17506);
    			attr_dev(div61, "class", "col-12 mt-4");
    			add_location(div61, file$i, 435, 24, 17360);
    			attr_dev(div62, "class", "row");
    			add_location(div62, file$i, 347, 20, 12436);
    			attr_dev(div63, "class", "card-body");
    			add_location(div63, file$i, 346, 16, 12391);
    			attr_dev(div64, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div64, file$i, 342, 12, 12192);
    			attr_dev(div65, "class", "card-title");
    			add_location(div65, file$i, 582, 20, 26393);
    			attr_dev(div66, "class", "card-header");
    			add_location(div66, file$i, 581, 16, 26346);
    			attr_dev(i12, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i12, file$i, 592, 28, 26825);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "data-toggle", "dropdown");
    			attr_dev(a0, "aria-haspopup", "true");
    			attr_dev(a0, "aria-expanded", "false");
    			add_location(a0, file$i, 586, 24, 26575);
    			attr_dev(button4, "class", "dropdown-item");
    			attr_dev(button4, "type", "button");
    			add_location(button4, file$i, 595, 28, 26999);
    			attr_dev(button5, "class", "dropdown-item");
    			attr_dev(button5, "type", "button");
    			add_location(button5, file$i, 598, 28, 27152);
    			attr_dev(button6, "class", "dropdown-item");
    			attr_dev(button6, "type", "button");
    			add_location(button6, file$i, 601, 28, 27313);
    			attr_dev(div67, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div67, file$i, 594, 24, 26922);
    			attr_dev(div68, "class", "dropdown");
    			add_location(div68, file$i, 585, 20, 26527);
    			attr_dev(div69, "class", "card-controls");
    			add_location(div69, file$i, 584, 16, 26478);
    			attr_dev(textarea2, "class", "form-control");
    			set_style(textarea2, "width", "100%");
    			set_style(textarea2, "display", "block");
    			attr_dev(textarea2, "rows", "5");
    			attr_dev(textarea2, "name", "Comentario");
    			add_location(textarea2, file$i, 608, 20, 27596);
    			attr_dev(div70, "class", "card-body");
    			add_location(div70, file$i, 607, 16, 27551);
    			attr_dev(div71, "class", "card m-b-20 autosave");
    			add_location(div71, file$i, 578, 12, 26263);
    			attr_dev(div72, "class", "card-title");
    			add_location(div72, file$i, 620, 20, 28073);
    			attr_dev(div73, "class", "card-header");
    			add_location(div73, file$i, 619, 16, 28026);
    			attr_dev(i13, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i13, file$i, 630, 28, 28504);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "data-toggle", "dropdown");
    			attr_dev(a1, "aria-haspopup", "true");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file$i, 624, 24, 28254);
    			attr_dev(i14, "class", "mdi mdi-plus");
    			add_location(i14, file$i, 636, 33, 28835);
    			attr_dev(button7, "class", "dropdown-item text-success");
    			attr_dev(button7, "type", "button");
    			add_location(button7, file$i, 633, 28, 28678);
    			attr_dev(div74, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div74, file$i, 632, 24, 28601);
    			attr_dev(div75, "class", "dropdown");
    			add_location(div75, file$i, 623, 20, 28206);
    			attr_dev(div76, "class", "card-controls");
    			add_location(div76, file$i, 622, 16, 28157);
    			attr_dev(input10, "type", "text");
    			attr_dev(input10, "class", "form-control");
    			attr_dev(input10, "id", "txtBusquedaProblemaMedico");
    			attr_dev(input10, "data-toggle", "dropdown");
    			attr_dev(input10, "aria-haspopup", "true");
    			attr_dev(input10, "aria-expanded", "true");
    			add_location(input10, file$i, 648, 32, 29352);
    			attr_dev(i15, "class", "mdi mdi-plus");
    			add_location(i15, file$i, 684, 49, 31641);
    			attr_dev(a2, "href", "#!");
    			add_location(a2, file$i, 683, 44, 31578);
    			attr_dev(li, "class", "defecto");
    			add_location(li, file$i, 682, 40, 31512);
    			attr_dev(div77, "class", "contenidoLista");
    			add_location(div77, file$i, 664, 36, 30351);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$i, 658, 32, 29917);
    			attr_dev(div78, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div78, file$i, 645, 28, 29199);
    			attr_dev(div79, "class", "col-12");
    			add_location(div79, file$i, 644, 24, 29149);
    			attr_dev(ul1, "class", "list-info");
    			add_location(ul1, file$i, 694, 28, 32064);
    			attr_dev(div80, "class", "col-md-12");
    			add_location(div80, file$i, 693, 24, 32011);
    			attr_dev(div81, "class", "row");
    			add_location(div81, file$i, 643, 20, 29106);
    			attr_dev(div82, "class", "card-body");
    			add_location(div82, file$i, 642, 16, 29061);
    			attr_dev(div83, "class", "card m-b-20");
    			add_location(div83, file$i, 618, 12, 27983);
    			attr_dev(div84, "class", "card-title");
    			add_location(div84, file$i, 764, 20, 36016);
    			attr_dev(div85, "class", "card-header");
    			add_location(div85, file$i, 763, 16, 35969);
    			attr_dev(textarea3, "class", "form-control");
    			set_style(textarea3, "width", "100%");
    			set_style(textarea3, "display", "block");
    			set_style(textarea3, "height", "150px");
    			attr_dev(textarea3, "rows", "3");
    			add_location(textarea3, file$i, 767, 20, 36146);
    			attr_dev(div86, "class", "card-body");
    			add_location(div86, file$i, 766, 16, 36101);
    			attr_dev(div87, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div87, file$i, 762, 12, 35903);
    			attr_dev(div88, "class", "card-title");
    			add_location(div88, file$i, 781, 28, 36693);
    			attr_dev(div89, "class", "card-header");
    			add_location(div89, file$i, 780, 24, 36638);
    			attr_dev(label9, "for", "");
    			add_location(label9, file$i, 788, 36, 37070);
    			attr_dev(input11, "type", "date");
    			attr_dev(input11, "class", "form-control");
    			attr_dev(input11, "placeholder", "Fecha");
    			add_location(input11, file$i, 789, 36, 37135);
    			attr_dev(div90, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div90, file$i, 785, 32, 36902);
    			attr_dev(label10, "for", "");
    			add_location(label10, file$i, 799, 36, 37659);
    			attr_dev(input12, "type", "time");
    			attr_dev(input12, "placeholder", "Hora");
    			attr_dev(input12, "class", "form-control");
    			add_location(input12, file$i, 800, 36, 37723);
    			attr_dev(div91, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div91, file$i, 796, 32, 37491);
    			attr_dev(div92, "class", "form-row");
    			add_location(div92, file$i, 784, 28, 36846);
    			attr_dev(div93, "class", "card-body");
    			add_location(div93, file$i, 783, 24, 36793);
    			attr_dev(div94, "class", "card m-b-20");
    			add_location(div94, file$i, 779, 20, 36587);
    			attr_dev(div95, "class", "col-lg-6");
    			add_location(div95, file$i, 778, 16, 36543);
    			attr_dev(div96, "class", "row");
    			add_location(div96, file$i, 777, 12, 36508);
    			attr_dev(div97, "class", "col-lg-12");
    			set_style(div97, "margin-top", "150px");
    			add_location(div97, file$i, 303, 8, 10505);
    			attr_dev(div98, "class", "container m-b-30");
    			add_location(div98, file$i, 302, 4, 10465);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$i, 301, 0, 10434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(asideatencion, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h50);
    			append_dev(h50, span0);
    			append_dev(h50, t2);
    			append_dev(h50, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t7);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(button0, i0);
    			append_dev(button0, t9);
    			append_dev(button0, sapn0);
    			append_dev(div3, t11);
    			append_dev(div3, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t12);
    			append_dev(button1, sapn1);
    			append_dev(div3, t14);
    			append_dev(div3, button2);
    			append_dev(button2, i2);
    			append_dev(button2, t15);
    			append_dev(button2, sapn2);
    			append_dev(div3, t17);
    			append_dev(div3, button3);
    			append_dev(button3, i3);
    			append_dev(button3, t18);
    			append_dev(button3, sapn3);
    			insert_dev(target, t20, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div98);
    			append_dev(div98, div97);
    			append_dev(div97, div10);
    			append_dev(div10, div8);
    			append_dev(div8, div7);
    			append_dev(div10, t23);
    			append_dev(div10, div9);
    			append_dev(div9, textarea0);
    			set_input_value(textarea0, /*historia*/ ctx[6].motivoConsulta);
    			append_dev(div97, t24);
    			append_dev(div97, div14);
    			append_dev(div14, div12);
    			append_dev(div12, div11);
    			append_dev(div14, t26);
    			append_dev(div14, div13);
    			append_dev(div13, textarea1);
    			set_input_value(textarea1, /*historia*/ ctx[6].historiaEnfermedad);
    			append_dev(div97, t27);
    			append_dev(div97, div64);
    			append_dev(div64, div16);
    			append_dev(div16, div15);
    			append_dev(div64, t29);
    			append_dev(div64, div63);
    			append_dev(div63, div62);
    			append_dev(div62, div21);
    			append_dev(div21, div20);
    			append_dev(div20, label0);
    			append_dev(label0, i4);
    			append_dev(label0, t30);
    			append_dev(div20, t31);
    			append_dev(div20, div19);
    			append_dev(div19, div17);
    			append_dev(div17, input0);
    			set_input_value(input0, /*temperatura*/ ctx[7].valor);
    			append_dev(div19, t32);
    			append_dev(div19, div18);
    			append_dev(div18, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*temperatura*/ ctx[7].tipo);
    			append_dev(div62, t36);
    			append_dev(div62, div25);
    			append_dev(div25, div24);
    			append_dev(div24, label1);
    			append_dev(label1, i5);
    			append_dev(label1, t37);
    			append_dev(div24, t38);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, input1);
    			set_input_value(input1, /*historia*/ ctx[6].frecuenciaRespiratoria);
    			append_dev(div62, t39);
    			append_dev(div62, div29);
    			append_dev(div29, div28);
    			append_dev(div28, label2);
    			append_dev(label2, i6);
    			append_dev(label2, t40);
    			append_dev(div28, t41);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, input2);
    			set_input_value(input2, /*historia*/ ctx[6].frecuenciaCardiaca);
    			append_dev(div62, t42);
    			append_dev(div62, div34);
    			append_dev(div34, div33);
    			append_dev(div33, label3);
    			append_dev(label3, i7);
    			append_dev(label3, t43);
    			append_dev(div33, t44);
    			append_dev(div33, div32);
    			append_dev(div32, div30);
    			append_dev(div30, input3);
    			set_input_value(input3, /*presionAlterial*/ ctx[8].mm);
    			append_dev(div32, t45);
    			append_dev(div32, div31);
    			append_dev(div31, input4);
    			set_input_value(input4, /*presionAlterial*/ ctx[8].Hg);
    			append_dev(div62, t46);
    			append_dev(div62, div61);
    			append_dev(div61, h51);
    			append_dev(div61, t48);
    			append_dev(div61, hr);
    			append_dev(div61, t49);
    			append_dev(div61, div60);
    			append_dev(div60, div39);
    			append_dev(div39, div38);
    			append_dev(div38, label4);
    			append_dev(label4, i8);
    			append_dev(label4, t50);
    			append_dev(div38, t51);
    			append_dev(div38, div37);
    			append_dev(div37, div35);
    			append_dev(div35, input5);
    			set_input_value(input5, /*peso*/ ctx[9].valor);
    			append_dev(div37, t52);
    			append_dev(div37, div36);
    			append_dev(div36, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*peso*/ ctx[9].tipo);
    			append_dev(div60, t55);
    			append_dev(div60, div45);
    			append_dev(div45, div44);
    			append_dev(div44, label5);
    			append_dev(label5, i9);
    			append_dev(label5, t56);
    			append_dev(div44, t57);
    			append_dev(div44, div43);
    			append_dev(div43, div42);
    			append_dev(div42, div41);
    			append_dev(div41, input6);
    			set_input_value(input6, /*historia*/ ctx[6].escalaGalsgow);
    			append_dev(div41, t58);
    			append_dev(div41, div40);
    			append_dev(div40, span2);
    			append_dev(div60, t60);
    			append_dev(div60, div51);
    			append_dev(div51, div50);
    			append_dev(div50, label6);
    			append_dev(label6, i10);
    			append_dev(label6, t61);
    			append_dev(div50, t62);
    			append_dev(div50, div49);
    			append_dev(div49, div48);
    			append_dev(div48, div47);
    			append_dev(div47, input7);
    			set_input_value(input7, /*historia*/ ctx[6].escalaDolor);
    			append_dev(div47, t63);
    			append_dev(div47, div46);
    			append_dev(div46, span3);
    			append_dev(div60, t65);
    			append_dev(div60, div55);
    			append_dev(div55, div54);
    			append_dev(div54, label7);
    			append_dev(label7, i11);
    			append_dev(label7, t66);
    			append_dev(div54, t67);
    			append_dev(div54, div53);
    			append_dev(div53, div52);
    			append_dev(div52, input8);
    			set_input_value(input8, /*historia*/ ctx[6].saturacionOxigeno);
    			append_dev(div60, t68);
    			append_dev(div60, div59);
    			append_dev(div59, div58);
    			append_dev(div58, label8);
    			append_dev(div58, t70);
    			append_dev(div58, div57);
    			append_dev(div57, div56);
    			append_dev(div56, input9);
    			set_input_value(input9, /*historia*/ ctx[6].otrosParametros);
    			append_dev(div97, t71);
    			append_dev(div97, div71);
    			append_dev(div71, div66);
    			append_dev(div66, div65);
    			append_dev(div71, t73);
    			append_dev(div71, div69);
    			append_dev(div69, div68);
    			append_dev(div68, a0);
    			append_dev(a0, i12);
    			append_dev(div68, t74);
    			append_dev(div68, div67);
    			append_dev(div67, button4);
    			append_dev(div67, t76);
    			append_dev(div67, button5);
    			append_dev(div67, t78);
    			append_dev(div67, button6);
    			append_dev(div71, t80);
    			append_dev(div71, div70);
    			append_dev(div70, textarea2);
    			set_input_value(textarea2, /*historia*/ ctx[6].examenFisico);
    			append_dev(div97, t81);
    			append_dev(div97, div83);
    			append_dev(div83, div73);
    			append_dev(div73, div72);
    			append_dev(div83, t83);
    			append_dev(div83, div76);
    			append_dev(div76, div75);
    			append_dev(div75, a1);
    			append_dev(a1, i13);
    			append_dev(div75, t84);
    			append_dev(div75, div74);
    			append_dev(div74, button7);
    			append_dev(button7, i14);
    			append_dev(button7, t85);
    			append_dev(div83, t86);
    			append_dev(div83, div82);
    			append_dev(div82, div81);
    			append_dev(div81, div79);
    			append_dev(div79, div78);
    			append_dev(div78, input10);
    			set_input_value(input10, /*inpBuscarDiagnostico*/ ctx[3]);
    			append_dev(div78, t87);
    			append_dev(div78, ul0);
    			append_dev(ul0, div77);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div77, null);
    			}

    			append_dev(div77, t88);
    			append_dev(div77, li);
    			append_dev(li, a2);
    			append_dev(a2, i15);
    			append_dev(a2, t89);
    			append_dev(div81, t90);
    			append_dev(div81, div80);
    			append_dev(div80, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			append_dev(ul1, t91);
    			if (if_block2) if_block2.m(ul1, null);
    			append_dev(div97, t92);
    			mount_component(ordenesmedicas, div97, null);
    			append_dev(div97, t93);
    			append_dev(div97, div87);
    			append_dev(div87, div85);
    			append_dev(div85, div84);
    			append_dev(div87, t95);
    			append_dev(div87, div86);
    			append_dev(div86, textarea3);
    			set_input_value(textarea3, /*historia*/ ctx[6].observaciones);
    			append_dev(div97, t96);
    			append_dev(div97, div96);
    			append_dev(div96, div95);
    			append_dev(div95, div94);
    			append_dev(div94, div89);
    			append_dev(div89, div88);
    			append_dev(div94, t98);
    			append_dev(div94, div93);
    			append_dev(div93, div92);
    			append_dev(div92, div90);
    			append_dev(div90, label9);
    			append_dev(div90, t100);
    			append_dev(div90, input11);
    			set_input_value(input11, /*fecha*/ ctx[10]);
    			append_dev(div92, t101);
    			append_dev(div92, div91);
    			append_dev(div91, label10);
    			append_dev(div91, t103);
    			append_dev(div91, input12);
    			set_input_value(input12, /*hora*/ ctx[11]);
    			insert_dev(target, t104, anchor);
    			mount_component(modaldatospaciente, target, anchor);
    			insert_dev(target, t105, anchor);
    			mount_component(modaltratamientos, target, anchor);
    			insert_dev(target, t106, anchor);
    			mount_component(modalinterconsulta, target, anchor);
    			insert_dev(target, t107, anchor);
    			mount_component(modalantecedentes, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[23]),
    					listen_dev(textarea1, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[24]),
    					listen_dev(input0, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[25]),
    					listen_dev(select0, "change", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[26]),
    					listen_dev(input1, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[27]),
    					listen_dev(input2, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[28]),
    					listen_dev(input3, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[29]),
    					listen_dev(input4, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[30]),
    					listen_dev(input5, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[31]),
    					listen_dev(select1, "change", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[32]),
    					listen_dev(input6, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[33]),
    					listen_dev(input7, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[34]),
    					listen_dev(input8, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[35]),
    					listen_dev(input9, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[36]),
    					listen_dev(textarea2, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[37]),
    					listen_dev(input10, "keyup", /*searchDiagnosticos*/ ctx[17], false, false, false),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[38]),
    					listen_dev(textarea3, "blur", /*guardarHistoria*/ ctx[20], false, false, false),
    					listen_dev(textarea3, "input", /*textarea3_input_handler*/ ctx[44]),
    					listen_dev(input11, "input", /*input11_input_handler*/ ctx[45]),
    					listen_dev(input12, "blur", /*blur_handler*/ ctx[46], false, false, false),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[47])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*paciente*/ 1) && t3_value !== (t3_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty[0] & /*paciente*/ 1) && t5_value !== (t5_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t5, t5_value);

    			if (!/*cargando*/ ctx[12]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*cargando*/ ctx[12]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*historia*/ 64) {
    				set_input_value(textarea0, /*historia*/ ctx[6].motivoConsulta);
    			}

    			if (dirty[0] & /*historia*/ 64) {
    				set_input_value(textarea1, /*historia*/ ctx[6].historiaEnfermedad);
    			}

    			if (dirty[0] & /*temperatura*/ 128 && to_number(input0.value) !== /*temperatura*/ ctx[7].valor) {
    				set_input_value(input0, /*temperatura*/ ctx[7].valor);
    			}

    			if (dirty[0] & /*temperatura*/ 128) {
    				select_option(select0, /*temperatura*/ ctx[7].tipo);
    			}

    			if (dirty[0] & /*historia*/ 64 && to_number(input1.value) !== /*historia*/ ctx[6].frecuenciaRespiratoria) {
    				set_input_value(input1, /*historia*/ ctx[6].frecuenciaRespiratoria);
    			}

    			if (dirty[0] & /*historia*/ 64 && to_number(input2.value) !== /*historia*/ ctx[6].frecuenciaCardiaca) {
    				set_input_value(input2, /*historia*/ ctx[6].frecuenciaCardiaca);
    			}

    			if (dirty[0] & /*presionAlterial*/ 256 && to_number(input3.value) !== /*presionAlterial*/ ctx[8].mm) {
    				set_input_value(input3, /*presionAlterial*/ ctx[8].mm);
    			}

    			if (dirty[0] & /*presionAlterial*/ 256 && to_number(input4.value) !== /*presionAlterial*/ ctx[8].Hg) {
    				set_input_value(input4, /*presionAlterial*/ ctx[8].Hg);
    			}

    			if (dirty[0] & /*peso*/ 512 && to_number(input5.value) !== /*peso*/ ctx[9].valor) {
    				set_input_value(input5, /*peso*/ ctx[9].valor);
    			}

    			if (dirty[0] & /*peso*/ 512) {
    				select_option(select1, /*peso*/ ctx[9].tipo);
    			}

    			if (dirty[0] & /*historia*/ 64 && to_number(input6.value) !== /*historia*/ ctx[6].escalaGalsgow) {
    				set_input_value(input6, /*historia*/ ctx[6].escalaGalsgow);
    			}

    			if (dirty[0] & /*historia*/ 64 && to_number(input7.value) !== /*historia*/ ctx[6].escalaDolor) {
    				set_input_value(input7, /*historia*/ ctx[6].escalaDolor);
    			}

    			if (dirty[0] & /*historia*/ 64 && to_number(input8.value) !== /*historia*/ ctx[6].saturacionOxigeno) {
    				set_input_value(input8, /*historia*/ ctx[6].saturacionOxigeno);
    			}

    			if (dirty[0] & /*historia*/ 64 && input9.value !== /*historia*/ ctx[6].otrosParametros) {
    				set_input_value(input9, /*historia*/ ctx[6].otrosParametros);
    			}

    			if (dirty[0] & /*historia*/ 64) {
    				set_input_value(textarea2, /*historia*/ ctx[6].examenFisico);
    			}

    			if (dirty[0] & /*inpBuscarDiagnostico*/ 8 && input10.value !== /*inpBuscarDiagnostico*/ ctx[3]) {
    				set_input_value(input10, /*inpBuscarDiagnostico*/ ctx[3]);
    			}

    			if (dirty[0] & /*seleccionarDiagnostico, filtroDiagnostico*/ 2129920) {
    				each_value_1 = /*filtroDiagnostico*/ ctx[15];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div77, t88);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*diagnosticosSeleccionados*/ 16) {
    				each_value = /*diagnosticosSeleccionados*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, t91);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*diagnosticosSeleccionados*/ ctx[4].length === 0) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					if_block2.m(ul1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			const ordenesmedicas_changes = {};

    			if (!updating_medicamentosSeleccionados && dirty[0] & /*medicamentosSeleccionados*/ 16384) {
    				updating_medicamentosSeleccionados = true;
    				ordenesmedicas_changes.medicamentosSeleccionados = /*medicamentosSeleccionados*/ ctx[14];
    				add_flush_callback(() => updating_medicamentosSeleccionados = false);
    			}

    			if (!updating_sltBuscarMedicamentos && dirty[0] & /*sltBuscarMedicamentos*/ 8192) {
    				updating_sltBuscarMedicamentos = true;
    				ordenesmedicas_changes.sltBuscarMedicamentos = /*sltBuscarMedicamentos*/ ctx[13];
    				add_flush_callback(() => updating_sltBuscarMedicamentos = false);
    			}

    			if (!updating_medicamentos && dirty[0] & /*medicamentos*/ 32) {
    				updating_medicamentos = true;
    				ordenesmedicas_changes.medicamentos = /*medicamentos*/ ctx[5];
    				add_flush_callback(() => updating_medicamentos = false);
    			}

    			if (!updating_instrucciones && dirty[0] & /*historia*/ 64) {
    				updating_instrucciones = true;
    				ordenesmedicas_changes.instrucciones = /*historia*/ ctx[6].instrucciones;
    				add_flush_callback(() => updating_instrucciones = false);
    			}

    			ordenesmedicas.$set(ordenesmedicas_changes);

    			if (dirty[0] & /*historia*/ 64) {
    				set_input_value(textarea3, /*historia*/ ctx[6].observaciones);
    			}

    			if (dirty[0] & /*fecha*/ 1024) {
    				set_input_value(input11, /*fecha*/ ctx[10]);
    			}

    			if (dirty[0] & /*hora*/ 2048) {
    				set_input_value(input12, /*hora*/ ctx[11]);
    			}

    			const modaldatospaciente_changes = {};
    			if (dirty[0] & /*paciente*/ 1) modaldatospaciente_changes.paciente = /*paciente*/ ctx[0];
    			if (dirty[0] & /*edad*/ 2) modaldatospaciente_changes.edad = /*edad*/ ctx[1];
    			if (dirty[0] & /*seguro*/ 4) modaldatospaciente_changes.seguro = /*seguro*/ ctx[2];
    			modaldatospaciente.$set(modaldatospaciente_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(asideatencion.$$.fragment, local);
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
    			if (detaching) detach_dev(t20);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block2) if_block2.d();
    			destroy_component(ordenesmedicas);
    			if (detaching) detach_dev(t104);
    			destroy_component(modaldatospaciente, detaching);
    			if (detaching) detach_dev(t105);
    			destroy_component(modaltratamientos, detaching);
    			if (detaching) detach_dev(t106);
    			destroy_component(modalinterconsulta, detaching);
    			if (detaching) detach_dev(t107);
    			destroy_component(modalantecedentes, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
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

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HistoriaClinica", slots, []);
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

    	const eliminarMedicamento = event => {
    		console.log(event.detail);

    		if (confirm("Desea eliminar el medicamento?")) {
    			medicamentosSeleccionados.splice(event.detail, 1);
    			$$invalidate(14, medicamentosSeleccionados);
    			$$invalidate(6, historia.medicamentos = medicamentosSeleccionados, historia);
    			guardarHistoria();
    		}
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

    		$$invalidate(14, medicamentosSeleccionados = [...medicamentosSeleccionados, medicamento]);
    		$$invalidate(6, historia.medicamentos = medicamentosSeleccionados, historia);
    		$$invalidate(13, sltBuscarMedicamentos = "");
    		guardarHistoria();
    		console.log(historia);
    	};

    	const cargarMedicamentos = () => {
    		const config = {
    			method: "get",
    			url: `${url}/medicamentos?b=${sltBuscarMedicamentos}`
    		};

    		axios$1(config).then(res => {
    			$$invalidate(5, medicamentos = res.data);
    		}).catch(error => {
    			console.error(error);
    		});
    	};

    	const guardarHistoria = () => {
    		$$invalidate(12, cargando = true);
    		$$invalidate(6, historia.diagnosticos = diagnosticosSeleccionados, historia);
    		delete historia.id;

    		const config = {
    			method: "put",
    			url: `${url}/historias/${params.idHistoria}`,
    			data: historia
    		};

    		axios$1(config).then(res => {
    			$$invalidate(12, cargando = false);
    			console.log(res.data);
    		}).catch(error => {
    			$$invalidate(12, cargando = false);
    			console.error(error);
    		});
    	};

    	async function cargarPaciente() {
    		const config = {
    			method: "get",
    			url: `${url}/pacientes/${params.idPaciente}`
    		};

    		let promesa = await axios$1(config);

    		if (promesa.status == 200) {
    			$$invalidate(0, paciente = await promesa.data);
    			$$invalidate(1, edad = calcularEdad$1(paciente.fechaNacimiento));
    			$$invalidate(2, seguro = paciente.seguroMedico[0].nombre);
    			console.log(promesa.data);
    		} else {
    			console.error(promesa.statusText);
    		}
    	}

    	const cargarHistoria = async () => {
    		const config = {
    			method: "get",
    			url: `${url}/historias/${params.idHistoria}`
    		};

    		let promesa = await axios$1(config);

    		if (promesa.status == 200) {
    			$$invalidate(6, historia = promesa.data);
    			$$invalidate(7, temperatura = promesa.data.temperatura);
    			$$invalidate(8, presionAlterial = promesa.data.presionAlterial);
    			$$invalidate(9, peso = promesa.data.peso);
    			$$invalidate(4, diagnosticosSeleccionados = promesa.data.diagnosticos);
    			$$invalidate(10, fecha = promesa.data.fechaHora.split("T")[0]);
    			$$invalidate(14, medicamentosSeleccionados = promesa.data.medicamentos);
    			let obtenerHora = promesa.data.fechaHora.split("T")[1].split("Z")[0].split(".")[0].split(":");
    			$$invalidate(11, hora = obtenerHora[0] + ":" + obtenerHora[1]);
    			console.log(historia);
    			console.log(hora);
    		} else {
    			console.error(error);
    		}
    	};

    	function cargarDiagnosticos() {
    		const config = {
    			method: "get",
    			url: `${url}/diagnosticos?b=${inpBuscarDiagnostico}`
    		};

    		setTimeout(
    			() => {
    				axios$1(config).then(res => {
    					$$invalidate(48, diagnosticos = res.data);
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
    			url: `${url}/diagnosticos/${id}`
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, diagnosticosSeleccionados = [...diagnosticosSeleccionados, res.data]);
    			guardarHistoria();
    			console.log(diagnosticosSeleccionados);
    		});

    		$$invalidate(3, inpBuscarDiagnostico = "");
    	}

    	onMount(async () => {
    		jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    		await cargarPaciente();
    		await cargarHistoria();
    		cargarDiagnosticos();
    		cargarMedicamentos();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<HistoriaClinica> was created with unknown prop '${key}'`);
    	});

    	function textarea0_input_handler() {
    		historia.motivoConsulta = this.value;
    		$$invalidate(6, historia);
    	}

    	function textarea1_input_handler() {
    		historia.historiaEnfermedad = this.value;
    		$$invalidate(6, historia);
    	}

    	function input0_input_handler() {
    		temperatura.valor = to_number(this.value);
    		$$invalidate(7, temperatura);
    	}

    	function select0_change_handler() {
    		temperatura.tipo = select_value(this);
    		$$invalidate(7, temperatura);
    	}

    	function input1_input_handler() {
    		historia.frecuenciaRespiratoria = to_number(this.value);
    		$$invalidate(6, historia);
    	}

    	function input2_input_handler() {
    		historia.frecuenciaCardiaca = to_number(this.value);
    		$$invalidate(6, historia);
    	}

    	function input3_input_handler() {
    		presionAlterial.mm = to_number(this.value);
    		$$invalidate(8, presionAlterial);
    	}

    	function input4_input_handler() {
    		presionAlterial.Hg = to_number(this.value);
    		$$invalidate(8, presionAlterial);
    	}

    	function input5_input_handler() {
    		peso.valor = to_number(this.value);
    		$$invalidate(9, peso);
    	}

    	function select1_change_handler() {
    		peso.tipo = select_value(this);
    		$$invalidate(9, peso);
    	}

    	function input6_input_handler() {
    		historia.escalaGalsgow = to_number(this.value);
    		$$invalidate(6, historia);
    	}

    	function input7_input_handler() {
    		historia.escalaDolor = to_number(this.value);
    		$$invalidate(6, historia);
    	}

    	function input8_input_handler() {
    		historia.saturacionOxigeno = to_number(this.value);
    		$$invalidate(6, historia);
    	}

    	function input9_input_handler() {
    		historia.otrosParametros = this.value;
    		$$invalidate(6, historia);
    	}

    	function textarea2_input_handler() {
    		historia.examenFisico = this.value;
    		$$invalidate(6, historia);
    	}

    	function input10_input_handler() {
    		inpBuscarDiagnostico = this.value;
    		$$invalidate(3, inpBuscarDiagnostico);
    	}

    	const click_handler = diagnostico => seleccionarDiagnostico(diagnostico.c);

    	function ordenesmedicas_medicamentosSeleccionados_binding(value) {
    		medicamentosSeleccionados = value;
    		$$invalidate(14, medicamentosSeleccionados);
    	}

    	function ordenesmedicas_sltBuscarMedicamentos_binding(value) {
    		sltBuscarMedicamentos = value;
    		$$invalidate(13, sltBuscarMedicamentos);
    	}

    	function ordenesmedicas_medicamentos_binding(value) {
    		medicamentos = value;
    		$$invalidate(5, medicamentos);
    	}

    	function ordenesmedicas_instrucciones_binding(value) {
    		historia.instrucciones = value;
    		$$invalidate(6, historia);
    	}

    	function textarea3_input_handler() {
    		historia.observaciones = this.value;
    		$$invalidate(6, historia);
    	}

    	function input11_input_handler() {
    		fecha = this.value;
    		$$invalidate(10, fecha);
    	}

    	const blur_handler = () => console.log(hora);

    	function input12_input_handler() {
    		hora = this.value;
    		$$invalidate(11, hora);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(22, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		Header,
    		AsideAtencion,
    		ModalDatosPaciente,
    		ModalTratamientos,
    		ModalInterconsulta,
    		ModalAntecedentes,
    		OrdenesMedicas,
    		SignosVitales,
    		axios: axios$1,
    		onMount,
    		url,
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
    		searchMedicamentos,
    		searchDiagnosticos,
    		eliminarMedicamento,
    		agregarMedicamento,
    		cargarMedicamentos,
    		guardarHistoria,
    		cargarPaciente,
    		cargarHistoria,
    		cargarDiagnosticos,
    		seleccionarDiagnostico,
    		calcularEdad: calcularEdad$1,
    		filtroDiagnostico
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(22, params = $$props.params);
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("edad" in $$props) $$invalidate(1, edad = $$props.edad);
    		if ("seguro" in $$props) $$invalidate(2, seguro = $$props.seguro);
    		if ("diagnosticos" in $$props) $$invalidate(48, diagnosticos = $$props.diagnosticos);
    		if ("inpBuscarDiagnostico" in $$props) $$invalidate(3, inpBuscarDiagnostico = $$props.inpBuscarDiagnostico);
    		if ("diagnosticosSeleccionados" in $$props) $$invalidate(4, diagnosticosSeleccionados = $$props.diagnosticosSeleccionados);
    		if ("medicamentos" in $$props) $$invalidate(5, medicamentos = $$props.medicamentos);
    		if ("historia" in $$props) $$invalidate(6, historia = $$props.historia);
    		if ("temperatura" in $$props) $$invalidate(7, temperatura = $$props.temperatura);
    		if ("presionAlterial" in $$props) $$invalidate(8, presionAlterial = $$props.presionAlterial);
    		if ("peso" in $$props) $$invalidate(9, peso = $$props.peso);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("fecha" in $$props) $$invalidate(10, fecha = $$props.fecha);
    		if ("hora" in $$props) $$invalidate(11, hora = $$props.hora);
    		if ("cargando" in $$props) $$invalidate(12, cargando = $$props.cargando);
    		if ("sltBuscarMedicamentos" in $$props) $$invalidate(13, sltBuscarMedicamentos = $$props.sltBuscarMedicamentos);
    		if ("medicamentosSeleccionados" in $$props) $$invalidate(14, medicamentosSeleccionados = $$props.medicamentosSeleccionados);
    		if ("filtroDiagnostico" in $$props) $$invalidate(15, filtroDiagnostico = $$props.filtroDiagnostico);
    	};

    	let filtroDiagnostico;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*diagnosticos*/ 131072) {
    			 $$invalidate(15, filtroDiagnostico = diagnosticos);
    		}
    	};

    	return [
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
    		filtroDiagnostico,
    		searchMedicamentos,
    		searchDiagnosticos,
    		eliminarMedicamento,
    		agregarMedicamento,
    		guardarHistoria,
    		seleccionarDiagnostico,
    		params,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		input0_input_handler,
    		select0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		select1_change_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler,
    		textarea2_input_handler,
    		input10_input_handler,
    		click_handler,
    		ordenesmedicas_medicamentosSeleccionados_binding,
    		ordenesmedicas_sltBuscarMedicamentos_binding,
    		ordenesmedicas_medicamentos_binding,
    		ordenesmedicas_instrucciones_binding,
    		textarea3_input_handler,
    		input11_input_handler,
    		blur_handler,
    		input12_input_handler
    	];
    }

    class HistoriaClinica extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { params: 22 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoriaClinica",
    			options,
    			id: create_fragment$k.name
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

    const file$j = "src\\Pages\\Home\\Login.svelte";

    function create_fragment$l(ctx) {
    	let div9;
    	let div8;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let p0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p1;
    	let t2;
    	let form;
    	let div3;
    	let div1;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let div2;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let button;
    	let t10;
    	let p2;
    	let a;
    	let t12;
    	let div7;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			img = element("img");
    			t0 = space();
    			p1 = element("p");
    			p1.textContent = "xmedical pro";
    			t2 = space();
    			form = element("form");
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Correo";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Contraseña";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Entrar";
    			t10 = space();
    			p2 = element("p");
    			a = element("a");
    			a.textContent = "Olvide mi contraseña?";
    			t12 = space();
    			div7 = element("div");
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "80");
    			attr_dev(img, "alt", "");
    			add_location(img, file$j, 7, 28, 314);
    			add_location(p0, file$j, 6, 24, 281);
    			attr_dev(p1, "class", "admin-brand-content");
    			add_location(p1, file$j, 10, 24, 421);
    			attr_dev(div0, "class", "p-b-20 text-center");
    			add_location(div0, file$j, 5, 20, 223);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$j, 17, 32, 777);
    			attr_dev(input0, "type", "email");
    			input0.required = "true";
    			attr_dev(input0, "autocomplete", "username");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Correo");
    			add_location(input0, file$j, 18, 32, 839);
    			attr_dev(div1, "class", "form-group floating-label col-md-12");
    			add_location(div1, file$j, 16, 28, 694);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$j, 21, 32, 1090);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "autocomplete", "current-password");
    			attr_dev(input1, "placeholder", "Contraseña");
    			input1.required = "true";
    			attr_dev(input1, "class", "form-control ");
    			add_location(input1, file$j, 22, 32, 1163);
    			attr_dev(div2, "class", "form-group floating-label col-md-12");
    			add_location(div2, file$j, 20, 28, 1007);
    			attr_dev(div3, "class", "form-row");
    			add_location(div3, file$j, 15, 24, 642);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary btn-block btn-lg");
    			add_location(button, file$j, 26, 24, 1384);
    			attr_dev(form, "class", "needs-validation");
    			attr_dev(form, "action", "#");
    			add_location(form, file$j, 14, 20, 574);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-underline");
    			add_location(a, file$j, 30, 24, 1570);
    			attr_dev(p2, "class", "text-right p-t-10");
    			add_location(p2, file$j, 29, 20, 1515);
    			attr_dev(div4, "class", "mx-auto col-md-8");
    			add_location(div4, file$j, 4, 16, 171);
    			attr_dev(div5, "class", "row align-items-center m-h-100");
    			add_location(div5, file$j, 3, 12, 109);
    			attr_dev(div6, "class", "col-lg-4  bg-white");
    			add_location(div6, file$j, 2, 8, 63);
    			attr_dev(div7, "class", "col-lg-8 d-none d-md-block bg-cover");
    			set_style(div7, "background-image", "url('assets/img/login.svg')");
    			add_location(div7, file$j, 36, 8, 1736);
    			attr_dev(div8, "class", "row ");
    			add_location(div8, file$j, 1, 4, 35);
    			attr_dev(div9, "class", "container-fluid");
    			add_location(div9, file$j, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(p0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p1);
    			append_dev(div4, t2);
    			append_dev(div4, form);
    			append_dev(form, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t4);
    			append_dev(div1, input0);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t7);
    			append_dev(div2, input1);
    			append_dev(form, t8);
    			append_dev(form, button);
    			append_dev(div4, t10);
    			append_dev(div4, p2);
    			append_dev(p2, a);
    			append_dev(div8, t12);
    			append_dev(div8, div7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
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

    function instance$l($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$l.name
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
        "/login": Login,
        "/pacientes": Index$1,
        "/pacientes/perfil/:id": PacientePerfil,
        "/pacientes/crear": PacienteCrear,
        "/pacientes/:idPaciente/historias/:idHistoria": HistoriaClinica,
    };

    /* src\App.svelte generated by Svelte v3.29.0 */

    function create_fragment$m(ctx) {
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$m.name
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
