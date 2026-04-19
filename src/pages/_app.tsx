import '@/index.css'
import type { AppProps } from 'next/app'
import CustomCursor from '@/components/CustomCursor'
import { ClerkProvider } from '@clerk/nextjs'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <CustomCursor />
      <Component {...pageProps} />
    </ClerkProvider>
  )
}

export default MyApp
