"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, Badge, Button, Input, Select, Table, PageHeader, Label, Field } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { roles } from "@/lib/industries";
import { useIndustries } from "@/lib/useIndustries";

const perms = ["View", "Create", "Edit", "Approve", "Price", "Submit", "Admin"];
const matrix: Record<string, string[]> = { "Super Admin": perms, "Organization Admin": perms, "Business Development": ["View", "Create", "Edit"], "Tender Manager": ["View", "Create", "Edit", "Submit"], "Technical Manager": ["View", "Edit", "Approve"], Engineer: ["View", "Edit"], "Procurement Manager": ["View", "Create", "Edit", "Approve"], "Commercial Manager": ["View", "Edit", "Price", "Approve"], Finance: ["View", "Price", "Approve"], Legal: ["View", "Edit", "Approve"], Compliance: ["View", "Edit", "Approve"], "Project Manager": ["View", "Create", "Edit"], Reviewer: ["View", "Approve"], Executive: ["View", "Approve"], Viewer: ["View"], "Contractor/Vendor": ["View"] };

export default function Users() {
  const s = useStore(); const industries = useIndustries();
  const [f, setF] = useState({ name: "", email: "", role: "Viewer" });
  return (
    <div className="font-sans">
      <PageHeader title="Users & Roles" sub={`${s.org.name} · ${s.org.plan} plan · ${s.users.length} users. Data is isolated per organisation.`} />
      <Card className="mb-4 p-4"><Label>Organisation</Label><div className="mt-2 flex flex-wrap gap-4 text-[13px]"><span className="text-app-text">{s.org.name}</span><span className="text-app-muted">Industries: {s.org.industries.map((i) => industries.find((x) => x.id === i)?.name).join(", ")}</span><span className="text-app-muted">Base currency: {s.org.currency}</span><Badge tone="accent">{s.org.plan}</Badge></div></Card>
      <Card className="mb-4 flex flex-wrap items-end gap-2 p-4">
        <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field><Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Button variant="primary" onClick={() => { if (f.name) s.addUser({ ...f, active: true }); setF({ name: "", email: "", role: "Viewer" }); }}><Plus size={13} /> Invite user</Button>
      </Card>
      <Table head={["User", "Email", "Role", "Permissions", "Active"]}>
        {s.users.map((u) => <tr key={u.id}><td className="px-3 py-2 text-app-text">{u.name}{u.name === s.currentUser && <Badge tone="accent" className="ml-2">you</Badge>}</td><td className="px-3 py-2 text-app-muted">{u.email}</td><td className="px-3 py-2"><Select className="py-1 text-xs" value={u.role} onChange={(e) => s.updateUser(u.id, { role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></td><td className="px-3 py-2"><div className="flex flex-wrap gap-1">{(matrix[u.role] || ["View"]).map((p) => <Badge key={p} tone="outline">{p}</Badge>)}</div></td><td className="px-3 py-2"><input type="checkbox" checked={u.active} onChange={(e) => s.updateUser(u.id, { active: e.target.checked })} className="accent-[#c8772e]" /></td></tr>)}
      </Table>
      <Card className="mt-4 p-4"><Label className="mb-2">Role permission matrix</Label><div className="overflow-x-auto"><table className="text-xs"><thead><tr><th className="px-2 py-1 text-left text-app-muted">Role</th>{perms.map((p) => <th key={p} className="px-2 py-1 text-app-muted">{p}</th>)}</tr></thead><tbody>{roles.map((r) => <tr key={r} className="border-t border-app-border"><td className="px-2 py-1 text-app-text">{r}</td>{perms.map((p) => <td key={p} className="px-2 py-1 text-center">{matrix[r]?.includes(p) ? <span className="text-app-green">●</span> : <span className="text-app-dim">·</span>}</td>)}</tr>)}</tbody></table></div></Card>
    </div>
  );
}
