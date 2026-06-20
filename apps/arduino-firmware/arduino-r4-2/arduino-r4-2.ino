#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>

// WiFi credentials
const char* ssid = "Fer's iPhone";
const char* password = "fer_hotspot1";

// MQTT Broker settings
const char* mqtt_server = "172.20.10.3"; // e.g. 192.168.1.100
const int mqtt_port = 1883;
const char* mqtt_topic = "avva/arduino/arduino-r4-2/command";

WiFiClient espClient;
PubSubClient client(espClient);

// Initialize the library with the numbers of the interface pins
// RS=12, EN=11, D4=5, D5=4, D6=3, D7=2
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

// State Tracking
bool tvState = false;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  // Convert payload to string
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  const char* command = doc["command"];
  
  if (strcmp(command, "TOGGLE_TV") == 0) {
    tvState = !tvState;
    if (tvState) {
      // Turn TV ON
      lcd.display();
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("   AVVA TV   ");
      lcd.setCursor(0, 1);
      lcd.print("   [ TV ON ]   ");
      Serial.println("TV ON");
    } else {
      // Turn TV OFF
      lcd.clear();
      lcd.noDisplay();
      Serial.println("TV OFF");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("Arduino_R4_2_Client")) {
      Serial.println("connected");
      // Subscribe to the topic
      client.subscribe(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // set up the LCD's number of columns and rows:
  lcd.begin(16, 2);
  
  // Start with TV OFF
  lcd.clear();
  lcd.noDisplay();

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
