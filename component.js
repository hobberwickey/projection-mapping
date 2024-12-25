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

  listen(key, handle, fn) {
    if (this.__observed__.hasOwnProperty(key)) {
      let observers = this.__observed__[key];
      let idx = observers.findIndex((o) => o.el === this && o.attr === handle);

      if (idx === -1) {
        observers.push({ el: this, attr: handle, context: "", bindings: [fn] });
      } else {
        observers.splice(idx, 1, {
          el: this,
          attr: handle,
          context: "",
          bindings: [fn],
        });
      }
    }
  }

  unlisten(key, handle, fn) {
    if (this.__observed__.hasOwnProperty(key)) {
      let observers = this.__observed__[prop];
      let idx = observers.findIndex((o) => o.el === this && o.attr === handle);

      if (idx !== -1) {
        observers.splice(idx, 1);
      }
    }
  }

  connectedCallback(args) {
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

      console.log(this.children);

      if (!!ComponentRegistry.templates[name]) {
        let template =
          ComponentRegistry.templates[name].content.cloneNode(true);

        this.__parseTemplate__(template);
        this.appendChild(template);
      }
      // }

      // this.constructor.observedAttributes.map((prop) => {
      //   if (!this.hasOwnProperty(prop)) {
      //     this.__observed__[prop] = [];

      //     let p = {};
      //     p[prop] = {
      //       get: () => {
      //         if (
      //           this.__current_target__ !== null &&
      //           this.__observed__.hasOwnProperty(prop)
      //         ) {
      //           let { el, attr, context, bindings } = this.__current_target__;
      //           let observers = this.__observed__[prop];
      //           let idx = observers.findIndex(
      //             (o) => o.el === el && o.attr === attr,
      //           );

      //           if (idx === -1) {
      //             observers.push({ ...this.__current_target__ });
      //           } else {
      //             observers.splice(idx, 1, { ...this.__current_target__ });
      //           }
      //         }

      //         return this.__values__[prop];
      //       },
      //       set: (value) => {
      //         if (value !== this.__values__[prop]) {
      //           this.__values__[prop] = value;

      //           let observers = this.__observed__[prop] || [];
      //           let len = observers.length;

      //           let values = this.__get_values__();
      //           for (var i = 0; i < len; i++) {
      //             let { el, attr, context, bindings } = observers[i];

      //             for (let i = 0; i < bindings.length; i++) {
      //               context = bindings[i](context, values);
      //             }

      //             el.setAttribute(attr.replace(":", ""), context);
      //           }
      //         }
      //       },
      //     };

      //     Object.defineProperties(this, p);
      //   }
      // });

      this.constructor.observedProperties.map((prop) => {
        if (!this.hasOwnProperty(prop)) {
          this.__observed__[prop] = [];

          var p = {};
          p[prop] = {
            get: () => {
              if (
                this.__current_target__ !== null &&
                this.__observed__.hasOwnProperty(prop)
              ) {
                let { el, attr, context, bindings } = this.__current_target__;
                let observers = this.__observed__[prop];
                let idx = observers.findIndex(
                  (o) => o.el === el && o.attr === attr,
                );

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
                  let { el, attr, context, bindings } = observers[i];

                  for (let i = 0; i < bindings.length; i++) {
                    context = bindings[i](context, values);
                  }

                  console.log(prop, el);

                  el[attr.replace(":", "")] = context;
                }
              }
            },
          };

          Object.defineProperties(this, p);
        }
      });

      Object.keys(this.__observed__).map((key) => {
        if (this.hasAttribute(key)) {
          this[key] = this.getAttribute(key);
        }
      });

      this.__render__();

      if (!!this.connected) {
        this.connected();
      }
    }
  }

  __parseTemplate__(template) {
    const eventExp = /\@([a-z|A-Z]+)/;
    const attrExp = /\:([a-z|A-Z]+)/;
    const boundExp = /\{\{(.*?)\}\}/g;

    const getBinding = (el, attr) => {
      let binding = this.__bindings__.find((b) => b.el === el);
      if (!binding) {
        binding = {
          el: el,
          attrs: {},
        };

        this.__bindings__.push(binding);
      }

      if (!binding.attrs[attr]) {
        let context = el[attr];
        if (!!el.getAttribute) {
          context = el.getAttribute(attr);
        }

        binding.attrs[attr] = {
          context: context,
          bindings: [],
        };
      }

      return binding;
    };

    const bindValue = (el, attr, match) => {
      let binding = getBinding(el, attr);

      if (attr === "textContent") {
        let fn = new Function(
          "scope",
          `
          with(scope) {
            return ${match[1]}
          }`,
        );

        binding.attrs[attr].bindings.push((ctx, values) => {
          return ctx.replace(match[0], fn(values));
        });
      }
    };

    const bindAttribute = (el, attr, context) => {
      let binding = getBinding(el, attr);

      let fn = new Function(
        "scope",
        `
        with(scope) {
          return ${context}
        }`,
      );

      binding.attrs[attr].bindings.push((ctx, values) => {
        return fn(values);
      });
    };

    const bindEvent = (el, attr, context) => {
      let fn = new Function(
        "scope",
        `          
        with(scope) {
          return ${context}
        }`,
      );

      el.addEventListener(attr.replace("@", ""), (e) => {
        let values = this.__get_values__();
        fn(values);
      });
    };

    const walk = (el) => {
      let attrs = [...(el.attributes || [])];
      let children = [...(el.childNodes || [])];

      if (el.nodeType === 3) {
        let match;
        while ((match = boundExp.exec(el.textContent)) !== null) {
          bindValue(el, "textContent", match, el.textContent);
        }
      } else {
        for (var i = 0; i < attrs.length; i++) {
          if (attrExp.test(attrs[i].name)) {
            bindAttribute(el, attrs[i].name, attrs[i].value);
            // el.removeAttribute(attrs[i].name);
          }

          if (eventExp.test(attrs[i].name)) {
            bindEvent(el, attrs[i].name, attrs[i].value);
            // el.removeAttribute(attrs[i].name);
          }
        }
      }

      children.map((c) => {
        walk(c);
      });
    };

    walk(template);
  }

  __get_values__() {
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

  __render__() {
    let values = this.__get_values__();

    for (var i = 0; i < this.__bindings__.length; i++) {
      let binding = this.__bindings__[i];
      let el = binding.el;

      for (let attr in binding.attrs) {
        let { context, bindings } = binding.attrs[attr];

        this.__current_target__ = { el, attr, context, bindings };

        for (let i = 0; i < bindings.length; i++) {
          context = bindings[i](context, values);
        }

        el[attr.replace(":", "")] = context;
      }
    }

    this.__current_target__ = null;
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

    for (var prop in obj) {
      this[prop] = {
        get: (key) => {
          return this.values[key];
        },

        set: (key, value) => {
          const subscribers = this.subscriptions(key);
          const oldValue = this.values[key];

          this.values[key] = value;
          for (let i = 0; i < subscribers.length; i++) {
            subscribers(value, oldValue);
          }
        },
      };
    }
  }

  subscribe(key, fn, handle) {
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
        "it is highly recommended you use a handler when subscribing",
      );
    }

    this.subscriptions[key].push(fn);

    if (!!handle) {
      this.handles[handle] = fn;
    }
  }

  unsubscribe(key, fn, handle) {
    if (!!handle) {
      fn = this.handles[handle];
    }

    let idx = this.subscriptions[key].findIndex((f) => f === fn);

    if (idx !== -1) {
      this.subscriptions.splice(idx, 1);
    }
  }

  createWatcher(key, value) {
    if (this.hasOwnProperty(key)) {
      console.warn(`Watched key ${key} already exists`);
      return;
    }

    this.values[key] = value;
    this.subscriptions[key] = [];
    this[key] = {
      get: (key) => {
        return this.values[key];
      },

      set: (key, value) => {
        const subscribers = this.subscriptions(key);
        const oldValue = this.values[key];

        this.values[key] = value;
        for (let i = 0; i < subscribers.length; i++) {
          subscribers(value, oldValue);
        }
      },
    };
  }
}