import { defineConfig } from 'vite';

export default async () => {
  const reactPlugin = (await import('@vitejs/plugin-react')).default;

  return defineConfig({
    plugins: [ reactPlugin() ],
    server: {
      port: 5173
    }
  });
};
