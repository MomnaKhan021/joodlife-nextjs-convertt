// Hand-maintained import map for Payload's admin custom components.
// Run `npm run payload -- generate:importmap` to regenerate it whenever
// the admin.components paths in payload.config.ts change.
import { Logo as Logo_jood } from "@/components/admin/Logo";
import { Icon as Icon_jood } from "@/components/admin/Icon";
import { SidebarBrand as SidebarBrand_jood } from "@/components/admin/SidebarBrand";
import { Dashboard as Dashboard_jood } from "@/components/admin/Dashboard";
import { BlobUploadField as BlobUploadField_jood } from "@/components/admin/BlobUploadField";

export const importMap = {
  "@/components/admin/Logo#Logo": Logo_jood,
  "@/components/admin/Icon#Icon": Icon_jood,
  "@/components/admin/SidebarBrand#SidebarBrand": SidebarBrand_jood,
  "@/components/admin/Dashboard#Dashboard": Dashboard_jood,
  "@/components/admin/BlobUploadField#BlobUploadField": BlobUploadField_jood,
};
