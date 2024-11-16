export default class GroupToggle extends HTMLElement {
  static observedAttributes = ["state"];

  constructor() {
    super();
  }

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <div class='row toggle'>
        <div>
          <input 
            class='uk-checkbox' 
            type='checkbox' 
            checked=${} disabled value="${groupIdx}"  />
        </div>
      </div>
    `
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed.`);
  }
}

customElements.define("my-custom-element", MyCustomElement);