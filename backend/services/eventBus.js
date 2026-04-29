const { Kafka } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKERS || "")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const topic = process.env.KAFKA_TOPIC || "cinematheque.events";

let producer;
let producerReady = false;

async function getProducer() {
  if (!brokers.length) return null;

  // Le producteur Kafka est créé une seule fois pour éviter de rouvrir
  // une connexion à chaque événement publié par l'API.
  if (!producer) {
    const kafka = new Kafka({
      clientId: "cinematheque-backend",
      brokers,
    });

    producer = kafka.producer();
  }

  if (!producerReady) {
    await producer.connect();
    producerReady = true;
  }

  return producer;
}

async function publishEvent(type, payload = {}) {
  try {
    const kafkaProducer = await getProducer();
    if (!kafkaProducer) return;

    // Publication "best effort" : si Kafka est indisponible, l'action métier
    // principale ne doit pas échouer pour l'utilisateur.
    await kafkaProducer.send({
      topic,
      messages: [
        {
          key: type,
          value: JSON.stringify({
            type,
            payload,
            emittedAt: new Date().toISOString(),
            service: "backend",
          }),
        },
      ],
    });
  } catch (error) {
    console.error("Erreur publication Kafka:", error.message);
  }
}

module.exports = {
  publishEvent,
};
