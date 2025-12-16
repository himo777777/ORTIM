import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = useAdminUsers({
    skip: page * 20,
    take: 20,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleCreateUser = async (formData: FormData) => {
    try {
      await createUser.mutateAsync({
        personnummer: formData.get('personnummer') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: (formData.get('email') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
        role: (formData.get('role') as string) || 'PARTICIPANT',
        workplace: (formData.get('workplace') as string) || undefined,
        speciality: (formData.get('speciality') as string) || undefined,
      });
      setShowCreateForm(false);
      toast({ title: 'Användare skapad' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kunde inte skapa användare';
      toast({ title: 'Fel', description: message, variant: 'destructive' });
    }
  };

  const handleUpdateUser = async (id: string, formData: FormData) => {
    try {
      await updateUser.mutateAsync({
        id,
        data: {
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          email: (formData.get('email') as string) || undefined,
          phone: (formData.get('phone') as string) || undefined,
          role: formData.get('role') as string,
          workplace: (formData.get('workplace') as string) || undefined,
          speciality: (formData.get('speciality') as string) || undefined,
        },
      });
      setEditingUser(null);
      toast({ title: 'Användare uppdaterad' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kunde inte uppdatera användare';
      toast({ title: 'Fel', description: message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
      toast({ title: 'Användare borttagen' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kunde inte ta bort användare';
      toast({ title: 'Fel', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till admin
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Användarhantering
          </h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} användare totalt
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny användare
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Skapa ny användare</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <UserForm
              onSubmit={handleCreateUser}
              isLoading={createUser.isPending}
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök användare..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alla roller" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alla roller</SelectItem>
            <SelectItem value="PARTICIPANT">Deltagare</SelectItem>
            <SelectItem value="INSTRUCTOR">Instruktör</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Personnummer</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Registrerad</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Inga användare hittades
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user) => (
                    <TableRow key={user.id}>
                      {editingUser === user.id ? (
                        <TableCell colSpan={6}>
                          <UserForm
                            initialData={{
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email || '',
                              phone: user.phone || '',
                              role: user.role,
                              workplace: user.workplace || '',
                              speciality: user.speciality || '',
                            }}
                            onSubmit={(formData) => handleUpdateUser(user.id, formData)}
                            isLoading={updateUser.isPending}
                            onCancel={() => setEditingUser(null)}
                            isEdit
                          />
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              {user.workplace && (
                                <p className="text-xs text-muted-foreground">{user.workplace}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{user.personnummer}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'INSTRUCTOR' ? 'secondary' : 'outline'}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingUser(user.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingUser({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Visar {page * 20 + 1} - {Math.min((page + 1) * 20, data.total)} av {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Föregående
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * 20 >= data.total}
              onClick={() => setPage(p => p + 1)}
            >
              Nästa
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort användare?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {deletingUser?.name}? Detta går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Ta bort'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
  isEdit,
}: {
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    workplace: string;
    speciality: string;
  };
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="personnummer">Personnummer *</Label>
          <Input id="personnummer" name="personnummer" placeholder="YYYYMMDD-XXXX" required />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="firstName">Förnamn *</Label>
        <Input id="firstName" name="firstName" defaultValue={initialData?.firstName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Efternamn *</Label>
        <Input id="lastName" name="lastName" defaultValue={initialData?.lastName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input id="email" name="email" type="email" defaultValue={initialData?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" defaultValue={initialData?.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Roll</Label>
        <Select name="role" defaultValue={initialData?.role || 'PARTICIPANT'}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PARTICIPANT">Deltagare</SelectItem>
            <SelectItem value="INSTRUCTOR">Instruktör</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="workplace">Arbetsplats</Label>
        <Input id="workplace" name="workplace" defaultValue={initialData?.workplace} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="speciality">Specialitet</Label>
        <Input id="speciality" name="speciality" defaultValue={initialData?.speciality} />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : isEdit ? (
            'Spara ändringar'
          ) : (
            'Skapa användare'
          )}
        </Button>
      </div>
    </form>
  );
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'INSTRUCTOR':
      return 'Instruktör';
    case 'PARTICIPANT':
      return 'Deltagare';
    default:
      return role;
  }
}
