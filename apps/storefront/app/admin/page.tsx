import { requireAdmin, logoutAction } from '../../lib/actions';
import {
  fetchAdminThemes,
  fetchThemeVersions,
  fetchAllTenants,
  type AdminTheme,
} from '../../lib/admin';
import {
  createThemeAction,
  publishVersionAction,
  setVisibilityAction,
  runAutoApplyAction,
} from '../../lib/actions';
import {
  CreateThemeForm,
  PublishVersionForm,
  VisibilityForm,
  AutoApplyCard,
} from '../../components/admin-forms';

export const dynamic = 'force-dynamic';

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f4f4f5',
  padding: '32px 24px',
  fontFamily: 'system-ui, sans-serif',
};

const wrap: React.CSSProperties = { maxWidth: 1080, margin: '0 auto' };

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#71717a',
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
};

const td: React.CSSProperties = {
  fontSize: 14,
  padding: '10px 12px',
  borderBottom: '1px solid #f4f4f5',
  verticalAlign: 'top',
};

function badge(visibility: AdminTheme['visibility']) {
  const colors: Record<string, string> = {
    public: '#15803d',
    private: '#71717a',
    deprecated: '#b91c1c',
  };
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: colors[visibility] ?? '#333',
        background: '#f4f4f5',
        borderRadius: 999,
        padding: '3px 10px',
      }}
    >
      {visibility}
    </span>
  );
}

export default async function AdminDashboard() {
  const { token } = await requireAdmin();
  const [themes, tenants] = await Promise.all([
    fetchAdminThemes(token),
    fetchAllTenants(token),
  ]);
  const versionsByTheme = new Map<string, { version: string }[]>();
  await Promise.all(
    themes.map(async (t) => {
      versionsByTheme.set(t.id, await fetchThemeVersions(token, t.id));
    }),
  );
  const totalVersions = [...versionsByTheme.values()].reduce((n, v) => n + v.length, 0);

  const stats = [
    { label: 'Themes', value: themes.length },
    { label: 'Published versions', value: totalVersions },
    { label: 'Stores', value: tenants.length },
  ];

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Platform Admin</h1>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 14 }}>
              Theme releases, visibility, safe updates and stores
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
            >
              Sign out
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <AutoApplyCard action={runAutoApplyAction} />
          <CreateThemeForm action={createThemeAction} />
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Themes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Theme</th>
                <th style={th}>Visibility</th>
                <th style={th}>Versions</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((t) => {
                const versions = versionsByTheme.get(t.id) ?? [];
                return (
                  <tr key={t.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#71717a' }}>
                        {t.slug} · {t.monetization}
                      </div>
                      <PublishVersionForm
                        action={publishVersionAction}
                        themeId={t.id}
                        themeName={t.name}
                      />
                    </td>
                    <td style={td}>
                      {badge(t.visibility)}
                      <div style={{ marginTop: 8 }}>
                        <VisibilityForm
                          action={setVisibilityAction}
                          themeId={t.id}
                          current={t.visibility}
                        />
                      </div>
                    </td>
                    <td style={td}>
                      {versions.length === 0 ? (
                        <span style={{ color: '#a1a1aa', fontSize: 13 }}>none yet</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                          {versions.map((v) => (
                            <li key={v.version}>v{v.version}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
              {themes.length === 0 && (
                <tr>
                  <td style={td} colSpan={3}>
                    No themes yet — create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Stores</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Store</th>
                <th style={th}>Slug</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{t.name}</td>
                  <td style={td}>{t.slug}</td>
                  <td style={td}>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td style={td} colSpan={3}>
                    No stores yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
