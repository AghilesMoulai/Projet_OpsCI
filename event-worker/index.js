const { Kafka } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092")
  .split(",")
  .map((broker) => broker.trim());

const topic = process.env.KAFKA_TOPIC || "cinematheque.events";

const kafka = new Kafka({
  clientId: "cinematheque-event-worker",
  brokers,
});

const consumer = kafka.consumer({
  groupId: "cinematheque-event-worker",
});

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  console.log(`Worker Kafka en ecoute sur ${topic}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString();

      try {
        const event = JSON.parse(value);
        console.log("[EVENT]", event.type, event);
      } catch {
        console.log("[EVENT RAW]", value);
      }
    },
  });
}

start().catch((error) => {
  console.error("Erreur worker Kafka:", error);
  process.exit(1);
});
