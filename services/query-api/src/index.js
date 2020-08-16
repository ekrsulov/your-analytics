const { Magic } = require("@magic-sdk/admin");
const cors = require("cors");
const express = require("express");
const { users, websites } = require("./faunadb");

const {
  fetchBrowser,
  fetchOs,
  fetchScreen,
  fetchTopPages,
  fetchTopReferrers,
  fetchTotalPageviews,
  fetchUniqueVisitors,
  fetchVisitors,
  fetchWorldMap,
} = require("./clickhouse");

const magic = new Magic(process.env.MAGIC_SECRET_KEY);

const app = express();
process.env.NODE_ENV !== "production" &&
  app.use(
    cors({
      origin: [
        /mikenikles\.vercel\.app$/,
        /your-analytics\.vercel\.app$/,
        /your-analytics\.org$/,
        process.env.FRONTEND_HOST,
      ],
    })
  );
const port = process.env.PORT || 8081;

const isAuthenticated = async (req, res, next) => {
  const token = magic.utils.parseAuthorizationHeader(req.headers.authorization);
  try {
    magic.token.validate(token);
    req.user = await magic.users.getMetadataByToken(token);
    next();
  } catch (error) {
    res.status(401).end();
  }
};

const createStatsEndpoint = (path, fetcher) => {
  app.get(`/:domain/${path}`, isAuthenticated, async (req, res) => {
    try {
      // TODO
      // - Load database query parameters based on who called this endpoint
      const domain = req.params.domain;

      const user = await users.find(req.user.issuer);
      if (!user.data.sites[domain]) {
        console.error(
          new Error(
            `User ${req.user.issuer} tried to access domain ${domain} but is not authorized.`
          )
        );
        res.status(401).end();
        return;
      }

      const dateRange = {
        from: req.query.from ? Math.floor(req.query.from / 1000) : null,
        to: req.query.to ? Math.floor(req.query.to / 1000) : null,
      };
      const { data: websiteSettings } = await websites.getSettings(
        user.data.sites[domain].serverKeySecret
      )();
      const data = await fetcher(dateRange, domain, websiteSettings.timezone);
      res.json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).end();
    }
  });
};

createStatsEndpoint("browser", fetchBrowser);
createStatsEndpoint("os", fetchOs);
createStatsEndpoint("screen", fetchScreen);
createStatsEndpoint("top-pages", fetchTopPages);
createStatsEndpoint("top-referrers", fetchTopReferrers);
createStatsEndpoint("total-pageviews", fetchTotalPageviews);
createStatsEndpoint("unique-visitors", fetchUniqueVisitors);
createStatsEndpoint("visitors", fetchVisitors);
createStatsEndpoint("world-map", fetchWorldMap);

app.listen(port, () => {
  console.log(`query-api started at http://localhost:${port}`);
});
