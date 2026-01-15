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
              {/* Logo EAS - usando a imagem fornecida */}
              <img 
                src="/images/eas-logo.png" 
                alt="EAS Technology Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold fintech-text-primary">
                EAS Technology
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

