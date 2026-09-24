// Clinical Hematology Care tokens (Stitch project 38135780472400101). Load after vendor/tailwind/tailwind.js.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        "surface": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        "outline": "#737686",
        "outline-variant": "#c3c6d7",
        "surface-tint": "#EFF6FF",
        "primary": "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        "inverse-primary": "#b4c5ff",
        "secondary": "#006d30",
        "on-secondary": "#ffffff",
        "secondary-container": "#92f5a4",
        "on-secondary-container": "#007233",
        "tertiary": "#00598a",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#1b72ab",
        "on-tertiary-container": "#e6f1ff",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "secondary-fixed": "#95f8a7",
        "secondary-fixed-dim": "#79db8d",
        "on-secondary-fixed": "#00210a",
        "on-secondary-fixed-variant": "#005323",
        "tertiary-fixed": "#cde5ff",
        "tertiary-fixed-dim": "#94ccff",
        "on-tertiary-fixed": "#001d32",
        "on-tertiary-fixed-variant": "#004b74",
        "background": "#f8f9ff",
        "on-background": "#0b1c30",
        "surface-variant": "#d3e4fe",
        "surface-canvas": "#F8FAFC",
        "surface-card": "#FFFFFF",
        "border-hairline": "#F1F5F9",
        "border-metric": "#E2E8F0",
        "primary-focus": "#1D4ED8",
        "primary-heading": "#1E40AF",
        "emerald-bg": "#DCFCE7",
        "emerald-text": "#16A34A",
        "emerald-hover": "#166534",
        "alert-info-bg": "#F0F9FF",
        "alert-info-border": "#BAE6FD",
        "alert-warning-bg": "#FEF3C7",
        "alert-warning-text": "#B45309",
        "alert-danger-bg": "#FEF2F2",
        "alert-danger-text": "#B91C1C",
        "danger-cta": "#DC2626"
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
        "heading": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
        // aliases for class names emitted by components.js
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"]
      },
      fontSize: {
        "display-hero": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-hero-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "heading-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "heading-md": ["18px", { lineHeight: "26px", fontWeight: "600" }],
        "heading-sm": ["16px", { lineHeight: "22px", fontWeight: "700" }],
        "body-default": ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "body-medium": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "metric-value": ["15px", { lineHeight: "20px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-badge": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "label-meta": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-subtext": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }],
        // aliases for class names emitted by components.js
        "headline-md": ["18px", { lineHeight: "26px", fontWeight: "600" }],
        "label-caps": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }]
      },
      borderRadius: {
        "sm": "0.25rem",
        "DEFAULT": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "1.5rem",
        "gutter-mobile": "1rem",
        "margin": "2rem",
        "margin-mobile": "1rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem"
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "cta": "0 10px 15px -3px rgba(37, 99, 235, 0.12), 0 4px 6px -4px rgba(37, 99, 235, 0.08)",
        "focus": "0 0 0 3px #DBEAFE"
      },
      maxWidth: {
        "content": "1280px"
      }
    }
  }
};
