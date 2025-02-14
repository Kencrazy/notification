  import { initializeApp, applicationDefault } from 'firebase-admin/app';
  import { getMessaging } from "firebase-admin/messaging";
  import express from "express";
  import cors from "cors";
  import { SMTPClient } from "emailjs";
  import bodyParser from "body-parser";

  process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const app = express();
  app.use(express.json());
  app.use(bodyParser.json)

  app.use(cors({
    origin: "*",
    methods: ["POST"],
  }));

  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
  });

  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  const client = new SMTPClient({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: "smtp.gmail.com",
    ssl: true,
  });

  app.post("/api/push-notify", function (req, res) {
    const receivedToken = req.body.fcmToken;
    // const receivedToken = ["c7VmA-MD7bC29EhL3ZzsWM:APA91bF75gmX7fAmsOMSG6n-bvGaIjpeWaAtw_GnlNL8Zi-BU9GTxWmrgGFTBerL0egAcsdGOb36Kr9a7EaBjchhqSy7wtc0p6pFrQ8PxPvduetGn-3BgNo"]
    
    const message = {
      notification: {
        title: "Notif",
        body: 'This is a Test Notification'
      },
      tokens: receivedToken,  // Use a single token here
    };

    getMessaging()
      .sendEachForMulticast(message)  // Use send instead of sendEachForMulticast
      .then((response) => {
        res.status(200).json({
          message: "Successfully sent message",
          token: receivedToken,
        });
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        res.status(400).json({ error: error.message });
        console.log("Error sending message:", error);
      });
  });

  app.post("/api/email-notify", function (req, res) {
    const data = req.body;
  
    if (!data.text || !data.from || !data.to || !data.subject) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  
    client.send(
      {
        text: data.text,
        from: data.from,
        to: data.to,
        subject: data.subject,
      },
      (error, message) => {
        console.log(error || message);
        if (error) {
          res.status(400).json({ error: error.message });
          console.log("Error sending email message:", error);
        } else {
          res.status(200).json({
            message: "Successfully sent email message",
            info: message,
          });
          console.log("Successfully sent email message:", message);
        }
      }
    );
  });

  app.listen(8080, function () {
    console.log("Server started on http://localhost:8080");
  });