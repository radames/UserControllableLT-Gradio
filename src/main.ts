import styles from './app.css?inline'
import App from './App.svelte'

class DragGanCanvas extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(styles));
    root.appendChild(style);
    const app = new App({
      target: root,
    });

  }
}

customElements.define("draggan-canvas", DragGanCanvas);