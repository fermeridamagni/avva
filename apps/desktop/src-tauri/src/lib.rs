// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Checks whether the device has an active internet connection by attempting
/// a TCP connection to a reliable host. On macOS this will reflect the actual
/// WiFi/Ethernet status. Returns `true` if connectivity is confirmed.
#[tauri::command]
async fn check_connectivity() -> bool {
    // Attempt a TCP connection to Google's DNS (8.8.8.8:53).
    // DNS port is lightweight and unlikely to be blocked.
    // Timeout of 3 seconds prevents hanging.
    use std::net::{IpAddr, Ipv4Addr, SocketAddr};
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(8, 8, 8, 8)), 53);

    tokio::time::timeout(
        std::time::Duration::from_secs(3),
        tokio::net::TcpStream::connect(addr),
    )
    .await
    .map(|r| r.is_ok())
    .unwrap_or(false)
}

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::ShellExt;

struct Sidecars(std::sync::Mutex<Vec<tauri_plugin_shell::process::CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
        .invoke_handler(tauri::generate_handler![check_connectivity])
        .setup(|app| {
            let mut children = Vec::new();
            
            println!("Starting gateway-api sidecar...");
            if let Ok(cmd) = app.shell().sidecar("gateway-api") {
                if let Ok((rcv, child)) = cmd.spawn() {
                    println!("gateway-api sidecar started with PID {}", child.pid());
                    children.push(child);
                    // Forward sidecar stdout/stderr to the terminal.
                    tauri::async_runtime::spawn(async move {
                        use tauri_plugin_shell::process::CommandEvent;
                        let mut rcv = rcv;
                        while let Some(event) = rcv.recv().await {
                            match event {
                                CommandEvent::Stdout(line) => {
                                    print!("[gateway-api] {}", String::from_utf8_lossy(&line));
                                }
                                CommandEvent::Stderr(line) => {
                                    eprint!("[gateway-api] {}", String::from_utf8_lossy(&line));
                                }
                                CommandEvent::Terminated(payload) => {
                                    println!("[gateway-api] process terminated: {:?}", payload);
                                    break;
                                }
                                CommandEvent::Error(err) => {
                                    eprintln!("[gateway-api] error: {}", err);
                                    break;
                                }
                                _ => {}
                            }
                        }
                    });
                } else {
                    println!("Failed to spawn gateway-api sidecar.");
                }
            } else {
                println!("Failed to resolve gateway-api sidecar.");
            }
            
            println!("Starting sign-detector sidecar...");
            if let Ok(mut cmd) = app.shell().sidecar("sign-detector") {
                if cfg!(target_arch = "aarch64") && cfg!(target_os = "linux") {
                    cmd = cmd.env("LD_PRELOAD", "/usr/libexec/aarch64-linux-gnu/libcamera/v4l2-compat.so");
                }
                if let Ok((rcv, child)) = cmd.spawn() {
                    println!("sign-detector sidecar started with PID {}", child.pid());
                    children.push(child);
                    // Forward sidecar stdout/stderr to the terminal.
                    tauri::async_runtime::spawn(async move {
                        use tauri_plugin_shell::process::CommandEvent;
                        let mut rcv = rcv;
                        while let Some(event) = rcv.recv().await {
                            match event {
                                CommandEvent::Stdout(line) => {
                                    print!("[sign-detector] {}", String::from_utf8_lossy(&line));
                                }
                                CommandEvent::Stderr(line) => {
                                    eprint!("[sign-detector] {}", String::from_utf8_lossy(&line));
                                }
                                CommandEvent::Terminated(payload) => {
                                    println!("[sign-detector] process terminated: {:?}", payload);
                                    break;
                                }
                                CommandEvent::Error(err) => {
                                    eprintln!("[sign-detector] error: {}", err);
                                    break;
                                }
                                _ => {}
                            }
                        }
                    });
                } else {
                    println!("Failed to spawn sign-detector sidecar.");
                }
            } else {
                println!("Failed to resolve sign-detector sidecar.");
            }

            app.manage(Sidecars(std::sync::Mutex::new(children)));

            Ok(())
        });

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            println!("Application exiting. Killing sidecars...");
            if let Some(state) = app_handle.try_state::<Sidecars>() {
                let mut children = state.0.lock().unwrap();
                for child in children.drain(..) {
                    let pid = child.pid();
                    println!("Killing sidecar with PID {}", pid);
                    if let Err(e) = child.kill() {
                        println!("Failed to kill sidecar with PID {}: {}", pid, e);
                    } else {
                        println!("Successfully killed sidecar with PID {}", pid);
                    }
                }
            }
        }
    });
}
