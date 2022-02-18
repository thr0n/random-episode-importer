export const artistTableParams = {
  TableName: "Artist",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};

export const episodeTableParams = {
  TableName: "Episode",
  KeySchema: [
    {
      AttributeName: "id",
      KeyType: "HASH",
    },
  ],
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};
