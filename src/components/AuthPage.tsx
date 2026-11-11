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
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="nav-brand"><span>Jira <strong>AI</strong></span></div>
        <h1>{registering ? 'Crea tu espacio de trabajo' : 'Bienvenido de nuevo'}</h1>
        <p>Gestiona proyectos y colabora con tu equipo. La IA está disponible como herramienta dentro del proyecto.</p>
        {registering && (
          <label className="form-group">
            <span className="form-label">Nombre</span>
            <input className="form-input" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label className="form-group">
          <span className="form-label">Email</span>
          <input className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="form-group">
          <span className="form-label">Contraseña {registering && '(mínimo 10 caracteres)'}</span>
          <input className="form-input" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 10 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Conectando...' : registering ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
        <button className="auth-switch" type="button" onClick={() => { setError(''); setRegistering((value) => !value); }}>
          {registering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
        </button>
      </form>
    </main>
  );
};
