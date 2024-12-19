class Component extends HTMLElement {
  constructor() {
    super();
    this.__connected__ = false;
    this.__bindings__ = {};
    this.__useShadow__ = false;
  }

  static get observedAttributes() {
    return [];
  }

  static get observedProperties() {
    return [];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    let fnName = "on" + name.charAt(0).toUpperCase() + name.slice(1);

    if (!!this[fnName]) {
      this[fnName](newValue, oldValue);
    } else {
      if (!!this.on && typeof this.on === "function") {
        this.on(fnName, newValue, oldValue);
      }
    }
  }

  bind(element, targetAttr, boundAttr, fn) {
    var bindings = this.__bindings__[targetAttr];

    if (!bindings) {
      bindings = [{ element: element, attr: boundAttr, fn: fn || null }];
      this.__bindings__[targetAttr] = bindings;
    } else {
      var existing = bindings.filter((b) => {
        return b.element === element && b.attr === boundAttr;
      })[0];
      if (!existing) {
        bindings.push({ element: element, attr: boundAttr, fn: fn || null });
      } else {
        console.warn("Binding already exists", element, targetAttr, boundAttr);
      }
    }
  }

  fire(evtType, data) {
    let evt = new CustomEvent(evtType, { detail: data });
    this.dispatchEvent(evt);
  }

  __push_bindings__(attr) {
    var bindings = this.__bindings__[attr];

    if (!!bindings) {
      bindings.map((binding) => {
        var val =
          binding.fn === null
            ? this[attr]
            : binding.fn(binding.element, binding.attr);

        if (
          binding.element.nodeType !== 3 &&
          binding.element.hasAttribute(binding.attr)
        ) {
          binding.element.setAttribute(binding.attr, val);
        } else {
          binding.element[binding.attr] = val;
        }
      });
    }
  }

  __connect__(name) {
    if (!this.__connected__) {
      this.__connected__ = true;
      this.constructor.observedAttributes.map((attr) => {
        if (!this.hasOwnProperty(attr)) {
          var prop = {};
          prop[attr] = {
            get: () => {
              return this.getAttribute(attr);
            },
            set: (value) => {
              this.setAttribute(attr, value);
              this.__push_bindings__(attr);
            },
          };

          Object.defineProperties(this, prop);
        }
      });

      this.constructor.observedProperties.map((attr) => {
        var prop = {};
        prop[attr] = {
          get: () => {
            return this[`_${attr}`];
          },
          set: (value) => {
            var oldValue = this[`_${attr}`];
            this[`_${attr}`] = value;
            this.attributeChangedCallback(attr, oldValue, value);
            this.__push_bindings__(attr);
          },
        };

        Object.defineProperties(this, prop);
      });

      if (this.__useShadow__) {
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(
          document.querySelector("#" + name).content.cloneNode(true),
        );
      } else {
        var template = document
            .querySelector("#" + name)
            .content.cloneNode(true),
          parsedTemplate = this.__parseTemplate__(template);

        // this.appendChild(document.querySelector("#" + name).content.cloneNode(true))
        this.appendChild(parsedTemplate);
      }

      this.constructor.observedProperties.map((attr) => {
        if (!!this[attr]) {
          this[attr] = this[attr];
        }
      });

      this.constructor.observedAttributes.map((attr) => {
        if (!!this[attr]) {
          this[attr] = this[attr];
        }
      });

      if (!!this.firstConnected) {
        this.firstConnected();
      }
    }
  }

  __parseTemplate__(template) {
    const eventExp = /on\-([a-z|A-Z]+)/;
    const boundExp = /\{\{([\s|a-z|A-Z|\$|_|\d|\.|\'|\"]+)\}\}/g;

    const attachEvents = (el, evt, val) => {
      let evtName = evt.match(eventExp)[1];
      (args = val
        .match(new RegExp(boundExp, ""))[1]
        .split(" ")
        .filter((arg) => arg.trim() !== "")),
        (fnName = args[0]),
        (fnArgs = args.slice(1));

      if (!fnName) {
        console.warn("bound event calls no method");
        return;
      }

      if (!this[fnName]) {
        console.warn("bound event calls unknown method");
        return;
      }

      fnArgs = fnArgs.map((arg) => {
        if (/^[\'\"].*[\'\"]$/.test(arg)) {
          return arg.replace(/\'|\"/g, "");
        }

        if (!isNaN(+arg)) {
          return +arg;
        }

        if (this.hasOwnProperty(arg)) {
          return () => {
            return this[arg];
          };
        }
      });

      el.addEventListener(evtName, () => {
        var callingArgs = fnArgs.map((arg) => {
          if (typeof arg === "function") {
            return arg();
          } else {
            return arg;
          }
        });

        this[fnName](...callingArgs);
      });
    };

    var bindValue = (el, attr, val, tmpl) => {
      var bindingAttr = val.trim().split(".")[0];

      this.bind(el, bindingAttr, attr.trim(), (el, attr) => {
        let match;
        let results = tmpl;
        while ((match = boundExp.exec(tmpl)) !== null) {
          let value = match[1]
            .trim()
            .split(".")
            .reduce((obj, prop) => {
              return obj && obj.hasOwnProperty(prop) ? obj[prop] : undefined;
            }, this);

          results = results.replace(match[0], value || "");
        }

        return results;
      });
    };

    var walk = (el) => {
      var attrs = [...(el.attributes || [])],
        children = [...(el.childNodes || [])];

      if (el.nodeType === 3) {
        let match;
        while ((match = boundExp.exec(el.textContent)) !== null) {
          bindValue(el, "textContent", match[1], el.textContent);
        }
      } else {
        attrs.map((a) => {
          let match;
          while ((match = boundExp.exec(a.value)) !== null) {
            if (eventExp.test(a.name)) {
              attachEvents(el, a.name, a.value);
            } else {
              bindValue(el, a.name, match[1], a.value);
            }
          }
        });
      }

      children.map((c) => {
        walk(c);
      });
    };

    walk(template);

    return template;
  }
}

module.exports = Component;
