#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Servo.h>

// WiFi credentials
const char* ssid = "Fer's iPhone";
const char* password = "fer_hotspot1";

// MQTT Broker settings
const char* mqtt_server = "172.20.10.3"; // e.g. 192.168.1.100
const int mqtt_port = 1883;
const char* mqtt_topic = "avva/arduino/arduino-r4-1/command";

WiFiClient espClient;
PubSubClient client(espClient);

// Pin Definitions
const int FAN_1_PIN = 2;
const int FAN_2_PIN = 3;
const int LAMP_PIN = 4;
const int SERVO_PIN = 9;

Servo myServo;

// State Tracking
bool fan1State = false;
bool fan2State = false;
bool lampState = false;
bool servoOpen = false;

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
  
  if (strcmp(command, "TOGGLE_FAN_1") == 0) {
    fan1State = !fan1State;
    digitalWrite(FAN_1_PIN, fan1State ? HIGH : LOW);
    Serial.println(fan1State ? "Fan 1 ON" : "Fan 1 OFF");
  } 
  else if (strcmp(command, "TOGGLE_FAN_2") == 0) {
    fan2State = !fan2State;
    digitalWrite(FAN_2_PIN, fan2State ? HIGH : LOW);
    Serial.println(fan2State ? "Fan 2 ON" : "Fan 2 OFF");
  }
  // Toleramos el error de tipeo TOOGLE_LIGHT presente en Python y el correcto TOGGLE_LIGHT
  else if (strcmp(command, "TOGGLE_LIGHT") == 0 || strcmp(command, "TOOGLE_LIGHT") == 0) {
    lampState = !lampState;
    digitalWrite(LAMP_PIN, lampState ? HIGH : LOW);
    Serial.println(lampState ? "Lamp ON" : "Lamp OFF");
  }
  else if (strcmp(command, "TOGGLE_SERVO") == 0) {
    servoOpen = !servoOpen;
    myServo.write(servoOpen ? 180 : 0);
    Serial.println(servoOpen ? "Servo OPEN (180)" : "Servo CLOSED (0)");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("Arduino_R4_1_Client")) {
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

  // Setup Pins
  pinMode(FAN_1_PIN, OUTPUT);
  pinMode(FAN_2_PIN, OUTPUT);
  pinMode(LAMP_PIN, OUTPUT);
  
  myServo.attach(SERVO_PIN);

  // Initialize to OFF/CLOSED states
  digitalWrite(FAN_1_PIN, LOW);
  digitalWrite(FAN_2_PIN, LOW);
  digitalWrite(LAMP_PIN, LOW);
  myServo.write(0);

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
