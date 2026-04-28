import { JoodWordmark } from "./Logo";

/**
 * Mounts at the top of the Payload sidebar via
 * admin.components.beforeNavLinks. Gives the dashboard a proper brand
 * area where the previous version was just an empty band with the
 * collapse arrow floating in it.
 */
export function SidebarBrand() {
  return (
    <div className="jood-sidebar-brand">
      <JoodWordmark className="jood-sidebar-brand__mark" />
      <span className="jood-sidebar-brand__suffix">CMS</span>
    </div>
  );
}

export default SidebarBrand;
