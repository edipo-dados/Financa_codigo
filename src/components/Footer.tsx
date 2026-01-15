'use client'

import { APP_CONFIG } from '@/lib/config'

export default function Footer() {
  return (
    <footer className="mt-auto border-t fintech-border bg-white/50 dark:bg-fintech-dark-surface/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Logo EAS - Opção 2 Minimalista Elegante */}
              <svg width="48" height="48" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#38bdf8', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                
                <circle cx="40" cy="40" r="35" fill="none" stroke="url(#logoGradFooter)" strokeWidth="2" opacity="0.4"/>
                <circle cx="40" cy="40" r="30" fill="url(#logoGradFooter)" opacity="0.12"/>
                
                <g fill="url(#logoGradFooter)" fontFamily="Arial, sans-serif" fontWeight="700">
                  <text x="22" y="50" fontSize="28">E</text>
                  <text x="37" y="50" fontSize="28">A</text>
                  <text x="52" y="50" fontSize="28">S</text>
                </g>
                
                <line x1="20" y1="55" x2="60" y2="55" stroke="url(#logoGradFooter)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold fintech-text-primary">
                Controle Financeiro
              </h3>
              <p className="text-xs fintech-text-muted">
                Versão {APP_CONFIG.version}
              </p>
            </div>
          </div>

          {/* Informações de Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm fintech-text-secondary font-medium">
              {APP_CONFIG.copyright}
            </p>
            <p className="text-xs fintech-text-muted mt-1">
              Propriedade Intelectual protegida por lei.
            </p>
          </div>
        </div>

        {/* Linha decorativa */}
        <div className="mt-4 pt-4 border-t fintech-border">
          <p className="text-xs fintech-text-muted text-center">
            Desenvolvido com 💙 para gestão financeira inteligente
          </p>
        </div>
      </div>
    </footer>
  )
}

