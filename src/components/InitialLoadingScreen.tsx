import qaiLogo from '../assets/qai-logo-transparent.png';

export default function InitialLoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--primary-dark, #1d4ed8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <img
        src={qaiLogo}
        alt="QAI / QARTINT Logo"
        style={{
          width: 'clamp(140px, 30vw, 220px)',
          maxWidth: 220,
          height: 'auto',
          objectFit: 'contain',
          animation: 'subtlePulse 2s ease-in-out infinite',
        }}
      />
    </div>
  );
}
