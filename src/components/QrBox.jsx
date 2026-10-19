import { fechaHora } from '../utils/format';

/** Patrón tipo QR decorativo (no escaneable) para cuando el código aún no está activo. */
function QrFantasma() {
  const celdas = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const enEsquina = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (!enEsquina && rnd() > 0.52) celdas.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const ojo = (x, y) => (
    <g key={`ojo-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox="-1 -1 23 23" className="qr__fantasma" aria-hidden="true">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      <g fill="currentColor">
        {celdas}
        {ojo(0, 0)}
        {ojo(14, 0)}
        {ojo(0, 14)}
      </g>
    </svg>
  );
}

/**
 * Muestra el código QR de un registro o pedido según su estado:
 * - DISPONIBLE: imagen real (data URL generada por qr-service)
 * - NO_DISPONIBLE: gris con "Disponible al pagar"
 * - ENTREGADO / EXPIRADO: atenuado con la explicación
 */
export function QrBox({ qr, titulo = 'Tu código QR', compacto = false }) {
  const estado = qr?.estado || 'NO_DISPONIBLE';

  if (estado === 'DISPONIBLE' && qr?.qr_imagen_url) {
    return (
      <figure className={`qr qr--activo ${compacto ? 'qr--compacto' : ''}`}>
        <img src={qr.qr_imagen_url} alt={`${titulo}: presentalo en taquilla`} />
        <figcaption>
          <strong>Listo para taquilla</strong>
          <span className="qr__codigo">{qr.codigo}</span>
        </figcaption>
      </figure>
    );
  }

  const mensajes = {
    NO_DISPONIBLE: { t: 'Disponible al pagar', d: 'Tu QR se activa en cuanto se apruebe el pago.' },
    ENTREGADO: { t: 'Código utilizado', d: `Validado en taquilla el ${fechaHora(qr?.fecha_validacion)}.` },
    EXPIRADO: { t: 'Código expirado', d: 'La fecha de la visita ya pasó y el código no se usó.' }
  };
  const m = mensajes[estado] || mensajes.NO_DISPONIBLE;

  return (
    <figure className={`qr qr--inactivo qr--${estado.toLowerCase()} ${compacto ? 'qr--compacto' : ''}`}>
      <div className="qr__marco">
        <QrFantasma />
        <span className="qr__sello">{m.t}</span>
      </div>
      <figcaption>
        <span>{m.d}</span>
      </figcaption>
    </figure>
  );
}
