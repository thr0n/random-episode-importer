const dateFns = require("date-fns");

export const getReleaseYearFrom = (releaseDate, precision) => {
  const dateFormat = "yyyy-MM-dd";
  if (precision !== "year" && precision !== "day") {
    throw new Error(`Unknown precision: ${precision}! Aborting`);
  }

  if (releaseDate !== undefined) {
    if (precision === "day") {
      const dateArray = releaseDate.split("-");
      return dateFns.format(
        new Date(dateArray[0], dateArray[1], dateArray[2]),
        dateFormat
      );
    } else {
      return dateFns.format(new Date(releaseDate, 1, 1), dateFormat);
    }
  }
};
