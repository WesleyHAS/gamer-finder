import express, { Application, Request, Response } from "express";
import { ApolloServer } from "@apollo/server-express";
import { express as expressMiddleware } from "@apollo/server-express";
import path from "path";
import cors from "cors";

import { typeDefs, resolvers } from "./schemas";
import db from "./config/connection";
import {} from "./utils/auth";

const PORT: number | string = process.env.PORT || 3001;
const app: Application = express();
const server: ApolloServer = new ApolloServer({ typeDefs, resolvers });

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (): Promise<void> => {
  await server.start();

  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

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
