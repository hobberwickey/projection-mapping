const ComponentRegistry = {
  templates: {},
  styles: {},

  register: function (name, cls, options) {
    if (!!options.template) {
      this.templates[name] = options.template;
    }

    if (!!options.styles) {
      this.styles[name] = options.styles;
    }

    customElements.define(name, cls);
  },
};

class Component extends HTMLElement {
  constructor() {
    super();

    this.__connected__ = false;
    this.__children__ = [];

    // Context Variables
    this.__bindings__ = [];
    this.__childbindings__ = [];
    this.__observed__ = {};
    this.__values__ = {};
    this.__current_target__ = null;
  }

  static get observedProperties() {
    return [];
  }

  listen(key, fn) {
    const uuid = () => {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
          +c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
        ).toString(16),
      );
    };

    let handle = uuid();
    if (this.__observed__.hasOwnProperty(key)) {
      let observers = this.__observed__[key];
      let idx = observers.findIndex((o) => o.el === this && o.attr === handle);

      let observer = {
        el: this,
        attr: handle,
        hidden: true,
        snippet: "",
        context: this,
        bindings: [
          (context, values) => {
            return fn(values[key]);
          },
        ],
      };

      if (idx === -1) {
        observers.push(observer);
      } else {
        observers.splice(idx, 1, observer);
      }
    }
  }

  observe(prop, ctx) {
    ctx = ctx || this;

    ctx.__observed__[prop] = [];
    ctx.__values__[prop] = ctx[prop];

    Object.defineProperty(ctx, prop, {
      get: () => {
        if (
          ctx.__current_target__ !== null &&
          ctx.__observed__.hasOwnProperty(prop)
        ) {
          let { el, attr, snippet, context, bindings } = ctx.__current_target__;

          let observers = ctx.__observed__[prop];
          let idx = observers.findIndex((o) => o.el === el && o.attr === attr);

          if (idx === -1) {
            observers.push({ ...ctx.__current_target__ });
          } else {
            observers.splice(idx, 1, { ...ctx.__current_target__ });
          }
        }

        return ctx.__values__[prop];
      },
      set: (value) => {
        if (value !== ctx.__values__[prop]) {
          ctx.__values__[prop] = value;

          let observers = ctx.__observed__[prop] || [];
          let len = observers.length;

          for (var i = 0; i < len; i++) {
            let { el, attr, hidden, snippet, context, bindings } = observers[i];
            let values = context.__get_values__(ctx);

            for (let i = 0; i < bindings.length; i++) {
              snippet = bindings[i](snippet, values, attr);
            }

            if (typeof snippet === "function") {
              el[attr.replace(":", "")] = snippet.bind(this);
            } else {
              el[attr.replace(":", "")] = snippet;
            }

            if (!["array", "object", "function"].includes(typeof snippet)) {
              if (!hidden && !!el.setAttribute) {
                el.setAttribute(attr.replace(":", ""), snippet);
              }
            }
          }
        }
      },
    });
  }

  connectedCallback() {
    const name = this.tagName.toLowerCase();

    if (!this.__connected__) {
      this.__connected__ = true;

      this.constructor.observedProperties.map((prop) => {
        this.observe(prop, this);
      });

      this.__children__ = [...this.children];
      let template = document.createDocumentFragment();
      if (!!ComponentRegistry.templates[name]) {
        template = ComponentRegistry.templates[name].content.cloneNode(true);
        this.__parseTemplate__(template, this);
      }

      this.__render__(this);

      this.appendChild(template);

      if (!!this.connected) {
        this.connected();
      }
    }
  }

  __parseTemplate__(template, ctx) {
    const eventExp = /\@([a-z|A-Z]+)/;
    const attrExp = /\:([a-z|A-Z]+)/;
    const boundExp = /\{\{(.*?)\}\}/g;

    const getBinding = (el, attr, ctx) => {
      let binding = ctx.__bindings__.find((b) => b.el === el);

      if (!binding) {
        binding = {
          el: el,
          attrs: {},
        };

        ctx.__bindings__.push(binding);
      }

      if (!binding.attrs[attr]) {
        let snippet;
        if (/template\-[0-9]+/i.test(attr)) {
          let templateIdx = +attr.split("-")[1];
          snippet = el.querySelectorAll("template")[templateIdx];
        } else {
          snippet = el[attr];
          if (!!el.getAttribute) {
            snippet = el.getAttribute(attr);
          }
        }

        binding.attrs[attr] = {
          snippet: snippet,
          created: [],
          bindings: [],
        };
      }

      return binding;
    };

    const bindValue = (el, attr, match, ctx) => {
      let binding = getBinding(el, attr, ctx);

      if (attr === "textContent") {
        let fn = new Function(
          "scope",
          `
          with(scope) {
            return ${match[1]}
          }`,
        );

        binding.attrs[attr].bindings.push((snippet, values) => {
          return snippet.replace(match[0], fn(values));
        });
      }
    };

    const bindAttribute = (el, attr, context, ctx) => {
      let binding = getBinding(el, attr, ctx);

      let fn = new Function(
        "scope",
        `
        with(scope) {
          return ${context};
        }`,
      );

      binding.attrs[attr].bindings.push((snippet, values) => {
        return fn(values);
      });
    };

    const bindEvent = (el, attr, context, ctx) => {
      let fn = new Function(
        "scope",
        `         
        with(scope) {
          return ${context}
        }`,
      );

      el.addEventListener(attr.replace("@", ""), (e) => {
        let values = ctx.__get_values__(ctx);

        values["$event"] = e;
        fn(values);
      });
    };

    const createTemplateContext = (oCtx, idx, key, value) => {
      let values = {};

      let ctx = {
        __bindings__: [],
        __observed__: {},
        __childbindings__: [],
        __values__: values,
        __template__: null,
        __current_target: null,
        __parent__: oCtx,
        __current_target__: null,

        __get_values__: () => {
          return this.__get_values__(ctx);
        },
      };

      for (var key in oCtx.__observed__) {
        ctx[key] = oCtx[key];
        this.observe(key, ctx);
      }

      ctx["$idx"] = idx;
      this.observe("$idx", ctx);
      ctx["$key"] = key;
      this.observe("$key", ctx);
      ctx["$value"] = value;
      this.observe("$value", ctx);

      return ctx;
    };

    const bindTemplate = (el, oCtx) => {
      let templateIdx = [...el.parentNode.querySelectorAll("template")].indexOf(
        el,
      );

      let binding = getBinding(el.parentNode, `template-${templateIdx}`, oCtx);

      let type = el.hasAttribute(":for") ? "loop" : "if";
      if (type === "loop") {
        let iteratorFn = new Function(
          `scope`,
          `with(scope) {
            return ${el.getAttribute(":for")}
          }`,
        );

        // Create a child binding for this template
        oCtx.__childbindings__.push({
          el: el,
          bindings: {},
        });

        // Create pass through observers
        for (let key in oCtx.__observed__) {
          oCtx.__observed__[key].push({
            el: el,
            snippet: null,
            attr: "for-loop",
            hidden: true,
            context: oCtx,
            bindings: [
              (snippet, values) => {
                let child = oCtx.__childbindings__.find((b) => b.el === el);
                let childBindings = child.bindings[key] || [];

                for (let i = 0; i < childBindings.length; i++) {
                  childBindings[i].context[key] = values[key];
                }
              },
            ],
          });
        }

        let fn = (snippet, values, attr) => {
          // Get the iterator value;
          let iterator = iteratorFn(values);

          // Create a document fagment to append items to
          let frag = document.createDocumentFragment();

          // Remove all any elements created from a previous call
          // TODO: this should be smarter, and remove only those
          // who's values have been removed
          let previouslyCreated = binding.attrs[attr].created || [];
          for (let i = 0; i < previouslyCreated.length; i++) {
            previouslyCreated[i].parentNode.removeChild(previouslyCreated[i]);
          }

          let created = [];
          if (!!iterator) {
            let idx = 0;
            let child_bindings = {};
            for (let key in iterator) {
              // Clone the template
              let item = el.content.cloneNode(true);

              // Create a new context
              let ctx = createTemplateContext(oCtx, idx, key, iterator[key]);

              // Parse the template
              walk(item, ctx, true);

              // Render the context
              this.__render__(ctx, true);

              // Keep track of created items
              created.push(...item.children);

              // append then render
              frag.append(item);

              // Keep track of all the observers
              for (let o in ctx.__observed__) {
                if (child_bindings.hasOwnProperty(o)) {
                  child_bindings[o].push(...ctx.__observed__[o]);
                } else {
                  child_bindings[o] = [...ctx.__observed__[o]];
                }
              }

              // increment the index
              idx++;
            }

            // Replace the parent context's child bindings with the rendered bindings
            let childIdx = oCtx.__childbindings__.findIndex((b) => b.el === el);
            if (childIdx !== -1) {
              oCtx.__childbindings__[childIdx].bindings = child_bindings;
            }
          }

          // Set the created elements to be removed on the next render
          binding.attrs[attr].created = created;

          // If this the template is being rendered create bindings on the parent scope
          el.parentNode.insertBefore(frag, el);
        };

        binding.attrs[`template-${templateIdx}`].bindings.push(fn);
      } else if (type === "if") {
        let conditionalFn = new Function(
          `scope`,
          `with(scope) {
            return ${el.getAttribute(":if")}
          }`,
        );

        // Create a child binding for this template
        oCtx.__childbindings__.push({
          el: el,
          bindings: {},
        });

        // Create pass through observers
        for (let key in oCtx.__observed__) {
          oCtx.__observed__[key].push({
            el: el,
            snippet: null,
            attr: `if-block-${templateIdx}`,
            hidden: true,
            context: oCtx,
            bindings: [
              (snippet, values, attr) => {
                let child = oCtx.__childbindings__.find((b) => b.el === el);
                let childBindings = child.bindings[key] || [];

                for (let i = 0; i < childBindings.length; i++) {
                  childBindings[i].context[key] = values[key];
                }
              },
            ],
          });
        }

        let fn = (snippet, values, attr) => {
          // Get the iterator value;
          let condtional = conditionalFn(values);

          // Create a document fagment to append items to
          let frag = document.createDocumentFragment();

          // Remove all any elements created from a previous call
          // TODO: this should be smarter, and remove only those
          // who's values have been removed

          let previouslyCreated = binding.attrs[attr].created || [];
          for (let i = 0; i < previouslyCreated.length; i++) {
            previouslyCreated[i].parentNode.removeChild(previouslyCreated[i]);
          }

          let created = [];
          let child_bindings = {};
          if (condtional) {
            // Clone the template
            let item = el.content.cloneNode(true);

            // Create a new context
            let ctx = createTemplateContext(oCtx, null, null, null);

            // Parse the template
            walk(item, ctx, true);

            // Render the context
            this.__render__(ctx, true);

            // Keep track of created items
            created.push(...item.children);

            // append then render
            frag.append(item);

            // If this the template is being rendered create bindings on the parent scope
            el.parentNode.insertBefore(frag, el);
          }

          // Keep track of all the observers
          for (let o in ctx.__observed__) {
            if (child_bindings.hasOwnProperty(o)) {
              child_bindings[o].push(...ctx.__observed__[o]);
            } else {
              child_bindings[o] = [...ctx.__observed__[o]];
            }
          }

          // Replace the parent context's child bindings with the rendered bindings
          let childIdx = oCtx.__childbindings__.findIndex((b) => b.el === el);
          if (childIdx !== -1) {
            oCtx.__childbindings__[childIdx].bindings = child_bindings;
          }

          // Set the created elements to be removed on the next render
          binding.attrs[attr].created = created;
        };

        binding.attrs[`template-${templateIdx}`].bindings.push(fn);
      }
    };

    const walk = (el, ctx, log) => {
      if (!!el.tagName && (el.tagName || "").toLowerCase() === "template") {
        return bindTemplate(el, ctx);
      }

      let attrs = [...(el.attributes || [])];
      let children = [...(el.childNodes || [])];

      if (el.nodeType === 3) {
        let match;
        while ((match = boundExp.exec(el.textContent)) !== null) {
          bindValue(el, "textContent", match, ctx);
        }
      } else {
        for (var i = 0; i < attrs.length; i++) {
          if (attrExp.test(attrs[i].name)) {
            bindAttribute(el, attrs[i].name, attrs[i].value, ctx);
            // el.setAttribute(attrs[i].name.replace(":", ""), attrs[i].value);
          }

          if (eventExp.test(attrs[i].name)) {
            bindEvent(el, attrs[i].name, attrs[i].value, ctx);
            // el.setAttribute(attrs[i].name);
          }
        }
      }

      children.map((c) => {
        walk(c, ctx, log);
      });
    };

    walk(template, this);
  }

  __get_values__(ctx) {
    let values = {};
    let methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this),
    ).filter((method) => {
      return typeof this[method] === "function";
    });

    for (let i = 0; i < methods.length; i++) {
      if (typeof this[methods[i]] === "function") {
        Object.defineProperty(values, methods[i], {
          get: () => {
            return this[methods[i]].bind(this);
          },
        });
      }
    }

    let keys = Object.keys(ctx.__observed__);
    for (let i = 0; i < keys.length; i++) {
      Object.defineProperty(values, keys[i], {
        get: () => {
          return ctx[keys[i]];
        },
      });
    }

    return values;
  }

  __render__(ctx, log) {
    let values = ctx.__get_values__(ctx);

    for (var i = 0; i < ctx.__bindings__.length; i++) {
      let binding = ctx.__bindings__[i];
      let el = binding.el;

      for (let attr in binding.attrs) {
        let { snippet, bindings } = binding.attrs[attr];

        ctx.__current_target__ = { el, attr, snippet, context: ctx, bindings };

        for (let i = 0; i < bindings.length; i++) {
          snippet = bindings[i](snippet, values, attr);
        }

        if (typeof snippet === "function") {
          el[attr.replace(":", "")] = snippet.bind(this);
        } else {
          el[attr.replace(":", "")] = snippet;
        }

        if (!["array", "object", "function"].includes(typeof snippet)) {
          if (!binding.hidden && !!el.setAttribute) {
            el.setAttribute(attr.replace(":", ""), snippet);
          }
        }
      }
    }

    // console.log(ctx.__bindings__);
    // console.log(ctx.__observed__);

    ctx.__current_target__ = null;
  }
}

