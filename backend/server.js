require("dotenv").config();

const express = require("express");
const db = require("./config/db");
const cors = require("cors");

const authRoutes =
    require("./routes/auth");

const donorRoutes =
    require("./routes/donors");

const collectorRoutes =
    require("./routes/collectors");

const requestRoutes =
    require("./routes/requests");

const adminRoutes =
    require("./routes/admin");


const app = express();


app.use(
    cors({
        origin: "http://localhost:5173"
    })
);


app.use(express.json());


app.get("/", (req, res) => {

    res.json({
        message:
            "BloodConnect Backend is running"
    });
});


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/donors",
    donorRoutes
);


app.use(
    "/api/collectors",
    collectorRoutes
);


app.use(
    "/api/requests",
    requestRoutes
);


app.use(
    "/api/admin",
    adminRoutes
);

const bloodBankRoutes =
    require("./routes/bloodbanks");

app.use(
    "/api/bloodbanks",
    bloodBankRoutes
);

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);