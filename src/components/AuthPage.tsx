import React, { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOGIN, REGISTER } from '../graphql/client';

interface AuthPageProps {
  onAuthenticated: (token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, loginState] = useMutation(LOGIN);
  const [register, registerState] = useMutation(REGISTER);
  const client = useApolloClient();
  const loading = loginState.loading || registerState.loading;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = registering
        ? await register({ variables: { input: { name, email, password } } })
        : await login({ variables: { input: { email, password } } });
      const token = (registering ? response.data?.register : response.data?.login)?.token;
      if (!token) throw new Error('El servidor no devolvió una sesión válida.');
      window.localStorage.setItem('jira-ai-token', token);
      await client.resetStore();
      onAuthenticated(token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión.');
    }
  };

  return (
    <div className="auth-page">
      {/* Top Bar Minimalista de la Plataforma */}
      <header className="auth-topbar" role="banner">
        <div className="nav-brand">
          <div className="nav-brand-icon" aria-hidden="true">J</div>
          <span><strong>JIRAN'T</strong></span>
          <span className="nav-badge-enterprise">Software Delivery Platform</span>
        </div>
        <div className="nav-actions">
          <span className="nav-badge-enterprise">Centro de Asistencia</span>
        </div>
      </header>

      {/* Lienzo Principal de Autenticación */}
      <main className="auth-main-canvas">
        <div className="auth-layout-grid">
          {/* Columna Izquierda: Contexto Editorial de Project Aurora */}
          <section className="auth-editorial-column" aria-label="Información de la plataforma">
            <div className="auth-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Sprint Planning & Flujos Asistidos con IA</span>
            </div>

            <h2 className="auth-editorial-title">
              La claridad del papel, la potencia de la inteligencia ágil.
            </h2>

            <p className="auth-editorial-subtitle">
              Diseñado para líderes de producto, ingeniería y redacción técnica que conciben el software con rigor editorial y cadencia deliberada.
            </p>

            {/* Tarjeta de previsualización del espacio conectado */}
            <div className="auth-preview-card">
              <div className="auth-preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-sand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Espacio de Trabajo Conectado</strong>
                </div>
                <span className="nav-badge-enterprise">JIRAN'T Core v4.8</span>
              </div>

              <div className="auth-preview-visual">
                <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                  ÁREA DE TRABAJO ÁGIL
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FBF8F2' }}>Sprint 14 en curso</div>
                  <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>24 historias completadas · 4 días restantes →</div>
                </div>
              </div>
            </div>

            <div className="auth-social-proof">
              <div style={{ display: 'flex', gap: '-4px' }}>
                <span className="user-avatar-circle" style={{ width: '22px', height: '22px', fontSize: '9px', background: '#0D172A' }}>MG</span>
                <span className="user-avatar-circle" style={{ width: '22px', height: '22px', fontSize: '9px', background: '#8C6A48' }}>PL</span>
                <span className="user-avatar-circle" style={{ width: '22px', height: '22px', fontSize: '9px', background: '#2F5D50' }}>AT</span>
              </div>
              <span>Más de 1.400 escuadrones gestionando entrega continua sin fricciones.</span>
            </div>
          </section>

          {/* Columna Derecha: Tarjeta de Acceso Seguro */}
          <section className="auth-card-column" aria-label="Formulario de inicio de sesión">
            <div className="auth-card">
              <div className="auth-card-header">
                <div className="auth-secure-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Acceso Seguro</span>
                </div>
                <h1>{registering ? 'Crea tu espacio de trabajo' : 'Bienvenido de nuevo'}</h1>
                <p>Gestiona proyectos, colabora con tu equipo e impulsa sprints con IA integrada.</p>
              </div>

              {/* Formulario de credenciales */}
              <form onSubmit={submit}>
                {registering && (
                  <label className="form-group">
                    <span className="form-label">Nombre</span>
                    <input
                      className="form-input"
                      autoComplete="name"
                      required
                      placeholder="Tu nombre completo"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                )}

                <label className="form-group">
                  <span className="form-label">Email</span>
                  <input
                    className="form-input"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nombre@compania.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>

                <label className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="form-label">Contraseña {registering && '(mínimo 10 caracteres)'}</span>
                    {!registering && (
                      <span style={{ fontSize: '11px', color: 'var(--color-accent-sand)', cursor: 'pointer' }}>
                        ¿Olvidaste tu contraseña?
                      </span>
                    )}
                  </div>
                  <input
                    className="form-input"
                    type="password"
                    autoComplete={registering ? 'new-password' : 'current-password'}
                    minLength={registering ? 10 : undefined}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>

                <div className="auth-checkbox-row">
                  <input
                    id="remember-me"
                    type="checkbox"
                    defaultChecked
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="remember-me" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Mantener sesión activa por 30 días
                  </label>
                </div>

                {error && <div className="form-error" role="alert">{error}</div>}

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: '42px', fontSize: '14px', borderRadius: '6px' }}
                >
                  <span>{loading ? 'Conectando...' : registering ? 'Crear cuenta' : 'Iniciar sesión'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>

                <button
                  className="auth-switch"
                  type="button"
                  onClick={() => {
                    setError('');
                    setRegistering((value) => !value);
                  }}
                >
                  {registering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
                </button>
              </form>

              <div className="auth-security-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-sage)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Cifrado TLS 1.3 de extremo a extremo y cumplimiento SOC-2</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Pie de página cálido editorial */}
      <footer className="auth-footer" role="contentinfo">
        <div className="auth-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
              JIRAN'T
            </span>
            <span style={{ color: 'var(--border-prominent)' }}>/</span>
            <span>Plataforma Ágil</span>
            <span className="nav-badge-enterprise">Build 2025.4.1</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#privacidad" style={{ color: 'var(--text-muted)' }}>Privacidad de Datos</a>
            <a href="#terminos" style={{ color: 'var(--text-muted)' }}>Términos de Servicio</a>
            <a href="#gobernanza" style={{ color: 'var(--text-muted)' }}>Gobernanza de IA</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
