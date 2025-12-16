import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Brain,
  Timer,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Mock data - will be replaced with real API calls
  const progressData = {
    completedChapters: 5,
    totalChapters: 17,
    dueReviews: 12,
    examReady: false,
    lastActivity: new Date(),
  };

  const progressPercent = Math.round(
    (progressData.completedChapters / progressData.totalChapters) * 100
  );

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Välkommen, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Fortsätt din utbildning inom ortopedisk traumavård.
        </p>
      </div>

      {/* Progress overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kapitel</p>
              <p className="text-2xl font-bold">
                {progressData.completedChapters}/{progressData.totalChapters}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progressPercent}% avklarat</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Att repetera</p>
              <p className="text-2xl font-bold">{progressData.dueReviews}</p>
            </div>
          </div>
          <Link to="/review" className="block mt-4">
            <Button variant="outline" size="sm" className="w-full">
              Starta repetition
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slutexamen</p>
              <p className="text-2xl font-bold">
                {progressData.examReady ? 'Redo' : 'Ej redo'}
              </p>
            </div>
          </div>
          <Link to="/exam" className="block mt-4">
            <Button
              variant={progressData.examReady ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              disabled={!progressData.examReady}
            >
              {progressData.examReady ? 'Ta examen' : 'Slutför kursen först'}
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Certifikat</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <Link to="/certificates" className="block mt-4">
            <Button variant="outline" size="sm" className="w-full">
              Visa certifikat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue learning */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Fortsätt läsa</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Kapitel 5: Arteriella kärlskador</p>
                <p className="text-sm text-muted-foreground">Slutfört</p>
              </div>
            </div>
            <Link
              to="/chapter/kompartmentsyndrom"
              className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <Clock className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Kapitel 6: Kompartmentsyndrom</p>
                <p className="text-sm text-muted-foreground">Pågående - 45% läst</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Senaste aktivitet</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Quiz kapitel 5 - 90%</span>
              <span className="ml-auto text-xs text-muted-foreground">Igår</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Läste kapitel 5</span>
              <span className="ml-auto text-xs text-muted-foreground">Igår</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Repeterade 15 frågor</span>
              <span className="ml-auto text-xs text-muted-foreground">2 dagar sedan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course parts overview */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Kursöversikt</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Del I</h3>
            <p className="font-semibold">Principer och systematik</p>
            <p className="text-sm text-muted-foreground mt-1">3 kapitel</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-full" />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Del II</h3>
            <p className="font-semibold">Specifika tillstånd</p>
            <p className="text-sm text-muted-foreground mt-1">9 kapitel</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[33%]" />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Del III</h3>
            <p className="font-semibold">Praktisk tillämpning</p>
            <p className="text-sm text-muted-foreground mt-1">5 kapitel</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/20 w-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
