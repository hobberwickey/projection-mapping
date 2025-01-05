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
    // this.__useShadow__ = false;

    // Binding cache
    this.__bindings__ = [];
    this.__childbindings__ = [];
    this.__observed__ = {};
    this.__values__ = {};

    this.__children__ = [];

    // Binding utilities
    this.__current_target__ = null;
  }

  static get observedAttributes() {
    return [];
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

      if (idx === -1) {
        observers.push({
          el: this,
          attr: handle,
          hidden: true,
          context: "",
          bindings: [
            (context, values) => {
              return fn(values[key]);
            },
          ],
        });
      } else {
        observers.splice(idx, 1, {
          el: this,
          attr: handle,
          hidden: true,
          context: "",
          bindings: [
            (context, values) => {
              return fn(values[key]);
            },
          ],
        });
      }
    }
  }

  observe(prop) {
    this.__observed__[prop] = [];
    this.__values__[prop] = this[prop];

    let p = {};

    p[prop] = {
      get: () => {
        if (
          this.__current_target__ !== null &&
          this.__observed__.hasOwnProperty(prop)
        ) {
          let { el, attr, context, bindings } = this.__current_target__;

          // console.log(el, attr, context);

          let observers = this.__observed__[prop];
          let idx = observers.findIndex((o) => o.el === el && o.attr === attr);

          if (idx === -1) {
            observers.push({ ...this.__current_target__ });
          } else {
            observers.splice(idx, 1, { ...this.__current_target__ });
          }
        }

        return this.__values__[prop];
      },
      set: (value) => {
        if (value !== this.__values__[prop]) {
          this.__values__[prop] = value;

          let observers = this.__observed__[prop] || [];
          let len = observers.length;

          let values = this.__get_values__();
          for (var i = 0; i < len; i++) {
            let { el, attr, hidden, context, bindings } = observers[i];

            for (let i = 0; i < bindings.length; i++) {
              context = bindings[i](context, values);
            }

            el[attr.replace(":", "")] = context;

            if (!["array", "object", "function"].includes(typeof context)) {
              if (!hidden && !!el.setAttribute) {
                el.setAttribute(attr.replace(":", ""), context);
              }
            }
          }
        }
      },
    };

    try {
      Object.defineProperties(this, p);
    } catch (e) {
      console.log("Error defining properties", this, e);
    }
  }

  connectedCallback() {
    const name = this.tagName.toLowerCase();

    if (!this.__connected__) {
      this.__connected__ = true;

      // if (this.__useShadow__) {
      //   if (typeof __template__ !== "undefined") {
      //     let template = __template__.content.cloneNode(true);

      //     const shadowRoot = this.attachShadow({ mode: "open" });
      //     shadowRoot.appendChild(template);
      //   }
      // } else {

      this.__children__ = [...this.children];
      if (!!ComponentRegistry.templates[name]) {
        let template =
          ComponentRegistry.templates[name].content.cloneNode(true);

        this.__parseTemplate__(template);
        this.appendChild(template);
      }

      // console.log(this, this.constructor.observedProperties);
      this.constructor.observedProperties.map((prop) => {
        this.observe(prop);
      });

      // Object.keys(this.__observed__).map((key) => {
      //   if (this.hasAttribute(key)) {
      //     this[key] = this.getAttribute(key);
      //   }
      // });

      this.__render__(this);

      if (!!this.connected) {
        this.connected();
      }
    }
  }

  __parseTemplate__(template) {
    const eventExp = /\@([a-z|A-Z]+)/;
    const attrExp = /\:([a-z|A-Z]+)/;
    const boundExp = /\{\{(.*?)\}\}/g;

    const getBinding = (el, attr, ctx) => {
      let binding;
      try {
        binding = ctx.__bindings__.find((b) => b.el === el);
      } catch (e) {
        console.log(ctx);
      }
      if (!binding) {
        binding = {
          el: el,
          created: [],
          attrs: {},
        };

        ctx.__bindings__.push(binding);
      }

      if (!binding.attrs[attr]) {
        let context;
        if (attr === "template") {
          context = el.querySelector("template");
        } else {
          context = el[attr];
          if (!!el.getAttribute) {
            context = el.getAttribute(attr);
          }
        }

        binding.attrs[attr] = {
          context: context,
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
        let values = ctx.__get_values__();

        values["$event"] = e;
        fn(values);
      });
    };

    const createTemplateContext = (oCtx, idx, key, value) => {
      let values = {};
      let observed = {};

      for (var x in oCtx.__observed__) {
        observed[x] = [];
      }

      let ctx = {
        __bindings__: [],
        __observed__: observed,
        __childbindings__: [],
        __values__: values,
        __template__: null,
        __current_target: null,
        __parent__: oCtx,
        __current_target__: null,

        __get_values__: function () {
          return values;
        },
      };

      for (let x in oCtx.__values__) {
        Object.defineProperty(values, x, {
          get: () => {
            if (
              ctx.__current_target__ !== null &&
              ctx.__observed__.hasOwnProperty(x)
            ) {
              let { el, attr, context, bindings } = ctx.__current_target__;

              let observers = ctx.__observed__[x];
              let idx = observers.findIndex(
                (o) => o.el === el && o.attr === attr,
              );

              if (idx === -1) {
                observers.push({ ...ctx.__current_target__ });
              } else {
                observers.splice(idx, 1, { ...ctx.__current_target__ });
              }
            }

            return oCtx.__values__[x];
          },
        });
      }

      Object.defineProperties(values, {
        $idx: {
          get: () => {
            return idx;
          },
        },
        $key: {
          get: () => {
            return key;
          },
        },
        $value: {
          get: () => {
            return value;
          },
        },
      });

      return ctx;
    };

    const bindTemplate = (el, oCtx) => {
      let binding = getBinding(el.parentNode, "template", oCtx);

      let type = el.hasAttribute(":for") ? "loop" : "if";
      if (type === "loop") {
        let context = binding.attrs["template"].context;
        let iteratorFn = new Function(
          `scope`,
          `with(scope) {
            return ${el.getAttribute(":for")}
          }`,
        );

        binding.attrs["template"].bindings.push((snippet, values) => {
          let iterator = iteratorFn(values);
          let frag = document.createDocumentFragment();
          for (let i = 0; i < (binding.created || []).length; i++) {
            let element = binding.created[i];
            element.parentNode.removeChild(element);
          }

          // If this is a __render__ loop render the template
          // to get the bindings, but don't append it
          if (oCtx.__current_target__ !== null) {
            let child_bindings = {};
            let ctx = createTemplateContext(oCtx, 0, null, null);
            let item = context.content.cloneNode(true);

            walk(item, ctx);

            this.__render__(ctx, true);

            for (let o in ctx.__observed__) {
              if (child_bindings.hasOwnProperty(o)) {
                child_bindings[o].push(...ctx.__observed__[o]);
              } else {
                child_bindings[o] = [...ctx.__observed__[o]];
              }
            }

            for (let o in child_bindings) {
              if (oCtx.__observed__.hasOwnProperty(o)) {
                oCtx.__observed__[o].push({
                  el: el,
                  context: null,
                  attr: "for-loop",
                  bindings: [
                    (_context, _values) => {
                      let childBindings = oCtx.__childbindings__.find(
                        (b) => b.el === el,
                      );

                      if (!childBindings) {
                        return;
                      }

                      let observers = childBindings.bindings[o] || [];
                      let len = observers.length;

                      for (var i = 0; i < len; i++) {
                        let {
                          el,
                          attr,
                          hidden,
                          context,
                          ctx: child_context,
                          bindings,
                        } = observers[i];

                        let values = child_context.__get_values__();

                        for (let i = 0; i < bindings.length; i++) {
                          context = bindings[i](context, values);
                        }

                        el[attr.replace(":", "")] = context;

                        if (
                          !["array", "object", "function"].includes(
                            typeof context,
                          )
                        ) {
                          if (!hidden && !!el.setAttribute) {
                            el.setAttribute(attr.replace(":", ""), context);
                          }
                        }
                      }
                    },
                  ],
                });
              }
            }

            oCtx.__childbindings__.push({
              el: el,
              bindings: [],
            });
          }

          let created = [];
          if (!!iterator) {
            let idx = 0;
            let child_bindings = {};
            for (let key in iterator) {
              let ctx = createTemplateContext(oCtx, idx, key, iterator[key]);
              // Clone the template
              let item = context.content.cloneNode(true);

              // Create bindings
              walk(item, ctx);

              // Keep track of created items
              created.push(...item.children);

              // append then render
              frag.append(item);
              this.__render__(ctx, true);

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

            let childIdx = oCtx.__childbindings__.findIndex((b) => b.el === el);
            if (childIdx !== -1) {
              oCtx.__childbindings__[childIdx].bindings = child_bindings;
            }
          }

          // Set the created elements to be removed on the next render
          binding.created = created;

          // If this the template is being rendered create bindings on the parent scope

          el.parentNode.insertBefore(frag, el);
        });
      }
    };

    const walk = (el, ctx) => {
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
        walk(c, ctx);
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

    let keys = Object.keys(this.__observed__);
    let callable = [...keys, ...methods];

    for (let i = 0; i < callable.length; i++) {
      if (typeof this[callable[i]] === "function") {
        Object.defineProperty(values, callable[i], {
          get: () => {
            return this[callable[i]].bind(this);
          },
        });
      } else {
        Object.defineProperty(values, callable[i], {
          get: () => {
            return this[callable[i]];
          },
        });
      }
    }

    return values;
  }

  __render__(ctx, log) {
    let values = ctx.__get_values__();

    for (var i = 0; i < ctx.__bindings__.length; i++) {
      let binding = ctx.__bindings__[i];
      let el = binding.el;

      for (let attr in binding.attrs) {
        let { context, bindings } = binding.attrs[attr];

        ctx.__current_target__ = { el, attr, context, ctx, bindings };

        for (let i = 0; i < bindings.length; i++) {
          context = bindings[i](context, values);
        }

        el[attr.replace(":", "")] = context;
        if (!["array", "object", "function"].includes(typeof context)) {
          if (!binding.hidden && !!el.setAttribute) {
            el.setAttribute(attr.replace(":", ""), context);
          }
        }
      }
    }

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
      console.warn(
        `it is highly recommended you use a handler when subscribing`,
      );
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
