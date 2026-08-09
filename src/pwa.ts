import { registerSW } from 'virtual:pwa-register'

/**
 * Atualiza o app sozinho quando houver nova versão no servidor.
 * - Verifica na abertura
 * - Verifica ao voltar para a aba
 * - Verifica a cada 30 minutos com o app aberto
 */
export function setupAutoUpdate() {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      const check = () => {
        void registration.update()
      }

      window.setInterval(check, 30 * 60 * 1000)

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })

      window.addEventListener('online', check)
    },
    onOfflineReady() {
      // App pronto para uso offline após o primeiro carregamento
    },
  })

  return updateSW
}
