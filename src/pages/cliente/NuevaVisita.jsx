import { Car, CarFront, Check, Minus, Plus, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogoApi, visitasApi } from '../../api/endpoints';
import { Alerta, Boton, Encabezado, ErrorApi, Loader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIA_LABEL, fechaLarga, hoyGuatemala, money, nombreLegible } from '../../utils/format';
import { temaParque } from '../../utils/parques';
import { useAsync } from '../../utils/useAsync';

const PASOS = ['Parque y fecha', 'Vehículo', 'Acompañantes'];
let contador = 0;
const nuevoAcomp = (edad = '') => ({ key: ++contador, edad });

export default function NuevaVisita() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data: parques, error: errorParques, loading: cargandoParques } = useAsync(() => catalogoApi.parques(), []);

  const [paso, setPaso] = useState(1);
  const [parqueId, setParqueId] = useState(null);
  const [fecha, setFecha] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [acomps, setAcomps] = useState([]);

  const [cotizacion, setCotizacion] = useState(null);
  const [errorCot, setErrorCot] = useState(null);
  const [cotizando, setCotizando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState(null);

  const hoy = hoyGuatemala();
  const parque = parques?.find((p) => p.id === parqueId);
  const edadesValidas = acomps.every((a) => a.edad !== '' && Number(a.edad) >= 0 && Number(a.edad) <= 120);
  const paso1Listo = Boolean(parqueId && fecha && fecha >= hoy);

  const payload = useMemo(
    () => ({
      parque_id: parqueId,
      fecha_visita: fecha,
      tiene_vehiculo: Boolean(vehiculo),
      acompanantes: acomps.map((a) => ({ edad: Number(a.edad) }))
    }),
    [parqueId, fecha, vehiculo, acomps]
  );

  // Cotización en vivo: el backend calcula todo (carnet, categorías, parqueo, total).
  const ultima = useRef(0);
  useEffect(() => {
    if (!paso1Listo || !edadesValidas) return undefined;
    const id = ++ultima.current;
    setCotizando(true);
    const t = setTimeout(async () => {
      try {
        const c = await visitasApi.cotizar(payload);
        if (id === ultima.current) {
          setCotizacion(c);
          setErrorCot(null);
        }
      } catch (err) {
        if (id === ultima.current) {
          setCotizacion(null);
          setErrorCot(err);
        }
      } finally {
        if (id === ultima.current) setCotizando(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      setCotizando(false);
    };
  }, [payload, paso1Listo, edadesValidas]);

  async function crear() {
    setErrorCrear(null);
    setCreando(true);
    try {
      const reg = await visitasApi.crearRegistro(payload);
      navigate(`/cliente/visitas/${reg.id}/pagar`, { replace: true, state: { recienCreado: true } });
    } catch (err) {
      setErrorCrear(err);
    } finally {
      setCreando(false);
    }
  }

  const puedeAvanzar = paso === 1 ? paso1Listo : paso === 2 ? vehiculo !== null : edadesValidas && cotizacion && !errorCot;

  return (
    <div className="pagina">
      <Encabezado titulo="Nueva visita" volver={{ to: '/cliente', texto: 'Mis visitas' }}>
        Te mostramos el total en cuanto eliges parque y fecha. Se actualiza con cada cambio.
      </Encabezado>

      <ol className="pasos" aria-label="Progreso">
        {PASOS.map((p, i) => (
          <li key={p} className={`${paso === i + 1 ? 'actual' : ''} ${paso > i + 1 ? 'hecho' : ''}`}>
            <span className="pasos__num">{paso > i + 1 ? <Check size={14} /> : i + 1}</span>
            {p}
          </li>
        ))}
      </ol>

      <div className="con-resumen">
        <section className="panel">
          {paso === 1 && (
            <>
              <h2 className="panel__titulo">¿A qué parque van?</h2>
              {cargandoParques && <Loader />}
              <ErrorApi error={errorParques} />
              <div className="selector-parques">
                {parques?.map((p) => {
                  const t = temaParque(p);
                  const sel = p.id === parqueId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`opcion-parque ${sel ? 'opcion-parque--sel' : ''}`}
                      style={{ '--parque': t.color, '--parque-suave': t.suave }}
                      aria-pressed={sel}
                      onClick={() => setParqueId(p.id)}
                    >
                      <strong>{p.nombre}</strong>
                      <span>{p.descripcion || t.lema}</span>
                      {sel && <Check className="opcion-parque__check" size={20} />}
                    </button>
                  );
                })}
              </div>

              <label className="campo campo--fecha" htmlFor="fecha-visita">
                <span>Fecha de la visita</span>
                <input id="fecha-visita" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                {fecha && fecha < hoy && <span className="campo__error">La fecha no puede ser anterior a hoy.</span>}
                {fecha && fecha >= hoy && <span className="campo__ayuda">{fechaLarga(fecha)}</span>}
              </label>
            </>
          )}

          {paso === 2 && (
            <>
              <h2 className="panel__titulo">¿Llevan vehículo?</h2>
              <p className="texto-suave">Si llevan carro, se agrega el parqueo del día a tu registro.</p>
              <div className="opciones-si-no">
                <button type="button" aria-pressed={vehiculo === true} className={`si-no ${vehiculo === true ? 'si-no--sel' : ''}`}
                  onClick={() => setVehiculo(true)}>
                  <CarFront size={40} strokeWidth={1.5} />
                  <strong>Sí, llevamos vehículo</strong>
                </button>
                <button type="button" aria-pressed={vehiculo === false} className={`si-no ${vehiculo === false ? 'si-no--sel' : ''}`}
                  onClick={() => setVehiculo(false)}>
                  <Car size={40} strokeWidth={1.5} className="tachado" />
                  <strong>No, llegamos sin carro</strong>
                </button>
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <h2 className="panel__titulo">¿Quiénes van?</h2>
              <p className="texto-suave">
                Agrega a cada acompañante con su edad. La edad define la tarifa: niño, adulto o adulto mayor.
              </p>
              <ol className="personas">
                <li className="persona persona--titular">
                  <span className="persona__num">1</span>
                  <UserRound size={20} />
                  <span className="persona__nombre">
                    {usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Tú'} <small>Titular</small>
                  </span>
                  <span className="persona__edad">{usuario?.edad != null ? `${usuario.edad} años` : 'Edad del perfil'}</span>
                </li>
                {acomps.map((a, i) => (
                  <li key={a.key} className="persona">
                    <span className="persona__num">{i + 2}</span>
                    <label className="persona__nombre" htmlFor={`edad-${a.key}`}>Acompañante</label>
                    <div className="contador">
                      <button type="button" aria-label="Restar un año"
                        onClick={() => setAcomps((l) => l.map((x) => x.key === a.key ? { ...x, edad: String(Math.max(0, Number(x.edad || 0) - 1)) } : x))}>
                        <Minus size={16} />
                      </button>
                      <input id={`edad-${a.key}`} type="number" min="0" max="120" inputMode="numeric" placeholder="Edad"
                        value={a.edad}
                        onChange={(e) => setAcomps((l) => l.map((x) => (x.key === a.key ? { ...x, edad: e.target.value } : x)))} />
                      <button type="button" aria-label="Sumar un año"
                        onClick={() => setAcomps((l) => l.map((x) => x.key === a.key ? { ...x, edad: String(Math.min(120, Number(x.edad || 0) + 1)) } : x))}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="persona__unidad">años</span>
                    <button type="button" className="btn-icono btn-icono--peligro" aria-label={`Quitar persona ${i + 2}`}
                      onClick={() => setAcomps((l) => l.filter((x) => x.key !== a.key))}>
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ol>
              <Boton variante="secundario" onClick={() => setAcomps((l) => [...l, nuevoAcomp()])} disabled={acomps.length >= 40}>
                <Plus size={18} /> Agregar acompañante
              </Boton>
              {!edadesValidas && <p className="campo__error">Escribe la edad de cada acompañante (0 a 120).</p>}
            </>
          )}

          <div className="panel__nav">
            {paso > 1 && (
              <Boton variante="fantasma" onClick={() => setPaso((p) => p - 1)}>
                Atrás
              </Boton>
            )}
            {paso < 3 ? (
              <Boton onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar}>
                Continuar
              </Boton>
            ) : (
              <Boton onClick={crear} cargando={creando} disabled={!puedeAvanzar || cotizando}>
                Crear registro e ir a pagar
              </Boton>
            )}
          </div>
          <ErrorApi error={errorCrear} titulo="No se pudo crear el registro" />
        </section>

        <Resumen parque={parque} fecha={fecha} vehiculo={vehiculo} cotizacion={paso1Listo ? cotizacion : null}
          cotizando={cotizando} error={paso1Listo ? errorCot : null} />
      </div>
    </div>
  );
}

function Resumen({ parque, fecha, vehiculo, cotizacion, cotizando, error }) {
  const tema = temaParque(parque);
  const gratis = cotizacion?.personas?.filter((p) => !p.cobra_entrada).length || 0;

  return (
    <aside className="resumen" style={{ '--parque': tema.color }} aria-live="polite">
      <h2>Resumen</h2>
      <dl className="resumen__meta">
        <div><dt>Parque</dt><dd>{parque?.nombre || '—'}</dd></div>
        <div><dt>Fecha</dt><dd>{fecha ? fechaLarga(fecha, true) : '—'}</dd></div>
        <div><dt>Vehículo</dt><dd>{vehiculo === null ? '—' : vehiculo ? 'Sí' : 'No'}</dd></div>
      </dl>

      {!cotizacion && !error && <p className="texto-suave">Elige parque y fecha para ver el total.</p>}
      {error && <ErrorApi error={error} titulo="No se pudo cotizar" />}

      {cotizacion && (
        <div className={cotizando ? 'resumen__actualizando' : ''}>
          {cotizacion.tiene_carnet && gratis > 0 && (
            <Alerta tipo="exito">{gratis === 1 ? '1 persona entra gratis' : `${gratis} personas entran gratis`} por tu carnet.</Alerta>
          )}
          <ul className="resumen__personas">
            {cotizacion.personas.map((p, i) => (
              <li key={i}>
                <span>
                  {i + 1}. {p.es_titular ? 'Titular' : 'Acompañante'}, {p.edad} años
                  <small>{CATEGORIA_LABEL[p.categoria_tarifa]}</small>
                </span>
                <span className={p.cobra_entrada ? '' : 'gratis'}>{p.cobra_entrada ? 'Paga' : 'Gratis'}</span>
              </li>
            ))}
          </ul>
          <table className="resumen__tabla">
            <tbody>
              {cotizacion.detalles.map((d, i) => (
                <tr key={i}>
                  <td>{nombreLegible(d.nombre_producto)}<small> × {d.cantidad} a {money(d.precio_unitario)}</small></td>
                  <td>{money(d.subtotal)}</td>
                </tr>
              ))}
              <tr className="sub"><td>Subtotal entradas</td><td>{money(cotizacion.subtotal_entrada)}</td></tr>
              <tr className="sub"><td>Subtotal parqueo</td><td>{money(cotizacion.subtotal_parqueo)}</td></tr>
            </tbody>
            <tfoot>
              <tr><td>Total</td><td>{money(cotizacion.total)}</td></tr>
            </tfoot>
          </table>
          {cotizando && <p className="texto-suave resumen__nota">Actualizando…</p>}
        </div>
      )}
    </aside>
  );
}
