import { useParams } from 'react-router-dom';

export default function CohortDetailPage() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Kohort: {id}</h1>
      <p className="text-muted-foreground">Kohortdetaljer kommer snart...</p>
    </div>
  );
}
