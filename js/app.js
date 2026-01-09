import { UI } from './ui.js';
import { State } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    State.init();
    UI.init();
});
