import { useState } from 'react';
import { useOrganizationPortal } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Mail,
  Clock,
  AlertTriangle,
  Building,
  Plus,
  Trash2,
  Save,
  Bell,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationSettingsPage() {
  const { data, isLoading, error } = useOrganizationPortal();
  const { toast } = useToast();

  const [reportEnabled, setReportEnabled] = useState(true);
  const [reportFrequency, setReportFrequency] = useState('MONTHLY');
  const [recipients, setRecipients] = useState<Array<{ email: string; name: string }>>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');

  // Note: Report settings are managed by the organization admin
  // The portal dashboard doesn't expose these settings for editing

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Kunde inte ladda inställningar</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const handleAddRecipient = () => {
    if (!newRecipientEmail) return;

    if (!newRecipientEmail.includes('@')) {
      toast({
        title: 'Ogiltig e-post',
        description: 'Ange en giltig e-postadress',
        variant: 'destructive',
      });
      return;
    }

    setRecipients([...recipients, { email: newRecipientEmail, name: newRecipientName }]);
    setNewRecipientEmail('');
    setNewRecipientName('');
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const handleSave = () => {
    // TODO: Implement save functionality via API
    toast({
      title: 'Inställningar sparade',
      description: 'Dina rapportinställningar har uppdaterats',
    });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'WEEKLY':
        return 'Varje vecka';
      case 'BIWEEKLY':
        return 'Varannan vecka';
      case 'MONTHLY':
        return 'Varje månad';
      default:
        return freq;
    }
  };

  const getNextReportDate = () => {
    // Next report date is not available in the portal API
    return 'Kontakta administratör för information';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Inställningar
        </h1>
        <p className="text-muted-foreground mt-1">
          Hantera rapporter och organisationsinställningar
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisationsinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Organisationsnamn</Label>
              <p className="font-medium">{data?.organization?.name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Organisationsnummer</Label>
              <p className="font-medium">{data?.organization?.organizationNumber || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Kontakt-e-post</Label>
              <p className="font-medium">{data?.organization?.contactEmail || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Logo</Label>
              <p className="font-medium">{data?.organization?.logoUrl ? 'Uppladdad' : '-'}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Kontakta administratören för att ändra organisationsinformation.
          </p>
        </CardContent>
      </Card>

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Rapportinställningar
          </CardTitle>
          <CardDescription>
            Konfigurera automatiska utbildningsrapporter till din organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Reports */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktivera automatiska rapporter</Label>
              <p className="text-sm text-muted-foreground">
                Skicka regelbundna sammanfattningar via e-post
              </p>
            </div>
            <Switch
              checked={reportEnabled}
              onCheckedChange={setReportEnabled}
            />
          </div>

          {reportEnabled && (
            <>
              {/* Frequency */}
              <div className="space-y-2">
                <Label>Rapportfrekvens</Label>
                <Select value={reportFrequency} onValueChange={setReportFrequency}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Varje vecka (måndag)</SelectItem>
                    <SelectItem value="BIWEEKLY">Varannan vecka (1:a & 15:e)</SelectItem>
                    <SelectItem value="MONTHLY">Varje månad (1:a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Report */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Nästa rapport skickas: <strong>{getNextReportDate()}</strong>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Recipients */}
      {reportEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Rapportmottagare
            </CardTitle>
            <CardDescription>
              Personer som får de automatiska rapporterna
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Recipients */}
            {recipients.length > 0 && (
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.email}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{recipient.name || recipient.email}</p>
                      {recipient.name && (
                        <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(recipient.email)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Recipient Form */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="E-postadress"
                  type="email"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Namn (valfritt)"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddRecipient}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till
              </Button>
            </div>

            {recipients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Inga mottagare tillagda. Lägg till minst en mottagare för att få rapporter.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Spara inställningar
        </Button>
      </div>
    </div>
  );
}
