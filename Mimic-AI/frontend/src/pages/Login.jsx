import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Mail, Sparkles } from 'lucide-react'
import './Login.css'
import './LoginHeader.css'
import Logo from '../components/Logo'

const GoogleMark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.2c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.7 2.9-4.2 2.9-7.29Z" /><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.37l-3.15-2.52c-.87.59-1.99.94-3.3.94-2.54 0-4.7-1.71-5.47-4.01H3.29v2.6A9.74 9.74 0 0 0 12 21.7Z" /><path fill="#FBBC05" d="M6.53 13.74A5.84 5.84 0 0 1 6.22 12c0-.6.1-1.17.31-1.74v-2.6H3.29A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04.99 4.34l3.24-2.6Z" /><path fill="#EA4335" d="M12 6.25c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.31 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.71 5.36l3.24 2.6c.77-2.3 2.93-4.01 5.47-4.01Z" /></svg>
const GitHubMark = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.04 1.54 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.53 9.53 0 0 1 12 6.8a9.5 9.5 0 0 1 2.5.34c1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.35 4.68-4.57 4.93.36.31.68.9.68 1.81v2.83c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>

export default function Login() {
  const [message, setMessage] = useState('')
  const submit = (event, provider) => { event.preventDefault(); setMessage(`${provider} sign-in is ready to connect to your authentication service.`) }
  return <main className="login-page">
    <div className="login-grid" /><div className="login-orb one" /><div className="login-orb two" />
    <header className="login-header-wrap"><div className="login-header-inner"><a className="brand" href="/" style={{ textDecoration: 'none' }}><Logo variant="horizontal" /></a><a className="back-home" href="/"><ArrowLeft size={15} /> Back to home</a></div></header>
    <section className="login-shell">
      <aside className="login-aside"><div><span className="aside-kicker">YOUR VOICE, AMPLIFIED</span><h1>Pick up where<br />you <i>left off.</i></h1><p>A little more presence for every conversation that matters.</p></div><div className="login-quote"><div className="quote-stars">✦ ✦ ✦</div><p>“It doesn’t just save me time. It makes me feel like I’m actually keeping up with my people.”</p><span>— Maya, early creator</span></div></aside>
      <div className="login-card"><div className="login-card-top"><span style={{ display: 'inline-block', marginBottom: '15px' }}><Logo iconOnly width="60px" /></span><p className="eyebrow">WELCOME TO MIMIC</p><h2>Start with <i>you.</i></h2><p>Sign in to create a voice that’s unmistakably yours.</p></div>
        <div className="provider-buttons"><button onClick={(e) => submit(e, 'Google')}><GoogleMark />Continue with Google</button><button onClick={(e) => submit(e, 'GitHub')}><GitHubMark />Continue with GitHub</button></div>
        <div className="divider"><span>or continue with email</span></div>
        <form onSubmit={(e) => submit(e, 'Email')}><label htmlFor="email">Email address</label><div className="email-field"><Mail size={17} /><input id="email" type="email" placeholder="you@example.com" required /></div><button className="login-submit" type="submit">Continue with email <ArrowRight size={17} /></button></form>
        {message && <p className="login-message"><Check size={14} />{message}</p>}<p className="terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </div>
    </section>
  </main>
}
