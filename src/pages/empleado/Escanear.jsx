import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Keyboard, ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alerta, Boton, Campo } from '../../components/ui';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LECTOR_ID = 'lector-qr';

export default function Escanear() {
  const navigate = useNavigate();
  const lector = useRef(null);
  const [activa, setActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');

  async function detener() {
    if (lector.current?.isScanning) {
      try {
        await lector.current.stop();
      } catch {
        /* ya estaba detenida */
      }
    }
    setActiva(false);
  }

  useEffect(() => () => {
    detener();
  }, []);

  function abrir(valor) {
    const limpio = valor.trim();
    if (!UUID_RE.test(limpio)) {
      setErrorCodigo('Este no es un código del sistema. Debe tener el formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.');
      return false;
    }
    navigate(`/empleado/qr/${limpio.toLowerCase()}`);
    return true;
  }

  async function iniciar() {
    setErrorCamara('');
    setErrorCodigo('');
    try {
      if (!lector.current) lector.current = new Html5Qrcode(LECTOR_ID, { verbose: false });
      setActiva(true);
      await lector.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => {
          const lado = Math.floor(Math.min(w, h) * 0.7);
          return { width: lado, height: lado };
        } },
        async (texto) => {
          await detener();
          if (!abrir(texto)) setErrorCodigo('El QR leído no pertenece al sistema de IRTRA en línea.');
        },
        () => {}
      );
    } catch (err) {
      setActiva(false);
      setErrorCamara(
        String(err).includes('NotAllowed')
          ? 'Permiso de cámara denegado. Actívalo en el navegador o escribe el código abajo.'
          : 'No se pudo abrir la cámara. La cámara requiere HTTPS o localhost. Escribe el código abajo.'
      );
    }
  }

  return (
    <div className="pagina pagina--angosta">
      <header className="encabezado">
        <h1>Escanear código</h1>
        <p className="encabezado__sub">Escanear solo consulta: nada cambia hasta que pulses “Validar y entregar”.</p>
      </header>

      <section className="escaner">
        <div className={`escaner__visor ${activa ? 'escaner__visor--activo' : ''}`}>
          <div id={LECTOR_ID} />
          {!activa && (
            <div className="escaner__reposo">
              <ScanLine size={56} strokeWidth={1.3} />
              <p>Apunta la cámara al QR del cliente</p>
            </div>
          )}
        </div>
        {activa ? (
          <Boton variante="secundario" className="btn--bloque" onClick={detener}>
            <CameraOff size={18} /> Detener cámara
          </Boton>
        ) : (
          <Boton className="btn--bloque btn--grande" onClick={iniciar}>
            <Camera size={20} /> Abrir cámara
          </Boton>
        )}
        {errorCamara && <Alerta tipo="aviso">{errorCamara}</Alerta>}
      </section>

      <form
        className="panel escaner__manual"
        onSubmit={(e) => {
          e.preventDefault();
          setErrorCodigo('');
          abrir(codigo);
        }}
      >
        <h2 className="panel__titulo"><Keyboard size={20} /> ¿No se puede leer el QR?</h2>
        <Campo label="Código impreso bajo el QR" error={errorCodigo} htmlFor="codigo-manual">
          <input id="codigo-manual" autoComplete="off" spellCheck="false" placeholder="3f1c2b7e-…"
            value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </Campo>
        <Boton type="submit" variante="secundario" disabled={!codigo.trim()}>Consultar código</Boton>
      </form>
    </div>
  );
}
