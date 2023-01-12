// TODO This is super weird - since the entities are defined in another project they have their own globals.
//      We cannot use our connection here, but must use the external typeorm installation
import { Connection, createConnection, FileLogger } from "@dbTools/typeorm";
import CONFIG from "@/config";
import { entities } from "@entity/index";

const connection = async (): Promise<Connection | null> => {
  try {
    return createConnection({
      name: "default",
      type: "mysql",
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      username: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE,
      entities,
      synchronize: false,
      logging: true,
      logger: new FileLogger("all", {
        logPath: CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
      }),
      extra: {
        charset: "utf8mb4_unicode_ci",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return null;
  }
};

export default connection;
