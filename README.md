# MitbPos — POS System

Sistema de punto de venta para Mueblería ITB.

## Desarrollo

```bash
# Servidor local (http://localhost:4200)
npm start

# Servidor accesible desde otros dispositivos en la red
npm run dev

# Servidor con HTTPS (para probar escáner de códigos en mobile)
npm run dev-ssl
# → genera automáticamente un certificado SSL con tu IP actual
# → accedé desde el celular con https://192.168.x.x:4200

# Solo regenerar el certificado SSL (si cambiás de red y la IP cambió)
npm run ssl-cert
```

### HTTPS en mobile (escáner de códigos de barras)

La cámara requiere HTTPS. `npm run dev-ssl` genera un certificado autofirmado para tu IP actual.

En el celular vas a ver una advertencia de seguridad porque el certificado es autofirmado:

- **Firefox mobile**: Avanzado → Aceptar riesgo
- **Chrome mobile**: tecleá `thisisunsafe` en la pantalla de advertencia (no hay campo visible, solo escribí)

Para evitar estas advertencias, instalá [mkcert](https://github.com/FiloSottile/mkcert) y reemplazá los certs generados:

```bash
mkcert -install
# Anotá la ruta del CA: mkcert -CAROOT
mkcert 192.168.x.x localhost 127.0.0.1
# copiá cert.pem → ssl-dev.crt, key.pem → ssl-dev.key
# en el celular instalá el rootCA.pem como CA confiable
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor local |
| `npm run dev` | Servidor en `0.0.0.0` |
| `npm run dev-ssl` | HTTPS con cert dinámico |
| `npm run ssl-cert` | Regenerar cert SSL |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios |

## Stack

- Angular 21
- Angular Material
- Quagga2 (lectura de códigos de barras 1D)
