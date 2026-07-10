import { ArrowUpRight, AtSign, Globe2, Send, Sparkles } from 'lucide-react'
import Logo from '../Logo'
import './Footer.css'

const groups = [
  { title: 'Product', links: [['How it works', '#how-it-works'], ['Features', '#features'], ['Create your clone', '#start']] },
  { title: 'Company', links: [['About us', '#top'], ['Contact', 'mailto:hello@mimic.ai'], ['Privacy', '#privacy']] },
]

export default function Footer() {
  return <footer className="site-footer" id="privacy">
    <div className="container footer-grid">
      <div className="footer-intro">
        <a href="#top" className="brand" style={{ textDecoration: 'none' }}>
          <Logo variant="horizontal" />
        </a>
        <p>Thoughtful replies in the voice that makes you, you.</p>
        <a className="footer-email" href="mailto:hello@mimic.ai">hello@mimic.ai <ArrowUpRight size={14}/></a>
      </div>
      {groups.map(group => <div className="footer-links" key={group.title}>
        <p>{group.title}</p>
        {group.links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
      </div>)}
      <div className="footer-social">
        <p>Follow along</p>
        <div><a aria-label="Community" href="#top"><Globe2 size={17}/></a><a aria-label="Email" href="mailto:hello@mimic.ai"><AtSign size={17}/></a><a aria-label="Updates" href="#top"><Send size={17}/></a></div>
        <small>Early access is open now.<br/>Build your voice profile in minutes.</small>
      </div>
    </div>
    <div className="container footer-bottom"><span>© 2026 Mimic, Inc. All rights reserved.</span><span>Made with intention <b>✦</b></span></div>
  </footer>
}
