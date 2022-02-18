const dotenv = require("dotenv");
const AWS = require("aws-sdk");
import { ArtistDetails, EpisodeDetails } from "../types/Domain";
import { SpotifyArtist } from "../types/Spotify";

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCES_KEY,
  region: process.env.AWS_REGION,
});

const tableExists = (client, tableName: string) =>
  new Promise<boolean>((resolve, reject) => {
    client.listTables({}, (err, data) => {
      if (err) throw reject(err);
      const exists = data.TableNames.find((name: string) => name === tableName);
      resolve(exists !== undefined);
    });
  });

export const createTableIfNotExists = async (params: any) => {
  const dynamodb = new AWS.DynamoDB();

  if (!(await tableExists(dynamodb, params.TableName))) {
    dynamodb.createTable(params, (err, data) => {
      if (err) {
        console.error("ERROR: " + err);
      } else {
        console.log("Create table");
      }
    });
  } else {
    console.log(`Table ${params.TableName} already exists.`);
  }
};

export const artistExists = async (
  id: string
): Promise<SpotifyArtist | boolean> => {
  const dc = new AWS.DynamoDB.DocumentClient();

  let params = {
    TableName: "Artist",
    Key: {
      id: id,
    },
  };

  return new Promise((resolve) => {
    dc.get(params, (err, data) => {
      if (err) {
        resolve(undefined);
      } else {
        resolve(data.Item);
      }
    });
  });
};

export const persistArtist = async (data: ArtistDetails) => {
  const dc = new AWS.DynamoDB.DocumentClient();

  let params = {
    TableName: "Artist",
    Item: data,
  };

  dc.put(params, (err, data) => {
    if (err) {
      console.error(
        "Unable to add Artist",
        data.name,
        ". Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("PutItem succeeded");
    }
  });
};

export const persistEpisode = async (data: EpisodeDetails) => {
  const dc = new AWS.DynamoDB.DocumentClient();

  let params = {
    TableName: "Episode",
    Item: data,
  };

  dc.put(params, (err, data) => {
    if (err) {
      console.error(
        "Unable to add Episode",
        data.name,
        ". Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("PutItem succeeded");
    }
  });
};

export const persist = (
  table: string,
  data: ArtistDetails | EpisodeDetails
) => {
  const dc = new AWS.DynamoDB.DocumentClient();

  let params = {
    TableName: table,
    Item: data,
  };

  dc.put(params, (err, data) => {
    if (err) {
      console.error(
        `Unable to add ${table}`,
        data.name,
        ". Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("PutItem succeeded");
    }
  });
};
