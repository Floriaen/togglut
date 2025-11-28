/**
 * Togglut - A toggle + input Web Component
 *
 * @element togglut-input
 * @attr {string} name - Form field name
 * @attr {number} value - Numeric value
 * @attr {boolean} enabled - Toggle state (on/off)
 * @attr {boolean} disabled - Disable the component
 *
 * @fires change - When toggle state or value changes
 * @csspart container - The main toggle container
 * @csspart input - The number input field
 */
class TogglutInput extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['value', 'name', 'disabled', 'enabled'];
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._enabled = false;
    this._value = 0;
    this._render();
    this._setupEventListeners();
  }

  _render() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, -apple-system, sans-serif;
          width: 120px;
        }

        .togglut {
          display: flex;
          align-items: center;
          position: relative;
          background: #c27b7b;
          border-radius: 28px;
          padding: 8px 12px;
          height: 56px;
          cursor: pointer;
          transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
        }

        :host([enabled]) .togglut {
          background: #7cb342;
        }

        .togglut:focus-within {
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(124, 179, 66, 0.4);
        }

        .input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
        }

        input {
          background: transparent;
          border: none;
          color: #c8e6c9;
          font-family: inherit;
          font-size: 1.25rem;
          font-weight: 500;
          width: 100%;
          outline: none;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }

        :host([enabled]) input {
          opacity: 1;
          pointer-events: auto;
        }

        .knob {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f5f5f5;
          transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        :host([enabled]) .knob {
          left: calc(100% - 48px);
        }
      </style>
      <div class="togglut" part="container" role="switch" aria-checked="false" tabindex="0">
        <span class="knob"></span>
        <div class="input-wrapper">
          <input type="number" part="input" placeholder="0" tabindex="-1" />
        </div>
      </div>
    `;

    this._container = this.shadowRoot.querySelector('.togglut');
    this._input = this.shadowRoot.querySelector('input');
  }

  _setupEventListeners() {
    this._container.addEventListener('click', (e) => {
      if (e.target !== this._input) {
        this._toggleState();
      }
    });

    this._input.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this._input.addEventListener('input', () => {
      this._value = this._input.value === '' ? 0 : Number(this._input.value);
      this._updateFormValue();
      this._dispatchChange();
    });

    this._container.addEventListener('keydown', (e) => {
      if (e.target === this._input) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._toggleState();
      }
    });
  }

  connectedCallback() {
    if (this.hasAttribute('enabled')) {
      this._enabled = true;
      this._updateUI();
    }
    if (this.hasAttribute('value')) {
      this._value = Number(this.getAttribute('value'));
      this._input.value = this._value;
    }
    this._updateFormValue();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'enabled':
        this._enabled = newValue !== null;
        this._updateUI();
        break;
      case 'value':
        this._value = Number(newValue);
        this._input.value = this._value;
        this._updateFormValue();
        break;
      case 'disabled':
        this._container.style.opacity = newValue !== null ? '0.5' : '1';
        this._container.style.pointerEvents = newValue !== null ? 'none' : 'auto';
        break;
    }
  }

  _toggleState() {
    if (this.hasAttribute('disabled')) return;

    this._enabled = !this._enabled;

    if (this._enabled) {
      this.setAttribute('enabled', '');
      if (this._value === 0 && this._input.value === '') {
        this._input.value = '0';
      }
      setTimeout(() => {
        this._input.focus();
        this._input.select();
      }, 50);
    } else {
      this.removeAttribute('enabled');
    }

    this._updateUI();
    this._updateFormValue();
    this._dispatchChange();
  }

  _updateUI() {
    this._container.setAttribute('aria-checked', String(this._enabled));
    this._input.tabIndex = this._enabled ? 0 : -1;
  }

  _updateFormValue() {
    this._internals.setFormValue(this._enabled ? String(this._value) : '0');
  }

  _dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      detail: {
        enabled: this._enabled,
        value: this._enabled ? this._value : null
      }
    }));
  }

  // Public API
  get value() {
    return this._enabled ? this._value : null;
  }

  set value(val) {
    this._value = Number(val);
    this._input.value = this._value;
    this._updateFormValue();
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(val) {
    val ? this.setAttribute('enabled', '') : this.removeAttribute('enabled');
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(val) {
    this.setAttribute('name', val);
  }

  // Form-associated custom element API
  get form() { return this._internals.form; }
  get validity() { return this._internals.validity; }
  get validationMessage() { return this._internals.validationMessage; }
  get willValidate() { return this._internals.willValidate; }
  checkValidity() { return this._internals.checkValidity(); }
  reportValidity() { return this._internals.reportValidity(); }
}

customElements.define('togglut-input', TogglutInput);
