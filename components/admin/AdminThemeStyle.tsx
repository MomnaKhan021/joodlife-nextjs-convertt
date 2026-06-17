/**
 * Injects small global CSS tweaks into the Payload admin via
 * admin.components.beforeNavLinks. Used to make the active sidebar item
 * clearly bold/highlighted (Payload's default 600-vs-500 weight difference
 * is too subtle) and to add a hover affordance on nav items.
 *
 * Payload renders the CURRENT collection's nav entry as a non-anchor
 * `div.nav__link` (inactive ones are `a.nav__link`), so `div.nav__link`
 * targets the active item.
 */
export function AdminThemeStyle() {
  const css = `
    /* Active sidebar item — clearly bold + highlighted */
    .nav__wrap div.nav__link {
      background: rgba(20, 46, 42, 0.08);
      border-radius: 6px;
    }
    .nav__wrap div.nav__link .nav__link-label {
      font-weight: 700;
      color: #142e2a;
    }
    /* Clickable (inactive) items: clear hover + pressed feedback */
    .nav__wrap a.nav__link {
      border-radius: 6px;
      transition: background-color 0.12s ease;
    }
    .nav__wrap a.nav__link:hover {
      background: rgba(20, 46, 42, 0.05);
    }
    .nav__wrap a.nav__link:active {
      background: rgba(20, 46, 42, 0.1);
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export default AdminThemeStyle;
