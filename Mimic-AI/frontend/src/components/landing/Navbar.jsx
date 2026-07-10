import { useState, useEffect } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = ['How it works', 'Features', 'Privacy']
  return <header className={`nav-wrap ${scrolled ? 'scrolled' : ''}`}>
    <nav className="nav container">
      <a className="brand" href="#top"><span className="brand-mark"><Sparkles size={15} /></span>Mimic</a>
      <div className="nav-links">{links.map(link => <a href={`#${link.toLowerCase().replaceAll(' ', '-')}`} key={link}>{link}</a>)}</div>
      <a href="/login" className="nav-cta">Create your clone <span>↗</span></a>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    </nav>
    {open && <div className="mobile-menu">{links.map(link => <a onClick={() => setOpen(false)} href={`#${link.toLowerCase().replaceAll(' ', '-')}`} key={link}>{link}</a>)}<a href="/login">Create your clone</a></div>}
  </header>
}
