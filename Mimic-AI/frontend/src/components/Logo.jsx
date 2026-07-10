import React from 'react';

export default function Logo({ className = '', style = {}, variant = 'vertical', width = 'auto', iconOnly = false }) {
  const isHorizontal = variant === 'horizontal';

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"DM Sans", sans-serif',
        width: width,
        gap: isHorizontal ? '12px' : '10px',
        ...style
      }}
    >
      <style>
        {`
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes dotBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
          @keyframes waPulse {
            0%, 100% { transform: translate(74px, 59px) scale(0.95); }
            50% { transform: translate(74px, 59px) scale(1.02); }
          }
          @keyframes textShine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .mimic-logo-svg {
            animation: logoFloat 4s ease-in-out infinite;
          }
          .mimic-dot-1 { animation: dotBounce 1.5s infinite; }
          .mimic-dot-2 { animation: dotBounce 1.5s infinite 0.2s; }
          .mimic-dot-3 { animation: dotBounce 1.5s infinite 0.4s; }
          .mimic-wa-icon {
            transform-origin: 22.5px 22.5px;
            animation: waPulse 3s ease-in-out infinite;
          }
          .mimic-text-ai {
            background-size: 200% auto !important;
            animation: textShine 4s linear infinite;
          }
        `}
      </style>

      <svg
        className="mimic-logo-svg"
        width={isHorizontal ? "46" : (iconOnly && width !== 'auto' ? "100%" : "140")}
        height={isHorizontal ? "43" : (iconOnly && width !== 'auto' ? "auto" : "130")}
        viewBox="0 0 140 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id="bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B3FE4" />
            <stop offset="50%" stopColor="#D9659E" />
            <stop offset="100%" stopColor="#F9A47B" />
          </linearGradient>

          <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B3FE4" />
            <stop offset="40%" stopColor="#8A56DF" />
            <stop offset="100%" stopColor="#F9A47B" />
          </linearGradient>

          <mask id="cutout">
            <rect width="140" height="130" fill="white" />
            <circle cx="100" cy="85" r="32" fill="black" />
          </mask>
        </defs>

        {/* Main Speech Bubble */}
        <path
          d="M20 40 C20 20, 35 15, 65 15 C95 15, 110 20, 110 40 V65 C110 85, 95 90, 65 90 H50 L25 105 V85 C22 83, 20 80, 20 75 Z"
          stroke="url(#bubble-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          mask="url(#cutout)"
          fill="none"
        />

        {/* Dots inside the bubble */}
        <circle className="mimic-dot-1" cx="45" cy="55" r="6" fill="#8746D6" />
        <circle className="mimic-dot-2" cx="65" cy="55" r="6" fill="#C25AAB" />
        <circle className="mimic-dot-3" cx="85" cy="55" r="6" fill="#EA8B87" />

        {/* WhatsApp Icon */}
        <g className="mimic-wa-icon" transform="translate(74, 59) scale(0.95)">
          <path d="M22.5 45 C10.0736 45 0 34.9264 0 22.5 C0 18.2325 1.1895 14.2435 3.2384 10.8228 L1.5 2.5 L10.0243 4.2349 C13.3101 2.4578 17.1594 1.5 21.2857 1.5 C33.7121 1.5 43.7857 11.5736 43.7857 24 C43.7857 36.4264 33.7121 46.5 21.2857 46.5 C19.648 46.5 18.0494 46.3315 16.5 46.0152 L22.5 45 Z" fill="#25D366" />
          <path d="M12.9366 12.1866C12.4431 11.9566 11.2311 11.3656 10.993 11.2838C10.7634 11.1994 10.5982 11.1585 10.433 11.4067C10.2678 11.6548 9.78912 12.2155 9.64506 12.3807C9.49753 12.5459 9.3524 12.5585 9.10476 12.4344C8.85711 12.3103 8.05315 12.0526 7.10091 11.205C6.3592 10.5458 5.86178 9.73177 5.71424 9.48364C5.5667 9.23552 5.69853 9.10222 5.82223 8.97825C5.93339 8.86659 6.07106 8.69248 6.195 8.54435C6.31894 8.39623 6.35874 8.2952 6.44458 8.1322C6.52702 7.96277 6.48554 7.8202 6.42354 7.69614C6.36154 7.57208 5.86178 6.34759 5.65345 5.86018C5.45262 5.37459 5.24479 5.43632 5.0934 5.43632C4.94982 5.43632 4.78463 5.43632 4.61944 5.43632C4.45424 5.43632 4.18683 5.49832 3.95576 5.73373C3.72814 5.96914 3.08775 6.58156 3.08775 7.79585C3.08775 9.01014 3.97851 10.1913 4.10245 10.3644C4.22639 10.5375 5.85703 13.0425 8.35338 14.1192C8.94824 14.3744 9.41249 14.524 9.77353 14.6483C10.3664 14.8471 10.9082 14.8211 11.3364 14.7594C11.8152 14.6834 12.8058 14.1565 13.0135 13.5684C13.2255 12.9802 13.2255 12.485 13.1635 12.3733C13.1015 12.2616 12.9366 12.1996 12.689 12.0755L12.9366 12.1866Z" transform="translate(14, 14) scale(0.66)" fill="white" />
        </g>
      </svg>

      {!iconOnly && (
        <div style={{ textAlign: isHorizontal ? 'left' : 'center', marginTop: isHorizontal ? '0' : '10px' }}>
          <h1 style={{
            fontSize: isHorizontal ? '22px' : '56px',
            margin: 0,
            fontWeight: '700',
            letterSpacing: '-1.5px',
            lineHeight: '1.1',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ color: 'white' }}>Mimic </span>
            <span className="mimic-text-ai" style={{
              background: 'url(#text-grad)',
              backgroundImage: 'linear-gradient(135deg, #7B3FE4, #D9659E, #F9A47B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              marginLeft: isHorizontal ? '4px' : '12px'
            }}>AI</span>
          </h1>
          {!isHorizontal && (
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#B3B5C4', letterSpacing: '4px', fontWeight: '600' }}>
              AI CHATBOT FOR WHATSAPP
            </p>
          )}
        </div>
      )}
    </div>
  );
}
