import { AppProps } from 'next/app';
import { ScopeProvider } from '@/context/ScopeContext';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ScopeProvider>
      <Component {...pageProps} />
    </ScopeProvider>
  );
}

export default MyApp;