import { NextResponse } from 'next/server';
import { HttpCollector } from '../../../lib/collectors/http';

export async function GET() {
  try {
    // Exécution du test sur example.com en utilisant le HTTP Collector
    const result = await HttpCollector.collectGet('https://example.com');
    
    // Retourne le résultat au format JSON
    return NextResponse.json(result);
  } catch (error: any) {
    // Gestion des erreurs
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' }, 
      { status: 500 }
    );
  }
}
