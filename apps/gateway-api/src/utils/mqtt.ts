import mqtt from "mqtt";
import { customLogger } from "./logger";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";

export const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on("connect", () => {
  customLogger("Connected to MQTT broker at", MQTT_BROKER_URL);
});

let mqttErrorLogged = false;

mqttClient.on("error", (error) => {
  if (!mqttErrorLogged) {
    customLogger(
      "MQTT connection error:",
      error.message,
      "(further MQTT errors will be suppressed)"
    );
    mqttErrorLogged = true;
  }
});

export const publishToArduino = (
  deviceId: string,
  command: string,
  payload: unknown
) => {
  const topic = `avva/arduino/${deviceId}/command`;
  const message = JSON.stringify({ command, payload });

  mqttClient.publish(topic, message, (error) => {
    if (error) {
      customLogger(`Failed to publish to ${topic}:`, error.message);
    } else {
      customLogger(`Successfully published to ${topic}:`, message);
    }
  });
};
