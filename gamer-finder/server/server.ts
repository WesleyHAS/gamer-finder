import express, { Application, Request, Response } from "express";
import { ApolloServer } from "@apollo/server-express";
import { express as expressMiddleware } from "@apollo/server-express";
import path from "path";
import multer, { StorageEngine } from "multer";
import cors from "cors";

import { typeDefs, resolvers } from "./schemas";
import db from "./config/connection";
import {} from "./utils/auth";

const PORT: number | string = process.env.PORT || 3001;
const app: Application = express();
const server: ApolloServer = new ApolloServer({ typeDefs, resolvers });

// Setting up multer uploads
//=============================================================
const storage: StorageEngine = multer.diskStorage({
  destination: "../client/public/images/file-uploads", // Setting upload file path
  filename: (req, file, cb) => {
    const fileSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = file.fieldname + "-" + fileSuffix;
    file.originalname = fileName;
    cb(null, fileName);
  },
});

const uploadFolder = multer({ storage: storage });
//=============================================================

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (): Promise<void> => {
  await server.start();

  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Serve up static assets
  app.use(
    "/images",
    express.static(path.join(__dirname, "../client/public/images"))
  );

  app.post(
    "/file-upload",
    uploadFolder.single("file"),
    async (req: Request, res: Response) => {
      console.log("file upload request received");
      try {
        res.status(200).json(req.file.originalname);
      } catch (error) {
        console.error(error);
        res.status(500).json(error);
      }
    }
  );

  app.use("/graphql", expressMiddleware(server));

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

// Call the async function to start the server
startApolloServer();
