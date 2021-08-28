
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
    // const url = 'http://serenidad.xmedical.online:1337/api';
    // const url = 'https://consulta.xmedical.online/api';
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

    // (98:8) {#if user().roles.includes('doctor') || user().roles.includes('admin')}
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
    	let link_action_1;
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
    			add_location(span0, file$1, 103, 16, 4078);
    			attr_dev(span1, "class", "menu-name");
    			add_location(span1, file$1, 101, 14, 4005);
    			attr_dev(span2, "class", "menu-info");
    			add_location(span2, file$1, 105, 14, 4144);
    			attr_dev(span3, "class", "menu-label");
    			add_location(span3, file$1, 100, 12, 3964);
    			attr_dev(i0, "class", "icon-placeholder mdi mdi-link-variant ");
    			add_location(i0, file$1, 108, 14, 4269);
    			attr_dev(span4, "class", "menu-icon");
    			add_location(span4, file$1, 107, 12, 4229);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "open-dropdown menu-link");
    			add_location(a0, file$1, 99, 10, 3905);
    			attr_dev(span5, "class", "menu-name");
    			add_location(span5, file$1, 116, 18, 4580);
    			attr_dev(span6, "class", "menu-label");
    			add_location(span6, file$1, 115, 16, 4535);
    			attr_dev(i1, "class", "icon-placeholder ");
    			add_location(i1, file$1, 119, 18, 4706);
    			attr_dev(span7, "class", "menu-icon");
    			add_location(span7, file$1, 118, 16, 4662);
    			attr_dev(a1, "href", "/usuarios");
    			attr_dev(a1, "class", " menu-link");
    			add_location(a1, file$1, 114, 14, 4469);
    			attr_dev(li0, "class", "menu-item");
    			add_location(li0, file$1, 113, 12, 4431);
    			attr_dev(span8, "class", "menu-name");
    			add_location(span8, file$1, 127, 18, 4979);
    			attr_dev(span9, "class", "menu-label");
    			add_location(span9, file$1, 126, 16, 4934);
    			attr_dev(i2, "class", "icon-placeholder ");
    			add_location(i2, file$1, 130, 18, 5104);
    			attr_dev(span10, "class", "menu-icon");
    			add_location(span10, file$1, 129, 16, 5060);
    			attr_dev(a2, "href", "/empresa/detalles");
    			attr_dev(a2, "class", " menu-link");
    			add_location(a2, file$1, 125, 14, 4860);
    			attr_dev(li1, "class", "menu-item");
    			add_location(li1, file$1, 124, 12, 4822);
    			attr_dev(ul, "class", "sub-menu");
    			add_location(ul, file$1, 112, 10, 4396);
    			attr_dev(li2, "class", "menu-item");
    			add_location(li2, file$1, 98, 8, 3871);
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
    				dispose = [
    					action_destroyer(link_action = link.call(null, a1)),
    					action_destroyer(link_action_1 = link.call(null, a2))
    				];

    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(98:8) {#if user().roles.includes('doctor') || user().roles.includes('admin')}",
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
    	let span15;
    	let span14;
    	let t19;
    	let span16;
    	let i4;
    	let link_action_5;
    	let active_action_4;
    	let t20;
    	let show_if = user().roles.includes("doctor") || user().roles.includes("admin");
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
    			li3 = element("li");
    			a6 = element("a");
    			span12 = element("span");
    			span11 = element("span");
    			span11.textContent = "Recetas";
    			t16 = space();
    			span13 = element("span");
    			i3 = element("i");
    			t17 = space();
    			li4 = element("li");
    			a7 = element("a");
    			span15 = element("span");
    			span14 = element("span");
    			span14.textContent = "Citas";
    			t19 = space();
    			span16 = element("span");
    			i4 = element("i");
    			t20 = space();
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
    			attr_dev(span11, "class", "menu-name");
    			add_location(span11, file$1, 74, 14, 2837);
    			attr_dev(span12, "class", "menu-label");
    			add_location(span12, file$1, 73, 12, 2796);
    			attr_dev(i3, "class", "icon-placeholder mdi mdi-playlist-edit");
    			add_location(i3, file$1, 78, 14, 3039);
    			attr_dev(span13, "class", "menu-icon");
    			add_location(span13, file$1, 76, 12, 2910);
    			attr_dev(a6, "href", "/recetas");
    			attr_dev(a6, "class", "menu-link");
    			add_location(a6, file$1, 72, 10, 2736);
    			attr_dev(li3, "class", "menu-item");
    			add_location(li3, file$1, 71, 8, 2649);
    			attr_dev(span14, "class", "menu-name");
    			add_location(span14, file$1, 87, 14, 3403);
    			attr_dev(span15, "class", "menu-label");
    			add_location(span15, file$1, 86, 12, 3362);
    			attr_dev(i4, "class", "icon-placeholder mdi mdi-calendar-multiselect");
    			add_location(i4, file$1, 91, 14, 3603);
    			attr_dev(span16, "class", "menu-icon");
    			add_location(span16, file$1, 89, 12, 3474);
    			attr_dev(a7, "href", "/citas");
    			attr_dev(a7, "class", "menu-link");
    			add_location(a7, file$1, 85, 10, 3304);
    			attr_dev(li4, "class", "menu-item");
    			add_location(li4, file$1, 84, 8, 3219);
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
    			append_dev(a7, span15);
    			append_dev(span15, span14);
    			append_dev(a7, t19);
    			append_dev(a7, span16);
    			append_dev(span16, i4);
    			append_dev(ul, t20);
    			if (if_block) if_block.m(ul, null);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a3)),
    					action_destroyer(active_action = active$1.call(null, li0, { path: "/", className: "active" })),
    					action_destroyer(link_action_2 = link.call(null, a4)),
    					action_destroyer(active_action_1 = active$1.call(null, li1, { path: "/pacientes", className: "active" })),
    					action_destroyer(link_action_3 = link.call(null, a5)),
    					action_destroyer(active_action_2 = active$1.call(null, li2, { path: "/historias", className: "active" })),
    					action_destroyer(link_action_4 = link.call(null, a6)),
    					action_destroyer(active_action_3 = active$1.call(null, li3, { path: "/recetas", className: "active" })),
    					action_destroyer(link_action_5 = link.call(null, a7)),
    					action_destroyer(active_action_4 = active$1.call(null, li4, { path: "/citas", className: "active" }))
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
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (105:2) {#if errorServer}
    function create_if_block_2$1(ctx) {
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(105:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (144:20) {#if paciente.activo}
    function create_if_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let span;
    	let t0_value = /*paciente*/ ctx[10].nombres[0] + "";
    	let t0;
    	let t1_value = /*paciente*/ ctx[10].apellidos[0] + "";
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*paciente*/ ctx[10].nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*paciente*/ ctx[10].apellidos + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = calcularEdad(/*paciente*/ ctx[10].fechaNacimiento) + "";
    	let t7;
    	let t8;
    	let t9;
    	let td3;
    	let t10_value = /*paciente*/ ctx[10].sexo + "";
    	let t10;
    	let t11;
    	let td4;
    	let t12_value = /*paciente*/ ctx[10].celular + "";
    	let t12;
    	let t13;
    	let td5;
    	let t14_value = /*paciente*/ ctx[10].cedula + "";
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
    		return /*click_handler*/ ctx[7](/*paciente*/ ctx[10], ...args);
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
    			add_location(span, file$4, 147, 32, 4881);
    			attr_dev(div, "class", "avatar avatar-sm");
    			add_location(div, file$4, 146, 28, 4817);
    			add_location(td0, file$4, 145, 24, 4783);
    			add_location(td1, file$4, 150, 24, 5068);
    			add_location(td2, file$4, 151, 24, 5142);
    			add_location(td3, file$4, 152, 24, 5222);
    			add_location(td4, file$4, 153, 24, 5272);
    			add_location(td5, file$4, 154, 24, 5325);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$4, 163, 32, 5831);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$4, 157, 28, 5505);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$4, 171, 32, 6228);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[10].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Perfil");
    			add_location(a1, file$4, 165, 28, 5924);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$4, 155, 24, 5377);
    			add_location(tr, file$4, 144, 20, 4753);
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
    			if (dirty & /*pacientes*/ 1 && t0_value !== (t0_value = /*paciente*/ ctx[10].nombres[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pacientes*/ 1 && t1_value !== (t1_value = /*paciente*/ ctx[10].apellidos[0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*pacientes*/ 1 && t3_value !== (t3_value = /*paciente*/ ctx[10].nombres + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*pacientes*/ 1 && t5_value !== (t5_value = /*paciente*/ ctx[10].apellidos + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*pacientes*/ 1 && t7_value !== (t7_value = calcularEdad(/*paciente*/ ctx[10].fechaNacimiento) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*pacientes*/ 1 && t10_value !== (t10_value = /*paciente*/ ctx[10].sexo + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*pacientes*/ 1 && t12_value !== (t12_value = /*paciente*/ ctx[10].celular + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*pacientes*/ 1 && t14_value !== (t14_value = /*paciente*/ ctx[10].cedula + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*pacientes*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/perfil/${/*paciente*/ ctx[10].id}`)) {
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(144:20) {#if paciente.activo}",
    		ctx
    	});

    	return block;
    }

    // (143:16) {#each pacientes as paciente}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*paciente*/ ctx[10].activo && create_if_block_1$1(ctx);

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
    			if (/*paciente*/ ctx[10].activo) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(143:16) {#each pacientes as paciente}",
    		ctx
    	});

    	return block;
    }

    // (182:8) {#if cargando}
    function create_if_block$3(ctx) {
    	let div1;
    	let div0;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$4, 184, 24, 6638);
    			attr_dev(div0, "class", "spinner-border text-secondary");
    			attr_dev(div0, "role", "status");
    			add_location(div0, file$4, 183, 20, 6555);
    			attr_dev(div1, "class", "text-center");
    			add_location(div1, file$4, 182, 16, 6508);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(182:8) {#if cargando}",
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
    	let t22;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[1] && create_if_block_2$1(ctx);
    	let each_value = /*pacientes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = /*cargando*/ ctx[3] && create_if_block$3(ctx);

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

    			t22 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$4, 111, 6, 3259);
    			attr_dev(i, "class", "mdi mdi-plus");
    			add_location(i, file$4, 113, 89, 3412);
    			attr_dev(a, "href", "/pacientes/crear");
    			attr_dev(a, "class", "btn btn-primary btn-sm");
    			add_location(a, file$4, 113, 22, 3345);
    			add_location(h5, file$4, 113, 8, 3331);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$4, 120, 36, 3778);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$4, 121, 36, 3860);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$4, 119, 32, 3716);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$4, 118, 28, 3660);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$4, 117, 24, 3613);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$4, 116, 20, 3567);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$4, 115, 12, 3528);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$4, 114, 8, 3466);
    			add_location(th0, file$4, 132, 20, 4345);
    			add_location(th1, file$4, 133, 20, 4376);
    			add_location(th2, file$4, 134, 20, 4413);
    			add_location(th3, file$4, 135, 20, 4448);
    			add_location(th4, file$4, 136, 20, 4483);
    			add_location(th5, file$4, 137, 20, 4521);
    			add_location(th6, file$4, 138, 20, 4558);
    			add_location(tr, file$4, 131, 16, 4319);
    			add_location(thead, file$4, 130, 16, 4294);
    			add_location(tbody, file$4, 141, 16, 4634);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$4, 129, 12, 4228);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$4, 128, 8, 4184);
    			attr_dev(div8, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div8, file$4, 112, 6, 3286);
    			attr_dev(div9, "class", "p-2");
    			add_location(div9, file$4, 110, 4, 3234);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$4, 109, 2, 3197);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$4, 102, 0, 2989);
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

    			append_dev(div8, t22);
    			if (if_block1) if_block1.m(div8, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a)),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*searchPacientes*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorServer*/ ctx[1]) {
    				if (if_block0) {
    					if (dirty & /*errorServer*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
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

    			if (dirty & /*sltBuscarPacientes*/ 4) {
    				set_input_value(input, /*sltBuscarPacientes*/ ctx[2]);
    			}

    			if (dirty & /*pacientes, eliminarPaciente, calcularEdad*/ 33) {
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

    			if (/*cargando*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div8, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
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
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
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
    	let cargando = false;

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
    		$$invalidate(3, cargando = true);

    		const config = {
    			method: "get",
    			url: `${url}/pacientes?b=${sltBuscarPacientes}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			axios$1(config).then(res => {
    				$$invalidate(3, cargando = false);

    				if (res.status === 200) {
    					let { data } = res;
    					$$invalidate(0, pacientes = data);
    				}

    				if (res.status === 500) {
    					$$invalidate(1, errorServer = true);
    				}
    			}).catch(err => {
    				$$invalidate(3, cargando = false);
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
    		cargando,
    		searchPacientes,
    		eliminarPaciente,
    		cargarPacientes
    	});

    	$$self.$inject_state = $$props => {
    		if ("pacientes" in $$props) $$invalidate(0, pacientes = $$props.pacientes);
    		if ("errorServer" in $$props) $$invalidate(1, errorServer = $$props.errorServer);
    		if ("sltBuscarPacientes" in $$props) $$invalidate(2, sltBuscarPacientes = $$props.sltBuscarPacientes);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("cargando" in $$props) $$invalidate(3, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pacientes,
    		errorServer,
    		sltBuscarPacientes,
    		cargando,
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
    			add_location(h5, file$a, 17, 20, 466);
    			set_style(p, "padding", "0");
    			set_style(p, "margin", "0");
    			add_location(p, file$a, 18, 20, 626);
    			attr_dev(div, "class", "alert alert-secondary");
    			set_style(div, "padding", "10px");
    			attr_dev(div, "role", "alert");
    			add_location(div, file$a, 16, 16, 373);
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

    // (14:4) {#each antecedentes.reverse() as antecedente}
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
    		source: "(14:4) {#each antecedentes.reverse() as antecedente}",
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
    	let each_value = /*antecedentes*/ ctx[2].reverse();
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
    				each_value = /*antecedentes*/ ctx[2].reverse();
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

    // (185:2) {#if cargando}
    function create_if_block_5(ctx) {
    	let div;
    	let loading;
    	let current;
    	loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loading.$$.fragment);
    			attr_dev(div, "class", "cargando svelte-3oo6xw");
    			add_location(div, file$b, 185, 4, 5506);
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(185:2) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    // (333:20) {#if historia.activo}
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(333:20) {#if historia.activo}",
    		ctx
    	});

    	return block;
    }

    // (332:18) {#each historiasPaciente as historia}
    function create_each_block_4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*historia*/ ctx[45].activo && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*historia*/ ctx[45].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*historiasPaciente*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(332:18) {#each historiasPaciente as historia}",
    		ctx
    	});

    	return block;
    }

    // (370:20) {#each categoriasAntecedentes as categoria}
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
    		source: "(370:20) {#each categoriasAntecedentes as categoria}",
    		ctx
    	});

    	return block;
    }

    // (497:26) {#if antecedente.categoria.id === categoria.id}
    function create_if_block_2$2(ctx) {
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
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(497:26) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (498:28) {#if antecedente.activo === false}
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
    			add_location(i, file$b, 505, 33, 18459);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$b, 506, 32, 18519);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-outline-primary btn-sm mb-1 mr-2");
    			set_style(button, "box-shadow", "none");
    			add_location(button, file$b, 499, 30, 18103);
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
    		source: "(498:28) {#if antecedente.activo === false}",
    		ctx
    	});

    	return block;
    }

    // (496:24) {#each antecedentes as antecedente}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let if_block = /*antecedente*/ ctx[38].categoria.id === /*categoria*/ ctx[35].id && create_if_block_2$2(ctx);

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
    					if_block = create_if_block_2$2(ctx);
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
    		source: "(496:24) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (523:32) {#if antecedente.categoria.id === categoria.id}
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
    		source: "(523:32) {#if antecedente.categoria.id === categoria.id}",
    		ctx
    	});

    	return block;
    }

    // (524:34) {#if antecedente.activo === true}
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
    			add_location(i0, file$b, 531, 42, 19824);
    			attr_dev(span, "data-bind", "text: nombre");
    			add_location(span, file$b, 532, 42, 19906);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$b, 530, 40, 19756);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$b, 529, 38, 19689);
    			attr_dev(i1, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i1, file$b, 545, 44, 20671);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "data-toggle", "dropdown");
    			attr_dev(a, "aria-haspopup", "true");
    			attr_dev(a, "aria-expanded", "false");
    			add_location(a, file$b, 539, 42, 20323);
    			attr_dev(i2, "class", "mdi mdi-trash-can-outline");
    			add_location(i2, file$b, 559, 47, 21527);
    			attr_dev(button, "class", "dropdown-item text-danger");
    			attr_dev(button, "type", "button");
    			add_location(button, file$b, 552, 44, 21078);
    			attr_dev(div2, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div2, file$b, 549, 42, 20896);
    			attr_dev(div3, "class", "dropdown");
    			add_location(div3, file$b, 538, 40, 20257);
    			attr_dev(div4, "class", "card-controls");
    			add_location(div4, file$b, 537, 38, 20188);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			set_style(textarea, "display", "block");
    			set_style(textarea, "height", "100px");
    			attr_dev(textarea, "id", "exampleFormControlTextarea1");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "Comentario");
    			add_location(textarea, file$b, 568, 40, 22022);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$b, 567, 38, 21957);
    			attr_dev(div6, "class", "card m-b-20 mt-3");
    			set_style(div6, "box-shadow", "none");
    			set_style(div6, "border", "1px grey solid");
    			add_location(div6, file$b, 525, 36, 19453);
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
    		source: "(524:34) {#if antecedente.activo === true}",
    		ctx
    	});

    	return block;
    }

    // (522:30) {#each antecedentes as antecedente}
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
    		source: "(522:30) {#each antecedentes as antecedente}",
    		ctx
    	});

    	return block;
    }

    // (481:16) {#each categoriasAntecedentes as categoria}
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
    			add_location(div0, file$b, 486, 22, 17442);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$b, 485, 20, 17393);
    			attr_dev(div2, "class", "botones-antecedentes");
    			attr_dev(div2, "data-bind", "foreach: tiposAntecedentesFiltrados");
    			add_location(div2, file$b, 491, 22, 17662);
    			attr_dev(div3, "class", "col-lg-12");
    			attr_dev(div3, "data-bind", "foreach: antecedentesFiltrados");
    			add_location(div3, file$b, 517, 28, 18981);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$b, 516, 26, 18934);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$b, 515, 24, 18886);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$b, 514, 22, 18843);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$b, 490, 20, 17615);
    			attr_dev(div8, "class", "card  m-b-30");
    			set_style(div8, "box-shadow", "none");
    			set_style(div8, "border", "#32325d solid 1px");
    			add_location(div8, file$b, 481, 18, 17230);
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
    		source: "(481:16) {#each categoriasAntecedentes as categoria}",
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
    	let if_block = /*cargando*/ ctx[0] && create_if_block_5(ctx);
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
    				peso: /*peso*/ ctx[7] ?? 0,
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
    			add_location(div0, file$b, 204, 12, 6020);
    			attr_dev(i0, "class", "mdi mdi-progress-check mdi-18px");
    			add_location(i0, file$b, 325, 22, 11361);
    			attr_dev(div1, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div1, file$b, 324, 20, 11288);
    			attr_dev(div2, "class", "avatar mr-2 avatar-xs");
    			add_location(div2, file$b, 323, 18, 11231);
    			attr_dev(div3, "class", "card-header");
    			add_location(div3, file$b, 322, 16, 11186);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$b, 330, 16, 11542);
    			attr_dev(div5, "class", "card m-b-30");
    			add_location(div5, file$b, 321, 14, 11143);
    			attr_dev(div6, "class", "col-md-5 order-2 order-sm-1");
    			add_location(div6, file$b, 320, 12, 11086);
    			attr_dev(i1, "class", "mdi mdi-history mdi-18px");
    			add_location(i1, file$b, 354, 22, 12547);
    			attr_dev(div7, "class", "avatar-title bg-dark rounded-circle");
    			add_location(div7, file$b, 353, 20, 12474);
    			attr_dev(div8, "class", "avatar mr-2 avatar-xs");
    			add_location(div8, file$b, 352, 18, 12417);
    			add_location(span0, file$b, 360, 18, 12764);
    			attr_dev(i2, "class", "mdi mdi-plus");
    			add_location(i2, file$b, 364, 21, 12981);
    			attr_dev(button0, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#modalAntecedentes");
    			add_location(button0, file$b, 360, 50, 12796);
    			attr_dev(div9, "class", "card-header");
    			add_location(div9, file$b, 351, 16, 12372);
    			attr_dev(div10, "class", "atenciones-vnc mb-3");
    			add_location(div10, file$b, 368, 18, 13136);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$b, 367, 16, 13093);
    			attr_dev(div12, "class", "card m-b-30");
    			add_location(div12, file$b, 350, 14, 12329);
    			attr_dev(div13, "class", "col-md-4 order-lg-12 order-sm-2");
    			add_location(div13, file$b, 349, 12, 12268);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$b, 203, 10, 5989);
    			attr_dev(div15, "class", "col-md-12");
    			add_location(div15, file$b, 202, 8, 5954);
    			attr_dev(div16, "class", "pull-up");
    			add_location(div16, file$b, 201, 6, 5923);
    			attr_dev(section0, "class", "admin-content");
    			add_location(section0, file$b, 191, 4, 5622);
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "modalAntecedentes");
    			add_location(h5, file$b, 457, 12, 16288);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$b, 464, 14, 16532);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$b, 458, 12, 16366);
    			attr_dev(i3, "class", "mdi mdi-check-all");
    			add_location(i3, file$b, 472, 18, 16864);
    			add_location(i4, file$b, 472, 50, 16896);
    			attr_dev(div17, "class", "guardando mr-2 text-success");
    			attr_dev(div17, "data-bind", "html: content, class: contentClass");
    			add_location(div17, file$b, 468, 16, 16700);
    			attr_dev(div18, "class", "guardar-documento");
    			add_location(div18, file$b, 467, 14, 16651);
    			set_style(div19, "margin-right", "40px");
    			add_location(div19, file$b, 466, 12, 16602);
    			attr_dev(div20, "class", "modal-header");
    			add_location(div20, file$b, 456, 10, 16248);
    			attr_dev(div21, "class", "col-lg-12");
    			attr_dev(div21, "data-bind", "foreach: gruposAntecedentes");
    			add_location(div21, file$b, 479, 14, 17086);
    			attr_dev(div22, "class", "row");
    			add_location(div22, file$b, 478, 12, 17053);
    			attr_dev(div23, "class", "modal-body");
    			add_location(div23, file$b, 477, 10, 17015);
    			attr_dev(div24, "class", "modal-content");
    			add_location(div24, file$b, 455, 8, 16209);
    			attr_dev(div25, "class", "modal-dialog");
    			attr_dev(div25, "role", "document");
    			add_location(div25, file$b, 454, 6, 16157);
    			attr_dev(div26, "class", "modal fade modal-slide-right");
    			attr_dev(div26, "id", "modalAntecedentes");
    			attr_dev(div26, "tabindex", "-1");
    			attr_dev(div26, "role", "dialog");
    			attr_dev(div26, "aria-labelledby", "modalAntecedentes");
    			set_style(div26, "display", "none");
    			attr_dev(div26, "aria-hidden", "true");
    			add_location(div26, file$b, 445, 4, 15923);
    			attr_dev(section1, "class", "admin-content");
    			add_location(section1, file$b, 190, 2, 5585);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$b, 183, 0, 5429);
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
    					if_block = create_if_block_5(ctx);
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
    			if (dirty[0] & /*peso*/ 128) ultimosvitales_changes.peso = /*peso*/ ctx[7] ?? 0;
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
    	let peso = 0;
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

    			if (historiasPaciente.length !== 0) {
    				$$invalidate(7, peso = promesa.data[0].peso.valor);
    				$$invalidate(8, tipoPeso = promesa.data[0].peso.tipo);
    				$$invalidate(9, temperatura = promesa.data[0].temperatura.valor);
    				$$invalidate(10, tipoTemperatura = promesa.data[0].temperatura.tipo);
    				$$invalidate(11, frecuenciaRespiratoria = promesa.data[0].frecuenciaRespiratoria);
    				$$invalidate(12, frecuenciaCardiaca = promesa.data[0].frecuenciaCardiaca);
    				$$invalidate(13, presionAlterial = `${promesa.data[0].presionAlterial.mm}/${promesa.data[0].presionAlterial.Hg}`);
    			} else {
    				return false;
    			}
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
    		for (const ant of paciente.antecedentes.reverse()) {
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
    			add_location(div, file$i, 57, 48, 2605);
    			add_location(li, file$i, 56, 44, 2551);
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
    			add_location(p, file$i, 153, 44, 8872);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$i, 152, 40, 8775);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$i, 157, 40, 9133);
    			attr_dev(div1, "class", "col-md-12 mt-3");
    			add_location(div1, file$i, 151, 36, 8705);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$i, 150, 33, 8650);
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
    			add_location(p, file$i, 89, 45, 4540);
    			attr_dev(div0, "class", "col p-3");
    			set_style(div0, "display", "flex");
    			set_style(div0, "align-items", "center");
    			set_style(div0, "justify-content", "left");
    			add_location(div0, file$i, 85, 41, 4270);
    			set_style(label0, "margin", "0");
    			attr_dev(label0, "class", "form-label text-primary");
    			add_location(label0, file$i, 99, 49, 5181);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$i, 104, 49, 5532);
    			attr_dev(div1, "class", "mb-2");
    			add_location(div1, file$i, 97, 45, 5005);
    			attr_dev(div2, "class", "col mt-2");
    			add_location(div2, file$i, 96, 41, 4936);
    			set_style(label1, "margin", "0");
    			attr_dev(label1, "class", "form-label text-primary");
    			add_location(label1, file$i, 115, 49, 6300);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$i, 120, 49, 6639);
    			attr_dev(div3, "class", "mb-2");
    			add_location(div3, file$i, 113, 45, 6124);
    			attr_dev(div4, "class", "col mt-2");
    			add_location(div4, file$i, 112, 41, 6055);
    			set_style(label2, "margin", "0");
    			attr_dev(label2, "class", "form-label text-primary");
    			add_location(label2, file$i, 131, 49, 7402);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$i, 136, 49, 7743);
    			attr_dev(div5, "class", "mb-2");
    			add_location(div5, file$i, 129, 45, 7226);
    			attr_dev(div6, "class", "col mt-2");
    			add_location(div6, file$i, 128, 41, 7157);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$i, 84, 37, 4210);
    			attr_dev(i_1, "class", "mdi mdi-close text-red svelte-g4z6qg");
    			add_location(i_1, file$i, 146, 44, 8395);
    			attr_dev(div8, "class", "icon-borrar svelte-g4z6qg");
    			attr_dev(div8, "data-tooltip", "Eliminar");
    			add_location(div8, file$i, 145, 40, 8300);
    			attr_dev(div9, "class", "col-lg-12 border border-primary rounded mt-3");
    			add_location(div9, file$i, 81, 33, 4040);
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

    // (230:48) {:else}
    function create_else_block_1(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-image");
    			add_location(i, file$i, 231, 52, 12879);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 230, 48, 12791);
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
    		source: "(230:48) {:else}",
    		ctx
    	});

    	return block;
    }

    // (226:44) {#if estudio.tipo === 'LAB'}
    function create_if_block_2$3(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-microscope");
    			add_location(i, file$i, 227, 52, 12593);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 226, 48, 12505);
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
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(226:44) {#if estudio.tipo === 'LAB'}",
    		ctx
    	});

    	return block;
    }

    // (219:36) {#each estudios as estudio}
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
    		if (/*estudio*/ ctx[30].tipo === "LAB") return create_if_block_2$3;
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
    			add_location(div, file$i, 221, 44, 12195);
    			add_location(li, file$i, 219, 40, 11984);
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
    		source: "(219:36) {#each estudios as estudio}",
    		ctx
    	});

    	return block;
    }

    // (260:37) {:else}
    function create_else_block$2(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-image");
    			add_location(i, file$i, 261, 42, 14446);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 260, 37, 14369);
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
    		source: "(260:37) {:else}",
    		ctx
    	});

    	return block;
    }

    // (256:32) {#if item.tipo === 'LAB'}
    function create_if_block_1$4(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "mdi mdi-microscope");
    			add_location(i, file$i, 257, 45, 14201);
    			attr_dev(span, "class", "badge badge-primary");
    			add_location(span, file$i, 256, 40, 14121);
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
    		source: "(256:32) {#if item.tipo === 'LAB'}",
    		ctx
    	});

    	return block;
    }

    // (254:24) {#each estudiosSeleccionados.reverse() as item, i}
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
    			add_location(span, file$i, 264, 38, 14600);
    			attr_dev(i_1, "class", "mdi-18px mdi mdi-trash-can-outline");
    			add_location(i_1, file$i, 283, 41, 15819);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-danger");
    			attr_dev(a, "data-toggle", "tooltip");
    			attr_dev(a, "data-placement", "top");
    			attr_dev(a, "data-original-title", "Eliminar diagnostico");
    			add_location(a, file$i, 276, 36, 15349);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", "0");
    			set_style(div, "right", "0");
    			set_style(div, "padding", "10px");
    			set_style(div, "background-color", "white");
    			set_style(div, "border-bottom-left-radius", "5px");
    			add_location(div, file$i, 265, 32, 14665);
    			add_location(li, file$i, 254, 28, 14016);
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
    		source: "(254:24) {#each estudiosSeleccionados.reverse() as item, i}",
    		ctx
    	});

    	return block;
    }

    // (291:24) {#if estudiosSeleccionados.length === 0}
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
    			add_location(p, file$i, 297, 40, 16524);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$i, 293, 36, 16311);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$i, 304, 36, 16902);
    			attr_dev(div1, "class", "col-md-12");
    			add_location(div1, file$i, 292, 32, 16250);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$i, 291, 28, 16199);
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
    		source: "(291:24) {#if estudiosSeleccionados.length === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div29;
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
    	let div22;
    	let div14;
    	let div12;
    	let t11;
    	let div13;
    	let a2;
    	let i2;
    	let t12;
    	let a2_href_value;
    	let link_action_1;
    	let t13;
    	let a3;
    	let i3;
    	let t14;
    	let a3_href_value;
    	let link_action_2;
    	let t15;
    	let div21;
    	let div20;
    	let div18;
    	let div17;
    	let div16;
    	let input1;
    	let t16;
    	let ul1;
    	let div15;
    	let t17;
    	let li1;
    	let a4;
    	let i4;
    	let t18;
    	let t19;
    	let div19;
    	let ul2;
    	let t20;
    	let t21;
    	let div28;
    	let div24;
    	let div23;
    	let t23;
    	let div27;
    	let div26;
    	let div25;
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

    	let each_value = /*estudiosSeleccionados*/ ctx[6].reverse();
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	let if_block = /*estudiosSeleccionados*/ ctx[6].length === 0 && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div29 = element("div");
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
    			div22 = element("div");
    			div14 = element("div");
    			div12 = element("div");
    			div12.textContent = "Estudios";
    			t11 = space();
    			div13 = element("div");
    			a2 = element("a");
    			i2 = element("i");
    			t12 = text(" Laboratorios");
    			t13 = space();
    			a3 = element("a");
    			i3 = element("i");
    			t14 = text(" Imagenes");
    			t15 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			input1 = element("input");
    			t16 = space();
    			ul1 = element("ul");
    			div15 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();
    			li1 = element("li");
    			a4 = element("a");
    			i4 = element("i");
    			t18 = text(" Agregar manualmente");
    			t19 = space();
    			div19 = element("div");
    			ul2 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t20 = space();
    			if (if_block) if_block.c();
    			t21 = space();
    			div28 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div23.textContent = "Instrucciones";
    			t23 = space();
    			div27 = element("div");
    			div26 = element("div");
    			div25 = element("div");
    			textarea = element("textarea");
    			attr_dev(h4, "class", "alert-heading");
    			add_location(h4, file$i, 18, 4, 525);
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$i, 21, 12, 647);
    			attr_dev(i0, "class", "mdi mdi-printer");
    			add_location(i0, file$i, 28, 20, 1007);
    			attr_dev(a0, "href", a0_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/medicamentos`);
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
    			add_location(input0, file$i, 38, 32, 1379);
    			attr_dev(div3, "class", "contenidoLista");
    			add_location(div3, file$i, 54, 36, 2400);
    			attr_dev(i1, "class", "mdi mdi-plus");
    			add_location(i1, file$i, 70, 45, 3492);
    			attr_dev(a1, "href", "#!");
    			add_location(a1, file$i, 68, 40, 3307);
    			attr_dev(li0, "class", "defecto");
    			add_location(li0, file$i, 67, 36, 3245);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$i, 48, 32, 1966);
    			attr_dev(div4, "class", "dropdown");
    			add_location(div4, file$i, 37, 28, 1323);
    			attr_dev(div5, "class", "col-lg-6");
    			add_location(div5, file$i, 36, 24, 1271);
    			attr_dev(div6, "class", "col-lg-12");
    			add_location(div6, file$i, 78, 24, 3853);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$i, 35, 20, 1228);
    			attr_dev(div8, "class", "col-md-12 mb-2");
    			add_location(div8, file$i, 34, 16, 1178);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$i, 33, 12, 1143);
    			attr_dev(div10, "class", "card-body");
    			add_location(div10, file$i, 32, 8, 1106);
    			attr_dev(div11, "class", "card m-b-20 mt-3");
    			add_location(div11, file$i, 19, 4, 568);
    			attr_dev(div12, "class", "card-title");
    			add_location(div12, file$i, 172, 12, 9527);
    			attr_dev(i2, "class", "mdi mdi-printer");
    			add_location(i2, file$i, 179, 20, 9892);
    			attr_dev(a2, "href", a2_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/estudios/laboratorios`);
    			attr_dev(a2, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(a2, "data-tooltip", "Imprimir");
    			add_location(a2, file$i, 174, 16, 9624);
    			attr_dev(i3, "class", "mdi mdi-printer");
    			add_location(i3, file$i, 186, 20, 10240);
    			attr_dev(a3, "href", a3_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/estudios/imagenes`);
    			attr_dev(a3, "class", "btn btn-outline-primary btn-sm");
    			attr_dev(a3, "data-tooltip", "Imprimir");
    			add_location(a3, file$i, 181, 16, 9976);
    			attr_dev(div13, "class", "card-controls");
    			add_location(div13, file$i, 173, 12, 9579);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file$i, 171, 8, 9488);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "data-toggle", "dropdown");
    			attr_dev(input1, "aria-haspopup", "true");
    			attr_dev(input1, "aria-expanded", "false");
    			attr_dev(input1, "placeholder", "Buscar estudios");
    			add_location(input1, file$i, 198, 32, 10687);
    			attr_dev(div15, "class", "contenidoLista");
    			attr_dev(div15, "data-bind", "foreach: listado");
    			add_location(div15, file$i, 214, 36, 11700);
    			attr_dev(i4, "class", "mdi mdi-plus");
    			add_location(i4, file$i, 243, 45, 13560);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "data-bind", "click: agregarManualmente");
    			add_location(a4, file$i, 240, 40, 13374);
    			attr_dev(li1, "class", "defecto");
    			add_location(li1, file$i, 239, 36, 13312);
    			attr_dev(ul1, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul1, "id", "buscador");
    			attr_dev(ul1, "x-placement", "bottom-start");
    			set_style(ul1, "position", "absolute");
    			set_style(ul1, "will-change", "transform");
    			set_style(ul1, "border-radius", "5px");
    			set_style(ul1, "top", "0px");
    			set_style(ul1, "left", "0px");
    			set_style(ul1, "transform", "translate3d(0px, 36px, 0px)");
    			add_location(ul1, file$i, 208, 32, 11265);
    			attr_dev(div16, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div16, file$i, 195, 28, 10534);
    			attr_dev(div17, "class", "col-lg-6 col-md-12");
    			add_location(div17, file$i, 194, 24, 10472);
    			attr_dev(div18, "class", "col-12 row");
    			add_location(div18, file$i, 193, 16, 10422);
    			attr_dev(ul2, "class", "list-info");
    			add_location(ul2, file$i, 252, 20, 13888);
    			attr_dev(div19, "class", "col-12");
    			add_location(div19, file$i, 251, 16, 13846);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$i, 192, 12, 10387);
    			attr_dev(div21, "class", "card-body");
    			add_location(div21, file$i, 191, 8, 10350);
    			attr_dev(div22, "class", "card m-b-20");
    			add_location(div22, file$i, 170, 4, 9453);
    			attr_dev(div23, "class", "card-title");
    			add_location(div23, file$i, 320, 12, 17365);
    			attr_dev(div24, "class", "card-header");
    			add_location(div24, file$i, 319, 8, 17326);
    			attr_dev(textarea, "class", "form-control");
    			set_style(textarea, "width", "100%");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$i, 325, 20, 17548);
    			attr_dev(div25, "class", "col-12");
    			add_location(div25, file$i, 324, 16, 17506);
    			attr_dev(div26, "class", "row");
    			add_location(div26, file$i, 323, 12, 17471);
    			attr_dev(div27, "class", "card-body");
    			add_location(div27, file$i, 322, 8, 17434);
    			attr_dev(div28, "class", "card m-b-20");
    			add_location(div28, file$i, 318, 4, 17291);
    			attr_dev(div29, "class", "alert alert-secondary");
    			attr_dev(div29, "role", "alert");
    			add_location(div29, file$i, 17, 0, 471);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div29, anchor);
    			append_dev(div29, h4);
    			append_dev(div29, t1);
    			append_dev(div29, div11);
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

    			append_dev(div29, t9);
    			append_dev(div29, div22);
    			append_dev(div22, div14);
    			append_dev(div14, div12);
    			append_dev(div14, t11);
    			append_dev(div14, div13);
    			append_dev(div13, a2);
    			append_dev(a2, i2);
    			append_dev(a2, t12);
    			append_dev(div13, t13);
    			append_dev(div13, a3);
    			append_dev(a3, i3);
    			append_dev(a3, t14);
    			append_dev(div22, t15);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, input1);
    			set_input_value(input1, /*sltBuscarEstudios*/ ctx[2]);
    			append_dev(div16, t16);
    			append_dev(div16, ul1);
    			append_dev(ul1, div15);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div15, null);
    			}

    			append_dev(ul1, t17);
    			append_dev(ul1, li1);
    			append_dev(li1, a4);
    			append_dev(a4, i4);
    			append_dev(a4, t18);
    			append_dev(div20, t19);
    			append_dev(div20, div19);
    			append_dev(div19, ul2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul2, null);
    			}

    			append_dev(ul2, t20);
    			if (if_block) if_block.m(ul2, null);
    			append_dev(div29, t21);
    			append_dev(div29, div28);
    			append_dev(div28, div24);
    			append_dev(div24, div23);
    			append_dev(div28, t23);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, textarea);
    			set_input_value(textarea, /*instrucciones*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input0, "input", /*input_handler*/ ctx[11], false, false, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[13]), false, true, false),
    					action_destroyer(link_action_1 = link.call(null, a2)),
    					action_destroyer(link_action_2 = link.call(null, a3)),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[21]),
    					listen_dev(input1, "input", /*input_handler_1*/ ctx[22], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[25]),
    					listen_dev(textarea, "blur", /*blur_handler_3*/ ctx[26], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*idPaciente, idHistoria*/ 384 && a0_href_value !== (a0_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/medicamentos`)) {
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

    			if (dirty[0] & /*idPaciente, idHistoria*/ 384 && a2_href_value !== (a2_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/estudios/laboratorios`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty[0] & /*idPaciente, idHistoria*/ 384 && a3_href_value !== (a3_href_value = `/impresion/pacientes/${/*idPaciente*/ ctx[8]}/historias/${/*idHistoria*/ ctx[7]}/estudios/imagenes`)) {
    				attr_dev(a3, "href", a3_href_value);
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
    						each_blocks_1[i].m(div15, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*dispatch, estudiosSeleccionados*/ 576) {
    				each_value = /*estudiosSeleccionados*/ ctx[6].reverse();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul2, t20);
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
    			if (detaching) detach_dev(div29);
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

    /* src\componentes\NoConexion.svelte generated by Svelte v3.29.0 */

    const file$j = "src\\componentes\\NoConexion.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h3;
    	let t2;
    	let p;
    	let t4;
    	let button;
    	let i;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "Ocurrió un error al comunicarnos con el servidor";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Si el problema persiste, contacte al administrador. Disculpe los inconvenientes";
    			t4 = space();
    			button = element("button");
    			i = element("i");
    			t5 = text(" Recargar");
    			attr_dev(img, "class", "imagen-error svelte-1gsainp");
    			if (img.src !== (img_src_value = "./assets/img/error.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$j, 1, 4, 28);
    			attr_dev(h3, "class", "svelte-1gsainp");
    			add_location(h3, file$j, 2, 4, 96);
    			attr_dev(p, "class", "svelte-1gsainp");
    			add_location(p, file$j, 3, 4, 159);
    			attr_dev(i, "class", "mdi mdi-refresh");
    			add_location(i, file$j, 8, 8, 358);
    			attr_dev(button, "class", "btn btn-outline-primary");
    			add_location(button, file$j, 4, 4, 251);
    			attr_dev(div, "class", "cargando svelte-1gsainp");
    			add_location(div, file$j, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h3);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(div, t4);
    			append_dev(div, button);
    			append_dev(button, i);
    			append_dev(button, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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
    	validate_slots("NoConexion", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NoConexion> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => location.reload();
    	return [click_handler];
    }

    class NoConexion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NoConexion",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\Pages\AtencionMedica\HistoriaClinica.svelte generated by Svelte v3.29.0 */

    const { console: console_1$6 } = globals;
    const file$k = "src\\Pages\\AtencionMedica\\HistoriaClinica.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[108] = list[i];
    	child_ctx[109] = list;
    	child_ctx[110] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[111] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[108] = list[i];
    	child_ctx[114] = list;
    	child_ctx[115] = i;
    	return child_ctx;
    }

    function get_each_context_3$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[108] = list[i];
    	child_ctx[116] = list;
    	child_ctx[117] = i;
    	return child_ctx;
    }

    // (434:4) {#if errorServer}
    function create_if_block_12(ctx) {
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
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(434:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (437:4) {#if serverConexion}
    function create_if_block_11(ctx) {
    	let noconexion;
    	let current;
    	noconexion = new NoConexion({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(noconexion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(noconexion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(noconexion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(noconexion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(noconexion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(437:4) {#if serverConexion}",
    		ctx
    	});

    	return block;
    }

    // (453:16) {#if !cargando && !errorServer}
    function create_if_block_10(ctx) {
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
    			add_location(i0, file$k, 456, 24, 15243);
    			add_location(i1, file$k, 456, 56, 15275);
    			attr_dev(div, "class", "guardando mr-2 text-success");
    			add_location(div, file$k, 453, 20, 15129);
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
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(453:16) {#if !cargando && !errorServer}",
    		ctx
    	});

    	return block;
    }

    // (460:16) {#if errorServer}
    function create_if_block_9(ctx) {
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
    			add_location(i0, file$k, 463, 20, 15515);
    			add_location(i1, file$k, 463, 50, 15545);
    			attr_dev(div, "class", "guardando mr-2 text-danger");
    			add_location(div, file$k, 460, 20, 15406);
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
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(460:16) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (467:16) {#if cargando && !errorServer}
    function create_if_block_8(ctx) {
    	let div;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t = text(" Guardando");
    			attr_dev(i, "class", "mdi mdi-cached mdi-spin");
    			add_location(i, file$k, 470, 24, 15805);
    			attr_dev(div, "class", "guardando mr-2 text-secondary");
    			add_location(div, file$k, 467, 20, 15689);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(467:16) {#if cargando && !errorServer}",
    		ctx
    	});

    	return block;
    }

    // (588:12) {#if empresa.historiaGinecologica}
    function create_if_block_7(ctx) {
    	let div37;
    	let div1;
    	let div0;
    	let t1;
    	let div36;
    	let div18;
    	let div3;
    	let div2;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div5;
    	let div4;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div7;
    	let div6;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let div9;
    	let div8;
    	let label3;
    	let t12;
    	let input3;
    	let t13;
    	let div11;
    	let div10;
    	let label4;
    	let t15;
    	let input4;
    	let t16;
    	let div13;
    	let div12;
    	let label5;
    	let t18;
    	let input5;
    	let t19;
    	let div15;
    	let div14;
    	let label6;
    	let t21;
    	let input6;
    	let t22;
    	let div17;
    	let div16;
    	let label7;
    	let t24;
    	let input7;
    	let t25;
    	let hr0;
    	let t26;
    	let div33;
    	let div20;
    	let div19;
    	let label8;
    	let t28;
    	let input8;
    	let t29;
    	let div22;
    	let div21;
    	let label9;
    	let t31;
    	let input9;
    	let t32;
    	let div24;
    	let div23;
    	let label10;
    	let t34;
    	let input10;
    	let t35;
    	let div26;
    	let div25;
    	let label11;
    	let t37;
    	let input11;
    	let t38;
    	let div28;
    	let div27;
    	let label12;
    	let t40;
    	let input12;
    	let t41;
    	let div30;
    	let div29;
    	let label13;
    	let t43;
    	let input13;
    	let t44;
    	let div32;
    	let div31;
    	let label14;
    	let t46;
    	let input14;
    	let t47;
    	let h5;
    	let t49;
    	let hr1;
    	let t50;
    	let div35;
    	let div34;
    	let label15;
    	let input15;
    	let t51;
    	let span0;
    	let t52;
    	let span1;
    	let t54;
    	let label16;
    	let input16;
    	let t55;
    	let span2;
    	let t56;
    	let span3;
    	let t58;
    	let label17;
    	let input17;
    	let t59;
    	let span4;
    	let t60;
    	let span5;
    	let t62;
    	let label18;
    	let input18;
    	let t63;
    	let span6;
    	let t64;
    	let span7;
    	let t66;
    	let label19;
    	let input19;
    	let t67;
    	let span8;
    	let t68;
    	let span9;
    	let t70;
    	let label20;
    	let input20;
    	let t71;
    	let span10;
    	let t72;
    	let span11;
    	let t74;
    	let label21;
    	let input21;
    	let t75;
    	let span12;
    	let t76;
    	let span13;
    	let t78;
    	let label22;
    	let input22;
    	let t79;
    	let span14;
    	let t80;
    	let span15;
    	let t82;
    	let label23;
    	let input23;
    	let t83;
    	let span16;
    	let t84;
    	let span17;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div37 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Historia Ginecologica";
    			t1 = space();
    			div36 = element("div");
    			div18 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Fecha ultima menstruación";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Fecha ultimo pap";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div7 = element("div");
    			div6 = element("div");
    			label2 = element("label");
    			label2.textContent = "Fecha ultimo parto";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div9 = element("div");
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Fecha ultimo aborto";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			div11 = element("div");
    			div10 = element("div");
    			label4 = element("label");
    			label4.textContent = "Fecha ultima cesárea";
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			div13 = element("div");
    			div12 = element("div");
    			label5 = element("label");
    			label5.textContent = "Intervalo flujo menstrual";
    			t18 = space();
    			input5 = element("input");
    			t19 = space();
    			div15 = element("div");
    			div14 = element("div");
    			label6 = element("label");
    			label6.textContent = "Cantidad flujo menstrual";
    			t21 = space();
    			input6 = element("input");
    			t22 = space();
    			div17 = element("div");
    			div16 = element("div");
    			label7 = element("label");
    			label7.textContent = "Duracion flujo menstrual";
    			t24 = space();
    			input7 = element("input");
    			t25 = space();
    			hr0 = element("hr");
    			t26 = space();
    			div33 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			label8 = element("label");
    			label8.textContent = "Gesta";
    			t28 = space();
    			input8 = element("input");
    			t29 = space();
    			div22 = element("div");
    			div21 = element("div");
    			label9 = element("label");
    			label9.textContent = "Para";
    			t31 = space();
    			input9 = element("input");
    			t32 = space();
    			div24 = element("div");
    			div23 = element("div");
    			label10 = element("label");
    			label10.textContent = "Abortos";
    			t34 = space();
    			input10 = element("input");
    			t35 = space();
    			div26 = element("div");
    			div25 = element("div");
    			label11 = element("label");
    			label11.textContent = "Cesáreas";
    			t37 = space();
    			input11 = element("input");
    			t38 = space();
    			div28 = element("div");
    			div27 = element("div");
    			label12 = element("label");
    			label12.textContent = "Espontáneos";
    			t40 = space();
    			input12 = element("input");
    			t41 = space();
    			div30 = element("div");
    			div29 = element("div");
    			label13 = element("label");
    			label13.textContent = "Provocados";
    			t43 = space();
    			input13 = element("input");
    			t44 = space();
    			div32 = element("div");
    			div31 = element("div");
    			label14 = element("label");
    			label14.textContent = "Legrados";
    			t46 = space();
    			input14 = element("input");
    			t47 = space();
    			h5 = element("h5");
    			h5.textContent = "Planificación";
    			t49 = space();
    			hr1 = element("hr");
    			t50 = space();
    			div35 = element("div");
    			div34 = element("div");
    			label15 = element("label");
    			input15 = element("input");
    			t51 = space();
    			span0 = element("span");
    			t52 = space();
    			span1 = element("span");
    			span1.textContent = "Sangrado Vaginal";
    			t54 = space();
    			label16 = element("label");
    			input16 = element("input");
    			t55 = space();
    			span2 = element("span");
    			t56 = space();
    			span3 = element("span");
    			span3.textContent = "Vida Sexual Activa";
    			t58 = space();
    			label17 = element("label");
    			input17 = element("input");
    			t59 = space();
    			span4 = element("span");
    			t60 = space();
    			span5 = element("span");
    			span5.textContent = "Anticonceptivos Orales";
    			t62 = space();
    			label18 = element("label");
    			input18 = element("input");
    			t63 = space();
    			span6 = element("span");
    			t64 = space();
    			span7 = element("span");
    			span7.textContent = "DIU";
    			t66 = space();
    			label19 = element("label");
    			input19 = element("input");
    			t67 = space();
    			span8 = element("span");
    			t68 = space();
    			span9 = element("span");
    			span9.textContent = "AQV";
    			t70 = space();
    			label20 = element("label");
    			input20 = element("input");
    			t71 = space();
    			span10 = element("span");
    			t72 = space();
    			span11 = element("span");
    			span11.textContent = "Condón";
    			t74 = space();
    			label21 = element("label");
    			input21 = element("input");
    			t75 = space();
    			span12 = element("span");
    			t76 = space();
    			span13 = element("span");
    			span13.textContent = "Norplant";
    			t78 = space();
    			label22 = element("label");
    			input22 = element("input");
    			t79 = space();
    			span14 = element("span");
    			t80 = space();
    			span15 = element("span");
    			span15.textContent = "Ritmo";
    			t82 = space();
    			label23 = element("label");
    			input23 = element("input");
    			t83 = space();
    			span16 = element("span");
    			t84 = space();
    			span17 = element("span");
    			span17.textContent = "Coito Interruptus";
    			attr_dev(div0, "class", "card-title text-primary");
    			add_location(div0, file$k, 591, 20, 20794);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$k, 590, 16, 20747);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$k, 599, 32, 21146);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$k, 600, 32, 21234);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$k, 598, 28, 21088);
    			attr_dev(div3, "class", "col-lg-3");
    			add_location(div3, file$k, 597, 24, 21036);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$k, 605, 32, 21562);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$k, 606, 32, 21634);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$k, 604, 28, 21504);
    			attr_dev(div5, "class", "col-lg-3");
    			add_location(div5, file$k, 603, 24, 21452);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$k, 611, 32, 21953);
    			attr_dev(input2, "type", "date");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$k, 612, 32, 22027);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$k, 610, 28, 21895);
    			attr_dev(div7, "class", "col-lg-3");
    			add_location(div7, file$k, 609, 24, 21843);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$k, 617, 32, 22348);
    			attr_dev(input3, "type", "date");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$k, 618, 32, 22423);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$k, 616, 28, 22290);
    			attr_dev(div9, "class", "col-lg-3");
    			add_location(div9, file$k, 615, 24, 22238);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$k, 623, 32, 22745);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$k, 624, 32, 22828);
    			attr_dev(div10, "class", "form-group");
    			add_location(div10, file$k, 622, 28, 22687);
    			attr_dev(div11, "class", "col-lg-3");
    			add_location(div11, file$k, 621, 24, 22635);
    			attr_dev(label5, "for", "");
    			add_location(label5, file$k, 629, 32, 23151);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "placeholder", "Dias");
    			add_location(input5, file$k, 630, 32, 23232);
    			attr_dev(div12, "class", "form-group");
    			add_location(div12, file$k, 628, 28, 23093);
    			attr_dev(div13, "class", "col-lg-3");
    			add_location(div13, file$k, 627, 24, 23041);
    			attr_dev(label6, "for", "");
    			add_location(label6, file$k, 635, 32, 23581);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "placeholder", "Dias");
    			add_location(input6, file$k, 636, 32, 23661);
    			attr_dev(div14, "class", "form-group");
    			add_location(div14, file$k, 634, 28, 23523);
    			attr_dev(div15, "class", "col-lg-3");
    			add_location(div15, file$k, 633, 24, 23471);
    			attr_dev(label7, "for", "");
    			add_location(label7, file$k, 641, 32, 24009);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "class", "form-control");
    			attr_dev(input7, "placeholder", "Dias");
    			add_location(input7, file$k, 642, 32, 24089);
    			attr_dev(div16, "class", "form-group");
    			add_location(div16, file$k, 640, 28, 23951);
    			attr_dev(div17, "class", "col-lg-3");
    			add_location(div17, file$k, 639, 24, 23899);
    			attr_dev(div18, "class", "row");
    			add_location(div18, file$k, 596, 20, 20993);
    			add_location(hr0, file$k, 646, 20, 24351);
    			attr_dev(label8, "for", "");
    			add_location(label8, file$k, 650, 32, 24525);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "class", "form-control");
    			add_location(input8, file$k, 651, 32, 24586);
    			attr_dev(div19, "class", "form-group");
    			add_location(div19, file$k, 649, 28, 24467);
    			attr_dev(div20, "class", "col");
    			add_location(div20, file$k, 648, 24, 24420);
    			attr_dev(label9, "for", "");
    			add_location(label9, file$k, 656, 32, 24893);
    			attr_dev(input9, "type", "number");
    			attr_dev(input9, "class", "form-control");
    			add_location(input9, file$k, 657, 32, 24953);
    			attr_dev(div21, "class", "form-group");
    			add_location(div21, file$k, 655, 28, 24835);
    			attr_dev(div22, "class", "col");
    			add_location(div22, file$k, 654, 24, 24788);
    			attr_dev(label10, "for", "");
    			add_location(label10, file$k, 662, 32, 25259);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "form-control");
    			add_location(input10, file$k, 663, 32, 25322);
    			attr_dev(div23, "class", "form-group");
    			add_location(div23, file$k, 661, 28, 25201);
    			attr_dev(div24, "class", "col");
    			add_location(div24, file$k, 660, 24, 25154);
    			attr_dev(label11, "for", "");
    			add_location(label11, file$k, 668, 32, 25631);
    			attr_dev(input11, "type", "number");
    			attr_dev(input11, "class", "form-control");
    			add_location(input11, file$k, 669, 32, 25702);
    			attr_dev(div25, "class", "form-group");
    			add_location(div25, file$k, 667, 28, 25573);
    			attr_dev(div26, "class", "col");
    			add_location(div26, file$k, 666, 24, 25526);
    			attr_dev(label12, "for", "");
    			add_location(label12, file$k, 674, 32, 26012);
    			attr_dev(input12, "type", "number");
    			attr_dev(input12, "class", "form-control");
    			add_location(input12, file$k, 675, 32, 26086);
    			attr_dev(div27, "class", "form-group");
    			add_location(div27, file$k, 673, 28, 25954);
    			attr_dev(div28, "class", "col");
    			add_location(div28, file$k, 672, 24, 25907);
    			attr_dev(label13, "for", "");
    			add_location(label13, file$k, 680, 32, 26399);
    			attr_dev(input13, "type", "number");
    			attr_dev(input13, "class", "form-control");
    			add_location(input13, file$k, 681, 32, 26465);
    			attr_dev(div29, "class", "form-group");
    			add_location(div29, file$k, 679, 28, 26341);
    			attr_dev(div30, "class", "col");
    			add_location(div30, file$k, 678, 24, 26294);
    			attr_dev(label14, "for", "");
    			add_location(label14, file$k, 686, 32, 26777);
    			attr_dev(input14, "type", "number");
    			attr_dev(input14, "class", "form-control");
    			add_location(input14, file$k, 687, 32, 26841);
    			attr_dev(div31, "class", "form-group");
    			add_location(div31, file$k, 685, 28, 26719);
    			attr_dev(div32, "class", "col");
    			add_location(div32, file$k, 684, 24, 26672);
    			attr_dev(div33, "class", "row");
    			add_location(div33, file$k, 647, 20, 24377);
    			attr_dev(h5, "class", "mt-3");
    			add_location(h5, file$k, 691, 20, 27070);
    			add_location(hr1, file$k, 692, 20, 27134);
    			attr_dev(input15, "type", "checkbox");
    			attr_dev(input15, "name", "option");
    			input15.__value = "1";
    			input15.value = input15.__value;
    			attr_dev(input15, "class", "cstm-switch-input");
    			add_location(input15, file$k, 696, 32, 27327);
    			attr_dev(span0, "class", "cstm-switch-indicator bg-success ");
    			add_location(span0, file$k, 697, 32, 27514);
    			attr_dev(span1, "class", "cstm-switch-description");
    			add_location(span1, file$k, 698, 32, 27603);
    			attr_dev(label15, "class", "cstm-switch mr-4 mb-4");
    			add_location(label15, file$k, 695, 28, 27256);
    			attr_dev(input16, "type", "checkbox");
    			attr_dev(input16, "name", "option");
    			input16.__value = "1";
    			input16.value = input16.__value;
    			attr_dev(input16, "class", "cstm-switch-input");
    			add_location(input16, file$k, 701, 32, 27803);
    			attr_dev(span2, "class", "cstm-switch-indicator bg-success ");
    			add_location(span2, file$k, 702, 32, 27991);
    			attr_dev(span3, "class", "cstm-switch-description");
    			add_location(span3, file$k, 703, 32, 28080);
    			attr_dev(label16, "class", "cstm-switch mr-4 mb-4");
    			add_location(label16, file$k, 700, 28, 27732);
    			attr_dev(input17, "type", "checkbox");
    			attr_dev(input17, "name", "option");
    			input17.__value = "1";
    			input17.value = input17.__value;
    			attr_dev(input17, "class", "cstm-switch-input");
    			add_location(input17, file$k, 706, 32, 28282);
    			attr_dev(span4, "class", "cstm-switch-indicator bg-success ");
    			add_location(span4, file$k, 707, 32, 28475);
    			attr_dev(span5, "class", "cstm-switch-description");
    			add_location(span5, file$k, 708, 32, 28564);
    			attr_dev(label17, "class", "cstm-switch mr-4 mb-4");
    			add_location(label17, file$k, 705, 28, 28211);
    			attr_dev(input18, "type", "checkbox");
    			attr_dev(input18, "name", "option");
    			input18.__value = "1";
    			input18.value = input18.__value;
    			attr_dev(input18, "class", "cstm-switch-input");
    			add_location(input18, file$k, 711, 32, 28770);
    			attr_dev(span6, "class", "cstm-switch-indicator bg-success ");
    			add_location(span6, file$k, 712, 32, 28945);
    			attr_dev(span7, "class", "cstm-switch-description");
    			add_location(span7, file$k, 713, 32, 29034);
    			attr_dev(label18, "class", "cstm-switch mr-4 mb-4");
    			add_location(label18, file$k, 710, 28, 28699);
    			attr_dev(input19, "type", "checkbox");
    			attr_dev(input19, "name", "option");
    			input19.__value = "1";
    			input19.value = input19.__value;
    			attr_dev(input19, "class", "cstm-switch-input");
    			add_location(input19, file$k, 716, 32, 29221);
    			attr_dev(span8, "class", "cstm-switch-indicator bg-success ");
    			add_location(span8, file$k, 717, 32, 29396);
    			attr_dev(span9, "class", "cstm-switch-description");
    			add_location(span9, file$k, 718, 32, 29485);
    			attr_dev(label19, "class", "cstm-switch mr-4 mb-4");
    			add_location(label19, file$k, 715, 28, 29150);
    			attr_dev(input20, "type", "checkbox");
    			attr_dev(input20, "name", "option");
    			input20.__value = "1";
    			input20.value = input20.__value;
    			attr_dev(input20, "class", "cstm-switch-input");
    			add_location(input20, file$k, 721, 32, 29672);
    			attr_dev(span10, "class", "cstm-switch-indicator bg-success ");
    			add_location(span10, file$k, 722, 32, 29850);
    			attr_dev(span11, "class", "cstm-switch-description");
    			add_location(span11, file$k, 723, 32, 29939);
    			attr_dev(label20, "class", "cstm-switch mr-4 mb-4");
    			add_location(label20, file$k, 720, 28, 29601);
    			attr_dev(input21, "type", "checkbox");
    			attr_dev(input21, "name", "option");
    			input21.__value = "1";
    			input21.value = input21.__value;
    			attr_dev(input21, "class", "cstm-switch-input");
    			add_location(input21, file$k, 726, 32, 30136);
    			attr_dev(span12, "class", "cstm-switch-indicator bg-success ");
    			add_location(span12, file$k, 727, 32, 30316);
    			attr_dev(span13, "class", "cstm-switch-description");
    			add_location(span13, file$k, 728, 32, 30405);
    			attr_dev(label21, "class", "cstm-switch mr-4 mb-4");
    			add_location(label21, file$k, 725, 28, 30065);
    			attr_dev(input22, "type", "checkbox");
    			attr_dev(input22, "name", "option");
    			input22.__value = "1";
    			input22.value = input22.__value;
    			attr_dev(input22, "class", "cstm-switch-input");
    			add_location(input22, file$k, 731, 32, 30597);
    			attr_dev(span14, "class", "cstm-switch-indicator bg-success ");
    			add_location(span14, file$k, 732, 32, 30774);
    			attr_dev(span15, "class", "cstm-switch-description");
    			add_location(span15, file$k, 733, 32, 30863);
    			attr_dev(label22, "class", "cstm-switch mr-4 mb-4");
    			add_location(label22, file$k, 730, 28, 30526);
    			attr_dev(input23, "type", "checkbox");
    			attr_dev(input23, "name", "option");
    			input23.__value = "1";
    			input23.value = input23.__value;
    			attr_dev(input23, "class", "cstm-switch-input");
    			add_location(input23, file$k, 736, 32, 31052);
    			attr_dev(span16, "class", "cstm-switch-indicator bg-success ");
    			add_location(span16, file$k, 737, 32, 31240);
    			attr_dev(span17, "class", "cstm-switch-description");
    			add_location(span17, file$k, 738, 32, 31329);
    			attr_dev(label23, "class", "cstm-switch mr-4 mb-4");
    			add_location(label23, file$k, 735, 28, 30981);
    			attr_dev(div34, "class", "col-lg-12");
    			add_location(div34, file$k, 694, 24, 27203);
    			attr_dev(div35, "class", "row");
    			add_location(div35, file$k, 693, 20, 27160);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$k, 595, 16, 20948);
    			attr_dev(div37, "class", "card m-b-20 border border-primary");
    			add_location(div37, file$k, 589, 12, 20682);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div37, anchor);
    			append_dev(div37, div1);
    			append_dev(div1, div0);
    			append_dev(div37, t1);
    			append_dev(div37, div36);
    			append_dev(div36, div18);
    			append_dev(div18, div3);
    			append_dev(div3, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t3);
    			append_dev(div2, input0);
    			set_input_value(input0, /*historiaGinecologica*/ ctx[19].fechaUltimaMenstruacion);
    			append_dev(div18, t4);
    			append_dev(div18, div5);
    			append_dev(div5, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t6);
    			append_dev(div4, input1);
    			set_input_value(input1, /*historiaGinecologica*/ ctx[19].fechaUltimoPap);
    			append_dev(div18, t7);
    			append_dev(div18, div7);
    			append_dev(div7, div6);
    			append_dev(div6, label2);
    			append_dev(div6, t9);
    			append_dev(div6, input2);
    			set_input_value(input2, /*historiaGinecologica*/ ctx[19].fechaUltimoParto);
    			append_dev(div18, t10);
    			append_dev(div18, div9);
    			append_dev(div9, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t12);
    			append_dev(div8, input3);
    			set_input_value(input3, /*historiaGinecologica*/ ctx[19].fechaUltimoAborto);
    			append_dev(div18, t13);
    			append_dev(div18, div11);
    			append_dev(div11, div10);
    			append_dev(div10, label4);
    			append_dev(div10, t15);
    			append_dev(div10, input4);
    			set_input_value(input4, /*historiaGinecologica*/ ctx[19].fechaUltimoCesarea);
    			append_dev(div18, t16);
    			append_dev(div18, div13);
    			append_dev(div13, div12);
    			append_dev(div12, label5);
    			append_dev(div12, t18);
    			append_dev(div12, input5);
    			set_input_value(input5, /*historiaGinecologica*/ ctx[19].intervaloFlujoMenstrual);
    			append_dev(div18, t19);
    			append_dev(div18, div15);
    			append_dev(div15, div14);
    			append_dev(div14, label6);
    			append_dev(div14, t21);
    			append_dev(div14, input6);
    			set_input_value(input6, /*historiaGinecologica*/ ctx[19].cantidadFlujoMenstrual);
    			append_dev(div18, t22);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, label7);
    			append_dev(div16, t24);
    			append_dev(div16, input7);
    			set_input_value(input7, /*historiaGinecologica*/ ctx[19].duracionFlujoMenstrual);
    			append_dev(div36, t25);
    			append_dev(div36, hr0);
    			append_dev(div36, t26);
    			append_dev(div36, div33);
    			append_dev(div33, div20);
    			append_dev(div20, div19);
    			append_dev(div19, label8);
    			append_dev(div19, t28);
    			append_dev(div19, input8);
    			set_input_value(input8, /*historiaGinecologica*/ ctx[19].gesta);
    			append_dev(div33, t29);
    			append_dev(div33, div22);
    			append_dev(div22, div21);
    			append_dev(div21, label9);
    			append_dev(div21, t31);
    			append_dev(div21, input9);
    			set_input_value(input9, /*historiaGinecologica*/ ctx[19].para);
    			append_dev(div33, t32);
    			append_dev(div33, div24);
    			append_dev(div24, div23);
    			append_dev(div23, label10);
    			append_dev(div23, t34);
    			append_dev(div23, input10);
    			set_input_value(input10, /*historiaGinecologica*/ ctx[19].abortos);
    			append_dev(div33, t35);
    			append_dev(div33, div26);
    			append_dev(div26, div25);
    			append_dev(div25, label11);
    			append_dev(div25, t37);
    			append_dev(div25, input11);
    			set_input_value(input11, /*historiaGinecologica*/ ctx[19].cesareas);
    			append_dev(div33, t38);
    			append_dev(div33, div28);
    			append_dev(div28, div27);
    			append_dev(div27, label12);
    			append_dev(div27, t40);
    			append_dev(div27, input12);
    			set_input_value(input12, /*historiaGinecologica*/ ctx[19].espontaneos);
    			append_dev(div33, t41);
    			append_dev(div33, div30);
    			append_dev(div30, div29);
    			append_dev(div29, label13);
    			append_dev(div29, t43);
    			append_dev(div29, input13);
    			set_input_value(input13, /*historiaGinecologica*/ ctx[19].provocados);
    			append_dev(div33, t44);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, label14);
    			append_dev(div31, t46);
    			append_dev(div31, input14);
    			set_input_value(input14, /*historiaGinecologica*/ ctx[19].legrados);
    			append_dev(div36, t47);
    			append_dev(div36, h5);
    			append_dev(div36, t49);
    			append_dev(div36, hr1);
    			append_dev(div36, t50);
    			append_dev(div36, div35);
    			append_dev(div35, div34);
    			append_dev(div34, label15);
    			append_dev(label15, input15);
    			input15.checked = /*historiaGinecologica*/ ctx[19].sangradoVaginal;
    			append_dev(label15, t51);
    			append_dev(label15, span0);
    			append_dev(label15, t52);
    			append_dev(label15, span1);
    			append_dev(div34, t54);
    			append_dev(div34, label16);
    			append_dev(label16, input16);
    			input16.checked = /*historiaGinecologica*/ ctx[19].vidaSexualActiva;
    			append_dev(label16, t55);
    			append_dev(label16, span2);
    			append_dev(label16, t56);
    			append_dev(label16, span3);
    			append_dev(div34, t58);
    			append_dev(div34, label17);
    			append_dev(label17, input17);
    			input17.checked = /*historiaGinecologica*/ ctx[19].anticonceptivosOrales;
    			append_dev(label17, t59);
    			append_dev(label17, span4);
    			append_dev(label17, t60);
    			append_dev(label17, span5);
    			append_dev(div34, t62);
    			append_dev(div34, label18);
    			append_dev(label18, input18);
    			input18.checked = /*historiaGinecologica*/ ctx[19].diu;
    			append_dev(label18, t63);
    			append_dev(label18, span6);
    			append_dev(label18, t64);
    			append_dev(label18, span7);
    			append_dev(div34, t66);
    			append_dev(div34, label19);
    			append_dev(label19, input19);
    			input19.checked = /*historiaGinecologica*/ ctx[19].aqv;
    			append_dev(label19, t67);
    			append_dev(label19, span8);
    			append_dev(label19, t68);
    			append_dev(label19, span9);
    			append_dev(div34, t70);
    			append_dev(div34, label20);
    			append_dev(label20, input20);
    			input20.checked = /*historiaGinecologica*/ ctx[19].condon;
    			append_dev(label20, t71);
    			append_dev(label20, span10);
    			append_dev(label20, t72);
    			append_dev(label20, span11);
    			append_dev(div34, t74);
    			append_dev(div34, label21);
    			append_dev(label21, input21);
    			input21.checked = /*historiaGinecologica*/ ctx[19].norplant;
    			append_dev(label21, t75);
    			append_dev(label21, span12);
    			append_dev(label21, t76);
    			append_dev(label21, span13);
    			append_dev(div34, t78);
    			append_dev(div34, label22);
    			append_dev(label22, input22);
    			input22.checked = /*historiaGinecologica*/ ctx[19].ritmo;
    			append_dev(label22, t79);
    			append_dev(label22, span14);
    			append_dev(label22, t80);
    			append_dev(label22, span15);
    			append_dev(div34, t82);
    			append_dev(div34, label23);
    			append_dev(label23, input23);
    			input23.checked = /*historiaGinecologica*/ ctx[19].coitoInterruptus;
    			append_dev(label23, t83);
    			append_dev(label23, span16);
    			append_dev(label23, t84);
    			append_dev(label23, span17);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[41]),
    					listen_dev(input1, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[42]),
    					listen_dev(input2, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[43]),
    					listen_dev(input3, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[44]),
    					listen_dev(input4, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[45]),
    					listen_dev(input5, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[46]),
    					listen_dev(input6, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[47]),
    					listen_dev(input7, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[48]),
    					listen_dev(input8, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[49]),
    					listen_dev(input9, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input9, "input", /*input9_input_handler*/ ctx[50]),
    					listen_dev(input10, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input10, "input", /*input10_input_handler*/ ctx[51]),
    					listen_dev(input11, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input11, "input", /*input11_input_handler*/ ctx[52]),
    					listen_dev(input12, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input12, "input", /*input12_input_handler*/ ctx[53]),
    					listen_dev(input13, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input13, "input", /*input13_input_handler*/ ctx[54]),
    					listen_dev(input14, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input14, "input", /*input14_input_handler*/ ctx[55]),
    					listen_dev(input15, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input15, "change", /*input15_change_handler*/ ctx[56]),
    					listen_dev(input16, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input16, "change", /*input16_change_handler*/ ctx[57]),
    					listen_dev(input17, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input17, "change", /*input17_change_handler*/ ctx[58]),
    					listen_dev(input18, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input18, "change", /*input18_change_handler*/ ctx[59]),
    					listen_dev(input19, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input19, "change", /*input19_change_handler*/ ctx[60]),
    					listen_dev(input20, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input20, "change", /*input20_change_handler*/ ctx[61]),
    					listen_dev(input21, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input21, "change", /*input21_change_handler*/ ctx[62]),
    					listen_dev(input22, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input22, "change", /*input22_change_handler*/ ctx[63]),
    					listen_dev(input23, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input23, "change", /*input23_change_handler*/ ctx[64])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
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
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div37);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(588:12) {#if empresa.historiaGinecologica}",
    		ctx
    	});

    	return block;
    }

    // (747:12) {#if empresa.signosVitales}
    function create_if_block_6(ctx) {
    	let div22;
    	let div1;
    	let div0;
    	let t1;
    	let div21;
    	let div20;
    	let div6;
    	let div5;
    	let label0;
    	let i0;
    	let t2;
    	let t3;
    	let div4;
    	let div2;
    	let input0;
    	let t4;
    	let div3;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t8;
    	let div10;
    	let div9;
    	let label1;
    	let i1;
    	let t9;
    	let t10;
    	let div8;
    	let div7;
    	let input1;
    	let t11;
    	let div14;
    	let div13;
    	let label2;
    	let i2;
    	let t12;
    	let t13;
    	let div12;
    	let div11;
    	let input2;
    	let t14;
    	let div19;
    	let div18;
    	let label3;
    	let i3;
    	let t15;
    	let t16;
    	let div17;
    	let div15;
    	let input3;
    	let t17;
    	let div16;
    	let input4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div22 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Signos vitales";
    			t1 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			i0 = element("i");
    			t2 = text(" Temperatura");
    			t3 = space();
    			div4 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div3 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "°C";
    			option1 = element("option");
    			option1.textContent = "°K";
    			option2 = element("option");
    			option2.textContent = "°F";
    			t8 = space();
    			div10 = element("div");
    			div9 = element("div");
    			label1 = element("label");
    			i1 = element("i");
    			t9 = text(" Frecuencia\r\n                                         respiratoria");
    			t10 = space();
    			div8 = element("div");
    			div7 = element("div");
    			input1 = element("input");
    			t11 = space();
    			div14 = element("div");
    			div13 = element("div");
    			label2 = element("label");
    			i2 = element("i");
    			t12 = text(" Frecuencia\r\n                                         cardiaca");
    			t13 = space();
    			div12 = element("div");
    			div11 = element("div");
    			input2 = element("input");
    			t14 = space();
    			div19 = element("div");
    			div18 = element("div");
    			label3 = element("label");
    			i3 = element("i");
    			t15 = text(" Presion\r\n                                         alterial (mmHg)");
    			t16 = space();
    			div17 = element("div");
    			div15 = element("div");
    			input3 = element("input");
    			t17 = space();
    			div16 = element("div");
    			input4 = element("input");
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$k, 750, 25, 31820);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$k, 749, 21, 31768);
    			attr_dev(i0, "class", "mdi mdi-thermometer mdi-18px");
    			add_location(i0, file$k, 757, 42, 32191);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$k, 756, 37, 32134);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$k, 761, 45, 32460);
    			attr_dev(div2, "class", "col-lg-7");
    			add_location(div2, file$k, 760, 41, 32391);
    			option0.__value = "C";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$k, 771, 49, 33192);
    			option1.__value = "K";
    			option1.value = option1.__value;
    			add_location(option1, file$k, 772, 49, 33281);
    			option2.__value = "F";
    			option2.value = option2.__value;
    			add_location(option2, file$k, 773, 49, 33361);
    			attr_dev(select, "class", "form-control");
    			if (/*temperatura*/ ctx[8].tipo === void 0) add_render_callback(() => /*select_change_handler*/ ctx[66].call(select));
    			add_location(select, file$k, 770, 45, 33054);
    			attr_dev(div3, "class", "col-lg-5");
    			add_location(div3, file$k, 768, 41, 32899);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$k, 759, 37, 32331);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$k, 755, 33, 32071);
    			attr_dev(div6, "class", "col-lg-3");
    			add_location(div6, file$k, 754, 29, 32014);
    			attr_dev(i1, "class", "mdi mdi-chart-line mdi-18px");
    			add_location(i1, file$k, 782, 42, 33826);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$k, 781, 37, 33769);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$k, 787, 45, 34149);
    			attr_dev(div7, "class", "col-lg-12");
    			add_location(div7, file$k, 786, 41, 34079);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$k, 785, 37, 34019);
    			attr_dev(div9, "class", "form-group");
    			add_location(div9, file$k, 780, 33, 33706);
    			attr_dev(div10, "class", "col-lg-3");
    			add_location(div10, file$k, 779, 29, 33649);
    			attr_dev(i2, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i2, file$k, 800, 42, 34890);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$k, 799, 37, 34833);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$k, 805, 45, 35210);
    			attr_dev(div11, "class", "col-lg-12");
    			add_location(div11, file$k, 804, 41, 35140);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$k, 803, 37, 35080);
    			attr_dev(div13, "class", "form-group");
    			add_location(div13, file$k, 798, 33, 34770);
    			attr_dev(div14, "class", "col-lg-3");
    			add_location(div14, file$k, 797, 29, 34713);
    			attr_dev(i3, "class", "mdi mdi-heart-pulse mdi-18px");
    			add_location(i3, file$k, 818, 42, 35947);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$k, 817, 37, 35890);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$k, 823, 45, 36270);
    			attr_dev(div15, "class", "col-lg-6");
    			add_location(div15, file$k, 822, 41, 36201);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$k, 831, 45, 36779);
    			attr_dev(div16, "class", "col-lg-6");
    			add_location(div16, file$k, 830, 41, 36710);
    			attr_dev(div17, "class", "row");
    			add_location(div17, file$k, 821, 37, 36141);
    			attr_dev(div18, "class", "form-group");
    			add_location(div18, file$k, 816, 33, 35827);
    			attr_dev(div19, "class", "col-lg-3");
    			add_location(div19, file$k, 815, 29, 35770);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$k, 753, 25, 31966);
    			attr_dev(div21, "class", "card-body");
    			add_location(div21, file$k, 752, 21, 31916);
    			attr_dev(div22, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div22, file$k, 748, 17, 31697);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div1);
    			append_dev(div1, div0);
    			append_dev(div22, t1);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label0);
    			append_dev(label0, i0);
    			append_dev(label0, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, input0);
    			set_input_value(input0, /*temperatura*/ ctx[8].valor);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*temperatura*/ ctx[8].tipo);
    			append_dev(div20, t8);
    			append_dev(div20, div10);
    			append_dev(div10, div9);
    			append_dev(div9, label1);
    			append_dev(label1, i1);
    			append_dev(label1, t9);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input1);
    			set_input_value(input1, /*historia*/ ctx[7].frecuenciaRespiratoria);
    			append_dev(div20, t11);
    			append_dev(div20, div14);
    			append_dev(div14, div13);
    			append_dev(div13, label2);
    			append_dev(label2, i2);
    			append_dev(label2, t12);
    			append_dev(div13, t13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, input2);
    			set_input_value(input2, /*historia*/ ctx[7].frecuenciaCardiaca);
    			append_dev(div20, t14);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, label3);
    			append_dev(label3, i3);
    			append_dev(label3, t15);
    			append_dev(div18, t16);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, input3);
    			set_input_value(input3, /*presionAlterial*/ ctx[9].mm);
    			append_dev(div17, t17);
    			append_dev(div17, div16);
    			append_dev(div16, input4);
    			set_input_value(input4, /*presionAlterial*/ ctx[9].Hg);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[65]),
    					listen_dev(select, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[66]),
    					listen_dev(input1, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[67]),
    					listen_dev(input2, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[68]),
    					listen_dev(input3, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[69]),
    					listen_dev(input4, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[70])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*temperatura*/ 256 && to_number(input0.value) !== /*temperatura*/ ctx[8].valor) {
    				set_input_value(input0, /*temperatura*/ ctx[8].valor);
    			}

    			if (dirty[0] & /*temperatura*/ 256) {
    				select_option(select, /*temperatura*/ ctx[8].tipo);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input1.value) !== /*historia*/ ctx[7].frecuenciaRespiratoria) {
    				set_input_value(input1, /*historia*/ ctx[7].frecuenciaRespiratoria);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input2.value) !== /*historia*/ ctx[7].frecuenciaCardiaca) {
    				set_input_value(input2, /*historia*/ ctx[7].frecuenciaCardiaca);
    			}

    			if (dirty[0] & /*presionAlterial*/ 512 && to_number(input3.value) !== /*presionAlterial*/ ctx[9].mm) {
    				set_input_value(input3, /*presionAlterial*/ ctx[9].mm);
    			}

    			if (dirty[0] & /*presionAlterial*/ 512 && to_number(input4.value) !== /*presionAlterial*/ ctx[9].Hg) {
    				set_input_value(input4, /*presionAlterial*/ ctx[9].Hg);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div22);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(747:12) {#if empresa.signosVitales}",
    		ctx
    	});

    	return block;
    }

    // (846:12) {#if empresa.otrosParametros}
    function create_if_block_5$1(ctx) {
    	let div29;
    	let div1;
    	let div0;
    	let t1;
    	let div28;
    	let div27;
    	let div6;
    	let div5;
    	let label0;
    	let i0;
    	let t2;
    	let t3;
    	let div4;
    	let div2;
    	let input0;
    	let t4;
    	let div3;
    	let select;
    	let option0;
    	let option1;
    	let t7;
    	let div12;
    	let div11;
    	let label1;
    	let i1;
    	let t8;
    	let t9;
    	let div10;
    	let div9;
    	let div8;
    	let input1;
    	let t10;
    	let div7;
    	let span0;
    	let t12;
    	let div18;
    	let div17;
    	let label2;
    	let i2;
    	let t13;
    	let t14;
    	let div16;
    	let div15;
    	let div14;
    	let input2;
    	let t15;
    	let div13;
    	let span1;
    	let t17;
    	let div22;
    	let div21;
    	let label3;
    	let i3;
    	let t18;
    	let t19;
    	let div20;
    	let div19;
    	let input3;
    	let t20;
    	let div26;
    	let div25;
    	let label4;
    	let t22;
    	let div24;
    	let div23;
    	let input4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div29 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Otros Parametros";
    			t1 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			i0 = element("i");
    			t2 = text(" Peso");
    			t3 = space();
    			div4 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div3 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Lb";
    			option1 = element("option");
    			option1.textContent = "Kg";
    			t7 = space();
    			div12 = element("div");
    			div11 = element("div");
    			label1 = element("label");
    			i1 = element("i");
    			t8 = text(" Escala de\r\n                                         glasgow");
    			t9 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			input1 = element("input");
    			t10 = space();
    			div7 = element("div");
    			span0 = element("span");
    			span0.textContent = "/ 15";
    			t12 = space();
    			div18 = element("div");
    			div17 = element("div");
    			label2 = element("label");
    			i2 = element("i");
    			t13 = text(" Escala de dolor");
    			t14 = space();
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			input2 = element("input");
    			t15 = space();
    			div13 = element("div");
    			span1 = element("span");
    			span1.textContent = "/ 10";
    			t17 = space();
    			div22 = element("div");
    			div21 = element("div");
    			label3 = element("label");
    			i3 = element("i");
    			t18 = text(" Saturación\r\n                                         de oxigeno");
    			t19 = space();
    			div20 = element("div");
    			div19 = element("div");
    			input3 = element("input");
    			t20 = space();
    			div26 = element("div");
    			div25 = element("div");
    			label4 = element("label");
    			label4.textContent = "Otros";
    			t22 = space();
    			div24 = element("div");
    			div23 = element("div");
    			input4 = element("input");
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$k, 848, 25, 37567);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$k, 847, 21, 37515);
    			attr_dev(i0, "class", "mdi mdi-weight-pound");
    			add_location(i0, file$k, 855, 42, 37940);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$k, 854, 37, 37883);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "form-control");
    			add_location(input0, file$k, 859, 45, 38194);
    			attr_dev(div2, "class", "col-lg-7");
    			add_location(div2, file$k, 858, 41, 38125);
    			option0.__value = "Lb";
    			option0.value = option0.__value;
    			add_location(option0, file$k, 872, 49, 39059);
    			option1.__value = "Kg";
    			option1.value = option1.__value;
    			add_location(option1, file$k, 873, 49, 39140);
    			attr_dev(select, "class", "form-control");
    			if (/*peso*/ ctx[10].tipo === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[72].call(select));
    			add_location(select, file$k, 868, 45, 38781);
    			attr_dev(div3, "class", "col-lg-5");
    			add_location(div3, file$k, 866, 41, 38626);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$k, 857, 37, 38065);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$k, 853, 33, 37820);
    			attr_dev(div6, "class", "col-lg-3");
    			add_location(div6, file$k, 852, 29, 37763);
    			attr_dev(i1, "class", "mdi mdi-human");
    			add_location(i1, file$k, 882, 42, 39606);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$k, 881, 37, 39549);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "max", "15");
    			attr_dev(input1, "maxlength", "2");
    			attr_dev(input1, "aria-label", "Recipient's username");
    			attr_dev(input1, "aria-describedby", "basic-addon2");
    			add_location(input1, file$k, 891, 49, 40178);
    			attr_dev(span0, "class", "input-group-text");
    			attr_dev(span0, "id", "basic-addon2");
    			add_location(span0, file$k, 904, 53, 41098);
    			attr_dev(div7, "class", "input-group-append");
    			add_location(div7, file$k, 901, 49, 40906);
    			attr_dev(div8, "class", "input-group");
    			set_style(div8, "width", "100%", 1);
    			set_style(div8, "float", "right");
    			add_location(div8, file$k, 887, 45, 39909);
    			attr_dev(div9, "class", "col-lg-12");
    			add_location(div9, file$k, 886, 41, 39839);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$k, 885, 37, 39779);
    			attr_dev(div11, "class", "form-group");
    			add_location(div11, file$k, 880, 33, 39486);
    			attr_dev(div12, "class", "col-lg-3");
    			add_location(div12, file$k, 879, 29, 39429);
    			attr_dev(i2, "class", "mdi mdi-emoticon-happy");
    			add_location(i2, file$k, 918, 42, 41878);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$k, 917, 37, 41821);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "max", "10");
    			attr_dev(input2, "maxlength", "2");
    			attr_dev(input2, "aria-label", "Recipient's username");
    			attr_dev(input2, "aria-describedby", "basic-addon2");
    			add_location(input2, file$k, 928, 49, 42503);
    			attr_dev(span1, "class", "input-group-text");
    			attr_dev(span1, "id", "basic-addon2");
    			add_location(span1, file$k, 941, 53, 43421);
    			attr_dev(div13, "class", "input-group-append");
    			add_location(div13, file$k, 938, 49, 43229);
    			attr_dev(div14, "class", "input-group");
    			set_style(div14, "width", "100%", 1);
    			set_style(div14, "float", "right");
    			add_location(div14, file$k, 924, 45, 42234);
    			attr_dev(div15, "class", "col-lg-12");
    			add_location(div15, file$k, 923, 41, 42164);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$k, 922, 37, 42104);
    			attr_dev(div17, "class", "form-group");
    			add_location(div17, file$k, 916, 33, 41758);
    			attr_dev(div18, "class", "col-lg-3");
    			add_location(div18, file$k, 915, 29, 41701);
    			attr_dev(i3, "class", "mdi mdi-opacity");
    			add_location(i3, file$k, 955, 42, 44201);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$k, 954, 37, 44144);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$k, 960, 45, 44517);
    			attr_dev(div19, "class", "col-lg-12");
    			add_location(div19, file$k, 959, 41, 44447);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$k, 958, 37, 44387);
    			attr_dev(div21, "class", "form-group");
    			add_location(div21, file$k, 953, 33, 44081);
    			attr_dev(div22, "class", "col-lg-3");
    			add_location(div22, file$k, 952, 29, 44024);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$k, 972, 37, 45197);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$k, 975, 45, 45393);
    			attr_dev(div23, "class", "col-lg-12");
    			add_location(div23, file$k, 974, 41, 45323);
    			attr_dev(div24, "class", "row");
    			add_location(div24, file$k, 973, 37, 45263);
    			attr_dev(div25, "class", "form-group");
    			add_location(div25, file$k, 971, 33, 45134);
    			attr_dev(div26, "class", "col-lg-12");
    			add_location(div26, file$k, 970, 29, 45076);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$k, 851, 25, 37715);
    			attr_dev(div28, "class", "card-body");
    			add_location(div28, file$k, 850, 21, 37665);
    			attr_dev(div29, "class", "card m-b-20");
    			add_location(div29, file$k, 846, 17, 37467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div29, anchor);
    			append_dev(div29, div1);
    			append_dev(div1, div0);
    			append_dev(div29, t1);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label0);
    			append_dev(label0, i0);
    			append_dev(label0, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, input0);
    			set_input_value(input0, /*peso*/ ctx[10].valor);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*peso*/ ctx[10].tipo);
    			append_dev(div27, t7);
    			append_dev(div27, div12);
    			append_dev(div12, div11);
    			append_dev(div11, label1);
    			append_dev(label1, i1);
    			append_dev(label1, t8);
    			append_dev(div11, t9);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, input1);
    			set_input_value(input1, /*historia*/ ctx[7].escalaGalsgow);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			append_dev(div7, span0);
    			append_dev(div27, t12);
    			append_dev(div27, div18);
    			append_dev(div18, div17);
    			append_dev(div17, label2);
    			append_dev(label2, i2);
    			append_dev(label2, t13);
    			append_dev(div17, t14);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, input2);
    			set_input_value(input2, /*historia*/ ctx[7].escalaDolor);
    			append_dev(div14, t15);
    			append_dev(div14, div13);
    			append_dev(div13, span1);
    			append_dev(div27, t17);
    			append_dev(div27, div22);
    			append_dev(div22, div21);
    			append_dev(div21, label3);
    			append_dev(label3, i3);
    			append_dev(label3, t18);
    			append_dev(div21, t19);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, input3);
    			set_input_value(input3, /*historia*/ ctx[7].saturacionOxigeno);
    			append_dev(div27, t20);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, label4);
    			append_dev(div25, t22);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, input4);
    			set_input_value(input4, /*historia*/ ctx[7].otrosParametros);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler_2*/ ctx[71]),
    					listen_dev(select, "change", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(select, "change", /*select_change_handler_1*/ ctx[72]),
    					listen_dev(input1, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler_2*/ ctx[73]),
    					listen_dev(input2, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler_2*/ ctx[74]),
    					listen_dev(input3, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler_2*/ ctx[75]),
    					listen_dev(input4, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler_2*/ ctx[76])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*peso*/ 1024 && to_number(input0.value) !== /*peso*/ ctx[10].valor) {
    				set_input_value(input0, /*peso*/ ctx[10].valor);
    			}

    			if (dirty[0] & /*peso*/ 1024) {
    				select_option(select, /*peso*/ ctx[10].tipo);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input1.value) !== /*historia*/ ctx[7].escalaGalsgow) {
    				set_input_value(input1, /*historia*/ ctx[7].escalaGalsgow);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input2.value) !== /*historia*/ ctx[7].escalaDolor) {
    				set_input_value(input2, /*historia*/ ctx[7].escalaDolor);
    			}

    			if (dirty[0] & /*historia*/ 128 && to_number(input3.value) !== /*historia*/ ctx[7].saturacionOxigeno) {
    				set_input_value(input3, /*historia*/ ctx[7].saturacionOxigeno);
    			}

    			if (dirty[0] & /*historia*/ 128 && input4.value !== /*historia*/ ctx[7].otrosParametros) {
    				set_input_value(input4, /*historia*/ ctx[7].otrosParametros);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div29);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(846:12) {#if empresa.otrosParametros}",
    		ctx
    	});

    	return block;
    }

    // (1032:12) {#if empresa.exploracionFisica}
    function create_if_block_2$4(ctx) {
    	let div7;
    	let div1;
    	let div0;
    	let t1;
    	let div6;
    	let div5;
    	let div2;
    	let t2;
    	let hr;
    	let t3;
    	let div4;
    	let div3;
    	let each_value_3 = /*exploracionFisica*/ ctx[22];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3$2(get_each_context_3$2(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*exploracionFisica*/ ctx[22];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Exploración Fisica";
    			t1 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$k, 1034, 25, 47911);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$k, 1033, 21, 47859);
    			attr_dev(div2, "class", "col-12");
    			add_location(div2, file$k, 1038, 29, 48116);
    			add_location(hr, file$k, 1045, 29, 48584);
    			attr_dev(div3, "class", "row mt-2");
    			add_location(div3, file$k, 1047, 33, 48675);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$k, 1046, 29, 48620);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$k, 1037, 25, 48068);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file$k, 1036, 21, 48018);
    			attr_dev(div7, "class", "card m-b-20");
    			add_location(div7, file$k, 1032, 17, 47811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div5, t2);
    			append_dev(div5, hr);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*exploracionFisica*/ 4194304 | dirty[1] & /*guardarHistoria*/ 32) {
    				each_value_3 = /*exploracionFisica*/ ctx[22];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$2(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty[0] & /*exploracionFisica*/ 4194304 | dirty[1] & /*guardarHistoria*/ 32) {
    				each_value_2 = /*exploracionFisica*/ ctx[22];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(1032:12) {#if empresa.exploracionFisica}",
    		ctx
    	});

    	return block;
    }

    // (1041:37) {#if !item.activo}
    function create_if_block_4$1(ctx) {
    	let button;
    	let t_value = /*item*/ ctx[108].nombre + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[78](/*item*/ ctx[108], /*each_value_3*/ ctx[116], /*item_index_1*/ ctx[117], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "btn btn-outline-primary mr-2");
    			add_location(button, file$k, 1041, 41, 48304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*exploracionFisica*/ 4194304 && t_value !== (t_value = /*item*/ ctx[108].nombre + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(1041:37) {#if !item.activo}",
    		ctx
    	});

    	return block;
    }

    // (1040:33) {#each exploracionFisica as item}
    function create_each_block_3$2(ctx) {
    	let if_block_anchor;
    	let if_block = !/*item*/ ctx[108].activo && create_if_block_4$1(ctx);

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
    			if (!/*item*/ ctx[108].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$1(ctx);
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
    		id: create_each_block_3$2.name,
    		type: "each",
    		source: "(1040:33) {#each exploracionFisica as item}",
    		ctx
    	});

    	return block;
    }

    // (1050:41) {#if item.activo}
    function create_if_block_3$1(ctx) {
    	let div4;
    	let div3;
    	let div1;
    	let div0;
    	let t0_value = /*item*/ ctx[108].nombre + "";
    	let t0;
    	let t1;
    	let div2;
    	let textarea;
    	let t2;
    	let mounted;
    	let dispose;

    	function textarea_input_handler() {
    		/*textarea_input_handler*/ ctx[79].call(textarea, /*each_value_2*/ ctx[114], /*item_index*/ ctx[115]);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			attr_dev(div0, "class", "card-title");
    			add_location(div0, file$k, 1053, 57, 49142);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$k, 1052, 53, 49058);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$k, 1056, 57, 49383);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file$k, 1055, 53, 49301);
    			attr_dev(div3, "class", "card m-t-10 m-b-20 border border-primary");
    			add_location(div3, file$k, 1051, 49, 48949);
    			attr_dev(div4, "class", "col-lg-4");
    			add_location(div4, file$k, 1050, 45, 48876);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*item*/ ctx[108].text);
    			append_dev(div4, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", textarea_input_handler),
    					listen_dev(textarea, "blur", /*guardarHistoria*/ ctx[36], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*exploracionFisica*/ 4194304 && t0_value !== (t0_value = /*item*/ ctx[108].nombre + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*exploracionFisica*/ 4194304) {
    				set_input_value(textarea, /*item*/ ctx[108].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(1050:41) {#if item.activo}",
    		ctx
    	});

    	return block;
    }

    // (1049:37) {#each exploracionFisica as item}
    function create_each_block_2$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*item*/ ctx[108].activo && create_if_block_3$1(ctx);

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
    			if (/*item*/ ctx[108].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$1(ctx);
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
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(1049:37) {#each exploracionFisica as item}",
    		ctx
    	});

    	return block;
    }

    // (1118:40) {#each filtroDiagnostico as diagnostico}
    function create_each_block_1$2(ctx) {
    	let li;
    	let div;
    	let span;
    	let t0_value = /*diagnostico*/ ctx[111].c + "";
    	let t0;
    	let t1;
    	let t2_value = /*diagnostico*/ ctx[111].d + "";
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[81](/*diagnostico*/ ctx[111], ...args);
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
    			add_location(span, file$k, 1126, 52, 53041);
    			attr_dev(div, "class", "p-2");
    			add_location(div, file$k, 1119, 48, 52582);
    			add_location(li, file$k, 1118, 44, 52528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*filtroDiagnostico*/ 16777216 && t0_value !== (t0_value = /*diagnostico*/ ctx[111].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*filtroDiagnostico*/ 16777216 && t2_value !== (t2_value = /*diagnostico*/ ctx[111].d + "")) set_data_dev(t2, t2_value);
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
    		source: "(1118:40) {#each filtroDiagnostico as diagnostico}",
    		ctx
    	});

    	return block;
    }

    // (1176:40) {#if item.comentario !== undefined}
    function create_if_block_1$5(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[85].call(input, /*each_value*/ ctx[109], /*i*/ ctx[110]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control border-primary");
    			attr_dev(input, "placeholder", "Comentario");
    			add_location(input, file$k, 1178, 52, 56354);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$k, 1177, 48, 56283);
    			attr_dev(div1, "class", "row mt-3");
    			add_location(div1, file$k, 1176, 44, 56211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*item*/ ctx[108].comentario);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(input, "input", input_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && input.value !== /*item*/ ctx[108].comentario) {
    				set_input_value(input, /*item*/ ctx[108].comentario);
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
    		source: "(1176:40) {#if item.comentario !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (1149:32) {#each diagnosticosSeleccionados as item, i}
    function create_each_block$5(ctx) {
    	let li;
    	let span0;
    	let t0_value = /*item*/ ctx[108].c + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*item*/ ctx[108].d + "";
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

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[83](/*i*/ ctx[110], ...args);
    	}

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[84](/*i*/ ctx[110], ...args);
    	}

    	let if_block = /*item*/ ctx[108].comentario !== undefined && create_if_block_1$5(ctx);

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
    			add_location(span0, file$k, 1150, 40, 54404);
    			add_location(span1, file$k, 1152, 47, 54547);
    			attr_dev(i0, "class", "mdi-18px mdi mdi-comment-plus-outline");
    			add_location(i0, file$k, 1161, 49, 55233);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "text-primary");
    			attr_dev(a0, "data-tooltip", "Comentar");
    			add_location(a0, file$k, 1156, 44, 54865);
    			attr_dev(i1, "class", "mdi-18px mdi mdi-trash-can-outline");
    			add_location(i1, file$k, 1170, 49, 55840);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "text-danger");
    			attr_dev(a1, "data-tooltip", "Eliminar");
    			add_location(a1, file$k, 1165, 44, 55482);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", "0");
    			set_style(div, "right", "0");
    			set_style(div, "padding", "10px");
    			set_style(div, "background-color", "white");
    			set_style(div, "border-bottom-left-radius", "5px");
    			add_location(div, file$k, 1153, 40, 54610);
    			add_location(li, file$k, 1149, 36, 54358);
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
    					listen_dev(a0, "click", prevent_default(click_handler_4), false, true, false),
    					listen_dev(a1, "click", prevent_default(click_handler_5), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && t0_value !== (t0_value = /*item*/ ctx[108].c + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 && t2_value !== (t2_value = /*item*/ ctx[108].d + "")) set_data_dev(t2, t2_value);

    			if (/*item*/ ctx[108].comentario !== undefined) {
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
    		source: "(1149:32) {#each diagnosticosSeleccionados as item, i}",
    		ctx
    	});

    	return block;
    }

    // (1185:32) {#if diagnosticosSeleccionados.length === 0}
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
    			add_location(p, file$k, 1191, 48, 57217);
    			attr_dev(div0, "class", "alert border alert-light");
    			attr_dev(div0, "role", "alert");
    			add_location(div0, file$k, 1187, 44, 56972);
    			attr_dev(ul, "class", "list-info");
    			attr_dev(ul, "data-bind", "foreach: estudios");
    			add_location(ul, file$k, 1198, 44, 57655);
    			attr_dev(div1, "class", "col-md-12");
    			add_location(div1, file$k, 1186, 40, 56903);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$k, 1185, 36, 56844);
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
    		source: "(1185:32) {#if diagnosticosSeleccionados.length === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let asideatencion;
    	let t0;
    	let div6;
    	let t1;
    	let t2;
    	let div5;
    	let div0;
    	let h5;
    	let span0;
    	let t4;
    	let span1;
    	let t5_value = /*paciente*/ ctx[1].nombres + "";
    	let t5;
    	let t6;
    	let t7_value = /*paciente*/ ctx[1].apellidos + "";
    	let t7;
    	let t8;
    	let div2;
    	let div1;
    	let t9;
    	let t10;
    	let t11;
    	let button0;
    	let i0;
    	let t12;
    	let div4;
    	let div3;
    	let button1;
    	let i1;
    	let t13;
    	let sapn0;
    	let t15;
    	let button2;
    	let i2;
    	let t16;
    	let sapn1;
    	let t18;
    	let button3;
    	let i3;
    	let t19;
    	let sapn2;
    	let t21;
    	let button4;
    	let i4;
    	let t22;
    	let sapn3;
    	let t24;
    	let header;
    	let t25;
    	let main;
    	let div48;
    	let div47;
    	let div10;
    	let div8;
    	let div7;
    	let t27;
    	let div9;
    	let textarea0;
    	let t28;
    	let div14;
    	let div12;
    	let div11;
    	let t30;
    	let div13;
    	let textarea1;
    	let t31;
    	let t32;
    	let t33;
    	let t34;
    	let div21;
    	let div16;
    	let div15;
    	let t36;
    	let div19;
    	let div18;
    	let a0;
    	let i5;
    	let t37;
    	let div17;
    	let button5;
    	let t39;
    	let button6;
    	let t41;
    	let button7;
    	let t43;
    	let div20;
    	let textarea2;
    	let t44;
    	let t45;
    	let div33;
    	let div23;
    	let div22;
    	let t47;
    	let div26;
    	let div25;
    	let a1;
    	let i6;
    	let t48;
    	let div24;
    	let button8;
    	let i7;
    	let t49;
    	let t50;
    	let div32;
    	let div31;
    	let div29;
    	let div28;
    	let input0;
    	let t51;
    	let ul0;
    	let div27;
    	let t52;
    	let li;
    	let a2;
    	let i8;
    	let t53;
    	let t54;
    	let div30;
    	let ul1;
    	let t55;
    	let t56;
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
    	let t57;
    	let div37;
    	let div35;
    	let div34;
    	let t59;
    	let div36;
    	let textarea3;
    	let t60;
    	let div46;
    	let div45;
    	let div44;
    	let div39;
    	let div38;
    	let t62;
    	let div43;
    	let div42;
    	let div40;
    	let label0;
    	let t64;
    	let input1;
    	let t65;
    	let div41;
    	let label1;
    	let t67;
    	let input2;
    	let t68;
    	let modaldatospaciente;
    	let t69;
    	let modaltratamientos;
    	let t70;
    	let modalinterconsulta;
    	let t71;
    	let modalantecedentes;
    	let current;
    	let mounted;
    	let dispose;
    	asideatencion = new AsideAtencion({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[20] && create_if_block_12(ctx);
    	let if_block1 = /*serverConexion*/ ctx[23] && create_if_block_11(ctx);
    	let if_block2 = !/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20] && create_if_block_10(ctx);
    	let if_block3 = /*errorServer*/ ctx[20] && create_if_block_9(ctx);
    	let if_block4 = /*cargando*/ ctx[13] && !/*errorServer*/ ctx[20] && create_if_block_8(ctx);
    	header = new Header({ $$inline: true });
    	let if_block5 = /*empresa*/ ctx[21].historiaGinecologica && create_if_block_7(ctx);
    	let if_block6 = /*empresa*/ ctx[21].signosVitales && create_if_block_6(ctx);
    	let if_block7 = /*empresa*/ ctx[21].otrosParametros && create_if_block_5$1(ctx);
    	let if_block8 = /*empresa*/ ctx[21].exploracionFisica && create_if_block_2$4(ctx);
    	let each_value_1 = /*filtroDiagnostico*/ ctx[24];
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

    	let if_block9 = /*diagnosticosSeleccionados*/ ctx[5].length === 0 && create_if_block$8(ctx);

    	function ordenesmedicas_idHistoria_binding(value) {
    		/*ordenesmedicas_idHistoria_binding*/ ctx[86].call(null, value);
    	}

    	function ordenesmedicas_idPaciente_binding(value) {
    		/*ordenesmedicas_idPaciente_binding*/ ctx[87].call(null, value);
    	}

    	function ordenesmedicas_estudiosSeleccionados_binding(value) {
    		/*ordenesmedicas_estudiosSeleccionados_binding*/ ctx[88].call(null, value);
    	}

    	function ordenesmedicas_medicamentosSeleccionados_binding(value) {
    		/*ordenesmedicas_medicamentosSeleccionados_binding*/ ctx[89].call(null, value);
    	}

    	function ordenesmedicas_sltBuscarMedicamentos_binding(value) {
    		/*ordenesmedicas_sltBuscarMedicamentos_binding*/ ctx[90].call(null, value);
    	}

    	function ordenesmedicas_sltBuscarEstudios_binding(value) {
    		/*ordenesmedicas_sltBuscarEstudios_binding*/ ctx[91].call(null, value);
    	}

    	function ordenesmedicas_medicamentos_binding(value) {
    		/*ordenesmedicas_medicamentos_binding*/ ctx[92].call(null, value);
    	}

    	function ordenesmedicas_instrucciones_binding(value) {
    		/*ordenesmedicas_instrucciones_binding*/ ctx[93].call(null, value);
    	}

    	function ordenesmedicas_estudios_binding(value) {
    		/*ordenesmedicas_estudios_binding*/ ctx[94].call(null, value);
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
    	ordenesmedicas.$on("eliminarEstudio", /*eliminarEstudios*/ ctx[34]);
    	ordenesmedicas.$on("agregarEstudio", /*agregarEstudio*/ ctx[29]);
    	ordenesmedicas.$on("buscandoEstudios", /*searchEstudios*/ ctx[28]);
    	ordenesmedicas.$on("modificado", /*guardarHistoria*/ ctx[36]);
    	ordenesmedicas.$on("buscarMedicamentos", /*searchMedicamentos*/ ctx[26]);
    	ordenesmedicas.$on("agregarMedicamento", /*agregarMedicamento*/ ctx[35]);
    	ordenesmedicas.$on("eliminarMedicamento", /*eliminarMedicamento*/ ctx[32]);

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
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div5 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			span0 = element("span");
    			span0.textContent = "Historia Clinica";
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			t9 = space();
    			if (if_block3) if_block3.c();
    			t10 = space();
    			if (if_block4) if_block4.c();
    			t11 = space();
    			button0 = element("button");
    			i0 = element("i");
    			t12 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			t13 = space();
    			sapn0 = element("sapn");
    			sapn0.textContent = "Datos del Paciente";
    			t15 = space();
    			button2 = element("button");
    			i2 = element("i");
    			t16 = space();
    			sapn1 = element("sapn");
    			sapn1.textContent = "Agregar Campo";
    			t18 = space();
    			button3 = element("button");
    			i3 = element("i");
    			t19 = space();
    			sapn2 = element("sapn");
    			sapn2.textContent = "Imprimir";
    			t21 = space();
    			button4 = element("button");
    			i4 = element("i");
    			t22 = space();
    			sapn3 = element("sapn");
    			sapn3.textContent = "Anular";
    			t24 = space();
    			create_component(header.$$.fragment);
    			t25 = space();
    			main = element("main");
    			div48 = element("div");
    			div47 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = "Motivo de consulta";
    			t27 = space();
    			div9 = element("div");
    			textarea0 = element("textarea");
    			t28 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Historia de la enfermedad";
    			t30 = space();
    			div13 = element("div");
    			textarea1 = element("textarea");
    			t31 = space();
    			if (if_block5) if_block5.c();
    			t32 = space();
    			if (if_block6) if_block6.c();
    			t33 = space();
    			if (if_block7) if_block7.c();
    			t34 = space();
    			div21 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div15.textContent = "Examen Fisico";
    			t36 = space();
    			div19 = element("div");
    			div18 = element("div");
    			a0 = element("a");
    			i5 = element("i");
    			t37 = space();
    			div17 = element("div");
    			button5 = element("button");
    			button5.textContent = "Action";
    			t39 = space();
    			button6 = element("button");
    			button6.textContent = "Another action";
    			t41 = space();
    			button7 = element("button");
    			button7.textContent = "Something else here";
    			t43 = space();
    			div20 = element("div");
    			textarea2 = element("textarea");
    			t44 = space();
    			if (if_block8) if_block8.c();
    			t45 = space();
    			div33 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			div22.textContent = "Diagnosticos";
    			t47 = space();
    			div26 = element("div");
    			div25 = element("div");
    			a1 = element("a");
    			i6 = element("i");
    			t48 = space();
    			div24 = element("div");
    			button8 = element("button");
    			i7 = element("i");
    			t49 = text("\r\n                                Agregar nuevo diagnostico");
    			t50 = space();
    			div32 = element("div");
    			div31 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			input0 = element("input");
    			t51 = space();
    			ul0 = element("ul");
    			div27 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t52 = space();
    			li = element("li");
    			a2 = element("a");
    			i8 = element("i");
    			t53 = text("Agregar\r\n                                                manualmente");
    			t54 = space();
    			div30 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t55 = space();
    			if (if_block9) if_block9.c();
    			t56 = space();
    			create_component(ordenesmedicas.$$.fragment);
    			t57 = space();
    			div37 = element("div");
    			div35 = element("div");
    			div34 = element("div");
    			div34.textContent = "Observaciones";
    			t59 = space();
    			div36 = element("div");
    			textarea3 = element("textarea");
    			t60 = space();
    			div46 = element("div");
    			div45 = element("div");
    			div44 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			div38.textContent = "Fecha y hora";
    			t62 = space();
    			div43 = element("div");
    			div42 = element("div");
    			div40 = element("div");
    			label0 = element("label");
    			label0.textContent = "Fecha";
    			t64 = space();
    			input1 = element("input");
    			t65 = space();
    			div41 = element("div");
    			label1 = element("label");
    			label1.textContent = "Hora";
    			t67 = space();
    			input2 = element("input");
    			t68 = space();
    			create_component(modaldatospaciente.$$.fragment);
    			t69 = space();
    			create_component(modaltratamientos.$$.fragment);
    			t70 = space();
    			create_component(modalinterconsulta.$$.fragment);
    			t71 = space();
    			create_component(modalantecedentes.$$.fragment);
    			attr_dev(span0, "class", "badge badge-primary");
    			attr_dev(span0, "data-bind", "text: titulo");
    			add_location(span0, file$k, 442, 16, 14640);
    			attr_dev(span1, "data-bind", "text: paciente().nombreParaMostrar");
    			add_location(span1, file$k, 445, 16, 14780);
    			add_location(h5, file$k, 441, 12, 14618);
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file$k, 440, 8, 14582);
    			attr_dev(div1, "class", "guardar-documento");
    			add_location(div1, file$k, 451, 12, 15027);
    			attr_dev(div2, "class", "col-md-6");
    			set_style(div2, "text-align", "right");
    			add_location(div2, file$k, 450, 8, 14964);
    			attr_dev(i0, "class", "mdi mdi-content-save-outline");
    			add_location(i0, file$k, 481, 12, 16175);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success flotante svelte-14y2n0i");
    			attr_dev(button0, "data-tooltip", "Guardar");
    			add_location(button0, file$k, 475, 8, 15951);
    			attr_dev(i1, "data-bind", "class: icon");
    			attr_dev(i1, "class", "mdi mdi-comment-eye");
    			add_location(i1, file$k, 491, 20, 16614);
    			attr_dev(sapn0, "data-bind", "text: text");
    			add_location(sapn0, file$k, 492, 20, 16693);
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", "#modalDatosPersonales");
    			set_style(button1, "box-shadow", "none");
    			attr_dev(button1, "class", "btn btn-outline-secondary btn-sm");
    			add_location(button1, file$k, 485, 16, 16360);
    			attr_dev(i2, "data-bind", "class: icon");
    			attr_dev(i2, "class", "mdi mdi-text");
    			add_location(i2, file$k, 500, 20, 17014);
    			attr_dev(sapn1, "data-bind", "text: text");
    			add_location(sapn1, file$k, 501, 20, 17086);
    			attr_dev(button2, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button2, "box-shadow", "none");
    			attr_dev(button2, "class", "btn btn-outline-dark btn-sm");
    			add_location(button2, file$k, 495, 16, 16794);
    			attr_dev(i3, "data-bind", "class: icon");
    			attr_dev(i3, "class", "mdi mdi-printer");
    			add_location(i3, file$k, 519, 20, 17854);
    			attr_dev(sapn2, "data-bind", "text: text");
    			add_location(sapn2, file$k, 520, 20, 17929);
    			attr_dev(button3, "data-bind", " class: itemClass,click: clickEvent");
    			set_style(button3, "box-shadow", "none");
    			attr_dev(button3, "class", "btn btn-outline-dark btn-sm btn-hover-white");
    			add_location(button3, file$k, 514, 16, 17618);
    			attr_dev(i4, "data-bind", "class: icon");
    			attr_dev(i4, "class", "mdi mdi-delete");
    			add_location(i4, file$k, 538, 20, 18678);
    			attr_dev(sapn3, "data-bind", "text: text");
    			add_location(sapn3, file$k, 539, 20, 18752);
    			set_style(button4, "box-shadow", "none");
    			attr_dev(button4, "class", "btn btn-outline-danger btn-sm");
    			add_location(button4, file$k, 533, 16, 18451);
    			attr_dev(div3, "class", "dropdown");
    			attr_dev(div3, "data-bind", "foreach: actionButtons");
    			add_location(div3, file$k, 484, 12, 16285);
    			attr_dev(div4, "class", "col-lg-12");
    			add_location(div4, file$k, 483, 8, 16248);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$k, 439, 4, 14555);
    			attr_dev(div6, "class", "contenedor-datos");
    			attr_dev(div6, "id", "divHeaderBar");
    			add_location(div6, file$k, 432, 0, 14276);
    			attr_dev(div7, "class", "card-title");
    			add_location(div7, file$k, 555, 20, 19219);
    			attr_dev(div8, "class", "card-header");
    			add_location(div8, file$k, 554, 16, 19172);
    			attr_dev(textarea0, "class", "form-control");
    			set_style(textarea0, "width", "100%");
    			set_style(textarea0, "display", "block");
    			set_style(textarea0, "height", "150px");
    			attr_dev(textarea0, "rows", "3");
    			attr_dev(textarea0, "name", "Comentario");
    			attr_dev(textarea0, "data-bind", "value: atencionMedica.motivoConsulta");
    			add_location(textarea0, file$k, 558, 20, 19354);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$k, 557, 16, 19309);
    			attr_dev(div10, "data-bind", "if: perfil().motivoConsulta");
    			attr_dev(div10, "class", "card m-b-20 margen-mobile");
    			add_location(div10, file$k, 550, 12, 19027);
    			attr_dev(div11, "class", "card-title");
    			add_location(div11, file$k, 573, 20, 19962);
    			attr_dev(div12, "class", "card-header");
    			add_location(div12, file$k, 572, 16, 19915);
    			attr_dev(textarea1, "class", "form-control");
    			attr_dev(textarea1, "data-bind", "value: atencionMedica.historiaEnfermedad");
    			set_style(textarea1, "width", "100%");
    			set_style(textarea1, "display", "block");
    			set_style(textarea1, "height", "150px");
    			attr_dev(textarea1, "rows", "3");
    			attr_dev(textarea1, "name", "Comentario");
    			add_location(textarea1, file$k, 576, 20, 20104);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$k, 575, 16, 20059);
    			attr_dev(div14, "class", "card m-b-20 autosave");
    			add_location(div14, file$k, 569, 12, 19832);
    			attr_dev(div15, "class", "card-title");
    			add_location(div15, file$k, 994, 20, 46169);
    			attr_dev(div16, "class", "card-header");
    			add_location(div16, file$k, 993, 16, 46122);
    			attr_dev(i5, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i5, file$k, 1004, 28, 46601);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "data-toggle", "dropdown");
    			attr_dev(a0, "aria-haspopup", "true");
    			attr_dev(a0, "aria-expanded", "false");
    			add_location(a0, file$k, 998, 24, 46351);
    			attr_dev(button5, "class", "dropdown-item");
    			attr_dev(button5, "type", "button");
    			add_location(button5, file$k, 1007, 28, 46775);
    			attr_dev(button6, "class", "dropdown-item");
    			attr_dev(button6, "type", "button");
    			add_location(button6, file$k, 1010, 28, 46928);
    			attr_dev(button7, "class", "dropdown-item");
    			attr_dev(button7, "type", "button");
    			add_location(button7, file$k, 1013, 28, 47089);
    			attr_dev(div17, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div17, file$k, 1006, 24, 46698);
    			attr_dev(div18, "class", "dropdown");
    			add_location(div18, file$k, 997, 20, 46303);
    			attr_dev(div19, "class", "card-controls");
    			add_location(div19, file$k, 996, 16, 46254);
    			attr_dev(textarea2, "class", "form-control");
    			set_style(textarea2, "width", "100%");
    			set_style(textarea2, "display", "block");
    			attr_dev(textarea2, "rows", "5");
    			attr_dev(textarea2, "name", "Comentario");
    			add_location(textarea2, file$k, 1020, 20, 47372);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$k, 1019, 16, 47327);
    			attr_dev(div21, "class", "card m-b-20 autosave");
    			add_location(div21, file$k, 990, 12, 46039);
    			attr_dev(div22, "class", "card-title");
    			add_location(div22, file$k, 1071, 20, 50038);
    			attr_dev(div23, "class", "card-header");
    			add_location(div23, file$k, 1070, 16, 49991);
    			attr_dev(i6, "class", "icon mdi  mdi-dots-vertical");
    			add_location(i6, file$k, 1081, 28, 50469);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "data-toggle", "dropdown");
    			attr_dev(a1, "aria-haspopup", "true");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file$k, 1075, 24, 50219);
    			attr_dev(i7, "class", "mdi mdi-plus");
    			add_location(i7, file$k, 1087, 33, 50800);
    			attr_dev(button8, "class", "dropdown-item text-success");
    			attr_dev(button8, "type", "button");
    			add_location(button8, file$k, 1084, 28, 50643);
    			attr_dev(div24, "class", "dropdown-menu dropdown-menu-right");
    			add_location(div24, file$k, 1083, 24, 50566);
    			attr_dev(div25, "class", "dropdown");
    			add_location(div25, file$k, 1074, 20, 50171);
    			attr_dev(div26, "class", "card-controls");
    			add_location(div26, file$k, 1073, 16, 50122);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "txtBusquedaProblemaMedico");
    			attr_dev(input0, "data-toggle", "dropdown");
    			attr_dev(input0, "aria-haspopup", "true");
    			attr_dev(input0, "aria-expanded", "true");
    			attr_dev(input0, "autocomplete", "off");
    			add_location(input0, file$k, 1099, 32, 51317);
    			attr_dev(i8, "class", "mdi mdi-plus");
    			add_location(i8, file$k, 1137, 49, 53797);
    			attr_dev(a2, "href", "#!");
    			add_location(a2, file$k, 1135, 44, 53599);
    			attr_dev(li, "class", "defecto");
    			add_location(li, file$k, 1134, 40, 53533);
    			attr_dev(div27, "class", "contenidoLista");
    			add_location(div27, file$k, 1116, 36, 52372);
    			attr_dev(ul0, "class", "lista-buscador dropdown-menu");
    			attr_dev(ul0, "id", "buscador");
    			attr_dev(ul0, "x-placement", "top-start");
    			set_style(ul0, "position", "absolute");
    			set_style(ul0, "will-change", "transform");
    			set_style(ul0, "top", "0px");
    			set_style(ul0, "left", "0px");
    			set_style(ul0, "transform", "translate3d(0px, -128px, 0px)");
    			set_style(ul0, "border-radius", "5px");
    			add_location(ul0, file$k, 1110, 32, 51938);
    			attr_dev(div28, "class", "form-group buscardor dropdown dropdown-vnc");
    			add_location(div28, file$k, 1096, 28, 51164);
    			attr_dev(div29, "class", "col-12");
    			add_location(div29, file$k, 1095, 24, 51114);
    			attr_dev(ul1, "class", "list-info");
    			add_location(ul1, file$k, 1147, 28, 54220);
    			attr_dev(div30, "class", "col-md-12");
    			add_location(div30, file$k, 1146, 24, 54167);
    			attr_dev(div31, "class", "row");
    			add_location(div31, file$k, 1094, 20, 51071);
    			attr_dev(div32, "class", "card-body");
    			add_location(div32, file$k, 1093, 16, 51026);
    			attr_dev(div33, "class", "card m-b-20");
    			add_location(div33, file$k, 1069, 12, 49948);
    			attr_dev(div34, "class", "card-title");
    			add_location(div34, file$k, 1232, 20, 59221);
    			attr_dev(div35, "class", "card-header");
    			add_location(div35, file$k, 1231, 16, 59174);
    			attr_dev(textarea3, "class", "form-control");
    			set_style(textarea3, "width", "100%");
    			set_style(textarea3, "display", "block");
    			set_style(textarea3, "height", "150px");
    			attr_dev(textarea3, "rows", "3");
    			add_location(textarea3, file$k, 1235, 20, 59351);
    			attr_dev(div36, "class", "card-body");
    			add_location(div36, file$k, 1234, 16, 59306);
    			attr_dev(div37, "class", "card m-b-20 margen-mobile autosave");
    			add_location(div37, file$k, 1230, 12, 59108);
    			attr_dev(div38, "class", "card-title");
    			add_location(div38, file$k, 1249, 28, 59898);
    			attr_dev(div39, "class", "card-header");
    			add_location(div39, file$k, 1248, 24, 59843);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$k, 1256, 36, 60275);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Fecha");
    			input1.disabled = true;
    			add_location(input1, file$k, 1257, 36, 60340);
    			attr_dev(div40, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div40, file$k, 1253, 32, 60107);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$k, 1268, 36, 60914);
    			attr_dev(input2, "type", "time");
    			attr_dev(input2, "placeholder", "Hora");
    			attr_dev(input2, "class", "form-control");
    			input2.disabled = true;
    			add_location(input2, file$k, 1269, 36, 60978);
    			attr_dev(div41, "class", "form-group floating-label col-md-6 show-label");
    			add_location(div41, file$k, 1265, 32, 60746);
    			attr_dev(div42, "class", "form-row");
    			add_location(div42, file$k, 1252, 28, 60051);
    			attr_dev(div43, "class", "card-body");
    			add_location(div43, file$k, 1251, 24, 59998);
    			attr_dev(div44, "class", "card m-b-20");
    			add_location(div44, file$k, 1247, 20, 59792);
    			attr_dev(div45, "class", "col-lg-6");
    			add_location(div45, file$k, 1246, 16, 59748);
    			attr_dev(div46, "class", "row");
    			add_location(div46, file$k, 1245, 12, 59713);
    			attr_dev(div47, "class", "col-lg-12");
    			set_style(div47, "margin-top", "150px");
    			add_location(div47, file$k, 549, 8, 18964);
    			attr_dev(div48, "class", "container m-b-30");
    			add_location(div48, file$k, 548, 4, 18924);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$k, 547, 0, 18893);
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
    			if (if_block1) if_block1.m(div6, null);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h5);
    			append_dev(h5, span0);
    			append_dev(h5, t4);
    			append_dev(h5, span1);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(span1, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t10);
    			if (if_block4) if_block4.m(div1, null);
    			append_dev(div5, t11);
    			append_dev(div5, button0);
    			append_dev(button0, i0);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t13);
    			append_dev(button1, sapn0);
    			append_dev(div3, t15);
    			append_dev(div3, button2);
    			append_dev(button2, i2);
    			append_dev(button2, t16);
    			append_dev(button2, sapn1);
    			append_dev(div3, t18);
    			append_dev(div3, button3);
    			append_dev(button3, i3);
    			append_dev(button3, t19);
    			append_dev(button3, sapn2);
    			append_dev(div3, t21);
    			append_dev(div3, button4);
    			append_dev(button4, i4);
    			append_dev(button4, t22);
    			append_dev(button4, sapn3);
    			insert_dev(target, t24, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div48);
    			append_dev(div48, div47);
    			append_dev(div47, div10);
    			append_dev(div10, div8);
    			append_dev(div8, div7);
    			append_dev(div10, t27);
    			append_dev(div10, div9);
    			append_dev(div9, textarea0);
    			set_input_value(textarea0, /*historia*/ ctx[7].motivoConsulta);
    			append_dev(div47, t28);
    			append_dev(div47, div14);
    			append_dev(div14, div12);
    			append_dev(div12, div11);
    			append_dev(div14, t30);
    			append_dev(div14, div13);
    			append_dev(div13, textarea1);
    			set_input_value(textarea1, /*historia*/ ctx[7].historiaEnfermedad);
    			append_dev(div47, t31);
    			if (if_block5) if_block5.m(div47, null);
    			append_dev(div47, t32);
    			if (if_block6) if_block6.m(div47, null);
    			append_dev(div47, t33);
    			if (if_block7) if_block7.m(div47, null);
    			append_dev(div47, t34);
    			append_dev(div47, div21);
    			append_dev(div21, div16);
    			append_dev(div16, div15);
    			append_dev(div21, t36);
    			append_dev(div21, div19);
    			append_dev(div19, div18);
    			append_dev(div18, a0);
    			append_dev(a0, i5);
    			append_dev(div18, t37);
    			append_dev(div18, div17);
    			append_dev(div17, button5);
    			append_dev(div17, t39);
    			append_dev(div17, button6);
    			append_dev(div17, t41);
    			append_dev(div17, button7);
    			append_dev(div21, t43);
    			append_dev(div21, div20);
    			append_dev(div20, textarea2);
    			set_input_value(textarea2, /*historia*/ ctx[7].examenFisico);
    			append_dev(div47, t44);
    			if (if_block8) if_block8.m(div47, null);
    			append_dev(div47, t45);
    			append_dev(div47, div33);
    			append_dev(div33, div23);
    			append_dev(div23, div22);
    			append_dev(div33, t47);
    			append_dev(div33, div26);
    			append_dev(div26, div25);
    			append_dev(div25, a1);
    			append_dev(a1, i6);
    			append_dev(div25, t48);
    			append_dev(div25, div24);
    			append_dev(div24, button8);
    			append_dev(button8, i7);
    			append_dev(button8, t49);
    			append_dev(div33, t50);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, div29);
    			append_dev(div29, div28);
    			append_dev(div28, input0);
    			set_input_value(input0, /*inpBuscarDiagnostico*/ ctx[4]);
    			append_dev(div28, t51);
    			append_dev(div28, ul0);
    			append_dev(ul0, div27);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div27, null);
    			}

    			append_dev(div27, t52);
    			append_dev(div27, li);
    			append_dev(li, a2);
    			append_dev(a2, i8);
    			append_dev(a2, t53);
    			append_dev(div31, t54);
    			append_dev(div31, div30);
    			append_dev(div30, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			append_dev(ul1, t55);
    			if (if_block9) if_block9.m(ul1, null);
    			append_dev(div47, t56);
    			mount_component(ordenesmedicas, div47, null);
    			append_dev(div47, t57);
    			append_dev(div47, div37);
    			append_dev(div37, div35);
    			append_dev(div35, div34);
    			append_dev(div37, t59);
    			append_dev(div37, div36);
    			append_dev(div36, textarea3);
    			set_input_value(textarea3, /*historia*/ ctx[7].observaciones);
    			append_dev(div47, t60);
    			append_dev(div47, div46);
    			append_dev(div46, div45);
    			append_dev(div45, div44);
    			append_dev(div44, div39);
    			append_dev(div39, div38);
    			append_dev(div44, t62);
    			append_dev(div44, div43);
    			append_dev(div43, div42);
    			append_dev(div42, div40);
    			append_dev(div40, label0);
    			append_dev(div40, t64);
    			append_dev(div40, input1);
    			set_input_value(input1, /*fecha*/ ctx[11]);
    			append_dev(div42, t65);
    			append_dev(div42, div41);
    			append_dev(div41, label1);
    			append_dev(div41, t67);
    			append_dev(div41, input2);
    			set_input_value(input2, /*hora*/ ctx[12]);
    			insert_dev(target, t68, anchor);
    			mount_component(modaldatospaciente, target, anchor);
    			insert_dev(target, t69, anchor);
    			mount_component(modaltratamientos, target, anchor);
    			insert_dev(target, t70, anchor);
    			mount_component(modalinterconsulta, target, anchor);
    			insert_dev(target, t71, anchor);
    			mount_component(modalantecedentes, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(button4, "click", /*click_handler*/ ctx[38], false, false, false),
    					listen_dev(textarea0, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[39]),
    					listen_dev(textarea1, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[40]),
    					listen_dev(textarea2, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[77]),
    					listen_dev(input0, "keyup", /*searchDiagnosticos*/ ctx[27], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler_3*/ ctx[80]),
    					listen_dev(a2, "click", prevent_default(/*click_handler_3*/ ctx[82]), false, true, false),
    					listen_dev(textarea3, "blur", /*guardarHistoria*/ ctx[36], false, false, false),
    					listen_dev(textarea3, "input", /*textarea3_input_handler*/ ctx[95]),
    					listen_dev(input1, "input", /*input1_input_handler_3*/ ctx[96]),
    					listen_dev(input2, "blur", /*blur_handler*/ ctx[97], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler_3*/ ctx[98])
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
    					if_block0 = create_if_block_12(ctx);
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

    			if (/*serverConexion*/ ctx[23]) {
    				if (if_block1) {
    					if (dirty[0] & /*serverConexion*/ 8388608) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div6, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[0] & /*paciente*/ 2) && t5_value !== (t5_value = /*paciente*/ ctx[1].nombres + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty[0] & /*paciente*/ 2) && t7_value !== (t7_value = /*paciente*/ ctx[1].apellidos + "")) set_data_dev(t7, t7_value);

    			if (!/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_10(ctx);
    					if_block2.c();
    					if_block2.m(div1, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*errorServer*/ ctx[20]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_9(ctx);
    					if_block3.c();
    					if_block3.m(div1, t10);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*cargando*/ ctx[13] && !/*errorServer*/ ctx[20]) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_8(ctx);
    					if_block4.c();
    					if_block4.m(div1, null);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea0, /*historia*/ ctx[7].motivoConsulta);
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea1, /*historia*/ ctx[7].historiaEnfermedad);
    			}

    			if (/*empresa*/ ctx[21].historiaGinecologica) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_7(ctx);
    					if_block5.c();
    					if_block5.m(div47, t32);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*empresa*/ ctx[21].signosVitales) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_6(ctx);
    					if_block6.c();
    					if_block6.m(div47, t33);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*empresa*/ ctx[21].otrosParametros) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block_5$1(ctx);
    					if_block7.c();
    					if_block7.m(div47, t34);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (dirty[0] & /*historia*/ 128) {
    				set_input_value(textarea2, /*historia*/ ctx[7].examenFisico);
    			}

    			if (/*empresa*/ ctx[21].exploracionFisica) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block_2$4(ctx);
    					if_block8.c();
    					if_block8.m(div47, t45);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}

    			if (dirty[0] & /*inpBuscarDiagnostico*/ 16 && input0.value !== /*inpBuscarDiagnostico*/ ctx[4]) {
    				set_input_value(input0, /*inpBuscarDiagnostico*/ ctx[4]);
    			}

    			if (dirty[0] & /*filtroDiagnostico*/ 16777216 | dirty[1] & /*seleccionarDiagnostico*/ 64) {
    				each_value_1 = /*filtroDiagnostico*/ ctx[24];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div27, t52);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*diagnosticosSeleccionados*/ 32 | dirty[1] & /*guardarHistoria, eliminarDiagnostico, agregarComentarioDiagnostico*/ 37) {
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
    						each_blocks[i].m(ul1, t55);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*diagnosticosSeleccionados*/ ctx[5].length === 0) {
    				if (if_block9) ; else {
    					if_block9 = create_if_block$8(ctx);
    					if_block9.c();
    					if_block9.m(ul1, null);
    				}
    			} else if (if_block9) {
    				if_block9.d(1);
    				if_block9 = null;
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
    				set_input_value(input1, /*fecha*/ ctx[11]);
    			}

    			if (dirty[0] & /*hora*/ 4096) {
    				set_input_value(input2, /*hora*/ ctx[12]);
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
    			transition_in(if_block1);
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
    			transition_out(if_block1);
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
    			if (if_block4) if_block4.d();
    			if (detaching) detach_dev(t24);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(main);
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block9) if_block9.d();
    			destroy_component(ordenesmedicas);
    			if (detaching) detach_dev(t68);
    			destroy_component(modaldatospaciente, detaching);
    			if (detaching) detach_dev(t69);
    			destroy_component(modaltratamientos, detaching);
    			if (detaching) detach_dev(t70);
    			destroy_component(modalinterconsulta, detaching);
    			if (detaching) detach_dev(t71);
    			destroy_component(modalantecedentes, detaching);
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

    function instance$m($$self, $$props, $$invalidate) {
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
    	let empresa = {};
    	let exploracionFisica = [];
    	let serverConexion = false;

    	const cargarEmpresa = () => {
    		const config = {
    			method: "get",
    			url: `${url}/empresas/${user().empresa}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(21, empresa = res.data);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const eliminarHistoria = id => {
    		Swal.fire({
    			title: "¿Estás seguro?",
    			text: "Se eliminará esta historia clínica, sin embargo, los datos no se perderán, puedes recuperarlos en el futuro!",
    			icon: "warning",
    			showCancelButton: true,
    			confirmButtonColor: "#3085d6",
    			cancelButtonColor: "#d33",
    			confirmButtonText: "Si, Eliminarlo!",
    			cancelButtonText: "Cancelar"
    		}).then(result => {
    			if (result.isConfirmed) {
    				const config = {
    					method: "put",
    					url: `${url}/historias/${id}/eliminar`,
    					headers: {
    						"Authorization": `${localStorage.getItem("auth")}`
    					}
    				};

    				axios$1(config).then(res => {
    					if (res.status === 200) {
    						push(`/pacientes/perfil/${params.idPaciente}`);
    					}
    				}).catch(err => {
    					
    				});
    			}
    		});
    	};

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
    	};

    	const agregarDiagnosticoPersonalizado = nombre => {
    		const diagnostico = { d: nombre, c: "PERS", id: v4() };
    		$$invalidate(5, diagnosticosSeleccionados = [...diagnosticosSeleccionados, diagnostico]);
    		guardarHistoria();
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

    		try {
    			let promesa = await axios$1(config);

    			if (promesa.status == 200) {
    				$$invalidate(1, paciente = await promesa.data);
    				$$invalidate(2, edad = calcularEdad$2(paciente.fechaNacimiento));

    				if (paciente.seguroMedico.length !== 0) {
    					$$invalidate(3, seguro = paciente.seguroMedico[0].nombre);
    				} else {
    					$$invalidate(3, seguro = "N/A");
    				}
    			} else {
    				$$invalidate(23, serverConexion = true);
    				console.error(promesa.statusText);
    			}
    		} catch(error) {
    			$$invalidate(23, serverConexion = true);
    			console.error(promesa.statusText);
    		}
    	}

    	const cargarHistoria = async () => {
    		try {
    			const config = {
    				method: "get",
    				url: `${url}/historias/${params.idHistoria}`,
    				headers: {
    					"Authorization": `${localStorage.getItem("auth")}`
    				}
    			};

    			let promesa = await axios$1(config);
    			$$invalidate(7, historia = promesa.data);
    			$$invalidate(8, temperatura = promesa.data.temperatura);
    			$$invalidate(9, presionAlterial = promesa.data.presionAlterial);
    			$$invalidate(10, peso = promesa.data.peso);
    			$$invalidate(5, diagnosticosSeleccionados = promesa.data.diagnosticos);
    			$$invalidate(11, fecha = promesa.data.fechaHora.split("T")[0]);
    			$$invalidate(15, medicamentosSeleccionados = promesa.data.medicamentos);
    			$$invalidate(18, estudiosSeleccionados = promesa.data.estudios);
    			$$invalidate(19, historiaGinecologica = promesa.data.historiaGinecologica);
    			$$invalidate(22, exploracionFisica = promesa.data.exploracionFisica || []);
    			let obtenerHora = promesa.data.fechaHora.split("T")[1].split("Z")[0].split(".")[0].split(":");
    			$$invalidate(12, hora = obtenerHora[0] + ":" + obtenerHora[1]);
    		} catch(error) {
    			$$invalidate(23, serverConexion = true);
    			console.log(serverConexion);
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
    					$$invalidate(99, diagnosticos = res.data);
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
    		cargarEmpresa();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<HistoriaClinica> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => eliminarHistoria(params.idHistoria);

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

    	function input0_input_handler_1() {
    		temperatura.valor = to_number(this.value);
    		$$invalidate(8, temperatura);
    	}

    	function select_change_handler() {
    		temperatura.tipo = select_value(this);
    		$$invalidate(8, temperatura);
    	}

    	function input1_input_handler_1() {
    		historia.frecuenciaRespiratoria = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input2_input_handler_1() {
    		historia.frecuenciaCardiaca = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input3_input_handler_1() {
    		presionAlterial.mm = to_number(this.value);
    		$$invalidate(9, presionAlterial);
    	}

    	function input4_input_handler_1() {
    		presionAlterial.Hg = to_number(this.value);
    		$$invalidate(9, presionAlterial);
    	}

    	function input0_input_handler_2() {
    		peso.valor = to_number(this.value);
    		$$invalidate(10, peso);
    	}

    	function select_change_handler_1() {
    		peso.tipo = select_value(this);
    		$$invalidate(10, peso);
    	}

    	function input1_input_handler_2() {
    		historia.escalaGalsgow = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input2_input_handler_2() {
    		historia.escalaDolor = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input3_input_handler_2() {
    		historia.saturacionOxigeno = to_number(this.value);
    		$$invalidate(7, historia);
    	}

    	function input4_input_handler_2() {
    		historia.otrosParametros = this.value;
    		$$invalidate(7, historia);
    	}

    	function textarea2_input_handler() {
    		historia.examenFisico = this.value;
    		$$invalidate(7, historia);
    	}

    	const click_handler_1 = (item, each_value_3, item_index_1) => {
    		$$invalidate(22, each_value_3[item_index_1].activo = true, exploracionFisica);
    		guardarHistoria();
    	};

    	function textarea_input_handler(each_value_2, item_index) {
    		each_value_2[item_index].text = this.value;
    		$$invalidate(22, exploracionFisica);
    	}

    	function input0_input_handler_3() {
    		inpBuscarDiagnostico = this.value;
    		$$invalidate(4, inpBuscarDiagnostico);
    	}

    	const click_handler_2 = diagnostico => seleccionarDiagnostico(diagnostico.c);
    	const click_handler_3 = () => agregarDiagnosticoPersonalizado(inpBuscarDiagnostico);
    	const click_handler_4 = i => agregarComentarioDiagnostico(i);
    	const click_handler_5 = i => eliminarDiagnostico(i);

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

    	function input1_input_handler_3() {
    		fecha = this.value;
    		$$invalidate(11, fecha);
    	}

    	const blur_handler = () => console.log(hora);

    	function input2_input_handler_3() {
    		hora = this.value;
    		$$invalidate(12, hora);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		link,
    		push,
    		axios: axios$1,
    		onMount,
    		url,
    		user,
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
    		NoConexion,
    		ErrorConexion,
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
    		empresa,
    		exploracionFisica,
    		serverConexion,
    		cargarEmpresa,
    		eliminarHistoria,
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
    		if ("diagnosticos" in $$props) $$invalidate(99, diagnosticos = $$props.diagnosticos);
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
    		if ("empresa" in $$props) $$invalidate(21, empresa = $$props.empresa);
    		if ("exploracionFisica" in $$props) $$invalidate(22, exploracionFisica = $$props.exploracionFisica);
    		if ("serverConexion" in $$props) $$invalidate(23, serverConexion = $$props.serverConexion);
    		if ("filtroDiagnostico" in $$props) $$invalidate(24, filtroDiagnostico = $$props.filtroDiagnostico);
    	};

    	let filtroDiagnostico;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[3] & /*diagnosticos*/ 64) {
    			 $$invalidate(24, filtroDiagnostico = diagnosticos);
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
    		empresa,
    		exploracionFisica,
    		serverConexion,
    		filtroDiagnostico,
    		eliminarHistoria,
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
    		click_handler,
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
    		input0_input_handler_1,
    		select_change_handler,
    		input1_input_handler_1,
    		input2_input_handler_1,
    		input3_input_handler_1,
    		input4_input_handler_1,
    		input0_input_handler_2,
    		select_change_handler_1,
    		input1_input_handler_2,
    		input2_input_handler_2,
    		input3_input_handler_2,
    		input4_input_handler_2,
    		textarea2_input_handler,
    		click_handler_1,
    		textarea_input_handler,
    		input0_input_handler_3,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
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
    		input1_input_handler_3,
    		blur_handler,
    		input2_input_handler_3
    	];
    }

    class HistoriaClinica extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { params: 0 }, [-1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoriaClinica",
    			options,
    			id: create_fragment$m.name
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
    const file$l = "src\\Pages\\Home\\Login.svelte";

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
    			add_location(div, file$l, 58, 16, 1844);
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

    function create_fragment$n(ctx) {
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
    			add_location(img, file$l, 66, 28, 2160);
    			add_location(p0, file$l, 65, 24, 2127);
    			attr_dev(p1, "class", "admin-brand-content");
    			add_location(p1, file$l, 69, 24, 2267);
    			attr_dev(div0, "class", "p-b-20 text-center");
    			add_location(div0, file$l, 64, 20, 2069);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$l, 76, 32, 2646);
    			attr_dev(input0, "type", "email");
    			input0.required = "true";
    			attr_dev(input0, "autocomplete", "username");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Correo");
    			add_location(input0, file$l, 77, 32, 2708);
    			attr_dev(div1, "class", "form-group floating-label col-md-12");
    			add_location(div1, file$l, 75, 28, 2563);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$l, 80, 32, 2982);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "autocomplete", "current-password");
    			attr_dev(input1, "placeholder", "Contraseña");
    			input1.required = "true";
    			attr_dev(input1, "class", "form-control ");
    			add_location(input1, file$l, 81, 32, 3055);
    			attr_dev(div2, "class", "form-group floating-label col-md-12");
    			add_location(div2, file$l, 79, 28, 2899);
    			attr_dev(div3, "class", "form-row");
    			add_location(div3, file$l, 74, 24, 2511);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary btn-block btn-lg");
    			add_location(button, file$l, 85, 24, 3301);
    			attr_dev(form, "class", "needs-validation");
    			add_location(form, file$l, 73, 20, 2420);
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-underline");
    			add_location(a, file$l, 89, 24, 3487);
    			attr_dev(p2, "class", "text-right p-t-10");
    			add_location(p2, file$l, 88, 20, 3432);
    			attr_dev(div4, "class", "mx-auto col-md-8");
    			add_location(div4, file$l, 63, 16, 2017);
    			attr_dev(div5, "class", "row align-items-center m-h-100");
    			add_location(div5, file$l, 62, 12, 1955);
    			attr_dev(div6, "class", "col-lg-4  bg-white");
    			add_location(div6, file$l, 56, 8, 1766);
    			attr_dev(div7, "class", "col-lg-8 d-none d-md-block bg-cover");
    			set_style(div7, "background-image", "url('assets/img/login.svg')");
    			add_location(div7, file$l, 95, 8, 3653);
    			attr_dev(div8, "class", "row ");
    			add_location(div8, file$l, 55, 4, 1738);
    			attr_dev(div9, "class", "container-fluid");
    			add_location(div9, file$l, 54, 0, 1703);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
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

    // (129:28) {#if user().roles.includes('admin')}
    function create_if_block$a(ctx) {
    	let a0;
    	let i0;
    	let t;
    	let a1;
    	let i1;
    	let a1_href_value;
    	let link_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			i0 = element("i");
    			t = space();
    			a1 = element("a");
    			i1 = element("i");
    			attr_dev(i0, "class", "mdi mdi-trash-can-outline");
    			add_location(i0, file$n, 134, 33, 4349);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$n, 129, 33, 4097);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$n, 142, 37, 4797);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/perfil/${/*usuario*/ ctx[9].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Perfil");
    			add_location(a1, file$n, 136, 33, 4464);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, i0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, i1);

    			if (!mounted) {
    				dispose = action_destroyer(link_action = link.call(null, a1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*usuarios*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/perfil/${/*usuario*/ ctx[9].id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(a1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(129:28) {#if user().roles.includes('admin')}",
    		ctx
    	});

    	return block;
    }

    // (110:16) {#each usuarios as usuario}
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
    	let i;
    	let t7;
    	let show_if = user().roles.includes("admin");
    	let t8;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*usuario*/ ctx[9], ...args);
    	}

    	let if_block = show_if && create_if_block$a(ctx);

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
    			i = element("i");
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			if (img.src !== (img_src_value = "assets/img/users/user-1.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "avatar-img avatar-sm rounded-circle");
    			attr_dev(img, "alt", "");
    			add_location(img, file$n, 112, 59, 3087);
    			attr_dev(div, "class", "avatar avatar-sm ");
    			add_location(div, file$n, 112, 28, 3056);
    			add_location(td0, file$n, 111, 24, 3022);
    			add_location(td1, file$n, 114, 24, 3240);
    			add_location(td2, file$n, 115, 24, 3310);
    			attr_dev(i, "class", "mdi mdi-security");
    			add_location(i, file$n, 126, 32, 3925);
    			attr_dev(button, "href", "#!");
    			attr_dev(button, "class", "btn btn-outline-secondary");
    			attr_dev(button, "data-tooltip", "Roles");
    			attr_dev(button, "data-toggle", "modal");
    			attr_dev(button, "data-target", "#modalRoles");
    			add_location(button, file$n, 118, 28, 3489);
    			attr_dev(td3, "class", "text-right");
    			add_location(td3, file$n, 116, 24, 3361);
    			add_location(tr, file$n, 110, 20, 2992);
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
    			append_dev(button, i);
    			append_dev(td3, t7);
    			if (if_block) if_block.m(td3, null);
    			append_dev(tr, t8);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*usuarios*/ 1 && t1_value !== (t1_value = /*usuario*/ ctx[9].nombre + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*usuarios*/ 1 && t3_value !== (t3_value = /*usuario*/ ctx[9].apellido + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*usuarios*/ 1 && t5_value !== (t5_value = /*usuario*/ ctx[9].correo + "")) set_data_dev(t5, t5_value);
    			if (show_if) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(110:16) {#each usuarios as usuario}",
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
    	let modalrolesusuario;
    	let updating_usuario;
    	let updating_roles;
    	let t2;
    	let section;
    	let div3;
    	let div0;
    	let t3;
    	let div2;
    	let h5;
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
    	let t11;
    	let tbody;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });

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
    			create_component(modalrolesusuario.$$.fragment);
    			t2 = space();
    			section = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div2 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Usuarios";
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
    			th2.textContent = "Usuario";
    			t10 = space();
    			th3 = element("th");
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			add_location(div0, file$n, 87, 6, 2227);
    			add_location(h5, file$n, 89, 8, 2299);
    			add_location(th0, file$n, 101, 20, 2734);
    			add_location(th1, file$n, 102, 20, 2765);
    			add_location(th2, file$n, 103, 20, 2802);
    			add_location(th3, file$n, 105, 20, 2842);
    			add_location(tr, file$n, 100, 16, 2708);
    			add_location(thead, file$n, 99, 16, 2683);
    			add_location(tbody, file$n, 108, 16, 2918);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$n, 98, 12, 2617);
    			attr_dev(div1, "class", "table-responsive");
    			add_location(div1, file$n, 97, 8, 2573);
    			attr_dev(div2, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div2, file$n, 88, 6, 2254);
    			attr_dev(div3, "class", "p-2");
    			add_location(div3, file$n, 86, 4, 2202);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$n, 85, 2, 2165);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$n, 78, 0, 2004);
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
    			mount_component(modalrolesusuario, main, null);
    			append_dev(main, t2);
    			append_dev(main, section);
    			append_dev(section, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
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
    			append_dev(table, t11);
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

    			if (dirty & /*usuarios, user, cargarUsuarioSeleccionado*/ 9) {
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
    			transition_in(modalrolesusuario.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aside.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(modalrolesusuario.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aside, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
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
    		user,
    		axios: axios$1,
    		Header,
    		Aside,
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
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (69:2) {#if errorServer}
    function create_if_block_2$5(ctx) {
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
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(69:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (108:20) {#if historia.activo}
    function create_if_block_1$6(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let span;
    	let t0_value = /*historia*/ ctx[8].paciente.nombres[0] + "";
    	let t0;
    	let t1_value = /*historia*/ ctx[8].paciente.apellidos[0] + "";
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*historia*/ ctx[8].paciente.nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*historia*/ ctx[8].paciente.apellidos + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = /*historia*/ ctx[8].paciente.cedula + "";
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = calcularEdad(/*historia*/ ctx[8].paciente.fechaNacimiento) + "";
    	let t9;
    	let t10;
    	let t11;
    	let td4;
    	let t12_value = /*historia*/ ctx[8].paciente.sexo + "";
    	let t12;
    	let t13;
    	let td5;
    	let t14_value = new Date(/*historia*/ ctx[8].fechaHora).toLocaleDateString("es-DO") + "";
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
    			add_location(span, file$o, 111, 32, 3479);
    			attr_dev(div, "class", "avatar avatar-sm");
    			add_location(div, file$o, 110, 28, 3415);
    			add_location(td0, file$o, 109, 24, 3381);
    			add_location(td1, file$o, 114, 24, 3684);
    			add_location(td2, file$o, 115, 24, 3776);
    			add_location(td3, file$o, 116, 24, 3837);
    			add_location(td4, file$o, 117, 24, 3926);
    			add_location(td5, file$o, 118, 24, 3985);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$o, 126, 32, 4437);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$o, 121, 28, 4206);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$o, 134, 32, 4858);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/${/*historia*/ ctx[8].paciente.id}/historias/${/*historia*/ ctx[8].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Ver");
    			add_location(a1, file$o, 128, 28, 4530);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$o, 119, 24, 4078);
    			add_location(tr, file$o, 108, 20, 3351);
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
    			if (dirty & /*historias*/ 1 && t0_value !== (t0_value = /*historia*/ ctx[8].paciente.nombres[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*historias*/ 1 && t1_value !== (t1_value = /*historia*/ ctx[8].paciente.apellidos[0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*historias*/ 1 && t3_value !== (t3_value = /*historia*/ ctx[8].paciente.nombres + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*historias*/ 1 && t5_value !== (t5_value = /*historia*/ ctx[8].paciente.apellidos + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*historias*/ 1 && t7_value !== (t7_value = /*historia*/ ctx[8].paciente.cedula + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*historias*/ 1 && t9_value !== (t9_value = calcularEdad(/*historia*/ ctx[8].paciente.fechaNacimiento) + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*historias*/ 1 && t12_value !== (t12_value = /*historia*/ ctx[8].paciente.sexo + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*historias*/ 1 && t14_value !== (t14_value = new Date(/*historia*/ ctx[8].fechaHora).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*historias*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/${/*historia*/ ctx[8].paciente.id}/historias/${/*historia*/ ctx[8].id}`)) {
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
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(108:20) {#if historia.activo}",
    		ctx
    	});

    	return block;
    }

    // (107:16) {#each historias as historia}
    function create_each_block$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*historia*/ ctx[8].activo && create_if_block_1$6(ctx);

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
    			if (/*historia*/ ctx[8].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$6(ctx);
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
    		source: "(107:16) {#each historias as historia}",
    		ctx
    	});

    	return block;
    }

    // (146:8) {#if cargando}
    function create_if_block$b(ctx) {
    	let div1;
    	let div0;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$o, 148, 21, 5277);
    			attr_dev(div0, "class", "spinner-border text-secondary");
    			attr_dev(div0, "role", "status");
    			add_location(div0, file$o, 147, 17, 5197);
    			attr_dev(div1, "class", "text-center");
    			add_location(div1, file$o, 146, 13, 5153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(146:8) {#if cargando}",
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
    	let t21;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[1] && create_if_block_2$5(ctx);
    	let each_value = /*historias*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	let if_block1 = /*cargando*/ ctx[3] && create_if_block$b(ctx);

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

    			t21 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$o, 75, 6, 2010);
    			add_location(h5, file$o, 77, 8, 2082);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$o, 84, 32, 2406);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$o, 85, 32, 2484);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$o, 83, 28, 2348);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$o, 82, 24, 2296);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$o, 81, 20, 2253);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$o, 80, 16, 2211);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$o, 79, 8, 2176);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$o, 78, 8, 2118);
    			add_location(th0, file$o, 96, 20, 2945);
    			add_location(th1, file$o, 97, 20, 2976);
    			add_location(th2, file$o, 98, 20, 3013);
    			add_location(th3, file$o, 99, 20, 3050);
    			add_location(th4, file$o, 100, 20, 3085);
    			add_location(th5, file$o, 101, 20, 3120);
    			add_location(th6, file$o, 102, 20, 3156);
    			add_location(tr, file$o, 95, 16, 2919);
    			add_location(thead, file$o, 94, 16, 2894);
    			add_location(tbody, file$o, 105, 16, 3232);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$o, 93, 12, 2828);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$o, 92, 8, 2784);
    			attr_dev(div8, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div8, file$o, 76, 6, 2037);
    			attr_dev(div9, "class", "p-2");
    			add_location(div9, file$o, 74, 4, 1985);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$o, 73, 2, 1948);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$o, 66, 0, 1726);
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

    			append_dev(div8, t21);
    			if (if_block1) if_block1.m(div8, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*searchHistorias*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorServer*/ ctx[1]) {
    				if (if_block0) {
    					if (dirty & /*errorServer*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$5(ctx);
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

    			if (/*cargando*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$b(ctx);
    					if_block1.c();
    					if_block1.m(div8, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
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
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
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
    	let cargando = false;

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
    		$$invalidate(3, cargando = true);

    		const config = {
    			method: "get",
    			url: `${url}/historias?b=${sltBuscarHistorias}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		try {
    			axios$1(config).then(res => {
    				$$invalidate(3, cargando = false);

    				if (res.status === 200) {
    					let { data } = res;
    					$$invalidate(0, historias = data);
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
    			$$invalidate(3, cargando = false);

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
    		cargando,
    		searchHistorias,
    		cargarHistorias
    	});

    	$$self.$inject_state = $$props => {
    		if ("historias" in $$props) $$invalidate(0, historias = $$props.historias);
    		if ("errorServer" in $$props) $$invalidate(1, errorServer = $$props.errorServer);
    		if ("sltBuscarHistorias" in $$props) $$invalidate(2, sltBuscarHistorias = $$props.sltBuscarHistorias);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("cargando" in $$props) $$invalidate(3, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		historias,
    		errorServer,
    		sltBuscarHistorias,
    		cargando,
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
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (100:4) {#if errorServer}
    function create_if_block$c(ctx) {
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
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(100:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (181:40) {#each medicamentos as medicamento}
    function create_each_block$9(ctx) {
    	let tr;
    	let td0;
    	let p0;
    	let t0_value = /*medicamento*/ ctx[11].nombre + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3_value = /*medicamento*/ ctx[11].concentracion + "";
    	let t3;
    	let t4;
    	let td1;
    	let t5_value = /*medicamento*/ ctx[11].cantidad + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = /*medicamento*/ ctx[11].frecuencia + "";
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
    			add_location(p0, file$p, 183, 52, 7081);
    			attr_dev(p1, "class", "text-muted");
    			set_style(p1, "padding-bottom", "0");
    			set_style(p1, "margin-bottom", "0");
    			add_location(p1, file$p, 184, 52, 7185);
    			attr_dev(td0, "class", " svelte-4yikmq");
    			add_location(td0, file$p, 182, 48, 7014);
    			attr_dev(td1, "class", "text-center svelte-4yikmq");
    			add_location(td1, file$p, 188, 48, 7503);
    			attr_dev(td2, "class", "text-center svelte-4yikmq");
    			add_location(td2, file$p, 189, 48, 7604);
    			add_location(tr, file$p, 181, 44, 6960);
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
    			if (dirty & /*medicamentos*/ 8 && t0_value !== (t0_value = /*medicamento*/ ctx[11].nombre + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*medicamentos*/ 8 && t3_value !== (t3_value = /*medicamento*/ ctx[11].concentracion + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*medicamentos*/ 8 && t5_value !== (t5_value = /*medicamento*/ ctx[11].cantidad + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*medicamentos*/ 8 && t7_value !== (t7_value = /*medicamento*/ ctx[11].frecuencia + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(181:40) {#each medicamentos as medicamento}",
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
    	let div16;
    	let div12;
    	let t39;
    	let div15;
    	let h5;
    	let t40_value = /*paciente*/ ctx[0].nombres + "";
    	let t40;
    	let t41;
    	let t42_value = /*paciente*/ ctx[0].apellidos + "";
    	let t42;
    	let t43;
    	let div13;
    	let t44;
    	let t45_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "";
    	let t45;
    	let t46;
    	let t47;
    	let div14;
    	let t50;
    	let div17;
    	let hr0;
    	let t51;
    	let p1;
    	let t53;
    	let div19;
    	let hr1;
    	let t54;
    	let div18;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block = /*errorServer*/ ctx[5] && create_if_block$c(ctx);
    	let each_value = /*medicamentos*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
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
    			div16 = element("div");
    			div12 = element("div");
    			t39 = space();
    			div15 = element("div");
    			h5 = element("h5");
    			t40 = text(t40_value);
    			t41 = space();
    			t42 = text(t42_value);
    			t43 = space();
    			div13 = element("div");
    			t44 = text("Edad: ");
    			t45 = text(t45_value);
    			t46 = text(" años");
    			t47 = space();
    			div14 = element("div");
    			div14.textContent = `Fecha: ${new Date().toLocaleDateString("es-DO")}`;
    			t50 = space();
    			div17 = element("div");
    			hr0 = element("hr");
    			t51 = space();
    			p1 = element("p");
    			p1.textContent = "Firma del especialista";
    			t53 = space();
    			div19 = element("div");
    			hr1 = element("hr");
    			t54 = space();
    			div18 = element("div");
    			div18.textContent = `© nextcom ${new Date().getFullYear()}`;
    			attr_dev(div0, "class", "avatar-title bg-success rounded-circle mdi mdi-receipt  ");
    			add_location(div0, file$p, 110, 32, 3219);
    			attr_dev(div1, "class", "avatar avatar mr-3");
    			add_location(div1, file$p, 109, 28, 3153);
    			attr_dev(div2, "class", "opacity-75");
    			add_location(div2, file$p, 115, 32, 3455);
    			attr_dev(h4, "class", "m-b-0");
    			add_location(h4, file$p, 116, 32, 3524);
    			add_location(br0, file$p, 118, 63, 3708);
    			attr_dev(p0, "class", "opacity-75");
    			add_location(p0, file$p, 117, 32, 3621);
    			attr_dev(i, "class", "mdi\r\n                                mdi-printer");
    			add_location(i, file$p, 121, 89, 3954);
    			attr_dev(button, "class", "btn btn-white-translucent");
    			attr_dev(button, "id", "printDiv");
    			add_location(button, file$p, 121, 32, 3897);
    			attr_dev(div3, "class", "media-body");
    			add_location(div3, file$p, 114, 28, 3397);
    			attr_dev(div4, "class", "media");
    			add_location(div4, file$p, 108, 24, 3104);
    			attr_dev(div5, "class", "col-md-6 text-white p-b-30");
    			add_location(div5, file$p, 107, 20, 3038);
    			attr_dev(div6, "class", "row p-b-60 p-t-60");
    			add_location(div6, file$p, 105, 16, 2983);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$p, 104, 12, 2942);
    			attr_dev(div8, "class", "bg-dark m-b-30");
    			add_location(div8, file$p, 103, 8, 2900);
    			if (img.src !== (img_src_value = /*logo*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "150");
    			attr_dev(img, "alt", "");
    			add_location(img, file$p, 158, 40, 5661);
    			attr_dev(span, "class", "h4 font-primary");
    			add_location(span, file$p, 160, 44, 5808);
    			add_location(br1, file$p, 160, 100, 5864);
    			add_location(br2, file$p, 161, 64, 5934);
    			add_location(br3, file$p, 162, 69, 6009);
    			add_location(br4, file$p, 163, 61, 6076);
    			attr_dev(address, "class", "m-t-10");
    			add_location(address, file$p, 159, 40, 5738);
    			attr_dev(div9, "class", "col-md-6");
    			add_location(div9, file$p, 157, 36, 5597);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$p, 156, 32, 5542);
    			attr_dev(th0, "class", "");
    			add_location(th0, file$p, 174, 44, 6494);
    			attr_dev(th1, "class", "text-center");
    			add_location(th1, file$p, 175, 44, 6569);
    			attr_dev(th2, "class", "text-center");
    			add_location(th2, file$p, 176, 44, 6652);
    			add_location(tr, file$p, 173, 40, 6444);
    			add_location(thead, file$p, 172, 40, 6395);
    			add_location(tbody, file$p, 179, 40, 6830);
    			attr_dev(table, "class", "table m-t-50");
    			add_location(table, file$p, 171, 36, 6325);
    			attr_dev(div11, "class", "table-responsive ");
    			add_location(div11, file$p, 170, 32, 6256);
    			attr_dev(div12, "class", "col-md-6");
    			add_location(div12, file$p, 196, 36, 7982);
    			attr_dev(h5, "class", "font-primary");
    			add_location(h5, file$p, 200, 40, 8171);
    			attr_dev(div13, "class", "");
    			add_location(div13, file$p, 201, 40, 8282);
    			attr_dev(div14, "class", "");
    			add_location(div14, file$p, 202, 40, 8395);
    			attr_dev(div15, "class", "col-md-6 text-right my-auto");
    			add_location(div15, file$p, 199, 36, 8088);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$p, 195, 32, 7927);
    			add_location(hr0, file$p, 206, 36, 8637);
    			add_location(p1, file$p, 207, 36, 8679);
    			attr_dev(div17, "class", "firma svelte-4yikmq");
    			add_location(div17, file$p, 205, 32, 8580);
    			add_location(hr1, file$p, 211, 36, 8849);
    			attr_dev(div18, "class", "text-center opacity-75");
    			add_location(div18, file$p, 212, 36, 8891);
    			attr_dev(div19, "class", "p-t-10 p-b-20");
    			add_location(div19, file$p, 209, 32, 8782);
    			attr_dev(div20, "class", "card-body");
    			add_location(div20, file$p, 155, 28, 5485);
    			attr_dev(div21, "class", "card");
    			add_location(div21, file$p, 154, 24, 5437);
    			attr_dev(div22, "class", "col-md-12 m-b-40");
    			add_location(div22, file$p, 153, 20, 5381);
    			attr_dev(div23, "class", "row");
    			add_location(div23, file$p, 152, 16, 5342);
    			attr_dev(div24, "class", "container");
    			attr_dev(div24, "id", "printableArea");
    			add_location(div24, file$p, 151, 12, 5282);
    			attr_dev(div25, "class", "pull-up");
    			add_location(div25, file$p, 150, 8, 5247);
    			attr_dev(section, "class", "admin-content ");
    			add_location(section, file$p, 102, 4, 2858);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$p, 97, 2, 2731);
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

    			append_dev(div20, t38);
    			append_dev(div20, div16);
    			append_dev(div16, div12);
    			append_dev(div16, t39);
    			append_dev(div16, div15);
    			append_dev(div15, h5);
    			append_dev(h5, t40);
    			append_dev(h5, t41);
    			append_dev(h5, t42);
    			append_dev(div15, t43);
    			append_dev(div15, div13);
    			append_dev(div13, t44);
    			append_dev(div13, t45);
    			append_dev(div13, t46);
    			append_dev(div15, t47);
    			append_dev(div15, div14);
    			append_dev(div20, t50);
    			append_dev(div20, div17);
    			append_dev(div17, hr0);
    			append_dev(div17, t51);
    			append_dev(div17, p1);
    			append_dev(div20, t53);
    			append_dev(div20, div19);
    			append_dev(div19, hr1);
    			append_dev(div19, t54);
    			append_dev(div19, div18);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*paciente*/ 1) && t6_value !== (t6_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*paciente*/ 1) && t8_value !== (t8_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*historia*/ 2) && t11_value !== (t11_value = /*historia*/ ctx[1].id + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*historia*/ 2) && t14_value !== (t14_value = new Date(/*historia*/ ctx[1].createdAt).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (!current || dirty & /*logo*/ 16 && img.src !== (img_src_value = /*logo*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

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

    			if ((!current || dirty & /*paciente*/ 1) && t40_value !== (t40_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t40, t40_value);
    			if ((!current || dirty & /*paciente*/ 1) && t42_value !== (t42_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t42, t42_value);
    			if ((!current || dirty & /*paciente*/ 1) && t45_value !== (t45_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "")) set_data_dev(t45, t45_value);
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
    	let logo = "";

    	const cargarImagenEmpresa = (idConsultorio, idImagen) => {
    		const config = {
    			method: "get",
    			url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
    			responseType: "blob",
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, logo = URL.createObjectURL(res.data));
    			console.log(logo);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

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
    			cargarImagenEmpresa(empresa.id, empresa.logo);
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
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
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
    		logo,
    		cargarImagenEmpresa,
    		cargarPaciente,
    		cargarHistoria,
    		cargarEmpresa
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("errorServer" in $$props) $$invalidate(5, errorServer = $$props.errorServer);
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("empresa" in $$props) $$invalidate(2, empresa = $$props.empresa);
    		if ("medicamentos" in $$props) $$invalidate(3, medicamentos = $$props.medicamentos);
    		if ("logo" in $$props) $$invalidate(4, logo = $$props.logo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paciente, historia, empresa, medicamentos, logo, errorServer, params];
    }

    class Medicamentos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Medicamentos",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
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

    /* src\Pages\Recetas\Estudios.svelte generated by Svelte v3.29.0 */

    const { console: console_1$b } = globals;
    const file$q = "src\\Pages\\Recetas\\Estudios.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (100:4) {#if errorServer}
    function create_if_block_2$6(ctx) {
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
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(100:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (177:43) {#if estudio.tipo === 'LAB'}
    function create_if_block_1$7(ctx) {
    	let div;
    	let t0_value = /*estudio*/ ctx[11].descripcion + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "col-lg-3 mb-3 estudio svelte-rr7nr8");
    			add_location(div, file$q, 177, 47, 6770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*estudios*/ 8 && t0_value !== (t0_value = /*estudio*/ ctx[11].descripcion + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(177:43) {#if estudio.tipo === 'LAB'}",
    		ctx
    	});

    	return block;
    }

    // (176:39) {#each estudios as estudio}
    function create_each_block$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*estudio*/ ctx[11].tipo === "LAB" && create_if_block_1$7(ctx);

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
    			if (/*estudio*/ ctx[11].tipo === "LAB") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$7(ctx);
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
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(176:39) {#each estudios as estudio}",
    		ctx
    	});

    	return block;
    }

    // (185:32) {#if historia.instrucciones}
    function create_if_block$d(ctx) {
    	let div1;
    	let div0;
    	let strong;
    	let t1;
    	let t2_value = /*historia*/ ctx[1].instrucciones + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			strong = element("strong");
    			strong.textContent = "Observaciones:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$q, 186, 41, 7280);
    			add_location(div0, file$q, 186, 36, 7275);
    			attr_dev(div1, "class", "bg-light pie svelte-rr7nr8");
    			add_location(div1, file$q, 185, 32, 7211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, strong);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*historia*/ 2 && t2_value !== (t2_value = /*historia*/ ctx[1].instrucciones + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(185:32) {#if historia.instrucciones}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
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
    	let div28;
    	let div27;
    	let div26;
    	let div25;
    	let div24;
    	let div23;
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
    	let div12;
    	let div11;
    	let t33;
    	let hr0;
    	let t34;
    	let div14;
    	let div13;
    	let t35;
    	let t36;
    	let div19;
    	let div15;
    	let t37;
    	let div18;
    	let h5;
    	let t38_value = /*paciente*/ ctx[0].nombres + "";
    	let t38;
    	let t39;
    	let t40_value = /*paciente*/ ctx[0].apellidos + "";
    	let t40;
    	let t41;
    	let div16;
    	let t42;
    	let t43_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "";
    	let t43;
    	let t44;
    	let t45;
    	let div17;
    	let t48;
    	let div20;
    	let hr1;
    	let t49;
    	let p1;
    	let t51;
    	let div22;
    	let hr2;
    	let t52;
    	let div21;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[5] && create_if_block_2$6(ctx);
    	let each_value = /*estudios*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
    	}

    	let if_block1 = /*historia*/ ctx[1].instrucciones && create_if_block$d(ctx);

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
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
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
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Estudios de laboratorios";
    			t33 = space();
    			hr0 = element("hr");
    			t34 = space();
    			div14 = element("div");
    			div13 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t35 = space();
    			if (if_block1) if_block1.c();
    			t36 = space();
    			div19 = element("div");
    			div15 = element("div");
    			t37 = space();
    			div18 = element("div");
    			h5 = element("h5");
    			t38 = text(t38_value);
    			t39 = space();
    			t40 = text(t40_value);
    			t41 = space();
    			div16 = element("div");
    			t42 = text("Edad: ");
    			t43 = text(t43_value);
    			t44 = text(" años");
    			t45 = space();
    			div17 = element("div");
    			div17.textContent = `Fecha: ${new Date().toLocaleDateString("es-DO")}`;
    			t48 = space();
    			div20 = element("div");
    			hr1 = element("hr");
    			t49 = space();
    			p1 = element("p");
    			p1.textContent = "Firma del especialista";
    			t51 = space();
    			div22 = element("div");
    			hr2 = element("hr");
    			t52 = space();
    			div21 = element("div");
    			div21.textContent = `© nextcom ${new Date().getFullYear()}`;
    			attr_dev(div0, "class", "avatar-title bg-success rounded-circle mdi mdi-receipt  ");
    			add_location(div0, file$q, 110, 32, 3207);
    			attr_dev(div1, "class", "avatar avatar mr-3");
    			add_location(div1, file$q, 109, 28, 3141);
    			attr_dev(div2, "class", "opacity-75");
    			add_location(div2, file$q, 115, 32, 3443);
    			attr_dev(h4, "class", "m-b-0");
    			add_location(h4, file$q, 116, 32, 3512);
    			add_location(br0, file$q, 118, 63, 3696);
    			attr_dev(p0, "class", "opacity-75");
    			add_location(p0, file$q, 117, 32, 3609);
    			attr_dev(i, "class", "mdi\r\n                                mdi-printer");
    			add_location(i, file$q, 121, 89, 3942);
    			attr_dev(button, "class", "btn btn-white-translucent");
    			attr_dev(button, "id", "printDiv");
    			add_location(button, file$q, 121, 32, 3885);
    			attr_dev(div3, "class", "media-body");
    			add_location(div3, file$q, 114, 28, 3385);
    			attr_dev(div4, "class", "media");
    			add_location(div4, file$q, 108, 24, 3092);
    			attr_dev(div5, "class", "col-md-6 text-white p-b-30");
    			add_location(div5, file$q, 107, 20, 3026);
    			attr_dev(div6, "class", "row p-b-60 p-t-60");
    			add_location(div6, file$q, 105, 16, 2971);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$q, 104, 12, 2930);
    			attr_dev(div8, "class", "bg-dark m-b-30");
    			add_location(div8, file$q, 103, 8, 2888);
    			if (img.src !== (img_src_value = /*logo*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "150");
    			attr_dev(img, "alt", "");
    			add_location(img, file$q, 158, 40, 5649);
    			attr_dev(span, "class", "h4 font-primary");
    			add_location(span, file$q, 160, 44, 5796);
    			add_location(br1, file$q, 160, 100, 5852);
    			add_location(br2, file$q, 161, 64, 5922);
    			add_location(br3, file$q, 162, 69, 5997);
    			add_location(br4, file$q, 163, 61, 6064);
    			attr_dev(address, "class", "m-t-10");
    			add_location(address, file$q, 159, 40, 5726);
    			attr_dev(div9, "class", "col-md-6");
    			add_location(div9, file$q, 157, 36, 5585);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$q, 156, 32, 5530);
    			add_location(div11, file$q, 170, 36, 6311);
    			attr_dev(div12, "class", "bg-light cabecera svelte-rr7nr8");
    			add_location(div12, file$q, 169, 32, 6242);
    			set_style(hr0, "margin", "0");
    			add_location(hr0, file$q, 172, 32, 6420);
    			attr_dev(div13, "class", "row mt-3 mb-3 contenedor-estudios svelte-rr7nr8");
    			add_location(div13, file$q, 174, 35, 6533);
    			attr_dev(div14, "class", "col-12");
    			add_location(div14, file$q, 173, 32, 6476);
    			attr_dev(div15, "class", "col-md-6");
    			add_location(div15, file$q, 191, 36, 7512);
    			attr_dev(h5, "class", "font-primary");
    			add_location(h5, file$q, 195, 40, 7701);
    			attr_dev(div16, "class", "");
    			add_location(div16, file$q, 196, 40, 7812);
    			attr_dev(div17, "class", "");
    			add_location(div17, file$q, 197, 40, 7925);
    			attr_dev(div18, "class", "col-md-6 text-right my-auto");
    			add_location(div18, file$q, 194, 36, 7618);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$q, 190, 32, 7457);
    			add_location(hr1, file$q, 201, 36, 8167);
    			add_location(p1, file$q, 202, 36, 8209);
    			attr_dev(div20, "class", "firma svelte-rr7nr8");
    			add_location(div20, file$q, 200, 32, 8110);
    			add_location(hr2, file$q, 206, 36, 8379);
    			attr_dev(div21, "class", "text-center opacity-75");
    			add_location(div21, file$q, 207, 36, 8421);
    			attr_dev(div22, "class", "p-t-10 p-b-20");
    			add_location(div22, file$q, 204, 32, 8312);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file$q, 155, 28, 5473);
    			attr_dev(div24, "class", "card");
    			add_location(div24, file$q, 154, 24, 5425);
    			attr_dev(div25, "class", "col-md-12 m-b-40");
    			add_location(div25, file$q, 153, 20, 5369);
    			attr_dev(div26, "class", "row");
    			add_location(div26, file$q, 152, 16, 5330);
    			attr_dev(div27, "class", "container");
    			attr_dev(div27, "id", "printableArea");
    			add_location(div27, file$q, 151, 12, 5270);
    			attr_dev(div28, "class", "pull-up");
    			add_location(div28, file$q, 150, 8, 5235);
    			attr_dev(section, "class", "admin-content ");
    			add_location(section, file$q, 102, 4, 2846);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$q, 97, 2, 2719);
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
    			append_dev(section, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div10);
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
    			append_dev(div23, t31);
    			append_dev(div23, div12);
    			append_dev(div12, div11);
    			append_dev(div23, t33);
    			append_dev(div23, hr0);
    			append_dev(div23, t34);
    			append_dev(div23, div14);
    			append_dev(div14, div13);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div13, null);
    			}

    			append_dev(div23, t35);
    			if (if_block1) if_block1.m(div23, null);
    			append_dev(div23, t36);
    			append_dev(div23, div19);
    			append_dev(div19, div15);
    			append_dev(div19, t37);
    			append_dev(div19, div18);
    			append_dev(div18, h5);
    			append_dev(h5, t38);
    			append_dev(h5, t39);
    			append_dev(h5, t40);
    			append_dev(div18, t41);
    			append_dev(div18, div16);
    			append_dev(div16, t42);
    			append_dev(div16, t43);
    			append_dev(div16, t44);
    			append_dev(div18, t45);
    			append_dev(div18, div17);
    			append_dev(div23, t48);
    			append_dev(div23, div20);
    			append_dev(div20, hr1);
    			append_dev(div20, t49);
    			append_dev(div20, p1);
    			append_dev(div23, t51);
    			append_dev(div23, div22);
    			append_dev(div22, hr2);
    			append_dev(div22, t52);
    			append_dev(div22, div21);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*paciente*/ 1) && t6_value !== (t6_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*paciente*/ 1) && t8_value !== (t8_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*historia*/ 2) && t11_value !== (t11_value = /*historia*/ ctx[1].id + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*historia*/ 2) && t14_value !== (t14_value = new Date(/*historia*/ ctx[1].createdAt).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (!current || dirty & /*logo*/ 16 && img.src !== (img_src_value = /*logo*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*empresa*/ 4) && t19_value !== (t19_value = /*empresa*/ ctx[2].nombre + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty & /*empresa*/ 4) && t23_value !== (t23_value = /*empresa*/ ctx[2].direccion + "")) set_data_dev(t23, t23_value);
    			if ((!current || dirty & /*empresa*/ 4) && t26_value !== (t26_value = /*empresa*/ ctx[2].telefono + "")) set_data_dev(t26, t26_value);
    			if ((!current || dirty & /*empresa*/ 4) && t29_value !== (t29_value = /*empresa*/ ctx[2].correo + "")) set_data_dev(t29, t29_value);

    			if (dirty & /*estudios*/ 8) {
    				each_value = /*estudios*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div13, null);
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
    					if_block1 = create_if_block$d(ctx);
    					if_block1.c();
    					if_block1.m(div23, t36);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty & /*paciente*/ 1) && t38_value !== (t38_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t38, t38_value);
    			if ((!current || dirty & /*paciente*/ 1) && t40_value !== (t40_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t40, t40_value);
    			if ((!current || dirty & /*paciente*/ 1) && t43_value !== (t43_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "")) set_data_dev(t43, t43_value);
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Estudios", slots, []);
    	let { params } = $$props;
    	let errorServer = false;
    	let paciente = {};
    	let historia = {};
    	let empresa = {};
    	let estudios = [];
    	let logo = "";

    	const cargarImagenEmpresa = (idConsultorio, idImagen) => {
    		const config = {
    			method: "get",
    			url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
    			responseType: "blob",
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, logo = URL.createObjectURL(res.data));
    			console.log(logo);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

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
    			$$invalidate(3, estudios = res.data.estudios);
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
    			cargarImagenEmpresa(empresa.id, empresa.logo);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$b.warn(`<Estudios> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
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
    		estudios,
    		logo,
    		cargarImagenEmpresa,
    		cargarPaciente,
    		cargarHistoria,
    		cargarEmpresa
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("errorServer" in $$props) $$invalidate(5, errorServer = $$props.errorServer);
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("empresa" in $$props) $$invalidate(2, empresa = $$props.empresa);
    		if ("estudios" in $$props) $$invalidate(3, estudios = $$props.estudios);
    		if ("logo" in $$props) $$invalidate(4, logo = $$props.logo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paciente, historia, empresa, estudios, logo, errorServer, params];
    }

    class Estudios extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Estudios",
    			options,
    			id: create_fragment$s.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console_1$b.warn("<Estudios> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Estudios>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Estudios>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Recetas\Imagenes.svelte generated by Svelte v3.29.0 */

    const { console: console_1$c } = globals;
    const file$r = "src\\Pages\\Recetas\\Imagenes.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (100:4) {#if errorServer}
    function create_if_block_2$7(ctx) {
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
    		id: create_if_block_2$7.name,
    		type: "if",
    		source: "(100:4) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (177:43) {#if estudio.tipo === 'IMG'}
    function create_if_block_1$8(ctx) {
    	let div;
    	let t0_value = /*estudio*/ ctx[11].descripcion + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "col-lg-3 mb-3 estudio svelte-rr7nr8");
    			add_location(div, file$r, 177, 47, 6766);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*estudios*/ 8 && t0_value !== (t0_value = /*estudio*/ ctx[11].descripcion + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(177:43) {#if estudio.tipo === 'IMG'}",
    		ctx
    	});

    	return block;
    }

    // (176:39) {#each estudios as estudio}
    function create_each_block$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*estudio*/ ctx[11].tipo === "IMG" && create_if_block_1$8(ctx);

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
    			if (/*estudio*/ ctx[11].tipo === "IMG") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$8(ctx);
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
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(176:39) {#each estudios as estudio}",
    		ctx
    	});

    	return block;
    }

    // (185:32) {#if historia.instrucciones}
    function create_if_block$e(ctx) {
    	let div1;
    	let div0;
    	let strong;
    	let t1;
    	let t2_value = /*historia*/ ctx[1].instrucciones + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			strong = element("strong");
    			strong.textContent = "Observaciones:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$r, 186, 41, 7276);
    			add_location(div0, file$r, 186, 36, 7271);
    			attr_dev(div1, "class", "bg-light pie svelte-rr7nr8");
    			add_location(div1, file$r, 185, 32, 7207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, strong);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*historia*/ 2 && t2_value !== (t2_value = /*historia*/ ctx[1].instrucciones + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(185:32) {#if historia.instrucciones}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
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
    	let div28;
    	let div27;
    	let div26;
    	let div25;
    	let div24;
    	let div23;
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
    	let div12;
    	let div11;
    	let t33;
    	let hr0;
    	let t34;
    	let div14;
    	let div13;
    	let t35;
    	let t36;
    	let div19;
    	let div15;
    	let t37;
    	let div18;
    	let h5;
    	let t38_value = /*paciente*/ ctx[0].nombres + "";
    	let t38;
    	let t39;
    	let t40_value = /*paciente*/ ctx[0].apellidos + "";
    	let t40;
    	let t41;
    	let div16;
    	let t42;
    	let t43_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "";
    	let t43;
    	let t44;
    	let t45;
    	let div17;
    	let t48;
    	let div20;
    	let hr1;
    	let t49;
    	let p1;
    	let t51;
    	let div22;
    	let hr2;
    	let t52;
    	let div21;
    	let current;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[5] && create_if_block_2$7(ctx);
    	let each_value = /*estudios*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
    	}

    	let if_block1 = /*historia*/ ctx[1].instrucciones && create_if_block$e(ctx);

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
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
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
    			div12 = element("div");
    			div11 = element("div");
    			div11.textContent = "Estudios de imagenes";
    			t33 = space();
    			hr0 = element("hr");
    			t34 = space();
    			div14 = element("div");
    			div13 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t35 = space();
    			if (if_block1) if_block1.c();
    			t36 = space();
    			div19 = element("div");
    			div15 = element("div");
    			t37 = space();
    			div18 = element("div");
    			h5 = element("h5");
    			t38 = text(t38_value);
    			t39 = space();
    			t40 = text(t40_value);
    			t41 = space();
    			div16 = element("div");
    			t42 = text("Edad: ");
    			t43 = text(t43_value);
    			t44 = text(" años");
    			t45 = space();
    			div17 = element("div");
    			div17.textContent = `Fecha: ${new Date().toLocaleDateString("es-DO")}`;
    			t48 = space();
    			div20 = element("div");
    			hr1 = element("hr");
    			t49 = space();
    			p1 = element("p");
    			p1.textContent = "Firma del especialista";
    			t51 = space();
    			div22 = element("div");
    			hr2 = element("hr");
    			t52 = space();
    			div21 = element("div");
    			div21.textContent = `© nextcom ${new Date().getFullYear()}`;
    			attr_dev(div0, "class", "avatar-title bg-success rounded-circle mdi mdi-receipt  ");
    			add_location(div0, file$r, 110, 32, 3207);
    			attr_dev(div1, "class", "avatar avatar mr-3");
    			add_location(div1, file$r, 109, 28, 3141);
    			attr_dev(div2, "class", "opacity-75");
    			add_location(div2, file$r, 115, 32, 3443);
    			attr_dev(h4, "class", "m-b-0");
    			add_location(h4, file$r, 116, 32, 3512);
    			add_location(br0, file$r, 118, 63, 3696);
    			attr_dev(p0, "class", "opacity-75");
    			add_location(p0, file$r, 117, 32, 3609);
    			attr_dev(i, "class", "mdi\r\n                                mdi-printer");
    			add_location(i, file$r, 121, 89, 3942);
    			attr_dev(button, "class", "btn btn-white-translucent");
    			attr_dev(button, "id", "printDiv");
    			add_location(button, file$r, 121, 32, 3885);
    			attr_dev(div3, "class", "media-body");
    			add_location(div3, file$r, 114, 28, 3385);
    			attr_dev(div4, "class", "media");
    			add_location(div4, file$r, 108, 24, 3092);
    			attr_dev(div5, "class", "col-md-6 text-white p-b-30");
    			add_location(div5, file$r, 107, 20, 3026);
    			attr_dev(div6, "class", "row p-b-60 p-t-60");
    			add_location(div6, file$r, 105, 16, 2971);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$r, 104, 12, 2930);
    			attr_dev(div8, "class", "bg-dark m-b-30");
    			add_location(div8, file$r, 103, 8, 2888);
    			if (img.src !== (img_src_value = /*logo*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "150");
    			attr_dev(img, "alt", "");
    			add_location(img, file$r, 158, 40, 5649);
    			attr_dev(span, "class", "h4 font-primary");
    			add_location(span, file$r, 160, 44, 5796);
    			add_location(br1, file$r, 160, 100, 5852);
    			add_location(br2, file$r, 161, 64, 5922);
    			add_location(br3, file$r, 162, 69, 5997);
    			add_location(br4, file$r, 163, 61, 6064);
    			attr_dev(address, "class", "m-t-10");
    			add_location(address, file$r, 159, 40, 5726);
    			attr_dev(div9, "class", "col-md-6");
    			add_location(div9, file$r, 157, 36, 5585);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$r, 156, 32, 5530);
    			add_location(div11, file$r, 170, 36, 6311);
    			attr_dev(div12, "class", "bg-light cabecera svelte-rr7nr8");
    			add_location(div12, file$r, 169, 32, 6242);
    			set_style(hr0, "margin", "0");
    			add_location(hr0, file$r, 172, 32, 6416);
    			attr_dev(div13, "class", "row mt-3 mb-3 contenedor-estudios svelte-rr7nr8");
    			add_location(div13, file$r, 174, 35, 6529);
    			attr_dev(div14, "class", "col-12");
    			add_location(div14, file$r, 173, 32, 6472);
    			attr_dev(div15, "class", "col-md-6");
    			add_location(div15, file$r, 191, 36, 7508);
    			attr_dev(h5, "class", "font-primary");
    			add_location(h5, file$r, 195, 40, 7697);
    			attr_dev(div16, "class", "");
    			add_location(div16, file$r, 196, 40, 7808);
    			attr_dev(div17, "class", "");
    			add_location(div17, file$r, 197, 40, 7921);
    			attr_dev(div18, "class", "col-md-6 text-right my-auto");
    			add_location(div18, file$r, 194, 36, 7614);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$r, 190, 32, 7453);
    			add_location(hr1, file$r, 201, 36, 8163);
    			add_location(p1, file$r, 202, 36, 8205);
    			attr_dev(div20, "class", "firma svelte-rr7nr8");
    			add_location(div20, file$r, 200, 32, 8106);
    			add_location(hr2, file$r, 206, 36, 8375);
    			attr_dev(div21, "class", "text-center opacity-75");
    			add_location(div21, file$r, 207, 36, 8417);
    			attr_dev(div22, "class", "p-t-10 p-b-20");
    			add_location(div22, file$r, 204, 32, 8308);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file$r, 155, 28, 5473);
    			attr_dev(div24, "class", "card");
    			add_location(div24, file$r, 154, 24, 5425);
    			attr_dev(div25, "class", "col-md-12 m-b-40");
    			add_location(div25, file$r, 153, 20, 5369);
    			attr_dev(div26, "class", "row");
    			add_location(div26, file$r, 152, 16, 5330);
    			attr_dev(div27, "class", "container");
    			attr_dev(div27, "id", "printableArea");
    			add_location(div27, file$r, 151, 12, 5270);
    			attr_dev(div28, "class", "pull-up");
    			add_location(div28, file$r, 150, 8, 5235);
    			attr_dev(section, "class", "admin-content ");
    			add_location(section, file$r, 102, 4, 2846);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$r, 97, 2, 2719);
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
    			append_dev(section, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div10);
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
    			append_dev(div23, t31);
    			append_dev(div23, div12);
    			append_dev(div12, div11);
    			append_dev(div23, t33);
    			append_dev(div23, hr0);
    			append_dev(div23, t34);
    			append_dev(div23, div14);
    			append_dev(div14, div13);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div13, null);
    			}

    			append_dev(div23, t35);
    			if (if_block1) if_block1.m(div23, null);
    			append_dev(div23, t36);
    			append_dev(div23, div19);
    			append_dev(div19, div15);
    			append_dev(div19, t37);
    			append_dev(div19, div18);
    			append_dev(div18, h5);
    			append_dev(h5, t38);
    			append_dev(h5, t39);
    			append_dev(h5, t40);
    			append_dev(div18, t41);
    			append_dev(div18, div16);
    			append_dev(div16, t42);
    			append_dev(div16, t43);
    			append_dev(div16, t44);
    			append_dev(div18, t45);
    			append_dev(div18, div17);
    			append_dev(div23, t48);
    			append_dev(div23, div20);
    			append_dev(div20, hr1);
    			append_dev(div20, t49);
    			append_dev(div20, p1);
    			append_dev(div23, t51);
    			append_dev(div23, div22);
    			append_dev(div22, hr2);
    			append_dev(div22, t52);
    			append_dev(div22, div21);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*paciente*/ 1) && t6_value !== (t6_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*paciente*/ 1) && t8_value !== (t8_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*historia*/ 2) && t11_value !== (t11_value = /*historia*/ ctx[1].id + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*historia*/ 2) && t14_value !== (t14_value = new Date(/*historia*/ ctx[1].createdAt).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (!current || dirty & /*logo*/ 16 && img.src !== (img_src_value = /*logo*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*empresa*/ 4) && t19_value !== (t19_value = /*empresa*/ ctx[2].nombre + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty & /*empresa*/ 4) && t23_value !== (t23_value = /*empresa*/ ctx[2].direccion + "")) set_data_dev(t23, t23_value);
    			if ((!current || dirty & /*empresa*/ 4) && t26_value !== (t26_value = /*empresa*/ ctx[2].telefono + "")) set_data_dev(t26, t26_value);
    			if ((!current || dirty & /*empresa*/ 4) && t29_value !== (t29_value = /*empresa*/ ctx[2].correo + "")) set_data_dev(t29, t29_value);

    			if (dirty & /*estudios*/ 8) {
    				each_value = /*estudios*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$b(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$b(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div13, null);
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
    					if_block1 = create_if_block$e(ctx);
    					if_block1.c();
    					if_block1.m(div23, t36);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty & /*paciente*/ 1) && t38_value !== (t38_value = /*paciente*/ ctx[0].nombres + "")) set_data_dev(t38, t38_value);
    			if ((!current || dirty & /*paciente*/ 1) && t40_value !== (t40_value = /*paciente*/ ctx[0].apellidos + "")) set_data_dev(t40, t40_value);
    			if ((!current || dirty & /*paciente*/ 1) && t43_value !== (t43_value = calcularEdad(/*paciente*/ ctx[0].fechaNacimiento) + "")) set_data_dev(t43, t43_value);
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Imagenes", slots, []);
    	let { params } = $$props;
    	let errorServer = false;
    	let paciente = {};
    	let historia = {};
    	let empresa = {};
    	let estudios = [];
    	let logo = "";

    	const cargarImagenEmpresa = (idConsultorio, idImagen) => {
    		const config = {
    			method: "get",
    			url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
    			responseType: "blob",
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(4, logo = URL.createObjectURL(res.data));
    			console.log(logo);
    		}).catch(err => {
    			console.error(err);
    		});
    	};

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
    			$$invalidate(3, estudios = res.data.estudios);
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
    			cargarImagenEmpresa(empresa.id, empresa.logo);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$c.warn(`<Imagenes> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
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
    		estudios,
    		logo,
    		cargarImagenEmpresa,
    		cargarPaciente,
    		cargarHistoria,
    		cargarEmpresa
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("errorServer" in $$props) $$invalidate(5, errorServer = $$props.errorServer);
    		if ("paciente" in $$props) $$invalidate(0, paciente = $$props.paciente);
    		if ("historia" in $$props) $$invalidate(1, historia = $$props.historia);
    		if ("empresa" in $$props) $$invalidate(2, empresa = $$props.empresa);
    		if ("estudios" in $$props) $$invalidate(3, estudios = $$props.estudios);
    		if ("logo" in $$props) $$invalidate(4, logo = $$props.logo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paciente, historia, empresa, estudios, logo, errorServer, params];
    }

    class Imagenes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Imagenes",
    			options,
    			id: create_fragment$t.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console_1$c.warn("<Imagenes> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Imagenes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Imagenes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Recetas\Indicaciones\Index.svelte generated by Svelte v3.29.0 */
    const file$s = "src\\Pages\\Recetas\\Indicaciones\\Index.svelte";

    // (35:2) {#if errorServer}
    function create_if_block$f(ctx) {
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
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(35:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let div10;
    	let div0;
    	let t3;
    	let div9;
    	let h5;
    	let t4;
    	let a0;
    	let i0;
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
    	let div8;
    	let table;
    	let thead;
    	let tr0;
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
    	let t19;
    	let tbody;
    	let tr1;
    	let td0;
    	let div7;
    	let span;
    	let t21;
    	let td1;
    	let t23;
    	let td2;
    	let t25;
    	let td3;
    	let t27;
    	let td4;
    	let t29;
    	let td5;
    	let a1;
    	let i1;
    	let t30;
    	let a2;
    	let i2;
    	let a2_href_value;
    	let link_action_1;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block = /*errorServer*/ ctx[1] && create_if_block$f(ctx);

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
    			div10 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div9 = element("div");
    			h5 = element("h5");
    			t4 = text("Recetas ");
    			a0 = element("a");
    			i0 = element("i");
    			t5 = text(" CREAR");
    			t6 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Buscar recetas";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div8 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			t10 = space();
    			th1 = element("th");
    			th1.textContent = "Nombre paciente";
    			t12 = space();
    			th2 = element("th");
    			th2.textContent = "Cedula";
    			t14 = space();
    			th3 = element("th");
    			th3.textContent = "Celular";
    			t16 = space();
    			th4 = element("th");
    			th4.textContent = "Tipo Indicacion";
    			t18 = space();
    			th5 = element("th");
    			t19 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			div7 = element("div");
    			span = element("span");
    			span.textContent = "VN";
    			t21 = space();
    			td1 = element("td");
    			td1.textContent = "Vladimir Nunez";
    			t23 = space();
    			td2 = element("td");
    			td2.textContent = "40223257938";
    			t25 = space();
    			td3 = element("td");
    			td3.textContent = "8498502828";
    			t27 = space();
    			td4 = element("td");
    			td4.textContent = "Medicamentos";
    			t29 = space();
    			td5 = element("td");
    			a1 = element("a");
    			i1 = element("i");
    			t30 = space();
    			a2 = element("a");
    			i2 = element("i");
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$s, 41, 6, 1032);
    			attr_dev(i0, "class", "mdi mdi-plus");
    			add_location(i0, file$s, 43, 87, 1183);
    			attr_dev(a0, "href", "/pacientes/crear");
    			attr_dev(a0, "class", "btn btn-primary btn-sm");
    			add_location(a0, file$s, 43, 20, 1116);
    			add_location(h5, file$s, 43, 8, 1104);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$s, 50, 36, 1549);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$s, 51, 36, 1629);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$s, 49, 32, 1487);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$s, 48, 28, 1431);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$s, 47, 24, 1384);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$s, 46, 20, 1338);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$s, 45, 12, 1299);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$s, 44, 8, 1237);
    			add_location(th0, file$s, 62, 20, 2120);
    			add_location(th1, file$s, 63, 20, 2151);
    			add_location(th2, file$s, 64, 20, 2197);
    			add_location(th3, file$s, 65, 20, 2234);
    			add_location(th4, file$s, 66, 20, 2272);
    			add_location(th5, file$s, 67, 20, 2318);
    			add_location(tr0, file$s, 61, 16, 2094);
    			add_location(thead, file$s, 60, 16, 2069);
    			attr_dev(span, "class", "avatar-title rounded-circle ");
    			add_location(span, file$s, 74, 32, 2551);
    			attr_dev(div7, "class", "avatar avatar-sm");
    			add_location(div7, file$s, 73, 28, 2487);
    			add_location(td0, file$s, 72, 24, 2453);
    			add_location(td1, file$s, 77, 24, 2696);
    			add_location(td2, file$s, 78, 24, 2745);
    			add_location(td3, file$s, 79, 24, 2791);
    			add_location(td4, file$s, 80, 24, 2836);
    			attr_dev(i1, "class", "mdi mdi-close");
    			add_location(i1, file$s, 88, 32, 3242);
    			attr_dev(a1, "href", "#!");
    			attr_dev(a1, "class", "btn btn-outline-danger");
    			attr_dev(a1, "data-tooltip", "Eliminar");
    			add_location(a1, file$s, 83, 28, 3011);
    			attr_dev(i2, "class", "mdi mdi-send");
    			add_location(i2, file$s, 96, 32, 3639);
    			attr_dev(a2, "href", a2_href_value = `/receta/paciente/190213892384032`);
    			attr_dev(a2, "class", "btn btn-outline-primary");
    			attr_dev(a2, "data-tooltip", "Perfil");
    			add_location(a2, file$s, 90, 28, 3335);
    			attr_dev(td5, "class", "text-right");
    			add_location(td5, file$s, 81, 24, 2883);
    			add_location(tr1, file$s, 71, 20, 2423);
    			add_location(tbody, file$s, 70, 16, 2394);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$s, 59, 12, 2003);
    			attr_dev(div8, "class", "table-responsive");
    			add_location(div8, file$s, 58, 8, 1959);
    			attr_dev(div9, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div9, file$s, 42, 6, 1059);
    			attr_dev(div10, "class", "p-2");
    			add_location(div10, file$s, 40, 4, 1007);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$s, 39, 2, 970);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$s, 32, 0, 762);
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
    			append_dev(section, div10);
    			append_dev(div10, div0);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, h5);
    			append_dev(h5, t4);
    			append_dev(h5, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t5);
    			append_dev(div9, t6);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t8);
    			append_dev(div1, input);
    			set_input_value(input, /*sltBuscarIndicaciones*/ ctx[0]);
    			append_dev(div9, t9);
    			append_dev(div9, div8);
    			append_dev(div8, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t10);
    			append_dev(tr0, th1);
    			append_dev(tr0, t12);
    			append_dev(tr0, th2);
    			append_dev(tr0, t14);
    			append_dev(tr0, th3);
    			append_dev(tr0, t16);
    			append_dev(tr0, th4);
    			append_dev(tr0, t18);
    			append_dev(tr0, th5);
    			append_dev(table, t19);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, div7);
    			append_dev(div7, span);
    			append_dev(tr1, t21);
    			append_dev(tr1, td1);
    			append_dev(tr1, t23);
    			append_dev(tr1, td2);
    			append_dev(tr1, t25);
    			append_dev(tr1, td3);
    			append_dev(tr1, t27);
    			append_dev(tr1, td4);
    			append_dev(tr1, t29);
    			append_dev(tr1, td5);
    			append_dev(td5, a1);
    			append_dev(a1, i1);
    			append_dev(td5, t30);
    			append_dev(td5, a2);
    			append_dev(a2, i2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(input, "input", /*searchIndicaciones*/ ctx[2], false, false, false),
    					action_destroyer(link_action_1 = link.call(null, a2))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sltBuscarIndicaciones*/ 1) {
    				set_input_value(input, /*sltBuscarIndicaciones*/ ctx[0]);
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let indaciones = [];
    	let errorServer = false;
    	let sltBuscarIndicaciones = "";
    	let timeout = null;

    	const searchIndicaciones = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				/*function*/ 
    			},
    			300
    		);
    	};

    	onMount(() => {
    		
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		sltBuscarIndicaciones = this.value;
    		$$invalidate(0, sltBuscarIndicaciones);
    	}

    	$$self.$capture_state = () => ({
    		link,
    		onMount,
    		url,
    		calcularEdad,
    		axios: axios$1,
    		Header,
    		Aside,
    		ErrorServer: ErrorConexion,
    		indaciones,
    		errorServer,
    		sltBuscarIndicaciones,
    		timeout,
    		searchIndicaciones
    	});

    	$$self.$inject_state = $$props => {
    		if ("indaciones" in $$props) indaciones = $$props.indaciones;
    		if ("errorServer" in $$props) $$invalidate(1, errorServer = $$props.errorServer);
    		if ("sltBuscarIndicaciones" in $$props) $$invalidate(0, sltBuscarIndicaciones = $$props.sltBuscarIndicaciones);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sltBuscarIndicaciones, errorServer, searchIndicaciones, input_input_handler];
    }

    class Index$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src\Pages\Empresa\Detalle.svelte generated by Svelte v3.29.0 */

    const { console: console_1$d } = globals;
    const file$t = "src\\Pages\\Empresa\\Detalle.svelte";

    // (146:4) {#if serverConexion}
    function create_if_block$g(ctx) {
    	let noconexion;
    	let current;
    	noconexion = new NoConexion({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(noconexion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(noconexion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(noconexion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(noconexion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(noconexion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(146:4) {#if serverConexion}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let aside;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let t2;
    	let section;
    	let button;
    	let i0;
    	let t3;
    	let div35;
    	let div34;
    	let div33;
    	let div0;
    	let h5;
    	let i1;
    	let t4;
    	let t5;
    	let div17;
    	let div16;
    	let div1;
    	let h40;
    	let t7;
    	let div15;
    	let div14;
    	let div3;
    	let img;
    	let img_src_value;
    	let t8;
    	let div2;
    	let label0;
    	let i2;
    	let t9;
    	let t10;
    	let input0;
    	let t11;
    	let div13;
    	let div12;
    	let div5;
    	let div4;
    	let label1;
    	let t13;
    	let input1;
    	let t14;
    	let div7;
    	let div6;
    	let label2;
    	let t16;
    	let input2;
    	let t17;
    	let div9;
    	let div8;
    	let label3;
    	let t19;
    	let input3;
    	let t20;
    	let div11;
    	let div10;
    	let label4;
    	let t22;
    	let input4;
    	let t23;
    	let div32;
    	let div31;
    	let div18;
    	let h41;
    	let t25;
    	let div30;
    	let div29;
    	let div28;
    	let p;
    	let t27;
    	let hr;
    	let t28;
    	let div27;
    	let div20;
    	let div19;
    	let label5;
    	let input5;
    	let t29;
    	let span0;
    	let t30;
    	let span1;
    	let t32;
    	let div22;
    	let div21;
    	let label6;
    	let input6;
    	let t33;
    	let span2;
    	let t34;
    	let span3;
    	let t36;
    	let div24;
    	let div23;
    	let label7;
    	let input7;
    	let t37;
    	let span4;
    	let t38;
    	let span5;
    	let t40;
    	let div26;
    	let div25;
    	let label8;
    	let input8;
    	let t41;
    	let span6;
    	let t42;
    	let span7;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block = /*serverConexion*/ ctx[0] && create_if_block$g(ctx);

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
    			button = element("button");
    			i0 = element("i");
    			t3 = space();
    			div35 = element("div");
    			div34 = element("div");
    			div33 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			i1 = element("i");
    			t4 = text(" Consultorio");
    			t5 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div1 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Información";
    			t7 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div3 = element("div");
    			img = element("img");
    			t8 = space();
    			div2 = element("div");
    			label0 = element("label");
    			i2 = element("i");
    			t9 = text(" Cambiar imagen");
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Nombre consultorio";
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			div7 = element("div");
    			div6 = element("div");
    			label2 = element("label");
    			label2.textContent = "Telefono";
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			div9 = element("div");
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Correo";
    			t19 = space();
    			input3 = element("input");
    			t20 = space();
    			div11 = element("div");
    			div10 = element("div");
    			label4 = element("label");
    			label4.textContent = "Direccion";
    			t22 = space();
    			input4 = element("input");
    			t23 = space();
    			div32 = element("div");
    			div31 = element("div");
    			div18 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Configuración";
    			t25 = space();
    			div30 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			p = element("p");
    			p.textContent = "Formularios activos";
    			t27 = space();
    			hr = element("hr");
    			t28 = space();
    			div27 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			label5 = element("label");
    			input5 = element("input");
    			t29 = space();
    			span0 = element("span");
    			t30 = space();
    			span1 = element("span");
    			span1.textContent = "Historia Ginecologica";
    			t32 = space();
    			div22 = element("div");
    			div21 = element("div");
    			label6 = element("label");
    			input6 = element("input");
    			t33 = space();
    			span2 = element("span");
    			t34 = space();
    			span3 = element("span");
    			span3.textContent = "Signos Vitales";
    			t36 = space();
    			div24 = element("div");
    			div23 = element("div");
    			label7 = element("label");
    			input7 = element("input");
    			t37 = space();
    			span4 = element("span");
    			t38 = space();
    			span5 = element("span");
    			span5.textContent = "Otros Parametros";
    			t40 = space();
    			div26 = element("div");
    			div25 = element("div");
    			label8 = element("label");
    			input8 = element("input");
    			t41 = space();
    			span6 = element("span");
    			t42 = space();
    			span7 = element("span");
    			span7.textContent = "Exploración Fisica";
    			attr_dev(i0, "class", "mdi mdi-content-save");
    			add_location(i0, file$t, 155, 12, 4645);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success");
    			set_style(button, "position", "fixed");
    			set_style(button, "bottom", "30px");
    			set_style(button, "right", "30px");
    			set_style(button, "z-index", "1000");
    			add_location(button, file$t, 149, 8, 4388);
    			attr_dev(i1, "class", "mdi mdi-medical-bag");
    			add_location(i1, file$t, 161, 18, 4852);
    			add_location(h5, file$t, 161, 14, 4848);
    			attr_dev(div0, "class", "col-12 m-b-20 m-t-20");
    			add_location(div0, file$t, 160, 12, 4798);
    			attr_dev(h40, "class", "card-title");
    			add_location(h40, file$t, 166, 24, 5074);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$t, 165, 20, 5023);
    			if (img.src !== (img_src_value = /*logo*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "logo-emp svelte-18x36bc");
    			attr_dev(img, "alt", "logo empresa");
    			add_location(img, file$t, 173, 32, 5378);
    			attr_dev(i2, "class", "mdi mdi-refresh");
    			add_location(i2, file$t, 176, 40, 5640);
    			attr_dev(label0, "class", "btn btn-primary btn-sm");
    			attr_dev(label0, "for", "inpSubirImagen");
    			add_location(label0, file$t, 175, 36, 5539);
    			set_style(input0, "display", "none");
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "inpSubirImagen");
    			attr_dev(input0, "accept", "image/png, image/jpeg");
    			add_location(input0, file$t, 178, 36, 5770);
    			attr_dev(div2, "class", "col-12 text-center mt-2");
    			add_location(div2, file$t, 174, 32, 5464);
    			attr_dev(div3, "class", "col-lg-3");
    			add_location(div3, file$t, 172, 28, 5322);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$t, 185, 44, 6248);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			add_location(input1, file$t, 186, 44, 6334);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$t, 184, 40, 6178);
    			attr_dev(div5, "class", "col-lg-12");
    			add_location(div5, file$t, 183, 36, 6113);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$t, 191, 44, 6666);
    			attr_dev(input2, "type", "tel");
    			attr_dev(input2, "class", "form-control");
    			add_location(input2, file$t, 192, 44, 6742);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$t, 190, 40, 6596);
    			attr_dev(div7, "class", "col-lg-6");
    			add_location(div7, file$t, 189, 36, 6532);
    			attr_dev(label3, "for", "");
    			add_location(label3, file$t, 197, 44, 7075);
    			attr_dev(input3, "type", "email");
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$t, 198, 44, 7149);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$t, 196, 40, 7005);
    			attr_dev(div9, "class", "col-lg-6");
    			add_location(div9, file$t, 195, 36, 6941);
    			attr_dev(label4, "for", "");
    			add_location(label4, file$t, 203, 44, 7483);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$t, 204, 44, 7560);
    			attr_dev(div10, "class", "form-group");
    			add_location(div10, file$t, 202, 40, 7413);
    			attr_dev(div11, "class", "col-lg-12");
    			add_location(div11, file$t, 201, 36, 7348);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$t, 182, 32, 6058);
    			attr_dev(div13, "class", "col-lg-9");
    			add_location(div13, file$t, 181, 28, 6002);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$t, 171, 24, 5275);
    			attr_dev(div15, "class", "card-body");
    			add_location(div15, file$t, 170, 20, 5226);
    			attr_dev(div16, "class", "card m-b-30");
    			add_location(div16, file$t, 164, 16, 4976);
    			attr_dev(div17, "class", "col-12");
    			add_location(div17, file$t, 163, 12, 4938);
    			attr_dev(h41, "class", "card-title");
    			add_location(h41, file$t, 216, 24, 8053);
    			attr_dev(div18, "class", "card-header");
    			add_location(div18, file$t, 215, 20, 8002);
    			add_location(p, file$t, 223, 32, 8364);
    			add_location(hr, file$t, 224, 32, 8424);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "name", "option");
    			input5.__value = "1";
    			input5.value = input5.__value;
    			attr_dev(input5, "class", "cstm-switch-input");
    			add_location(input5, file$t, 229, 48, 8723);
    			attr_dev(span0, "class", "cstm-switch-indicator bg-success ");
    			add_location(span0, file$t, 230, 48, 8890);
    			attr_dev(span1, "class", "cstm-switch-description");
    			add_location(span1, file$t, 231, 48, 8995);
    			attr_dev(label5, "class", "cstm-switch");
    			add_location(label5, file$t, 228, 44, 8646);
    			attr_dev(div19, "class", " m-b-10");
    			add_location(div19, file$t, 227, 40, 8579);
    			attr_dev(div20, "class", "col-12");
    			add_location(div20, file$t, 226, 36, 8517);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "name", "option");
    			input6.__value = "1";
    			input6.value = input6.__value;
    			attr_dev(input6, "class", "cstm-switch-input");
    			add_location(input6, file$t, 238, 48, 9451);
    			attr_dev(span2, "class", "cstm-switch-indicator bg-success ");
    			add_location(span2, file$t, 239, 48, 9611);
    			attr_dev(span3, "class", "cstm-switch-description");
    			add_location(span3, file$t, 240, 48, 9716);
    			attr_dev(label6, "class", "cstm-switch");
    			add_location(label6, file$t, 237, 44, 9374);
    			attr_dev(div21, "class", " m-b-10");
    			add_location(div21, file$t, 236, 40, 9307);
    			attr_dev(div22, "class", "col-12");
    			add_location(div22, file$t, 235, 36, 9245);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "name", "option");
    			input7.__value = "1";
    			input7.value = input7.__value;
    			attr_dev(input7, "class", "cstm-switch-input");
    			add_location(input7, file$t, 247, 48, 10165);
    			attr_dev(span4, "class", "cstm-switch-indicator bg-success ");
    			add_location(span4, file$t, 248, 48, 10327);
    			attr_dev(span5, "class", "cstm-switch-description");
    			add_location(span5, file$t, 249, 48, 10432);
    			attr_dev(label7, "class", "cstm-switch");
    			add_location(label7, file$t, 246, 44, 10088);
    			attr_dev(div23, "class", " m-b-10");
    			add_location(div23, file$t, 245, 40, 10021);
    			attr_dev(div24, "class", "col-12");
    			add_location(div24, file$t, 244, 36, 9959);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "name", "option");
    			input8.__value = "1";
    			input8.value = input8.__value;
    			attr_dev(input8, "class", "cstm-switch-input");
    			add_location(input8, file$t, 256, 48, 10883);
    			attr_dev(span6, "class", "cstm-switch-indicator bg-success ");
    			add_location(span6, file$t, 257, 48, 11047);
    			attr_dev(span7, "class", "cstm-switch-description");
    			add_location(span7, file$t, 258, 48, 11152);
    			attr_dev(label8, "class", "cstm-switch");
    			add_location(label8, file$t, 255, 44, 10806);
    			attr_dev(div25, "class", " m-b-10");
    			add_location(div25, file$t, 254, 40, 10739);
    			attr_dev(div26, "class", "col-12");
    			add_location(div26, file$t, 253, 36, 10677);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$t, 225, 32, 8462);
    			attr_dev(div28, "class", "col-lg-4 mt-3");
    			add_location(div28, file$t, 222, 28, 8303);
    			attr_dev(div29, "class", "row");
    			add_location(div29, file$t, 221, 24, 8256);
    			attr_dev(div30, "class", "card-body");
    			add_location(div30, file$t, 220, 20, 8207);
    			attr_dev(div31, "class", "card");
    			add_location(div31, file$t, 214, 16, 7962);
    			attr_dev(div32, "class", "col-12 m-b-80");
    			add_location(div32, file$t, 213, 12, 7917);
    			attr_dev(div33, "class", "row");
    			add_location(div33, file$t, 159, 10, 4767);
    			attr_dev(div34, "class", "col-12");
    			add_location(div34, file$t, 158, 8, 4735);
    			attr_dev(div35, "class", "p-2");
    			add_location(div35, file$t, 157, 6, 4708);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$t, 148, 4, 4347);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$t, 143, 2, 4240);
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
    			append_dev(section, button);
    			append_dev(button, i0);
    			append_dev(section, t3);
    			append_dev(section, div35);
    			append_dev(div35, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div0);
    			append_dev(div0, h5);
    			append_dev(h5, i1);
    			append_dev(h5, t4);
    			append_dev(div33, t5);
    			append_dev(div33, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div1);
    			append_dev(div1, h40);
    			append_dev(div16, t7);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div3);
    			append_dev(div3, img);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, label0);
    			append_dev(label0, i2);
    			append_dev(label0, t9);
    			append_dev(div2, t10);
    			append_dev(div2, input0);
    			append_dev(div14, t11);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div5);
    			append_dev(div5, div4);
    			append_dev(div4, label1);
    			append_dev(div4, t13);
    			append_dev(div4, input1);
    			set_input_value(input1, /*empresa*/ ctx[1].nombre);
    			append_dev(div12, t14);
    			append_dev(div12, div7);
    			append_dev(div7, div6);
    			append_dev(div6, label2);
    			append_dev(div6, t16);
    			append_dev(div6, input2);
    			set_input_value(input2, /*empresa*/ ctx[1].telefono);
    			append_dev(div12, t17);
    			append_dev(div12, div9);
    			append_dev(div9, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t19);
    			append_dev(div8, input3);
    			set_input_value(input3, /*empresa*/ ctx[1].correo);
    			append_dev(div12, t20);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, label4);
    			append_dev(div10, t22);
    			append_dev(div10, input4);
    			set_input_value(input4, /*empresa*/ ctx[1].direccion);
    			append_dev(div33, t23);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, div18);
    			append_dev(div18, h41);
    			append_dev(div31, t25);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, p);
    			append_dev(div28, t27);
    			append_dev(div28, hr);
    			append_dev(div28, t28);
    			append_dev(div28, div27);
    			append_dev(div27, div20);
    			append_dev(div20, div19);
    			append_dev(div19, label5);
    			append_dev(label5, input5);
    			input5.checked = /*empresa*/ ctx[1].historiaGinecologica;
    			append_dev(label5, t29);
    			append_dev(label5, span0);
    			append_dev(label5, t30);
    			append_dev(label5, span1);
    			append_dev(div27, t32);
    			append_dev(div27, div22);
    			append_dev(div22, div21);
    			append_dev(div21, label6);
    			append_dev(label6, input6);
    			input6.checked = /*empresa*/ ctx[1].signosVitales;
    			append_dev(label6, t33);
    			append_dev(label6, span2);
    			append_dev(label6, t34);
    			append_dev(label6, span3);
    			append_dev(div27, t36);
    			append_dev(div27, div24);
    			append_dev(div24, div23);
    			append_dev(div23, label7);
    			append_dev(label7, input7);
    			input7.checked = /*empresa*/ ctx[1].otrosParametros;
    			append_dev(label7, t37);
    			append_dev(label7, span4);
    			append_dev(label7, t38);
    			append_dev(label7, span5);
    			append_dev(div27, t40);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, label8);
    			append_dev(label8, input8);
    			input8.checked = /*empresa*/ ctx[1].exploracionFisica;
    			append_dev(label8, t41);
    			append_dev(label8, span6);
    			append_dev(label8, t42);
    			append_dev(label8, span7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*editarEmpresa*/ ctx[4], false, false, false),
    					listen_dev(input0, "change", /*cambiarImagenEmpresa*/ ctx[3], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[7]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[8]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[9]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[10]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[11]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[12])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*serverConexion*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*serverConexion*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$g(ctx);
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

    			if (!current || dirty & /*logo*/ 4 && img.src !== (img_src_value = /*logo*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*empresa*/ 2 && input1.value !== /*empresa*/ ctx[1].nombre) {
    				set_input_value(input1, /*empresa*/ ctx[1].nombre);
    			}

    			if (dirty & /*empresa*/ 2) {
    				set_input_value(input2, /*empresa*/ ctx[1].telefono);
    			}

    			if (dirty & /*empresa*/ 2 && input3.value !== /*empresa*/ ctx[1].correo) {
    				set_input_value(input3, /*empresa*/ ctx[1].correo);
    			}

    			if (dirty & /*empresa*/ 2 && input4.value !== /*empresa*/ ctx[1].direccion) {
    				set_input_value(input4, /*empresa*/ ctx[1].direccion);
    			}

    			if (dirty & /*empresa*/ 2) {
    				input5.checked = /*empresa*/ ctx[1].historiaGinecologica;
    			}

    			if (dirty & /*empresa*/ 2) {
    				input6.checked = /*empresa*/ ctx[1].signosVitales;
    			}

    			if (dirty & /*empresa*/ 2) {
    				input7.checked = /*empresa*/ ctx[1].otrosParametros;
    			}

    			if (dirty & /*empresa*/ 2) {
    				input8.checked = /*empresa*/ ctx[1].exploracionFisica;
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Detalle", slots, []);

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

    	let errorServer = false;
    	let serverConexion = false;
    	let msgError = "";
    	let empresa = {};
    	let logo = "";
    	let avatar;

    	const cambiarImagenEmpresa = e => {
    		let image = e.target.files[0];
    		const form = new FormData();
    		form.append("logo", image);

    		const config = {
    			method: "put",
    			url: `${url}/empresas/${user().empresa}/imagen`,
    			data: form,
    			headers: {
    				"Content-Type": "multipart/form-data",
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			if (res.status === 200) {
    				Toast.fire({
    					icon: "success",
    					title: "Se ha cambiado la imagen correctamente"
    				});

    				cargarEmpresa();
    			}
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const editarEmpresa = () => {
    		const data = {
    			nombre: empresa.nombre,
    			telefono: empresa.telefono,
    			correo: empresa.correo,
    			direccion: empresa.direccion,
    			historiaGinecologica: empresa.historiaGinecologica,
    			signosVitales: empresa.signosVitales,
    			otrosParametros: empresa.otrosParametros,
    			exploracionFisica: empresa.exploracionFisica
    		};

    		const config = {
    			method: "put",
    			url: `${url}/empresas/${user().empresa}`,
    			data,
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			if (res.status === 200) {
    				Toast.fire({
    					icon: "success",
    					title: "Empresa actualizada"
    				});

    				cargarEmpresa();
    			}
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const cargarImagenEmpresa = (idConsultorio, idImagen) => {
    		const config = {
    			method: "get",
    			url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
    			responseType: "blob",
    			headers: {
    				Authorization: `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			return $$invalidate(2, logo = URL.createObjectURL(res.data));
    		}).catch(err => {
    			console.error(err);
    		});
    	};

    	const cargarEmpresa = () => {
    		const config = {
    			method: "get",
    			url: `${url}/empresas/${user().empresa}`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			if (res.status === 200) {
    				$$invalidate(1, empresa = res.data);
    				cargarImagenEmpresa(empresa.id, empresa.logo);
    			} else {
    				$$invalidate(0, serverConexion = true);
    			}
    		}).catch(err => {
    			$$invalidate(0, serverConexion = true);
    			console.error(err);
    		});
    	};

    	onMount(() => {
    		cargarEmpresa();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$d.warn(`<Detalle> was created with unknown prop '${key}'`);
    	});

    	function input1_input_handler() {
    		empresa.nombre = this.value;
    		$$invalidate(1, empresa);
    	}

    	function input2_input_handler() {
    		empresa.telefono = this.value;
    		$$invalidate(1, empresa);
    	}

    	function input3_input_handler() {
    		empresa.correo = this.value;
    		$$invalidate(1, empresa);
    	}

    	function input4_input_handler() {
    		empresa.direccion = this.value;
    		$$invalidate(1, empresa);
    	}

    	function input5_change_handler() {
    		empresa.historiaGinecologica = this.checked;
    		$$invalidate(1, empresa);
    	}

    	function input6_change_handler() {
    		empresa.signosVitales = this.checked;
    		$$invalidate(1, empresa);
    	}

    	function input7_change_handler() {
    		empresa.otrosParametros = this.checked;
    		$$invalidate(1, empresa);
    	}

    	function input8_change_handler() {
    		empresa.exploracionFisica = this.checked;
    		$$invalidate(1, empresa);
    	}

    	$$self.$capture_state = () => ({
    		axios: axios$1,
    		onMount,
    		url,
    		user,
    		Header,
    		Aside,
    		ErrorConexion,
    		NoConexion,
    		Toast,
    		errorServer,
    		serverConexion,
    		msgError,
    		empresa,
    		logo,
    		avatar,
    		cambiarImagenEmpresa,
    		editarEmpresa,
    		cargarImagenEmpresa,
    		cargarEmpresa
    	});

    	$$self.$inject_state = $$props => {
    		if ("errorServer" in $$props) errorServer = $$props.errorServer;
    		if ("serverConexion" in $$props) $$invalidate(0, serverConexion = $$props.serverConexion);
    		if ("msgError" in $$props) msgError = $$props.msgError;
    		if ("empresa" in $$props) $$invalidate(1, empresa = $$props.empresa);
    		if ("logo" in $$props) $$invalidate(2, logo = $$props.logo);
    		if ("avatar" in $$props) avatar = $$props.avatar;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		serverConexion,
    		empresa,
    		logo,
    		cambiarImagenEmpresa,
    		editarEmpresa,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler
    	];
    }

    class Detalle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Detalle",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src\Pages\Citas\Index.svelte generated by Svelte v3.29.0 */

    const { console: console_1$e } = globals;
    const file$u = "src\\Pages\\Citas\\Index.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (59:2) {#if errorServer}
    function create_if_block_2$8(ctx) {
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
    		id: create_if_block_2$8.name,
    		type: "if",
    		source: "(59:2) {#if errorServer}",
    		ctx
    	});

    	return block;
    }

    // (98:20) {#if cita.activo}
    function create_if_block_1$9(ctx) {
    	let tr;
    	let td0;
    	let div;
    	let span;
    	let t0_value = /*cita*/ ctx[8].paciente.nombres[0] + "";
    	let t0;
    	let t1_value = /*cita*/ ctx[8].paciente.apellidos[0] + "";
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*cita*/ ctx[8].paciente.nombres + "";
    	let t3;
    	let t4;
    	let t5_value = /*cita*/ ctx[8].paciente.apellidos + "";
    	let t5;
    	let t6;
    	let td2;
    	let t7_value = /*cita*/ ctx[8].paciente.cedula + "";
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = calcularEdad(/*cita*/ ctx[8].paciente.fechaNacimiento) + "";
    	let t9;
    	let t10;
    	let t11;
    	let td4;
    	let t12_value = /*cita*/ ctx[8].paciente.sexo + "";
    	let t12;
    	let t13;
    	let td5;
    	let t14_value = new Date(/*cita*/ ctx[8].fechaCita).toLocaleDateString("es-DO") + "";
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
    			add_location(span, file$u, 101, 32, 3139);
    			attr_dev(div, "class", "avatar avatar-sm");
    			add_location(div, file$u, 100, 28, 3075);
    			add_location(td0, file$u, 99, 24, 3041);
    			add_location(td1, file$u, 104, 24, 3336);
    			add_location(td2, file$u, 105, 24, 3420);
    			add_location(td3, file$u, 106, 24, 3477);
    			add_location(td4, file$u, 107, 24, 3562);
    			add_location(td5, file$u, 108, 24, 3617);
    			attr_dev(i0, "class", "mdi mdi-close");
    			add_location(i0, file$u, 116, 32, 4065);
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "btn btn-outline-danger");
    			attr_dev(a0, "data-tooltip", "Eliminar");
    			add_location(a0, file$u, 111, 28, 3834);
    			attr_dev(i1, "class", "mdi mdi-send");
    			add_location(i1, file$u, 124, 32, 4478);
    			attr_dev(a1, "href", a1_href_value = `/pacientes/${/*cita*/ ctx[8].paciente.id}/historias/${/*cita*/ ctx[8].id}`);
    			attr_dev(a1, "class", "btn btn-outline-primary");
    			attr_dev(a1, "data-tooltip", "Ver");
    			add_location(a1, file$u, 118, 28, 4158);
    			attr_dev(td6, "class", "text-right");
    			add_location(td6, file$u, 109, 24, 3706);
    			add_location(tr, file$u, 98, 20, 3011);
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
    			if (dirty & /*citas*/ 1 && t0_value !== (t0_value = /*cita*/ ctx[8].paciente.nombres[0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*citas*/ 1 && t1_value !== (t1_value = /*cita*/ ctx[8].paciente.apellidos[0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*citas*/ 1 && t3_value !== (t3_value = /*cita*/ ctx[8].paciente.nombres + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*citas*/ 1 && t5_value !== (t5_value = /*cita*/ ctx[8].paciente.apellidos + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*citas*/ 1 && t7_value !== (t7_value = /*cita*/ ctx[8].paciente.cedula + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*citas*/ 1 && t9_value !== (t9_value = calcularEdad(/*cita*/ ctx[8].paciente.fechaNacimiento) + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*citas*/ 1 && t12_value !== (t12_value = /*cita*/ ctx[8].paciente.sexo + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*citas*/ 1 && t14_value !== (t14_value = new Date(/*cita*/ ctx[8].fechaCita).toLocaleDateString("es-DO") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*citas*/ 1 && a1_href_value !== (a1_href_value = `/pacientes/${/*cita*/ ctx[8].paciente.id}/historias/${/*cita*/ ctx[8].id}`)) {
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
    		id: create_if_block_1$9.name,
    		type: "if",
    		source: "(98:20) {#if cita.activo}",
    		ctx
    	});

    	return block;
    }

    // (97:16) {#each citas as cita}
    function create_each_block$c(ctx) {
    	let if_block_anchor;
    	let if_block = /*cita*/ ctx[8].activo && create_if_block_1$9(ctx);

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
    			if (/*cita*/ ctx[8].activo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$9(ctx);
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
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(97:16) {#each citas as cita}",
    		ctx
    	});

    	return block;
    }

    // (136:8) {#if cargando}
    function create_if_block$h(ctx) {
    	let div1;
    	let div0;
    	let span;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "sr-only");
    			add_location(span, file$u, 138, 21, 4897);
    			attr_dev(div0, "class", "spinner-border text-secondary");
    			attr_dev(div0, "role", "status");
    			add_location(div0, file$u, 137, 17, 4817);
    			attr_dev(div1, "class", "text-center");
    			add_location(div1, file$u, 136, 13, 4773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$h.name,
    		type: "if",
    		source: "(136:8) {#if cargando}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
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
    	let t21;
    	let current;
    	let mounted;
    	let dispose;
    	aside = new Aside({ $$inline: true });
    	header = new Header({ $$inline: true });
    	let if_block0 = /*errorServer*/ ctx[3] && create_if_block_2$8(ctx);
    	let each_value = /*citas*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
    	}

    	let if_block1 = /*cargando*/ ctx[2] && create_if_block$h(ctx);

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
    			div9 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div8 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Citas";
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Buscar citas";
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
    			th5.textContent = "Fecha Cita";
    			t19 = space();
    			th6 = element("th");
    			t20 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t21 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$u, 65, 6, 1701);
    			add_location(h5, file$u, 67, 8, 1773);
    			attr_dev(label, "for", "Buscar");
    			add_location(label, file$u, 74, 32, 2085);
    			attr_dev(input, "type", "search");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nombres o Apelidos");
    			add_location(input, file$u, 75, 32, 2159);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$u, 73, 28, 2027);
    			attr_dev(div2, "class", "col-lg-4");
    			add_location(div2, file$u, 72, 24, 1975);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$u, 71, 20, 1932);
    			attr_dev(div4, "class", "col-12");
    			add_location(div4, file$u, 70, 16, 1890);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$u, 69, 8, 1855);
    			attr_dev(div6, "class", "alert alert-secondary");
    			attr_dev(div6, "role", "alert");
    			add_location(div6, file$u, 68, 8, 1797);
    			add_location(th0, file$u, 86, 20, 2612);
    			add_location(th1, file$u, 87, 20, 2643);
    			add_location(th2, file$u, 88, 20, 2680);
    			add_location(th3, file$u, 89, 20, 2717);
    			add_location(th4, file$u, 90, 20, 2752);
    			add_location(th5, file$u, 91, 20, 2787);
    			add_location(th6, file$u, 92, 20, 2828);
    			add_location(tr, file$u, 85, 16, 2586);
    			add_location(thead, file$u, 84, 16, 2561);
    			add_location(tbody, file$u, 95, 16, 2904);
    			attr_dev(table, "class", "table align-td-middle table-card");
    			add_location(table, file$u, 83, 12, 2495);
    			attr_dev(div7, "class", "table-responsive");
    			add_location(div7, file$u, 82, 8, 2451);
    			attr_dev(div8, "class", "col-md-12 mt-3 m-b-30");
    			add_location(div8, file$u, 66, 6, 1728);
    			attr_dev(div9, "class", "p-2");
    			add_location(div9, file$u, 64, 4, 1676);
    			attr_dev(section, "class", "admin-content");
    			add_location(section, file$u, 63, 2, 1639);
    			attr_dev(main, "class", "admin-main");
    			add_location(main, file$u, 56, 0, 1417);
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
    			set_input_value(input, /*sltBuscarCitas*/ ctx[1]);
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

    			append_dev(div8, t21);
    			if (if_block1) if_block1.m(div8, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*searchCitas*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sltBuscarCitas*/ 2) {
    				set_input_value(input, /*sltBuscarCitas*/ ctx[1]);
    			}

    			if (dirty & /*citas, Date, calcularEdad*/ 1) {
    				each_value = /*citas*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$c(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$c(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*cargando*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$h(ctx);
    					if_block1.c();
    					if_block1.m(div8, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
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
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let citas = [];
    	let errorServer = false;
    	let sltBuscarCitas = "";
    	let timeout = null;
    	let cargando = false;

    	const searchCitas = () => {
    		if (timeout) {
    			window.clearTimeout(timeout);
    		}

    		timeout = setTimeout(
    			function () {
    				cargarCitas();
    			},
    			300
    		);
    	};

    	const cargarCitas = () => {
    		$$invalidate(2, cargando = true);

    		const config = {
    			method: "get",
    			url: `${url}/citas`,
    			headers: {
    				"Authorization": `${localStorage.getItem("auth")}`
    			}
    		};

    		axios$1(config).then(res => {
    			$$invalidate(2, cargando = false);

    			if (res.status === 200) {
    				$$invalidate(0, citas = res.data);
    				console.log(res.data);
    			}
    		}).catch(err => {
    			$$invalidate(2, cargando = false);
    			console.error(err);
    		});
    	};

    	onMount(() => {
    		cargarCitas();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$e.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		sltBuscarCitas = this.value;
    		$$invalidate(1, sltBuscarCitas);
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
    		citas,
    		errorServer,
    		sltBuscarCitas,
    		timeout,
    		cargando,
    		searchCitas,
    		cargarCitas
    	});

    	$$self.$inject_state = $$props => {
    		if ("citas" in $$props) $$invalidate(0, citas = $$props.citas);
    		if ("errorServer" in $$props) $$invalidate(3, errorServer = $$props.errorServer);
    		if ("sltBuscarCitas" in $$props) $$invalidate(1, sltBuscarCitas = $$props.sltBuscarCitas);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("cargando" in $$props) $$invalidate(2, cargando = $$props.cargando);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [citas, sltBuscarCitas, cargando, errorServer, searchCitas, input_input_handler];
    }

    class Index$5 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$w.name
    		});
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
        "/impresion/pacientes/:idPaciente/historias/:idHistoria/medicamentos": wrap({
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
        "/impresion/pacientes/:idPaciente/historias/:idHistoria/estudios/laboratorios": wrap({
            component: Estudios,
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
        "/impresion/pacientes/:idPaciente/historias/:idHistoria/estudios/imagenes": wrap({
            component: Imagenes,
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
        "/empresa/detalles": wrap({
            component: Detalle,
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
        "/recetas": wrap({
            component: Index$4,
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
        "/citas": wrap({
            component: Index$5,
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

    function create_fragment$x(ctx) {
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
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$x.name
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
