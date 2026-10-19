import { Star } from 'lucide-react';
import { useState } from 'react';

const TEXTO = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', '¡Excelente!'];

export function Estrellas({ valor, onChange, tamano = 36, soloLectura = false }) {
  const [hover, setHover] = useState(0);
  const mostrado = hover || valor;

  return (
    <div className="estrellas" role={soloLectura ? 'img' : 'radiogroup'} aria-label={`Calificación: ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role={soloLectura ? undefined : 'radio'}
          aria-checked={soloLectura ? undefined : valor === n}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          className={`estrella ${n <= mostrado ? 'estrella--llena' : ''}`}
          disabled={soloLectura}
          onMouseEnter={() => !soloLectura && setHover(n)}
          onMouseLeave={() => !soloLectura && setHover(0)}
          onClick={() => onChange?.(n)}
        >
          <Star size={tamano} strokeWidth={1.6} />
        </button>
      ))}
      {!soloLectura && <span className="estrellas__texto">{TEXTO[mostrado]}</span>}
    </div>
  );
}
