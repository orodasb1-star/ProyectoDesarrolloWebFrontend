import { PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { qrApi, visitasApi } from '../../api/endpoints';
import { Estrellas } from '../../components/Estrellas';
import { Alerta, Boton, Campo, Encabezado, ErrorApi, Loader, MarcaParque, Vacio } from '../../components/ui';
import { fechaLarga } from '../../utils/format';
import { useAsync } from '../../utils/useAsync';

export default function CalificarVisita() {
  const { id } = useParams();
  const { data, error, loading } = useAsync(async () => {
    const [registro, codigos] = await Promise.all([visitasApi.registro(id), qrApi.misCodigos().catch(() => [])]);
    return { registro, qr: codigos.find((c) => Number(c.registro_visita_id) === Number(id)) };
  }, [id]);

  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [listo, setListo] = useState(false);

  if (loading) return <Loader />;
  if (error) return <div className="pagina"><ErrorApi error={error} /></div>;
  const { registro, qr } = data;
  const habilitado = qr?.estado === 'ENTREGADO';

  async function enviar(e) {
    e.preventDefault();
    setErrorEnvio(null);
    setEnviando(true);
    try {
      await visitasApi.calificar({ registro_visita_id: Number(id), puntuacion, comentario: comentario.trim() || null });
      setListo(true);
    } catch (err) {
      setErrorEnvio(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina pagina--angosta">
      <Encabezado titulo="Califica tu visita" volver={{ to: `/cliente/visitas/${id}`, texto: 'Detalle del registro' }}>
        <MarcaParque nombre={registro.parque_nombre} /> {fechaLarga(registro.fecha_visita)}
      </Encabezado>

      {listo ? (
        <Vacio icono={PartyPopper} titulo="¡Gracias por tu calificación!"
          accion={<Link to="/cliente" className="btn btn--primario">Volver a mis visitas</Link>}>
          Tu opinión nos ayuda a mejorar cada parque.
        </Vacio>
      ) : !habilitado ? (
        <Alerta tipo="info" titulo="Podrás calificar después de entrar al parque">
          La calificación se habilita cuando tu entrada se valida en taquilla.
        </Alerta>
      ) : (
        <form className="panel" onSubmit={enviar}>
          <h2 className="panel__titulo">¿Cómo te fue?</h2>
          <Estrellas valor={puntuacion} onChange={setPuntuacion} />
          <Campo label="Comentario" htmlFor="coment" ayuda={`${comentario.length}/500. Opcional.`}>
            <textarea id="coment" rows={4} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos qué fue lo mejor de tu día o qué podemos mejorar." />
          </Campo>
          <ErrorApi error={errorEnvio} titulo="No se pudo guardar la calificación" />
          <Boton type="submit" cargando={enviando} disabled={puntuacion === 0} className="btn--grande">
            Enviar calificación
          </Boton>
        </form>
      )}
    </div>
  );
}
