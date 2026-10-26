import { Ban, CalendarX2, Car, CheckCircle2, Clock, PackageCheck, ScanLine, ShieldAlert, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { qrApi } from '../../api/endpoints';
import { Boton, ErrorApi, Loader, MarcaParque } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIA_LABEL, TIPO_PRODUCTO_LABEL, fechaHora, fechaLarga, hoyGuatemala, soloFecha } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

/** Decide qué mostrar según el estado del QR y la fecha de la visita. */
function evaluar(d) {
  if (d.estado_qr === 'ENTREGADO') return { tipo: 'usado' };
  if (d.estado_qr === 'EXPIRADO') return { tipo: 'expirado' };
  if (d.estado_qr === 'NO_DISPONIBLE') return { tipo: 'pendiente' };
  // Registros siempre traen fecha_visita; los pedidos la traen desde la mejora del backend.
  if (d.fecha_visita) {
    const fecha = soloFecha(d.fecha_visita);
    const hoy = hoyGuatemala();
    if (fecha < hoy) return { tipo: 'expirado' };
    if (fecha !== hoy) return { tipo: 'otra_fecha', fecha };
  }
  return { tipo: 'ok' };
}

const BANNERS = {
  ok: { cls: 'ok', icono: CheckCircle2, titulo: 'Código válido' },
  pendiente: { cls: 'error', icono: Ban, titulo: 'Pago pendiente, no entregar' },
  usado: { cls: 'error', icono: ShieldAlert, titulo: 'Este código ya fue utilizado' },
  expirado: { cls: 'error', icono: Clock, titulo: 'Código expirado' },
  otra_fecha: { cls: 'aviso', icono: CalendarX2, titulo: 'La visita es para otra fecha' },
  entregado: { cls: 'ok', icono: PackageCheck, titulo: 'Validado y entregado' }
};

export default function DetalleQR() {
  const { codigo } = useParams();
  const { usuario } = useAuth();
  const { data, error, loading, reload } = useAsync(() => qrApi.escanear(codigo), [codigo]);
  const [validando, setValidando] = useState(false);
  const [errorValidar, setErrorValidar] = useState(null);
  const [entregado, setEntregado] = useState(null);

  if (loading) return <Loader texto="Consultando el código…" />;

  if (error) {
    return (
      <div className="pagina pagina--angosta">
        <div className="veredicto veredicto--error">
          <Ban size={40} />
          <h1>{error.status === 404 ? 'Código no encontrado' : 'No se pudo leer el código'}</h1>
          <p>{error.message}</p>
        </div>
        <Link to="/empleado" className="btn btn--primario btn--bloque btn--grande"><ScanLine size={20} /> Escanear otro</Link>
      </div>
    );
  }

  const evaluacion = entregado ? { tipo: 'entregado' } : evaluar(data);
  const banner = BANNERS[evaluacion.tipo];
  const Icono = banner.icono;
  const esRegistro = data.tipo === 'REGISTRO_VISITA';
  const porCarnet = esRegistro ? data.acompanantes.filter((a) => !a.cobra_entrada).length : 0;
  const pagaron = esRegistro ? data.acompanantes.length - porCarnet : 0;

  async function validar() {
    setErrorValidar(null);
    setValidando(true);
    try {
      const r = await qrApi.validarEntregar(data.codigo_qr_id);
      setEntregado(r.data);
    } catch (err) {
      setErrorValidar(err);
      // El backend registra atómicamente el rechazo en validaciones_qr para auditoría
      reload();
    } finally {
      setValidando(false);
    }
  }

  return (
    <div className="pagina pagina--angosta">
      <div className={`veredicto veredicto--${banner.cls}`} role="status">
        <Icono size={44} />
        <h1>{banner.titulo}</h1>
        {evaluacion.tipo === 'usado' && (
          <p>
            Validado el {fechaHora(data.fecha_validacion)}
            {data.validado_por ? ` por ${data.validado_por}` : ''}.
          </p>
        )}
        {evaluacion.tipo === 'otra_fecha' && <p>Programada para el {fechaLarga(evaluacion.fecha)}.</p>}
        {evaluacion.tipo === 'expirado' && <p>Venció el {fechaHora(data.fecha_expiracion)}.</p>}
        {evaluacion.tipo === 'pendiente' && <p>El cliente debe pagar en línea antes de recibir nada.</p>}
        {evaluacion.tipo === 'entregado' && <p>Registrado a tu nombre el {fechaHora(entregado.fecha_validacion)}.</p>}
      </div>

      <section className="panel ficha-qr">
        <div className="ficha-qr__cabeza">
          <span className="ficha-qr__tipo">{esRegistro ? 'Entrada y parqueo' : `Pedido ${data.numero_pedido}`}</span>
          <MarcaParque nombre={data.parque} />
        </div>
        <dl className="ficha-qr__datos">
          <div><dt>Titular</dt><dd>{data.titular.nombres} {data.titular.apellidos}</dd></div>
          {esRegistro && <div><dt>Fecha de visita</dt><dd>{fechaLarga(data.fecha_visita)}</dd></div>}
        </dl>

        {esRegistro ? (
          <>
            <ul className="ficha-qr__cifras">
              <li><Users size={20} /><strong>{data.total_personas}</strong><span>personas</span></li>
              <li><strong>{porCarnet}</strong><span>entran por carnet</span></li>
              <li><strong>{pagaron}</strong><span>pagaron entrada</span></li>
              <li><Car size={20} /><strong>{data.tiene_vehiculo ? 'Sí' : 'No'}</strong><span>parqueo</span></li>
            </ul>
            <details className="ficha-qr__personas">
              <summary>Ver personas</summary>
              <ul>
                {data.acompanantes.map((a, i) => (
                  <li key={a.id}>
                    {i + 1}. {a.es_titular ? 'Titular' : 'Acompañante'}, {a.edad} años ({CATEGORIA_LABEL[a.categoria_tarifa]})
                    <span>{a.cobra_entrada ? 'Pagó' : 'Carnet'}</span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <>
            <h2 className="ficha-qr__entregar">Entregar físicamente</h2>
            <ul className="ficha-qr__productos">
              {data.productos.map((p, i) => (
                <li key={i}>
                  <strong>{p.cantidad}</strong>
                  <span>{p.producto_nombre} <small>{TIPO_PRODUCTO_LABEL[p.tipo]}</small></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ErrorApi error={errorValidar} titulo="Resultado de la validación en el servidor" />

      {!entregado && (
        <Boton
          className={`btn--bloque btn--grande ${evaluacion.tipo === 'ok' ? 'btn--validar' : 'btn--secundario'}`}
          onClick={validar}
          cargando={validando}
          disabled={evaluacion.tipo === 'usado' || evaluacion.tipo === 'pendiente'}
        >
          <PackageCheck size={22} />
          {evaluacion.tipo === 'ok'
            ? 'Validar y entregar'
            : evaluacion.tipo === 'usado'
            ? 'Código ya utilizado'
            : evaluacion.tipo === 'pendiente'
            ? 'Pago pendiente (no entregar)'
            : 'Procesar validación en servidor'}
        </Boton>
      )}
      <Link to="/empleado" className={`btn btn--bloque ${entregado ? 'btn--primario btn--grande' : 'btn--fantasma'}`}>
        <ScanLine size={20} /> Escanear otro
      </Link>
    </div>
  );
}
