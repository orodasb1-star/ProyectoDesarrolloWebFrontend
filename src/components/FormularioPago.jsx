import { Building2, CreditCard, Landmark, Wallet } from 'lucide-react';
import { useState } from 'react';
import { hoyGuatemala, money } from '../utils/format';
import { Alerta, Boton, Campo, ErrorApi } from './ui';

const METODOS = [
  { id: 'TARJETA', texto: 'Tarjeta', icono: CreditCard },
  { id: 'DEPOSITO', texto: 'Depósito', icono: Landmark },
  { id: 'PAYPAL', texto: 'PayPal', icono: Wallet },
  { id: 'TRANSFERENCIA', texto: 'Transferencia', icono: Building2 }
];

const BANCOS = ['Banco Industrial', 'Banrural', 'BAM', 'G&T Continental', 'Banco Promerica', 'BAC Credomatic', 'Banco Azteca'];

const VACIO = {
  TARJETA: { numero: '', titular: '', vencimiento: '', cvv: '' },
  DEPOSITO: { banco: '', numero_boleta: '', fecha: hoyGuatemala() },
  PAYPAL: { email: '' },
  TRANSFERENCIA: { banco_origen: '', numero_referencia: '' }
};

// Mismas reglas que payment.validator.js del backend, para avisar antes de enviar.
function validar(metodo, d) {
  const e = {};
  if (metodo === 'TARJETA') {
    if (!/^\d{13,19}$/.test(d.numero.replace(/\s/g, ''))) e.numero = 'Ingresa entre 13 y 19 dígitos.';
    if (d.titular.trim().length < 3) e.titular = 'Escribe el nombre como aparece en la tarjeta.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.vencimiento)) e.vencimiento = 'Usa el formato MM/AA.';
    if (!/^\d{3,4}$/.test(d.cvv)) e.cvv = '3 o 4 dígitos.';
  }
  if (metodo === 'DEPOSITO') {
    if (d.banco.trim().length < 2) e.banco = 'Elige el banco.';
    if (d.numero_boleta.trim().length < 2) e.numero_boleta = 'Ingresa el número de boleta.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) e.fecha = 'Elige la fecha del depósito.';
  }
  if (metodo === 'PAYPAL') {
    if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Correo de PayPal no válido.';
  }
  if (metodo === 'TRANSFERENCIA') {
    if (d.banco_origen.trim().length < 2) e.banco_origen = 'Elige el banco de origen.';
    if (d.numero_referencia.trim().length < 2) e.numero_referencia = 'Ingresa la referencia.';
  }
  return e;
}