// Simple subscribable storage, there's better out there you should probably use them
class Context {
  constructor(obj) {
    this.values = { ...obj };
    this.subscriptions = Object.keys(obj).reduce((a, c) => {
      a[c] = [];
      return a;
    }, {});

    this.handles = {};

    let props = Object.keys(obj);
    for (var i = 0; i < props.length; i++) {
      let prop = props[i];

      var p = {};
      p[prop] = {
        get: () => {
          return this.values[prop];
        },

        set: (value) => {
          const subscribers = this.subscriptions[prop];
          const oldValue = this.values[prop];

          this.values[prop] = value;
          for (let i = 0; i < subscribers.length; i++) {
            subscribers[i](value, oldValue);
          }
        },
      };

      Object.defineProperties(this, p);
    }
  }

  listen(key, fn, handle) {
    if (!this.subscriptions.hasOwnProperty(key)) {
      console.log("Can not subscribe, no key exists");
      return;
    }

    if (!!handle) {
      if (this.handles.hasOwnProperty(handle)) {
        console.warn(
          `handle ${handle} already exists, you may be trying to subscribe more than once`,
        );
        return;
      }
    } else {
      // console.warn(
      //   `it is highly recommended you use a handler when subscribing`,
      // );
    }

    this.subscriptions[key].push(fn);

    if (!!handle) {
      this.handles[handle] = fn;
    }
  }

  unlisten(key, fn, handle) {
    if (!!handle) {
      fn = this.handles[handle];
    }

    let idx = this.subscriptions[key].findIndex((f) => f === fn);

    if (idx !== -1) {
      this.subscriptions.splice(idx, 1);
    }
  }

  createListenable(prop, value) {
    if (this.hasOwnProperty(key)) {
      console.warn(`Watched key ${key} already exists`);
      return;
    }

    this.values[prop] = value;
    this.subscriptions[prop] = [];

    var p = {};
    p[prop] = {
      get: () => {
        return this.values[prop];
      },

      set: (value) => {
        const subscribers = this.subscriptions[prop];
        const oldValue = this.values[prop];

        this.values[prop] = value;
        for (let i = 0; i < subscribers.length; i++) {
          subscribers(value, oldValue);
        }
      },
    };

    Object.defineProperties(this, p);
  }
}
