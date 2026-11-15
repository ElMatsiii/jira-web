import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_PROJECT_MEMBER, GET_PROJECT_MEMBERS, REMOVE_PROJECT_MEMBER } from '../graphql/client';

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  /** true when the access comes from an invitation (it can be removed). */
  invited: boolean;
}

/** Spanish label for a workspace role. */
export const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
};

export interface ProjectMembersPanelProps {
  projectId: string;
  projectName: string;
  /** OWNER or ADMIN of the workspace: can invite and remove members. */
  canManage: boolean;
  onClose: () => void;
}

const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/**
 * Who has access to a project. The OWNER and ADMINs reach every project of the workspace; other people
 * see only the projects they are invited to, and only they can be removed from one.
 */
export const ProjectMembersPanel: React.FC<ProjectMembersPanelProps> = ({ projectId, projectName, canManage, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const members = useQuery(GET_PROJECT_MEMBERS, { variables: { projectId }, fetchPolicy: 'cache-and-network' });
  const [addMember, addState] = useMutation(ADD_PROJECT_MEMBER);
  const [removeMember, removeState] = useMutation(REMOVE_PROJECT_MEMBER);
  const list: ProjectMember[] = members.data?.projectMembers || [];

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const response = await addMember({ variables: { input: { projectId, email: email.trim() } } });
      const added: ProjectMember | undefined = response.data?.addProjectMember;
      setNotice(added?.invited === false
        ? `${added.name} ya tiene acceso a todos los proyectos del espacio.`
        : `${added?.name || email.trim()} ahora tiene acceso a ${projectName}.`);
      setEmail('');
      await members.refetch();
    } catch (requestError) {
      setError(messageOf(requestError, 'No se pudo invitar a esa persona.'));
    }
  };

  const remove = async (member: ProjectMember) => {
    setError('');
    setNotice('');
    try {
      await removeMember({ variables: { input: { projectId, userId: member.id } } });
      setNotice(`${member.name} ya no tiene acceso a ${projectName}.`);
      await members.refetch();
    } catch (requestError) {
      setError(messageOf(requestError, 'No se pudo quitar a esa persona.'));
    }
  };

  return (
    <div
      className="modal-overlay"
      data-testid="project-members-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-card project-members-panel" role="dialog" aria-modal="true" aria-labelledby="project-members-heading">
        <header className="modal-header">
          <h2 id="project-members-heading" className="panel-heading">Miembros de {projectName}</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar miembros">✕</button>
        </header>

        {canManage && (
          <form className="member-form" onSubmit={(event) => void invite(event)}>
            <input
              className="form-input"
              type="email"
              placeholder="Invitar al proyecto por email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email de la persona a invitar"
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={!email.trim() || addState.loading}>
              {addState.loading ? 'Invitando...' : 'Invitar'}
            </button>
          </form>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="panel-notice" role="status">{notice}</p>}
        {members.error && <p className="form-error" role="alert">No se pudo cargar la lista: {members.error.message}</p>}
        {members.loading && !members.data && <p className="panel-notice">Cargando miembros...</p>}

        <ul className="project-member-list">
          {list.map((member) => (
            <li key={member.id} className="project-member-row" data-testid={`project-member-${member.email}`}>
              <div>
                <strong>{member.name}</strong>
                <small>{member.email}</small>
              </div>
              <span className="role-pill">{ROLE_LABEL[member.role] || member.role}</span>
              {canManage && member.invited ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={removeState.loading}
                  onClick={() => void remove(member)}
                  aria-label={`Quitar a ${member.name} del proyecto`}
                >
                  Quitar
                </button>
              ) : (
                !member.invited && <small className="member-scope">Acceso a todo el espacio</small>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
