import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const logging = process.env.NODE_ENV === "development" ? console.log : false;

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: logging,
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(process.env.DB_SSL_CA)
      }
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected and synced successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

export default sequelize;
