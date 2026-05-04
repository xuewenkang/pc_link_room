import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import forge from 'node-forge'

// 生成自签名证书
function generateSelfSignedCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    {
      name: 'commonName',
      value: 'localhost'
    },
    {
      name: 'countryName',
      value: 'CN'
    },
    {
      name: 'stateOrProvinceName',
      value: 'Beijing'
    },
    {
      name: 'localityName',
      value: 'Beijing'
    },
    {
      name: 'organizationName',
      value: 'Link Room'
    }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert)
  };
}

const { key, cert } = generateSelfSignedCert();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    open: true,
    strictPort: true,
    cors: true,
    https: {
      key,
      cert
    }
  }
})
