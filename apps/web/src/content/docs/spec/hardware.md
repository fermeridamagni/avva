---
title: Configuración de Hardware
description: Guía de configuración para Raspberry Pi 5 y Pantalla DSI
---

Esta guía documenta una configuración práctica para Raspberry Pi 5 con Raspberry Pi OS y una pantalla DSI, incluyendo los ajustes necesarios en `config.txt`.

## Patrón de conexión SSH

Usa este formato para conectarte:

```bash
ssh user@host.local
```

## Instalar Raspberry Pi OS

1. Graba Raspberry Pi OS con Raspberry Pi Imager.
2. Completa la configuración del primer inicio (usuario, región, red).
3. Actualiza los paquetes:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

## Ajustes DSI requeridos (`/boot/firmware/config.txt`)

Para Raspberry Pi 5 con KMS y pantalla oficial DSI de 7" en DSI0, asegúrate de que estas líneas estén presentes:

```ini
dtoverlay=vc4-kms-v3d
max_framebuffers=2
display_auto_detect=0
dtoverlay=vc4-kms-dsi-7inch,dsi0
```

Opciones recomendadas:

```ini
disable_overscan=1
arm_64bit=1
```

Si tu panel no es la pantalla oficial DSI de 7", usa el overlay correcto para tu hardware desde la documentación de overlays de Raspberry Pi.

## Ajustes de Cámara requeridos (`/boot/firmware/config.txt`)

Para una cámara (como la Arducam IMX415) conectada al puerto MIPI secundario (CAM1), debes deshabilitar la autodetección y especificar el overlay correcto:

```ini
camera_auto_detect=0
dtoverlay=imx415,cam1
```

## Ejemplo completo del bloque `config.txt`

```ini
# Interfaces principales (opcional; mantener si tu proyecto lo necesita)
dtparam=i2c_arm=on
dtparam=spi=on
dtparam=audio=on

# Gráficos + DSI
display_auto_detect=0
dtoverlay=vc4-kms-v3d
max_framebuffers=2
disable_fw_kms_setup=1
disable_overscan=1

[all]
dtparam=uart0=on
dtoverlay=vc4-kms-dsi-7inch,dsi0

# Cámara
camera_auto_detect=0
dtoverlay=imx415,cam1
```

## Ejecución de scripts de OpenCV y MediaPipe

Debido a que el Front End de la Cámara de la Raspberry Pi emite datos crudos Bayer en las versiones más nuevas del SO (como Bookworm y Trixie), las llamadas estándar V4L2 en OpenCV fallarán o devolverán frames vacíos. Debes ejecutar los scripts de Python que utilizan `cv2.VideoCapture` mediante el wrapper `libcamerify`.

```bash
cd apps/sign-detector
libcamerify uv run src/main.py
```

*Nota: Si ejecutas esto mediante SSH, el script de Python mapeará automáticamente la ventana de video a la pantalla DSI física de la Raspberry Pi (`DISPLAY=:0`).*

## Validar configuración de pantalla y cámara

Después de reiniciar, verifica que los módulos KMS/DSI estén activos:

```bash
lsmod | grep -E "vc4|drm"
```

Deberías ver módulos como `vc4`, `drm_rp1_dsi` y `drm_kms_helper`.

## Documentación oficial de Raspberry Pi

- Raspberry Pi Imager (instalar el SO): https://www.raspberrypi.com/software/
- Documentación de Raspberry Pi OS: https://www.raspberrypi.com/documentation/computers/os.html
- Referencia de `config.txt`: https://www.raspberrypi.com/documentation/computers/config_txt.html
- Configuración de video/pantalla: https://www.raspberrypi.com/documentation/computers/configuration.html#video-options
- Documentación de la pantalla oficial: https://www.raspberrypi.com/documentation/accessories/display.html
