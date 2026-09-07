import { Link } from 'react-router-dom'
import { IconHouse, IconBriefcase, IconArrowRight, IconHammer, IconCheck, IconStar } from '../components/Icons'
import { useSolicitudes } from '../context/SolicitudesContext'
import { useAuth } from '../context/AuthContext'
import { ESTADOS } from '../data/estados'

export default function Home() {
  const { solicitudes } = useSolicitudes()
  const { autenticado } = useAuth()

  // Sin sesion la lista viene vacia: los contadores quedan en cero, que es
  // honesto, en vez de mostrar numeros inventados.
  const cuenta = (nombre) => solicitudes.filter((s) => s.estado?.nombre === nombre).length
  const abiertos = cuenta(ESTADOS.PENDIENTE)
  const enCurso = cuenta(ESTADOS.ASIGNADO) + cuenta(ESTADOS.EN_PROGRESO)
  const resueltos = cuenta(ESTADOS.RESUELTO)

  return (
    <div className="page page--home">
      <section className="hero">
        <p className="hero__kicker">Red vecinal de reparaciones</p>
        <h1 className="hero__title">
          Arreglamos el <em>barrio</em>,<br /> un trabajo a la vez.
        </h1>
        <p className="hero__lead">
          Publicá tu problema de plomería, electricidad o lo que se te rompió, y un profesional de
          confianza del barrio se ocupa. Sin vueltas, con seguimiento claro de principio a fin.
        </p>

        <div className="hero__actions">
          {autenticado ? (
            <>
              <Link to="/nueva-solicitud" className="btn btn-primary">
                <IconHouse width={18} height={18} /> Necesito una reparación
              </Link>
              <Link to="/trabajos" className="btn btn-outline">
                <IconBriefcase width={18} height={18} /> Busco trabajos
              </Link>
            </>
          ) : (
            <Link to="/ingreso" className="btn btn-primary">
              <IconHouse width={18} height={18} /> Ingresar o registrarme
            </Link>
          )}
        </div>

        <dl className="hero__stats">
          <div>
            <dt>{abiertos}</dt>
            <dd>solicitudes abiertas</dd>
          </div>
          <div>
            <dt>{enCurso}</dt>
            <dd>en manos de un profesional</dd>
          </div>
          <div>
            <dt>{resueltos}</dt>
            <dd>arreglos resueltos</dd>
          </div>
        </dl>
      </section>

      <section className="steps">
        <h2 className="section-title">Cómo funciona</h2>
        <ol className="steps__list">
          <li className="steps__item">
            <span className="steps__icon"><IconHammer /></span>
            <h3>1. Contá qué se rompió</h3>
            <p>Cargá una solicitud con categoría, dirección y urgencia. Te queda un ticket con número de seguimiento.</p>
          </li>
          <li className="steps__item">
            <span className="steps__icon"><IconBriefcase /></span>
            <h3>2. Un profesional la toma</h3>
            <p>Los profesionales del barrio ven el listado de trabajos disponibles y eligen el que pueden resolver.</p>
          </li>
          <li className="steps__item">
            <span className="steps__icon"><IconCheck /></span>
            <h3>3. Seguís el estado</h3>
            <p>De pendiente a asignado, en progreso y resuelto, con el historial de cada cambio.</p>
          </li>
          <li className="steps__item">
            <span className="steps__icon"><IconStar /></span>
            <h3>4. Calificás el trabajo</h3>
            <p>Cuando termina, dejás una calificación que queda en el historial del profesional.</p>
          </li>
        </ol>
      </section>

      <section className="cta-strip">
        <div>
          <h2>¿Sos profesional del barrio?</h2>
          <p>Sumate y elegí los trabajos que más se ajustan a tu oficio y tu zona.</p>
        </div>
        <Link to="/ingreso" className="btn btn-primary btn-sm">
          Registrarme <IconArrowRight width={16} height={16} />
        </Link>
      </section>
    </div>
  )
}
