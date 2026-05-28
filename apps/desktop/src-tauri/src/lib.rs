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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![check_connectivity])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
