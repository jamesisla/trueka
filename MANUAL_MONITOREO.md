# 📡 Manual de Monitoreo y Mantenimiento — Trueka en Oracle Cloud (OCI)

Este manual contiene todos los comandos, herramientas y procedimientos para supervisar el rendimiento, estado de salud y tráfico de **Trueka** en tu servidor.

---

## 1. Verificación Rápida de Salud (Health Checks)

### A. Probar desde tu terminal (o remotamente)
```bash
# 1. Verificar respuesta HTTPS pública
curl -I https://trueka.oci.lat/api/health

# 2. Verificar respuesta local del servicio Go (puerto 3005)
curl -I http://127.0.0.1:3005/api/health

# 3. Consultar total de artículos activos en la API
curl -s https://trueka.oci.lat/api/products | grep -o '"total":[0-9]*'
```
*Si todo está bien, recibirás un código `HTTP/2 200` o `HTTP/1.1 200 OK`.*

---

## 2. Monitoreo del Servicio Systemd (Trueka)

El binario de Trueka corre como un demonio gestionado por `systemd`.

### Comandos esenciales:
```bash
# Ver estado del servicio (Activo, Memoria usada, Tiempo de ejecución)
sudo systemctl status trueka

# Ver logs en vivo (tiempo real con seguimiento)
sudo journalctl -u trueka -f

# Ver las últimas 100 líneas de log
sudo journalctl -u trueka -n 100 --no-pager

# Reiniciar el servicio
sudo systemctl restart trueka

# Detener o Iniciar
sudo systemctl stop trueka
sudo systemctl start trueka
```

---

## 3. Monitoreo de NGINX y Tráfico Web

NGINX recibe las peticiones HTTPS y las reenvía a Trueka.

```bash
# 1. Ver peticiones de usuarios entrando en tiempo real (IPs, URLs, Códigos HTTP)
sudo tail -f /var/log/nginx/access.log

# 2. Ver si hay errores en NGINX
sudo tail -f /var/log/nginx/error.log

# 3. Probar la configuración de NGINX antes de recargar
sudo nginx -t

# 4. Recargar NGINX sin desconectar a los usuarios
sudo systemctl reload nginx
```

---

## 4. Monitoreo de Recursos del Servidor (CPU, RAM, Disco)

### A. Monitor Interactivo en Tiempo Real (`htop`)
Instala y ejecuta `htop`:
```bash
sudo apt install -y htop
htop
```
- Muestra el uso de CPU, memoria RAM y los procesos activos.
- Presiona `q` para salir.

### B. Comandos rápidos de estado:
```bash
# Memoria RAM libre y usada
free -h

# Espacio libre en disco
df -h /

# Puertos abiertos y escuchando en el sistema (80, 443, 3005)
sudo ss -tulpn | grep -E ':(80|443|3005)'
```

---

## 5. Panel Gráfico Integrado (Admin CMS)

Trueka incluye su propio panel de administración web:

- **URL:** [https://trueka.oci.lat/admin/](https://trueka.oci.lat/admin/)
- **Métricas visibles:**
  - Total de artículos publicados y disponibles.
  - Ofertas y propuestas de trueke activas.
  - Estado del servidor y logs de actividad.
  - Edición de mensajes fijos en tiempo real.

---

## 6. Monitoreo Automático Externo 24/7 (Gratuito)

Para recibir alertas inmediatas en tu teléfono (WhatsApp, Telegram o Email) si tu servidor se reinicia o pierde conexión:

### Servicio Recomendado: **UptimeRobot** (100% Gratis)
1. Regístrate en [uptimerobot.com](https://uptimerobot.com/).
2. Haz clic en **Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Trueka Producción`
   - **URL (or IP):** `https://trueka.oci.lat/api/health`
   - **Monitoring Interval:** `5 minutes`
3. Configura las alertas a tu correo o Telegram.

---

## 7. Plan de Acción ante Incidentes

| Síntoma | Causa Probable | Comando de Solución |
| :--- | :--- | :--- |
| **Error 502 Bad Gateway** | El binario Go de Trueka se detuvo. | `sudo systemctl restart trueka` |
| **Página no carga (Timeout)** | Regla de firewall o iptables bloqueando el puerto 443. | `sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT && sudo netfilter-persistent save` |
| **Error SSL / Certificado vencido** | Let's Encrypt requiere renovación. | `sudo certbot renew --dry-run` |
| **Disco lleno por logs** | Limpieza de logs antiguos de systemd. | `sudo journalctl --vacuum-time=7d` |
