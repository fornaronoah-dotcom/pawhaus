"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/EmptyState";
import { Users } from "lucide-react";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/lib/admin/roles";
import {
  createUserAction,
  setUserRoleAction,
  setUserActiveAction,
  type UserActionResult,
} from "@/lib/admin-user-actions";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string | null;
};

export function UsersAdmin({
  users,
  canEdit,
  currentUserId,
}: {
  users: AdminUserRow[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction, creating] = useActionState<
    UserActionResult,
    FormData
  >(createUserAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      toast.success("Gebruiker aangemaakt");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  function run(label: string, fn: () => Promise<UserActionResult>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error(res.error ?? "Actie mislukt");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form
          action={formAction}
          className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Naam</label>
            <Input name="name" required placeholder="Voornaam Achternaam" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <Input name="email" type="email" required placeholder="naam@pawhaus.be" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Wachtwoord (min. 10 tekens)</label>
            <Input name="password" type="password" required minLength={10} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Rol</label>
            <select
              name="role"
              defaultValue="editor"
              className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Bezig…" : "Gebruiker toevoegen"}
            </Button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nog geen gebruikers" />
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-2.5 font-medium">Naam</th>
                <th className="px-3 py-2.5 font-medium">E-mail</th>
                <th className="px-3 py-2.5 font-medium">Rol</th>
                <th className="px-3 py-2.5 font-medium">Actief</th>
                <th className="px-3 py-2.5 font-medium">Laatste login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-accent/40 border-t border-border/60 transition-colors"
                >
                  <td className="px-3 py-2.5 font-medium">{u.name}</td>
                  <td className="text-muted-foreground px-3 py-2.5">{u.email}</td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <select
                        value={u.role}
                        disabled={pending}
                        onChange={(e) =>
                          run("Rol gewijzigd", () =>
                            setUserRoleAction(u.id, e.target.value),
                          )
                        }
                        className="border-input h-7 rounded-lg border bg-transparent px-2 text-xs"
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      ROLE_LABELS[u.role]
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <Button
                        size="xs"
                        variant={u.isActive ? "outline" : "secondary"}
                        disabled={pending || u.id === currentUserId}
                        onClick={() =>
                          run(u.isActive ? "Gedeactiveerd" : "Geactiveerd", () =>
                            setUserActiveAction(u.id, !u.isActive),
                          )
                        }
                      >
                        {u.isActive ? "Actief" : "Inactief"}
                      </Button>
                    ) : u.isActive ? (
                      "ja"
                    ) : (
                      "nee"
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 tabular-nums">
                    {u.lastLogin ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