function formatearTarjeta(v) {
  return v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatearVencimiento(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/**
 * Formulario de pago reutilizable (registro y pedido).
 * onPagar({ tipo_pago, datos }) debe lanzar ApiError si el pago es rechazado.
 */
export function FormularioPago({ monto, onPagar, emailSugerido = '', textoBoton = 'Pagar' }) {
  const [metodo, setMetodo] = useState('TARJETA');
  const [datos, setDatos] = useState({ ...VACIO, PAYPAL: { email: emailSugerido } });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const exonerado = monto === '0.00';
  const d = datos[metodo];

  function set(campo, valor) {
    setDatos((prev) => ({ ...prev, [metodo]: { ...prev[metodo], [campo]: valor } }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);

    let payload;
    if (exonerado) {
      // El backend exige un método válido aunque el total sea Q0.00; lo registra como EXONERACION_AFILIADO_IRTRA.
      payload = { tipo_pago: 'TRANSFERENCIA', datos: { banco_origen: 'Carnet IRTRA', numero_referencia: 'EXONERACION' } };
    } else {
      const errs = validar(metodo, d);
      setErrores(errs);
      if (Object.keys(errs).length) return;
      const limpio = { ...d };
      if (metodo === 'TARJETA') limpio.numero = d.numero.replace(/\s/g, '');
      payload = { tipo_pago: metodo, datos: limpio };
    }

    setEnviando(true);
    try {
      await onPagar(payload);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  if (exonerado) {
    return (
      <form className="pago" onSubmit={enviar}>
        <Alerta tipo="exito" titulo="Tu carnet de afiliado cubre el total">
          No tienes que pagar nada. Confirma para activar tu código QR.
        </Alerta>
        <ErrorApi error={error} titulo="No se pudo confirmar" />
        <Boton type="submit" cargando={enviando} className="btn--bloque btn--grande">
          Confirmar y activar mi QR
        </Boton>
      </form>
    );
  }

  return (
    <form className="pago" onSubmit={enviar} noValidate>
      <div className="metodos" role="tablist" aria-label="Método de pago">
        {METODOS.map(({ id, texto, icono: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={metodo === id}
            className={`metodo ${metodo === id ? 'metodo--activo' : ''}`}
            onClick={() => {
              setMetodo(id);
              setErrores({});
              setError(null);
            }}
          >
            <Icon size={22} />
            {texto}
          </button>
        ))}
      </div>

      <div className="pago__campos">
        {metodo === 'TARJETA' && (
          <>
            <Campo label="Número de tarjeta" error={errores.numero} htmlFor="tj-num" ayuda="Prueba: una tarjeta terminada en 0000 simula un rechazo.">
              <input id="tj-num" inputMode="numeric" autoComplete="cc-number" placeholder="4111 1111 1111 4242"
                value={d.numero} onChange={(e) => set('numero', formatearTarjeta(e.target.value))} />
            </Campo>
            <Campo label="Nombre del titular" error={errores.titular} htmlFor="tj-tit">
              <input id="tj-tit" autoComplete="cc-name" value={d.titular} onChange={(e) => set('titular', e.target.value)} />
            </Campo>
            <div className="fila-2">
              <Campo label="Vencimiento" error={errores.vencimiento} htmlFor="tj-ven">
                <input id="tj-ven" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
                  value={d.vencimiento} onChange={(e) => set('vencimiento', formatearVencimiento(e.target.value))} />
              </Campo>
              <Campo label="CVV" error={errores.cvv} htmlFor="tj-cvv">
                <input id="tj-cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123"
                  value={d.cvv} onChange={(e) => set('cvv', e.target.value.replace(/\D/g, ''))} />
              </Campo>
            </div>
          </>
        )}

        {metodo === 'DEPOSITO' && (
          <>
            <Campo label="Banco" error={errores.banco} htmlFor="dp-banco">
              <select id="dp-banco" value={d.banco} onChange={(e) => set('banco', e.target.value)}>
                <option value="">Elige un banco</option>
                {BANCOS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Campo>
            <Campo label="Número de boleta" error={errores.numero_boleta} htmlFor="dp-bol">
              <input id="dp-bol" value={d.numero_boleta} onChange={(e) => set('numero_boleta', e.target.value)} />
            </Campo>
            <Campo label="Fecha del depósito" error={errores.fecha} htmlFor="dp-fecha">
              <input id="dp-fecha" type="date" max={hoyGuatemala()} value={d.fecha} onChange={(e) => set('fecha', e.target.value)} />
            </Campo>
          </>
        )}

        {metodo === 'PAYPAL' && (
          <Campo label="Correo de tu cuenta PayPal" error={errores.email} htmlFor="pp-email">
            <input id="pp-email" type="email" autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
          </Campo>
        )}

        {metodo === 'TRANSFERENCIA' && (
          <>
            <Campo label="Banco de origen" error={errores.banco_origen} htmlFor="tr-banco">
              <select id="tr-banco" value={d.banco_origen} onChange={(e) => set('banco_origen', e.target.value)}>
                <option value="">Elige un banco</option>
                {BANCOS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Campo>
            <Campo label="Número de referencia" error={errores.numero_referencia} htmlFor="tr-ref">
              <input id="tr-ref" value={d.numero_referencia} onChange={(e) => set('numero_referencia', e.target.value)} />
            </Campo>
          </>
        )}
      </div>

      <ErrorApi error={error} titulo="El pago no se aprobó" />

      <Boton type="submit" cargando={enviando} className="btn--bloque btn--grande">
        {textoBoton} {money(monto)}
      </Boton>
    </form>
  );
}
