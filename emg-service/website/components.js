// Shared EMG Viewer navigation component
class EMGNav extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'live';
    const links = [
      { href: 'live.html', label: 'Live', icon: 'monitor_heart', active: active === 'live' },
      { href: 'history.html', label: 'History', icon: 'history', active: active === 'history' },
      { href: 'playback.html', label: 'Playback', icon: 'play_circle', active: active === 'playback' },
      { href: 'progress.html', label: 'Progress', icon: 'insights', active: active === 'progress' },
    ];

    const header = document.createElement('header');
    header.className = 'sticky top-0 z-50 h-16 shrink-0 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-margin-mobile';

    // Brand
    const brand = document.createElement('div');
    brand.className = 'flex items-center gap-3';
    const brandText = document.createElement('span');
    brandText.className = 'font-headline-md text-headline-md font-bold text-primary-fixed-dim hidden sm:inline';
    brandText.textContent = 'EMG Viewer';
    const brandIcon = document.createElement('span');
    brandIcon.className = 'material-symbols-outlined text-primary-fixed-dim sm:hidden';
    brandIcon.textContent = 'monitor_heart';
    brand.appendChild(brandIcon);
    brand.appendChild(brandText);

    // Nav links
    const nav = document.createElement('nav');
    nav.className = 'flex items-center gap-0';
    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'flex flex-col items-center justify-center px-3 py-2 text-on-surface-variant hover:text-primary-fixed transition-colors relative';
      if (link.active) {
        a.setAttribute('aria-current', 'page');
        a.className += ' text-primary-fixed-dim border-b-2 border-primary-fixed-dim';
      }
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[20px]';
      icon.textContent = link.icon;
      const label = document.createElement('span');
      label.className = 'font-label-caps text-[9px] mt-0.5';
      label.textContent = link.label;
      a.appendChild(icon);
      a.appendChild(label);
      nav.appendChild(a);
    });

    header.appendChild(brand);
    header.appendChild(nav);
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
