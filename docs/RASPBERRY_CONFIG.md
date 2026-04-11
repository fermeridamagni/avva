# Raspberry Pi 5 + DSI Display Setup Guide

This guide documents a practical Raspberry Pi 5 setup for Raspberry Pi OS with a DSI display, including the required `config.txt` settings.

## SSH pattern

Use this format to connect:

```bash
ssh user@host.local
```

## Install Raspberry Pi OS

1. Flash Raspberry Pi OS with Raspberry Pi Imager.
2. Complete first boot setup (user, locale, network).
3. Update packages:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

## Required DSI settings (`/boot/firmware/config.txt`)

For Raspberry Pi 5 with KMS and official 7" DSI display on DSI0, ensure these lines are present:

```ini
dtoverlay=vc4-kms-v3d
max_framebuffers=2
display_auto_detect=0
dtoverlay=vc4-kms-dsi-7inch,dsi0
```

Recommended related options:

```ini
disable_overscan=1
arm_64bit=1
```

If your panel is not the official 7" DSI display, use the correct overlay for your hardware from the Raspberry Pi overlay documentation.

## Example complete `config.txt` block

```ini
# Core interfaces (optional; keep if needed by your project)
dtparam=i2c_arm=on
dtparam=spi=on
dtparam=audio=on

# Graphics + DSI
display_auto_detect=0
dtoverlay=vc4-kms-v3d
max_framebuffers=2
disable_fw_kms_setup=1
disable_overscan=1

[all]
dtparam=uart0=on
dtoverlay=vc4-kms-dsi-7inch,dsi0
```

## Validate display stack

After reboot, verify KMS/DSI modules are active:

```bash
lsmod | grep -E "vc4|drm"
```

You should see modules such as `vc4`, `drm_rp1_dsi`, and `drm_kms_helper`.

## Official Raspberry Pi documentation

- Raspberry Pi Imager (install OS): https://www.raspberrypi.com/software/
- Raspberry Pi OS docs: https://www.raspberrypi.com/documentation/computers/os.html
- `config.txt` reference: https://www.raspberrypi.com/documentation/computers/config_txt.html
- Video/display configuration: https://www.raspberrypi.com/documentation/computers/configuration.html#video-options
- Official display docs: https://www.raspberrypi.com/documentation/accessories/display.html
