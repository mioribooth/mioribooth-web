  import ProtectAdmin from "./protect-admin";
  import AdminShell from "./admin-shell";

  export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <ProtectAdmin>
        <AdminShell>{children}</AdminShell>
      </ProtectAdmin>
    );
  }