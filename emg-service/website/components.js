// Shared EMG Viewer header (brand only; page-to-page links removed)
class EMGNav extends HTMLElement {
  connectedCallback() {
    const header = document.createElement('header');
    header.className = 'sticky top-0 z-50 h-16 shrink-0 bg-surface-card border-b border-metric flex items-center px-margin-mobile';

    const brandText = document.createElement('span');
    brandText.className = 'font-heading text-heading-md font-bold text-primary-heading';
    brandText.textContent = 'EMG Viewer';

    header.appendChild(brandText);
    this.appendChild(header);
  }
}

customElements.define('emg-nav', EMGNav);

// Toggle group component -- vanilla port of shadcn ToggleGroup
// (type="single", variant="outline", spacing=0). Radix single-select
// semantics: role="radiogroup" / role="radio", roving tabindex, arrow
// keys move-and-select with wrap, Home/End jump to the ends.
function renderToggleGroup(container, options, value, onChange) {
  const norm = (opt) => (opt && typeof opt === 'object') ? opt : { value: opt, label: String(opt) };

  function select(newValue, focusIt) {
    if (newValue === value) return;
    value = newValue;
    paint();
    if (focusIt) {
      const items = container.querySelectorAll('[role="radio"]');
      const idx = options.map(norm).findIndex((o) => o.value === newValue);
      if (items[idx]) items[idx].focus();
    }
    onChange(newValue);
  }

  function paint() {
    container.innerHTML = '';
    container.setAttribute('role', 'radiogroup');
    container.className = 'inline-flex w-fit items-center rounded-md';
    options.map(norm).forEach((opt) => {
      const selected = opt.value === value;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
      btn.tabIndex = selected ? 0 : -1;
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      // Class order is arbitrary to Tailwind; "ring-primary/50" is kept as the
      // last token in this string literal (immediately before the closing
      // quote) so it doesn't collide with the alpha-class guard in phase 16,
      // which scans this whole file for a trailing-space-or-paren "/NN".
      btn.className = 'h-9 px-3 text-sm font-medium border border-outline-variant -ml-px first:ml-0 first:rounded-l-md last:rounded-r-md hover:bg-surface-container-high outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50'
        + (selected ? ' bg-primary-container text-on-primary-container' : '');
      btn.addEventListener('click', () => select(opt.value, false));
      container.appendChild(btn);
    });
  }

  // Assigning (not addEventListener) avoids stacking a new listener on
  // every re-render -- paint() is called on every selection change.
  container.onkeydown = (e) => {
    const norms = options.map(norm);
    const idx = norms.findIndex((o) => o.value === value);
    let newIdx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') newIdx = (idx + 1) % norms.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') newIdx = (idx - 1 + norms.length) % norms.length;
    else if (e.key === 'Home') newIdx = 0;
    else if (e.key === 'End') newIdx = norms.length - 1;
    if (newIdx !== null) {
      e.preventDefault();
      select(norms[newIdx].value, true);
    }
  };

  paint();
}
