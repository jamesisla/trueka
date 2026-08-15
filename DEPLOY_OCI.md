# Guía de Despliegue en Oracle Cloud Infrastructure (OCI)
### Instancia 1 vCPU / 1 GB RAM (Always Free Tier)

Esta guía explica cómo desplegar **Trueka** de forma **100% nativa (sin Docker/contenedores)** para exprimir al máximo el rendimiento y consumir **menos de 15 MB de RAM**.

---

## 1. ¿Por qué es la mejor opción para 1 vCPU y 1 GB RAM?

| Componente | Elección en Trueka | Beneficio en 1 GB RAM |
| :--- | :--- | :--- |
| **Runtime** | **Binario nativo compilado en Go** | Sin daemon de Docker/containerd (ahorra ~150 MB RAM). |
| **Consumo RAM** | **~8 a 15 MB RAM en ejecución** | Quedan libres >900 MB para el sistema operativo y caché de red. |
| **Almacenamiento** | **Persistencia JSON / Disco Nativo** | Sin motor de base de datos pesado (PostgreSQL/MySQL comen ~200MB). |
| **Fotos** | **Directorio `./web/static/uploads/`** | Guardado directo en el SSD con caché HTTP automática. |
| **Gestión** | **Servicio `systemd` nativo** | Auto-reinicio si se cae, control de consumo de memoria y arranque con el SO. |

---

## 2. Pasos para Configurar tu Servidor OCI

### Paso 2.1: Crear la Instancia en Oracle Cloud
1. Entra a tu consola de Oracle Cloud.
2. Crea una instancia Compute con imagen **Ubuntu 22.04 / 24.04** (Shape: `VM.Standard.E2.1.Micro` o `VM.Standard.A1.Flex` de 1 OCPU y 1 GB RAM).
3. En la sección **Virtual Cloud Network (VCN)** -> **Security Lists**, agrega una regla de entrada (Ingress Rule):
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `3005` (y `80, 443` si usarás dominio/SSL).

### Paso 2.2: Conectarte por SSH e Instalar Go y Git
Conéctate a tu servidor:
```bash
ssh -i tu_llave.key ubuntu@IP_PUBLICA_OCI
```

Actualiza el sistema e instala Go:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git golang-go
```

Verifica la versión de Go:
```bash
go version
```

---

## 3. Clonar y Configurar Trueka desde GitHub

```bash
# Clonar tu repositorio
git clone https://github.com/TU_USUARIO/trueka.git /home/ubuntu/trueka
cd /home/ubuntu/trueka

# Dar permisos de ejecución al script de despliegue
chmod +x deploy.sh
```

---

## 4. Configurar el Servicio Nativo `systemd`

Copia el archivo de servicio al sistema:
```bash
sudo cp /home/ubuntu/trueka/trueka.service /etc/systemd/system/trueka.service
sudo systemctl daemon-reload
sudo systemctl enable trueka
sudo systemctl start trueka
```

Para verificar que está corriendo:
```bash
sudo systemctl status trueka
```

### Ajustar Firewall Interno de Ubuntu (UFW / iptables):
Ubuntu en OCI suele tener iptables activo. Abre el puerto 3005:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3005 -j ACCEPT
sudo netfilter-persistent save || sudo ufw allow 3005/tcp
```

¡Listo! Abre en tu navegador `http://IP_PUBLICA_OCI:3005`.

---

## 5. Actualizaciones Futuras con 1 Solo Comando

Cada vez que hagas `git push` a tu repositorio en GitHub, para actualizar tu servidor solo entra y ejecuta:

```bash
cd /home/ubuntu/trueka && ./deploy.sh
```

El script:
1. Hace `git pull` de la última versión.
2. Compila el binario en Go (`trueka`).
3. Reinicia el servicio `systemd` de forma transparente (< 0.1s de downtime).

---

## 6. (Opcional) Dominio y HTTPS Automático con Caddy (Consumo < 10MB RAM)

Si deseas apuntar tu dominio (ej. `trueka.com`) con HTTPS automático:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y
```

Edita `/etc/caddy/Caddyfile`:
```caddy
tudominio.com {
    reverse_proxy 127.0.0.1:3005
}
```

Reinicia Caddy:
```bash
sudo systemctl restart caddy
```
Caddy emitirá certificados SSL de Let's Encrypt de forma automática y renovable.
