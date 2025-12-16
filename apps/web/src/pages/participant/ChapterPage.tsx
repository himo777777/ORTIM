import { useParams } from 'react-router-dom';

export default function ChapterPage() {
  const { slug } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Kapitel: {slug}</h1>
      <p className="text-muted-foreground">
        Kapitelinnehåll kommer att laddas här...
      </p>
    </div>
  );
}
