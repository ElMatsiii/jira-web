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
          <div className="nav-brand-icon" aria-hidden="true">A</div>
          <span>Project Aurora <strong>Jira AI</strong></span>
          <span className="nav-badge-enterprise">Software Delivery Platform</span>
        </div>
        <div className="nav-actions">
          <div className="status-indicator-pill" title="Red de microservicios activa">
            <span className="pulse-dot"></span>
            <span>Red Operativa Sincronizada</span>
          </div>
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
                <span className="nav-badge-enterprise">Aurora Core v4.8</span>
              </div>

              <div className="auth-preview-visual">
                <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                  CLÚSTER JIRA AI • DOCKER KAFKA
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

              {/* Acciones de acceso SSO */}
              <div className="auth-sso-group">
                <button type="button" className="btn-sso">
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button type="button" className="btn-sso">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="auth-divider">
                <span>o mediante credenciales</span>
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
              Project Aurora
            </span>
            <span style={{ color: 'var(--border-prominent)' }}>/</span>
            <span>Atlassian Agile Ecosystem</span>
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
