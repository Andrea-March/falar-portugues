import { notFound } from 'next/navigation';
import SoundLab from './SoundLab';

// Pagina di servizio per scegliere i suoni: esiste solo in sviluppo (npm run dev)
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <SoundLab />;
}
