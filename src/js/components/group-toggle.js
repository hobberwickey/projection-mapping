export default class FXSlider extends HTMLElement {
  static observedAttributes = ["state"];

  constructor() {
    super();
  }

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <input
        class="${this.prod}"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value="0.5"
        class="uk-range opacity"
      />
    `;
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

customElements.define("fx-slider", MyCustomElement);
