require("dotenv").config();

const app = require("./app");
const { ensureBucket, isConfigured } = require("./services/objectStorage");

const port = Number(process.env.PORT || 3000);

async function start() {
    if(isConfigured()){
        await ensureBucket();
        console.log("Bucker MinIO verifié.");
    }else{
        console.error("ConfigurationMinIO manquante.");
    }

    app.listen(port, () => {
        console.log(`server running on port ${port}`);
    });
}

start().catch((error) => {
    console.error("Impossible de demarrer le serveur :", error);
    process.exit(1);
});
